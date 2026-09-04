import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { SellerDashboard } from './SellerDashboard';
import { 
  Store, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  Phone, 
  MapPin, 
  Send, 
  ArrowRight,
  LogOut,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Smartphone
} from 'lucide-react';
import { LebanonFlag } from './LebanonFlag';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from '../firebase';
import { normalizeLebanesePhone, isValidLebanesePhone } from '../utils/phoneUtils';

export const SellerLoginView: React.FC = () => {
  const { 
    user, 
    firebaseUser, 
    isAdminUser, 
    signOutUser, 
    resetPassword, 
    showToast, 
    setActiveTab, 
    goBack, 
    language, 
    t,
    sellers,
    updateUser
  } = useShop();

  const isArabic = language === 'ar';

  // Login form state - 3 required seller credentials: Gmail/Email, Mobile Phone, and Password
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tab mode: 'login' | 'apply'
  const [activePortalTab, setActivePortalTab] = useState<'login' | 'apply'>('login');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Admin preview selector state
  const [adminSelectedSellerId, setAdminSelectedSellerId] = useState<string>('');

  // Seller Application Form State
  const [appWorkshopName, setAppWorkshopName] = useState('');
  const [appWorkshopNameAr, setAppWorkshopNameAr] = useState('');
  const [appCraftCategory, setAppCraftCategory] = useState('Pantry & Olive Oils');
  const [appGovernorate, setAppGovernorate] = useState('mount_lebanon');
  const [appVillage, setAppVillage] = useState('');
  const [appContactName, setAppContactName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appBio, setAppBio] = useState('');
  const [appSocialLink, setAppSocialLink] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appSubmittedSuccess, setAppSubmittedSuccess] = useState(false);

  const handleSellerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const email = authEmail.trim();
    const phone = authPhone.trim();
    const password = authPassword;

    // 1. Validate inputs
    if (!email) {
      setErrorMessage(isArabic ? 'يرجى إدخال بريد Gmail أو البريد الإلكتروني للبائع.' : 'Please enter your seller Gmail or email address.');
      return;
    }

    if (!phone) {
      setErrorMessage(isArabic ? 'يرجى إدخال رقم الهاتف المحمول المعتمد للبائع.' : 'Please enter your registered seller mobile phone number.');
      return;
    }

    const normPhone = normalizeLebanesePhone(phone);
    if (!normPhone.isValid) {
      setErrorMessage(
        isArabic 
          ? 'يرجى إدخال رقم هاتف محمول لبناني صحيح من 8 أرقام (مثال: 70 123 456 أو 03 123 456).'
          : 'Please enter a valid 8-digit Lebanese mobile phone number (e.g. 70 123 456, 03 123 456, or +961 71 234 567).'
      );
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(isArabic ? 'يرجى إدخال كلمة المرور (6 أحرف على الأقل).' : 'Please enter your password (minimum 6 characters).');
      return;
    }

    setIsLoading(true);
    try {
      // 2. Authenticate against Firebase Auth with Email and Password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 3. Fetch User Profile from Firestore
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      const isUserAdmin = userData?.role === 'admin' || (email.toLowerCase() === 'jamilarabi2000@gmail.com' && userCredential.user.emailVerified) || isAdminUser;

      // Email verification enforcement (OWASP / Enterprise Standard)
      if (!userCredential.user.emailVerified && !isUserAdmin) {
        await signOut(auth);
        const unverifiedMsg = isArabic
          ? 'يرجى تأكيد بريدك الإلكتروني عبر الرابط المرسل إلى بريدك قبل تسجيل الدخول إلى بوابة الحرفيين.'
          : 'Please verify your email address via the link sent to your inbox before accessing the Artisan Merchant Portal.';
        setErrorMessage(unverifiedMsg);
        showToast(unverifiedMsg, 'warning');
        setIsLoading(false);
        return;
      }

      // 4. Find matching Seller exclusively via secure provisioned credentials (accountUid, accountEmail, or authorized user profile sellerId)
      // SECURITY FIX: NEVER match against public contactEmail to prevent account takeover
      const matchedSeller = sellers.find(s => 
        s.accountUid === uid ||
        (s.accountEmail && s.accountEmail.toLowerCase() === email.toLowerCase()) ||
        (userData?.sellerId && s.id === userData.sellerId)
      );

      if (!matchedSeller && !isUserAdmin) {
        await signOut(auth);
        const noSellerMsg = isArabic
          ? 'لم يتم العثور على ورشة أو حساب بائع معتمد مرتبط بهذا البريد الإلكتروني. يرجى التواصل مع إدارة منصة يلا.'
          : 'No authorized artisan workshop account found matching this email. Please contact Yalla marketplace administration.';
        setErrorMessage(noSellerMsg);
        showToast(noSellerMsg, 'error');
        setIsLoading(false);
        return;
      }

      // 5. Gather registered candidate phone numbers for identity verification
      const registeredPhones: string[] = [
        userData?.phone,
        matchedSeller?.contactPhone,
        userCredential.user.phoneNumber
      ].filter(Boolean) as string[];

      // 6. Security Check: Mobile Phone Number Match
      if (registeredPhones.length > 0) {
        const isPhoneMatched = registeredPhones.some(p => {
          const normReg = normalizeLebanesePhone(p);
          return normReg.cleanDigits === normPhone.cleanDigits;
        });

        if (!isPhoneMatched && !isUserAdmin) {
          // Reject authentication and sign out immediately
          await signOut(auth);
          const failMsg = isArabic 
            ? `فشل التحقق الأمني: رقم الهاتف المحمول (${normPhone.formatted}) لا يطابق رقم هاتف البائع المسجل لهذا الحساب. يرجى إدخال رقم هاتفك المعتمد.`
            : `Security Verification Failed: The mobile phone number entered (${normPhone.formatted}) does not match the registered seller phone on file for this account. Please enter your registered mobile number.`;
          setErrorMessage(failMsg);
          showToast(failMsg, 'error');
          setIsLoading(false);
          return;
        }
      }

      showToast(
        isArabic 
          ? `مرحباً بك في بوابة الحرفيين، ${matchedSeller?.nameAr || matchedSeller?.nameEn || userData?.name || 'أيها الحرفي'}!` 
          : `Welcome to your Artisan Merchant Portal, ${matchedSeller?.nameEn || userData?.name || 'Artisan'}!`, 
        'success'
      );
    } catch (err: any) {
      console.error('[SellerLoginView] Sign-in error:', err);
      const code = err?.code || '';
      let msg = isArabic ? 'تعذر تسجيل الدخول. يرجى التحقق من بياناتك.' : 'Failed to sign in. Please verify your credentials.';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        msg = isArabic ? 'البريد الإلكتروني (Gmail) أو كلمة المرور غير صحيحة.' : 'Invalid Gmail address or password. Please verify your credentials.';
      } else if (code === 'auth/too-many-requests') {
        msg = isArabic ? 'محاولات كثيرة خاطئة. يرجى الانتظار قليلاً أو إعادة تعيين كلمة المرور.' : 'Too many failed attempts. Please wait a moment or reset your password.';
      } else if (code === 'auth/invalid-email') {
        msg = isArabic ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email format.';
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSellerSignIn = async () => {
    setErrorMessage('');
    const phone = authPhone.trim();
    if (!phone) {
      setErrorMessage(isArabic ? 'يرجى إدخال رقم الهاتف المحمول للبائع أولاً للتحقق من الهوية.' : 'Please enter your registered seller mobile phone number to verify identity.');
      return;
    }
    const normPhone = normalizeLebanesePhone(phone);
    if (!normPhone.isValid) {
      setErrorMessage(isArabic ? 'يرجى إدخال رقم هاتف محمول لبناني صحيح من 8 أرقام.' : 'Please enter a valid 8-digit Lebanese mobile phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const email = userCredential.user.email || '';
      const uid = userCredential.user.uid;

      // Check Firestore user & sellers
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      const matchedSeller = sellers.find(s => 
        s.accountUid === uid ||
        (s.accountEmail && s.accountEmail.toLowerCase() === email.toLowerCase()) ||
        (userData?.sellerId && s.id === userData.sellerId)
      );

      const isUserAdmin = userData?.role === 'admin' || (email.toLowerCase() === 'jamilarabi2000@gmail.com' && userCredential.user.emailVerified) || isAdminUser;

      if (!matchedSeller && !isUserAdmin) {
        await signOut(auth);
        const noSellerMsg = isArabic
          ? 'لم يتم العثور على ورشة أو حساب بائع معتمد مرتبط بهذا البريد الإلكتروني. يرجى التواصل مع إدارة منصة يلا.'
          : 'No authorized artisan workshop account found matching this email. Please contact Yalla marketplace administration.';
        setErrorMessage(noSellerMsg);
        showToast(noSellerMsg, 'error');
        setIsLoading(false);
        return;
      }

      const registeredPhones: string[] = [
        userData?.phone,
        matchedSeller?.contactPhone,
        userCredential.user.phoneNumber
      ].filter(Boolean) as string[];

      if (registeredPhones.length > 0) {
        const isPhoneMatched = registeredPhones.some(p => normalizeLebanesePhone(p).cleanDigits === normPhone.cleanDigits);
        if (!isPhoneMatched && !isUserAdmin) {
          await signOut(auth);
          const failMsg = isArabic 
            ? `فشل التحقق الأمني: رقم الهاتف المحمول (${normPhone.formatted}) لا يطابق رقم هاتف البائع المسجل لهذا الحساب.`
            : `Security Verification Failed: The mobile phone number entered (${normPhone.formatted}) does not match the registered seller phone on file.`;
          setErrorMessage(failMsg);
          showToast(failMsg, 'error');
          setIsLoading(false);
          return;
        }
      } else if (isUserAdmin) {
        await setDoc(userDocRef, {
          phone: normPhone.formatted,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      showToast(isArabic ? 'تم تسجيل الدخول بنجاح عبر حساب Gmail!' : 'Successfully authenticated with Seller Gmail!', 'success');
    } catch (err: any) {
      console.error('[SellerLoginView] Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = (forgotEmail || authEmail).trim();
    if (!target) {
      showToast(isArabic ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address', 'warning');
      return;
    }
    setIsSendingReset(true);
    try {
      await resetPassword(target);
      setShowForgotModal(false);
      showToast(
        isArabic
          ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${target}`
          : `A password reset link has been dispatched to ${target}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Error sending password reset email', 'warning');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appWorkshopName.trim() || !appContactName.trim() || !appPhone.trim() || !appEmail.trim()) {
      showToast(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required application fields', 'warning');
      return;
    }

    setIsSubmittingApp(true);
    try {
      await addDoc(collection(db, 'seller_applications'), {
        workshopName: appWorkshopName.trim(),
        workshopNameAr: appWorkshopNameAr.trim(),
        craftCategory: appCraftCategory,
        governorate: appGovernorate,
        village: appVillage.trim(),
        contactName: appContactName.trim(),
        phone: appPhone.trim().startsWith('+961') ? appPhone.trim() : `+961 ${appPhone.trim()}`,
        email: appEmail.trim().toLowerCase(),
        bio: appBio.trim(),
        socialLink: appSocialLink.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString()
      });

      setAppSubmittedSuccess(true);
      showToast(isArabic ? 'Mabrouk! تم استلام طلبك بنجاح وسيتواصل معك فريق يالا قريباً.' : 'Mabrouk! Your artisan application was submitted successfully.', 'success');
    } catch (err: any) {
      console.error('[SellerLoginView] Application error:', err);
      showToast(err.message || 'Failed to submit application. Please try again.', 'warning');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // If user is logged in as a seller (or an admin impersonating/previewing), render the complete Seller Dashboard
  const isSellerUser = user?.role === 'seller';

  if (isSellerUser) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        {/* Artisan Portal Top Header */}
        <div className="bg-slate-900 text-white border-b border-slate-800 py-3.5 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-md">
          <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('home')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                <span>{isArabic ? 'المتجر العام' : 'Public Store'}</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>{user.name || 'Artisan Workshop'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 font-mono uppercase">
                  {user.sellerId || 'Seller Portal'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200">{firebaseUser?.email}</p>
                <p className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isArabic ? 'حساب بائع موثق' : 'Verified Merchant Session'}</span>
                </p>
              </div>

              <button
                onClick={signOutUser}
                className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>

        <SellerDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-[88vh] bg-gradient-to-b from-slate-900 via-[#121624] to-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Ambient Lebanese Gold & Cedar Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between z-10 mb-8">
        <button
          onClick={() => setActiveTab('home')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
          <span>{isArabic ? 'العودة للمتجر الرئيسي' : 'Back to Marketplace'}</span>
        </button>

        <div className="flex items-center gap-2">
          <LebanonFlag className="w-5 h-3.5" />
          <span className="text-[11px] font-bold text-amber-400/90 tracking-widest uppercase">
            Yalla.lb Merchant Collective
          </span>
        </div>
      </div>

      {/* Main Authentication & Application Card */}
      <div className="max-w-xl w-full mx-auto z-10">
        
        {/* Admin Superuser Alert Banner */}
        {isAdminUser && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md space-y-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  {isArabic ? 'جلسة المشرف العام (Super Admin)' : 'Super Administrator Session Detected'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isArabic 
                    ? 'أنت مسجل حالياً بحساب المشرف. يمكنك الدخول مباشرة للوحة تحكم أي بائع مسجل لمعاينة متجره، أو الانتقال للوحة الإدارة العامة.'
                    : 'You are signed in with Marketplace Administrator privileges. You can preview the merchant dashboard of any artisan below or jump to the main Admin Console.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
              <button
                onClick={() => setActiveTab('admin')}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                {isArabic ? 'فتح لوحة الإدارة الكاملة' : 'Open Admin Panel'}
              </button>

              {sellers.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={adminSelectedSellerId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setAdminSelectedSellerId(selId);
                      if (selId) {
                        const target = sellers.find(s => s.id === selId);
                        if (target) {
                          updateUser({
                            role: 'seller',
                            sellerId: target.id,
                            name: target.nameEn
                          });
                          showToast(`Emulating artisan portal for "${target.nameEn}"`, 'info');
                        }
                      }
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">⚡ {isArabic ? 'معاينة لوحة بائع محدد...' : 'Preview specific seller portal...'}</option>
                    {sellers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Account Notice (if logged in as normal customer) */}
        {!isAdminUser && firebaseUser && user?.role !== 'seller' && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 backdrop-blur-md flex items-center justify-between gap-4 animate-fadeIn">
            <div>
              <p className="text-xs font-bold text-indigo-200">
                {isArabic ? 'أنت مسجل حالياً بحساب زبون:' : 'Currently signed in with customer account:'}
              </p>
              <p className="text-xs text-indigo-300/80 font-mono mt-0.5 truncate max-w-[280px]">
                {firebaseUser.email}
              </p>
            </div>
            <button
              onClick={signOutUser}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              {isArabic ? 'تبديل الحساب' : 'Switch Account'}
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Card Header Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600/30 via-amber-500/20 to-transparent border border-amber-500/40 text-amber-400 shadow-inner mb-1">
              <Store className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-serif">
              {isArabic ? 'بوابة الحرفيين والتجار' : 'Artisan Merchant Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {isArabic
                ? 'إدارة مخزون الورشة الحرفية، تحديث المنتجات اللبنانية، ومتابعة تجهيز الطلبات والشحن.'
                : 'Manage your workshop inventory, publish authentic Lebanese creations, and track fulfillment dispatches.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              id="seller-portal-tab-login"
              onClick={() => { setActivePortalTab('login'); setErrorMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activePortalTab === 'login'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تسجيل الدخول' : 'Artisan Sign In'}</span>
            </button>
            <button
              type="button"
              id="seller-portal-tab-apply"
              onClick={() => { setActivePortalTab('apply'); setErrorMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activePortalTab === 'apply'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isArabic ? 'انضم كحرفي جديد' : 'Apply to Sell'}</span>
            </button>
          </div>

          {/* TAB 1: ARTISAN LOGIN FORM (GMAIL + MOBILE + PASSWORD) */}
          {activePortalTab === 'login' && (
            <form onSubmit={handleSellerSignIn} className="space-y-4 pt-2">
              
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Requirement Summary Note */}
              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-slate-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-200/90 font-medium">
                  {isArabic 
                    ? 'تسجيل الدخول يتطلب: بريد Gmail للبائع، رقم الهاتف المحمول اللبناني المعتمد، وكلمة المرور.' 
                    : 'Seller login requires: Your registered Gmail / Email, Lebanese mobile phone number, and password.'}
                </span>
              </div>

              {/* 1. Seller Gmail / Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isArabic ? '1. بريد Gmail أو البريد الإلكتروني للبائع *' : '1. Seller Gmail / Email Address *'}
                  </label>
                  <span className="text-[10px] text-amber-400/80 font-mono font-bold">Gmail / Email</span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    id="seller-login-email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="artisan@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 text-white placeholder-slate-600 text-sm rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              {/* 2. Seller Mobile Phone Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isArabic ? '2. رقم الهاتف المحمول المعتمد للبائع *' : '2. Artisan Mobile Phone Number *'}
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">+961 Lebanon</span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 text-xs text-slate-400 font-bold font-mono pointer-events-none border-r border-slate-800 pr-2.5">
                    <LebanonFlag className="w-4 h-3 rounded-xs shadow-xs" />
                    <span>+961</span>
                  </div>
                  <input
                    type="tel"
                    id="seller-login-phone"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="70 123 456 or 03 123 456"
                    required
                    className="w-full pl-22 pr-4 py-3 bg-slate-950/60 text-white placeholder-slate-600 text-sm rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isArabic ? 'أدخل رقمك اللبناني المكون من 8 أرقام (مثال: 70 123 456)' : 'Enter your registered 8-digit Lebanese mobile number (e.g. 70 123 456)'}
                </p>
              </div>

              {/* 3. Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isArabic ? '3. كلمة المرور *' : '3. Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(authEmail);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="seller-login-password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/60 text-white placeholder-slate-600 text-sm rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Sign In Action Button */}
              <button
                type="submit"
                id="seller-login-submit-btn"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{isArabic ? 'جاري التحقق من بيانات البائع...' : 'Authenticating Seller Credentials...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isArabic ? 'تسجيل الدخول لبوابة البائع' : 'Sign In to Artisan Portal'}</span>
                    <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Google Sign-in with Gmail Alternative */}
              <div className="relative py-2 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isArabic ? 'أو عبر حساب Google' : 'Or with Seller Google Account'}
                </span>
              </div>

              <button
                type="button"
                id="seller-google-login-btn"
                onClick={handleGoogleSellerSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isArabic ? 'المتابعة عبر بريد Gmail للبائع' : 'Continue with Seller Gmail'}</span>
              </button>

              {/* Support & Notice Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{isArabic ? 'بوابة الحرفيين الرسمية المشفرة' : 'Encrypted Artisan Workspace'}</span>
                </div>
                <a
                  href="https://wa.me/96170889234?text=Hello%20Yalla%20Support,%20I%20need%20help%20with%20my%20Artisan%20Seller%20Account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'المساعدة عبر واتساب' : 'Need Login Assistance?'}</span>
                </a>
              </div>
            </form>
          )}

          {/* TAB 2: APPLY TO BECOME A SELLER */}
          {activePortalTab === 'apply' && (
            <div className="space-y-4 pt-2">
              {appSubmittedSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-200">
                      {isArabic ? 'ألف مبروك! تم استلام طلب الورشة الحرفية' : 'Mabrouk! Your Application is Received'}
                    </h3>
                    <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                      {isArabic
                        ? 'شكراً لاهتمامك بالانضمام إلى عائلة يالا. سيقوم فريق المنسقين بالتواصل معك عبر واتساب لتفعيل حسابك وربط منتجاتك.'
                        : 'Thank you for applying to join the Yalla Lebanon artisan collective. Our concierge will reach out via WhatsApp to activate your credentials.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppSubmittedSuccess(false);
                      setActivePortalTab('login');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    {isArabic ? 'العودة لصفحة الدخول' : 'Return to Sign In'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    {isArabic
                      ? 'هل تصنع منتجات مونة أصيلة، صابون غار تقليدي، حرف يدوية، أو نبيذ لبناني؟ قدم طلبك للانضمام إلى المتجر وتوصيل منتجاتك محلياً وعالمياً.'
                      : 'Are you a Lebanese producer of cold-pressed oils, laurel soaps, wild herbs, textiles, or heritage crafts? Apply below to join our marketplace.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Workshop Name EN */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'اسم الورشة / العلامة (English) *' : 'Workshop / Brand Name (English) *'}
                      </label>
                      <input
                        type="text"
                        value={appWorkshopName}
                        onChange={(e) => setAppWorkshopName(e.target.value)}
                        placeholder="e.g. Chouf Organic Honey"
                        required
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Workshop Name AR */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'اسم الورشة (بالعربية)' : 'Workshop Name (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={appWorkshopNameAr}
                        onChange={(e) => setAppWorkshopNameAr(e.target.value)}
                        placeholder="مثال: عسل الشوف العضوي"
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Craft Category */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'نوع المنتجات / الحرفة' : 'Craft Category'}
                      </label>
                      <select
                        value={appCraftCategory}
                        onChange={(e) => setAppCraftCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Pantry & Olive Oils">🫒 Terroir Olive Oils & Wild Herbs</option>
                        <option value="Soaps & Natural Skincare">🧼 Laurel Soaps & Natural Cosmetics</option>
                        <option value="Handmade Ceramics & Glass">🏺 Hand-Blown Glass & Pottery</option>
                        <option value="Woodcraft & Cedar Artifacts">🪵 Hand-Carved Cedar Wood</option>
                        <option value="Jewelry & Embroidery">🪡 Levantine Textiles & Jewelry</option>
                        <option value="Wines & Distillations">🍷 Lebanese Wines & Artisanal Arak</option>
                        <option value="Artisanal Sweets & Jams">🍯 Mountain Jams & Sweets</option>
                        <option value="Other Lebanese Craft">✨ Other Heritage Craft</option>
                      </select>
                    </div>

                    {/* Governorate */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'المحافظة اللبنانية' : 'Lebanese Governorate'}
                      </label>
                      <select
                        value={appGovernorate}
                        onChange={(e) => setAppGovernorate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                      >
                        <option value="mount_lebanon">Mount Lebanon (جبل لبنان / الشوف / المتن)</option>
                        <option value="beirut">Beirut City (بيروت)</option>
                        <option value="north">North Lebanon & Koura (الشمال والكورة وطرابلس)</option>
                        <option value="keserwan_jbeil">Keserwan & Byblos (كسروان وجبيل)</option>
                        <option value="bekaa">Beqaa & Zahlé (البقاع وزحلة وراشيا)</option>
                        <option value="south">South Lebanon & Tyre (الجنوب وصيدا وصور)</option>
                        <option value="nabatieh">Nabatieh (النبطية وبنت جبيل)</option>
                        <option value="akkar">Akkar (عكار)</option>
                        <option value="baalbek_hermel">Baalbek-Hermel (بعلبك الهرمل)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Village / City */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'البلدة / القرية' : 'Village / Town'}
                      </label>
                      <input
                        type="text"
                        value={appVillage}
                        onChange={(e) => setAppVillage(e.target.value)}
                        placeholder="e.g. Deir El Qamar, Baskinta, Tripoli"
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    {/* Contact Person Name */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'اسم المسؤول / الحرفي *' : 'Contact Person Full Name *'}
                      </label>
                      <input
                        type="text"
                        value={appContactName}
                        onChange={(e) => setAppContactName(e.target.value)}
                        placeholder="e.g. Tony Khoury"
                        required
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* WhatsApp Phone */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'رقم الهاتف / واتساب *' : 'WhatsApp Number *'}
                      </label>
                      <input
                        type="tel"
                        value={appPhone}
                        onChange={(e) => setAppPhone(e.target.value)}
                        placeholder="e.g. 70 123 456"
                        required
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {isArabic ? 'البريد الإلكتروني *' : 'Contact Email *'}
                      </label>
                      <input
                        type="email"
                        value={appEmail}
                        onChange={(e) => setAppEmail(e.target.value)}
                        placeholder="contact@workshop.lb"
                        required
                        className="w-full px-3 py-2.5 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Workshop Bio / Products */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {isArabic ? 'نبذة عن الورشة الحرفية والمنتجات' : 'Short Story / Workshop Overview'}
                    </label>
                    <textarea
                      value={appBio}
                      onChange={(e) => setAppBio(e.target.value)}
                      rows={2}
                      placeholder={isArabic ? 'أخبرنا عن طريقة الإنتاج التقليدية والمكونات الطبيعية المستخدمة...' : 'Tell us about your artisanal methods, ingredients, and heritage story...'}
                      className="w-full px-3 py-2 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Social / Instagram Link */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {isArabic ? 'رابط إنستغرام أو الموقع الإلكتروني (اختياري)' : 'Instagram Handle or Website (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={appSocialLink}
                      onChange={(e) => setAppSocialLink(e.target.value)}
                      placeholder="e.g. @chouf_crafts"
                      className="w-full px-3 py-2 bg-slate-950/60 text-white text-xs rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    id="seller-apply-submit-btn"
                    disabled={isSubmittingApp}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                  >
                    {isSubmittingApp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>{isArabic ? 'جاري إرسال الطلب...' : 'Submitting Application...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{isArabic ? 'إرسال طلب الانضمام للحرفيين' : 'Submit Artisan Application'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{isArabic ? 'استعادة كلمة مرور الحرفي' : 'Reset Merchant Password'}</span>
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {isArabic
                ? 'أدخل البريد الإلكتروني المسجل لحساب البائع وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور فوراً.'
                : 'Enter your registered merchant account email. We will send an official, secure password reset link.'}
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="artisan@yalla.lb"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 text-white text-sm rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSendingReset ? (isArabic ? 'جاري الإرسال...' : 'Sending...') : (isArabic ? 'إرسال الرابط' : 'Send Reset Link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Footer Note */}
      <div className="max-w-5xl w-full mx-auto text-center z-10 text-[11px] text-slate-500 pt-6">
        <span>© {new Date().getFullYear()} Yalla.lb • Lebanese Artisan Merchant Network & Terroir Collective</span>
      </div>

    </div>
  );
};
