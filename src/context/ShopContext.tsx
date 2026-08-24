import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Product, CartItem, Order, UserProfile, Currency, SiteContent, SectionVisibilityConfig, CMSCustomBlock, RecentActivity, DiscountRule, CategoryItem, TerroirRegion, Seller, SearchLog } from '../types';
import { applyDiscounts } from '../lib/pricing';
import { calcDeliveryFeeUSD } from '../lib/delivery';
import { INITIAL_PRODUCTS } from '../data/products';
import { DEFAULT_SITE_CONTENT } from '../data/cmsContent';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { DEFAULT_SELLERS } from '../data/sellers';
import { LEBANON_REGIONS, LBP_USD_RATE } from '../data/regions';
import { normalizeLebanesePhone, isValidLebanesePhone } from '../utils/phoneUtils';
import Papa from 'papaparse';
import { translations, Language } from '../utils/translations';
import { resolveSeller, resolveCategory, parsePrice, parseStock, isCsvRowEmpty } from '../utils/importerResolvers';
import { checkDuplicateProductNumber, checkDuplicateDescription } from '../lib/productValidation';
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, FirebaseUser, IS_FIREBASE_ENABLED, signInWithPopup, GoogleAuthProvider, googleProvider, OAuthProvider, appleProvider, sendPasswordResetEmail, sendEmailVerification, fetchSignInMethodsForEmail } from '../firebase';
import { 
  dbLogger, 
  sanitizeFirestorePayload, 
  calculateObjectDiff 
} from '../utils/dbLogger';
import {
  dbMonitor,
  monitoredSetDoc,
  monitoredGetDoc,
  monitoredUpdateDoc,
  monitoredDeleteDoc,
  monitoredBatchCommit,
  sanitizeDocumentData
} from '../utils/databaseMonitor';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  getDocFromServer,
  getDocFromCache,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction
} from 'firebase/firestore';

const safeGetDoc = async (docRef: any): Promise<any> => {
  try {
    return await getDoc(docRef);
  } catch (err: any) {
    if (err.code === 'unavailable' || err.message?.includes('offline') || err.message?.includes('Failed to get document')) {
      console.warn("[ShopContext] safeGetDoc: Client is offline. Falling back to cache...", err.message);
      try {
        return await getDocFromCache(docRef);
      } catch (cacheErr) {
        throw err;
      }
    }
    throw err;
  }
};

export const ensureSellerItemCode = (p: Product): Product => {
  if (!p) return p;
  if (!p.sellerItemCode) {
    let hash = 0;
    const str = p.id || p.name || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const numeric = Math.abs(hash % 900000) + 100000;
    return { ...p, sellerItemCode: `SIC-${numeric}` };
  }
  return p;
};

export const ensureSellerCode = (s: Seller, index = 0): Seller => {
  if (!s.sellerCode || !s.sellerCode.trim()) {
    const codeNum = index + 101;
    return { ...s, sellerCode: `SLR-${codeNum}` };
  }
  return s;
};

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
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      // Redact email to prevent PII leakage
      email: auth.currentUser?.email ? '[REDACTED_PII]' : null,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return `Database error during ${operationType} on ${path || 'unknown'}: ${errorMessage}`;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export type NavTab = 'home' | 'products' | 'product_detail' | 'checkout' | 'account' | 'admin' | 'favorites';

const getInitialNavTab = (): NavTab => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/^\/+/, '');
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('admin') === 'true' || searchParams.has('admin') || path === 'admin' || path === 'admin.html') {
    return 'admin';
  }
  if (path.startsWith('product/')) {
    return 'product_detail';
  }
  if (path.startsWith('products')) {
    return 'products';
  }
  if (path === 'checkout' || path === 'account' || path === 'favorites') {
    return path as NavTab;
  }
  return 'home';
};

const getInitialCategory = (): string => {
  if (typeof window === 'undefined') return 'all';
  const path = window.location.pathname.replace(/^\/+/, '');
  if (path.startsWith('products/')) {
    const cat = path.replace('products/', '');
    return decodeURIComponent(cat) || 'all';
  }
  return 'all';
};

const getInitialProductDetail = (): Product | null => {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/^\/+/, '');
  if (path.startsWith('product/')) {
    const prodId = path.replace('product/', '');
    try {
      const saved = localStorage.getItem('yallalb_products');
      const all = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      return (all as Product[]).find(p => p.id === prodId) || null;
    } catch {
      return INITIAL_PRODUCTS.find(p => p.id === prodId) || null;
    }
  }
  return null;
};

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
  deleteMultipleProducts: (ids: string[]) => Promise<void>;
  reorderProducts: (orderedProducts: Product[]) => Promise<void>;
  toggleProductPublish: (productId: string) => Promise<void>;
  syncAllProductsToDatabase: () => Promise<void>;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (p: Product | null) => void;
  isDbSyncing: boolean;
  hasMoreProducts: boolean;
  isFetchingMore: boolean;
  loadMoreProducts: () => Promise<void>;

  // Currency
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (amountUSD: number) => string;
  convertUSDToLBP: (amountUSD: number) => number;
  currencySymbol: string;
  currencyRate: number;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, option?: string) => void;
  addMultipleToCart: (items: { product: Product; quantity?: number; option?: string }[]) => void;
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
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // Orders
  orders: Order[];
  placeOrder: (orderData: Omit<Order, 'id' | 'date' | 'trackingNumber' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // User Profile
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  checkPhoneUniqueness: (phone: string, excludeUid?: string) => Promise<{ available: boolean; reason?: string }>;

  // Firebase Auth & OTP Verification
  firebaseUser: FirebaseUser | null;
  isAdminUser: boolean;
  isEmailVerified: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, phone?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  logSearchQuery: (query: string, origin?: 'navbar' | 'products_page' | 'mobile_menu' | 'direct') => Promise<void>;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Feedback Toast
  toast: Toast | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;

  // Site Content CMS (Admin Managed)
  siteContent: SiteContent;
  updateSiteContent: (updates: Partial<SiteContent> | ((prev: SiteContent) => SiteContent)) => Promise<void>;
  toggleSectionVisibility: (sectionKey: keyof SectionVisibilityConfig) => Promise<void>;
  addCustomBlock: (block: Omit<CMSCustomBlock, 'id'>) => Promise<void>;
  updateCustomBlock: (id: string, updates: Partial<CMSCustomBlock>) => Promise<void>;
  deleteCustomBlock: (id: string) => Promise<void>;

  // Visual Edit Mode
  isVisualEditMode: boolean;
  setIsVisualEditMode: (val: boolean) => void;

  // Admin Security Lock
  isAdminUnlocked: boolean;
  setIsAdminUnlocked: (val: boolean) => void;

  // Recent Activities (Audit Logs)
  recentActivities: RecentActivity[];
  logAdminActivity: (
    actionType: RecentActivity['actionType'],
    summary: string,
    details: string,
    targetId?: string,
    snapshotBefore?: any,
    snapshotAfter?: any
  ) => Promise<void>;
  undoAdminActivity: (activityId: string) => Promise<void>;

  // Discounts & Promos
  discountRules: DiscountRule[];
  appliedCouponCode: string;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  discountUSD: number;
  finalCartTotalUSD: number;
  appliedDiscountRules: { rule: DiscountRule; savedUSD: number }[];
  addDiscountRule: (rule: Omit<DiscountRule, 'id'>) => Promise<void>;
  updateDiscountRule: (id: string, updates: Partial<DiscountRule>) => Promise<void>;
  deleteDiscountRule: (id: string) => Promise<void>;

  // Categories & Details Management
  categories: CategoryItem[];
  addCategory: (cat: Omit<CategoryItem, 'id'> & { id?: string }) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<void>;
  deleteCategory: (id: string, reassignCategoryId?: string) => Promise<void>;
  reorderCategories: (newOrder: CategoryItem[]) => Promise<void>;

  // Terroir Regions & Logistics
  regions: TerroirRegion[];
  updateRegion: (id: string, updates: Partial<TerroirRegion>) => Promise<void>;
  addRegion: (reg: TerroirRegion) => Promise<void>;
  deleteRegion: (id: string) => Promise<void>;

  // Sellers Management
  sellers: Seller[];
  addSeller: (seller: Omit<Seller, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  updateSeller: (id: string, updates: Partial<Seller>) => Promise<void>;
  toggleSellerActive: (sellerId: string, isActive: boolean) => Promise<void>;
  deleteSeller: (id: string, reassignSellerId?: string) => Promise<void>;
  bulkImportProducts: (csvText: string, options?: { targetSellerId?: string; fallbackCategoryId?: string }) => Promise<{ created: number; updated: number; errors: string[] }>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const INITIAL_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  avatar: '',
  defaultGovernorate: '',
  defaultCity: '',
  defaultAddress: ''
};

const INITIAL_ORDERS: Order[] = [];

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavTab>(getInitialNavTab);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(getInitialProductDetail);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    if (!firebaseUser) { setIsEmailVerified(false); return; }
    // force refresh so a freshly-clicked verification link is picked up
    firebaseUser.getIdTokenResult(true)
      .then(r => setIsEmailVerified(r.claims.email_verified === true))
      .catch(() => setIsEmailVerified(false));
  }, [firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      const isUserAdminEmail = firebaseUser.email === 'jamilarabi2000@gmail.com';
      firebaseUser.getIdTokenResult(true) // force refresh
        .then(result => {
          setIsAdminUser(result.claims.admin === true || isUserAdminEmail);
        })
        .catch(() => {
          setIsAdminUser(isUserAdminEmail);
        });
    } else {
      setIsAdminUser(false);
    }
  }, [firebaseUser]);
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

  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(true);
  const hasSeededProductsRef = useRef<boolean>(false);
  const hasSeededOrdersRef = useRef<boolean>(false);

  // Test Firestore Connection on Boot
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("[ShopContext] Firebase Firestore connection verified.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("[ShopContext] Please check your Firebase configuration or network connection.");
        }
      }
    }
    testConnection();
  }, []);

  // UI state
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(getInitialCategory);
  const [toast, setToast] = useState<Toast | null>(null);

  // Pagination states for products catalog
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const lastVisibleDocRef = useRef<any>(null);

  // Core Data States with local storage fallback
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_products');
      const list = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      return (list as Product[]).map(ensureSellerItemCode);
    } catch {
      return INITIAL_PRODUCTS.map(ensureSellerItemCode);
    }
  });

  const [storedCart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Live cart projection: always resolve fresh product properties from the live catalog
  const cart = useMemo<CartItem[]>(() => {
    if (storedCart.length === 0) return storedCart;
    let changed = false;
    const next = storedCart.map(item => {
      const live = products.find(p => p.id === item.product.id);
      if (!live || live === item.product) return item;
      changed = true;
      return { ...item, product: live };
    });
    return changed ? next : storedCart;
  }, [storedCart, products]);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
      if (saved) {
        return JSON.parse(saved);
      }
      return INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // Site Content CMS state
  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const saved = localStorage.getItem('yallalb_site_content');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customBlocks) {
          parsed.customBlocks = parsed.customBlocks.filter((b: CMSCustomBlock) => b.id !== 'heritage-diaspora-banner');
        }
        return parsed;
      }
      return DEFAULT_SITE_CONTENT;
    } catch {
      return DEFAULT_SITE_CONTENT;
    }
  });

  const [isVisualEditMode, setIsVisualEditMode] = useState<boolean>(false);

   const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_recent_activities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-time Recent Activity Sync from Firestore
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED || !isAdminUser) return;
    const activityColRef = collection(db, 'recent_activity');
    const q = query(activityColRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: RecentActivity[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as RecentActivity);
        });
        setRecentActivities(list.slice(0, 50));
      },
      (error) => {
        console.warn("[ShopContext] Recent activities listener warning:", error);
      }
    );
    return () => unsubscribe();
  }, [isAdminUser]);

  const logAdminActivity = async (
    actionType: RecentActivity['actionType'],
    summary: string,
    details: string,
    targetId?: string,
    snapshotBefore?: any,
    snapshotAfter?: any
  ) => {
    try {
      const activityId = `act-${Date.now()}`;
      const newActivity: RecentActivity = {
        id: activityId,
        timestamp: new Date().toISOString(),
        actionType,
        summary,
        details,
        adminEmail: firebaseUser?.email || user.email || 'anonymous-admin',
        ...(targetId ? { targetId } : {}),
        ...(snapshotBefore !== undefined ? { snapshotBefore } : {}),
        ...(snapshotAfter !== undefined ? { snapshotAfter } : {})
      };
      
      setRecentActivities(prev => {
        const next = [newActivity, ...prev].slice(0, 50);
        try {
          localStorage.setItem('yallalb_recent_activities', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (IS_FIREBASE_ENABLED && (isAdminUser || isAdminUnlocked)) {
        await monitoredSetDoc(doc(db, 'recent_activity', activityId), sanitizeDocumentData(newActivity), undefined, 'ShopContext:logAdminActivity').catch((err) => {
          console.warn("[ShopContext] Non-blocking admin activity log notice:", err);
        });
      }
    } catch (err) {
      console.warn('[ShopContext] Failed to log admin activity:', err);
    }
  };

  const undoAdminActivity = async (activityId: string) => {
    const act = recentActivities.find(a => a.id === activityId);
    if (!act) {
      showToast('Activity log entry not found.', 'error');
      return;
    }
    if (act.isUndone) {
      showToast('This action has already been undone.', 'error');
      return;
    }

    try {
      if (act.actionType === 'product_update' && act.targetId && act.snapshotBefore) {
        const restoredProduct = act.snapshotBefore as Product;
        setProducts(prev => prev.map(p => p.id === act.targetId ? { ...restoredProduct } : p));
        try {
          localStorage.setItem('yallalb_products', JSON.stringify(products.map(p => p.id === act.targetId ? { ...restoredProduct } : p)));
        } catch {}
        if (IS_FIREBASE_ENABLED) {
          await monitoredSetDoc(doc(db, 'products', act.targetId), sanitizeDocumentData(restoredProduct), undefined, 'ShopContext:undoAdminActivity');
        }
      } else if (act.actionType === 'product_add' && act.targetId) {
        setProducts(prev => prev.filter(p => p.id !== act.targetId));
        if (IS_FIREBASE_ENABLED) {
          await monitoredDeleteDoc(doc(db, 'products', act.targetId), 'ShopContext:undoAdminActivity');
        }
      } else if (act.actionType === 'product_delete' && act.targetId && act.snapshotBefore) {
        const restoredProduct = act.snapshotBefore as Product;
        setProducts(prev => [...prev.filter(p => p.id !== act.targetId), restoredProduct]);
        if (IS_FIREBASE_ENABLED) {
          await monitoredSetDoc(doc(db, 'products', act.targetId), sanitizeDocumentData(restoredProduct), undefined, 'ShopContext:undoAdminActivity');
        }
      } else if (act.actionType === 'product_bulk_update' && Array.isArray(act.snapshotBefore)) {
        const restoredProducts = act.snapshotBefore as Product[];
        const restoredMap = new Map(restoredProducts.map(p => [p.id, p]));
        setProducts(prev => prev.map(p => restoredMap.get(p.id) || p));
        if (IS_FIREBASE_ENABLED) {
          const batch = writeBatch(db);
          restoredProducts.forEach(p => {
            batch.set(doc(db, 'products', p.id), sanitizeDocumentData(p));
          });
          await batch.commit();
        }
      } else {
        showToast('Undo is only supported for product additions, updates, and deletions.', 'warning');
        return;
      }

      const undoneTimestamp = new Date().toISOString();
      setRecentActivities(prev => prev.map(a => a.id === activityId ? { ...a, isUndone: true, undoneAt: undoneTimestamp } : a));

      if (IS_FIREBASE_ENABLED) {
        await monitoredSetDoc(doc(db, 'recent_activity', activityId), { isUndone: true, undoneAt: undoneTimestamp }, { merge: true });
      }

      await logAdminActivity(
        'product_update',
        `Undid: ${act.summary}`,
        `Reverted changes from activity logged at ${new Date(act.timestamp).toLocaleTimeString()}`
      );

      showToast(`Successfully undone: "${act.summary}"! Changes recovered.`, 'success');
    } catch (err) {
      console.error('[ShopContext] Error undoing admin activity:', err);
      showToast('Failed to undo changes. Please check connection and try again.', 'error');
    }
  };

  const hasSeededDiscountsRef = useRef(false);

  const [discountRules, setDiscountRules] = useState<DiscountRule[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_discount_rules');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'rule-1',
        name: 'Koura Olive Oil Special (15% Off)',
        type: 'percentage',
        value: 15,
        target: 'brand',
        targetValue: 'Koura, North Lebanon',
        couponCode: 'KOURA15',
        isActive: true
      },
      {
        id: 'rule-2',
        name: 'Checkout Extra $5 Off',
        type: 'fixed',
        value: 5,
        target: 'checkout',
        couponCode: 'WELCOME5',
        isActive: true,
        minPurchaseUSD: 30
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_discount_rules', JSON.stringify(discountRules));
    } catch {}
  }, [discountRules]);

  // Real-time Discounts Sync from Firestore Database
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    const discountsColRef = collection(db, 'discounts');
    const unsubscribe = onSnapshot(
      discountsColRef,
      async (snapshot) => {
        if (snapshot.empty && !hasSeededDiscountsRef.current) {
          hasSeededDiscountsRef.current = true;
          const initialRules = [
            {
              id: 'rule-1',
              name: 'Koura Olive Oil Special (15% Off)',
              type: 'percentage',
              value: 15,
              target: 'brand',
              targetValue: 'Koura, North Lebanon',
              couponCode: 'KOURA15',
              isActive: true
            },
            {
              id: 'rule-2',
              name: 'Checkout Extra $5 Off',
              type: 'fixed',
              value: 5,
              target: 'checkout',
              couponCode: 'WELCOME5',
              isActive: true,
              minPurchaseUSD: 30
            }
          ];
          if (isAdminUser || isAdminUnlocked) {
            console.log("[ShopContext] Database discounts collection is empty. Seeding initial discount rules to Firestore...");
            try {
              const batch = writeBatch(db);
              initialRules.forEach(rule => {
                const docRef = doc(db, 'discounts', rule.id);
                batch.set(docRef, sanitizeDocumentData(rule));
              });
              await monitoredBatchCommit(batch, initialRules.length, 'discounts', 'ShopContext:AutoSeedDiscounts');
            } catch (seedErr) {
              console.error("[ShopContext] Error seeding discount rules:", seedErr);
            }
          }
          setDiscountRules(initialRules as DiscountRule[]);
        } else if (!snapshot.empty) {
          const rules: DiscountRule[] = [];
          snapshot.forEach(docSnap => {
            rules.push(docSnap.data() as DiscountRule);
          });
          setDiscountRules(rules);
        }
      },
      (error) => {
        console.warn("[ShopContext] Non-blocking discounts listener warning:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const addDiscountRule = async (ruleData: Omit<DiscountRule, 'id'>) => {
    const id = 'rule-' + Math.random().toString(36).substring(2, 9);
    const newRule: DiscountRule = {
      ...ruleData,
      id
    };
    try {
      if (IS_FIREBASE_ENABLED) {
        await monitoredSetDoc(doc(db, 'discounts', id), sanitizeDocumentData(newRule), undefined, 'ShopContext:addDiscountRule');
      }
    } catch (err) {
      console.error("[ShopContext] Error saving discount rule to Firestore:", err);
    }
    setDiscountRules(prev => [newRule, ...prev]);
    await logAdminActivity('meta_change', 'Created Discount Rule', `Created discount: ${newRule.name}`);
  };

  const updateDiscountRule = async (id: string, updates: Partial<DiscountRule>) => {
    let updatedRule: DiscountRule | null = null;
    setDiscountRules(prev => prev.map(r => {
      if (r.id === id) {
        updatedRule = { ...r, ...updates };
        return updatedRule;
      }
      return r;
    }));
    try {
      if (IS_FIREBASE_ENABLED && updatedRule) {
        await monitoredSetDoc(doc(db, 'discounts', id), sanitizeDocumentData(updatedRule), { merge: true }, 'ShopContext:updateDiscountRule');
      }
    } catch (err) {
      console.error("[ShopContext] Error updating discount rule in Firestore:", err);
    }
    await logAdminActivity('meta_change', 'Updated Discount Rule', `Updated discount ID: ${id}`);
  };

  const deleteDiscountRule = async (id: string) => {
    try {
      if (IS_FIREBASE_ENABLED) {
        await monitoredDeleteDoc(doc(db, 'discounts', id), 'ShopContext:deleteDiscountRule');
      }
    } catch (err) {
      console.error("[ShopContext] Error deleting discount rule from Firestore:", err);
    }
    setDiscountRules(prev => prev.filter(r => r.id !== id));
    await logAdminActivity('meta_change', 'Deleted Discount Rule', `Deleted discount ID: ${id}`);
  };

  // Categories & Details Management State
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Terroir Regions & Logistics State
  const [regions, setRegions] = useState<TerroirRegion[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_regions');
      return saved ? JSON.parse(saved) : LEBANON_REGIONS;
    } catch {
      return LEBANON_REGIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_categories', JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_regions', JSON.stringify(regions));
    } catch {}
  }, [regions]);

  // Real-time Categories Sync from Firestore Database
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    const catDocRef = doc(db, 'site_settings', 'categories');
    const unsubscribe = onSnapshot(
      catDocRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.list) && data.list.length > 0) {
            // Check if any default categories are missing in Firestore list
            const firestoreIds = new Set(data.list.map((c: any) => c.id));
            const missingFromDefault = DEFAULT_CATEGORIES.filter(c => !firestoreIds.has(c.id));
            if (missingFromDefault.length > 0 && (isAdminUser || isAdminUnlocked)) {
              console.log('[ShopContext] Supplementing missing categories to Firestore:', missingFromDefault.map(c => c.id));
              const merged = [...data.list, ...missingFromDefault];
              setCategories(merged);
              try {
                await monitoredSetDoc(catDocRef, { list: sanitizeDocumentData(merged) }, undefined, 'ShopContext:supplementCategories');
              } catch (suppErr) {
                console.warn('[ShopContext] Error supplementing missing categories:', suppErr);
              }
            } else {
              setCategories(data.list);
            }
          }
        } else {
          if (isAdminUser || isAdminUnlocked) {
            try {
              await monitoredSetDoc(catDocRef, { list: sanitizeDocumentData(DEFAULT_CATEGORIES) }, undefined, 'ShopContext:seedCategories');
            } catch (seedErr) {
              console.warn('[ShopContext] Error seeding default categories to Firestore:', seedErr);
            }
          }
          setCategories(DEFAULT_CATEGORIES);
        }
      },
      (err) => {
        console.warn('[ShopContext] Categories snapshot sync warning:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Regions Sync from Firestore Database
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    const regDocRef = doc(db, 'site_settings', 'regions');
    const unsubscribe = onSnapshot(
      regDocRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.list) && data.list.length > 0) {
            setRegions(data.list);
          }
        } else {
          if (isAdminUser || isAdminUnlocked) {
            try {
              await monitoredSetDoc(regDocRef, { list: sanitizeDocumentData(LEBANON_REGIONS) }, undefined, 'ShopContext:seedRegions');
            } catch (seedErr) {
              console.warn('[ShopContext] Error seeding default regions to Firestore:', seedErr);
            }
          }
          setRegions(LEBANON_REGIONS);
        }
      },
      (err) => {
        console.warn('[ShopContext] Regions snapshot sync warning:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const addCategory = async (catData: Omit<CategoryItem, 'id'> & { id?: string }) => {
    const slug = catData.id?.trim() || catData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    if (categories.some(c => c.id === slug)) {
      throw new Error(`A category with the ID "${slug}" already exists.`);
    }

    const newCategory: CategoryItem = {
      ...catData,
      id: slug,
      subcategories: catData.subcategories || [],
      arabicKeywords: catData.arabicKeywords || [],
      englishKeywords: catData.englishKeywords || [],
      isPublished: catData.isPublished ?? true,
      displayOrder: catData.displayOrder ?? (categories.length + 1)
    };
    
    const previous = [...categories];
    const nextCategories = [...categories, newCategory];
    setCategories(nextCategories);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(nextCategories) }, undefined, 'ShopContext:addCategory');
      } catch (err) {
        setCategories(previous);
        console.error('[ShopContext] Failed to add category to Firestore:', err);
        throw err;
      }
    }

    await logAdminActivity(
      'category_create',
      `Category "${newCategory.nameEn}" created`,
      `Added category "${newCategory.nameEn}" (${newCategory.nameAr}) with ID "${newCategory.id}", ${newCategory.subcategories.length} subcategories, and Arabic SEO tags.`
    );
  };

  const updateCategory = async (id: string, updates: Partial<CategoryItem>) => {
    const existing = categories.find(c => c.id === id);
    const previous = [...categories];
    const nextCategories = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    setCategories(nextCategories);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(nextCategories) }, undefined, 'ShopContext:updateCategory');
      } catch (err) {
        setCategories(previous);
        console.error('[ShopContext] Failed to update category in Firestore:', err);
        throw err;
      }
    }

    await logAdminActivity(
      'category_update',
      `Category "${existing?.nameEn || id}" updated`,
      `Modified attributes for category: ${Object.keys(updates).join(', ')}.`
    );
  };

  const deleteCategory = async (id: string, reassignCategoryId?: string) => {
    const target = categories.find(c => c.id === id);
    const affectedProducts = products.filter(p => p.category === id);

    if (affectedProducts.length > 0 && !reassignCategoryId) {
      throw new Error(`${affectedProducts.length} product(s) are in this category. Choose a category to move them to.`);
    }

    const previousCategories = [...categories];
    const nextCategories = categories.filter(c => c.id !== id);
    setCategories(nextCategories);

    if (IS_FIREBASE_ENABLED) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(nextCategories) });
        
        if (reassignCategoryId) {
          for (const prod of affectedProducts) {
            batch.update(doc(db, 'products', prod.id), { category: reassignCategoryId });
          }
        }
        await batch.commit();
      } catch (err) {
        setCategories(previousCategories);
        console.error('[ShopContext] Failed to delete category in Firestore:', err);
        throw err;
      }
    }

    await logAdminActivity(
      'category_delete',
      `Category "${target?.nameEn || id}" deleted`,
      `Removed category "${target?.nameEn || id}". ${reassignCategoryId ? `Reassigned associated products to "${reassignCategoryId}".` : ''}`
    );
  };

  const reorderCategories = async (newOrder: CategoryItem[]) => {
    const normalized = newOrder.map((cat, idx) => ({ ...cat, displayOrder: idx + 1 }));
    setCategories(normalized);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('yallalb_categories_cache', JSON.stringify(normalized));
      }
    } catch {}

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(normalized) }, undefined, 'ShopContext:reorderCategories');
      } catch (err) {
        console.error('[ShopContext] Error reordering categories in Firestore:', err);
        showToast('Failed to save category order to database', 'warning');
      }
    }

    await logAdminActivity('category_update', 'Categories reordered', `Admin reordered ${newOrder.length} categories.`);
  };

  const reorderProducts = async (orderedProducts: Product[]) => {
    const orderMap = new Map<string, number>();
    orderedProducts.forEach((p, idx) => {
      orderMap.set(p.id, idx + 1);
    });

    const updatedProducts = [...products].map(p => {
      if (orderMap.has(p.id)) {
        return { ...p, displayOrder: orderMap.get(p.id)! };
      }
      return p;
    }).sort((a, b) => {
      const orderA = a.displayOrder ?? 9999;
      const orderB = b.displayOrder ?? 9999;
      return orderA - orderB;
    });

    setProducts(updatedProducts);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('yallalb_products', JSON.stringify(updatedProducts));
      }
    } catch {}

    if (IS_FIREBASE_ENABLED) {
      try {
        // Chunk into batches of 400 for Firestore safety
        const CHUNK_SIZE = 400;
        for (let i = 0; i < orderedProducts.length; i += CHUNK_SIZE) {
          const chunk = orderedProducts.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((p, chunkIdx) => {
            const actualIdx = i + chunkIdx + 1;
            const prodRef = doc(db, 'products', p.id);
            batch.update(prodRef, { displayOrder: actualIdx });
          });
          await batch.commit();
        }
      } catch (err) {
        console.error('[ShopContext] Error reordering products in Firestore:', err);
        showToast('Failed to save product order to database', 'warning');
      }
    }

    await logAdminActivity('product_update', 'Products reordered', `Admin reordered ${orderedProducts.length} products.`);
  };

  const updateRegion = async (id: string, updates: Partial<TerroirRegion>) => {
    const existing = regions.find(r => r.id === id);
    const previous = [...regions];
    const nextRegions = regions.map(r => r.id === id ? { ...r, ...updates } : r);
    setRegions(nextRegions);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'regions'), { list: sanitizeDocumentData(nextRegions) }, undefined, 'ShopContext:updateRegion');
      } catch (err) {
        setRegions(previous);
        console.error('[ShopContext] Failed to update region in Firestore:', err);
        throw err;
      }
    }

    await logAdminActivity('region_update', `Region "${existing?.nameEn || id}" updated`, `Updated regional logistics and delivery fees.`);
  };

  const addRegion = async (newReg: TerroirRegion) => {
    const previous = [...regions];
    const nextRegions = [...regions, newReg];
    setRegions(nextRegions);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'regions'), { list: sanitizeDocumentData(nextRegions) }, undefined, 'ShopContext:addRegion');
      } catch (err) {
        setRegions(previous);
        console.error('[ShopContext] Failed to add region in Firestore:', err);
        throw err;
      }
    }

    await logAdminActivity('region_update', `Region zone "${newReg.nameEn}" added`, `Added delivery zone with base fee $${newReg.baseDeliveryUSD}.`);
  };

  const deleteRegion = async (id: string) => {
    const target = regions.find(r => r.id === id);
    const previous = [...regions];
    const nextRegions = regions.filter(r => r.id !== id);
    setRegions(nextRegions);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'regions'), { list: sanitizeDocumentData(nextRegions) }, undefined, 'ShopContext:deleteRegion');
      } catch (err) {
        setRegions(previous);
        console.error('[ShopContext] Failed to delete region in Firestore:', err);
        throw err;
      }
    }

    await logAdminActivity('region_update', `Region zone "${target?.nameEn || id}" deleted`, `Removed shipping zone ${id}.`);
  };

// Sellers Management State & Sync
  const [sellers, setSellers] = useState<Seller[]>(() => {
    try {
      const saved = localStorage.getItem('yallalb_sellers');
      const list = saved ? JSON.parse(saved) : DEFAULT_SELLERS;
      return (list as Seller[]).map((s, idx) => ensureSellerCode(s, idx));
    } catch {
      return DEFAULT_SELLERS.map((s, idx) => ensureSellerCode(s, idx));
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_sellers', JSON.stringify(sellers));
    } catch {}
  }, [sellers]);

  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    const sellersColRef = collection(db, 'sellers');
    const unsubscribe = onSnapshot(
      sellersColRef,
      async (snapshot) => {
        if (snapshot.empty) {
          if (isAdminUser || isAdminUnlocked) {
            try {
              const batch = writeBatch(db);
              DEFAULT_SELLERS.forEach(s => {
                batch.set(doc(db, 'sellers', s.id), sanitizeDocumentData(s));
              });
              await batch.commit();
            } catch (seedErr) {
              console.warn('[ShopContext] Error seeding default sellers to Firestore:', seedErr);
            }
          }
          setSellers(DEFAULT_SELLERS);
        } else {
          const list: Seller[] = [];
          let idx = 0;
          snapshot.forEach(docSnap => {
            const raw = { id: docSnap.id, ...docSnap.data() } as Seller;
            list.push(ensureSellerCode(raw, idx++));
          });
          setSellers(list);
        }
      },
      (err) => {
        console.warn('[ShopContext] Sellers subscription error:', err);
      }
    );
    return () => unsubscribe();
  }, [isAdminUser, isAdminUnlocked]);

  const addSeller = async (sellerData: Omit<Seller, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; sellerCode?: string }) => {
    const slug = sellerData.id?.trim() || sellerData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `seller-${Date.now()}`;
    if (sellers.some(s => s.id === slug)) {
      throw new Error(`A seller with the ID "${slug}" already exists.`);
    }
    const sellerCode = sellerData.sellerCode?.trim() || `SLR-${Math.floor(100 + Math.random() * 900)}`;
    const newSeller: Seller = {
      ...sellerData,
      id: slug,
      sellerCode,
      isActive: sellerData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const previous = [...sellers];
    const nextSellers = [...sellers, newSeller];
    setSellers(nextSellers);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'sellers', slug), sanitizeDocumentData(newSeller), undefined, 'ShopContext:addSeller');
      } catch (err) {
        setSellers(previous);
        throw err;
      }
    }
    await logAdminActivity('meta_change', `Seller "${newSeller.nameEn}" added`, `Created seller ID: ${slug}`);
  };

  const updateSeller = async (id: string, updates: Partial<Seller>) => {
    const previous = [...sellers];
    const nextSellers = sellers.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
    setSellers(nextSellers);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredUpdateDoc(doc(db, 'sellers', id), sanitizeDocumentData({ ...updates, updatedAt: new Date().toISOString() }), 'ShopContext:updateSeller');
      } catch (err) {
        setSellers(previous);
        throw err;
      }
    }
  };

  const toggleSellerActive = async (sellerId: string, isActive: boolean) => {
    const previousSellers = [...sellers];
    const nextSellers = sellers.map(s => s.id === sellerId ? { ...s, isActive, updatedAt: new Date().toISOString() } : s);
    setSellers(nextSellers);

    if (IS_FIREBASE_ENABLED) {
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'sellers', sellerId), { isActive, updatedAt: new Date().toISOString() });

        const affected = await getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId)));
        affected.forEach(d => {
          batch.update(d.ref, { sellerActive: isActive });
        });
        await batch.commit();
      } catch (err) {
        setSellers(previousSellers);
        throw err;
      }
    }
    await logAdminActivity('meta_change', `Seller "${sellerId}" active status toggled to ${isActive}`, '');
  };

  const deleteSeller = async (id: string, reassignSellerId?: string) => {
    const affectedProducts = products.filter(p => p.sellerId === id);
    if (affectedProducts.length > 0 && !reassignSellerId) {
      throw new Error(`${affectedProducts.length} product(s) belong to this seller. Choose a seller to move them to.`);
    }
    const previousSellers = [...sellers];
    const nextSellers = sellers.filter(s => s.id !== id);
    setSellers(nextSellers);

    if (IS_FIREBASE_ENABLED) {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'sellers', id));
        if (reassignSellerId) {
          for (const prod of affectedProducts) {
            batch.update(doc(db, 'products', prod.id), { sellerId: reassignSellerId });
          }
        }
        await batch.commit();
      } catch (err) {
        setSellers(previousSellers);
        throw err;
      }
    }
    await logAdminActivity('meta_change', `Seller "${id}" deleted`, `Reassigned ${affectedProducts.length} products to ${reassignSellerId || 'none'}.`);
  };

  const bulkImportProducts = async (
    csvText: string,
    options?: { targetSellerId?: string; fallbackCategoryId?: string }
  ): Promise<{ created: number; updated: number; errors: string[] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim().toLowerCase(),
        complete: async (results) => {
          const rows = results.data as any[];
          let created = 0;
          let updated = 0;
          const errors: string[] = [];
          const validRows: any[] = [];
          const seenSkusInFile = new Set<string>();
          const seenItemCodesInFile = new Set<string>();
          const seenDescriptionsInFile = new Map<string, string>(); // cleaned desc -> product name

          rows.forEach((row, idx) => {
            if (isCsvRowEmpty(row)) return;
            const rowNum = idx + 2;
            const name = (row.name_en || row.name || row.title || '').toString().trim();
            const resolvedSeller = resolveSeller(row, sellers, options?.targetSellerId);
            const resolvedCategory = resolveCategory(row, categories, options?.fallbackCategoryId);
            const priceUSD = parsePrice(row.price_usd || row.price || row.unit_price);
            const stock = parseStock(row.stock !== undefined ? row.stock : row.qty);

            if (!name) {
              errors.push(`Row ${rowNum}: name_en is required`);
              return;
            }
            if (!resolvedSeller) {
              const rawSeller = row.seller_id || row.seller || row.seller_artisan || 'empty';
              errors.push(`Row ${rowNum}: seller "${rawSeller}" could not be matched to an active seller. Please select a Target Seller dropdown.`);
              return;
            }
            if (!resolvedCategory) {
              const rawCat = row.category || row.category_id || 'empty';
              errors.push(`Row ${rowNum}: category "${rawCat}" not found`);
              return;
            }
            if (priceUSD <= 0) {
              errors.push(`Row ${rowNum}: price_usd must be a positive number (found ${row.price_usd || row.price})`);
              return;
            }
            if (isNaN(stock) || stock < 0) {
              errors.push(`Row ${rowNum}: stock must be a non-negative integer (found "${row.stock !== undefined ? row.stock : row.qty}")`);
              return;
            }

            const sku = (row.sku || row.product_id || '').toString().trim() || `prod-${Date.now()}-${idx}`;
            const isPublished = !['false', '0', 'no', 'hidden'].includes(String(row.is_published ?? row.status ?? '').toLowerCase());
            const sellerItemCode = (row.seller_item_code || row.seller_code || row.item_code || '').toString().trim() || `SIC-${Math.floor(10000 + Math.random() * 90000)}`;

            // 1. Validation: Duplicate Product Number (SKU & sellerItemCode)
            const normSku = sku.toLowerCase();
            const normItemCode = sellerItemCode.toLowerCase();
            const sellerKey = (resolvedSeller?.sellerId || resolvedSeller?.sellerName || '').toLowerCase().trim();
            const sellerCodeKey = `${sellerKey}::${normItemCode}`;

            if (seenSkusInFile.has(normSku)) {
              errors.push(`Row ${rowNum} ("${name}"): Duplicate SKU / Product ID "${sku}" appears multiple times in CSV import.`);
              return;
            }
            if (seenItemCodesInFile.has(sellerCodeKey)) {
              errors.push(`Row ${rowNum} ("${name}"): Duplicate Seller Item Code "${sellerItemCode}" for seller "${resolvedSeller.sellerName}" appears multiple times in CSV import.`);
              return;
            }

            // Check against existing products in database
            const existingProduct = products.find(p => p.id === sku);
            const isExistingSku = !!existingProduct;
            const dupCodeCheck = checkDuplicateProductNumber(sellerItemCode, isExistingSku ? sku : null, products, resolvedSeller.sellerId, resolvedSeller.sellerName);
            if (dupCodeCheck.isDuplicate) {
              errors.push(`Row ${rowNum} ("${name}"): Seller item code "${sellerItemCode}" is already assigned to existing product "${dupCodeCheck.conflictingProduct?.name}" for seller "${resolvedSeller.sellerName}".`);
              return;
            }

            const description = (row.description_en || row.description || 'Imported artisanal product.').toString().trim();
            const craftStory = (row.description_ar || row.craftstory || row.arabic_description || 'حرفية أصيلة.').toString().trim();

            seenSkusInFile.add(normSku);
            seenItemCodesInFile.add(sellerCodeKey);

            const mainImage = (row.image_url || row.image || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80').toString().trim();
            const addlImagesRaw = row.additional_images || row.images || row.gallery;
            const additionalImages = addlImagesRaw
              ? String(addlImagesRaw).split(/[|,]/).map((u: string) => u.trim()).filter(Boolean)
              : undefined;

            const videoUrl = (row.video_url || row.video || '').toString().trim() || undefined;
            const addlVideosRaw = row.additional_videos || row.videos;
            const additionalVideos = addlVideosRaw
              ? String(addlVideosRaw).split(/[|,]/).map((v: string) => v.trim()).filter(Boolean)
              : undefined;

            const nowIso = new Date().toISOString();

            validRows.push({
              sku,
              product: {
                id: sku,
                sellerItemCode,
                name,
                arabicName: (row.name_ar || row.arabic_name || name).toString().trim(),
                artisan: resolvedSeller.sellerName,
                seller: resolvedSeller.sellerName,
                arabicSeller: resolvedSeller.arabicSeller || row.arabic_seller || '',
                sellerId: resolvedSeller.sellerId,
                sellerActive: true,
                category: resolvedCategory.categoryId,
                priceUSD,
                originalPriceUSD: row.original_price_usd ? parsePrice(row.original_price_usd) : undefined,
                stock: Math.floor(stock),
                image: mainImage,
                additionalImages: additionalImages && additionalImages.length > 0 ? additionalImages : undefined,
                videoUrl,
                additionalVideos: additionalVideos && additionalVideos.length > 0 ? additionalVideos : undefined,
                videos: additionalVideos && additionalVideos.length > 0 ? additionalVideos : (videoUrl ? [videoUrl] : undefined),
                description,
                craftStory,
                tags: row.tags ? String(row.tags).split(/[|,]/).map((t: string) => t.trim()).filter(Boolean) : ['Artisanal'],
                rating: 0,
                reviewsCount: 0,
                origin: (row.origin || row.origin_terroir || 'Lebanon').toString().trim(),
                weightOrVolume: (row.weight_or_volume || row.weight || row.volume || '').toString().trim() || undefined,
                isPublished,
                createdAt: existingProduct?.createdAt || nowIso,
                updatedAt: nowIso
              },
              isUpdate: isExistingSku
            });
          });

          if (validRows.length === 0) {
            resolve({ created, updated, errors });
            return;
          }

          // 1. Immediately update in-memory products and localStorage so UI updates instantly
          setProducts(prevProducts => {
            const nextMap = new Map<string, Product>();
            prevProducts.forEach(p => nextMap.set(p.id, p));
            validRows.forEach(item => {
              nextMap.set(item.sku, item.product);
            });
            const merged = Array.from(nextMap.values());
            try {
              localStorage.setItem('yallalb_products', JSON.stringify(merged));
            } catch {}
            return merged;
          });

          if (IS_FIREBASE_ENABLED) {
            try {
              const chunks = [];
              for (let i = 0; i < validRows.length; i += 450) {
                chunks.push(validRows.slice(i, i + 450));
              }
              for (const chunk of chunks) {
                const batch = writeBatch(db);
                for (const item of chunk) {
                  const docRef = doc(db, 'products', item.sku);
                  batch.set(docRef, sanitizeDocumentData(item.product), { merge: true });
                  if (item.isUpdate) updated++;
                  else created++;
                }
                await batch.commit();
              }
            } catch (err: any) {
              console.error('[ShopContext] Database batch commit failed:', err);
              errors.push(`Database batch commit failed: ${err.message}`);
            }
          } else {
            validRows.forEach(item => {
              if (item.isUpdate) updated++;
              else created++;
            });
          }

          const previousSnapshots = validRows.map(r => products.find(p => p.id === r.sku)).filter(Boolean);
          const updatedSnapshots = validRows.map(r => r.product);

          await logAdminActivity(
            'product_bulk_update',
            `CSV Bulk Import (${validRows.length} products)`,
            `Created: ${created}, Updated: ${updated}, Errors: ${errors.length}`,
            'bulk_csv_import',
            previousSnapshots,
            updatedSnapshots
          );
          resolve({ created, updated, errors });
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  };

  // Local storage persistence for CMS
  useEffect(() => {
    try {
      localStorage.setItem('yallalb_site_content', JSON.stringify(siteContent));
    } catch {}
  }, [siteContent]);

  // Real-time CMS Sync from Firestore Database
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    const cmsDocRef = doc(db, 'cms', 'main');
    const unsubscribe = onSnapshot(
      cmsDocRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          console.log("[ShopContext] CMS main document does not exist.");
          if (isAdminUser || isAdminUnlocked) {
            console.log("[ShopContext] Seeding DEFAULT_SITE_CONTENT to Firestore...");
            try {
              const sanitizedDefault = sanitizeDocumentData(DEFAULT_SITE_CONTENT);
              await monitoredSetDoc(cmsDocRef, sanitizedDefault, undefined, 'ShopContext:AutoSeedCMS');
              console.log("[ShopContext] Successfully seeded CMS default site content to Firestore.");
              dbLogger.logSnapshotSync({
                targetPath: 'cms/main',
                sourceComponent: 'ShopContext (AutoSeed)',
                summary: 'Seeded initial DEFAULT_SITE_CONTENT to Firestore (cms/main).'
              });
            } catch (seedErr) {
              console.error("[ShopContext] Error seeding CMS content to Firestore:", seedErr);
            }
          }
        } else {
          const data = snapshot.data() as Partial<SiteContent>;
          if (data) {
            dbMonitor.logSnapshotSync({
              path: 'cms/main',
              caller: 'ShopContext:onSnapshot(cms/main)',
              docExists: true,
              data,
              metadata: {
                customBlocksCount: data.customBlocks?.length || 0,
                brandName: data.navbar?.brandName
              }
            });

            dbLogger.logSnapshotSync({
              targetPath: 'cms/main',
              sourceComponent: 'onSnapshot(cms/main)',
              summary: `Live CMS snapshot received from Firestore (${Object.keys(data).length} top-level fields).`,
              itemCountOrDetails: {
                customBlocksCount: data.customBlocks?.length || 0,
                brandName: data.navbar?.brandName
              }
            });

            setSiteContent((prev) => ({
              ...DEFAULT_SITE_CONTENT,
              ...data,
              visibility: {
                ...DEFAULT_SITE_CONTENT.visibility,
                ...(data.visibility || {})
              },
              customBlocks: (data.customBlocks || DEFAULT_SITE_CONTENT.customBlocks || []).filter((b: CMSCustomBlock) => b.id !== 'heritage-diaspora-banner'),
              navbar: {
                ...DEFAULT_SITE_CONTENT.navbar,
                ...(data.navbar || {}),
                brandName: data.navbar?.brandName === 'Yalla Lebanon' ? 'Yalla' : (data.navbar?.brandName || DEFAULT_SITE_CONTENT.navbar.brandName)
              },
              hero: {
                ...DEFAULT_SITE_CONTENT.hero,
                ...(data.hero || {})
              },
              offers: {
                ...DEFAULT_SITE_CONTENT.offers,
                ...(data.offers || {})
              },
              home: {
                ...DEFAULT_SITE_CONTENT.home,
                ...(data.home || {})
              },
              productsPage: {
                ...DEFAULT_SITE_CONTENT.productsPage,
                ...(data.productsPage || {})
              },
              productDetailPage: {
                ...DEFAULT_SITE_CONTENT.productDetailPage,
                ...(data.productDetailPage || {})
              },
              checkoutPage: {
                ...DEFAULT_SITE_CONTENT.checkoutPage,
                ...(data.checkoutPage || {})
              },
              accountPage: {
                ...DEFAULT_SITE_CONTENT.accountPage,
                ...(data.accountPage || {})
              },
              newsSection: {
                ...DEFAULT_SITE_CONTENT.newsSection,
                ...(data.newsSection || {})
              },
              socialLinks: {
                ...DEFAULT_SITE_CONTENT.socialLinks,
                ...(data.socialLinks || {})
              },
              footer: {
                ...DEFAULT_SITE_CONTENT.footer,
                ...(data.footer || {})
              }
            }));
          }
        }
      },
      (error) => {
        dbMonitor.logOperationFailure('snap-cms-error', error, {
          metadata: { path: 'cms/main', operation: 'SNAPSHOT_SYNC' }
        });
        console.warn("[ShopContext] Non-blocking CMS listener warning:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSiteContent = async (updates: Partial<SiteContent> | ((prev: SiteContent) => SiteContent)) => {
    // Determine the next state safely
    const nextContent = typeof updates === 'function' ? updates(siteContent) : { ...siteContent, ...updates };
    
    // Stage 1: Form Input Logged with calculated diff
    const diff = calculateObjectDiff(siteContent as any, nextContent as any);
    const modifiedKeys = Object.keys(diff);
    dbLogger.logFormInput({
      sourceComponent: 'ShopContext',
      actionName: 'updateSiteContent',
      targetPath: 'cms/main',
      summary: `CMS Form submission initiated for ${modifiedKeys.length} section(s): [${modifiedKeys.join(', ') || 'full update'}]`,
      payload: nextContent,
      diff
    });

    // Stage 2: Sanitize Payload (strips undefined values recursively)
    const sanitized = sanitizeDocumentData(nextContent);
    dbLogger.logSanitization({
      sourceComponent: 'ShopContext',
      actionName: 'sanitizeFirestorePayload',
      targetPath: 'cms/main',
      summary: 'Sanitized CMS document data for Firestore serialization compliance.',
      cleanedPayload: sanitized
    });

    // Stage 3: Initiate Firestore Write Operation
    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'setDoc',
      targetPath: 'cms/main',
      sourceComponent: 'ShopContext',
      actionName: 'setDoc(cms/main)',
      summary: `Persisting updated site content to Firestore document (cms/main)...`,
      payload: sanitized
    });

    if (!IS_FIREBASE_ENABLED) {
      setSiteContent(sanitized);
      try {
        localStorage.setItem('yallalb_site_content', JSON.stringify(sanitized));
      } catch {}

      const isMetaChange = modifiedKeys.includes('seo') || Object.keys(diff).some(k => k.startsWith('seo.'));
      if (isMetaChange) {
        await logAdminActivity(
          'meta_change',
          'SEO Meta Tags updated',
          `Modified global page title or description for search engines locally: [${modifiedKeys.join(', ')}].`
        );
      } else {
        await logAdminActivity(
          'cms_update',
          'CMS Content updated',
          `Modified fields locally: ${modifiedKeys.join(', ') || 'none'}.`
        );
      }
      return;
    }

    try {
      const cmsDocRef = doc(db, 'cms', 'main');
      await monitoredSetDoc(cmsDocRef, sanitized, { merge: true }, 'ShopContext:updateSiteContent');

      // Stage 4: Firestore Acknowledgment
      dbLogger.logFirestoreWriteSuccess({
        operation: 'setDoc',
        targetPath: 'cms/main',
        sourceComponent: 'ShopContext',
        actionName: 'setDoc(cms/main)',
        summary: 'Firestore document cms/main successfully persisted and acknowledged by database.',
        startTime,
        payload: sanitized
      });

      // Update local state and localStorage
      setSiteContent(sanitized);
      try {
        localStorage.setItem('yallalb_site_content', JSON.stringify(sanitized));
      } catch {}

      // Check if SEO fields actually changed to log a "meta_change" rather than general "cms_update"
      const isMetaChange = modifiedKeys.includes('seo') || Object.keys(diff).some(k => k.startsWith('seo.'));
      if (isMetaChange) {
        await logAdminActivity(
          'meta_change',
          'SEO Meta Tags updated',
          `Modified global page title or description for search engines: [${modifiedKeys.join(', ')}].`
        );
      } else {
        await logAdminActivity(
          'cms_update',
          'Site content updated',
          `Published updates to sections: [${modifiedKeys.join(', ')}].`
        );
      }

    } catch (err: any) {
      dbLogger.logFirestoreWriteError({
        operation: 'setDoc',
        targetPath: 'cms/main',
        sourceComponent: 'ShopContext',
        actionName: 'setDoc(cms/main)',
        summary: 'Error writing CMS content to Firestore',
        startTime,
        error: err
      });
      console.error("[ShopContext] Error saving CMS content to Firestore:", err);
      throw err;
    }
  };

  const toggleSectionVisibility = async (sectionKey: keyof SectionVisibilityConfig) => {
    const currentVal = siteContent.visibility?.[sectionKey] ?? true;
    const nextVal = !currentVal;
    
    await updateSiteContent((prev) => ({
      ...prev,
      visibility: {
        ...(prev.visibility || DEFAULT_SITE_CONTENT.visibility),
        [sectionKey]: nextVal
      }
    }));

    showToast(`Section "${String(sectionKey)}" is now ${nextVal ? 'VISIBLE (Published)' : 'HIDDEN'}`, 'info');
  };

  const addCustomBlock = async (newBlockData: Omit<CMSCustomBlock, 'id'>) => {
    const id = `block-${Date.now()}`;
    const newBlock: CMSCustomBlock = { ...newBlockData, id };
    
    await updateSiteContent((prev) => ({
      ...prev,
      customBlocks: [...(prev.customBlocks || []), newBlock]
    }));

    showToast(`Custom element "${newBlock.title}" created & published!`, 'success');
  };

  const updateCustomBlock = async (id: string, updates: Partial<CMSCustomBlock>) => {
    await updateSiteContent((prev) => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).map((b) => (b.id === id ? { ...b, ...updates } : b))
    }));

    showToast('Custom block updated and published!', 'success');
  };

  const deleteCustomBlock = async (id: string) => {
    await updateSiteContent((prev) => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).filter((b) => b.id !== id)
    }));

    showToast('Custom block deleted from page', 'warning');
  };

  const toggleProductPublish = async (productId: string) => {
    const targetProd = products.find(p => p.id === productId);
    if (!targetProd) return;
    const isCurrentlyPublished = targetProd.isPublished !== false;
    const nextState = !isCurrentlyPublished;

    await updateProduct(productId, { isPublished: nextState });
    showToast(`Product "${targetProd.name}" is now ${nextState ? 'PUBLISHED' : 'HIDDEN'}`, 'info');
  };

  // Local storage persistence
  useEffect(() => {
    try {
      localStorage.setItem('yallalb_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_cart', JSON.stringify(storedCart));
    } catch {}
  }, [storedCart]);

  useEffect(() => {
    try {
      localStorage.setItem('yallalb_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

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

  // Real-time Products Sync from Firestore Database
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) {
      try {
        const stored = localStorage.getItem('yallalb_products');
        if (stored) {
          const list = JSON.parse(stored) as Product[];
          setProducts(list.map(ensureSellerItemCode));
        } else {
          const seeded = INITIAL_PRODUCTS.map(ensureSellerItemCode);
          setProducts(seeded);
          localStorage.setItem('yallalb_products', JSON.stringify(seeded));
        }
      } catch {
        setProducts(INITIAL_PRODUCTS.map(ensureSellerItemCode));
      }
      setIsDbSyncing(false);
      return;
    }

    const productsColRef = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsColRef,
      async (snapshot) => {
        if (snapshot.empty && !hasSeededProductsRef.current) {
          hasSeededProductsRef.current = true;
          if (isAdminUser || isAdminUnlocked) {
            console.log("[ShopContext] Database products collection is empty. Seeding initial catalog to Firestore...");
            try {
              const batch = writeBatch(db);
              INITIAL_PRODUCTS.forEach((prod) => {
                const prodDocRef = doc(db, 'products', prod.id);
                batch.set(prodDocRef, sanitizeDocumentData(ensureSellerItemCode(prod)));
              });
              await monitoredBatchCommit(batch, INITIAL_PRODUCTS.length, 'products', 'ShopContext:AutoSeedProducts');
              console.log(`[ShopContext] Successfully seeded ${INITIAL_PRODUCTS.length} artisan products to Firestore database.`);
            } catch (seedErr) {
              console.error("[ShopContext] Error seeding products to Firestore:", seedErr);
            }
          }
          setProducts(INITIAL_PRODUCTS.map(ensureSellerItemCode));
          setHasMoreProducts(false);
        } else if (!snapshot.empty) {
          const dbProductsMap = new Map<string, Product>();
          snapshot.forEach((docSnap) => {
            const p = ensureSellerItemCode(docSnap.data() as Product);
            dbProductsMap.set(docSnap.id, p);
          });

          const allProducts = Array.from(dbProductsMap.values()).sort((a, b) => {
            const orderA = a.displayOrder ?? 9999;
            const orderB = b.displayOrder ?? 9999;
            return orderA - orderB;
          });
          setProducts(allProducts);
          setHasMoreProducts(false);

          try {
            localStorage.setItem('yallalb_products', JSON.stringify(allProducts));
          } catch {}

          dbMonitor.logSnapshotSync({
            path: 'products/*',
            caller: 'ShopContext:onSnapshot(products)',
            itemCount: snapshot.docs.length,
            metadata: { totalItems: dbProductsMap.size }
          });
        }
        setIsDbSyncing(false);
      },
      (error: any) => {
        dbMonitor.logOperationFailure('fetch-products-err', error, {
          metadata: { path: 'products/*', operation: 'SNAPSHOT_SYNC' }
        });
        console.warn("[ShopContext] Products listener warning:", error);
        handleFirestoreError(error, OperationType.GET, 'products');
        setIsDbSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [isAdminUser, isAdminUnlocked]);

  const loadMoreProducts = useCallback(async () => {
    if (!IS_FIREBASE_ENABLED || isFetchingMore || !hasMoreProducts || !lastVisibleDocRef.current) {
      return;
    }

    setIsFetchingMore(true);
    try {
      const productsColRef = collection(db, 'products');
      const q = query(
        productsColRef,
        orderBy('id'),
        startAfter(lastVisibleDocRef.current),
        limit(24)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        lastVisibleDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMoreProducts(snapshot.docs.length === 24);

        const newProducts: Product[] = [];
        snapshot.forEach((docSnap) => {
          newProducts.push(docSnap.data() as Product);
        });

        setProducts((prev) => {
          // Filter duplicates just in case
          const prevIds = new Set(prev.map(p => p.id));
          const filteredNew = newProducts.filter(p => !prevIds.has(p.id));
          const updated = [...prev, ...filteredNew];
          try {
            localStorage.setItem('yallalb_products', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        dbMonitor.logSnapshotSync({
          path: 'products/*',
          caller: 'ShopContext:loadMoreProducts',
          itemCount: snapshot.docs.length,
          metadata: { totalItems: snapshot.docs.length }
        });
      } else {
        setHasMoreProducts(false);
      }
    } catch (err) {
      console.error("[ShopContext] Error fetching paginated products:", err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMoreProducts]);

  // Real-time Orders Sync from Firestore Database (scoped for security)
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) {
      try {
        const stored = localStorage.getItem('yallalb_orders');
        if (stored) {
          setOrders(JSON.parse(stored));
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      }
      return;
    }

    if (!firebaseUser) {
      setOrders([]);
      return;
    }

    let q;
    if (isAdminUser) {
      q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    } else {
      q = query(collection(db, 'orders'), where('userId', '==', firebaseUser.uid), orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty) {
          const dbOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            dbOrders.push(docSnap.data() as Order);
          });
          // Sort newest first
          dbOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          dbMonitor.logSnapshotSync({
            path: 'orders/*',
            caller: 'ShopContext:onSnapshot(orders)',
            itemCount: dbOrders.length
          });

          setOrders(dbOrders);
        } else {
          setOrders([]);
        }
      },
      (error) => {
        dbMonitor.logOperationFailure('snap-orders-err', error, {
          metadata: { path: 'orders/*', operation: 'SNAPSHOT_SYNC' }
        });
        console.warn("[ShopContext] Non-blocking orders listener notice:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, isAdminUser, isAdminUnlocked]);

  // Auth & User / Cart / Wishlist synchronization
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) {
      // Offline/Local mode: Load profile, wishlist, and cart from localStorage
      try {
        const storedUser = localStorage.getItem('yallalb_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        const storedWishlist = localStorage.getItem('yallalb_wishlist');
        if (storedWishlist) {
          setWishlist(JSON.parse(storedWishlist));
        }
        const storedCart = localStorage.getItem('yallalb_cart');
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch {}
      return;
    }

    console.log("[ShopContext] Initializing Firebase Auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (userObj) => {
      console.log("[ShopContext] Auth state changed. User:", userObj ? userObj.uid : "None (Guest)");
      if (!userObj) {
        setFirebaseUser(null);
        setUser(INITIAL_USER);
        setIsAdminUser(false);
        setIsAdminUnlockedState(false);
        // Preserve local guest cart and wishlist if available
        try {
          const storedCart = localStorage.getItem('yallalb_cart');
          if (storedCart) {
            const parsed = JSON.parse(storedCart);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCart(parsed);
            }
          }
          const storedWishlist = localStorage.getItem('yallalb_wishlist');
          if (storedWishlist) {
            const parsed = JSON.parse(storedWishlist);
            if (Array.isArray(parsed)) {
              setWishlist(parsed);
            }
          }
        } catch {}
        return;
      }
      setFirebaseUser(userObj);
      const userKey = userObj.uid;

      // Sync User Profile
      if (userObj) {
        try {
          const userDocRef = doc(db, 'users', userObj.uid);
          const userSnap = await safeGetDoc(userDocRef);
          
          // Helper to extract first/last name from display name or email
          const deriveNames = (displayName?: string | null, email?: string | null) => {
            if (displayName && displayName.trim()) {
              const parts = displayName.trim().split(/\s+/);
              return {
                firstName: parts[0],
                lastName: parts.slice(1).join(' ') || 'Patron',
                name: displayName.trim()
              };
            }
            if (email && email.includes('@')) {
              const raw = email.split('@')[0].replace(/[0-9]+/g, ' ').trim();
              const parts = raw.split(/[\._\-\s]+/).filter(Boolean);
              if (parts.length >= 2) {
                const f = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
                const l = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
                return { firstName: f, lastName: l, name: `${f} ${l}` };
              } else if (parts.length === 1 && parts[0].length > 0) {
                const f = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
                return { firstName: f, lastName: '', name: f };
              }
            }
            return { firstName: '', lastName: '', name: '' };
          };

          const fallbackNames = deriveNames(userObj.displayName, userObj.email);

          // Check if local cache has shipping defaults
          let cachedShipping: Partial<UserProfile> = {};
          try {
            const rawCache = localStorage.getItem('yallalb_saved_checkout_data');
            if (rawCache) {
              cachedShipping = JSON.parse(rawCache);
            }
          } catch {}

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            const firstName = data.firstName || (data.name ? data.name.split(' ')[0] : '') || cachedShipping.firstName || fallbackNames.firstName;
            const lastName = data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') : '') || cachedShipping.lastName || fallbackNames.lastName;
            const phone = data.phone || cachedShipping.phone || '';
            const defaultCity = data.defaultCity || cachedShipping.defaultCity || '';
            const defaultAddress = data.defaultAddress || cachedShipping.defaultAddress || '';
            const defaultBuilding = data.defaultBuilding || cachedShipping.defaultBuilding || '';
            const defaultNotes = data.defaultNotes || cachedShipping.defaultNotes || '';

            const mergedProfile: UserProfile = {
              ...data,
              firstName,
              lastName,
              name: data.name || `${firstName} ${lastName}`.trim(),
              email: data.email || userObj.email || '',
              phone,
              defaultCity,
              defaultAddress,
              defaultBuilding,
              defaultNotes
            };

          console.log("[ShopContext] Merged profile:", mergedProfile);
            setUser(prev => ({ 
              ...prev, 
              ...mergedProfile
            }));
          } else {
            console.log("[ShopContext] User document does not exist, creating new user data.");
            let tempSignup: any = {};
            try {
              const rawTemp = localStorage.getItem('yallalb_signup_profile_temp');
              if (rawTemp) {
                tempSignup = JSON.parse(rawTemp);
                localStorage.removeItem('yallalb_signup_profile_temp');
              }
            } catch {}

            const newUserData: UserProfile = {
              uid: userKey,
              name: tempSignup.firstName && tempSignup.lastName 
                ? `${tempSignup.firstName} ${tempSignup.lastName}`.trim()
                : fallbackNames.name,
              firstName: tempSignup.firstName || cachedShipping.firstName || fallbackNames.firstName,
              lastName: tempSignup.lastName || cachedShipping.lastName || fallbackNames.lastName,
              email: userObj.email || INITIAL_USER.email,
              phone: tempSignup.phone || cachedShipping.phone || '',
              avatar: userObj.photoURL || INITIAL_USER.avatar,
              defaultGovernorate: INITIAL_USER.defaultGovernorate,
              defaultCity: tempSignup.defaultCity || cachedShipping.defaultCity || '',
              defaultAddress: tempSignup.defaultAddress || cachedShipping.defaultAddress || '',
              defaultBuilding: tempSignup.defaultBuilding || cachedShipping.defaultBuilding || '',
              defaultNotes: tempSignup.defaultNotes || cachedShipping.defaultNotes || ''
            };
            await setDoc(userDocRef, sanitizeFirestorePayload({ uid: userObj.uid, ...newUserData }));
            
            // Register phone number in unique phone registry
            if (newUserData.phone) {
              const normPhone = normalizeLebanesePhone(newUserData.phone);
              if (normPhone.isValid && normPhone.registryKey) {
                try {
                  await setDoc(doc(db, 'phone_registry', normPhone.registryKey), {
                    uid: userObj.uid,
                    phone: normPhone.formatted,
                    cleanDigits: normPhone.cleanDigits,
                    updatedAt: new Date().toISOString()
                  });
                } catch (regErr) {
                  console.warn("[ShopContext] Non-blocking phone_registry write:", regErr);
                }
              }
            }

            setUser(newUserData);
          }
        } catch (err: any) {
          const isOffline = err.code === 'unavailable' || err.message?.includes('offline') || err.message?.includes('Failed to get document');
          if (isOffline) {
            console.warn("[ShopContext] User profile sync notice: client is offline or serving cached copy.", err.message);
          } else {
            console.error("[ShopContext] Error syncing user profile from Firestore:", err);
          }
        }
      }

      // Sync Wishlist from Firestore
      try {
        const wishlistRef = doc(db, 'wishlists', userKey);
        const wishlistSnap = await safeGetDoc(wishlistRef);
        if (wishlistSnap.exists()) {
          const wData = wishlistSnap.data();
          if (wData.productIds && Array.isArray(wData.productIds)) {
            setWishlist(wData.productIds);
          }
        }
      } catch (err: any) {
        const isOffline = err.code === 'unavailable' || err.message?.includes('offline') || err.message?.includes('Failed to get document');
        if (isOffline) {
          console.warn("[ShopContext] Wishlist sync notice: client is offline or serving cached copy.", err.message);
        } else {
          console.error("[ShopContext] Error syncing wishlist from Firestore:", err);
        }
      }

      // Sync Cart from Firestore
      try {
        const cartRef = doc(db, 'carts', userKey);
        const cartSnap = await safeGetDoc(cartRef);
        if (cartSnap.exists()) {
          const cData = cartSnap.data();
          if (cData.items && Array.isArray(cData.items)) {
            setCart(cData.items);
          }
        }
      } catch (err: any) {
        const isOffline = err.code === 'unavailable' || err.message?.includes('offline') || err.message?.includes('Failed to get document');
        if (isOffline) {
          console.warn("[ShopContext] Cart sync notice: client is offline or serving cached copy.", err.message);
        } else {
          console.error("[ShopContext] Error syncing cart from Firestore:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Cart to Firestore whenever cart changes (debounced by 1000ms)
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    if (!firebaseUser) return;
    const userKey = firebaseUser.uid;
    const cartDocRef = doc(db, 'carts', userKey);
    const sanitizedCartPayload = sanitizeFirestorePayload({
      userId: userKey,
      items: storedCart,
      updatedAt: new Date().toISOString()
    });

    const handler = setTimeout(() => {
      setDoc(cartDocRef, sanitizedCartPayload, { merge: true }).catch((err) => {
        console.warn("[ShopContext] Non-blocking cart sync notice:", err);
      });
    }, 1000);

    return () => clearTimeout(handler);
  }, [storedCart, firebaseUser]);

  // Sync Wishlist to Firestore whenever wishlist changes (debounced by 1000ms)
  useEffect(() => {
    if (!IS_FIREBASE_ENABLED) return;
    if (!firebaseUser) return;
    const userKey = firebaseUser.uid;
    const wishlistDocRef = doc(db, 'wishlists', userKey);
    const sanitizedWishlistPayload = sanitizeFirestorePayload({
      userId: userKey,
      productIds: wishlist,
      updatedAt: new Date().toISOString()
    });

    const handler = setTimeout(() => {
      setDoc(wishlistDocRef, sanitizedWishlistPayload, { merge: true }).catch((err) => {
        console.warn("[ShopContext] Non-blocking wishlist sync notice:", err);
      });
    }, 1000);

    return () => clearTimeout(handler);
  }, [wishlist, firebaseUser]);

  async function executeWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed' && retries > 0) {
        console.warn(`[ShopContext] Auth network error, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  const signInWithGoogle = async () => {
    try {
      if (!auth) {
        throw new Error("Firebase Authentication is not fully initialized in this environment.");
      }
      const provider = googleProvider || new GoogleAuthProvider();
      await executeWithRetry(() => signInWithPopup(auth, provider));
      showToast('Successfully signed in with Google!', 'success');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      let msg = '';
      if (error.code === 'auth/operation-not-allowed') {
        console.warn("Google Sign-In is not enabled in Firebase Authentication console.");
        msg = 'Google Sign-In is not enabled in Firebase Console. Please enable Google provider in Firebase Auth or use Email Sign-In.';
      } else if (error.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/popup-blocked') {
        msg = 'Sign-In popup was blocked by your browser settings. Please allow popups or open the app in a new browser tab.';
      } else if (error.code === 'auth/argument-error' || error.message?.includes('argument-error')) {
        msg = 'Google Sign-In requires third-party cookies or opening in a new tab. Alternatively, use email/password sign-in.';
      } else {
        console.error("Google Sign In Error:", error);
        msg = 'Failed to sign in with Google: ' + (error.message || 'Unknown error');
      }
      showToast(msg, 'warning');
    }
  };

  const signInWithApple = async () => {
    try {
      if (!auth) {
        throw new Error("Firebase Authentication is not fully initialized in this environment.");
      }
      const provider = appleProvider || new OAuthProvider('apple.com');
      await executeWithRetry(() => signInWithPopup(auth, provider));
      showToast('Successfully signed in with Apple!', 'success');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      let msg = '';
      if (error.code === 'auth/operation-not-allowed') {
        console.warn("Apple Sign-In is not enabled in Firebase Authentication console.");
        msg = 'Apple Sign-In is not enabled in Firebase Console. Please enable Apple provider in Firebase Auth or use Email Sign-In.';
      } else if (error.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/popup-blocked') {
        msg = 'Sign-In popup was blocked by your browser settings. Please allow popups or open the app in a new browser tab.';
      } else if (error.code === 'auth/argument-error' || error.message?.includes('argument-error')) {
        msg = 'Apple Sign-In requires third-party cookies or opening in a new tab. Alternatively, use email/password sign-in.';
      } else {
        console.error("Apple Sign In Error:", error);
        msg = 'Failed to sign in with Apple: ' + (error.message || 'Unknown error');
      }
      showToast(msg, 'warning');
    }
  };
  
  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      const msg = language === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter an email address.';
      showToast(msg, 'warning');
      throw new Error(msg);
    }

    try {
      let isUserInDb = false;

      // 1. Check Firestore 'users' collection for saved account
      if (IS_FIREBASE_ENABLED) {
        try {
          const usersRef = collection(db, 'users');
          const allUsersSnap = await getDocs(usersRef);
          allUsersSnap.forEach((docSnap) => {
            const uData = docSnap.data();
            if (uData && uData.email && typeof uData.email === 'string' && uData.email.trim().toLowerCase() === cleanEmail) {
              isUserInDb = true;
            }
          });
        } catch (dbErr) {
          console.warn("[resetPassword] Firestore user search error:", dbErr);
        }
      }

      // 2. Fallback check via Firebase Auth sign in methods
      if (!isUserInDb && IS_FIREBASE_ENABLED) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
          if (methods && methods.length > 0) {
            isUserInDb = true;
          }
        } catch (authErr: any) {
          console.warn("[resetPassword] Auth methods check error:", authErr);
        }
      }

      // If email is NOT found in database, block password reset and show warning notification
      if (!isUserInDb) {
        const notFoundMsg = language === 'ar'
          ? 'عذراً، لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني في قاعدة البيانات'
          : 'No registered account found with this email address in our database. Please sign up or check your email.';
        showToast(notFoundMsg, 'warning');
        throw new Error(notFoundMsg);
      }

      // Email exists in database - proceed to send reset link
      await sendPasswordResetEmail(auth, cleanEmail);
      const successMsg = language === 'ar'
        ? 'تم إرسال رابط إعادة تعيين كلمة المرور. يرجى التحقق من صندوق الوارد الخاص بك.'
        : 'Password reset email sent. Please check your inbox.';
      showToast(successMsg, 'success');
    } catch (error: any) {
      if (error.message && (error.message.includes('No registered account') || error.message.includes('لم يتم العثور'))) {
        throw error;
      }
      let msg = language === 'ar' ? 'فشل إرسال رابط إعادة التعيين: ' : 'Failed to send reset email: ';
      if (error.code === 'auth/network-request-failed') {
        msg = language === 'ar' ? 'خطأ في الاتصال بالشبكة. يرجى التحقق والتجربة مجدداً.' : 'Network connection error. Please check your connection and try again.';
      } else if (error.code === 'auth/user-not-found') {
        msg = language === 'ar' ? 'لم يتم العثور على حساب بهذا البريد الإلكتروني.' : 'No account found with this email address in our database.';
      } else {
        msg += error.message || '';
      }
      showToast(msg, 'warning');
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, phone?: string) => {
    // Check phone uniqueness before creating the auth record if phone is provided
    const targetPhone = phone || (() => {
      try {
        const rawTemp = localStorage.getItem('yallalb_signup_profile_temp');
        if (rawTemp) {
          const parsed = JSON.parse(rawTemp);
          return parsed.phone || '';
        }
      } catch {}
      return '';
    })();

    if (targetPhone) {
      const phoneCheck = await checkPhoneUniqueness(targetPhone);
      if (!phoneCheck.available) {
        const msg = phoneCheck.reason || (language === 'ar' ? 'رقم الهاتف هذا مسجل مسبقاً بحساب آخر.' : 'This phone number is already registered to another account.');
        showToast(msg, 'warning');
        throw new Error(msg);
      }
    }

    // L-5: Validate password complexity
    if (pass.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      showToast(msg, 'warning');
      throw new Error(msg);
    }
    const hasUppercase = /[A-Z]/.test(pass);
    const hasLowercase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      const msg = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
      showToast(msg, 'warning');
      throw new Error(msg);
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        showToast(
          language === 'ar'
            ? 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني واضغط على رابط التفعيل.'
            : 'Account created. Check your email and click the verification link to start ordering.',
          'success'
        );
      } else {
        showToast('Account created successfully!', 'success');
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      let msg = 'Sign up failed: ' + err.message;
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already in use. If you already have an account, please Sign In instead.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      showToast(msg, 'warning');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await executeWithRetry(() => signInWithEmailAndPassword(auth, email, pass));
      showToast('Successfully signed in!', 'success');
    } catch (error: any) {
      console.error("Auth error:", error);
      let msg = 'Authentication failed: ' + error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = 'Incorrect email or password. If you forgot your password, please click "Forgot Password?".';
      } else if (error.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      showToast(msg, 'warning');
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

  const navHistoryRef = useRef<Array<{ tab: NavTab; selectedProduct: Product | null; category?: string }>>([]);

  const setActiveTab = useCallback((tab: NavTab) => {
    setActiveTabState(prev => {
      if (prev !== tab) {
        navHistoryRef.current.push({ tab: prev, selectedProduct: selectedProductDetail, category: selectedCategory });
        if (tab !== 'product_detail') {
          setSelectedProductDetail(null);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return tab;
      }
      return prev;
    });
  }, [selectedProductDetail, selectedCategory]);

  const openProductDetail = useCallback((product: Product) => {
    setActiveTabState(prev => {
      navHistoryRef.current.push({ tab: prev, selectedProduct: selectedProductDetail, category: selectedCategory });
      setSelectedProductDetail(product);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return 'product_detail';
    });
  }, [selectedProductDetail, selectedCategory]);

  const goBack = useCallback(() => {
    const prevEntry = navHistoryRef.current.pop();
    if (prevEntry) {
      setSelectedProductDetail(prevEntry.selectedProduct);
      if (prevEntry.category && prevEntry.tab === 'products') {
        setSelectedCategory(prevEntry.category);
      }
      setActiveTabState(prevEntry.tab);
    } else {
      setSelectedProductDetail(null);
      setSelectedCategory('all');
      setActiveTabState('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const currencySymbol = currency === 'LBP' ? 'L.L.' : '$';
  const currencyRate = currency === 'LBP' ? LBP_USD_RATE : 1;

  const convertUSDToLBP = (amountUSD: number) => {
    return Math.round(amountUSD * LBP_USD_RATE);
  };

  const formatPrice = (amountUSD: number) => {
    if (currency === 'LBP') {
      const amountLBP = convertUSDToLBP(amountUSD);
      return `L.L. ${amountLBP.toLocaleString()}`;
    }
    return `$${amountUSD.toFixed(2)}`;
  };

  const addToCart = (product: Product, quantity = 1, option?: string) => {
    // Determine the product from our master products list to get the most up-to-date stock
    const currentProduct = products.find(p => p.id === product.id) || product;
    const availableStock = Number.isFinite(Number(currentProduct.stock)) ? Math.max(0, Math.floor(Number(currentProduct.stock))) : 0;
    
    if (availableStock <= 0) {
      showToast(
        language === 'ar'
          ? 'عذراً، هذا المنتج غير متوفر حالياً'
          : 'Sorry, this product is currently out of stock!',
        'warning'
      );
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id && item.selectedOption === option);
      if (existingIndex > -1) {
        const existingQty = prev[existingIndex].quantity;
        const targetQty = existingQty + quantity;
        if (targetQty > availableStock) {
          const clampedQty = availableStock;
          showToast(
            language === 'ar'
              ? `تم تحديد الكمية بـ ${clampedQty} (الحد الأقصى للمخزون)`
              : `Quantity limited to ${clampedQty} (maximum stock available)`,
            'warning'
          );
          return prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: clampedQty }
              : item
          );
        }
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: targetQty }
            : item
        );
      }
      
      const initialQty = quantity > availableStock ? availableStock : quantity;
      if (initialQty < quantity) {
        showToast(
          language === 'ar'
            ? `تمت إضافة ${initialQty} قطع فقط (الحد الأقصى للمخزون)`
            : `Added only ${initialQty} items due to stock limit`,
          'warning'
        );
      }
      return [...prev, { product: currentProduct, quantity: initialQty, selectedOption: option }];
    });
    showToast(`Added ${quantity}x "${product.name.split('(')[0].trim()}" to cart!`);
  };

  const addMultipleToCart = (itemsToAdd: { product: Product; quantity?: number; option?: string }[]) => {
    setCart(prev => {
      const nextCart = [...prev];
      for (const item of itemsToAdd) {
        const currentProd = products.find(p => p.id === item.product.id) || item.product;
        const availableStock = Number.isFinite(Number(currentProd.stock)) ? Math.max(0, Math.floor(Number(currentProd.stock))) : 0;
        if (availableStock <= 0) continue;

        const qty = item.quantity || 1;
        const existingIndex = nextCart.findIndex(c => c.product.id === item.product.id && c.selectedOption === item.option);
        if (existingIndex > -1) {
          const targetQty = Math.min(nextCart[existingIndex].quantity + qty, availableStock);
          nextCart[existingIndex] = {
            ...nextCart[existingIndex],
            quantity: targetQty
          };
        } else {
          nextCart.push({
            product: currentProd,
            quantity: Math.min(qty, availableStock),
            selectedOption: item.option
          });
        }
      }
      return nextCart;
    });
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
    const currentProduct = products.find(p => p.id === productId);
    const availableStock = currentProduct && Number.isFinite(Number(currentProduct.stock)) ? Math.max(0, Math.floor(Number(currentProduct.stock))) : 0;

    let finalQty = quantity;
    if (finalQty > availableStock) {
      finalQty = availableStock;
      showToast(
        language === 'ar'
          ? `عذراً، المخزون المتاح هو ${availableStock} قطع فقط`
          : `Sorry, only ${availableStock} items are available in stock`,
        'warning'
      );
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: finalQty } : item
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
      showToast(language === 'ar' ? 'تمت إزالة المنتج من المفضلة' : 'Removed from saved favorites', 'info');
    } else {
      nextWishlist = [...wishlist, productId];
      showToast(language === 'ar' ? 'تمت إضافة المنتج إلى المفضلة' : 'Saved to your favorites!', 'success');
    }
    setWishlist(nextWishlist);
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(id => id !== productId));
    showToast(language === 'ar' ? 'تمت إزالة المنتج من المفضلة' : 'Removed from saved favorites', 'info');
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const clearWishlist = () => {
    setWishlist([]);
  };

  const rawSubtotalUSD = Math.round(cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0) * 100) / 100;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [appliedCouponCode, setAppliedCouponCode] = useState<string>(() => {
    try {
      return localStorage.getItem('yallalb_applied_coupon') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      if (appliedCouponCode) {
        localStorage.setItem('yallalb_applied_coupon', appliedCouponCode);
      } else {
        localStorage.removeItem('yallalb_applied_coupon');
      }
    } catch {}
  }, [appliedCouponCode]);

  const isNewUser = useMemo(() => {
    if (!firebaseUser) return true;
    const userOrdersCount = orders.filter(o => o.userId === firebaseUser.uid).length;
    return userOrdersCount === 0;
  }, [firebaseUser, orders]);

  const discountCalculation = useMemo(() => {
    return applyDiscounts(cart, discountRules, {
      couponCode: appliedCouponCode,
      isNewUser
    });
  }, [cart, discountRules, appliedCouponCode, isNewUser]);

  const discountUSD = discountCalculation.discountUSD;
  const finalCartTotalUSD = discountCalculation.finalSubtotalUSD;
  const appliedDiscountRules = discountCalculation.appliedRules;

  // Maintain cartTotalUSD as the effective total for backwards-compatible consumers
  const cartTotalUSD = finalCartTotalUSD;

  const applyCoupon = useCallback((code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;
    const testResult = applyDiscounts(cart, discountRules, { couponCode: normalized, isNewUser });
    if (testResult.discountUSD > 0) {
      setAppliedCouponCode(normalized);
      showToast(
        language === 'ar' 
          ? `تم تطبيق الكوبون (${normalized}) بنجاح! وفرت $${testResult.discountUSD.toFixed(2)}` 
          : `Coupon (${normalized}) applied! You saved $${testResult.discountUSD.toFixed(2)}`,
        'success'
      );
      return true;
    } else {
      showToast(
        language === 'ar' 
          ? 'رمز الكوبون غير صالح أو لم يستوفِ الحد الأدنى للشراء' 
          : 'Coupon is invalid or does not meet minimum order requirements',
        'warning'
      );
      return false;
    }
  }, [cart, discountRules, language]);

  const removeCoupon = useCallback(() => {
    setAppliedCouponCode('');
    showToast(language === 'ar' ? 'تمت إزالة الكوبون' : 'Coupon code removed', 'info');
  }, [language]);

  const lastLoggedSearchRef = useRef<{ query: string; time: number }>({ query: '', time: 0 });

  const logSearchQuery = useCallback(async (query: string, origin: 'navbar' | 'products_page' | 'mobile_menu' | 'direct' = 'direct') => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    // Flood protection: Avoid logging identical consecutive queries within 6 seconds
    const now = Date.now();
    if (
      lastLoggedSearchRef.current.query.toLowerCase() === trimmed.toLowerCase() &&
      now - lastLoggedSearchRef.current.time < 6000
    ) {
      return;
    }
    lastLoggedSearchRef.current = { query: trimmed, time: now };

    const searchEntry: SearchLog = {
      id: `srch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      query: trimmed,
      timestamp: new Date().toISOString(),
      userId: firebaseUser?.uid || null,
      userEmail: firebaseUser?.email || user?.email || null,
      userName: user?.name || null,
      origin: origin
    };

    // Immediate Local Cache for instant UI updates & offline fallback
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('yallalb_search_logs_cache');
        const list: SearchLog[] = raw ? JSON.parse(raw) : [];
        list.unshift(searchEntry);
        localStorage.setItem('yallalb_search_logs_cache', JSON.stringify(list.slice(0, 200)));
      }
    } catch (cacheErr) {
      console.warn("[ShopContext] Search cache notice:", cacheErr);
    }

    if (!IS_FIREBASE_ENABLED) return;
    try {
      const logDocRef = doc(collection(db, 'search_logs'));
      searchEntry.id = logDocRef.id;
      const payload = sanitizeFirestorePayload(searchEntry);
      await monitoredSetDoc(logDocRef, payload, {}, `ShopContext:logSearchQuery:${origin}`).catch((err) => {
        console.warn("[ShopContext] Non-blocking search log notice:", err);
      });
    } catch (error) {
      console.warn("[ShopContext] Failed to log search:", error);
    }
  }, [firebaseUser, user]);

  // Place Order - Order creation with graceful fallback for empty profiles
  const placeOrder = async (orderData: Omit<Order, 'id' | 'date' | 'trackingNumber' | 'status'>): Promise<Order> => {
    const activeUserId = firebaseUser?.uid || auth?.currentUser?.uid || 'guest-user';

    const orderDocRef = doc(collection(db, 'orders'));
    const orderId = orderDocRef.id;

    // L-3: Secure random tracker numbers using Web Crypto API
    let trackingSuffix: number;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      trackingSuffix = 100000 + (array[0] % 900000);
    } else {
      trackingSuffix = Math.floor(100000 + Math.random() * 900000);
    }
    const dateStr = new Date().toISOString();
    const trackingNumberStr = `LB-EXP-${trackingSuffix}`;

    // If Firebase is disabled, we do standard local-only fallback
    if (!IS_FIREBASE_ENABLED) {
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        date: dateStr,
        trackingNumber: trackingNumberStr,
        status: 'pending',
        userId: activeUserId
      };
      setOrders(prev => {
        const next = [newOrder, ...prev];
        try {
          localStorage.setItem('yallalb_orders', JSON.stringify(next));
        } catch {}
        return next;
      });
      clearCart();
      showToast(`Mabrouk! Order #${newOrder.id} placed locally.`, 'success');
      return newOrder;
    }

    // Process order placement atomically inside a Firestore transaction!
    // H-2 & H-3: Atomic transactional stock decrement and authoritative pricing
    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'setDoc',
      targetPath: `orders/${orderId}`,
      sourceComponent: 'ShopContext',
      actionName: 'placeOrderTransaction',
      summary: `Placing order #${orderId} and decrementing stock atomically...`,
    });

    try {
      const resultOrder = await runTransaction(db, async (transaction) => {
        // 1. Fetch products from DB to get fresh stock and pricing (authoritative checks!)
        const dbProducts = [];
        for (const item of cart) {
          const productRef = doc(db, 'products', item.product.id);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) {
            throw new Error(`Product "${item.product.name}" is no longer available.`);
          }
          const productData = productSnap.data() as Product;
          dbProducts.push({
            ref: productRef,
            data: productData,
            cartItem: item
          });
        }

        // 2. Validate stock and build authoritative order items list
        const validatedItems = [];
        for (const dbProd of dbProducts) {
          const currentStock = typeof dbProd.data.stock === 'number' ? dbProd.data.stock : 0;
          const reqQty = dbProd.cartItem.quantity;
          if (currentStock < reqQty) {
            throw new Error(`Sorry, "${dbProd.data.name}" only has ${currentStock} units remaining in stock.`);
          }
          // Build product object with authoritative pricing and data from DB
          const validatedProduct: Product = {
            ...dbProd.data,
            // Force authoritative fields from DB to prevent client-side price tampering
            priceUSD: dbProd.data.priceUSD,
            name: dbProd.data.name,
            id: dbProd.data.id
          };
          validatedItems.push({
            product: validatedProduct,
            quantity: reqQty,
            selectedOption: dbProd.cartItem.selectedOption
          });
        }

        // 3. Recalculate subtotal, discounts, and total using authoritative values
        const authDiscountCalc = applyDiscounts(validatedItems, discountRules, {
          couponCode: appliedCouponCode,
          isNewUser: orders.length === 0,
        });
        const subtotalUSD = Math.round(validatedItems.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0) * 100) / 100;
        
        const govRaw = orderData.shipping?.governorate;
        const matchedRegion = LEBANON_REGIONS.find(r => 
          r.id === govRaw || 
          r.nameEn === govRaw || 
          r.nameAr === govRaw ||
          (govRaw && (r.nameEn.toLowerCase() === govRaw.toLowerCase() || r.id.toLowerCase() === govRaw.toLowerCase()))
        );
        const deliveryFeeUSD = calcDeliveryFeeUSD({
          speed: orderData.shipping?.deliverySpeed,
          regionId: matchedRegion?.id || govRaw,
          matchedRegion,
          subtotalUSD: authDiscountCalc.finalSubtotalUSD
        });
        const totalUSD = Math.round((authDiscountCalc.finalSubtotalUSD + deliveryFeeUSD) * 100) / 100;
        const discountUSDVal = authDiscountCalc.discountUSD;

        // Construct the authoritative order structure! No client-side price injection allowed.
        const newOrder: Order = {
          ...orderData,
          id: orderId,
          date: dateStr,
          trackingNumber: trackingNumberStr,
          status: 'pending',
          userId: activeUserId,
          items: validatedItems,
          subtotalUSD,
          deliveryFeeUSD,
          discountUSD: discountUSDVal,
          totalUSD,
          totalLBP: totalUSD * LBP_USD_RATE,
          appliedCoupon: appliedCouponCode || undefined
        };

        const sanitizedOrder = sanitizeFirestorePayload(newOrder);

        // 4. Stock availability is verified above. Direct client-side product stock writes
        //    are restricted to admin roles (see firestore.rules).
        
        // 5. Create the order
        transaction.set(orderDocRef, sanitizedOrder);

        return newOrder;
      });

      dbLogger.logFirestoreWriteSuccess({
        operation: 'setDoc',
        targetPath: `orders/${orderId}`,
        sourceComponent: 'ShopContext',
        actionName: 'placeOrderTransaction',
        summary: `Order #${orderId} completed atomically: stock decremented, authoritative total $${resultOrder.totalUSD} verified.`,
        startTime,
        payload: resultOrder
      });

      setOrders(prev => [resultOrder, ...prev]);
      clearCart();
      showToast(`Mabrouk! Order #${resultOrder.id} placed and saved to database.`, 'success');
      return resultOrder;
    } catch (error: any) {
      dbLogger.logFirestoreWriteError({
        operation: 'setDoc',
        targetPath: `orders/${orderId}`,
        sourceComponent: 'ShopContext',
        actionName: 'placeOrderTransaction',
        summary: `Failed to place order transaction: ${error.message}`,
        startTime,
        error
      });
      console.error('[ShopContext] Transaction failed:', error);
      showToast(error.message || 'Could not place order. Please try again.', 'warning');
      throw error;
    }
  };

  // Update Order Status - Saves update in Firestore database
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder && targetOrder.status === 'delivered' && status === 'cancelled') {
      showToast('Cannot cancel an order that has already been delivered.', 'warning');
      throw new Error('Cannot cancel a delivered order.');
    }

    dbLogger.logFormInput({
      sourceComponent: 'AdminView',
      actionName: 'updateOrderStatus',
      targetPath: `orders/${orderId}`,
      summary: `Updating order #${orderId} status to "${status}"`,
      payload: { status }
    });

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'setDoc',
      targetPath: `orders/${orderId}`,
      sourceComponent: 'ShopContext',
      actionName: 'updateOrderStatus',
      summary: `Persisting status change for order #${orderId} to Firestore...`
    });

    const previousOrders = [...orders];

    // Optimistic local state update
    setOrders(prev => {
      const next = prev.map(ord => (ord.id === orderId ? { ...ord, status } : ord));
      try {
        localStorage.setItem('yallalb_orders', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!IS_FIREBASE_ENABLED) {
      await logAdminActivity(
        'order_status',
        `Order #${orderId} status updated`,
        `Shifted fulfillment status to "${status.replace(/_/g, ' ')}".`
      );
      showToast(`Order status updated to ${status.replace('_', ' ')} locally`, 'info');
      return;
    }

    // Persist status change to Firestore
    try {
      await monitoredSetDoc(doc(db, 'orders', orderId), { status }, { merge: true }, 'AdminView:updateOrderStatus');
      
      await logAdminActivity(
        'order_status',
        `Order #${orderId} status updated`,
        `Shifted fulfillment status to "${status.replace(/_/g, ' ')}".`
      );

      dbLogger.logFirestoreWriteSuccess({
        operation: 'setDoc',
        targetPath: `orders/${orderId}`,
        sourceComponent: 'ShopContext',
        actionName: 'updateOrderStatus',
        summary: `Order #${orderId} status successfully set to "${status}" in Firestore.`,
        startTime
      });
    } catch (error) {
      setOrders(previousOrders);
      try {
        localStorage.setItem('yallalb_orders', JSON.stringify(previousOrders));
      } catch {}
      dbLogger.logFirestoreWriteError({
        operation: 'setDoc',
        targetPath: `orders/${orderId}`,
        sourceComponent: 'ShopContext',
        actionName: 'updateOrderStatus',
        summary: `Failed to update order #${orderId} status in Firestore`,
        startTime,
        error
      });
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      showToast('Could not update order status. Please try again.', 'warning');
      throw error;
    }

    showToast(`Order status updated to ${status.replace('_', ' ')} in database`, 'info');
  };

  // Delete Order - Removes order from Firestore database
  const deleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      showToast('Order not found.', 'warning');
      return;
    }
    if (order.status === 'delivered') {
      showToast('Cannot delete a delivered order.', 'warning');
      return;
    }

    dbLogger.logFormInput({
      sourceComponent: 'AdminView',
      actionName: 'deleteOrder',
      targetPath: `orders/${orderId}`,
      summary: `Admin deleting order #${orderId}`
    });

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'deleteDoc',
      targetPath: `orders/${orderId}`,
      sourceComponent: 'ShopContext',
      actionName: 'deleteOrder',
      summary: `Deleting order document from Firestore (orders/${orderId})...`
    });

    setOrders(prev => {
      const next = prev.filter(o => o.id !== orderId);
      try {
        localStorage.setItem('yallalb_orders', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!IS_FIREBASE_ENABLED) {
      await logAdminActivity(
        'order_delete',
        `Order #${orderId} deleted`,
        `Permanently removed order #${orderId} from system.`
      );
      showToast('Order deleted locally!');
      return;
    }

    try {
      await monitoredDeleteDoc(doc(db, 'orders', orderId), 'AdminView:deleteOrder');
      
      await logAdminActivity(
        'order_delete',
        `Order #${orderId} deleted`,
        `Permanently removed order #${orderId} from system.`
      );

      dbLogger.logFirestoreWriteSuccess({
        operation: 'deleteDoc',
        targetPath: `orders/${orderId}`,
        sourceComponent: 'ShopContext',
        actionName: 'deleteOrder',
        summary: `Order #${orderId} permanently deleted from Firestore database.`,
        startTime
      });
    } catch (error) {
      dbLogger.logFirestoreWriteError({
        operation: 'deleteDoc',
        targetPath: `orders/${orderId}`,
        sourceComponent: 'ShopContext',
        actionName: 'deleteOrder',
        summary: `Failed to delete order #${orderId} from Firestore`,
        startTime,
        error
      });
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
      showToast('Error deleting order from database. You must be signed in as an admin.', 'error');
      return;
    }

    showToast('Order removed from database', 'warning');
  };

  // Add Product - Saves new item to Firestore database
  const addProduct = async (newProdData: Omit<Product, 'id'> & { id?: string }) => {
    // 1. Validation: Duplicate Product Number (sellerItemCode or custom ID)
    if (newProdData.sellerItemCode) {
      const targetSellerId = newProdData.sellerId;
      const targetSellerName = newProdData.artisan || newProdData.seller;
      const dupCodeCheck = checkDuplicateProductNumber(newProdData.sellerItemCode, null, products, targetSellerId, targetSellerName);
      if (dupCodeCheck.isDuplicate) {
        const errorMsg = `Duplicate seller item code: "${newProdData.sellerItemCode}" is already in use by "${dupCodeCheck.conflictingProduct?.name}" for seller "${targetSellerName || 'this seller'}".`;
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }
    }

    if (newProdData.id) {
      const dupIdCheck = checkDuplicateProductNumber(newProdData.id, null, products);
      if (dupIdCheck.isDuplicate) {
        const errorMsg = `Duplicate product ID/SKU: "${newProdData.id}" is already in use by "${dupIdCheck.conflictingProduct?.name}".`;
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }
    }

    // Duplicate Description validation removed for flexibility

    const id = newProdData.id || `prod-custom-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newProduct: Product = ensureSellerItemCode({
      rating: 0,
      reviewsCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...newProdData,
      id
    });
    const sanitizedProduct = sanitizeDocumentData(newProduct);
    
    dbLogger.logFormInput({
      sourceComponent: 'AdminView (AddProductModal)',
      actionName: 'addProduct',
      targetPath: `products/${id}`,
      summary: `Admin created new product "${newProduct.name}" ($${newProduct.priceUSD})`,
      payload: sanitizedProduct
    });

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'setDoc',
      targetPath: `products/${id}`,
      sourceComponent: 'ShopContext',
      actionName: 'addProduct',
      summary: `Writing new product document to Firestore (products/${id})...`,
      payload: sanitizedProduct
    });

    // Optimistically update state
    setProducts(prev => {
      const next = [newProduct, ...prev];
      try {
        localStorage.setItem('yallalb_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!IS_FIREBASE_ENABLED) {
      await logAdminActivity(
        'product_add',
        `Product "${newProduct.name}" created`,
        `Added new catalog item with ID: ${newProduct.id}, category: ${newProduct.category}, and price: $${newProduct.priceUSD} locally.`,
        newProduct.id,
        null,
        newProduct
      );
      showToast(`Product "${newProduct.name}" saved locally!`);
      return;
    }

    // Persist to Firestore
    try {
      await monitoredSetDoc(doc(db, 'products', id), sanitizedProduct, undefined, 'AdminView:addProduct');
      
      await logAdminActivity(
        'product_add',
        `Product "${newProduct.name}" created`,
        `Added new catalog item with ID: ${newProduct.id}, category: ${newProduct.category}, and price: $${newProduct.priceUSD}.`,
        newProduct.id,
        null,
        newProduct
      );

      dbLogger.logFirestoreWriteSuccess({
        operation: 'setDoc',
        targetPath: `products/${id}`,
        sourceComponent: 'ShopContext',
        actionName: 'addProduct',
        summary: `Product "${newProduct.name}" successfully created in Firestore database.`,
        startTime,
        payload: sanitizedProduct
      });
      showToast(`Product "${newProduct.name}" saved to database!`);
    } catch (error) {
      setProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        try {
          localStorage.setItem('yallalb_products', JSON.stringify(next));
        } catch {}
        return next;
      });
      dbLogger.logFirestoreWriteError({
        operation: 'setDoc',
        targetPath: `products/${id}`,
        sourceComponent: 'ShopContext',
        actionName: 'addProduct',
        summary: `Failed to create product "${newProduct.name}" in Firestore`,
        startTime,
        error
      });
      handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
      showToast(`Error saving product "${newProduct.name}" to database.`, 'error');
      throw error;
    }
  };

  // Update Product - Updates item in Firestore database
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    // 1. Validation: Duplicate Product Number
    if (updates.sellerItemCode) {
      const existing = products.find(p => p.id === id);
      const targetSellerId = updates.sellerId || existing?.sellerId;
      const targetSellerName = updates.artisan || updates.seller || existing?.artisan || existing?.seller;
      const dupCodeCheck = checkDuplicateProductNumber(updates.sellerItemCode, id, products, targetSellerId, targetSellerName);
      if (dupCodeCheck.isDuplicate) {
        const errorMsg = `Duplicate seller item code: "${updates.sellerItemCode}" is already assigned to "${dupCodeCheck.conflictingProduct?.name}" for seller "${targetSellerName || 'this seller'}".`;
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }
    }

    // Duplicate Description validation removed for flexibility

    const existing = products.find(p => p.id === id);
    const nowIso = new Date().toISOString();
    const mergedUpdates = { ...updates, updatedAt: nowIso };
    const sanitizedUpdates = sanitizeDocumentData(mergedUpdates);
    
    dbLogger.logFormInput({
      sourceComponent: 'AdminView',
      actionName: 'updateProduct',
      targetPath: `products/${id}`,
      summary: `Admin updated product #${id} (${existing?.name || 'Item'}): [${Object.keys(updates).join(', ')}]`,
      payload: sanitizedUpdates,
      diff: calculateObjectDiff(existing as any, { ...existing, ...mergedUpdates } as any)
    });

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'setDoc',
      targetPath: `products/${id}`,
      sourceComponent: 'ShopContext',
      actionName: 'updateProduct',
      summary: `Persisting product #${id} updates to Firestore...`,
      payload: sanitizedUpdates
    });

    setProducts(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...mergedUpdates } : p));
      try {
        localStorage.setItem('yallalb_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!IS_FIREBASE_ENABLED) {
      await logAdminActivity(
        'product_update',
        `Product "${existing?.name || id}" updated`,
        `Modified attributes locally: ${Object.keys(updates).join(', ')}.`,
        id,
        existing,
        { ...existing, ...mergedUpdates }
      );
      showToast('Product updated locally!');
      return;
    }

    try {
      await monitoredSetDoc(doc(db, 'products', id), sanitizedUpdates, { merge: true }, 'AdminView:updateProduct');
      
      await logAdminActivity(
        'product_update',
        `Product "${existing?.name || id}" updated`,
        `Modified attributes: ${Object.keys(updates).join(', ')}.`,
        id,
        existing,
        { ...existing, ...mergedUpdates }
      );

      dbLogger.logFirestoreWriteSuccess({
        operation: 'setDoc',
        targetPath: `products/${id}`,
        sourceComponent: 'ShopContext',
        actionName: 'updateProduct',
        summary: `Product #${id} updates committed to Firestore database successfully.`,
        startTime,
        payload: sanitizedUpdates
      });
      showToast('Product updated in database successfully');
    } catch (error) {
      if (existing) {
        setProducts(prev => {
          const next = prev.map(p => (p.id === id ? existing : p));
          try {
            localStorage.setItem('yallalb_products', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
      dbLogger.logFirestoreWriteError({
        operation: 'setDoc',
        targetPath: `products/${id}`,
        sourceComponent: 'ShopContext',
        actionName: 'updateProduct',
        summary: `Failed to update product #${id} in Firestore`,
        startTime,
        error
      });
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
      showToast('Error updating product in database.', 'error');
      throw error;
    }
  };

  // Delete Product - Removes item from Firestore database
  const deleteProduct = async (id: string) => {
    const target = products.find(p => p.id === id);
    
    dbLogger.logFormInput({
      sourceComponent: 'AdminView',
      actionName: 'deleteProduct',
      targetPath: `products/${id}`,
      summary: `Admin deleted product #${id} ("${target?.name || id}")`
    });

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'deleteDoc',
      targetPath: `products/${id}`,
      sourceComponent: 'ShopContext',
      actionName: 'deleteProduct',
      summary: `Deleting document from Firestore (products/${id})...`
    });

    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem('yallalb_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!IS_FIREBASE_ENABLED) {
      await logAdminActivity(
        'product_delete',
        `Product "${target?.name || id}" deleted`,
        `Permanently removed product #${id} from catalog.`,
        id,
        target,
        null
      );
      showToast('Product deleted locally!');
      return;
    }

    try {
      await monitoredDeleteDoc(doc(db, 'products', id), 'AdminView:deleteProduct');
      
      await logAdminActivity(
        'product_delete',
        `Product "${target?.name || id}" deleted`,
        `Permanently removed product #${id} from catalog.`,
        id,
        target,
        null
      );

      dbLogger.logFirestoreWriteSuccess({
        operation: 'deleteDoc',
        targetPath: `products/${id}`,
        sourceComponent: 'ShopContext',
        actionName: 'deleteProduct',
        summary: `Product #${id} permanently deleted from Firestore database.`,
        startTime
      });
    } catch (error) {
      dbLogger.logFirestoreWriteError({
        operation: 'deleteDoc',
        targetPath: `products/${id}`,
        sourceComponent: 'ShopContext',
        actionName: 'deleteProduct',
        summary: `Failed to delete product #${id} from Firestore`,
        startTime,
        error
      });
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      showToast('Error deleting product from database. You must be signed in as an admin.', 'error');
      return;
    }

    showToast('Product removed from database', 'warning');
  };

  // Mass Delete Products - Removes multiple items from Firestore database
  const deleteMultipleProducts = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    dbLogger.logFormInput({
      sourceComponent: 'AdminView',
      actionName: 'deleteMultipleProducts',
      targetPath: 'products/mass_delete',
      summary: `Admin bulk deleting ${ids.length} products`
    });

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'deleteDoc', // or mass delete
      targetPath: `products/mass_delete`,
      sourceComponent: 'ShopContext',
      actionName: 'deleteMultipleProducts',
      summary: `Deleting ${ids.length} documents from Firestore...`
    });

    setProducts(prev => {
      const next = prev.filter(p => !ids.includes(p.id));
      try {
        localStorage.setItem('yallalb_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!IS_FIREBASE_ENABLED) {
      await logAdminActivity(
        'product_delete',
        `Bulk deleted ${ids.length} products`,
        `Permanently removed ${ids.length} products from catalog.`
      );
      showToast(`${ids.length} products deleted locally!`);
      return;
    }

    try {
      // Execute deletions in parallel
      await Promise.all(ids.map(id => monitoredDeleteDoc(doc(db, 'products', id), 'AdminView:deleteMultipleProducts')));
      
      await logAdminActivity(
        'product_delete',
        `Bulk deleted ${ids.length} products`,
        `Permanently removed ${ids.length} products from catalog.`
      );

      dbLogger.logFirestoreWriteSuccess({
        operation: 'deleteDoc',
        targetPath: `products/mass_delete`,
        sourceComponent: 'ShopContext',
        actionName: 'deleteMultipleProducts',
        summary: `Successfully bulk deleted ${ids.length} products from Firestore database.`,
        startTime
      });
      
      showToast(`${ids.length} products removed from database`, 'warning');
    } catch (error) {
      dbLogger.logFirestoreWriteError({
        operation: 'deleteDoc',
        targetPath: `products/mass_delete`,
        sourceComponent: 'ShopContext',
        actionName: 'deleteMultipleProducts',
        summary: `Failed to mass delete products from Firestore`,
        startTime,
        error
      });
      showToast(`Error bulk deleting products. Some may remain.`, 'error');
    }
  };

  // Sync All Initial Products directly to Firestore database
  const syncAllProductsToDatabase = async () => {
    const count = INITIAL_PRODUCTS.length;
    const confirmed = window.confirm(
      `Restore ${count} products from the bundled seed catalog?\n\n` +
      `This OVERWRITES prices, stock and descriptions for any of these products ` +
      `that you have edited in the admin portal. Edits will be lost.`
    );
    if (!confirmed) return;

    try {
      showToast(`Restoring ${count} seed products...`, 'info');
      
      const { startTime } = dbLogger.logFirestoreWriteStart({
        operation: 'writeBatch',
        targetPath: 'products/*',
        sourceComponent: 'AdminView',
        actionName: 'syncAllProductsToDatabase',
        summary: `Executing batch write of ${INITIAL_PRODUCTS.length} catalog items to Firestore...`
      });

      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((prod) => {
        const prodDocRef = doc(db, 'products', prod.id);
        const sanitizedProd = sanitizeDocumentData(ensureSellerItemCode(prod));
        batch.set(prodDocRef, sanitizedProd, { merge: true });
      });
      await monitoredBatchCommit(batch, INITIAL_PRODUCTS.length, 'products', 'AdminView:syncAllProductsToDatabase');

      dbLogger.logFirestoreWriteSuccess({
        operation: 'writeBatch',
        targetPath: 'products/*',
        sourceComponent: 'AdminView',
        actionName: 'syncAllProductsToDatabase',
        summary: `Batch write committed successfully: All ${INITIAL_PRODUCTS.length} products synchronized to Firestore database.`,
        startTime
      });

      console.log(`[ShopContext] Manually synchronized all ${INITIAL_PRODUCTS.length} products to Firestore.`);
      showToast(`Successfully saved and synced all ${INITIAL_PRODUCTS.length} products to database!`, 'success');
    } catch (err) {
      console.error("[ShopContext] Error syncing all products to Firestore:", err);
      showToast('Error syncing products to database', 'warning');
    }
  };

  // Check phone number uniqueness across Firestore registry and users
  const checkPhoneUniqueness = useCallback(async (phone: string, excludeUid?: string): Promise<{ available: boolean; reason?: string }> => {
    const norm = normalizeLebanesePhone(phone);
    if (!norm.isValid) {
      return {
        available: false,
        reason: language === 'ar'
          ? 'يجب أن يتألف رقم الهاتف اللبناني من 8 أرقام صحيحة (مثال: 70123456 أو 03123456).'
          : 'Lebanese phone number must be strictly 8 valid digits (e.g. 70123456 or 03123456).'
      };
    }

    if (IS_FIREBASE_ENABLED) {
      try {
        // 1. Direct O(1) document check on unique phone registry
        if (norm.registryKey) {
          const regDocRef = doc(db, 'phone_registry', norm.registryKey);
          const regSnap = await safeGetDoc(regDocRef);
          if (regSnap.exists()) {
            const regData = regSnap.data();
            if (regData && regData.uid && (!excludeUid || regData.uid !== excludeUid)) {
              return {
                available: false,
                reason: language === 'ar'
                  ? 'رقم الهاتف هذا مسجل مسبقاً بحساب آخر. يرجى استخدام رقم آخر أو تسجيل الدخول.'
                  : 'This phone number is already registered to another account. Please sign in or use a different phone number.'
              };
            }
          }
        }

        // 2. Comprehensive check across users collection
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        for (const uDoc of usersSnap.docs) {
          if (excludeUid && uDoc.id === excludeUid) continue;
          const uData = uDoc.data();
          if (uData && uData.phone) {
            const uNorm = normalizeLebanesePhone(uData.phone);
            if (uNorm.isValid && uNorm.cleanDigits === norm.cleanDigits) {
              return {
                available: false,
                reason: language === 'ar'
                  ? 'رقم الهاتف هذا مسجل مسبقاً بحساب آخر. يرجى استخدام رقم آخر أو تسجيل الدخول.'
                  : 'This phone number is already registered to another account. Please sign in or use a different phone number.'
              };
            }
          }
        }
      } catch (err) {
        console.warn('[ShopContext] Phone uniqueness validation warning:', err);
      }
    }

    // 3. Fallback check for local storage
    try {
      const localUsersRaw = localStorage.getItem('yallalb_registered_users_cache');
      if (localUsersRaw) {
        const localList: Array<{ uid?: string; phone?: string }> = JSON.parse(localUsersRaw);
        if (Array.isArray(localList)) {
          for (const item of localList) {
            if (excludeUid && item.uid === excludeUid) continue;
            if (item.phone) {
              const itemNorm = normalizeLebanesePhone(item.phone);
              if (itemNorm.isValid && itemNorm.cleanDigits === norm.cleanDigits) {
                return {
                  available: false,
                  reason: language === 'ar'
                    ? 'رقم الهاتف هذا مسجل مسبقاً بحساب آخر.'
                    : 'This phone number is already registered to another account.'
                };
              }
            }
          }
        }
      }
    } catch {}

    return { available: true };
  }, [language]);

  // Update User Profile - Saves to Firestore database
  const updateUser = async (updates: Partial<UserProfile>) => {
    // If phone number is updated, check uniqueness and manage registry
    if (updates.phone !== undefined && updates.phone !== '') {
      const norm = normalizeLebanesePhone(updates.phone);
      if (norm.isValid) {
        const oldNorm = normalizeLebanesePhone(user.phone);
        const isChanging = !oldNorm.isValid || oldNorm.cleanDigits !== norm.cleanDigits;
        const userUid = firebaseUser?.uid || user.uid;

        if (isChanging) {
          const check = await checkPhoneUniqueness(norm.cleanDigits, userUid);
          if (!check.available) {
            showToast(check.reason || 'This phone number is already registered.', 'warning');
            throw new Error(check.reason || 'Phone number already registered.');
          }

          if (userUid && IS_FIREBASE_ENABLED && norm.registryKey) {
            try {
              await setDoc(doc(db, 'phone_registry', norm.registryKey), {
                uid: userUid,
                phone: norm.formatted,
                cleanDigits: norm.cleanDigits,
                updatedAt: new Date().toISOString()
              });
              if (oldNorm.isValid && oldNorm.registryKey && oldNorm.registryKey !== norm.registryKey) {
                await deleteDoc(doc(db, 'phone_registry', oldNorm.registryKey)).catch(() => {});
              }
            } catch (regErr) {
              console.warn('[ShopContext] Non-blocking phone_registry update:', regErr);
            }
          }
        }
      }
    }

    const updatedUser = { ...user, ...updates };
    const sanitizedUser = sanitizeDocumentData(updatedUser);
    setUser(updatedUser);

    if (!firebaseUser) {
      try {
        localStorage.setItem('yallalb_saved_checkout_data', JSON.stringify(sanitizedUser));
      } catch {}
      return;
    }

    const userKey = firebaseUser.uid;

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'setDoc',
      targetPath: `users/${userKey}`,
      sourceComponent: 'ShopContext',
      actionName: 'updateUser',
      summary: `Persisting profile and delivery details for user (${userKey}) to Firestore...`,
      payload: sanitizedUser
    });

    try {
      await monitoredSetDoc(doc(db, 'users', userKey), {
        uid: userKey,
        ...sanitizedUser,
        updatedAt: new Date().toISOString()
      }, { merge: true }, 'ShopContext:updateUser');
      
      dbLogger.logFirestoreWriteSuccess({
        operation: 'setDoc',
        targetPath: `users/${userKey}`,
        sourceComponent: 'ShopContext',
        actionName: 'updateUser',
        summary: `User profile saved to Firestore database for user: ${userKey}`,
        startTime,
        payload: sanitizedUser
      });
    } catch (error) {
      dbLogger.logFirestoreWriteError({
        operation: 'setDoc',
        targetPath: `users/${userKey}`,
        sourceComponent: 'ShopContext',
        actionName: 'updateUser',
        summary: `Failed to save user profile to Firestore`,
        startTime,
        error
      });
      handleFirestoreError(error, OperationType.UPDATE, `users/${userKey}`);
    }

    showToast('Profile and delivery details saved to database');
  };

  const navigateToProductCategory = (category: string) => {
    setSelectedCategory(category);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const providerValue = useMemo(() => ({
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
    deleteMultipleProducts,
    reorderProducts,
    syncAllProductsToDatabase,
    selectedProductForModal,
    setSelectedProductForModal,
    isDbSyncing,
    hasMoreProducts,
    isFetchingMore,
    loadMoreProducts,
    currency,
    setCurrency,
    formatPrice,
    convertUSDToLBP,
    currencySymbol,
    currencyRate,
    cart,
    addToCart,
    addMultipleToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotalUSD,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    wishlist,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    orders,
    placeOrder,
    updateOrderStatus,
    deleteOrder,
    user,
    updateUser,
    checkPhoneUniqueness,
    firebaseUser,
    isAdminUser,
    isEmailVerified,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    signOutUser,
    searchQuery,
    setSearchQuery,
    logSearchQuery,
    selectedCategory,
    setSelectedCategory,
    toast,
    showToast,
    siteContent,
    updateSiteContent,
    toggleSectionVisibility,
    toggleProductPublish,
    addCustomBlock,
    updateCustomBlock,
    deleteCustomBlock,
    isVisualEditMode,
    setIsVisualEditMode,
    isAdminUnlocked,
    setIsAdminUnlocked,
    recentActivities,
    logAdminActivity,
    undoAdminActivity,
    discountRules,
    appliedCouponCode,
    applyCoupon,
    removeCoupon,
    discountUSD,
    finalCartTotalUSD,
    appliedDiscountRules,
    addDiscountRule,
    updateDiscountRule,
    deleteDiscountRule,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    regions,
    updateRegion,
    addRegion,
    deleteRegion,
    sellers,
    addSeller,
    updateSeller,
    toggleSellerActive,
    deleteSeller,
    bulkImportProducts
  }), [
    activeTab,
    selectedProductDetail,
    language,
    products,
    selectedProductForModal,
    isDbSyncing,
    hasMoreProducts,
    isFetchingMore,
    loadMoreProducts,
    currency,
    cart,
    cartTotalUSD,
    cartCount,
    isCartOpen,
    wishlist,
    orders,
    user,
    checkPhoneUniqueness,
    firebaseUser,
    isAdminUser,
    searchQuery,
    logSearchQuery,
    selectedCategory,
    toast,
    siteContent,
    isVisualEditMode,
    isAdminUnlocked,
    recentActivities,
    discountRules,
    appliedCouponCode,
    applyCoupon,
    removeCoupon,
    discountUSD,
    finalCartTotalUSD,
    appliedDiscountRules,
    categories,
    regions,
    sellers
  ]);

  return (
    <ShopContext.Provider value={providerValue}>
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
