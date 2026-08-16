import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import systemLogo from '../assets/images/system_logo_1786837577985.jpg';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  ShieldCheck, 
  Search, 
  Globe2, 
  Menu, 
  X, 
  Sparkles,
  MapPin,
  Clock
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currency, 
    setCurrency, 
    cartCount, 
    setIsCartOpen,
    wishlist,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    language,
    setLanguage,
    t,
    isAdminUnlocked,
    firebaseUser,
    user
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const categoriesList = [
    { id: 'all', name: t('cat_all'), icon: '✨' },
    { id: 'consumable', name: t('cat_consumable'), icon: '🍯' },
    { id: 'grocery', name: t('cat_grocery'), icon: '🛒' },
    { id: 'electronics', name: t('cat_electronics'), icon: '⚡' },
    { id: 'fashion', name: t('cat_fashion'), icon: '👔' },
    { id: 'home', name: t('cat_home'), icon: '🛋️' },
    { id: 'beauty', name: t('cat_beauty'), icon: '💄' },
    { id: 'sports', name: t('cat_sports'), icon: '⚽' },
    { id: 'books', name: t('cat_books'), icon: '📚' },
    { id: 'toys', name: t('cat_toys'), icon: '🧸' },
    { id: 'yalla-global', name: t('cat_yalla_global'), icon: '🌐' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'products') {
      setActiveTab('products');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      {/* Top Head Bar with Arabic Language & Lebanese Banner */}
      <div className="bg-slate-900 text-slate-100 text-[11px] py-1.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium truncate">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="hidden sm:inline truncate">{t('nationwideDelivery')}</span>
            <span className="sm:hidden truncate">{t('nationwideDeliveryShort')}</span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Arabic / English Language Toggle Button */}
            <button
              id="global-language-switcher-btn"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-serif font-bold text-xs transition-colors cursor-pointer"
              title="Switch System Language / تغيير لغة النظام"
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-300 font-mono hidden md:inline">{t('freshUsd')}</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group py-1 sm:py-2 flex-shrink-0" 
            onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 p-1 sm:p-1.5 border border-slate-200 shadow-sm group-hover:border-[#b89753] transition-all flex-shrink-0">
              <img 
                src={systemLogo} 
                alt="Yalla.lb Logo" 
                className="w-full h-full object-contain filter group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase font-sans whitespace-nowrap">
                  Yalla<span className="text-[#b89753]">.lb</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase hidden sm:block">
                {t('verifiedProvenance')}
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md items-center relative group"
          >
            <Search className="absolute left-4 w-4 h-4 text-slate-400 group-focus-within:text-[#b89753] transition-colors pointer-events-none" />
            <input
              id="desktop-search-input"
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-16 py-3 text-xs bg-slate-100/80 hover:bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200/80 focus:border-[#b89753] focus:bg-white focus:ring-2 focus:ring-[#b89753]/20 focus:outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 bg-slate-200/60 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {t('clear')}
              </button>
            )}
          </form>

          {/* Nav Links & Actions */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <button
              id="nav-home-btn"
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'home' 
                  ? 'text-slate-900 bg-amber-50 border border-amber-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('home')}
            </button>
            <div className="relative">
              <button
                id="nav-categories-dropdown-btn"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="px-3.5 py-2 rounded-lg transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <span>{t('categories')}</span>
                <span className="text-[10px] text-[#b89753]">▼</span>
              </button>

              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    {t('categories')}
                  </div>
                  {categoriesList.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setActiveTab('products');
                        setCategoryDropdownOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-[#b89753] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              id="nav-products-btn"
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'products' 
                  ? 'text-slate-900 bg-amber-50 border border-amber-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('products')}
            </button>
            <button
              id="nav-checkout-btn"
              onClick={() => setActiveTab('checkout')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'checkout' 
                  ? 'text-slate-900 bg-amber-50 border border-amber-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('checkout')}
            </button>
            <button
              id="nav-account-btn"
              onClick={() => setActiveTab('account')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'account' 
                  ? 'text-slate-900 bg-amber-50 border border-amber-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('account')}
            </button>
            {isAdminUnlocked && (
              <button
                id="nav-admin-btn"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('admin')}</span>
              </button>
            )}
          </nav>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2.5 md:gap-3 flex-shrink-0">
            {/* Search Toggle on Mobile */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-[#b89753]" />
            </button>

            {/* Wishlist Shortcut */}
            <button
              id="wishlist-shortcut-btn"
              onClick={() => setActiveTab('account')}
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
              title="Saved Artisan Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-rose-600 text-white rounded-full">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Account Shortcut */}
            <button
              id="user-profile-shortcut-btn"
              onClick={() => setActiveTab('account')}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-[#b89753] hover:bg-slate-100 transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer"
              title={firebaseUser ? `Logged in as ${firebaseUser.displayName || user.name}` : "My Lebanese Account & Orders"}
            >
              {firebaseUser?.photoURL ? (
                <img 
                  src={firebaseUser.photoURL} 
                  alt={firebaseUser.displayName || user.name} 
                  className="w-6 h-6 rounded-full border border-[#b89753] object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {/* Cart Button */}
            <button
              id="open-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl gold-btn text-white font-bold uppercase text-xs tracking-wider shadow-sm hover:shadow transition-all cursor-pointer flex-shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-white flex-shrink-0" />
              <span className="hidden sm:inline">{t('cartBtn')}</span>
              <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] font-black bg-white text-[#b89753] rounded-full">
                {cartCount}
              </span>
            </button>

            {/* Mobile Menu Toggle ("Three Lines" Hamburger Button) */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200/80 transition-all flex items-center justify-center cursor-pointer flex-shrink-0 ml-0.5"
              aria-label="Toggle Navigation"
              title="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" strokeWidth={2.25} />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" strokeWidth={2.25} />
              )}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar Expand */}
        {searchOpen && (
          <div className="md:hidden pb-3 pt-1 px-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#b89753]" />
              <input
                id="mobile-search-input"
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-16 py-3 text-xs bg-slate-100 text-slate-900 rounded-2xl border border-slate-200 focus:border-[#b89753] focus:bg-white focus:ring-2 focus:ring-[#b89753]/20 focus:outline-none shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200 rounded-lg cursor-pointer"
                >
                  {t('clear')}
                </button>
              )}
            </form>
          </div>
        )}

        {/* Mobile Nav Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 bg-white rounded-b-2xl px-2 space-y-1 shadow-xl">
            <button
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'home' ? 'bg-amber-50 text-slate-900 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('home')}
            </button>
            <div className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-100 mt-2">
              {t('categories')}
            </div>
            <div className="grid grid-cols-2 gap-1 pb-2">
              {categoriesList.map(cat => (
                <button
                  key={`mobile-cat-${cat.id}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveTab('products');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-[#b89753] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setActiveTab('checkout'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'checkout' ? 'bg-amber-50 text-slate-900 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('checkoutAndDelivery')}
            </button>
            <button
              onClick={() => { setActiveTab('account'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'account' ? 'bg-amber-50 text-slate-900 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t('myAccountAndOrders')}
            </button>
            {isAdminUnlocked && (
              <button
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                  activeTab === 'admin' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-emerald-700 hover:bg-slate-50'
                }`}
              >
                <span>{t('adminAndArtisanPortal')}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between px-3 text-xs text-slate-500">
              <span className="uppercase tracking-wider text-[10px]">{t('currencyLabel')}</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-bold">
                <span>{t('freshUsdOnly')}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
