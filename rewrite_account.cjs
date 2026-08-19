const fs = require('fs');
const path = './src/components/AccountView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace everything inside the return with a clean light mode structure
const newReturn = `  return (
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
              <ArrowLeft className={\`w-3.5 h-3.5 \${language === 'ar' ? 'rotate-180' : ''}\`} />
              <span>{t('back')}</span>
            </button>

            {/* Account Status Badge & Google Auth */}
            <div className="flex items-center gap-3">
              {firebaseUser ? (
                <button
                  id="firebase-signout-btn"
                  onClick={signOutUser}
                  className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'} ({firebaseUser.displayName || firebaseUser.email})</span>
                </button>
              ) : (
                <button
                  id="firebase-google-signin-btn"
                  onClick={signInWithGoogle}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" />
                  <span>{language === 'ar' ? 'تسجيل الدخول بواسطة جوجل' : 'Sign in with Google'}</span>
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
                {user.name.charAt(0)}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{user.email} • {user.phone}</p>
                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{user.defaultAddress}, {user.defaultCity}</span>
                </p>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[90px] shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-500">{language === 'ar' ? 'إجمالي الطلبات' : 'Orders'}</p>
                <p className="text-xl font-black text-slate-900">{orders.length}</p>
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
            className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap \${
              activeAccountTab === 'orders'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
            }\`}
          >
            <Package className="w-4 h-4" />
            <span>{language === 'ar' ? 'سجل الطلبات' : 'My Orders'}</span>
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">{orders.length}</span>
          </button>

          <button
            id="tab-profile"
            onClick={() => setActiveAccountTab('profile')}
            className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap \${
              activeAccountTab === 'profile'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
            }\`}
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

          {/* Tab 2: Profile Settings */}
          {activeAccountTab === 'profile' && (
            <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-slate-900">
                <User className="w-5 h-5" />
                <h2 className="text-lg font-bold">Personal Information</h2>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                    <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone (WhatsApp)</label>
                    <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">City / Region</label>
                    <input type="text" value={profileCity} onChange={(e) => setProfileCity(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" required />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Detailed Address</label>
                  <input type="text" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" required />
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isSaving} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
                    {isSaving ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

const startIndex = content.indexOf('  return (');
if (startIndex !== -1) {
    content = content.substring(0, startIndex) + newReturn;
    fs.writeFileSync(path, content);
    console.log("Successfully rewrote AccountView.tsx");
} else {
    console.log("Could not find start string.");
}
