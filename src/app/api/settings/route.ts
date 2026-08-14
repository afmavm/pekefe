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
    "ALTER TABLE CMSData ADD COLUMN topBarItems LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN dealSectionActive TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE CMSData ADD COLUMN dealProductIds LONGTEXT NULL",
    "ALTER TABLE CMSData ADD COLUMN announcement1Enabled TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN announcement2Enabled TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN contactPhoneEnabled TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE CMSData ADD COLUMN socialWhatsappEnabled TINYINT(1) NOT NULL DEFAULT 1"
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
    await ensureCMSDataColumnsExist();

    let dbRow: any = null;
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM CMSData WHERE id = 'singleton' LIMIT 1`);
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

    const merged = { ...dbRow, ...diskData };

    merged.announcementActive = merged.announcementActive === true || merged.announcementActive === "true" || merged.announcementActive === 1;
    merged.announcement1Enabled = merged.announcement1Enabled !== false && merged.announcement1Enabled !== "false" && merged.announcement1Enabled !== 0;
    merged.announcement2Enabled = merged.announcement2Enabled !== false && merged.announcement2Enabled !== "false" && merged.announcement2Enabled !== 0;
    merged.contactPhoneEnabled = merged.contactPhoneEnabled !== false && merged.contactPhoneEnabled !== "false" && merged.contactPhoneEnabled !== 0;
    merged.socialWhatsappEnabled = merged.socialWhatsappEnabled !== false && merged.socialWhatsappEnabled !== "false" && merged.socialWhatsappEnabled !== 0;

    MEMORY_SETTINGS = merged;
    return NextResponse.json(merged);
  } catch (error) {
    const localData = readLocalSettingsFallback() || MEMORY_SETTINGS;
    return NextResponse.json(localData || {});
  }
}

export async function PUT(req: Request) {
  try {
    await ensureCMSDataColumnsExist();
    const body = await req.json();

    let existing: any = readLocalSettingsFallback() || {};
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM CMSData WHERE id = 'singleton' LIMIT 1`);
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
      ? (body.announcementActive === true || body.announcementActive === "true" || body.announcementActive === 1) 
      : (existing.announcementActive === true || existing.announcementActive === "true" || existing.announcementActive === 1);

    data.announcement1Enabled = body.announcement1Enabled !== undefined 
      ? (body.announcement1Enabled === true || body.announcement1Enabled === "true" || body.announcement1Enabled === 1) 
      : (existing.announcement1Enabled !== false);

    data.announcement2Enabled = body.announcement2Enabled !== undefined 
      ? (body.announcement2Enabled === true || body.announcement2Enabled === "true" || body.announcement2Enabled === 1) 
      : (existing.announcement2Enabled !== false);

    data.contactPhoneEnabled = body.contactPhoneEnabled !== undefined 
      ? (body.contactPhoneEnabled === true || body.contactPhoneEnabled === "true" || body.contactPhoneEnabled !== 0) 
      : (existing.contactPhoneEnabled !== false);

    data.socialWhatsappEnabled = body.socialWhatsappEnabled !== undefined 
      ? (body.socialWhatsappEnabled === true || body.socialWhatsappEnabled === "true" || body.socialWhatsappEnabled !== 0) 
      : (existing.socialWhatsappEnabled !== false);

    // Save to memory and disk fallback FIRST!
    MEMORY_SETTINGS = data;
    writeLocalSettingsFallback(data);

    // Persist to DB safely via Raw SQL
    try {
      const annAct = data.announcementActive ? 1 : 0;
      const ann1En = data.announcement1Enabled ? 1 : 0;
      const ann2En = data.announcement2Enabled ? 1 : 0;
      const cPhoneEn = data.contactPhoneEnabled ? 1 : 0;
      const sWaEn = data.socialWhatsappEnabled ? 1 : 0;

      await prisma.$executeRawUnsafe(
        `INSERT INTO CMSData (id, announcementActive, announcement1Enabled, announcement2Enabled, contactPhoneEnabled, socialWhatsappEnabled, announcement, announcement2, contactPhone, socialWhatsapp, topBarItems) 
         VALUES ('singleton', ${annAct}, ${ann1En}, ${ann2En}, ${cPhoneEn}, ${sWaEn}, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         announcementActive = VALUES(announcementActive),
         announcement1Enabled = VALUES(announcement1Enabled),
         announcement2Enabled = VALUES(announcement2Enabled),
         contactPhoneEnabled = VALUES(contactPhoneEnabled),
         socialWhatsappEnabled = VALUES(socialWhatsappEnabled),
         announcement = VALUES(announcement),
         announcement2 = VALUES(announcement2),
         contactPhone = VALUES(contactPhone),
         socialWhatsapp = VALUES(socialWhatsapp),
         topBarItems = VALUES(topBarItems)`,
        data.announcement || '',
        data.announcement2 || '',
        data.contactPhone || '',
        data.socialWhatsapp || '',
        typeof data.topBarItems === 'string' ? data.topBarItems : JSON.stringify(data.topBarItems || [])
      );
    } catch (dbErr) {
      console.warn('[API SETTINGS WARNING] Raw SQL save failed, but disk data was saved:', dbErr);
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
