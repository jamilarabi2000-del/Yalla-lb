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

  if (!hasTwilio) {
    throw new HttpsError(
      'failed-precondition',
      'SMS verification service is not configured. Please try again later.'
    );
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
 * Dispatch Email via Resend or SendGrid.
 * Fails closed if credentials are missing or if the provider returns a non-2xx response.
 */
async function sendEmailOtp(email: string, actionType: string, numericCode: string): Promise<void> {
  let resendApiKey = process.env.RESEND_API_KEY || '';
  try {
    resendApiKey = resendApiKey || RESEND_API_KEY.value();
  } catch {}

  let sendgridKey = process.env.SENDGRID_API_KEY || '';
  try {
    sendgridKey = sendgridKey || SENDGRID_API_KEY.value();
  } catch {}

  const hasResend = resendApiKey && resendApiKey.trim() !== '' && !resendApiKey.startsWith('your_');
  const hasSendGrid = sendgridKey && sendgridKey.trim() !== '' && !sendgridKey.startsWith('your_');

  const isSandbox = process.env.FUNCTIONS_EMULATOR === 'true' || 
                    process.env.VITEST === 'true' ||
                    process.env.NODE_ENV === 'test' ||
                    process.env.NODE_ENV === 'development';

  if (isSandbox && !hasResend && !hasSendGrid) {
    return; // Allow test/emulator execution silently without logging code
  }

  if (hasResend) {
    let sender = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    if (sender.includes('@gmail.com') || sender.includes('@yahoo.com') || sender.includes('@hotmail.com') || sender.includes('@outlook.com')) {
      sender = 'onboarding@resend.dev';
    }

    let response: Response | null = null;
    try {
      response = await fetch('https://api.resend.com/emails', {
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
    } catch (networkErr: any) {
      console.error('[Email Dispatch] Resend network fetch failed');
      if (!hasSendGrid && !isSandbox) {
        throw new HttpsError('internal', "We couldn't send the verification code. Please try again.");
      }
    }

    if (response && response.ok) {
      return;
    }

    if (response) {
      console.warn(`[Email Dispatch] Resend returned HTTP status ${response.status}`);
    }

    if (!hasSendGrid) {
      if (isSandbox) {
        return;
      }
      throw new HttpsError('internal', "We couldn't send the verification code. Please try again.");
    }
  }

  if (hasSendGrid) {
    let response: Response | null = null;
    try {
      response = await fetch('https://api.sendgrid.com/v3/mail/send', {
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
    } catch (networkErr: any) {
      console.error('[Email Dispatch] SendGrid network fetch failed');
      if (!isSandbox) {
        throw new HttpsError('internal', "We couldn't send the verification code. Please try again.");
      }
    }

    if (response && response.ok) {
      return;
    }

    if (response) {
      console.warn(`[Email Dispatch] SendGrid returned HTTP status ${response.status}`);
    }

    if (isSandbox) {
      return;
    }
    throw new HttpsError('internal', "We couldn't send the verification code. Please try again.");
  }

  if (!hasResend && !hasSendGrid) {
    if (isSandbox) {
      return;
    }
    throw new HttpsError(
      'failed-precondition',
      'Verification service is temporarily unavailable. Please try again later.'
    );
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

    // 2. Generate secure code and hash
    const numericCode = randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(contact, actionType, numericCode);
    const expiresAtMs = now + 5 * 60 * 1000;
    const newOtpRef = db.collection('otps').doc(hmacId);

    // 3. Attempt delivery. If delivery fails, release/rollback the reserved slot!
    try {
      await sendOtpDelivery(contactObj, actionType, numericCode);
    } catch (deliveryErr: any) {
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
        console.error('[OTP Rate Limit Rollback Error]:', rollbackErr);
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
    await newOtpRef.set({
      id: hmacId,
      uid: request.auth?.uid || null,
      contact,
      purpose: actionType,
      actionType,
      otpHash,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
      expiresAtMs,
      failedAttempts: 0,
      attempts: 0,
      maxAttempts: 5,
      used: false,
      consumedAt: null
    });

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

    const result = await db.runTransaction(async (transaction) => {
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
                        process.env.NODE_ENV === 'development';

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

    return { available: true };
  }
);

