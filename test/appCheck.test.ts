import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('App Check & reCAPTCHA Enterprise Security Suite', () => {
  it('ensures src/firebase.ts initializes App Check using ReCaptchaEnterpriseProvider and debug token', () => {
    const firebaseTsPath = path.resolve(process.cwd(), 'src/firebase.ts');
    const content = fs.readFileSync(firebaseTsPath, 'utf-8');

    expect(content).toContain('initializeAppCheck');
    expect(content).toContain('ReCaptchaEnterpriseProvider');
    expect(content).toContain('FIREBASE_APPCHECK_DEBUG_TOKEN');
    expect(content).not.toContain('[Firebase] App Check disabled.');
  });

  it('ensures OTPModal requests limited-use App Check tokens for requestOtp and verifyOtp', () => {
    const otpModalPath = path.resolve(process.cwd(), 'src/components/OTPModal.tsx');
    const content = fs.readFileSync(otpModalPath, 'utf-8');

    expect(content).toContain('limitedUseAppCheckTokens: true');
  });

  it('ensures backend functions enforce App Check and consume tokens', () => {
    const otpBackendPath = path.resolve(process.cwd(), 'functions/src/otp.ts');
    const content = fs.readFileSync(otpBackendPath, 'utf-8');

    expect(content).toContain('enforceAppCheck: true');
    expect(content).toContain('consumeAppCheckToken: true');
  });
});
