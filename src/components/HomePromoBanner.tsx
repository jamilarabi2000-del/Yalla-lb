import React from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowRight, Sparkles, ShoppingBag, ExternalLink, Plus, Settings } from 'lucide-react';
import { CMSPromoBannerConfig } from '../types';

interface HomePromoBannerProps {
  bannerConfig?: CMSPromoBannerConfig;
  className?: string;
}

export const HomePromoBanner: React.FC<HomePromoBannerProps> = ({ bannerConfig, className = '' }) => {
  const { 
    siteContent, 
    language, 
    setActiveTab, 
    setSelectedCategory, 
    products = [],
    addToCart,
    openProductDetail,
    formatPrice,
    isVisualEditMode,
    showToast
  } = useShop();

  const isAr = language === 'ar';
  const config = bannerConfig || siteContent?.promoBanner;

  // Check scheduling status
  const isScheduleActive = () => {
    if (!config) return false;
    if (config.isPublished === false) return false;
    if (config.scheduleActive) {
      const now = new Date();
      if (config.startDate) {
        const start = new Date(config.startDate);
        if (!isNaN(start.getTime()) && now < start) return false;
      }
      if (config.endDate) {
        const end = new Date(config.endDate);
        if (!isNaN(end.getTime()) && now > end) return false;
      }
    }
    return true;
  };

  const isEnabled = config?.enabled !== false && isScheduleActive();

  // Check if content is actually configured
  const hasContent = Boolean(
    config && (
      config.title || 
      config.titleArabic || 
      config.imageUrl || 
      config.description || 
      config.descriptionArabic || 
      config.badge || 
      config.badgeArabic ||
      config.selectedProductId ||
      config.targetCategory
    )
  );

  // If disabled, empty, or missing and not in visual edit mode -> render nothing (empty state)
  if (!config || !isEnabled || !hasContent) {
    if (isVisualEditMode) {
      return (
        <div 
          onClick={() => {
            setActiveTab('admin');
            showToast(isAr ? 'افتح إدارة المحتوى لضبط البانر الترويجي' : 'Opening CMS to configure Promotional Banner', 'info');
          }}
          className={`rounded-[20px] border-2 border-dashed border-[#B89753]/60 bg-[#B89753]/5 p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#B89753]/10 transition-colors h-[200px] sm:h-[260px] md:h-[260px] lg:h-[400px] xl:h-[420px] ${className}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#B89753]/20 flex items-center justify-center text-[#8F7137] mb-2">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#8F7137]">
            {isAr ? 'البانر الترويجي معطّل أو فارغ' : 'Promo Banner (Disabled / Empty)'}
          </p>
          <p className="text-[11px] text-[#737373] mt-1 max-w-[220px]">
            {isAr ? 'انقر لتهيئة المحتوى من لوحة التحكم' : 'Click to configure content in Admin CMS'}
          </p>
        </div>
      );
    }
    return null;
  }

  // Determine background style
  const getBgClasses = () => {
    switch (config.bgStyle) {
      case 'dark':
        return 'bg-[#111111] text-white border border-[#262626]';
      case 'light':
        return 'bg-[#fafafa] text-[#111111] border border-[#E5E5E5]';
      case 'gold_gradient':
        return 'bg-gradient-to-br from-[#2a1c06] via-[#1a1204] to-[#0d0902] text-white border border-[#B89753]/40';
      case 'emerald_gradient':
        return 'bg-gradient-to-br from-[#06241a] via-[#041610] to-[#020b08] text-white border border-emerald-500/40';
      case 'custom_color':
        return 'border border-black/10';
      case 'default':
      default:
        return 'bg-[#ededed] text-[#111111] border border-[#E5E5E5]';
    }
  };

  const customStyle: React.CSSProperties = {};
  if (config.bgStyle === 'custom_color') {
    if (config.customBgColor) customStyle.backgroundColor = config.customBgColor;
    if (config.customTextColor) customStyle.color = config.customTextColor;
  }

  // Handle CTA Click Navigation
  const handleCtaClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // If product promotion
    if (config.type === 'product_promotion' && config.selectedProductId) {
      const prod = products.find(p => p.id === config.selectedProductId);
      if (prod) {
        openProductDetail(prod);
        return;
      }
    }

    // If category promotion
    if (config.type === 'category_promotion' && config.targetCategory) {
      setSelectedCategory(config.targetCategory);
      setActiveTab('products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const url = config.ctaUrl || '/products';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (url.startsWith('/products')) {
      const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const cat = urlParams.get('category');
      if (cat) {
        setSelectedCategory(cat);
      } else {
        setSelectedCategory('all');
      }
      setActiveTab('products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (url.startsWith('/account')) {
      setActiveTab('account');
      return;
    }

    if (url.startsWith('/offers') || url.startsWith('/deals')) {
      setActiveTab('products');
      return;
    }

    // Default fallback
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDarkBg = config.bgStyle === 'dark' || config.bgStyle === 'gold_gradient' || config.bgStyle === 'emerald_gradient';
  const badgeText = isAr ? (config.badgeArabic || config.badge) : (config.badge || config.badgeArabic);
  const titleText = isAr ? (config.titleArabic || config.title) : (config.title || config.titleArabic);
  const descriptionText = isAr ? (config.descriptionArabic || config.description) : (config.description || config.descriptionArabic);
  const ctaText = isAr ? (config.ctaTextArabic || config.ctaText) : (config.ctaText || config.ctaTextArabic);

  // Selected product if product promotion
  const selectedProduct = config.type === 'product_promotion' && config.selectedProductId
    ? products.find(p => p.id === config.selectedProductId)
    : null;

  // 1. IMAGE ONLY TYPE
  if (config.type === 'image_only' && config.imageUrl) {
    return (
      <div 
        id="home-promo-banner-image-only"
        onClick={config.ctaUrl ? () => handleCtaClick() : undefined}
        className={`rounded-[20px] overflow-hidden relative group shadow-sm transition-all h-[200px] sm:h-[260px] md:h-[260px] lg:h-[400px] xl:h-[420px] ${
          config.ctaUrl ? 'cursor-pointer hover:opacity-95' : ''
        } ${getBgClasses()} ${className}`}
        style={customStyle}
      >
        <img 
          src={config.imageUrl} 
          alt={titleText || 'Promotional Banner'}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-${config.imageFit || 'cover'} transition-transform duration-500 group-hover:scale-105`}
        />
        {titleText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 sm:p-5 flex flex-col justify-end">
            {badgeText && (
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#F3E5AB] mb-1">
                {badgeText}
              </span>
            )}
            <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2">
              {titleText}
            </h3>
          </div>
        )}
      </div>
    );
  }

  // 2. TEXT ONLY TYPE
  if (config.type === 'text_only') {
    return (
      <div 
        id="home-promo-banner-text-only"
        onClick={config.ctaUrl ? () => handleCtaClick() : undefined}
        className={`rounded-[20px] p-4 sm:p-6 md:p-7 flex flex-col justify-between relative shadow-sm transition-all h-[200px] sm:h-[260px] md:h-[260px] lg:h-[400px] xl:h-[420px] ${
          config.ctaUrl ? 'cursor-pointer group hover:border-[#B89753]/60' : ''
        } ${getBgClasses()} ${className}`}
        style={customStyle}
      >
        {/* Top Badge */}
        {badgeText && (
          <div className="flex items-center gap-1.5 z-10">
            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              isDarkBg ? 'bg-white/10 text-[#F3E5AB] border border-white/15' : 'bg-black/5 text-[#737373] border border-black/10'
            }`}>
              {badgeText}
            </span>
          </div>
        )}

        {/* Middle Typography */}
        <div className="my-auto py-2 z-10">
          {titleText && (
            <h3 className={`text-base sm:text-lg md:text-xl font-bold tracking-tight line-clamp-3 leading-snug ${
              isDarkBg ? 'text-white' : 'text-[#111111]'
            }`}>
              {titleText}
            </h3>
          )}
          {descriptionText && (
            <p className={`text-xs sm:text-sm mt-2 line-clamp-4 leading-relaxed ${
              isDarkBg ? 'text-white/70' : 'text-[#666666]'
            }`}>
              {descriptionText}
            </p>
          )}
        </div>

        {/* Bottom CTA */}
        {config.showCta !== false && (ctaText || config.ctaUrl) && (
          <div className="z-10 mt-auto pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCtaClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                isDarkBg 
                  ? 'bg-white text-black hover:bg-[#F3E5AB]' 
                  : 'bg-[#111111] text-white hover:bg-[#8F7137]'
              }`}
            >
              <span>{ctaText || (isAr ? 'اكتشف المزيد' : 'Learn More')}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. PRODUCT PROMOTION TYPE (When specific product is selected)
  if (config.type === 'product_promotion' && selectedProduct) {
    return (
      <div 
        id={`home-promo-banner-product-${selectedProduct.id}`}
        onClick={() => openProductDetail(selectedProduct)}
        className={`rounded-[20px] p-3.5 sm:p-5 md:p-6 flex flex-col justify-between relative cursor-pointer group hover:border-[#B89753]/60 transition-all shadow-sm min-w-0 h-[200px] sm:h-[260px] md:h-[260px] lg:h-[400px] xl:h-[420px] ${getBgClasses()} ${className}`}
        style={customStyle}
      >
        {/* Top Category / Badge Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate ${
              isDarkBg ? 'text-[#F3E5AB]' : 'text-[#737373]'
            }`}>
              {badgeText || selectedProduct.category || (isAr ? 'منتج مميز' : 'Special Feature')}
            </div>
            {Array.isArray((selectedProduct as any).colors) && (selectedProduct as any).colors.length > 0 && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {((selectedProduct as any).colors as string[]).map((col, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: col }}
                    title={col}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Image Container */}
        <div className="relative w-full h-[98px] min-[360px]:h-[104px] sm:h-[130px] lg:h-[200px] xl:h-[220px] my-auto py-1 sm:py-2 flex items-center justify-center overflow-hidden">
          <img
            src={config.imageUrl || selectedProduct.image}
            alt={selectedProduct.name}
            referrerPolicy="no-referrer"
            className={`max-h-full max-w-full object-${config.imageFit || 'contain'} object-center transition-all duration-500 group-hover:scale-105`}
          />
        </div>

        {/* Product Info + Action Button */}
        <div className="flex items-end justify-between gap-2 sm:gap-3 z-10 sm:pt-3 sm:mt-auto">
          <div className="min-w-0 flex-1">
            <h3 className={`text-[12px] min-[360px]:text-[13px] sm:text-[15px] font-bold line-clamp-2 leading-[1.25] sm:leading-snug ${
              isDarkBg ? 'text-white' : 'text-[#111111]'
            }`}>
              {titleText || (isAr ? (selectedProduct.arabicName || selectedProduct.name) : selectedProduct.name)}
            </h3>
            <p className={`text-[10px] sm:text-[12px] truncate mt-0.5 ${
              isDarkBg ? 'text-white/70' : 'text-[#666666]'
            }`}>
              {descriptionText || selectedProduct.artisan || selectedProduct.seller || (isAr ? 'حرفي لبناني' : 'Lebanese Artisan')}
            </p>
          </div>

          <button
            type="button"
            id={`promo-banner-add-to-cart-${selectedProduct.id}`}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(selectedProduct);
              showToast(isAr ? `تمت إضافة ${selectedProduct.arabicName || selectedProduct.name} إلى السلة` : `Added ${selectedProduct.name} to basket`, 'success');
            }}
            aria-label={isAr ? 'إضافة إلى السلة' : 'Add to cart'}
            className="flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-2 px-2.5 min-[360px]:px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#111111] hover:bg-[#8F7137] text-white text-[10px] min-[360px]:text-[11px] sm:text-[12px] font-medium tracking-wide shadow-xs transition-colors cursor-pointer flex-shrink-0 active:scale-95"
          >
            <span className="whitespace-nowrap">{isAr ? 'إضافة' : 'Add'}</span>
            <span className="opacity-40">|</span>
            <span className="font-bold text-[#F3E5AB] font-mono whitespace-nowrap">
              {formatPrice(selectedProduct.priceUSD)}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // 4. STANDARD CUSTOM / CATEGORY / IMAGE+TEXT BANNER (Default)
  return (
    <div 
      id="home-promo-banner-custom"
      onClick={config.ctaUrl ? () => handleCtaClick() : undefined}
      className={`rounded-[20px] p-3.5 sm:p-5 md:p-6 flex flex-col justify-between relative shadow-sm transition-all min-w-0 h-[200px] sm:h-[260px] md:h-[260px] lg:h-[400px] xl:h-[420px] ${
        config.ctaUrl ? 'cursor-pointer group hover:border-[#B89753]/60' : ''
      } ${getBgClasses()} ${className}`}
      style={customStyle}
    >
      {/* Top Header / Badge */}
      <div className="flex items-center justify-between z-10">
        {badgeText ? (
          <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate px-2.5 py-0.5 rounded-full ${
            isDarkBg ? 'bg-white/10 text-[#F3E5AB] border border-white/15' : 'bg-black/5 text-[#737373] border border-black/10'
          }`}>
            {badgeText}
          </div>
        ) : <div />}
        
        {config.showCta !== false && config.ctaUrl && (
          <div className={`text-xs opacity-70 group-hover:opacity-100 transition-opacity ${
            isDarkBg ? 'text-white' : 'text-[#737373]'
          }`}>
            <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>

      {/* Center Image (if provided) */}
      {config.imageUrl ? (
        <div className="relative w-full h-[90px] min-[360px]:h-[100px] sm:h-[125px] lg:h-[190px] xl:h-[210px] my-auto py-1 sm:py-2 flex items-center justify-center overflow-hidden">
          <img
            src={config.imageUrl}
            alt={titleText || 'Promotional Banner'}
            referrerPolicy="no-referrer"
            className={`max-h-full max-w-full object-${config.imageFit || 'contain'} object-center transition-all duration-500 group-hover:scale-105`}
          />
        </div>
      ) : (
        <div className="my-auto" />
      )}

      {/* Bottom Content Info & CTA */}
      <div className="flex items-end justify-between gap-2 sm:gap-3 z-10 sm:pt-2 sm:mt-auto">
        <div className="min-w-0 flex-1">
          {titleText && (
            <h3 className={`text-[12px] min-[360px]:text-[13px] sm:text-[15px] font-bold line-clamp-2 leading-[1.25] sm:leading-snug ${
              isDarkBg ? 'text-white' : 'text-[#111111]'
            }`}>
              {titleText}
            </h3>
          )}
          {descriptionText && (
            <p className={`text-[10px] sm:text-[12px] truncate mt-0.5 ${
              isDarkBg ? 'text-white/70' : 'text-[#666666]'
            }`}>
              {descriptionText}
            </p>
          )}
        </div>

        {config.showCta !== false && (ctaText || config.ctaUrl) && (
          <button
            type="button"
            onClick={handleCtaClick}
            aria-label={ctaText || (isAr ? 'استكشف' : 'Explore')}
            className={`flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-2 px-2.5 min-[360px]:px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[10px] min-[360px]:text-[11px] sm:text-[12px] font-medium tracking-wide shadow-xs transition-colors cursor-pointer flex-shrink-0 active:scale-95 ${
              isDarkBg 
                ? 'bg-white text-black hover:bg-[#F3E5AB]' 
                : 'bg-[#111111] hover:bg-[#8F7137] text-white'
            }`}
          >
            <span className="whitespace-nowrap">{ctaText || (isAr ? 'استكشف' : 'Explore')}</span>
            <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
