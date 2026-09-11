import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Lock, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { auth, httpsCallable, functionsInstance } from '../firebase';
import { SellerLoginView } from './SellerLoginView';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { authStatus, firebaseUser, signInWithEmail } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [isMfaVerified, setIsMfaVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated_admin' && !isMfaVerified && !otpSent) {
      const sendMfaOtp = async () => {
        try {
          const sendOtp = httpsCallable(functionsInstance, 'sendOtp');
          await sendOtp({ actionType: 'admin' });
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
        <div className="bg-white border border-slate-200 p-10 rounded-3xl max-w-sm w-full space-y-8 shadow-sm text-center">
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

  return <>{children}</>;
};
