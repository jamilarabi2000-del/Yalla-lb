import { SiteContent } from '../types';

export const DEFAULT_SITE_CONTENT: SiteContent = {
  visibility: {
    // Navbar & Global
    announcementTicker: true,
    phoneSupport: true,
    navbarSearch: true,
    currencySwitcher: true,
    languageSwitcher: true,
    
    // Home Page Sections
    homeHero: true,
    homeCategories: true,
    homeOffers: true,
    homeFeatured: true,
    homeTrustBadges: true,
    homeDeals: true,
    homeNewArrivals: true,
    homeHeritage: true,
    homeReviews: true,
    homeNewsletter: true,
    homeNews: true,
    
    // Products Page
    productsHeader: true,
    productsSearchFilter: true,
    productsCategoryTabs: true,
    productsSort: true,
    productsGrid: true,
    
    // Product Detail Page
    detailBreadcrumbs: true,
    detailGallery: true,
    detailPriceBox: true,
    detailArtisanBio: true,
    detailCraftStory: true,
    detailWhatsAppInquiry: true,
    detailCustomerReviews: true,
    detailRelatedProducts: true,
    
    // Checkout Page
    checkoutSteps: true,
    checkoutAddressForm: true,
    checkoutDeliverySpeed: true,
    checkoutPaymentMethod: true,
    checkoutOrderSummary: true,
    checkoutGuarantees: true,
    
    // Account Page
    accountOrders: true,
    accountProfile: true,
    accountWishlist: true,
    accountSupportCard: true,
    
    // Footer
    footerAbout: true,
    footerQuickLinks: true,
    footerContact: true,
    footerSocial: true,
    footerCopyright: true,
  },
  customBlocks: [],
  navbar: {
    announcementTicker: '🇱🇧 Express Delivery Across Lebanon • Live LBP Rate: 89,500 LBP/USD • Authentic Lebanese Craftsmanship',
    brandName: 'Yalla',
    brandSubtitle: 'Lebanese Artisanal Marketplace',
    phoneSupport: '+961 70 123 456',
    searchPlaceholder: 'Search zaatar, blown glass, cedar wood, olive soap...',
    navTabs: [
      { id: 'home', label: 'Home', arabicLabel: 'الرئيسية', isPublished: true },
      { id: 'products', label: 'Artisan Catalog', arabicLabel: 'المنتجات', isPublished: true },
      { id: 'offers', label: 'Special Offers', arabicLabel: 'العروض', isPublished: true },
      { id: 'news', label: 'Craft Press & News', arabicLabel: 'الأخبار', isPublished: true },
      { id: 'account', label: 'My Account', arabicLabel: 'حسابي', isPublished: true },
      { id: 'admin', label: 'Artisan Portal', arabicLabel: 'إدارة', isPublished: true },
    ]
  },
  hero: {
    badgeText: 'Handcrafted with Love in Lebanon',
    title: 'Authentic Lebanese Treasures, Handcrafted by Master Artisans',
    subtitle: 'Connecting traditional craft workshops across Beirut, Tripoli, Sidon, and Mount Lebanon directly to lovers of authentic Levantine heritage worldwide.',
    primaryBtnText: 'Explore Collection',
    secondaryBtnText: 'Meet the Artisans',
    bgImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=2000',
    stats: [
      { label: 'Master Artisans', value: '120+', isPublished: true },
      { label: 'Lebanese Villages', value: '45+', isPublished: true },
      { label: 'Orders Delivered', value: '15,000+', isPublished: true },
      { label: 'Customer Rating', value: '4.9 ★', isPublished: true },
    ]
  },
  offers: {
    sectionTitle: 'Exclusive Cultural Promotions & Offers',
    sectionSubtitle: 'Limited-time seasonal deals curated directly from top workshops across Lebanon.',
    slides: [
      {
        id: 'school-essentials',
        badge: 'BACK TO SCHOOL & UNIVERSITY 🎒',
        title: 'Lebanese School & University Essentials 2026',
        subtitle: 'Equip students with handcrafted leather backpacks, handmade brass stationery, organic snack packs, and authentic Levantine study gear.',
        buttonText: 'Shop School Essentials Collection →',
        discountBadge: 'UP TO 35% OFF',
        bgGradient: 'from-emerald-900 via-teal-900 to-slate-900',
        imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
        isCustomSchoolLayout: true,
        isPublished: true,
      },
      {
        id: 'harvest-fest',
        badge: 'LEBANESE OLIVE HARVEST SEASON 🫒',
        title: 'Koura & Batroun Cold-Pressed Extra Virgin Olive Oil',
        subtitle: 'First cold extraction olive oil and pure laurel soap gift sets crafted in ancient Phoenician groves.',
        buttonText: 'Claim Harvest Discount',
        discountBadge: 'BUNDLE & SAVE 20%',
        bgGradient: 'from-amber-950 via-yellow-950 to-stone-900',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
        isPublished: true,
      },
      {
        id: 'phoenician-glass',
        badge: 'HAND-BLOWN GLASSWARE SPECIAL 💎',
        title: 'Sarafand Phoenician Blown Glass Heritage Set',
        subtitle: 'Recycled blown glass water carafes and goblets crafted by the Khalifeh family in Southern Lebanon.',
        buttonText: 'Explore Artisanal Glassware',
        discountBadge: 'FREE EXPRESS SHIPPING',
        bgGradient: 'from-blue-950 via-cyan-950 to-slate-950',
        imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
        isPublished: true,
      }
    ]
  },
  home: {
    featuredTitle: 'Featured Lebanese Treasures',
    featuredSubtitle: 'Handpicked items celebrating timeless craftsmanship and Levantine gastronomy.',
    regionsTitle: 'Explore Lebanon by Region',
    regionsSubtitle: 'Discover specialized heritage crafts rooted in Lebanon\'s historical provinces.',
    artisansTitle: 'Meet Our Master Artisans',
    artisansSubtitle: 'Preserving century-old Levantine traditions across generations.',
    heritageTitle: 'Preserving Lebanese Cultural Heritage',
    heritageText: 'Every purchase on Yalla directly supports independent artisan workshops, local cooperatives, and family businesses across Lebanon.',
    reviewsTitle: 'Words from Our Global & Local Patrons',
    reviewsSubtitle: 'Verified feedback from customers experiencing authentic Levantine craftsmanship.',
    newsletterTitle: 'Join the Yalla Heritage Circle',
    newsletterSubtitle: 'Subscribe to receive exclusive artisan stories, seasonal harvest drops, and special diaspora promotions.',
    newsletterButtonText: 'Subscribe Now'
  },
  productsPage: {
    title: 'Artisanal Catalog',
    subtitle: 'Browse authentic handcrafted goods, Levantine pantry delicacies, traditional copperware, organic olive soap, and heritage textiles.',
    searchPlaceholder: 'Search products, artisans, or origins...',
    filterAllLabel: 'All Treasures',
    noProductsText: 'No artisan products found matching your search filters.'
  },
  productDetailPage: {
    inquiryWhatsAppNumber: '96170889234',
    inquiryText: 'Inquire on WhatsApp with Master Artisan',
    authenticityGuaranteeText: '100% Guaranteed Authentic Lebanese Terroir & Workshop Handcrafted',
    freeDeliveryBadgeText: 'Fast Courier Dispatched from Lebanon',
    returnsPolicyText: 'Hassle-free 7-day inspection return guarantee for artisanal crafts.',
    craftStoryTitle: 'Artisan Workshop & Provenance',
    relatedItemsTitle: 'More from this Heritage Collection'
  },
  checkoutPage: {
    title: 'Lebanon Express Checkout',
    subtitle: 'Select delivery speed and payment method for fast dispatch across Lebanon or internationally.',
    shippingHeading: '1. Shipping & Delivery Address',
    paymentHeading: '2. Payment Method (LBP / USD)',
    summaryHeading: 'Order Summary',
    orderButtonText: 'Confirm & Place Order',
    guaranteeBadgeText: '100% Authentic Lebanese Guarantee • Fast Courier Tracking'
  },
  accountPage: {
    title: 'Patron Account & Preferences',
    subtitle: 'Manage delivery addresses, track courier dispatches, and review saved wishlist items.',
    ordersTabLabel: 'Order History & Tracking',
    profileTabLabel: 'Profile & Delivery Details',
    wishlistTabLabel: 'Saved Wishlist'
  },
  newsSection: {
    title: 'News & Announcements',
    subtitle: 'Latest updates on Lebanese artisan revival, harvest seasons, and cultural exhibitions.',
    articles: [
      {
        id: 'news-1',
        title: 'Reviving Sarafand Phoenician Blown Glass Craft in Southern Lebanon',
        excerpt: 'How the last glassblowing dynasty in Sarafand is transforming recycled glass into world-renowned artisanal tableware.',
        source: 'L\'Orient Today',
        date: 'August 12, 2026',
        imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
        tag: 'Heritage Preservation',
        readTime: '4 min read',
        isPublished: true,
      },
      {
        id: 'news-2',
        title: 'Koura Olive Harvest 2026: Organic Cold-Pressed Oils Reach Diaspora Markets',
        excerpt: 'Northern Lebanese cooperatives report exceptional olive yields, providing premium cold-pressed oil for global shipment.',
        source: 'Beirut Cultural Review',
        date: 'July 28, 2026',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
        tag: 'Agriculture & Harvest',
        readTime: '5 min read',
        isPublished: true,
      },
      {
        id: 'news-3',
        title: 'Tripoli Coppersmiths Safeguard Century-Old Engraving Techniques',
        excerpt: 'In the ancient souks of Tripoli, coppersmiths continue hand-hammering traditional coffee pots and decorative trays.',
        source: 'Lebanon Craft Journal',
        date: 'July 15, 2026',
        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        tag: 'Artisan Spotlight',
        readTime: '3 min read',
        isPublished: true,
      }
    ]
  },
  socialLinks: {
    instagram: 'https://instagram.com/yalla.lb',
    facebook: 'https://facebook.com/yallalb',
    whatsapp: 'https://wa.me/96170889234',
    email: 'concierge@yalla.lb',
    phone: '+961 70 889 234'
  },
  footer: {
    aboutTitle: 'About Yalla',
    aboutText: 'Yalla is a premier digital marketplace bridging authentic Lebanese artisan workshops, cooperatives, and culinary masters with customers across Lebanon and the global diaspora.',
    quickLinksTitle: 'Quick Links',
    contactTitle: 'Contact & Support',
    phone: '+961 70 123 456',
    email: 'support@yalla.shop',
    address: 'Gournaud Street, Gemmayzeh, Beirut, Lebanon',
    hours: 'Mon - Sat: 9:00 AM - 7:00 PM (EET)',
    copyrightText: '© 2026 Yalla. All rights reserved.'
  }
};
