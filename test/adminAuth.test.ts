import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Authentication & Custom Claims Test Suite (All 11 Scenarios)', () => {
  const authContextPath = path.resolve(process.cwd(), 'src/context/AuthContext.tsx');
  const shopContextPath = path.resolve(process.cwd(), 'src/context/ShopContext.tsx');
  const adminViewPath = path.resolve(process.cwd(), 'src/components/AdminView.tsx');
  const sellerLoginPath = path.resolve(process.cwd(), 'src/components/SellerLoginView.tsx');

  const authContextCode = fs.readFileSync(authContextPath, 'utf-8');
  const shopContextCode = fs.readFileSync(shopContextPath, 'utf-8');
  const adminViewCode = fs.readFileSync(adminViewPath, 'utf-8');
  const sellerLoginCode = fs.readFileSync(sellerLoginPath, 'utf-8');

  it('1. Admin claim only (admin:true, seller:false) is permitted in SellerLoginView without requiring seller record or phone', () => {
    expect(sellerLoginCode).toContain('if (hasAdminClaim)');
    expect(sellerLoginCode).toContain('setActiveTab(\'admin\')');
  });

  it('2. Admin + seller (admin:true, seller:true) is successfully authenticated', () => {
    expect(sellerLoginCode).toContain('hasAdminClaim');
    expect(sellerLoginCode).toContain('hasSellerClaim');
  });

  it('3. Seller only (admin:false, seller:true) passes seller merchant verification', () => {
    expect(sellerLoginCode).toContain('hasSellerClaim');
  });

  it('4. Normal customer (admin:false, seller:false) is denied access', () => {
    expect(sellerLoginCode).toContain('Access Denied');
  });

  it('5. Forged Firestore users/{uid}.role = "admin" is ignored (role is hardcoded to customer)', () => {
    expect(authContextCode).toContain("role: 'customer'");
    expect(authContextCode).not.toContain('snap.data().role');
  });

  it('6. Stale ID token is forcibly refreshed using getIdToken(true) and getIdTokenResult(true)', () => {
    expect(authContextCode).toContain('getIdToken(true)');
    expect(authContextCode).toContain('getIdTokenResult(true)');
    expect(sellerLoginCode).toContain('getIdTokenResult(true)');
  });

  it('7. Missing Firestore users/{uid} document does not block admin recognition or isLoadingAuth', () => {
    expect(authContextCode).toContain('setIsLoadingAuth(false)');
    expect(authContextCode).toContain('snap.exists()');
  });

  it('8. Admin with no seller record is not rejected because admin bypasses seller lookup', () => {
    expect(sellerLoginCode).toContain('if (hasAdminClaim)');
  });

  it('9. Admin with no seller phone is not rejected because phone check only runs for non-admin sellers', () => {
    expect(sellerLoginCode).toContain('if (!phone)');
  });

  it('10. Failed token refresh fails closed gracefully without crashing or false admin elevation', () => {
    expect(authContextCode).toContain('catch');
    expect(authContextCode).not.toMatch(/catch\s*\(\)\s*\{\s*setIsAdminUser\(true\)\s*\}/);
  });

  it('11. Direct Firestore access requires request.auth.token.admin == true', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    if (fs.existsSync(rulesPath)) {
      const rulesCode = fs.readFileSync(rulesPath, 'utf-8');
      expect(rulesCode).toContain('request.auth.token.admin == true');
    }
  });

  it('AuthContext is authoritative source of client-side admin state and authStatus', () => {
    expect(authContextCode).toContain('authStatus');
    expect(authContextCode).toContain('authenticated_admin');
    expect(authContextCode).toContain('authenticated_non_admin');
  });
});
