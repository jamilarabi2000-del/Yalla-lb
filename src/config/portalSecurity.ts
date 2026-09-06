export const SECRET_ADMIN_TOKEN = 'portal-x9k2m7v8';
export const SECRET_SELLER_TOKEN = 'portal-s4m8q3v1';

export function isSecretAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    path.includes(SECRET_ADMIN_TOKEN) ||
    hash.includes(SECRET_ADMIN_TOKEN) ||
    search.includes(SECRET_ADMIN_TOKEN) ||
    search.includes('admin_secure_x9k2m7v8')
  );
}

export function isSecretSellerUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    path.includes(SECRET_SELLER_TOKEN) ||
    hash.includes(SECRET_SELLER_TOKEN) ||
    search.includes(SECRET_SELLER_TOKEN) ||
    search.includes('seller_secure_s4m8q3v1')
  );
}
