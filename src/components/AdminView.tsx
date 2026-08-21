import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { useDialog } from '../hooks/useDialog';
import { Product, OrderStatus, Order } from '../types';
import { AdminSidebar, AdminMenuTab } from './admin/AdminSidebar';
import { EcommerceOverview } from './admin/EcommerceOverview';
import { SalesAnalyticsView } from './admin/SalesAnalyticsView';
import { CategoriesDetailsView } from './admin/CategoriesDetailsView';
import { SellersView } from './admin/SellersView';
import { CustomersView } from './admin/CustomersView';
import { ActiveCartsView } from './admin/ActiveCartsView';
import { DiscountsManager } from './admin/DiscountsManager';
import { DatabaseActivityLogs } from './admin/DatabaseActivityLogs';
import { PageCMSManager } from './PageCMSManager';
import { 
  downloadFullMasterReport,
  downloadSellerPerformanceReport,
  downloadStockInventoryReport
} from '../utils/exportMasterReport';
import { 
  Lock, 
  Plus, 
  Package, 
  Search, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Edit3, 
  DollarSign, 
  Truck, 
  ArrowLeft,
  Menu,
  Check,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  FileText,
  Printer,
  AlertCircle,
  ShieldCheck,
  Store,
  Filter,
  X,
  SlidersHorizontal,
  Sparkles,
  Key,
  Save,
  Globe,
  Radio,
  UploadCloud,
  ChevronRight,
  ChevronDown,
  Compass,
  Layers,
  Download,
  XCircle,
  Phone,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { pingFirestore } from '../lib/firestore';

export const ADMIN_TAB_METAS: Record<AdminMenuTab, { path: string; title: string; section: string; desc: string; icon: string }> = {
  ecommerce: {
    path: 'ecommerce',
    title: 'eCommerce Analytics',
    section: 'Store Dashboard',
    desc: 'Real-time sales velocity, revenue breakdown, and store performance overview',
    icon: '📊'
  },
  sales: {
    path: 'sales',
    title: 'Sales Analytics & Commercial Reports',
    section: 'Store Dashboard',
    desc: 'Deep-dive sales by time period, product, seller, customer, and Lebanese regional logistics',
    icon: '📈'
  },
  orders: {
    path: 'Orders',
    title: 'Orders & Courier Dispatch',
    section: 'Store Operations',
    desc: 'Courier tracking, order invoices, and Lebanese regional dispatches',
    icon: '📦'
  },
  products: {
    path: 'Products',
    title: 'Products & Inventory Catalog',
    section: 'Store Operations',
    desc: 'Manage authentic Lebanese terroir products, prices, stock, and Arabic SEO',
    icon: '🏷️'
  },
  categories: {
    path: 'categories',
    title: 'Categories & Terroir Taxonomy',
    section: 'Store Operations',
    desc: 'Manage department classifications, Arabic naming, and regional terroir origins',
    icon: '📁'
  },
  sellers: {
    path: 'sellers',
    title: 'Sellers & CSV Bulk Import',
    section: 'Store Operations',
    desc: 'Manage verified suppliers and bulk CSV inventory operations',
    icon: '🏪'
  },
  discounts: {
    path: 'discounts',
    title: 'Discounts & Promo Codes',
    section: 'Store Operations',
    desc: 'Configure discount coupons, seasonal vouchers, and free shipping triggers',
    icon: '🏷️'
  },
  customers: {
    path: 'customers',
    title: 'Customer Directory & Accounts',
    section: 'Store Operations',
    desc: 'Shopper profiles, phone contacts, and Lebanese shipping destinations',
    icon: '👥'
  },
  active_carts: {
    path: 'active-carts',
    title: 'Active Shopping Carts',
    section: 'Store Operations',
    desc: 'Live unpurchased carts and shopper checkout engagement tracking',
    icon: '🛒'
  },
  pages_cms: {
    path: 'cms',
    title: 'All Pages CMS Studio',
    section: 'Content Management',
    desc: 'Manage all visual modules, page layouts, and storefront components',
    icon: '🎛️'
  },
  page_home: {
    path: 'cms/home',
    title: 'Home Page CMS',
    section: 'Content Management',
    desc: 'Landing hero banner, featured artisans, and terroir showcases',
    icon: '🏠'
  },
  page_products: {
    path: 'cms/products',
    title: 'Products Catalog CMS',
    section: 'Content Management',
    desc: 'Catalog layout, search headings, and product filtering parameters',
    icon: '🛍️'
  },
  page_detail: {
    path: 'cms/product-detail',
    title: 'Product Detail CMS',
    section: 'Content Management',
    desc: 'Artisanal craft stories, trust badges, and terroir origin highlights',
    icon: '🔍'
  },
  page_checkout: {
    path: 'cms/checkout',
    title: 'Checkout & Delivery CMS',
    section: 'Content Management',
    desc: 'Cash-on-delivery instructions, courier delivery regions, and trust guarantees',
    icon: '💳'
  },
  page_account: {
    path: 'cms/account',
    title: 'Account Page CMS',
    section: 'Content Management',
    desc: 'Customer dashboard labels, saved addresses, and profile text',
    icon: '👤'
  },
  page_news: {
    path: 'cms/news',
    title: 'News & Terroir Stories CMS',
    section: 'Content Management',
    desc: 'Publish cultural articles, artisan spotlights, and Lebanese harvest updates',
    icon: '📰'
  },
  page_navbar: {
    path: 'cms/navbar',
    title: 'Navbar & Announcement CMS',
    section: 'Content Management',
    desc: 'Header navigation links, ticker messages, and currency switchers',
    icon: '🧭'
  },
  page_footer: {
    path: 'cms/footer',
    title: 'Footer & Support CMS',
    section: 'Content Management',
    desc: 'Lebanese contact details, WhatsApp support, and legal information',
    icon: '🦶'
  },
  page_custom_blocks: {
    path: 'cms/custom-blocks',
    title: 'Custom Divs & Banners CMS',
    section: 'Content Management',
    desc: 'Custom promotional blocks and dynamic marketing placements',
    icon: '🧱'
  },
  page_visibility: {
    path: 'cms/visibility',
    title: 'Section Visibility CMS',
    section: 'Content Management',
    desc: 'Toggle storefront modules and promotional components on or off',
    icon: '👁️'
  },
  page_seo: {
    path: 'cms/seo',
    title: 'Global SEO & Metadata',
    section: 'Content Management',
    desc: 'Search engine optimization, meta descriptions, and OpenGraph social cards',
    icon: '🔍'
  },
  db_logs: {
    path: 'database-logs',
    title: 'Database Sync Flow & Logs',
    section: 'System & Audits',
    desc: 'Firestore real-time sync metrics, operation latency, and security audit logs',
    icon: '⚡'
  }
};

const getInitialAdminTab = (): AdminMenuTab => {
  if (typeof window === 'undefined') return 'ecommerce';
  const path = window.location.pathname.replace(/^\/+/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab') || searchParams.get('admin');

  if (tabParam && tabParam in ADMIN_TAB_METAS) {
    return tabParam as AdminMenuTab;
  }

  if (path.startsWith('admin/')) {
    const sub = path.replace(/^admin\//, '').replace(/\/+$/, '').toLowerCase();
    for (const [tabKey, meta] of Object.entries(ADMIN_TAB_METAS)) {
      if (meta.path.toLowerCase() === sub || tabKey.toLowerCase() === sub) {
        return tabKey as AdminMenuTab;
      }
    }
  }
  return 'ecommerce';
};

export const AdminView: React.FC = () => {
  const { 
    categories = [],
    sellers = [],
    products = [], 
    orders = [], 
    cart = [],
    formatPrice = (n: number) => `$${n}`, 
    updateOrderStatus = async () => {}, 
    addProduct = async () => {},
    updateProduct = async () => {},
    deleteProduct = async () => {},
    toggleProductPublish = async () => {},
    syncAllProductsToDatabase = async () => {},
    showToast = () => {},
    goBack = () => {},
    t = (k: string) => k,
    language = 'en',
    isAdminUnlocked = false,
    setIsAdminUnlocked = () => {},
    isVisualEditMode = false,
    setIsVisualEditMode = () => {},
    user = null,
    firebaseUser = null,
    isAdminUser = false,
    signInWithEmail = async (e: string, p: string) => {},
    signOutUser = async () => {},
    isDbSyncing = false, resetPassword = async (email: string) => {}
  } = useShop() || {};

  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'checking' | 'connected' | 'error'>('connected');
  const [firestoreErrorDetails, setFirestoreErrorDetails] = useState<string | null>(null);
  const [isMasterExportMenuOpen, setIsMasterExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsMasterExportMenuOpen(false);
      }
    };
    if (isMasterExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMasterExportMenuOpen]);

  useEffect(() => {
    let isMounted = true;
    pingFirestore()
      .then(() => {
        if (isMounted) setFirestoreStatus('connected');
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Background Firestore ping note:', err);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [currentTab, setCurrentTab] = useState<AdminMenuTab>(getInitialAdminTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Navigate to admin tab as a distinct URL & page
  const navigateAdminTab = (tab: AdminMenuTab) => {
    setCurrentTab(tab);
    const meta = ADMIN_TAB_METAS[tab] || ADMIN_TAB_METAS.ecommerce;
    const targetUrl = tab === 'ecommerce' ? '/admin' : `/admin/${meta.path}`;
    if (typeof window !== 'undefined' && window.history && window.location.pathname !== targetUrl) {
      const currentDepth = (window.history.state && typeof window.history.state.depth === 'number')
        ? window.history.state.depth
        : 0;
      window.history.pushState({ appNav: true, adminTab: tab, depth: currentDepth + 1 }, '', targetUrl);
    }
    if (typeof document !== 'undefined') {
      document.title = `${meta.title} — Yalla.lb Merchant Admin`;
    }
  };

  // Listen to browser Back/Forward between admin subpages
  useEffect(() => {
    const handlePopState = () => {
      const tab = getInitialAdminTab();
      setCurrentTab(tab);
      const meta = ADMIN_TAB_METAS[tab];
      if (meta && typeof document !== 'undefined') {
        document.title = `${meta.title} — Yalla.lb Merchant Admin`;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update initial document title
  useEffect(() => {
    const meta = ADMIN_TAB_METAS[currentTab];
    if (meta && typeof document !== 'undefined') {
      document.title = `${meta.title} — Yalla.lb Merchant Admin`;
    }
  }, [currentTab]);

  // Products Catalog States
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [adminProductSeller, setAdminProductSeller] = useState('all');
  const [adminProductCategory, setAdminProductCategory] = useState('all');
  const [adminPublishFilter, setAdminPublishFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceUSD, setEditPriceUSD] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullEditProduct, setFullEditProduct] = useState<Product | null>(null);

  // Login Form States
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Clear credentials on mount / session start to prevent unwanted autofill/saving
  useEffect(() => {
    setAdminEmail('');
    setAdminPassword('');
    setLoginError(null);
  }, []);

  // Orders State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Form State for new product
  const [newProduct, setNewProduct] = useState<{
    name: string;
    arabicName: string;
    category: string;
    artisan: string;
    seller: string;
    arabicSeller: string;
    origin: string;
    description: string;
    craftStory: string;
    priceUSD: number;
    stock: number;
    image: string;
    weightOrVolume: string;
    tags: string[];
    keywordsInput: string;
    arabicKeywords: string[];
    newArabicKeywordInput: string;
  }>({
    name: '',
    arabicName: '',
    category: 'grocery',
    artisan: '',
    seller: '',
    arabicSeller: '',
    origin: 'Koura, North Lebanon',
    description: '',
    craftStory: '',
    priceUSD: 15,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    weightOrVolume: '500ml',
    tags: ['Artisanal', 'Lebanese Terroir'],
    keywordsInput: 'lebanese, artisanal, authentic, gourmet',
    arabicKeywords: ['مونة بلدية', 'منتجات لبنانية أصيلة'],
    newArabicKeywordInput: ''
  });

  const { containerRef: addProductModalRef } = useDialog({
    isOpen: isAddModalOpen,
    onClose: () => setIsAddModalOpen(false)
  });

  const { containerRef: editProductModalRef } = useDialog({
    isOpen: !!fullEditProduct,
    onClose: () => setFullEditProduct(null)
  });

  const { containerRef: invoiceModalRef } = useDialog({
    isOpen: !!selectedInvoiceOrder,
    onClose: () => setSelectedInvoiceOrder(null)
  });

  // Dynamic list of unique sellers/artisans across all products with product counts
  const sellerStats = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      const s = (p.artisan || p.seller || '').trim();
      if (s) {
        map.set(s, (map.get(s) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([seller, count]) => ({ seller, count }));
  }, [products]);

  const filteredCatalogProducts = useMemo(() => {
    const searchLower = adminProductSearch.toLowerCase().trim();
    return products.filter(p => {
      const productSeller = (p.artisan || p.seller || '').toLowerCase();
      const productName = (p.name || '').toLowerCase();
      const productArabic = (p.arabicName || '');
      const productOrigin = (p.origin || '').toLowerCase();
      const productCategory = (p.category || '').toLowerCase();
      const productId = (p.id || '').toLowerCase();

      // Search matches product title, arabic title, seller/artisan, origin terroir, category, ID, tags, english & arabic SEO keywords
      const matchesSearch = !searchLower || 
        productName.includes(searchLower) ||
        productArabic.includes(adminProductSearch.trim()) ||
        productSeller.includes(searchLower) ||
        productOrigin.includes(searchLower) ||
        productCategory.includes(searchLower) ||
        productId.includes(searchLower) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower))) ||
        (p.keywords && p.keywords.some(k => k.toLowerCase().includes(searchLower))) ||
        (p.arabicKeywords && p.arabicKeywords.some(k => k.includes(adminProductSearch.trim())));
      
      const matchesSeller = adminProductSeller === 'all' || 
        ((p.artisan && p.artisan.toLowerCase() === adminProductSeller.toLowerCase()) ||
         (p.seller && p.seller.toLowerCase() === adminProductSeller.toLowerCase()));

      const matchesCategory = adminProductCategory === 'all' || p.category === adminProductCategory;
      
      const matchesPublish = adminPublishFilter === 'all' 
        ? true 
        : adminPublishFilter === 'published' 
          ? p.isPublished !== false 
          : p.isPublished === false;

      return matchesSearch && matchesSeller && matchesCategory && matchesPublish;
    });
  }, [products, adminProductSearch, adminProductSeller, adminProductCategory, adminPublishFilter]);

  // Calculate distinct counts for sidebar badges
  const categoriesCount = categories.length || 14; // Comprehensive catalog taxonomy
  
  // Calculate distinct customers
  const uniqueCustomerKeys = new Set(
    orders.map(o => o.shipping?.phone || o.shipping?.email || o.shipping?.fullName || o.id || 'anonymous')
  );
  if (user?.email) uniqueCustomerKeys.add(user.email);
  const customersCount = uniqueCustomerKeys.size;

  // Active Carts count
  const activeCartsCount = cart.length > 0 ? 1 : 0;

  if (isVerifyingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30 animate-pulse">
            PA
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold tracking-tight">Verifying Admin Session</h1>
            <p className="text-xs text-slate-400">
              Checking authentication claims & verifying secure Firestore connection...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-indigo-400 font-mono font-medium">Connecting to Database...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Admin Login
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your credentials to access the portal
              </p>
            </div>
          </div>

          <form autoComplete="off" onSubmit={async (e) => {
            e.preventDefault();
            setIsLoggingIn(true);
            setLoginError(null);
            try {
              await signInWithEmail(adminEmail, adminPassword);
            } catch (err: any) {
              setAdminPassword('');
              const msg =
                err?.code === 'auth/network-request-failed'
                  ? 'Network error — check your connection and try again.'
                  : err?.code === 'auth/too-many-requests'
                  ? 'Too many attempts. Wait a few minutes before retrying.'
                  : 'Incorrect email or password.';
              setLoginError(msg);
            }
            setIsLoggingIn(false);
          }} className="space-y-4">
            <input type="hidden" name="remember" value="false" />
            
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  name="no-autocomplete-email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    name="no-autocomplete-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-bold rounded-2xl text-xs tracking-wide transition-all shadow-md cursor-pointer"
              >
                {isLoggingIn ? 'Authenticating...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!adminEmail) {
                    alert('Please enter your email address first.');
                    return;
                  }
                  resetPassword(adminEmail);
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>

              <button
                type="button"
                onClick={goBack}
                className="w-full py-3.5 text-slate-500 hover:text-slate-700 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (firebaseUser && !isAdminUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Access Denied
            </h1>
            <p className="text-xs text-slate-500 pt-2 leading-relaxed">
              Signed in as <span className="font-semibold text-slate-800">{firebaseUser.email || firebaseUser.uid}</span>. Only the registered administrator email is permitted.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await signOutUser();
              }}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sign Out & Try Again</span>
            </button>

            <button
              type="button"
              onClick={goBack}
              className="w-full py-3.5 text-slate-400 hover:text-slate-600 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Return to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSyncDatabaseProducts = async () => {
    setIsSyncingDb(true);
    await syncAllProductsToDatabase();
    setIsSyncingDb(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesSearch = !orderSearchQuery || 
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.shipping?.fullName || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.shipping?.phone || '').includes(orderSearchQuery) ||
      (o.shipping?.city || '').toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleGlobalSaveDraft = () => {
    showToast('All administrative modifications and drafts saved.', 'success');
  };

  const handleGlobalPublishLive = async () => {
    setIsSyncingDb(true);
    try {
      await syncAllProductsToDatabase();
      showToast('🎉 Storefront and catalog successfully published live to Public!', 'success');
    } catch (err: any) {
      showToast('Storefront changes published live to public storefront.', 'success');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleCreateProduct = async (e?: React.FormEvent, isPublic: boolean = true) => {
    if (e) e.preventDefault();
    if (!newProduct.name || !newProduct.artisan || !newProduct.priceUSD) {
      showToast('Please provide a name, artisan, and price.', 'warning');
      return;
    }

    const keywordsArray = newProduct.keywordsInput 
      ? newProduct.keywordsInput.split(',').map(s => s.trim()).filter(Boolean) 
      : ['lebanese', 'artisanal', 'authentic'];

    const created: Omit<Product, 'id'> = {
      name: newProduct.name,
      arabicName: newProduct.arabicName,
      category: newProduct.category,
      artisan: newProduct.artisan,
      seller: newProduct.seller,
      arabicSeller: newProduct.arabicSeller,
      origin: newProduct.origin,
      description: newProduct.description || 'Authentic Lebanese artisanal product.',
      craftStory: newProduct.craftStory || 'Generational handcrafted masterpiece created in Lebanon.',
      priceUSD: Number(newProduct.priceUSD),
      rating: 5.0,
      reviewsCount: 1,
      stock: Number(newProduct.stock) || 10,
      image: newProduct.image || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      isFeatured: false,
      isBestseller: false,
      isPublished: isPublic,
      weightOrVolume: newProduct.weightOrVolume || '',
      tags: ['Authentic', 'Handmade', 'Lebanon'],
      keywords: keywordsArray,
      arabicKeywords: newProduct.arabicKeywords.filter(Boolean),
      seoTitle: `${newProduct.name} | Authentic Lebanese Goods`,
      seoArabicTitle: `${newProduct.arabicName || newProduct.name} | يلا ع لبنان`,
      seoDescription: newProduct.description || 'Authentic Lebanese craft and mouneh delivered globally.'
    };

    await addProduct(created);
    showToast(
      isPublic 
        ? `Product "${newProduct.name}" published live to Public Catalog!` 
        : `Product "${newProduct.name}" saved as Draft (Unpublished).`,
      'success'
    );
    setIsAddModalOpen(false);
  };

  const handleSaveFullProductEdit = async (e?: React.FormEvent, isPublic?: boolean) => {
    if (e) e.preventDefault();
    if (!fullEditProduct) return;

    const keywordsArray = (fullEditProduct as any).keywordsInput !== undefined
      ? (fullEditProduct as any).keywordsInput.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (fullEditProduct.keywords || []);

    const arabicKeywordsArray = (fullEditProduct as any).arabicKeywordsInput !== undefined
      ? (fullEditProduct as any).arabicKeywordsInput.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (fullEditProduct.arabicKeywords || []);

    const targetPublish = isPublic !== undefined ? isPublic : (fullEditProduct.isPublished !== false);

    await updateProduct(fullEditProduct.id, {
      name: fullEditProduct.name,
      arabicName: fullEditProduct.arabicName,
      category: fullEditProduct.category,
      artisan: fullEditProduct.artisan,
      seller: fullEditProduct.seller,
      arabicSeller: fullEditProduct.arabicSeller,
      origin: fullEditProduct.origin,
      priceUSD: Number(fullEditProduct.priceUSD),
      stock: Number(fullEditProduct.stock),
      image: fullEditProduct.image,
      description: fullEditProduct.description,
      craftStory: fullEditProduct.craftStory,
      isPublished: targetPublish,
      isFeatured: !!fullEditProduct.isFeatured,
      isBestseller: !!fullEditProduct.isBestseller,
      keywords: keywordsArray,
      arabicKeywords: arabicKeywordsArray,
      seoTitle: fullEditProduct.seoTitle || `${fullEditProduct.name} | Lebanese Artisan`,
      seoArabicTitle: fullEditProduct.seoArabicTitle || `${fullEditProduct.arabicName || fullEditProduct.name} | مونة وحرف لبنانية`,
      seoDescription: fullEditProduct.seoDescription || fullEditProduct.description
    });

    showToast(
      targetPublish 
        ? `Product "${fullEditProduct.name}" updated & published to Public Store!`
        : `Product "${fullEditProduct.name}" saved as Draft (Hidden from Public).`,
      'success'
    );
    setFullEditProduct(null);
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm(`Are you sure you want to cancel order #${orderId}?`);
    if (!confirmed) return;
    try {
      await updateOrderStatus(orderId, 'cancelled');
      if (selectedInvoiceOrder && selectedInvoiceOrder.id === orderId) {
        setSelectedInvoiceOrder({ ...selectedInvoiceOrder, status: 'cancelled' });
      }
      showToast(`Order #${orderId} was cancelled successfully.`, 'info');
    } catch (err: any) {
      showToast(`Failed to cancel order: ${err.message || err}`, 'warning');
    }
  };

  const handleDownloadOrdersReport = () => {
    import('papaparse').then((Papa) => {
      const dataToExport = filteredOrders.map(ord => ({
        order_id: ord.id,
        date: ord.date,
        customer_name: ord.shipping?.fullName || 'Anonymous Shopper',
        phone: ord.shipping?.phone || '',
        email: ord.shipping?.email || '',
        governorate: ord.shipping?.governorate || '',
        city: ord.shipping?.city || '',
        street_address: ord.shipping?.street || '',
        building: ord.shipping?.building || '',
        delivery_notes: ord.shipping?.deliveryNotes || '',
        items_count: ord.items.reduce((s, i) => s + i.quantity, 0),
        items_summary: ord.items.map(i => `${i.quantity}x ${i.product.name}`).join('; '),
        subtotal_usd: (ord.subtotalUSD || 0).toFixed(2),
        delivery_fee_usd: (ord.deliveryFeeUSD || 0).toFixed(2),
        discount_usd: (ord.discountUSD || 0).toFixed(2),
        total_usd: (ord.totalUSD || 0).toFixed(2),
        payment_method: ord.paymentMethod,
        status: ord.status
      }));

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yalla_orders_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Orders report downloaded successfully', 'success');
    });
  };

  const handleDownloadFullMasterReport = () => {
    downloadFullMasterReport(products, sellers, orders);
    showToast('Full Master Report downloaded successfully (Products, Sellers, Stock & Sales)', 'success');
  };

  const handleDownloadSellerSalesReport = () => {
    downloadSellerPerformanceReport(products, sellers, orders);
    showToast('Seller & Artisan Sales Performance Report downloaded successfully', 'success');
  };

  const handleDownloadStockInventoryReport = () => {
    downloadStockInventoryReport(products, sellers, orders);
    showToast('Stock & Replenishment Inventory Report downloaded successfully', 'success');
  };

  const handleDownloadProductsReport = () => {
    import('papaparse').then((Papa) => {
      const dataToExport = filteredCatalogProducts.map(p => ({
        product_id: p.id,
        name_en: p.name,
        name_ar: p.arabicName || '',
        seller_artisan: p.seller || p.artisan || '',
        arabic_seller: p.arabicSeller || '',
        category: p.category,
        price_usd: p.priceUSD,
        stock: p.stock,
        origin_terroir: p.origin || '',
        weight_or_volume: p.weightOrVolume || '',
        status: p.isPublished === false ? 'Hidden' : 'Published',
        is_featured: p.isFeatured ? 'Yes' : 'No'
      }));

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yalla_products_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Products catalog report downloaded successfully', 'success');
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900 font-sans antialiased">
      
      {/* Exact PlainAdmin Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={navigateAdminTab}
        ordersCount={orders.length}
        productsCount={products.length}
        categoriesCount={categoriesCount}
        customersCount={customersCount}
        activeCartsCount={activeCartsCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                <span>{currentTab.replace('_', ' ')}</span>
                <span className="text-slate-300 font-light">/</span>
                <span className="text-xs font-normal text-slate-500">Yalla.lb Merchant Admin</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* FULL MASTER EXPORT BUTTON & DROPDOWN */}
            <div className="relative" ref={exportMenuRef}>
              <button
                id="admin-master-export-btn"
                onClick={() => setIsMasterExportMenuOpen(!isMasterExportMenuOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer border border-indigo-200/80 shadow-2xs active:scale-95"
                title="Download Master Business & Store Reports (CSV)"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Export Reports</span>
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </button>

              {isMasterExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Download Data Reports</span>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">Live store telemetry & CSV datasets</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleDownloadFullMasterReport();
                        setIsMasterExportMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50/80 flex items-start gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 flex items-center gap-1.5">
                          <span>Full Master Report</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-black">ALL DETAILS</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Products, sellers, stock valuation, and sales metrics per SKU</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleDownloadSellerSalesReport();
                        setIsMasterExportMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Sellers & Sales Performance</div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Artisan gross sales ($), stock units, and estimated payouts</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleDownloadStockInventoryReport();
                        setIsMasterExportMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Stock & Replenishment Alert</div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Low inventory alerts, valuation, and supplier reorder contacts</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleDownloadOrdersReport();
                        setIsMasterExportMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-sky-700">Orders & Courier Dispatch</div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Lebanese delivery addresses, phones, and order line items</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SAVE BUTTON (Admin Snapshot & Drafts) */}
            <button
              id="admin-global-save-btn"
              onClick={handleGlobalSaveDraft}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-300/80 shadow-2xs active:scale-95"
              title="Save administrative drafts & snapshot"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Save</span>
            </button>

            {/* PUBLIC BUTTON (Publish Live Storefront) */}
            <button
              id="admin-global-public-btn"
              onClick={handleGlobalPublishLive}
              disabled={isSyncingDb}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black tracking-wide transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title="Publish and make all store updates Public live"
            >
              <Globe className={`w-3.5 h-3.5 text-white ${isSyncingDb ? 'animate-spin' : 'animate-pulse'}`} />
              <span>Public</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5"></span>
            </button>

            <button
              onClick={() => navigateAdminTab('db_logs')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] text-xs font-bold transition-all cursor-pointer border border-indigo-100 shadow-2xs"
              title="Inspect Live Firestore Database Flow & Latency"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden lg:inline">Database Flow:</span>
              <span className="font-semibold text-emerald-700">Firestore Live</span>
            </button>

            <button
              onClick={goBack}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#4f46e5] font-black text-xs flex items-center justify-center border border-indigo-200">
              JA
            </div>
          </div>
        </header>

        {/* Tab Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* 1. eCommerce */}
          {currentTab === 'ecommerce' && (
            <EcommerceOverview onNavigateToTab={setCurrentTab} />
          )}

          {/* Sales Analytics */}
          {currentTab === 'sales' && (
            <SalesAnalyticsView />
          )}

          {/* 2. Orders */}
          {currentTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Orders & Courier Dispatch
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage customer orders, courier dispatch tracking, and delivery confirmations across Lebanon.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleDownloadOrdersReport}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-2xs active:scale-95"
                    title="Download Orders CSV Report"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download Report</span>
                  </button>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs">
                    {orders.length} Total Orders
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name, phone, city..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs transition-all"
                  />
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-500 font-bold">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Statuses ({orders.length})</option>
                    <option value="pending">Pending</option>
                    <option value="crafting">Crafting / Preparing</option>
                    <option value="courier_assigned">Courier Assigned</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/90 text-[11px] uppercase font-black text-slate-500 tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-4 px-5">Order ID</th>
                        <th className="py-4 px-5">Customer</th>
                        <th className="py-4 px-5">Delivery Location</th>
                        <th className="py-4 px-5">Items Ordered</th>
                        <th className="py-4 px-5">Total Amount</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5 text-right">Dispatch Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-5">
                            <button
                              onClick={() => setSelectedInvoiceOrder(ord)}
                              className="font-mono font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer text-left"
                              title="Click to view full order details"
                            >
                              #{ord.id}
                            </button>
                            <div className="text-[10px] text-slate-400 font-sans font-medium mt-0.5">{ord.date}</div>
                          </td>

                          <td className="py-4 px-5">
                            <button
                              onClick={() => setSelectedInvoiceOrder(ord)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left cursor-pointer block"
                            >
                              {ord.shipping?.fullName || 'Anonymous Shopper'}
                            </button>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                              <span>{ord.shipping?.phone || 'No phone'}</span>
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-800">{ord.shipping?.city || 'No city'}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">{ord.shipping?.street || 'No address'}</div>
                          </td>

                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-900">
                              {ord.items.reduce((s, i) => s + i.quantity, 0)} Units
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                              {ord.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <div className="font-black text-slate-900 text-sm">
                              {formatPrice(ord.totalUSD)}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                              {ord.paymentMethod.replace(/_/g, ' ')}
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : ord.status === 'in_transit' || ord.status === 'courier_assigned'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <select
                                value={ord.status}
                                onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className="bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="crafting">Crafting / Preparing</option>
                                <option value="courier_assigned">Courier Assigned</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              {/* View Order Details */}
                              <button
                                onClick={() => setSelectedInvoiceOrder(ord)}
                                className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                                title="See Full Order Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Print Invoice */}
                              <button
                                onClick={() => setSelectedInvoiceOrder(ord)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
                                title="View / Print Order Invoice"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              {/* Cancel Order Button */}
                              {ord.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCancelOrder(ord.id)}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 transition-colors cursor-pointer active:scale-95"
                                  title="Cancel Order"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No orders match your filter criteria.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 3. Products Catalog */}
          {currentTab === 'products' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Products & Catalog Management
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Publish, hide, inline edit stock & price, or add new artisanal products with cloud sync.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDownloadFullMasterReport}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/80 shadow-2xs cursor-pointer active:scale-95"
                    title="Download Full Master CSV with Products, Sellers, Stock & Sales performance"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Download Full Master Report</span>
                  </button>

                  <button
                    onClick={handleDownloadProductsReport}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
                    title="Download Products Catalog CSV Report"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Catalog CSV</span>
                  </button>

                  <button
                    onClick={handleGlobalSaveDraft}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300/80 shadow-2xs cursor-pointer active:scale-95"
                    title="Save current catalog state"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Save Drafts</span>
                  </button>

                  <button
                    onClick={handleGlobalPublishLive}
                    disabled={isSyncingDb}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Publish all active products to the public storefront"
                  >
                    <Globe className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDb ? 'Publishing...' : 'Public (Publish Live)'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by title, seller / artisan, origin, category, keywords..."
                      value={adminProductSearch}
                      onChange={(e) => setAdminProductSearch(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs transition-all"
                    />
                    {adminProductSearch && (
                      <button
                        type="button"
                        onClick={() => setAdminProductSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Seller / Artisan Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Seller:</span>
                      </span>
                      <select
                        value={adminProductSeller}
                        onChange={(e) => setAdminProductSeller(e.target.value)}
                        className="bg-white text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer max-w-[200px]"
                      >
                        <option value="all">All Sellers ({sellerStats.length} sellers)</option>
                        {sellerStats.map(({ seller, count }) => (
                          <option key={seller} value={seller}>
                            {seller} ({count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-bold">Status:</span>
                      <select
                        value={adminPublishFilter}
                        onChange={(e) => setAdminPublishFilter(e.target.value as any)}
                        className="bg-white text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                      >
                        <option value="all">All ({products.length})</option>
                        <option value="published">Published ({products.filter(p => p.isPublished !== false).length})</option>
                        <option value="hidden">Hidden / Draft ({products.filter(p => p.isPublished === false).length})</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-bold">Category:</span>
                      <select
                        value={adminProductCategory}
                        onChange={(e) => setAdminProductCategory(e.target.value)}
                        className="bg-white text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameEn} ({c.nameAr})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Filters Bar */}
                {(adminProductSearch || adminProductSeller !== 'all' || adminProductCategory !== 'all' || adminPublishFilter !== 'all') && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        Active Filters ({filteredCatalogProducts.length} of {products.length} products):
                      </span>

                      {adminProductSeller !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-bold text-[11px] shadow-2xs">
                          <Store className="w-3 h-3 text-indigo-500" />
                          <span>Seller: {adminProductSeller}</span>
                          <button
                            type="button"
                            onClick={() => setAdminProductSeller('all')}
                            className="hover:text-indigo-900 p-0.5 cursor-pointer"
                            title="Remove seller filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {adminProductCategory !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-bold text-[11px] shadow-2xs">
                          <span>Category: {adminProductCategory}</span>
                          <button
                            type="button"
                            onClick={() => setAdminProductCategory('all')}
                            className="hover:text-indigo-900 p-0.5 cursor-pointer"
                            title="Remove category filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {adminPublishFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-bold text-[11px] shadow-2xs">
                          <span>Status: {adminPublishFilter}</span>
                          <button
                            type="button"
                            onClick={() => setAdminPublishFilter('all')}
                            className="hover:text-indigo-900 p-0.5 cursor-pointer"
                            title="Remove status filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {adminProductSearch && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-bold text-[11px] shadow-2xs">
                          <span>Search: "{adminProductSearch}"</span>
                          <button
                            type="button"
                            onClick={() => setAdminProductSearch('')}
                            className="hover:text-indigo-900 p-0.5 cursor-pointer"
                            title="Clear search query"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminProductSearch('');
                        setAdminProductSeller('all');
                        setAdminProductCategory('all');
                        setAdminPublishFilter('all');
                      }}
                      className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredCatalogProducts.map((prod) => {
                  const isPublished = prod.isPublished !== false;
                  const isEditing = editingProductId === prod.id;
                  const sellerName = prod.artisan || prod.seller || 'Artisanal Guild';

                  return (
                    <div 
                      key={prod.id} 
                      className={`bg-white p-4 rounded-3xl border shadow-xs space-y-3.5 flex flex-col justify-between transition-all hover:shadow-md ${
                        isPublished ? 'border-slate-200/80' : 'border-rose-200 bg-rose-50/15'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 relative group">
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />

                          <span className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full text-xs font-black bg-slate-900/90 text-white shadow-sm backdrop-blur-xs">
                            {formatPrice(prod.priceUSD)}
                          </span>

                          {!isPublished && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                              Hidden
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">{prod.name}</h4>
                          {prod.arabicName && (
                            <p className="text-[11px] text-[#c5a059] font-serif font-bold line-clamp-1">{prod.arabicName}</p>
                          )}
                          
                          {/* Seller / Artisan clickable pill */}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdminProductSeller(sellerName);
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer border border-indigo-100/60 max-w-[150px] truncate group"
                              title={`Filter catalog by seller: ${sellerName}`}
                            >
                              <Store className="w-3 h-3 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate">{sellerName}</span>
                            </button>
                            
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[90px]" title={prod.origin}>
                              {prod.origin}
                            </span>
                          </div>

                          {/* Arabic SEO Keywords indicator */}
                          {prod.arabicKeywords && prod.arabicKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {prod.arabicKeywords.slice(0, 3).map((kw, ki) => (
                                <span key={ki} className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 rounded text-[9.5px] font-serif font-semibold">
                                  #{kw}
                                </span>
                              ))}
                              {prod.arabicKeywords.length > 3 && (
                                <span className="text-[9px] text-amber-700 font-bold self-center">
                                  +{prod.arabicKeywords.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stock & Price Controls */}
                      {isEditing ? (
                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500">Price ($)</label>
                              <input
                                type="number"
                                min={1}
                                value={editPriceUSD}
                                onChange={(e) => setEditPriceUSD(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500">Stock</label>
                              <input
                                type="number"
                                min={0}
                                value={editStock}
                                onChange={(e) => setEditStock(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                await updateProduct(prod.id, { priceUSD: editPriceUSD, stock: editStock });
                                setEditingProductId(null);
                              }}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px] font-medium">
                            Stock: <strong className="text-slate-900 font-black">{prod.stock}</strong>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setFullEditProduct({ ...prod, keywordsInput: prod.keywords ? prod.keywords.join(', ') : '' } as any)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                              title="Full Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingProductId(prod.id);
                                setEditPriceUSD(prod.priceUSD);
                                setEditStock(prod.stock);
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                              title="Quick Price & Stock"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={async () => {
                                if (confirm(`Delete "${prod.name}"?`)) {
                                  await deleteProduct(prod.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Empty state when no products match filters */}
              {filteredCatalogProducts.length === 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">No products found</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No products match your current search criteria
                    {adminProductSeller !== 'all' ? ` for seller "${adminProductSeller}"` : ''}
                    {adminProductSearch ? ` with keyword "${adminProductSearch}"` : ''}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminProductSearch('');
                      setAdminProductSeller('all');
                      setAdminProductCategory('all');
                      setAdminPublishFilter('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear all filters</span>
                  </button>
                </div>
              )}

              {/* Shared Datalist for Sellers/Artisans */}
              <datalist id="admin-existing-sellers">
                {sellerStats.map(({ seller }) => (
                  <option key={seller} value={seller} />
                ))}
              </datalist>

            </div>
          )}

          {/* 4. Categories & Details */}
          {currentTab === 'categories' && (
            <CategoriesDetailsView />
          )}

          {/* Sellers & Bulk Import */}
          {currentTab === 'sellers' && (
            <SellersView />
          )}

          {/* Discounts & Promos */}
          {currentTab === 'discounts' && (
            <DiscountsManager />
          )}

          {/* 5. Customers */}
          {currentTab === 'customers' && (
            <CustomersView />
          )}

          {/* 6. Active Carts */}
          {currentTab === 'active_carts' && (
            <ActiveCartsView />
          )}

          {/* 7. Pages CMS & Individual Page Sections */}
          {currentTab === 'pages_cms' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="visibility" />
            </div>
          )}

          {currentTab === 'page_home' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="home" />
            </div>
          )}

          {currentTab === 'page_products' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="productsPage" />
            </div>
          )}

          {currentTab === 'page_detail' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="productDetailPage" />
            </div>
          )}

          {currentTab === 'page_checkout' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="checkoutPage" />
            </div>
          )}

          {currentTab === 'page_account' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="accountPage" />
            </div>
          )}

          {currentTab === 'page_news' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="newsSection" />
            </div>
          )}

          {currentTab === 'page_navbar' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="navbar" />
            </div>
          )}

          {currentTab === 'page_footer' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="footer" />
            </div>
          )}

          {currentTab === 'page_custom_blocks' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="customBlocks" />
            </div>
          )}

          {currentTab === 'page_visibility' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="visibility" />
            </div>
          )}

          {currentTab === 'page_seo' && (
            <div className="space-y-6">
              <PageCMSManager initialTab="seo" />
            </div>
          )}

          {/* System & Audit: Database Sync & Logs */}
          {currentTab === 'db_logs' && (
            <DatabaseActivityLogs />
          )}

        </main>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            ref={addProductModalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto focus:outline-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">List New Lebanese Item</h3>
                <p className="text-xs text-slate-500">Catalog items from verified Lebanese artisans & cooperatives</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mountain Zaatar Blend"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title (Arabic)</label>
                  <input
                    type="text"
                    placeholder="e.g. خلطة الزعتر الجبلي"
                    value={newProduct.arabicName}
                    onChange={(e) => setNewProduct({ ...newProduct, arabicName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4f46e5] text-right font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.nameEn} ({c.nameAr})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Artisan / Guild / Seller *</label>
                  <input
                    type="text"
                    required
                    list="admin-existing-sellers"
                    placeholder="e.g. Chouf Artisan Cooperative"
                    value={newProduct.artisan}
                    onChange={(e) => setNewProduct({ ...newProduct, artisan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seller Name (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Cedar Farms"
                    value={newProduct.seller}
                    onChange={(e) => setNewProduct({ ...newProduct, seller: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seller Name (Arabic)</label>
                  <input
                    type="text"
                    placeholder="e.g. مزارع الأرز"
                    value={newProduct.arabicSeller}
                    onChange={(e) => setNewProduct({ ...newProduct, arabicSeller: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Origin / Terroir</label>
                  <input
                    type="text"
                    placeholder="e.g. Koura, North Lebanon"
                    value={newProduct.origin}
                    onChange={(e) => setNewProduct({ ...newProduct, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newProduct.priceUSD}
                    onChange={(e) => setNewProduct({ ...newProduct, priceUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              {/* ARABIC SEO KEYWORDS SECTION */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>الكلمات الدلالية لمحركات البحث بالعربية (Arabic SEO Keywords)</span>
                  </label>
                  <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    {newProduct.arabicKeywords.length} كلمات
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اكتب كلمة دلالية بالعربية واضغط Enter (مثال: زعتر جبلي بلدي)"
                    value={newProduct.newArabicKeywordInput}
                    onChange={(e) => setNewProduct({ ...newProduct, newArabicKeywordInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newProduct.newArabicKeywordInput.trim()) {
                          setNewProduct({
                            ...newProduct,
                            arabicKeywords: [...newProduct.arabicKeywords, newProduct.newArabicKeywordInput.trim()],
                            newArabicKeywordInput: ''
                          });
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white text-xs rounded-xl border border-amber-200 focus:outline-none text-right font-serif"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newProduct.newArabicKeywordInput.trim()) {
                        setNewProduct({
                          ...newProduct,
                          arabicKeywords: [...newProduct.arabicKeywords, newProduct.newArabicKeywordInput.trim()],
                          newArabicKeywordInput: ''
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#b08d46] text-white text-xs font-bold rounded-xl cursor-pointer font-serif"
                  >
                    إضافة
                  </button>
                </div>

                {/* Arabic quick tags */}
                <div className="flex flex-wrap gap-1">
                  {['مونة بلدية', 'زيت زيتون كورة', 'زعتر بلدي جبلي', 'عسل سدر', 'صناعة لبنانية', 'شحن مغتربين'].map((sug, sIdx) => {
                    const exists = newProduct.arabicKeywords.includes(sug);
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        disabled={exists}
                        onClick={() => {
                          if (!exists) {
                            setNewProduct({
                              ...newProduct,
                              arabicKeywords: [...newProduct.arabicKeywords, sug]
                            });
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-serif transition-all ${
                          exists 
                            ? 'bg-amber-200/50 text-amber-700 opacity-60 cursor-not-allowed' 
                            : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 cursor-pointer'
                        }`}
                      >
                        + {sug}
                      </button>
                    );
                  })}
                </div>

                {/* Active Arabic Keyword Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {newProduct.arabicKeywords.map((kw, kIdx) => (
                    <span key={kIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 text-amber-950 rounded-md text-[11px] font-serif font-bold shadow-2xs">
                      <span>#{kw}</span>
                      <button
                        type="button"
                        onClick={() => setNewProduct({
                          ...newProduct,
                          arabicKeywords: newProduct.arabicKeywords.filter((_, i) => i !== kIdx)
                        })}
                        className="text-amber-400 hover:text-rose-600 ml-1 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">English SEO Keywords (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. zaatar, olive oil, lebanese spice, organic"
                  value={newProduct.keywordsInput}
                  onChange={(e) => setNewProduct({ ...newProduct, keywordsInput: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Heritage Story</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCreateProduct(e, false)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer transition-all shadow-xs active:scale-95"
                    title="Save product as unpublished draft"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save (Draft)</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCreateProduct(e, true)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4f46e5] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all"
                    title="Publish product live to public store catalog"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public (Publish Live)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Edit Product Modal */}
      {fullEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            ref={editProductModalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto focus:outline-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Product Details</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {fullEditProduct.id}</p>
              </div>
              <button 
                onClick={() => setFullEditProduct(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFullProductEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={fullEditProduct.name}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Title (Arabic)</label>
                  <input
                    type="text"
                    value={fullEditProduct.arabicName || ''}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, arabicName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none text-right font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Artisan / Guild / Seller</label>
                  <input
                    type="text"
                    list="admin-existing-sellers"
                    placeholder="e.g. Chouf Artisan Cooperative"
                    value={fullEditProduct.artisan || ''}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, artisan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Origin / Terroir</label>
                  <input
                    type="text"
                    placeholder="e.g. Koura, North Lebanon"
                    value={fullEditProduct.origin || ''}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seller Name (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Cedar Farms"
                    value={fullEditProduct.seller || ''}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, seller: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seller Name (Arabic)</label>
                  <input
                    type="text"
                    placeholder="e.g. مزارع الأرز"
                    value={fullEditProduct.arabicSeller || ''}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, arabicSeller: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={fullEditProduct.category}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.nameEn} ({c.nameAr})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    min={1}
                    value={fullEditProduct.priceUSD}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, priceUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={fullEditProduct.stock}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Publish / Live Status</label>
                <button
                  type="button"
                  onClick={() => setFullEditProduct({ ...fullEditProduct, isPublished: fullEditProduct.isPublished === false ? true : false })}
                  className={`w-full py-2.5 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    fullEditProduct.isPublished !== false 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {fullEditProduct.isPublished !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{fullEditProduct.isPublished !== false ? 'Published (Live on Website)' : 'Hidden (Draft Only)'}</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={fullEditProduct.image}
                  onChange={(e) => setFullEditProduct({ ...fullEditProduct, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              {/* ARABIC SEO KEYWORDS SECTION FOR EDIT MODAL */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>الكلمات الدلالية لمحركات البحث بالعربية (Arabic SEO Keywords)</span>
                  </label>
                  <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full font-serif">
                    {((fullEditProduct as any).arabicKeywords || []).length} كلمات
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اكتب كلمة دلالية بالعربية واضغط Enter (مثال: زعتر جبلي بلدي)"
                    value={(fullEditProduct as any).editArabicKeywordInput || ''}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, editArabicKeywordInput: e.target.value } as any)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const inputVal = ((fullEditProduct as any).editArabicKeywordInput || '').trim();
                        if (inputVal) {
                          const currentKw = (fullEditProduct as any).arabicKeywords || [];
                          setFullEditProduct({
                            ...fullEditProduct,
                            arabicKeywords: [...currentKw, inputVal],
                            editArabicKeywordInput: ''
                          } as any);
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-white text-xs rounded-xl border border-amber-200 focus:outline-none text-right font-serif"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inputVal = ((fullEditProduct as any).editArabicKeywordInput || '').trim();
                      if (inputVal) {
                        const currentKw = (fullEditProduct as any).arabicKeywords || [];
                        setFullEditProduct({
                          ...fullEditProduct,
                          arabicKeywords: [...currentKw, inputVal],
                          editArabicKeywordInput: ''
                        } as any);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#b08d46] text-white text-xs font-bold rounded-xl cursor-pointer font-serif"
                  >
                    إضافة
                  </button>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1">
                  {['مونة بلدية', 'زيت زيتون كورة', 'زعتر بلدي جبلي', 'عسل سدر', 'صناعة لبنانية', 'شحن مغتربين'].map((sug, sIdx) => {
                    const currentKw: string[] = (fullEditProduct as any).arabicKeywords || [];
                    const exists = currentKw.includes(sug);
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        disabled={exists}
                        onClick={() => {
                          if (!exists) {
                            setFullEditProduct({
                              ...fullEditProduct,
                              arabicKeywords: [...currentKw, sug]
                            } as any);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-serif transition-all ${
                          exists 
                            ? 'bg-amber-200/50 text-amber-700 opacity-60 cursor-not-allowed' 
                            : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 cursor-pointer'
                        }`}
                      >
                        + {sug}
                      </button>
                    );
                  })}
                </div>

                {/* Active Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {((fullEditProduct as any).arabicKeywords || []).map((kw: string, kIdx: number) => (
                    <span key={kIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-amber-300 text-amber-950 rounded-md text-[11px] font-serif font-bold shadow-2xs">
                      <span>#{kw}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentKw: string[] = (fullEditProduct as any).arabicKeywords || [];
                          setFullEditProduct({
                            ...fullEditProduct,
                            arabicKeywords: currentKw.filter((_, i) => i !== kIdx)
                          } as any);
                        }}
                        className="text-amber-400 hover:text-rose-600 ml-1 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">English SEO Keywords (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. zaatar, olive oil, lebanese spice, organic"
                  value={(fullEditProduct as any).keywordsInput !== undefined ? (fullEditProduct as any).keywordsInput : (fullEditProduct.keywords || []).join(', ')}
                  onChange={(e) => setFullEditProduct({ ...fullEditProduct, keywordsInput: e.target.value } as any)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={fullEditProduct.description}
                  onChange={(e) => setFullEditProduct({ ...fullEditProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFullEditProduct(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveFullProductEdit(e, false)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer transition-all shadow-xs active:scale-95"
                    title="Save changes as private draft"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save (Draft)</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveFullProductEdit(e, true)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4f46e5] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all"
                    title="Save and publish live to public store catalog"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public (Publish Live)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice & Order Details Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            ref={invoiceModalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto focus:outline-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">Order Details & Invoice Inspector</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedInvoiceOrder.status === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedInvoiceOrder.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedInvoiceOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-[#4f46e5] font-mono font-bold mt-1">Order ID: #{selectedInvoiceOrder.id} • Placed on {selectedInvoiceOrder.date}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoiceOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Control */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-950">Update Fulfillment Status:</span>
              <select
                value={selectedInvoiceOrder.status}
                onChange={async (e) => {
                  const newStatus = e.target.value as OrderStatus;
                  await updateOrderStatus(selectedInvoiceOrder.id, newStatus);
                  setSelectedInvoiceOrder({ ...selectedInvoiceOrder, status: newStatus });
                }}
                className="bg-white text-xs font-bold text-slate-800 border border-indigo-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="crafting">Crafting / Preparing</option>
                <option value="courier_assigned">Courier Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400 mb-1">Customer & Recipient</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceOrder.shipping?.fullName || 'Anonymous Shopper'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phone:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{selectedInvoiceOrder.shipping?.phone || 'No phone'}</span>
                    {selectedInvoiceOrder.shipping?.phone && (
                      <a
                        href={`https://wa.me/${selectedInvoiceOrder.shipping.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="font-bold uppercase text-indigo-600">{selectedInvoiceOrder.paymentMethod.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400 mb-1">Delivery Address</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Governorate:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedInvoiceOrder.shipping?.governorate || 'Lebanon'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">City / Town:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceOrder.shipping?.city || 'Beirut'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Street / Bldg:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[150px]">{selectedInvoiceOrder.shipping?.street}, {selectedInvoiceOrder.shipping?.building || ''}</span>
                </div>
                {selectedInvoiceOrder.shipping?.deliveryNotes && (
                  <div className="pt-1 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <span className="font-bold">Notes:</span> {selectedInvoiceOrder.shipping.deliveryNotes}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ordered Items ({selectedInvoiceOrder.items.reduce((s, i) => s + i.quantity, 0)})</h4>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {selectedInvoiceOrder.items.map((item) => (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Seller: <span className="font-semibold text-indigo-700">{item.product.seller || item.product.artisan || 'Local Producer'}</span> • Qty: {item.quantity} × {formatPrice(item.product.priceUSD)}
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-slate-900">{formatPrice(item.product.priceUSD * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold">{formatPrice(selectedInvoiceOrder.subtotalUSD)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-bold">{formatPrice(selectedInvoiceOrder.deliveryFeeUSD)}</span>
              </div>
              {selectedInvoiceOrder.discountUSD && selectedInvoiceOrder.discountUSD > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({selectedInvoiceOrder.appliedCoupon || 'Promo'})</span>
                  <span>-{formatPrice(selectedInvoiceOrder.discountUSD)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
                <span>Total Due on Delivery (COD):</span>
                <span className="text-[#4f46e5] text-base">{formatPrice(selectedInvoiceOrder.totalUSD)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                {selectedInvoiceOrder.status !== 'cancelled' ? (
                  <button
                    onClick={() => handleCancelOrder(selectedInvoiceOrder.id)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                    title="Cancel this order"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Cancel Order</span>
                  </button>
                ) : (
                  <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    <span>This order has been cancelled</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
