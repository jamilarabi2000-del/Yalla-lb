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
  const { products, setActiveTab, setSelectedCategory, t, language, siteContent, isVisualEditMode, showToast } = useShop();

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

      {/* Heritage Trust Badges */}
      {(visibility.homeTrustBadges || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeTrustBadges && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          {!visibility.homeTrustBadges && isVisualEditMode && (
            <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden (Draft Preview)</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-xs">
              <div className="p-3 rounded-xl bg-amber-50 text-[#a37f35] border border-amber-100 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-950">
                  {language === 'ar' ? 'ضمان الأصالة اللبنانية' : '100% Authenticity Guarantee'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === 'ar' 
                    ? 'منتجات تراثية ومؤونة بلدية أصلية مصنوعة يدوياً بالكامل في ورش محلية.' 
                    : 'Genuine artisan heirloom crafts and rural terroir pantry provisions directly from Lebanon.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-xs">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-950">
                  {language === 'ar' ? 'شحن سريع وموثوق' : 'Secure Regional Dispatch'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === 'ar' 
                    ? 'توصيل مخصص مباشرة من مستودع بيروت المركزي إلى كافة المناطق والبلدان.' 
                    : 'Dedicated couriers routing packages from our central depot to local and global locations.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-xs">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-950">
                  {language === 'ar' ? 'دعم الاقتصاد المحلي' : 'Direct Artisan Support'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === 'ar' 
                    ? 'كل عملية شراء تمكّن الحرفيين والتعاونيات الريفية من مواصلة أعمالهم.' 
                    : 'Every basket purchased empowers rural families, women cooperatives, and master workshops.'}
                </p>
              </div>
            </div>
          </div>
        </section>
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
                {siteContent.home?.regionsTitle ? (
                  <span>{siteContent.home.regionsTitle}</span>
                ) : language === 'ar' ? (
                  <>تسوق حسب <span className="gold-gradient font-serif italic">الفئات</span></>
                ) : (
                  <>Explore by <span className="gold-gradient font-serif italic">Category</span></>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {siteContent.home?.regionsSubtitle ? (
                  <span>{siteContent.home.regionsSubtitle}</span>
                ) : language === 'ar' ? (
                  'اكتشف الحرف اللبنانية، المؤونة، والأجهزة المنزلية بكل سهولة'
                ) : (
                  'Discover authentic Lebanese crafts, pantry delicacies, electronics, and home essentials'
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

      {/* Preserving Lebanese Cultural Heritage Story Section */}
      {(visibility.homeHeritage || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeHeritage && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          {!visibility.homeHeritage && isVisualEditMode && (
            <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden (Draft Preview)</span>
            </div>
          )}
          <div className="rounded-3xl bg-[#fdfbf7] border border-[#f5ece1] p-8 sm:p-12 overflow-hidden relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#b89753]">
                  {language === 'ar' ? 'الرسالة والتراث الثقافي' : 'Cultural Mission & Impact'}
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#4a3b2c] leading-tight">
                  {siteContent.home?.heritageTitle ?? 'Preserving Lebanese Cultural Heritage'}
                </h3>
                <p className="text-xs sm:text-sm text-[#705c49] leading-relaxed font-normal whitespace-pre-line">
                  {siteContent.home?.heritageText ?? 'Every purchase on Yalla directly supports independent artisan workshops, local cooperatives, and family businesses across Lebanon.'}
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setActiveTab('products');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <span>{language === 'ar' ? 'ادعم الحرفيين الآن' : 'Support Our Artisans'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="relative aspect-video lg:aspect-square w-full rounded-2xl overflow-hidden shadow-xl border border-[#f5ece1]">
                <img 
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" 
                  alt="Traditional Lebanese craft workshop" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 text-start">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#a37f35] block mb-1">
                    {language === 'ar' ? 'ورشة عمل نشطة' : 'Active Workshop'}
                  </span>
                  <p className="text-[11px] text-slate-700 leading-normal font-medium">
                    {language === 'ar' 
                      ? 'دعم الحرفيين المباشر عبر جبل لبنان، طرابلس، وصيدا لحماية التراث الحي.' 
                      : 'Facilitating micro-grants and premium market access for traditional workshops.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Words from Our Global & Local Patrons - Home Testimonials */}
      {(visibility.homeReviews || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeReviews && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          {!visibility.homeReviews && isVisualEditMode && (
            <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden (Draft Preview)</span>
            </div>
          )}
          <div className="text-center space-y-2 mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#b89753]">
              {language === 'ar' ? 'آراء ورسائل المغتربين والزبائن' : 'Testimonials & Reviews'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
              {siteContent.home?.reviewsTitle ?? 'Words from Our Global & Local Patrons'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
              {siteContent.home?.reviewsSubtitle ?? 'Verified feedback from customers experiencing authentic Levantine craftsmanship.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Jamal Al-Sayegh',
                location: 'Montreal, Canada (Diaspora)',
                date: 'July 14, 2026',
                stars: 5,
                text: language === 'ar' 
                  ? 'وصل زيت الزيتون ودبس الرمان المغلفين بعناية إلى عتبة منزلي في مونتريال. رائحة ونكهة الضيعة اللبنانية حقيقية تماماً وتذكرني بالوطن.'
                  : 'The cold-pressed extra virgin olive oil and mountain wild honey arrived in Montreal perfectly wrapped. The pure taste of Mount Lebanon terroir in every spoonful!'
              },
              {
                name: 'Christine D.',
                location: 'Paris, France',
                date: 'August 03, 2026',
                stars: 5,
                text: language === 'ar' 
                  ? 'طلبنا طاولة خشبية مدمجة بالصدف مخصصة ومصنوعة يدوياً. دقة التفاصيل وجودة الصدف مذهلة وخدمة دعم العملاء ممتازة.'
                  : 'Our inlaid mother-of-pearl copper box is absolutely breath-taking. Handcrafted details and extremely secure worldwide DHL shipping from Beirut!'
              },
              {
                name: 'Samer Mounir',
                location: 'Beirut, Lebanon',
                date: 'August 18, 2026',
                stars: 5,
                text: language === 'ar' 
                  ? 'توصيل سريع جداً في لبنان ودفع مريح بالدولار نقداً عند الاستلاف. الحرفيون اللبنانيون فخرنا وجودتهم لا تضاهى.'
                  : 'Flawless domestic courier delivery to Beirut and super convenient cash-on-delivery in fresh USD. Highly recommend supporting these master workshops!'
              }
            ].map((rev, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.stars }).map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic text-start">
                    "{rev.text}"
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="text-start">
                    <span className="font-extrabold text-slate-800 block">{rev.name}</span>
                    <span>{rev.location}</span>
                  </div>
                  <span>{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Join the Heritage Circle Newsletter Section */}
      {(visibility.homeNewsletter || isVisualEditMode) && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative ${!visibility.homeNewsletter && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 rounded-3xl p-4' : ''}`}>
          {!visibility.homeNewsletter && isVisualEditMode && (
            <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden (Draft Preview)</span>
            </div>
          )}
          <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white space-y-5 relative overflow-hidden border border-white/10 shadow-xl">
            {/* Background elements */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                {siteContent.home?.newsletterTitle ?? 'Join the Yalla Heritage Circle'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                {siteContent.home?.newsletterSubtitle ?? 'Subscribe to receive exclusive artisan stories, seasonal harvest drops, and special diaspora promotions.'}
              </p>
            </div>

            {subscribed ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold max-w-md mx-auto animate-fadeIn relative z-10">
                {language === 'ar' 
                  ? 'شكراً لك! لقد انضممت بنجاح إلى حلقة تراث يلا.' 
                  : 'Thank you! You have successfully subscribed to the Yalla Heritage Circle.'}
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email) return;
                  setSubscribed(true);
                  showToast(language === 'ar' ? 'تم الاشتراك بنجاح!' : 'Successfully subscribed to Heritage Circle!', 'success');
                }}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto relative z-10"
              >
                <input 
                  type="email" 
                  required
                  placeholder={language === 'ar' ? 'بريدك الإلكتروني...' : 'Enter your email...'} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 text-slate-900 bg-white placeholder:text-slate-400 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <button 
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all whitespace-nowrap shadow-md"
                >
                  {siteContent.home?.newsletterButtonText ?? 'Subscribe Now'}
                </button>
              </form>
            )}
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
