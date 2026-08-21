import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Product, CartItem, Order, UserProfile, Currency, SiteContent, SectionVisibilityConfig, CMSCustomBlock, RecentActivity, DiscountRule, CategoryItem, TerroirRegion } from '../types';
import { applyDiscounts } from '../lib/pricing';
import { INITIAL_PRODUCTS } from '../data/products';
import { DEFAULT_SITE_CONTENT } from '../data/cmsContent';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { LEBANON_REGIONS, LBP_USD_RATE } from '../data/regions';
import { translations, Language } from '../utils/translations';
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
  type: 'success' | 'info' | 'warning';
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

  // User Profile
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;

  // Firebase Auth & OTP Verification
  firebaseUser: FirebaseUser | null;
  isAdminUser: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // OTP Email Verification
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  isOtpModalOpen: boolean;
  setIsOtpModalOpen: (open: boolean) => void;
  latestOtpCode: string | null;
  sendSignupOTP: (email: string) => Promise<string>;
  verifySignupOTP: (email: string, otpInput: string) => Promise<boolean>;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Feedback Toast
  toast: Toast | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;

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
  logAdminActivity: (actionType: RecentActivity['actionType'], summary: string, details: string) => Promise<void>;

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
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

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

  // OTP Email Verification State
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const [latestOtpCode, setLatestOtpCode] = useState<string | null>(null);

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
    if (!IS_FIREBASE_ENABLED) return;
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
  }, []);

  const logAdminActivity = async (actionType: RecentActivity['actionType'], summary: string, details: string) => {
    try {
      const activityId = `act-${Date.now()}`;
      const newActivity: RecentActivity = {
        id: activityId,
        timestamp: new Date().toISOString(),
        actionType,
        summary,
        details,
        adminEmail: firebaseUser?.email || user.email || 'anonymous-admin'
      };
      
      setRecentActivities(prev => {
        const next = [newActivity, ...prev].slice(0, 50);
        try {
          localStorage.setItem('yallalb_recent_activities', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (IS_FIREBASE_ENABLED) {
        await monitoredSetDoc(doc(db, 'recent_activity', activityId), sanitizeDocumentData(newActivity), undefined, 'ShopContext:logAdminActivity');
      }
    } catch (err) {
      console.error('[ShopContext] Failed to log admin activity:', err);
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
            setCategories(data.list);
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
    const newCategory: CategoryItem = {
      ...catData,
      id: slug,
      subcategories: catData.subcategories || [],
      arabicKeywords: catData.arabicKeywords || [],
      englishKeywords: catData.englishKeywords || [],
      isPublished: catData.isPublished ?? true,
      displayOrder: catData.displayOrder ?? (categories.length + 1)
    };
    const nextCategories = [...categories, newCategory];
    setCategories(nextCategories);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(nextCategories) }, undefined, 'ShopContext:addCategory');
      } catch (err) {
        console.error('[ShopContext] Failed to add category to Firestore:', err);
      }
    }

    await logAdminActivity(
      'category_create',
      `Category "${newCategory.nameEn}" created`,
      `Added category "${newCategory.nameEn}" (${newCategory.nameAr}) with ID "${newCategory.id}", ${newCategory.subcategories.length} subcategories, and Arabic SEO tags.`
    );
    showToast(`Category "${newCategory.nameEn}" created successfully!`, 'success');
  };

  const updateCategory = async (id: string, updates: Partial<CategoryItem>) => {
    const existing = categories.find(c => c.id === id);
    const nextCategories = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    setCategories(nextCategories);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(nextCategories) }, undefined, 'ShopContext:updateCategory');
      } catch (err) {
        console.error('[ShopContext] Failed to update category in Firestore:', err);
      }
    }

    await logAdminActivity(
      'category_update',
      `Category "${existing?.nameEn || id}" updated`,
      `Modified attributes for category: ${Object.keys(updates).join(', ')}.`
    );
    showToast(`Category "${updates.nameEn || existing?.nameEn || id}" updated!`, 'success');
  };

  const deleteCategory = async (id: string, reassignCategoryId?: string) => {
    const target = categories.find(c => c.id === id);
    const nextCategories = categories.filter(c => c.id !== id);
    setCategories(nextCategories);

    // If reassignCategoryId is provided, update matching products
    if (reassignCategoryId) {
      const affectedProducts = products.filter(p => p.category === id);
      for (const prod of affectedProducts) {
        await updateProduct(prod.id, { category: reassignCategoryId });
      }
    }

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(nextCategories) }, undefined, 'ShopContext:deleteCategory');
      } catch (err) {
        console.error('[ShopContext] Failed to delete category in Firestore:', err);
      }
    }

    await logAdminActivity(
      'category_delete',
      `Category "${target?.nameEn || id}" deleted`,
      `Removed category "${target?.nameEn || id}". ${reassignCategoryId ? `Reassigned associated products to "${reassignCategoryId}".` : ''}`
    );
    showToast(`Category "${target?.nameEn || id}" deleted`, 'warning');
  };

  const reorderCategories = async (newOrder: CategoryItem[]) => {
    const normalized = newOrder.map((cat, idx) => ({ ...cat, displayOrder: idx + 1 }));
    setCategories(normalized);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'categories'), { list: sanitizeDocumentData(normalized) }, undefined, 'ShopContext:reorderCategories');
      } catch (err) {
        console.error('[ShopContext] Failed to reorder categories in Firestore:', err);
      }
    }

    await logAdminActivity('category_update', 'Categories reordered', `Admin reordered ${newOrder.length} categories.`);
    showToast('Categories order saved!', 'success');
  };

  const updateRegion = async (id: string, updates: Partial<TerroirRegion>) => {
    const existing = regions.find(r => r.id === id);
    const nextRegions = regions.map(r => r.id === id ? { ...r, ...updates } : r);
    setRegions(nextRegions);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'regions'), { list: sanitizeDocumentData(nextRegions) }, undefined, 'ShopContext:updateRegion');
      } catch (err) {
        console.error('[ShopContext] Failed to update region in Firestore:', err);
      }
    }

    await logAdminActivity('region_update', `Region "${existing?.nameEn || id}" updated`, `Updated regional logistics and delivery fees.`);
    showToast(`Logistics for "${updates.nameEn || existing?.nameEn || id}" updated!`, 'success');
  };

  const addRegion = async (newReg: TerroirRegion) => {
    const nextRegions = [...regions, newReg];
    setRegions(nextRegions);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'regions'), { list: sanitizeDocumentData(nextRegions) }, undefined, 'ShopContext:addRegion');
      } catch (err) {
        console.error('[ShopContext] Failed to add region in Firestore:', err);
      }
    }

    await logAdminActivity('region_update', `Region zone "${newReg.nameEn}" added`, `Added delivery zone with base fee $${newReg.baseDeliveryUSD}.`);
    showToast(`Region zone "${newReg.nameEn}" added!`, 'success');
  };

  const deleteRegion = async (id: string) => {
    const target = regions.find(r => r.id === id);
    const nextRegions = regions.filter(r => r.id !== id);
    setRegions(nextRegions);

    if (IS_FIREBASE_ENABLED) {
      try {
        await monitoredSetDoc(doc(db, 'site_settings', 'regions'), { list: sanitizeDocumentData(nextRegions) }, undefined, 'ShopContext:deleteRegion');
      } catch (err) {
        console.error('[ShopContext] Failed to delete region in Firestore:', err);
      }
    }

    await logAdminActivity('region_update', `Region zone "${target?.nameEn || id}" deleted`, `Removed shipping zone ${id}.`);
    showToast(`Region zone "${target?.nameEn || id}" removed`, 'warning');
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

      showToast('Site CMS content saved and published to live database!', 'success');
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
      showToast(`Firestore save error: ${err?.message || 'Check database connectivity'}`, 'warning');
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
          setProducts(JSON.parse(stored));
        } else {
          setProducts(INITIAL_PRODUCTS);
          localStorage.setItem('yallalb_products', JSON.stringify(INITIAL_PRODUCTS));
        }
      } catch {
        setProducts(INITIAL_PRODUCTS);
      }
      setIsDbSyncing(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const productsColRef = collection(db, 'products');
        // M-9: Paginate using limit(24) and order by 'id'
        const q = query(productsColRef, orderBy('id'), limit(24));
        const snapshot = await getDocs(q);

        if (snapshot.empty && !hasSeededProductsRef.current) {
          hasSeededProductsRef.current = true;
          if (isAdminUser || isAdminUnlocked) {
            console.log("[ShopContext] Database products collection is empty. Seeding initial catalog to Firestore...");
            try {
              const batch = writeBatch(db);
              INITIAL_PRODUCTS.forEach((prod) => {
                const prodDocRef = doc(db, 'products', prod.id);
                batch.set(prodDocRef, sanitizeDocumentData(prod));
              });
              await monitoredBatchCommit(batch, INITIAL_PRODUCTS.length, 'products', 'ShopContext:AutoSeedProducts');
              console.log(`[ShopContext] Successfully seeded ${INITIAL_PRODUCTS.length} artisan products to Firestore database.`);
            } catch (seedErr) {
              console.error("[ShopContext] Error seeding products to Firestore:", seedErr);
            }
          }
          setProducts(INITIAL_PRODUCTS);
          setHasMoreProducts(false);
        } else if (!snapshot.empty) {
          // Track last doc for startAfter pagination
          lastVisibleDocRef.current = snapshot.docs[snapshot.docs.length - 1];
          setHasMoreProducts(snapshot.docs.length === 24);

          const dbProductsMap = new Map<string, Product>();
          snapshot.forEach((docSnap) => {
            dbProductsMap.set(docSnap.id, docSnap.data() as Product);
          });

          dbMonitor.logSnapshotSync({
            path: 'products/*',
            caller: 'ShopContext:getDocs(products, limit 24)',
            itemCount: snapshot.docs.length,
            metadata: { totalItems: dbProductsMap.size }
          });

          const allProducts = Array.from(dbProductsMap.values());
          setProducts(allProducts);
        }
      } catch (error: any) {
        dbMonitor.logOperationFailure('fetch-products-err', error, {
          metadata: { path: 'products/*', operation: 'GET_DOCS_FETCH' }
        });
        handleFirestoreError(error, OperationType.GET, 'products');
      } finally {
        setIsDbSyncing(false);
      }
    };

    fetchProducts();
  }, []);

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

            setUser(prev => ({ 
              ...prev, 
              ...mergedProfile
            }));
          } else {
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
      items: cart,
      updatedAt: new Date().toISOString()
    });

    const handler = setTimeout(() => {
      setDoc(cartDocRef, sanitizedCartPayload, { merge: true }).catch((err) => {
        console.warn("[ShopContext] Non-blocking cart sync notice:", err);
      });
    }, 1000);

    return () => clearTimeout(handler);
  }, [cart, firebaseUser]);

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

  const signInWithGoogle = async () => {
    try {
      if (!auth) {
        throw new Error("Firebase Authentication is not fully initialized in this environment.");
      }
      const provider = googleProvider || new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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
      await signInWithPopup(auth, provider);
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

  const sendSignupOTP = async (targetEmail: string): Promise<string> => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setLatestOtpCode(generatedOtp);
    setPendingVerificationEmail(cleanEmail);
    setIsOtpModalOpen(true);

    if (IS_FIREBASE_ENABLED) {
      try {
        const otpDocRef = doc(collection(db, 'otp_verifications'));
        await setDoc(otpDocRef, {
          email: cleanEmail,
          otp: generatedOtp,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          verified: false
        });
      } catch (err) {
        console.warn("[sendSignupOTP] Firestore error:", err);
      }
    }

    if (auth && auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (e) {
        console.warn("sendEmailVerification notice:", e);
      }
    }

    showToast(
      language === 'ar'
        ? `تم إرسال رمز التحقق OTP إلى ${cleanEmail}`
        : `Verification OTP sent to ${cleanEmail}. Please enter the 6-digit code.`,
      'info'
    );
    return generatedOtp;
  };

  const verifySignupOTP = async (targetEmail: string, inputOtp: string): Promise<boolean> => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const cleanOtp = inputOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      const msg = language === 'ar' ? 'يرجى إدخال رمز مكون من 6 أرقام' : 'Please enter a valid 6-digit OTP code.';
      showToast(msg, 'warning');
      return false;
    }

    let isMatch = false;

    if (latestOtpCode && cleanOtp === latestOtpCode) {
      isMatch = true;
    }

    if (!isMatch && IS_FIREBASE_ENABLED) {
      try {
        const otpsRef = collection(db, 'otp_verifications');
        const q = query(otpsRef, where('email', '==', cleanEmail), where('otp', '==', cleanOtp));
        const snap = await getDocs(q);
        if (!snap.empty) {
          isMatch = true;
          snap.forEach(async (d) => {
            await setDoc(d.ref, { verified: true }, { merge: true }).catch(() => {});
          });
        }
      } catch (err) {
        console.warn("[verifySignupOTP] Firestore verification notice:", err);
      }
    }

    if (isMatch) {
      setUser((prev) => {
        const updated = { ...prev, emailVerified: true, isOtpVerified: true };
        try {
          localStorage.setItem('yallalb_user', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (IS_FIREBASE_ENABLED && firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userDocRef, { emailVerified: true, isOtpVerified: true, emailVerifiedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn("Error updating user profile verification in Firestore:", e);
        }
      }

      setIsOtpModalOpen(false);
      setPendingVerificationEmail(null);

      showToast(
        language === 'ar'
          ? 'تم تأكيد ملكية البريد الإلكتروني بنجاح! أهلاً بك في يلا لبنان.'
          : 'Email verified successfully! Welcome to Yalla Lebanon.',
        'success'
      );
      return true;
    } else {
      showToast(
        language === 'ar'
          ? 'رمز التحقق غير صحيح. يرجى إعادة المحاولة.'
          : 'Invalid OTP code. Please check your email and enter the correct 6-digit code.',
        'warning'
      );
      return false;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
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
        await sendSignupOTP(email);
        showToast(
          language === 'ar'
            ? 'تم إنشاء الحساب! يرجى إدخال رمز OTP لتأكيد ملكية بريدك الإلكتروني.'
            : 'Account created! Please enter the OTP to confirm email ownership.',
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
      await signInWithEmailAndPassword(auth, email, pass);
      showToast('Successfully signed in!', 'success');
    } catch (error) {
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

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
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
    const availableStock = typeof currentProduct.stock === 'number' ? currentProduct.stock : 999;
    
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
        const availableStock = typeof currentProd.stock === 'number' ? currentProd.stock : 999;
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
    const availableStock = currentProduct && typeof currentProduct.stock === 'number' ? currentProduct.stock : 999;

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
          const currentStock = typeof dbProd.data.stock === 'number' ? dbProd.data.stock : 999;
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
        const authDiscountCalc = applyDiscounts(validatedItems, discountRules, appliedCouponCode);
        const subtotalUSD = Math.round(validatedItems.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0) * 100) / 100;
        const totalUSD = authDiscountCalc.finalSubtotalUSD;
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
          discountUSD: discountUSDVal,
          totalUSD,
          appliedCoupon: appliedCouponCode || undefined
        };

        const sanitizedOrder = sanitizeFirestorePayload(newOrder);

        // 4. Update product stocks (decrement atomically)
        for (const dbProd of dbProducts) {
          const currentStock = typeof dbProd.data.stock === 'number' ? dbProd.data.stock : 999;
          const nextStock = Math.max(0, currentStock - dbProd.cartItem.quantity);
          transaction.update(dbProd.ref, { stock: nextStock });
        }

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
    }

    showToast(`Order status updated to ${status.replace('_', ' ')} in database`, 'info');
  };

  // Add Product - Saves new item to Firestore database
  const addProduct = async (newProdData: Omit<Product, 'id'>) => {
    const id = `prod-custom-${Date.now()}`;
    const newProduct: Product = { ...newProdData, id };
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
        `Added new catalog item with ID: ${newProduct.id}, category: ${newProduct.category}, and price: $${newProduct.priceUSD} locally.`
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
        `Added new catalog item with ID: ${newProduct.id}, category: ${newProduct.category}, and price: $${newProduct.priceUSD}.`
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
    } catch (error) {
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
    }

    showToast(`Product "${newProduct.name}" saved to database!`);
  };

  // Update Product - Updates item in Firestore database
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const existing = products.find(p => p.id === id);
    const sanitizedUpdates = sanitizeDocumentData(updates);
    
    dbLogger.logFormInput({
      sourceComponent: 'AdminView',
      actionName: 'updateProduct',
      targetPath: `products/${id}`,
      summary: `Admin updated product #${id} (${existing?.name || 'Item'}): [${Object.keys(updates).join(', ')}]`,
      payload: sanitizedUpdates,
      diff: calculateObjectDiff(existing as any, { ...existing, ...updates } as any)
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
      const next = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      try {
        localStorage.setItem('yallalb_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (!IS_FIREBASE_ENABLED) {
      await logAdminActivity(
        'product_update',
        `Product "${existing?.name || id}" updated`,
        `Modified attributes locally: ${Object.keys(updates).join(', ')}.`
      );
      showToast('Product updated locally!');
      return;
    }

    try {
      await monitoredSetDoc(doc(db, 'products', id), sanitizedUpdates, { merge: true }, 'AdminView:updateProduct');
      
      await logAdminActivity(
        'product_update',
        `Product "${existing?.name || id}" updated`,
        `Modified attributes: ${Object.keys(updates).join(', ')}.`
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
    } catch (error) {
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
    }

    showToast('Product updated in database successfully');
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
        `Permanently removed product #${id} from catalog.`
      );
      showToast('Product deleted locally!');
      return;
    }

    try {
      await monitoredDeleteDoc(doc(db, 'products', id), 'AdminView:deleteProduct');
      
      await logAdminActivity(
        'product_delete',
        `Product "${target?.name || id}" deleted`,
        `Permanently removed product #${id} from catalog.`
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
    }

    showToast('Product removed from database', 'warning');
  };

  // Sync All Initial Products directly to Firestore database
  const syncAllProductsToDatabase = async () => {
    try {
      showToast('Syncing all 55 items to database...', 'info');
      
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
        const sanitizedProd = sanitizeDocumentData(prod);
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

  // Update User Profile - Saves to Firestore database
  const updateUser = async (updates: Partial<UserProfile>) => {
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
    user,
    updateUser,
    firebaseUser,
    isAdminUser,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    signOutUser,
    pendingVerificationEmail,
    setPendingVerificationEmail,
    isOtpModalOpen,
    setIsOtpModalOpen,
    latestOtpCode,
    sendSignupOTP,
    verifySignupOTP,
    searchQuery,
    setSearchQuery,
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
    deleteRegion
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
    firebaseUser,
    isAdminUser,
    searchQuery,
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
    regions
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
