import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Award,
  Copy,
  Check,
  Tag,
  Eye,
  ArrowRight
} from 'lucide-react';

import mountainTownImg from '../assets/images/mountain_town_1786766825066.jpg';
import cobblestoneStreetImg from '../assets/images/cobblestone_street_1786766842879.jpg';
import lebaneseMountainTownImg from '../assets/images/rachaya_mountain_perfect_1786799009637.jpg';
import raoucheSunsetImg from '../assets/images/raouche_rocks_sunset_1786799732002.jpg';
import schoolBannerImg from '../assets/images/school_banner_1786797167259.jpg';

export const HomeTopContainer: React.FC = () => {
  const { 
    setActiveTab, 
    setSelectedCategory, 
    setSearchQuery, 
    showToast, 
    t, 
    language, 
    siteContent,
    products = [],
    addToCart,
    openProductDetail
  } = useShop();

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const heroData = siteContent?.hero || {
    badgeText: 'Handcrafted with Love in Lebanon',
    title: 'Authentic Lebanese Treasures, Handcrafted by Master Artisans',
    subtitle: 'Connecting traditional craft workshops across Beirut, Tripoli, Sidon, and Mount Lebanon directly to lovers of authentic Levantine heritage worldwide.',
    primaryBtnText: 'Explore Collection',
    targetUrl: '/products'
  };

  // Default consolidated slides for Hero
  const slides = [
    {
      id: 'slide_hero_1',
      url: raoucheSunsetImg,
      badge: (heroData as any).badgeText || 'Handcrafted in Lebanon',
      title: (heroData as any).title || 'Authentic Lebanese Treasures, Handcrafted by Master Artisans',
      subtitle: (heroData as any).subtitle || 'Connecting traditional craft workshops across Beirut, Tripoli, Sidon, and Mount Lebanon.',
      buttonText: (heroData as any).primaryBtnText || 'Explore Collection',
      targetCategory: 'all',
      productName: language === 'ar' ? 'سلة حرفية تراثية' : 'Heritage Artisan Basket',
      productThumb: products[0]?.image || lebaneseMountainTownImg
    },
    {
      id: 'slide_school_promo',
      url: schoolBannerImg,
      badge: 'School Essentials',
      title: 'YOUR SCHOOL ESSENTIALS ALL IN ONE PLACE',
      subtitle: 'OFFER IS VALID UNTIL 9 SEPTEMBER 2026 • ON SELECTED PRODUCTS',
      promoCode: 'SCHOOL50',
      buttonText: 'Shop Essentials',
      targetCategory: 'crafts',
      productName: language === 'ar' ? 'حقيبة ومستلزمات مدرسية' : 'School Stationery Kit',
      productThumb: products[1]?.image || schoolBannerImg
    },
    {
      id: 'slide_hero_2',
      url: lebaneseMountainTownImg,
      badge: 'Artisanal Mouneh & Pantry',
      title: 'Fresh Harvest Mouneh & Levantine Pantry Delicacies',
      subtitle: 'Sustainably harvested za’atar, extra virgin olive oil, and wild orange blossom water.',
      buttonText: 'Shop Pantry',
      targetCategory: 'pantry',
      productName: language === 'ar' ? 'زعتر جبلي وزيت زيتون' : 'Mountain Zaatar & Olive Oil',
      productThumb: products[2]?.image || lebaneseMountainTownImg
    },
    {
      id: 'slide_crayola_promo',
      url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1920&q=80',
      badge: 'Crayola Creative',
      title: 'EXPAND YOUR CRAYOLA COLLECTION',
      subtitle: 'Special creative promotion on art supplies, markers, and sketchbooks.',
      promoCode: 'CRAYOLA3',
      buttonText: 'Shop Crayola',
      targetCategory: 'crafts',
      productName: language === 'ar' ? 'مجموعة ألوان كرايولا' : 'Crayola Art Set',
      productThumb: products[3]?.image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'slide_global_promo',
      url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80',
      badge: 'Yalla-Global Collection',
      title: 'PREMIUM INTERNATIONAL BRANDS & HANDPICKED LUXURY',
      subtitle: 'Swiss chocolates, Amalfi ceramics, and French lavender directly imported.',
      promoCode: 'GLOBAL20',
      buttonText: 'Shop Global',
      targetCategory: 'yalla-global',
      productName: language === 'ar' ? 'مجموعة شوكولاتة سويسرية' : 'Swiss Chocolate Collection',
      productThumb: products[4]?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'
    }
  ];

  // Auto advance carousel
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const resetAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    resetAutoplay();
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    resetAutoplay();
  };

  const currentSlide = slides[currentSlideIndex];

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(language === 'ar' ? `تم نسخ كود الخصم: ${code}` : `Promo code copied: ${code}`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleHeroAction = () => {
    if (currentSlide.targetCategory) {
      setSelectedCategory(currentSlide.targetCategory);
    }
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Featured Product Selection
  const featuredProduct = products.find(p => p.isFeatured || p.isBestseller) || products[0];

  const handleAddToCartFeatured = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!featuredProduct) return;
    if (featuredProduct.stock === 0) {
      showToast(language === 'ar' ? 'المنتج غير متوفر حالياً' : 'Product is out of stock', 'error');
      return;
    }
    addToCart(featuredProduct, 1);
    showToast(language === 'ar' ? 'تمت إضافة المنتج إلى السلة' : 'Added to cart successfully', 'success');
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 mt-6 sm:mt-8 mb-4">
      {/* Top Grid: Hero Banner (1.8fr) & Featured Product Card (1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-[20px] items-stretch">
        
        {/* LEFT: Large Hero Banner */}
        <div 
          className="relative rounded-[20px] overflow-hidden bg-[#111111] text-white flex flex-col justify-between px-5 sm:px-6 pt-7 sm:pt-8 pb-5 sm:pb-6 shadow-sm group"
          style={{ minHeight: '380px' }}
        >
          {/* Background Image with subtle dark overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={currentSlide.url}
              alt={currentSlide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.30))'
              }}
            />
          </div>

          {/* Top-Left Compact Header with Glass Icon Container & Title */}
          <div className="relative z-20 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-[28px] h-[28px] rounded-[8px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#F3E5AB]" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-white max-w-[280px] sm:max-w-xs leading-[1.3] drop-shadow-sm line-clamp-1">
                {currentSlide.badge}
              </span>
            </div>

            {currentSlide.promoCode && (
              <button
                onClick={(e) => handleCopyCode(e, currentSlide.promoCode!)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-[#B89753]/50 text-xs font-mono text-[#F3E5AB] hover:bg-black/70 transition-colors cursor-pointer"
              >
                <Tag className="w-3 h-3" />
                <span>{currentSlide.promoCode}</span>
                {copiedCode === currentSlide.promoCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Center Main Content */}
          <div className="relative z-20 my-auto py-4 space-y-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-[1.15] drop-shadow-md line-clamp-2 max-w-xl">
              {currentSlide.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-lg font-normal drop-shadow-sm">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* Bottom Floating Glassmorphism Bar */}
          <div className="relative z-20 mt-auto">
            <div 
              className="flex items-center justify-between rounded-[16px] px-3.5 py-2.5 sm:py-3 shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {/* Left Side: Thumbnail + Product Name */}
              <div 
                onClick={handleHeroAction}
                className="flex items-center gap-3 cursor-pointer group/thumb min-w-0 pr-2"
              >
                <div className="w-[42px] h-[42px] rounded-[8px] overflow-hidden bg-white/30 border border-white/40 flex-shrink-0 flex items-center justify-center shadow-xs">
                  <img
                    src={currentSlide.productThumb}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    {language === 'ar' ? 'مميز اليوم' : 'Featured Highlight'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white truncate group-hover/thumb:text-[#F3E5AB] transition-colors">
                    {currentSlide.productName}
                  </div>
                </div>
              </div>

              {/* Right Side: Slider Controls & Counter */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handlePrev}
                  aria-label="Previous slide"
                  className="w-[28px] h-[28px] rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-mono font-bold text-white px-1">
                  {currentSlideIndex + 1}/{slides.length}
                </span>

                <button
                  onClick={handleNext}
                  aria-label="Next slide"
                  className="w-[28px] h-[28px] rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Featured Product Card */}
        {featuredProduct ? (
          <div 
            onClick={() => openProductDetail(featuredProduct)}
            className="rounded-[20px] bg-[#ededed] border border-[#E5E5E5] p-5 sm:p-6 flex flex-col justify-between relative cursor-pointer group hover:border-[#B89753]/60 transition-all shadow-sm"
            style={{ minHeight: '380px' }}
          >
            {/* Top Header */}
            <div className="flex items-center justify-between z-10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                {featuredProduct.category || (language === 'ar' ? 'منتج مميز' : 'Featured')}
              </div>
            </div>

            {/* Centered Product Image Container (height ~200px, object-contain) */}
            <div className="my-auto py-2 flex items-center justify-center overflow-hidden w-full" style={{ height: '200px' }}>
              <img
                src={featuredProduct.image}
                alt={featuredProduct.name}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Bottom: Product Info + Compact Add To Cart Pill Button */}
            <div className="flex items-end justify-between gap-3 pt-3 border-t border-black/5 mt-auto">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#111111] truncate leading-snug">
                  {language === 'ar' ? (featuredProduct.arabicName || featuredProduct.name) : featuredProduct.name}
                </h3>
                <p className="text-[12px] text-[#666666] truncate mt-0.5">
                  {featuredProduct.artisan || featuredProduct.seller || (language === 'ar' ? 'حرفي لبناني' : 'Lebanese Artisan')}
                </p>
              </div>

              <button
                type="button"
                id={`featured-add-to-cart-${featuredProduct.id}`}
                onClick={handleAddToCartFeatured}
                aria-label={language === 'ar' ? 'إضافة إلى السلة' : 'Add to cart'}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#111111] hover:bg-[#8F7137] text-white text-[12px] font-medium tracking-wide shadow-sm transition-colors cursor-pointer flex-shrink-0"
              >
                <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
                <span className="opacity-40">|</span>
                <span className="font-bold text-[#F3E5AB] font-mono">
                  ${featuredProduct.priceUSD.toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] bg-[#ededed] border border-[#E5E5E5] p-6 flex items-center justify-center text-xs text-[#737373]" style={{ minHeight: '380px' }}>
            {language === 'ar' ? 'لا توجد منتجات مميزة' : 'No featured products available'}
          </div>
        )}

      </div>
    </div>
  );
};
