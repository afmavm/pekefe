import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

async function ensureCMSDataColumnsExist() {
  const alterQueries = [
    "ALTER TABLE CMSData ADD COLUMN paymentMethodsConfig LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN paytrConfig LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN installmentsConfig LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN cashOnDeliveryFee DOUBLE NOT NULL DEFAULT 25",
    "ALTER TABLE CMSData ADD COLUMN cashOnDeliveryEnabled TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE CMSData ADD COLUMN minOrderAmountForOpenAccount DOUBLE NOT NULL DEFAULT 500",
    "ALTER TABLE CMSData ADD COLUMN openAccountDaysLimit INT NOT NULL DEFAULT 30",
    "ALTER TABLE CMSData ADD COLUMN preventZeroStockSale TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN defaultCriticalStockLimit INT NOT NULL DEFAULT 5",
    "ALTER TABLE CMSData ADD COLUMN topBarItems LONGTEXT NULL"

  ];

  for (const q of alterQueries) {
    try {
      await prisma.$executeRawUnsafe(q);
    } catch (e) {
      // Column already exists, ignore
    }
  }
}

export async function GET() {
  try {
    // Always ensure new columns exist in MySQL before any Prisma operation
    await ensureCMSDataColumnsExist();

    const row = await prisma.cMSData.findUnique({
      where: { id: 'singleton' }
    });

    if (!row) return NextResponse.json(null);


    // Convert boolean values to actual booleans
    row.maintenanceMode = !!row.maintenanceMode;
    row.announcementActive = !!row.announcementActive;
    row.dealSectionActive = !!row.dealSectionActive;

    row.companySalesKdvIncluded = !!row.companySalesKdvIncluded;
    row.companyPurchaseKdvIncluded = !!row.companyPurchaseKdvIncluded;
    row.companyAutoSendEarsivMail = !!row.companyAutoSendEarsivMail;
    row.companyUsePaymentPlan = !!row.companyUsePaymentPlan;
    row.companyAutoUpdatePriceByMargin = !!row.companyAutoUpdatePriceByMargin;
    row.companyUseCurrencyInPurchase = !!row.companyUseCurrencyInPurchase;
    row.companyAutoDeductInstallments = !!row.companyAutoDeductInstallments;
    row.companyUseRowRateInPurchase = !!row.companyUseRowRateInPurchase;
    row.companyCheckCurrentVkn = !!row.companyCheckCurrentVkn;
    row.cashOnDeliveryEnabled = !!row.cashOnDeliveryEnabled;

    return NextResponse.json(row);
  } catch (error) {
    console.error('Error fetching CMS settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    // Always ensure new columns exist in MySQL before any Prisma operation
    await ensureCMSDataColumnsExist();

    // ─── SERVER-SIDE SETTINGS VALIDATION ────────────────────────────────────
    if (body.siteName !== undefined) {
      if (!body.siteName || typeof body.siteName !== "string" || !body.siteName.trim()) {
        return NextResponse.json({ error: "Site adı boş bırakılamaz." }, { status: 400 });
      }
      if (body.siteName.length > 80) {
        return NextResponse.json({ error: "Site adı en fazla 80 karakter olmalıdır." }, { status: 400 });
      }
    }

    if (body.siteDescription !== undefined && typeof body.siteDescription === "string") {
      if (body.siteDescription.length > 200) {
        return NextResponse.json({ error: "Site açıklaması en fazla 200 karakter olmalıdır." }, { status: 400 });
      }
    }

    if (body.contactEmail !== undefined && typeof body.contactEmail === "string" && body.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contactEmail)) {
        return NextResponse.json({ error: "Geçerli bir e-posta adresi giriniz." }, { status: 400 });
      }
    }

    if (body.contactPhone !== undefined && typeof body.contactPhone === "string" && body.contactPhone.trim()) {
      const phoneRegex = /^[0-9+\s().-]{7,20}$/;
      if (!phoneRegex.test(body.contactPhone)) {
        return NextResponse.json({ error: "Geçerli bir telefon numarası giriniz." }, { status: 400 });
      }
    }

    if (body.contactAddress !== undefined && typeof body.contactAddress === "string" && body.contactAddress.trim()) {
      if (body.contactAddress.length < 10) {
        return NextResponse.json({ error: "Adres en az 10 karakter olmalıdır." }, { status: 400 });
      }
    }

    const existing = await prisma.cMSData.findUnique({
      where: { id: 'singleton' }
    }) || {} as any;

    const getVal = (key: string, type: 'string' | 'number' | 'boolean' | 'json', fb: any) => {
      let val: any = undefined;
      if (body[key] !== undefined && body[key] !== null) {
        val = body[key];
      } else if (existing[key] !== undefined && existing[key] !== null) {
        val = existing[key];
      } else {
        val = fb;
      }

      if (type === 'string') {
        const s = val != null ? String(val) : '';
        return s.trim() !== '' ? s : fb;
      }
      if (type === 'number') {
        const n = Number(val);
        return isNaN(n) ? (typeof fb === 'number' ? fb : 0) : n;
      }
      if (type === 'boolean') return typeof val === 'boolean' ? val : !!val;
      if (type === 'json') {
        if (val === null || val === undefined) return fb;
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return fb;
          }
        }
        return val ?? fb;
      }
      return val ?? fb;
    };

    const data = {
      heroTitle: getVal('heroTitle', 'string', 'PEKEFE Geleneksel & Doğal Lezzetler'),
      heroSubtitle: getVal('heroSubtitle', 'string', 'İspir Fasulyesi, Erzurum Göğermiş Peyniri ve Doğal Yöresel Lezzetler'),
      buttonText: getVal('buttonText', 'string', 'Hemen Alışverişe Başla'),
      announcement: getVal('announcement', 'string', '🔥 5000 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!'),
      announcement2: getVal('announcement2', 'string', '🔥 %100 Yerli İmalat Paslanmaz Arı Körükleri ve Ekipmanları'),
      maintenanceMode: getVal('maintenanceMode', 'boolean', false),
      siteName: getVal('siteName', 'string', 'PEKEFE Geleneksel & Doğal Lezzetler'),
      primaryColor: getVal('primaryColor', 'string', '#b45309'),
      secondaryColor: getVal('secondaryColor', 'string', '#1F2937'),
      siteDescription: getVal('siteDescription', 'string', ''),
      categoryTitle: getVal('categoryTitle', 'string', ''),
      categorySubtitle: getVal('categorySubtitle', 'string', ''),
      appTitle: getVal('appTitle', 'string', ''),
      appSubtitle: getVal('appSubtitle', 'string', ''),
      contactPhone: getVal('contactPhone', 'string', ''),
      contactEmail: getVal('contactEmail', 'string', ''),
      contactAddress: getVal('contactAddress', 'string', ''),
      socialInstagram: getVal('socialInstagram', 'string', ''),
      socialWhatsapp: getVal('socialWhatsapp', 'string', ''),
      socialFacebook: getVal('socialFacebook', 'string', ''),
      socialYoutube: getVal('socialYoutube', 'string', ''),
      logoFont: getVal('logoFont', 'string', 'Outfit'),
      logoUrl: getVal('logoUrl', 'string', ''),
      logoSize: getVal('logoSize', 'number', 18),
      logoWeight: getVal('logoWeight', 'string', 'font-black'),
      footerSlogan: getVal('footerSlogan', 'string', 'FABRİKADAN DİREKT'),
      borderRadius: getVal('borderRadius', 'number', 12),
      announcementActive: getVal('announcementActive', 'boolean', true),
      announcementSpeed: getVal('announcementSpeed', 'number', 15),
      layoutWidth: getVal('layoutWidth', 'string', 'max-w-4xl'),
      heroAlignment: getVal('heroAlignment', 'string', 'center'),
      pricingRules: getVal('pricingRules', 'json', []),
      shippingThreshold: getVal('shippingThreshold', 'number', 5000),
      shippingFee: getVal('shippingFee', 'number', 150),
      shippingCarriers: getVal('shippingCarriers', 'json', []),
      themeTemplates: getVal('themeTemplates', 'json', []),
      contentAnywhereRules: getVal('contentAnywhereRules', 'json', []),
      savedSectionTemplates: getVal('savedSectionTemplates', 'json', []),
      popupConfig: getVal('popupConfig', 'json', {}),
      topBarText1: getVal('topBarText1', 'string', "Türkiye'nin Her Yerine Güvenli Sevkiyat"),
      topBarText2: getVal('topBarText2', 'string', '304 Paslanmaz Çelik ve Dayanıklı Tasarım'),
      topBarItems: (() => {
        const raw = getVal('topBarItems', 'string', '[]');
        if (typeof raw === 'string') return raw;
        try { return JSON.stringify(raw); } catch { return '[]'; }
      })(),

      faqData: getVal('faqData', 'json', []),

      cartDiscountType: getVal('cartDiscountType', 'string', 'none'),
      cartDiscountValue: getVal('cartDiscountValue', 'number', 0),
      cartDiscountMinAmount: getVal('cartDiscountMinAmount', 'number', 0),
      bankTransferDiscountRate: getVal('bankTransferDiscountRate', 'number', 0),
      companyName: getVal('companyName', 'string', ''),
      bankName: getVal('bankName', 'string', ''),
      bankIban: getVal('bankIban', 'string', ''),
      efaturaPrefix: getVal('efaturaPrefix', 'string', 'GIB'),
      earsivPrefix: getVal('earsivPrefix', 'string', 'EAR'),
      footerText: getVal('footerText', 'string', '© 2026 PEKEFE Geleneksel & Doğal Lezzetler. Tüm Hakları Saklıdır.'),
      mapCoordinates: getVal('mapCoordinates', 'string', ''),
      dealSectionActive: getVal('dealSectionActive', 'boolean', false),
      // dealProductIds schema.prisma'da String tipi, JSON.stringify ile saklanmalı
      dealProductIds: (() => {
        const raw = getVal('dealProductIds', 'json', []);
        if (typeof raw === 'string') return raw;
        try { return JSON.stringify(raw); } catch { return '[]'; }
      })(),
      
      companyOwnerName: getVal('companyOwnerName', 'string', ''),
      companyOwnerSurname: getVal('companyOwnerSurname', 'string', ''),
      companyTaxNo: getVal('companyTaxNo', 'string', ''),
      companyTaxOffice: getVal('companyTaxOffice', 'string', ''),
      companyFax: getVal('companyFax', 'string', ''),
      companyGsm: getVal('companyGsm', 'string', ''),
      companyKepAddress: getVal('companyKepAddress', 'string', ''),
      companyMersisNo: getVal('companyMersisNo', 'string', ''),
      companySicilNo: getVal('companySicilNo', 'string', ''),
      companyRegion: getVal('companyRegion', 'string', ''),
      companyCountry: getVal('companyCountry', 'string', ''),
      companyCity: getVal('companyCity', 'string', ''),
      companyDistrict: getVal('companyDistrict', 'string', ''),
      companyBuildingName: getVal('companyBuildingName', 'string', ''),
      companyBuildingNo: getVal('companyBuildingNo', 'string', ''),
      companyStreet: getVal('companyStreet', 'string', ''),
      companyPostalCode: getVal('companyPostalCode', 'string', ''),
      companyWebsite: getVal('companyWebsite', 'string', ''),

      companyDefaultKdv: getVal('companyDefaultKdv', 'number', 20),
      companyDefaultUnit: getVal('companyDefaultUnit', 'string', 'Adet'),
      companyDefaultReturnDays: getVal('companyDefaultReturnDays', 'number', 30),
      companySalesKdvIncluded: getVal('companySalesKdvIncluded', 'boolean', true),
      companyPurchaseKdvIncluded: getVal('companyPurchaseKdvIncluded', 'boolean', true),
      companyDefaultLanguages: getVal('companyDefaultLanguages', 'string', ''),
      companyExcludedChars: getVal('companyExcludedChars', 'string', ''),
      companyDefaultTevkifatCode: getVal('companyDefaultTevkifatCode', 'string', ''),
      companyListStartDay: getVal('companyListStartDay', 'number', 15),

      companyAutoSendEarsivMail: getVal('companyAutoSendEarsivMail', 'boolean', true),
      companyUsePaymentPlan: getVal('companyUsePaymentPlan', 'boolean', true),
      companyAutoUpdatePriceByMargin: getVal('companyAutoUpdatePriceByMargin', 'boolean', true),
      companyUseCurrencyInPurchase: getVal('companyUseCurrencyInPurchase', 'boolean', true),
      companyAutoDeductInstallments: getVal('companyAutoDeductInstallments', 'boolean', true),
      companyUseRowRateInPurchase: getVal('companyUseRowRateInPurchase', 'boolean', false),
      companyCheckCurrentVkn: getVal('companyCheckCurrentVkn', 'boolean', true),

      companyInvoiceFooter: getVal('companyInvoiceFooter', 'string', ''),
      companyStampUrl: getVal('companyStampUrl', 'string', ''),

      // Odeme Yontemi & Stok Ayarlari
      paymentMethodsConfig: getVal('paymentMethodsConfig', 'string', '[]'),
      paytrConfig: getVal('paytrConfig', 'string', '{}'),
      installmentsConfig: getVal('installmentsConfig', 'string', '[]'),
      cashOnDeliveryFee: getVal('cashOnDeliveryFee', 'number', 25),
      cashOnDeliveryEnabled: getVal('cashOnDeliveryEnabled', 'boolean', false),
      minOrderAmountForOpenAccount: getVal('minOrderAmountForOpenAccount', 'number', 500),
      openAccountDaysLimit: getVal('openAccountDaysLimit', 'number', 30),
      preventZeroStockSale: getVal('preventZeroStockSale', 'boolean', true),
      defaultCriticalStockLimit: getVal('defaultCriticalStockLimit', 'number', 5),
    };

    const saved = await prisma.cMSData.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        ...data
      }
    });

    saved.maintenanceMode = !!saved.maintenanceMode;
    saved.announcementActive = !!saved.announcementActive;
    saved.dealSectionActive = !!saved.dealSectionActive;

    saved.companySalesKdvIncluded = !!saved.companySalesKdvIncluded;
    saved.companyPurchaseKdvIncluded = !!saved.companyPurchaseKdvIncluded;
    saved.companyAutoSendEarsivMail = !!saved.companyAutoSendEarsivMail;
    saved.companyUsePaymentPlan = !!saved.companyUsePaymentPlan;
    saved.companyAutoUpdatePriceByMargin = !!saved.companyAutoUpdatePriceByMargin;
    saved.companyUseCurrencyInPurchase = !!saved.companyUseCurrencyInPurchase;
    saved.companyAutoDeductInstallments = !!saved.companyAutoDeductInstallments;
    saved.companyUseRowRateInPurchase = !!saved.companyUseRowRateInPurchase;
    saved.companyCheckCurrentVkn = !!saved.companyCheckCurrentVkn;
    saved.cashOnDeliveryEnabled = !!saved.cashOnDeliveryEnabled;

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('CRITICAL ERROR UPDATING CMS SETTINGS:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
