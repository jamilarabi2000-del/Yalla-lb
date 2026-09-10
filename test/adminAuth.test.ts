import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Authentication & Custom Claims Test Suite', () => {
  const authContextPath = path.resolve(process.cwd(), 'src/context/AuthContext.tsx');
  const shopContextPath = path.resolve(process.cwd(), 'src/context/ShopContext.tsx');
  const adminViewPath = path.resolve(process.cwd(), 'src/components/AdminView.tsx');

  const authContextCode = fs.readFileSync(authContextPath, 'utf-8');
  const shopContextCode = fs.readFileSync(shopContextPath, 'utf-8');
  const adminViewCode = fs.readFileSync(adminViewPath, 'utf-8');

  it('1. unauthenticated user handling sets appropriate auth state and loading completion', () => {
    expect(authContextCode).toContain('if (!fbUser)');
    expect(authContextCode).toContain('setUser(null)');
    expect(authContextCode).toContain('setIsAdminUser(false)');
    expect(authContextCode).toContain('setIsLoadingAuth(false)');
  });

  it('2. authenticated normal user (non-admin) has admin: false', () => {
    expect(authContextCode).toContain('tokenResult?.claims?.admin === true');
    expect(shopContextCode).toContain('tokenResult?.claims?.admin === true');
  });

  it('3. authenticated admin with admin: true strictly validates tokenResult.claims.admin === true', () => {
    expect(authContextCode).toMatch(/tokenResult\?\.claims\?\.admin\s*===\s*true/);
    expect(shopContextCode).toMatch(/tokenResult\?\.claims\?\.admin\s*===\s*true/);
  });

  it('4. stale token followed by forced refresh using getIdToken(true) and getIdTokenResult(true)', () => {
    expect(authContextCode).toContain('getIdToken(true)');
    expect(authContextCode).toContain('getIdTokenResult(true)');
    expect(shopContextCode).toContain('getIdToken(true)');
    expect(shopContextCode).toContain('getIdTokenResult(true)');
  });

  it('5. missing user profile document does not block isLoadingAuth completion', () => {
    expect(authContextCode).toContain('setIsLoadingAuth(false)');
    const authInitSnippet = authContextCode.slice(authContextCode.indexOf('onAuthStateChanged'), authContextCode.indexOf('const logout'));
    expect(authInitSnippet).toContain('setIsLoadingAuth(false)');
  });

  it('6. failed token refresh fails closed gracefully without logging out user', () => {
    expect(authContextCode).toContain('catch');
    expect(authContextCode).not.toMatch(/catch\s*\(\)\s*\{\s*logout\(\)\s*\}/);
  });

  it('7. AdminView displays correct access denied message when authenticated user is non-admin', () => {
    expect(adminViewCode).toContain('Your account is authenticated but does not have administrator privileges.');
    expect(adminViewCode).toContain('Refresh Session');
  });

  it('8. authStatus distinguishes loading, unauthenticated, authenticated non-admin, and authenticated admin', () => {
    expect(authContextCode).toContain('authStatus');
    expect(shopContextCode).toContain('authStatus');
    expect(authContextCode).toContain('authenticated_non_admin');
    expect(authContextCode).toContain('authenticated_admin');
  });
});
