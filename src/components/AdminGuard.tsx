import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Lock, AlertCircle, Loader2, KeyRound, ShieldAlert, X, Phone, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  auth,
  functionsInstance,
  httpsCallable,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  getMultiFactorResolver,
  MultiFactorResolver
} from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {
  isMfaSessionValid,
  setAdminMfaSession,
  clearAdminMfaSession,
  registerMfaPromptHandler
} from '../utils/adminMfa';

interface AdminGuardProps {
  children: React.ReactNode;
}

type AuthMode = 'login' | 'mfa_challenge' | 'mfa_enroll' | 'config_help';

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { authStatus, firebaseUser } = useShop();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // MFA Challenge State
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [verificationId, setVerificationId] = useState<string>('');
  const [phoneHintText, setPhoneHintText] = useState<string>('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isSendingMfaSms, setIsSendingMfaSms] = useState(false);

  // MFA Enrollment State
  const [enrollPhone, setEnrollPhone] = useState('');
  const [enrollVerificationId, setEnrollVerificationId] = useState('');
  const [enrollOtpCode, setEnrollOtpCode] = useState('');
  const [enrollStep, setEnrollStep] = useState<'input_phone' | 'verify_otp'>('input_phone');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // High-Risk Step-Up Modal State
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const [stepUpVerificationId, setStepUpVerificationId] = useState('');
  const [isStepUpVerifying, setIsStepUpVerifying] = useState(false);
  const [isSendingStepUpOtp, setIsSendingStepUpOtp] = useState(false);
  const [stepUpResendTimer, setStepUpResendTimer] = useState<number>(60);
  const [canStepUpResend, setCanStepUpResend] = useState<boolean>(false);
  const stepUpResolverRef = useRef<((success: boolean) => void) | null>(null);

  const [isMfaVerified, setIsMfaVerified] = useState<boolean>(() => isMfaSessionValid(firebaseUser?.uid));
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const getOrCreateRecaptchaVerifier = (elementId: string): RecaptchaVerifier => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {}
      recaptchaVerifierRef.current = null;
    }
    const verifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {}
    });
    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  // Sync session state when firebaseUser changes
  useEffect(() => {
    if (firebaseUser?.uid) {
      setIsMfaVerified(isMfaSessionValid(firebaseUser.uid));
    } else {
      setIsMfaVerified(false);
    }
  }, [firebaseUser?.uid]);

  // If user is authenticated admin but needs MFA verification or enrollment
  useEffect(() => {
    if (authStatus === 'authenticated_admin' && firebaseUser && !isMfaVerified && mode === 'login') {
      const userMultiFactor = multiFactor(firebaseUser);
      const enrolled = userMultiFactor.enrolledFactors || [];
      const hasPhone = enrolled.some(f => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
      if (!hasPhone) {
        setMode('mfa_enroll');
      }
    }
  }, [authStatus, firebaseUser, isMfaVerified, mode]);

  // Resend countdown timers
  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendTimer]);

  useEffect(() => {
    let timer: any;
    if (showStepUpModal && stepUpResendTimer > 0) {
      timer = setInterval(() => {
        setStepUpResendTimer(prev => {
          if (prev <= 1) {
            setCanStepUpResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stepUpResendTimer <= 0) {
      setCanStepUpResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showStepUpModal, stepUpResendTimer]);

  // High-Risk Step-Up Listener
  useEffect(() => {
    const unregister = registerMfaPromptHandler(async (resolve) => {
      stepUpResolverRef.current = resolve;
      setShowStepUpModal(true);
      setStepUpCode('');
      setStepUpError(null);
      setStepUpResendTimer(60);
      setCanStepUpResend(false);

      if (auth.currentUser) {
        const mfaUser = multiFactor(auth.currentUser);
        const enrolled = mfaUser.enrolledFactors || [];
        const phoneHint = enrolled.find(f => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
        if (phoneHint) {
          setIsSendingStepUpOtp(true);
          try {
            const verifier = getOrCreateRecaptchaVerifier('admin-stepup-recaptcha-container');
            const session = await mfaUser.getSession();
            const phoneAuthProvider = new PhoneAuthProvider(auth);
            const vId = await phoneAuthProvider.verifyPhoneNumber(
              { multiFactorHint: phoneHint, session },
              verifier
            );
            setStepUpVerificationId(vId);
          } catch (err: any) {
            console.warn('Step-up verification initialization notice:', err?.message || err);
            setStepUpError(err?.message || 'Unable to dispatch step-up verification code.');
          } finally {
            setIsSendingStepUpOtp(false);
          }
        }
      }
    });
    return () => unregister();
  }, []);

  const handleStepUpResend = async () => {
    if (!canStepUpResend || isSendingStepUpOtp || !auth.currentUser) return;
    setIsSendingStepUpOtp(true);
    setStepUpError(null);
    try {
      const mfaUser = multiFactor(auth.currentUser);
      const phoneHint = (mfaUser.enrolledFactors || []).find(
        f => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID
      );
      if (phoneHint) {
        const verifier = getOrCreateRecaptchaVerifier('admin-stepup-recaptcha-container');
        const session = await mfaUser.getSession();
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const vId = await phoneAuthProvider.verifyPhoneNumber(
          { multiFactorHint: phoneHint, session },
          verifier
        );
        setStepUpVerificationId(vId);
        setStepUpResendTimer(60);
        setCanStepUpResend(false);
      }
    } catch (err: any) {
      setStepUpError(err?.message || 'Failed to resend step-up code.');
    } finally {
      setIsSendingStepUpOtp(false);
    }
  };

  const handleStepUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepUpCode.trim() || !stepUpVerificationId) {
      setStepUpError('Please enter the 6-digit verification code.');
      return;
    }
    setIsStepUpVerifying(true);
    setStepUpError(null);
    try {
      const cred = PhoneAuthProvider.credential(stepUpVerificationId, stepUpCode.trim());
      PhoneMultiFactorGenerator.assertion(cred);

      if (auth.currentUser) {
        setAdminMfaSession(auth.currentUser.uid);
        try {
          const recordStepUp = httpsCallable(functionsInstance, 'recordAdminStepUp');
          await recordStepUp();
        } catch (callErr) {
          console.warn('Record step-up call notice:', callErr);
        }
      }

      setShowStepUpModal(false);
      if (stepUpResolverRef.current) {
        stepUpResolverRef.current(true);
        stepUpResolverRef.current = null;
      }
    } catch (err: any) {
      console.warn('Step-up verification failed:', err?.message || err);
      setStepUpError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setIsStepUpVerifying(false);
    }
  };

  // Primary Sign In with Email/Password + Multi-Factor Detection
  const handlePrimarySignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // First factor succeeded. Verify admin claims.
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const isUserAdmin = Boolean(idTokenResult.claims && (idTokenResult.claims as any).admin === true);

      if (!isUserAdmin) {
        setLoginError('This account does not have administrator privileges.');
        setIsSubmitting(false);
        return;
      }

      // Check if SMS MFA is already enrolled
      const mfaUser = multiFactor(userCredential.user);
      const phoneFactors = (mfaUser.enrolledFactors || []).filter(
        f => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID
      );

      if (phoneFactors.length === 0) {
        // Must enroll second factor before gaining access
        setMode('mfa_enroll');
      } else {
        setAdminMfaSession(userCredential.user.uid);
        setIsMfaVerified(true);
        try {
          const recordStepUp = httpsCallable(functionsInstance, 'recordAdminStepUp');
          await recordStepUp();
        } catch {}
      }
    } catch (err: any) {
      if (err.code === 'auth/multi-factor-auth-required') {
        // Official Firebase SMS Multi-Factor Authentication Challenge
        try {
          const resolver = getMultiFactorResolver(auth, err);
          setMfaResolver(resolver);

          const phoneHint = resolver.hints.find(
            h => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID
          ) || resolver.hints[0];

          const hintLabel = (phoneHint as any)?.phoneNumber
            ? (phoneHint as any).phoneNumber
            : ((phoneHint as any)?.displayName || 'your registered mobile phone');
          setPhoneHintText(hintLabel);

          // Trigger SMS OTP send via Firebase Authentication PhoneAuthProvider
          const verifier = getOrCreateRecaptchaVerifier('admin-recaptcha-container');
          const phoneAuthProvider = new PhoneAuthProvider(auth);
          const vId = await phoneAuthProvider.verifyPhoneNumber(
            { multiFactorHint: phoneHint, session: resolver.session },
            verifier
          );

          setVerificationId(vId);
          setResendTimer(60);
          setCanResend(false);
          setMode('mfa_challenge');
        } catch (mfaInitErr: any) {
          console.error('MFA challenge init error:', mfaInitErr);
          setLoginError(
            mfaInitErr?.message || 'Failed to initialize Firebase SMS verification. Please check console configuration.'
          );
        }
      } else if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation' ||
        err.code === 'auth/missing-multi-factor-info'
      ) {
        setLoginError(
          'Firebase Authentication SMS Multi-Factor Authentication must be enabled in the Firebase Console.'
        );
        setMode('config_help');
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setLoginError('Invalid administrator email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setLoginError('Too many failed attempts. Please wait a moment before trying again.');
      } else {
        setLoginError(err.message || 'An unexpected authentication error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Primary SMS OTP via Firebase Authentication
  const handleResendMfaSms = async () => {
    if (!canResend || isSendingMfaSms || !mfaResolver) return;
    setIsSendingMfaSms(true);
    setOtpError(null);
    try {
      const phoneHint = mfaResolver.hints.find(
        h => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID
      ) || mfaResolver.hints[0];

      const verifier = getOrCreateRecaptchaVerifier('admin-recaptcha-container');
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const vId = await phoneAuthProvider.verifyPhoneNumber(
        { multiFactorHint: phoneHint, session: mfaResolver.session },
        verifier
      );

      setVerificationId(vId);
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsSendingMfaSms(false);
    }
  };

  // Submit MFA Challenge to Firebase Authentication
  const handleMfaChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !verificationId || !mfaResolver) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    setIsVerifying(true);
    setOtpError(null);

    try {
      const cred = PhoneAuthProvider.credential(verificationId, otpCode.trim());
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCredential = await mfaResolver.resolveSignIn(assertion);

      // Verify custom claim admin
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      const isUserAdmin = Boolean(tokenResult.claims && (tokenResult.claims as any).admin === true);

      if (!isUserAdmin) {
        setOtpError('Authenticated account does not possess administrator custom claims.');
        await auth.signOut();
        return;
      }

      setAdminMfaSession(userCredential.user.uid);
      setIsMfaVerified(true);
      setMode('login');

      try {
        const recordStepUp = httpsCallable(functionsInstance, 'recordAdminStepUp');
        await recordStepUp();
      } catch {}
    } catch (err: any) {
      console.error('Firebase MFA verification failed:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setOtpError('Invalid verification code. Please check your SMS and try again.');
      } else if (err.code === 'auth/code-expired') {
        setOtpError('Verification code has expired. Please click "Resend SMS Code".');
      } else {
        setOtpError(err?.message || 'Verification failed. Please retry.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // MFA Enrollment: Step 1 Send Code
  const handleEnrollSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollPhone.trim()) {
      setEnrollError('Please enter your mobile phone number with country code (e.g., +961 70 987654).');
      return;
    }

    if (!auth.currentUser) {
      setEnrollError('User session expired. Please sign in again.');
      return;
    }

    setIsEnrolling(true);
    setEnrollError(null);

    try {
      const verifier = getOrCreateRecaptchaVerifier('admin-enroll-recaptcha-container');
      const session = await multiFactor(auth.currentUser).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      let formattedPhone = enrollPhone.trim().replace(/\s+/g, '');
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('00961')) {
          formattedPhone = '+' + formattedPhone.slice(2);
        } else if (formattedPhone.startsWith('961')) {
          formattedPhone = '+' + formattedPhone;
        } else if (formattedPhone.startsWith('0')) {
          formattedPhone = '+961' + formattedPhone.slice(1);
        } else {
          formattedPhone = '+961' + formattedPhone;
        }
      }

      const vId = await phoneAuthProvider.verifyPhoneNumber(
        { phoneNumber: formattedPhone, session },
        verifier
      );

      setEnrollVerificationId(vId);
      setEnrollStep('verify_otp');
    } catch (err: any) {
      console.error('MFA enrollment error:', err);
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/admin-restricted-operation'
      ) {
        setEnrollError(
          'SMS Multi-Factor Authentication is not enabled for this Firebase project. Please configure SMS MFA in Firebase Console.'
        );
        setMode('config_help');
      } else {
        setEnrollError(err?.message || 'Failed to dispatch enrollment code via Firebase Authentication.');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // MFA Enrollment: Step 2 Verify Code & Enroll Factor
  const handleEnrollVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollOtpCode.trim() || !enrollVerificationId) {
      setEnrollError('Please enter the 6-digit verification code.');
      return;
    }

    if (!auth.currentUser) {
      setEnrollError('Session expired. Please sign in again.');
      return;
    }

    setIsEnrolling(true);
    setEnrollError(null);

    try {
      const cred = PhoneAuthProvider.credential(enrollVerificationId, enrollOtpCode.trim());
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      await multiFactor(auth.currentUser).enroll(assertion, 'Admin Phone');

      await auth.currentUser.getIdToken(true);
      setAdminMfaSession(auth.currentUser.uid);
      setIsMfaVerified(true);
      setMode('login');

      try {
        const recordStepUp = httpsCallable(functionsInstance, 'recordAdminStepUp');
        await recordStepUp();
      } catch {}
    } catch (err: any) {
      console.error('MFA factor enrollment failed:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setEnrollError('Invalid verification code. Please check your SMS and try again.');
      } else {
        setEnrollError(err?.message || 'Failed to enroll phone factor.');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Render: Loading state
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30 animate-pulse">
            YL
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold tracking-tight">Verifying Admin Identity</h1>
            <p className="text-xs text-slate-400">
              Validating cryptographic credentials & Firebase Authentication MFA state...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <span className="text-xs text-indigo-400 font-mono font-medium">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render: Firebase Console Configuration Guide
  if (mode === 'config_help') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-lg w-full space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600">
            <ShieldAlert className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Firebase MFA Configuration Required</h1>
              <p className="text-xs text-slate-500">Firebase Authentication SMS Multi-Factor Authentication</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-amber-50/50 border border-amber-200/80 p-4 rounded-2xl">
            <p className="font-semibold text-amber-900">
              Production administrator authentication strictly requires Firebase Authentication SMS MFA. Please ensure the following settings are configured in the Firebase Console:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 font-medium">
              <li>Enable <span className="font-semibold text-slate-900">Firebase Authentication</span> with Email/Password and Phone provider.</li>
              <li>Upgrade to <span className="font-semibold text-slate-900">Identity Platform</span> in Firebase Authentication Settings.</li>
              <li>Under <span className="font-semibold text-slate-900">Sign-in method &gt; Advanced</span>, enable <span className="font-semibold text-slate-900">Multi-Factor Authentication (SMS)</span>.</li>
              <li>Under <span className="font-semibold text-slate-900">SMS Settings</span>, ensure Lebanon (+961) and your operator regions are permitted.</li>
              <li>Add this site domain to <span className="font-semibold text-slate-900">Authorized Domains</span> in Authentication Settings.</li>
              <li>Verify administrator email address in Firebase Authentication.</li>
              <li>Enroll administrator mobile number as second factor.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Return to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Render: MFA Enrollment Required
  if (mode === 'mfa_enroll') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div id="admin-enroll-recaptcha-container"></div>
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-md w-full space-y-6 shadow-sm">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                MFA Enrollment Required
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Administrator access strictly enforces Firebase Authentication SMS Multi-Factor Authentication. Please register your mobile phone number.
              </p>
            </div>
          </div>

          {enrollError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-600 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-snug">{enrollError}</p>
            </div>
          )}

          {enrollStep === 'input_phone' ? (
            <form onSubmit={handleEnrollSendCode} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  value={enrollPhone}
                  onChange={(e) => setEnrollPhone(e.target.value)}
                  placeholder="+961 70 123 456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  required
                  disabled={isEnrolling}
                />
                <p className="text-[11px] text-slate-400">
                  Firebase Authentication will deliver a 6-digit SMS verification code to this phone.
                </p>
              </div>

              <button
                type="submit"
                disabled={isEnrolling}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending SMS via Firebase...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  auth.signOut();
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Sign Out and Cancel
              </button>
            </form>
          ) : (
            <form onSubmit={handleEnrollVerifyCode} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  SMS Verification Code
                </label>
                <input
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={enrollOtpCode}
                  onChange={(e) => setEnrollOtpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-center tracking-widest text-lg"
                  required
                  disabled={isEnrolling}
                />
              </div>

              <button
                type="submit"
                disabled={isEnrolling}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling Factor...</span>
                  </>
                ) : (
                  <span>Verify and Enroll MFA</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setEnrollStep('input_phone')}
                className="w-full py-2 px-4 text-xs text-indigo-600 hover:underline"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render: MFA Challenge (Second Factor during Sign-In)
  if (mode === 'mfa_challenge') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div id="admin-recaptcha-container"></div>
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Two-Step Verification
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Firebase Authentication sent an SMS verification code to your enrolled phone{' '}
                <span className="font-mono font-medium text-slate-700">{phoneHintText}</span>.
              </p>
            </div>
          </div>

          <form autoComplete="off" onSubmit={handleMfaChallengeSubmit} className="space-y-6">
            {otpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-600 text-xs shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">{otpError}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                SMS Verification Code
              </label>
              <input
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono tracking-widest text-center text-lg"
                placeholder="000000"
                disabled={isVerifying}
                autoFocus
              />
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-slate-400">Didn't receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    disabled={isSendingMfaSms || isVerifying}
                    onClick={handleResendMfaSms}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSendingMfaSms ? 'Sending SMS...' : 'Resend SMS'}
                  </button>
                ) : (
                  <span className="font-mono text-slate-400 font-medium">
                    Resend in {resendTimer}s
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with Firebase...</span>
                  </>
                ) : (
                  <span>Verify Second Factor</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setOtpCode('');
                  setOtpError(null);
                  clearAdminMfaSession(firebaseUser?.uid);
                  auth.signOut();
                }}
                className="w-full py-3 px-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all cursor-pointer text-xs"
              >
                Cancel Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render: Unauthenticated / First Factor Login Screen
  if (authStatus === 'unauthenticated' || !firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div id="admin-recaptcha-container"></div>
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Admin Login
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your administrator credentials to proceed with MFA verification
              </p>
            </div>
          </div>

          <form autoComplete="off" onSubmit={handlePrimarySignIn}>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="admin@yallalb.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-600 font-medium leading-relaxed">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In with MFA</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render: Authenticated Non-Admin
  if (authStatus === 'authenticated_non_admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Access Unavailable</h1>
            <p className="text-xs text-slate-500 pt-2 leading-relaxed">
              This account does not have administrator privileges.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (auth.currentUser) {
                  await auth.currentUser.getIdToken(true);
                  window.location.reload();
                }
              }}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer"
            >
              Refresh Session
            </button>
            <button
              type="button"
              onClick={() => {
                auth.signOut();
                window.location.reload();
              }}
              className="w-full py-3 px-4 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render: Authenticated admin but MFA session is not active in current tab
  if (authStatus === 'authenticated_admin' && !isMfaVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div id="admin-recaptcha-container"></div>
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-6 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <KeyRound className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">MFA Verification Required</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please verify your administrator session using Firebase Authentication MFA.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (auth.currentUser) {
                  try {
                    const mfaUser = multiFactor(auth.currentUser);
                    const phoneHint = (mfaUser.enrolledFactors || []).find(
                      f => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID
                    );
                    if (phoneHint) {
                      const verifier = getOrCreateRecaptchaVerifier('admin-recaptcha-container');
                      const session = await mfaUser.getSession();
                      const phoneAuthProvider = new PhoneAuthProvider(auth);
                      const vId = await phoneAuthProvider.verifyPhoneNumber(
                        { multiFactorHint: phoneHint, session },
                        verifier
                      );
                      setVerificationId(vId);
                      setPhoneHintText((phoneHint as any)?.phoneNumber || 'enrolled administrator phone');
                      setMode('mfa_challenge');
                    } else {
                      setMode('mfa_enroll');
                    }
                  } catch (err: any) {
                    console.error('MFA challenge dispatch error:', err);
                    setMode('config_help');
                  }
                }
              }}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              Verify Second Factor Now
            </button>

            <button
              type="button"
              onClick={() => {
                clearAdminMfaSession(firebaseUser?.uid);
                auth.signOut();
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render: Authenticated and MFA-verified
  return (
    <>
      {children}
      {showStepUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div id="admin-stepup-recaptcha-container"></div>
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">High-Risk Action</h2>
                  <p className="text-xs text-slate-500">Firebase MFA verification required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStepUpModal(false);
                  if (stepUpResolverRef.current) {
                    stepUpResolverRef.current(false);
                    stepUpResolverRef.current = null;
                  }
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This destructive action requires step-up verification. Enter the 6-digit SMS verification code delivered to your registered mobile phone by Firebase Authentication.
            </p>

            <form autoComplete="off" onSubmit={handleStepUpSubmit} className="space-y-4">
              {stepUpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-600 text-xs shadow-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-snug">{stepUpError}</p>
                </div>
              )}

              <input
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={stepUpCode}
                onChange={(e) => setStepUpCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono tracking-widest text-center text-lg"
                placeholder="000000"
                disabled={isStepUpVerifying}
                autoFocus
              />

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Need another SMS?</span>
                {canStepUpResend ? (
                  <button
                    type="button"
                    disabled={isSendingStepUpOtp || isStepUpVerifying}
                    onClick={handleStepUpResend}
                    className="text-amber-600 hover:text-amber-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSendingStepUpOtp ? 'Sending...' : 'Resend SMS'}
                  </button>
                ) : (
                  <span className="font-mono text-slate-400 font-medium">
                    Resend in {stepUpResendTimer}s
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStepUpModal(false);
                    if (stepUpResolverRef.current) {
                      stepUpResolverRef.current(false);
                      stepUpResolverRef.current = null;
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStepUpVerifying}
                  className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isStepUpVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
