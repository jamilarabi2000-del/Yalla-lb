import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { CustomBlocksRenderer } from './CustomBlocksRenderer';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Minus,
  Plus,
  Share2,
  MessageCircle,
  EyeOff
} from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const { 
    selectedProductDetail, 
    setSelectedProductDetail,
    formatPrice, 
    addToCart, 
    toggleWishlist, 
    isInWishlist,
    products,
    goBack,
    t,
    language,
    siteContent,
    isVisualEditMode
  } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const visibility = siteContent.visibility || {
    detailBreadcrumbs: true,
    detailGallery: true,
    detailPriceBox: true,
    detailArtisanBio: true,
    detailCraftStory: true,
    detailWhatsAppInquiry: true,
    detailCustomerReviews: true,
    detailRelatedProducts: true
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setSelectedImage(null);
    setQuantity(1);
  }, [selectedProductDetail?.id]);

  if (!selectedProductDetail) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-900 space-y-4">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#a37f35] text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToProducts')}</span>
        </button>
      </div>
    );
  }

  const product = selectedProductDetail;
  const isLiked = isInWishlist(product.id);
  const currentImage = selectedImage || product.image;

  // All image options
  const allImages = [product.image, ...(product.additionalImages || [])];

  // Related products from same category or random
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.origin === product.origin) && p.isPublished !== false)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const displayTitle = language === 'ar' ? (product.arabicName || product.name) : product.name;

  const handleWhatsAppInquiry = () => {
    const phone = siteContent.productDetailPage?.inquiryWhatsAppNumber || '96170889234';
    const text = encodeURIComponent(
      `Hello Yalla-lb! I am interested in inquiring about "${displayTitle}" (ID: ${product.id}) priced at $${product.priceUSD}. Can you please assist me?`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Custom Divs / Banners */}
      <CustomBlocksRenderer page="product_detail" position="top" />

      {/* Top Header Navigation Bar with Prominent Back Button */}
      {(visibility.detailBreadcrumbs || isVisualEditMode) && (
        <div className="bg-white border-b border-slate-200 sticky top-[72px] z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <button
              id="product-detail-back-btn"
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-slate-300 shadow-2xs"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{t('back')}</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 truncate max-w-md">
              <span>{t(product.category === 'all' ? 'cat_all' : (`cat_${product.category}` as any))}</span>
              <span>/</span>
              <span className="font-bold text-slate-900 truncate">{displayTitle}</span>
            </div>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: displayTitle, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Share product"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Product Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Image Gallery */}
          {(visibility.detailGallery || isVisualEditMode) && (
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md">
                <img
                  src={currentImage}
                  alt={displayTitle}
                  className="w-full h-full object-cover object-center transition-all duration-300"
                  referrerPolicy="no-referrer"
                />

                {/* Wishlist Floating Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`absolute top-4 right-4 p-3 rounded-full transition-all z-10 cursor-pointer shadow-md ${
                    isLiked 
                      ? 'bg-rose-500 text-white scale-105' 
                      : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
                  {product.discountPercentage && (
                    <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-rose-600 text-white rounded-lg shadow-sm">
                      -{product.discountPercentage}%
                    </span>
                  )}
                  {product.isBestseller && (
                    <span className="px-3 py-1 text-xs font-black uppercase tracking-widest bg-emerald-600 text-white rounded-lg shadow-sm">
                      Bestseller
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail selector */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                        currentImage === img 
                          ? 'border-[#a37f35] shadow-md scale-102' 
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right Column: Product Meta, Price & Action */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="space-y-3 pb-6 border-b border-slate-200">
              {/* Main Product Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {displayTitle}
              </h1>

              {/* Artisan Name */}
              {(visibility.detailArtisanBio || isVisualEditMode) && (
                <p className="text-xs sm:text-sm text-slate-600">
                  {product.artisan === 'Maison El-Helou Firebird Cutlers' ? (
                    <>
                      <span className="text-slate-500">{language === 'ar' ? 'البائع:' : 'Seller:'}</span>{' '}
                      <span className="text-slate-950 font-bold">e.i PhotoCell</span>
                    </>
                  ) : product.artisan === 'Seller A' ? (
                    <>
                      <span className="text-slate-500">{language === 'ar' ? 'البائع:' : 'Seller:'}</span>{' '}
                      <span className="text-slate-950 font-bold">A</span>
                    </>
                  ) : product.artisan === 'Seller B' ? (
                    <>
                      <span className="text-slate-500">{language === 'ar' ? 'البائع:' : 'Seller:'}</span>{' '}
                      <span className="text-slate-950 font-bold">B</span>
                    </>
                  ) : product.artisan.startsWith('Seller:') ? (
                    <>
                      <span className="text-slate-500">{language === 'ar' ? 'البائع:' : 'Seller:'}</span>{' '}
                      <span className="text-slate-950 font-bold">{product.artisan.replace('Seller:', '').trim()}</span>
                    </>
                  ) : (
                    <>
                      {t('craftedBy')} <span className="text-slate-950 font-bold">{product.artisan}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Pricing Section */}
            {(visibility.detailPriceBox || isVisualEditMode) && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                    {formatPrice(product.priceUSD)}
                  </span>
                  {product.originalPriceUSD && (
                    <span className="text-lg text-slate-400 line-through font-medium">
                      {formatPrice(product.originalPriceUSD)}
                    </span>
                  )}
                </div>
                {product.weightOrVolume && (
                  <p className="text-xs text-slate-500 font-medium">
                    {t('quantity')}: {product.weightOrVolume}
                  </p>
                )}
              </div>
            )}

            {/* Description & Craft Story */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              <p>{product.description}</p>

              {/* Heritage Story Callout Box */}
              {(visibility.detailCraftStory || isVisualEditMode) && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#96783d]">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>{t('artisanLegacy')}</span>
                  </div>
                  <p className="text-xs text-slate-800 italic font-medium leading-relaxed">
                    "{product.craftStory || product.description}"
                  </p>
                </div>
              )}
            </div>

            {/* Quantity Selector & Add to Cart Action */}
            {(visibility.detailPriceBox || isVisualEditMode) && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-2xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer transition-all"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-900 px-3 min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer transition-all"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    id="detail-favorite-btn"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                    title={isLiked ? "Remove from favorites" : "Add to favorites"}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-center ${
                      isLiked 
                        ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100' 
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 transition-transform duration-200 ${isLiked ? 'fill-rose-600 text-rose-600 scale-110' : ''}`} />
                  </button>

                  <button
                    id="detail-add-to-cart-btn"
                    onClick={handleAddToCart}
                    className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 ${
                      justAdded 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#a37f35] hover:bg-[#8c6b2a] text-white'
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t('added')}!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t('addToCart')} {quantity > 1 ? `(${quantity})` : ''}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* WhatsApp Concierge Inquiry Button */}
                {(visibility.detailWhatsAppInquiry || isVisualEditMode) && (
                  <button
                    onClick={handleWhatsAppInquiry}
                    className="w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{siteContent.productDetailPage?.inquiryText || 'Inquire on WhatsApp with Master Artisan'}</span>
                  </button>
                )}

                {/* Value propositions */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-slate-600 font-medium text-center">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col items-center gap-1">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>{siteContent.productDetailPage?.freeDeliveryBadgeText || (language === 'ar' ? 'توصيل سريع' : 'Beirut Express')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'ar' ? 'منشأ موثوق' : 'Verified Origin'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col items-center gap-1">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>{language === 'ar' ? 'إرجاع سهل' : 'Easy Return'}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Middle Custom Divs / Banners */}
        <CustomBlocksRenderer page="product_detail" position="middle" />

        {/* Related Products Section */}
        {(visibility.detailRelatedProducts || isVisualEditMode) && relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">
              {siteContent.productDetailPage?.relatedItemsTitle || t('relatedProducts')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Custom Divs / Banners */}
        <CustomBlocksRenderer page="product_detail" position="bottom" />

      </div>
    </div>
  );
};
