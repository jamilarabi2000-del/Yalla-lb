import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Zap, 
  Clock, 
  Copy, 
  Check, 
  ShoppingBag, 
  Sparkles,
  Gift,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  Palette,
  Ruler,
  BookOpen,
  Megaphone
} from 'lucide-react';
import schoolBannerImg from '../assets/images/school_banner_1786797167259.jpg';

interface PromoOffer {
  id: string;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  code: string;
  discountEn: string;
  discountAr: string;
  buttonTextEn: string;
  buttonTextAr: string;
  targetCategory: string;
  accentTextClass: string;
  badgeClass: string;
  expiryHours: number;
  icon: React.ReactNode;
  isCustomSchoolLayout?: boolean;
  isCustomCrayolaLayout?: boolean;
  isCustomGlobalLayout?: boolean;
}

export const OffersCarousel: React.FC = () => {
  const { setSelectedCategory, setActiveTab, showToast, language, t, siteContent } = useShop();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // High-fidelity promo slides configured to match the user's uploaded campaign screenshots exactly
  const offers: PromoOffer[] = [
    {
      id: 'school_essentials',
      badgeEn: 'School Essentials',
      badgeAr: 'مستلزمات المدرسة',
      titleEn: 'YOUR SCHOOL ESSENTIALS ALL IN ONE PLACE',
      titleAr: 'مستلزمات المدرسة كلها في مكان واحد',
      descEn: 'OFFER IS VALID UNTIL 9 SEPTEMBER 2026 • ON SELECTED PRODUCTS',
      descAr: 'العرض سارٍ حتى ٩ سبتمبر ٢٠٢٦ • على منتجات مختارة',
      code: 'SCHOOL50',
      discountEn: '50% OFF',
      discountAr: 'خصم ٥٠٪',
      buttonTextEn: 'Shop Essentials',
      buttonTextAr: 'تسوق المستلزمات',
      targetCategory: 'crafts',
      accentTextClass: 'text-red-600',
      badgeClass: 'bg-red-50 text-red-600 border-red-200/50',
      expiryHours: 24,
      icon: <Award className="w-5 h-5 text-red-600" />,
      isCustomSchoolLayout: true
    },
    {
      id: 'crayola_collection',
      badgeEn: 'Crayola Creative',
      badgeAr: 'إبداع كرايولا',
      titleEn: 'EXPAND YOUR CRAYOLA COLLECTION',
      titleAr: 'وسّع مجموعتك من ألوان كرايولا المميزة',
      descEn: 'Offer valid until 10 September 2026',
      descAr: 'العرض سارٍ حتى ١٠ سبتمبر ٢٠٢٦',
      code: 'CRAYOLA3',
      discountEn: 'BUY 2 GET 3RD FREE',
      discountAr: 'اشترِ ٢ واحصل على ٣ مجاناً',
      buttonTextEn: 'Shop Crayola',
      buttonTextAr: 'تسوق كرايولا',
      targetCategory: 'crafts',
      accentTextClass: 'text-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
      expiryHours: 48,
      icon: <Palette className="w-5 h-5 text-emerald-500" />,
      isCustomCrayolaLayout: true
    },
    {
      id: 'yalla_global_promo',
      badgeEn: 'Yalla-Global Collection',
      badgeAr: 'مجموعة يلا غلوبال العالمية',
      titleEn: 'PREMIUM INTERNATIONAL BRANDS & HANDPICKED LUXURY',
      titleAr: 'ماركات عالمية متميزة وفخامة منتقاة بعناية',
      descEn: 'Experience Swiss chocolates, Amalfi ceramics, and French lavender directly imported with international safety standards.',
      descAr: 'استمتع بالشوكولاتة السويسرية، والسيراميك الإيطالي، واللافندر الفرنسي المستورد مباشرة بمقاييس جودة عالمية.',
      code: 'GLOBAL20',
      discountEn: '20% OFF',
      discountAr: 'خصم ٢٠٪',
      buttonTextEn: 'Shop Global',
      buttonTextAr: 'تسوق عالمياً',
      targetCategory: 'yalla-global',
      accentTextClass: 'text-amber-800',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/50',
      expiryHours: 12,
      icon: <Sparkles className="w-5 h-5 text-amber-600" />,
      isCustomGlobalLayout: true
    }
  ];

  // Auto slide effect with clean restart
  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % offers.length);
    }, 4000);
  }, [offers.length]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetAutoplay]);

  // Countdown timers
  const [clocks, setClocks] = useState(offers.map(o => ({ hours: o.expiryHours, minutes: 45, seconds: 20 })));

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setClocks(prev => 
        prev.map(c => {
          if (c.seconds > 0) return { ...c, seconds: c.seconds - 1 };
          if (c.minutes > 0) return { ...c, minutes: 59, seconds: 59 };
          if (c.hours > 0) return { hours: c.hours - 1, minutes: 59, seconds: 59 };
          return { hours: 24, minutes: 0, seconds: 0 };
        })
      );
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(
      language === 'ar' ? `تم نسخ الكود ${code} بنجاح!` : `Promo code ${code} copied to clipboard!`,
      'success'
    );
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleShopAction = (category: string, index: number) => {
    const cmsSlide = siteContent?.offers?.slides?.[index];
    const targetUrl = cmsSlide?.targetUrl;

    if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank');
        return;
      }
      
      // Parse internal URLs like /products?category=Pantry or /product/123
      if (targetUrl.startsWith('/products')) {
        const urlObj = new URL(targetUrl, window.location.origin);
        const urlCategory = urlObj.searchParams.get('category');
        if (urlCategory) {
          setSelectedCategory(urlCategory);
        } else {
          setSelectedCategory('all');
        }
        setActiveTab('products');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Add more internal route handling if necessary
      // Fallback if not matching specific internal paths
    }

    // Default behavior if no targetUrl or unrecognized
    setSelectedCategory(category);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + offers.length) % offers.length);
    resetAutoplay();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % offers.length);
    resetAutoplay();
  };

  const currentOffer = offers[currentIndex];
  const currentClock = clocks[currentIndex];

  return (
    <section 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8"
    >
      {/* Section Header for Ads & Promotions Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#b89753] mb-1 flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" />
            <span>{t('promotionsAndAds')}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300/70 ml-1.5">
              {t('sponsoredBadge')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
            {language === 'ar' ? (
              siteContent?.offers?.sectionTitleArabic ? (
                <span>{siteContent.offers.sectionTitleArabic}</span>
              ) : (
                <>العروض والحملات <span className="gold-gradient font-serif italic">الإعلانية</span></>
              )
            ) : (
              siteContent?.offers?.sectionTitle ? (
                <span>{siteContent.offers.sectionTitle}</span>
              ) : (
                <>Featured Promotions & <span className="gold-gradient font-serif italic">Ads</span></>
              )
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {language === 'ar' 
              ? (siteContent?.offers?.sectionSubtitleArabic || t('promotionsSubtitle')) 
              : (siteContent?.offers?.sectionSubtitle || t('promotionsSubtitle'))}
          </p>
        </div>
      </div>

      {/* Unified Carousel Container */}
      <div 
        className="relative group/carousel select-none"
      >
        {/* 1. Custom School Essentials Slide Container */}
        {currentOffer.isCustomSchoolLayout && (
        <div 
          onClick={() => handleShopAction(currentOffer.targetCategory, currentIndex)}
          className="relative overflow-hidden rounded-3xl border border-slate-300 shadow-xl bg-slate-950 h-[460px] sm:h-[420px] md:h-[380px] flex items-center justify-center transition-all duration-500 cursor-pointer group"
        >
          {/* Blurred Background to fill wide slides gracefully without any cropping on the main graphic */}
          <img
            src={schoolBannerImg}
            alt="School Essentials Background Blur"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-105 pointer-events-none select-none transition-transform duration-500"
            referrerPolicy="no-referrer"
          />

          {/* Subdued dark vignette layer for luxury contrast */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />

          {/* Full Banner Artwork shown in its complete aspect ratio with absolutely zero cropping */}
          <img
            src={schoolBannerImg}
            alt={language === 'ar' ? currentOffer.titleAr : currentOffer.titleEn}
            className="h-full w-full object-contain mx-auto relative z-10 transition-all duration-500 group-hover:scale-[1.01] select-none rounded-3xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* 2. Custom Crayola Collection Slide Container - "As-Is" Campaign Banner */}
      {currentOffer.isCustomCrayolaLayout && (
        <div 
          onClick={() => handleShopAction(currentOffer.targetCategory, currentIndex)}
          className="relative overflow-hidden rounded-3xl bg-[#f8f5eb] border-2 border-emerald-300/80 shadow-2xl h-[460px] sm:h-[420px] md:h-[380px] flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 md:p-8 transition-all duration-500 cursor-pointer group"
        >
          {/* Notebook Graph Grid Paper Pattern Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0dcb8_1px,transparent_1px),linear-gradient(to_bottom,#e0dcb8_1px,transparent_1px)] bg-[size:22px_22px] opacity-60 pointer-events-none" />

          {/* Left Column: 3D Stage with Yellow, Blue, Green Podiums & Crayola Products */}
          <div className="w-full md:w-[50%] flex items-end justify-center relative z-10 pt-4 pb-1 md:py-2 px-2 h-[190px] sm:h-[210px] md:h-full">
            <div className="relative flex items-end justify-center gap-1 sm:gap-2.5 max-w-full">
              
              {/* Yellow Podium (Far Left) */}
              <div className="relative flex flex-col items-center">
                <div className="w-12 sm:w-16 h-16 sm:h-20 bg-gradient-to-b from-amber-400 via-amber-400 to-amber-500 border-2 border-amber-600/80 rounded-t-3xl shadow-md flex flex-col items-center justify-end pb-2">
                  <span className="text-[8px] font-mono font-bold text-white tracking-widest bg-black/20 px-1 py-0.5 rounded">
                    ITEM #...
                  </span>
                </div>
              </div>

              {/* Blue Podium (Center, Tallest - Holds Ribbon-Wrapped Coloring Book + FREE Speech Bubble) */}
              <div className="relative flex flex-col items-center z-20 -mb-1">
                {/* 3D "FREE" Speech Bubble floating above coloring book */}
                <div className="absolute -top-14 z-30 flex flex-col items-center animate-bounce">
                  <div className="bg-red-600 text-white font-black text-xs sm:text-sm px-3 py-0.5 rounded-full border-2 border-white shadow-xl tracking-wider flex items-center justify-center">
                    FREE
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-600 -mt-0.5" />
                </div>

                {/* Crayola Coloring Book product with Red Ribbon Bow */}
                <div className="relative mb-1.5 w-24 sm:w-32 h-32 sm:h-38 bg-white rounded-lg border-2 border-slate-300 shadow-2xl p-1 flex flex-col items-center justify-between overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                  {/* Book Cover Header */}
                  <div className="w-full bg-emerald-600 text-white text-[7px] font-extrabold uppercase text-center py-0.5 rounded-t">
                    Crayola • Coloring Fun
                  </div>

                  {/* Book Cover Design */}
                  <div className="flex-1 w-full flex flex-col items-center justify-center bg-amber-50/70 rounded p-1 text-center relative">
                    <span className="text-red-600 font-black text-xs tracking-tight leading-none mb-0.5">
                      COLORING
                    </span>
                    <span className="text-blue-600 font-black text-[10px] tracking-tight leading-none">
                      FUN!
                    </span>
                    <div className="mt-0.5 flex items-center gap-1 opacity-80">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    </div>
                  </div>

                  {/* 3D Red Gift Ribbon Strap & Bow */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Horizontal Ribbon */}
                    <div className="absolute w-full h-3 bg-red-600/90 shadow-sm border-y border-red-700" />
                    {/* Vertical Ribbon */}
                    <div className="absolute h-full w-3 bg-red-600/90 shadow-sm border-x border-red-700" />
                    {/* 3D Ribbon Bow in Center */}
                    <div className="relative z-10 w-7 h-7 bg-red-600 rounded-full border-2 border-red-300 shadow-lg flex items-center justify-center text-white text-[9px] font-bold">
                      🎀
                    </div>
                  </div>
                </div>

                {/* Blue Cylinder Podium Base */}
                <div className="w-24 sm:w-32 h-24 sm:h-28 bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 border-2 border-blue-700 rounded-t-3xl shadow-xl flex flex-col items-center justify-between py-1.5 relative overflow-hidden">
                  {/* Colorful Paint Splatter Motif */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-red-500 to-purple-600 blur-[1px] opacity-90 border-2 border-white/60 mt-0.5 shadow" />
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white tracking-widest bg-black/30 px-2 py-0.5 rounded shadow-sm">
                    ITEM #67890
                  </span>
                </div>
              </div>

              {/* Green Podium (Right - Holds Crayola Washable Markers Box) */}
              <div className="relative flex flex-col items-center z-10">
                {/* Crayola Markers Box */}
                <div className="relative mb-1.5 w-20 sm:w-24 h-24 sm:h-28 bg-amber-400 border-2 border-emerald-700 rounded-lg shadow-lg p-1 flex flex-col items-center justify-between transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full bg-emerald-700 text-white text-[7px] font-black uppercase text-center py-0.5 rounded-t">
                    10 Classic Colors
                  </div>
                  <div className="w-full bg-white rounded p-0.5 text-center border border-amber-300">
                    <span className="text-emerald-700 font-extrabold text-[9px] block leading-none">
                      Crayola
                    </span>
                    <span className="text-blue-700 font-black text-[8px] block leading-none mt-0.5">
                      MARKERS
                    </span>
                    {/* 10 Markers visual row */}
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map((c, i) => (
                        <span key={i} className="w-0.5 h-2 rounded-t" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[7px] font-bold text-slate-800 uppercase">Washable</span>
                </div>

                {/* Green Cylinder Podium Base */}
                <div className="w-20 sm:w-26 h-20 sm:h-24 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 border-2 border-emerald-800 rounded-t-3xl shadow-lg flex flex-col items-center justify-between py-1.5 relative overflow-hidden">
                  {/* Paint Splatter Motif */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-300 via-emerald-300 to-blue-500 opacity-90 border-2 border-white/60 mt-1 shadow" />
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white tracking-widest bg-black/30 px-1.5 py-0.5 rounded shadow-sm">
                    ITEM #54321
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Exact As-Is Crayola Campaign Copy & Action Area */}
          <div className="w-full md:w-[48%] space-y-3 text-center md:text-left z-10 flex flex-col items-center md:items-start justify-center px-2">
            
            {/* Styled Crayola Brand Header */}
            <div className="inline-flex items-center gap-2">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00873d] tracking-tight font-sans drop-shadow-[0_2px_0_#facc15] [text-shadow:_2px_2px_0_#00873d,_-1px_-1px_0_#00873d,_1px_-1px_0_#00873d,_-1px_1px_0_#00873d]">
                Crayola
              </span>
              <span className="text-xs font-black uppercase text-emerald-800 bg-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500 shadow-sm">
                {language === 'ar' ? 'إبداع' : 'CREATIVE'}
              </span>
            </div>

            {/* Red Promo Subtitle */}
            <div className="text-red-600 font-black text-xl sm:text-2xl lg:text-3xl tracking-tight leading-none uppercase drop-shadow-sm">
              {language === 'ar' ? currentOffer.discountAr : 'BUY 2, GET 3RD FREE'}
            </div>

            {/* Main Headline Title */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight uppercase text-[#003d7a] max-w-md font-sans">
              {language === 'ar' ? currentOffer.titleAr : 'EXPAND YOUR CRAYOLA COLLECTION'}
            </h2>

            <p className="text-xs text-slate-600 font-medium">
              {language === 'ar' ? currentOffer.descAr : currentOffer.descEn}
            </p>

            {/* Countdown Clock & Coupon Code Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              {/* Countdown box */}
              <div className="flex items-center gap-1.5 bg-white/90 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 shadow-sm dir-ltr">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{String(currentClock.hours).padStart(2, '0')}</span>
                <span className="text-emerald-500 animate-pulse">:</span>
                <span>{String(currentClock.minutes).padStart(2, '0')}</span>
                <span className="text-emerald-500 animate-pulse">:</span>
                <span>{String(currentClock.seconds).padStart(2, '0')}</span>
              </div>

              {/* Promo code copy input */}
              <div className="flex items-center bg-white border border-emerald-300 rounded-xl overflow-hidden shadow-sm">
                <span className="px-2.5 py-1.5 text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider bg-emerald-100/70 border-r border-emerald-200">
                  {language === 'ar' ? 'كود' : 'COUPON'}
                </span>
                <span className="px-3 font-mono font-bold text-xs text-slate-900 tracking-widest select-all">
                  {currentOffer.code}
                </span>
                <button
                  onClick={(e) => handleCopy(e, currentOffer.code)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                >
                  {copiedCode === currentOffer.code ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => handleShopAction(currentOffer.targetCategory, currentIndex)}
              className="mt-2 flex items-center justify-center gap-2 w-full sm:w-auto py-3 px-8 bg-[#00873d] hover:bg-[#006e32] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all duration-300 cursor-pointer border border-emerald-700"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{language === 'ar' ? currentOffer.buttonTextAr : currentOffer.buttonTextEn}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Custom Global Luxury Slide Container */}
      {currentOffer.isCustomGlobalLayout && (
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl text-slate-800 h-[460px] sm:h-[420px] md:h-[380px] flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 md:p-10 transition-all duration-500">
          
          {/* Main layout matching Yalla-Global Screenshot */}
          <div className="w-full md:w-1/2 h-full space-y-3 sm:space-y-4 text-center md:text-left z-10 flex flex-col items-center md:items-start justify-center">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border-amber-200/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'ar' ? currentOffer.discountAr : currentOffer.discountEn}</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight uppercase text-slate-900 max-w-sm">
              {language === 'ar' ? currentOffer.titleAr : currentOffer.titleEn}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-light">
              {language === 'ar' ? currentOffer.descAr : currentOffer.descEn}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              {/* Countdown box */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-700 shadow-sm dir-ltr">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{String(currentClock.hours).padStart(2, '0')}</span>
                <span className="text-slate-300 animate-pulse">:</span>
                <span>{String(currentClock.minutes).padStart(2, '0')}</span>
                <span className="text-slate-300 animate-pulse">:</span>
                <span>{String(currentClock.seconds).padStart(2, '0')}</span>
              </div>

              {/* Promo code copy input */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <span className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50 border-r border-slate-100">
                  {language === 'ar' ? 'كود' : 'COUPON'}
                </span>
                <span className="px-3 font-mono font-bold text-xs text-slate-800 tracking-widest select-all">
                  {currentOffer.code}
                </span>
                <button
                  onClick={(e) => handleCopy(e, currentOffer.code)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border-l border-slate-200 cursor-pointer"
                >
                  {copiedCode === currentOffer.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right visual Column: SAVE 20% badge */}
          <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-center relative md:px-8 py-2">
            <div className="relative group cursor-pointer" onClick={() => handleShopAction(currentOffer.targetCategory, currentIndex)}>
              <div className="absolute inset-0 bg-slate-100/30 rounded-full blur-2xl transition-all duration-500" />
              
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-3 bg-slate-50/50 shadow-sm hover:scale-105 hover:border-slate-300 transition-all duration-300">
                <span className="text-xl sm:text-2xl font-black font-serif italic tracking-wide text-amber-800">
                  {language === 'ar' ? 'وفّر' : 'SAVE'}
                </span>
                <span className="text-[11px] sm:text-xs font-black text-slate-600 uppercase tracking-widest mt-1">
                  {language === 'ar' ? currentOffer.discountAr : currentOffer.discountEn}
                </span>
                <div className="w-8 h-0.5 bg-slate-200 my-1" />
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {language === 'ar' ? 'تسوق الان' : 'SHOP NOW'}
                </span>
              </div>
            </div>

            {/* Shop Button */}
            <button
              onClick={() => handleShopAction(currentOffer.targetCategory, currentIndex)}
              className="mt-3 flex items-center justify-center gap-2 w-full max-w-xs py-2.5 px-6 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-[#c5a059] hover:text-slate-950 transition-all duration-300 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{language === 'ar' ? currentOffer.buttonTextAr : currentOffer.buttonTextEn}</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Floating Left Navigation Arrow Button */}
      <button
        onClick={handlePrev}
        aria-label={language === 'ar' ? 'العرض السابق' : 'Previous Offer'}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-2xl border border-slate-200/90 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md group/btn"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover/btn:-translate-x-0.5" />
      </button>

      {/* Global Floating Right Navigation Arrow Button */}
      <button
        onClick={handleNext}
        aria-label={language === 'ar' ? 'العرض التالي' : 'Next Offer'}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-2xl border border-slate-200/90 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md group/btn"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover/btn:translate-x-0.5" />
      </button>

      {/* Global Unified Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg">
        {offers.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
              resetAutoplay();
            }}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex
                ? 'bg-amber-400 w-6 sm:w-8 shadow-sm'
                : 'bg-white/50 hover:bg-white w-2'
            }`}
          />
        ))}
      </div>
    </div>
    </section>
  );
};
