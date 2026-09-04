import React, { useState } from 'react';
import { CMSHeroStat, CMSOfferSlide, CMSHeroMediaItem } from '../../../types';
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
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { BilingualField } from './BilingualField';
import { MediaAssetPicker } from './MediaAssetPicker';

interface CMSHomeTabProps {
  homeData: {
    featuredTitle: string;
    featuredTitleArabic?: string;
    featuredSubtitle: string;
    featuredSubtitleArabic?: string;
    featuredDescription?: string;
    featuredDescriptionArabic?: string;
    dealsTitle?: string;
    dealsTitleArabic?: string;
    dealsSubtitle?: string;
    dealsSubtitleArabic?: string;
    dealsDescription?: string;
    dealsDescriptionArabic?: string;
    newArrivalsTitle?: string;
    newArrivalsTitleArabic?: string;
    newArrivalsSubtitle?: string;
    newArrivalsSubtitleArabic?: string;
    categoriesTitle?: string;
    categoriesTitleArabic?: string;
    categoriesSubtitle?: string;
    categoriesSubtitleArabic?: string;
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
    slideInterval?: number;
    overlayOpacity?: number;
    stats: CMSHeroStat[];
  };
  offersData: {
    sectionTag?: string;
    sectionTagArabic?: string;
    sectionBadge?: string;
    sectionBadgeArabic?: string;
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

  const heroMediaItems = (heroData as any)?.bgMediaItems || [];

  const handleUpdateMediaItem = (index: number, updates: Partial<CMSHeroMediaItem>) => {
    const updated = [...heroMediaItems];
    updated[index] = { ...updated[index], ...updates };
    onChangeHeroField('bgMediaItems', updated);
  };

  const handleAddMediaItem = () => {
    const newItem: CMSHeroMediaItem = {
      id: `media-${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=2000',
      type: 'image',
      title: 'New Media Item',
      isPublished: true
    };
    onChangeHeroField('bgMediaItems', [...heroMediaItems, newItem]);
  };

  const handleDeleteMediaItem = (index: number) => {
    const updated = heroMediaItems.filter((_: any, idx: number) => idx !== index);
    onChangeHeroField('bgMediaItems', updated);
  };

  const handleMoveMediaItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updated = [...heroMediaItems];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      onChangeHeroField('bgMediaItems', updated);
    } else if (direction === 'down' && index < heroMediaItems.length - 1) {
      const updated = [...heroMediaItems];
      [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
      onChangeHeroField('bgMediaItems', updated);
    }
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
        <div className="space-y-4">
          <BilingualField
            labelEn="Hero Eyebrow Badge"
            labelAr="شارة الهيرو العلوية"
            valueEn={heroData?.badgeText || ''}
            valueAr={heroData?.badgeTextArabic || ''}
            onChangeEn={(val) => onChangeHeroField('badgeText', val)}
            onChangeAr={(val) => onChangeHeroField('badgeTextArabic', val)}
            placeholderEn="e.g. 🌲 AUTHENTIC LEBANESE TREASURES"
            placeholderAr="مثال: 🌲 كنوز وتراث المونة اللبنانية"
            presetSuggestions={[
              { en: '🌲 AUTHENTIC LEBANESE TREASURES', ar: '🌲 كنوز وتراث المونة اللبنانية' },
              { en: '🇱🇧 DIRECT COOPERATIVE HERITAGE', ar: '🇱🇧 إنتاج مباشر من التعاونيات اللبنانية' },
              { en: '✨ HANDCRAFTED ARTISAN ESSENTIALS', ar: '✨ حرف يدوية ومونة بيتية فاخرة' },
            ]}
          />

          <BilingualField
            labelEn="Hero Main Headline"
            labelAr="عنوان الهيرو الرئيسي"
            valueEn={heroData?.title || ''}
            valueAr={heroData?.titleArabic || ''}
            onChangeEn={(val) => onChangeHeroField('title', val)}
            onChangeAr={(val) => onChangeHeroField('titleArabic', val)}
            placeholderEn="Handcrafted Heritage & Timeless Mouneh..."
            placeholderAr="أصالة المونة اللبنانية وحرفية القرى العريقة..."
          />

          <BilingualField
            labelEn="Hero Subtitle / Description"
            labelAr="وصف الهيرو التعريفي"
            valueEn={heroData?.subtitle || ''}
            valueAr={heroData?.subtitleArabic || ''}
            onChangeEn={(val) => onChangeHeroField('subtitle', val)}
            onChangeAr={(val) => onChangeHeroField('subtitleArabic', val)}
            isTextarea
            rows={2}
            placeholderEn="Direct from Lebanese artisanal workshops to your doorstep..."
            placeholderAr="مباشرة من ورش الحرفيين والتعاونيات الريفية إلى عتبة منزلك..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BilingualField
              labelEn="Primary CTA Button Label"
              labelAr="نص الزر الرئيسي"
              valueEn={heroData?.primaryBtnText || ''}
              valueAr={heroData?.primaryBtnTextArabic || ''}
              onChangeEn={(val) => onChangeHeroField('primaryBtnText', val)}
              onChangeAr={(val) => onChangeHeroField('primaryBtnTextArabic', val)}
              placeholderEn="Explore Collection"
              placeholderAr="استكشف المجموعة"
              presetSuggestions={[
                { en: 'Explore Collection', ar: 'استكشف التشكيلة' },
                { en: 'Shop Artisan Mouneh', ar: 'تسوق المونة الريفية' },
                { en: 'Discover Crafts', ar: 'اكتشف الحرف' },
              ]}
            />

            <BilingualField
              labelEn="Secondary CTA Button Label"
              labelAr="نص الزر الثانوي"
              valueEn={heroData?.secondaryBtnText || ''}
              valueAr={heroData?.secondaryBtnTextArabic || ''}
              onChangeEn={(val) => onChangeHeroField('secondaryBtnText', val)}
              onChangeAr={(val) => onChangeHeroField('secondaryBtnTextArabic', val)}
              placeholderEn="Diaspora Shipping"
              placeholderAr="شحن للمغتربين"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

          {/* Slider Auto-Play Timer & Dark Overlay Tint Controls */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Slider Auto-Play Speed (Seconds)
            </label>
            <select
              value={heroData?.slideInterval ?? 5}
              onChange={(e) => onChangeHeroField('slideInterval', parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-medium"
            >
              <option value={0}>Pause Auto-Play (Manual Navigation Only)</option>
              <option value={3}>3 Seconds (Fast)</option>
              <option value={5}>5 Seconds (Recommended)</option>
              <option value={8}>8 Seconds (Relaxed)</option>
              <option value={10}>10 Seconds (Slow)</option>
              <option value={15}>15 Seconds (Very Slow)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Background Dark Overlay Tint
              </label>
              <span className="text-xs font-mono text-amber-400 font-bold">{heroData?.overlayOpacity ?? 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="5"
              value={heroData?.overlayOpacity ?? 0}
              onChange={(e) => onChangeHeroField('overlayOpacity', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Set to 0% for 100% natural, un-tinted true image colors.</p>
          </div>

          {/* Hero Background Media Manager */}
          <div className="md:col-span-2 pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Hero Background Media (Images & Videos)
              </label>
              <button
                type="button"
                onClick={handleAddMediaItem}
                className="px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-xs font-bold transition-colors"
              >
                + Add Media
              </button>
            </div>
            
            <div className="space-y-3">
              {heroMediaItems.map((item: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-xl border ${item.isPublished !== false ? 'bg-slate-900 border-white/10' : 'bg-slate-900/50 border-red-900/50'} space-y-3 relative group`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => handleMoveMediaItem(idx, 'up')}
                        disabled={idx === 0}
                        className="text-slate-500 hover:text-white disabled:opacity-30 p-1"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMediaItem(idx, 'down')}
                        disabled={idx === heroMediaItems.length - 1}
                        className="text-slate-500 hover:text-white disabled:opacity-30 p-1"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Type</label>
                        <select
                          value={item.type}
                          onChange={(e) => handleUpdateMediaItem(idx, { type: e.target.value as 'image' | 'video' })}
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
                        >
                          <option value="image">Image</option>
                          <option value="video">Video (MP4/WebM)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Title (Optional)</label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => handleUpdateMediaItem(idx, { title: e.target.value })}
                          placeholder="e.g. Artisan Workshop"
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Media URL</label>
                        <input
                          type="url"
                          value={item.url || ''}
                          onChange={(e) => handleUpdateMediaItem(idx, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white font-mono"
                        />
                      </div>

                      {/* Custom Slide Overlay Text */}
                      <div>
                        <label className="block text-[10px] uppercase text-amber-400/90 font-bold mb-1">Slide Title (English - Optional)</label>
                        <input
                          type="text"
                          value={item.customTitle || ''}
                          onChange={(e) => handleUpdateMediaItem(idx, { customTitle: e.target.value })}
                          placeholder="Default: Uses Hero Title"
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-amber-400/90 font-bold mb-1">Slide Title (Arabic - Optional)</label>
                        <input
                          type="text"
                          value={item.customTitleArabic || ''}
                          onChange={(e) => handleUpdateMediaItem(idx, { customTitleArabic: e.target.value })}
                          placeholder="الافتراضي: العنوان الرئيسي"
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white text-right"
                          dir="rtl"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Slide Subtitle (English - Optional)</label>
                        <input
                          type="text"
                          value={item.customSubtitle || ''}
                          onChange={(e) => handleUpdateMediaItem(idx, { customSubtitle: e.target.value })}
                          placeholder="Default: Uses Hero Subtitle"
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Slide Subtitle (Arabic - Optional)</label>
                        <input
                          type="text"
                          value={item.customSubtitleArabic || ''}
                          onChange={(e) => handleUpdateMediaItem(idx, { customSubtitleArabic: e.target.value })}
                          placeholder="الافتراضي: الوصف الرئيسي"
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white text-right"
                          dir="rtl"
                        />
                      </div>

                      {/* Image Zoom & Focus Controls */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] uppercase text-amber-400 font-bold">Image Zoom Level</label>
                          <span className="text-[10px] font-mono text-amber-400">{item.imageZoom || 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="200"
                          step="5"
                          value={item.imageZoom || 100}
                          onChange={(e) => handleUpdateMediaItem(idx, { imageZoom: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-amber-400 font-bold mb-1">Focus Alignment</label>
                        <select
                          value={item.objectPosition || 'center'}
                          onChange={(e) => handleUpdateMediaItem(idx, { objectPosition: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
                        >
                          <option value="center">Center (Default)</option>
                          <option value="top">Top Focus</option>
                          <option value="bottom">Bottom Focus</option>
                          <option value="left">Left Focus</option>
                          <option value="right">Right Focus</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-amber-400 font-bold mb-1">Display Fit Mode</label>
                        <select
                          value={item.imageFit || 'cover'}
                          onChange={(e) => handleUpdateMediaItem(idx, { imageFit: e.target.value as any })}
                          className="w-full px-2 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
                        >
                          <option value="cover">Cover (Fill Screen Background)</option>
                          <option value="contain">Contain (Fit Full Uncropped Image)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateMediaItem(idx, { isPublished: item.isPublished === false ? true : false })}
                        className={`p-2 rounded-lg border transition-colors ${
                          item.isPublished !== false 
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-500/20 border-red-500/30 text-red-400'
                        }`}
                        title={item.isPublished !== false ? "Hide media" : "Show media"}
                      >
                        {item.isPublished !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMediaItem(idx)}
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {heroMediaItems.length === 0 && (
                <div className="text-center py-6 bg-slate-900 rounded-xl border border-white/10">
                  <p className="text-sm text-slate-400">No background media added.</p>
                </div>
              )}
            </div>
          </div>
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

        {/* Section Header Configuration for Ads & Promotions Banner */}
        <div className="p-5 bg-slate-950/70 border border-white/10 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Ads & Promotions Header Text & Labels
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Section Category Tag (English)</label>
              <input
                type="text"
                value={offersData?.sectionTag || ''}
                onChange={(e) => onChangeOffersField('sectionTag', e.target.value)}
                placeholder="Default: Ads & Promotions"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1" dir="rtl">فئة القسم (عربي)</label>
              <input
                type="text"
                dir="rtl"
                value={offersData?.sectionTagArabic || ''}
                onChange={(e) => onChangeOffersField('sectionTagArabic', e.target.value)}
                placeholder="الافتراضي: الإعلانات والعروض"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Sponsored Badge Pill (English)</label>
              <input
                type="text"
                value={offersData?.sectionBadge || ''}
                onChange={(e) => onChangeOffersField('sectionBadge', e.target.value)}
                placeholder="Default: Sponsored • Special Deals"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1" dir="rtl">شارة الرعاية (عربي)</label>
              <input
                type="text"
                dir="rtl"
                value={offersData?.sectionBadgeArabic || ''}
                onChange={(e) => onChangeOffersField('sectionBadgeArabic', e.target.value)}
                placeholder="الافتراضي: برعاية • عروض خاصة"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Main Section Title (English)</label>
              <input
                type="text"
                value={offersData?.sectionTitle || ''}
                onChange={(e) => onChangeOffersField('sectionTitle', e.target.value)}
                placeholder="Default: Exclusive Cultural Promotions & Offers"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1" dir="rtl">عنوان القسم الرئيسي (عربي)</label>
              <input
                type="text"
                dir="rtl"
                value={offersData?.sectionTitleArabic || ''}
                onChange={(e) => onChangeOffersField('sectionTitleArabic', e.target.value)}
                placeholder="الافتراضي: عروض وحملات إعلانية حصرية"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Section Subtitle / Description (English)</label>
              <input
                type="text"
                value={offersData?.sectionSubtitle || ''}
                onChange={(e) => onChangeOffersField('sectionSubtitle', e.target.value)}
                placeholder="Default: Limited-time seasonal deals..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1" dir="rtl">الوصف الفرعي للقسم (عربي)</label>
              <input
                type="text"
                dir="rtl"
                value={offersData?.sectionSubtitleArabic || ''}
                onChange={(e) => onChangeOffersField('sectionSubtitleArabic', e.target.value)}
                placeholder="الافتراضي: عروض موسمية لفترة محدودة..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
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
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Button Label (EN)</label>
                <input
                  type="text"
                  value={slideForm.buttonText}
                  onChange={(e) => setSlideForm({ ...slideForm, buttonText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Button Label (AR)</label>
                <input
                  type="text"
                  value={slideForm.buttonTextArabic || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, buttonTextArabic: e.target.value })}
                  placeholder="تسوق العرض"
                  dir="rtl"
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
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">
                  💻 Laptop / Desktop Image URL (Landscape 16:9)
                </label>
                <input
                  type="url"
                  value={slideForm.imageUrl || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                  placeholder="https://.../laptop-landscape-banner.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">
                  📱 Mobile Screen Image URL (Optional Portrait 4:5 / 1:1)
                </label>
                <input
                  type="url"
                  value={slideForm.mobileImageUrl || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, mobileImageUrl: e.target.value })}
                  placeholder="https://.../mobile-portrait-banner.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">If blank, the desktop image will be automatically adapted for mobile.</p>
              </div>

              {/* Image Zoom & Focus Controls */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-amber-400 uppercase">Image Zoom Scale</label>
                  <span className="text-xs font-mono text-amber-400">{slideForm.imageZoom || 100}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={slideForm.imageZoom || 100}
                  onChange={(e) => setSlideForm({ ...slideForm, imageZoom: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                  <span>50% (Zoom Out)</span>
                  <span>100% (Default)</span>
                  <span>200% (Zoom In)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Focus Alignment</label>
                <select
                  value={slideForm.objectPosition || 'center'}
                  onChange={(e) => setSlideForm({ ...slideForm, objectPosition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="center">Center (Default)</option>
                  <option value="top">Top Center</option>
                  <option value="bottom">Bottom Center</option>
                  <option value="left">Left Center</option>
                  <option value="right">Right Center</option>
                  <option value="top left">Top Left</option>
                  <option value="top right">Top Right</option>
                  <option value="bottom left">Bottom Left</option>
                  <option value="bottom right">Bottom Right</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Display Fit Mode</label>
                <select
                  value={slideForm.imageFit || 'cover'}
                  onChange={(e) => setSlideForm({ ...slideForm, imageFit: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="cover">Cover (Fill & Crop Widescreen)</option>
                  <option value="contain">Contain (Fit Entire Image + Ambient Glow)</option>
                  <option value="fill">Fill (Stretch Full Container)</option>
                </select>
              </div>

              <div className="md:col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-[11px] leading-relaxed">
                <span className="font-bold text-amber-300">💡 Image Fitting Advice for Laptops & Mobiles:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                  <li><strong className="text-slate-200">Laptop Screens</strong> are widescreen (16:9, e.g. 1920×1080). Use horizontal photos or select <strong>Contain</strong> or set <strong>Zoom to 60%-90%</strong> to prevent top/bottom cropping.</li>
                  <li><strong className="text-slate-200">Mobile Screens</strong> are vertical. Use the optional <em>Mobile Screen Image URL</em> if you have a vertical photo.</li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Slide Background Video URL (Optional MP4/WebM)</label>
                <input
                  type="url"
                  value={slideForm.bgVideoUrl || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, bgVideoUrl: e.target.value })}
                  placeholder="https://.../slide-video.mp4"
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

        <div className="space-y-5">
          <BilingualField
            labelEn="Featured Products Section Title"
            labelAr="عنوان قسم المنتجات المميزة"
            valueEn={homeData?.featuredTitle || ''}
            valueAr={homeData?.featuredTitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('featuredTitle', val)}
            onChangeAr={(val) => onChangeHomeField('featuredTitleArabic', val)}
            placeholderEn="Handcrafted Lebanese Treasures"
            placeholderAr="كنوز وحرف لبنانية مختارة"
          />

          <BilingualField
            labelEn="Featured Products Subtitle"
            labelAr="العنوان الفرعي للمنتجات المميزة"
            valueEn={homeData?.featuredSubtitle || ''}
            valueAr={homeData?.featuredSubtitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('featuredSubtitle', val)}
            onChangeAr={(val) => onChangeHomeField('featuredSubtitleArabic', val)}
            placeholderEn="Authentic Artisan Mouneh"
            placeholderAr="مونة بيتية أصيلة من القرى"
          />

          <BilingualField
            labelEn="Today's Flash Deals Title"
            labelAr="عنوان عروض اليوم السريعة"
            valueEn={homeData?.dealsTitle || ''}
            valueAr={homeData?.dealsTitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('dealsTitle', val)}
            onChangeAr={(val) => onChangeHomeField('dealsTitleArabic', val)}
            placeholderEn="Today's Harvest Specials"
            placeholderAr="عروض موسم القطاف الحصرية"
          />

          <BilingualField
            labelEn="Today's Deals Subtitle"
            labelAr="العنوان الفرعي لعروض اليوم"
            valueEn={homeData?.dealsSubtitle || ''}
            valueAr={homeData?.dealsSubtitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('dealsSubtitle', val)}
            onChangeAr={(val) => onChangeHomeField('dealsSubtitleArabic', val)}
            placeholderEn="Limited Seasonal Batches"
            placeholderAr="كميات محدودة وأسعار تشجيعية"
          />

          <BilingualField
            labelEn="New Arrivals Section Title"
            labelAr="عنوان قسم وصل حديثاً"
            valueEn={homeData?.newArrivalsTitle || ''}
            valueAr={homeData?.newArrivalsTitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('newArrivalsTitle', val)}
            onChangeAr={(val) => onChangeHomeField('newArrivalsTitleArabic', val)}
            placeholderEn="Fresh From the Village"
            placeholderAr="وصل حديثاً من القرى والتعاونيات"
          />

          <BilingualField
            labelEn="Shop By Category Title"
            labelAr="عنوان تصفح الفئات"
            valueEn={homeData?.categoriesTitle || ''}
            valueAr={homeData?.categoriesTitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('categoriesTitle', val)}
            onChangeAr={(val) => onChangeHomeField('categoriesTitleArabic', val)}
            placeholderEn="Explore Lebanese Heritage Departments"
            placeholderAr="استكشف أقسام التراث والمونة اللبنانية"
          />

          <BilingualField
            labelEn="Heritage Story Title"
            labelAr="عنوان قصة التراث والمونة"
            valueEn={homeData?.heritageTitle || ''}
            valueAr={homeData?.heritageTitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('heritageTitle', val)}
            onChangeAr={(val) => onChangeHomeField('heritageTitleArabic', val)}
            placeholderEn="The Story of Cedar Roots"
            placeholderAr="حكاية جذور الأرز والتراث الحي"
          />

          <BilingualField
            labelEn="Heritage Story Narrative"
            labelAr="سرد قصة التراث"
            valueEn={homeData?.heritageText || ''}
            valueAr={homeData?.heritageTextArabic || ''}
            onChangeEn={(val) => onChangeHomeField('heritageText', val)}
            onChangeAr={(val) => onChangeHomeField('heritageTextArabic', val)}
            isTextarea
            rows={3}
          />

          <BilingualField
            labelEn="Customer Reviews Section Title"
            labelAr="عنوان آراء وتجارب العملاء"
            valueEn={homeData?.reviewsTitle || ''}
            valueAr={homeData?.reviewsTitleArabic || ''}
            onChangeEn={(val) => onChangeHomeField('reviewsTitle', val)}
            onChangeAr={(val) => onChangeHomeField('reviewsTitleArabic', val)}
            placeholderEn="What Our Community Says"
            placeholderAr="ماذا يقول مجتمعنا وأحباؤنا"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BilingualField
              labelEn="Newsletter Title"
              labelAr="عنوان النشرة البريدية"
              valueEn={homeData?.newsletterTitle || ''}
              valueAr={homeData?.newsletterTitleArabic || ''}
              onChangeEn={(val) => onChangeHomeField('newsletterTitle', val)}
              onChangeAr={(val) => onChangeHomeField('newsletterTitleArabic', val)}
            />

            <BilingualField
              labelEn="Newsletter Button Label"
              labelAr="زر النشرة البريدية"
              valueEn={homeData?.newsletterButtonText || ''}
              valueAr={homeData?.newsletterButtonTextArabic || ''}
              onChangeEn={(val) => onChangeHomeField('newsletterButtonText', val)}
              onChangeAr={(val) => onChangeHomeField('newsletterButtonTextArabic', val)}
              presetSuggestions={[
                { en: 'Subscribe', ar: 'اشتراك' },
                { en: 'Join Heritage Club', ar: 'انضم لمجتمع التراث' },
                { en: 'Get Updates', ar: 'احصل على الجديد' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
