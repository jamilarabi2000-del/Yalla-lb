import React, { useState } from 'react';
import { CMSNavTab } from '../../../types';
import { 
  Navigation, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Phone, 
  Search, 
  Sparkles, 
  Layers 
} from 'lucide-react';

interface CMSNavbarTabProps {
  navbarData: {
    announcementTicker: string;
    announcementTickerArabic?: string;
    brandName: string;
    brandNameArabic?: string;
    brandSubtitle: string;
    brandSubtitleArabic?: string;
    phoneSupport: string;
    searchPlaceholder: string;
    searchPlaceholderArabic?: string;
    navTabs: CMSNavTab[];
  };
  onChangeField: (field: string, value: any) => void;
}

export const CMSNavbarTab: React.FC<CMSNavbarTabProps> = ({
  navbarData = {
    announcementTicker: '',
    announcementTickerArabic: '',
    brandName: 'Yalla',
    brandNameArabic: 'يلا',
    brandSubtitle: 'Lebanese Artisanal Marketplace',
    brandSubtitleArabic: 'السوق اللبناني للحرف والمنتجات الأصيلة',
    phoneSupport: '+961 70 123 456',
    searchPlaceholder: 'Search zaatar, blown glass, cedar wood, olive soap...',
    searchPlaceholderArabic: 'ابحث عن زعتر، زجاج منفوخ، خشب أرز، صابون بلدي...',
    navTabs: []
  },
  onChangeField,
}) => {
  const [newTabId, setNewTabId] = useState('');
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabLabelAr, setNewTabLabelAr] = useState('');

  const navTabs = navbarData.navTabs || [];

  const handleUpdateTab = (index: number, updates: Partial<CMSNavTab>) => {
    const updated = [...navTabs];
    updated[index] = { ...updated[index], ...updates };
    onChangeField('navTabs', updated);
  };

  const handleAddTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabLabel.trim()) return;
    const id = newTabId.trim() || newTabLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newTab: CMSNavTab = {
      id,
      label: newTabLabel.trim(),
      arabicLabel: newTabLabelAr.trim() || newTabLabel.trim(),
      isPublished: true,
    };
    onChangeField('navTabs', [...navTabs, newTab]);
    setNewTabId('');
    setNewTabLabel('');
    setNewTabLabelAr('');
  };

  const handleDeleteTab = (index: number) => {
    const updated = navTabs.filter((_, idx) => idx !== index);
    onChangeField('navTabs', updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Announcement Ticker */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-amber-400" />
          <span>Top Announcement Ticker Bar</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Announcement Message (English)
            </label>
            <input
              type="text"
              value={navbarData.announcementTicker || ''}
              onChange={(e) => onChangeField('announcementTicker', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              placeholder="e.g. 🇱🇧 Express Delivery Across Lebanon • Live LBP Rate: 89,500 LBP/USD"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              رسالة شريط الإعلانات العلوي (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={navbarData.announcementTickerArabic || ''}
              onChange={(e) => onChangeField('announcementTickerArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              placeholder="توصيل سريع لكافة المناطق • سعر الصرف: 89,500 ل.ل/دولار"
            />
          </div>
        </div>
      </div>

      {/* Brand Identity & Header Contacts */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Brand Identity & Header Configuration</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Brand Name (English)
            </label>
            <input
              type="text"
              value={navbarData.brandName || ''}
              onChange={(e) => onChangeField('brandName', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              اسم المتجر (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={navbarData.brandNameArabic || ''}
              onChange={(e) => onChangeField('brandNameArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Brand Tagline / Subtitle (English)
            </label>
            <input
              type="text"
              value={navbarData.brandSubtitle || ''}
              onChange={(e) => onChangeField('brandSubtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              شعار المتجر الفرعي (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={navbarData.brandSubtitleArabic || ''}
              onChange={(e) => onChangeField('brandSubtitleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Support Phone / WhatsApp Hotline</span>
            </label>
            <input
              type="text"
              value={navbarData.phoneSupport || ''}
              onChange={(e) => onChangeField('phoneSupport', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Global Search Placeholders */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          <span>Live Search Box Placeholders</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Search Input Placeholder (English)
            </label>
            <input
              type="text"
              value={navbarData.searchPlaceholder || ''}
              onChange={(e) => onChangeField('searchPlaceholder', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص البحث التوضيحي (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={navbarData.searchPlaceholderArabic || ''}
              onChange={(e) => onChangeField('searchPlaceholderArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Navigation Menu Tabs Manager */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Storefront Navigation Menu Tabs</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">{navTabs.length} items</span>
        </div>

        {/* Existing Tabs List */}
        <div className="space-y-3">
          {navTabs.map((tab, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Tab Key / ID</label>
                  <input
                    type="text"
                    value={tab.id}
                    onChange={(e) => handleUpdateTab(idx, { id: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-300 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Label (EN)</label>
                  <input
                    type="text"
                    value={tab.label}
                    onChange={(e) => handleUpdateTab(idx, { label: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase" dir="rtl">الاسم (عربي)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={tab.arabicLabel || ''}
                    onChange={(e) => handleUpdateTab(idx, { arabicLabel: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleUpdateTab(idx, { isPublished: tab.isPublished === false ? true : false })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    tab.isPublished !== false
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-white/5'
                  }`}
                >
                  {tab.isPublished !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{tab.isPublished !== false ? 'Published' : 'Hidden'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTab(idx)}
                  className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                  title="Delete tab"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Navigation Tab */}
        <form onSubmit={handleAddTab} className="p-4 bg-slate-950/70 border border-dashed border-white/20 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Navigation Menu Item</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Tab ID (e.g. workshops)"
              value={newTabId}
              onChange={(e) => setNewTabId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
            />
            <input
              type="text"
              placeholder="English Label (e.g. Master Workshops)"
              value={newTabLabel}
              onChange={(e) => setNewTabLabel(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
            <input
              type="text"
              dir="rtl"
              placeholder="الاسم بالعربي (مثال: ورش الحرفيين)"
              value={newTabLabelAr}
              onChange={(e) => setNewTabLabelAr(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newTabLabel.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tab to Navbar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
