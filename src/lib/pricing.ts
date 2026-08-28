import { CartItem, DiscountRule, Product, ProductBundle } from '../types';

export interface DiscountCalculationResult {
  subtotalUSD: number;
  discountUSD: number;
  finalSubtotalUSD: number;
  appliedRules: {
    rule: DiscountRule;
    savedUSD: number;
  }[];
  appliedRuleIds: string[];
}

export interface DiscountOptions {
  couponCode?: string;
  isNewUser?: boolean;
  currentDate?: Date;
  productBundles?: ProductBundle[];
}

function matchesTarget(product: Product, rule: DiscountRule): boolean {
  if (rule.target === 'checkout' || rule.target === 'all') return true;
  if (!rule.targetValue || rule.targetValue.trim() === '') return true;

  const targetVal = rule.targetValue.toLowerCase().trim();

  if (rule.target === 'product') {
    return product.id.toLowerCase() === targetVal;
  }
  if (rule.target === 'category') {
    return product.category.toLowerCase() === targetVal;
  }
  if (rule.target === 'seller') {
    return (
      (product.artisan?.toLowerCase().includes(targetVal) ?? false) ||
      (product.origin?.toLowerCase().includes(targetVal) ?? false)
    );
  }
  if (rule.target === 'brand') {
    return (
      (product.artisan?.toLowerCase().includes(targetVal) ?? false) ||
      (product.origin?.toLowerCase().includes(targetVal) ?? false) ||
      (product.name?.toLowerCase().includes(targetVal) ?? false)
    );
  }
  return false;
}

/**
 * Calculates cart discounts accurately based on active rules, promotion periods, audience filters, and optional entered coupon code.
 */
export function applyDiscounts(
  items: CartItem[],
  rules: DiscountRule[],
  options: DiscountOptions = {}
): DiscountCalculationResult {
  const subtotal = items.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  if (subtotal <= 0 || items.length === 0) {
    return {
      subtotalUSD: 0,
      discountUSD: 0,
      finalSubtotalUSD: 0,
      appliedRules: [],
      appliedRuleIds: []
    };
  }

  let totalDiscount = 0;
  const appliedRules: { rule: DiscountRule; savedUSD: number }[] = [];
  const normalizedCoupon = options.couponCode ? options.couponCode.trim().toUpperCase() : '';
  const now = options.currentDate || new Date();
  const isNewUser = options.isNewUser ?? false;

  // 1. Calculate Combo & Product Bundle automatic discounts first
  if (options.productBundles && options.productBundles.length > 0) {
    const availableQuantities: { [key: string]: number } = {};
    for (const item of items) {
      const pid = item.product.id;
      availableQuantities[pid] = (availableQuantities[pid] || 0) + item.quantity;
    }

    const activeBundles = options.productBundles.filter(b => b.isActive !== false);
    
    // Sort bundles by unit savings descending to prioritize the best deal for the user
    const bundlesWithSavings = activeBundles.map(bundle => {
      // Find matching products in current items to calculate original prices
      const bundleProducts = items
        .map(item => item.product)
        .filter(p => bundle.productIds.includes(p.id))
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      const originalSum = bundleProducts.reduce((sum, p) => sum + p.priceUSD, 0);
      const savingsPerSet = Math.max(0, originalSum - bundle.bundlePriceUSD);
      return { bundle, savingsPerSet };
    }).sort((a, b) => b.savingsPerSet - a.savingsPerSet);

    for (const { bundle, savingsPerSet } of bundlesWithSavings) {
      if (savingsPerSet <= 0 || bundle.productIds.length === 0) continue;

      // Exclude if promotion periods don't match
      if (bundle.startDate) {
        const bStart = new Date(bundle.startDate);
        if (!isNaN(bStart.getTime()) && now < bStart) continue;
      }
      if (bundle.endDate) {
        const bEnd = new Date(bundle.endDate);
        if (!isNaN(bEnd.getTime()) && now > bEnd) continue;
      }

      // Calculate complete sets we can form with the remaining items
      let completeSets = Infinity;
      for (const pid of bundle.productIds) {
        const qty = availableQuantities[pid] || 0;
        if (qty < completeSets) {
          completeSets = qty;
        }
      }

      if (completeSets > 0 && completeSets !== Infinity) {
        // Consume items
        for (const pid of bundle.productIds) {
          availableQuantities[pid] -= completeSets;
        }

        const totalSaved = Math.round(savingsPerSet * completeSets * 100) / 100;
        if (totalSaved > 0) {
          totalDiscount += totalSaved;
          const virtualRule: DiscountRule = {
            id: `bundle-${bundle.id}`,
            name: `${bundle.name} (Combo Offer)`,
            nameAr: `${bundle.nameAr || bundle.name} (عرض كومبو)`,
            type: 'fixed',
            value: totalSaved,
            target: 'checkout',
            isActive: true
          };
          appliedRules.push({ rule: virtualRule, savedUSD: totalSaved });
        }
      }
    }
  }

  for (const rule of rules) {
    if (!rule.isActive) continue;

    // Promotion period validation
    if (rule.startDate) {
      const start = new Date(rule.startDate);
      if (!isNaN(start.getTime()) && now < start) {
        continue; // Promotion hasn't started yet
      }
    }
    if (rule.endDate) {
      const end = new Date(rule.endDate);
      if (!isNaN(end.getTime()) && now > end) {
        continue; // Promotion has expired
      }
    }

    // New user exclusivity validation
    if (rule.isNewUserOnly && !isNewUser) {
      continue; // Exclude if rule is for new users only and customer is existing
    }

    // If rule has a coupon code, it must match the entered coupon
    if (rule.couponCode && rule.couponCode.trim() !== '') {
      if (rule.couponCode.trim().toUpperCase() !== normalizedCoupon) {
        continue;
      }
    }

    // Minimum purchase condition
    if (rule.minPurchaseUSD && subtotal < rule.minPurchaseUSD) {
      continue;
    }

    // Target calculation
    let baseApplicableAmount = 0;
    if (rule.target === 'checkout' || rule.target === 'all') {
      baseApplicableAmount = subtotal;
    } else {
      const eligibleItems = items.filter(item => matchesTarget(item.product, rule));
      baseApplicableAmount = eligibleItems.reduce((s, item) => s + item.product.priceUSD * item.quantity, 0);
    }

    if (baseApplicableAmount <= 0) continue;

    let ruleDiscount = 0;
    if (rule.type === 'percentage') {
      ruleDiscount = baseApplicableAmount * (Math.min(100, Math.max(0, rule.value)) / 100);
    } else {
      // Fixed discount cannot exceed eligible amount
      ruleDiscount = Math.min(rule.value, baseApplicableAmount);
    }

    ruleDiscount = Math.round(ruleDiscount * 100) / 100;
    if (ruleDiscount > 0) {
      totalDiscount += ruleDiscount;
      appliedRules.push({ rule, savedUSD: ruleDiscount });
    }
  }

  // Never allow discounts to exceed the order subtotal
  totalDiscount = Math.min(Math.round(totalDiscount * 100) / 100, subtotal);
  const finalSubtotal = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);

  return {
    subtotalUSD: subtotal,
    discountUSD: totalDiscount,
    finalSubtotalUSD: finalSubtotal,
    appliedRules,
    appliedRuleIds: appliedRules.map(a => a.rule.id)
  };
}
