import React from 'react';
import { HeroBanner } from './HeroBanner';
import { OffersCarousel } from './OffersCarousel';
import { ProductCard } from './ProductCard';
import { NewsSection } from './NewsSection';
import { CustomBlocksRenderer } from './CustomBlocksRenderer';
import { useShop } from '../context/ShopContext';
import { 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Clock,
  Sparkles,
  EyeOff,
  Star,
  Quote,
  ArrowRight,
  Mail
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const { products, setActiveTab, setSelectedCategory, t, language, siteContent, isVisualEditMode, showToast, categories = [] } = useShop();

  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const visibility = siteContent.visibility || {
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

  // Filter and sort categories based on database/active state
  const sortedCategories = [...categories]
    .filter(cat => cat.isPublished !== false)
    .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

  const categoriesGrid = sortedCategories.map(cat => ({
    id: cat.id,
    name: language === 'ar' ? cat.nameAr : cat.nameEn,
    subtitle: language === 'ar' ? (cat.descriptionAr || '') : (cat.description || ''),
    image: cat.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
  }));

  // Filter products: Published check + featured / deals
  const publishedProducts = products.filter(p => p.isPublished !== false);
  const featuredProducts = publishedProducts.filter(p => p.isFeatured || p.isBestseller).slice(0, 8);
  const todaysDeals = publishedProducts.filter(p => p.discountPercentage && p.discountPercentage > 0).slice(0, 8);
  const newArrivals = [...publishedProducts].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    return 0;
  }).slice(0, 12);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 sm:space-y-14 pb-8 bg-slate-50">
      
      {/* Top Custom Divs / Banners */}
      <CustomBlocksRenderer page="home" position="top" />

      {/* Hero Banner with Search */}
      {(visibility.homeHero || isVisualEditMode) && (
        <div className={`relative ${!visibility.homeHero && isVisualEditMode ? 'opacity-70 border-4 border-dashed border-rose-500/80 p-2' : ''}`}>
          {!visibility.homeHero && isVisualEditMode && (
            <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden (Draft Preview)</span>
            </div>
          )}
          <HeroBanner />
        </div>
      )}

      {/* Promotional Offers & Campaign Banners Carousel */}
      {(visibility.homeOffers || isVisualEditMode) && (
        <div className={`relative ${!visibility.homeOffers && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          {!visibility.homeOffers && isVisualEditMode && (
            <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden (Draft Preview)</span>
            </div>
          )}
          <OffersCarousel />
        </div>
      )}

      {/* Middle Custom Divs / Banners */}
      <CustomBlocksRenderer page="home" position="middle" />

      {/* Explore by Category Grid */}
      {(visibility.homeCategories || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeCategories && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          {!visibility.homeCategories && isVisualEditMode && (
            <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden (Draft Preview)</span>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#b89753] mb-1">
                {language === 'ar' ? 'تصفح الأقسام' : 'Browse Departments'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
                {language === 'ar' ? (
                  siteContent.home?.regionsTitleArabic ? (
                    <span>{siteContent.home.regionsTitleArabic}</span>
                  ) : (
                    <>تسوق حسب <span className="gold-gradient font-serif italic">الفئات</span></>
                  )
                ) : (
                  siteContent.home?.regionsTitle ? (
                    <span>{siteContent.home.regionsTitle}</span>
                  ) : (
                    <>Explore by <span className="gold-gradient font-serif italic">Category</span></>
                  )
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' ? (
                  siteContent.home?.regionsSubtitleArabic || 'اكتشف الحرف اللبنانية، المؤونة، والأجهزة المنزلية بكل سهولة'
                ) : (
                  siteContent.home?.regionsSubtitle || 'Discover authentic Lebanese crafts, pantry delicacies, electronics, and home essentials'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {categoriesGrid.map((cat) => {
              const productCount = products.filter(p => p.category === cat.id && p.isPublished !== false).length;
              return (
                <div
                  key={cat.id}
                  id={`category-card-${cat.id}`}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer text-start"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    
                    {/* Subtle Ambient Gradient on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/10 opacity-40 group-hover:opacity-60 transition-opacity" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-slate-900/85 backdrop-blur-xs text-amber-300 rounded-md shadow-sm border border-amber-400/20">
                        {productCount > 0 
                          ? `${productCount} ${language === 'ar' ? 'منتجات' : 'items'}` 
                          : (language === 'ar' ? 'قسم' : 'Category')}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-3.5 sm:p-4 justify-between space-y-3 bg-white">
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-black group-hover:text-amber-700 transition-colors line-clamp-1 leading-snug">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {cat.subtitle}
                      </p>
                    </div>

                    {/* Action Row */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {language === 'ar' ? 'استكشف القسم' : 'Explore Category'}
                      </span>

                      <div className="w-8 h-8 rounded-xl bg-slate-900 group-hover:bg-amber-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs flex-shrink-0">
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(visibility.homeFeatured || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeFeatured && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#b89753] mb-1">
                {t('topPicks')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
                {language === 'ar' ? (
                  siteContent.home?.featuredTitleArabic ? (
                    <span>{siteContent.home.featuredTitleArabic}</span>
                  ) : (
                    <>المنتجات <span className="gold-gradient font-serif italic">المميزة</span></>
                  )
                ) : (
                  siteContent.home?.featuredTitle ? (
                    <span>{siteContent.home.featuredTitle}</span>
                  ) : (
                    <>Featured <span className="gold-gradient font-serif italic">Products</span></>
                  )
                )}
              </h2>
              {language === 'ar' ? (
                siteContent.home?.featuredSubtitleArabic ? (
                  <p className="text-xs text-slate-500 mt-1">{siteContent.home.featuredSubtitleArabic}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">مختارات مميزة تحتفي بالحرفية الأصيلة والمونة اللبنانية العريقة</p>
                )
              ) : (
                siteContent.home?.featuredSubtitle && (
                  <p className="text-xs text-slate-500 mt-1">{siteContent.home.featuredSubtitle}</p>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}



      {/* Today's Flash Deals */}
      {(visibility.homeDeals || isVisualEditMode) && todaysDeals.length > 0 && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeDeals && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('flashDiscounts')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
                {language === 'ar' ? (
                  <>عروض <span className="gold-gradient font-serif italic">اليوم</span></>
                ) : (
                  <>Today's <span className="gold-gradient font-serif italic">Deals</span></>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{t('limitedTimeOffers')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {todaysDeals.map((product) => (
              <ProductCard key={`deal-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {(visibility.homeNewArrivals || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeNewArrivals && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#b89753] mb-1">
                {t('freshlyStocked')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
                {language === 'ar' ? (
                  <>وصل حديثاً <span className="gold-gradient font-serif italic">إلينا</span></>
                ) : (
                  <>New <span className="gold-gradient font-serif italic">Arrivals</span></>
                )}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard key={`new-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* News & Stories Section */}
      {(visibility.homeNews || isVisualEditMode) && (
        <div className={`relative ${!visibility.homeNews && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl' : ''}`}>
          <NewsSection />
        </div>
      )}

      {/* Heritage Story Section */}
      {(visibility.homeHeritage || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeHeritage && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          <div className="bg-[#fcfaf8] border border-[#f5ece1] rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight mb-4">
              {language === 'ar' ? (siteContent.home?.heritageTitleArabic || siteContent.home?.heritageTitle || 'تراثنا') : (siteContent.home?.heritageTitle || 'Our Heritage')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mx-auto max-w-2xl">
              {language === 'ar' ? (siteContent.home?.heritageTextArabic || siteContent.home?.heritageText || '') : (siteContent.home?.heritageText || '')}
            </p>
          </div>
        </section>
      )}

      {/* Reviews / Testimonials Section */}
      {(visibility.homeReviews || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeReviews && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
              {language === 'ar' ? (siteContent.home?.reviewsTitleArabic || siteContent.home?.reviewsTitle || 'آراء الزبائن') : (siteContent.home?.reviewsTitle || 'Customer Reviews')}
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
              {language === 'ar' ? (siteContent.home?.reviewsSubtitleArabic || siteContent.home?.reviewsSubtitle || '') : (siteContent.home?.reviewsSubtitle || '')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex gap-1 text-amber-400 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 italic mb-4">"Absolutely authentic and beautiful craftsmanship. Reminds me of home."</p>
              <div className="font-bold text-xs text-slate-900">- Sarah K., Paris</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex gap-1 text-amber-400 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 italic mb-4">"The mouneh products are exactly how my grandmother used to make them!"</p>
              <div className="font-bold text-xs text-slate-900">- Elie M., Beirut</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex gap-1 text-amber-400 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 italic mb-4">"Quick delivery to Dubai and the packaging was excellent. Highly recommended."</p>
              <div className="font-bold text-xs text-slate-900">- Noor A., Dubai</div>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      {(visibility.homeNewsletter || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeNewsletter && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-6">
              {language === 'ar' ? (siteContent.home?.newsletterTitleArabic || siteContent.home?.newsletterTitle || 'النشرة البريدية') : (siteContent.home?.newsletterTitle || 'Join our Newsletter')}
            </h2>
            <div className="flex flex-col sm:flex-row w-full max-w-md gap-3">
              <input 
                type="email" 
                placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} 
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
              <button className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap">
                {language === 'ar' ? (siteContent.home?.newsletterButtonTextArabic || siteContent.home?.newsletterButtonText || 'اشترك') : (siteContent.home?.newsletterButtonText || 'Subscribe')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Custom Divs / Banners */}
      <CustomBlocksRenderer page="home" position="bottom" />

    </div>
  );
};
