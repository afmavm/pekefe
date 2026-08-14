"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";
import { CmsBrandingSchema, SeoCampaignSchema, CmsPageSectionsSchema } from "./validation";
import { revalidatePath } from "next/cache";

function getFallbackCmsData() {
  return {
    cmsData: {
      id: "singleton",
      siteName: "PEKEFE Geleneksel & Doğal Lezzetler",
      primaryColor: "#b45309",
      secondaryColor: "#1F2937",
      heroTitle: "Erzurum'dan Türkiye'ye yöresel ürünler",
      heroSubtitle: "%100 Yerli İmalat Paslanmaz Arı Körükleri",
      buttonText: "Ürünleri İncele",
      announcement: "Yeni Sezon Körük Modellerimiz Satışta!",
      announcement2: "🔥 %100 Yerli İmalat Paslanmaz Arı Körükleri ve Ekipmanları",
      maintenanceMode: false,
      announcementActive: true,
      announcementSpeed: 15,
      borderRadius: 12,
      layoutWidth: "max-w-7xl",
      heroAlignment: "center",
      faqData: [],
      pricingRules: {},
      shippingThreshold: 5000,
      shippingFee: 150,
      shippingCarriers: [],
      themeTemplates: [],
      contentAnywhereRules: [],
      savedSectionTemplates: [],
      popupConfig: {},
      topBarText1: "Türkiye'nin Her Yerine Güvenli Sevkiyat",
      topBarText2: "304 Paslanmaz Çelik ve Dayanıklı Tasarım",
    },
    pages: [
      { id: "1", name: "Ana Sayfa", slug: "home", status: "published", sections: [], createdAt: new Date(), updatedAt: new Date() },
      { id: "2", name: "Hakkımızda", slug: "about", status: "published", sections: [], createdAt: new Date(), updatedAt: new Date() }
    ]
  };
}

export async function getCmsSettingsAndPages() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized && process.env.NODE_ENV === "production") {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/authOptions");
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return getFallbackCmsData();
      }
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM CMSData WHERE id = 'singleton' LIMIT 1`
    ).catch(() => []);

    let cmsData = null;
    if (rows && rows.length > 0) {
      const row = rows[0];
      row.maintenanceMode = !!row.maintenanceMode;
      row.announcementActive = !!row.announcementActive;

      // Parse JSON fields if they are stringified
      const jsonFields = [
        'pricingRules', 'shippingCarriers', 'themeTemplates',
        'contentAnywhereRules', 'savedSectionTemplates', 'popupConfig', 'faqData'
      ];
      for (const field of jsonFields) {
        if (row[field] && typeof row[field] === 'string') {
          try {
            row[field] = JSON.parse(row[field]);
          } catch(e) {
            row[field] = {};
          }
        }
      }
      cmsData = row;
    }

    const pages = await prisma.cMSPage.findMany().catch(() => []);
    const processedPages = pages.map(p => {
      let sections = [];
      if (p.sections) {
        try {
          sections = typeof p.sections === 'string'
            ? JSON.parse(p.sections)
            : p.sections;
        } catch (e) {}
      }
      return {
        ...p,
        sections
      };
    });

    const fallback = getFallbackCmsData();

    return {
      cmsData: cmsData || fallback.cmsData,
      pages: processedPages.length > 0 ? processedPages : fallback.pages
    };
  } catch (error: any) {
    console.error("getCmsSettingsAndPages error:", error);
    return getFallbackCmsData();
  }
}

export async function updateCmsSettingsAction(values: any) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    // Determine which schema to use based on what data is being updated
    // For general branding values:
    let validatedData: any = {};
    const isBranding = values.primaryColor !== undefined || values.logoFont !== undefined;
    
    if (isBranding) {
      const parsed = CmsBrandingSchema.safeParse({
        siteName: values.siteName,
        primaryColor: values.primaryColor,
        secondaryColor: values.secondaryColor,
        borderRadius: Number(values.borderRadius),
        layoutWidth: values.layoutWidth,
        logoUrl: values.logoUrl,
        logoFont: values.logoFont,
        logoSize: Number(values.logoSize),
        logoWeight: values.logoWeight,
      });
      if (!parsed.success) {
        return { error: "Branding doğrulama hatası: " + parsed.error.issues.map((e: any) => e.message).join(", ") };
      }
      validatedData = parsed.data;
    } else {
      const parsed = SeoCampaignSchema.safeParse({
        siteDescription: values.siteDescription,
        topBarText1: values.topBarText1,
        topBarText2: values.topBarText2,
        announcement: values.announcement,
        announcement2: values.announcement2,
        announcementActive: !!values.announcementActive,
        announcementSpeed: Number(values.announcementSpeed ?? 15),
        shippingThreshold: Number(values.shippingThreshold ?? 5000),
        shippingFee: Number(values.shippingFee ?? 150),
        cartDiscountType: values.cartDiscountType || 'none',
        cartDiscountValue: Number(values.cartDiscountValue ?? 0),
        cartDiscountMinAmount: Number(values.cartDiscountMinAmount ?? 0),
        bankTransferDiscountRate: Number(values.bankTransferDiscountRate ?? 0),
        companyName: values.companyName,
        bankName: values.bankName,
        bankIban: values.bankIban,
        companyStampUrl: values.companyStampUrl || "",
      });
      if (!parsed.success) {
        return { error: "SEO/Kampanya doğrulama hatası: " + parsed.error.issues.map((e: any) => e.message).join(", ") };
      }
      validatedData = parsed.data;
    }

    // Merge with current data from database to satisfy the 47 parameters of $executeRawUnsafe
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM CMSData WHERE id = 'singleton' LIMIT 1`
    );
    const current = rows && rows.length > 0 ? rows[0] : {};

    const merged = { ...current, ...values };

    const s = (v: any, fb = '') => (v != null ? String(v) : fb);
    const n = (v: any, fb = 0) => (v != null ? Number(v) : fb);
    const b = (v: any, fb = false) => (v != null ? (v ? 1 : 0) : (fb ? 1 : 0));
    const j = (v: any, fb = '[]') =>
      typeof v === 'string' ? v : JSON.stringify(v ?? JSON.parse(fb));

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
      /* 48 */ s(merged.companyStampUrl),
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
        companyName, bankName, bankIban, companyStampUrl
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
        ?, ?, ?, ?
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
        bankIban               = excluded.bankIban,
        companyStampUrl        = excluded.companyStampUrl`,
      ...v
    );

    revalidatePath("/");
    return { success: true, message: "CMS ayarları başarıyla güncellendi." };
  } catch (error: any) {
    console.error("updateCmsSettingsAction error:", error);
    return { error: error.message || "Ayarlar kaydedilerken hata oluştu." };
  }
}

export async function updatePageSectionsAction(pageId: string, sections: any[]) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    const validated = CmsPageSectionsSchema.safeParse(sections);
    if (!validated.success) {
      return { error: "Bölüm yapılandırması doğrulanamadı." };
    }

    const sectionsStr = JSON.stringify(validated.data);
    await prisma.cMSPage.update({
      where: { id: pageId },
      data: { sections: sectionsStr }
    });

    revalidatePath("/");
    return { success: true, message: "Sayfa yerleşimi kaydedildi." };
  } catch (error: any) {
    console.error("updatePageSectionsAction error:", error);
    return { error: error.message || "Sayfa yerleşimi güncellenirken hata oluştu." };
  }
}

export async function toggleMaintenanceModeAction(enabled: boolean) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    const maintenanceVal = enabled ? 1 : 0;
    await prisma.$executeRawUnsafe(
      `UPDATE CMSData SET maintenanceMode = ? WHERE id = 'singleton'`,
      maintenanceVal
    );

    revalidatePath("/");
    return { success: true, enabled, message: enabled ? "Site bakım moduna alındı." : "Site yayına alındı." };
  } catch (error: any) {
    console.error("toggleMaintenanceModeAction error:", error);
    return { error: error.message || "Bakım modu değiştirilemedi." };
  }
}

export async function createCmsPageAction(name: string, slug: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    if (!name || !slug) return { error: "Başlık ve URL bilgisi zorunludur." };
    const cleanSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await prisma.cMSPage.create({
      data: {
        name,
        slug: cleanSlug,
        status: "DRAFT",
        sections: JSON.stringify([])
      }
    });

    return { success: true, message: `Yeni sayfa oluşturuldu: ${name}` };
  } catch (error: any) {
    console.error("createCmsPageAction error:", error);
    return { error: "Sayfa oluşturulamadı. URL benzersiz olmalıdır." };
  }
}

export async function deleteCmsPageAction(id: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    await prisma.cMSPage.delete({
      where: { id }
    });
    return { success: true, message: "Sayfa başarıyla silindi." };
  } catch (error: any) {
    console.error("deleteCmsPageAction error:", error);
    return { error: error.message || "Sayfa silinirken hata oluştu." };
  }
}
