import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CartItem, Product, DiscountRule, ProductBundle } from '../types';
import { applyDiscounts } from '../lib/pricing';

export interface CartContextType {
  cart: CartItem[];
  wishlist: Product[];
  appliedCouponCode: string;
  setAppliedCouponCode: (code: string) => void;
  addToCart: (product: Product, quantity?: number, selectedOption?: string) => void;
  removeFromCart: (productId: string, selectedOption?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedOption?: string) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  cartCount: number;
  cartSubtotalUSD: number;
  discountUSD: number;
  finalSubtotalUSD: number;
  calculateDiscount: (rules: DiscountRule[], bundles?: ProductBundle[], isNewUser?: boolean) => {
    discountUSD: number;
    finalSubtotalUSD: number;
    appliedRules: any[];
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCouponCode, setAppliedCouponCode] = useState<string>(() => {
    try {
      return localStorage.getItem('yallalb_coupon') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      if (appliedCouponCode) {
        localStorage.setItem('yallalb_coupon', appliedCouponCode);
      } else {
        localStorage.removeItem('yallalb_coupon');
      }
    } catch {}
  }, [appliedCouponCode]);

  const addToCart = (product: Product, quantity = 1, selectedOption?: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id && item.selectedOption === selectedOption
      );
      if (existingIdx > -1) {
        const next = [...prev];
        const currentQty = next[existingIdx].quantity;
        const maxStock = product.stock ?? 99;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Math.min(maxStock, currentQty + quantity)
        };
        return next;
      }
      return [...prev, { product, quantity, selectedOption }];
    });
  };

  const removeFromCart = (productId: string, selectedOption?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.product.id === productId && (selectedOption === undefined || item.selectedOption === selectedOption))
    ));
  };

  const updateQuantity = (productId: string, quantity: number, selectedOption?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedOption);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && (selectedOption === undefined || item.selectedOption === selectedOption)) {
        const maxStock = item.product.stock ?? 99;
        return { ...item, quantity: Math.min(maxStock, quantity) };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCouponCode('');
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotalUSD = useMemo(() => {
    return Math.round(cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0) * 100) / 100;
  }, [cart]);

  const calculateDiscount = (rules: DiscountRule[] = [], bundles: ProductBundle[] = [], isNewUser = false) => {
    const res = applyDiscounts(cart, rules, {
      couponCode: appliedCouponCode,
      isNewUser,
      productBundles: bundles
    });
    return {
      discountUSD: res.discountUSD,
      finalSubtotalUSD: res.finalSubtotalUSD,
      appliedRules: res.appliedRules
    };
  };

  const discountCalc = useMemo(() => {
    return applyDiscounts(cart, [], { couponCode: appliedCouponCode });
  }, [cart, appliedCouponCode]);

  return (
    <CartContext.Provider value={{
      cart,
      wishlist,
      appliedCouponCode,
      setAppliedCouponCode,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      cartCount,
      cartSubtotalUSD,
      discountUSD: discountCalc.discountUSD,
      finalSubtotalUSD: discountCalc.finalSubtotalUSD,
      calculateDiscount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
