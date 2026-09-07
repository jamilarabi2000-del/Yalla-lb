import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds }
  from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { beforeAll, afterAll, test, expect } from 'vitest';

let env: any;

const validProduct = {
  id: 'p-order',
  name: 'Test Product',
  priceUSD: 10,
  stock: 10,
};

const validOrder = (id: string) => ({
  id,
  userId: 'cust-1',
  sellerIds: [],
  productIds: ['p-order'],
  date: '2026-09-07',
  items: [
    {
      quantity: 1,
      product: {
        id: 'p-order',
        priceUSD: 10,
      },
    },
  ],
  shipping: {
    fullName: 'Test Customer',
    deliveryNotes: '',
  },
  paymentMethod: 'cod_usd',
  currency: 'USD',
  subtotalUSD: 10,
  deliveryFeeUSD: 0,
  totalUSD: 10,
  totalLBP: 0,
  status: 'pending',
  estimatedDelivery: '',
  trackingNumber: 'TEST-001',
  discountUSD: 0,
  appliedCoupon: '',
  notes: '',
  customerNote: '',
  adminNotes: '',
  createdAt: '2026-09-07',
  updatedAt: '2026-09-07',
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'yalla-lb-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });

  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(
      doc(ctx.firestore(), 'products', 'p-order'),
      validProduct
    );
    await setDoc(
      doc(ctx.firestore(), 'users', 'seller-uid-1'),
      {
        uid: 'seller-uid-1',
        role: 'seller',
        sellerId: 'seller-tripoli',
        email: 'seller1@example.com'
      }
    );
  });
});
afterAll(() => env.cleanup());

const unauthenticated = () => env.unauthenticatedContext().firestore();
const customer = () => env.authenticatedContext('cust-1', {
  email: 'c@example.com', email_verified: true,
}).firestore();
const seller = () => env.authenticatedContext('seller-uid-1', {
  email: 'seller1@example.com', email_verified: true,
}).firestore();
const admin = () => env.authenticatedContext('admin-1', {
  email: 'a@example.com', email_verified: true, admin: true,
}).firestore();

// ── Strict Security Tests: Order creation is backend-only via placeOrder Cloud Function ───

test('TEST A: Unauthenticated client cannot create an order', async () => {
  await assertFails(
    setDoc(
      doc(unauthenticated(), 'orders', 'o-unauth'),
      validOrder('o-unauth')
    )
  );
});

test('TEST B: Normal authenticated customer cannot create an order directly', async () => {
  await assertFails(
    setDoc(
      doc(customer(), 'orders', 'o1'),
      validOrder('o1')
    )
  );
});

test('TEST C: Authenticated seller cannot create an order directly', async () => {
  await assertFails(
    setDoc(
      doc(seller(), 'orders', 'o-seller'),
      validOrder('o-seller')
    )
  );
});

test('TEST D: Authenticated admin cannot create an order directly', async () => {
  await assertFails(
    setDoc(
      doc(admin(), 'orders', 'o-admin'),
      validOrder('o-admin')
    )
  );
});

test('TEST E: The existing placeOrder Cloud Function can still successfully create an order using the Admin SDK', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    const adminDb = ctx.firestore();
    await assertSucceeds(
      setDoc(
        doc(adminDb, 'orders', 'o-backend-admin-sdk'),
        validOrder('o-backend-admin-sdk')
      )
    );
    const snap = await getDoc(doc(adminDb, 'orders', 'o-backend-admin-sdk'));
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.id).toBe('o-backend-admin-sdk');
  });
});

test('TEST F: order_idempotency is completely inaccessible to clients (read & write = false)', async () => {
  const dummyRecord = {
    orderId: 'ord-123',
    trackingNumber: 'LB-EXP-ABC',
    createdAt: new Date().toISOString(),
    totalUSD: 50
  };

  // Unauthenticated client cannot read or write
  await assertFails(getDoc(doc(unauthenticated(), 'order_idempotency', 'uid_key1')));
  await assertFails(setDoc(doc(unauthenticated(), 'order_idempotency', 'uid_key1'), dummyRecord));

  // Customer cannot read or write
  await assertFails(getDoc(doc(customer(), 'order_idempotency', 'customer-123_key1')));
  await assertFails(setDoc(doc(customer(), 'order_idempotency', 'customer-123_key1'), dummyRecord));

  // Seller cannot read or write
  await assertFails(getDoc(doc(seller(), 'order_idempotency', 'seller-123_key1')));
  await assertFails(setDoc(doc(seller(), 'order_idempotency', 'seller-123_key1'), dummyRecord));

  // Admin cannot read or write directly via client SDK
  await assertFails(getDoc(doc(admin(), 'order_idempotency', 'admin-123_key1')));
  await assertFails(setDoc(doc(admin(), 'order_idempotency', 'admin-123_key1'), dummyRecord));

  // Admin SDK in Cloud Functions CAN read & write
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    const adminDb = ctx.firestore();
    await assertSucceeds(setDoc(doc(adminDb, 'order_idempotency', 'backend_key1'), dummyRecord));
    const snap = await getDoc(doc(adminDb, 'order_idempotency', 'backend_key1'));
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.orderId).toBe('ord-123');
  });
});

test('customer cannot create a pre-advanced order', async () => {
  await assertFails(
    setDoc(
      doc(customer(), 'orders', 'o2'),
      {
        ...validOrder('o2'),
        status: 'crafting',
      }
    )
  );
});

// ── Regression 2: v5 — stock rule let any signed-in user zero the catalog ─────
test('customer cannot decrement product stock', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'products', 'p1'), { priceUSD: 10, stock: 5 });
  });
  await assertFails(setDoc(doc(customer(), 'products', 'p1'), { stock: 0 }, { merge: true }));
});

// ── Regression 3: v6 — direct client writes ────────────────────────────────────
test('customer cannot write to products or orders', async () => {
  await assertFails(setDoc(doc(customer(), 'products', 'p1'), { stock: 4 }, { merge: true }));
  await assertFails(
    setDoc(
      doc(customer(), 'orders', 'o3'),
      validOrder('o3')
    )
  );
});

// ── Standing authorization invariants ────────────────────────────────────────
test('customer cannot read another customer order', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'orders', 'other'), { userId: 'cust-2', totalUSD: 1 });
  });
  await assertFails(getDoc(doc(customer(), 'orders', 'other')));
});

test('unverified email cannot order', async () => {
  const unverified = env.authenticatedContext('cust-3', { email_verified: false }).firestore();
  await assertFails(setDoc(doc(unverified, 'orders', 'o4'), {
    userId: 'cust-3', status: 'pending', subtotalUSD: 5, deliveryFeeUSD: 0, totalUSD: 5, items: [], shipping: {},
  }));
});

test('admin can write products and cms', async () => {
  await assertSucceeds(setDoc(doc(admin(), 'products', 'p2'), { priceUSD: 1, stock: 1 }));
  await assertSucceeds(setDoc(doc(admin(), 'cms', 'main'), { navbar: {} }, { merge: true }));
});

test('non-admin cannot write cms', async () => {
  await assertFails(setDoc(doc(customer(), 'cms', 'main'), { navbar: {} }, { merge: true }));
});

test('unauthenticated user cannot read order with trackingNumber', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'orders', 'order-tracking'), {
      userId: 'cust-1', trackingNumber: 'TRK12345', totalUSD: 10
    });
  });
  await assertFails(getDoc(doc(unauthenticated(), 'orders', 'order-tracking')));
});

test('phone_registry is not publicly readable', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'phone_registry', '96170123456'), { uid: 'cust-1' });
  });
  await assertFails(getDoc(doc(unauthenticated(), 'phone_registry', '96170123456')));
  await assertSucceeds(getDoc(doc(customer(), 'phone_registry', '96170123456')));
});

test('unauthenticated user cannot write search_logs', async () => {
  await assertFails(setDoc(doc(unauthenticated(), 'search_logs', 's1'), { query: 'olive oil' }));
  await assertSucceeds(setDoc(doc(customer(), 'search_logs', 's2'), { userId: 'cust-1', query: 'soap' }));
});

// ── Adversarial Attack Tests ─────────────────────────────────────────────────

// 1. Discount manipulation
test('adversarial: customer cannot arbitrarily inflate discountUSD to create a free order', async () => {
  await assertFails(
    setDoc(
      doc(customer(), 'orders', 'o-discount-attack'),
      {
        ...validOrder('o-discount-attack'),
        discountUSD: 10,
        totalUSD: 0,
      }
    )
  );
});

// 2. Fake review creation without purchase
test('adversarial: customer cannot review a product they never purchased', async () => {
  await assertFails(
    setDoc(
      doc(customer(), 'reviews', 'cust-1_unbought-prod'),
      {
        id: 'cust-1_unbought-prod',
        userId: 'cust-1',
        userName: 'Attacker',
        productId: 'unbought-prod',
        orderId: 'o1',
        rating: 5,
        comment: 'Fake positive review',
        createdAt: '2026-09-07',
        date: '2026-09-07',
      }
    )
  );
});

// 3. Order / productIds mismatch attack
test('adversarial: customer cannot create order where product in items is missing from productIds', async () => {
  await assertFails(
    setDoc(
      doc(customer(), 'orders', 'o-mismatch'),
      {
        ...validOrder('o-mismatch'),
        productIds: ['another-product-id'], // mismatch
      }
    )
  );
});

// 4. Seller impersonation / cross-seller modification
test('adversarial: seller cannot modify another seller profile', async () => {
  const sellerA = env.authenticatedContext('user-seller-a', {
    email: 'sellera@example.com', email_verified: true,
  }).firestore();

  // Create seller documents
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'sellers', 'seller-a'), {
      id: 'seller-a',
      accountUid: 'user-seller-a',
      nameEn: 'Seller A',
      sellerCode: 'SELLER-A',
    });
    await setDoc(doc(ctx.firestore(), 'sellers', 'seller-b'), {
      id: 'seller-b',
      accountUid: 'user-seller-b',
      nameEn: 'Seller B',
      sellerCode: 'SELLER-B',
    });
  });

  // Seller A tries to modify Seller B profile
  await assertFails(
    setDoc(
      doc(sellerA, 'sellers', 'seller-b'),
      { nameEn: 'Defaced by Seller A' },
      { merge: true }
    )
  );
});

// 5. User security-field manipulation
test('adversarial: customer cannot grant themselves admin role or alter emailVerified in user profile', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'users', 'cust-1'), {
      uid: 'cust-1',
      name: 'Customer 1',
      role: 'customer',
      emailVerified: false,
    });
  });

  // Customer tries to elevate role
  await assertFails(
    setDoc(
      doc(customer(), 'users', 'cust-1'),
      { role: 'admin' },
      { merge: true }
    )
  );

  // Customer tries to alter emailVerified
  await assertFails(
    setDoc(
      doc(customer(), 'users', 'cust-1'),
      { emailVerified: true },
      { merge: true }
    )
  );

  // Customer tries to modify ordersPlaced directly (must only be updated server-side by placeOrder)
  await assertFails(
    setDoc(
      doc(customer(), 'users', 'cust-1'),
      { ordersPlaced: 1 },
      { merge: true }
    )
  );
});

// 6. User ordersPlaced creation guard
test('adversarial: customer cannot create user profile with ordersPlaced preset', async () => {
  const newCust = env.authenticatedContext('cust-new', {
    email: 'new@example.com', email_verified: true,
  }).firestore();

  await assertFails(
    setDoc(
      doc(newCust, 'users', 'cust-new'),
      {
        uid: 'cust-new',
        name: 'New Customer',
        email: 'new@example.com',
        ordersPlaced: 5,
      }
    )
  );
});

// 7. Seller product permissions hardening
test('adversarial: seller cannot manipulate sellerActive, rating, reviewCount, or hijack sellerId', async () => {
  const sellerContext = env.authenticatedContext('user-seller-x', {
    email: 'sellerx@example.com',
    email_verified: true,
  }).firestore();

  // Seed seller profile mapping
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'sellers', 'seller-x'), {
      id: 'seller-x',
      accountUid: 'user-seller-x',
      nameEn: 'Seller X',
      sellerCode: 'SELLER-X',
    });
    await setDoc(doc(ctx.firestore(), 'products', 'p-seller-x'), {
      id: 'p-seller-x',
      sellerId: 'seller-x',
      name: 'Artisan Soap',
      priceUSD: 15,
      stock: 50,
      sellerActive: false, // Suspended by admin
      rating: 4.0,
      reviewCount: 2,
    });
  });

  // Seller tries to reactivate own product by bypassing platform suspension (sellerActive: true)
  await assertFails(
    setDoc(
      doc(sellerContext, 'products', 'p-seller-x'),
      { sellerActive: true },
      { merge: true }
    )
  );

  // Seller tries to artificially inflate rating or review count
  await assertFails(
    setDoc(
      doc(sellerContext, 'products', 'p-seller-x'),
      { rating: 5.0, reviewCount: 100 },
      { merge: true }
    )
  );

  // Seller tries to reassign product to another seller
  await assertFails(
    setDoc(
      doc(sellerContext, 'products', 'p-seller-x'),
      { sellerId: 'seller-other' },
      { merge: true }
    )
  );
});

// 8. Product Document ID Integrity
test('adversarial: seller cannot create or update product with mismatched ID', async () => {
  const sellerContext = env.authenticatedContext('user-seller-x', {
    email: 'sellerx@example.com',
    email_verified: true,
  }).firestore();

  // Mismatched ID on create
  await assertFails(
    setDoc(
      doc(sellerContext, 'products', 'p-actual-id'),
      {
        id: 'p-spoofed-id',
        sellerId: 'seller-x',
        name: 'Spoofed ID Product',
        priceUSD: 20,
        stock: 10,
      }
    )
  );

  // Altering ID on update
  await assertFails(
    setDoc(
      doc(sellerContext, 'products', 'p-seller-x'),
      { id: 'p-changed-id' },
      { merge: true }
    )
  );
});

// 9. Email Integrity in User Profile
test('adversarial: customer cannot set profile email to another user email', async () => {
  await assertFails(
    setDoc(
      doc(customer(), 'users', 'cust-1'),
      { email: 'victim@example.com' },
      { merge: true }
    )
  );

  // Succeeds when setting matching token email
  await assertSucceeds(
    setDoc(
      doc(customer(), 'users', 'cust-1'),
      { email: 'c@example.com' },
      { merge: true }
    )
  );
});

// 10. Phone Registry Privacy
test('adversarial: customer cannot query or read another user phone registry', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'phone_registry', '96170999999'), {
      uid: 'victim-cust',
      phone: '+961 70 999 999',
      cleanDigits: '70999999',
    });
  });

  // Customer tries to read victim phone registry
  await assertFails(getDoc(doc(customer(), 'phone_registry', '96170999999')));
});

// 11. Secret Coupons Access Restriction
test('adversarial: non-admin cannot read or write coupons', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'coupons', 'SECRET50'), {
      code: 'SECRET50',
      discountPercent: 50,
    });
  });

  await assertFails(getDoc(doc(customer(), 'coupons', 'SECRET50')));
  await assertFails(getDoc(doc(unauthenticated(), 'coupons', 'SECRET50')));
  await assertFails(setDoc(doc(customer(), 'coupons', 'HACK100'), { code: 'HACK100' }));
});

// 12. Cart & Wishlist Schema Validation
test('adversarial: customer cannot inject arbitrary schemas or oversized payloads in carts/wishlists', async () => {
  // Invalid cart key
  await assertFails(
    setDoc(
      doc(customer(), 'carts', 'cust-1'),
      { maliciousField: 'attack' }
    )
  );

  // Oversized cart (>50 items)
  const oversizedItems = Array.from({ length: 51 }, (_, i) => ({
    quantity: 1,
    product: { id: `p-${i}` }
  }));
  await assertFails(
    setDoc(
      doc(customer(), 'carts', 'cust-1'),
      {
        userId: 'cust-1',
        items: oversizedItems,
        updatedAt: '2026-09-07T00:00:00.000Z',
      }
    )
  );

  // Valid cart succeeds
  await assertSucceeds(
    setDoc(
      doc(customer(), 'carts', 'cust-1'),
      {
        userId: 'cust-1',
        items: [{ quantity: 2, product: { id: 'p-1' } }],
        updatedAt: '2026-09-07T00:00:00.000Z',
      }
    )
  );
});

// 14. Seller Order Data Isolation
test('adversarial: seller order data isolation and fulfillment access', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'orders', 'ord-1'), {
      id: 'ord-1',
      userId: 'cust-1',
      sellerIds: ['seller-tripoli', 'seller-other'],
      totalUSD: 100,
    });
    await setDoc(doc(db, 'order_fulfillment/ord-1/sellers/seller-tripoli'), {
      orderId: 'ord-1',
      sellerId: 'seller-tripoli',
      status: 'pending',
      items: [{ product: { id: 'p-1' }, quantity: 1 }],
      shipping: { fullName: 'Test', phone: '+96170123456' }
    });
    await setDoc(doc(db, 'order_fulfillment/ord-1/sellers/seller-other'), {
      orderId: 'ord-1',
      sellerId: 'seller-other',
      status: 'pending',
      items: [{ product: { id: 'p-2' }, quantity: 1 }],
      shipping: { fullName: 'Test', phone: '+96170123456' }
    });
  });

  // Seller A (seller-tripoli) reads own fulfillment doc -> ALLOW
  await assertSucceeds(getDoc(doc(seller(), 'order_fulfillment', 'ord-1', 'sellers', 'seller-tripoli')));

  // Seller A reads Seller B fulfillment doc -> DENY
  await assertFails(getDoc(doc(seller(), 'order_fulfillment', 'ord-1', 'sellers', 'seller-other')));

  // Seller A attempts to read full /orders/ord-1 directly -> DENY (enforced by new rules!)
  await assertFails(getDoc(doc(seller(), 'orders', 'ord-1')));

  // Customer (cust-1) reads own order -> ALLOW
  await assertSucceeds(getDoc(doc(customer(), 'orders', 'ord-1')));

  // Customer cannot read seller fulfillment doc -> DENY
  await assertFails(getDoc(doc(customer(), 'order_fulfillment', 'ord-1', 'sellers', 'seller-tripoli')));

  // Admin reads full order & fulfillment -> ALLOW
  await assertSucceeds(getDoc(doc(admin(), 'orders', 'ord-1')));
  await assertSucceeds(getDoc(doc(admin(), 'order_fulfillment', 'ord-1', 'sellers', 'seller-tripoli')));
});



