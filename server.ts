import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for OTPs
interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpEntry>();

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Send OTP endpoint using Resend
app.post("/api/send-otp", async (req, res) => {
  try {
    const { contact, actionType = "login" } = req.body;
    if (!contact || typeof contact !== "string") {
      return res.status(400).json({ success: false, message: "Contact (email or phone) is required" });
    }

    const trimmedContact = contact.trim().toLowerCase();
    const isEmail = trimmedContact.includes("@");

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const storeKey = `${trimmedContact}_${actionType}`;

    // Store with 10-minute expiry
    otpStore.set(storeKey, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    console.log(`[OTP Server] Generated OTP verification request for ${trimmedContact} (${actionType})`);

    // If it's an email, dispatch via Resend
    if (isEmail) {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn("[OTP Server] RESEND_API_KEY not configured on server.");
        return res.status(503).json({
          success: false,
          message: "Verification service is temporarily unavailable. Please try again later.",
        });
      }

      // Resend requires from address to be 'onboarding@resend.dev' for test keys,
      // or a verified custom domain (public domains like gmail.com cannot be used as sender in Resend)
      let senderEmail = "Yalla Lebanon <onboarding@resend.dev>";
      if (
        process.env.SENDER_EMAIL &&
        !process.env.SENDER_EMAIL.endsWith("@gmail.com") &&
        !process.env.SENDER_EMAIL.endsWith("@yahoo.com") &&
        !process.env.SENDER_EMAIL.endsWith("@hotmail.com") &&
        !process.env.SENDER_EMAIL.endsWith("@outlook.com")
      ) {
        senderEmail = process.env.SENDER_EMAIL;
      }

      const destinationEmail = trimmedContact;

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 28px;">
            <h1 style="color: #171717; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Yalla Lebanon</h1>
            <p style="color: #8F7137; font-size: 13px; font-weight: 600; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Security Verification</p>
          </div>
          <div style="background: #F8F8F6; border: 1px solid #E5E5E5; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #525252; font-size: 14px; margin: 0 0 16px;">
              Your verification code for <strong>${trimmedContact}</strong>:
            </p>
            <div style="display: inline-block; background: #ffffff; border: 2px solid #B89753; border-radius: 10px; padding: 12px 28px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #171717;">
              ${code}
            </div>
            <p style="color: #737373; font-size: 12px; margin: 16px 0 0;">This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; color: #a3a3a3; font-size: 11px;">
            &copy; 2026 Yalla Lebanon. All rights reserved.
          </div>
        </div>
      `;

      const subject = `Your Yalla Lebanon verification code`;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: senderEmail,
          to: destinationEmail,
          subject,
          html: emailHtml,
        }),
      });

      const resendData = (await resendResponse.json()) as any;

      if (!resendResponse.ok) {
        console.warn(`[OTP Server] Resend dispatch failed (HTTP ${resendResponse.status}):`, resendData?.message || "Unknown provider error");
        return res.status(502).json({
          success: false,
          message: "We couldn't send the verification code. Please try again.",
        });
      }

      console.log(`[OTP Server] Resend email successfully dispatched to ${destinationEmail}. Resend ID: ${resendData?.id}`);
      return res.json({
        success: true,
        deliveredVia: "email",
        destination: destinationEmail,
        resendId: resendData?.id,
        cooldownSeconds: 60,
      });
    }

    // Phone / SMS fallback (or other contacts)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.warn("[OTP Server] Twilio credentials not configured.");
      return res.status(503).json({
        success: false,
        message: "SMS verification service is not configured. Please try again later.",
      });
    }

    const messageBody = `Your Yalla Lebanon verification code is ${code}. Valid for 5 minutes.`;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
    const bodyParams = new URLSearchParams();
    bodyParams.append('To', trimmedContact);
    bodyParams.append('From', twilioFrom);
    bodyParams.append('Body', messageBody);

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!twilioRes.ok) {
      console.warn(`[OTP Server] Twilio SMS dispatch failed (HTTP ${twilioRes.status})`);
      return res.status(502).json({
        success: false,
        message: "We couldn't send the verification code. Please try again.",
      });
    }

    return res.json({
      success: true,
      deliveredVia: "sms",
      cooldownSeconds: 60,
    });
  } catch (err: any) {
    console.error("[OTP Server] Unexpected error in /api/send-otp:", err);
    return res.status(500).json({ success: false, message: err?.message || "Internal server error" });
  }
});

// Verify OTP endpoint
app.post("/api/verify-otp", (req, res) => {
  try {
    const { contact, actionType = "login", code } = req.body;
    if (!contact || !code) {
      return res.status(400).json({ success: false, message: "Contact and code are required" });
    }

    const trimmedContact = contact.trim().toLowerCase();
    const trimmedCode = String(code).trim();
    const storeKey = `${trimmedContact}_${actionType}`;

    const record = otpStore.get(storeKey);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new code.",
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(storeKey);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (record.attempts >= 5) {
      otpStore.delete(storeKey);
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    if (record.code !== trimmedCode) {
      record.attempts += 1;
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code. Please check your email and try again.",
      });
    }

    // Successfully verified!
    otpStore.delete(storeKey);
    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (err: any) {
    console.error("[OTP Server] Unexpected error in /api/verify-otp:", err);
    return res.status(500).json({ success: false, message: err?.message || "Internal server error" });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
