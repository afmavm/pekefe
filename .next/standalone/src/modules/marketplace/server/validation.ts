import { z } from 'zod';

export const TrendyolSchema = z.object({
  apiKey: z.string().min(1, "API Anahtarı gereklidir."),
  secretKey: z.string().min(1, "Secret Key (Gizli Anahtar) gereklidir."),
  sellerId: z.string().min(1, "Satıcı ID (Seller ID) gereklidir."),
  autoSync: z.boolean().default(true),
  autoPriceSync: z.boolean().default(false),
});

export const HepsiburadaSchema = z.object({
  apiKey: z.string().min(1, "API Key (API Anahtarı) gereklidir."),
  merchantId: z.string().min(1, "Merchant ID (Tüccar ID) gereklidir."),
  autoSync: z.boolean().default(true),
  autoPriceSync: z.boolean().default(false),
});

export const N11Schema = z.object({
  apiKey: z.string().min(1, "API Anahtarı (AppKey) gereklidir."),
  apiSecret: z.string().min(1, "API Şifresi (AppSecret) gereklidir."),
  autoSync: z.boolean().default(true),
  autoPriceSync: z.boolean().default(false),
});

export const XmlSupplierSchema = z.object({
  xmlUrl: z.string().min(1, "XML Besleme URL'si gereklidir.").url("Geçerli bir XML URL'si girilmelidir."),
  autoSync: z.boolean().default(true),
});

export const ManualSyncTriggerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export function validateSettings(name: string, settings: any) {
  const normName = name.trim();
  if (normName === "Trendyol") {
    return TrendyolSchema.safeParse(settings);
  } else if (normName === "Hepsiburada") {
    return HepsiburadaSchema.safeParse(settings);
  } else if (normName === "N11") {
    return N11Schema.safeParse(settings);
  } else if (normName === "XML Tedarikçi") {
    return XmlSupplierSchema.safeParse(settings);
  }
  return TrendyolSchema.safeParse(settings);
}
