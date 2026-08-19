import React from 'react';
import { useShop } from '../../context/ShopContext';
import { 
  ArrowLeft,
  Eye,
  LogOut,
  Sparkles,
  Database
} from 'lucide-react';

export type AdminMenuTab = 
  | 'ecommerce' 
  | 'orders' 
  | 'products' 
  | 'categories' 
  | 'discounts'
  | 'customers' 
  | 'active_carts' 
  | 'pages_cms'
  | 'page_home'
  | 'page_products'
  | 'page_detail'
  | 'page_checkout'
  | 'page_account'
  | 'page_news'
  | 'page_navbar'
  | 'page_footer'
  | 'page_custom_blocks'
  | 'page_visibility'
  | 'page_seo'
  | 'db_logs';

interface AdminSidebarProps {
  currentTab: AdminMenuTab;
  onSelectTab: (tab: AdminMenuTab) => void;
  ordersCount: number;
  productsCount: number;
  categoriesCount: number;
  customersCount: number;
  activeCartsCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  ordersCount,
  productsCount,
  categoriesCount,
  customersCount,
  activeCartsCount,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { goBack, isVisualEditMode, setIsVisualEditMode, setIsAdminUnlocked } = useShop();

  const storeOperationsItems: {
    id: AdminMenuTab;
    label: string;
    icon: string;
    badge?: number;
  }[] = [
    {
      id: 'ecommerce',
      label: 'eCommerce',
      icon: '📊',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: '📦',
      badge: ordersCount
    },
    {
      id: 'products',
      label: 'Products',
      icon: '🏷️',
      badge: productsCount
    },
    {
      id: 'categories',
      label: 'Categories & Details',
      icon: '📁',
      badge: categoriesCount
    },
    {
      id: 'discounts',
      label: 'Discounts & Promos',
      icon: '🏷️'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: '👥',
      badge: customersCount
    },
    {
      id: 'active_carts',
      label: 'Active Carts',
      icon: '🛒',
      badge: activeCartsCount
    }
  ];

  const pageContentItems: {
    id: AdminMenuTab;
    label: string;
    icon: string;
    tag?: string;
  }[] = [
    {
      id: 'pages_cms',
      label: 'All Pages CMS Studio',
      icon: '🎛️',
      tag: 'Studio'
    },
    {
      id: 'page_home',
      label: 'Home Page',
      icon: '🏠',
    },
    {
      id: 'page_products',
      label: 'Catalog Page',
      icon: '🛍️',
    },
    {
      id: 'page_detail',
      label: 'Product Details',
      icon: '🔍',
    },
    {
      id: 'page_checkout',
      label: 'Checkout Page',
      icon: '💳',
    },
    {
      id: 'page_account',
      label: 'Account Page',
      icon: '👤',
    },
    {
      id: 'page_news',
      label: 'News & Stories',
      icon: '📰',
    },
    {
      id: 'page_navbar',
      label: 'Navbar & Header',
      icon: '🧭',
    },
    {
      id: 'page_footer',
      label: 'Footer & Contact',
      icon: '🦶',
    },
    {
      id: 'page_custom_blocks',
      label: 'Custom Divs & Banners',
      icon: '🧱',
    },
    {
      id: 'page_visibility',
      label: 'Section Visibility',
      icon: '👁️',
    },
    {
      id: 'page_seo',
      label: 'Global SEO',
      icon: '🔍',
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between py-6 px-4
        transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header & Scrollable Navigation */}
        <div className="flex flex-col flex-1 overflow-hidden space-y-4">
          <div className="flex items-center gap-3.5 px-2 flex-shrink-0">
            {/* PA Logo Squircle */}
            <div className="w-12 h-12 rounded-[18px] bg-[#4f46e5] flex items-center justify-center text-white font-black text-lg tracking-wider shadow-md shadow-indigo-500/20">
              PA
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                PlainAdmin
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[12px] font-semibold text-emerald-600">
                  Firestore Connected
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 mx-1 flex-shrink-0" />

          {/* Navigation Sections with smooth scroll */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1">
            
            {/* Section 1: Store Operations */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                MENU
              </div>

              <nav className="space-y-0.5">
                {storeOperationsItems.map((item) => {
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`admin-menu-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer group text-left
                        ${isActive 
                          ? 'bg-[#e0e7ff]/70 text-[#4f46e5] font-bold shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base select-none">{item.icon}</span>
                        <span className={isActive ? 'text-[#4338ca]' : 'text-slate-700 group-hover:text-slate-900'}>
                          {item.label}
                        </span>
                      </div>

                      {item.badge !== undefined && (
                        <span className={`
                          px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors
                          ${isActive 
                            ? 'bg-[#4f46e5] text-white' 
                            : 'bg-[#e0e7ff]/70 text-[#4f46e5] group-hover:bg-[#4f46e5] group-hover:text-white'
                          }
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Section 2: Page Content & CMS */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between px-3 pb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  PAGE CONTENT & CMS
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[#4f46e5]">
                  Live
                </span>
              </div>

              <nav className="space-y-0.5">
                {pageContentItems.map((item) => {
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`admin-menu-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-2xl text-[13px] font-medium transition-all cursor-pointer group text-left
                        ${isActive 
                          ? 'bg-[#e0e7ff]/70 text-[#4f46e5] font-bold shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base select-none">{item.icon}</span>
                        <span className={isActive ? 'text-[#4338ca]' : 'text-slate-700 group-hover:text-slate-900'}>
                          {item.label}
                        </span>
                      </div>

                      {item.tag && (
                        <span className={`
                          px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                          ${isActive ? 'bg-[#4f46e5] text-white' : 'bg-slate-100 text-slate-500'}
                        `}>
                          {item.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Section 3: System & Diagnostics */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between px-3 pb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  SYSTEM & DIAGNOSTICS
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>

              <nav className="space-y-0.5">
                <button
                  id="admin-menu-db_logs"
                  onClick={() => {
                    onSelectTab('db_logs');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer group text-left
                    ${currentTab === 'db_logs' 
                      ? 'bg-[#e0e7ff]/70 text-[#4f46e5] font-bold shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none">⚡</span>
                    <span className={currentTab === 'db_logs' ? 'text-[#4338ca]' : 'text-slate-700 group-hover:text-slate-900'}>
                      Database Sync & Logs
                    </span>
                  </div>

                  <span className={`
                    px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${currentTab === 'db_logs' 
                      ? 'bg-[#4f46e5] text-white' 
                      : 'bg-emerald-100 text-emerald-800 group-hover:bg-[#4f46e5] group-hover:text-white'
                    }
                  `}>
                    Stream
                  </span>
                </button>
              </nav>
            </div>

          </div>
        </div>

        {/* Bottom Storefront & Utilities Controls */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {/* Visual Edit Mode Toggle */}
          <button
            onClick={() => setIsVisualEditMode(!isVisualEditMode)}
            className={`
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer
              ${isVisualEditMode 
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              <span>Visual Edit Mode</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-black ${isVisualEditMode ? 'bg-slate-950 text-amber-300' : 'bg-slate-200 text-slate-600'}`}>
              {isVisualEditMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Return to Storefront */}
          <button
            onClick={goBack}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          {/* Lock / Exit Admin */}
          <button
            onClick={() => setIsAdminUnlocked(false)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Lock Admin Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
};
