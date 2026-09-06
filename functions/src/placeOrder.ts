import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { computeDiscounts, round2, CartLine } from './pricing.js';
import { computeDelivery } from './delivery.js';

if (getApps().length === 0) {
  initializeApp();
}

const DATABASE_ID = 'ai-studio-yallalb-1415b490-9de7-4a31-acee-0f9c6439c18c';
const getDb = () => {
  try {
    return getFirestore(DATABASE_ID);
  } catch {
    return getFirestore();
  }
};

export interface PlaceOrderRequest {
  items: CartLine[];
  shipping: {
    fullName?: string;
    phone?: string;
    governorate?: string;
    city?: string;
    address?: string;
    notes?: string;
    deliverySpeed?: string;
    [key: string]: any;
  };
  paymentMethod: string;
  couponCode?: string;
  deliverySpeed?: string;
}

export const placeOrder = onCall<PlaceOrderRequest>(
  { region: 'europe-west1' },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in to place an order.');
    }
    if (req.auth?.token.email_verified !== true) {
      throw new HttpsError('failed-precondition', 'Please verify your email first.');
    }

    const { items, shipping, paymentMethod, couponCode, deliverySpeed } = req.data;
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      throw new HttpsError('invalid-argument', 'Invalid cart items.');
    }

    const db = getDb();

    return db.runTransaction(async (tx) => {
      // 1. Read all products, discount rules, bundles, and user data
      const productRefs = items.map(i => db.doc(`products/${i.productId}`));
      const productSnaps = await tx.getAll(...productRefs);
      const [discountsSnap, bundlesSnap, userSnap] = await Promise.all([
        db.collection('discounts').where('isActive', '==', true).get(),
        db.collection('product_bundles').where('isActive', '==', true).get(),
        tx.get(db.doc(`users/${uid}`)),
      ]);

      // 2. Validate stock and build line items strictly from DB prices
      const lines = items.map((line, idx) => {
        const snap = productSnaps[idx];
        if (!snap || !snap.exists) {
          throw new HttpsError('failed-precondition', `Product with ID "${line.productId}" is unavailable.`);
        }
        const p = { id: snap.id, ...snap.data() } as any;
        const qty = Math.floor(Number(line.quantity));
        if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
          throw new HttpsError('invalid-argument', `Invalid quantity for product "${p.name}".`);
        }
        const availableStock = typeof p.stock === 'number' ? p.stock : 0;
        if (availableStock < qty) {
          throw new HttpsError('resource-exhausted', `"${p.name}" only has ${availableStock} items in stock.`);
        }
        return {
          ref: snap.ref,
          product: p,
          quantity: qty,
          unitPriceUSD: typeof p.priceUSD === 'number' ? p.priceUSD : 0,
          selectedOption: line.selectedOption
        };
      });

      // 3. Compute prices, discounts, delivery, and totals authoritatively on server
      const subtotalUSD = round2(lines.reduce((s, l) => s + l.unitPriceUSD * l.quantity, 0));
      const isNewCustomer = (userSnap.data()?.ordersPlaced ?? 0) === 0;

      const { discountUSD, appliedCoupon } = computeDiscounts({
        lines,
        discounts: discountsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        bundles: bundlesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        couponCode,
        isNewCustomer,
        subtotalUSD,
      });

      const activeSpeed = deliverySpeed || shipping?.deliverySpeed || 'standard';
      const deliveryFeeUSD = computeDelivery(
        activeSpeed,
        shipping?.governorate,
        subtotalUSD - discountUSD
      );
      const totalUSD = round2(subtotalUSD - discountUSD + deliveryFeeUSD);

      // 4. Atomic stock decrement
      for (const l of lines) {
        tx.update(l.ref, { stock: FieldValue.increment(-l.quantity) });
      }
      tx.set(db.doc(`users/${uid}`), { ordersPlaced: FieldValue.increment(1) }, { merge: true });

      // 5. Create authoritative Order record
      const orderRef = db.collection('orders').doc();
      const cryptoUuid = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const trackingNumber = `LB-EXP-${cryptoUuid.slice(0, 12).toUpperCase()}`;

      const orderData = {
        id: orderRef.id,
        userId: uid,
        status: 'pending',
        date: new Date().toISOString(),
        trackingNumber,
        items: lines.map(l => ({
          product: l.product,
          quantity: l.quantity,
          selectedOption: l.selectedOption
        })),
        productIds: Array.from(new Set(lines.map(l => l.product.id).filter(Boolean))),
        sellerIds: Array.from(new Set(lines.map(l => l.product.sellerId || l.product.seller).filter(Boolean))),
        shipping: shipping || {},
        paymentMethod: paymentMethod || 'cash_on_delivery',
        currency: 'USD',
        subtotalUSD,
        discountUSD,
        deliveryFeeUSD,
        totalUSD,
        totalLBP: Math.round(totalUSD * 89500),
        appliedCoupon: appliedCoupon || null,
        createdAt: FieldValue.serverTimestamp(),
      };

      tx.set(orderRef, orderData);

      return {
        orderId: orderRef.id,
        trackingNumber,
        totalUSD,
        subtotalUSD,
        discountUSD,
        deliveryFeeUSD
      };
    });
  }
);
