import { z } from "zod";

// Phone validation regex
const phoneRegex = /^[0-9\s-+()]{10,20}$/;
// Tax ID validation regex (10 or 11 digits)
const taxIdRegex = /^\d{10,11}$/;

export const FormulaSchema = z.string()
  .nullable()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === "") return true;
    const clean = val.toLowerCase().replace(/\s+/g, "");
    
    // Only allow safe characters: cost, price, baseprice variables, numbers, operators
    if (!/^[a-z0-9\+\-\*\/\(\)\.]+$/.test(clean)) {
      return false;
    }
    
    // Check if the only letters used are the permitted variables
    const matches = clean.match(/[a-z]+/g);
    if (matches) {
      return matches.every((m) => ["cost", "price", "baseprice"].includes(m));
    }
    
    return true;
  }, {
    message: "Formül sadece 'cost', 'price', sayı ve matematiksel işlemleri (+, -, *, /, parantez) içerebilir."
  });

export const CreateDealerSchema = z.object({
  name: z.string().min(2, "Cari adı/unvanı en az 2 karakter olmalıdır."),
  type: z.string().optional().default("Müşteri"),
  cariTipi: z.string().default("CORPORATE"),
  cariKod: z.string().nullable().optional(),
  ad: z.string().nullable().optional(),
  soyad: z.string().nullable().optional(),
  tckn: z.string().nullable().optional(),
  dogumTarihi: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  taxNo: z.string().nullable().optional(),
  taxOffice: z.string().nullable().optional(),
  mersisNo: z.string().nullable().optional(),
  yetkiliKisi: z.string().nullable().optional(),
  webSitesi: z.string().nullable().optional(),
  phone: z.string().regex(phoneRegex, "Geçerli bir telefon numarası giriniz (en az 10 haneli)."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  balance: z.number().optional().default(0),
  dealerGroup: z.string().default("Standart"),
  priceGroup: z.string().default("Liste"),
  riskLimit: z.number().nonnegative("Risk limiti sıfırdan küçük olamaz.").default(0),
  creditLimit: z.number().nonnegative("Kredi limiti sıfırdan küçük olamaz.").default(0),
  discountRate: z.number().min(0, "İskonto oranı %0'dan küçük olamaz.").max(100, "İskonto oranı %100'den büyük olamaz.").nullable().optional(),
  loyaltyPoints: z.number().nonnegative("Sadakat puanı sıfırdan küçük olamaz.").default(0),
  vadeGun: z.number().nonnegative("Kredi vadesi sıfırdan küçük olamaz.").nullable().optional(),
  priceFormula: FormulaSchema,
  parentDealerId: z.string().nullable().optional(),
  b2bMinQty: z.number().min(0, "Minimum sipariş miktarı 0'dan küçük olamaz.").nullable().optional().default(1),
  b2bPaymentTerms: z.string().nullable().optional().default("Nakit"),
  b2bCode: z.string().nullable().optional(),
});

export const UpdateDealerSchema = CreateDealerSchema.extend({
  id: z.string().min(1, "Güncellenecek bayinin ID bilgisi zorunludur."),
});

export type CreateDealerInput = z.infer<typeof CreateDealerSchema>;
export type UpdateDealerInput = z.infer<typeof UpdateDealerSchema>;
