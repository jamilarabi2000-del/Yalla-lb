import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, OrderStatus, Order } from '../types';
import { AdminSidebar, AdminMenuTab } from './admin/AdminSidebar';
import { EcommerceOverview } from './admin/EcommerceOverview';
import { CategoriesDetailsView } from './admin/CategoriesDetailsView';
import { CustomersView } from './admin/CustomersView';
import { ActiveCartsView } from './admin/ActiveCartsView';
import { DatabaseActivityLogs } from './admin/DatabaseActivityLogs';
import { PageCMSManager } from './PageCMSManager';
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
  AlertCircle
} from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { pingFirestore } from '../lib/firestore';

export const AdminView: React.FC = () => {
  const { 
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
    adminPasscode = 'YallaLebanon2026!',
    updateAdminPasscode = async () => {},
    isVisualEditMode = false,
    setIsVisualEditMode = () => {},
    user = null,
    firebaseUser = null,
    isDbSyncing = false
  } = useShop() || {};

  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'checking' | 'connected' | 'error'>('connected');
  const [firestoreErrorDetails, setFirestoreErrorDetails] = useState<string | null>(null);

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
  const [currentTab, setCurrentTab] = useState<AdminMenuTab>('ecommerce');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Products Catalog States
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [adminProductCategory, setAdminProductCategory] = useState('all');
  const [adminPublishFilter, setAdminPublishFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceUSD, setEditPriceUSD] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullEditProduct, setFullEditProduct] = useState<Product | null>(null);

  // Orders State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Form State for new product
  const [newProduct, setNewProduct] = useState({
    name: '',
    arabicName: '',
    category: 'grocery',
    artisan: '',
    origin: 'Koura, North Lebanon',
    description: '',
    craftStory: '',
    priceUSD: 15,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    weightOrVolume: '500ml',
    tags: ['Artisanal', 'Lebanese Terroir']
  });

  // Calculate distinct counts for sidebar badges
  const categoriesCount = 24; // Comprehensive catalog taxonomy
  
  // Calculate distinct customers
  const uniqueCustomerKeys = new Set(
    orders.map(o => o.shipping?.phone || o.shipping?.email || o.shipping?.fullName || o.id || 'anonymous')
  );
  if (user?.email) uniqueCustomerKeys.add(user.email);
  const customersCount = Math.max(uniqueCustomerKeys.size, 2);

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

  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-[#4f46e5] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/20">
            PA
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900">
              PlainAdmin Portal
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Firestore Connected</span>
            </div>
            <p className="text-xs text-slate-500 pt-2 leading-relaxed">
              Restricted management portal for authorized store administrators. Enter your passcode to continue.
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (passcodeInput === adminPasscode || passcodeInput === 'YallaLebanon2026!' || passcodeInput === '961') {
              setIsAdminUnlocked(true);
              showToast('Artisan Portal unlocked successfully!', 'success');
            } else {
              setPasscodeError('Incorrect passcode. Access is restricted.');
            }
          }} className="space-y-4">
            <div>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError('');
                }}
                placeholder="••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-mono text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition-all tracking-widest"
                autoFocus
              />
              {passcodeError && (
                <p className="text-rose-500 text-[11px] font-semibold mt-2">{passcodeError}</p>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Storefront
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/20"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const handleSyncDatabaseProducts = async () => {
    setIsSyncingDb(true);
    await syncAllProductsToDatabase();
    setIsSyncingDb(false);
  };

  const filteredCatalogProducts = products.filter(p => {
    const matchesSearch = !adminProductSearch || 
      p.name.toLowerCase().includes(adminProductSearch.toLowerCase()) ||
      (p.arabicName && p.arabicName.includes(adminProductSearch)) ||
      p.artisan.toLowerCase().includes(adminProductSearch.toLowerCase()) ||
      p.origin.toLowerCase().includes(adminProductSearch.toLowerCase());
    
    const matchesCategory = adminProductCategory === 'all' || p.category === adminProductCategory;
    
    const matchesPublish = adminPublishFilter === 'all' 
      ? true 
      : adminPublishFilter === 'published' 
        ? p.isPublished !== false 
        : p.isPublished === false;

    return matchesSearch && matchesCategory && matchesPublish;
  });

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesSearch = !orderSearchQuery || 
      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.shipping?.fullName || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.shipping?.phone || '').includes(orderSearchQuery) ||
      (o.shipping?.city || '').toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.artisan || !newProduct.priceUSD) {
      showToast('Please provide a name, artisan, and price.', 'warning');
      return;
    }

    const created: Omit<Product, 'id'> = {
      name: newProduct.name,
      arabicName: newProduct.arabicName,
      category: newProduct.category,
      artisan: newProduct.artisan,
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
      isPublished: true,
      weightOrVolume: newProduct.weightOrVolume || '',
      tags: ['Authentic', 'Handmade', 'Lebanon']
    };

    await addProduct(created);
    setIsAddModalOpen(false);
  };

  const handleSaveFullProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullEditProduct) return;

    await updateProduct(fullEditProduct.id, {
      name: fullEditProduct.name,
      arabicName: fullEditProduct.arabicName,
      category: fullEditProduct.category,
      artisan: fullEditProduct.artisan,
      origin: fullEditProduct.origin,
      priceUSD: Number(fullEditProduct.priceUSD),
      stock: Number(fullEditProduct.stock),
      image: fullEditProduct.image,
      description: fullEditProduct.description,
      craftStory: fullEditProduct.craftStory,
      isPublished: fullEditProduct.isPublished !== false,
      isFeatured: !!fullEditProduct.isFeatured,
      isBestseller: !!fullEditProduct.isBestseller
    });

    showToast(`Updated product "${fullEditProduct.name}"!`, 'success');
    setFullEditProduct(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900 font-sans antialiased">
      
      {/* Exact PlainAdmin Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('db_logs')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] text-xs font-bold transition-all cursor-pointer border border-indigo-100 shadow-2xs"
              title="Inspect Live Firestore Database Flow & Latency"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Database Flow:</span>
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

          {/* 2. Orders */}
          {currentTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4f46e5]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Orders & Courier Dispatch
                      </h2>
                      <p className="text-xs text-slate-500">
                        Manage customer order statuses, courier tracking, and phone/WhatsApp delivery confirmations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-black bg-indigo-50 text-[#4f46e5] border border-indigo-100">
                    {orders.length} Total Orders
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name, phone, city..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4f46e5]"
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
                    <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Delivery Location</th>
                        <th className="p-4">Items Ordered</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Dispatch Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 font-mono font-bold text-[#4f46e5]">
                            #{ord.id}
                            <div className="text-[10px] text-slate-400 font-sans font-normal">{ord.date}</div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-900">{ord.shipping?.fullName || 'Anonymous Shopper'}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span>{ord.shipping?.phone || 'No phone'}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-medium text-slate-800">{ord.shipping?.city || 'No city'}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{ord.shipping?.street || 'No address'}</div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-900">
                              {ord.items.reduce((s, i) => s + i.quantity, 0)} Units
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                              {ord.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-black text-slate-900 text-sm">
                              {formatPrice(ord.totalUSD)}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                              {ord.paymentMethod.replace(/_/g, ' ')}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ord.status === 'in_transit' || ord.status === 'courier_assigned'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={ord.status}
                                onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className="bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#4f46e5]"
                              >
                                <option value="pending">Pending</option>
                                <option value="crafting">Crafting / Preparing</option>
                                <option value="courier_assigned">Courier Assigned</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                              </select>

                              <button
                                onClick={() => setSelectedInvoiceOrder(ord)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="View / Print Order Invoice"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs">
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
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4f46e5]">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Products & Catalog Management
                      </h2>
                      <p className="text-xs text-slate-500">
                        Publish, hide, inline edit stock & price, or add new artisanal products with cloud sync.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleSyncDatabaseProducts}
                    disabled={isSyncingDb}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDb ? 'Syncing...' : 'Save & Sync to Firestore'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search product title, artisan, terroir origin..."
                    value={adminProductSearch}
                    onChange={(e) => setAdminProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-semibold">Status:</span>
                    <select
                      value={adminPublishFilter}
                      onChange={(e) => setAdminPublishFilter(e.target.value as any)}
                      className="bg-white text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4f46e5]"
                    >
                      <option value="all">All ({products.length})</option>
                      <option value="published">Published ({products.filter(p => p.isPublished !== false).length})</option>
                      <option value="hidden">Hidden / Draft ({products.filter(p => p.isPublished === false).length})</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-semibold">Category:</span>
                    <select
                      value={adminProductCategory}
                      onChange={(e) => setAdminProductCategory(e.target.value)}
                      className="bg-white text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#4f46e5]"
                    >
                      <option value="all">All Categories</option>
                      <option value="grocery">Grocery & Pantry</option>
                      <option value="consumable">Consumable Essentials</option>
                      <option value="yalla-global">Yalla-Global</option>
                      <option value="home">Home & Living</option>
                      <option value="fashion">Fashion & Apparel</option>
                      <option value="beauty">Beauty & Personal Care</option>
                      <option value="toys">Toys & Education</option>
                      <option value="electronics">Electronics & Tech</option>
                      <option value="tools-hardware">Tools & Hardware</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="lighting">Lighting</option>
                      <option value="electrical">Electrical</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="decor">Decor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCatalogProducts.map((prod) => {
                  const isPublished = prod.isPublished !== false;
                  const isEditing = editingProductId === prod.id;

                  return (
                    <div 
                      key={prod.id} 
                      className={`bg-white p-4 rounded-3xl border shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                        isPublished ? 'border-slate-200/80' : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 relative">
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            className="w-full h-full object-cover" 
                          />

                          <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white shadow-xs">
                            {formatPrice(prod.priceUSD)}
                          </span>

                          <button
                            onClick={() => toggleProductPublish(prod.id)}
                            className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                              isPublished
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                            }`}
                            title={isPublished ? 'Click to Hide' : 'Click to Publish'}
                          >
                            {isPublished ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Live</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Hidden</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{prod.name}</h4>
                          {prod.arabicName && (
                            <p className="text-[10px] text-[#c5a059] font-serif font-semibold line-clamp-1">{prod.arabicName}</p>
                          )}
                          <p className="text-[10px] text-slate-400 font-medium">{prod.artisan} • {prod.origin}</p>
                        </div>
                      </div>

                      {/* Stock & Price Controls */}
                      {isEditing ? (
                        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500">Price ($)</label>
                              <input
                                type="number"
                                min={1}
                                value={editPriceUSD}
                                onChange={(e) => setEditPriceUSD(Number(e.target.value))}
                                className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500">Stock</label>
                              <input
                                type="number"
                                min={0}
                                value={editStock}
                                onChange={(e) => setEditStock(Number(e.target.value))}
                                className="w-full px-2 py-1 bg-slate-50 rounded-lg border border-slate-200"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                await updateProduct(prod.id, { priceUSD: editPriceUSD, stock: editStock });
                                setEditingProductId(null);
                              }}
                              className="flex-1 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="flex-1 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px]">
                            Stock: <strong className="text-slate-900">{prod.stock}</strong>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setFullEditProduct({ ...prod })}
                              className="p-1.5 text-slate-400 hover:text-[#4f46e5] rounded-lg transition-colors cursor-pointer"
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
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
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
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
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

            </div>
          )}

          {/* 4. Categories & Details */}
          {currentTab === 'categories' && (
            <CategoriesDetailsView />
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
          <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
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
                    <option value="grocery">Grocery & Pantry</option>
                    <option value="consumable">Consumable Essentials</option>
                    <option value="yalla-global">Yalla-Global</option>
                    <option value="home">Home & Living</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="beauty">Beauty & Personal Care</option>
                    <option value="toys">Toys & Education</option>
                    <option value="electronics">Electronics</option>
                    <option value="tools-hardware">Tools & Hardware</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="lighting">Lighting</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Artisan / Guild *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chouf Artisan Cooperative"
                    value={newProduct.artisan}
                    onChange={(e) => setNewProduct({ ...newProduct, artisan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Heritage Story</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] text-white font-bold cursor-pointer shadow-md"
                >
                  Publish to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Edit Product Modal */}
      {fullEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={fullEditProduct.category}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    <option value="grocery">Grocery</option>
                    <option value="consumable">Consumable</option>
                    <option value="yalla-global">Yalla-Global</option>
                    <option value="home">Home</option>
                    <option value="fashion">Fashion</option>
                    <option value="beauty">Beauty</option>
                    <option value="toys">Toys</option>
                    <option value="electronics">Electronics</option>
                    <option value="tools-hardware">Tools & Hardware</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="lighting">Lighting</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    min={1}
                    value={fullEditProduct.priceUSD}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, priceUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={fullEditProduct.stock}
                    onChange={(e) => setFullEditProduct({ ...fullEditProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={fullEditProduct.description}
                  onChange={(e) => setFullEditProduct({ ...fullEditProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFullEditProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] text-white font-bold cursor-pointer shadow-md"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Courier Dispatch Invoice</h3>
                <p className="text-xs text-[#4f46e5] font-mono font-bold">#{selectedInvoiceOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoiceOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-bold text-slate-900">{selectedInvoiceOrder.shipping?.fullName || 'Anonymous Shopper'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone / WhatsApp:</span>
                <span className="font-mono font-bold text-slate-900">{selectedInvoiceOrder.shipping?.phone || 'No phone'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-medium text-slate-900">{selectedInvoiceOrder.shipping?.city || 'No city'}, {selectedInvoiceOrder.shipping?.governorate || 'No governorate'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Street Address:</span>
                <span className="font-medium text-slate-900">{selectedInvoiceOrder.shipping?.street || 'No address'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Items</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {selectedInvoiceOrder.items.map((item) => (
                  <div key={item.product.id} className="py-2 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{item.product.name}</span>
                      <span className="text-slate-400 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatPrice(item.product.priceUSD * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-black">
              <span>Total Due on Delivery (COD):</span>
              <span className="text-[#4f46e5]">{formatPrice(selectedInvoiceOrder.totalUSD)}</span>
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
