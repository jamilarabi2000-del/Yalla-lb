import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Search
} from 'lucide-react';

import mountainTownImg from '../assets/images/mountain_town_1786766825066.jpg';
import cobblestoneStreetImg from '../assets/images/cobblestone_street_1786766842879.jpg';
import lebaneseMountainTownImg from '../assets/images/rachaya_mountain_perfect_1786799009637.jpg';
import raoucheSunsetImg from '../assets/images/raouche_rocks_sunset_1786799732002.jpg';

const HERO_IMAGES = [
  raoucheSunsetImg,
  lebaneseMountainTownImg,
  mountainTownImg,
  cobblestoneStreetImg,
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80', // Lebanese mountain landscape / Beqaa
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80'  // Cedar forest and nature
];

export const HeroBanner: React.FC = () => {
  const { setActiveTab, setSelectedCategory, setSearchQuery, t, language, siteContent } = useShop();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroData = siteContent?.hero || {
    badgeText: 'Handcrafted with Love in Lebanon',
    title: 'Authentic Lebanese Treasures, Handcrafted by Master Artisans',
    subtitle: 'Connecting traditional craft workshops across Beirut, Tripoli, Sidon, and Mount Lebanon directly to lovers of authentic Levantine heritage worldwide.',
    primaryBtnText: 'Explore Collection',
    secondaryBtnText: 'Meet the Artisans',
    targetUrl: '/products',
    stats: [
      { label: 'Master Artisans', value: '120+' },
      { label: 'Lebanese Villages', value: '45+' },
      { label: 'Orders Delivered', value: '15,000+' },
      { label: 'Customer Rating', value: '4.9 ★' },
    ]
  };

  const cmsMediaItems = (siteContent?.hero as any)?.bgMediaItems?.filter((item: any) => item.isPublished !== false) || [];
  
  const heroMedia = cmsMediaItems.length > 0 ? cmsMediaItems : [
    { url: HERO_IMAGES[0], type: 'image' },
    { url: HERO_IMAGES[1], type: 'image' },
    { url: HERO_IMAGES[2], type: 'image' }
  ];

  const currentMedia = heroMedia[currentImageIndex] || heroMedia[0];
  const isVideo = currentMedia?.type === 'video';

  const activeTitle = language === 'ar'
    ? (currentMedia?.customTitleArabic || currentMedia?.customTitle || (heroData as any).titleArabic || t('heroTitle'))
    : (currentMedia?.customTitle || (heroData as any).title || t('heroTitle'));

  const activeSubtitle = language === 'ar'
    ? (currentMedia?.customSubtitleArabic || currentMedia?.customSubtitle || (heroData as any).subtitleArabic || (heroData as any).subtitle)
    : (currentMedia?.customSubtitle || (heroData as any).subtitle);

  const handleHeroClick = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentImageIndex(0);
    if (heroMedia.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroMedia.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroMedia.length]);

  return (
    <div className="relative overflow-hidden bg-slate-900 py-16 lg:py-24 border-b border-slate-200">
      {/* Background Video or Slideshow Images */}
      {heroMedia.map((media, idx) => (
        media.type === 'video' ? (
          <video
            key={`media-${idx}`}
            src={media.url}
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-100'
            }`}
          />
        ) : (
          <img
            key={`media-${idx}`}
            src={media.url}
            alt={`Hero media ${idx + 1}`}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-100'
            }`}
            style={{
              transition: 'opacity 1s ease-in-out, transform 8s ease-out'
            }}
          />
        )
      ))}

      {/* Dark subtle vignette scrim at bottom only for dot contrast, no heavy white blur or blue overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Content Card */}
        <div className="max-w-2xl mx-auto text-center space-y-5 bg-transparent backdrop-blur-none p-6 sm:p-8">
          
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-md transition-all duration-500">
            {activeTitle}
          </h1>

          {activeSubtitle && (
            <p className="text-xs sm:text-sm text-slate-100/90 max-w-xl mx-auto leading-relaxed drop-shadow-xs transition-all duration-500">
              {activeSubtitle}
            </p>
          )}

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto pt-1">
            <div className="relative flex items-center bg-white rounded-full border border-slate-200/80 focus-within:border-amber-500 shadow-2xl overflow-hidden transition-all p-1.5">
              <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} w-5 h-5 text-slate-400 pointer-events-none z-10`} />
              <input
                type="text"
                placeholder={language === 'ar' ? (siteContent?.navbar?.searchPlaceholderArabic || t('searchPlaceholder')) : (siteContent?.navbar?.searchPlaceholder || t('searchPlaceholder'))}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActiveTab('products');
                }}
                className={`w-full ${language === 'ar' ? 'pr-11 pl-44 sm:pl-48' : 'pl-11 pr-44 sm:pr-48'} py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium truncate`}
              />
              <button 
                onClick={handleHeroClick}
                className={`absolute ${language === 'ar' ? 'left-1.5' : 'right-1.5'} top-1.5 bottom-1.5 flex items-center justify-center px-4 sm:px-5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider rounded-full cursor-pointer shadow-md transition-all whitespace-nowrap`}
              >
                {language === 'ar' ? ((heroData as any).primaryBtnTextArabic || t('products')) : ((heroData as any).primaryBtnText || t('products'))}
              </button>
            </div>
          </div>

        </div>

        {/* Hero Statistics & Trust Counters */}
        {heroData?.stats && heroData.stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-4xl mx-auto relative z-20">
            {heroData.stats.filter((s: any) => s.isPublished !== false).map((stat: any, idx: number) => (
              <div key={idx} className="bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-xl">
                <div className="text-lg sm:text-2xl font-extrabold text-amber-400 font-mono mb-0.5">
                  {language === 'ar' ? (stat.valueArabic || stat.value) : stat.value}
                </div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
                  {language === 'ar' ? (stat.labelArabic || stat.label) : stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carousel indicators — only meaningful with more than one media item */}
        {heroMedia.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 relative z-20">
            {heroMedia.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer shadow-md ${
                  i === currentImageIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/70 hover:bg-white'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

