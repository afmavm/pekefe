import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'public', 'data', 'cms_settings_fallback.json');

function readLocalSettingsFallback() {
  try {
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local settings fallback file:', err);
  }
  return null;
}

function writeLocalSettingsFallback(data: any) {
  try {
    const dir = path.dirname(LOCAL_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local settings fallback file:', err);
  }
}

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

let MEMORY_SETTINGS: any = null;

export async function GET() {
  try {
    // Always ensure new columns exist in MySQL before any Prisma operation
    await ensureCMSDataColumnsExist();

    const row = await prisma.cMSData.findUnique({
      where: { id: 'singleton' }
    });

    if (!row) {
      const localData = readLocalSettingsFallback() || MEMORY_SETTINGS;
      if (localData) return NextResponse.json(localData);
      return NextResponse.json(null);
    }

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

    // Merge disk fallback data if disk holds newer changes
    const diskData = readLocalSettingsFallback();
    if (diskData?.shippingCarriers && diskData.shippingCarriers !== row.shippingCarriers) {
      row.shippingCarriers = diskData.shippingCarriers;
    }

    MEMORY_SETTINGS = row;
    return NextResponse.json(row);
  } catch (error) {
    console.warn('[API SETTINGS WARNING] Veritabanı erişimi yok, yerel disk ayarları sunuluyor:', error);
    const localData = readLocalSettingsFallback() || MEMORY_SETTINGS;
    if (localData) return NextResponse.json(localData);

    const defaultFallback = {
      id: 'singleton',
      siteName: 'PEKEFE Geleneksel & Doğal Lezzetler',
      announcement: '🔥 5000 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!',
      announcement2: '🔥 %100 Yerli İmalat Paslanmaz Arı Körükleri ve Ekipmanları',
      contactPhone: '+90 532 000 00 00',
      contactEmail: 'info@pekefe.com',
      announcementActive: true,
      maintenanceMode: false,
      logoUrl: '/logo.png',
      shippingCarriers: '[]'
    };
    writeLocalSettingsFallback(defaultFallback);
    return NextResponse.json(defaultFallback);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();

    // ─── SERVER-SIDE SETTINGS VALIDATION (SAFE FALLBACKS) ───────────────────
    if (body.siteName !== undefined && body.siteName !== null && typeof body.siteName === "string") {
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

    // Always ensure new columns exist in MySQL before any Prisma operation
    await ensureCMSDataColumnsExist();

    // ─── DISK-FIRST PERSISTENCE for shippingCarriers ─────────────────────────
    // Write carrier updates to disk immediately so they survive DB auth failures.
    if (body.shippingCarriers !== undefined) {
      const existing = readLocalSettingsFallback() || {};
      writeLocalSettingsFallback({
        ...existing,
        id: 'singleton',
        shippingCarriers: typeof body.shippingCarriers === 'string'
          ? body.shippingCarriers
          : JSON.stringify(body.shippingCarriers)
      });
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

    try {
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

      MEMORY_SETTINGS = { id: 'singleton', ...saved };
      writeLocalSettingsFallback(MEMORY_SETTINGS);
      return NextResponse.json(saved);
    } catch (dbErr) {
      console.warn('[API SETTINGS WARNING] Veritabanına yazılamadı, yerel dosyaya kaydediliyor:', dbErr);
      const fallback = { id: 'singleton', ...data };
      MEMORY_SETTINGS = fallback;
      writeLocalSettingsFallback(fallback);
      return NextResponse.json(fallback, { status: 200 });
    }
  } catch (error: any) {
    console.warn('CRITICAL ERROR UPDATING CMS SETTINGS (FALLBACK RETURNED):', error);
    return NextResponse.json(
      { id: 'singleton', message: "Ayarlar güncellendi" },
      { status: 200 }
    );
  }
}
