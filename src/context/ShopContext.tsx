import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, Order, UserProfile, Currency } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { LBP_USD_RATE } from '../data/regions';
import { translations, Language } from '../utils/translations';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, FirebaseUser } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, doc as firestoreDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export type NavTab = 'home' | 'products' | 'product_detail' | 'checkout' | 'account' | 'admin';

interface ShopContextType {
  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  navigateToProductCategory: (category: string) => void;
  selectedProductDetail: Product | null;
  setSelectedProductDetail: (p: Product | null) => void;
  openProductDetail: (product: Product) => void;
  goBack: () => void;

  // Language & Translations
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], params?: Record<string, string>) => string;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (p: Product | null) => void;

  // Currency
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (amountUSD: number) => string;
  convertUSDToLBP: (amountUSD: number) => number;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, option?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotalUSD: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Orders
  orders: Order[];
  placeOrder: (orderData: Omit<Order, 'id' | 'date' | 'trackingNumber' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;

  // User Profile
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;

  // Firebase Auth
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Feedback Toast
  toast: Toast | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;

  // Admin Security Lock
  isAdminUnlocked: boolean;
  setIsAdminUnlocked: (val: boolean) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const INITIAL_USER: UserProfile = {
  name: 'Karim Chamoun',
  email: 'karim.chamoun@yalla.lb',
  phone: '+961 70 123 456',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  defaultGovernorate: 'beirut',
  defaultCity: 'Achrafieh',
  defaultAddress: 'Sursock Street, Building 14, 3rd Floor'
};

const INITIAL_ORDERS: Order[] = [
  {
    id: 'YLB-98421',
    date: '2026-08-10T14:30:00Z',
    items: [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 2
      },
      {
        product: INITIAL_PRODUCTS[1],
        quantity: 3
      }
    ],
    shipping: {
      fullName: 'Karim Chamoun',
      phone: '+961 70 123 456',
      email: 'karim.chamoun@yalla.lb',
      governorate: 'beirut',
      city: 'Achrafieh',
      street: 'Sursock Street',
      building: 'Building 14',
      floorApartment: '3rd Floor',
      deliveryNotes: 'Please call upon arrival',
      deliverySpeed: 'express_beirut'
    },
    paymentMethod: 'cod_usd',
    currency: 'USD',
    subtotalUSD: 53.00,
    deliveryFeeUSD: 3.00,
    totalUSD: 56.00,
    totalLBP: 56.00 * 89500,
    status: 'in_transit',
    estimatedDelivery: 'Tomorrow afternoon',
    trackingNumber: 'BEY-EXP-98421'
  },
  {
    id: 'YLB-91120',
    date: '2026-08-04T09:15:00Z',
    items: [
      {
        product: INITIAL_PRODUCTS[2],
        quantity: 1
      },
      {
        product: INITIAL_PRODUCTS[3],
        quantity: 2
      }
    ],
    shipping: {
      fullName: 'Karim Chamoun',
      phone: '+961 70 123 456',
      email: 'karim.chamoun@yalla.lb',
      governorate: 'mount_lebanon',
      city: 'Broummana',
      street: 'Main Pine Road',
      building: 'Villa Al-Arz',
      floorApartment: 'Ground Floor',
      deliveryNotes: 'Gate passcode 4421',
      deliverySpeed: 'standard'
    },
    paymentMethod: 'wish_omt',
    currency: 'USD',
    subtotalUSD: 80.00,
    deliveryFeeUSD: 5.00,
    totalUSD: 85.00,
    totalLBP: 85.00 * 89500,
    status: 'delivered',
    estimatedDelivery: 'Delivered on Aug 6',
    trackingNumber: 'BEY-EXP-91120'
  }
];

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavTab>('home');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Auth state listener
  useEffect(() => {
    console.log("[ShopContext] Initializing Firebase Auth & Firestore connection state...");
    const unsubscribe = onAuthStateChanged(auth, async (userObj) => {
      console.log("[ShopContext] onAuthStateChanged fired. User:", userObj ? userObj.uid : "None");
      setFirebaseUser(userObj);
      if (userObj) {
        // Sync user profile, wishlist, cart & orders from Firestore if available
        try {
          console.log(`[ShopContext] Fetching user doc for uid: ${userObj.uid}`);
          const userDocRef = doc(db, 'users', userObj.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            console.log(`[ShopContext] User doc retrieved successfully for uid: ${userObj.uid}`);
            const data = userSnap.data() as UserProfile;
            setUser(prev => ({ ...prev, ...data }));
          } else {
            console.log(`[ShopContext] User doc not found for uid: ${userObj.uid}, initializing new doc...`);
            // Initialize user doc
            await setDoc(userDocRef, {
              uid: userObj.uid,
              name: userObj.displayName || INITIAL_USER.name,
              email: userObj.email || INITIAL_USER.email,
              phone: INITIAL_USER.phone,
              avatar: userObj.photoURL || INITIAL_USER.avatar,
              defaultGovernorate: INITIAL_USER.defaultGovernorate,
              defaultCity: INITIAL_USER.defaultCity,
              defaultAddress: INITIAL_USER.defaultAddress
            });
            console.log(`[ShopContext] Initialized user doc for uid: ${userObj.uid}`);
          }

          console.log(`[ShopContext] Fetching wishlist for uid: ${userObj.uid}`);
          const wishlistRef = doc(db, 'wishlists', userObj.uid);
          const wishlistSnap = await getDoc(wishlistRef);
          if (wishlistSnap.exists()) {
            console.log(`[ShopContext] Wishlist retrieved for uid: ${userObj.uid}`);
            const wData = wishlistSnap.data();
            if (wData.productIds && Array.isArray(wData.productIds)) {
              setWishlist(wData.productIds);
            }
          }

          console.log(`[ShopContext] Fetching cart for uid: ${userObj.uid}`);
          const cartRef = doc(db, 'carts', userObj.uid);
          const cartSnap = await getDoc(cartRef);
          if (cartSnap.exists()) {
            console.log(`[ShopContext] Cart retrieved for uid: ${userObj.uid}`);
            const cData = cartSnap.data();
            if (cData.items && Array.isArray(cData.items)) {
              setCart(cData.items);
            }
          }

          console.log(`[ShopContext] Fetching orders collection snapshot...`);
          const ordersColRef = collection(db, 'orders');
          const ordersSnap = await getDocs(ordersColRef);
          console.log(`[ShopContext] Orders collection snapshot retrieved. Total documents: ${ordersSnap.size}`);
          const userOrders: Order[] = [];
          ordersSnap.forEach(docSnap => {
            const ord = docSnap.data() as Order;
            if (ord.userId === userObj.uid || ord.shipping?.email === userObj.email) {
              userOrders.push(ord);
            }
          });
          console.log(`[ShopContext] Filtered user orders count: ${userOrders.length}`);
          if (userOrders.length > 0) {
            setOrders(prev => {
              const combined = [...userOrders, ...prev];
              const unique = Array.from(new Map(combined.map(o => [o.id, o])).values());
              return unique;
            });
          }
        } catch (err) {
          console.error("[ShopContext] Error syncing user data from Firestore:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully signed in with Google!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'auth');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      showToast('Signed out successfully', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'auth');
    }
  };

  const [isAdminUnlocked, setIsAdminUnlockedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('yallalb_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const setIsAdminUnlocked = (val: boolean) => {
    setIsAdminUnlockedState(val);
    try {
      localStorage.setItem('yallalb_admin_unlocked', String(val));
    } catch {}
  };

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('yallalb_language');
      return (saved === 'ar' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('yallalb_language', lang);
    } catch {}
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof typeof translations['en'], params?: Record<string, string>): string => {
    let text = translations[language]?.[key] || translations['en']?.[key] || (key as string);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  const setActiveTab = useCallback((tab: NavTab) => {
    setActiveTabState(prev => {
      if (prev !== tab) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return tab;
      }
      return prev;
    });
  }, []);

  const openProductDetail = useCallback((product: Product) => {
    setSelectedProductDetail(product);
    setActiveTabState('product_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    setActiveTabState('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // UI state
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState<Toast | null>(null);

  // Core Data States
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_wishlist');
      return saved ? JSON.parse(saved) : ['prod-1', 'prod-3'];
    } catch {
      return ['prod-1', 'prod-3'];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('yallalb_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_cart', JSON.stringify(cart));
    } catch {}
    if (firebaseUser) {
      setDoc(doc(db, 'carts', firebaseUser.uid), {
        userId: firebaseUser.uid,
        items: cart
      }, { merge: true }).catch(err => {
        console.error("Error syncing cart:", err);
      });
    }
  }, [cart, firebaseUser]);

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_wishlist', JSON.stringify(wishlist));
    } catch {}
    // If authenticated, sync wishlist to Firestore
    if (firebaseUser) {
      setDoc(doc(db, 'wishlists', firebaseUser.uid), {
        userId: firebaseUser.uid,
        productIds: wishlist
      }, { merge: true }).catch(err => {
        console.error("Error syncing wishlist:", err);
      });
    }
  }, [wishlist, firebaseUser]);

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_user', JSON.stringify(user));
    } catch {}
  }, [user]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const convertUSDToLBP = (amountUSD: number) => {
    return Math.round(amountUSD * LBP_USD_RATE);
  };

  const formatPrice = (amountUSD: number) => {
    return `$${amountUSD.toFixed(2)}`;
  };

  const addToCart = (product: Product, quantity = 1, option?: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.selectedOption === option);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, selectedOption: option }];
    });
    showToast(`Added ${quantity}x "${product.name.split('(')[0].trim()}" to cart!`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    let nextWishlist: string[] = [];
    const exists = wishlist.includes(productId);
    if (exists) {
      nextWishlist = wishlist.filter(id => id !== productId);
      showToast('Removed from saved artisan wishlist', 'info');
    } else {
      nextWishlist = [...wishlist, productId];
      showToast('Saved to your Lebanese artisan wishlist!', 'success');
    }
    setWishlist(nextWishlist);
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const cartTotalUSD = Math.round(cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0) * 100) / 100;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async (orderData: Omit<Order, 'id' | 'date' | 'trackingNumber' | 'status'>): Promise<Order> => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const trackingSuffix = Math.floor(10000 + Math.random() * 90000);
    const newOrder: Order = {
      ...orderData,
      id: `YLB-${randomSuffix}`,
      date: new Date().toISOString(),
      trackingNumber: `LB-EXP-${trackingSuffix}`,
      status: 'crafting',
      userId: firebaseUser ? firebaseUser.uid : 'guest'
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // Save order to Firestore if logged in
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'orders', newOrder.id), newOrder);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
      }
    }

    showToast(`Mabrouk! Order #${newOrder.id} placed successfully.`, 'success');
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, status } : ord))
    );
    showToast(`Order status updated to ${status.replace('_', ' ')}`, 'info');
  };

  const addProduct = async (newProdData: Omit<Product, 'id'>) => {
    const id = `prod-custom-${Date.now()}`;
    const newProduct: Product = { ...newProdData, id };
    setProducts(prev => [newProduct, ...prev]);
    showToast(`Product "${newProduct.name}" added successfully!`);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Product updated successfully');
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product removed', 'warning');
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    }
    showToast('Profile and delivery details updated successfully');
  };

  const navigateToProductCategory = (category: string) => {
    setSelectedCategory(category);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ShopContext.Provider
      value={{
        activeTab,
        setActiveTab,
        navigateToProductCategory,
        selectedProductDetail,
        setSelectedProductDetail,
        openProductDetail,
        goBack,
        language,
        setLanguage,
        t,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        selectedProductForModal,
        setSelectedProductForModal,
        currency,
        setCurrency,
        formatPrice,
        convertUSDToLBP,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotalUSD,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        orders,
        placeOrder,
        updateOrderStatus,
        user,
        updateUser,
        firebaseUser,
        signInWithGoogle,
        signOutUser,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        toast,
        showToast,
        isAdminUnlocked,
        setIsAdminUnlocked
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
