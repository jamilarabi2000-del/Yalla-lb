import React from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { Heart, ArrowLeft, ArrowRight, ShoppingBag, Sparkles, Trash2, ShoppingCart } from 'lucide-react';

export const FavoritesView: React.FC = () => {
  const { wishlist, products, setActiveTab, clearWishlist, removeFromWishlist, addMultipleToCart, showToast, language } = useShop();

  const isArabic = language === 'ar';
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  // Deduplicate and filter products matching wishlist IDs
  const uniqueWishlistIds = Array.from(new Set(wishlist));
  const favoriteProducts = products.filter(p => uniqueWishlistIds.includes(p.id));

  const handleClearFavorites = () => {
    if (wishlist.length === 0) return;
    clearWishlist();
    showToast(
      isArabic ? 'تم إفراغ قائمة المفضلة' : 'Wishlist cleared',
      'info'
    );
  };

  const handleAddAllToCart = () => {
    const inStockItems = favoriteProducts.filter(p => p.stock > 0);
    if (inStockItems.length === 0) {
      showToast(
        isArabic ? 'جميع المنتجات المفضلة غير متوفرة حالياً' : 'None of the favorited items are currently in stock.',
        'warning'
      );
      return;
    }

    addMultipleToCart(inStockItems.map(p => ({ product: p, quantity: 1 })));

    showToast(
      isArabic 
        ? `تمت إضافة ${inStockItems.length} منتج إلى حقيبة التسوق` 
        : `Added ${inStockItems.length} item${inStockItems.length > 1 ? 's' : ''} to your basket!`,
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Breadcrumb / Back Link */}
          <button
            onClick={() => setActiveTab('products')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
          >
            <BackIcon className="w-4 h-4" />
            <span>{isArabic ? 'العودة إلى كل المنتجات' : 'Continue Shopping'}</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                  <Heart className="w-6 h-6 fill-rose-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-black">
                    {isArabic ? 'المفضلة والمحفوظات' : 'My Saved Favorites'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                    {isArabic 
                      ? 'القطع الحرفية اللبنانية المختارة التي حفظتها للرجوع إليها لاحقاً' 
                      : 'Handcrafted Lebanese treasures and artisan pieces you have saved'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons if Favorites exist */}
            {favoriteProducts.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleClearFavorites}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'إفراغ المفضلة' : 'Clear All'}</span>
                </button>

                <button
                  onClick={handleAddAllToCart}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'إضافة الكل إلى الحقيبة' : 'Add All to Cart'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {favoriteProducts.length === 0 ? (
          /* Empty Wishlist State */
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200 shadow-sm max-w-xl mx-auto space-y-6 my-8">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
              <Heart className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-black">
                {isArabic ? 'قائمة المفضلة فارغة حالياً' : 'Your Favorites List is Empty'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {isArabic 
                  ? 'لم تقم بحفظ أي منتج بعد. تصفح مجموعتنا الحرفية من الصابون، زيت الزيتون، النحاسيات، والمونة اللبنانية وانقر على رمز القلب لحفظها هنا.'
                  : 'You have not saved any artisan creations yet. Explore our handcrafted olive oils, brassware, soaps, and pantry items to save your favorites.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('products')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer hover:shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isArabic ? 'تصفح السوق اللبناني' : 'Explore Lebanese Marketplace'}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? '100% حرفي وأصيل' : '100% Authentic Lebanese'}</span>
              </span>
              <span>•</span>
              <span>{isArabic ? 'توصيل لجميع المناطق' : 'All-Lebanon Delivery'}</span>
            </div>
          </div>
        ) : (
          /* Favorites Grid */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                {isArabic ? 'المنتجات المحفوظة' : 'Saved Items'} ({favoriteProducts.length})
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {favoriteProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  showRemoveButton={true}
                  isFavoriteView={true}
                  onRemove={() => removeFromWishlist(product.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
