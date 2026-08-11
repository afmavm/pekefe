import { z } from 'zod';

export const CmsBrandingSchema = z.object({
  siteName: z.string().min(1, "Site adı gereklidir."),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Geçersiz renk kodu."),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Geçersiz renk kodu."),
  borderRadius: z.number().min(0).max(40),
  layoutWidth: z.string().min(1),
  logoUrl: z.string().optional().or(z.literal('')),
  logoFont: z.string().min(1),
  logoSize: z.number().min(10).max(48),
  logoWeight: z.string().min(1),
});

export const SeoCampaignSchema = z.object({
  siteDescription: z.string().optional().or(z.literal('')),
  topBarText1: z.string().optional().or(z.literal('')),
  topBarText2: z.string().optional().or(z.literal('')),
  announcement: z.string().optional().or(z.literal('')),
  announcement2: z.string().optional().or(z.literal('')),
  announcementActive: z.boolean(),
  announcementSpeed: z.number().min(1).max(60),
  shippingThreshold: z.number().min(0),
  shippingFee: z.number().min(0),
  cartDiscountType: z.string(),
  cartDiscountValue: z.number().min(0),
  cartDiscountMinAmount: z.number().min(0),
  bankTransferDiscountRate: z.number().min(0).max(100),
  companyName: z.string().optional().or(z.literal('')),
  bankName: z.string().optional().or(z.literal('')),
  bankIban: z.string().optional().or(z.literal('')),
  companyStampUrl: z.string().optional().or(z.literal('')),
});

export const SectionBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  icon: z.string(),
  visible: z.boolean(),
  fields: z.record(z.string(), z.any()).optional(),
});

export const CmsPageSectionsSchema = z.array(SectionBlockSchema);
