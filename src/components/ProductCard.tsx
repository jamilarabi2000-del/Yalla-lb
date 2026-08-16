import React, { useState } from 'react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { Heart, Eye, Check, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    formatPrice, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    openProductDetail,
    setSelectedProductForModal,
    language,
    t
  } = useShop();

  const [justAdded, setJustAdded] = useState(false);
  const isLiked = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  // One language only in grid card
  const displayTitle = language === 'ar' ? (product.arabicName || product.name) : product.name;

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
          {product.discountPercentage && (
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white rounded-md shadow-sm">
              -{product.discountPercentage}%
            </span>
          )}
          {product.isBestseller && !product.discountPercentage && (
            <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-emerald-600 text-white rounded-md shadow-sm">
              {t('bestseller')}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all z-10 cursor-pointer ${
            isLiked 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105' 
              : 'bg-white text-slate-700 hover:text-slate-900 hover:scale-105 shadow-sm'
          }`}
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-white' : ''}`} />
        </button>

        {/* View Details Page Button on Hover */}
        <button
          id={`view-detail-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            openProductDetail(product);
          }}
          className="absolute inset-x-3 bottom-3 py-2 px-3 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-10 cursor-pointer shadow-lg"
        >
          <Eye className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('viewDetails')}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4 justify-between space-y-3 bg-white">
        <div>
          {/* Title - ONE LANGUAGE ONLY */}
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug"
          >
            {displayTitle}
          </h3>
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2 mt-auto">
          {/* Price Row (Above Add Button) */}
          <div className="flex items-center justify-center gap-2 dir-ltr text-center">
            <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
              {formatPrice(product.priceUSD)}
            </span>
            {product.originalPriceUSD && (
              <span className="text-xs text-slate-400 line-through font-semibold">
                {formatPrice(product.originalPriceUSD)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            id={`add-to-cart-btn-${product.id}`}
            type="button"
            onClick={handleAddToCart}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 ${
              justAdded
                ? 'bg-emerald-600 text-white border border-emerald-600'
                : 'bg-[#a37f35] hover:bg-[#8c6b2a] text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t('added')}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

