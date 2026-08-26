import React, { useState } from 'react';
import { CMSHeroStat, CMSOfferSlide } from '../../../types';
import { 
  Home, 
  Sparkles, 
  Tag, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers, 
  BookOpen, 
  MessageSquare, 
  Mail,
  Edit3,
  Check,
  X
} from 'lucide-react';

interface CMSHomeTabProps {
  homeData: {
    featuredTitle: string;
    featuredTitleArabic?: string;
    featuredSubtitle: string;
    featuredSubtitleArabic?: string;
    regionsTitle: string;
    regionsTitleArabic?: string;
    regionsSubtitle: string;
    regionsSubtitleArabic?: string;
    artisansTitle: string;
    artisansTitleArabic?: string;
    artisansSubtitle: string;
    artisansSubtitleArabic?: string;
    heritageTitle: string;
    heritageTitleArabic?: string;
    heritageText: string;
    heritageTextArabic?: string;
    reviewsTitle: string;
    reviewsTitleArabic?: string;
    reviewsSubtitle: string;
    reviewsSubtitleArabic?: string;
    newsletterTitle: string;
    newsletterTitleArabic?: string;
    newsletterSubtitle: string;
    newsletterSubtitleArabic?: string;
    newsletterButtonText: string;
    newsletterButtonTextArabic?: string;
  };
  heroData: {
    badgeText: string;
    badgeTextArabic?: string;
    title: string;
    titleArabic?: string;
    subtitle: string;
    subtitleArabic?: string;
    primaryBtnText: string;
    primaryBtnTextArabic?: string;
    secondaryBtnText: string;
    secondaryBtnTextArabic?: string;
    targetUrl?: string;
    bgImageUrl: string;
    stats: CMSHeroStat[];
  };
  offersData: {
    sectionTitle: string;
    sectionTitleArabic?: string;
    sectionSubtitle: string;
    sectionSubtitleArabic?: string;
    slides: CMSOfferSlide[];
  };
  onChangeHomeField: (field: string, value: string) => void;
  onChangeHeroField: (field: string, value: any) => void;
  onChangeOffersField: (field: string, value: any) => void;
}

export const CMSHomeTab: React.FC<CMSHomeTabProps> = ({
  homeData,
  heroData,
  offersData,
  onChangeHomeField,
  onChangeHeroField,
  onChangeOffersField,
}) => {
  const [editingSlide, setEditingSlide] = useState<CMSOfferSlide | null>(null);
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);

  const [slideForm, setSlideForm] = useState<CMSOfferSlide>({
    id: '',
    badge: 'SPECIAL PROMOTION',
    badgeArabic: 'عرض خاص',
    title: '',
    titleArabic: '',
    subtitle: '',
    subtitleArabic: '',
    buttonText: 'Claim Offer',
    buttonTextArabic: 'احصل على العرض',
    targetUrl: '/products',
    discountBadge: '20% OFF',
    discountBadgeArabic: 'خصم 20%',
    bgGradient: 'from-amber-950 via-yellow-950 to-stone-900',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
    isPublished: true
  });

  const heroStats = heroData?.stats || [];
  const slides = offersData?.slides || [];

  const handleUpdateStat = (index: number, updates: Partial<CMSHeroStat>) => {
    const updated = [...heroStats];
    updated[index] = { ...updated[index], ...updates };
    onChangeHeroField('stats', updated);
  };

  const handleAddStat = () => {
    const newStat: CMSHeroStat = {
      label: 'New Metric',
      labelArabic: 'مقياس جديد',
      value: '100+',
      valueArabic: '+100',
      isPublished: true
    };
    onChangeHeroField('stats', [...heroStats, newStat]);
  };

  const handleDeleteStat = (index: number) => {
    const updated = heroStats.filter((_, idx) => idx !== index);
    onChangeHeroField('stats', updated);
  };

  const handleStartCreateSlide = () => {
    setSlideForm({
      id: `offer-${Date.now()}`,
      badge: 'SEASONAL HARVEST 🫒',
      badgeArabic: 'موسم القطاف 🫒',
      title: '',
      titleArabic: '',
      subtitle: '',
      subtitleArabic: '',
      buttonText: 'Shop Collection',
      buttonTextArabic: 'تسوق التشكيلة',
      targetUrl: '/products',
      discountBadge: 'EXCLUSIVE BUNDLE',
      discountBadgeArabic: 'باقة حصرية',
      bgGradient: 'from-emerald-900 via-teal-900 to-slate-900',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
      isPublished: true
    });
    setIsCreatingSlide(true);
    setEditingSlide(null);
  };

  const handleStartEditSlide = (slide: CMSOfferSlide) => {
    setSlideForm({ ...slide });
    setEditingSlide(slide);
    setIsCreatingSlide(false);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title.trim()) return;

    let updatedList: CMSOfferSlide[];
    if (editingSlide) {
      updatedList = slides.map(s => s.id === editingSlide.id ? slideForm : s);
    } else {
      updatedList = [...slides, slideForm];
    }

    onChangeOffersField('slides', updatedList);
    setEditingSlide(null);
    setIsCreatingSlide(false);
  };

  const handleDeleteSlide = (id: string) => {
    const updated = slides.filter(s => s.id !== id);
    onChangeOffersField('slides', updated);
  };

  const handleTogglePublishSlide = (id: string) => {
    const updated = slides.map(s => 
      s.id === id ? { ...s, isPublished: s.isPublished === false ? true : false } : s
    );
    onChangeOffersField('slides', updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner Configuration */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Landing Hero Banner & Core Messaging</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Hero Eyebrow Badge (English)
            </label>
            <input
              type="text"
              value={heroData?.badgeText || ''}
              onChange={(e) => onChangeHeroField('badgeText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              شارة الهيرو العلوية (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={heroData?.badgeTextArabic || ''}
              onChange={(e) => onChangeHeroField('badgeTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Hero Main Headline (English)
            </label>
            <input
              type="text"
              value={heroData?.title || ''}
              onChange={(e) => onChangeHeroField('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              عنوان الهيرو الرئيسي (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={heroData?.titleArabic || ''}
              onChange={(e) => onChangeHeroField('titleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Hero Subtitle / Description (English)
            </label>
            <textarea
              rows={2}
              value={heroData?.subtitle || ''}
              onChange={(e) => onChangeHeroField('subtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              وصف الهيرو التعريفي (عربي)
            </label>
            <textarea
              rows={2}
              dir="rtl"
              value={heroData?.subtitleArabic || ''}
              onChange={(e) => onChangeHeroField('subtitleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Primary CTA Button Label (English)
            </label>
            <input
              type="text"
              value={heroData?.primaryBtnText || ''}
              onChange={(e) => onChangeHeroField('primaryBtnText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص الزر الرئيسي (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={heroData?.primaryBtnTextArabic || ''}
              onChange={(e) => onChangeHeroField('primaryBtnTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Hero Background Image URL (Direct link)
            </label>
            <input
              type="url"
              value={heroData?.bgImageUrl || ''}
              onChange={(e) => onChangeHeroField('bgImageUrl', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Hero Stats Metric List */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Hero Statistics & Trust Counters
            </h4>
            <button
              type="button"
              onClick={handleAddStat}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Metric</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {heroStats.map((stat, idx) => (
              <div key={idx} className="p-3 bg-slate-900 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">Stat #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteStat(idx)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => handleUpdateStat(idx, { value: e.target.value })}
                  placeholder="Value (e.g. 120+)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => handleUpdateStat(idx, { label: e.target.value })}
                  placeholder="Label (e.g. Master Artisans)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={stat.labelArabic || ''}
                  onChange={(e) => handleUpdateStat(idx, { labelArabic: e.target.value })}
                  placeholder="الوصف (عربي)"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Special Promotional Offers Carousel */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span>Promotional Offers & Carousel Slides</span>
          </h3>
          {!isCreatingSlide && !editingSlide && (
            <button
              type="button"
              onClick={handleStartCreateSlide}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Offer Slide</span>
            </button>
          )}
        </div>

        {/* Slide Edit / Create Form */}
        {(isCreatingSlide || editingSlide) && (
          <form onSubmit={handleSaveSlide} className="p-5 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>{editingSlide ? 'Edit Promotional Slide' : 'Add New Promotional Slide'}</span>
              </h4>
              <button
                type="button"
                onClick={() => { setIsCreatingSlide(false); setEditingSlide(null); }}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Slide Badge (English)</label>
                <input
                  type="text"
                  value={slideForm.badge}
                  onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1" dir="rtl">شارة العرض (عربي)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={slideForm.badgeArabic || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, badgeArabic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Slide Title (English)</label>
                <input
                  type="text"
                  required
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1" dir="rtl">عنوان العرض (عربي)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={slideForm.titleArabic || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, titleArabic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Slide Subtitle (English)</label>
                <input
                  type="text"
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1" dir="rtl">وصف العرض (عربي)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={slideForm.subtitleArabic || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitleArabic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Button Label</label>
                <input
                  type="text"
                  value={slideForm.buttonText}
                  onChange={(e) => setSlideForm({ ...slideForm, buttonText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Target URL</label>
                <input
                  type="text"
                  value={slideForm.targetUrl || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, targetUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Discount Tag (e.g. 30% OFF)</label>
                <input
                  type="text"
                  value={slideForm.discountBadge || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, discountBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Slide Image URL</label>
                <input
                  type="url"
                  value={slideForm.imageUrl || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setIsCreatingSlide(false); setEditingSlide(null); }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Slide</span>
              </button>
            </div>
          </form>
        )}

        {/* Slides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <div 
              key={slide.id}
              className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                slide.isPublished !== false ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="relative h-32 bg-slate-950">
                {slide.imageUrl && (
                  <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                    {slide.badge}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-xs font-bold text-white line-clamp-1">{slide.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{slide.subtitle}</p>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400">{slide.discountBadge}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePublishSlide(slide.id)}
                      className="p-1 rounded-lg bg-slate-800 text-slate-300"
                    >
                      {slide.isPublished !== false ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditSlide(slide)}
                      className="p-1 rounded-lg bg-slate-800 text-amber-400"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1 rounded-lg bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Section Titles & Narrative Blocks */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>Home Page Section Titles & Story Blocks</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Featured Items Title</label>
            <input type="text" value={homeData?.featuredTitle || ''} onChange={e => onChangeHomeField('featuredTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">عنوان المنتجات المميزة (عربي)</label>
            <input type="text" dir="rtl" value={homeData?.featuredTitleArabic || ''} onChange={e => onChangeHomeField('featuredTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Featured Items Subtitle</label>
            <input type="text" value={homeData?.featuredSubtitle || ''} onChange={e => onChangeHomeField('featuredSubtitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">وصف المنتجات المميزة (عربي)</label>
            <input type="text" dir="rtl" value={homeData?.featuredSubtitleArabic || ''} onChange={e => onChangeHomeField('featuredSubtitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Heritage Story Title</label>
            <input type="text" value={homeData?.heritageTitle || ''} onChange={e => onChangeHomeField('heritageTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">عنوان قصة التراث (عربي)</label>
            <input type="text" dir="rtl" value={homeData?.heritageTitleArabic || ''} onChange={e => onChangeHomeField('heritageTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Heritage Story Narrative</label>
            <textarea rows={3} value={homeData?.heritageText || ''} onChange={e => onChangeHomeField('heritageText', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">سرد قصة التراث (عربي)</label>
            <textarea rows={3} dir="rtl" value={homeData?.heritageTextArabic || ''} onChange={e => onChangeHomeField('heritageTextArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Reviews Section Title</label>
            <input type="text" value={homeData?.reviewsTitle || ''} onChange={e => onChangeHomeField('reviewsTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">عنوان قسم التقييمات (عربي)</label>
            <input type="text" dir="rtl" value={homeData?.reviewsTitleArabic || ''} onChange={e => onChangeHomeField('reviewsTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Newsletter Title</label>
            <input type="text" value={homeData?.newsletterTitle || ''} onChange={e => onChangeHomeField('newsletterTitle', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">عنوان النشرة البريدية (عربي)</label>
            <input type="text" dir="rtl" value={homeData?.newsletterTitleArabic || ''} onChange={e => onChangeHomeField('newsletterTitleArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Newsletter Button Label</label>
            <input type="text" value={homeData?.newsletterButtonText || ''} onChange={e => onChangeHomeField('newsletterButtonText', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">زر النشرة البريدية (عربي)</label>
            <input type="text" dir="rtl" value={homeData?.newsletterButtonTextArabic || ''} onChange={e => onChangeHomeField('newsletterButtonTextArabic', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
