export type Currency = 'USD' | 'LBP';

export interface Product {
  id: string;
  name: string;
  arabicName?: string;
  artisan: string;
  seller?: string;
  arabicSeller?: string;
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
  isPublished?: boolean; // Admin can publish/hide individual products
  tags: string[];
  keywords?: string[];
  arabicKeywords?: string[];
  seoTitle?: string;
  seoArabicTitle?: string;
  seoDescription?: string;
  seoArabicDescription?: string;
  weightOrVolume?: string;
}

export interface CategoryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  description: string;
  descriptionAr?: string;
  subcategories: string[];
  bannerUrl: string;
  arabicKeywords?: string[];
  englishKeywords?: string[];
  isPublished?: boolean;
  displayOrder?: number;
}

export interface TerroirRegion {
  id: string;
  nameEn: string;
  nameAr: string;
  majorCities: string[];
  expressAvailable: boolean;
  baseDeliveryUSD: number;
  estimatedTimeEn?: string;
  estimatedTimeAr?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string;
}

export interface ShippingDetails {
  fullName: string;
  firstName?: string;
  lastName?: string;
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
  discountUSD?: number;
  appliedCoupon?: string;
}

export interface UserProfile {
  uid?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  avatar: string;
  defaultGovernorate: string;
  defaultCity: string;
  defaultAddress: string;
  defaultBuilding?: string;
  defaultNotes?: string;
  emailVerified?: boolean;
  isOtpVerified?: boolean;
}

export interface CMSOfferSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  targetUrl?: string;
  discountBadge?: string;
  bgGradient: string;
  imageUrl?: string;
  isCustomSchoolLayout?: boolean;
  isPublished?: boolean;
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
  isPublished?: boolean;
}

export interface CMSNavTab {
  id: string;
  label: string;
  arabicLabel?: string;
  isPublished?: boolean;
}

export interface CMSHeroStat {
  label: string;
  value: string;
  isPublished?: boolean;
}

export interface CMSCustomBlock {
  id: string;
  title: string;
  subtitle?: string;
  content: string; // HTML, rich text or description
  badge?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  bgStyle: 'dark' | 'light' | 'gold_gradient' | 'emerald_gradient' | 'custom_image' | 'glass';
  customBgColor?: string;
  customTextColor?: string;
  targetPage: 'home' | 'products' | 'checkout' | 'account' | 'product_detail' | 'all';
  position: 'top' | 'middle' | 'bottom';
  isPublished: boolean;
  order: number;
}

export interface SectionVisibilityConfig {
  // Global & Navbar
  announcementTicker: boolean;
  phoneSupport: boolean;
  navbarSearch: boolean;
  currencySwitcher: boolean;
  languageSwitcher: boolean;
  
  // Home Page
  homeHero: boolean;
  homeCategories: boolean;
  homeOffers: boolean;
  homeFeatured: boolean;
  homeTrustBadges: boolean;
  homeDeals: boolean;
  homeNewArrivals: boolean;
  homeHeritage: boolean;
  homeReviews: boolean;
  homeNewsletter: boolean;
  homeNews: boolean;
  
  // Products Page
  productsHeader: boolean;
  productsSearchFilter: boolean;
  productsCategoryTabs: boolean;
  productsSort: boolean;
  productsGrid: boolean;
  
  // Product Detail Page
  detailBreadcrumbs: boolean;
  detailGallery: boolean;
  detailPriceBox: boolean;
  detailArtisanBio: boolean;
  detailCraftStory: boolean;
  detailWhatsAppInquiry: boolean;
  detailCustomerReviews: boolean;
  detailRelatedProducts: boolean;
  
  // Checkout Page
  checkoutSteps: boolean;
  checkoutAddressForm: boolean;
  checkoutDeliverySpeed: boolean;
  checkoutPaymentMethod: boolean;
  checkoutOrderSummary: boolean;
  checkoutGuarantees: boolean;
  
  // Account Page
  accountOrders: boolean;
  accountProfile: boolean;
  accountWishlist: boolean;
  accountSupportCard: boolean;
  
  // Footer
  footerAbout: boolean;
  footerQuickLinks: boolean;
  footerContact: boolean;
  footerSocial: boolean;
  footerCopyright: boolean;
}

export interface SiteContent {
  seo?: {
    title: string;
    arabicTitle?: string;
    description: string;
    arabicDescription?: string;
    keywords?: string[];
    arabicKeywords?: string[];
  };
  visibility: SectionVisibilityConfig;
  customBlocks: CMSCustomBlock[];
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
    targetUrl?: string;
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
  productDetailPage: {
    inquiryWhatsAppNumber: string;
    inquiryText: string;
    authenticityGuaranteeText: string;
    freeDeliveryBadgeText: string;
    returnsPolicyText: string;
    craftStoryTitle: string;
    relatedItemsTitle: string;
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
  checkoutSuccessPage?: {
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
  socialLinks: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    email: string;
    phone: string;
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

export interface RecentActivity {
  id: string;
  timestamp: string; // ISO 8601 string
  actionType: 'product_add' | 'product_update' | 'product_delete' | 'order_status' | 'meta_change' | 'cms_update' | 'category_create' | 'category_update' | 'category_delete' | 'region_update';
  summary: string;
  details: string;
  adminEmail: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO timestamp string
  orderId?: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 15 for 15% or 5 for $5
  target: 'all' | 'checkout' | 'product' | 'category' | 'seller' | 'brand';
  targetValue?: string; // specific product id, category id/name, artisan/seller name, or origin/brand name
  couponCode?: string; // optional coupon code e.g. SUMMER20
  isActive: boolean;
  minPurchaseUSD?: number;
  startDate?: string; // ISO date-time string e.g. "2026-08-20T00:00"
  endDate?: string;   // ISO date-time string e.g. "2026-08-31T23:59"
  isNewUserOnly?: boolean; // True if rule applies only to new users
}


