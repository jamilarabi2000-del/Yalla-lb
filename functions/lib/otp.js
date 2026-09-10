"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.requestOtp = void 0;
exports.deriveHmacId = deriveHmacId;
exports.hashOtp = hashOtp;
exports.normalizeContact = normalizeContact;
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
const TWILIO_ACCOUNT_SID = (0, params_1.defineSecret)('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = (0, params_1.defineSecret)('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = (0, params_1.defineSecret)('TWILIO_PHONE_NUMBER');
/**
 * Retrieve server-side HMAC secret for cryptographic OTP hashing.
 * In production, requires Secret Manager OTP_SECRET.
 * In test/emulator environments, uses deterministic test secret.
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
        // Parameter not loaded via Secret Manager runtime
    }
    if (!secret) {
        secret = process.env.OTP_SECRET || '';
    }
    if (!secret) {
        throw new https_1.HttpsError('failed-precondition', 'Security configuration error: OTP_SECRET is not configured.');
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
 * Detect whether contact is email or phone, normalize phone numbers (including Lebanese +961),
 * and reject malformed contacts.
 */
function normalizeContact(input) {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > 128) {
        throw new https_1.HttpsError('invalid-argument', 'A valid contact identifier is required.');
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
            throw new https_1.HttpsError('invalid-argument', 'Invalid Lebanese phone number format.');
        }
        return { type: 'phone', value: cleaned };
    }
    if (cleaned.startsWith('961') && cleaned.length >= 10 && cleaned.length <= 12) {
        const localPart = cleaned.slice(3);
        if (!/^\d{7,8}$/.test(localPart)) {
            throw new https_1.HttpsError('invalid-argument', 'Invalid Lebanese phone number format.');
        }
        return { type: 'phone', value: '+' + cleaned };
    }
    if (cleaned.startsWith('0') && cleaned.length >= 8 && cleaned.length <= 9) {
        const localPart = cleaned.slice(1);
        if (!/^\d{7,8}$/.test(localPart)) {
            throw new https_1.HttpsError('invalid-argument', 'Invalid phone number format.');
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
    throw new https_1.HttpsError('invalid-argument', 'Invalid email address or phone number.');
}
/**
 * Dispatch SMS via real production SMS provider (Twilio).
 * Credentials loaded securely from Secret Manager or environment variables.
 * Fails closed if credentials are missing or if Twilio returns a non-2xx response.
 */
async function sendSmsOtp(phone, actionType, numericCode) {
    let accountSid = '';
    let authToken = '';
    let fromNumber = '';
    try {
        accountSid = process.env.TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID.value();
    }
    catch {
        accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    }
    try {
        authToken = process.env.TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN.value();
    }
    catch {
        authToken = process.env.TWILIO_AUTH_TOKEN || '';
    }
    try {
        fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || TWILIO_PHONE_NUMBER.value();
    }
    catch {
        fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || '';
    }
    if (!accountSid || !authToken || !fromNumber) {
        if (process.env.NODE_ENV === 'test' || process.env.FUNCTIONS_EMULATOR === 'true' || process.env.VITEST === 'true') {
            return; // Allow simulated test/emulator execution
        }
        throw new https_1.HttpsError('failed-precondition', 'SMS verification service is not configured. Please try again later.');
    }
    const messageBody = `Your Yalla Lebanon verification code is ${numericCode}. Valid for 5 minutes.`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const bodyParams = new URLSearchParams();
    bodyParams.append('To', phone);
    bodyParams.append('From', fromNumber);
    bodyParams.append('Body', messageBody);
    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: bodyParams.toString()
        });
    }
    catch (networkErr) {
        console.error('[SMS Dispatch] Twilio network fetch failed');
        throw new https_1.HttpsError('internal', "We couldn't send the verification code. Please try again.");
    }
    if (!response.ok) {
        console.warn(`[SMS Dispatch] Twilio returned HTTP status ${response.status}`);
        throw new https_1.HttpsError('internal', "We couldn't send the verification code. Please try again.");
    }
}
/**
 * Dispatch Email via Resend or SendGrid.
 * Fails closed if credentials are missing or if the provider returns a non-2xx response.
 */
async function sendEmailOtp(email, actionType, numericCode) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (resendApiKey) {
        let sender = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
        if (sender.includes('@gmail.com') || sender.includes('@yahoo.com') || sender.includes('@hotmail.com') || sender.includes('@outlook.com')) {
            sender = 'onboarding@resend.dev';
        }
        let response;
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
        }
        catch (networkErr) {
            console.error('[Email Dispatch] Resend network fetch failed');
            throw new https_1.HttpsError('internal', "We couldn't send the verification code. Please try again.");
        }
        if (!response.ok) {
            console.warn(`[Email Dispatch] Resend returned HTTP status ${response.status}`);
            throw new https_1.HttpsError('internal', "We couldn't send the verification code. Please try again.");
        }
        return;
    }
    if (sendgridKey) {
        let response;
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
        }
        catch (networkErr) {
            console.error('[Email Dispatch] SendGrid network fetch failed');
            throw new https_1.HttpsError('internal', "We couldn't send the verification code. Please try again.");
        }
        if (!response.ok) {
            console.warn(`[Email Dispatch] SendGrid returned HTTP status ${response.status}`);
            throw new https_1.HttpsError('internal', "We couldn't send the verification code. Please try again.");
        }
        return;
    }
    if (process.env.NODE_ENV === 'test' || process.env.FUNCTIONS_EMULATOR === 'true' || process.env.VITEST === 'true') {
        return; // Allow simulated test/emulator execution
    }
    throw new https_1.HttpsError('failed-precondition', 'Verification service is temporarily unavailable. Please try again later.');
}
/**
 * Dispatch OTP via real production email/SMS delivery abstraction.
 */
async function sendOtpDelivery(contactObj, actionType, numericCode) {
    if (contactObj.type === 'phone') {
        await sendSmsOtp(contactObj.value, actionType, numericCode);
    }
    else {
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
exports.requestOtp = (0, https_1.onCall)({
    region: 'europe-west1',
    enforceAppCheck: true,
    consumeAppCheckToken: true,
    secrets: [OTP_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]
}, async (request) => {
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
    const hmacId = deriveHmacId(contact, actionType);
    const rateLimitRef = db.collection('otp_rate_limits').doc(hmacId);
    // 1. Check Cooldown & Sliding Window Rate Limit inside a read-only check (or transaction check)
    // without permanently committing yet until delivery is confirmed.
    await db.runTransaction(async (transaction) => {
        const rateLimitSnap = await transaction.get(rateLimitRef);
        if (rateLimitSnap.exists) {
            const rlData = rateLimitSnap.data();
            const cooldownUntilMs = rlData.cooldownUntilMs || 0;
            let requests = Array.isArray(rlData.requests) ? rlData.requests : [];
            if (now < cooldownUntilMs) {
                const remainingSecs = Math.ceil((cooldownUntilMs - now) / 1000);
                throw new https_1.HttpsError('resource-exhausted', `Resend cooldown active. Please wait ${remainingSecs} second(s) before requesting a new code.`);
            }
            const fifteenMinsAgo = now - 15 * 60 * 1000;
            requests = requests.filter((ts) => ts > fifteenMinsAgo);
            if (requests.length >= 5) {
                throw new https_1.HttpsError('resource-exhausted', 'Maximum OTP request rate limit reached. Please wait 15 minutes before trying again.');
            }
        }
    });
    // 2. Generate secure code and hash
    const numericCode = (0, node_crypto_1.randomInt)(100000, 1000000).toString();
    const otpHash = hashOtp(contact, actionType, numericCode);
    const expiresAtMs = now + 5 * 60 * 1000;
    const newOtpRef = db.collection('otps').doc(hmacId);
    // 3. Attempt delivery BEFORE permanently consuming the rate limit slot or saving OTP
    try {
        await sendOtpDelivery(contactObj, actionType, numericCode);
    }
    catch (deliveryErr) {
        if (deliveryErr instanceof https_1.HttpsError) {
            throw deliveryErr;
        }
        console.error('[OTP Delivery Error]: Sanitized delivery exception occurred for action:', actionType);
        throw new https_1.HttpsError('internal', "We couldn't send the verification code. Please try again.");
    }
    // 4. Delivery succeeded! Now commit rate limit update and save OTP record atomically
    await db.runTransaction(async (transaction) => {
        const rateLimitSnap = await transaction.get(rateLimitRef);
        let requests = [];
        if (rateLimitSnap.exists) {
            const rlData = rateLimitSnap.data();
            requests = Array.isArray(rlData.requests) ? rlData.requests : [];
        }
        const fifteenMinsAgo = now - 15 * 60 * 1000;
        requests = requests.filter((ts) => ts > fifteenMinsAgo);
        requests.push(now);
        const newCooldownUntilMs = now + 60 * 1000;
        transaction.set(rateLimitRef, {
            actionType,
            cooldownUntilMs: newCooldownUntilMs,
            requests,
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
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
    return {
        success: true,
        cooldownSeconds: 60,
        expiresAtMs
    };
});
/**
 * Server-side OTP Verification Function
 */
exports.verifyOtp = (0, https_1.onCall)({
    region: 'europe-west1',
    enforceAppCheck: true,
    consumeAppCheckToken: true,
    secrets: [OTP_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]
}, async (request) => {
    const data = request.data || {};
    let rawContact = typeof data.contact === 'string' ? data.contact : '';
    const actionType = typeof data.actionType === 'string' ? data.actionType.trim().toLowerCase() : '';
    const code = typeof data.code === 'string' ? data.code.trim() : '';
    if (request.auth?.token?.email) {
        rawContact = request.auth.token.email;
    }
    if (!rawContact || !actionType || !code) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required parameters: contact, actionType, and code.');
    }
    if (!/^\d{6}$/.test(code)) {
        throw new https_1.HttpsError('invalid-argument', 'Verification code must be a 6-digit numeric string.');
    }
    const contactObj = normalizeContact(rawContact);
    const contact = contactObj.value;
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
        transaction.update(otpDocRef, {
            used: true,
            consumedAt: firestore_1.FieldValue.serverTimestamp(),
            consumedAtMs: now,
            verifiedUid: request.auth?.uid || null
        });
        return { outcome: 'success' };
    });
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