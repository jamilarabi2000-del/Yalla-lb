import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
   X, 
   Trash2, 
   Plus, 
   Minus, 
   ShoppingBag, 
   ArrowRight,
   ShieldCheck
 } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    cartTotalUSD, 
    formatPrice, 
    setActiveTab,
    t,
    language
  } = useShop();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 transition-opacity cursor-pointer"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-slideInRight h-full">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 border border-amber-300/60 flex items-center justify-center text-[#96783d]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900">
                    {t('yourBasket')} ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {language === 'ar' ? 'منتجات لبنانية حرفية أصيلة' : 'Authentic Lebanese Artisan Handcrafted'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    id="clear-cart-btn"
                    onClick={clearCart}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    title={t('clearAll')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clearAll')}</span>
                  </button>
                )}
                <button
                  id="close-cart-btn"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Free Delivery progress bar */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                <span className="truncate pr-2">
                  {cartTotalUSD >= 50 
                    ? (language === 'ar' ? '🎉 تم فتح التوصيل السريع المجاني!' : '🎉 Free Beirut Express Delivery Unlocked!') 
                    : (language === 'ar' 
                        ? `أضف ${formatPrice(50 - cartTotalUSD)} للحصول على توصيل مجاني`
                        : `Add ${formatPrice(50 - cartTotalUSD)} for Free Delivery`)}
                </span>
                <span className="text-[#96783d] font-bold flex-shrink-0">
                  {Math.min(100, Math.round((cartTotalUSD / 50) * 100))}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#b89753] to-[#d4b572] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (cartTotalUSD / 50) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-[#96783d]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{t('emptyBasket')}</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {t('emptyBasketSub')}
                </p>
                <button
                  onClick={() => { setIsCartOpen(false); setActiveTab('products'); }}
                  className="px-6 py-2.5 bg-[#a37f35] hover:bg-[#8c6b2a] text-white font-bold uppercase text-xs tracking-widest cursor-pointer rounded-xl transition-all shadow-md"
                >
                  {t('viewAllProducts')}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 items-center justify-between shadow-sm hover:border-[#b89753] transition-all"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {language === 'ar' ? (item.product.arabicName || item.product.name) : item.product.name}
                    </h4>
                    <p className="text-[11px] text-[#96783d] font-semibold mt-0.5">{item.product.origin}</p>
                    <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                      <span className="text-xs font-black text-slate-950">
                        {formatPrice(item.product.priceUSD * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({formatPrice(item.product.priceUSD)} {t('each')})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg cursor-pointer transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 px-1.5 min-w-[1.25rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg cursor-pointer transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-white space-y-4 shadow-xl">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">{t('subtotal')}</span>
                  <span className="font-bold text-slate-900 text-sm">{formatPrice(cartTotalUSD)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium">{language === 'ar' ? 'توصيل سريع داخل لبنان' : 'Hyper-Local Beirut Dispatch'}</span>
                  <span className="font-bold text-emerald-600">
                    {cartTotalUSD >= 50 
                      ? (language === 'ar' ? 'مجاني' : 'FREE') 
                      : (language === 'ar' ? '+$3.00 عند الدفع' : '+$3.00 at checkout')}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-slate-900 font-bold">
                  <span className="text-sm">{t('estimatedTotal')}</span>
                  <span className="text-xl font-black text-slate-950">{formatPrice(cartTotalUSD)}</span>
                </div>
              </div>

              <button
                id="cart-proceed-checkout-btn"
                onClick={() => {
                  setIsCartOpen(false);
                  setActiveTab('checkout');
                }}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-[#a37f35] hover:bg-[#8c6b2a] text-white font-black uppercase text-xs tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t('proceedToCheckout')}</span>
                <ArrowRight className={`w-4 h-4 text-white ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

