import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, OrderStatus } from '../types';
import { PageCMSManager } from './PageCMSManager';
import { 
  ShieldCheck, 
  Plus, 
  Package, 
  TrendingUp, 
  Sparkles,
  DollarSign,
  Truck,
  ArrowLeft,
  Lock,
  KeyRound,
  Edit3,
  Layout,
  Globe,
  Save,
  CheckCircle2,
  FileText,
  Megaphone,
  Home as HomeIcon,
  ShoppingBag as ShoppingBagIcon,
  CreditCard,
  User as UserIcon,
  Newspaper,
  Layers,
  Search,
  Trash2,
  RefreshCw
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { 
    products, 
    orders, 
    formatPrice, 
    updateOrderStatus, 
    addProduct,
    updateProduct,
    deleteProduct,
    syncAllProductsToDatabase,
    showToast,
    goBack,
    t,
    language,
    isAdminUnlocked,
    setIsAdminUnlocked,
    siteContent,
    updateSiteContent
  } = useShop();

  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Admin section tabs
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'cms'>('cms');
  const [cmsPageTab, setCmsPageTab] = useState<'navbar' | 'hero' | 'home' | 'offers' | 'productsPage' | 'checkoutPage' | 'accountPage' | 'newsSection' | 'footer'>('navbar');
  const [cmsForm, setCmsForm] = useState(siteContent);
  const [isCmsSaving, setIsCmsSaving] = useState(false);

  // Admin Catalog States
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [adminProductCategory, setAdminProductCategory] = useState('all');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceUSD, setEditPriceUSD] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

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

  // Sync cmsForm when siteContent changes
  React.useEffect(() => {
    if (siteContent) {
      setCmsForm(siteContent);
    }
  }, [siteContent]);

  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-[#121222] border border-[#c5a059]/40 p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#c5a059]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              {language === 'ar' ? 'بوابة الإدارة محمية' : 'Artisan Portal Protected'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ar' ? 'هذه المنطقة مخصصة للحرفيين والمدراء المصرح لهم فقط. يرجى إدخال كلمة المرور للمتابعة.' : 'This secure directory is restricted to authorized merchants only. Enter password to view.'}
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (passcodeInput === '1234' || passcodeInput.toLowerCase() === 'admin' || passcodeInput === '961') {
              setIsAdminUnlocked(true);
              showToast(
                language === 'ar' ? 'تم فتح بوابة الإدارة!' : 'Artisan Portal unlocked!',
                'success'
              );
            } else {
              setPasscodeError(language === 'ar' ? 'رمز المرور غير صحيح.' : 'Incorrect secure passcode.');
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
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-center text-xl font-mono text-white focus:outline-none focus:border-[#c5a059] transition-all tracking-widest"
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
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
              >
                {t('back')}
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {language === 'ar' ? 'فتح' : 'Unlock'}
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
    return matchesSearch && matchesCategory;
  });

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCmsSaving(true);
    await updateSiteContent(cmsForm);
    setIsCmsSaving(false);
  };

  const totalRevenueUSD = orders.reduce((sum, o) => sum + o.totalUSD, 0);
  const totalItemsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

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
      weightOrVolume: newProduct.weightOrVolume || '',
      tags: ['Authentic', 'Handmade', 'Lebanon']
    };

    await addProduct(created);
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] pb-24">
      
      {/* Admin Top Header */}
      <div className="bg-[#121222] border-b border-[#c5a059]/20 pt-6 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <button
            id="admin-page-back-btn"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            <span>{t('back')}</span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'عمليات الإدارة والتنسيق الحرفي' : 'Merchant & Artisan Dispatch Operations'}</span>
            </div>
            <h1 className="text-3xl font-light text-white tracking-tight">
              Yalla.lb <span className="gold-gradient font-serif italic">{language === 'ar' ? 'بوابة إدارة المنتجات' : 'Artisan Portal'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {language === 'ar' ? 'تنسيق طلبات الشحن والتوصيل، إدارة المخزون، والمنتجات الحرفية.' : 'Live courier coordination, artisan stock management, and hyper-local fulfillment.'}
            </p>
          </div>

          <button
            id="admin-add-product-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-widest shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addNewProduct')}</span>
          </button>
        </div>
      </div>
    </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-6 rounded-3xl premium-card space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Total Revenue (USD)</span>
              <DollarSign className="w-4 h-4 text-[#c5a059]" />
            </div>
            <p className="text-2xl font-black text-[#f1d592]">{formatPrice(totalRevenueUSD)}</p>
            <p className="text-[10px] text-emerald-400">Includes Beirut express fees</p>
          </div>

          <div className="p-6 rounded-3xl premium-card space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Active Orders</span>
              <Package className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white">{orders.length}</p>
            <p className="text-[10px] text-slate-400">{orders.filter(o => o.status !== 'delivered').length} awaiting delivery</p>
          </div>

          <div className="p-6 rounded-3xl premium-card space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Live Catalog Items</span>
              <Sparkles className="w-4 h-4 text-[#c5a059]" />
            </div>
            <p className="text-2xl font-black text-white">{products.length} Products</p>
            <p className="text-[10px] text-[#f1d592]">Across 6 Lebanese regions</p>
          </div>

          <div className="p-6 rounded-3xl premium-card space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Items Dispatched</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">{totalItemsSold} Units</p>
            <p className="text-[10px] text-slate-400">Direct artisan support</p>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
          <button
            id="admin-tab-cms"
            onClick={() => setAdminTab('cms')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              adminTab === 'cms'
                ? 'bg-gradient-to-r from-[#c5a059] to-[#d4b36e] text-[#121222] shadow-lg scale-102'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{language === 'ar' ? 'محتوى صفحات الموقع (CMS)' : 'Page CMS & Content Manager'}</span>
          </button>

          <button
            id="admin-tab-orders"
            onClick={() => setAdminTab('orders')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              adminTab === 'orders'
                ? 'bg-gradient-to-r from-[#c5a059] to-[#d4b36e] text-[#121222] shadow-lg scale-102'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{language === 'ar' ? 'الطلبات والشحن' : 'Live Orders & Courier Dispatch'} ({orders.length})</span>
          </button>

          <button
            id="admin-tab-products"
            onClick={() => setAdminTab('products')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              adminTab === 'products'
                ? 'bg-gradient-to-r from-[#c5a059] to-[#d4b36e] text-[#121222] shadow-lg scale-102'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{language === 'ar' ? 'إدارة كتالوج المنتجات' : 'Products & Catalog'} ({products.length})</span>
          </button>
        </div>

        {/* TAB 1: FULL SITE PAGE CMS */}
        {adminTab === 'cms' && (
          <PageCMSManager
            cmsForm={cmsForm}
            setCmsForm={setCmsForm}
            handleSaveCMS={handleSaveCMS}
            isCmsSaving={isCmsSaving}
            language={language}
          />
        )}

        {/* TAB 2: LIVE ORDERS & COURIER DISPATCH MANAGEMENT */}
        {adminTab === 'orders' && (
          <div className="p-6 sm:p-8 rounded-3xl premium-card space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#c5a059]" />
                <span>Live Orders & Courier Dispatching</span>
              </h2>
              <p className="text-xs text-slate-400">
                Update fulfillment status in real-time as motorcycle dispatchers collect goods.
              </p>
            </div>

            {/* Filter orders */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                id="admin-filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#121222] text-xs text-slate-200 border border-[#c5a059]/30 rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="pending">Pending</option>
                <option value="crafting">Crafting</option>
                <option value="courier_assigned">Courier Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer & Contact</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status & Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#f1d592]">
                      #{order.id}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{order.shipping.fullName}</p>
                      <p className="text-[11px] text-[#c5a059] font-mono">{order.shipping.phone}</p>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-slate-300 truncate">{order.shipping.city}, {order.shipping.street}</p>
                      <span className="text-[10px] text-slate-400">{order.shipping.deliverySpeed}</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-white">{order.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {order.items.map(i => i.product.name).join(', ')}
                      </p>
                    </td>

                    <td className="py-4 px-4 font-black text-[#f1d592]">
                      {formatPrice(order.totalUSD)}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.05] border border-white/10 text-slate-300">
                        {order.paymentMethod}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          id={`order-status-select-${order.id}`}
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                            order.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : order.status === 'in_transit' || order.status === 'courier_assigned'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : order.status === 'crafting'
                              ? 'bg-[#c5a059]/20 text-[#f1d592] border-[#c5a059]/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="crafting">Crafting</option>
                          <option value="courier_assigned">Courier Assigned</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
        )}

        {/* TAB 3: PRODUCTS & CATALOG MANAGEMENT */}
        {adminTab === 'products' && (
          <div className="p-6 sm:p-8 rounded-3xl premium-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#c5a059]" />
                    <span>Lebanese Artisan Catalog Items</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#c5a059]/20 text-[#f1d592] border border-[#c5a059]/40">
                    {products.length} Products Live in System
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Manage stock, price, artisans, and database persistence across all products.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="admin-sync-products-db-btn"
                  onClick={handleSyncDatabaseProducts}
                  disabled={isSyncingDb}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  title="Ensure all 55 initial catalog products are saved and synced to the database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDb ? 'Saving to DB...' : 'Save & Sync All 55 to Database'}</span>
                </button>

                <button
                  id="admin-add-product-btn-catalog"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#c5a059] hover:bg-[#d4b36e] text-[#121222] font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-white/10">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by title, artisan, region..."
                  value={adminProductSearch}
                  onChange={(e) => setAdminProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 text-xs text-white placeholder-slate-500 rounded-xl border border-white/10 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Category:</span>
                <select
                  value={adminProductCategory}
                  onChange={(e) => setAdminProductCategory(e.target.value)}
                  className="bg-slate-950 text-xs text-white border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="all">All Categories ({products.length})</option>
                  <option value="grocery">Grocery & Pantry</option>
                  <option value="consumable">Consumable Essentials</option>
                  <option value="yalla-global">Yalla-Global</option>
                  <option value="home">Home & Living</option>
                  <option value="fashion">Fashion & Apparel</option>
                  <option value="beauty">Beauty & Personal Care</option>
                  <option value="electronics">Electronics & Tech</option>
                  <option value="hardware">Tools & Hardware</option>
                  <option value="decor">Decor & Lighting</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCatalogProducts.map((product) => {
                const isEditing = editingProductId === product.id;
                return (
                  <div key={product.id} className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3 relative group">
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-950 relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#c5a059] text-[#121222]">
                        {formatPrice(product.priceUSD)}
                      </span>
                      {product.stock <= 5 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{product.name}</h4>
                      {product.arabicName && (
                        <p className="text-[10px] text-amber-200/80 font-serif line-clamp-1">{product.arabicName}</p>
                      )}
                      <p className="text-[10px] text-[#f1d592]">{product.artisan} • {product.origin}</p>
                    </div>

                    {/* Stock & Price Edit inline or Display */}
                    {isEditing ? (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <label className="text-slate-400 font-bold block">Price ($)</label>
                            <input
                              type="number"
                              min={1}
                              value={editPriceUSD}
                              onChange={(e) => setEditPriceUSD(Number(e.target.value))}
                              className="w-full px-2 py-1 bg-slate-950 text-white border border-[#c5a059]/40 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 font-bold block">Stock</label>
                            <input
                              type="number"
                              min={0}
                              value={editStock}
                              onChange={(e) => setEditStock(Number(e.target.value))}
                              className="w-full px-2 py-1 bg-slate-950 text-white border border-[#c5a059]/40 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              await updateProduct(product.id, { priceUSD: editPriceUSD, stock: editStock });
                              setEditingProductId(null);
                            }}
                            className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] uppercase"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProductId(null)}
                            className="flex-1 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px] uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                        <span className="text-slate-400">Stock: <strong className="text-white">{product.stock} units</strong></span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProductId(product.id);
                              setEditPriceUSD(product.priceUSD);
                              setEditStock(product.stock);
                            }}
                            className="p-1 text-slate-400 hover:text-[#c5a059] transition-colors cursor-pointer"
                            title="Edit Price & Stock"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${product.name}" from database?`)) {
                                await deleteProduct(product.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete product"
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

            {filteredCatalogProducts.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <p className="text-slate-400 text-sm">No products found matching "{adminProductSearch}".</p>
                <button
                  onClick={() => {
                    setAdminProductSearch('');
                    setAdminProductCategory('all');
                  }}
                  className="text-xs text-[#c5a059] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="max-w-xl w-full p-8 rounded-3xl premium-card space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">List New Lebanese Artisan Item</h3>
                <p className="text-xs text-slate-400">Directly catalog creations from verified cooperatives</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Pine Honey"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Arabic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. عسل الصنوبر الملكي"
                    value={newProduct.arabicName}
                    onChange={(e) => setNewProduct({ ...newProduct, arabicName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none text-right font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#121222] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                  >
                    <option value="consumable">Consumable & Pantry Essentials</option>
                    <option value="grocery">Grocery & Artisanal Pantry</option>
                    <option value="electronics">Electronics & Tech</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="home">Home & Living</option>
                    <option value="beauty">Beauty & Skincare</option>
                    <option value="sports">Sports & Outdoors</option>
                    <option value="books">Books & Literature</option>
                    <option value="toys">Toys & Games</option>
                    <option value="yalla-global">Yalla-Global</option>
                    <option value="stationery">Stationery</option>
                    <option value="tools-hardware">Tools & Hardware</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="beauty-personal-care">Beauty & Personal Care</option>
                    <option value="linen-bath">Linen & Bath</option>
                    <option value="houseware">Houseware</option>
                    <option value="digital">Digital</option>
                    <option value="indoor-furniture">Indoor Furniture</option>
                    <option value="outdoor-furniture">Outdoor Furniture</option>
                    <option value="lawn-garden">Lawn & Garden</option>
                    <option value="decor">Decor</option>
                    <option value="lighting">Lighting</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Master Artisan / Guild *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cooperative of Deir El Qamar"
                    value={newProduct.artisan}
                    onChange={(e) => setNewProduct({ ...newProduct, artisan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Origin Village / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Chouf Mountains"
                    value={newProduct.origin}
                    onChange={(e) => setNewProduct({ ...newProduct, origin: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newProduct.priceUSD}
                    onChange={(e) => setNewProduct({ ...newProduct, priceUSD: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Terroir Description & Heritage Story</label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Describe the botanical ingredients, artisan harvesting techniques, and heritage value..."
                  className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-[#c5a059]/30 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-slate-300 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#c5a059] text-[#1a1a2e] font-black uppercase tracking-widest shadow-lg cursor-pointer"
                >
                  Publish to Catalog
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
