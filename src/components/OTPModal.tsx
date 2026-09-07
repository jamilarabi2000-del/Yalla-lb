import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, X, AlertCircle } from 'lucide-react';
import { functionsInstance, httpsCallable } from '../firebase';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => Promise<void> | void;
  targetContact: string; // Email or Phone
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
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Call server requestOtp function when modal opens
  const triggerServerOtpRequest = async () => {
    if (!targetContact) return;
    setIsRequesting(true);
    setErrorMsg('');
    setOtpDigits(['', '', '', '', '', '']);
    try {
      const requestOtpFn = httpsCallable<{ contact: string; actionType: string }, { success: boolean; cooldownSeconds: number }>(
        functionsInstance,
        'requestOtp',
        { limitedUseAppCheckTokens: true }
      );
      const res = await requestOtpFn({ contact: targetContact, actionType });
      if (res.data?.success) {
        setResendTimer(res.data.cooldownSeconds || 60);
        setCanResend(false);
      }
    } catch (err: any) {
      console.error('[OTPModal] requestOtp failed:', err);
      const msg = err?.message || (isArabic ? 'فشل إرسال رمز التحقق. يرجى إعادة المحاولة.' : 'Failed to send OTP code. Please try again.');
      setErrorMsg(msg);
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerServerOtpRequest();
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 200);
    }
  }, [isOpen, targetContact, actionType]);

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

    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isRequesting) return;
    await triggerServerOtpRequest();
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

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const verifyOtpFn = httpsCallable<{ contact: string; actionType: string; code: string }, { success: boolean }>(
        functionsInstance,
        'verifyOtp',
        { limitedUseAppCheckTokens: true }
      );
      const res = await verifyOtpFn({ contact: targetContact, actionType, code: enteredCode });

      if (res.data?.success) {
        await onVerifySuccess();
        onClose();
      } else {
        throw new Error(isArabic ? 'فشل التحقق من رمز OTP.' : 'OTP verification failed.');
      }
    } catch (err: any) {
      console.error('[OTPModal] verifyOtp error:', err);
      const msg = err?.message || (isArabic ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'Invalid or expired OTP code.');
      setErrorMsg(msg);
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
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
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
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
              {isArabic ? 'تم إرسال رمز التحقق الأمني المكون من 6 أرقام إلى:' : 'A 6-digit security OTP code was dispatched to:'}
            </p>
            <p className="text-sm font-bold text-slate-900 font-mono bg-slate-100 py-1.5 px-3 rounded-xl inline-block border border-slate-200">
              {targetContact || 'your registered contact'}
            </p>
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
              disabled={isVerifying || isRequesting || otpDigits.join('').length < 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-900/10 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isArabic ? 'جاري التحقق...' : 'Verifying Server OTP...'}</span>
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
                  disabled={isRequesting}
                  onClick={handleResendOtp}
                  className="font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
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
