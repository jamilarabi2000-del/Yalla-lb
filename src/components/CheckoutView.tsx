import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { PaymentMethod } from '../types';
import { LEBANON_REGIONS, GovernorateOption } from '../data/regions';
import { CustomBlocksRenderer } from './CustomBlocksRenderer';
import { LebanonFlag } from './LebanonFlag';
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
  ArrowLeft,
  LogIn,
  UserPlus,
  LogOut,
  UserCheck,
  AlertCircle,
  Mail,
  Check,
  Tag,
  Percent,
  EyeOff,
  Eye,
  KeyRound
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const { 
    cart, 
    cartTotalUSD, 
    discountUSD,
    appliedCouponCode,
    applyCoupon,
    removeCoupon,
    appliedDiscountRules,
    formatPrice, 
    currency, 
    setActiveTab, 
    placeOrder,
    showToast,
    goBack,
    t,
    language,
    firebaseUser,
    user,
    updateUser,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    signOutUser,
    siteContent,
    isVisualEditMode
  } = useShop();

  const visibility = siteContent?.visibility || {
    checkoutSteps: true,
    checkoutAddressForm: true,
    checkoutDeliverySpeed: true,
    checkoutPaymentMethod: true,
    checkoutOrderSummary: true,
    checkoutGuarantees: true,
  };

  const isArabic = language === 'ar';
  const [checkoutCouponInput, setCheckoutCouponInput] = useState('');
  const [isApplyingCheckoutCoupon, setIsApplyingCheckoutCoupon] = useState(false);

  const [deliverySpeed, setDeliverySpeed] = useState<'express_beirut' | 'standard' | 'diaspora_air'>('express_beirut');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod_usd');

  // Password visibility and reset modal states
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = (forgotEmail || authEmail).trim();
    if (!targetEmail) {
      showToast(isArabic ? 'الرجاء إدخال البريد الإلكتروني لإعادة تعيين كلمة المرور' : 'Please enter your email address to reset password', 'warning');
      return;
    }
    setIsSendingReset(true);
    try {
      await resetPassword(targetEmail);
      setShowForgotPasswordModal(false);
    } catch (err: any) {
    } finally {
      setIsSendingReset(false);
    }
  };
  
  // Checkout form recipient data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: 'Achrafieh, Beirut',
    street: '',
    building: '',
    notes: ''
  });

  // Save recipient fields to local cache as the user types to prevent loss and enable seamless checkout-profile sync on login
  useEffect(() => {
    const hasTypedData = 
      (formData.firstName && formData.firstName.trim() !== '') ||
      (formData.lastName && formData.lastName.trim() !== '') ||
      (formData.phone && formData.phone.trim() !== '') ||
      (formData.street && formData.street.trim() !== '') ||
      (formData.building && formData.building.trim() !== '') ||
      (formData.notes && formData.notes.trim() !== '');

    if (hasTypedData) {
      try {
        localStorage.setItem('yallalb_saved_checkout_data', JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone,
          defaultCity: formData.city,
          defaultAddress: formData.street,
          defaultBuilding: formData.building,
          defaultNotes: formData.notes
        }));
      } catch {}
    }
  }, [formData]);

  // Auth Card Local State (when unauthenticated)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync recipient fields from logged-in user profile
  useEffect(() => {
    if (firebaseUser) {
      // Name parsing & smart deduction
      const nameCandidate = user?.name || firebaseUser.displayName || '';
      let fName = user?.firstName || '';
      let lName = user?.lastName || '';

      if (!fName || !lName) {
        if (nameCandidate.trim()) {
          const parts = nameCandidate.trim().split(/\s+/);
          fName = fName || parts[0];
          lName = lName || (parts.length > 1 ? parts.slice(1).join(' ') : 'Ghattas');
        }
      }

      if (!fName || !lName) {
        const emailToParse = firebaseUser?.email || user?.email || '';
        if (emailToParse.includes('@')) {
          const raw = emailToParse.split('@')[0].replace(/[0-9]+/g, ' ').trim();
          const parts = raw.split(/[\._\-\s]+/).filter(Boolean);
          if (parts.length >= 2) {
            fName = fName || (parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase());
            lName = lName || (parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase());
          } else if (parts.length === 1 && parts[0].length > 0) {
            fName = fName || (parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase());
            lName = lName || '';
          }
        }
      }

      fName = fName || '';
      lName = lName || '';

      // Phone formatting & fallback
      let phoneVal = user?.phone || '';
      if (!phoneVal || phoneVal.trim() === '') {
        phoneVal = '';
      } else if (!phoneVal.startsWith('+961')) {
        const clean = phoneVal.replace(/\D/g, '');
        phoneVal = clean ? `+961 ${clean}` : '';
      }

      // Address & Notes defaults
      const emailVal = firebaseUser?.email || user?.email || '';
      const cityVal = user?.defaultCity || '';
      const streetVal = user?.defaultAddress || '';
      const buildingVal = user?.defaultBuilding || '';
      const notesVal = user?.defaultNotes || '';

      setFormData(prev => ({
        firstName: prev.firstName || fName,
        lastName: prev.lastName || lName,
        phone: prev.phone || phoneVal,
        email: prev.email || emailVal,
        city: prev.city || cityVal,
        street: prev.street || streetVal,
        building: prev.building || buildingVal,
        notes: prev.notes || notesVal
      }));
    } else {
      // Guest mode: clear personal data
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        city: 'Achrafieh, Beirut',
        street: '',
        building: '',
        notes: ''
      });
    }
  }, [firebaseUser, user]);

  // Sync guest-entered checkout details to user profile immediately upon logging in or signing up
  useEffect(() => {
    if (firebaseUser && user) {
      const hasGuestFirstName = formData.firstName && formData.firstName.trim() !== '';
      const hasGuestLastName = formData.lastName && formData.lastName.trim() !== '';
      const hasGuestPhone = formData.phone && formData.phone.trim() !== '';
      const hasGuestAddress = formData.street && formData.street.trim() !== '';

      if (hasGuestFirstName || hasGuestLastName || hasGuestPhone || hasGuestAddress) {
        const isProfileDifferent = 
          user.firstName !== formData.firstName || 
          user.lastName !== formData.lastName || 
          user.phone !== formData.phone ||
          user.defaultCity !== formData.city ||
          user.defaultAddress !== formData.street;

        if (isProfileDifferent) {
          const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
          updateUser({
            name: fullName || user.name,
            firstName: formData.firstName.trim() || user.firstName,
            lastName: formData.lastName.trim() || user.lastName,
            phone: formData.phone || user.phone,
            defaultCity: formData.city || user.defaultCity,
            defaultAddress: formData.street || user.defaultAddress,
            defaultBuilding: formData.building || user.defaultBuilding,
            defaultNotes: formData.notes || user.defaultNotes
          }).catch((err) => {
            console.error("[CheckoutView] Error syncing guest data to user profile:", err);
          });
        }
      }
    }
  }, [firebaseUser, firebaseUser?.uid]);

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

  // Region & Delivery fee calculation
  const matchedRegion = LEBANON_REGIONS.find(r => 
    r.id === user?.defaultGovernorate ||
    r.majorCities.some(c => (formData.city || '').toLowerCase().includes(c.toLowerCase().split(' ')[0]))
  ) || LEBANON_REGIONS[0];

  const deliveryFeeUSD = deliverySpeed === 'express_beirut' 
    ? (matchedRegion.expressAvailable ? matchedRegion.baseDeliveryUSD : matchedRegion.baseDeliveryUSD + 1.5)
    : deliverySpeed === 'standard' 
    ? matchedRegion.baseDeliveryUSD 
    : 28.0;

  const finalTotalUSD = cartTotalUSD + (cart.length > 0 ? deliveryFeeUSD : 0);

  // Sign In Handler from Checkout
  const handleCheckoutSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast(isArabic ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter both email and password', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      await signInWithEmail(authEmail, authPassword);
      showToast(isArabic ? 'تم تسجيل الدخول بنجاح! يمكنك الآن إتمام الطلب.' : 'Logged in successfully! You can now complete your order.', 'success');
    } catch {
      // Handled in context
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sign Up Handler from Checkout
  const handleCheckoutSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFirstName.trim() || !signupLastName.trim()) {
      showToast(isArabic ? 'الاسم الأول واسم العائلة مطلوبان' : 'First name and last name are required', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      showToast(isArabic ? 'صيغة البريد الإلكتروني غير صحيحة' : 'A valid email format is required', 'warning');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      showToast(isArabic ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'warning');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showToast(isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'warning');
      return;
    }
    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 8) {
      showToast(isArabic ? 'يجب أن يتألف رقم الهاتف اللبناني من 8 أرقام' : 'Lebanese phone number must be strictly 8 digits', 'warning');
      return;
    }

    const fullName = `${signupFirstName.trim()} ${signupLastName.trim()}`;
    const formattedPhone = `+961 ${cleanPhone}`;

    setIsAuthLoading(true);
    try {
      try {
        localStorage.setItem('yallalb_signup_profile_temp', JSON.stringify({
          firstName: signupFirstName.trim(),
          lastName: signupLastName.trim(),
          phone: formattedPhone,
          defaultCity: formData.city || 'Achrafieh, Beirut',
          defaultAddress: formData.street || '',
          defaultBuilding: formData.building || '',
          defaultNotes: formData.notes || ''
        }));
      } catch {}
      await signUpWithEmail(authEmail, authPassword);
      await updateUser({
        name: fullName,
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        email: authEmail,
        phone: formattedPhone,
        defaultCity: formData.city || 'Achrafieh, Beirut',
        defaultAddress: formData.street || '',
        defaultBuilding: formData.building || '',
        defaultNotes: formData.notes || ''
      });
      // Auto fill form data
      setFormData(prev => ({
        ...prev,
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        phone: formattedPhone,
        email: authEmail
      }));
      showToast(isArabic ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح!' : 'Account created and signed in successfully!', 'success');
    } catch {
      // Handled in context
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Google Sign In Handler
  const handleCheckoutGoogle = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
      showToast(isArabic ? 'تم تسجيل الدخول بواسطة Google!' : 'Signed in with Google!', 'success');
    } catch {
      // Handled in context
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Apple Sign In Handler
  const handleCheckoutApple = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithApple();
      showToast(isArabic ? 'تم تسجيل الدخول بواسطة Apple!' : 'Signed in with Apple!', 'success');
    } catch {
      // Handled in context
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Submit Final Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast(isArabic ? 'حقيبة التسوق فارغة' : 'Your cart is empty. Add products before placing an order.', 'warning');
      return;
    }

    // Fallbacks if user profile or form data is not filled out
    const fName = formData.firstName.trim() || user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Valued');
    const lName = formData.lastName.trim() || user?.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : 'Customer');
    const finalPhone = formData.phone.trim() || user?.phone || '+961 (Contact Required)';
    const finalStreet = formData.street.trim() || user?.defaultAddress || 'Beirut, Lebanon';
    const finalEmail = formData.email.trim() || firebaseUser?.email || user?.email || `${fName.toLowerCase()}.${lName.toLowerCase()}@example.com`;
    const finalCity = formData.city.trim() || user?.defaultCity || 'Beirut';

    const fullName = `${fName} ${lName}`;

    setIsSubmitting(true);
    try {
      const newOrder = await placeOrder({
        items: [...cart],
        shipping: {
          fullName: fullName,
          firstName: fName,
          lastName: lName,
          phone: finalPhone,
          email: finalEmail,
          governorate: matchedRegion?.nameEn || 'Beirut',
          city: finalCity,
          street: finalStreet,
          building: formData.building.trim() || 'N/A',
          deliveryNotes: formData.notes.trim() || '',
          deliverySpeed: deliverySpeed
        },
        paymentMethod: paymentMethod,
        currency: currency,
        subtotalUSD: Math.round(cart.reduce((s, i) => s + i.product.priceUSD * i.quantity, 0) * 100) / 100,
        deliveryFeeUSD: deliveryFeeUSD,
        totalUSD: finalTotalUSD,
        totalLBP: finalTotalUSD * 89500,
        discountUSD: discountUSD,
        appliedCoupon: appliedCouponCode || undefined,
        estimatedDelivery: deliverySpeed === 'express_beirut' 
          ? 'Within 2 Hours (Beirut Express)' 
          : deliverySpeed === 'standard' 
          ? '24-48 Hours (All Lebanon)' 
          : '3-5 Business Days (DHL Diaspora Air)'
      });

      // Persist user shipping details for subsequent visits
      updateUser({
        name: fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone,
        defaultCity: formData.city,
        defaultAddress: formData.street,
        defaultBuilding: formData.building,
        defaultNotes: formData.notes
      }).catch(() => {});
      try {
        localStorage.setItem('yallalb_saved_checkout_data', JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone,
          defaultCity: formData.city,
          defaultAddress: formData.street,
          defaultBuilding: formData.building,
          defaultNotes: formData.notes
        }));
      } catch {}

      setOrderComplete(newOrder.id);
    } catch {
      showToast('An error occurred while placing your order. Please try again.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    const successBadge = isArabic 
      ? (siteContent?.checkoutSuccessPage?.successBadgeArabic ?? 'تم تأكيد الطلب بنجاح')
      : (siteContent?.checkoutSuccessPage?.successBadge ?? 'Order Placed Successfully');

    const successTitle = isArabic
      ? (siteContent?.checkoutSuccessPage?.successTitleArabic ?? 'شكراً! تم استلام طلبك اللبناني')
      : (siteContent?.checkoutSuccessPage?.successTitle ?? 'Shukran! Your Lebanese Order is');

    const nextStepsHeading = isArabic
      ? (siteContent?.checkoutSuccessPage?.nextStepsHeadingArabic ?? 'الخطوات التالية واللوجستيات:')
      : (siteContent?.checkoutSuccessPage?.nextStepsHeading ?? 'Next Steps & Dispatch Logistics:');

    const step1 = isArabic
      ? (siteContent?.checkoutSuccessPage?.step1TextArabic ?? 'تم توجيه طلبك من المستودع الرئيسي في بيروت إلى الحرفيين المعنيين.')
      : (siteContent?.checkoutSuccessPage?.step1Text ?? 'Our Beirut central depot has routed your basket to the regional artisan guilds.');

    const step2 = isArabic
      ? (siteContent?.checkoutSuccessPage?.step2TextArabic ?? 'ستصلك رسالة عبر تطبيق واتساب من السائق المخصص لتأكيد موقع التسليم بدقة.')
      : (siteContent?.checkoutSuccessPage?.step2Text ?? 'You will receive a WhatsApp message from your dedicated courier to confirm exact GPS drop-off.');

    const step3 = isArabic
      ? (siteContent?.checkoutSuccessPage?.step3TextArabic ?? `الدفع نقداً عند الاستلام بقيمة ($${finalTotalUSD.toFixed(2)}) أو بالليرة اللبنانية.`)
      : (siteContent?.checkoutSuccessPage?.step3Text ?? `Settlement is strictly ($${finalTotalUSD.toFixed(2)}) upon handover or digital transfer.`);

    // Support dynamic price insertion in CMS
    const step3Replaced = step3.replace('{price}', `$${finalTotalUSD.toFixed(2)}`);

    const btnTrack = isArabic
      ? (siteContent?.checkoutSuccessPage?.buttonTrackTextArabic ?? 'متابعة الطلب في حسابي')
      : (siteContent?.checkoutSuccessPage?.buttonTrackText ?? 'Track in My Account');

    const btnContinue = isArabic
      ? (siteContent?.checkoutSuccessPage?.buttonContinueTextArabic ?? 'متابعة التسوق')
      : (siteContent?.checkoutSuccessPage?.buttonContinueText ?? 'Continue Shopping');

    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50">
        <div className="max-w-xl w-full p-8 sm:p-12 rounded-3xl premium-card text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">
              {successBadge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-slate-900 leading-tight">
              {successTitle} <span className="gold-gradient font-serif italic font-normal">{isArabic ? 'بنجاح' : 'Confirmed'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {isArabic ? 'رمز التتبع المرجعي:' : 'Reference code:'} <span className="font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 inline-block mt-1">#{orderComplete}</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-left text-xs space-y-2.5 text-slate-700">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <Clock className="w-4 h-4" />
              <span>{nextStepsHeading}</span>
            </div>
            <p className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">1.</span>
              <span>{step1}</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">2.</span>
              <span>{step2}</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#c5a059] font-bold">3.</span>
              <span>{step3Replaced}</span>
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setActiveTab('account')}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-lg rounded-xl"
            >
              {btnTrack}
            </button>
            <button
              onClick={() => { setOrderComplete(null); setActiveTab('products'); }}
              className="px-8 py-3.5 border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10 font-bold uppercase text-xs tracking-widest transition-all cursor-pointer rounded-xl"
            >
              {btnContinue}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* Top Custom Divs / Banners */}
      <CustomBlocksRenderer page="checkout" position="top" />

      {/* Checkout Header */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <button
            id="checkout-page-back-btn"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-200 transition-colors cursor-pointer mb-1 shadow-sm"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
            <span>{t('back')}</span>
          </button>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            {siteContent?.checkoutPage?.title ? (
              <span>{siteContent.checkoutPage.title}</span>
            ) : isArabic ? (
              <>التوصيل و <span className="gold-gradient font-serif italic">إتمام التسوية والطلب</span></>
            ) : (
              <>Delivery & <span className="gold-gradient font-serif italic">Payment Settlement</span></>
            )}
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {siteContent?.checkoutPage?.subtitle ? (
              siteContent.checkoutPage.subtitle
            ) : isArabic ? (
              'اختر سرعة التوصيل وطريقة التسوية لشحن وتجهيز طلبك اللبناني بأمان.'
            ) : (
              'Select delivery speed and payment method for fast dispatch across Lebanon or internationally.'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {cart.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <Truck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('emptyBasket')}</h2>
            <p className="text-xs text-slate-500">
              {t('emptyBasketSub')}
            </p>
            <button
              onClick={() => setActiveTab('products')}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest cursor-pointer transition-colors shadow-lg rounded-xl"
            >
              {t('viewAllProducts')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Auth Gate, Delivery & Payment Details */}
            <div className="lg:col-span-7 space-y-6">

              {/* Checkout Steps Indicator */}
              {(visibility.checkoutSteps || isVisualEditMode) && (
                <div className={`p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative ${!visibility.checkoutSteps && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80' : ''}`}>
                  {!visibility.checkoutSteps && isVisualEditMode && (
                    <div className="absolute top-1 right-2 z-40 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                      <EyeOff className="w-2.5 h-2.5" />
                      <span>Steps Hidden</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                        firebaseUser 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {firebaseUser ? '✓' : '1'}
                      </div>
                      <span className={`text-xs font-bold ${firebaseUser ? 'text-slate-500' : 'text-slate-900'}`}>
                        {isArabic ? 'حساب المستفيد' : 'Patron Account'}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200 flex-1 mx-4" />

                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                        firebaseUser 
                          ? 'bg-amber-500 text-white animate-pulse' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        2
                      </div>
                      <span className={`text-xs font-bold ${firebaseUser ? 'text-slate-900' : 'text-slate-400'}`}>
                        {isArabic ? 'بيانات الشحن' : 'Delivery Address'}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200 flex-1 mx-4" />

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center">
                        3
                      </div>
                      <span className="text-xs font-bold text-slate-400">
                        {isArabic ? 'التسوية والطلب' : 'Settlement'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔒 AUTHENTICATION GATE CARD IF NOT LOGGED IN */}
              {!firebaseUser ? (
                <div id="checkout-auth-required-card" className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-amber-300/80 shadow-xl shadow-amber-900/5 space-y-6 relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#b89753] to-amber-600" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-1">
                          <AlertCircle className="w-3 h-3 text-amber-700" />
                          <span>{isArabic ? 'تسجيل الدخول مطلوب' : 'Login Required to Proceed'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {isArabic ? 'يرجى تسجيل الدخول لإتمام طلبك' : 'Sign in to Complete Your Order'}
                        </h3>
                      </div>
                    </div>

                    {/* Auth Mode Toggle Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                      <button
                        type="button"
                        id="checkout-switch-signin-btn"
                        onClick={() => setAuthMode('signin')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          authMode === 'signin' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isArabic ? 'تسجيل دخول' : 'Sign In'}
                      </button>
                      <button
                        type="button"
                        id="checkout-switch-signup-btn"
                        onClick={() => setAuthMode('signup')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          authMode === 'signup' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isArabic ? 'حساب جديد' : 'New Account'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isArabic 
                      ? 'لضمان أمان طلبك وتوفير تتبع الطلبات عبر واتساب وحفظ عنوانك، يرجى تسجيل الدخول أو إنشاء حساب لبناني جديد.'
                      : 'To track courier dispatch, receive WhatsApp notifications, and auto-fill your delivery coordinates, please sign in or register below.'}
                  </p>

                  {/* Social Instant Sign In */}
                  <div>
                    <button
                      type="button"
                      id="checkout-google-signin-btn"
                      onClick={handleCheckoutGoogle}
                      disabled={isAuthLoading}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>{isArabic ? 'المتابعة السريعة باستخدام حساب Google' : 'Continue with Google Account'}</span>
                    </button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isArabic ? 'أو عبر البريد الإلكتروني' : 'Or with email & password'}
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Sign In Form */}
                  {authMode === 'signin' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          {isArabic ? 'البريد الإلكتروني *' : 'Email Address *'}
                        </label>
                        <input
                          type="email"
                          id="checkout-auth-email-input"
                          placeholder="name@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {isArabic ? 'كلمة المرور *' : 'Password *'}
                          </label>
                          <button
                            type="button"
                            id="checkout-forgot-password-btn"
                            onClick={() => {
                              setForgotEmail(authEmail);
                              setShowForgotPasswordModal(true);
                            }}
                            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors cursor-pointer"
                          >
                            {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="checkout-auth-password-input"
                            placeholder="••••••••"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="checkout-submit-signin-btn"
                        onClick={handleCheckoutSignIn}
                        disabled={isAuthLoading}
                        className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        <LogIn className="w-4 h-4 text-[#c5a059]" />
                        <span>{isAuthLoading ? (isArabic ? 'جاري التحقق...' : 'Signing in...') : (isArabic ? 'تسجيل الدخول ومتابعة الطلب' : 'Sign In & Continue Checkout')}</span>
                      </button>
                    </div>
                  ) : (
                    /* Sign Up Form */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            {isArabic ? 'الاسم الأول *' : 'First Name *'}
                          </label>
                          <input
                            type="text"
                            id="checkout-signup-firstname-input"
                            placeholder="e.g. Walid"
                            value={signupFirstName}
                            onChange={(e) => setSignupFirstName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            {isArabic ? 'اسم العائلة *' : 'Last Name *'}
                          </label>
                          <input
                            type="text"
                            id="checkout-signup-lastname-input"
                            placeholder="e.g. Ghattas"
                            value={signupLastName}
                            onChange={(e) => setSignupLastName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            {isArabic ? 'رقم الواتساب اللبناني *' : 'Lebanese WhatsApp Phone *'}
                          </label>
                          <div className="relative flex items-center">
                            <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-slate-500 font-bold text-xs select-none">
                              <LebanonFlag className="w-4 h-3 rounded-xs" />
                              <span>+961</span>
                            </div>
                            <input
                              type="tel"
                              id="checkout-signup-phone-input"
                              placeholder="70 123456"
                              maxLength={8}
                              value={signupPhone}
                              onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                              className="w-full pl-20 pr-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm font-mono transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            {isArabic ? 'البريد الإلكتروني *' : 'Email Address *'}
                          </label>
                          <input
                            type="email"
                            id="checkout-signup-email-input"
                            placeholder="name@example.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            {isArabic ? 'كلمة المرور *' : 'Password *'}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="checkout-signup-password-input"
                              placeholder="Minimum 6 characters"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            {isArabic ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="checkout-signup-confirm-password-input"
                              placeholder="Repeat password"
                              value={authConfirmPassword}
                              onChange={(e) => setAuthConfirmPassword(e.target.value)}
                              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="checkout-submit-signup-btn"
                        onClick={handleCheckoutSignUp}
                        disabled={isAuthLoading}
                        className="w-full py-3.5 rounded-xl bg-[#b89753] hover:bg-[#a38446] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{isAuthLoading ? (isArabic ? 'جاري الإنشاء...' : 'Creating Account...') : (isArabic ? 'إنشاء حساب ومتابعة الطلب' : 'Create Account & Continue Checkout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ✅ LOGGED IN USER BANNER */
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || 'Lebanese Patron'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {isArabic ? 'تم تسجيل الدخول' : 'Verified Account'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {firebaseUser.email || user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await signOutUser();
                      showToast(isArabic ? 'تم تسجيل الخروج' : 'Signed out', 'info');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-white border border-slate-200 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'تبديل الحساب' : 'Switch Account'}</span>
                  </button>
                </div>
              )}
              
              {/* Recipient Details & Address */}
              {firebaseUser && (visibility.checkoutAddressForm || isVisualEditMode) && (
                <div className={`p-6 rounded-3xl premium-card space-y-5 transition-opacity relative ${!visibility.checkoutAddressForm && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80' : ''}`}>
                  {!visibility.checkoutAddressForm && isVisualEditMode && (
                    <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <EyeOff className="w-3 h-3" />
                      <span>Address Form Hidden (Draft)</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-600" />
                      <span>{siteContent?.checkoutPage?.shippingHeading || (isArabic ? 'بيانات المستلم والعنوان في لبنان' : 'Recipient & Delivery Address')}</span>
                    </h3>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                      <Check className="w-3.5 h-3.5" />
                      {isArabic ? 'معبأ تلقائياً من ملفك الشخصي' : 'Auto-filled from profile'}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl flex items-center justify-between text-xs text-amber-800">
                    <span className="font-medium pr-2">
                      {isArabic 
                        ? 'تُملأ بيانات التوصيل تلقائياً من حسابك وتعديلها يتم فقط من خلال ملفك الشخصي.' 
                        : 'Your details are auto-filled and can only be updated from your profile tab.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('account')}
                      className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isArabic ? 'تحديث الملف' : 'Update Profile'}
                    </button>
                  </div>

                  {/* 🌟 SEPARATE FIRST NAME AND LAST NAME */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isArabic ? 'الاسم الأول *' : 'First Name *'}
                      </label>
                      <input
                        type="text"
                        id="checkout-first-name-input"
                        placeholder="e.g. Walid"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isArabic ? 'اسم العائلة *' : 'Last Name *'}
                      </label>
                      <input
                        type="text"
                        id="checkout-last-name-input"
                        placeholder="e.g. Ghattas"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isArabic ? 'رقم الهاتف اللبناني / واتساب *' : 'Lebanese Mobile Phone / WhatsApp *'}
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center gap-1 pointer-events-none text-slate-500 font-bold text-xs select-none">
                          <LebanonFlag className="w-4 h-3 rounded-xs" />
                        </div>
                        <input
                          type="tel"
                          id="checkout-phone-input"
                          placeholder="+961 70 123 456"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isArabic ? 'البريد الإلكتروني للإشعار *' : 'Email for Dispatch & Invoice *'}
                      </label>
                      <input
                        type="email"
                        id="checkout-email-input"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {isArabic ? 'المدينة / المنطقة / المحافظة *' : 'City / Governorate *'}
                    </label>
                    <input
                      type="text"
                      id="checkout-city-input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Achrafieh, Beirut"
                      className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isArabic ? 'الشارع / نقطة علام معروفة *' : 'Street / Landmark *'}
                      </label>
                      <input
                        type="text"
                        id="checkout-street-input"
                        placeholder="e.g. Gouraud Street, next to Paul Bakery"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        {isArabic ? 'المبنى، الطابق، رقم الشقة' : 'Building, Floor & Apt'}
                      </label>
                      <input
                        type="text"
                        id="checkout-building-input"
                        placeholder="e.g. Al-Nour Bldg, 4th Floor, Apt B"
                        value={formData.building}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {isArabic ? 'ملاحظات إضافية للتوصيل (اختياري)' : 'Delivery Notes & Courier Instructions (Optional)'}
                    </label>
                    <input
                      type="text"
                      id="checkout-notes-input"
                      placeholder="e.g. Call upon arrival, leave with building concierge if not present"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              )}


            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-5 space-y-6">
              
              {(visibility.checkoutOrderSummary || isVisualEditMode) && (
                <div className={`p-6 rounded-3xl premium-card space-y-6 sticky top-28 relative ${!visibility.checkoutOrderSummary && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80' : ''}`}>
                  {!visibility.checkoutOrderSummary && isVisualEditMode && (
                    <div className="absolute top-2 right-4 z-40 bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <EyeOff className="w-3 h-3" />
                      <span>Summary Box Hidden</span>
                    </div>
                  )}
                  <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span>{siteContent?.checkoutPage?.summaryHeading || (isArabic ? 'ملخص الطلب' : 'Order Summary')}</span>
                    <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">{cart.length} {isArabic ? 'منتجات' : 'Items'}</span>
                  </h3>

                {/* Items preview */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 text-xs">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.product.name}</h4>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity} × {formatPrice(item.product.priceUSD)}</p>
                      </div>
                      <span className="font-bold text-amber-700">
                        {formatPrice(item.product.priceUSD * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section in Checkout */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#96783d]" />
                      <span>{isArabic ? 'كوبون الخصم' : 'Discount Coupon'}</span>
                    </span>
                    {appliedCouponCode && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {appliedCouponCode}
                      </span>
                    )}
                  </div>

                  {appliedCouponCode ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isArabic ? `تم توفير ${formatPrice(discountUSD)}` : `Saved ${formatPrice(discountUSD)}`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200 cursor-pointer"
                      >
                        {isArabic ? 'إلغاء' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={checkoutCouponInput}
                        onChange={(e) => setCheckoutCouponInput(e.target.value.toUpperCase())}
                        placeholder={isArabic ? 'مثال: KOURA15' : 'e.g. KOURA15'}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-mono uppercase focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (checkoutCouponInput.trim()) {
                            setIsApplyingCheckoutCoupon(true);
                            applyCoupon(checkoutCouponInput);
                            setIsApplyingCheckoutCoupon(false);
                            setCheckoutCouponInput('');
                          }
                        }}
                        disabled={isApplyingCheckoutCoupon || !checkoutCouponInput.trim()}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-[#a37f35] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {isArabic ? 'تطبيق' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals Calculation */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{isArabic ? 'مجموع المنتجات' : 'Products Subtotal'}</span>
                    <span className="font-bold">{formatPrice(Math.round(cart.reduce((s, i) => s + i.product.priceUSD * i.quantity, 0) * 100) / 100)}</span>
                  </div>

                  {discountUSD > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'الخصم المطبق' : 'Applied Discount'}</span>
                      </span>
                      <span>-{formatPrice(discountUSD)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>{isArabic ? 'أجور التوصيل والشحن' : 'Delivery Courier Fee'}</span>
                    <span className="font-bold text-amber-700">+{formatPrice(deliveryFeeUSD)}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-900">{isArabic ? 'المبلغ الإجمالي المستحق' : 'Total Amount Due'}</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-700">
                        {formatPrice(finalTotalUSD)}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ≈ {(finalTotalUSD * 89500).toLocaleString()} LBP
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  id="place-order-btn"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-slate-900 hover:bg-[#a37f35] text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isSubmitting 
                      ? (isArabic ? 'جاري المعالجة...' : 'Processing Order...') 
                      : siteContent?.checkoutPage?.orderButtonText
                        ? `${siteContent.checkoutPage.orderButtonText} ($${finalTotalUSD.toFixed(2)})`
                        : (isArabic 
                          ? `تأكيد الطلب اللبناني ($${finalTotalUSD.toFixed(2)})` 
                          : `Confirm Lebanese Order ($${finalTotalUSD.toFixed(2)})`)}
                  </span>
                </button>

                {!firebaseUser && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 text-center font-medium flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'يرجى تسجيل الدخول أعلاه لإكمال الطلب' : 'Please sign in or register above to complete order'}</span>
                  </p>
                )}

                {/* Guarantee Badges */}
                {(visibility.checkoutGuarantees || isVisualEditMode) && (
                  <div className={`pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5 relative ${!visibility.checkoutGuarantees && isVisualEditMode ? 'opacity-70 border-2 border-dashed border-rose-500/80 p-1.5 rounded-lg' : ''}`}>
                    {!visibility.checkoutGuarantees && isVisualEditMode && (
                      <div className="absolute top-0 right-0 bg-rose-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold">Hidden</div>
                    )}
                    <div className="flex items-center gap-2">
                      <LebanonFlag className="w-3.5 h-2.5 rounded-xs" />
                      <span>{siteContent?.checkoutPage?.guaranteeBadgeText || '100% Authentic Lebanese Artisan Guilds'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dedicated courier WhatsApp confirmation before drop-off</span>
                    </div>
                  </div>
                )}

              </div>
              )}

            </div>

          </form>
        )}

      </div>

      {/* Bottom Custom Divs / Banners */}
      <CustomBlocksRenderer page="checkout" position="bottom" />

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Your Password'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isArabic ? 'أدخل بريدك الإلكتروني وسيتم إرسال رابط إعادة التعيين.' : 'Enter your registered email address to receive a reset link.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {isArabic ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    id="checkout-forgot-email-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  id="checkout-send-reset-btn"
                  disabled={isSendingReset}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSendingReset ? (
                    <span>{isArabic ? 'جاري الإرسال...' : 'Sending Link...'}</span>
                  ) : (
                    <span>{isArabic ? 'إرسال رابط التعيين' : 'Send Reset Link'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
