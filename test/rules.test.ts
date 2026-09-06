import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds }
  from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { beforeAll, afterAll, test } from 'vitest';

let env: any;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'yalla-lb-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() => env.cleanup());

const customer = () => env.authenticatedContext('cust-1', {
  email: 'c@example.com', email_verified: true,
}).firestore();
const admin = () => env.authenticatedContext('admin-1', {
  email: 'a@example.com', email_verified: true, admin: true,
}).firestore();

// ── Regression 1: v3 — status mismatch silently rejected every order ──────────
test('customer can create an order with status pending', async () => {
  await assertSucceeds(setDoc(doc(customer(), 'orders', 'o1'), {
    userId: 'cust-1', status: 'pending', subtotalUSD: 42, deliveryFeeUSD: 0, totalUSD: 42, items: [], shipping: {},
  }));
});

test('customer cannot create a pre-advanced order', async () => {
  await assertFails(setDoc(doc(customer(), 'orders', 'o2'), {
    userId: 'cust-1', status: 'crafting', subtotalUSD: 42, deliveryFeeUSD: 0, totalUSD: 42, items: [], shipping: {},
  }));
});

// ── Regression 2: v5 — stock rule let any signed-in user zero the catalog ─────
test('customer cannot decrement product stock', async () => {
  await env.withSecurityRulesDisabled(async (ctx: any) => {
    await setDoc(doc(ctx.firestore(), 'products', 'p1'), { priceUSD: 10, stock: 5 });
  });
  await assertFails(setDoc(doc(customer(), 'products', 'p1'), { stock: 0 }, { merge: true }));
});

// ── Regression 3: v6 — the write path the rule change orphaned ────────────────
// Guards the Action 1 fix: if anyone reintroduces a client-side stock write
// inside the order transaction, this catches it before deploy.
test('customer order path performs no product writes', async () => {
  await assertFails(setDoc(doc(customer(), 'products', 'p1'), { stock: 4 }, { merge: true }));
  await assertSucceeds(setDoc(doc(customer(), 'orders', 'o3'), {
    userId: 'cust-1', status: 'pending', subtotalUSD: 10, deliveryFeeUSD: 0, totalUSD: 10, items: [], shipping: {},
  }));
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
  await assertSucceeds(setDoc(doc(customer(), 'search_logs', 's2'), { query: 'soap' }));
});

