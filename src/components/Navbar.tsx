import React, { useState, useEffect } from 'react';
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
  MapPin,
  Clock,
  ChevronDown,
  Store
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
    logSearchQuery,
    setSelectedCategory,
    language,
    setLanguage,
    t,
    isAdminUnlocked,
    isAdminUser = false,
    firebaseUser,
    user,
    siteContent,
    categories = []
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const showAdminTab = isAdminUser;

  // Filter out any unpublished categories and sort by displayOrder
  const sortedActiveCategories = [...categories]
    .filter(cat => cat.isPublished !== false)
    .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

  const categoriesList = [
    { id: 'all', name: t('cat_all'), icon: '✨' },
    ...sortedActiveCategories.map(cat => ({
      id: cat.id,
      name: language === 'ar' ? cat.nameAr : cat.nameEn,
      icon: cat.icon || '📦'
    }))
  ];

  // Automatically capture search queries as users type in the header (debounced)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2) {
      const timer = setTimeout(() => {
        logSearchQuery(trimmed, 'navbar');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, logSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      logSearchQuery(searchQuery.trim(), 'navbar');
    }
    if (activeTab !== 'products') {
      setActiveTab('products');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      {/* Top Announcement Ticker Bar */}
      {siteContent?.visibility?.announcementTicker !== false && (siteContent?.navbar?.announcementTicker || siteContent?.navbar?.announcementTickerArabic) && (
        <div className="bg-[#b89753] text-white text-[11px] sm:text-xs py-2 px-4 text-center font-bold tracking-wider flex items-center justify-center gap-2 overflow-hidden shadow-inner">
          <span className="inline-block animate-pulse">✨</span>
          <span className="truncate">
            {language === 'ar' ? (siteContent.navbar.announcementTickerArabic || siteContent.navbar.announcementTicker) : (siteContent.navbar.announcementTicker || siteContent.navbar.announcementTickerArabic)}
          </span>
          <span className="inline-block animate-pulse">✨</span>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group py-1 flex-shrink-0 select-none" 
            onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group-hover:border-[#b89753] transition-all flex-shrink-0">
              <img 
                src={siteContent?.navbar?.logoUrl || systemLogo} 
                alt={siteContent?.navbar?.brandName || "Logo"} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 uppercase font-sans whitespace-nowrap leading-none">
                {siteContent.navbar?.brandName || 'Yalla'}
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md items-center relative group"
          >
            <Search className={`absolute ${language === 'ar' ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-slate-400 group-focus-within:text-[#b89753] transition-colors pointer-events-none`} />
            <input
              id="desktop-search-input"
              type="text"
              placeholder={
                language === 'ar'
                  ? (siteContent?.navbar?.searchPlaceholderArabic || siteContent?.navbar?.searchPlaceholder || t('searchPlaceholder'))
                  : (siteContent?.navbar?.searchPlaceholder || t('searchPlaceholder'))
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-10 pl-16 text-right' : 'pl-10 pr-16 text-left'} py-2.5 text-xs font-normal bg-slate-100/80 hover:bg-slate-100 text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200/80 focus:border-[#b89753] focus:bg-white focus:ring-2 focus:ring-[#b89753]/20 focus:outline-none transition-all shadow-sm`}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className={`absolute ${language === 'ar' ? 'left-2.5' : 'right-2.5'} px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 bg-slate-200/60 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer`}
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
                <ChevronDown className={`w-3.5 h-3.5 text-[#b89753] transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 sticky top-0 bg-white z-10">
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
              id="nav-seller-btn"
              onClick={() => setActiveTab('seller')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'seller' 
                  ? 'text-amber-900 bg-amber-50 border border-amber-300 font-bold' 
                  : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50/50'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'ar' ? 'بوابة البائعين' : 'Seller Portal'}</span>
            </button>

            {showAdminTab && (
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
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Arabic / English Language Toggle - Always in Header */}
            <button
              id="global-language-switcher-btn"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-200/90 font-bold text-xs transition-colors cursor-pointer flex-shrink-0"
              title="Switch System Language / تغيير لغة النظام"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#b89753] flex-shrink-0" />
              <span className="font-semibold text-xs leading-none">{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Search Toggle on Mobile */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4.5 h-4.5 text-[#b89753]" />
            </button>

            {/* Wishlist Shortcut - Tablet & Desktop */}
            <button
              id="wishlist-shortcut-btn"
              onClick={() => setActiveTab('favorites')}
              className={`relative p-2 rounded-xl transition-colors hidden sm:flex items-center justify-center flex-shrink-0 cursor-pointer ${
                activeTab === 'favorites' ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
              }`}
              title="Saved Artisan Wishlist"
            >
              <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-rose-600' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-rose-600 text-white rounded-full">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Account Shortcut - Tablet & Desktop */}
            <button
              id="user-profile-shortcut-btn"
              onClick={() => setActiveTab('account')}
              className={`p-2 rounded-xl transition-colors hidden sm:flex items-center justify-center flex-shrink-0 cursor-pointer ${
                activeTab === 'account' ? 'text-[#b89753] bg-amber-50' : 'text-slate-600 hover:text-[#b89753] hover:bg-slate-100'
              }`}
              title={firebaseUser ? `Logged in as ${firebaseUser.displayName || user.name}` : "My Lebanese Account & Orders"}
            >
              {firebaseUser?.photoURL ? (
                <img 
                  src={firebaseUser.photoURL} 
                  alt={firebaseUser.displayName || user.name} 
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#b89753] object-cover" 
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl gold-btn text-white font-bold text-xs tracking-wider shadow-sm hover:shadow transition-all cursor-pointer flex-shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-white flex-shrink-0" />
              <span className="hidden md:inline uppercase text-[11px] font-extrabold">{t('cartBtn')}</span>
              <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] font-black bg-white text-[#b89753] rounded-full shadow-xs">
                {cartCount}
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
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
              <Search className={`absolute ${language === 'ar' ? 'right-3.5 top-3' : 'left-3.5 top-3'} w-4 h-4 text-[#b89753]`} />
              <input
                id="mobile-search-input"
                type="text"
                placeholder={
                  language === 'ar'
                    ? (siteContent?.navbar?.searchPlaceholderArabic || siteContent?.navbar?.searchPlaceholder || t('searchPlaceholder'))
                    : (siteContent?.navbar?.searchPlaceholder || t('searchPlaceholder'))
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${language === 'ar' ? 'pr-10 pl-16 text-right' : 'pl-10 pr-16 text-left'} py-2.5 text-xs bg-slate-100 text-slate-900 rounded-xl border border-slate-200 focus:border-[#b89753] focus:bg-white focus:ring-2 focus:ring-[#b89753]/20 focus:outline-none shadow-sm`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute ${language === 'ar' ? 'left-2.5' : 'right-2.5'} top-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200 rounded-lg cursor-pointer`}
                >
                  {t('clear')}
                </button>
              )}
            </form>
          </div>
        )}

        {/* Mobile Nav Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 bg-white rounded-b-2xl px-3 space-y-2 shadow-xl">
            {/* Wishlist in Mobile Menu */}
            <button
              onClick={() => { setActiveTab('favorites'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${
                activeTab === 'favorites' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className={`w-4 h-4 text-rose-500 ${activeTab === 'favorites' ? 'fill-rose-500' : ''}`} />
                <span>{t('wishlist')}</span>
              </div>
              {wishlist.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Account & Orders */}
            <button
              onClick={() => { setActiveTab('account'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                activeTab === 'account' ? 'bg-amber-50 text-slate-900 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 text-[#b89753]" />
              <span>{t('myAccountAndOrders')}</span>
            </button>

            <div className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-100 mt-2">
              {t('categories')}
            </div>
            <div className="grid grid-cols-2 gap-1.5 pb-2">
              {categoriesList.map(cat => (
                <button
                  key={`mobile-cat-${cat.id}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveTab('products');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-[#b89753] flex items-center gap-2 transition-colors cursor-pointer bg-slate-50/60 border border-slate-100"
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setActiveTab('checkout'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                activeTab === 'checkout' ? 'bg-amber-50 text-slate-900 border border-amber-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#b89753]" />
              <span>{t('checkoutAndDelivery')}</span>
            </button>

            <button
              id="nav-mobile-seller-btn"
              onClick={() => { setActiveTab('seller'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                activeTab === 'seller' ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'text-amber-800 hover:bg-slate-50'
              }`}
            >
              <span>{language === 'ar' ? 'بوابة البائعين والتجار' : 'Seller & Merchant Portal'}</span>
              <Store className="w-4 h-4 text-amber-600" />
            </button>

            {showAdminTab && (
              <button
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                  activeTab === 'admin' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-emerald-700 hover:bg-slate-50'
                }`}
              >
                <span>{t('adminAndArtisanPortal')}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between px-3 text-xs text-slate-500">
              <span className="uppercase tracking-wider text-[10px]">{t('currencyLabel')}</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-bold">
                <span>{t('freshUsdOnly')}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
