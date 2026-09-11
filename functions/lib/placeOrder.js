"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeOrder = exports.MAX_IDEMPOTENCY_KEY_LENGTH = exports.IDEMPOTENCY_KEY_REGEX = exports.PRODUCT_ID_REGEX = exports.MAX_ORDER_VALUE_USD = exports.MAX_TOTAL_QUANTITY = exports.MAX_UNIQUE_PRODUCTS = exports.MAX_LINE_ITEMS = exports.ALLOWED_SHIPPING_KEYS = exports.ALLOWED_ITEM_KEYS = exports.ALLOWED_REQUEST_KEYS = exports.ALLOWED_DELIVERY_SPEEDS = exports.ALLOWED_PAYMENT_METHODS = void 0;
exports.computeRequestFingerprint = computeRequestFingerprint;
exports.validatePlaceOrderPayload = validatePlaceOrderPayload;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const node_crypto_1 = require("node:crypto");
const node_crypto_2 = require("node:crypto");
const pricing_js_1 = require("./pricing.js");
const delivery_js_1 = require("./delivery.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const DATABASE_ID = 'ai-studio-yallalb-1415b490-9de7-4a31-acee-0f9c6439c18c';
const getDb = () => {
    try {
        return (0, firestore_1.getFirestore)(DATABASE_ID);
    }
    catch {
        return (0, firestore_1.getFirestore)();
    }
};
function computeRequestFingerprint(payload) {
    const sortedItems = [...payload.items].sort((a, b) => a.productId.localeCompare(b.productId)).map(i => ({
        productId: i.productId.trim(),
        quantity: i.quantity,
        selectedOption: i.selectedOption ? i.selectedOption.trim() : null
    }));
    const canonical = {
        items: sortedItems,
        shipping: {
            fullName: payload.shipping.fullName,
            phone: payload.shipping.phone,
            governorate: payload.shipping.governorate,
            city: payload.shipping.city,
            street: payload.shipping.street,
            building: payload.shipping.building,
            deliveryNotes: payload.shipping.deliveryNotes || '',
            deliverySpeed: payload.shipping.deliverySpeed,
        },
        paymentMethod: payload.paymentMethod.trim().toLowerCase(),
        deliverySpeed: payload.deliverySpeed ? payload.deliverySpeed.trim().toLowerCase() : payload.shipping.deliverySpeed,
        couponCode: payload.couponCode ? payload.couponCode.trim() : null,
    };
    const jsonStr = JSON.stringify(canonical, Object.keys(canonical).sort());
    return (0, node_crypto_2.createHash)('sha256').update(jsonStr).digest('hex');
}
exports.ALLOWED_PAYMENT_METHODS = [
    'cod_usd',
    'cod_lbp',
    'wish_omt',
    'credit_card',
    'whish_pay',
    'omt_pay',
    'cash_on_delivery',
];
exports.ALLOWED_DELIVERY_SPEEDS = [
    'standard',
    'express_beirut',
    'diaspora_air',
    'diaspora_global',
];
exports.ALLOWED_REQUEST_KEYS = new Set(['items', 'shipping', 'paymentMethod', 'couponCode', 'deliverySpeed', 'idempotencyKey']);
exports.ALLOWED_ITEM_KEYS = new Set(['productId', 'quantity', 'selectedOption']);
exports.ALLOWED_SHIPPING_KEYS = new Set([
    'fullName',
    'phone',
    'governorate',
    'city',
    'street',
    'address',
    'building',
    'deliveryNotes',
    'notes',
    'deliverySpeed',
]);
exports.MAX_LINE_ITEMS = 50;
exports.MAX_UNIQUE_PRODUCTS = 50;
exports.MAX_TOTAL_QUANTITY = 200;
exports.MAX_ORDER_VALUE_USD = 10000;
exports.PRODUCT_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
exports.IDEMPOTENCY_KEY_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
exports.MAX_IDEMPOTENCY_KEY_LENGTH = 36;
/**
 * Pure request validator for placeOrder payloads, exported for exhaustive testing.
 */
function validatePlaceOrderPayload(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new https_1.HttpsError('invalid-argument', 'Request payload must be a non-null object.');
    }
    // 1. Strict top-level keys
    for (const key of Object.keys(data)) {
        if (!exports.ALLOWED_REQUEST_KEYS.has(key)) {
            throw new https_1.HttpsError('invalid-argument', `Unexpected property in request: "${key}".`);
        }
    }
    const { items, shipping, paymentMethod, couponCode, deliverySpeed, idempotencyKey } = data;
    // 2. Strict idempotency key validation
    if (idempotencyKey === undefined || idempotencyKey === null) {
        throw new https_1.HttpsError('invalid-argument', 'idempotencyKey is required and must be provided by the client.');
    }
    if (typeof idempotencyKey !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'idempotencyKey must be a valid string.');
    }
    const cleanIdempotencyKey = idempotencyKey.trim();
    if (!cleanIdempotencyKey) {
        throw new https_1.HttpsError('invalid-argument', 'idempotencyKey must not be empty.');
    }
    if (cleanIdempotencyKey.length > exports.MAX_IDEMPOTENCY_KEY_LENGTH || !exports.IDEMPOTENCY_KEY_REGEX.test(cleanIdempotencyKey)) {
        throw new https_1.HttpsError('invalid-argument', `Invalid idempotencyKey "${cleanIdempotencyKey}". Must be a valid UUID string (e.g. standard v4 UUID) up to ${exports.MAX_IDEMPOTENCY_KEY_LENGTH} characters.`);
    }
    // 3. Strict cart items array bounds
    if (!Array.isArray(items) || items.length === 0 || items.length > exports.MAX_LINE_ITEMS) {
        throw new https_1.HttpsError('invalid-argument', `Invalid cart items count (${items?.length ?? 0}). Must contain between 1 and ${exports.MAX_LINE_ITEMS} items.`);
    }
    const seenProductIds = new Set();
    let totalQuantity = 0;
    for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new https_1.HttpsError('invalid-argument', 'Each cart item must be a valid non-null object.');
        }
        for (const key of Object.keys(item)) {
            if (!exports.ALLOWED_ITEM_KEYS.has(key)) {
                throw new https_1.HttpsError('invalid-argument', `Unexpected property in cart item: "${key}".`);
            }
        }
        // 2a. Strict productId validation
        if (typeof item.productId !== 'string' || !item.productId.trim()) {
            throw new https_1.HttpsError('invalid-argument', 'Each cart item must have a non-empty string productId.');
        }
        const trimmedPid = item.productId.trim();
        if (trimmedPid.length > 128 || !exports.PRODUCT_ID_REGEX.test(trimmedPid)) {
            throw new https_1.HttpsError('invalid-argument', `Invalid productId "${trimmedPid}". Must be alphanumeric and up to 128 characters without path traversal.`);
        }
        // 2b. Prevent ambiguous duplicate products
        if (seenProductIds.has(trimmedPid)) {
            throw new https_1.HttpsError('invalid-argument', `Duplicate product ID "${trimmedPid}" detected in cart. Combine quantities into a single item line.`);
        }
        seenProductIds.add(trimmedPid);
        // 2c. Strict quantity validation (no float, no NaN, no string numbers, no out of bounds)
        if (typeof item.quantity !== 'number' ||
            !Number.isFinite(item.quantity) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 99) {
            throw new https_1.HttpsError('invalid-argument', `Invalid quantity for product "${trimmedPid}". Quantity must be a valid integer between 1 and 99.`);
        }
        totalQuantity += item.quantity;
        // 2d. Strict selectedOption validation
        if (item.selectedOption !== undefined) {
            if (typeof item.selectedOption !== 'string') {
                throw new https_1.HttpsError('invalid-argument', 'selectedOption must be a string if provided.');
            }
            const trimmedOpt = item.selectedOption.trim();
            if (trimmedOpt.length > 100) {
                throw new https_1.HttpsError('invalid-argument', 'selectedOption exceeds 100 characters.');
            }
        }
    }
    if (seenProductIds.size > exports.MAX_UNIQUE_PRODUCTS) {
        throw new https_1.HttpsError('invalid-argument', `Cart exceeds maximum unique product count of ${exports.MAX_UNIQUE_PRODUCTS}.`);
    }
    if (totalQuantity > exports.MAX_TOTAL_QUANTITY) {
        throw new https_1.HttpsError('invalid-argument', `Total order quantity (${totalQuantity}) exceeds maximum allowed limit of ${exports.MAX_TOTAL_QUANTITY} units.`);
    }
    // 3. Strict shipping details validation
    if (!shipping || typeof shipping !== 'object' || Array.isArray(shipping)) {
        throw new https_1.HttpsError('invalid-argument', 'Shipping details are required and must be an object.');
    }
    for (const key of Object.keys(shipping)) {
        if (!exports.ALLOWED_SHIPPING_KEYS.has(key)) {
            throw new https_1.HttpsError('invalid-argument', `Unexpected property in shipping details: "${key}".`);
        }
    }
    if (typeof shipping.fullName !== 'string' || !shipping.fullName.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.fullName is required and must be a non-empty string.');
    }
    if (typeof shipping.phone !== 'string' || !shipping.phone.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.phone is required and must be a non-empty string.');
    }
    const ALLOWED_GOVERNORATES = [
        'beirut', 'mount_lebanon', 'north', 'south', 'bekaa', 'diaspora_global',
        'beirut (all districts)', 'mount lebanon', 'north lebanon & akkar',
        'south lebanon & nabatieh', 'bekaa & baalbek-hermel', 'international / diaspora express (dhl/aramex)',
        'بيروت', 'جبل لبنان', 'الشمال', 'الجنوب', 'البقاع'
    ];
    if (typeof shipping.governorate !== 'string' || !shipping.governorate.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.governorate is required and must be a non-empty string.');
    }
    const govClean = shipping.governorate.trim().toLowerCase();
    const isGovValid = ALLOWED_GOVERNORATES.some(g => govClean.includes(g));
    if (!isGovValid) {
        throw new https_1.HttpsError('invalid-argument', `Invalid shipping governorate: "${shipping.governorate}". Must be a recognized Lebanese region or diaspora.`);
    }
    if (typeof shipping.city !== 'string' || !shipping.city.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.city is required and must be a non-empty string.');
    }
    const rawStreet = shipping.street ?? shipping.address;
    if (typeof rawStreet !== 'string' || !rawStreet.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.street (or address) is required and must be a non-empty string.');
    }
    if (typeof shipping.building !== 'string' || !shipping.building.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.building is required and must be a non-empty string.');
    }
    const rawNotes = shipping.deliveryNotes ?? shipping.notes;
    if (rawNotes !== undefined && typeof rawNotes !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'shipping deliveryNotes must be a string if provided.');
    }
    if (shipping.fullName.trim().length > 200) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.fullName exceeds 200 characters.');
    }
    if (shipping.phone.trim().length > 50) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.phone exceeds 50 characters.');
    }
    if (shipping.governorate.trim().length > 100) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.governorate exceeds 100 characters.');
    }
    if (shipping.city.trim().length > 100) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.city exceeds 100 characters.');
    }
    if (rawStreet.trim().length > 200) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.street exceeds 200 characters.');
    }
    if (shipping.building.trim().length > 100) {
        throw new https_1.HttpsError('invalid-argument', 'shipping.building exceeds 100 characters.');
    }
    if (rawNotes && rawNotes.trim().length > 1000) {
        throw new https_1.HttpsError('invalid-argument', 'shipping deliveryNotes exceeds 1000 characters.');
    }
    // 4. Strict payment method validation (no silent conversion)
    if (typeof paymentMethod !== 'string' || !paymentMethod.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'paymentMethod is required and must be a valid payment method string.');
    }
    const normalizedPayment = paymentMethod.trim().toLowerCase();
    if (!exports.ALLOWED_PAYMENT_METHODS.includes(normalizedPayment)) {
        throw new https_1.HttpsError('invalid-argument', `Invalid payment method "${paymentMethod}". Allowed payment methods: ${exports.ALLOWED_PAYMENT_METHODS.join(', ')}.`);
    }
    const effectivePaymentMethod = normalizedPayment;
    // 5. Strict delivery speed validation (no silent fallback on invalid speed)
    if (deliverySpeed !== undefined) {
        if (typeof deliverySpeed !== 'string' || !deliverySpeed.trim()) {
            throw new https_1.HttpsError('invalid-argument', 'deliverySpeed must be a valid string if provided.');
        }
        const normSpeed = deliverySpeed.trim().toLowerCase();
        if (!exports.ALLOWED_DELIVERY_SPEEDS.includes(normSpeed)) {
            throw new https_1.HttpsError('invalid-argument', `Invalid deliverySpeed "${deliverySpeed}". Allowed speeds: ${exports.ALLOWED_DELIVERY_SPEEDS.join(', ')}.`);
        }
    }
    if (shipping.deliverySpeed !== undefined) {
        if (typeof shipping.deliverySpeed !== 'string' || !shipping.deliverySpeed.trim()) {
            throw new https_1.HttpsError('invalid-argument', 'shipping.deliverySpeed must be a valid string if provided.');
        }
        const normSpeed = shipping.deliverySpeed.trim().toLowerCase();
        if (!exports.ALLOWED_DELIVERY_SPEEDS.includes(normSpeed)) {
            throw new https_1.HttpsError('invalid-argument', `Invalid shipping.deliverySpeed "${shipping.deliverySpeed}". Allowed speeds: ${exports.ALLOWED_DELIVERY_SPEEDS.join(', ')}.`);
        }
    }
    const rawSpeed = deliverySpeed ?? shipping.deliverySpeed ?? 'standard';
    const effectiveSpeed = (typeof rawSpeed === 'string' ? rawSpeed.trim().toLowerCase() : 'standard');
    if (!exports.ALLOWED_DELIVERY_SPEEDS.includes(effectiveSpeed)) {
        throw new https_1.HttpsError('invalid-argument', `Invalid delivery speed "${rawSpeed}". Allowed speeds: ${exports.ALLOWED_DELIVERY_SPEEDS.join(', ')}.`);
    }
    // 6. Coupon code validation
    let cleanCouponCode = undefined;
    if (couponCode !== undefined) {
        if (typeof couponCode !== 'string') {
            throw new https_1.HttpsError('invalid-argument', 'couponCode must be a string if provided.');
        }
        cleanCouponCode = couponCode.trim();
        if (cleanCouponCode.length > 50) {
            throw new https_1.HttpsError('invalid-argument', 'couponCode exceeds 50 characters.');
        }
    }
    const cleanShipping = {
        fullName: shipping.fullName.trim(),
        phone: shipping.phone.trim(),
        governorate: shipping.governorate.trim(),
        city: shipping.city.trim(),
        street: rawStreet.trim(),
        building: shipping.building.trim(),
        deliveryNotes: rawNotes ? rawNotes.trim() : '',
        deliverySpeed: effectiveSpeed,
    };
    return {
        items,
        cleanShipping,
        effectivePaymentMethod,
        effectiveSpeed,
        couponCode: cleanCouponCode,
        totalQuantity,
        idempotencyKey: cleanIdempotencyKey,
    };
}
exports.placeOrder = (0, https_1.onCall)({
    region: 'europe-west1',
    enforceAppCheck: true,
}, async (req) => {
    const authUser = req.auth;
    const uid = authUser?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in to place an order.');
    }
    if (authUser?.token.email_verified !== true) {
        throw new https_1.HttpsError('failed-precondition', 'Please verify your email first.');
    }
    const { items, cleanShipping, effectivePaymentMethod, effectiveSpeed, couponCode, idempotencyKey, } = validatePlaceOrderPayload(req.data);
    const db = getDb();
    return db.runTransaction(async (tx) => {
        // 1. Transactional reads: Idempotency doc, products, discounts, bundles, and user profile read WITHIN transaction
        const idempotencyRef = db.doc(`order_idempotency/${uid}_${idempotencyKey}`);
        const productRefs = items.map(i => db.doc(`products/${i.productId.trim()}`));
        let couponQuery = undefined;
        if (couponCode) {
            couponQuery = db.collection('coupons').where('couponCode', '==', couponCode.trim().toUpperCase()).limit(1);
        }
        const [idempotencySnap, productSnaps, discountsSnap, bundlesSnap, userSnap, couponQuerySnap] = await Promise.all([
            tx.get(idempotencyRef),
            tx.getAll(...productRefs),
            tx.get(db.collection('discounts').where('isActive', '==', true)),
            tx.get(db.collection('product_bundles').where('isActive', '==', true)),
            tx.get(db.doc(`users/${uid}`)),
            couponQuery ? tx.get(couponQuery) : Promise.resolve(null),
        ]);
        const requestFingerprint = computeRequestFingerprint({
            items,
            shipping: cleanShipping,
            paymentMethod: effectivePaymentMethod,
            couponCode,
            deliverySpeed: effectiveSpeed,
        });
        // 2. Authoritative idempotency check with request fingerprint verification
        if (idempotencySnap.exists) {
            const existingData = idempotencySnap.data();
            if (existingData.requestFingerprint && existingData.requestFingerprint !== requestFingerprint) {
                throw new https_1.HttpsError('already-exists', 'Idempotency key reused with a different request payload.');
            }
            return {
                orderId: existingData.orderId,
                trackingNumber: existingData.trackingNumber,
                totalUSD: existingData.totalUSD,
                subtotalUSD: existingData.subtotalUSD,
                discountUSD: existingData.discountUSD,
                deliveryFeeUSD: existingData.deliveryFeeUSD,
                duplicate: true,
            };
        }
        // 3. Validate product existence, state, publication status, and stock
        const lines = items.map((line, idx) => {
            const snap = productSnaps[idx];
            if (!snap || !snap.exists) {
                throw new https_1.HttpsError('failed-precondition', `Product with ID "${line.productId}" does not exist.`);
            }
            const p = { id: snap.id, ...snap.data() };
            // Authoritative availability checks
            if (p.isPublished === false) {
                throw new https_1.HttpsError('failed-precondition', `Product "${p.name || snap.id}" is unpublished.`);
            }
            if (p.isActive === false || p.sellerActive === false || p.status === 'inactive' || p.status === 'archived' || p.status === 'draft') {
                throw new https_1.HttpsError('failed-precondition', `Product "${p.name || snap.id}" is currently inactive.`);
            }
            if (p.isAvailable === false || p.available === false) {
                throw new https_1.HttpsError('failed-precondition', `Product "${p.name || snap.id}" is unavailable.`);
            }
            const qty = line.quantity;
            const availableStock = typeof p.stock === 'number' ? p.stock : 0;
            if (availableStock < qty) {
                throw new https_1.HttpsError('resource-exhausted', `"${p.name || 'Product'}" only has ${availableStock} items in stock.`);
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
        const subtotalUSD = (0, pricing_js_1.round2)(lines.reduce((s, l) => s + l.unitPriceUSD * l.quantity, 0));
        if (subtotalUSD > exports.MAX_ORDER_VALUE_USD) {
            throw new https_1.HttpsError('invalid-argument', `Order subtotal ($${subtotalUSD.toFixed(2)}) exceeds maximum allowed limit of $${exports.MAX_ORDER_VALUE_USD.toLocaleString()} USD.`);
        }
        const isNewCustomer = !userSnap.exists || (userSnap.data()?.ordersPlaced ?? 0) === 0;
        let verifiedCouponDoc = null;
        if (couponQuerySnap && !couponQuerySnap.empty) {
            const cDoc = couponQuerySnap.docs[0];
            const cData = cDoc.data();
            const usageCount = cData.usageCount || 0;
            const usedBy = cData.usedBy || [];
            const userUses = usedBy.filter((u) => u === uid).length;
            let valid = true;
            if (typeof cData.maxTotalUses === 'number' && usageCount >= cData.maxTotalUses)
                valid = false;
            if (typeof cData.maxUsesPerUser === 'number' && userUses >= cData.maxUsesPerUser)
                valid = false;
            if (valid) {
                verifiedCouponDoc = cDoc;
            }
        }
        const rawDiscounts = discountsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (verifiedCouponDoc) {
            const cData = verifiedCouponDoc.data();
            const ruleIndex = rawDiscounts.findIndex(r => r.id === (cData.discountId || verifiedCouponDoc.id));
            if (ruleIndex >= 0) {
                rawDiscounts[ruleIndex].couponCode = cData.couponCode;
            }
        }
        const { discountUSD, appliedCoupon } = (0, pricing_js_1.computeDiscounts)({
            lines,
            discounts: rawDiscounts,
            bundles: bundlesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            couponCode,
            isNewCustomer,
            subtotalUSD,
        });
        const deliveryFeeUSD = (0, delivery_js_1.computeDelivery)(effectiveSpeed, cleanShipping.governorate, subtotalUSD - discountUSD);
        const totalUSD = (0, pricing_js_1.round2)(subtotalUSD - discountUSD + deliveryFeeUSD);
        // 4. Atomic stock & coupon updates
        for (const l of lines) {
            tx.update(l.ref, { stock: firestore_1.FieldValue.increment(-l.quantity) });
        }
        if (appliedCoupon && verifiedCouponDoc) {
            tx.update(verifiedCouponDoc.ref, {
                usageCount: firestore_1.FieldValue.increment(1),
                usedBy: firestore_1.FieldValue.arrayUnion(uid)
            });
        }
        // 5. Authoritative user profile handling
        if (!userSnap.exists) {
            tx.set(db.doc(`users/${uid}`), {
                uid,
                email: authUser.token.email || '',
                name: cleanShipping.fullName,
                phone: cleanShipping.phone,
                role: 'customer',
                isBanned: false,
                ordersPlaced: 1,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        else {
            const userData = userSnap.data();
            if (userData?.isBanned === true) {
                throw new https_1.HttpsError('permission-denied', 'Your customer account has been suspended.');
            }
            tx.set(db.doc(`users/${uid}`), {
                ordersPlaced: firestore_1.FieldValue.increment(1),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        // 6. Create authoritative Order record
        const orderRef = db.collection('orders').doc();
        const cryptoUuid = (0, node_crypto_1.randomUUID)();
        const trackingNumber = `LB-EXP-${cryptoUuid.slice(0, 12).toUpperCase()}`;
        // Canonical seller IDs exclusively from product.sellerId
        const canonicalSellerIds = Array.from(new Set(lines
            .map(l => (typeof l.product.sellerId === 'string' ? l.product.sellerId.trim() : ''))
            .filter((s) => Boolean(s))));
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
            sellerIds: canonicalSellerIds,
            shipping: cleanShipping,
            paymentMethod: effectivePaymentMethod,
            currency: 'USD',
            subtotalUSD,
            discountUSD,
            deliveryFeeUSD,
            totalUSD,
            totalLBP: Math.round(totalUSD * 89500),
            appliedCoupon: appliedCoupon || null,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        };
        tx.set(orderRef, orderData);
        const sellerSafeProduct = (p, selectedOpt, qty) => ({
            productId: p.id,
            name: p.name || '',
            arabicName: p.arabicName || '',
            image: p.image || '',
            sellerItemCode: p.sellerItemCode || '',
            selectedOption: selectedOpt || null,
            quantity: qty || 1,
        });
        // 6b. Create seller fulfillment documents atomically with seller-safe product snapshot
        for (const sId of canonicalSellerIds) {
            const sellerLines = lines.filter(l => (typeof l.product.sellerId === 'string' ? l.product.sellerId.trim() : '') === sId);
            const fulfillmentRef = db.doc(`order_fulfillment/${orderRef.id}/sellers/${sId}`);
            tx.set(fulfillmentRef, {
                orderId: orderRef.id,
                sellerId: sId,
                status: 'pending',
                items: sellerLines.map(l => sellerSafeProduct(l.product, l.selectedOption, l.quantity)),
                shipping: {
                    fullName: cleanShipping.fullName,
                    phone: cleanShipping.phone,
                    governorate: cleanShipping.governorate,
                    city: cleanShipping.city,
                    street: cleanShipping.street,
                    building: cleanShipping.building,
                    deliveryNotes: cleanShipping.deliveryNotes
                },
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        tx.set(idempotencyRef, {
            uid,
            idempotencyKey,
            requestFingerprint,
            orderId: orderRef.id,
            trackingNumber,
            totalUSD,
            subtotalUSD,
            discountUSD,
            deliveryFeeUSD,
            status: 'completed',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return {
            orderId: orderRef.id,
            trackingNumber,
            totalUSD,
            subtotalUSD,
            discountUSD,
            deliveryFeeUSD,
            duplicate: false,
        };
    });
});
//# sourceMappingURL=placeOrder.js.map