import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { PaymentMethod } from '../types';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Lock,
  MapPin,
  Sparkles,
  PhoneCall,
  ArrowLeft
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const { 
    cart, 
    cartTotalUSD, 
    formatPrice, 
    currency, 
    setActiveTab, 
    placeOrder,
    showToast,
    goBack,
    t,
    language
  } = useShop();

  const [deliverySpeed, setDeliverySpeed] = useState<'express_beirut' | 'standard' | 'diaspora_air'>('express_beirut');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod_usd');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: 'Achrafieh, Beirut',
    street: '',
    building: '',
    notes: ''
  });

  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const quickCities = [
    'Achrafieh, Beirut',
    'Hamra, Beirut',
    'Badaro, Beirut',
    'Mar Mikhael, Beirut',
    'Tripoli (Mina)',
    'Byblos (Jbeil)',
    'Batroun Coast',
    'Zahlé, Bekaa',
    'Saida, South'
  ];

  // Delivery fee calculation
  const deliveryFeeUSD = deliverySpeed === 'express_beirut' ? 3.0 : deliverySpeed === 'standard' ? 2.0 : 25.0;
  const finalTotalUSD = cartTotalUSD + (cart.length > 0 ? deliveryFeeUSD : 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast('Your cart is empty. Add products before placing an order.', 'warning');
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.street) {
      showToast('Please fill in your full name, phone number, and street address.', 'warning');
      return;
    }

    const newOrder = await placeOrder({
      items: [...cart],
      shipping: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || `${formData.fullName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        governorate: 'beirut',
        city: formData.city,
        street: formData.street,
        building: formData.building,
        deliveryNotes: formData.notes,
        deliverySpeed: deliverySpeed
      },
      paymentMethod: paymentMethod,
      currency: currency,
      subtotalUSD: cartTotalUSD,
      deliveryFeeUSD: deliveryFeeUSD,
      totalUSD: finalTotalUSD,
      totalLBP: finalTotalUSD * 89500,
      estimatedDelivery: deliverySpeed === 'express_beirut' 
        ? 'Within 2 Hours (Beirut Express)' 
        : deliverySpeed === 'standard' 
        ? '24-48 Hours (All Lebanon)' 
        : '3-5 Business Days (DHL Diaspora Air)'
    });

    setOrderComplete(newOrder.id);
  };

  if (orderComplete) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#1a1a2e]">
        <div className="max-w-xl w-full p-8 sm:p-12 rounded-3xl premium-card text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#f1d592]">
              Order Placed Successfully
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-white">
              Shukran! Your Lebanese Order is <span className="gold-gradient font-serif italic font-normal">Confirmed</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Reference code: <span className="font-mono font-bold text-[#f1d592] bg-[#121222] px-3 py-1 rounded-lg border border-[#c5a059]/40 inline-block mt-1">#{orderComplete}</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-[#c5a059]/20 text-left text-xs space-y-2.5 text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Clock className="w-4 h-4" />
              <span>Next Steps & Dispatch Logistics:</span>
            </div>
            <p className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">1.</span>
              <span>Our Beirut central depot has routed your basket to the regional artisan guilds.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">2.</span>
              <span>You will receive a WhatsApp message from your dedicated courier to confirm exact GPS drop-off.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">3.</span>
              <span>Settlement is strictly in USD (${finalTotalUSD.toFixed(2)}) upon handover or digital transfer.</span>
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setActiveTab('account')}
              className="px-8 py-3.5 bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-lg"
            >
              Track in My Account
            </button>
            <button
              onClick={() => { setOrderComplete(null); setActiveTab('products'); }}
              className="px-8 py-3.5 border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 font-bold uppercase text-xs tracking-widest transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] pb-24">
      
      {/* Checkout Header */}
      <div className="bg-[#121222] border-b border-[#c5a059]/20 pt-6 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <button
            id="checkout-page-back-btn"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            <span>{t('back')}</span>
          </button>

          <div className="flex items-center gap-2 text-[#f1d592] text-xs font-bold uppercase tracking-[0.2em]">
            <Lock className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>{language === 'ar' ? 'دفع إلكتروني آمن ومشفر (بالدولار الأمريكي)' : 'Encrypted Lebanese Checkout (USD Only)'}</span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight">
            {language === 'ar' ? (
              <>التوصيل و <span className="gold-gradient font-serif italic">إتمام التسوية والطلب</span></>
            ) : (
              <>Delivery & <span className="gold-gradient font-serif italic">Payment Settlement</span></>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {language === 'ar'
              ? 'توصيل سريع لجميع المناطق اللبنانية • جميع الأسعار محددة بالدولار الأمريكي ($).'
              : 'Instant courier dispatch throughout Lebanon • All pricing strictly in US Dollars ($).'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {cart.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-[#c5a059]/30 flex items-center justify-center mx-auto text-[#c5a059]">
              <Truck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('emptyBasket')}</h2>
            <p className="text-xs text-slate-400">
              {t('emptyBasketSub')}
            </p>
            <button
              onClick={() => setActiveTab('products')}
              className="px-8 py-3.5 bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-widest cursor-pointer transition-colors shadow-lg"
            >
              {t('viewAllProducts')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Delivery & Payment Details */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Delivery Mode */}
              <div className="p-6 rounded-3xl premium-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c5a059] text-[#1a1a2e] text-xs font-black">1</span>
                    Choose Delivery Route
                  </h3>
                  <span className="text-[11px] text-[#f1d592] font-semibold flex items-center gap-1">
                    <span className="status-dot" />
                    Live Fleet Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    id="delivery-opt-express"
                    onClick={() => setDeliverySpeed('express_beirut')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      deliverySpeed === 'express_beirut' 
                        ? 'bg-[#c5a059]/15 border-[#c5a059] text-white shadow-md' 
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#f1d592]">Beirut Express</span>
                      <span className="text-xs font-extrabold text-[#c5a059]">$3.00</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Under 2 Hours (Capital Area)</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400">⚡ Fastest Drop-off</span>
                  </div>

                  <div
                    id="delivery-opt-standard"
                    onClick={() => setDeliverySpeed('standard')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      deliverySpeed === 'standard' 
                        ? 'bg-[#c5a059]/15 border-[#c5a059] text-white shadow-md' 
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#f1d592]">All Lebanon</span>
                      <span className="text-xs font-extrabold text-[#c5a059]">$2.00</span>
                    </div>
                    <p className="text-[11px] text-slate-300">North, South, Bekaa, Mountains</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-slate-400">📦 24-48 Hours</span>
                  </div>

                  <div
                    id="delivery-opt-diaspora"
                    onClick={() => setDeliverySpeed('diaspora_air')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      deliverySpeed === 'diaspora_air' 
                        ? 'bg-[#c5a059]/15 border-[#c5a059] text-white shadow-md' 
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#f1d592]">Diaspora Air</span>
                      <span className="text-xs font-extrabold text-[#c5a059]">$25.00</span>
                    </div>
                    <p className="text-[11px] text-slate-300">Worldwide DHL Express Air</p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-sky-400">✈️ 3-5 Days Global</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Recipient Details & Address */}
              <div className="p-6 rounded-3xl premium-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c5a059] text-[#1a1a2e] text-xs font-black">2</span>
                    Recipient & Address in Lebanon
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="checkout-name-input"
                      required
                      placeholder="e.g. Walid Ghattas"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/[0.05] text-xs text-white rounded-xl border border-[#c5a059]/30 focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Lebanese Mobile Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="checkout-phone-input"
                      required
                      placeholder="+961 70 123 456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/[0.05] text-xs text-white rounded-xl border border-[#c5a059]/30 focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>

                {/* City quick presets */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    City / Governorate Quick Select
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {quickCities.map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setFormData({ ...formData, city })}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          formData.city === city
                            ? 'bg-[#c5a059] text-[#1a1a2e]'
                            : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    id="checkout-city-input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Achrafieh, Beirut"
                    className="w-full px-3.5 py-2.5 bg-[#121222] text-xs text-white rounded-xl border border-[#c5a059]/30 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Street / Landmark *
                    </label>
                    <input
                      type="text"
                      id="checkout-street-input"
                      required
                      placeholder="e.g. Gouraud Street, next to Paul Bakery"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/[0.05] text-xs text-white rounded-xl border border-[#c5a059]/30 focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Building, Floor & Apt
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Al-Nour Bldg, 4th Floor, Apt B"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/[0.05] text-xs text-white rounded-xl border border-[#c5a059]/30 focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Special Delivery Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ring buzzer or call on arrival"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] text-xs text-white rounded-xl border border-[#c5a059]/30 focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

              </div>

              {/* Step 3: Payment Method */}
              <div className="p-6 rounded-3xl premium-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c5a059] text-[#1a1a2e] text-xs font-black">3</span>
                    Select Payment Method (USD Only)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* COD USD */}
                  <label className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'cod_usd' ? 'bg-[#c5a059]/15 border-[#c5a059]' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="payment_choice"
                      id="pay-cod-usd"
                      checked={paymentMethod === 'cod_usd'}
                      onChange={() => setPaymentMethod('cod_usd')}
                      className="mt-1 text-[#c5a059] focus:ring-[#c5a059]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <span>Cash on Delivery (USD)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Hand exact crisp USD notes directly to the dispatch courier.
                      </p>
                    </div>
                  </label>

                  {/* Whish / OMT */}
                  <label className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'wish_omt' ? 'bg-[#c5a059]/15 border-[#c5a059]' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="payment_choice"
                      id="pay-whish"
                      checked={paymentMethod === 'wish_omt'}
                      onChange={() => setPaymentMethod('wish_omt')}
                      className="mt-1 text-[#c5a059] focus:ring-[#c5a059]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        <Building2 className="w-4 h-4 text-rose-400" />
                        <span>Whish / OMT (USD)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Instant zero-fee transfer to Yalla.lb Merchant ID.
                      </p>
                    </div>
                  </label>

                  {/* Credit Card / International */}
                  <label className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'credit_card' ? 'bg-[#c5a059]/15 border-[#c5a059]' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <input
                      type="radio"
                      name="payment_choice"
                      id="pay-card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="mt-1 text-[#c5a059] focus:ring-[#c5a059]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        <CreditCard className="w-4 h-4 text-sky-400" />
                        <span>Card / Apple Pay (USD)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Secure checkout for local & Diaspora international cards.
                      </p>
                    </div>
                  </label>

                </div>

              </div>

            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="p-6 rounded-3xl premium-card space-y-6 sticky top-28">
                <h3 className="text-base font-bold text-white pb-3 border-b border-white/10 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs text-[#f1d592]">{cart.length} Items</span>
                </h3>

                {/* Items preview */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 text-xs">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-[#c5a059]/30 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate">{item.product.name}</h4>
                        <p className="text-[11px] text-slate-400">Qty: {item.quantity} × {formatPrice(item.product.priceUSD)}</p>
                      </div>
                      <span className="font-bold text-[#f1d592]">
                        {formatPrice(item.product.priceUSD * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals Calculation */}
                <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Products Subtotal</span>
                    <span className="font-bold">{formatPrice(cartTotalUSD)}</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Delivery Courier Fee</span>
                    <span className="font-bold text-[#c5a059]">+{formatPrice(deliveryFeeUSD)}</span>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Provenance Stamp & Packaging</span>
                    <span className="font-bold text-emerald-400">FREE</span>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-baseline justify-between text-white">
                    <span className="text-sm font-bold">Total Amount Due</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#f1d592]">
                        {formatPrice(finalTotalUSD)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  id="place-order-btn"
                  className="w-full py-4 rounded-xl bg-[#c5a059] hover:bg-[#d4b36e] text-[#1a1a2e] font-black uppercase text-xs tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#1a1a2e]" />
                  <span>Confirm Lebanese Order (${finalTotalUSD.toFixed(2)})</span>
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
                  <span>🔒 256-Bit SSL Protection</span>
                  <span>•</span>
                  <span>🇱🇧 Direct Artisan Payout</span>
                </div>

              </div>

            </div>

          </form>
        )}

      </div>

    </div>
  );
};

