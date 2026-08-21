import { Order, UserProfile } from '../types';

export interface CustomerRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  governorate: string | null;
  city: string | null;
  street: string | null;
  ordersCount: number;
  totalSpentUSD: number;
  lastOrderDate: string | null;
  recentOrders: Order[];
}

/** Single keying strategy, single set of null-safe fallbacks. */
export function buildCustomerIndex(
  users: (UserProfile & { uid?: string })[],
  orders: Order[]
): Map<string, CustomerRecord> {
  const key = (u: { uid?: string; phone?: string | null; email?: string | null }) =>
    u.uid || u.phone || u.email || 'anonymous';

  const index = new Map<string, CustomerRecord>();

  for (const u of users) {
    index.set(key(u), {
      id: u.uid || key(u),
      name: u.name || 'Anonymous Shopper',
      email: u.email || null,
      phone: u.phone || null,
      governorate: u.defaultGovernorate || null,
      city: u.defaultCity || null,
      street: u.defaultAddress || null,
      ordersCount: 0,
      totalSpentUSD: 0,
      lastOrderDate: null,
      recentOrders: [],
    });
  }

  for (const o of orders) {
    const k = key({ uid: o.userId, phone: o.shipping?.phone, email: o.shipping?.email });
    const existing = index.get(k);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpentUSD += o.totalUSD;
      existing.recentOrders.push(o);
      if (!existing.lastOrderDate || o.date > existing.lastOrderDate) {
        existing.lastOrderDate = o.date;
      }
    } else {
      index.set(k, {
        id: k,
        name: o.shipping?.fullName || 'Anonymous Shopper',
        email: o.shipping?.email || null,
        phone: o.shipping?.phone || null,
        governorate: o.shipping?.governorate || null,
        city: o.shipping?.city || null,
        street: o.shipping?.street || null,
        ordersCount: 1,
        totalSpentUSD: o.totalUSD,
        lastOrderDate: o.date,
        recentOrders: [o],
      });
    }
  }

  return index;
}
