import React from 'react';
import { CreditCard, CheckCircle2, Truck, ShieldCheck, ArrowRight, Package } from 'lucide-react';

interface CMSCheckoutTabProps {
  checkoutData: {
    title: string;
    titleArabic?: string;
    subtitle: string;
    subtitleArabic?: string;
    shippingHeading: string;
    shippingHeadingArabic?: string;
    paymentHeading: string;
    paymentHeadingArabic?: string;
    summaryHeading: string;
    summaryHeadingArabic?: string;
    orderButtonText: string;
    orderButtonTextArabic?: string;
    guaranteeBadgeText: string;
    guaranteeBadgeTextArabic?: string;
  };
  checkoutSuccessData?: {
    successBadge: string;
    successBadgeArabic?: string;
    successTitle: string;
    successTitleArabic?: string;
    nextStepsHeading: string;
    nextStepsHeadingArabic?: string;
    step1Text: string;
    step1TextArabic?: string;
    step2Text: string;
    step2TextArabic?: string;
    step3Text: string;
    step3TextArabic?: string;
    buttonTrackText: string;
    buttonTrackTextArabic?: string;
    buttonContinueText: string;
    buttonContinueTextArabic?: string;
  };
  onChangeCheckoutField: (field: string, value: string) => void;
  onChangeSuccessField: (field: string, value: string) => void;
}

export const CMSCheckoutTab: React.FC<CMSCheckoutTabProps> = ({
  checkoutData = {
    title: 'Lebanon Express Checkout',
    titleArabic: 'إتمام الطلب السريع في لبنان',
    subtitle: 'Select delivery speed and payment method for fast dispatch across Lebanon or internationally.',
    subtitleArabic: 'اختر طريقة التوصيل والدفع المناسبة لإتمام شحن طلبك بسرعة وأمان.',
    shippingHeading: '1. Shipping & Delivery Address',
    shippingHeadingArabic: '1. عنوان الشحن والتوصيل',
    paymentHeading: '2. Payment Method (LBP / USD)',
    paymentHeadingArabic: '2. طريقة الدفع (ل.ل / دولار)',
    summaryHeading: 'Order Summary',
    summaryHeadingArabic: 'ملخص الطلب',
    orderButtonText: 'Confirm & Place Order',
    orderButtonTextArabic: 'تأكيد وإرسال الطلب',
    guaranteeBadgeText: '100% Authentic Lebanese Guarantee • Fast Courier Tracking',
    guaranteeBadgeTextArabic: 'ضمان الجودة والأصالة 100% • تتبع مباشر للشحنة'
  },
  checkoutSuccessData = {
    successBadge: 'Order Placed Successfully',
    successBadgeArabic: 'تم تأكيد الطلب بنجاح',
    successTitle: 'Shukran! Your Lebanese Order is',
    successTitleArabic: 'شكراً! تم استلام طلبك اللبناني',
    nextStepsHeading: 'Next Steps & Dispatch Logistics:',
    nextStepsHeadingArabic: 'الخطوات التالية واللوجستيات:',
    step1Text: 'Our Beirut central depot has routed your basket to the regional artisan guilds.',
    step1TextArabic: 'تم توجيه طلبك من المستودع الرئيسي في بيروت إلى الحرفيين المعنيين.',
    step2Text: 'You will receive a WhatsApp message from your dedicated courier to confirm exact GPS drop-off.',
    step2TextArabic: 'ستصلك رسالة عبر تطبيق واتساب من السائق المخصص لتأكيد موقع التسليم بدقة.',
    step3Text: 'Settlement is strictly cash upon handover or digital transfer.',
    step3TextArabic: 'الدفع نقداً عند الاستلام بقيمة الطلب أو بالليرة اللبنانية.',
    buttonTrackText: 'Track in My Account',
    buttonTrackTextArabic: 'متابعة الطلب في حسابي',
    buttonContinueText: 'Continue Shopping',
    buttonContinueTextArabic: 'متابعة التسوق'
  },
  onChangeCheckoutField,
  onChangeSuccessField,
}) => {
  return (
    <div className="space-y-6">
      {/* Checkout Screen Main Headings */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" />
          <span>Checkout Screen Headings & Subtitles</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Checkout Main Heading (English)
            </label>
            <input
              type="text"
              value={checkoutData.title || ''}
              onChange={(e) => onChangeCheckoutField('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              عنوان صفحة إتمام الطلب (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutData.titleArabic || ''}
              onChange={(e) => onChangeCheckoutField('titleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Checkout Subtitle (English)
            </label>
            <textarea
              rows={2}
              value={checkoutData.subtitle || ''}
              onChange={(e) => onChangeCheckoutField('subtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              وصف صفحة إتمام الطلب (عربي)
            </label>
            <textarea
              rows={2}
              dir="rtl"
              value={checkoutData.subtitleArabic || ''}
              onChange={(e) => onChangeCheckoutField('subtitleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Step Headings & CTA Labels */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-400" />
          <span>Checkout Steps & Action Buttons</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Step 1: Address Heading (English)
            </label>
            <input
              type="text"
              value={checkoutData.shippingHeading || ''}
              onChange={(e) => onChangeCheckoutField('shippingHeading', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              الخطوة 1: عنوان التوصيل والشحن (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutData.shippingHeadingArabic || ''}
              onChange={(e) => onChangeCheckoutField('shippingHeadingArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Step 2: Payment Heading (English)
            </label>
            <input
              type="text"
              value={checkoutData.paymentHeading || ''}
              onChange={(e) => onChangeCheckoutField('paymentHeading', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              الخطوة 2: طريقة الدفع (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutData.paymentHeadingArabic || ''}
              onChange={(e) => onChangeCheckoutField('paymentHeadingArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Order Summary Box Heading (English)
            </label>
            <input
              type="text"
              value={checkoutData.summaryHeading || ''}
              onChange={(e) => onChangeCheckoutField('summaryHeading', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              عنوان ملخص الطلب (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutData.summaryHeadingArabic || ''}
              onChange={(e) => onChangeCheckoutField('summaryHeadingArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Submit Order CTA Button Label (English)
            </label>
            <input
              type="text"
              value={checkoutData.orderButtonText || ''}
              onChange={(e) => onChangeCheckoutField('orderButtonText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص زر تأكيد الطلب (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutData.orderButtonTextArabic || ''}
              onChange={(e) => onChangeCheckoutField('orderButtonTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Guarantee Badge Text (English)
            </label>
            <input
              type="text"
              value={checkoutData.guaranteeBadgeText || ''}
              onChange={(e) => onChangeCheckoutField('guaranteeBadgeText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص شارة الضمان والأمان (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutData.guaranteeBadgeTextArabic || ''}
              onChange={(e) => onChangeCheckoutField('guaranteeBadgeTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Checkout Success Screen Customizer */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Order Confirmation & Success Screen</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Success Badge (English)
            </label>
            <input
              type="text"
              value={checkoutSuccessData.successBadge || ''}
              onChange={(e) => onChangeSuccessField('successBadge', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              شارة التأكيد الناجح (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutSuccessData.successBadgeArabic || ''}
              onChange={(e) => onChangeSuccessField('successBadgeArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Success Title Prefix (English)
            </label>
            <input
              type="text"
              value={checkoutSuccessData.successTitle || ''}
              onChange={(e) => onChangeSuccessField('successTitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              عنوان التهنئة بالطلب (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutSuccessData.successTitleArabic || ''}
              onChange={(e) => onChangeSuccessField('successTitleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Next Steps Heading (English)
            </label>
            <input
              type="text"
              value={checkoutSuccessData.nextStepsHeading || ''}
              onChange={(e) => onChangeSuccessField('nextStepsHeading', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              عنوان الخطوات التالية (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutSuccessData.nextStepsHeadingArabic || ''}
              onChange={(e) => onChangeSuccessField('nextStepsHeadingArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Step 1: Guild Routing Text (English)
            </label>
            <textarea
              rows={2}
              value={checkoutSuccessData.step1Text || ''}
              onChange={(e) => onChangeSuccessField('step1Text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              الخطوة 1: توجيه الطلب للحرفيين (عربي)
            </label>
            <textarea
              rows={2}
              dir="rtl"
              value={checkoutSuccessData.step1TextArabic || ''}
              onChange={(e) => onChangeSuccessField('step1TextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Step 2: WhatsApp Dispatch Confirmation (English)
            </label>
            <textarea
              rows={2}
              value={checkoutSuccessData.step2Text || ''}
              onChange={(e) => onChangeSuccessField('step2Text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              الخطوة 2: تأكيد موقع التوصيل بالواتساب (عربي)
            </label>
            <textarea
              rows={2}
              dir="rtl"
              value={checkoutSuccessData.step2TextArabic || ''}
              onChange={(e) => onChangeSuccessField('step2TextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Step 3: Settlement Handover (English)
            </label>
            <textarea
              rows={2}
              value={checkoutSuccessData.step3Text || ''}
              onChange={(e) => onChangeSuccessField('step3Text', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              الخطوة 3: الدفع عند الاستلام (عربي)
            </label>
            <textarea
              rows={2}
              dir="rtl"
              value={checkoutSuccessData.step3TextArabic || ''}
              onChange={(e) => onChangeSuccessField('step3TextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Track Order Button Label (English)
            </label>
            <input
              type="text"
              value={checkoutSuccessData.buttonTrackText || ''}
              onChange={(e) => onChangeSuccessField('buttonTrackText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص زر متابعة الطلب (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutSuccessData.buttonTrackTextArabic || ''}
              onChange={(e) => onChangeSuccessField('buttonTrackTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Continue Shopping Button Label (English)
            </label>
            <input
              type="text"
              value={checkoutSuccessData.buttonContinueText || ''}
              onChange={(e) => onChangeSuccessField('buttonContinueText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص زر مواصلة التسوق (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={checkoutSuccessData.buttonContinueTextArabic || ''}
              onChange={(e) => onChangeSuccessField('buttonContinueTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
