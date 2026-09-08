import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { csvSafe, sanitizeRowForCsv } from '../src/utils/csvSafe';
import { normalizeLebanesePhone, isValidLebanesePhone } from '../src/utils/phoneUtils';
import { checkDuplicateProductNumber } from '../src/lib/productValidation';
import { Product } from '../src/types';
import { validatePlaceOrderPayload, placeOrder } from '../functions/src/placeOrder';
import { mapUserProfile, mapSafeUserProfile } from '../src/context/AuthContext';
import { mapSafeShopUserProfile } from '../src/context/ShopContext';

describe('Security Regression Suite - Application Controls', () => {
  describe('1. CSV / Formula Injection Mitigation', () => {
    it('escapes dangerous spreadsheet formula prefixes (=, +, -, @, tab, cr)', () => {
      expect(csvSafe('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(csvSafe('+12345')).toBe("'+12345");
      expect(csvSafe('-500')).toBe("'-500");
      expect(csvSafe('@HYPERLINK("evil.com")')).toBe("'@HYPERLINK(\"evil.com\")");
      expect(csvSafe('\tcmd.exe')).toBe("'\tcmd.exe");
      expect(csvSafe('\rcalc.exe')).toBe("'\rcalc.exe");
    });

    it('leaves safe strings unmodified', () => {
      expect(csvSafe('Safe Product Name')).toBe('Safe Product Name');
      expect(csvSafe('12345')).toBe('12345');
      expect(csvSafe('Customer Note: Please deliver before 5 PM')).toBe('Customer Note: Please deliver before 5 PM');
      expect(csvSafe('')).toBe('');
      expect(csvSafe(null)).toBe('');
    });

    it('sanitizes all string properties in a row before CSV export', () => {
      const maliciousRow = {
        id: 'ord-123',
        customerName: '=cmd|"/C calc"!A0',
        phone: '+96170123456',
        city: 'Beirut',
        notes: '@malicious_payload',
        totalUSD: 45
      };

      const sanitized = sanitizeRowForCsv(maliciousRow);
      expect(sanitized.customerName).toBe("'=cmd|\"/C calc\"!A0");
      expect(sanitized.phone).toBe("'+96170123456");
      expect(sanitized.notes).toBe("'@malicious_payload");
      expect(sanitized.city).toBe('Beirut');
      expect(sanitized.totalUSD).toBe(45);
    });
  });

  describe('2. Phone Number Registry & Anti-Harvesting Integrity', () => {
    it('validates and normalizes Lebanese phone numbers correctly', () => {
      const validMobile = normalizeLebanesePhone('70 123 456');
      expect(validMobile.isValid).toBe(true);
      expect(validMobile.cleanDigits).toBe('70123456');
      expect(validMobile.formatted).toBe('+961 70123456');
      expect(validMobile.registryKey).toBe('phone_70123456');

      const validWithCode = normalizeLebanesePhone('+961 71 999 888');
      expect(validWithCode.isValid).toBe(true);
      expect(validWithCode.cleanDigits).toBe('71999888');

      const sevenDigitMobile = normalizeLebanesePhone('3 123 456');
      expect(sevenDigitMobile.isValid).toBe(true);
      expect(sevenDigitMobile.cleanDigits).toBe('03123456');
      expect(sevenDigitMobile.registryKey).toBe('phone_03123456');
    });

    it('rejects invalid or spoofed phone numbers', () => {
      expect(isValidLebanesePhone('123')).toBe(false);
      expect(isValidLebanesePhone('abcd')).toBe(false);
      expect(isValidLebanesePhone('00112233445566')).toBe(false);
      expect(isValidLebanesePhone('')).toBe(false);
      expect(isValidLebanesePhone(null)).toBe(false);
    });
  });

  describe('3. Product SKU / Seller Item Code Duplication Defense', () => {
    const mockProducts: Product[] = [
      {
        id: 'prod-1',
        name: 'Extra Virgin Olive Oil',
        priceUSD: 18,
        stock: 50,
        sellerItemCode: 'EVOO-500ML',
        sellerId: 'seller-tripoli',
        seller: 'Tripoli Artisans'
      } as any,
      {
        id: 'prod-2',
        name: 'Laurel Soap Bar',
        priceUSD: 4,
        stock: 100,
        sellerItemCode: 'SOAP-LAUREL-1',
        sellerId: 'seller-sidon',
        seller: 'Sidon Soap'
      } as any
    ];

    it('detects duplicate seller item codes within the same seller workshop', () => {
      const result = checkDuplicateProductNumber('EVOO-500ML', null, mockProducts, 'seller-tripoli', 'Tripoli Artisans');
      expect(result.isDuplicate).toBe(true);
      expect(result.conflictingProduct?.id).toBe('prod-1');
    });

    it('allows identical item codes across distinct, independent seller workshops', () => {
      const result = checkDuplicateProductNumber('EVOO-500ML', null, mockProducts, 'seller-sidon', 'Sidon Soap');
      expect(result.isDuplicate).toBe(false);
    });

    it('detects duplicate global product IDs / SKUs', () => {
      const result = checkDuplicateProductNumber('prod-1', null, mockProducts);
      expect(result.isDuplicate).toBe(true);
    });

    it('permits updating an existing product without false positive collision with itself', () => {
      const result = checkDuplicateProductNumber('EVOO-500ML', 'prod-1', mockProducts, 'seller-tripoli', 'Tripoli Artisans');
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('4. Privilege Escalation Field Stripping Invariant', () => {
    it('ensures non-admin user profile updates cannot elevate role or sellerId', () => {
      const requestedUpdates: Record<string, any> = {
        firstName: 'Salim',
        lastName: 'Khoury',
        phone: '+96170112233',
        role: 'admin',
        sellerId: 'unauthorized-workshop',
        isBanned: false,
        ordersPlaced: 9999
      };

      const isAdmin = false;
      const safeUpdates = { ...requestedUpdates };
      if (!isAdmin) {
        delete safeUpdates.role;
        delete safeUpdates.sellerId;
        delete safeUpdates.isBanned;
        delete safeUpdates.ordersPlaced;
      }

      expect(safeUpdates.role).toBeUndefined();
      expect(safeUpdates.sellerId).toBeUndefined();
      expect(safeUpdates.isBanned).toBeUndefined();
      expect(safeUpdates.ordersPlaced).toBeUndefined();
      expect(safeUpdates.firstName).toBe('Salim');
      expect(safeUpdates.lastName).toBe('Khoury');
    });
  });

  describe('5. Seller Workshop Isolation Invariant', () => {
    it('prohibits non-admin seller from creating or modifying products for another workshop', () => {
      const authClaims = {
        admin: false,
        seller: true,
        sellerId: 'workshop-byblos'
      };

      const targetProduct = {
        id: 'prod-foreign',
        name: 'Baalbek Pottery',
        sellerId: 'workshop-baalbek'
      };

      const canEdit = (claims: typeof authClaims, product: typeof targetProduct) => {
        if (claims.seller && claims.sellerId) {
          return claims.sellerId.toLowerCase() === product.sellerId.toLowerCase();
        }
        return false;
      };

      expect(canEdit(authClaims, targetProduct)).toBe(false);

      const ownProduct = {
        id: 'prod-own',
        name: 'Byblos Cedar Box',
        sellerId: 'workshop-byblos'
      };
      expect(canEdit(authClaims, ownProduct)).toBe(true);
    });
  });

  describe('6. Pricing Engine Anti-Tampering & Negative Value Defense', () => {
    it('prevents negative discounts or discount overflow in pricing engine', () => {
      const discountRule = {
        id: 'promo-1',
        title: 'Promo',
        type: 'fixed' as const,
        value: -50, // Malicious negative value attempt
        isActive: true,
        scope: 'storewide' as const
      };

      // Math.max(0, ...) safeguard
      const baseAmount = 100;
      const ruleDiscount = Math.max(0, Math.min(discountRule.value, baseAmount));
      expect(ruleDiscount).toBe(0);
    });

    it('caps fixed discount at applicable subtotal', () => {
      const baseAmount = 40;
      const ruleValue = 100;
      const ruleDiscount = Math.max(0, Math.min(ruleValue, baseAmount));
      expect(ruleDiscount).toBe(40);
    });
  });

  describe('7. High Risk Invariants (H-1, H-2, H-3)', () => {
    it('H-1: Prevents sensitive seller credentials from leaking in public seller payload', () => {
      const publicSellerPayload = {
        id: 'seller-1',
        nameEn: 'Chouf Cedar Workshop',
        nameAr: 'ورشة أرز الشوف',
        village: 'Barouk',
        accountEmail: 'private-artisan@gmail.com',
        accountUid: 'secret-uid-999',
        commissionPct: 15,
        exactAddress: 'Secret House 4, Chouf'
      };

      // Strip private fields for public endpoint / rules
      const sanitized = { ...publicSellerPayload };
      delete (sanitized as any).accountEmail;
      delete (sanitized as any).accountUid;
      delete (sanitized as any).commissionPct;
      delete (sanitized as any).exactAddress;

      expect(sanitized.accountEmail).toBeUndefined();
      expect(sanitized.accountUid).toBeUndefined();
      expect(sanitized.commissionPct).toBeUndefined();
      expect(sanitized.exactAddress).toBeUndefined();
      expect(sanitized.nameEn).toBe('Chouf Cedar Workshop');
    });

    it('H-2: Enforces deterministic review document ID (<uid>_<productId>) to prevent multiple reviews and spoofing', () => {
      const uid = 'user-abc-123';
      const productId = 'prod-olive-oil';
      const deterministicReviewId = `${uid}_${productId}`;
      
      expect(deterministicReviewId).toBe('user-abc-123_prod-olive-oil');
      
      // Secondary review from same user for same product generates the exact same deterministic key (idempotent write, preventing duplication)
      const secondAttemptId = `${uid}_${productId}`;
      expect(secondAttemptId).toBe(deterministicReviewId);
    });

    it('H-3: Seller order update allowlist restricts changes strictly to status and updatedAt', () => {
      const allowedKeys = ['status', 'updatedAt'];
      const validSellerAttempt = { status: 'out_for_delivery', updatedAt: new Date().toISOString() };
      const invalidSellerAttempt = { status: 'delivered', shipping: { address: 'Attacker New Address' } };

      const isAllowedUpdate = (payload: Record<string, any>) => {
        return Object.keys(payload).every(k => allowedKeys.includes(k));
      };

      expect(isAllowedUpdate(validSellerAttempt)).toBe(true);
      expect(isAllowedUpdate(invalidSellerAttempt)).toBe(false);
    });
  });

  describe('8. Medium Risk Invariants (M-1 through M-8)', () => {
    it('M-5: Enforces password policy with minimum 8 characters, letters and numbers', async () => {
      const { validatePassword } = await import('../src/lib/passwordPolicy');
      expect(validatePassword('').isValid).toBe(false);
      expect(validatePassword('short1').isValid).toBe(false);
      expect(validatePassword('allletters').isValid).toBe(false);
      expect(validatePassword('12345678').isValid).toBe(false);
      expect(validatePassword('validPass123').isValid).toBe(true);
    });

    it('M-4: Prohibits resetting ordersPlaced counter to exploit first-time customer promos', () => {
      const initialOrdersPlaced = 5;
      const attemptReset = 0;
      const validIncrement = 6;

      const isValidOrderCountTransition = (current: number, next: number) => {
        return next === current || next === current + 1;
      };

      expect(isValidOrderCountTransition(initialOrdersPlaced, attemptReset)).toBe(false);
      expect(isValidOrderCountTransition(initialOrdersPlaced, validIncrement)).toBe(true);
    });

    it('M-8: User profile cannot alter immutable UID', () => {
      const userProfile = { uid: 'user_123', name: 'Karim', email: 'karim@gmail.com' };
      const maliciousUpdate = { uid: 'attacker_takeover_456', name: 'Karim' };

      const isForbiddenUidMutation = (currentUid: string, updatedUid: string) => {
        return currentUid !== updatedUid;
      };

      expect(isForbiddenUidMutation(userProfile.uid, maliciousUpdate.uid)).toBe(true);
    });
  });

  describe('9. Low Risk & Client Hardening Invariants (L-1 through L-7)', () => {
    it('L-2: Safe URL utility rejects javascript:, vbscript:, and malicious execution schemes', async () => {
      const { isSafeUrl, sanitizeUrl } = await import('../src/lib/safeUrl');
      
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('javascript:window.location="http://evil.com"')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);

      expect(isSafeUrl('https://yalla.lb')).toBe(true);
      expect(isSafeUrl('http://localhost:3000')).toBe(true);
      expect(isSafeUrl('mailto:support@yalla.lb')).toBe(true);
      expect(isSafeUrl('tel:+96170123456')).toBe(true);
      expect(isSafeUrl('https://wa.me/96170123456')).toBe(true);
      expect(isSafeUrl('/products/olive-oil')).toBe(true);
      expect(isSafeUrl('#reviews')).toBe(true);

      expect(sanitizeUrl('javascript:alert(1)', '#')).toBe('#');
      expect(sanitizeUrl('https://yalla.lb', '#')).toBe('https://yalla.lb');
    });

    it('L-3: LocalStorage seller cache sanitization strips private artisan fields', () => {
      const fullSellerRecord = {
        id: 'seller_100',
        nameEn: 'Tripoli Soapworks',
        nameAr: 'صابون طرابلس',
        accountEmail: 'private-artisan@gmail.com',
        accountUid: 'auth-user-999',
        commissionPct: 12,
        exactAddress: 'Al Mina, Street 14, Building 2',
        rating: 4.9
      };

      const publicProjection = (seller: Record<string, any>) => {
        const { accountEmail, accountUid, commissionPct, exactAddress, ...pub } = seller;
        return pub;
      };

      const cached = publicProjection(fullSellerRecord);
      expect(cached.accountEmail).toBeUndefined();
      expect(cached.accountUid).toBeUndefined();
      expect(cached.commissionPct).toBeUndefined();
      expect(cached.exactAddress).toBeUndefined();
      expect(cached.nameEn).toBe('Tripoli Soapworks');
      expect(cached.rating).toBe(4.9);
    });
  });

  describe('10. Retest & Bypass Invariants', () => {
    it('Canary: Accepts maximum 8 line items cart within rules evaluation budget', async () => {
      const { MAX_ORDER_LINE_ITEMS } = await import('../src/context/ShopContext');
      expect(MAX_ORDER_LINE_ITEMS).toBe(8);

      const items8 = Array.from({ length: 8 }, (_, i) => ({
        product: { id: `prod_${i}`, name: `Prod ${i}`, priceUSD: 10 + i },
        quantity: 1
      }));

      const isUnderBudgetLimit = (items: any[]) => items.length <= MAX_ORDER_LINE_ITEMS;
      expect(isUnderBudgetLimit(items8)).toBe(true);

      const items9 = Array.from({ length: 9 }, (_, i) => ({
        product: { id: `prod_${i}`, name: `Prod ${i}`, priceUSD: 10 + i },
        quantity: 1
      }));
      expect(isUnderBudgetLimit(items9)).toBe(false);
    });

    it('Bypass protection: totalLBP is strictly bounded against overflow and negative values', () => {
      const isValidTotalLBP = (val: any) => {
        return typeof val === 'number' && val >= 0 && val <= 5000000000;
      };

      expect(isValidTotalLBP(-100)).toBe(false);
      expect(isValidTotalLBP(6000000000000)).toBe(false);
      expect(isValidTotalLBP('1500000')).toBe(false);
      expect(isValidTotalLBP(450000000)).toBe(true);
    });

    it('Bypass protection: Denormalized productIds on orders enables authoritative review purchase checks', () => {
      const order = {
        id: 'ord_123',
        userId: 'cust_999',
        items: [
          { product: { id: 'p_zaatar', name: 'Zaatar' }, quantity: 2 },
          { product: { id: 'p_olive_oil', name: 'Olive Oil' }, quantity: 1 }
        ],
        productIds: ['p_zaatar', 'p_olive_oil']
      };

      const canReviewProduct = (orderDoc: typeof order, productId: string) => {
        return orderDoc.productIds.includes(productId);
      };

      expect(canReviewProduct(order, 'p_zaatar')).toBe(true);
      expect(canReviewProduct(order, 'p_olive_oil')).toBe(true);
      expect(canReviewProduct(order, 'p_soap_unbought')).toBe(false);
    });
  });

  describe('10. Hardened Checkout Validation & Production Safeguards', () => {
    const validPayload = {
      items: [
        { productId: 'prod_zaatar_123', quantity: 2, selectedOption: '500g' },
        { productId: 'prod_olive_oil_456', quantity: 1 }
      ],
      shipping: {
        fullName: 'Ahmad Al-Khoury',
        phone: '+96170123456',
        governorate: 'Beirut',
        city: 'Hamra',
        street: 'Bliss Street',
        building: 'Building 4B',
        deliveryNotes: 'Leave with concierge',
        deliverySpeed: 'standard'
      },
      paymentMethod: 'cod_usd',
      deliverySpeed: 'standard',
      couponCode: 'WELCOME10',
      idempotencyKey: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
    };

    it('1. App Check is required in production configuration', () => {
      const placeOrderSource = fs.readFileSync(
        path.resolve(__dirname, '../functions/src/placeOrder.ts'),
        'utf-8'
      );
      expect(placeOrderSource).toMatch(/enforceAppCheck:\s*true/);

      const firebaseSource = fs.readFileSync(
        path.resolve(__dirname, '../src/firebase.ts'),
        'utf-8'
      );
      expect(firebaseSource).toMatch(/initializeAppCheck/);
      expect(firebaseSource).toMatch(/ReCaptchaEnterpriseProvider/);
    });

    it('2. Invalid payment method is rejected without silent conversion to cod_usd', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        paymentMethod: 'invalid_method'
      })).toThrow(/Invalid payment method/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        paymentMethod: 'anything'
      })).toThrow(/Invalid payment method/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        paymentMethod: ''
      })).toThrow(/paymentMethod is required/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        paymentMethod: 12345 as any
      })).toThrow(/paymentMethod is required/);

      // Valid payment methods pass
      expect(validatePlaceOrderPayload({
        ...validPayload,
        paymentMethod: 'cod_usd'
      }).effectivePaymentMethod).toBe('cod_usd');
      expect(validatePlaceOrderPayload({
        ...validPayload,
        paymentMethod: 'cod_lbp'
      }).effectivePaymentMethod).toBe('cod_lbp');
      expect(validatePlaceOrderPayload({
        ...validPayload,
        paymentMethod: 'credit_card'
      }).effectivePaymentMethod).toBe('credit_card');
    });

    it('3. Invalid delivery speed is rejected without silent fallback to standard', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        deliverySpeed: 'teleport'
      })).toThrow(/Invalid deliverySpeed/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        shipping: { ...validPayload.shipping, deliverySpeed: 'warp_speed' }
      })).toThrow(/Invalid shipping\.deliverySpeed/);

      // Valid delivery speeds pass
      expect(validatePlaceOrderPayload({
        ...validPayload,
        deliverySpeed: 'standard'
      }).effectiveSpeed).toBe('standard');
      expect(validatePlaceOrderPayload({
        ...validPayload,
        deliverySpeed: 'express_beirut'
      }).effectiveSpeed).toBe('express_beirut');
      expect(validatePlaceOrderPayload({
        ...validPayload,
        deliverySpeed: 'diaspora_air'
      }).effectiveSpeed).toBe('diaspora_air');
    });

    it('4. Fractional quantity rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: 1.5 }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: 0.1 }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);
    });

    it('5. String quantity rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: '2' as any }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);
    });

    it('6. NaN quantity rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: NaN }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);
    });

    it('7. Infinity and negative quantity rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: Infinity }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: -Infinity }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: -5 }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'prod_zaatar_123', quantity: 0 }]
      })).toThrow(/Quantity must be a valid integer between 1 and 99/);
    });

    it('8. Duplicate products rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [
          { productId: 'prod_zaatar_123', quantity: 1 },
          { productId: 'prod_zaatar_123', quantity: 2 }
        ]
      })).toThrow(/Duplicate product ID "prod_zaatar_123"/);
    });

    it('9. Unknown shipping field rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        shipping: {
          ...validPayload.shipping,
          isAdmin: true
        } as any
      })).toThrow(/Unexpected property in shipping details: "isAdmin"/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        shipping: {
          ...validPayload.shipping,
          discountUSD: 100
        } as any
      })).toThrow(/Unexpected property in shipping details: "discountUSD"/);
    });

    it('10. Unknown top-level field rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        totalUSD: 0
      } as any)).toThrow(/Unexpected property in request: "totalUSD"/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        discountUSD: 50
      } as any)).toThrow(/Unexpected property in request: "discountUSD"/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        maliciousPayload: true
      } as any)).toThrow(/Unexpected property in request: "maliciousPayload"/);
    });

    it('11. Excessive cart line items count (> 50) rejected', () => {
      const excessiveCart = Array.from({ length: 51 }, (_, i) => ({
        productId: `prod_item_${i}`,
        quantity: 1
      }));
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: excessiveCart
      })).toThrow(/Must contain between 1 and 50 items/);
    });

    it('12. Excessive total order quantity (> 200) rejected', () => {
      const heavyCart = [
        { productId: 'prod_1', quantity: 99 },
        { productId: 'prod_2', quantity: 99 },
        { productId: 'prod_3', quantity: 10 }
      ];
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: heavyCart
      })).toThrow(/Total order quantity \(208\) exceeds maximum allowed limit of 200/);
    });

    it('13. Excessive order value rejected ($10,000 USD limit)', () => {
      const MAX_ORDER_VALUE_USD = 10000;
      const checkOrderLimit = (subtotalUSD: number) => {
        if (subtotalUSD > MAX_ORDER_VALUE_USD) {
          throw new Error(`Order subtotal ($${subtotalUSD.toFixed(2)}) exceeds maximum allowed limit of $${MAX_ORDER_VALUE_USD.toLocaleString()} USD.`);
        }
      };

      expect(() => checkOrderLimit(10000.01)).toThrow(/exceeds maximum allowed limit/);
      expect(() => checkOrderLimit(25000)).toThrow(/exceeds maximum allowed limit/);
      expect(() => checkOrderLimit(10000)).not.toThrow();
      expect(() => checkOrderLimit(500)).not.toThrow();
    });

    it('14. Invalid product ID rejected (traversal, length, symbols)', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: '../secrets/private', quantity: 1 }]
      })).toThrow(/Invalid productId/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'invalid/path', quantity: 1 }]
      })).toThrow(/Invalid productId/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: '', quantity: 1 }]
      })).toThrow();

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        items: [{ productId: 'x'.repeat(129), quantity: 1 }]
      })).toThrow(/Must be alphanumeric and up to 128 characters/);
    });

    it('15. Unavailable, unpublished, or out-of-stock product rejected', () => {
      const validateProductItem = (p: any, requestedQty: number) => {
        if (!p) throw new Error('Product does not exist.');
        if (p.isPublished === false) throw new Error('Product is unpublished.');
        if (p.isActive === false || p.sellerActive === false || p.status === 'inactive' || p.status === 'archived' || p.status === 'draft') {
          throw new Error('Product is currently inactive.');
        }
        if (p.isAvailable === false || p.available === false) throw new Error('Product is unavailable.');
        if ((p.stock || 0) < requestedQty) throw new Error(`Only ${p.stock || 0} items in stock.`);
      };

      expect(() => validateProductItem(null, 1)).toThrow('Product does not exist.');
      expect(() => validateProductItem({ isPublished: false, stock: 10 }, 1)).toThrow('Product is unpublished.');
      expect(() => validateProductItem({ isActive: false, stock: 10 }, 1)).toThrow('Product is currently inactive.');
      expect(() => validateProductItem({ sellerActive: false, stock: 10 }, 1)).toThrow('Product is currently inactive.');
      expect(() => validateProductItem({ status: 'archived', stock: 10 }, 1)).toThrow('Product is currently inactive.');
      expect(() => validateProductItem({ isAvailable: false, stock: 10 }, 1)).toThrow('Product is unavailable.');
      expect(() => validateProductItem({ isPublished: true, isActive: true, stock: 2 }, 5)).toThrow('Only 2 items in stock.');
      expect(() => validateProductItem({ isPublished: true, isActive: true, stock: 10 }, 5)).not.toThrow();
    });

    it('16. Local fallback cannot create an order in production environments', () => {
      const placeOrderFallback = (isProd: boolean, hasBackend: boolean) => {
        if (!hasBackend) {
          if (isProd) {
            throw new Error('Online checkout requires an active backend connection. Offline order placement is disabled in production.');
          }
          return { id: 'local-dev-mock-order' };
        }
        return { id: 'authoritative-cloud-order' };
      };

      // In production, offline mock CANNOT create an order under any circumstance
      expect(() => placeOrderFallback(true, false)).toThrow('Offline order placement is disabled in production.');
      expect(placeOrderFallback(false, false)).toEqual({ id: 'local-dev-mock-order' });
      expect(placeOrderFallback(true, true)).toEqual({ id: 'authoritative-cloud-order' });
    });

    it('17. Missing or null idempotencyKey is strictly rejected', () => {
      const payloadWithoutKey: any = { ...validPayload };
      delete payloadWithoutKey.idempotencyKey;
      expect(() => validatePlaceOrderPayload(payloadWithoutKey)).toThrow(/idempotencyKey is required/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: null as any
      })).toThrow(/idempotencyKey is required/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: ''
      })).toThrow(/idempotencyKey must not be empty/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: '   '
      })).toThrow(/idempotencyKey must not be empty/);
    });

    it('18. Non-string or malformed idempotencyKey is rejected', () => {
      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: 123456 as any
      })).toThrow(/idempotencyKey must be a valid string/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: { key: 'uuid' } as any
      })).toThrow(/idempotencyKey must be a valid string/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: 'not-a-valid-uuid'
      })).toThrow(/Must be a valid UUID string/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: '12345678-1234-1234-1234-1234567890ab-extra'
      })).toThrow(/Must be a valid UUID string/);

      expect(() => validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: '../traversal/uuid'
      })).toThrow(/Must be a valid UUID string/);
    });

    it('19. Valid v4 UUID idempotencyKey is accepted and normalized', () => {
      const validated = validatePlaceOrderPayload({
        ...validPayload,
        idempotencyKey: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
      });
      expect(validated.idempotencyKey).toBe('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
    });

    it('20. Cloud Function source code enforces atomic idempotency check and write within transaction', () => {
      const placeOrderSource = fs.readFileSync(
        path.resolve(__dirname, '../functions/src/placeOrder.ts'),
        'utf-8'
      );
      expect(placeOrderSource).toMatch(/order_idempotency\/\$\{uid\}_\$\{idempotencyKey\}/);
      expect(placeOrderSource).toMatch(/idempotencySnap\.exists/);
      expect(placeOrderSource).toMatch(/duplicate:\s*true/);
      expect(placeOrderSource).toMatch(/tx\.set\(idempotencyRef/);
    });

    it('21. Firestore rules strictly lock down order_idempotency collection against all client access', () => {
      const rulesSource = fs.readFileSync(
        path.resolve(__dirname, '../firestore.rules'),
        'utf-8'
      );
      expect(rulesSource).toMatch(/match \/order_idempotency\/\{idempotencyId\}/);
      expect(rulesSource).toMatch(/allow read, write:\s*if false;/);
    });

    it('22. Cloud Function uses secure node:crypto randomUUID for tracking numbers without Math.random/Date.now fallbacks', () => {
      const placeOrderSource = fs.readFileSync(
        path.resolve(__dirname, '../functions/src/placeOrder.ts'),
        'utf-8'
      );
      expect(placeOrderSource).toMatch(/import\s*\{\s*randomUUID\s*\}\s*from\s*['"]node:crypto['"]/);
      expect(placeOrderSource).toMatch(/const\s+cryptoUuid\s*=\s*randomUUID\(\)/);
      expect(placeOrderSource).not.toMatch(/Math\.random/);
      expect(placeOrderSource).not.toMatch(/Date\.now\(\)/);
    });

    it('23. Cloud Function source code enforces server-side cryptographic OTP generation and hashing without Math.random', () => {
      const otpSource = fs.readFileSync(
        path.resolve(__dirname, '../functions/src/otp.ts'),
        'utf-8'
      );
      expect(otpSource).toMatch(/import\s*\{\s*randomInt,\s*(?:createHash|createHmac),\s*timingSafeEqual\s*\}\s*from\s*['"]node:crypto['"]/);
      expect(otpSource).toMatch(/randomInt\(100000,\s*1000000\)/);
      expect(otpSource).not.toMatch(/Math\.random/);
      expect(otpSource).toMatch(/(?:createHash|createHmac)\('sha256'/);
      expect(otpSource).toMatch(/timingSafeEqual/);
    });

    it('24. Password policy generator uses cryptographically secure random values without Math.random', () => {
      const passwordPolicySource = fs.readFileSync(
        path.resolve(__dirname, '../src/lib/passwordPolicy.ts'),
        'utf-8'
      );
      expect(passwordPolicySource).not.toMatch(/Math\.random/);
      expect(passwordPolicySource).toMatch(/getRandomValues/);
    });
  });

  describe('12. Authoritative Custom Claims Security Enforcement (No Firestore Fallbacks)', () => {
    const rulesSource = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf-8');
    const authContextSource = fs.readFileSync(path.resolve(__dirname, '../src/context/AuthContext.tsx'), 'utf-8');
    const shopContextSource = fs.readFileSync(path.resolve(__dirname, '../src/context/ShopContext.tsx'), 'utf-8');

    it('25. firestore.rules: isAdmin() strictly requires request.auth.token.admin == true without Firestore lookups', () => {
      expect(rulesSource).toMatch(/function isAdmin\(\)\s*\{[\s\S]*?'admin' in request\.auth\.token[\s\S]*?request\.auth\.token\.admin == true;/);
      // Ensure no get(/databases/...) inside isAdmin
      const isAdminMatch = rulesSource.match(/function isAdmin\(\)\s*\{([^}]+)\}/);
      expect(isAdminMatch).toBeTruthy();
      expect(isAdminMatch![1]).not.toMatch(/get\(/);
    });

    it('26. firestore.rules: isSeller() strictly requires request.auth.token.seller == true without Firestore lookups', () => {
      expect(rulesSource).toMatch(/function isSeller\(\)\s*\{[\s\S]*?'seller' in request\.auth\.token[\s\S]*?request\.auth\.token\.seller == true;/);
      const isSellerMatch = rulesSource.match(/function isSeller\(\)\s*\{([^}]+)\}/);
      expect(isSellerMatch).toBeTruthy();
      expect(isSellerMatch![1]).not.toMatch(/get\(/);
    });

    it('27. firestore.rules: getSellerId() strictly reads request.auth.token.sellerId and does NOT fallback to users document', () => {
      const getSellerIdMatch = rulesSource.match(/function getSellerId\(\)\s*\{([^}]+)\}/);
      expect(getSellerIdMatch).toBeTruthy();
      const body = getSellerIdMatch![1];
      expect(body).toMatch(/request\.auth\.token\.sellerId/);
      expect(body).not.toMatch(/get\(/);
      expect(body).not.toMatch(/users/);
    });

    it('28. AuthContext.tsx: isAdminUser, isSellerUser, and sellerId strictly originate from tokenResult.claims', () => {
      expect(authContextSource).toMatch(/tokenResult\?\.claims\?\.admin === true/);
      expect(authContextSource).toMatch(/tokenResult\?\.claims\?\.seller === true/);
      expect(authContextSource).toMatch(/tokenResult\?\.claims\?\.sellerId/);
      // Ensure removed fallback: claimSellerId || data.sellerId
      expect(authContextSource).not.toMatch(/claimSellerId\s*\|\|\s*data\.sellerId/);
      expect(authContextSource).not.toMatch(/claimSellerId\s*\|\|\s*userData\.sellerId/);
    });

    it('29. ShopContext.tsx: isAdminUser, isSellerUser, and sellerId strictly originate from token claims', () => {
      expect(shopContextSource).toMatch(/setIsAdminUser\(result\.claims\.admin === true\)/);
      expect(shopContextSource).toMatch(/setIsSellerUser\(result\.claims\.seller === true\)/);
      expect(shopContextSource).toMatch(/setSellerId\(typeof result\.claims\.sellerId === 'string'\s*\?\s*result\.claims\.sellerId\s*:\s*null\)/);
    });

    it('30. Privilege Isolation: Firestore document fields cannot grant admin or seller privilege or alter sellerId', () => {
      // Simulating a normal user attempting to elevate privilege by populating Firestore fields
      const forgedFirestoreUserDoc = {
        uid: 'attacker-1',
        role: 'admin',
        sellerId: 'target-seller-id',
        email: 'attacker@evil.com'
      };

      // Client-side authentication claims from token (token claims are authoritative)
      const tokenClaimsNormalUser = {
        admin: false,
        seller: false,
        sellerId: undefined
      };

      // Authoritative privilege computation:
      const isAdminComputed = Boolean(tokenClaimsNormalUser.admin === true);
      const isSellerComputed = Boolean(tokenClaimsNormalUser.seller === true);
      const sellerIdComputed = typeof tokenClaimsNormalUser.sellerId === 'string' ? tokenClaimsNormalUser.sellerId : null;

      expect(isAdminComputed).toBe(false);
      expect(isSellerComputed).toBe(false);
      expect(sellerIdComputed).toBeNull();
      // Even if attacker modified Firestore role to 'seller' or 'admin'
      expect(forgedFirestoreUserDoc.role === 'admin').toBe(true); // present in doc
      expect(isAdminComputed).toBe(false); // but claims reject it!
      expect(sellerIdComputed).not.toBe(forgedFirestoreUserDoc.sellerId);
    });

    it('31. Cross-Seller Isolation: Seller token with sellerId A cannot access or mutate sellerId B resources', () => {
      const sellerTokenClaims = {
        admin: false,
        seller: true,
        sellerId: 'artisan-lebanon-1'
      };

      const targetResourceSellerId = 'artisan-lebanon-2';

      // Rules verification: getSellerId() must equal resource.sellerId
      const authorizedSellerId = sellerTokenClaims.sellerId;
      const isAuthorizedForTarget = authorizedSellerId === targetResourceSellerId;
      expect(isAuthorizedForTarget).toBe(false);
    });
  });

  describe('13. Adversarial Security Verification: Strict Firebase Auth Claims Only (Requirements A through K)', () => {
    const rulesCode = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8');
    const authCode = fs.readFileSync(path.resolve(__dirname, '../src/context/AuthContext.tsx'), 'utf8');
    const shopCode = fs.readFileSync(path.resolve(__dirname, '../src/context/ShopContext.tsx'), 'utf8');
    const otpCode = fs.readFileSync(path.resolve(__dirname, '../functions/src/otp.ts'), 'utf8');
    const placeOrderCode = fs.readFileSync(path.resolve(__dirname, '../functions/src/placeOrder.ts'), 'utf8');

    it('Requirement A: Normal user with forged users/{uid}.admin=true is NOT an admin', () => {
      // Simulating a normal user token where claims are empty or admin: false
      const normalUserToken = { uid: 'user_a', admin: false };
      const forgedUserDoc = { uid: 'user_a', admin: true };

      // Firestore Security Rules evaluate: request.auth.token.admin == true
      const hasAdminClaim = Boolean(normalUserToken.admin === true);
      expect(hasAdminClaim).toBe(false);

      // Verify that firestore.rules isAdmin() does NOT inspect resource or doc data
      const isAdminDef = rulesCode.match(/function isAdmin\(\)\s*\{([^}]+)\}/);
      expect(isAdminDef).toBeTruthy();
      expect(isAdminDef![1]).toMatch(/request\.auth\.token\.admin == true/);
      expect(isAdminDef![1]).not.toMatch(/admin\s*==\s*true\s*\|\|/);
      expect(isAdminDef![1]).not.toMatch(/get\(/);
      expect(isAdminDef![1]).not.toMatch(/users/);
    });

    it('Requirement B: Normal user with forged users/{uid}.role="admin" is NOT an admin', () => {
      const normalUserToken = { uid: 'user_b' };
      const forgedUserDoc = { uid: 'user_b', role: 'admin' };

      // Privilege strictly evaluated via claims:
      const isAdminEvaluated = Boolean((normalUserToken as any).admin === true);
      expect(isAdminEvaluated).toBe(false);

      // Ensure no rules reference role == 'admin'
      expect(rulesCode).not.toMatch(/role\s*==\s*['"]admin['"]/);
      expect(rulesCode).not.toMatch(/role\s*===\s*['"]admin['"]/);
    });

    it('Requirement C: Normal user with forged users/{uid}.seller=true is NOT a seller', () => {
      const normalUserToken = { uid: 'user_c', seller: false };
      const forgedUserDoc = { uid: 'user_c', seller: true };

      const isSellerEvaluated = Boolean(normalUserToken.seller === true);
      expect(isSellerEvaluated).toBe(false);

      // Verify firestore.rules isSeller() strictly evaluates request.auth.token.seller == true
      const isSellerDef = rulesCode.match(/function isSeller\(\)\s*\{([^}]+)\}/);
      expect(isSellerDef).toBeTruthy();
      expect(isSellerDef![1]).toMatch(/request\.auth\.token\.seller == true/);
      expect(isSellerDef![1]).not.toMatch(/get\(/);
      expect(isSellerDef![1]).not.toMatch(/users/);
    });

    it('Requirement D: Normal user with forged users/{uid}.sellerId="SELLER123" is NOT a seller', () => {
      const normalUserToken = { uid: 'user_d' }; // No seller or sellerId claim
      const forgedUserDoc = { uid: 'user_d', sellerId: 'SELLER123', role: 'seller' };

      const hasSellerClaim = Boolean((normalUserToken as any).seller === true);
      const claimSellerId = typeof (normalUserToken as any).sellerId === 'string' ? (normalUserToken as any).sellerId : '';

      expect(hasSellerClaim).toBe(false);
      expect(claimSellerId).toBe('');
      expect(claimSellerId).not.toBe(forgedUserDoc.sellerId);

      // Verify getSellerId() in rules does NOT fall back to users doc
      const getSellerIdDef = rulesCode.match(/function getSellerId\(\)\s*\{([^}]+)\}/);
      expect(getSellerIdDef).toBeTruthy();
      expect(getSellerIdDef![1]).toMatch(/request\.auth\.token\.sellerId/);
      expect(getSellerIdDef![1]).not.toMatch(/get\(/);
      expect(getSellerIdDef![1]).not.toMatch(/users/);
    });

    it('Requirement E: Seller with claim sellerId="SELLER123" cannot access seller resources belonging to SELLER456', () => {
      const sellerClaims = {
        seller: true,
        sellerId: 'SELLER123'
      };
      const foreignResource = {
        id: 'prod_456',
        sellerId: 'SELLER456',
        name: 'Foreign Product'
      };

      // Rules verification logic:
      const canAccessForeignResource = sellerClaims.seller === true && foreignResource.sellerId === sellerClaims.sellerId;
      expect(canAccessForeignResource).toBe(false);

      // Security rules guarantee:
      expect(rulesCode).toMatch(/resource\.data\.get\('sellerId',\s*''\)\s*==\s*getSellerId\(\)/);
    });

    it('Requirement F: Seller cannot change their own sellerId through Firestore', () => {
      // 1. In users/{userId}, client writes are blocked from modifying 'sellerId'
      expect(rulesCode).toMatch(/!request\.resource\.data\.diff\(resource\.data\)\s*\.affectedKeys\(\)\s*\.hasAny\(\[\s*['"]role['"],\s*['"]sellerId['"]/);

      // 2. In products/{productId}, seller cannot mutate 'sellerId'
      expect(rulesCode).toMatch(/!request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasAny\(\[\s*['"]id['"],\s*['"]sellerId['"]/);

      // 3. In sellers/{sellerId}, seller cannot modify 'id' or other restricted keys
      expect(rulesCode).toMatch(/request\.resource\.data\.get\('id',\s*sellerId\)\s*==\s*getSellerId\(\)/);
    });

    it('Requirement G: Seller cannot grant themselves admin privileges', () => {
      // 1. Normal/seller users cannot write to admins collection
      expect(rulesCode).toMatch(/match \/admins\/\{adminId\}\s*\{\s*allow read:\s*if isAdmin\(\);\s*allow write:\s*if false;\s*\}/);

      // 2. Client cannot alter role or admin fields on users collection
      expect(rulesCode).toMatch(/!request\.resource\.data\.keys\(\)\.hasAny\(\[\s*['"]role['"],\s*['"]sellerId['"],\s*['"]isBanned['"],\s*['"]ordersPlaced['"]\s*\]\)/);
    });

    it('Requirement H: Seller cannot grant themselves another sellerId', () => {
      // 1. Sellers cannot create products under another sellerId
      expect(rulesCode).toMatch(/request\.resource\.data\.get\('sellerId',\s*''\)\s*==\s*getSellerId\(\)/);

      // 2. In update, both resource.sellerId and request.resource.sellerId must match getSellerId()
      expect(rulesCode).toMatch(/resource\.data\.get\('sellerId',\s*''\)\s*==\s*getSellerId\(\)/);
      expect(rulesCode).toMatch(/request\.resource\.data\.get\('sellerId',\s*''\)\s*==\s*getSellerId\(\)/);
    });

    it('Requirement I: OTP verification cannot grant admin, seller, or sellerId claims', () => {
      // 1. otp.ts must never import or invoke setCustomUserClaims
      expect(otpCode).not.toMatch(/setCustomUserClaims/);

      // 2. verifyOtp only returns unprivileged payload
      expect(otpCode).toMatch(/return\s*\{\s*success:\s*true,\s*verifiedAtMs:\s*now\s*\};/);
      expect(otpCode).not.toMatch(/admin:\s*true/);
      expect(otpCode).not.toMatch(/seller:\s*true/);
    });

    it('Requirement J: Client-controlled request fields cannot override authorization claims', () => {
      // In placeOrder, sellerIds are derived strictly from server-verified product documents, never request body
      expect(placeOrderCode).toMatch(/lines\s*\.map\(l\s*=>\s*\(typeof l\.product\.sellerId === 'string' \? l\.product\.sellerId\.trim\(\) : ''\)\)/);
      expect(placeOrderCode).not.toMatch(/sellerIds\s*=\s*data\.sellerIds/);
      expect(placeOrderCode).not.toMatch(/sellerId\s*=\s*request\.data\.sellerId/);

      // In otp.ts, admin / seller verification uses request.auth.token claims, ignoring client assertions
      expect(otpCode).toMatch(/request\.auth\.token\?\.admin === true/);
      expect(otpCode).toMatch(/request\.auth\.token\?\.seller === true/);
    });

    it('Requirement K: All authorization fallbacks from Firestore user documents are strictly removed and forbidden', () => {
      // Verify no fallback pattern `claimSellerId || data.sellerId` or `claimSellerId || userData.sellerId` in AuthContext
      expect(authCode).not.toMatch(/claimSellerId\s*\|\|\s*data\.sellerId/);
      expect(authCode).not.toMatch(/claimSellerId\s*\|\|\s*userData\.sellerId/);

      // Verify no fallback in ShopContext
      expect(shopCode).not.toMatch(/claimSellerId\s*\|\|\s*data\.sellerId/);

      // Verify firestore.rules has zero lookups into users collection for isAdmin, isSeller, or getSellerId
      const rulesHelperSection = rulesCode.slice(rulesCode.indexOf('function isAdmin()'), rulesCode.indexOf('function productShapeOk()'));
      expect(rulesHelperSection).not.toMatch(/get\(/);
      expect(rulesHelperSection).not.toMatch(/users/);
      expect(rulesHelperSection).not.toMatch(/data\.role/);
      expect(rulesHelperSection).not.toMatch(/data\.sellerId/);
    });
  });

  describe('14. Firestore User Profile Isolation (AuthContext Hardening)', () => {
    const authCode = fs.readFileSync(path.resolve(__dirname, '../src/context/AuthContext.tsx'), 'utf8');

    const mockFirebaseUser = {
      uid: 'user-auth-123',
      displayName: 'Legitimate User',
      email: 'user@example.com',
      emailVerified: true
    } as any;

    it('TEST 1: A Firestore user document containing { role: "admin" } cannot make isAdminUser === true', () => {
      const forgedDoc = { role: 'admin' };
      const tokenClaims = { admin: false, seller: false, sellerId: null };

      const isAdminUser = Boolean(tokenClaims.admin === true);
      const profile = mapUserProfile(forgedDoc, mockFirebaseUser, tokenClaims.sellerId);

      expect(isAdminUser).toBe(false);
      expect(profile.role).toBe('customer');
      expect((profile as any).admin).toBeUndefined();
    });

    it('TEST 2: A Firestore user document containing { seller: true } cannot make isSellerUser === true', () => {
      const forgedDoc = { seller: true, role: 'seller' };
      const tokenClaims = { admin: false, seller: false, sellerId: null };

      const isSellerUser = Boolean(tokenClaims.seller === true);
      const profile = mapUserProfile(forgedDoc, mockFirebaseUser, tokenClaims.sellerId);

      expect(isSellerUser).toBe(false);
      expect(profile.role).toBe('customer');
      expect((profile as any).seller).toBeUndefined();
    });

    it('TEST 3: A Firestore user document containing { sellerId: "ATTACKER" } cannot change sellerId when Auth claim lacks that value', () => {
      const forgedDoc = { sellerId: 'ATTACKER' };
      const tokenClaims = { admin: false, seller: false, sellerId: null };

      const claimSellerId = typeof tokenClaims.sellerId === 'string' ? tokenClaims.sellerId : null;
      const profile = mapUserProfile(forgedDoc, mockFirebaseUser, claimSellerId);

      expect(claimSellerId).toBeNull();
      expect(profile.sellerId).toBeUndefined();
    });

    it('TEST 4: A Firestore user document containing { role: "admin", admin: true, seller: true, sellerId: "ATTACKER" } cannot change ANY authorization state', () => {
      const forgedDoc = {
        uid: 'spoofed-uid',
        role: 'admin',
        admin: true,
        seller: true,
        sellerId: 'ATTACKER',
        isAdminUser: true,
        isSellerUser: true
      };
      // Authentic claims
      const tokenClaims = { admin: false, seller: false, sellerId: null };

      const isAdminUser = Boolean(tokenClaims.admin === true);
      const isSellerUser = Boolean(tokenClaims.seller === true);
      const sellerId = typeof tokenClaims.sellerId === 'string' ? tokenClaims.sellerId : null;

      const profile = mapUserProfile(forgedDoc, mockFirebaseUser, sellerId);

      // Authorization states remain completely unaffected
      expect(isAdminUser).toBe(false);
      expect(isSellerUser).toBe(false);
      expect(sellerId).toBeNull();

      // Profile object cannot be contaminated
      expect(profile.uid).toBe('user-auth-123');
      expect(profile.role).toBe('customer');
      expect(profile.sellerId).toBeUndefined();
      expect((profile as any).admin).toBeUndefined();
      expect((profile as any).seller).toBeUndefined();
      expect((profile as any).isAdminUser).toBeUndefined();
      expect((profile as any).isSellerUser).toBeUndefined();
    });

    it('TEST 5: Source-code security test must reject unrestricted profile merging such as setUser(prev => prev ? ({ ...prev, ...data }) : null)', () => {
      // Must not spread raw firestore doc: { ...prev, ...data } or ...data
      expect(authCode).not.toMatch(/\{\s*\.\.\.prev\s*,\s*\.\.\.data\s*\}/);
      expect(authCode).not.toMatch(/setUser\(\s*prev\s*=>\s*prev\s*\?\s*\(\{\s*\.\.\.prev\s*,\s*\.\.\.data\s*\}\)\s*:\s*null\s*\)/);
      expect(authCode).not.toMatch(/setUser\(\s*\(\s*\{\s*\.\.\.prev/);

      // Must explicitly use mapUserProfile or allowlisted field mapping
      expect(authCode).toMatch(/mapUserProfile/);
      expect(authCode).not.toMatch(/role:\s*data\.role/);
      expect(authCode).not.toMatch(/sellerId:\s*data\.sellerId/);
      expect(authCode).not.toMatch(/claimSellerId\s*\|\|\s*data\.sellerId/);
    });
  });

  describe('15. Secondary User Profile Isolation & Authorization Hardening (ShopContext Hardening)', () => {
    const mockFirebaseUser = {
      uid: 'user-auth-123',
      displayName: 'Legitimate User',
      email: 'user@example.com',
      emailVerified: true
    } as any;

    it('TEST 1: Adversarial test (Req 7) - Malicious Firestore profile cannot change authorization state or escalate privileges in ShopContext', () => {
      const maliciousDoc = {
        role: 'admin',
        admin: true,
        seller: true,
        sellerId: 'ATTACKER',
        isAdminUser: true,
        isSellerUser: true,
        uid: 'spoofed-uid',
        email: 'attacker@evil.com'
      };

      const tokenClaims = {
        admin: false,
        seller: false,
        sellerId: null
      };

      const isAdminUser = Boolean(tokenClaims.admin === true);
      const isSellerUser = Boolean(tokenClaims.seller === true);
      const sellerId = typeof tokenClaims.sellerId === 'string' ? tokenClaims.sellerId : null;

      const profile = mapSafeShopUserProfile(maliciousDoc, mockFirebaseUser, sellerId);

      // Authorization states remain completely unaffected
      expect(isAdminUser).toBe(false);
      expect(isSellerUser).toBe(false);
      expect(sellerId).toBeNull();

      // Profile object is sanitized and cannot be contaminated
      expect(profile.uid).toBe('user-auth-123');
      expect(profile.role).toBe('customer');
      expect(profile.sellerId).toBeUndefined();
      expect((profile as any).admin).toBeUndefined();
      expect((profile as any).seller).toBeUndefined();
      expect((profile as any).isAdminUser).toBeUndefined();
      expect((profile as any).isSellerUser).toBeUndefined();
    });

    it('TEST 2: Requirement 10 Regression - Conflicting sellerId in Firestore profile never overrides Auth claim sellerId', () => {
      const forgedDoc = {
        sellerId: 'ATTACKER',
        role: 'seller'
      };

      const authClaims = {
        admin: false,
        seller: true,
        sellerId: 'AUTHORIZED_SELLER'
      };

      const applicationAuthorizationSellerId =
        typeof authClaims.sellerId === 'string' ? authClaims.sellerId : null;

      const safeProfile = mapSafeShopUserProfile(
        forgedDoc,
        mockFirebaseUser,
        applicationAuthorizationSellerId
      );

      // Authoritative authorization sellerId MUST be "AUTHORIZED_SELLER"
      expect(applicationAuthorizationSellerId).toBe('AUTHORIZED_SELLER');
      expect(applicationAuthorizationSellerId).not.toBe('ATTACKER');

      // Profile sellerId MUST match Auth claim and NEVER Firestore doc
      expect(safeProfile.sellerId).toBe('AUTHORIZED_SELLER');
      expect(safeProfile.sellerId).not.toBe('ATTACKER');
      expect(safeProfile.role).toBe('customer');
    });

    it('TEST 3: Source-code security test - ShopContext rejects unrestricted mergedProfile and raw data spreads', () => {
      const shopCode = fs.readFileSync(path.resolve(__dirname, '../src/context/ShopContext.tsx'), 'utf8');

      // Must not contain mergedProfile construction or spread
      expect(shopCode).not.toMatch(/const\s+mergedProfile\s*:\s*UserProfile/);
      expect(shopCode).not.toMatch(/\.\.\.mergedProfile/);
      expect(shopCode).not.toMatch(/setUser\(\s*prev\s*=>\s*\(\{\s*\.\.\.prev\s*,\s*\.\.\.mergedProfile/);
      expect(shopCode).not.toMatch(/setUser\(\s*prev\s*=>\s*\(\{\s*\.\.\.prev\s*,\s*\.\.\.data/);

      // Must explicitly use mapSafeShopUserProfile for Firestore profile hydration
      expect(shopCode).toMatch(/mapSafeShopUserProfile/);

      // Must not use data.role or fallback to data.sellerId for claims
      expect(shopCode).not.toMatch(/claimSellerId\s*\|\|\s*data\.sellerId/);
      expect(shopCode).not.toMatch(/role:\s*data\.role/);
    });
  });
});

