import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { normalizePhoneNumber } from '../functions/src/checkPhone';

describe('Firebase Authentication SMS Multi-Factor Authentication (MFA)', () => {
  const rootDir = process.cwd();

  it('1. AdminGuard uses official Firebase Authentication MFA APIs', () => {
    const adminGuardPath = path.resolve(rootDir, 'src/components/AdminGuard.tsx');
    const content = fs.readFileSync(adminGuardPath, 'utf-8');

    expect(content).toContain('multiFactor');
    expect(content).toContain('PhoneAuthProvider');
    expect(content).toContain('PhoneMultiFactorGenerator');
    expect(content).toContain('RecaptchaVerifier');
    expect(content).toContain('getMultiFactorResolver');
    expect(content).toContain('resolveSignIn');
  });

  it('2. AdminGuard never calls legacy custom OTP Cloud Functions (requestOtp, verifyOtp, sendOtp)', () => {
    const adminGuardPath = path.resolve(rootDir, 'src/components/AdminGuard.tsx');
    const content = fs.readFileSync(adminGuardPath, 'utf-8');

    expect(content).not.toContain("httpsCallable(functionsInstance, 'requestOtp')");
    expect(content).not.toContain("httpsCallable(functionsInstance, 'verifyOtp')");
    expect(content).not.toContain("httpsCallable(functionsInstance, 'sendOtp')");
  });

  it('3. AdminGuard does not contain hard-coded testing OTP bypass codes', () => {
    const adminGuardPath = path.resolve(rootDir, 'src/components/AdminGuard.tsx');
    const content = fs.readFileSync(adminGuardPath, 'utf-8');

    // Ensure no testing codes like 123456
    expect(content).not.toContain('Testing code: 123456');
    expect(content).not.toContain('123456');
    expect(content).not.toContain('fallback-dev');
  });

  it('4. Custom OTP Cloud Functions file functions/src/otp.ts is deleted', () => {
    const otpFilePath = path.resolve(rootDir, 'functions/src/otp.ts');
    expect(fs.existsSync(otpFilePath)).toBe(false);
  });

  it('5. Cloud Functions index does not export requestOtp or verifyOtp', () => {
    const indexFilePath = path.resolve(rootDir, 'functions/src/index.ts');
    const content = fs.readFileSync(indexFilePath, 'utf-8');

    expect(content).not.toContain('requestOtp');
    expect(content).not.toContain('verifyOtp');
    expect(content).toContain('checkPhoneAvailability');
    expect(content).toContain('recordAdminStepUp');
  });

  it('6. Third-party SMS providers (Twilio, SendGrid, Resend) are completely removed from Cloud Functions', () => {
    const functionsSrcDir = path.resolve(rootDir, 'functions/src');
    const files = fs.readdirSync(functionsSrcDir);

    for (const file of files) {
      if (file.endsWith('.ts')) {
        const fileContent = fs.readFileSync(path.join(functionsSrcDir, file), 'utf-8');
        expect(fileContent.toLowerCase()).not.toContain('twilio');
        expect(fileContent.toLowerCase()).not.toContain('sendgrid');
        expect(fileContent.toLowerCase()).not.toContain('resend');
        expect(fileContent).not.toContain('OTP_SECRET');
        expect(fileContent).not.toContain('sms_queue');
      }
    }
  });

  it('7. Environment example does not contain third-party SMS or email delivery credentials', () => {
    const envExamplePath = path.resolve(rootDir, '.env.example');
    const content = fs.readFileSync(envExamplePath, 'utf-8');

    expect(content).not.toContain('RESEND_API_KEY');
    expect(content).not.toContain('SENDGRID_API_KEY');
    expect(content).not.toContain('TWILIO');
    expect(content).not.toContain('OTP_SECRET');
  });

  it('8. Firestore rules strictly forbid otps collection access and omit legacy rate limits', () => {
    const rulesPath = path.resolve(rootDir, 'firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf-8');

    expect(content).toMatch(/match\s+\/otps\/\{otpId\}\s*\{[\s\S]*?allow\s+read,\s*write:\s*if\s+false;/);
    expect(content).not.toContain('match /otp_rate_limits/{');
  });

  it('9. Firebase blueprint does not contain OTP entity or /otps path', () => {
    const blueprintPath = path.resolve(rootDir, 'firebase-blueprint.json');
    const content = fs.readFileSync(blueprintPath, 'utf-8');

    expect(content).not.toContain('"OTP":');
    expect(content).not.toContain('"/otps/');
  });

  it('10. Firebase Web Authentication SDK exports all required MFA modules', async () => {
    const firebaseModule = await import('../src/firebase');

    expect(firebaseModule.multiFactor).toBeDefined();
    expect(firebaseModule.PhoneAuthProvider).toBeDefined();
    expect(firebaseModule.PhoneMultiFactorGenerator).toBeDefined();
    expect(firebaseModule.RecaptchaVerifier).toBeDefined();
    expect(firebaseModule.getMultiFactorResolver).toBeDefined();
  });

  it('11. Lebanese phone normalization in checkPhone formats correctly', () => {
    expect(normalizePhoneNumber('03123456')).toBe('+9613123456');
    expect(normalizePhoneNumber('70 123 456')).toBe('+96170123456');
    expect(normalizePhoneNumber('+961 71 123 456')).toBe('+96171123456');
    expect(normalizePhoneNumber('00961 76 123 456')).toBe('+96176123456');

    expect(() => normalizePhoneNumber('123')).toThrow('Invalid Lebanese phone number format.');
    expect(() => normalizePhoneNumber('')).toThrow('Phone number is required.');
  });

  it('12. AdminGuard strictly verifies admin claim and never assigns client-side claims', () => {
    const adminGuardPath = path.resolve(rootDir, 'src/components/AdminGuard.tsx');
    const content = fs.readFileSync(adminGuardPath, 'utf-8');

    expect(content).not.toContain('claims.admin = true');
    expect(content).not.toContain('admin: true');
    expect(content).not.toContain('localStorage.setItem("isAdmin"');
  });

  it('13. recordAdminStepUp enforces authenticated administrator custom claim', () => {
    const checkPhonePath = path.resolve(rootDir, 'functions/src/checkPhone.ts');
    const content = fs.readFileSync(checkPhonePath, 'utf-8');

    expect(content).toContain('recordAdminStepUp');
    expect(content).toContain('request.auth.token.admin !== true');
    expect(content).toContain('permission-denied');
  });
});
