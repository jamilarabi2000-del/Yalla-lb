import React from 'react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  isFavoriteView?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, showRemoveButton, onRemove, isFavoriteView }) => {
  const { 
    formatPrice, 
    openProductDetail,
    addToCart,
    language,
    t,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist
  } = useShop();

  const isLiked = isInWishlist(product.id);

  // One language only in grid card
  const displayTitle = language === 'ar' ? (product.arabicName || product.name) : product.name;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showRemoveButton && onRemove) {
      onRemove();
    } else if (showRemoveButton) {
      removeFromWishlist(product.id);
    } else {
      toggleWishlist(product.id);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    } else {
      removeFromWishlist(product.id);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div 
      id={`product-card-${product.id}`}
      onClick={() => openProductDetail(product)}
      className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Image Container */}
      <div 
        className="relative aspect-square w-full overflow-hidden bg-slate-100"
      >
        <img
          src={product.image}
          alt={displayTitle}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        
        {/* Subtle Ambient Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/10 opacity-40 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.stock === 0 ? (
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white rounded-md shadow-sm">
              {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
            </span>
          ) : product.stock <= (product.lowStockThreshold ?? 5) ? (
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-600 text-white rounded-md shadow-sm">
              {product.lowStockNotice || (product.stock === 1 ? (language === 'ar' ? 'القطعة الأخيرة' : 'Last piece') : (language === 'ar' ? 'كمية محدودة' : 'Limited Stock'))}
            </span>
          ) : null}
          {product.discountPercentage && (
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white rounded-md shadow-sm">
              -{product.discountPercentage}%
            </span>
          )}
          {product.isBestseller && !product.discountPercentage && product.stock > 0 && (
            <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-emerald-600 text-white rounded-md shadow-sm">
              {t('bestseller')}
            </span>
          )}
        </div>

        {/* Favorite / Wishlist or Remove Button */}
        {showRemoveButton ? (
          <button
            type="button"
            id={`remove-favorite-btn-${product.id}`}
            onClick={handleRemoveClick}
            aria-label={language === 'ar' ? "إزالة من المفضلة" : "Remove from favorites"}
            title={language === 'ar' ? "إزالة من المفضلة" : "Remove from favorites"}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer hover:scale-110 hover:border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            id={`favorite-btn-${product.id}`}
            onClick={handleFavoriteClick}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            title={isLiked ? "Remove from favorites" : "Add to favorites"}
            className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer ${
              isLiked 
                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:scale-110' 
                : 'bg-white/90 backdrop-blur-xs text-slate-600 hover:text-rose-600 hover:bg-white hover:scale-110 border border-slate-200/60'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform duration-200 ${isLiked ? 'fill-rose-600 text-rose-600 scale-110' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4 justify-between space-y-3 bg-white">
        <div>
          {/* Title - ONE LANGUAGE ONLY */}
          <h3 
            className={`text-xs sm:text-sm font-extrabold text-black transition-colors line-clamp-2 leading-snug ${isFavoriteView ? 'group-hover:text-black' : 'group-hover:text-amber-700'}`}
          >
            {displayTitle}
          </h3>
        </div>

        {/* Price Row & Quick Add / Remove Action */}
        <div className="pt-2.5 border-t border-slate-100 mt-auto flex flex-col gap-2">
          {/* Price */}
          <div className="flex items-baseline justify-between gap-1.5">
            <div className="flex items-baseline gap-1.5 flex-wrap dir-ltr">
              <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                {formatPrice(product.priceUSD)}
              </span>
              {product.originalPriceUSD && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  {formatPrice(product.originalPriceUSD)}
                </span>
              )}
            </div>
          </div>

          {/* Add To Cart Action */}
          <div className="flex items-center gap-1.5 w-full">
            {showRemoveButton && (
              <button
                type="button"
                id={`remove-action-btn-${product.id}`}
                onClick={handleRemoveClick}
                aria-label={language === 'ar' ? 'إزالة' : 'Remove'}
                title={language === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites'}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/70 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              id={`quick-add-btn-${product.id}`}
              onClick={handleQuickAdd}
              aria-label={language === 'ar' ? 'أضف للسلة' : 'Add To Cart'}
              title={language === 'ar' ? 'أضف للسلة' : 'Add To Cart'}
              className="flex-1 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.98] text-xs font-bold text-center"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{language === 'ar' ? 'أضف للسلة' : 'Add To Cart'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);


