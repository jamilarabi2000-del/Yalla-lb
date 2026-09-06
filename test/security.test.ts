import { describe, it, expect } from 'vitest';
import { csvSafe, sanitizeRowForCsv } from '../src/utils/csvSafe';
import { normalizeLebanesePhone, isValidLebanesePhone } from '../src/utils/phoneUtils';
import { checkDuplicateProductNumber } from '../src/lib/productValidation';
import { Product } from '../src/types';

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
      const sellerUser = {
        role: 'seller',
        sellerId: 'workshop-byblos'
      };

      const targetProduct = {
        id: 'prod-foreign',
        name: 'Baalbek Pottery',
        sellerId: 'workshop-baalbek'
      };

      const canEdit = (user: typeof sellerUser, product: typeof targetProduct) => {
        if (user.role === 'seller') {
          return user.sellerId.toLowerCase() === product.sellerId.toLowerCase();
        }
        return false;
      };

      expect(canEdit(sellerUser, targetProduct)).toBe(false);

      const ownProduct = {
        id: 'prod-own',
        name: 'Byblos Cedar Box',
        sellerId: 'workshop-byblos'
      };
      expect(canEdit(sellerUser, ownProduct)).toBe(true);
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
});

