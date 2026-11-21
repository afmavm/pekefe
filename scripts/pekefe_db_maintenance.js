/**
 * PEKEFE Izole Canli Veritabani Bakim & Tutarlilik Betigi (Adim 1 + Adim 3 + Adim 2/4 Teshis)
 * - Yalnizca PEKEFE dizininde ve PEKEFE veritabaninda calisir (diger projeye asla dokunmaz).
 * - Tek veritabani baglantisi (connection_limit=1) kullanir, PM2 veya dosyalara dokunmaz.
 * - Veri kaybi olusturmaz: Test Urun soft-delete edilir, yalnizca mukerrer indeksler kaldirilir.
 */
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
if (!/pekefe/i.test(cwd)) {
  console.error('[GUVENLIK KILIDI] Calisma dizini PEKEFE degil:', cwd);
  process.exit(1);
}

// .env yukle (kimlik bilgilerini ekrana yazdirma)
const envPath = path.join(cwd, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

let dbUrl = process.env.DATABASE_URL || '';
if (!/pekefe/i.test(dbUrl)) {
  console.error('[GUVENLIK KILIDI] DATABASE_URL PEKEFE veritabanina ait gorunmuyor, islem durduruldu!');
  process.exit(1);
}
if (!dbUrl.includes('connection_limit=')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=1&connect_timeout=10';
}

const { PrismaClient } = require(path.join(cwd, 'src', 'generated-client'));
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } }, log: [] });
const clean = o => JSON.parse(JSON.stringify(o, (_, v) => typeof v === 'bigint' ? Number(v) : v));

async function main() {
  const log = { step1: {}, step3: [], diagStep2: {}, diagStep4: {} };

  const runSql = async (label, sql) => {
    try {
      const r = await prisma.$executeRawUnsafe(sql);
      log.step3.push({ label, ok: true, affected: Number(r) });
    } catch (e) {
      log.step3.push({ label, ok: false, msg: e.message.split('\n')[0] });
    }
  };

  try {
    // ── ADIM 1: Test Urun soft-delete (veri silinmez, isDeleted=1 yapilir) ──
    const testDel = await prisma.$executeRawUnsafe(
      "UPDATE `Product` SET isDeleted = 1 WHERE sku = 'PKF-559765' AND isDeleted = 0"
    );
    log.step1.testProductSoftDeleted = Number(testDel);

    // ── ADIM 3: Mukerrer 8 indeksi kaldir, 2 bilesik indeks ekle, charset & optimize ──
    const ddl = [
      ['drop Product_sku_idx', 'DROP INDEX `Product_sku_idx` ON `Product`'],
      ['drop ProductVariant_sku_idx', 'DROP INDEX `ProductVariant_sku_idx` ON `ProductVariant`'],
      ['drop CMSPage_slug_idx', 'DROP INDEX `CMSPage_slug_idx` ON `CMSPage`'],
      ['drop Coupon_code_idx', 'DROP INDEX `Coupon_code_idx` ON `Coupon`'],
      ['drop Campaign_code_idx', 'DROP INDEX `Campaign_code_idx` ON `Campaign`'],
      ['drop BlogPost_slug_idx', 'DROP INDEX `BlogPost_slug_idx` ON `BlogPost`'],
      ['drop AccountingAccount_code_idx', 'DROP INDEX `AccountingAccount_code_idx` ON `AccountingAccount`'],
      ['drop JournalEntry_number_idx', 'DROP INDEX `JournalEntry_number_idx` ON `JournalEntry`'],
      ['add Order_isDeleted_date_idx', 'CREATE INDEX `Order_isDeleted_date_idx` ON `Order` (`isDeleted`, `date`)'],
      ['add cariler_isDeleted_updatedAt_idx', 'CREATE INDEX `cariler_isDeleted_updatedAt_idx` ON `cariler` (`isDeleted`, `updatedAt`)'],
      ['db charset utf8mb4', 'ALTER DATABASE `ata3a6icilikcom_pekefe_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci']
    ];
    for (const [lbl, sql] of ddl) {
      await runSql(lbl, sql);
    }

    try {
      const opt = await prisma.$queryRawUnsafe('OPTIMIZE TABLE `email_logs`');
      log.step3.push({ label: 'optimize email_logs', ok: true, res: opt });
    } catch (e) {
      log.step3.push({ label: 'optimize email_logs', ok: false, msg: e.message.split('\n')[0] });
    }

    // ── ADIM 2 TESHIS (Salt-okunur): Depolar ve urun stok dagilimi ──
    log.diagStep2.warehouses = await prisma.$queryRawUnsafe(
      'SELECT id, code, name, isActive FROM `Warehouse`'
    );
    log.diagStep2.stockBreakdown = await prisma.$queryRawUnsafe(`
      SELECT p.sku, p.name, p.stock, p.stock_quantity, w.code AS whCode, sl.stock AS whStock, sl.reserved
      FROM \`Product\` p
      LEFT JOIN \`StockLocation\` sl ON sl.productId = p.id
      LEFT JOIN \`Warehouse\` w ON w.id = sl.warehouseId
      WHERE p.isDeleted = 0
      ORDER BY p.sku, w.code
    `);

    // ── ADIM 4 TESHIS (Salt-okunur): MySQL Order vs orders_db.json + cari bakiye detay ──
    log.diagStep4.mysqlOrders = await prisma.$queryRawUnsafe(
      'SELECT id, date, status, total, type, currentAccountId FROM `Order` ORDER BY date DESC'
    );
    const ordJsonPath = path.join(cwd, 'data', 'orders_db.json');
    if (fs.existsSync(ordJsonPath)) {
      const arr = JSON.parse(fs.readFileSync(ordJsonPath, 'utf8'));
      log.diagStep4.jsonOrders = (Array.isArray(arr) ? arr : []).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total ?? o.amount,
        date: o.date,
        customer: o.customerName || o.email
      }));
    }
    log.diagStep4.cariDetail = await prisma.$queryRawUnsafe(`
      SELECT c.cariKod, c.name, c.balance, t.type, t.amount, t.description
      FROM \`cariler\` c
      LEFT JOIN \`Transaction\` t ON t.currentAccountId = c.id
      WHERE c.cariKod IN ('PKF-CARI-1007', 'PKF-CARI-1010')
      ORDER BY c.cariKod, t.date
    `);

    console.log('===PEKEFE_MAINT_START===');
    console.log(JSON.stringify(clean(log)));
    console.log('===PEKEFE_MAINT_END===');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error('MAINT_ERR:', e.message);
  process.exit(1);
});
