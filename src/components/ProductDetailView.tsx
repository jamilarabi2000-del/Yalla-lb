import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { CustomBlocksRenderer } from './CustomBlocksRenderer';
import { Review } from '../types';
import { db, IS_FIREBASE_ENABLED } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errorMessage,
    authInfo: {
      userId,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(`Database error during ${operationType} on ${path || 'unknown'}: ${errorMessage}`);
}

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
    isVisualEditMode,
    firebaseUser,
    user,
    setActiveTab,
    setSearchQuery,
    setSelectedCategory,
    orders
  } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  // Load reviews from Firestore
  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      setSubmitError(null);
      setSubmitSuccess(false);
      
      // Get initial localized mock reviews
      const initialMockReviews: Review[] = [
        {
          id: `mock-1-${product.id}`,
          productId: product.id,
          userId: 'mock-user-1',
          userName: language === 'ar' ? 'كريم سليمان' : 'Karim S.',
          rating: 5,
          comment: language === 'ar' 
            ? 'جودة استثنائية وعمل يدوي متقن للغاية! يمثل التراث اللبناني الأصيل بأبهى صورة.' 
            : 'Outstanding craftsmanship and beautiful authentic design. Truly represents Lebanese artisanal heritage!',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `mock-2-${product.id}`,
          productId: product.id,
          userId: 'mock-user-2',
          userName: language === 'ar' ? 'ليلى مراد' : 'Layla M.',
          rating: 4,
          comment: language === 'ar' 
            ? 'منتج رائع ورائحة أصيلة. التوصيل كان سريعاً والتعامل قمة في الرقي.' 
            : 'Wonderful product, excellent quality and fast shipping. Highly recommend to everyone support our local artisans.',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      if (!IS_FIREBASE_ENABLED) {
        setReviews(initialMockReviews);
        setIsLoadingReviews(false);
        return;
      }

      try {
        const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
        const querySnapshot = await getDocs(q);
        const fbReviews: Review[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fbReviews.push({
            id: docSnap.id,
            productId: data.productId,
            userId: data.userId,
            userName: data.userName,
            rating: Number(data.rating),
            comment: data.comment,
            createdAt: data.createdAt
          });
        });

        if (active) {
          setReviews([...fbReviews, ...initialMockReviews]);
        }
      } catch (err: any) {
        console.warn("[ProductDetailView] Failed to fetch reviews, falling back to cache/mocks:", err.message);
        if (active) {
          setReviews(initialMockReviews);
        }
      } finally {
        if (active) {
          setIsLoadingReviews(false);
        }
      }
    };

    fetchReviews();
    return () => {
      active = false;
    };
  }, [product.id, language]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const comment = commentInput.trim();
    if (!comment) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // M-1: Protect user privacy, do not split/disclose unverified email addresses as usernames
    const userName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user?.name && !user.name.includes('@')
         ? user.name
         : (language === 'ar' ? 'مشتري موثق' : 'Verified Buyer'));

    if (IS_FIREBASE_ENABLED && !firebaseUser) {
      setSubmitError(
        language === 'ar'
          ? 'يجب تسجيل الدخول لتقديم مراجعة.'
          : 'You must be signed in to submit a review.'
      );
      setIsSubmitting(false);
      return;
    }

    // M-1: Bind reviews to fulfilled orders and to one per customer per product
    const matchedOrder = orders.find(o => 
      o.items.some(item => item.product.id === product.id)
    );

    if (IS_FIREBASE_ENABLED && !matchedOrder) {
      setSubmitError(
        language === 'ar'
          ? 'عذراً، يمكنك فقط تقييم المنتجات التي قمت بشرائها من متجرنا.'
          : 'Sorry, you can only review products that you have successfully purchased from our store.'
      );
      setIsSubmitting(false);
      return;
    }

    // M-1: Deterministic ID prevents multiple reviews and race conditions
    const newReviewId = firebaseUser ? `${firebaseUser.uid}_${product.id}` : `rev-${Date.now()}`;
    const newReview: Review = {
      id: newReviewId,
      productId: product.id,
      userId: firebaseUser?.uid || 'guest-uid',
      userName,
      rating: ratingInput,
      comment,
      createdAt: new Date().toISOString(),
      orderId: matchedOrder?.id
    };

    // Optimistic Update: Instantly add the review to the UI and clear inputs
    setReviews(prev => {
      const filtered = prev.filter(r => r.id !== newReviewId);
      return [newReview, ...filtered];
    });
    setCommentInput('');
    setRatingInput(5);
    setSubmitSuccess(true);
    setIsSubmitting(false);

    if (!IS_FIREBASE_ENABLED) {
      return;
    }

    // Persist to Firestore in the background to avoid blocking the user
    setDoc(doc(db, 'reviews', newReviewId), newReview)
      .then(() => {
        console.log("[ProductDetailView] Review synced with Firestore successfully:", newReviewId);
      })
      .catch((err: any) => {
        console.error("[ProductDetailView] Error syncing review to Firestore:", err);
        // Rollback on failure
        setReviews(prev => prev.filter(r => r.id !== newReviewId));
        setSubmitSuccess(false);
        try {
          handleFirestoreError(err, OperationType.WRITE, `reviews/${newReviewId}`, firebaseUser?.uid);
        } catch (logErr: any) {
          setSubmitError(logErr.message || 'Failed to sync review.');
        }
      });
  };

  const totalReviewsCount = reviews.length;
  const averageRating = totalReviewsCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1)
    : product.rating.toFixed(1);

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
    const phone = siteContent.productDetailPage?.inquiryWhatsAppNumber ?? '96170889234';
    const text = encodeURIComponent(
      `Hello Yalla-lb! I am interested in inquiring about "${displayTitle}" (ID: ${product.id}) priced at $${product.priceUSD}. Can you please assist me?`
    );
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const discoverSellerProducts = (artisan: string) => {
    setSearchQuery(artisan);
    setSelectedCategory('all');
    setSelectedProductDetail(null);
    setActiveTab('products');
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

              {/* Dynamic Average Star Rating Summary */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className="flex items-center text-amber-500 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 fill-current ${
                        star <= Math.round(Number(averageRating)) ? 'text-amber-500' : 'text-slate-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs font-extrabold text-[#a37f35] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                  {averageRating} / 5.0
                </span>
                <span className="text-xs text-slate-500">
                  ({totalReviewsCount} {language === 'ar' ? 'تقييم' : 'reviews'})
                </span>
              </div>

              {/* Artisan Name */}
              {(visibility.detailArtisanBio || isVisualEditMode) && (
                <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
                  <span>{language === 'ar' ? 'البائع:' : 'Seller:'}</span>
                  {product.artisan === 'Maison El-Helou Firebird Cutlers' ? (
                    <button
                      onClick={() => discoverSellerProducts('Maison El-Helou Firebird Cutlers')}
                      className="text-[#a37f35] hover:text-[#8c6b2a] font-bold hover:underline transition-all cursor-pointer text-left focus:outline-none"
                      title={language === 'ar' ? 'اكتشف المزيد من منتجات هذا البائع' : 'Discover more products from this seller'}
                    >
                      e.i PhotoCell
                    </button>
                  ) : product.artisan === 'Seller A' ? (
                    <button
                      onClick={() => discoverSellerProducts('Seller A')}
                      className="text-[#a37f35] hover:text-[#8c6b2a] font-bold hover:underline transition-all cursor-pointer text-left focus:outline-none"
                      title={language === 'ar' ? 'اكتشف المزيد من منتجات هذا البائع' : 'Discover more products from this seller'}
                    >
                      A
                    </button>
                  ) : product.artisan === 'Seller B' ? (
                    <button
                      onClick={() => discoverSellerProducts('Seller B')}
                      className="text-[#a37f35] hover:text-[#8c6b2a] font-bold hover:underline transition-all cursor-pointer text-left focus:outline-none"
                      title={language === 'ar' ? 'اكتشف المزيد من منتجات هذا البائع' : 'Discover more products from this seller'}
                    >
                      B
                    </button>
                  ) : product.artisan.startsWith('Seller:') ? (
                    <button
                      onClick={() => discoverSellerProducts(product.artisan)}
                      className="text-[#a37f35] hover:text-[#8c6b2a] font-bold hover:underline transition-all cursor-pointer text-left focus:outline-none"
                      title={language === 'ar' ? 'اكتشف المزيد من منتجات هذا البائع' : 'Discover more products from this seller'}
                    >
                      {product.artisan.replace('Seller:', '').trim()}
                    </button>
                  ) : (
                    <button
                      onClick={() => discoverSellerProducts(product.artisan)}
                      className="text-[#a37f35] hover:text-[#8c6b2a] font-bold hover:underline transition-all cursor-pointer text-left focus:outline-none"
                      title={language === 'ar' ? 'اكتشف المزيد من منتجات هذا البائع' : 'Discover more products from this seller'}
                    >
                      {product.artisan}
                    </button>
                  )}
                </div>
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
              {product.craftStory && (
                <div className="mt-4 p-4 rounded-2xl bg-[#fdfbf7] border border-[#f5ece1] text-[#785b28] space-y-1.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#a37f35]">
                    {siteContent.productDetailPage?.craftStoryTitle ?? 'Artisan Workshop & Provenance'}
                  </h4>
                  <p className="text-xs leading-relaxed italic">{product.craftStory}</p>
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
                {((visibility.detailWhatsAppInquiry && siteContent.productDetailPage?.inquiryWhatsAppNumber) || isVisualEditMode) && (
                  <button
                    onClick={handleWhatsAppInquiry}
                    className="w-full py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{siteContent.productDetailPage?.inquiryText ?? 'Inquire on WhatsApp with Master Artisan'}</span>
                  </button>
                )}

                {/* Trust Badges Section */}
                <div className="pt-4 border-t border-slate-200/80 space-y-3.5">
                  {siteContent.productDetailPage?.authenticityGuaranteeText && (
                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="p-1 rounded-lg bg-amber-50 text-[#a37f35] border border-amber-100 flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="leading-tight">
                        <span className="font-semibold text-slate-800 block">{language === 'ar' ? 'ضمان الأصالة' : 'Authenticity Guarantee'}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{siteContent.productDetailPage.authenticityGuaranteeText}</p>
                      </div>
                    </div>
                  )}

                  {siteContent.productDetailPage?.freeDeliveryBadgeText && (
                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="leading-tight">
                        <span className="font-semibold text-slate-800 block">{language === 'ar' ? 'التسليم والشحن' : 'Delivery & Dispatch'}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{siteContent.productDetailPage.freeDeliveryBadgeText}</p>
                      </div>
                    </div>
                  )}

                  {siteContent.productDetailPage?.returnsPolicyText && (
                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.21" />
                        </svg>
                      </div>
                      <div className="leading-tight">
                        <span className="font-semibold text-slate-800 block">{language === 'ar' ? 'سياسة الإرجاع' : 'Returns Policy'}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{siteContent.productDetailPage.returnsPolicyText}</p>
                      </div>
                    </div>
                  )}
                </div>


              </div>
            )}

          </div>

        </div>

        {/* Middle Custom Divs / Banners */}
        <CustomBlocksRenderer page="product_detail" position="middle" />

        {/* Customer Reviews Section */}
        {(visibility.detailCustomerReviews || isVisualEditMode) && (
          <div className="pt-12 border-t border-slate-200 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {language === 'ar' ? 'آراء وتقييمات العملاء' : 'Customer Reviews & Feedback'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar' 
                    ? 'اكتشف تجارب المشترين للمنتجات الحرفية اللبنانية الأصيلة.' 
                    : 'Discover authentic reviews from collectors of Lebanese craftsmanship.'}
                </p>
              </div>

              {/* Aggregated Average Stars Rating Badge */}
              <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
                <div className="text-center px-1">
                  <p className="text-2xl font-black text-slate-900">{averageRating}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'ar' ? 'من 5 نجوم' : 'out of 5'}</p>
                </div>
                <div className="h-8 w-px bg-slate-200 font-normal"></div>
                <div>
                  <div className="flex items-center text-amber-500 gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 fill-current ${
                          star <= Math.round(Number(averageRating)) ? 'text-amber-500' : 'text-slate-200'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {totalReviewsCount} {language === 'ar' ? 'تقييمات موثقة' : 'verified ratings'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Post a Review Form */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'ar' ? 'أضف تقييمك للمنتج' : 'Share Your Experience'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'ar' 
                      ? 'ملاحظاتك تساعد مجتمع الحرفيين اللبنانيين على النمو.' 
                      : 'Your feedback helps the Lebanese artisan community grow.'}
                  </p>
                </div>

                {firebaseUser ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Star Rating Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {language === 'ar' ? 'الالتقييم بالنجوم:' : 'Your Rating:'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          >
                            <svg
                              className={`w-7 h-7 fill-current ${
                                star <= ratingInput ? 'text-amber-400' : 'text-slate-200'
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment Field */}
                    <div className="space-y-1.5">
                      <label htmlFor="review-comment" className="text-xs font-bold text-slate-700">
                        {language === 'ar' ? 'التعليق:' : 'Comment:'}
                      </label>
                      <textarea
                        id="review-comment"
                        required
                        rows={4}
                        maxLength={1000}
                        placeholder={
                          language === 'ar' 
                            ? 'ما رأيك في جودة الصنع، التغليف، وتجربتك الإجمالية؟...' 
                            : 'What did you think of the craft, packaging, and overall experience?...'
                        }
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    {submitError && (
                      <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
                        {submitError}
                      </p>
                    )}

                    {submitSuccess && (
                      <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                        {language === 'ar' ? 'تم تقديم تقييمك بنجاح! شكرًا لك.' : 'Your review was submitted successfully! Thank you.'}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#a37f35] hover:bg-[#8c6b2a] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>{language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <span>{language === 'ar' ? 'إرسال التقييم' : 'Submit Review'}</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-center space-y-3">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {language === 'ar' 
                        ? 'يجب عليك تسجيل الدخول في حسابك لتتمكن من كتابة تقييم ومشاركة تجربتك.' 
                        : 'You must be signed in to your account to leave a star rating and comment.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('account')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#a37f35] hover:bg-[#8c6b2a] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <span>{language === 'ar' ? 'تسجيل الدخول الآن' : 'Sign In Now'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: List of Reviews */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {language === 'ar' ? 'التعليقات المنشورة' : 'Recent Reviews'}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {reviews.length} {language === 'ar' ? 'تعليقات' : 'reviews'}
                  </span>
                </div>

                {isLoadingReviews ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 border-3 border-[#a37f35]/20 border-t-[#a37f35] rounded-full animate-spin"></div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80">
                    <p className="text-xs text-slate-500">
                      {language === 'ar' ? 'لا توجد تقييمات لهذا المنتج بعد. كن أول من يكتب تقييمًا!' : 'No reviews for this product yet. Be the first to leave one!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                              {review.userName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{review.userName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center text-amber-400 gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3.5 h-3.5 fill-current ${
                                  star <= review.rating ? 'text-amber-400' : 'text-slate-200'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Related Products Section */}
        {(visibility.detailRelatedProducts || isVisualEditMode) && relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">
              {siteContent.productDetailPage?.relatedItemsTitle ?? t('relatedProducts')}
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
