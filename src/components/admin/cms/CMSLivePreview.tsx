import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Globe, 
  Sparkles, 
  Eye, 
  Maximize2, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Heart,
  Search,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus
} from 'lucide-react';
import { SiteContent } from '../../../types';

interface CMSLivePreviewProps {
  content?: SiteContent;
  cmsForm?: SiteContent;
  activeTab?: string;
  onClose?: () => void;
  isSplitView?: boolean;
}

const ZOOM_LEVELS = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150];

export const CMSLivePreview: React.FC<CMSLivePreviewProps> = ({
  content,
  cmsForm: propCmsForm,
  activeTab,
  onClose,
  isSplitView = true
}) => {
  const formContent = content || propCmsForm || ({} as SiteContent);
  const cmsForm = formContent;
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [previewLang, setPreviewLang] = useState<'en' | 'ar'>('en');
  const [previewPage, setPreviewPage] = useState<'home' | 'products' | 'detail' | 'checkout' | 'news'>('home');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => {
    const next = ZOOM_LEVELS.find(z => z > zoomLevel);
    if (next) setZoomLevel(next);
    else if (zoomLevel < 150) setZoomLevel(150);
  };

  const handleZoomOut = () => {
    const prev = [...ZOOM_LEVELS].reverse().find(z => z < zoomLevel);
    if (prev) setZoomLevel(prev);
    else if (zoomLevel > 25) setZoomLevel(25);
  };

  const isAr = previewLang === 'ar';
  const visibility = cmsForm.visibility || {
    homeHero: true,
    homeCategories: true,
    homeOffers: true,
    homeFeatured: true,
    homeTrustBadges: true,
    homeDeals: true,
    homeNewArrivals: true,
    homeHeritage: true,
    homeReviews: true,
    homeNewsletter: true,
    homeNews: true
  };

  const getContainerWidth = () => {
    switch (device) {
      case 'mobile': return 'max-w-[390px] w-[390px]';
      case 'tablet': return 'max-w-[768px] w-[768px]';
      case 'desktop': return zoomLevel < 100 ? 'w-[1024px] max-w-[1024px]' : 'w-full';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-white/15 overflow-hidden">
      {/* Live Preview Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Device Viewport Switches */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer ${
              device === 'mobile' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile Viewport (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[10px]">Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer ${
              device === 'tablet' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[10px]">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer ${
              device === 'desktop' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop Fluid Viewport"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[10px]">Desktop</span>
          </button>
        </div>

        {/* Center: Language & Page Selectors */}
        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                previewLang === 'en' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇺🇸 EN
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('ar')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                previewLang === 'ar' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇱🇧 العربية
            </button>
          </div>

          {/* Page Picker */}
          <select
            value={previewPage}
            onChange={(e) => setPreviewPage(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-[11px] font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="home">🏠 Home Page</option>
            <option value="products">🛍️ Catalog Page</option>
            <option value="detail">🔍 Product Detail</option>
            <option value="checkout">💳 Checkout Page</option>
            <option value="news">📰 News & Stories</option>
          </select>
        </div>

        {/* Right: Zoom Controls & Status */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls below 100% and above */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-white/10 text-[10px] font-mono">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 25}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
              title="Zoom out (below 100%)"
            >
              <Minus className="w-3 h-3" />
            </button>
            
            <select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-bold px-1.5 py-1 text-[10px] focus:outline-none cursor-pointer appearance-none text-center"
              title="Select zoom percentage"
            >
              <option value="25" className="bg-slate-900 text-white">25%</option>
              <option value="33" className="bg-slate-900 text-white">33%</option>
              <option value="50" className="bg-slate-900 text-white">50%</option>
              <option value="67" className="bg-slate-900 text-white">67%</option>
              <option value="75" className="bg-slate-900 text-white">75%</option>
              <option value="80" className="bg-slate-900 text-white">80%</option>
              <option value="90" className="bg-slate-900 text-white">90%</option>
              <option value="100" className="bg-slate-900 text-white">100%</option>
              <option value="110" className="bg-slate-900 text-white">110%</option>
              <option value="125" className="bg-slate-900 text-white">125%</option>
              <option value="150" className="bg-slate-900 text-white">150%</option>
            </select>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 150}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
              title="Zoom in"
            >
              <Plus className="w-3 h-3" />
            </button>

            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-1.5 py-0.5 ml-1 mr-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[9px] font-sans font-bold transition-all cursor-pointer"
                title="Reset zoom to 100%"
              >
                100%
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sync</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              title="Close Preview Panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Container Viewport */}
      <div className="flex-1 bg-slate-950/80 overflow-auto p-4 flex justify-center custom-scrollbar">
        <div 
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className={`${getContainerWidth()} shrink-0 transition-all duration-300 flex flex-col bg-[#1a1a2e] rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative self-start`}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Simulated Browser Bar for realism */}
          <div className="bg-slate-900 px-3.5 py-2 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="px-3 py-0.5 rounded-md bg-slate-950 text-[10px] font-mono text-slate-300 border border-white/5 truncate max-w-[200px] sm:max-w-xs">
              https://yalla.lb/{previewPage === 'home' ? '' : previewPage}
            </div>
            <div className="text-[10px] font-bold text-amber-400">
              Yalla Storefront
            </div>
          </div>

          {/* STOREFRONT PREVIEW CONTENT */}
          <div className="bg-[#1a1a2e] text-slate-100 min-h-[500px]">
            {/* 1. Announcement Bar */}
            {visibility.announcementTicker !== false && (
              <div className="bg-[#b89753] text-[#1a1a2e] text-[11px] font-bold py-1.5 px-4 text-center truncate">
                {isAr 
                  ? (cmsForm.navbar?.announcementTickerArabic || '🇱🇧 توصيل سريع لجميع المناطق اللبنانية • منتجات حرفية أصيلة') 
                  : (cmsForm.navbar?.announcementTicker || '🇱🇧 Express Delivery Across Lebanon • Authentic Lebanese Craftsmanship')}
              </div>
            )}

            {/* 2. Mini Navbar */}
            <div className="bg-[#1a1a2e]/95 border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {cmsForm.navbar?.logoUrl ? (
                  <img src={cmsForm.navbar.logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
                ) : (
                  <div className="text-base font-serif font-bold text-[#c5a059]">
                    {isAr ? (cmsForm.navbar?.brandNameArabic || 'يلا') : (cmsForm.navbar?.brandName || 'Yalla.lb')}
                  </div>
                )}
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {isAr ? (cmsForm.navbar?.brandSubtitleArabic || 'سوق الحرف اللبنانية') : (cmsForm.navbar?.brandSubtitle || 'Artisanal Marketplace')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* 3. Page Specific Previews */}
            {previewPage === 'home' && (
              <div className="space-y-6 pb-8 bg-slate-50 text-slate-900">
                {/* Hero Banner Section */}
                {visibility.homeHero !== false && (
                  <div 
                    className="relative overflow-hidden bg-slate-900 text-white p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[280px]"
                    style={{
                      backgroundImage: cmsForm.hero?.bgImageUrl ? `linear-gradient(rgba(26,26,46,0.75), rgba(26,26,46,0.85)), url(${cmsForm.hero.bgImageUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {cmsForm.hero?.badgeText && (
                      <span className="px-3 py-1 rounded-full bg-[#c5a059]/20 text-[#e6ca85] border border-[#c5a059]/40 text-[10px] font-extrabold uppercase tracking-wider mb-3">
                        {isAr ? (cmsForm.hero.badgeTextArabic || cmsForm.hero.badgeText) : cmsForm.hero.badgeText}
                      </span>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white max-w-lg mb-2">
                      {isAr ? (cmsForm.hero?.titleArabic || cmsForm.hero?.title || 'كنوز لبنانية أصيلة') : (cmsForm.hero?.title || 'Authentic Lebanese Treasures')}
                    </h1>
                    <p className="text-xs text-slate-300 max-w-md mb-5 leading-relaxed">
                      {isAr ? (cmsForm.hero?.subtitleArabic || cmsForm.hero?.subtitle) : cmsForm.hero?.subtitle}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button className="px-4 py-2 rounded-xl bg-[#c5a059] text-slate-950 font-bold text-xs shadow-md">
                        {isAr ? (cmsForm.hero?.primaryBtnTextArabic || 'استكشف التشكيلة') : (cmsForm.hero?.primaryBtnText || 'Explore Collection')}
                      </button>
                      <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20">
                        {isAr ? (cmsForm.hero?.secondaryBtnTextArabic || 'تعرف على الحرفيين') : (cmsForm.hero?.secondaryBtnText || 'Meet Artisans')}
                      </button>
                    </div>

                    {/* Stats */}
                    {cmsForm.hero?.stats && cmsForm.hero.stats.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/10 w-full max-w-md">
                        {cmsForm.hero.stats.map((s, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-sm font-black text-[#c5a059]">
                              {isAr ? (s.valueArabic || s.value) : s.value}
                            </div>
                            <div className="text-[9px] text-slate-300 uppercase tracking-wider">
                              {isAr ? (s.labelArabic || s.label) : s.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Categories Section */}
                {visibility.homeCategories !== false && (
                  <div className="px-4 sm:px-6">
                    <div className="mb-3">
                      <span className="text-[10px] font-bold text-[#b89753] uppercase tracking-widest">
                        {isAr ? (cmsForm.home?.categoriesSubtitleArabic || 'تصفح الأقسام') : (cmsForm.home?.categoriesSubtitle || 'Browse Departments')}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        {isAr ? (cmsForm.home?.categoriesTitleArabic || 'تسوق حسب الفئات') : (cmsForm.home?.categoriesTitle || 'Explore by Category')}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {['Pantry & Mouneh', 'Blown Glass', 'Olive Soap', 'Cedar Honey'].map((cat, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{cat}</span>
                          <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Featured Products */}
                {visibility.homeFeatured !== false && (
                  <div className="px-4 sm:px-6">
                    <div className="mb-3">
                      <span className="text-[10px] font-bold text-[#b89753] uppercase tracking-widest">
                        {isAr ? (cmsForm.home?.featuredSubtitleArabic || 'مختارات مميزة') : (cmsForm.home?.featuredSubtitle || 'Top Picks')}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        {isAr ? (cmsForm.home?.featuredTitleArabic || 'المنتجات المميزة') : (cmsForm.home?.featuredTitle || 'Featured Products')}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { title: 'Sarafand Blown Pitcher', price: '$28.00', tag: 'Handmade' },
                        { title: 'Koura Extra Virgin Oil', price: '$19.50', tag: 'Mouneh' },
                        { title: 'Tripoli Laurel Soap Box', price: '$12.00', tag: 'Artisan' }
                      ].map((item, idx) => (
                        <div key={idx} className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-xs flex flex-col justify-between">
                          <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-400 text-xs font-bold">
                            📦 Item {idx+1}
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                          <p className="text-xs font-extrabold text-[#b89753] mt-1">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Heritage Banner */}
                {visibility.homeHeritage !== false && (
                  <div className="mx-4 sm:mx-6 p-5 rounded-2xl bg-[#fcfaf8] border border-[#f5ece1] text-center">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {isAr ? (cmsForm.home?.heritageTitleArabic || 'تراثنا') : (cmsForm.home?.heritageTitle || 'Our Heritage')}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                      {isAr ? (cmsForm.home?.heritageTextArabic || cmsForm.home?.heritageText) : cmsForm.home?.heritageText}
                    </p>
                  </div>
                )}

                {/* Newsletter */}
                {visibility.homeNewsletter !== false && (
                  <div className="mx-4 sm:mx-6 p-5 rounded-2xl bg-slate-900 text-white text-center">
                    <h3 className="text-sm font-bold mb-2">
                      {isAr ? (cmsForm.home?.newsletterTitleArabic || 'النشرة البريدية') : (cmsForm.home?.newsletterTitle || 'Join our Newsletter')}
                    </h3>
                    <div className="flex gap-2 max-w-xs mx-auto">
                      <input 
                        type="email" 
                        placeholder="Email..." 
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
                      />
                      <button className="px-3 py-1.5 rounded-lg bg-[#c5a059] text-slate-950 font-bold text-xs">
                        {isAr ? (cmsForm.home?.newsletterButtonTextArabic || 'اشترك') : (cmsForm.home?.newsletterButtonText || 'Join')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Catalog Preview */}
            {previewPage === 'products' && (
              <div className="p-5 space-y-4 bg-slate-50 text-slate-900">
                <div className="text-center">
                  <h1 className="text-lg font-bold text-slate-900">
                    {isAr ? (cmsForm.productsPage?.titleArabic || 'دليل المنتجات') : (cmsForm.productsPage?.title || 'Artisanal Catalog')}
                  </h1>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    {isAr ? (cmsForm.productsPage?.subtitleArabic || cmsForm.productsPage?.subtitle) : cmsForm.productsPage?.subtitle}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-400 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>{isAr ? (cmsForm.productsPage?.searchPlaceholderArabic || 'ابحث...') : (cmsForm.productsPage?.searchPlaceholder || 'Search products...')}</span>
                </div>
              </div>
            )}

            {/* Checkout Preview */}
            {previewPage === 'checkout' && (
              <div className="p-5 space-y-4 bg-slate-50 text-slate-900">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    {isAr ? (cmsForm.checkoutPage?.titleArabic || 'إتمام الطلب') : (cmsForm.checkoutPage?.title || 'Checkout & Delivery')}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {isAr ? (cmsForm.checkoutPage?.subtitleArabic || cmsForm.checkoutPage?.subtitle) : cmsForm.checkoutPage?.subtitle}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    {isAr ? (cmsForm.checkoutPage?.shippingHeadingArabic || 'عنوان التوصيل') : (cmsForm.checkoutPage?.shippingHeading || 'Shipping Address')}
                  </div>
                  <div className="h-8 bg-slate-100 rounded-lg" />
                </div>
                <button className="w-full py-2.5 rounded-xl bg-[#c5a059] text-slate-950 font-bold text-xs">
                  {isAr ? (cmsForm.checkoutPage?.orderButtonTextArabic || 'تأكيد الطلب') : (cmsForm.checkoutPage?.orderButtonText || 'Place Order')}
                </button>
              </div>
            )}

            {/* Product Detail Preview */}
            {previewPage === 'detail' && (
              <div className="p-5 space-y-4 bg-slate-50 text-slate-900">
                <div className="aspect-video bg-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-500 text-xs">
                  🏺 Authentic Lebanese Craft Detail
                </div>
                <h2 className="text-sm font-bold text-slate-900">Handcrafted Sarafand Water Pitcher</h2>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  {isAr ? (cmsForm.productDetailPage?.authenticityGuaranteeTextArabic || 'مضمون 100% صناعة يدوية أصلية') : (cmsForm.productDetailPage?.authenticityGuaranteeText || '100% Certified Authentic Lebanese Craft')}
                </div>
                <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2">
                  <span>{isAr ? (cmsForm.productDetailPage?.inquiryTextArabic || 'استفسر عبر واتساب') : (cmsForm.productDetailPage?.inquiryText || 'Inquire on WhatsApp')}</span>
                </button>
              </div>
            )}

            {/* News Preview */}
            {previewPage === 'news' && (
              <div className="p-5 space-y-4 bg-slate-50 text-slate-900">
                <h1 className="text-lg font-bold text-slate-900">Craft Press & Cultural Stories</h1>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-800">Reviving 4,000 Years of Lebanese Phoenician Glass Blowing</p>
                  <p className="text-[11px] text-slate-500">How master glassblowers in Sarafand are keeping heritage alive.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
