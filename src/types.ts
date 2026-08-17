export type Currency = 'USD' | 'LBP';

export interface Product {
  id: string;
  name: string;
  arabicName?: string;
  artisan: string;
  origin: string; // e.g. "Beirut Central", "Tripoli", "Koura", "Batroun"
  category: string;
  priceUSD: number;
  originalPriceUSD?: number;
  discountPercentage?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  additionalImages?: string[];
  description: string;
  craftStory: string;
  stock: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
  tags: string[];
  weightOrVolume?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string;
}

export interface ShippingDetails {
  fullName: string;
  phone: string; // WhatsApp number
  email: string;
  governorate: string; // Beirut, Mount Lebanon, North, South, Bekaa, Nabatieh, International
  city: string;
  street: string;
  building: string;
  floorApartment?: string;
  deliveryNotes?: string;
  deliverySpeed: 'standard' | 'express_beirut' | 'diaspora_air';
}

export type PaymentMethod = 'cod_usd' | 'cod_lbp' | 'wish_omt' | 'credit_card';

export type OrderStatus = 'pending' | 'crafting' | 'courier_assigned' | 'in_transit' | 'delivered';

export interface Order {
  id: string;
  userId?: string;
  date: string;
  items: CartItem[];
  shipping: ShippingDetails;
  paymentMethod: PaymentMethod;
  currency: Currency;
  subtotalUSD: number;
  deliveryFeeUSD: number;
  totalUSD: number;
  totalLBP: number;
  status: OrderStatus;
  estimatedDelivery: string;
  trackingNumber: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  defaultGovernorate: string;
  defaultCity: string;
  defaultAddress: string;
}

export interface CMSOfferSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  discountBadge?: string;
  bgGradient: string;
  imageUrl?: string;
  isCustomSchoolLayout?: boolean;
}

export interface CMSNewsArticle {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  date: string;
  imageUrl: string;
  tag: string;
  readTime: string;
}

export interface CMSNavTab {
  id: string;
  label: string;
  arabicLabel?: string;
}

export interface CMSHeroStat {
  label: string;
  value: string;
}

export interface SiteContent {
  navbar: {
    announcementTicker: string;
    brandName: string;
    brandSubtitle: string;
    phoneSupport: string;
    searchPlaceholder: string;
    navTabs: CMSNavTab[];
  };
  hero: {
    badgeText: string;
    title: string;
    subtitle: string;
    primaryBtnText: string;
    secondaryBtnText: string;
    bgImageUrl: string;
    stats: CMSHeroStat[];
  };
  offers: {
    sectionTitle: string;
    sectionSubtitle: string;
    slides: CMSOfferSlide[];
  };
  home: {
    featuredTitle: string;
    featuredSubtitle: string;
    regionsTitle: string;
    regionsSubtitle: string;
    artisansTitle: string;
    artisansSubtitle: string;
    heritageTitle: string;
    heritageText: string;
    reviewsTitle: string;
    reviewsSubtitle: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    newsletterButtonText: string;
  };
  productsPage: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAllLabel: string;
    noProductsText: string;
  };
  checkoutPage: {
    title: string;
    subtitle: string;
    shippingHeading: string;
    paymentHeading: string;
    summaryHeading: string;
    orderButtonText: string;
    guaranteeBadgeText: string;
  };
  accountPage: {
    title: string;
    subtitle: string;
    ordersTabLabel: string;
    profileTabLabel: string;
    wishlistTabLabel: string;
  };
  newsSection: {
    title: string;
    subtitle: string;
    articles: CMSNewsArticle[];
  };
  footer: {
    aboutTitle: string;
    aboutText: string;
    quickLinksTitle: string;
    contactTitle: string;
    phone: string;
    email: string;
    address: string;
    hours: string;
    copyrightText: string;
  };
}

