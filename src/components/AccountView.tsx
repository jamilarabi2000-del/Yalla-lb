import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { OrderHistory } from './OrderHistory';
import { CustomBlocksRenderer } from './CustomBlocksRenderer';
import { LebanonFlag } from './LebanonFlag';
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
    removeFromWishlist,
    firebaseUser,
    signInWithGoogle,
    signOutUser,
    signInWithEmail,
    signUpWithEmail
  } = useShop();

  const [activeAccountTab, setActiveAccountTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  
  // Profile form local state
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePhone, setProfilePhone] = useState(user.phone);
  const [profileCity, setProfileCity] = useState(user.defaultCity);
  const [profileAddress, setProfileAddress] = useState(user.defaultAddress);
  const [profileBuilding, setProfileBuilding] = useState(user.defaultBuilding || '');
  const [profileNotes, setProfileNotes] = useState(user.defaultNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (user) {
      let fName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
      let lName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '');
      
      // Derive name from firebaseUser display name or email if empty
      if (!fName && !lName && firebaseUser) {
        if (firebaseUser.displayName) {
          const parts = firebaseUser.displayName.trim().split(/\s+/);
          fName = parts[0] || '';
          lName = parts.slice(1).join(' ') || '';
        } else if (firebaseUser.email && firebaseUser.email.includes('@')) {
          const raw = firebaseUser.email.split('@')[0].replace(/[0-9]+/g, ' ').trim();
          const parts = raw.split(/[\._\-\s]+/).filter(Boolean);
          if (parts.length >= 2) {
            fName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
            lName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
          } else if (parts.length === 1 && parts[0].length > 0) {
            fName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
          }
        }
      }

      // Add identical fallbacks as CheckoutView to ensure identical user experience and data representation
      fName = fName || 'Walid';
      lName = lName || 'Ghattas';

      const emailVal = user.email || (firebaseUser ? firebaseUser.email : '') || '';
      
      let phoneVal = user.phone || '';
      if (!phoneVal || phoneVal.trim() === '') {
        phoneVal = '70 123 456';
      } else {
        phoneVal = phoneVal.replace('+961', '').replace(/\s+/g, '').trim();
      }

      const cityVal = user.defaultCity || 'Achrafieh, Beirut';
      const addressVal = user.defaultAddress || 'Gouraud Street, next to Paul Bakery';
      const buildingVal = user.defaultBuilding || 'Al-Nour Bldg, 4th Floor, Apt B';
      const notesVal = user.defaultNotes || 'Call upon arrival, leave with building concierge if not present';

      setProfileFirstName(fName);
      setProfileLastName(lName);
      setProfileName(user.name || `${fName} ${lName}`.trim());
      setProfileEmail(emailVal);
      setProfilePhone(phoneVal);
      setProfileCity(cityVal);
      setProfileAddress(addressVal);
      setProfileBuilding(buildingVal);
      setProfileNotes(notesVal);
    }
  }, [user, firebaseUser]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast('Please enter both email and password', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signInWithEmail(authEmail, authPassword);
      setProfileEmail(authEmail);
    } catch (err) {} finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName || !profileFirstName.trim() || !profileLastName || !profileLastName.trim()) {
      showToast('First name and last name are required', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      showToast('A valid email format is required', 'warning');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }
    if (!/^\d{8}$/.test(profilePhone)) {
      showToast('Lebanese phone number must be strictly 8 digits', 'warning');
      return;
    }
    const fullName = `${profileFirstName.trim()} ${profileLastName.trim()}`;
    setIsAuthLoading(true);
    try {
      try {
        localStorage.setItem('yallalb_signup_profile_temp', JSON.stringify({
          firstName: profileFirstName.trim(),
          lastName: profileLastName.trim(),
          phone: '+961 ' + profilePhone,
          defaultCity: profileCity,
          defaultAddress: profileAddress,
          defaultBuilding: profileBuilding,
          defaultNotes: profileNotes
        }));
      } catch {}
      await signUpWithEmail(authEmail, authPassword);
      await updateUser({
        name: fullName,
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        email: authEmail,
        phone: '+961 ' + profilePhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress,
        defaultBuilding: profileBuilding,
        defaultNotes: profileNotes
      });
    } catch (err) {} finally {
      setIsAuthLoading(false);
    }
  };

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      showToast('First name and last name are required', 'warning');
      return;
    }
    const fullName = `${profileFirstName.trim()} ${profileLastName.trim()}`;
    const cleanPhone = profilePhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone ? `+961 ${cleanPhone}` : '';
    
    setIsSaving(true);
    try {
      await updateUser({
        name: fullName,
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        email: profileEmail,
        phone: formattedPhone,
        defaultCity: profileCity,
        defaultAddress: profileAddress,
        defaultBuilding: profileBuilding,
        defaultNotes: profileNotes
      });
      showToast('Profile details saved successfully!', 'success');
    } catch {
      showToast('Error saving profile changes', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* Top Banners */}
      <CustomBlocksRenderer page="account" position="top" />

      {/* Account Header */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              id="account-page-back-btn"
              onClick={goBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{t('back')}</span>
            </button>

            {/* Account Status Badge */}
            <div className="flex items-center gap-3">
              {firebaseUser && (
                <button
                  id="firebase-signout-btn"
                  onClick={signOutUser}
                  className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'} ({firebaseUser.displayName || firebaseUser.email})</span>
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold tracking-wide">
                  {firebaseUser ? (language === 'ar' ? 'مسجل وموثق' : 'VERIFIED MEMBER') : (language === 'ar' ? 'زائر' : 'GUEST')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-serif text-2xl shadow-sm">
                {profileFirstName ? profileFirstName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : 'G')}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {profileFirstName && profileLastName 
                      ? `${profileFirstName} ${profileLastName}` 
                      : (profileName || (language === 'ar' ? 'زائر جديد' : 'New Guest Patron'))}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profileEmail || (language === 'ar' ? 'يرجى تحديث بريدك الإلكتروني ورقم هاتفك أدناه' : 'Please fill out your profile details below to complete sign up')} 
                  {profilePhone ? ` • +961 ${profilePhone.replace('+961', '').trim()}` : ''}
                </p>
                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>
                    {profileAddress ? `${profileAddress}, ` : ''}{profileCity || 'Lebanon'}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[90px] shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-500">{language === 'ar' ? 'إجمالي الطلبات' : 'Orders'}</p>
                <p className="text-xl font-black text-slate-900">{orders.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/70 text-center min-w-[90px] shadow-sm">
                <p className="text-[10px] uppercase font-bold text-rose-600">{language === 'ar' ? 'المفضلة' : 'Favorites'}</p>
                <p className="text-xl font-black text-rose-600">{wishlist.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
          <button
            id="tab-orders"
            onClick={() => setActiveAccountTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeAccountTab === 'orders'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{language === 'ar' ? 'سجل الطلبات' : 'My Orders'}</span>
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">{orders.length}</span>
          </button>

          <button
            id="tab-wishlist"
            onClick={() => setActiveAccountTab('wishlist')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeAccountTab === 'wishlist'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{language === 'ar' ? 'المفضلة والمحفوظات' : 'Saved Favorites'}</span>
            <span className="ml-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-bold">{wishlist.length}</span>
          </button>

          <button
            id="tab-profile"
            onClick={() => setActiveAccountTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeAccountTab === 'profile'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{language === 'ar' ? 'تفاصيل الحساب' : 'Profile'}</span>
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

          {/* Tab 2: Saved Favorites / Wishlist */}
          {activeAccountTab === 'wishlist' && (
            <div>
              {wishlistProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-4">
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'ar' ? 'لا توجد منتجات محفوظة بعد' : 'Your Favorites List is Empty'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'ar' 
                      ? 'استكشف المنتجات الحرفية اللبنانية وانقر على رمز القلب لحفظها هنا للرجوع إليها لاحقاً.'
                      : 'Explore Lebanese artisanal products and click the heart icon on any product to save it here.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="inline-block px-6 py-3 bg-[#a37f35] hover:bg-[#8c6b2a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">
                      {language === 'ar' ? 'المنتجات المحفوظة' : 'Your Saved Items'} ({wishlistProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {wishlistProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        showRemoveButton={true}
                        onRemove={() => removeFromWishlist(product.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Profile Settings */}
          {activeAccountTab === 'profile' && (
            <div>
              {!firebaseUser ? (
                <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">{authMode === 'signin' ? 'Welcome Back' : 'Create Your Account'}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {authMode === 'signin' ? 'Sign in to access your orders and saved details.' : 'Fill in your personal details and set a secure password.'}
                    </p>
                  </div>

                  {authMode === 'signin' ? (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password (Required)</label>
                        <input 
                          type="password" 
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          minLength={6}
                          required 
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isAuthLoading}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300"
                      >
                        {isAuthLoading ? 'Signing In...' : 'Sign In'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">First Name (Required)</label>
                          <input 
                            type="text" 
                            value={profileFirstName} 
                            onChange={(e) => setProfileFirstName(e.target.value)} 
                            placeholder="John"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Family Name (Required)</label>
                          <input 
                            type="text" 
                            value={profileLastName} 
                            onChange={(e) => setProfileLastName(e.target.value)} 
                            placeholder="Doe"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password (Required)</label>
                        <input 
                          type="password" 
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          minLength={6}
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Confirm Password</label>
                        <input 
                          type="password" 
                          value={authConfirmPassword} 
                          onChange={(e) => setAuthConfirmPassword(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                          minLength={6}
                          required 
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone (WhatsApp)</label>
                          <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-slate-400">
                            <span className="flex items-center gap-1.5 px-3 bg-slate-100 text-slate-800 text-xs font-bold border-r border-slate-200 select-none whitespace-nowrap">
                              <LebanonFlag className="w-5 h-3.5" />
                              <span>+961</span>
                            </span>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              maxLength={8}
                              placeholder="70123456"
                              value={profilePhone} 
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                setProfilePhone(val);
                              }} 
                              className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-sm focus:outline-none" 
                              required 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">City / Region</label>
                          <input 
                            type="text" 
                            value={profileCity} 
                            onChange={(e) => setProfileCity(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Street / Landmark *</label>
                          <input 
                            type="text" 
                            value={profileAddress} 
                            onChange={(e) => setProfileAddress(e.target.value)} 
                            placeholder="Gouraud Street, next to Paul Bakery"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Building, Floor & Apt *</label>
                          <input 
                            type="text" 
                            value={profileBuilding} 
                            onChange={(e) => setProfileBuilding(e.target.value)} 
                            placeholder="Al-Nour Bldg, 4th Floor, Apt B"
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Delivery Notes & Courier Instructions (Optional)</label>
                        <input 
                          type="text" 
                          value={profileNotes} 
                          onChange={(e) => setProfileNotes(e.target.value)} 
                          placeholder="Call upon arrival, leave with building concierge if not present"
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400" 
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isAuthLoading}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300 mt-2"
                      >
                        {isAuthLoading ? 'Creating Account...' : 'Create Account & Sign Up'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <User className="w-5 h-5" />
                    <h2 className="text-lg font-bold">Personal Information</h2>
                  </div>
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">First Name (Required)</label>
                        <input 
                          type="text" 
                          value={profileFirstName} 
                          onChange={(e) => setProfileFirstName(e.target.value)} 
                          placeholder="John"
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Last / Family Name (Required)</label>
                        <input 
                          type="text" 
                          value={profileLastName} 
                          onChange={(e) => setProfileLastName(e.target.value)} 
                          placeholder="Doe"
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                        <input 
                          type="email" 
                          value={profileEmail} 
                          onChange={(e) => setProfileEmail(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone (WhatsApp)</label>
                        <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-slate-400 focus-within:bg-white transition-all">
                          <span className="flex items-center gap-1.5 px-3 bg-slate-100 text-slate-800 text-xs font-bold border-r border-slate-200 select-none whitespace-nowrap">
                            <LebanonFlag className="w-5 h-3.5" />
                            <span>+961</span>
                          </span>
                          <input 
                            type="tel" 
                            inputMode="numeric"
                            maxLength={8}
                            placeholder="70123456"
                            value={profilePhone} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                              setProfilePhone(val);
                            }} 
                            className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-sm focus:outline-none" 
                            required 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">City / Region</label>
                        <input 
                          type="text" 
                          value={profileCity} 
                          onChange={(e) => setProfileCity(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Street / Landmark *</label>
                        <input 
                          type="text" 
                          value={profileAddress} 
                          onChange={(e) => setProfileAddress(e.target.value)} 
                          placeholder="Gouraud Street, next to Paul Bakery"
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Building, Floor & Apt *</label>
                        <input 
                          type="text" 
                          value={profileBuilding} 
                          onChange={(e) => setProfileBuilding(e.target.value)} 
                          placeholder="Al-Nour Bldg, 4th Floor, Apt B"
                          className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Delivery Notes & Courier Instructions (Optional)</label>
                      <input 
                        type="text" 
                        value={profileNotes} 
                        onChange={(e) => setProfileNotes(e.target.value)} 
                        placeholder="Call upon arrival, leave with building concierge if not present"
                        className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" 
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isSaving} 
                        className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        {isSaving ? 'Saving...' : 'Save Profile Details'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
