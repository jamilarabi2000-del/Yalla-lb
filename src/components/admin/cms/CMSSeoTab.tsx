import React, { useState } from 'react';
import { Type, Globe, Sparkles, Plus, X, Search, CheckCircle2 } from 'lucide-react';

interface CMSSeoTabProps {
  seoData?: {
    title: string;
    arabicTitle?: string;
    description: string;
    arabicDescription?: string;
    keywords?: string[];
    arabicKeywords?: string[];
    faviconUrl?: string;
  };
  onChangeField: (field: string, value: any) => void;
}

export const CMSSeoTab: React.FC<CMSSeoTabProps> = ({
  seoData = {
    title: 'Yalla.lb - Authentic Lebanese Craftsmanship & Terroir Marketplace',
    arabicTitle: 'يلا لبنان - السوق الحرفي والمونة اللبنانية الأصيلة',
    description: 'Shop authentic Lebanese mouneh, artisan blown glass, cedar honey, Koura olive oil, and Levantine heritage crafts directly from Lebanese cooperatives with express worldwide shipping.',
    arabicDescription: 'اكتشف وتسوق أفضل منتجات المونة اللبنانية، زيت زيتون الكورة، عسل السدر، الزعتر البري، والحرف اليدوية الأصيلة من الحرفيين والتعاونيات اللبنانية مع توصيل سريع.',
    keywords: ['Lebanese artisanal', 'mouneh', 'olive oil lebanon', 'zaatar', 'beirut crafts', 'cedar honey', 'tripoli soap', 'diaspora lebanon'],
    arabicKeywords: ['مونة لبنانية', 'زيت زيتون كورة', 'زعتر بلدي', 'عسل سدر لبناني', 'صابون غار طرابلس', 'حرف يدوية لبنانية', 'شحن مغتربين', 'صناعة لبنانية أصيلة']
  },
  onChangeField,
}) => {
  const [newKeywordEn, setNewKeywordEn] = useState('');
  const [newKeywordAr, setNewKeywordAr] = useState('');

  const keywordsEn = seoData.keywords || [];
  const keywordsAr = seoData.arabicKeywords || [];

  const handleAddKeywordEn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordEn.trim()) return;
    if (!keywordsEn.includes(newKeywordEn.trim())) {
      onChangeField('keywords', [...keywordsEn, newKeywordEn.trim()]);
    }
    setNewKeywordEn('');
  };

  const handleRemoveKeywordEn = (kw: string) => {
    onChangeField('keywords', keywordsEn.filter(k => k !== kw));
  };

  const handleAddKeywordAr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordAr.trim()) return;
    if (!keywordsAr.includes(newKeywordAr.trim())) {
      onChangeField('arabicKeywords', [...keywordsAr, newKeywordAr.trim()]);
    }
    setNewKeywordAr('');
  };

  const handleRemoveKeywordAr = (kw: string) => {
    onChangeField('arabicKeywords', keywordsAr.filter(k => k !== kw));
  };

  const enTitleLength = (seoData.title || '').length;
  const enDescLength = (seoData.description || '').length;

  return (
    <div className="space-y-6">
      {/* Live Google SERP Simulation Preview */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            <span>Google Search Engine Preview (SERP Simulation)</span>
          </h3>
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Sync Active</span>
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl shadow-inner text-left font-sans space-y-1.5 border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] text-white font-bold">
              Y
            </div>
            <span className="text-xs text-slate-800 font-medium">Yalla Lebanon</span>
            <span className="text-slate-400">https://yalla.shop › lebanon</span>
          </div>

          <h4 className="text-base text-[#1a0dab] hover:underline font-medium cursor-pointer leading-snug">
            {seoData.title || 'Yalla.lb - Lebanese Craftsmanship Marketplace'}
          </h4>

          <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
            {seoData.description || 'Shop authentic Lebanese crafts, artisan goods, and mouneh specialties directly from regional cooperatives.'}
          </p>
        </div>
      </div>

      {/* Meta Titles, Favicon & Descriptions */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Type className="w-5 h-5 text-amber-400" />
          <span>Meta Titles, Favicon Icon & Search Descriptions</span>
        </h3>

        {/* Favicon Icon Control */}
        <div className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center flex-shrink-0">
            {seoData.faviconUrl ? (
              <img src={seoData.faviconUrl} alt="Favicon Preview" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Globe className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
              Browser Favicon Icon URL (.ico / .png)
            </label>
            <input
              type="text"
              value={seoData.faviconUrl || ''}
              onChange={(e) => onChangeField('faviconUrl', e.target.value)}
              placeholder="https://example.com/favicon.ico (leave blank for default)"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* English Meta */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Global Meta Title (English)
                </label>
                <span className={`text-[11px] font-mono ${
                  enTitleLength >= 40 && enTitleLength <= 65 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {enTitleLength}/65 chars (Optimal: 50-60)
                </span>
              </div>
              <input
                type="text"
                value={seoData.title || ''}
                onChange={(e) => onChangeField('title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Global Meta Description (English)
                </label>
                <span className={`text-[11px] font-mono ${
                  enDescLength >= 120 && enDescLength <= 160 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {enDescLength}/160 chars (Optimal: 140-160)
                </span>
              </div>
              <textarea
                rows={4}
                value={seoData.description || ''}
                onChange={(e) => onChangeField('description', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Arabic Meta */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400" dir="rtl">
                  عنوان المتجر لمحركات البحث (عربي)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {(seoData.arabicTitle || '').length} حرفاً
                </span>
              </div>
              <input
                type="text"
                dir="rtl"
                value={seoData.arabicTitle || ''}
                onChange={(e) => onChangeField('arabicTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400" dir="rtl">
                  الوصف التعريفي لمحركات البحث (عربي)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {(seoData.arabicDescription || '').length} حرفاً
                </span>
              </div>
              <textarea
                rows={4}
                dir="rtl"
                value={seoData.arabicDescription || ''}
                onChange={(e) => onChangeField('arabicDescription', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Meta Keywords Manager */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-400" />
          <span>SEO Keywords & Indexing Tags</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Keywords */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Keywords (English)
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-12 p-3 rounded-2xl bg-slate-900 border border-white/10">
              {keywordsEn.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-xs text-slate-200 border border-white/10"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeywordEn(kw)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddKeywordEn} className="flex gap-2">
              <input
                type="text"
                value={newKeywordEn}
                onChange={(e) => setNewKeywordEn(e.target.value)}
                placeholder="Add keyword (e.g. olive soap)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newKeywordEn.trim()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Arabic Keywords */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400" dir="rtl">
              الكلمات المفتاحية (عربي)
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-12 p-3 rounded-2xl bg-slate-900 border border-white/10" dir="rtl">
              {keywordsAr.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-xs text-amber-200 border border-white/10"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeywordAr(kw)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddKeywordAr} className="flex gap-2" dir="rtl">
              <input
                type="text"
                dir="rtl"
                value={newKeywordAr}
                onChange={(e) => setNewKeywordAr(e.target.value)}
                placeholder="أضف كلمة مفتاحية (مثال: زعتر بلدي)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newKeywordAr.trim()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
