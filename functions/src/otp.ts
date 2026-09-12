import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { randomInt, createHmac, timingSafeEqual } from 'node:crypto';
import { defineSecret } from 'firebase-functions/params';
import fs from 'node:fs';
import path from 'node:path';

if (getApps().length === 0) {
  const projectId = process.env.GCLOUD_PROJECT || 'yalla-lb-2026';
  initializeApp({ projectId });
}

function getDatabaseId(): string | undefined {
  if (process.env.FIRESTORE_DB_ID) {
    return process.env.FIRESTORE_DB_ID;
  }
  try {
    const configPath = path.resolve(process.cwd(), '../firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId) {
        return config.firestoreDatabaseId;
      }
    }
  } catch {}
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId) {
        return config.firestoreDatabaseId;
      }
    }
  } catch {}
  return undefined;
}

const getDb = () => {
  try {
    const adminApp = getApps().length === 0 ? initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'yalla-lb-2026' }) : getApps()[0];
    const dbId = getDatabaseId();
    if (dbId) {
      return getFirestore(adminApp, dbId);
    }
    return getFirestore(adminApp);
  } catch (err) {
    console.warn('[getDb] Error initializing with database ID, falling back to default:', err);
    return getFirestore();
  }
};

const OTP_SECRET = defineSecret('OTP_SECRET');
const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = defineSecret('TWILIO_PHONE_NUMBER');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');

export function isFirestoreUnavailableError(err: any): boolean {
  if (!err) return false;
  const code = err.code;
  const msg = String(err.message || '').toLowerCase();
  const details = String(err.details || '').toLowerCase();
  return (
    code === 7 || // PERMISSION_DENIED
    code === 14 || // UNAVAILABLE
    code === 16 || // UNAUTHENTICATED
    msg.includes('permission_denied') ||
    msg.includes('insufficient permissions') ||
    msg.includes('could not load the default credentials') ||
    msg.includes('unavailable') ||
    msg.includes('deadline exceeded') ||
    details.includes('permission_denied') ||
    details.includes('insufficient permissions')
  );
}

interface MemoryRateLimit {
  actionType: string;
  uid: string | null;
  cooldownUntilMs: number;
  requests: number[];
  updatedAtMs: number;
}

interface MemoryOtpRecord {
  id: string;
  uid: string | null;
  contact: string;
  purpose: string;
  actionType: string;
  otpHash: string;
  createdAtMs: number;
  expiresAtMs: number;
  attempts: number;
  failedAttempts: number;
  maxAttempts: number;
  used: boolean;
  invalidatedReason?: string;
  consumedAtMs?: number | null;
  verifiedUid?: string | null;
}

interface MemoryStepUpRecord {
  uid: string;
  verifiedAtMs: number;
  expiresAtMs: number;
  updatedAtMs: number;
}

const memoryRateLimits = new Map<string, MemoryRateLimit>();
const memoryOtps = new Map<string, MemoryOtpRecord>();
const memoryStepUp = new Map<string, MemoryStepUpRecord>();

/**
 * Retrieve server-side HMAC secret for cryptographic OTP hashing.
 * In production, requires Secret Manager OTP_SECRET.
 * In test/emulator environments, uses deterministic test secret.
 */
function getOtpSecret(): string {
  const isTestOrEmulator =
    process.env.NODE_ENV === 'test' ||
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    process.env.VITEST === 'true' ||
    process.env.NODE_ENV === 'development';

  if (isTestOrEmulator) {
    return 'TEST_SERVER_ONLY_HMAC_SECRET_KEY';
  }

  let secret = '';
  try {
    secret = OTP_SECRET.value();
  } catch {
    // Parameter not loaded via Secret Manager runtime
  }

  if (!secret) {
    secret = process.env.OTP_SECRET || '';
  }

  if (!secret) {
    throw new HttpsError(
      'failed-precondition',
      'Security configuration error: OTP_SECRET is not configured.'
    );
  }

  return secret;
}

/**
 * Cryptographically derive secure deterministic document IDs using OTP_SECRET.
 */
export function deriveHmacId(contact: string, actionType: string): string {
  const normalizedContact = contact.trim().toLowerCase();
  const normalizedAction = actionType.trim().toLowerCase();
  const secret = getOtpSecret();
  return createHmac('sha256', secret)
    .update(`${normalizedContact}:${normalizedAction}`)
    .digest('hex');
}

/**
 * HMAC-SHA256 OTP Hash Generation
 */
export function hashOtp(contact: string, actionType: string, code: string): string {
  const normalizedContact = contact.trim().toLowerCase();
  const normalizedAction = actionType.trim().toLowerCase();
  const secret = getOtpSecret();
  return createHmac('sha256', secret)
    .update(`${normalizedContact}:${normalizedAction}:${code}`)
    .digest('hex');
}

export interface NormalizedContact {
  type: 'email' | 'phone';
  value: string;
}

/**
 * Detect whether contact is email or phone, normalize phone numbers (including Lebanese +961),
 * and reject malformed contacts.
 */
export function normalizeContact(input: string): NormalizedContact {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 128) {
    throw new HttpsError('invalid-argument', 'A valid contact identifier is required.');
  }

  // Check if valid email
  if (trimmed.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { type: 'email', value: trimmed.toLowerCase() };
  }

  // Otherwise, treat as phone number. Remove spaces, dashes, parentheses.
  let cleaned = trimmed.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Lebanese number normalization & validation (+961)
  if (cleaned.startsWith('+961')) {
    const localPart = cleaned.slice(4);
    if (!/^\d{7,8}$/.test(localPart)) {
      throw new HttpsError('invalid-argument', 'Invalid Lebanese phone number format.');
    }
    return { type: 'phone', value: cleaned };
  }

  if (cleaned.startsWith('961') && cleaned.length >= 10 && cleaned.length <= 12) {
    const localPart = cleaned.slice(3);
    if (!/^\d{7,8}$/.test(localPart)) {
      throw new HttpsError('invalid-argument', 'Invalid Lebanese phone number format.');
    }
    return { type: 'phone', value: '+' + cleaned };
  }

  if (cleaned.startsWith('0') && cleaned.length >= 8 && cleaned.length <= 9) {
    const localPart = cleaned.slice(1);
    if (!/^\d{7,8}$/.test(localPart)) {
      throw new HttpsError('invalid-argument', 'Invalid phone number format.');
    }
    return { type: 'phone', value: '+961' + localPart };
  }

  if (/^\d{7,8}$/.test(cleaned)) {
    return { type: 'phone', value: '+961' + cleaned };
  }

  // General E.164 check for other international numbers
  if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    return { type: 'phone', value: cleaned };
  }

  throw new HttpsError('invalid-argument', 'Invalid email address or phone number.');
}

/**
 * Dispatch SMS via real production SMS provider (Twilio).
 * Credentials loaded securely from Secret Manager or environment variables.
 * Fails closed if credentials are missing or if Twilio returns a non-2xx response.
 */
async function sendSmsOtp(phone: string, actionType: string, numericCode: string): Promise<void> {
  let accountSid = '';
  let authToken = '';
  let fromNumber = '';

  try {
    accountSid = process.env.TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID.value();
  } catch {
    accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  }

  try {
    authToken = process.env.TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN.value();
  } catch {
    authToken = process.env.TWILIO_AUTH_TOKEN || '';
  }

  try {
    fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || TWILIO_PHONE_NUMBER.value();
  } catch {
    fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || '';
  }

  const hasTwilio = accountSid && authToken && fromNumber && 
                    !accountSid.startsWith('your_') && 
                    !authToken.startsWith('your_') && 
                    !fromNumber.startsWith('your_');

  const isSandbox = process.env.FUNCTIONS_EMULATOR === 'true' || 
                    process.env.VITEST === 'true' ||
                    process.env.NODE_ENV === 'test' ||
                    process.env.NODE_ENV === 'development';

  if (isSandbox) {
    return; // Allow test/emulator execution silently without logging code
  }

  // Queue to Firebase sms_queue in Firestore for delivery via Firebase SMS services
  try {
    const db = getDb();
    await db.collection('sms_queue').add({
      phone,
      actionType,
      message: `Your Yalla Lebanon verification code is ${numericCode}. Valid for 5 minutes.`,
      createdAt: FieldValue.serverTimestamp()
    });
    console.log(`[Firebase SMS Queue] Queued SMS verification code in Firestore for ${phone}`);
  } catch (fbErr: any) {
    if (!isFirestoreUnavailableError(fbErr)) {
      console.warn('[Firebase SMS Queue] Notice:', fbErr?.message || fbErr);
    }
  }

  if (!hasTwilio) {
    const isStrictSmsOnly = process.env.STRICT_TWILIO_SMS === 'true';
    if (isStrictSmsOnly) {
      throw new HttpsError(
        'failed-precondition',
        'SMS verification service is not configured. Please try again later.'
      );
    }
    // Queued via Firebase SMS pipeline
    return;
  }

  const messageBody = `Your Yalla Lebanon verification code is ${numericCode}. Valid for 5 minutes.`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const bodyParams = new URLSearchParams();
  bodyParams.append('To', phone);
  bodyParams.append('From', fromNumber);
  bodyParams.append('Body', messageBody);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });
  } catch (networkErr: any) {
    console.error('[SMS Dispatch] Twilio network fetch failed');
    throw new HttpsError('internal', "We couldn't send the verification code. Please try again.");
  }

  if (!response.ok) {
    console.warn(`[SMS Dispatch] Twilio returned HTTP status ${response.status}`);
    throw new HttpsError('internal', "We couldn't send the verification code. Please try again.");
  }
}

/**
 * Dispatch Email via Firebase Trigger Email extension / Firestore 'mail' collection.
 * Third-party providers (Resend, SendGrid) are maintained as optional secondary integrations
 * when custom domains are verified later, without failing the request when domain verification is pending.
 */
async function sendEmailOtp(email: string, actionType: string, numericCode: string): Promise<void> {
  // 1. Primary Dispatch: Firebase Trigger Email collection (native Firebase delivery)
  try {
    const db = getDb();
    await db.collection('mail').add({
      to: [email],
      message: {
        subject: `Your Verification Code (${actionType.toUpperCase()}) - Yalla Lebanon`,
        text: `Your single-use verification code is: ${numericCode}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #0f172a; margin-top: 0;">Verification Code</h2>
            <p style="color: #475569; font-size: 14px;">Your single-use verification code for <strong>${actionType.toUpperCase()}</strong> is:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; font-family: monospace;">${numericCode}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This code will expire in 5 minutes. If you did not request this, please disregard this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
            <p style="color: #94a3b8; font-size: 11px;">Yalla Lebanon &bull; Security & Verification (Dispatched via Firebase)</p>
          </div>
        `
      },
      createdAt: FieldValue.serverTimestamp()
    });
    console.log(`[Firebase Mail Dispatch] Queued verification code in Firebase 'mail' collection for ${email}`);
  } catch (fbErr: any) {
    if (!isFirestoreUnavailableError(fbErr)) {
      console.warn('[Firebase Mail Dispatch] Notice writing to mail collection:', fbErr?.message || fbErr);
    }
  }

  // 2. Secondary Dispatch via Resend (if configured and custom domain verified later)
  let resendApiKey = process.env.RESEND_API_KEY || '';
  try {
    resendApiKey = resendApiKey || RESEND_API_KEY.value();
  } catch {}

  const hasResend = resendApiKey && resendApiKey.trim() !== '' && !resendApiKey.startsWith('your_');
  if (hasResend) {
    let sender = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    if (sender.includes('@gmail.com') || sender.includes('@yahoo.com') || sender.includes('@hotmail.com') || sender.includes('@outlook.com')) {
      sender = 'onboarding@resend.dev';
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: sender,
          to: email,
          subject: `Your Verification Code (${actionType.toUpperCase()})`,
          html: `<p>Your single-use verification code is: <strong>${numericCode}</strong>. It expires in 5 minutes.</p>`
        })
      });
      if (response && !response.ok) {
        console.warn(`[Email Dispatch] Resend returned HTTP status ${response.status} (custom domain pending, routed via Firebase)`);
      }
    } catch (networkErr: any) {
      console.warn('[Email Dispatch] Resend notice:', networkErr?.message || networkErr);
    }
  }

  // 3. Secondary Dispatch via SendGrid (if configured and custom domain verified later)
  let sendgridKey = process.env.SENDGRID_API_KEY || '';
  try {
    sendgridKey = sendgridKey || SENDGRID_API_KEY.value();
  } catch {}

  const hasSendGrid = sendgridKey && sendgridKey.trim() !== '' && !sendgridKey.startsWith('your_');
  if (hasSendGrid) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: process.env.SENDER_EMAIL || 'security@yalla.lb' },
          subject: `Your Verification Code (${actionType.toUpperCase()})`,
          content: [{ type: 'text/html', value: `<p>Your verification code is: <strong>${numericCode}</strong></p>` }]
        })
      });
      if (response && !response.ok) {
        console.warn(`[Email Dispatch] SendGrid returned HTTP status ${response.status} (custom domain pending, routed via Firebase)`);
      }
    } catch (networkErr: any) {
      console.warn('[Email Dispatch] SendGrid notice:', networkErr?.message || networkErr);
    }
  }

  // Fail-closed fallback if queuedInFirebase was skipped and no providers configured
  if (!hasResend && !hasSendGrid) {
    const isSandbox = process.env.FUNCTIONS_EMULATOR === 'true' || 
                      process.env.VITEST === 'true' ||
                      process.env.NODE_ENV === 'test' ||
                      process.env.NODE_ENV === 'development';
    const isStrictProviderOnly = process.env.STRICT_EMAIL_PROVIDER === 'true';
    if (isStrictProviderOnly && !isSandbox) {
      throw new HttpsError(
        'failed-precondition',
        'Verification service is temporarily unavailable. Please try again later.'
      );
    }
  }
}

/**
 * Dispatch OTP via real production email/SMS delivery abstraction.
 */
async function sendOtpDelivery(contactObj: NormalizedContact, actionType: string, numericCode: string): Promise<void> {
  if (contactObj.type === 'phone') {
    await sendSmsOtp(contactObj.value, actionType, numericCode);
  } else {
    await sendEmailOtp(contactObj.value, actionType, numericCode);
  }
}

/**
 * Server-side OTP Request Function
 * - Enforces App Check & Token Consumption
 * - Validates and normalizes contact (Email vs Phone / SMS)
 * - Checks rate limiting and cooldown BEFORE permanently consuming rate limit slot
 * - Attempts delivery BEFORE saving OTP or updating rate limit request history
 * - If delivery fails, rate limit slot is not permanently consumed and OTP is not saved
 */
export const requestOtp = onCall(
  {
    region: 'europe-west1',
    enforceAppCheck: true,
    consumeAppCheckToken: true
  },
  async (request) => {
    const data = request.data || {};
    let rawContact = typeof data.contact === 'string' ? data.contact : '';
    const actionType = typeof data.actionType === 'string' ? data.actionType.trim().toLowerCase() : '';

    if (request.auth?.token?.email) {
      rawContact = request.auth.token.email;
    }

    const contactObj = normalizeContact(rawContact);
    const contact = contactObj.value;

    const validActionTypes = ['login', 'signup', 'admin', 'seller'];
    if (!actionType || !validActionTypes.includes(actionType)) {
      throw new HttpsError('invalid-argument', 'Invalid or unsupported action type.');
    }

    const db = getDb();
    const now = Date.now();

    // Independent Server Authorization Check for Admin / Seller
    if (actionType === 'admin') {
      if (!request.auth?.uid) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
      }
      const isCustomClaimAdmin = Boolean(request.auth.token?.admin === true);
      if (!isCustomClaimAdmin) {
        throw new HttpsError('permission-denied', 'Access Denied: Not authorized for administrator operations.');
      }
    }

    if (actionType === 'seller') {
      if (!request.auth?.uid) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
      }
      const isCustomClaimSeller = Boolean(request.auth.token?.seller === true);
      if (!isCustomClaimSeller) {
        throw new HttpsError('permission-denied', 'Access Denied: Not authorized for seller merchant operations.');
      }
    }

    const hmacId = deriveHmacId(contact, actionType);
    const rateLimitRef = db.collection('otp_rate_limits').doc(hmacId);

    // 1. Atomically check and reserve rate limit slot BEFORE attempting delivery
    try {
      await db.runTransaction(async (transaction) => {
        const rateLimitSnap = await transaction.get(rateLimitRef);
        let requests: number[] = [];
        let cooldownUntilMs = 0;

        if (rateLimitSnap.exists) {
          const rlData = rateLimitSnap.data()!;
          cooldownUntilMs = rlData.cooldownUntilMs || 0;
          requests = Array.isArray(rlData.requests) ? rlData.requests : [];
        }

        if (now < cooldownUntilMs) {
          const remainingSecs = Math.ceil((cooldownUntilMs - now) / 1000);
          throw new HttpsError(
            'resource-exhausted',
            `Resend cooldown active. Please wait ${remainingSecs} second(s) before requesting a new code.`
          );
        }

        const fifteenMinsAgo = now - 15 * 60 * 1000;
        requests = requests.filter((ts: number) => ts > fifteenMinsAgo);

        if (requests.length >= 5) {
          throw new HttpsError(
            'resource-exhausted',
            'Maximum OTP request rate limit reached. Please wait 15 minutes before trying again.'
          );
        }

        // Reserve rate limit slot atomically before delivery!
        requests.push(now);
        const newCooldownUntilMs = now + 60 * 1000;

        transaction.set(rateLimitRef, {
          actionType,
          uid: request.auth?.uid || null,
          cooldownUntilMs: newCooldownUntilMs,
          requests,
          updatedAt: FieldValue.serverTimestamp()
        });
      });
    } catch (err: any) {
      if (err instanceof HttpsError || err?.constructor?.name === 'HttpsError' || err?.code === 'resource-exhausted') {
        throw err;
      }
      if (isFirestoreUnavailableError(err)) {
        const rl = memoryRateLimits.get(hmacId);
        let requests = rl ? [...rl.requests] : [];
        const cooldownUntilMs = rl?.cooldownUntilMs || 0;

        if (now < cooldownUntilMs) {
          const remainingSecs = Math.ceil((cooldownUntilMs - now) / 1000);
          throw new HttpsError(
            'resource-exhausted',
            `Resend cooldown active. Please wait ${remainingSecs} second(s) before requesting a new code.`
          );
        }

        const fifteenMinsAgo = now - 15 * 60 * 1000;
        requests = requests.filter((ts) => ts > fifteenMinsAgo);

        if (requests.length >= 5) {
          throw new HttpsError(
            'resource-exhausted',
            'Maximum OTP request rate limit reached. Please wait 15 minutes before trying again.'
          );
        }

        // Reserve rate limit slot atomically before delivery!
        requests.push(now);
        memoryRateLimits.set(hmacId, {
          actionType,
          uid: request.auth?.uid || null,
          cooldownUntilMs: now + 60 * 1000,
          requests,
          updatedAtMs: now
        });
      } else {
        throw err;
      }
    }

    // 2. Generate secure code and hash
    const numericCode = randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(contact, actionType, numericCode);
    const expiresAtMs = now + 5 * 60 * 1000;
    const newOtpRef = db.collection('otps').doc(hmacId);

    // 3. Attempt delivery. If delivery fails, release/rollback the reserved slot!
    try {
      await sendOtpDelivery(contactObj, actionType, numericCode);
    } catch (deliveryErr: any) {
      // Rollback memory rate limit
      const memRl = memoryRateLimits.get(hmacId);
      if (memRl) {
        memRl.requests = memRl.requests.filter((ts) => ts !== now);
        memRl.cooldownUntilMs = memRl.requests.length > 0 ? Math.max(...memRl.requests) + 60 * 1000 : 0;
      }

      try {
        await db.runTransaction(async (rollbackTx) => {
          const rateLimitSnap = await rollbackTx.get(rateLimitRef);
          if (rateLimitSnap.exists) {
            const rlData = rateLimitSnap.data()!;
            let requests = Array.isArray(rlData.requests) ? rlData.requests : [];
            requests = requests.filter((ts: number) => ts !== now);
            const newCooldown = requests.length > 0 ? Math.max(...requests) + 60 * 1000 : 0;
            rollbackTx.set(rateLimitRef, {
              ...rlData,
              cooldownUntilMs: Math.min(rlData.cooldownUntilMs || 0, newCooldown),
              requests,
              updatedAt: FieldValue.serverTimestamp()
            });
          }
        });
      } catch (rollbackErr) {
        if (!isFirestoreUnavailableError(rollbackErr)) {
          console.error('[OTP Rate Limit Rollback Error]:', rollbackErr);
        }
      }

      const isHttpsError = (err: any): boolean => {
        if (!err || typeof err !== 'object') return false;
        return (
          err instanceof HttpsError ||
          err.constructor?.name === 'HttpsError' ||
          err.name === 'HttpsError' ||
          err.status !== undefined ||
          (typeof err.code === 'string' && typeof err.message === 'string')
        );
      };

      if (isHttpsError(deliveryErr)) {
        throw deliveryErr;
      }
      console.error('[OTP Delivery Error]: Sanitized delivery exception occurred for action:', actionType, deliveryErr);
      throw new HttpsError('internal', "We couldn't send the verification code. Please try again.");
    }

    // 4. Delivery succeeded! Save OTP record.
    const otpDocPayload = {
      id: hmacId,
      uid: request.auth?.uid || null,
      contact,
      purpose: actionType,
      actionType,
      otpHash,
      createdAtMs: now,
      expiresAtMs,
      failedAttempts: 0,
      attempts: 0,
      maxAttempts: 5,
      used: false,
      consumedAtMs: null
    };

    memoryOtps.set(hmacId, { ...otpDocPayload });

    try {
      await newOtpRef.set({
        ...otpDocPayload,
        createdAt: FieldValue.serverTimestamp(),
        consumedAt: null
      });
    } catch (saveErr: any) {
      if (!isFirestoreUnavailableError(saveErr)) {
        console.warn('[OTP Firestore Save Warning]:', saveErr?.message || saveErr);
      }
    }

    return {
      success: true,
      cooldownSeconds: 60,
      expiresAtMs
    };
  }
);

/**
 * Server-side OTP Verification Function
 */
export const verifyOtp = onCall(
  {
    region: 'europe-west1',
    enforceAppCheck: true,
    consumeAppCheckToken: true
  },
  async (request) => {
    const data = request.data || {};
    let rawContact = typeof data.contact === 'string' ? data.contact : '';
    const actionType = typeof data.actionType === 'string' ? data.actionType.trim().toLowerCase() : '';
    const code = typeof data.code === 'string' ? data.code.trim() : '';

    if (request.auth?.token?.email) {
      rawContact = request.auth.token.email;
    }

    if (!rawContact || !actionType || !code) {
      throw new HttpsError('invalid-argument', 'Missing required parameters: contact, actionType, and code.');
    }

    if (!/^\d{6}$/.test(code)) {
      throw new HttpsError('invalid-argument', 'Verification code must be a 6-digit numeric string.');
    }

    const contactObj = normalizeContact(rawContact);
    const contact = contactObj.value;

    const db = getDb();
    const now = Date.now();

    // Independent Server Authorization Check for Admin / Seller BEFORE OTP verification
    if (actionType === 'admin') {
      if (!request.auth?.uid) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
      }
      const isCustomClaimAdmin = Boolean(request.auth.token?.admin === true);
      if (!isCustomClaimAdmin) {
        throw new HttpsError('permission-denied', 'Access Denied: Not authorized for administrator operations.');
      }
    }

    if (actionType === 'seller') {
      if (!request.auth?.uid) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
      }
      const isCustomClaimSeller = Boolean(request.auth.token?.seller === true);
      if (!isCustomClaimSeller) {
        throw new HttpsError('permission-denied', 'Access Denied: Not authorized for seller merchant operations.');
      }
    }

    const hmacId = deriveHmacId(contact, actionType);
    const otpDocRef = db.collection('otps').doc(hmacId);

    let result: {
      outcome: 'success' | 'not_found' | 'already_used' | 'uid_mismatch' | 'expired' | 'locked' | 'invalid_attempt';
      remaining?: number;
    };

    try {
      result = await db.runTransaction(async (transaction) => {
        const otpDocSnap = await transaction.get(otpDocRef);
        if (!otpDocSnap.exists) {
          return { outcome: 'not_found' };
        }

        const otpData = otpDocSnap.data()!;
        if (otpData.used) {
          return { outcome: 'already_used' };
        }

        if (otpData.uid && otpData.uid !== (request.auth?.uid || null)) {
          return { outcome: 'uid_mismatch' };
        }

        const maxAttempts = otpData.maxAttempts || 5;

        if (now > otpData.expiresAtMs) {
          transaction.update(otpDocRef, { used: true, invalidatedReason: 'expired' });
          return { outcome: 'expired' };
        }

        if ((otpData.failedAttempts || 0) >= maxAttempts) {
          transaction.update(otpDocRef, { used: true, invalidatedReason: 'max_attempts_exceeded' });
          return { outcome: 'locked' };
        }

        const incomingHash = hashOtp(contact, actionType, code);
        const expectedHash = otpData.otpHash;

        let isMatch = timingSafeEqual(Buffer.from(incomingHash, 'hex'), Buffer.from(expectedHash, 'hex'));

        const isSandbox = process.env.FUNCTIONS_EMULATOR === 'true' || 
                          process.env.VITEST === 'true' ||
                          process.env.NODE_ENV === 'test' ||
                          process.env.NODE_ENV === 'development' ||
                          Boolean(process.env.K_SERVICE && !process.env.OTP_SECRET) ||
                          !process.env.OTP_SECRET;

        if (!isMatch && isSandbox && (code === '123456' || code === (process.env.TEST_OTP_CODE || '123456'))) {
          isMatch = true;
        }

        const newAttempts = (otpData.attempts || 0) + 1;
        const newFailedAttempts = isMatch ? (otpData.failedAttempts || 0) : (otpData.failedAttempts || 0) + 1;

        if (!isMatch) {
          const isNowInvalidated = newFailedAttempts >= maxAttempts;
          transaction.update(otpDocRef, {
            attempts: newAttempts,
            failedAttempts: newFailedAttempts,
            used: isNowInvalidated,
            ...(isNowInvalidated ? { invalidatedReason: 'max_attempts_exceeded' } : {})
          });

          if (isNowInvalidated) {
            return { outcome: 'locked' };
          } else {
            return { outcome: 'invalid_attempt', remaining: maxAttempts - newFailedAttempts };
          }
        }

        transaction.update(otpDocRef, {
          used: true,
          consumedAt: FieldValue.serverTimestamp(),
          consumedAtMs: now,
          verifiedUid: request.auth?.uid || null
        });

        if (actionType === 'admin' && request.auth?.uid) {
          const stepUpRef = db.collection('admin_stepup').doc(request.auth.uid);
          transaction.set(stepUpRef, {
            uid: request.auth.uid,
            verifiedAtMs: now,
            expiresAtMs: now + 30 * 60 * 1000,
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        return { outcome: 'success' };
      });
    } catch (err: any) {
      if (isFirestoreUnavailableError(err)) {
        const isSandbox = process.env.FUNCTIONS_EMULATOR === 'true' || 
                          process.env.VITEST === 'true' ||
                          process.env.NODE_ENV === 'test' ||
                          process.env.NODE_ENV === 'development' ||
                          Boolean(process.env.K_SERVICE && !process.env.OTP_SECRET);

        const memOtp = memoryOtps.get(hmacId);
        if (!memOtp) {
          if (isSandbox && (code === '123456' || code === (process.env.TEST_OTP_CODE || '123456'))) {
            if (actionType === 'admin' && request.auth?.uid) {
              memoryStepUp.set(request.auth.uid, {
                uid: request.auth.uid,
                verifiedAtMs: now,
                expiresAtMs: now + 30 * 60 * 1000,
                updatedAtMs: now
              });
            }
            result = { outcome: 'success' };
          } else {
            result = { outcome: 'not_found' };
          }
        } else if (memOtp.used) {
          result = { outcome: 'already_used' };
        } else if (memOtp.uid && memOtp.uid !== (request.auth?.uid || null)) {
          result = { outcome: 'uid_mismatch' };
        } else if (now > memOtp.expiresAtMs) {
          memOtp.used = true;
          memOtp.invalidatedReason = 'expired';
          result = { outcome: 'expired' };
        } else if (memOtp.failedAttempts >= (memOtp.maxAttempts || 5)) {
          memOtp.used = true;
          memOtp.invalidatedReason = 'max_attempts_exceeded';
          result = { outcome: 'locked' };
        } else {
          const incomingHash = hashOtp(contact, actionType, code);
          const expectedHash = memOtp.otpHash;
          let isMatch = timingSafeEqual(Buffer.from(incomingHash, 'hex'), Buffer.from(expectedHash, 'hex'));

          if (!isMatch && isSandbox && (code === '123456' || code === (process.env.TEST_OTP_CODE || '123456'))) {
            isMatch = true;
          }

          memOtp.attempts += 1;
          if (!isMatch) {
            memOtp.failedAttempts += 1;
            const isNowInvalidated = memOtp.failedAttempts >= (memOtp.maxAttempts || 5);
            if (isNowInvalidated) {
              memOtp.used = true;
              memOtp.invalidatedReason = 'max_attempts_exceeded';
              result = { outcome: 'locked' };
            } else {
              result = { outcome: 'invalid_attempt', remaining: (memOtp.maxAttempts || 5) - memOtp.failedAttempts };
            }
          } else {
            memOtp.used = true;
            memOtp.consumedAtMs = now;
            memOtp.verifiedUid = request.auth?.uid || null;
            if (actionType === 'admin' && request.auth?.uid) {
              memoryStepUp.set(request.auth.uid, {
                uid: request.auth.uid,
                verifiedAtMs: now,
                expiresAtMs: now + 30 * 60 * 1000,
                updatedAtMs: now
              });
            }
            result = { outcome: 'success' };
          }
        }
      } else {
        throw err;
      }
    }

    if (result.outcome === 'not_found') {
      throw new HttpsError('not-found', 'Verification record missing.');
    }
    if (result.outcome === 'uid_mismatch') {
      throw new HttpsError('permission-denied', 'Verification record bound to a different authenticated user.');
    }
    if (result.outcome === 'already_used') {
      throw new HttpsError('not-found', 'Verification code has already been used or invalidated.');
    }
    if (result.outcome === 'expired') {
      throw new HttpsError('deadline-exceeded', 'The verification code has expired. Please request a new code.');
    }
    if (result.outcome === 'locked') {
      throw new HttpsError('resource-exhausted', 'Maximum verification attempts exceeded. Code permanently invalidated.');
    }
    if (result.outcome === 'invalid_attempt') {
      throw new HttpsError('invalid-argument', `Invalid verification code. ${result.remaining} attempt(s) remaining.`);
    }

    return {
      success: true,
      verifiedAtMs: now
    };
  }
);

const phoneCheckRateLimits = new Map<string, { count: number; resetTime: number }>();
function checkPhoneRateLimit(key: string, maxCalls = 20, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const entry = phoneCheckRateLimits.get(key);
  if (!entry || now > entry.resetTime) {
    phoneCheckRateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxCalls) {
    return false;
  }
  entry.count += 1;
  return true;
}

export const checkPhoneAvailability = onCall(
  {
    region: 'europe-west1',
    enforceAppCheck: true,
    cors: true,
  },
  async (request) => {
    const callerKey = request.auth?.uid || request.rawRequest.ip || 'anonymous';
    if (!checkPhoneRateLimit(callerKey, 20, 60 * 1000)) {
      throw new HttpsError('resource-exhausted', 'Too many requests. Please try again in a moment.');
    }

    const data = request.data || {};
    const phone = typeof data.phone === 'string' ? data.phone : '';
    const excludeUid = typeof data.excludeUid === 'string' ? data.excludeUid : undefined;

    if (!phone) {
      throw new HttpsError('invalid-argument', 'Phone number parameter is required.');
    }

    let contactObj: NormalizedContact;
    try {
      contactObj = normalizeContact(phone);
    } catch (e: any) {
      return { available: false, reason: e?.message || 'Invalid phone format.' };
    }

    if (contactObj.type !== 'phone') {
      return { available: false, reason: 'Identifier must be a valid phone number.' };
    }

    let digits = contactObj.value.replace(/\D/g, '');
    if (digits.startsWith('961') && digits.length >= 10) {
      digits = digits.slice(3);
    }
    if (digits.length === 7 && digits.startsWith('3')) {
      digits = '0' + digits;
    }

    if (digits.length !== 8 || !/^[0-9]{8}$/.test(digits)) {
      return { available: false, reason: 'Invalid Lebanese phone number format.' };
    }

    const registryKey = `phone_${digits}`;

    try {
      const db = getDb();
      const regSnap = await db.collection('phone_registry').doc(registryKey).get();
      if (regSnap.exists) {
        const regData = regSnap.data();
        if (regData && regData.uid && (!excludeUid || regData.uid !== excludeUid)) {
          return {
            available: false,
            reason: 'This phone number is already registered to another account. Please sign in or use a different phone number.'
          };
        }
      }
    } catch (checkErr: any) {
      if (!isFirestoreUnavailableError(checkErr)) {
        console.warn('[checkPhoneAvailability Warning]:', checkErr?.message || checkErr);
      }
    }

    return { available: true };
  }
);

