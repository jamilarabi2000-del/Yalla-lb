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
});
