import { z } from "zod";
import { parseTurkishCurrency } from "../utils";

export const tahsilatFormSchema = z.object({
  tarih: z.string().min(1, "İşlem tarihi zorunludur"),
  belgeNo: z.string().optional(),
  referansNo: z.string().optional(),
  tahsilatTuru: z.string().min(1, "İşlem türü zorunludur"),
  tutar: z.preprocess(
    (val) => parseTurkishCurrency(val),
    z.number().positive("Tutar sıfırdan büyük olmalıdır")
  ),
  paraBirimi: z.enum(["TRY", "USD", "EUR", "GBP"], {
    message: "Geçersiz para birimi",
  }),
  // Döviz Kuru (yabancı para biriminde işlem için)
  dovizKuru: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 1 : Number(val)),
    z.number().positive("Kur sıfırdan büyük olmalıdır").default(1)
  ),

  odemeYontemi: z.enum([
    "Nakit",
    "Banka Havalesi",
    "EFT",
    "Kredi Kartı",
    "Çek",
    "Senet",
    "Pos Tahsilatı"
  ], {
    message: "Geçersiz ödeme yöntemi",
  }),

  // İşlem Durumu (Onay Akışı)
  islemDurumu: z.enum(["Müsvedde", "Onay Bekliyor", "Onaylandı"]).default("Onaylandı"),

  // Banka Havalesi / EFT Dinamik Alanları
  bankId: z.string().optional(),
  iban: z.string().optional(),
  dekontNo: z.string().optional(),
  islemRefNo: z.string().optional(),

  // Çek Dinamik Alanları
  cekNo: z.string().optional(),
  bankaAdi: z.string().optional(),
  sube: z.string().optional(),
  kesideTarihi: z.string().optional(),
  cekVadeTarihi: z.string().optional(),

  // Senet Dinamik Alanları
  senetNo: z.string().optional(),
  duzenlemeTarihi: z.string().optional(),
  senetVadeTarihi: z.string().optional(),

  // Taksit Planı (Çek/Senet için)
  taksitSayisi: z.preprocess(
    (val) => (val === "" ? 1 : Number(val)),
    z.number().int().min(1).max(36).default(1)
  ),

  // Gecikme Faizi
  gecikmeKatsayisi: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
  gecikmeGun: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number().int().min(0).default(0)
  ),

  // Açık Fatura Eşleştirme Bölümü
  matchedInvoices: z.array(
    z.object({
      invoiceId: z.string(),
      amount: z.coerce.number().nonnegative(),
    })
  ).default([]),

  // Açıklamalar
  aciklama: z.string().max(500, "Açıklama maksimum 500 karakter olabilir").optional().or(z.literal("")),
  muhasebeNotu: z.string().max(500, "Muhasebe notu maksimum 500 karakter olabilir").optional().or(z.literal("")),
  icNot: z.string().max(500, "İç not maksimum 500 karakter olabilir").optional().or(z.literal("")),
});

export type TahsilatFormData = z.infer<typeof tahsilatFormSchema>;
export type TahsilatFormInput = z.input<typeof tahsilatFormSchema>;
