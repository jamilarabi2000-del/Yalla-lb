import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, Mail, RefreshCw, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

export const OTPVerificationModal: React.FC = () => {
  const {
    pendingVerificationEmail,
    isOtpModalOpen,
    setIsOtpModalOpen,
    latestOtpCode,
    sendSignupOTP,
    verifySignupOTP,
    language
  } = useShop();

  const isArabic = language === 'ar';
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for Resend button
  useEffect(() => {
    if (!isOtpModalOpen) return;
    setOtpDigits(['', '', '', '', '', '']);
    setResendCooldown(30);

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOtpModalOpen]);

  if (!isOtpModalOpen || !pendingVerificationEmail) {
    return null;
  }

  const handleDigitChange = (index: number, value: string) => {
    // Only keep numeric character
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized && value !== '') return;

    const newDigits = [...otpDigits];

    if (sanitized.length > 1) {
      // User pasted multiple characters
      const pasted = sanitized.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const lastFilled = Math.min(pasted.length - 1, 5);
      inputRefs.current[lastFilled]?.focus();
      return;
    }

    newDigits[index] = sanitized;
    setOtpDigits(newDigits);

    // Auto move to next input if filled
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      return;
    }
    setIsVerifying(true);
    try {
      await verifySignupOTP(pendingVerificationEmail, fullOtp);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await sendSignupOTP(pendingVerificationEmail);
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setIsResending(false);
    }
  };

  const handleAutoFillDemoOtp = () => {
    if (latestOtpCode && latestOtpCode.length === 6) {
      const digits = latestOtpCode.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOtpModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-900 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-8 h-8 stroke-[2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
            {isArabic ? 'تأكيد البريد الإلكتروني (OTP)' : 'Confirm Your Email'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed px-2">
            {isArabic
              ? 'لقد أرسلنا رمز تحقق مكون من 6 أرقام لتأكيد ملكية حسابك:'
              : 'We sent a 6-digit One-Time Passcode (OTP) to confirm that you own this email address:'}
          </p>

          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800">
            <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate max-w-[220px]">{pendingVerificationEmail}</span>
          </div>
        </div>

        {/* Demo Helper Badge if available */}
        {latestOtpCode && (
          <div className="mb-6 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isArabic ? 'رمز التحقق المرسل:' : 'Verification OTP Code:'} <strong className="font-mono text-sm tracking-widest text-slate-900">{latestOtpCode}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillDemoOtp}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer shrink-0"
            >
              {isArabic ? 'تعبئة تلقائية' : 'Auto-fill'}
            </button>
          </div>
        )}

        {/* 6 Digit Input Grid */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              {isArabic ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter 6-Digit Passcode'}
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 dir-ltr" dir="ltr">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border transition-all focus:outline-none ${
                    digit
                      ? 'bg-amber-50/60 border-amber-500 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span>{isArabic ? 'جاري التحقق...' : 'Verifying OTP...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isArabic ? 'تأكيد الحساب وإكمال' : 'Verify & Confirm Account'}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-500">
                {isArabic ? 'لم تصلك الرسالة؟' : "Didn't receive code?"}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="font-bold text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50 disabled:hover:text-amber-600 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? (
                  <span>
                    {isArabic ? `إعادة الإرسال بعد (${resendCooldown}ث)` : `Resend in (${resendCooldown}s)`}
                  </span>
                ) : (
                  <span>{isArabic ? 'إعادة إرسال الرمز' : 'Resend OTP'}</span>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
