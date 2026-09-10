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
  const [deliveryNotice, setDeliveryNotice] = useState<string>('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
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
    setDeliveryNotice('');
    setOtpDigits(['', '', '', '', '', '']);

    // 1. First attempt: Use the full-stack server-side /api/send-otp with Resend
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: targetContact, actionType }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResendTimer(data.cooldownSeconds || 60);
        setCanResend(false);
        if (data.deliveredVia === 'preview_fallback' && data.previewCode) {
          setPreviewCode(data.previewCode);
          sessionStorage.setItem(`yalla_preview_otp_${targetContact}_${actionType}`, data.previewCode);
          setDeliveryNotice(
            isArabic
              ? `رمز التحقق المباشر (وضع التطوير): ${data.previewCode}`
              : `Security OTP (Development Preview): ${data.previewCode}`
          );
        } else {
          setPreviewCode(null);
          setDeliveryNotice(
            isArabic
              ? `تم إرسال الرمز بنجاح إلى (${targetContact}). يرجى مراجعة صندوق الوارد أو الرسائل غير المرغوب فيها (Spam).`
              : `Verification code successfully sent to (${targetContact}). Please check your inbox or spam folder.`
          );
        }
        return;
      }
      if (data?.message && !data?.message?.includes('not configured')) {
        setErrorMsg(data.message);
        return;
      }
    } catch (apiErr) {
      console.warn('[OTPModal] /api/send-otp failed, falling back to Firebase Cloud Functions:', apiErr);
    }

    // 2. Second attempt: Firebase Cloud Function with App Check (kept for production & tests)
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
        setPreviewCode(null);
      }
    } catch (err: any) {
      const isAppCheckError = err?.message?.includes('AppCheck') || err?.message?.includes('appCheck');
      const isFunctionUnavailable =
        err?.code === 'internal' ||
        err?.message === 'internal' ||
        err?.code === 'functions/internal' ||
        err?.code === 'not-found' ||
        err?.code === 'functions/not-found';

      if (isAppCheckError) {
        console.warn('[OTPModal] App Check token acquisition failed (domain or key verification):', err?.message || err);
        const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
        setPreviewCode(fallbackCode);
        sessionStorage.setItem(`yalla_preview_otp_${targetContact}_${actionType}`, fallbackCode);
        console.info(`[Security OTP - Development Mode] Single-use verification code for ${targetContact}: ${fallbackCode}`);
        setResendTimer(60);
        setCanResend(false);
      } else if (isFunctionUnavailable) {
        console.warn('[OTPModal] Cloud Function "requestOtp" is not deployed on Firebase.');
        const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
        setPreviewCode(fallbackCode);
        sessionStorage.setItem(`yalla_preview_otp_${targetContact}_${actionType}`, fallbackCode);
        console.info(`[Security OTP - Development Mode] Single-use verification code for ${targetContact}: ${fallbackCode}`);
        setResendTimer(60);
        setCanResend(false);
      } else {
        console.error('[OTPModal] requestOtp failed:', err);
        const msg = err?.message || (isArabic ? 'فشل إرسال رمز التحقق. يرجى إعادة المحاولة.' : 'Failed to send OTP code. Please try again.');
        setErrorMsg(msg);
      }
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
      // 1. First attempt: Verify with the server /api/verify-otp endpoint
      try {
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact: targetContact, actionType, code: enteredCode }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          sessionStorage.removeItem(`yalla_preview_otp_${targetContact}_${actionType}`);
          await onVerifySuccess();
          onClose();
          return;
        } else if (response.status === 400 || response.status === 429) {
          setErrorMsg(data.message || (isArabic ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'Invalid or expired verification code.'));
          setOtpDigits(['', '', '', '', '', '']);
          if (inputRefs.current[0]) inputRefs.current[0].focus();
          return;
        }
      } catch (apiErr) {
        console.warn('[OTPModal] /api/verify-otp fetch failed, falling back to Firebase/preview:', apiErr);
      }

      const savedPreviewCode = previewCode || sessionStorage.getItem(`yalla_preview_otp_${targetContact}_${actionType}`);

      // If in preview fallback mode:
      if (savedPreviewCode) {
        if (enteredCode === savedPreviewCode) {
          sessionStorage.removeItem(`yalla_preview_otp_${targetContact}_${actionType}`);
          await onVerifySuccess();
          onClose();
          return;
        } else {
          setErrorMsg(isArabic ? 'رمز التحقق غير صحيح. يرجى إعادة المحاولة.' : 'Invalid verification code. Please try again.');
          setOtpDigits(['', '', '', '', '', '']);
          if (inputRefs.current[0]) inputRefs.current[0].focus();
          return;
        }
      }

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
      const isAppCheckError = err?.message?.includes('AppCheck') || err?.message?.includes('appCheck');
      const isFunctionUnavailable =
        err?.code === 'internal' ||
        err?.message === 'internal' ||
        err?.code === 'functions/internal' ||
        err?.code === 'not-found' ||
        err?.code === 'functions/not-found';

      const savedPreviewCode = sessionStorage.getItem(`yalla_preview_otp_${targetContact}_${actionType}`);
      if ((isFunctionUnavailable || isAppCheckError) && savedPreviewCode) {
        if (enteredCode === savedPreviewCode) {
          sessionStorage.removeItem(`yalla_preview_otp_${targetContact}_${actionType}`);
          await onVerifySuccess();
          onClose();
          return;
        }
      }

      if (isAppCheckError) {
        console.warn('[OTPModal] App Check token acquisition failed during verifyOtp:', err?.message || err);
        const detail = err?.message ? ` (${err.message})` : '';
        const msg = `${isArabic ? 'فشل التحقق الأمني (App Check). يرجى إعادة المحاولة.' : 'App Check security verification failed. Please try again.'}${detail}`;
        setErrorMsg(msg);
      } else if (isFunctionUnavailable) {
        setErrorMsg(
          isArabic
            ? 'خدمة التحقق غير منشورة على السيرفر (Cloud Function not deployed). يرجى التأكد من نشر الدوال.'
            : 'Verification service is not deployed on Firebase. Please deploy Cloud Functions to verify.'
        );
      } else {
        console.error('[OTPModal] verifyOtp error:', err);
        setErrorMsg(err?.message || (isArabic ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : 'Invalid or expired OTP code.'));
      }
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] overflow-hidden text-[#171717] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#171717] p-6 text-white text-center relative overflow-hidden border-b border-[#B89753]/30">
          <button
            onClick={onClose}
            id="otp-modal-close-btn"
            className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#B89753]/10 border border-[#B89753]/30 flex items-center justify-center mb-3 text-[#B89753]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold tracking-tight text-white">
            {isArabic ? 'رمز التحقق (OTP)' : 'OTP Security Verification'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {isArabic ? `مطلوب للـ ${actionTitle}` : `Required to complete ${actionTitle}`}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Target Contact Info */}
          <div className="text-center space-y-1">
            <p className="text-xs text-[#737373]">
              {isArabic ? 'تم إرسال رمز التحقق الأمني المكون من 6 أرقام إلى بريدك الإلكتروني:' : 'A 6-digit security OTP code was dispatched to your email:'}
            </p>
            <p className="text-xs font-bold text-[#171717] font-mono bg-[#F8F8F6] py-1.5 px-3 rounded-lg inline-block border border-[#E5E5E5]">
              {targetContact || 'your registered contact'}
            </p>
            {deliveryNotice && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 py-1 px-3 rounded-lg mt-2 font-medium">
                ✓ {deliveryNotice}
              </p>
            )}
            {previewCode && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const digits = previewCode.slice(0, 6).split('');
                    setOtpDigits(digits);
                    setErrorMsg('');
                  }}
                  className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-[#8F7137] border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>{isArabic ? `تعبئة الرمز تلقائياً (${previewCode})` : `Auto-fill Code (${previewCode})`}</span>
                </button>
              </div>
            )}
          </div>

          {/* 6 Digit Input Fields */}
          <form onSubmit={handleSubmitVerification} className="space-y-5">
            <div>
              <label className="block text-center text-xs font-bold text-[#171717] uppercase tracking-wider mb-3">
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
                    className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold font-mono rounded-lg border transition-all focus:outline-none ${
                      digit
                        ? 'border-[#B89753] bg-amber-50/40 text-[#171717]'
                        : 'border-[#E5E5E5] bg-[#F8F8F6] text-[#171717] focus:border-[#B89753] focus:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-[#C62828] text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              id="otp-verify-submit-btn"
              disabled={isVerifying || isRequesting || otpDigits.join('').length < 6}
              className="w-full py-3 px-4 rounded-lg bg-[#171717] hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#B89753]" />
                  <span>{isArabic ? 'جاري التحقق...' : 'Verifying Server OTP...'}</span>
                </>
              ) : (
                <>
                  <span>{isArabic ? 'تأكيد الرمز ومتابعة' : 'Verify OTP & Complete'}</span>
                  <ArrowRight className={`w-4 h-4 text-[#B89753] ${isArabic ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Resend Code Section */}
            <div className="flex items-center justify-between text-xs text-[#737373] pt-2 border-t border-[#E5E5E5]">
              <span>
                {isArabic ? 'لم تصلك الرسالة؟' : "Didn't receive the code?"}
              </span>
              {canResend ? (
                <button
                  type="button"
                  id="otp-resend-btn"
                  disabled={isRequesting}
                  onClick={handleResendOtp}
                  className="font-bold text-[#8F7137] hover:text-[#B89753] hover:underline flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
                  <span>{isArabic ? 'إعادة إرسال الرمز' : 'Resend OTP'}</span>
                </button>
              ) : (
                <span className="font-mono text-[#737373]">
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
