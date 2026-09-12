import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Lock, AlertCircle, Loader2, KeyRound, ShieldAlert, X, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  auth,
  functionsInstance,
  httpsCallable,
} from '../firebase';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import {
  isMfaSessionValid,
  setAdminMfaSession,
  clearAdminMfaSession,
  registerMfaPromptHandler
} from '../utils/adminMfa';

interface AdminGuardProps {
  children: React.ReactNode;
}

type AuthMode = 'login' | 'email_otp' | 'verify_email_notice';

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { authStatus, firebaseUser } = useShop();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Email OTP Challenge State
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Unverified Email Notice State
  const [emailVerifSent, setEmailVerifSent] = useState(false);
  const [isSendingVerifEmail, setIsSendingVerifEmail] = useState(false);

  // High-Risk Step-Up Modal State
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const [stepUpMaskedEmail, setStepUpMaskedEmail] = useState<string>('');
  const [isStepUpVerifying, setIsStepUpVerifying] = useState(false);
  const [isSendingStepUpOtp, setIsSendingStepUpOtp] = useState(false);
  const [stepUpResendTimer, setStepUpResendTimer] = useState<number>(60);
  const [canStepUpResend, setCanStepUpResend] = useState<boolean>(false);
  const stepUpResolverRef = useRef<((success: boolean) => void) | null>(null);

  const [isMfaVerified, setIsMfaVerified] = useState<boolean>(() => isMfaSessionValid(firebaseUser?.uid));

  // Sync session state when firebaseUser changes
  useEffect(() => {
    if (firebaseUser?.uid) {
      setIsMfaVerified(isMfaSessionValid(firebaseUser.uid));
    } else {
      setIsMfaVerified(false);
    }
  }, [firebaseUser?.uid]);

  // Resend countdown timer for primary OTP
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

  // Resend countdown timer for Step-Up Modal OTP
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
        setIsSendingStepUpOtp(true);
        try {
          const reqOtpFn = httpsCallable<void, { success: boolean; emailMasked: string; cooldownSeconds: number }>(
            functionsInstance,
            'requestAdminEmailOtp'
          );
          const res = await reqOtpFn();
          if (res.data?.emailMasked) {
            setStepUpMaskedEmail(res.data.emailMasked);
          }
        } catch (err: any) {
          console.warn('Step-up OTP dispatch notice:', err?.message || err);
          setStepUpError(err?.message || 'Unable to dispatch step-up verification code to email.');
        } finally {
          setIsSendingStepUpOtp(false);
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
      const reqOtpFn = httpsCallable<void, { success: boolean; emailMasked: string; cooldownSeconds: number }>(
        functionsInstance,
        'requestAdminEmailOtp'
      );
      const res = await reqOtpFn();
      if (res.data?.emailMasked) {
        setStepUpMaskedEmail(res.data.emailMasked);
      }
      setStepUpResendTimer(60);
      setCanStepUpResend(false);
    } catch (err: any) {
      setStepUpError(err?.message || 'Failed to resend step-up code.');
    } finally {
      setIsSendingStepUpOtp(false);
    }
  };

  const handleStepUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepUpCode.trim()) {
      setStepUpError('Please enter the 6-digit verification code.');
      return;
    }
    setIsStepUpVerifying(true);
    setStepUpError(null);
    try {
      const verifyFn = httpsCallable<{ code: string }, { success: boolean }>(
        functionsInstance,
        'verifyAdminEmailOtp'
      );
      await verifyFn({ code: stepUpCode.trim() });

      if (auth.currentUser) {
        setAdminMfaSession(auth.currentUser.uid);
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

  // Primary Sign In with Email/Password + Trigger Server-Authoritative Email OTP
  const handlePrimarySignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // Step 1: Check admin custom claims
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const isUserAdmin = Boolean(idTokenResult.claims && (idTokenResult.claims as any).admin === true);

      if (!isUserAdmin) {
        setLoginError('This account does not have administrator privileges.');
        await auth.signOut();
        setIsSubmitting(false);
        return;
      }

      // Step 2: Ensure administrator email is verified
      if (!userCredential.user.emailVerified) {
        setMode('verify_email_notice');
        setIsSubmitting(false);
        return;
      }

      // Step 3: Trigger Server-Authoritative Email OTP challenge
      const reqOtpFn = httpsCallable<void, { success: boolean; emailMasked: string; cooldownSeconds: number }>(
        functionsInstance,
        'requestAdminEmailOtp'
      );
      const res = await reqOtpFn();
      
      setMaskedEmail(res.data?.emailMasked || userCredential.user.email || '');
      setResendTimer(res.data?.cooldownSeconds || 60);
      setCanResend(false);
      setOtpCode('');
      setOtpError(null);
      setMode('email_otp');
    } catch (err: any) {
      console.error('[Admin Sign-In Error]:', err);
      if (
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

  // Resend Email OTP via Server-Authoritative Cloud Function
  const handleResendEmailOtp = async () => {
    if (!canResend || isSendingOtp || !auth.currentUser) return;
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      const reqOtpFn = httpsCallable<void, { success: boolean; emailMasked: string; cooldownSeconds: number }>(
        functionsInstance,
        'requestAdminEmailOtp'
      );
      const res = await reqOtpFn();
      if (res.data?.emailMasked) {
        setMaskedEmail(res.data.emailMasked);
      }
      setResendTimer(res.data?.cooldownSeconds || 60);
      setCanResend(false);
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Submit Email OTP to Server-Authoritative Cloud Function
  const handleEmailOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError('The verification code must be exactly 6 digits.');
      return;
    }
    setIsVerifying(true);
    setOtpError(null);

    try {
      const verifyFn = httpsCallable<{ code: string }, { success: boolean }>(
        functionsInstance,
        'verifyAdminEmailOtp'
      );
      await verifyFn({ code: otpCode.trim() });

      if (auth.currentUser) {
        setAdminMfaSession(auth.currentUser.uid);
        setIsMfaVerified(true);
        setMode('login');
      }
    } catch (err: any) {
      console.error('[Admin Email OTP Verification Error]:', err);
      setOtpError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    setIsSendingVerifEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailVerifSent(true);
    } catch (err: any) {
      console.error('Failed to send verification email:', err);
    } finally {
      setIsSendingVerifEmail(false);
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
              Validating cryptographic credentials & administrator session state...
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

  // Render: Unverified Email Notice
  if (mode === 'verify_email_notice') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-md w-full space-y-6 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Email Verification Required</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              To protect administrative access, your administrator email address must be verified before second-factor OTP challenges can be dispatched.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
            <p className="font-mono text-slate-800 font-semibold">{auth.currentUser?.email}</p>
            {emailVerifSent ? (
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-medium pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verification email sent! Please check your inbox and click the link.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendVerificationEmail}
                disabled={isSendingVerifEmail}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSendingVerifEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Send Verification Email Link</span>
              </button>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (auth.currentUser) {
                  await auth.currentUser.reload();
                  if (auth.currentUser.emailVerified) {
                    // Try triggering OTP
                    try {
                      const reqOtpFn = httpsCallable<void, { success: boolean; emailMasked: string; cooldownSeconds: number }>(
                        functionsInstance,
                        'requestAdminEmailOtp'
                      );
                      const res = await reqOtpFn();
                      setMaskedEmail(res.data?.emailMasked || auth.currentUser.email || '');
                      setMode('email_otp');
                    } catch (err: any) {
                      setLoginError(err?.message || 'Failed to dispatch email OTP.');
                      setMode('login');
                    }
                  } else {
                    setLoginError('Email is still unverified. Please verify your email before proceeding.');
                  }
                }
              }}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>I Have Verified My Email (Check Again)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                auth.signOut();
                setMode('login');
              }}
              className="w-full py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render: Email OTP Challenge Screen (Second Factor)
  if (mode === 'email_otp') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Two-Step Verification
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                A single-use 6-digit verification code was sent to your verified administrator email:
              </p>
              {maskedEmail && (
                <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-mono font-semibold text-indigo-700">
                  {maskedEmail}
                </div>
              )}
            </div>
          </div>

          <form autoComplete="off" onSubmit={handleEmailOtpSubmit} className="space-y-6">
            {otpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-600 text-xs shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">{otpError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                6-Digit Security Code
              </label>
              <input
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono tracking-widest text-center text-2xl font-bold"
                placeholder="000000"
                disabled={isVerifying}
                autoFocus
              />
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-slate-400">Didn't receive email?</span>
                {canResend ? (
                  <button
                    type="button"
                    disabled={isSendingOtp || isVerifying}
                    onClick={handleResendEmailOtp}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSendingOtp ? 'Sending...' : 'Resend Code'}
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
                disabled={isVerifying || otpCode.length !== 6}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify and Proceed</span>
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
                Enter your administrator credentials to proceed with Email OTP verification
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
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-sm w-full space-y-6 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <KeyRound className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">MFA Verification Required</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please verify your administrator session via 6-digit email OTP.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (auth.currentUser) {
                  setIsSendingOtp(true);
                  try {
                    const reqOtpFn = httpsCallable<void, { success: boolean; emailMasked: string; cooldownSeconds: number }>(
                      functionsInstance,
                      'requestAdminEmailOtp'
                    );
                    const res = await reqOtpFn();
                    setMaskedEmail(res.data?.emailMasked || auth.currentUser.email || '');
                    setResendTimer(res.data?.cooldownSeconds || 60);
                    setCanResend(false);
                    setMode('email_otp');
                  } catch (err: any) {
                    console.error('Email OTP dispatch error:', err);
                    setLoginError(err?.message || 'Failed to dispatch email OTP.');
                    setMode('login');
                  } finally {
                    setIsSendingOtp(false);
                  }
                }
              }}
              disabled={isSendingOtp}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Send Verification Code to Email</span>
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
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">High-Risk Action</h2>
                  <p className="text-xs text-slate-500">Email OTP verification required</p>
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
              This destructive action requires step-up verification. Enter the 6-digit security code sent to your verified administrator email {stepUpMaskedEmail ? <span className="font-mono font-semibold text-slate-800">({stepUpMaskedEmail})</span> : ''}.
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
                onChange={(e) => setStepUpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono tracking-widest text-center text-xl font-bold"
                placeholder="000000"
                disabled={isStepUpVerifying}
                autoFocus
              />

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Need another code?</span>
                {canStepUpResend ? (
                  <button
                    type="button"
                    disabled={isSendingStepUpOtp || isStepUpVerifying}
                    onClick={handleStepUpResend}
                    className="text-amber-600 hover:text-amber-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSendingStepUpOtp ? 'Sending...' : 'Resend Code'}
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
                  disabled={isStepUpVerifying || stepUpCode.length !== 6}
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
