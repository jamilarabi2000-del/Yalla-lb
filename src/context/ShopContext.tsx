import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, CartItem, Order, UserProfile, Currency, SiteContent, SectionVisibilityConfig, CMSCustomBlock, RecentActivity } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { DEFAULT_SITE_CONTENT } from '../data/cmsContent';
import { LBP_USD_RATE } from '../data/regions';
import { translations, Language } from '../utils/translations';
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, FirebaseUser, IS_FIREBASE_ENABLED, signInWithPopup, googleProvider, sendPasswordResetEmail } from '../firebase';
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
  writeBatch,
  query,
  where,
  orderBy
} from 'firebase/firestore';

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
  throw new Error(`Database error during ${operationType} on ${path || 'unknown'}: ${errorMessage}`);
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
  if (path === 'products' || path === 'checkout' || path === 'account' || path === 'favorites') {
    return path as NavTab;
  }
  return 'home';
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

  // Currency
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (amountUSD: number) => string;
  convertUSDToLBP: (amountUSD: number) => number;

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

  // Firebase Auth
  firebaseUser: FirebaseUser | null;
  isAdminUser: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const [activeTab, setActiveTabState] = useState<NavTab>(getInitialNavTab);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(getInitialProductDetail);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (firebaseUser) {
      firebaseUser.getIdTokenResult(true) // true = force refresh
        .then(result => {
          setIsAdminUser(result.claims.admin === true);
        })
        .catch(() => {
          setIsAdminUser(false); // fail closed
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toast, setToast] = useState<Toast | null>(null);

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
      if (saved && auth.currentUser) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
      localStorage.removeItem('yallalb_user');
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
          console.log("[ShopContext] CMS main document does not exist. Seeding DEFAULT_SITE_CONTENT to Firestore...");
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

    const productsColRef = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsColRef,
      async (snapshot) => {
        if (snapshot.empty && !hasSeededProductsRef.current) {
          hasSeededProductsRef.current = true;
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
        } else if (!snapshot.empty) {
          const dbProductsMap = new Map<string, Product>();
          snapshot.forEach((docSnap) => {
            dbProductsMap.set(docSnap.id, docSnap.data() as Product);
          });

          dbMonitor.logSnapshotSync({
            path: 'products/*',
            caller: 'ShopContext:onSnapshot(products)',
            itemCount: snapshot.docs.length,
            metadata: { totalItems: dbProductsMap.size }
          });

          // If database has fewer items than INITIAL_PRODUCTS, check for missing items and auto-sync them to Firestore
          const missing = INITIAL_PRODUCTS.filter(p => !dbProductsMap.has(p.id));
          if (missing.length > 0 && !hasSeededProductsRef.current) {
            hasSeededProductsRef.current = true;
            console.log(`[ShopContext] Auto-syncing ${missing.length} missing initial catalog products to Firestore...`);
            try {
              const batch = writeBatch(db);
              missing.forEach((prod) => {
                const prodDocRef = doc(db, 'products', prod.id);
                batch.set(prodDocRef, sanitizeDocumentData(prod));
                dbProductsMap.set(prod.id, prod);
              });
              await monitoredBatchCommit(batch, missing.length, 'products', 'ShopContext:AutoSyncMissingProducts');
              console.log(`[ShopContext] Successfully synced ${missing.length} missing products to Firestore database.`);
            } catch (syncErr) {
              console.error("[ShopContext] Error auto-syncing missing products:", syncErr);
            }
          }

          const allProducts = Array.from(dbProductsMap.values());
          setProducts(allProducts);
          setIsDbSyncing(false);
        }
      },
      (error) => {
        dbMonitor.logOperationFailure('snap-products-err', error, {
          metadata: { path: 'products/*', operation: 'SNAPSHOT_SYNC' }
        });
        handleFirestoreError(error, OperationType.GET, 'products');
      }
    );

    return () => unsubscribe();
  }, []);

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
        localStorage.removeItem('yallalb_user');
        return;
      }
      setFirebaseUser(userObj);
      const userKey = userObj.uid;

      // Sync User Profile
      if (userObj) {
        try {
          const userDocRef = doc(db, 'users', userObj.uid);
          const userSnap = await getDoc(userDocRef);
          
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
                return { firstName: f, lastName: 'Ghattas', name: `${f} Ghattas` };
              }
            }
            return { firstName: 'Walid', lastName: 'Ghattas', name: 'Walid Ghattas' };
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
            const phone = data.phone || cachedShipping.phone || '+961 70 123 456';
            const defaultCity = data.defaultCity || cachedShipping.defaultCity || 'Achrafieh, Beirut';
            const defaultAddress = data.defaultAddress || cachedShipping.defaultAddress || 'Gouraud Street, next to Paul Bakery';
            const defaultBuilding = data.defaultBuilding || cachedShipping.defaultBuilding || 'Al-Nour Bldg, 4th Floor, Apt B';
            const defaultNotes = data.defaultNotes || cachedShipping.defaultNotes || 'Call upon arrival, leave with building concierge if not present';

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
            const newUserData: UserProfile = {
              name: fallbackNames.name,
              firstName: cachedShipping.firstName || fallbackNames.firstName,
              lastName: cachedShipping.lastName || fallbackNames.lastName,
              email: userObj.email || INITIAL_USER.email,
              phone: cachedShipping.phone || '+961 70 123 456',
              avatar: userObj.photoURL || INITIAL_USER.avatar,
              defaultGovernorate: INITIAL_USER.defaultGovernorate,
              defaultCity: cachedShipping.defaultCity || 'Achrafieh, Beirut',
              defaultAddress: cachedShipping.defaultAddress || 'Gouraud Street, next to Paul Bakery',
              defaultBuilding: cachedShipping.defaultBuilding || 'Al-Nour Bldg, 4th Floor, Apt B',
              defaultNotes: cachedShipping.defaultNotes || 'Call upon arrival, leave with building concierge if not present'
            };
            await setDoc(userDocRef, sanitizeFirestorePayload({ uid: userObj.uid, ...newUserData }));
            setUser(newUserData);
          }
        } catch (err) {
          console.error("[ShopContext] Error syncing user profile from Firestore:", err);
        }
      }

      // Sync Wishlist from Firestore
      try {
        const wishlistRef = doc(db, 'wishlists', userKey);
        const wishlistSnap = await getDoc(wishlistRef);
        if (wishlistSnap.exists()) {
          const wData = wishlistSnap.data();
          if (wData.productIds && Array.isArray(wData.productIds)) {
            setWishlist(wData.productIds);
          }
        }
      } catch (err) {
        console.error("[ShopContext] Error syncing wishlist from Firestore:", err);
      }

      // Sync Cart from Firestore
      try {
        const cartRef = doc(db, 'carts', userKey);
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          const cData = cartSnap.data();
          if (cData.items && Array.isArray(cData.items)) {
            setCart(cData.items);
          }
        }
      } catch (err) {
        console.error("[ShopContext] Error syncing cart from Firestore:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Cart to Firestore whenever cart changes
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
    setDoc(cartDocRef, sanitizedCartPayload, { merge: true }).catch((err) => {
      console.warn("[ShopContext] Non-blocking cart sync notice:", err);
    });
  }, [cart, firebaseUser]);

  // Sync Wishlist to Firestore whenever wishlist changes
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
    setDoc(wishlistDocRef, sanitizedWishlistPayload, { merge: true }).catch((err) => {
      console.warn("[ShopContext] Non-blocking wishlist sync notice:", err);
    });
  }, [wishlist, firebaseUser]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Successfully signed in with Google!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'auth');
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset email sent. Please check your inbox.', 'success');
    } catch (error: any) {
      showToast('Failed to send reset email: ' + error.message, 'warning');
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      showToast('Account created successfully!', 'success');
    } catch (err: any) {
      showToast('Sign up failed: ' + err.message, 'warning');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast('Successfully signed in!', 'success');
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // Attempt to create user if not found
          await createUserWithEmailAndPassword(auth, email, pass);
          showToast('Account created and signed in!', 'success');
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          // Might be a Google account or just wrong password. Let's try to create to see if it's not found
          try {
            await createUserWithEmailAndPassword(auth, email, pass);
            showToast('Account created and signed in!', 'success');
          } catch (createErr: any) {
             if (createErr.code === 'auth/email-already-in-use') {
               throw new Error('This email is already registered (likely via Google). Please use a different email or reset your password in Firebase console.');
             }
             throw createErr;
          }
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      // Remove the prefix if we threw a custom error message
      const isEmailInUse = error.message.includes('email-already-in-use') || error.message.includes('already registered');
      const msg = isEmailInUse 
        ? 'This email is already registered. If you forgot your password, please click "Forgot Password?".' 
        : (error.message.includes('invalid-credential') ? 'Incorrect password. Try again or click "Forgot Password?".' : 'Authentication failed: ' + error.message);
      showToast(msg, 'warning');
      console.error("Auth error:", error);
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
    if (typeof window !== 'undefined' && window.history) {
      const hasDepth = window.history.state && typeof window.history.state.depth === 'number' && window.history.state.depth > 0;
      if (hasDepth) {
        window.history.back();
        return;
      }
    }
    setActiveTabState('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const addMultipleToCart = (itemsToAdd: { product: Product; quantity?: number; option?: string }[]) => {
    setCart(prev => {
      const nextCart = [...prev];
      for (const item of itemsToAdd) {
        const qty = item.quantity || 1;
        const existingIndex = nextCart.findIndex(c => c.product.id === item.product.id && c.selectedOption === item.option);
        if (existingIndex > -1) {
          nextCart[existingIndex] = {
            ...nextCart[existingIndex],
            quantity: nextCart[existingIndex].quantity + qty
          };
        } else {
          nextCart.push({
            product: item.product,
            quantity: qty,
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

  const cartTotalUSD = Math.round(cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0) * 100) / 100;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place Order - Saves directly to Firestore database for both guests and authenticated patrons
  const placeOrder = async (orderData: Omit<Order, 'id' | 'date' | 'trackingNumber' | 'status'>): Promise<Order> => {
    const orderDocRef = doc(collection(db, 'orders'));
    const orderId = orderDocRef.id;
    const trackingSuffix = Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      date: new Date().toISOString(),
      trackingNumber: `LB-EXP-${trackingSuffix}`,
      status: 'pending',
      userId: firebaseUser ? firebaseUser.uid : 'guest'
    };

    const sanitizedOrder = sanitizeFirestorePayload(newOrder);

    dbLogger.logFormInput({
      sourceComponent: 'ShopContext',
      actionName: 'placeOrder',
      targetPath: `orders/${newOrder.id}`,
      summary: `Placing new order #${newOrder.id} (${newOrder.items.length} items, total: $${newOrder.totalUSD})`,
      payload: sanitizedOrder
    });

    const { startTime } = dbLogger.logFirestoreWriteStart({
      operation: 'setDoc',
      targetPath: `orders/${newOrder.id}`,
      sourceComponent: 'ShopContext',
      actionName: 'setDoc(orders)',
      summary: `Writing customer order document #${newOrder.id} to Firestore...`,
      payload: sanitizedOrder
    });

    // Persist to Firestore database FIRST before mutating cart state
    if (!IS_FIREBASE_ENABLED) {
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

    try {
      await monitoredSetDoc(orderDocRef, sanitizedOrder, undefined, 'ShopContext:placeOrder');
      
      dbLogger.logFirestoreWriteSuccess({
        operation: 'setDoc',
        targetPath: `orders/${newOrder.id}`,
        sourceComponent: 'ShopContext',
        actionName: 'setDoc(orders)',
        summary: `Order #${newOrder.id} committed to Firestore database successfully.`,
        startTime,
        payload: sanitizedOrder
      });

      setOrders(prev => [newOrder, ...prev]);
      clearCart();
      showToast(`Mabrouk! Order #${newOrder.id} placed and saved to database.`, 'success');
      return newOrder;
    } catch (error) {
      dbLogger.logFirestoreWriteError({
        operation: 'setDoc',
        targetPath: `orders/${newOrder.id}`,
        sourceComponent: 'ShopContext',
        actionName: 'setDoc(orders)',
        summary: `Failed to save order #${newOrder.id} to Firestore`,
        startTime,
        error
      });
      console.error('[ShopContext] Failed to save order to Firestore:', error);
      showToast('Could not save order. Your cart is preserved. Please try again.', 'warning');
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

    const userKey = firebaseUser ? firebaseUser.uid : 'guest_profile';

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
        syncAllProductsToDatabase,
        selectedProductForModal,
        setSelectedProductForModal,
        isDbSyncing,
        currency,
        setCurrency,
        formatPrice,
        convertUSDToLBP,
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
        signOutUser,
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
        logAdminActivity
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
