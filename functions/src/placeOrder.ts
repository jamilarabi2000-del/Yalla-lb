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
    street?: string;
    building?: string;
    address?: string;
    deliveryNotes?: string;
    notes?: string;
    deliverySpeed?: string;
    [key: string]: any;
  };
  paymentMethod?: string;
  couponCode?: string;
  deliverySpeed?: string;
}

const ALLOWED_PAYMENT_METHODS = ['cod_usd', 'cod_lbp', 'wish_omt', 'credit_card', 'whish_pay', 'omt_pay', 'cash_on_delivery'];
const ALLOWED_DELIVERY_SPEEDS = ['standard', 'express_beirut', 'diaspora_air', 'diaspora_global'];

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
      throw new HttpsError('invalid-argument', 'Invalid cart items. Must contain between 1 and 50 items.');
    }

    // Validate and sanitize shipping information
    if (!shipping || typeof shipping !== 'object') {
      throw new HttpsError('invalid-argument', 'Shipping details are required.');
    }

    const sanitizedFullName = String(shipping.fullName || '').trim().slice(0, 200);
    const sanitizedPhone = String(shipping.phone || '').trim().slice(0, 50);
    const sanitizedGovernorate = String(shipping.governorate || '').trim().slice(0, 100);
    const sanitizedCity = String(shipping.city || '').trim().slice(0, 100);
    const sanitizedStreet = String(shipping.street || shipping.address || '').trim().slice(0, 200);
    const sanitizedBuilding = String(shipping.building || '').trim().slice(0, 100);
    const sanitizedDeliveryNotes = String(shipping.deliveryNotes || shipping.notes || '').trim().slice(0, 1000);

    if (!sanitizedFullName) {
      throw new HttpsError('invalid-argument', 'Full name is required.');
    }
    if (!sanitizedPhone) {
      throw new HttpsError('invalid-argument', 'Phone number is required.');
    }
    if (!sanitizedCity) {
      throw new HttpsError('invalid-argument', 'City is required.');
    }

    const sanitizedSpeed = String(deliverySpeed || shipping.deliverySpeed || 'standard').trim().toLowerCase();
    const effectiveSpeed = ALLOWED_DELIVERY_SPEEDS.includes(sanitizedSpeed) ? sanitizedSpeed : 'standard';

    const rawPayment = String(paymentMethod || 'cod_usd').trim().toLowerCase();
    const effectivePaymentMethod = ALLOWED_PAYMENT_METHODS.includes(rawPayment) ? rawPayment : 'cod_usd';

    const cleanShipping = {
      fullName: sanitizedFullName,
      phone: sanitizedPhone,
      governorate: sanitizedGovernorate || 'Beirut',
      city: sanitizedCity,
      street: sanitizedStreet,
      building: sanitizedBuilding || 'N/A',
      deliveryNotes: sanitizedDeliveryNotes,
      deliverySpeed: effectiveSpeed,
    };

    const db = getDb();

    return db.runTransaction(async (tx) => {
      // 1. Read all products, discount rules, bundles, and user data
      const productRefs = items.map(i => {
        if (!i || typeof i.productId !== 'string' || !i.productId.trim()) {
          throw new HttpsError('invalid-argument', 'Each item must have a valid productId.');
        }
        return db.doc(`products/${i.productId.trim()}`);
      });
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
          throw new HttpsError('invalid-argument', `Invalid quantity for product "${p.name || snap.id}". Must be between 1 and 99.`);
        }
        const availableStock = typeof p.stock === 'number' ? p.stock : 0;
        if (availableStock < qty) {
          throw new HttpsError('resource-exhausted', `"${p.name || 'Product'}" only has ${availableStock} items in stock.`);
        }
        return {
          ref: snap.ref,
          product: p,
          quantity: qty,
          unitPriceUSD: typeof p.priceUSD === 'number' ? p.priceUSD : 0,
          selectedOption: typeof line.selectedOption === 'string' ? line.selectedOption.slice(0, 100) : undefined
        };
      });

      // 3. Compute prices, discounts, delivery, and totals authoritatively on server
      const subtotalUSD = round2(lines.reduce((s, l) => s + l.unitPriceUSD * l.quantity, 0));
      const isNewCustomer = (userSnap.data()?.ordersPlaced ?? 0) === 0;

      const { discountUSD, appliedCoupon } = computeDiscounts({
        lines,
        discounts: discountsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        bundles: bundlesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        couponCode: typeof couponCode === 'string' ? couponCode.slice(0, 50) : undefined,
        isNewCustomer,
        subtotalUSD,
      });

      const deliveryFeeUSD = computeDelivery(
        effectiveSpeed,
        cleanShipping.governorate,
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
        shipping: cleanShipping,
        paymentMethod: effectivePaymentMethod,
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
