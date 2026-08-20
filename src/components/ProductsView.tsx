import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { CustomBlocksRenderer } from './CustomBlocksRenderer';
import { 
  Filter, 
  SlidersHorizontal, 
  Search, 
  Sparkles, 
  MapPin, 
  RotateCcw,
  Check,
  ArrowLeft,
  EyeOff
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { 
    products, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory,
    goBack,
    t,
    language,
    siteContent,
    isVisualEditMode
  } = useShop();

  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'rating'>('featured');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  const visibility = siteContent.visibility || {
    productsHeader: true,
    productsSearchFilter: true,
    productsCategoryTabs: true,
    productsSort: true,
    productsGrid: true
  };

  const categories = [
    { id: 'all', name: t('cat_all'), icon: '✨' },
    { id: 'electronics', name: t('cat_electronics'), icon: '⚡' },
    { id: 'fashion', name: t('cat_fashion'), icon: '👔' },
    { id: 'home', name: t('cat_home'), icon: '🛋️' },
    { id: 'beauty', name: t('cat_beauty'), icon: '💄' },
    { id: 'sports', name: t('cat_sports'), icon: '⚽' },
    { id: 'books', name: t('cat_books'), icon: '📚' },
    { id: 'toys', name: t('cat_toys'), icon: '🧸' },
    { id: 'grocery', name: t('cat_grocery'), icon: '🛒' },
    { id: 'yalla-global', name: t('cat_yalla_global'), icon: '🌐' },
    { id: 'stationery', name: t('cat_stationery'), icon: '📝' },
    { id: 'tools-hardware', name: t('cat_tools_hardware'), icon: '🛠️' },
    { id: 'plumbing', name: t('cat_plumbing'), icon: '🚰' },
    { id: 'beauty-personal-care', name: t('cat_beauty_personal_care'), icon: '🧴' },
    { id: 'linen-bath', name: t('cat_linen_bath'), icon: '🛌' },
    { id: 'houseware', name: t('cat_houseware'), icon: '🍳' },
    { id: 'digital', name: t('cat_digital'), icon: '📱' },
    { id: 'indoor-furniture', name: t('cat_indoor_furniture'), icon: '🪑' },
    { id: 'outdoor-furniture', name: t('cat_outdoor_furniture'), icon: '🪴' },
    { id: 'lawn-garden', name: t('cat_lawn_garden'), icon: '🌿' },
    { id: 'decor', name: t('cat_decor'), icon: '🖼️' },
    { id: 'lighting', name: t('cat_lighting'), icon: '💡' },
    { id: 'electrical', name: t('cat_electrical'), icon: '🔌' },
    { id: 'cleaning', name: t('cat_cleaning'), icon: '🧼' },
    { id: 'consumable', name: t('cat_consumable'), icon: '🍯' }
  ];

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // If product is unpublished and not in draft edit mode, filter out
      if (product.isPublished === false && !isVisualEditMode) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Stock filter
      if (onlyInStock && product.stock <= 0) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesAr = product.arabicName ? product.arabicName.toLowerCase().includes(query) : false;
        const matchesArtisan = product.artisan.toLowerCase().includes(query);
        const matchesOrigin = product.origin.toLowerCase().includes(query);
        const matchesTags = product.tags.some(t => t.toLowerCase().includes(query));
        const matchesKeywords = product.keywords ? product.keywords.some(k => k.toLowerCase().includes(query)) : false;
        const matchesDesc = product.description.toLowerCase().includes(query);
        if (!matchesName && !matchesAr && !matchesArtisan && !matchesOrigin && !matchesTags && !matchesKeywords && !matchesDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.priceUSD - b.priceUSD;
      if (sortBy === 'price_high') return b.priceUSD - a.priceUSD;
      if (sortBy === 'rating') return b.rating - a.rating;
      // Default: featured first, then rating
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.rating - a.rating;
    });
  }, [products, selectedCategory, onlyInStock, searchQuery, sortBy, isVisualEditMode]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSortBy('featured');
    setOnlyInStock(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Top Custom Divs / Banners */}
      <CustomBlocksRenderer page="products" position="top" />

      {/* Header Banner */}
      {(visibility.productsHeader || isVisualEditMode) && (
        <div className={`bg-slate-900 border-b border-slate-800 pt-6 pb-12 px-4 sm:px-6 lg:px-8 relative ${!visibility.productsHeader && isVisualEditMode ? 'opacity-70 border-4 border-dashed border-rose-500/80' : ''}`}>
          {!visibility.productsHeader && isVisualEditMode && (
            <div className="absolute top-3 right-4 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Catalog Header Hidden (Draft Mode)</span>
            </div>
          )}
          <div className="max-w-7xl mx-auto space-y-4">
            <button
              id="products-page-back-btn"
              onClick={goBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer mb-2"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{t('back')}</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t('verifiedProvenance')}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {siteContent?.productsPage?.title ?? (
                    language === 'ar' ? (
                      <>كتالوج المنتجات الحرفية <span className="text-amber-400 font-serif italic">اللبنانية</span></>
                    ) : (
                      <>Lebanese Artisan <span className="text-amber-400 font-serif italic">Catalog</span></>
                    )
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
                  {siteContent?.productsPage?.subtitle ?? (
                    language === 'ar' 
                      ? 'اكتشف المؤونة الغذائية، والحرف اليدوية التراثية، وزيت الزيتون العضوي، والمنتجات المحلية المباشرة من جميع المناطق اللبنانية.'
                      : 'Discover culinary treasures, heirloom handcrafts, organic olive oils, and artisanal creations directly sourced across Lebanon.'
                  )}
                </p>
              </div>

              {/* Quick stats badge */}
              <div className="flex items-center gap-3 bg-slate-800/90 px-4 py-2.5 rounded-2xl border border-white/15">
                <div>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{language === 'ar' ? 'متوفر' : 'Available'}</p>
                  <p className="text-lg font-black text-amber-400">{filteredProducts.length} {language === 'ar' ? 'منتج' : 'Items'}</p>
                </div>
              </div>
            </div>

            {/* Search bar inside header */}
            {(visibility.productsSearchFilter || isVisualEditMode) && (
              <div className="pt-3 relative max-w-2xl group">
                <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-[26px] w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none`} />
                <input
                  type="text"
                  id="products-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={siteContent?.productsPage?.searchPlaceholder ?? t('searchPlaceholder')}
                  className={`w-full ${language === 'ar' ? 'pr-11 pl-20' : 'pl-11 pr-20'} py-3.5 bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all shadow-lg font-medium`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer"
                  >
                    {t('clear')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Middle Custom Divs / Banners */}
      <CustomBlocksRenderer page="products" position="middle" />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Category Filter Chips Bar */}
        {(visibility.productsCategoryTabs || isVisualEditMode) && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-md scale-102'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Secondary Controls: Sort Options & Filters */}
        {(visibility.productsSort || isVisualEditMode) && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            
            <div className="text-xs font-medium text-slate-600">
              {language === 'ar' ? 'التصفية حسب الفئة والتوافر' : 'Filtering by Category & Availability'}
            </div>

            {/* Sort & Stock Toggles */}
            <div className="flex flex-wrap items-center gap-3">
              
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">{language === 'ar' ? 'الترتيب حسب:' : 'Sort by:'}</span>
                <select
                  id="sort-by-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none"
                >
                  <option value="featured">{language === 'ar' ? 'المنتجات المميزة' : 'Featured Items'}</option>
                  <option value="price_low">{language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="price_high">{language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                </select>
              </div>

              {/* In stock only toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
                <input
                  type="checkbox"
                  id="in-stock-only-checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs">{language === 'ar' ? 'المتوفر فقط' : 'In Stock Only'}</span>
              </label>

              {/* Reset Filters */}
              {(selectedCategory !== 'all' || searchQuery || onlyInStock) && (
                <button
                  id="reset-filters-btn"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-semibold px-2 py-1 rounded bg-amber-50 border border-amber-200 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
                </button>
              )}

            </div>

          </div>
        )}

        {/* Products Grid */}
        {(visibility.productsGrid || isVisualEditMode) && (
          <div className="mt-8">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-amber-600">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'ar' ? 'لم يتم العثور على نتائج مطابقة لجميع الفلاتر' : 'No Lebanese creations matched your search'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'جرب البحث عن كلمة أخرى أو تصفح الأقسام المختلفة.' : 'Try clearing your search keyword or switching territory/category filters.'}
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-amber-600 text-white font-bold uppercase text-xs tracking-widest cursor-pointer rounded-xl hover:bg-amber-700 transition-colors"
                >
                  {language === 'ar' ? 'عرض جميع المنتجات اللبنانية' : 'Show All Lebanese Products'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Custom Divs / Banners */}
      <CustomBlocksRenderer page="products" position="bottom" />

    </div>
  );
};
