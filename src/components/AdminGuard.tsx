import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Lock, AlertCircle, Loader2, KeyRound, ShieldAlert, X } from 'lucide-react';
import { auth, httpsCallable, functionsInstance } from '../firebase';
import { SellerLoginView } from './SellerLoginView';
import {
  isMfaSessionValid,
  setAdminMfaSession,
  clearAdminMfaSession,
  registerMfaPromptHandler
} from '../utils/adminMfa';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { authStatus, firebaseUser, signInWithEmail } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [diagnosticData, setDiagnosticData] = useState<{
    projectId: string;
    appId: string;
    uid: string;
    email: string | null;
    isAdminClaim: boolean;
    issuedAtTime: string;
    expirationTime: string;
    hostname: string;
    pathname: string;
    buildId: string;
  } | null>(null);

  const [isMfaVerified, setIsMfaVerified] = useState<boolean>(() => isMfaSessionValid(firebaseUser?.uid));
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // High-risk step-up modal state
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const [isStepUpVerifying, setIsStepUpVerifying] = useState(false);
  const stepUpResolverRef = useRef<((success: boolean) => void) | null>(null);

  useEffect(() => {
    if (firebaseUser) {
      firebaseUser.getIdTokenResult(true).then((token) => {
        console.log("=== DEPLOYMENT DIAGNOSTIC ===");
        console.log("Build Commit/Version: 81837ac642762623dc40df46289a7462a465504d (Latest AI Studio deploy)");
        console.log("Firebase Project:", auth.app.options.projectId);
        console.log("User UID:", firebaseUser.uid);
        console.log("User Email:", firebaseUser.email);
        console.log("Token claims.admin:", token.claims.admin);
        console.log("Token issuedAtTime:", token.issuedAtTime);
        console.log("Token expirationTime:", token.expirationTime);
        console.log("=============================");

        if (import.meta.env.DEV && authStatus === 'authenticated_non_admin') {
          const redactedEmail = firebaseUser.email
            ? `${firebaseUser.email.charAt(0)}***@${firebaseUser.email.split('@')[1] || ''}`
            : null;
          setDiagnosticData({
            projectId: auth.app.options.projectId || 'yalla-lb-2026',
            appId: auth.app.options.appId || '',
            uid: firebaseUser.uid,
            email: redactedEmail,
            isAdminClaim: token.claims.admin === true,
            issuedAtTime: token.issuedAtTime,
            expirationTime: token.expirationTime,
            hostname: window.location.hostname,
            pathname: window.location.pathname,
            buildId: '81837ac642762623dc40df46289a7462a465504d'
          });
        } else {
          setDiagnosticData(null);
        }
      }).catch(err => {
        console.error("Diagnostic error fetching token:", err);
      });
    } else {
      setDiagnosticData(null);
    }
  }, [firebaseUser, authStatus]);

  // Check persisted MFA session whenever user changes
  useEffect(() => {
    if (firebaseUser?.uid) {
      setIsMfaVerified(isMfaSessionValid(firebaseUser.uid));
    } else {
      setIsMfaVerified(false);
    }
  }, [firebaseUser?.uid]);

  // Register high-risk step-up prompt listener
  useEffect(() => {
    const unregister = registerMfaPromptHandler((resolve) => {
      stepUpResolverRef.current = resolve;
      setShowStepUpModal(true);
      setStepUpCode('');
      setStepUpError(null);
      // Auto-send OTP for step-up
      const requestOtp = httpsCallable(functionsInstance, 'requestOtp');
      requestOtp({ actionType: 'admin' }).catch(err => {
        console.error('Failed to send step-up OTP:', err);
      });
    });
    return () => unregister();
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated_admin' && !isMfaVerified && !otpSent) {
      const sendMfaOtp = async () => {
        try {
          const requestOtp = httpsCallable(functionsInstance, 'requestOtp');
          await requestOtp({ actionType: 'admin' });
          setOtpSent(true);
        } catch (error: any) {
          console.error('Failed to send admin MFA OTP:', error);
          setOtpError(error.message || 'Failed to send verification code.');
        }
      };
      sendMfaOtp();
    }
  }, [authStatus, isMfaVerified, otpSent]);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30 animate-pulse">
            PA
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold tracking-tight">Verifying Admin Session</h1>
            <p className="text-xs text-slate-400">
              Checking authentication claims & verifying secure connection...
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
                Enter your credentials to access the portal
              </p>
            </div>
          </div>

          <form autoComplete="off" onSubmit={async (e) => {
            e.preventDefault();
            if (!email || !password) {
              setLoginError('Please enter both email and password.');
              return;
            }
            try {
              setIsSubmitting(true);
              setLoginError(null);
              await signInWithEmail(email, password);
            } catch (err: any) {
              console.error('Admin login error', err);
              if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setLoginError('Invalid email or password.');
              } else if (err.code === 'auth/too-many-requests') {
                setLoginError('Too many failed attempts. Please try again later.');
              } else {
                setLoginError(err.message || 'An error occurred during sign in.');
              }
            } finally {
              setIsSubmitting(false);
            }
          }}>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (authStatus === 'authenticated_non_admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-10 rounded-3xl max-w-2xl w-full space-y-8 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-[22px] bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Access Denied
            </h1>
            <p className="text-xs text-slate-500 pt-2 leading-relaxed">
              Your account is authenticated but does not have administrator privileges. Please refresh your session or contact the system administrator.
            </p>
          </div>
          {diagnosticData && (
            <div className="text-left bg-slate-900 text-green-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto w-full">
              <h3 className="text-white font-bold mb-2 text-xs">RUNTIME DIAGNOSTIC</h3>
              <p>Project ID: {diagnosticData.projectId}</p>
              <p>App ID: {diagnosticData.appId}</p>
              <p>UID: {diagnosticData.uid}</p>
              <p>Email: {diagnosticData.email}</p>
              <p>Admin Claim: {String(diagnosticData.isAdminClaim)}</p>
              <p>Issued At: {diagnosticData.issuedAtTime}</p>
              <p>Expires At: {diagnosticData.expirationTime}</p>
              <p>Hostname: {diagnosticData.hostname}</p>
              <p>Pathname: {diagnosticData.pathname}</p>
              <p>Build ID: {diagnosticData.buildId}</p>
            </div>
          )}
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

  if (authStatus === 'authenticated_admin' && !isMfaVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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
                A verification code was sent to your email to verify this admin session.
              </p>
            </div>
          </div>

          <form autoComplete="off" onSubmit={async (e) => {
            e.preventDefault();
            if (!otpCode) {
              setOtpError('Please enter the verification code.');
              return;
            }
            setIsVerifying(true);
            setOtpError(null);
            try {
              const verifyOtp = httpsCallable(functionsInstance, 'verifyOtp');
              const res = await verifyOtp({ actionType: 'admin', code: otpCode });
              if ((res.data as any)?.success) {
                if (firebaseUser?.uid) {
                  setAdminMfaSession(firebaseUser.uid);
                }
                setIsMfaVerified(true);
              } else {
                setOtpError('Invalid or expired verification code.');
              }
            } catch (err: any) {
              setOtpError(err.message || 'Verification failed.');
            } finally {
              setIsVerifying(false);
            }
          }} className="space-y-6">
            
            {otpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-600 text-xs shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">{otpError}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Verification Code
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
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify and Login</span>
                )}
              </button>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  clearAdminMfaSession(firebaseUser?.uid);
                  auth.signOut();
                  window.location.reload();
                }}
                className="w-full py-3 px-4 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
                  <p className="text-xs text-slate-500">Security step-up required</p>
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
              This destructive operation requires confirmation. Enter the 6-digit verification code sent to your admin email.
            </p>

            <form
              autoComplete="off"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!stepUpCode) {
                  setStepUpError('Please enter the verification code.');
                  return;
                }
                setIsStepUpVerifying(true);
                setStepUpError(null);
                try {
                  const verifyOtp = httpsCallable(functionsInstance, 'verifyOtp');
                  const res = await verifyOtp({ actionType: 'admin', code: stepUpCode });
                  if ((res.data as any)?.success) {
                    if (firebaseUser?.uid) {
                      setAdminMfaSession(firebaseUser.uid);
                    }
                    setShowStepUpModal(false);
                    if (stepUpResolverRef.current) {
                      stepUpResolverRef.current(true);
                      stepUpResolverRef.current = null;
                    }
                  } else {
                    setStepUpError('Invalid or expired code.');
                  }
                } catch (err: any) {
                  setStepUpError(err.message || 'Verification failed.');
                } finally {
                  setIsStepUpVerifying(false);
                }
              }}
              className="space-y-4"
            >
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

              <div className="flex gap-2">
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
