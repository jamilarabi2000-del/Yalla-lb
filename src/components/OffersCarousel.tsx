import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen
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
  const { setSelectedCategory, setActiveTab, showToast, language } = useShop();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
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

  // Auto slide effect
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % offers.length);
      }, 7000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, offers.length]);

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

  const handleShopAction = (category: string) => {
    setSelectedCategory(category);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + offers.length) % offers.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % offers.length);
  };

  const currentOffer = offers[currentIndex];
  const currentClock = clocks[currentIndex];

  return (
    <div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Custom School Essentials Slide Container */}
      {currentOffer.isCustomSchoolLayout && (
        <div 
          onClick={() => handleShopAction(currentOffer.targetCategory)}
          style={{ 
            backgroundImage: `url(${schoolBannerImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center left'
          }}
          className="relative overflow-hidden rounded-3xl border border-slate-300 shadow-xl text-white min-h-[440px] md:min-h-[380px] h-auto md:h-[380px] flex flex-col md:flex-row items-center justify-between transition-all duration-500 cursor-pointer group"
        >
          {/* Subtle semi-transparent gradient on mobile for text reading */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent md:bg-none pointer-events-none" />

          {/* Left Spacer to let the pencil artwork show perfectly */}
          <div className="hidden md:block md:w-[45%] lg:w-[50%]" />

          {/* Right Column: Promotional Text Offer valid till 9 September */}
          <div className="w-full md:w-[55%] lg:w-[50%] space-y-5 text-center md:text-left p-6 sm:p-10 md:pl-0 z-10 flex flex-col items-center md:items-start justify-center group-hover:scale-[1.01] transition-transform duration-300">
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight uppercase font-sans text-white drop-shadow-md max-w-sm">
              {language === 'ar' ? currentOffer.titleAr : currentOffer.titleEn}
            </h2>

            {/* Heavy Red Bold 50% discount label */}
            <div className="flex items-center gap-4">
              <span className="text-7xl sm:text-8xl font-black tracking-tight text-red-600 drop-shadow-[0_4px_0_#ffffff] filter select-none">
                50%
              </span>
              <div className="flex flex-col text-left font-sans">
                <span className="text-[10px] sm:text-xs uppercase font-extrabold text-white drop-shadow-sm tracking-widest leading-none">
                  {language === 'ar' ? 'خصم مذهل من ١٠٪ إلى' : 'DISCOUNT FROM 10% TO'}
                </span>
                <span className="text-sm font-black text-slate-900 mt-1 uppercase">
                  {language === 'ar' ? 'وفر على المنتجات' : 'ON SELECT ITEMS'}
                </span>
              </div>
            </div>
          </div>

          {/* Dots Indicator inside Slide */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Manual Arrow Controls */}
          <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Custom Crayola Collection Slide Container */}
      {currentOffer.isCustomCrayolaLayout && (
        <div 
          onClick={() => handleShopAction(currentOffer.targetCategory)}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/90 via-emerald-50/60 to-yellow-50/80 border border-emerald-200/70 shadow-xl min-h-[440px] md:min-h-[380px] h-auto md:h-[380px] flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 transition-all duration-500 cursor-pointer group"
        >
          {/* Subtle background decorative shapes */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left Column: Offer details */}
          <div className="w-full md:w-[58%] space-y-4 text-center md:text-left z-10 flex flex-col items-center md:items-start justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-emerald-100/80 text-emerald-800 border-emerald-300/60 shadow-sm">
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ar' ? currentOffer.badgeAr : currentOffer.badgeEn}</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight uppercase text-slate-900 max-w-md font-sans">
              {language === 'ar' ? currentOffer.titleAr : currentOffer.titleEn}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {language === 'ar' ? currentOffer.descAr : currentOffer.descEn}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              {/* Countdown box */}
              <div className="flex items-center gap-1.5 bg-white/90 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-700 shadow-sm dir-ltr">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{String(currentClock.hours).padStart(2, '0')}</span>
                <span className="text-emerald-400 animate-pulse">:</span>
                <span>{String(currentClock.minutes).padStart(2, '0')}</span>
                <span className="text-emerald-400 animate-pulse">:</span>
                <span>{String(currentClock.seconds).padStart(2, '0')}</span>
              </div>

              {/* Promo code copy input */}
              <div className="flex items-center bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                <span className="px-3 py-1.5 text-[10px] uppercase font-bold text-emerald-700 tracking-wider bg-emerald-50 border-r border-emerald-100">
                  {language === 'ar' ? 'كود' : 'COUPON'}
                </span>
                <span className="px-3 font-mono font-bold text-xs text-slate-800 tracking-widest select-all">
                  {currentOffer.code}
                </span>
                <button
                  onClick={(e) => handleCopy(e, currentOffer.code)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors border-l border-emerald-200 cursor-pointer"
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

          {/* Right Column: Visual CTA badge & Crayon artwork representation */}
          <div className="w-full md:w-[42%] flex flex-col items-center justify-center relative md:px-6 py-4 z-10">
            <div className="relative group cursor-pointer">
              <div className="relative w-40 h-40 rounded-full border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm shadow-md group-hover:scale-105 transition-all duration-300">
                {/* Decorative colored crayon tips */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-5 rounded-t-full bg-red-500 shadow-sm" />
                  <span className="w-2.5 h-6 rounded-t-full bg-yellow-400 shadow-sm" />
                  <span className="w-2.5 h-7 rounded-t-full bg-emerald-500 shadow-sm" />
                  <span className="w-2.5 h-6 rounded-t-full bg-blue-500 shadow-sm" />
                  <span className="w-2.5 h-5 rounded-t-full bg-purple-500 shadow-sm" />
                </div>
                <span className="text-xs font-black text-emerald-800 uppercase tracking-widest text-center">
                  {language === 'ar' ? currentOffer.discountAr : currentOffer.discountEn}
                </span>
                <div className="w-8 h-0.5 bg-emerald-200 my-1" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {language === 'ar' ? 'عرض حصري' : 'EXCLUSIVE DEAL'}
                </span>
              </div>
            </div>

            {/* Shop Button */}
            <button
              onClick={() => handleShopAction(currentOffer.targetCategory)}
              className="mt-5 flex items-center justify-center gap-2 w-full max-w-xs py-3 px-6 bg-emerald-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-emerald-800 transition-all duration-300 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{language === 'ar' ? currentOffer.buttonTextAr : currentOffer.buttonTextEn}</span>
            </button>
          </div>

          {/* Dots Indicator inside Slide */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'bg-emerald-700 w-4' : 'bg-emerald-300/60 hover:bg-emerald-400'
                }`}
              />
            ))}
          </div>

          {/* Manual Arrow Controls */}
          <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-sm cursor-pointer z-10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-sm cursor-pointer z-10">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Custom Global Luxury Slide Container */}
      {currentOffer.isCustomGlobalLayout && (
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl text-slate-800 min-h-[440px] md:min-h-[380px] h-auto md:h-[380px] flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 transition-all duration-500">
          
          {/* Main layout matching Yalla-Global Screenshot */}
          <div className="w-full md:w-1/2 space-y-4 text-center md:text-left z-10 flex flex-col items-center md:items-start justify-center">
            
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
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative md:px-8 py-6">
            <div className="relative group cursor-pointer" onClick={() => handleShopAction(currentOffer.targetCategory)}>
              <div className="absolute inset-0 bg-slate-100/30 rounded-full blur-2xl transition-all duration-500" />
              
              <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 bg-slate-50/50 shadow-sm hover:scale-105 hover:border-slate-300 transition-all duration-300">
                <span className="text-2xl font-black font-serif italic tracking-wide text-amber-800">
                  {language === 'ar' ? 'وفّر' : 'SAVE'}
                </span>
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">
                  {language === 'ar' ? currentOffer.discountAr : currentOffer.discountEn}
                </span>
                <div className="w-8 h-0.5 bg-slate-200 my-1.5" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {language === 'ar' ? 'تسوق الان' : 'SHOP NOW'}
                </span>
              </div>
            </div>

            {/* Shop Button */}
            <button
              onClick={() => handleShopAction(currentOffer.targetCategory)}
              className="mt-6 flex items-center justify-center gap-2 w-full max-w-xs py-3 px-6 bg-slate-900 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-[#c5a059] hover:text-slate-950 transition-all duration-300 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{language === 'ar' ? currentOffer.buttonTextAr : currentOffer.buttonTextEn}</span>
            </button>
          </div>

          {/* Dots Indicator inside Slide */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'bg-[#c5a059] w-4' : 'bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Manual Arrow Controls */}
          <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-700 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-700 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
