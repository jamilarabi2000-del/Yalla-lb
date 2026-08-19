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
  Quote
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const { products, setActiveTab, setSelectedCategory, t, language, siteContent, isVisualEditMode } = useShop();

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

  const categoriesGrid = [
    {
      id: 'electronics',
      name: t('cat_electronics'),
      subtitle: language === 'ar' ? 'أحدث الأجهزة والتكنولوجيا' : 'Latest gadgets & tech',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'fashion',
      name: t('cat_fashion'),
      subtitle: language === 'ar' ? 'أزياء تناسب ذوقك' : 'Style that moves',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'home',
      name: t('cat_home'),
      subtitle: language === 'ar' ? 'أثاث وديكور لمنزلك' : 'Elevate your space',
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'beauty',
      name: t('cat_beauty'),
      subtitle: language === 'ar' ? 'منتجات العناية بالبشرة' : 'Glow naturally',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'sports',
      name: t('cat_sports'),
      subtitle: language === 'ar' ? 'معدات رياضية متميزة' : 'Push your limits',
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'books',
      name: t('cat_books'),
      subtitle: language === 'ar' ? 'كتب وروايات عربية وعالمية' : 'Feed your mind',
      image: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'toys',
      name: t('cat_toys'),
      subtitle: language === 'ar' ? 'ألعاب لكل الأعمار' : 'Fun for all ages',
      image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'grocery',
      name: t('cat_grocery'),
      subtitle: language === 'ar' ? 'منتجات طازجة وحرفية' : 'Fresh from Lebanon',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'yalla-global',
      name: t('cat_yalla_global'),
      subtitle: language === 'ar' ? 'منتجات مميزة من حول العالم' : 'Handpicked worldwide selections',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'stationery',
      name: t('cat_stationery'),
      subtitle: language === 'ar' ? 'دفاتر وأدوات مكتبية' : 'Desk & office essentials',
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'tools-hardware',
      name: t('cat_tools_hardware'),
      subtitle: language === 'ar' ? 'أدوات ومعدات صلبة' : 'Reliable tools & hardware',
      image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'plumbing',
      name: t('cat_plumbing'),
      subtitle: language === 'ar' ? 'مستلزمات وأدوات السباكة' : 'Premium pipes & fixtures',
      image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'beauty-personal-care',
      name: t('cat_beauty_personal_care'),
      subtitle: language === 'ar' ? 'عناية بالبشرة، صابون طبيعي ومستلزمات العناية الشخصية' : 'Luxe skincare, soaps & personal care',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'linen-bath',
      name: t('cat_linen_bath'),
      subtitle: language === 'ar' ? 'ملاءات مريحة، أغطية ومناشف حمام' : 'Comfort sheets, blankets & towels',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'houseware',
      name: t('cat_houseware'),
      subtitle: language === 'ar' ? 'أواني وأدوات المطبخ' : 'Daily kitchen utilities',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'digital',
      name: t('cat_digital'),
      subtitle: language === 'ar' ? 'ملحقات وإكسسوارات ذكية' : 'Smart accessories',
      image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'indoor-furniture',
      name: t('cat_indoor_furniture'),
      subtitle: language === 'ar' ? 'طاولات، كراسي وأثاث منازل مصمم يدوياً' : 'Handcrafted indoor tables & chairs',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'outdoor-furniture',
      name: t('cat_outdoor_furniture'),
      subtitle: language === 'ar' ? 'جلسات حدائق، طاولات ومقاعد خارجية' : 'Patio sets & garden seating',
      image: 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'lawn-garden',
      name: t('cat_lawn_garden'),
      subtitle: language === 'ar' ? 'أدوات الحديقة، النباتات ومستلزمات الهواء الطلق' : 'Gardening tools & plants',
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'decor',
      name: t('cat_decor'),
      subtitle: language === 'ar' ? 'لمسات وتحف فنية' : 'Artistic home accents',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'lighting',
      name: t('cat_lighting'),
      subtitle: language === 'ar' ? 'مصابيح ووحدات إنارة' : 'Warm ambient light fixtures',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'electrical',
      name: t('cat_electrical'),
      subtitle: language === 'ar' ? 'توصيلات ومعدات كهربائية' : 'Sockets & electrical gear',
      image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'cleaning',
      name: t('cat_cleaning'),
      subtitle: language === 'ar' ? 'أدوات ومواد تنظيف' : 'Eco-friendly cleaning supplies',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'consumable',
      name: t('cat_consumable'),
      subtitle: language === 'ar' ? 'مؤونة، قهوة، عسل ومربيات' : 'Artisanal coffee, honey & jams',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
    }
  ];

  // Filter products: Published check + featured / deals
  const publishedProducts = products.filter(p => p.isPublished !== false);
  const featuredProducts = publishedProducts.filter(p => p.isFeatured || p.isBestseller).slice(0, 8);
  const todaysDeals = publishedProducts.filter(p => p.discountPercentage && p.discountPercentage > 0).slice(0, 8);
  const newArrivals = publishedProducts.slice(0, 12);

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
                  <>تسوق حسب <span className="gold-gradient font-serif italic">الفئات</span></>
                ) : (
                  <>Explore by <span className="gold-gradient font-serif italic">Category</span></>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' 
                  ? 'اكتشف الحرف اللبنانية، المؤونة، والأجهزة المنزلية بكل سهولة' 
                  : 'Discover authentic Lebanese crafts, pantry delicacies, electronics, and home essentials'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {categoriesGrid.map((cat) => (
              <button
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => handleCategoryClick(cat.id)}
                className="group relative flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400/80 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden mb-3 bg-slate-100 relative shadow-inner">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {cat.subtitle}
                </p>
              </button>
            ))}
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
                {siteContent.home?.featuredTitle ? (
                  <span>{siteContent.home.featuredTitle}</span>
                ) : language === 'ar' ? (
                  <>المنتجات <span className="gold-gradient font-serif italic">المميزة</span></>
                ) : (
                  <>Featured <span className="gold-gradient font-serif italic">Products</span></>
                )}
              </h2>
              {siteContent.home?.featuredSubtitle && (
                <p className="text-xs text-slate-500 mt-1">{siteContent.home.featuredSubtitle}</p>
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

      {/* Bottom Custom Divs / Banners */}
      <CustomBlocksRenderer page="home" position="bottom" />

    </div>
  );
};
