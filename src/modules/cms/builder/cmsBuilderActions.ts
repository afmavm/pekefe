"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import fs from "fs";
import path from "path";

// ─── ZOD SCHEMAS FOR RIGOROUS VALIDATION ────────────────────────────────────

export const BuilderPageSchema = z.object({
  name: z.string().min(1, "Sayfa başlığı zorunludur.").max(50, "Sayfa başlığı en fazla 50 karakter olmalıdır."),
  slug: z.string().min(1, "Sayfa adresi zorunludur.").regex(/^[a-z0-9-]+$/, "Geçersiz URL adresi. Sadece küçük harf, rakam ve tire içerebilir.")
});

export const BuilderSeoSchema = z.object({
  siteName: z.string().min(1, "Site adı boş bırakılamaz.").max(80, "Site adı en fazla 80 karakter olmalıdır."),
  siteDescription: z.string().max(200, "Site açıklaması en fazla 200 karakter olmalıdır."),
  socialWhatsapp: z.string().optional().or(z.literal('')),
  socialInstagram: z.string().optional().or(z.literal('')),
  socialFacebook: z.string().optional().or(z.literal('')),
  socialYoutube: z.string().optional().or(z.literal('')),
});

export const BuilderThemeSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Geçersiz ana renk kodu."),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Geçersiz ikincil renk kodu."),
  borderRadius: z.number().min(0).max(40),
  logoFont: z.string().min(1),
  logoSize: z.number().min(10).max(48),
  logoWeight: z.string().min(1)
});

// ─── AUDIT LOGGER FILESYSTEM SETUP ───────────────────────────────────────────

const LOG_FILE_PATH = path.join(process.cwd(), "src", "data", "builder-audit-logs.json");

function ensureLogFile() {
  const dir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE_PATH)) {
    const initialLogs = [
      { id: "v-1", timestamp: new Date().toLocaleString("tr-TR"), action: "Tasarım Stüdyosu Başlatıldı", user: "Sistem", data: null }
    ];
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(initialLogs, null, 2), "utf8");
  }
}

async function writeAuditLog(action: string, data: any) {
  try {
    ensureLogFile();
    const currentLogs = JSON.parse(fs.readFileSync(LOG_FILE_PATH, "utf8"));
    const newLog = {
      id: `v-${Date.now()}`,
      timestamp: new Date().toLocaleString("tr-TR"),
      action,
      user: "Admin (ETicaret)",
      data
    };
    currentLogs.unshift(newLog);
    // Limit to last 30 versions to avoid bloating
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(currentLogs.slice(0, 30), null, 2), "utf8");
    return newLog;
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
}

// ─── SERVER ACTIONS FOR SITE BUILDER ─────────────────────────────────────────

export async function publishCmsChangesAction(cmsValues: any, pages: any[]) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim. Lütfen admin girişi yapın." };
  }

  try {
    // 1. Validate Branding & SEO with Zod
    const seoParsed = BuilderSeoSchema.safeParse(cmsValues);
    if (!seoParsed.success) {
      return { error: "SEO ayarları doğrulanamadı: " + seoParsed.error.issues.map(e => e.message).join(", ") };
    }

    const themeParsed = BuilderThemeSchema.safeParse(cmsValues);
    if (!themeParsed.success) {
      return { error: "Tema ve stil ayarları doğrulanamadı: " + themeParsed.error.issues.map(e => e.message).join(", ") };
    }

    // 2. Persist Settings (CMSData)
    // Merge values with singleton parameters
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM CMSData WHERE id = 'singleton' LIMIT 1`
    );
    const current = rows && rows.length > 0 ? rows[0] : {};
    const merged = { ...current, ...cmsValues };

    const s = (v: any, fb = '') => (v != null ? String(v) : fb);
    const n = (v: any, fb = 0) => (v != null ? Number(v) : fb);
    const b = (v: any, fb = false) => (v != null ? (v ? 1 : 0) : (fb ? 1 : 0));
    const j = (v: any, fb = '[]') => typeof v === 'string' ? v : JSON.stringify(v ?? JSON.parse(fb));

    const v = [
      /* 1  */ s(merged.heroTitle),
      /* 2  */ s(merged.heroSubtitle),
      /* 3  */ s(merged.buttonText),
      /* 4  */ s(merged.announcement),
      /* 5  */ s(merged.announcement2),
      /* 6  */ b(merged.maintenanceMode),
      /* 7  */ s(merged.siteName, 'PEKEFE Geleneksel & Doğal Lezzetler'),
      /* 8  */ s(merged.primaryColor, '#b45309'),
      /* 9  */ s(merged.secondaryColor, '#1F2937'),
      /* 10 */ s(merged.siteDescription),
      /* 11 */ s(merged.categoryTitle),
      /* 12 */ s(merged.categorySubtitle),
      /* 13 */ s(merged.appTitle),
      /* 14 */ s(merged.appSubtitle),
      /* 15 */ s(merged.contactPhone),
      /* 16 */ s(merged.contactEmail),
      /* 17 */ s(merged.contactAddress),
      /* 18 */ s(merged.socialInstagram),
      /* 19 */ s(merged.socialWhatsapp),
      /* 20 */ s(merged.logoFont, 'Outfit'),
      /* 21 */ s(merged.logoUrl),
      /* 22 */ n(merged.logoSize, 18),
      /* 23 */ s(merged.logoWeight, 'font-black'),
      /* 24 */ s(merged.footerSlogan, 'FABRİKADAN DİREKT'),
      /* 25 */ n(merged.borderRadius, 12),
      /* 26 */ b(merged.announcementActive, true),
      /* 27 */ n(merged.announcementSpeed, 15),
      /* 28 */ s(merged.layoutWidth, 'max-w-4xl'),
      /* 29 */ s(merged.heroAlignment, 'center'),
      /* 30 */ j(merged.pricingRules),
      /* 31 */ n(merged.shippingThreshold, 5000),
      /* 32 */ n(merged.shippingFee, 150),
      /* 33 */ j(merged.shippingCarriers),
      /* 34 */ j(merged.themeTemplates),
      /* 35 */ j(merged.contentAnywhereRules),
      /* 36 */ j(merged.savedSectionTemplates),
      /* 37 */ j(merged.popupConfig, '{}'),
      /* 38 */ s(merged.topBarText1, "Türkiye'nin Her Yerine Güvenli Sevkiyat"),
      /* 39 */ s(merged.topBarText2, '304 Paslanmaz Çelik ve Dayanıklı Tasarım'),
      /* 40 */ j(merged.faqData),
      /* 41 */ s(merged.cartDiscountType, 'none'),
      /* 42 */ n(merged.cartDiscountValue, 0),
      /* 43 */ n(merged.cartDiscountMinAmount, 0),
      /* 44 */ n(merged.bankTransferDiscountRate, 0),
      /* 45 */ s(merged.companyName),
      /* 46 */ s(merged.bankName),
      /* 47 */ s(merged.bankIban),
    ];

    await prisma.$executeRawUnsafe(
      `INSERT INTO CMSData (
        id,
        heroTitle, heroSubtitle, buttonText, announcement, announcement2,
        maintenanceMode, siteName, primaryColor, secondaryColor, siteDescription,
        categoryTitle, categorySubtitle, appTitle, appSubtitle,
        contactPhone, contactEmail, contactAddress, socialInstagram, socialWhatsapp,
        logoFont, logoUrl, logoSize, logoWeight, footerSlogan,
        borderRadius, announcementActive, announcementSpeed, layoutWidth, heroAlignment,
        pricingRules, shippingThreshold, shippingFee, shippingCarriers,
        themeTemplates, contentAnywhereRules, savedSectionTemplates, popupConfig,
        topBarText1, topBarText2, faqData,
        cartDiscountType, cartDiscountValue, cartDiscountMinAmount, bankTransferDiscountRate,
        companyName, bankName, bankIban
      ) VALUES (
        'singleton',
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        heroTitle              = excluded.heroTitle,
        heroSubtitle           = excluded.heroSubtitle,
        buttonText             = excluded.buttonText,
        announcement           = excluded.announcement,
        announcement2          = excluded.announcement2,
        maintenanceMode        = excluded.maintenanceMode,
        siteName               = excluded.siteName,
        primaryColor           = excluded.primaryColor,
        secondaryColor         = excluded.secondaryColor,
        siteDescription        = excluded.siteDescription,
        categoryTitle          = excluded.categoryTitle,
        categorySubtitle       = excluded.categorySubtitle,
        appTitle               = excluded.appTitle,
        appSubtitle            = excluded.appSubtitle,
        contactPhone           = excluded.contactPhone,
        contactEmail           = excluded.contactEmail,
        contactAddress         = excluded.contactAddress,
        socialInstagram        = excluded.socialInstagram,
        socialWhatsapp         = excluded.socialWhatsapp,
        logoFont               = excluded.logoFont,
        logoUrl                = excluded.logoUrl,
        logoSize               = excluded.logoSize,
        logoWeight             = excluded.logoWeight,
        footerSlogan           = excluded.footerSlogan,
        borderRadius           = excluded.borderRadius,
        announcementActive     = excluded.announcementActive,
        announcementSpeed      = excluded.announcementSpeed,
        layoutWidth            = excluded.layoutWidth,
        heroAlignment          = excluded.heroAlignment,
        pricingRules           = excluded.pricingRules,
        shippingThreshold      = excluded.shippingThreshold,
        shippingFee            = excluded.shippingFee,
        shippingCarriers       = excluded.shippingCarriers,
        themeTemplates         = excluded.themeTemplates,
        contentAnywhereRules   = excluded.contentAnywhereRules,
        savedSectionTemplates  = excluded.savedSectionTemplates,
        popupConfig            = excluded.popupConfig,
        topBarText1            = excluded.topBarText1,
        topBarText2            = excluded.topBarText2,
        faqData                = excluded.faqData,
        cartDiscountType       = excluded.cartDiscountType,
        cartDiscountValue      = excluded.cartDiscountValue,
        cartDiscountMinAmount  = excluded.cartDiscountMinAmount,
        bankTransferDiscountRate = excluded.bankTransferDiscountRate,
        companyName            = excluded.companyName,
        bankName               = excluded.bankName,
        bankIban               = excluded.bankIban`,
      ...v
    );

    // 3. Persist Pages Section Blocks Layout JSON
    for (const page of pages) {
      const sectionsStr = typeof page.sections === "string" ? page.sections : JSON.stringify(page.sections || []);
      await prisma.cMSPage.update({
        where: { id: page.id },
        data: { sections: sectionsStr }
      });
    }

    // 4. Log Version in Audit Logger
    await writeAuditLog(
      `Tasarım ve Bölüm Yapılandırması Yayınlandı (Site: ${cmsValues.siteName})`,
      { cmsValues, pageCount: pages.length }
    );

    revalidatePath("/");
    return { success: true, message: "Tüm tasarım değişiklikleri başarıyla yayına alındı!" };
  } catch (error: any) {
    console.error("publishCmsChangesAction error:", error);
    return { error: error.message || "Tasarım kaydedilirken sunucu hatası oluştu." };
  }
}

export async function createBuilderPageAction(name: string, slug: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    const validated = BuilderPageSchema.safeParse({ name, slug });
    if (!validated.success) {
      return { error: validated.error.issues.map(e => e.message).join(", ") };
    }

    const cleanSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newPage = await prisma.cMSPage.create({
      data: {
        name,
        slug: cleanSlug,
        status: "DRAFT",
        sections: JSON.stringify([])
      }
    });

    await writeAuditLog(`Yeni sayfa şablonu oluşturuldu: ${name} (${cleanSlug})`, { pageId: newPage.id });
    
    return { success: true, page: { ...newPage, sections: [] } };
  } catch (error: any) {
    console.error("createBuilderPageAction error:", error);
    return { error: "Sayfa oluşturulamadı. URL adresi benzersiz olmalıdır." };
  }
}

export async function deleteBuilderPageAction(pageId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    const page = await prisma.cMSPage.findUnique({ where: { id: pageId } });
    if (!page) return { error: "Sayfa bulunamadı." };

    await prisma.cMSPage.delete({ where: { id: pageId } });

    await writeAuditLog(`Sayfa şablonu silindi: ${page.name}`, { pageId });
    return { success: true };
  } catch (error: any) {
    console.error("deleteBuilderPageAction error:", error);
    return { error: "Sayfa silinirken hata oluştu." };
  }
}

export async function getBuilderAuditLogs() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    throw new Error("Yetkisiz erişim.");
  }
  ensureLogFile();
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE_PATH, "utf8"));
  } catch {
    return [];
  }
}
