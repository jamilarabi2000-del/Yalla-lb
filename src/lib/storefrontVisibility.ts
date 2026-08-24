import { Product, Seller } from '../types';

export interface StorefrontProductRuleParams {
  product: Product;
  sellers?: Seller[];
  isVisualEditMode?: boolean;
}

/**
 * Shared visibility logic for storefront catalog items.
 * A product is visible if:
 * 1. Visual Edit Mode is active (shows drafts/hidden items with admin markers), OR
 * 2. Product isPublished !== false, AND
 * 3. The associated seller (if registered) has isActive !== false.
 */
export function isProductVisibleOnStorefront(
  product: Product,
  sellers: Seller[] = [],
  isVisualEditMode: boolean = false
): boolean {
  if (isVisualEditMode) return true;

  // Check product-level published status
  if (product.isPublished === false) return false;

  // Check seller active status if registered
  if (sellers && sellers.length > 0) {
    const matchedSeller = sellers.find(s => {
      if (product.sellerId && s.id === product.sellerId) return true;
      if (product.seller && (s.nameEn === product.seller || s.nameAr === product.seller || s.id === product.seller)) return true;
      if (product.artisan && (s.nameEn === product.artisan || s.nameAr === product.artisan || s.id === product.artisan)) return true;
      return false;
    });

    if (matchedSeller && matchedSeller.isActive === false) {
      return false;
    }
  }

  return true;
}
