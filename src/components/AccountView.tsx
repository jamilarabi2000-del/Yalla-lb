import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { OrderHistory } from './OrderHistory';
import { CustomBlocksRenderer } from './CustomBlocksRenderer';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AccountView: React.FC = () => {
  const { 
    user, 
    orders, 
    wishlist, 
    products, 
    formatPrice, 
    setActiveTab,
    goBack,
    t,
    language,
    updateUser,
    showToast,
    firebaseUser,
    signInWithGoogle,
    signOutUser
  } = useShop();

  const [activeAccountTab, setActiveAccountTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  
  // Profile form local state
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePhone, setProfilePhone] = useState(user.phone);
  const [profileCity, setProfileCity] = useState(user.defaultCity);
  const [profileAddress, setProfileAddress] = useState(user.defaultAddress);
  const [isSaving, setIsSaving] = useState(false);

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress
      });
      showToast('Profile and delivery details saved successfully!', 'success');
    } catch {
      showToast('Error saving profile changes', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] pb-24">
      
      {/* Top Custom Divs / Banners */}
      <CustomBlocksRenderer page="account" position="top" />

      {/* Account Hero Banner */}
      <div className="bg-[#121222] border-b border-[#c5a059]/20 pt-6 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              id="account-page-back-btn"
              onClick={goBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{t('back')}</span>
            </button>

            {/* Account Status Badge & Google Auth */}
            <div className="flex items-center gap-3">
              {firebaseUser ? (
                <button
                  id="firebase-signout-btn"
                  onClick={signOutUser}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'} ({firebaseUser.displayName || firebaseUser.email})</span>
                </button>
              ) : (
                <button
                  id="firebase-google-signin-btn"
                  onClick={signInWithGoogle}
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسجيل الدخول بواسطة جوجل' : 'Sign in with Google'}</span>
                </button>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-medium">
                  {firebaseUser ? (language === 'ar' ? 'مسجل وموثق' : 'Verified Member') : (language === 'ar' ? 'زائر' : 'Guest')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] shadow-inner text-2xl font-serif">
                {user.name.charAt(0)}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c5a059]/20 text-[#f1d592] border border-[#c5a059]/40 uppercase tracking-widest">
                    {language === 'ar' ? 'عضو مميز' : 'Verified Patron'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{user.email} • {user.phone}</p>
                <p className="text-[11px] text-[#c5a059] flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{user.defaultAddress}, {user.defaultCity}</span>
                </p>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl premium-card text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'إجمالي الطلبات' : 'Orders'}</p>
                <p className="text-xl font-black text-white">{orders.length}</p>
              </div>
              <div className="p-3 rounded-2xl premium-card text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'المفضلة' : 'Wishlist'}</p>
                <p className="text-xl font-black text-[#f1d592]">{wishlist.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            id="tab-orders"
            onClick={() => setActiveAccountTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeAccountTab === 'orders'
                ? 'gold-btn text-white shadow-lg'
                : 'bg-[#121222] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{language === 'ar' ? 'سجل الطلبات والتتبع' : 'My Orders & Live Tracking'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/20 rounded-md text-[10px]">{orders.length}</span>
          </button>

          <button
            id="tab-wishlist"
            onClick={() => setActiveAccountTab('wishlist')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeAccountTab === 'wishlist'
                ? 'gold-btn text-white shadow-lg'
                : 'bg-[#121222] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{language === 'ar' ? 'قائمة الحرفيين المفضلة' : 'Saved Artisan Wishlist'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/20 rounded-md text-[10px]">{wishlist.length}</span>
          </button>

          <button
            id="tab-profile"
            onClick={() => setActiveAccountTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeAccountTab === 'profile'
                ? 'gold-btn text-white shadow-lg'
                : 'bg-[#121222] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{language === 'ar' ? 'تفاصيل الحساب والعنوان' : 'Profile & Delivery Address'}</span>
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="mt-8">
          {/* Tab 1: Orders History */}
          {activeAccountTab === 'orders' && (
            <OrderHistory 
              orders={orders} 
              formatPrice={formatPrice} 
              onNavigateProducts={() => setActiveTab('products')} 
              language={language}
            />
          )}

          {/* Tab 2: Artisan Wishlist */}
          {activeAccountTab === 'wishlist' && (
            <div className="space-y-6">
              {wishlistProducts.length === 0 ? (
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-[#c5a059]/30 flex items-center justify-center mx-auto text-[#c5a059]">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Your Wishlist is Empty</h3>
                  <p className="text-xs text-slate-400">
                    Save your favorite Lebanese handcrafted items, olive oils, and soaps for later.
                  </p>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="px-6 py-2.5 bg-[#c5a059] text-[#1a1a2e] font-bold uppercase text-xs tracking-widest cursor-pointer rounded-xl hover:bg-[#d4b068]"
                  >
                    Explore Lebanese Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {wishlistProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Profile & Delivery Details Form */}
          {activeAccountTab === 'profile' && (
            <div className="max-w-2xl bg-[#121222] p-6 sm:p-8 rounded-3xl border border-[#c5a059]/20 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#c5a059]" />
                  <span>{language === 'ar' ? 'معلومات العضو والعنوان الافتراضي' : 'Customer & Shipping Address Info'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar' ? 'يتم استخدام هذه المعلومات تلقائياً عند الدفع وتسليم الشحنات' : 'Saved locally on your device for fast express checkout on Lebanese orders.'}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input 
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#c5a059]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <input 
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#c5a059]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {language === 'ar' ? 'رقم الهاتف اللبناني' : 'Lebanon Phone Number'}
                    </label>
                    <input 
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#c5a059]"
                      placeholder="+961 70 123 456"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {language === 'ar' ? 'المدينة / المنطقة' : 'City / Neighborhood'}
                    </label>
                    <input 
                      type="text"
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#c5a059]"
                      placeholder="Achrafieh, Broummana, Byblos..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {language === 'ar' ? 'تفاصيل العنوان والمبنى' : 'Street & Building Details'}
                  </label>
                  <textarea 
                    rows={2}
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#c5a059]"
                    placeholder="Street name, building number, floor..."
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 gold-btn text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Custom Divs / Banners */}
      <CustomBlocksRenderer page="account" position="bottom" />
    </div>
  );
};
