import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, KeyRound, ArrowRight, RefreshCw, X, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => Promise<void> | void;
  targetContact: string; // e.g. Email or Phone
  actionType: 'login' | 'signup' | 'admin' | 'seller';
  language?: 'en' | 'ar';
}

export const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
  targetContact,
  actionType,
  language = 'en'
}) => {
  const isArabic = language === 'ar';
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Generate OTP whenever modal opens or resend triggered
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg('');
    setResendTimer(30);
    setCanResend(false);
    return code;
  };

  useEffect(() => {
    if (isOpen) {
      generateNewOtp();
      // Auto focus first input after a short delay for smooth modal animation
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 200);
    }
  }, [isOpen]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isOpen && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, resendTimer]);

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg('');
    const sanitized = value.replace(/\D/g, '');

    // If user pastes multi-digit code
    if (sanitized.length > 1) {
      const pastedArray = sanitized.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pastedArray.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedArray.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = sanitized.slice(-1);
    setOtpDigits(newDigits);

    // Auto advance focus
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFill = () => {
    if (generatedOtp) {
      setOtpDigits(generatedOtp.split(''));
      setErrorMsg('');
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
      if (inputRefs.current[5]) {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    const newCode = generateNewOtp();
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  const handleSubmitVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMsg(isArabic ? 'يرجى إدخال رمز التحقق المتكون من 6 أرقام كاملة' : 'Please enter the complete 6-digit verification code.');
      return;
    }

    if (enteredCode !== generatedOtp) {
      setErrorMsg(isArabic ? 'رمز التحقق غير صحيح. يرجى التأكد من الرمز وإعادة المحاولة.' : 'Invalid OTP code. Please enter the correct verification code shown above.');
      return;
    }

    setIsVerifying(true);
    try {
      await onVerifySuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (isArabic ? 'حدث خطأ أثناء التحقق' : 'Verification failed. Please try again.'));
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  const actionTitle = {
    login: isArabic ? 'تسجيل الدخول' : 'Sign In',
    signup: isArabic ? 'إنشاء حساب جديد' : 'Account Registration',
    admin: isArabic ? 'دخول لوحة التحكم' : 'Admin Portal Login',
    seller: isArabic ? 'دخول بوابة البائعين' : 'Seller Merchant Login'
  }[actionType];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
      >
          {/* Top Decorative Header Accent */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-6 text-white text-center relative overflow-hidden">
            <button
              onClick={onClose}
              id="otp-modal-close-btn"
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              {isArabic ? 'رمز التحقق (OTP)' : 'OTP Security Verification'}
            </h3>
            <p className="text-xs text-amber-100 mt-1">
              {isArabic ? `مطلوب للـ ${actionTitle}` : `Required to complete ${actionTitle}`}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Target Contact Info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-500">
                {isArabic ? 'تم إرسال رمز التحقق مكون من 6 أرقام إلى:' : 'A 6-digit security OTP code was sent to:'}
              </p>
              <p className="text-sm font-bold text-slate-900 font-mono bg-slate-100 py-1.5 px-3 rounded-xl inline-block border border-slate-200">
                {targetContact || 'your registered contact'}
              </p>
            </div>

            {/* DEMO / LIVE OTP BANNER */}
            <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900 border-b border-amber-200/60 pb-2">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>{isArabic ? 'رمز التحقق الخاص بك:' : 'Your Security OTP Code:'}</span>
                </span>
                <span className="bg-amber-200/80 text-amber-900 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                  {isArabic ? 'رمز فوري' : 'Live OTP'}
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-3 pt-1">
                <span className="text-2xl font-black font-mono tracking-widest text-amber-950 bg-white px-4 py-1.5 rounded-xl border border-amber-300 shadow-sm">
                  {generatedOtp}
                </span>
                <button
                  type="button"
                  id="otp-autofill-btn"
                  onClick={handleAutoFill}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تعبئة تلقائية' : 'Auto-fill'}</span>
                </button>
              </div>

              {copiedNotification && (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تم إدخال الرمز بنجاح!' : 'Code applied automatically!'}</span>
                </p>
              )}
            </div>

            {/* 6 Digit Input Fields */}
            <form onSubmit={handleSubmitVerification} className="space-y-5">
              <div>
                <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  {isArabic ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter 6-Digit Code'}
                </label>
                <div className="flex items-center justify-center gap-2 dir-ltr">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      id={`otp-digit-input-${idx}`}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-2xl border-2 transition-all focus:outline-none ${
                        digit
                          ? 'border-amber-500 bg-amber-50/30 text-amber-950 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-amber-500 focus:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                id="otp-verify-submit-btn"
                disabled={isVerifying || otpDigits.join('').length < 6}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-900/10 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isArabic ? 'جاري التحقق...' : 'Verifying OTP Code...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isArabic ? 'تأكيد الرمز ومتابعة' : 'Verify OTP & Complete'}</span>
                    <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  {isArabic ? 'لم تصلك الرسالة؟' : "Didn't receive the code?"}
                </span>
                {canResend ? (
                  <button
                    type="button"
                    id="otp-resend-btn"
                    onClick={handleResendOtp}
                    className="font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'إعادة إرسال الرمز' : 'Resend OTP'}</span>
                  </button>
                ) : (
                  <span className="font-mono text-slate-400">
                    {isArabic ? `إعادة الإرسال بعد (${resendTimer} ثانية)` : `Resend in (${resendTimer}s)`}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };
