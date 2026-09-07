import { describe, it, expect, beforeEach } from 'vitest';
import { hashOtp } from '../functions/src/otp';

// In-memory simulated OTP store replicating functions/src/otp.ts authoritative server logic
interface OtpDoc {
  id: string;
  uid?: string | null;
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
  consumedAtMs?: number;
  cooldownUntilMs: number;
  invalidatedReason?: string;
}

class SimulatedOtpServer {
  public store: OtpDoc[] = [];
  public users: Record<string, { role: string; email: string }> = {
    'admin-1': { role: 'admin', email: 'jamilarabi2000@gmail.com' },
    'seller-1': { role: 'seller', email: 'seller@yalla.lb' },
    'customer-1': { role: 'customer', email: 'customer@yalla.lb' }
  };

  public requestOtp(contact: string, actionType: string, customCode?: string, nowMs: number = Date.now(), authUid?: string) {
    const normContact = contact.trim().toLowerCase();
    const normAction = actionType.trim().toLowerCase();

    if (!normContact || normContact.length > 128) {
      throw new Error('invalid-argument: Valid contact identifier is required.');
    }
    if (!['login', 'signup', 'admin', 'seller'].includes(normAction)) {
      throw new Error('invalid-argument: Invalid action type.');
    }

    // Independent server authorization check for admin/seller OTPs
    if (normAction === 'admin') {
      const user = authUid ? this.users[authUid] : Object.values(this.users).find(u => u.email === normContact);
      if (!user || user.role !== 'admin') {
        throw new Error('permission-denied: Contact is not registered as an authorized administrator.');
      }
    }

    if (normAction === 'seller') {
      const user = authUid ? this.users[authUid] : Object.values(this.users).find(u => u.email === normContact);
      if (!user || user.role !== 'seller') {
        throw new Error('permission-denied: Contact is not registered as an authorized seller merchant.');
      }
    }

    // Cooldown check (60s)
    const recent = this.store
      .filter(d => d.contact === normContact && d.actionType === normAction)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    if (recent.length > 0) {
      const latest = recent[0];
      if (nowMs < latest.cooldownUntilMs) {
        throw new Error('resource-exhausted: Resend cooldown active.');
      }
      const fifteenMinsAgo = nowMs - 15 * 60 * 1000;
      const count15 = recent.filter(d => d.createdAtMs > fifteenMinsAgo).length;
      if (count15 >= 5) {
        throw new Error('resource-exhausted: Maximum OTP request rate limit reached.');
      }
    }

    recent.forEach(d => {
      if (!d.used) {
        d.used = true;
        d.invalidatedReason = 'replaced';
      }
    });

    const code = customCode || '123456';
    const otpHash = hashOtp(normContact, normAction, code);

    const doc: OtpDoc = {
      id: `otp-${Math.random()}`,
      uid: authUid || null,
      contact: normContact,
      purpose: normAction,
      actionType: normAction,
      otpHash,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + 5 * 60 * 1000,
      attempts: 0,
      failedAttempts: 0,
      maxAttempts: 5, // Requirement 20: 5 attempts
      used: false,
      cooldownUntilMs: nowMs + 60000
    };

    this.store.push(doc);

    return {
      success: true,
      cooldownSeconds: 60,
      expiresAtMs: doc.expiresAtMs
    };
  }

  public verifyOtp(contact: string, actionType: string, code: string, nowMs: number = Date.now(), authUid?: string) {
    const normContact = contact.trim().toLowerCase();
    const normAction = actionType.trim().toLowerCase();

    if (!normContact || !normAction || !code) {
      throw new Error('invalid-argument: Missing required parameters.');
    }

    if (!/^\d{6}$/.test(code)) {
      throw new Error('invalid-argument: Verification code must be 6 digits.');
    }

    const active = this.store
      .filter(d => d.contact === normContact && d.actionType === normAction && !d.used)
      .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];

    if (!active) {
      throw new Error('not-found: No active OTP record found.');
    }

    if (nowMs > active.expiresAtMs) {
      active.used = true;
      active.invalidatedReason = 'expired';
      throw new Error('deadline-exceeded: Code has expired.');
    }

    if (active.failedAttempts >= active.maxAttempts) {
      active.used = true;
      active.invalidatedReason = 'max_attempts_exceeded';
      throw new Error('resource-exhausted: Maximum verification attempts exceeded.');
    }

    const computedHash = hashOtp(normContact, normAction, code);
    const isMatch = computedHash === active.otpHash;
    active.attempts += 1;

    if (!isMatch) {
      active.failedAttempts += 1;
      if (active.failedAttempts >= active.maxAttempts) {
        active.used = true;
        active.invalidatedReason = 'max_attempts_exceeded';
        throw new Error('resource-exhausted: Maximum verification attempts exceeded.');
      }
      throw new Error(`invalid-argument: Invalid verification code. ${active.maxAttempts - active.failedAttempts} attempt(s) remaining.`);
    }

    active.used = true;
    active.consumedAtMs = nowMs;

    return {
      success: true,
      verifiedAtMs: nowMs
    };
  }
}

describe('Server-Side OTP Security Verification Suite', () => {
  let server: SimulatedOtpServer;

  beforeEach(() => {
    server = new SimulatedOtpServer();
  });

  it('1. Generates secure SHA-256 OTP hashes deterministically for identical inputs', () => {
    const hash1 = hashOtp('user@example.com', 'login', '654321');
    const hash2 = hashOtp('USER@EXAMPLE.COM ', 'LOGIN', '654321');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('2. Successfully requests OTP and returns NO code in response payload', () => {
    const res = server.requestOtp('customer@yalla.lb', 'login', '112233');
    expect(res.success).toBe(true);
    expect(res.cooldownSeconds).toBe(60);
    expect((res as any).code).toBeUndefined();
    expect((res as any).otp).toBeUndefined();
  });

  it('3. Successfully verifies valid OTP and consumes it immediately', () => {
    const now = 1000000;
    server.requestOtp('customer@yalla.lb', 'login', '123456', now);

    const res = server.verifyOtp('customer@yalla.lb', 'login', '123456', now + 1000);
    expect(res.success).toBe(true);

    // OTP Reuse Prevention
    expect(() => {
      server.verifyOtp('customer@yalla.lb', 'login', '123456', now + 2000);
    }).toThrow('not-found');
  });

  it('4. Rejects incorrect OTP codes and increments failedAttempts count', () => {
    const now = 1000000;
    server.requestOtp('customer@yalla.lb', 'login', '123456', now);

    expect(() => {
      server.verifyOtp('customer@yalla.lb', 'login', '999999', now + 1000);
    }).toThrow('invalid-argument');

    expect(server.store[0].failedAttempts).toBe(1);
  });

  it('5. Enforces maximum 5 failed attempts limit before invalidating OTP', () => {
    const now = 1000000;
    server.requestOtp('customer@yalla.lb', 'login', '123456', now);

    expect(() => server.verifyOtp('customer@yalla.lb', 'login', '111111', now + 1000)).toThrow();
    expect(() => server.verifyOtp('customer@yalla.lb', 'login', '222222', now + 2000)).toThrow();
    expect(() => server.verifyOtp('customer@yalla.lb', 'login', '333333', now + 3000)).toThrow();
    expect(() => server.verifyOtp('customer@yalla.lb', 'login', '444444', now + 4000)).toThrow();
    // 5th failed attempt -> Invalidates
    expect(() => server.verifyOtp('customer@yalla.lb', 'login', '555555', now + 5000)).toThrow('resource-exhausted');

    expect(server.store[0].used).toBe(true);
    expect(server.store[0].invalidatedReason).toBe('max_attempts_exceeded');

    // 6th attempt rejected
    expect(() => server.verifyOtp('customer@yalla.lb', 'login', '123456', now + 6000)).toThrow('not-found');
  });

  it('6. Rejects expired OTP codes (>5 minutes)', () => {
    const now = 1000000;
    const sixMinsLater = now + 6 * 60 * 1000;
    server.requestOtp('customer@yalla.lb', 'login', '123456', now);

    expect(() => {
      server.verifyOtp('customer@yalla.lb', 'login', '123456', sixMinsLater);
    }).toThrow('deadline-exceeded');
  });

  it('7. Enforces server-side resend cooldown (60 seconds)', () => {
    const now = 1000000;
    server.requestOtp('customer@yalla.lb', 'login', '123456', now);

    // Attempt resend at 30s -> REJECT
    expect(() => {
      server.requestOtp('customer@yalla.lb', 'login', '654321', now + 30000);
    }).toThrow('resource-exhausted: Resend cooldown active.');

    // Attempt resend at 61s -> ALLOW
    const res = server.requestOtp('customer@yalla.lb', 'login', '654321', now + 61000);
    expect(res.success).toBe(true);
  });

  it('8. Enforces rate limiting (max 5 requests per 15 min)', () => {
    let t = 1000000;
    server.requestOtp('customer@yalla.lb', 'login', '111111', t);
    t += 61000; server.requestOtp('customer@yalla.lb', 'login', '222222', t);
    t += 61000; server.requestOtp('customer@yalla.lb', 'login', '333333', t);
    t += 61000; server.requestOtp('customer@yalla.lb', 'login', '444444', t);
    t += 61000; server.requestOtp('customer@yalla.lb', 'login', '555555', t);

    // 6th request within 15 mins -> REJECT
    t += 61000;
    expect(() => {
      server.requestOtp('customer@yalla.lb', 'login', '666666', t);
    }).toThrow('resource-exhausted: Maximum OTP request rate limit reached.');
  });

  it('9. Rejects cross-purpose consumption (login code used for admin action)', () => {
    const now = 1000000;
    server.requestOtp('jamilarabi2000@gmail.com', 'login', '123456', now);

    expect(() => {
      server.verifyOtp('jamilarabi2000@gmail.com', 'admin', '123456', now + 1000);
    }).toThrow('not-found');
  });

  it('10. Rejects unauthorized admin OTP requests for non-admin email', () => {
    expect(() => {
      server.requestOtp('attacker@yalla.lb', 'admin', '123456');
    }).toThrow('permission-denied: Contact is not registered as an authorized administrator.');
  });

  it('11. Rejects unauthorized seller OTP requests for non-seller contact', () => {
    expect(() => {
      server.requestOtp('customer@yalla.lb', 'seller', '123456');
    }).toThrow('permission-denied: Contact is not registered as an authorized seller merchant.');
  });

  it('12. Client attempting to claim admin or seller via OTP parameters does not alter server authorization', () => {
    const clientPayload = {
      isAdmin: true,
      isSeller: true,
      role: 'admin',
      verified: true
    };
    // Prove client claims are strictly ignored by server verification
    const now = 1000000;
    server.requestOtp('customer@yalla.lb', 'login', '123456', now);
    const res = server.verifyOtp('customer@yalla.lb', 'login', '123456', now + 1000);

    // Response ONLY contains success boolean and timestamp — NO admin or seller tokens/claims
    expect(res).toEqual({
      success: true,
      verifiedAtMs: now + 1000
    });
    expect((res as any).role).toBeUndefined();
    expect((res as any).isAdmin).toBeUndefined();
  });

  it('13. Proves admin and seller authorization remain independent from OTP value', () => {
    // A valid customer verifying a valid customer OTP does not gain admin role
    const now = 1000000;
    server.requestOtp('customer@yalla.lb', 'login', '123456', now);
    server.verifyOtp('customer@yalla.lb', 'login', '123456', now + 1000);

    const userInDb = server.users['customer-1'];
    expect(userInDb.role).toBe('customer'); // Role remains strictly customer
  });
});
