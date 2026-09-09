import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useShop } from '../context/ShopContext';
import { getFeaturedStorefrontProducts, getFeaturedStorefrontProduct, isProductVisibleOnStorefront } from '../lib/storefrontVisibility';
import { 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  Tag
} from 'lucide-react';

import lebaneseMountainTownImg from '../assets/images/rachaya_mountain_perfect_1786799009637.jpg';

interface ConsolidatedSlide {
  id: string;
  type?: 'image' | 'video';
  url: string;
  badgeEn?: string;
  badgeAr?: string;
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
  discountBadgeEn?: string;
  discountBadgeAr?: string;
  promoCode?: string;
  buttonTextEn?: string;
  buttonTextAr?: string;
  targetCategory?: string;
  targetUrl?: string;
  bundleId?: string;
  showButton?: boolean;
  productId?: string;
}

export const HomeTopContainer: React.FC = () => {
  const { 
    setActiveTab, 
    setSelectedCategory, 
    showToast, 
    language, 
    siteContent,
    products = [],
    sellers = [],
    productBundles = [],
    isVisualEditMode,
    addToCart,
    addBundleToCart,
    openProductDetail,
    formatPrice
  } = useShop();

  const isAr = language === 'ar';

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const featuredTimerRef = useRef<NodeJS.Timeout | null>(null);

  const heroData = siteContent?.hero || {};

  const cmsMediaItems = (heroData as any)?.bgMediaItems?.filter((item: any) => item.isPublished !== false) || [];
  const cmsOfferSlides = (siteContent?.offers as any)?.slides?.filter((item: any) => item.isPublished !== false) || [];

  // defaultConsolidatedSlides contains ONLY the base CMS hero configuration (no hardcoded promotional campaigns)
  const defaultConsolidatedSlides: ConsolidatedSlide[] = [
    {
      id: 'slide_hero_1',
      type: 'image',
      url: '',
      badgeEn: (heroData as any).badgeText,
      badgeAr: (heroData as any).badgeTextArabic,
      titleEn: (heroData as any).title,
      titleAr: (heroData as any).titleArabic,
      subtitleEn: (heroData as any).subtitle,
      subtitleAr: (heroData as any).subtitleArabic,
      buttonTextEn: (heroData as any).primaryBtnText,
      buttonTextAr: (heroData as any).primaryBtnTextArabic,
      targetCategory: 'all'
    }
  ];

  const isSlideActive = (item: { isPublished?: boolean; scheduleActive?: boolean; startDate?: string; endDate?: string }) => {
    if (item.isPublished === false) return false;
    if (item.scheduleActive) {
      const now = new Date();
      if (item.startDate) {
        const start = new Date(item.startDate);
        if (!isNaN(start.getTime()) && now < start) return false;
      }
      if (item.endDate) {
        const end = new Date(item.endDate);
        if (!isNaN(end.getTime()) && now > end) return false;
      }
    }
    return true;
  };

  const cmsConsolidatedSlides: ConsolidatedSlide[] = [];
  if (cmsOfferSlides.length > 0) {
    cmsOfferSlides.filter((slide: any) => isSlideActive(slide)).forEach((slide: any, idx: number) => {
      cmsConsolidatedSlides.push({
        id: slide.id || `offer-${idx}`,
        type: slide.bgVideoUrl ? 'video' : 'image',
        url: slide.imageUrl || slide.desktopImageUrl || slide.bgVideoUrl || '',
        badgeEn: slide.badge,
        badgeAr: slide.badgeArabic || slide.badge,
        titleEn: slide.title,
        titleAr: slide.titleArabic || slide.title,
        subtitleEn: slide.subtitle,
        subtitleAr: slide.subtitleArabic || slide.subtitle,
        discountBadgeEn: slide.discountBadge,
        discountBadgeAr: slide.discountBadgeArabic || slide.discountBadge,
        promoCode: slide.discountBadge?.includes('CODE:') ? slide.discountBadge.split('CODE:')[1]?.trim() : undefined,
        buttonTextEn: slide.buttonText,
        buttonTextAr: slide.buttonTextArabic || slide.buttonText,
        targetCategory: slide.targetUrl || 'all'
      });
    });
  }

  if (cmsMediaItems.length > 0) {
    cmsMediaItems.filter((item: any) => isSlideActive(item)).forEach((item: any, idx: number) => {
      cmsConsolidatedSlides.push({
        id: item.id || `media-${idx}`,
        type: item.type || 'image',
        url: item.url || '',
        badgeEn: item.badgeText || (heroData as any).badgeText,
        badgeAr: item.badgeTextArabic || (heroData as any).badgeTextArabic,
        titleEn: item.customTitle || item.title || (heroData as any).title,
        titleAr: item.customTitleArabic || (heroData as any).titleArabic,
        subtitleEn: item.customSubtitle || (heroData as any).subtitle,
        subtitleAr: item.customSubtitleArabic || (heroData as any).subtitleArabic,
        buttonTextEn: (heroData as any).primaryBtnText,
        buttonTextAr: (heroData as any).primaryBtnTextArabic,
        targetCategory: 'all'
      });
    });
  }

  const activeBundles = productBundles.filter((b: any) => b.isActive !== false && b.showInSlider !== false);
  const bundleSlides: ConsolidatedSlide[] = activeBundles.map((bundle: any) => {
    // Use neutral Yalla fallback image instead of hardcoded external Unsplash URL
    const bgUrl = bundle.imageUrl?.trim() || lebaneseMountainTownImg;
    
    // Attempt to find a valid product from this bundle
    let bundleProductId: string | undefined = undefined;
    if (bundle.productIds && Array.isArray(bundle.productIds)) {
      for (const pid of bundle.productIds) {
        const prod = products.find((p: any) => p.id === pid);
        if (prod && isProductVisibleOnStorefront(prod, sellers, isVisualEditMode)) {
          bundleProductId = prod.id;
          break;
        }
      }
    }

    return {
      id: `bundle-${bundle.id}`,
      type: 'image',
      url: bgUrl,
      badgeEn: bundle.badgeText,
      badgeAr: bundle.badgeTextAr || bundle.badgeText,
      titleEn: bundle.name,
      titleAr: bundle.nameAr || bundle.name,
      subtitleEn: bundle.description || '',
      subtitleAr: bundle.descriptionAr || bundle.description || '',
      buttonTextEn: bundle.sliderButtonText,
      buttonTextAr: bundle.sliderButtonTextAr,
      bundleId: bundle.id,
      productId: bundleProductId
    };
  });

  const baseSlides = cmsConsolidatedSlides.length > 0 ? cmsConsolidatedSlides : defaultConsolidatedSlides;
  const slides: ConsolidatedSlide[] = [...baseSlides, ...bundleSlides];
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const slideIntervalSec = (heroData as any)?.slideInterval ?? 6;

  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length <= 1 || slideIntervalSec === 0) return;
    timerRef.current = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, slideIntervalSec * 1000);
  }, [slides.length, slideIntervalSec]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    resetAutoplay();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    resetAutoplay();
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showToast(isAr ? `تم نسخ كود الخصم: ${code}` : `Promo code copied: ${code}`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleHeroAction = () => {
    if (currentSlide.bundleId) {
      addBundleToCart(currentSlide.bundleId);
      return;
    }
    if (currentSlide.targetCategory) {
      setSelectedCategory(currentSlide.targetCategory);
    }
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Featured Product Selection using centralized shared helper
  const featuredProductsList = getFeaturedStorefrontProducts(products, sellers, isVisualEditMode).slice(0, 5); // Limit to top 5 for the slider
  const featuredProduct = featuredProductsList[currentFeaturedIndex] || featuredProductsList[0];

  const resetFeaturedAutoplay = useCallback(() => {
    if (featuredTimerRef.current) clearInterval(featuredTimerRef.current);
    if (featuredProductsList.length <= 1) return;
    featuredTimerRef.current = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredProductsList.length);
    }, 4000); // 4 seconds for featured products
  }, [featuredProductsList.length]);

  useEffect(() => {
    resetAutoplay();
    resetFeaturedAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (featuredTimerRef.current) clearInterval(featuredTimerRef.current);
    };
  }, [resetAutoplay, resetFeaturedAutoplay]);

  const handleAddToCartFeatured = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!featuredProduct) return;
    if (featuredProduct.stock === 0) {
      showToast(isAr ? 'المنتج غير متوفر حالياً' : 'Product is out of stock', 'error');
      return;
    }
    addToCart(featuredProduct, 1);
    showToast(isAr ? 'تمت إضافة المنتج إلى السلة' : 'Added to cart successfully', 'success');
  };

  const activeBadge = isAr ? (currentSlide.badgeAr || currentSlide.badgeEn) : currentSlide.badgeEn;
  const activeTitle = isAr ? (currentSlide.titleAr || currentSlide.titleEn) : currentSlide.titleEn;
  const activeSubtitle = isAr ? (currentSlide.subtitleAr || currentSlide.subtitleEn) : currentSlide.subtitleEn;

  // Thumbnail for the bottom glass hero control bar
  let thumbProduct: any = undefined;
  if (currentSlide.productId) {
    thumbProduct = products.find((p: any) => p.id === currentSlide.productId);
    if (thumbProduct && !isProductVisibleOnStorefront(thumbProduct, sellers, isVisualEditMode)) {
      thumbProduct = undefined;
    }
  }

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 mb-4">
      {/* Top Grid: Hero Banner (2fr) & Featured Product Card (1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[20px] items-stretch">
        
        {/* LEFT: Large Hero Banner */}
        <div 
          className="relative rounded-[20px] overflow-hidden bg-[#111111] text-white flex flex-col justify-between px-5 sm:px-6 pt-7 sm:pt-8 pb-5 sm:pb-6 shadow-sm group min-w-0"
          style={{ minHeight: '380px' }}
        >
          {/* Background Image with subtle dark overlay */}
          <div className="absolute inset-0 z-0">
            {currentSlide.url && (
              <img
                src={currentSlide.url}
                alt={activeTitle || ''}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
            )}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.30))'
              }}
            />
          </div>

          {/* Top-Left Compact Header with Glass Icon Container & Title */}
          <div className="relative z-20 flex items-start justify-between gap-4">
            {activeBadge ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-[28px] h-[28px] rounded-[8px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#F3E5AB]" />
                </div>
                <span className="text-[13px] sm:text-[14px] font-medium text-white max-w-[280px] sm:max-w-xs leading-[1.3] drop-shadow-sm line-clamp-1">
                  {activeBadge}
                </span>
              </div>
            ) : (
              <div />
            )}

            {currentSlide.promoCode && (
              <button
                onClick={(e) => handleCopyCode(e, currentSlide.promoCode!)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-[#B89753]/50 text-xs font-mono text-[#F3E5AB] hover:bg-black/70 transition-colors cursor-pointer flex-shrink-0"
              >
                <Tag className="w-3 h-3" />
                <span>{currentSlide.promoCode}</span>
                {copiedCode === currentSlide.promoCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Center Main Content */}
          <div className="relative z-20 my-auto py-4 space-y-2 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-[1.15] drop-shadow-md line-clamp-2 max-w-xl">
              {activeTitle}
            </h2>
            {activeSubtitle && (
              <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-lg font-normal drop-shadow-sm">
                {activeSubtitle}
              </p>
            )}
          </div>

          {/* Bottom Floating Glassmorphism Bar */}
          <div className="relative z-20 mt-auto min-w-0">
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
                className="flex items-center gap-3 cursor-pointer group/thumb min-w-0 pr-2 flex-1"
              >
                {thumbProduct && (
                  <>
                    <div className="w-[42px] h-[42px] rounded-[8px] overflow-hidden bg-white/30 border border-white/40 flex-shrink-0 flex items-center justify-center shadow-xs">
                      <img
                        src={thumbProduct.image}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover/thumb:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                        {isAr ? 'عرض' : 'Featured'}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white truncate group-hover/thumb:text-[#F3E5AB] transition-colors">
                        {isAr ? (thumbProduct.arabicName || thumbProduct.name) : thumbProduct.name}
                      </div>
                    </div>
                  </>
                )}
                {!thumbProduct && (
                  <div className="min-w-0 h-[42px] flex items-center">
                    <div className="text-xs sm:text-sm font-bold text-white truncate transition-colors">
                      {isAr ? 'تصفح العرض' : 'Explore Offer'}
                    </div>
                  </div>
                )}
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
            className="rounded-[20px] bg-[#ededed] border border-[#E5E5E5] p-5 sm:p-6 flex flex-col justify-between relative cursor-pointer group hover:border-[#B89753]/60 transition-all shadow-sm min-w-0"
            style={{ minHeight: '380px' }}
          >
            {/* Top Category Header & Slider Dots */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373] truncate">
                  {featuredProduct.category || (isAr ? 'منتج مميز' : 'Featured')}
                </div>
                {Array.isArray((featuredProduct as any).colors) && (featuredProduct as any).colors.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {((featuredProduct as any).colors as string[]).map((col, i) => (
                      <span
                        key={i}
                        className="w-[18px] h-[18px] rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                  </div>
                )}
              </div>
              {featuredProductsList.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {featuredProductsList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentFeaturedIndex(idx);
                        resetFeaturedAutoplay();
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentFeaturedIndex ? 'bg-[#111111] w-3' : 'bg-[#111111]/20 hover:bg-[#111111]/40'
                      }`}
                      aria-label={`View featured product ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Centered Product Image Container (height ~200px, object-contain) */}
            <div className="my-auto py-2 flex items-center justify-center overflow-hidden w-full relative" style={{ height: '200px' }}>
              {featuredProductsList.map((product, idx) => (
                <img
                  key={product.id}
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className={`absolute max-h-full max-w-full object-contain object-center transition-all duration-500 ${
                    idx === currentFeaturedIndex 
                      ? 'opacity-100 scale-100 group-hover:scale-105 z-10' 
                      : 'opacity-0 scale-95 -z-10'
                  }`}
                />
              ))}
            </div>

            {/* Bottom: Product Info + Compact Add To Cart Pill Button */}
            <div className="flex items-end justify-between gap-3 pt-3 mt-auto">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#111111] truncate leading-snug">
                  {isAr ? (featuredProduct.arabicName || featuredProduct.name) : featuredProduct.name}
                </h3>
                <p className="text-[12px] text-[#666666] truncate mt-0.5">
                  {featuredProduct.artisan || featuredProduct.seller || (isAr ? 'حرفي لبناني' : 'Lebanese Artisan')}
                </p>
              </div>

              <button
                type="button"
                id={`featured-add-to-cart-${featuredProduct.id}`}
                onClick={handleAddToCartFeatured}
                aria-label={isAr ? 'إضافة إلى السلة' : 'Add to cart'}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#111111] hover:bg-[#8F7137] text-white text-[12px] font-medium tracking-wide shadow-sm transition-colors cursor-pointer flex-shrink-0"
              >
                <span>{isAr ? 'إضافة' : 'Add'}</span>
                <span className="opacity-40">|</span>
                <span className="font-bold text-[#F3E5AB] font-mono">
                  {formatPrice(featuredProduct.priceUSD)}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] bg-[#ededed] border border-[#E5E5E5] p-6 flex items-center justify-center text-xs text-[#737373]" style={{ minHeight: '380px' }}>
            {isAr ? 'لا توجد منتجات مميزة' : 'No featured products available'}
          </div>
        )}

      </div>
    </div>
  );
};
