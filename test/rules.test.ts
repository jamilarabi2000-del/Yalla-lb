import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds }
  from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { beforeAll, afterAll, test } from 'vitest';

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
  });
});
afterAll(() => env.cleanup());

const customer = () => env.authenticatedContext('cust-1', {
  email: 'c@example.com', email_verified: true,
}).firestore();
const admin = () => env.authenticatedContext('admin-1', {
  email: 'a@example.com', email_verified: true, admin: true,
}).firestore();

// ── Regression 1: Checkout hardening — direct customer order writes are forbidden ───
test('customer cannot create an order directly (must use placeOrder Cloud Function)', async () => {
  await assertFails(
    setDoc(
      doc(customer(), 'orders', 'o1'),
      validOrder('o1')
    )
  );
});

test('admin can create an order directly in Firestore', async () => {
  await assertSucceeds(
    setDoc(
      doc(admin(), 'orders', 'o-admin'),
      validOrder('o-admin')
    )
  );
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

const unauthenticated = () => env.unauthenticatedContext().firestore();

test('unauthenticated user cannot create order', async () => {
  await assertFails(setDoc(doc(unauthenticated(), 'orders', 'o-unauth'), {
    userId: 'cust-1', status: 'pending', subtotalUSD: 10, deliveryFeeUSD: 0, totalUSD: 10, items: [], shipping: {},
  }));
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
});


