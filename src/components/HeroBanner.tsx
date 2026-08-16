import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Sparkles, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Award, 
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
  const { setActiveTab, setSearchQuery, t, language } = useShop();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-900 py-16 lg:py-24 border-b border-slate-200">
      {/* Background Slideshow Images - High clarity, sharp visibility */}
      {HERO_IMAGES.map((img, idx) => (
        <img
          key={img}
          src={img}
          alt={`Lebanese Heritage slide ${idx + 1}`}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            idx === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-100'
          }`}
          style={{
            transition: 'opacity 1s ease-in-out, transform 8s ease-out'
          }}
        />
      ))}

      {/* Dark subtle vignette scrim at bottom only for dot contrast, no heavy white blur or blue overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Transparent Content Card */}
        <div className="max-w-2xl mx-auto text-center space-y-6 bg-[#FFFFFF00] p-8 sm:p-10 rounded-3xl border border-white/20 shadow-2xl">
          


          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            {t('heroTitle')}
          </h1>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto pt-2">
            <div className="relative flex items-center bg-white rounded-2xl border border-white/30 focus-within:border-amber-400 shadow-xl overflow-hidden transition-all">
              <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} w-5 h-5 text-slate-400 pointer-events-none`} />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActiveTab('products');
                }}
                className={`w-full ${language === 'ar' ? 'pr-12 pl-28' : 'pl-12 pr-28'} py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none bg-transparent font-medium`}
              />
              <button 
                onClick={() => setActiveTab('products')}
                className={`absolute ${language === 'ar' ? 'left-1.5' : 'right-1.5'} px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all`}
              >
                {t('products')}
              </button>
            </div>
          </div>


        </div>

        {/* Carousel indicators */}
        <div className="flex justify-center items-center gap-2 mt-6">
          {HERO_IMAGES.map((_, i) => (
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

      </div>
    </div>
  );
};

