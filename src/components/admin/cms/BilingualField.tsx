import React, { useState } from 'react';
import { Sparkles, Check, Globe, Copy } from 'lucide-react';

interface SuggestionItem {
  en: string;
  ar: string;
  category?: string;
}

interface BilingualFieldProps {
  label?: string;
  labelEn?: string;
  labelAr?: string;
  subLabel?: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (val: string) => void;
  onChangeAr: (val: string) => void;
  placeholderEn?: string;
  placeholderAr?: string;
  type?: 'text' | 'textarea';
  isTextarea?: boolean;
  rows?: number;
  suggestions?: SuggestionItem[];
  presetSuggestions?: SuggestionItem[];
  className?: string;
  id?: string;
}

export const LEBANESE_ARTISANAL_SUGGESTIONS: SuggestionItem[] = [
  {
    category: 'Crafts & Heritage',
    en: 'Authentic Lebanese Treasures, Handcrafted by Master Artisans',
    ar: 'كنوز لبنانية أصيلة، بأيدي أمهر الحرفيين والورش التقليدية'
  },
  {
    category: 'Mouneh & Pantry',
    en: 'Pure Village Mouneh, Extra Virgin Olive Oil & Cedar Honey',
    ar: 'مونة قروية بلدية 100%، زيت زيتون بكر ممتاز وعسل السدر النقي'
  },
  {
    category: 'Delivery & Express',
    en: 'Fast Reliable Delivery Across All Lebanese Regions & Worldwide Diaspora',
    ar: 'توصيل سريع وموثوق لكافة المناطق اللبنانية وللمغتربين حول العالم'
  },
  {
    category: 'Promotions & Discounts',
    en: 'Limited-Time Artisanal Harvest Offers & Exclusive Combo Sets',
    ar: 'عروض موسمية حصرية ومجموعات توفير خاصة من قلب الطبيعة اللبنانية'
  },
  {
    category: 'Call to Action',
    en: 'Explore Artisanal Collection →',
    ar: 'استكشف التشكيلة الحرفية ←'
  },
  {
    category: 'Call to Action',
    en: 'Shop Lebanese Pantry Essentials',
    ar: 'تسوق مستلزمات المونة اللبنانية'
  },
  {
    category: 'Back to School',
    en: 'Handmade Leather Study Gear & Healthy Artisan Snacks',
    ar: 'حقائب جلدية يدوية، قرطاسية تراثية، وسناكات صحية لطلاب المدارس'
  }
];

export const BilingualField: React.FC<BilingualFieldProps> = ({
  label,
  labelEn,
  labelAr,
  subLabel,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  placeholderEn = 'Enter English text...',
  placeholderAr = 'أدخل النص بالعربية...',
  type = 'text',
  isTextarea,
  rows = 3,
  suggestions,
  presetSuggestions,
  className = '',
  id
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedField, setCopiedField] = useState<'en' | 'ar' | null>(null);

  const activeSuggestions = presetSuggestions || suggestions || LEBANESE_ARTISANAL_SUGGESTIONS;
  const isMultiLine = isTextarea || type === 'textarea';
  const displayLabel = label || labelEn || 'Field';

  const handleCopy = (field: 'en' | 'ar', text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const applySuggestion = (s: SuggestionItem) => {
    onChangeEn(s.en);
    onChangeAr(s.ar);
    setShowSuggestions(false);
  };

  return (
    <div id={id} className={`space-y-2 ${className}`}>
      {/* Header with Title & Lebanese Preset helper */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wide">
            {displayLabel}
            {labelAr && <span className="ml-2 text-amber-400/80 font-normal normal-case">({labelAr})</span>}
          </label>
          {subLabel && (
            <p className="text-[11px] text-slate-400 mt-0.5">{subLabel}</p>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Lebanese Artisanal Copywriting Suggestions"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Lebanese Copy Presets</span>
          </button>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-3 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl z-50 space-y-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Lebanese Artisanal Presets
                </span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {activeSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => applySuggestion(item)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-400/40 border border-white/5 cursor-pointer transition-all text-start group"
                  >
                    {item.category && (
                      <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                        {item.category}
                      </span>
                    )}
                    <p className="text-xs text-white font-medium group-hover:text-amber-200 mt-0.5 line-clamp-2">
                      {item.en}
                    </p>
                    <p className="text-xs text-slate-300 font-arabic group-hover:text-amber-200 mt-1 line-clamp-2 text-right" dir="rtl">
                      {item.ar}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Dual-Language Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* English Column */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="text-xs">🇺🇸</span> English (LTR)
            </span>
            <button
              type="button"
              onClick={() => handleCopy('en', valueEn)}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px] cursor-pointer"
            >
              {copiedField === 'en' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === 'en' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {type === 'textarea' ? (
            <textarea
              value={valueEn || ''}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholderEn}
              rows={rows}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:outline-none transition-all resize-y"
            />
          ) : (
            <input
              type="text"
              value={valueEn || ''}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholderEn}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:outline-none transition-all"
            />
          )}
        </div>

        {/* Arabic Column */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <button
              type="button"
              onClick={() => handleCopy('ar', valueAr)}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px] cursor-pointer"
            >
              {copiedField === 'ar' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === 'ar' ? 'تم النسخ' : 'نسخ'}</span>
            </button>
            <span className="flex items-center gap-1 text-slate-300">
              العربية (RTL) <span className="text-xs">🇱🇧</span>
            </span>
          </div>

          {type === 'textarea' ? (
            <textarea
              value={valueAr || ''}
              onChange={(e) => onChangeAr(e.target.value)}
              placeholder={placeholderAr}
              dir="rtl"
              rows={rows}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:outline-none transition-all resize-y text-right font-arabic"
            />
          ) : (
            <input
              type="text"
              value={valueAr || ''}
              onChange={(e) => onChangeAr(e.target.value)}
              placeholder={placeholderAr}
              dir="rtl"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:outline-none transition-all text-right font-arabic"
            />
          )}
        </div>
      </div>
    </div>
  );
};
