export interface CMSData {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  buttonText: string;
  announcement: string;
  announcement2: string;
  maintenanceMode: boolean;
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  siteDescription: string;
  categoryTitle: string;
  categorySubtitle: string;
  appTitle: string;
  appSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  socialInstagram: string;
  socialWhatsapp: string;
  logoFont: string;
  logoUrl: string;
  logoSize: number;
  logoWeight: string;
  footerSlogan: string;
  borderRadius: number;
  announcementActive: boolean;
  announcementSpeed: number;
  layoutWidth: string;
  heroAlignment: string;
  pricingRules: any;
  shippingThreshold: number;
  shippingFee: number;
  shippingCarriers: any;
  themeTemplates: any;
  contentAnywhereRules: any;
  savedSectionTemplates: any;
  popupConfig: any;
  topBarText1: string;
  topBarText2: string;
  faqData: any;
  cartDiscountType: string;
  cartDiscountValue: number;
  cartDiscountMinAmount: number;
  bankTransferDiscountRate: number;
  companyName: string;
  bankName: string;
  bankIban: string;
  companyStampUrl: string;
}

export interface CMSPage {
  id: string;
  name: string;
  slug: string;
  status: string; // "ACTIVE" | "DRAFT"
  sections: any; // JSON Array of blocks
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionBlock {
  id: string;
  type: string;
  label: string;
  icon: string;
  visible: boolean;
  fields?: Record<string, any>;
}
