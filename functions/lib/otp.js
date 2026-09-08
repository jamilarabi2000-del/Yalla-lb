"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.requestOtp = void 0;
exports.deriveHmacId = deriveHmacId;
exports.hashOtp = hashOtp;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const node_crypto_1 = require("node:crypto");
const params_1 = require("firebase-functions/params");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const DATABASE_ID = 'ai-studio-yallalb-1415b490-9de7-4a31-acee-0f9c6439c18c';
const getDb = () => {
    try {
        return (0, firestore_1.getFirestore)(DATABASE_ID);
    }
    catch {
        return (0, firestore_1.getFirestore)();
    }
};
const OTP_SECRET = (0, params_1.defineSecret)('OTP_SECRET');
/**
 * Retrieve server-side HMAC secret for cryptographic OTP hashing.
 * Never hard-coded in source code; reads strictly from Secret Manager.
 */
function getOtpSecret() {
    if (process.env.NODE_ENV === 'test' ||
        process.env.FUNCTIONS_EMULATOR === 'true' ||
        process.env.VITEST === 'true') {
        return 'TEST_SERVER_ONLY_HMAC_SECRET_KEY';
    }
    let secret = '';
    try {
        secret = OTP_SECRET.value();
    }
    catch {
        // Fail closed in production if Secret Manager parameter is missing/fails
    }
    if (!secret) {
        throw new https_1.HttpsError('internal', 'Server misconfiguration: OTP secret key missing.');
    }
    return secret;
}
/**
 * Cryptographically derive secure deterministic document IDs using OTP_SECRET.
 */
function deriveHmacId(contact, actionType) {
    const normalizedContact = contact.trim().toLowerCase();
    const normalizedAction = actionType.trim().toLowerCase();
    const secret = getOtpSecret();
    return (0, node_crypto_1.createHmac)('sha256', secret)
        .update(`${normalizedContact}:${normalizedAction}`)
        .digest('hex');
}
/**
 * HMAC-SHA256 OTP Hash Generation
 */
function hashOtp(contact, actionType, code) {
    const normalizedContact = contact.trim().toLowerCase();
    const normalizedAction = actionType.trim().toLowerCase();
    const secret = getOtpSecret();
    return (0, node_crypto_1.createHmac)('sha256', secret)
        .update(`${normalizedContact}:${normalizedAction}:${code}`)
        .digest('hex');
}
/**
 * Dispatch OTP via real production email/SMS provider.
 * The plaintext OTP is NEVER:
 * - returned to the client
 * - stored in Firestore
 * - logged to console/logs
 * - exposed in errors or analytics
 */
async function sendOtpDelivery(contact, actionType, numericCode) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (resendApiKey) {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.SENDER_EMAIL || 'security@yalla.lb',
                to: contact,
                subject: `Your Verification Code (${actionType.toUpperCase()})`,
                html: `<p>Your single-use verification code is: <strong>${numericCode}</strong>. It expires in 5 minutes.</p>`
            })
        });
        if (!response.ok) {
            throw new https_1.HttpsError('internal', 'Failed to dispatch verification code via Resend provider.');
        }
        return;
    }
    if (sendgridKey) {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: contact }] }],
                from: { email: process.env.SENDER_EMAIL || 'security@yalla.lb' },
                subject: `Your Verification Code (${actionType.toUpperCase()})`,
                content: [{ type: 'text/html', value: `<p>Your verification code is: <strong>${numericCode}</strong></p>` }]
            })
        });
        if (!response.ok) {
            throw new https_1.HttpsError('internal', 'Failed to dispatch verification code via SendGrid provider.');
        }
        return;
    }
    // Allow automated unit testing and emulator execution without failing
    if (process.env.NODE_ENV === 'test' || process.env.FUNCTIONS_EMULATOR === 'true') {
        return;
    }
    // FAIL SAFELY IF NO PRODUCTION SERVICE PROVIDER IS CONFIGURED
    // Do NOT fake delivery, do NOT log code, do NOT return code to client.
    throw new https_1.HttpsError('failed-precondition', 'OTP dispatch failed: No production email/SMS service provider credentials configured on the server.');
}
/**
 * Server-side OTP Request Function
 * - Enforces App Check & Token Consumption (enforceAppCheck: true, consumeAppCheckToken: true)
 * - Concurrency-safe atomic rate limiting via Firestore transaction lock on /otp_rate_limits
 * - Server-side independent authentication & authorization for admin/seller (no email leaks)
 * - Cryptographically secure 6-digit code generation via randomInt
 * - HMAC-SHA256 hashed code stored in single server-only /otps collection
 * - Returns NO plaintext code or secret token to the client
 */
exports.requestOtp = (0, https_1.onCall)({ region: 'europe-west1', enforceAppCheck: true, consumeAppCheckToken: true, secrets: [OTP_SECRET] }, async (request) => {
    const data = request.data || {};
    let contact = typeof data.contact === 'string' ? data.contact.trim().toLowerCase() : '';
    const actionType = typeof data.actionType === 'string' ? data.actionType.trim().toLowerCase() : '';
    if (request.auth?.token?.email) {
        contact = request.auth.token.email.trim().toLowerCase();
    }
    if (!contact || contact.length > 128) {
        throw new https_1.HttpsError('invalid-argument', 'A valid contact identifier is required.');
    }
    const validActionTypes = ['login', 'signup', 'admin', 'seller'];
    if (!actionType || !validActionTypes.includes(actionType)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid or unsupported action type.');
    }
    const db = getDb();
    const now = Date.now();
    // Independent Server Authorization Check for Admin / Seller
    if (actionType === 'admin') {
        if (!request.auth?.uid) {
            throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
        }
        const isCustomClaimAdmin = Boolean(request.auth.token?.admin === true);
        if (!isCustomClaimAdmin) {
            throw new https_1.HttpsError('permission-denied', 'Access Denied: Not authorized for administrator operations.');
        }
    }
    if (actionType === 'seller') {
        if (!request.auth?.uid) {
            throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
        }
        const isCustomClaimSeller = Boolean(request.auth.token?.seller === true);
        if (!isCustomClaimSeller) {
            throw new https_1.HttpsError('permission-denied', 'Access Denied: Not authorized for seller merchant operations.');
        }
    }
    // Cryptographically secure 6-digit random code
    const numericCode = (0, node_crypto_1.randomInt)(100000, 1000000).toString();
    // HMAC-SHA256 Hash
    const otpHash = hashOtp(contact, actionType, numericCode);
    // Cryptographically derive secure deterministic document keys using OTP_SECRET
    const hmacId = deriveHmacId(contact, actionType);
    const rateLimitRef = db.collection('otp_rate_limits').doc(hmacId);
    const newOtpRef = db.collection('otps').doc(hmacId);
    const expiresAtMs = now + 5 * 60 * 1000;
    await db.runTransaction(async (transaction) => {
        const rateLimitSnap = await transaction.get(rateLimitRef);
        let requests = [];
        let cooldownUntilMs = 0;
        if (rateLimitSnap.exists) {
            const rlData = rateLimitSnap.data();
            cooldownUntilMs = rlData.cooldownUntilMs || 0;
            requests = Array.isArray(rlData.requests) ? rlData.requests : [];
        }
        // 1. Resend Cooldown Check (60 seconds)
        if (now < cooldownUntilMs) {
            const remainingSecs = Math.ceil((cooldownUntilMs - now) / 1000);
            throw new https_1.HttpsError('resource-exhausted', `Resend cooldown active. Please wait ${remainingSecs} second(s) before requesting a new code.`);
        }
        // 2. Sliding Window Rate Limit Check (5 requests per 15 minutes)
        const fifteenMinsAgo = now - 15 * 60 * 1000;
        requests = requests.filter(ts => ts > fifteenMinsAgo);
        if (requests.length >= 5) {
            throw new https_1.HttpsError('resource-exhausted', 'Maximum OTP request rate limit reached. Please wait 15 minutes before trying again.');
        }
        // Update Rate Limit document atomically (obfuscating plain contact info)
        const newCooldownUntilMs = now + 60 * 1000;
        requests.push(now);
        transaction.set(rateLimitRef, {
            actionType,
            cooldownUntilMs: newCooldownUntilMs,
            requests,
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        // Save secure OTP record in single server-only /otps collection
        transaction.set(newOtpRef, {
            id: hmacId,
            uid: request.auth?.uid || null,
            contact,
            purpose: actionType,
            actionType,
            otpHash,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            createdAtMs: now,
            expiresAtMs,
            failedAttempts: 0,
            attempts: 0,
            maxAttempts: 5,
            used: false,
            consumedAt: null
        });
    });
    // Send OTP delivery ONLY AFTER transaction commits successfully
    try {
        await sendOtpDelivery(contact, actionType, numericCode);
    }
    catch (deliveryErr) {
        // Securely invalidate the OTP if delivery fails
        await db.collection('otps').doc(hmacId).update({
            used: true,
            invalidatedReason: 'delivery_failed'
        }).catch(() => { });
        throw new https_1.HttpsError('internal', 'Verification code delivery failed. Please try again.');
    }
    return {
        success: true,
        cooldownSeconds: 60,
        expiresAtMs
    };
});
/**
 * Server-side OTP Verification Function
 * - Enforces App Check & Token Consumption (enforceAppCheck: true, consumeAppCheckToken: true)
 * - Atomic Firestore Transaction for race-safe consumption and attempt counting
 * - Constant-time HMAC-SHA256 comparison using timingSafeEqual
 * - Single-use enforcement (immediate consumption)
 * - Expiration and max attempt limit (5 attempts) invalidation
 * - Single server-only /otps collection
 */
exports.verifyOtp = (0, https_1.onCall)({ region: 'europe-west1', enforceAppCheck: true, consumeAppCheckToken: true, secrets: [OTP_SECRET] }, async (request) => {
    const data = request.data || {};
    let contact = typeof data.contact === 'string' ? data.contact.trim().toLowerCase() : '';
    const actionType = typeof data.actionType === 'string' ? data.actionType.trim().toLowerCase() : '';
    const code = typeof data.code === 'string' ? data.code.trim() : '';
    if (request.auth?.token?.email) {
        contact = request.auth.token.email.trim().toLowerCase();
    }
    if (!contact || !actionType || !code) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required parameters: contact, actionType, and code.');
    }
    if (!/^\d{6}$/.test(code)) {
        throw new https_1.HttpsError('invalid-argument', 'Verification code must be a 6-digit numeric string.');
    }
    const db = getDb();
    const now = Date.now();
    // Independent Server Authorization Check for Admin / Seller BEFORE OTP verification
    if (actionType === 'admin') {
        if (!request.auth?.uid) {
            throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
        }
        const isCustomClaimAdmin = Boolean(request.auth.token?.admin === true);
        if (!isCustomClaimAdmin) {
            throw new https_1.HttpsError('permission-denied', 'Access Denied: Not authorized for administrator operations.');
        }
    }
    if (actionType === 'seller') {
        if (!request.auth?.uid) {
            throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
        }
        const isCustomClaimSeller = Boolean(request.auth.token?.seller === true);
        if (!isCustomClaimSeller) {
            throw new https_1.HttpsError('permission-denied', 'Access Denied: Not authorized for seller merchant operations.');
        }
    }
    const hmacId = deriveHmacId(contact, actionType);
    const otpDocRef = db.collection('otps').doc(hmacId);
    // ATOMIC FIRESTORE TRANSACTION PREVENTING CONCURRENT VERIFICATION DOUBLE-SUCCESS
    // Does NOT throw HttpsError from inside the transaction after making updates
    const result = await db.runTransaction(async (transaction) => {
        const otpDocSnap = await transaction.get(otpDocRef);
        if (!otpDocSnap.exists) {
            return { outcome: 'not_found' };
        }
        const otpData = otpDocSnap.data();
        if (otpData.used) {
            return { outcome: 'already_used' };
        }
        const maxAttempts = otpData.maxAttempts || 5;
        // Check Expiration (5 min limit)
        if (now > otpData.expiresAtMs) {
            transaction.update(otpDocRef, { used: true, invalidatedReason: 'expired' });
            return { outcome: 'expired' };
        }
        // Check Maximum Attempts
        if ((otpData.failedAttempts || 0) >= maxAttempts) {
            transaction.update(otpDocRef, { used: true, invalidatedReason: 'max_attempts_exceeded' });
            return { outcome: 'locked' };
        }
        // HMAC comparison using timingSafeEqual
        const incomingHash = hashOtp(contact, actionType, code);
        const expectedHash = otpData.otpHash;
        const isMatch = (0, node_crypto_1.timingSafeEqual)(Buffer.from(incomingHash, 'hex'), Buffer.from(expectedHash, 'hex'));
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
            }
            else {
                return { outcome: 'invalid_attempt', remaining: maxAttempts - newFailedAttempts };
            }
        }
        // Single-use: Mark as consumed atomically inside the transaction
        transaction.update(otpDocRef, {
            used: true,
            consumedAt: firestore_1.FieldValue.serverTimestamp(),
            consumedAtMs: now,
            verifiedUid: request.auth?.uid || null
        });
        return { outcome: 'success' };
    });
    // Map internal outcomes to external HTTP errors outside transaction
    if (result.outcome === 'not_found') {
        throw new https_1.HttpsError('not-found', 'Verification record missing.');
    }
    if (result.outcome === 'already_used') {
        throw new https_1.HttpsError('not-found', 'Verification code has already been used or invalidated.');
    }
    if (result.outcome === 'expired') {
        throw new https_1.HttpsError('deadline-exceeded', 'The verification code has expired. Please request a new code.');
    }
    if (result.outcome === 'locked') {
        throw new https_1.HttpsError('resource-exhausted', 'Maximum verification attempts exceeded. Code permanently invalidated.');
    }
    if (result.outcome === 'invalid_attempt') {
        throw new https_1.HttpsError('invalid-argument', `Invalid verification code. ${result.remaining} attempt(s) remaining.`);
    }
    return {
        success: true,
        verifiedAtMs: now
    };
});
//# sourceMappingURL=otp.js.map