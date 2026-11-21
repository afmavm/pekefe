import { NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

import fs from 'fs';
import path from 'path';

import { jsonNoCache } from '@/lib/noCacheResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'public', 'data', 'cms_settings_fallback.json');

function cleanMockCarriers(rawCarriers: any): string {
  if (!rawCarriers) return "[]";
  let list: any[] = [];
  try {
    list = typeof rawCarriers === "string" ? JSON.parse(rawCarriers) : (Array.isArray(rawCarriers) ? rawCarriers : []);
  } catch {
    list = [];
  }
  if (!Array.isArray(list)) return "[]";

  const filtered = list.filter((c: any) => {
    if (!c) return false;
    if (c.id === "yurtici" && c.fallbackFee === 150 && c.freeThreshold === 5000) return false;
    if (c.id === "aras" && c.fallbackFee === 140 && c.freeThreshold === 5000) return false;
    if (c.id === "mng" && c.fallbackFee === 130 && c.freeThreshold === 4000) return false;
    return true;
  });

  return JSON.stringify(filtered);
}

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

let CMS_COLUMNS_ENSURED = false;

const CMS_BOOL_FIELDS = new Set([
  'maintenanceMode',
  'announcementActive',
  'announcement1Enabled',
  'announcement2Enabled',
  'contactPhoneEnabled',
  'socialWhatsappEnabled',
  'companySalesKdvIncluded',
  'companyPurchaseKdvIncluded',
  'companyAutoSendEarsivMail',
  'companyUsePaymentPlan',
  'companyAutoUpdatePriceByMargin',
  'companyUseCurrencyInPurchase',
  'companyAutoDeductInstallments',
  'companyUseRowRateInPurchase',
  'companyCheckCurrentVkn',
  'dealSectionActive',
  'cashOnDeliveryEnabled',
  'preventZeroStockSale',
]);

const CMS_NUM_FIELDS = new Set([
  'logoSize',
  'borderRadius',
  'announcementSpeed',
  'shippingThreshold',
  'shippingFee',
  'cartDiscountValue',
  'cartDiscountMinAmount',
  'bankTransferDiscountRate',
  'companyDefaultKdv',
  'companyDefaultReturnDays',
  'companyListStartDay',
  'cashOnDeliveryFee',
  'minOrderAmountForOpenAccount',
  'openAccountDaysLimit',
  'defaultCriticalStockLimit',
]);

const CMS_JSON_FIELDS = new Set([
  'pricingRules',
  'shippingCarriers',
  'themeTemplates',
  'contentAnywhereRules',
  'savedSectionTemplates',
  'popupConfig',
  'topBarItems',
  'faqData',
  'dealProductIds',
  'paymentMethodsConfig',
  'paytrConfig',
  'installmentsConfig',
]);

const CMS_STRING_FIELDS = new Set([
  'heroTitle',
  'heroSubtitle',
  'buttonText',
  'announcement',
  'announcement2',
  'siteName',
  'primaryColor',
  'secondaryColor',
  'siteDescription',
  'categoryTitle',
  'categorySubtitle',
  'appTitle',
  'appSubtitle',
  'contactPhone',
  'contactEmail',
  'contactAddress',
  'socialInstagram',
  'socialWhatsapp',
  'socialFacebook',
  'socialYoutube',
  'logoFont',
  'logoUrl',
  'logoWeight',
  'footerSlogan',
  'layoutWidth',
  'heroAlignment',
  'topBarText1',
  'topBarText2',
  'cartDiscountType',
  'companyName',
  'bankName',
  'bankIban',
  'efaturaPrefix',
  'earsivPrefix',
  'companyStampUrl',
  'companyOwnerName',
  'companyOwnerSurname',
  'companyTaxNo',
  'companyTaxOffice',
  'companyFax',
  'companyGsm',
  'companyKepAddress',
  'companyMersisNo',
  'companySicilNo',
  'companyRegion',
  'companyCountry',
  'companyCity',
  'companyDistrict',
  'companyBuildingName',
  'companyBuildingNo',
  'companyStreet',
  'companyPostalCode',
  'companyWebsite',
  'companyDefaultUnit',
  'companyDefaultLanguages',
  'companyExcludedChars',
  'companyDefaultTevkifatCode',
  'companyInvoiceFooter',
  'footerText',
  'mapCoordinates',
]);

function toBool(val: any, fallback = false): boolean {
  if (val === undefined || val === null) return fallback;
  return val === true || val === 'true' || val === 1 || val === '1';
}

async function ensureCMSDataColumnsExist() {
  if (CMS_COLUMNS_ENSURED) return;
  const alterQueries = [
    "ALTER TABLE CMSData ADD COLUMN announcementActive TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN paymentMethodsConfig LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN paytrConfig LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN installmentsConfig LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN cashOnDeliveryFee DOUBLE NOT NULL DEFAULT 25",
    "ALTER TABLE CMSData ADD COLUMN cashOnDeliveryEnabled TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE CMSData ADD COLUMN minOrderAmountForOpenAccount DOUBLE NOT NULL DEFAULT 500",
    "ALTER TABLE CMSData ADD COLUMN openAccountDaysLimit INT NOT NULL DEFAULT 30",
    "ALTER TABLE CMSData ADD COLUMN preventZeroStockSale TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN defaultCriticalStockLimit INT NOT NULL DEFAULT 5",
    "ALTER TABLE CMSData ADD COLUMN topBarItems LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN dealSectionActive TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE CMSData ADD COLUMN dealProductIds LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN announcement1Enabled TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN announcement2Enabled TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN contactPhoneEnabled TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN socialWhatsappEnabled TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN shippingCarriers LONGTEXT NULL",
    "ALTER TABLE CMSData MODIFY COLUMN companyInvoiceFooter LONGTEXT NULL",
    "ALTER TABLE CMSData MODIFY COLUMN contactAddress TEXT NULL",
    "ALTER TABLE CMSData MODIFY COLUMN siteDescription TEXT NULL",
    "ALTER TABLE CMSData MODIFY COLUMN footerText TEXT NULL",
    "ALTER TABLE CMSData MODIFY COLUMN announcement TEXT NULL",
    "ALTER TABLE CMSData MODIFY COLUMN announcement2 TEXT NULL"
  ];

  try {
    const alterPromise = (async () => {
      for (const q of alterQueries) {
        try { await prisma.$executeRawUnsafe(q); } catch (e) {}
      }
      CMS_COLUMNS_ENSURED = true;
    })();
    await withTimeout(alterPromise, 1500, null as any);
  } catch (e) {}
}

let MEMORY_SETTINGS: any = null;

export async function GET() {
  try {
    await ensureCMSDataColumnsExist();

    let dbRow: any = null;
    try {
      const selectPromise = prisma.$queryRawUnsafe(`SELECT * FROM CMSData WHERE id = 'singleton' LIMIT 1`);
      const rows: any[] = await withTimeout(selectPromise, 1500, null as any);
      if (rows && rows.length > 0) {
        dbRow = rows[0];
      }
    } catch {}

    const diskData = readLocalSettingsFallback();

    if (!dbRow && !diskData) {
      const defaultFallback = {
        id: 'singleton',
        siteName: 'PEKEFE Geleneksel & Doğal Lezzetler',
        announcement: '🔥 5000 TL ve Üzeri Alışverişlerde Kargo Ücretsiz!',
        announcement2: '🔥 %100 Yerli İmalat Paslanmaz Arı Körükleri ve Ekipmanları',
        contactPhone: '+90 532 000 00 00',
        contactEmail: 'info@pekefe.com',
        announcementActive: true,
        announcement1Enabled: true,
        announcement2Enabled: true,
        contactPhoneEnabled: true,
        socialWhatsappEnabled: true,
        maintenanceMode: false,
        logoUrl: '/logo.png',
        shippingCarriers: '[]'
      };
      writeLocalSettingsFallback(defaultFallback);
      return NextResponse.json(defaultFallback);
    }

    // MySQL (dbRow) is the primary source of truth; diskData fills in missing fields
    const merged: any = { ...(diskData || {}), ...(dbRow || {}) };
    if (dbRow?.shippingCarriers !== undefined && dbRow?.shippingCarriers !== null && dbRow?.shippingCarriers !== '') {
      merged.shippingCarriers = dbRow.shippingCarriers;
    }

    // Normalize all MySQL TINYINT(1) boolean columns to JS booleans
    for (const bf of CMS_BOOL_FIELDS) {
      if (merged[bf] !== undefined && merged[bf] !== null) {
        merged[bf] = toBool(merged[bf], false);
      }
    }

    if (diskData && diskData.announcementActive !== undefined && dbRow?.announcementActive === undefined) {
      merged.announcementActive = toBool(diskData.announcementActive, true);
    }

    merged.shippingCarriers = cleanMockCarriers(merged.shippingCarriers);

    // Ensure paytrConfig reflects live mode when PAYTR_TEST_MODE="0"
    if (merged.paytrConfig) {
      try {
        const parsedPaytr = typeof merged.paytrConfig === 'string' ? JSON.parse(merged.paytrConfig) : merged.paytrConfig;
        if (process.env.PAYTR_TEST_MODE === '0' && parsedPaytr.testMode === true && (!diskData?.paytrConfig || JSON.parse(diskData.paytrConfig).testMode === false)) {
          parsedPaytr.testMode = false;
        }
        merged.paytrConfig = JSON.stringify(parsedPaytr);
      } catch {}
    } else {
      merged.paytrConfig = JSON.stringify({
        merchantId: process.env.PAYTR_MERCHANT_ID || '735518',
        merchantKey: process.env.PAYTR_MERCHANT_KEY || 'wQkmEkdf5NDCEnWg',
        merchantSalt: process.env.PAYTR_MERCHANT_SALT || 'AuK7HXRb7NrbyZzw',
        testMode: process.env.PAYTR_TEST_MODE === '1',
      });
    }

    MEMORY_SETTINGS = merged;
    return jsonNoCache(merged);
  } catch (error) {
    const localData = readLocalSettingsFallback() || MEMORY_SETTINGS;
    return jsonNoCache(localData || {});
  }
}

export async function PUT(req: Request) {
  try {
    await ensureCMSDataColumnsExist();
    const body = await req.json();

    let existing: any = readLocalSettingsFallback() || {};
    try {
      const rows: any[] = await withTimeout(
        prisma.$queryRawUnsafe(`SELECT * FROM CMSData WHERE id = 'singleton' LIMIT 1`),
        1500,
        [] as any[]
      );
      if (rows && rows.length > 0) {
        existing = { ...rows[0], ...existing };
      }
    } catch {}

    const data: any = {
      ...existing,
      ...body
    };

    // Explicitly process boolean toggles
    data.announcementActive = body.announcementActive !== undefined
      ? toBool(body.announcementActive, true)
      : toBool(existing.announcementActive, true);
    data.announcement1Enabled = body.announcement1Enabled !== undefined
      ? toBool(body.announcement1Enabled, true)
      : toBool(existing.announcement1Enabled, true);
    data.announcement2Enabled = body.announcement2Enabled !== undefined
      ? toBool(body.announcement2Enabled, true)
      : toBool(existing.announcement2Enabled, true);
    data.contactPhoneEnabled = body.contactPhoneEnabled !== undefined
      ? toBool(body.contactPhoneEnabled, true)
      : toBool(existing.contactPhoneEnabled, true);
    data.socialWhatsappEnabled = body.socialWhatsappEnabled !== undefined
      ? toBool(body.socialWhatsappEnabled, true)
      : toBool(existing.socialWhatsappEnabled, true);

    // Save to memory and disk fallback FIRST!
    MEMORY_SETTINGS = data;
    writeLocalSettingsFallback(data);

    // Persist ALL whitelisted CMSData columns to MySQL safely via parameterized Raw SQL
    try {
      const setClauses: string[] = [];
      const params: any[] = [];

      const keysToPersist = new Set<string>(Object.keys(body || {}));
      // Always include normalized announcement/topbar toggles
      for (const k of ['announcementActive', 'announcement1Enabled', 'announcement2Enabled', 'contactPhoneEnabled', 'socialWhatsappEnabled']) {
        if (body[k] !== undefined) keysToPersist.add(k);
      }

      for (const key of keysToPersist) {
        if (key === 'id') continue;
        const val = data[key];
        if (val === undefined) continue;

        if (CMS_BOOL_FIELDS.has(key)) {
          setClauses.push(`\`${key}\` = ?`);
          params.push(toBool(val, false) ? 1 : 0);
        } else if (CMS_NUM_FIELDS.has(key)) {
          const num = Number(val);
          if (Number.isFinite(num)) {
            setClauses.push(`\`${key}\` = ?`);
            params.push(num);
          }
        } else if (CMS_JSON_FIELDS.has(key)) {
          setClauses.push(`\`${key}\` = ?`);
          params.push(typeof val === 'string' ? val : JSON.stringify(val ?? (key === 'paytrConfig' || key === 'pricingRules' || key === 'themeTemplates' || key === 'contentAnywhereRules' || key === 'popupConfig' ? {} : [])));
        } else if (CMS_STRING_FIELDS.has(key)) {
          setClauses.push(`\`${key}\` = ?`);
          params.push(val === null ? '' : String(val));
        }
      }

      // Ensure singleton row exists
      const existingCheck: any[] = await withTimeout(
        prisma.$queryRawUnsafe(`SELECT id FROM CMSData WHERE id = 'singleton' LIMIT 1`),
        2000,
        [] as any[]
      );

      if (!existingCheck || existingCheck.length === 0) {
        await withTimeout(
          prisma.cMSData.upsert({
            where: { id: 'singleton' },
            update: {},
            create: {
              id: 'singleton',
              heroTitle: data.heroTitle || 'PEKEFE Geleneksel & Doğal Lezzetler',
              heroSubtitle: data.heroSubtitle || 'İspir’in bereketli topraklarından doğal lezzetler',
              buttonText: data.buttonText || 'Ürünleri Keşfet',
              announcement: data.announcement || '',
              announcement2: data.announcement2 || '',
              contactPhone: data.contactPhone || '',
              socialWhatsapp: data.socialWhatsapp || '',
              pricingRules: {},
              shippingCarriers: [],
              themeTemplates: {},
              contentAnywhereRules: {},
              savedSectionTemplates: [],
              popupConfig: {},
              faqData: [],
            },
          }),
          3000,
          null as any
        );
      }

      if (setClauses.length > 0) {
        await withTimeout(
          prisma.$executeRawUnsafe(
            `UPDATE CMSData SET ${setClauses.join(', ')} WHERE id = 'singleton'`,
            ...params
          ),
          4000,
          0 as any
        );
      }
    } catch (dbErr) {
      console.error('[API SETTINGS ERROR] MySQL save failed:', dbErr);
      return NextResponse.json({ error: 'Veritabanına kayıt sırasında hata oluştu.' }, { status: 500 });
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRITICAL ERROR UPDATING CMS SETTINGS:', error);
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }
}
