import React from 'react';
import { 
  Layout, 
  Share2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Instagram, 
  Facebook, 
  MessageCircle,
  FileText
} from 'lucide-react';

interface CMSFooterTabProps {
  footerData: {
    aboutTitle: string;
    aboutTitleArabic?: string;
    aboutText: string;
    aboutTextArabic?: string;
    quickLinksTitle: string;
    quickLinksTitleArabic?: string;
    contactTitle: string;
    contactTitleArabic?: string;
    phone: string;
    email: string;
    address: string;
    addressArabic?: string;
    hours: string;
    hoursArabic?: string;
    copyrightText: string;
    copyrightTextArabic?: string;
  };
  socialLinks: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    email: string;
    phone: string;
  };
  onChangeFooterField: (field: string, value: string) => void;
  onChangeSocialField: (field: string, value: string) => void;
}

export const CMSFooterTab: React.FC<CMSFooterTabProps> = ({
  footerData = {
    aboutTitle: 'About Yalla',
    aboutTitleArabic: 'عن منصة يلا',
    aboutText: '',
    aboutTextArabic: '',
    quickLinksTitle: 'Quick Links',
    quickLinksTitleArabic: 'روابط سريعة',
    contactTitle: 'Contact & Support',
    contactTitleArabic: 'الاتصال والدعم الفني',
    phone: '+961 70 123 456',
    email: 'support@yalla.shop',
    address: 'Gournaud Street, Gemmayzeh, Beirut, Lebanon',
    addressArabic: 'شارع غورو، الجميزة، بيروت، لبنان',
    hours: 'Mon - Sat: 9:00 AM - 7:00 PM (EET)',
    hoursArabic: 'الإثنين - السبت: 9:00 ص - 7:00 م',
    copyrightText: '© 2026 Yalla. All rights reserved.',
    copyrightTextArabic: '© 2026 يلا. جميع الحقوق محفوظة.'
  },
  socialLinks = {
    instagram: 'https://instagram.com/yalla.lb',
    facebook: 'https://facebook.com/yallalb',
    whatsapp: 'https://wa.me/96170889234',
    email: 'concierge@yalla.lb',
    phone: '+961 70 889 234'
  },
  onChangeFooterField,
  onChangeSocialField,
}) => {
  return (
    <div className="space-y-6">
      {/* About Us Brand Narrative Block */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <span>Footer About Us Narrative Block</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              About Section Heading (English)
            </label>
            <input
              type="text"
              value={footerData.aboutTitle || ''}
              onChange={(e) => onChangeFooterField('aboutTitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              عنوان من نحن (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={footerData.aboutTitleArabic || ''}
              onChange={(e) => onChangeFooterField('aboutTitleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              About Description / Brand Mission (English)
            </label>
            <textarea
              rows={3}
              value={footerData.aboutText || ''}
              onChange={(e) => onChangeFooterField('aboutText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص من نحن / رسالة المتجر (عربي)
            </label>
            <textarea
              rows={3}
              dir="rtl"
              value={footerData.aboutTextArabic || ''}
              onChange={(e) => onChangeFooterField('aboutTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Contact Information & Physical Head Office */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-400" />
          <span>Footer Contact & Support Coordinates</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Contact Section Heading (English)
            </label>
            <input
              type="text"
              value={footerData.contactTitle || ''}
              onChange={(e) => onChangeFooterField('contactTitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              عنوان قسم الاتصال (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={footerData.contactTitleArabic || ''}
              onChange={(e) => onChangeFooterField('contactTitleArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Support Phone Number
            </label>
            <input
              type="text"
              value={footerData.phone || ''}
              onChange={(e) => onChangeFooterField('phone', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Support Email Address
            </label>
            <input
              type="email"
              value={footerData.email || ''}
              onChange={(e) => onChangeFooterField('email', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Physical Address (English)</span>
            </label>
            <input
              type="text"
              value={footerData.address || ''}
              onChange={(e) => onChangeFooterField('address', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              العنوان الفعلي (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={footerData.addressArabic || ''}
              onChange={(e) => onChangeFooterField('addressArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Operating Hours (English)</span>
            </label>
            <input
              type="text"
              value={footerData.hours || ''}
              onChange={(e) => onChangeFooterField('hours', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              ساعات العمل (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={footerData.hoursArabic || ''}
              onChange={(e) => onChangeFooterField('hoursArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Social Media Channels */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-400" />
          <span>Social Media & Concierge Links</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>Instagram URL</span>
            </label>
            <input
              type="text"
              value={socialLinks.instagram || ''}
              onChange={(e) => onChangeSocialField('instagram', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Facebook className="w-3.5 h-3.5 text-blue-500" />
              <span>Facebook Page URL</span>
            </label>
            <input
              type="text"
              value={socialLinks.facebook || ''}
              onChange={(e) => onChangeSocialField('facebook', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Direct Link</span>
            </label>
            <input
              type="text"
              value={socialLinks.whatsapp || ''}
              onChange={(e) => onChangeSocialField('whatsapp', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
              placeholder="https://wa.me/961..."
            />
          </div>
        </div>
      </div>

      {/* Copyright Banner */}
      <div className="bg-[#121222] border border-white/10 rounded-3xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layout className="w-5 h-5 text-amber-400" />
          <span>Footer Copyright Notice</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Copyright Text (English)
            </label>
            <input
              type="text"
              value={footerData.copyrightText || ''}
              onChange={(e) => onChangeFooterField('copyrightText', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5" dir="rtl">
              نص حقوق النشر (عربي)
            </label>
            <input
              type="text"
              dir="rtl"
              value={footerData.copyrightTextArabic || ''}
              onChange={(e) => onChangeFooterField('copyrightTextArabic', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
