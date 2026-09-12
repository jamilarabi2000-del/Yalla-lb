import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { normalizePhoneNumber } from '../functions/src/checkPhone';

describe('Admin Server-Authoritative Email OTP Multi-Factor Authentication', () => {
  const rootDir = process.cwd();

  it('1. AdminGuard uses server-authoritative Admin Email OTP functions', () => {
    const adminGuardPath = path.resolve(rootDir, 'src/components/AdminGuard.tsx');
    const content = fs.readFileSync(adminGuardPath, 'utf-8');

    expect(content).toContain('requestAdminEmailOtp');
    expect(content).toContain('verifyAdminEmailOtp');
    expect(content).not.toContain('PhoneMultiFactorGenerator');
    expect(content).not.toContain('MFA Enrollment Required');
    expect(content).not.toContain('enrollPhone');
  });

  it('2. Cloud Functions index exports requestAdminEmailOtp and verifyAdminEmailOtp', () => {
    const indexFilePath = path.resolve(rootDir, 'functions/src/index.ts');
    const content = fs.readFileSync(indexFilePath, 'utf-8');

    expect(content).toContain('requestAdminEmailOtp');
    expect(content).toContain('verifyAdminEmailOtp');
    expect(content).toContain('checkPhoneAvailability');
    expect(content).toContain('recordAdminStepUp');
  });

  it('3. Admin OTP Cloud Function enforces admin custom claims and hashes OTP with salt', () => {
    const adminOtpPath = path.resolve(rootDir, 'functions/src/adminOtp.ts');
    expect(fs.existsSync(adminOtpPath)).toBe(true);

    const content = fs.readFileSync(adminOtpPath, 'utf-8');
    expect(content).toContain('request.auth.token.admin !== true');
    expect(content).toContain('request.auth.token.email');
    expect(content).toContain('sha256');
    expect(content).toContain('randomInt');
    expect(content).toContain('timingSafeEqual');
    expect(content).toContain('MAX_ATTEMPTS');
  });

  it('4. AdminGuard does not contain hard-coded testing OTP bypass codes', () => {
    const adminGuardPath = path.resolve(rootDir, 'src/components/AdminGuard.tsx');
    const content = fs.readFileSync(adminGuardPath, 'utf-8');

    expect(content).not.toContain('Testing code: 123456');
    expect(content).not.toContain('fallback-dev');
  });

  it('5. Third-party SMS providers (Twilio) are completely removed from Cloud Functions', () => {
    const functionsSrcDir = path.resolve(rootDir, 'functions/src');
    const files = fs.readdirSync(functionsSrcDir);

    for (const file of files) {
      if (file.endsWith('.ts')) {
        const fileContent = fs.readFileSync(path.join(functionsSrcDir, file), 'utf-8');
        expect(fileContent.toLowerCase()).not.toContain('twilio');
        expect(fileContent).not.toContain('OTP_SECRET');
        expect(fileContent).not.toContain('sms_queue');
      }
    }
  });

  it('6. Firestore rules strictly forbid direct client read/write to admin_otps and admin_stepup', () => {
    const rulesPath = path.resolve(rootDir, 'firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf-8');

    expect(content).toMatch(/match\s+\/admin_otps\/\{docId\}\s*\{[\s\S]*?allow\s+read,\s*write:\s*if\s+false;/);
    expect(content).toMatch(/match\s+\/admin_stepup\/\{uid\}\s*\{[\s\S]*?allow\s+read,\s*write:\s*if\s+false;/);
  });

  it('7. Firebase blueprint does not contain client-writable OTP entity', () => {
    const blueprintPath = path.resolve(rootDir, 'firebase-blueprint.json');
    const content = fs.readFileSync(blueprintPath, 'utf-8');

    expect(content).not.toContain('"OTP":');
    expect(content).not.toContain('"/otps/');
  });

  it('8. Lebanese phone normalization in checkPhone formats correctly', () => {
    expect(normalizePhoneNumber('03123456')).toBe('+9613123456');
    expect(normalizePhoneNumber('70 123 456')).toBe('+96170123456');
    expect(normalizePhoneNumber('+961 71 123 456')).toBe('+96171123456');
    expect(normalizePhoneNumber('00961 76 123 456')).toBe('+96176123456');

    expect(() => normalizePhoneNumber('123')).toThrow('Invalid Lebanese phone number format.');
    expect(() => normalizePhoneNumber('')).toThrow('Phone number is required.');
  });

  it('9. AdminGuard strictly verifies admin claim and never assigns client-side claims', () => {
    const adminGuardPath = path.resolve(rootDir, 'src/components/AdminGuard.tsx');
    const content = fs.readFileSync(adminGuardPath, 'utf-8');

    expect(content).not.toContain('claims.admin = true');
    expect(content).not.toContain('admin: true');
    expect(content).not.toContain('localStorage.setItem("isAdmin"');
  });

  it('10. recordAdminStepUp enforces authenticated administrator custom claim', () => {
    const checkPhonePath = path.resolve(rootDir, 'functions/src/checkPhone.ts');
    const content = fs.readFileSync(checkPhonePath, 'utf-8');

    expect(content).toContain('recordAdminStepUp');
    expect(content).toContain('request.auth.token.admin !== true');
    expect(content).toContain('permission-denied');
  });
});
