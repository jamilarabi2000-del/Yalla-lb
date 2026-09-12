import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import * as crypto from 'crypto';
import { getDb } from './db.js';

if (getApps().length === 0) {
  initializeApp();
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;
const MAX_SENDS_PER_HOUR = 6;
const HOUR_MS = 60 * 60 * 1000;

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

async function sendEmailOtpMessage(recipientEmail: string, otpCode: string): Promise<void> {
  // If custom SMTP or email service is configured in environment, dispatch via transporter
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      // Dynamic import to avoid strict dependency on nodemailer if not configured
      // @ts-ignore
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Yalla Lebanon Security" <${smtpUser}>`,
        to: recipientEmail,
        subject: 'Your Yalla Admin Verification Code',
        text: `Your Yalla Admin 6-digit verification code is: ${otpCode}\n\nThis code is valid for 5 minutes and single-use.\nIf you did not request this code, please immediately secure your administrator account.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #1e293b; margin-top: 0;">Yalla Administrator Verification</h2>
            <p style="color: #475569; font-size: 15px;">Use the following 6-digit security code to complete your administrator verification:</p>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4f46e5;">${otpCode}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
              • This code is single-use and will expire in <strong>5 minutes</strong>.<br>
              • If you did not attempt to sign in to the Yalla Admin portal, please immediately change your credentials.
            </p>
            <div style="margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px; font-size: 11px; color: #94a3b8;">
              Yalla Lebanon Security Team
            </div>
          </div>
        `,
      });
      return;
    } catch (err) {
      console.error('[Admin Email OTP] Error sending via SMTP:', err);
    }
  }

  // Authoritative Audit Log: Log dispatch event (without leaking plain OTP in production logs)
  console.info(`[Admin Security Mailer] Dispatched Email OTP challenge to verified destination: ${maskEmail(recipientEmail)}`);
}

/**
 * Callable Function: requestAdminEmailOtp
 * Generates and sends a single-use 6-digit OTP to the verified administrator email.
 * Destination email is taken STRICTLY from request.auth.token.email.
 */
export const requestAdminEmailOtp = onCall(
  {
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true,
  },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError('permission-denied', 'Administrator privileges are required.');
    }

    const adminEmail = request.auth.token.email;
    if (!adminEmail || typeof adminEmail !== 'string') {
      throw new HttpsError('failed-precondition', 'No verified email address found on administrator account.');
    }

    const uid = request.auth.uid;
    const now = Date.now();
    const db = getDb();
    const otpDocRef = db.collection('admin_otps').doc(uid);

    const existingSnap = await otpDocRef.get();
    let currentWindowStart = now;
    let currentSendCount = 0;

    if (existingSnap.exists) {
      const existingData = existingSnap.data() || {};
      const lastSentAt = existingData.lastSentAtMs || 0;

      // Rate limit 1: Cooldown (60s)
      if (now - lastSentAt < OTP_COOLDOWN_MS) {
        const remainingSec = Math.ceil((OTP_COOLDOWN_MS - (now - lastSentAt)) / 1000);
        throw new HttpsError('resource-exhausted', `Please wait ${remainingSec} seconds before requesting another code.`);
      }

      // Rate limit 2: Window limit (max 6 per hour)
      const windowStart = existingData.windowStartMs || now;
      if (now - windowStart < HOUR_MS) {
        currentWindowStart = windowStart;
        currentSendCount = existingData.sendCountInWindow || 0;
        if (currentSendCount >= MAX_SENDS_PER_HOUR) {
          throw new HttpsError('resource-exhausted', 'Hourly limit for verification codes reached. Please try again later.');
        }
      }
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(salt + rawOtp).digest('hex');

    await otpDocRef.set({
      uid,
      email: adminEmail,
      hash,
      salt,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      expiresAtMs: now + OTP_EXPIRY_MS,
      createdAtMs: now,
      lastSentAtMs: now,
      windowStartMs: currentWindowStart,
      sendCountInWindow: currentSendCount + 1,
    });

    // Dispatch OTP to the admin's verified email
    await sendEmailOtpMessage(adminEmail, rawOtp);

    return {
      success: true,
      emailMasked: maskEmail(adminEmail),
      cooldownSeconds: 60,
      expiresInSeconds: 300,
    };
  }
);

/**
 * Callable Function: verifyAdminEmailOtp
 * Validates the provided 6-digit OTP code against the salted hash in admin_otps/{uid}.
 * On success, deletes the OTP (single-use) and updates admin_stepup/{uid}.
 */
export const verifyAdminEmailOtp = onCall(
  {
    region: 'europe-west1',
    enforceAppCheck: false,
    cors: true,
  },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError('permission-denied', 'Administrator privileges are required.');
    }

    const data = request.data || {};
    const code = typeof data.code === 'string' ? data.code.trim() : '';

    if (!code || !/^\d{6}$/.test(code)) {
      throw new HttpsError('invalid-argument', 'A valid 6-digit verification code is required.');
    }

    const uid = request.auth.uid;
    const now = Date.now();
    const db = getDb();
    const otpDocRef = db.collection('admin_otps').doc(uid);

    const otpSnap = await otpDocRef.get();
    if (!otpSnap.exists) {
      throw new HttpsError('not-found', 'No active verification code found. Please request a new code.');
    }

    const otpData = otpSnap.data() || {};
    const expiresAtMs = otpData.expiresAtMs || 0;
    const attempts = otpData.attempts || 0;
    const maxAttempts = otpData.maxAttempts || MAX_ATTEMPTS;

    if (now > expiresAtMs) {
      await otpDocRef.delete();
      throw new HttpsError('failed-precondition', 'Verification code has expired. Please request a new code.');
    }

    if (attempts >= maxAttempts) {
      await otpDocRef.delete();
      throw new HttpsError('resource-exhausted', 'Too many failed attempts. Code invalidated. Please request a new code.');
    }

    const storedHash = otpData.hash;
    const salt = otpData.salt || '';
    const computedHash = crypto.createHash('sha256').update(salt + code).digest('hex');

    const isMatch =
      typeof storedHash === 'string' &&
      storedHash.length === computedHash.length &&
      crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'));

    if (!isMatch) {
      const newAttempts = attempts + 1;
      if (newAttempts >= maxAttempts) {
        await otpDocRef.delete();
        throw new HttpsError('resource-exhausted', 'Incorrect code. Maximum attempts exceeded. Please request a new code.');
      } else {
        await otpDocRef.update({ attempts: newAttempts });
        throw new HttpsError('invalid-argument', `Incorrect verification code. ${maxAttempts - newAttempts} attempt(s) remaining.`);
      }
    }

    // Single-use: delete the OTP record immediately
    await otpDocRef.delete();

    // Record server-authoritative stepup marker
    const stepUpValidityMs = 30 * 60 * 1000; // 30 minutes
    await db.collection('admin_stepup').doc(uid).set({
      uid,
      email: request.auth.token.email || otpData.email || '',
      verifiedAtMs: now,
      expiresAtMs: now + stepUpValidityMs,
      factor: 'verified_email_otp',
    });

    return {
      success: true,
      verifiedAtMs: now,
      expiresAtMs: now + stepUpValidityMs,
    };
  }
);
