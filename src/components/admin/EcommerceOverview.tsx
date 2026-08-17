import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  ArrowUpRight, 
  Layers, 
  Truck,
  CheckCircle2,
  Calendar,
  Globe,
  FileText,
  Home,
  ShoppingBag,
  Search,
  CreditCard,
  User,
  Newspaper,
  Megaphone,
  Sliders
} from 'lucide-react';
import { AdminMenuTab } from './AdminSidebar';
import { RecentActivityWidget } from './RecentActivityWidget';

interface EcommerceOverviewProps {
  onNavigateToTab: (tab: AdminMenuTab) => void;
}

export const EcommerceOverview: React.FC<EcommerceOverviewProps> = ({ onNavigateToTab }) => {
  const { 
    products, 
    orders, 
    cart, 
    cartTotalUSD, 
    formatPrice, 
    syncAllProductsToDatabase, 
    isVisualEditMode, 
    setIsVisualEditMode 
  } = useShop();

  const [isSyncingDb, setIsSyncingDb] = useState(false);

  const totalRevenueUSD = orders.reduce((sum, o) => sum + o.totalUSD, 0);
  const totalItemsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered').length;
  const publishedProductsCount = products.filter(p => p.isPublished !== false).length;

  const handleSyncDatabase = async () => {
    setIsSyncingDb(true);
    await syncAllProductsToDatabase();
    setIsSyncingDb(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#4f46e5] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#4f46e5]" />
            <span>Executive eCommerce Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            PlainAdmin <span className="text-[#4f46e5]">Yalla.lb</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics, order dispatch, catalog synchronization, and live page CMS management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncingDb}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Save and synchronize all products & custom sections to Firestore database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
            <span>{isSyncingDb ? 'Syncing...' : 'Sync to Firestore'}</span>
          </button>

          <button
            onClick={() => setIsVisualEditMode(!isVisualEditMode)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
              isVisualEditMode 
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isVisualEditMode ? 'Visual Mode: ON' : 'Visual Edit Mode'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatPrice(totalRevenueUSD)}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Direct to Lebanese Artisans</span>
          </div>
        </div>

        {/* Orders */}
        <div 
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Orders</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{orders.length}</p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-amber-600 font-semibold">{activeOrdersCount} Pending / In Transit</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4f46e5] transition-colors" />
          </div>
        </div>

        {/* Catalog Items */}
        <div 
          onClick={() => onNavigateToTab('products')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Catalog Items</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{products.length}</p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold">{publishedProductsCount} Published</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4f46e5] transition-colors" />
          </div>
        </div>

        {/* Active Carts */}
        <div 
          onClick={() => onNavigateToTab('active_carts')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:border-indigo-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Carts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{cart.length > 0 ? 1 : 0}</p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-purple-600 font-semibold">{formatPrice(cartTotalUSD)} In Carts</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4f46e5] transition-colors" />
          </div>
        </div>

      </div>

      {/* Two Column Layout: Recent Orders & Quick CMS Switch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Store Dispatches</h3>
              <p className="text-xs text-slate-500">Latest courier orders across Beirut and Lebanese governorates</p>
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="text-xs font-bold text-[#4f46e5] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View All ({orders.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.slice(0, 4).map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      #{ord.id} • {ord.shipping.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {ord.shipping.city}, {ord.shipping.governorate} • {ord.items.length} items
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-slate-900 text-xs">{formatPrice(ord.totalUSD)}</div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Store Health */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#4f46e5]" />
              <span>Lebanon Operations</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="text-slate-600">Exchange Rate</span>
                <span className="font-mono font-bold text-slate-900">89,500 LBP / USD</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="text-slate-600">Beirut Same-Day Express</span>
                <span className="font-bold text-emerald-600">Active (3-6h)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="text-slate-600">Payment Modes</span>
                <span className="font-bold text-slate-800">COD (USD/LBP) + Wish/OMT</span>
              </div>
            </div>
          </div>

          <RecentActivityWidget />
        </div>

      </div>

      {/* Page Content & CMS Quick Management Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-[#4f46e5] text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Direct Page Content Management</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Manage Content for Each Storefront Page
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any page below to instantly customize headlines, banners, guarantees, and visibility.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('pages_cms')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <span>Open Full CMS Studio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Home Page */}
          <div 
            onClick={() => onNavigateToTab('page_home')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                🏠
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Home Page</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Hero title, subtitle, CTA buttons, metrics stats, deals slides, and newsletter copy.
            </p>
          </div>

          {/* Catalog Page */}
          <div 
            onClick={() => onNavigateToTab('page_products')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold text-lg">
                🛍️
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Products Catalog Page</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Catalog banner title, search placeholder text, filters bar, and subtitle.
            </p>
          </div>

          {/* Product Detail Page */}
          <div 
            onClick={() => onNavigateToTab('page_detail')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                🔍
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Product Detail View</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              WhatsApp inquiry button & phone, authenticity guarantee, delivery speed, and return policy.
            </p>
          </div>

          {/* Checkout Page */}
          <div 
            onClick={() => onNavigateToTab('page_checkout')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                💳
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Checkout Page</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Order submission button label, guarantee badges, payment methods copy, and courier terms.
            </p>
          </div>

          {/* Account Page */}
          <div 
            onClick={() => onNavigateToTab('page_account')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                👤
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Account & Profile</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Account portal title, orders history tab text, and patron support links.
            </p>
          </div>

          {/* News & Stories */}
          <div 
            onClick={() => onNavigateToTab('page_news')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
                📰
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">News & Artisan Stories</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Lebanese craft articles, titles, dates, excerpts, and reading times.
            </p>
          </div>

          {/* Navbar & Header */}
          <div 
            onClick={() => onNavigateToTab('page_navbar')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg">
                🧭
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Navbar & Header</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Top announcement ticker text, brand name & slogan, phone support hotline.
            </p>
          </div>

          {/* Footer & Contact */}
          <div 
            onClick={() => onNavigateToTab('page_footer')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
                🦶
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Page <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Footer & Contact Info</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              About terroir story, support email, phone numbers, and copyright disclaimer.
            </p>
          </div>

          {/* Custom Divs & Visibility */}
          <div 
            onClick={() => onNavigateToTab('page_custom_blocks')}
            className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50 hover:bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-lg">
                🧱
              </div>
              <span className="text-[11px] font-bold text-[#4f46e5] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Edit Blocks <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Custom Divs & Banners</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Create and place bespoke promotional blocks, badges, banners, and CTA buttons on any page.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
