export interface CartLine {
  productId: string;
  quantity: number;
  selectedOption?: string;
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function computeDiscounts(params: {
  lines: Array<{ product: any; quantity: number; unitPriceUSD: number }>;
  discounts: any[];
  bundles: any[];
  couponCode?: string;
  isNewCustomer?: boolean;
  subtotalUSD: number;
}): { discountUSD: number; appliedCoupon?: string } {
  const { lines, discounts = [], bundles = [], couponCode, isNewCustomer = false, subtotalUSD } = params;
  if (subtotalUSD <= 0 || lines.length === 0) {
    return { discountUSD: 0 };
  }

  let totalDiscount = 0;
  const normalizedCoupon = couponCode ? couponCode.trim().toUpperCase() : '';
  const now = new Date();

  // 1. Combo & Product Bundle automatic discounts
  if (bundles && bundles.length > 0) {
    const availableQuantities: { [key: string]: number } = {};
    for (const line of lines) {
      const pid = line.product.id;
      availableQuantities[pid] = (availableQuantities[pid] || 0) + line.quantity;
    }

    const activeBundles = bundles.filter(b => b.isActive !== false);
    const bundlesWithSavings = activeBundles.map(bundle => {
      const bundleProducts = lines
        .map(l => l.product)
        .filter(p => (bundle.productIds || []).includes(p.id))
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      const originalSum = bundleProducts.reduce((sum, p) => sum + (p.priceUSD || 0), 0);
      const savingsPerSet = Math.max(0, originalSum - (bundle.bundlePriceUSD || 0));
      return { bundle, savingsPerSet };
    }).sort((a, b) => b.savingsPerSet - a.savingsPerSet);

    for (const { bundle, savingsPerSet } of bundlesWithSavings) {
      if (savingsPerSet <= 0 || !bundle.productIds || bundle.productIds.length === 0) continue;

      if (bundle.startDate && now < new Date(bundle.startDate)) continue;
      if (bundle.endDate && now > new Date(bundle.endDate)) continue;

      let completeSets = Infinity;
      for (const pid of bundle.productIds) {
        const qty = availableQuantities[pid] || 0;
        if (qty < completeSets) completeSets = qty;
      }

      if (completeSets > 0 && completeSets !== Infinity) {
        for (const pid of bundle.productIds) {
          availableQuantities[pid] -= completeSets;
        }
        const totalSaved = round2(savingsPerSet * completeSets);
        if (totalSaved > 0) {
          totalDiscount += totalSaved;
        }
      }
    }
  }

  // 2. Active discount rules
  for (const rule of discounts) {
    if (!rule.isActive) continue;
    if (rule.startDate && now < new Date(rule.startDate)) continue;
    if (rule.endDate && now > new Date(rule.endDate)) continue;
    if (rule.isNewUserOnly && !isNewCustomer) continue;

    if (rule.couponCode && rule.couponCode.trim() !== '') {
      if (rule.couponCode.trim().toUpperCase() !== normalizedCoupon) continue;
    }

    if (rule.minPurchaseUSD && subtotalUSD < rule.minPurchaseUSD) continue;

    let baseAmount = subtotalUSD;
    if (rule.target && rule.target !== 'checkout' && rule.target !== 'all') {
      const targetVal = (rule.targetValue || '').toLowerCase().trim();
      const eligible = lines.filter(l => {
        const p = l.product;
        if (rule.target === 'product') return p.id?.toLowerCase() === targetVal;
        if (rule.target === 'category') return p.category?.toLowerCase() === targetVal;
        if (rule.target === 'seller') {
          return (p.artisan?.toLowerCase().includes(targetVal) || p.origin?.toLowerCase().includes(targetVal));
        }
        return false;
      });
      baseAmount = eligible.reduce((s, l) => s + l.unitPriceUSD * l.quantity, 0);
    }

    if (baseAmount <= 0) continue;

    let ruleDiscount = 0;
    if (rule.type === 'percentage') {
      ruleDiscount = baseAmount * (Math.min(100, Math.max(0, rule.value)) / 100);
    } else {
      ruleDiscount = Math.max(0, Math.min(rule.value, baseAmount));
    }

    ruleDiscount = round2(ruleDiscount);
    if (ruleDiscount > 0) {
      totalDiscount += ruleDiscount;
    }
  }

  totalDiscount = Math.min(round2(totalDiscount), subtotalUSD);
  return {
    discountUSD: totalDiscount,
    appliedCoupon: normalizedCoupon || undefined
  };
}
