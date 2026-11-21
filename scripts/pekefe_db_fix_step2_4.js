/**
 * PEKEFE Izole Canli Veritabani Duzeltme Betigi — Adim 2 (Stok) & Adim 4 (Cari/Bakiye) + Final Dogrulama
 * - Yalnizca PEKEFE dizininde ve PEKEFE veritabaninda calisir (diger projeye asla dokunmaz).
 * - Tek veritabani baglantisi (connection_limit=1) kullanir.
 */
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
if (!/pekefe/i.test(cwd)) {
  console.error('[GUVENLIK KILIDI] Calisma dizini PEKEFE degil:', cwd);
  process.exit(1);
}

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
  console.error('[GUVENLIK KILIDI] DATABASE_URL PEKEFE veritabanina ait gorunmuyor!');
  process.exit(1);
}
if (!dbUrl.includes('connection_limit=')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=1&connect_timeout=10';
}

const { PrismaClient } = require(path.join(cwd, 'src', 'generated-client'));
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } }, log: [] });
const clean = o => JSON.parse(JSON.stringify(o, (_, v) => typeof v === 'bigint' ? Number(v) : v));

async function main() {
  const result = { step2: {}, step4: {}, verification: {} };

  try {
    // ── ADIM 2: Stok Esitleme (Product.stock === stock_quantity === WH-MRKZ StockLocation.stock) ──
    const activeOrders = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) AS cnt FROM `Order` WHERE isDeleted = 0 AND status NOT IN ('İptal Edildi', 'IPTAL', 'Teslim Edildi', 'Tamamlandı')"
    );
    const openOrderCount = Number(activeOrders?.[0]?.cnt || 0);
    result.step2.openOrderCount = openOrderCount;

    // 2a. Product.stock_quantity = ROUND(Product.stock)
    const syncQty = await prisma.$executeRawUnsafe(
      'UPDATE `Product` SET stock_quantity = ROUND(stock) WHERE isDeleted = 0 AND (stock_quantity IS NULL OR ABS(stock - stock_quantity) > 0.001)'
    );
    result.step2.updatedStockQuantityRows = Number(syncQty);

    // 2b. WH-MRKZ StockLocation.stock = Product.stock (ve acik siparis yoksa reserved = 0)
    const syncLocSql = openOrderCount === 0
      ? `UPDATE \`StockLocation\` sl
         INNER JOIN \`Product\` p ON p.id = sl.productId
         INNER JOIN \`Warehouse\` w ON w.id = sl.warehouseId
         SET sl.stock = p.stock, sl.reserved = 0
         WHERE p.isDeleted = 0 AND w.code = 'WH-MRKZ'`
      : `UPDATE \`StockLocation\` sl
         INNER JOIN \`Product\` p ON p.id = sl.productId
         INNER JOIN \`Warehouse\` w ON w.id = sl.warehouseId
         SET sl.stock = p.stock
         WHERE p.isDeleted = 0 AND w.code = 'WH-MRKZ'`;

    const syncLoc = await prisma.$executeRawUnsafe(syncLocSql);
    result.step2.updatedStockLocationRows = Number(syncLoc);

    // ── ADIM 4: Mukerrer IPTAL Temizligi & Cari Bakiye Yuvarlama/Senkronizasyon ──
    // 4a. #B2B2026000004 icin mukerrer IPTAL kayitlarini tekillestir (en son 1 kaydi koru)
    const dupCancels = await prisma.$queryRawUnsafe(`
      SELECT id, date, description
      FROM \`Transaction\`
      WHERE UPPER(type) = 'IPTAL' AND description LIKE '%B2B2026000004%'
      ORDER BY date DESC, id DESC
    `);

    let removedDupCount = 0;
    if (dupCancels.length > 1) {
      const keepId = dupCancels[0].id;
      const deleteIds = dupCancels.slice(1).map(r => r.id);
      for (const delId of deleteIds) {
        await prisma.$executeRawUnsafe('DELETE FROM `Transaction` WHERE id = ?', delId);
        removedDupCount++;
      }
      result.step4.keptIptalId = keepId;
    }
    result.step4.removedDuplicateIptalRows = removedDupCount;

    // 4b. Tum aktif carilerin bakiyesini Order + Invoice + Transaction uzerinden 2 ondalikla yeniden hesapla
    const accounts = await prisma.currentAccount.findMany({
      where: { isDeleted: false },
      select: { id: true, cariKod: true, name: true, balance: true, openingBalance: true }
    });

    const normalizeOrdKey = val => String(val || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const creditKeywords = ['TAHSILAT', 'TAHSİLAT', 'ALIS', 'ALIŞ', 'IADE', 'İADE', 'IPTAL', 'İPTAL', 'ALACAK_DEVIR', 'ALACAK'];
    const updatedBalances = [];

    for (const acc of accounts) {
      const [accTxs, accOrds, accInvs] = await Promise.all([
        prisma.transaction.findMany({
          where: { currentAccountId: acc.id },
          select: { type: true, amount: true, description: true }
        }),
        prisma.order.findMany({
          where: { currentAccountId: acc.id, isDeleted: false },
          select: { id: true, total: true }
        }),
        prisma.invoice.findMany({
          where: { currentAccountId: acc.id, isDeleted: false },
          select: { type: true, totalAmount: true }
        })
      ]);

      const processedOrderIds = new Set();
      let totalDebit = 0;
      let totalCredit = 0;

      for (const tx of accTxs) {
        const tUp = String(tx.type || '').toUpperCase();
        const isCredit = creditKeywords.some(k => tUp.includes(k));
        const amt = Math.abs(Number(tx.amount || 0));
        if (isCredit) {
          totalCredit += amt;
        } else {
          totalDebit += amt;
          const m = tx.description && tx.description.match(/(PKF-?[A-Z0-9-]+|B2B-?[A-Z0-9-]+|ORD-?[A-Z0-9-]+)/i);
          if (m) processedOrderIds.add(normalizeOrdKey(m[1]));
        }
      }

      for (const inv of accInvs) {
        const iUp = String(inv.type || '').toUpperCase();
        const amt = Math.abs(Number(inv.totalAmount || 0));
        if (iUp.includes('ALIS')) totalCredit += amt;
        else totalDebit += amt;
      }

      for (const o of accOrds) {
        if (processedOrderIds.has(normalizeOrdKey(o.id))) continue;
        totalDebit += Number(o.total || 0);
      }

      const oldBal = Number(acc.balance || 0);
      const netBalance = Number((Number(acc.openingBalance || 0) + totalDebit - totalCredit).toFixed(2));
      if (Math.abs(oldBal - netBalance) > 0.00001 || String(acc.balance) !== String(netBalance)) {
        await prisma.currentAccount.update({
          where: { id: acc.id },
          data: { balance: netBalance }
        });
        updatedBalances.push({ cariKod: acc.cariKod, name: acc.name, oldBal: String(acc.balance), newBal: netBalance });
      }
    }
    result.step4.updatedCariBalances = updatedBalances;

    // ── FINAL DOGRULAMA ──
    const prodCheck = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) AS activeProducts,
        SUM(stock_quantity IS NULL OR ABS(stock - stock_quantity) > 0.001) AS stockQtyDiff
      FROM \`Product\`
      WHERE isDeleted = 0
    `);
    const locCheck = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS locMismatchCount
      FROM (
        SELECT p.id, p.stock, COALESCE(SUM(sl.stock), 0) AS locSum
        FROM \`Product\` p
        LEFT JOIN \`StockLocation\` sl ON sl.productId = p.id
        WHERE p.isDeleted = 0
        GROUP BY p.id, p.stock
        HAVING ABS(p.stock - locSum) > 0.001
      ) x
    `);
    const charsetCheck = await prisma.$queryRawUnsafe("SHOW VARIABLES LIKE 'collation_database'");
    const emailLogSize = await prisma.$queryRawUnsafe(
      "SELECT TABLE_ROWS, ROUND(DATA_LENGTH/1024,1) AS dataKB, ROUND(DATA_FREE/1024,1) AS freeKB FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_logs'"
    );

    result.verification = {
      activeProducts: Number(prodCheck?.[0]?.activeProducts || 0),
      stockQtyDiff: Number(prodCheck?.[0]?.stockQtyDiff || 0),
      stockLocationMismatch: Number(locCheck?.[0]?.locMismatchCount || 0),
      dbCollation: charsetCheck?.[0]?.Value || null,
      emailLogsStorage: emailLogSize?.[0] || null
    };

    console.log('===PEKEFE_STEP2_4_START===');
    console.log(JSON.stringify(clean(result)));
    console.log('===PEKEFE_STEP2_4_END===');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error('STEP2_4_ERR:', e.message);
  process.exit(1);
});
