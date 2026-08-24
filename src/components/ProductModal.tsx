import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useDialog } from '../hooks/useDialog';
import { 
   X, 
   Heart, 
   ShoppingBag, 
   MapPin, 
   ShieldCheck, 
   Sparkles, 
   Check,
   Plus,
   Minus,
   Truck,
   Clock
 } from 'lucide-react';

export const ProductModal: React.FC = () => {
  const { 
    selectedProductForModal, 
    setSelectedProductForModal, 
    formatPrice, 
    addToCart, 
    toggleWishlist, 
    isInWishlist,
    showToast,
    language,
    t
  } = useShop();

  const [quantity, setQuantity] = useState(1);

  const { containerRef } = useDialog({
    isOpen: !!selectedProductForModal,
    onClose: () => setSelectedProductForModal(null)
  });

  if (!selectedProductForModal) return null;

  const product = selectedProductForModal;
  const isLiked = isInWishlist(product.id);
  const displayTitle = language === 'ar' ? (product.arabicName || product.name) : product.name;

  const handleAddMultipleToCart = () => {
    addToCart(product, quantity);
    setSelectedProductForModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 transition-opacity cursor-pointer"
        onClick={() => setSelectedProductForModal(null)}
      />

      {/* Modal Dialog Content */}
      <div 
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative w-full max-w-3xl rounded-3xl bg-[#16162a] border border-[#c5a059]/30 overflow-hidden shadow-2xl z-10 my-8 focus:outline-hidden"
      >
        
        {/* Close Button */}
        <button
          id="close-product-modal-btn"
          onClick={() => setSelectedProductForModal(null)}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          
          {/* Left: Image & Provenance Badge */}
          <div className="md:col-span-6 relative bg-slate-950 min-h-[300px] md:min-h-full flex items-center justify-center overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover max-h-[460px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16162a] via-transparent to-transparent opacity-80" />
            
            <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-[#121222] border border-[#c5a059]/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#f1d592]">
                <ShieldCheck className="w-4 h-4 text-[#c5a059]" />
                <span>Verified Lebanese Terroir Guild</span>
              </div>
              <p className="text-[11px] text-slate-300">
                100% handcrafted & bottled in <span className="font-semibold text-white">{product.origin}</span>
              </p>
            </div>
          </div>

          {/* Right: Details, Heritage Story, Price, CTA */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#16162a]">
            
            <div className="space-y-4">
              
              {/* Title */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {displayTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  <span className="text-slate-500">{language === 'ar' ? 'البائع:' : 'Seller:'}</span>{' '}
                  <span className="text-slate-200 font-semibold">{product.artisan.startsWith('Seller:') ? product.artisan.replace('Seller:', '').trim() : product.artisan}</span>
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                {product.description}
              </p>

              {/* Artisan Story Box */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-[#c5a059]/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#f1d592]">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>The Artisan's Craft Legacy</span>
                </div>
                <p className="text-xs text-slate-300 italic font-light leading-relaxed">
                  "{product.craftStory || product.description}"
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] text-slate-300 border border-white/10">
                    #{tag}
                  </span>
                ))}
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-[#f1d592]">
                    {formatPrice(product.priceUSD * quantity)}
                  </span>
                  {/* Stock Availability */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-[11px] text-slate-300 font-semibold">
                      {product.stock > 0 ? `Stock: ${product.stock} in stock` : 'Out of stock'}
                    </span>
                    {product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 5) && (
                      <span className="text-[10px] font-black px-2 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                        ⚠️ {product.lowStockNotice || (product.stock === 1 ? 'Last piece!' : 'Limited Stock!')}
                      </span>
                    )}
                  </div>
                  {product.weightOrVolume && (
                    <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                      Size / Volume: {product.weightOrVolume}
                    </span>
                  )}
                  {product.sellerItemCode && (
                    <span className="block text-[11px] text-[#f1d592]/80 font-mono mt-0.5">
                      Code: {product.sellerItemCode}
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-black/40 border border-[#c5a059]/30 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-white px-2 min-w-[20px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isLiked 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                      : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                  title={isLiked ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                <button
                  id="modal-add-to-cart-btn"
                  onClick={handleAddMultipleToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('addToCart')} {quantity > 1 ? `(${quantity})` : ''}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  In Stock ({product.stock} available)
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3 h-3 text-[#c5a059]" />
                  2-Hr Beirut Dispatch
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

