import { NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { readLocalOrders } from '@/lib/jsonOrderDb';
import { readLocalAccounts } from '@/lib/jsonCurrentAccountsDb';
import { readLocalProducts } from '@/lib/jsonProductDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeKey(val?: string): string {
  if (!val) return '';
  return String(val).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function isOrderCancelledOrReturned(status?: string): boolean {
  if (!status) return false;
  const s = String(status)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return s.includes('iptal') || s.includes('cancel') || s.includes('iade') || s.includes('refund');
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30';

  try {
    const days = parseInt(range, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [dbOrders, salesTx, dealers, unpaidInvoices, collectionsList, dbNewCari, dbTotalCari, dbPassiveCari] =
      await Promise.all([
        withTimeout(
          prisma.order.findMany({
            where: { date: { gte: startDate }, isDeleted: false },
            include: { currentAccount: true },
            orderBy: { date: 'desc' },
          }),
          2500,
          [] as any[]
        ),
        withTimeout(
          prisma.stockTransaction.findMany({
            where: { type: 'OUT', date: { gte: startDate } },
            include: { product: true },
          }),
          2000,
          [] as any[]
        ),
        withTimeout(
          prisma.currentAccount.findMany({
            where: { isDeleted: false },
            include: { orders: { where: { date: { gte: startDate }, isDeleted: false } } },
          }),
          2000,
          [] as any[]
        ),
        withTimeout(
          prisma.invoice.findMany({
            where: {
              status: { notIn: ['ODENDI', 'PAID'] },
              isDeleted: false,
            },
          }),
          2000,
          [] as any[]
        ),
        withTimeout(
          prisma.transaction.findMany({
            where: {
              date: { gte: startDate },
              type: { in: ['COLLECTION', 'Tahsilat', 'payment', 'PAYMENT', 'Ödeme'] },
            },
          }),
          2000,
          [] as any[]
        ),
        withTimeout(prisma.currentAccount.count({ where: { createdAt: { gte: startDate }, isDeleted: false } }), 1500, 0),
        withTimeout(prisma.currentAccount.count({ where: { isDeleted: false } }), 1500, 0),
        withTimeout(prisma.currentAccount.count({ where: { isActive: false, isDeleted: false } }), 1500, 0),
      ]);

    // Prisma + Yerel JSON siparişlerini tekilleştirerek birleştir
    const localOrders = readLocalOrders();
    const localProducts = readLocalProducts();
    const localAccounts = readLocalAccounts();

    const orderMap = new Map<string, any>();
    for (const o of dbOrders || []) {
      const k = normalizeKey(o.id);
      if (!k) continue;
      orderMap.set(k, {
        ...o,
        totalVal: typeof o.total?.toNumber === 'function' ? o.total.toNumber() : Number(o.total || 0),
        items: [],
      });
    }

    for (const lo of localOrders || []) {
      const oDate = new Date(lo.date || lo.createdAt || Date.now());
      if (oDate < startDate) continue;
      const rawId = lo.id || lo.orderNumber || '';
      const k = normalizeKey(rawId);
      if (!k) continue;
      const existing = orderMap.get(k);
      orderMap.set(k, {
        ...existing,
        id: existing?.id || rawId,
        type: lo.type || existing?.type || 'B2C',
        status: lo.status || existing?.status || 'Yeni',
        method: lo.method || existing?.method || 'Web Mağaza',
        date: existing?.date || oDate,
        summary: lo.summary || existing?.summary || '',
        totalVal: Number(lo.total ?? lo.amount ?? existing?.totalVal ?? 0),
        currentAccount: existing?.currentAccount || { name: lo.client || lo.customerName || 'Müşteri' },
        items: Array.isArray(lo.items) ? lo.items : existing?.items || [],
      });
    }

    const orders = Array.from(orderMap.values());
    const activeOrders = orders.filter((o) => !isOrderCancelledOrReturned(o.status));

    const getOrderTotal = (o: any) => Number(o.totalVal ?? (typeof o.total?.toNumber === 'function' ? o.total.toNumber() : o.total) ?? 0);
    const getOrderDateStr = (o: any) => {
      try {
        return new Date(o.date).toISOString().split('T')[0];
      } catch {
        return new Date().toISOString().split('T')[0];
      }
    };

    const revenueByChannel = activeOrders.reduce((acc: Record<string, number>, o) => {
      acc[o.type || 'B2C'] = (acc[o.type || 'B2C'] || 0) + getOrderTotal(o);
      return acc;
    }, {});

    const revenueByMarketplace = activeOrders.reduce((acc: Record<string, number>, o) => {
      const channel = o.method || (o.type === 'B2B' ? 'Direkt B2B' : 'Web Mağaza');
      acc[channel] = (acc[channel] || 0) + getOrderTotal(o);
      return acc;
    }, {});

    const revenueByDay = activeOrders.reduce((acc: Record<string, { date: string; b2b: number; b2c: number }>, o) => {
      const d = getOrderDateStr(o);
      const amount = getOrderTotal(o);
      if (!acc[d]) acc[d] = { date: d, b2b: 0, b2c: 0 };
      if (o.type === 'B2B') acc[d].b2b += amount;
      else acc[d].b2c += amount;
      return acc;
    }, {});
    const revenueByDayArr = Object.values(revenueByDay).sort((a, b) => a.date.localeCompare(b.date));

    // Ürün karlılığı (stok çıkışları + aktif sipariş kalemlerinden gerçek hesaplama)
    const productProfitMap: Record<string, { name: string; sku: string; category: string; soldQty: number; revenue: number; cost: number; profit: number; margin: number }> = {};

    for (const tx of salesTx || []) {
      const p = tx.product;
      if (!p) continue;
      const pPrice = typeof p.price?.toNumber === 'function' ? p.price.toNumber() : Number(p.price || 0);
      const pCost = typeof p.cost?.toNumber === 'function' ? p.cost.toNumber() : Number(p.cost || 0);
      const revenue = Math.abs(Number(tx.quantity)) * pPrice;
      const costTotal = Math.abs(Number(tx.quantity)) * pCost;
      const profit = revenue - costTotal;
      if (!productProfitMap[p.id]) {
        productProfitMap[p.id] = { name: p.name, sku: p.sku, category: p.category, soldQty: 0, revenue: 0, cost: 0, profit: 0, margin: 0 };
      }
      productProfitMap[p.id].soldQty += Math.abs(Number(tx.quantity));
      productProfitMap[p.id].revenue += revenue;
      productProfitMap[p.id].cost += costTotal;
      productProfitMap[p.id].profit += profit;
    }

    if (Object.keys(productProfitMap).length === 0) {
      for (const o of activeOrders) {
        if (Array.isArray(o.items)) {
          for (const it of o.items) {
            const qty = Number(it.quantity || 1);
            const rev = Number(it.price || 0) * qty;
            const matched = localProducts.find((lp: any) => String(lp.id) === String(it.id) || lp.name === it.name);
            const costUnit = Number(matched?.cost || (Number(it.price || 0) * 0.55));
            const costTot = costUnit * qty;
            const key = String(it.id || it.name);
            if (!productProfitMap[key]) {
              productProfitMap[key] = {
                name: it.name || 'Ürün',
                sku: it.sku || matched?.sku || '-',
                category: matched?.category || 'Yöresel Ürünler',
                soldQty: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                margin: 0,
              };
            }
            productProfitMap[key].soldQty += qty;
            productProfitMap[key].revenue += rev;
            productProfitMap[key].cost += costTot;
            productProfitMap[key].profit += rev - costTot;
          }
        }
      }
    }

    const productProfitability = Object.values(productProfitMap)
      .map((p) => ({
        ...p,
        margin: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 20);

    const dealerRankings = (dealers || [])
      .map((d: any) => {
        const activeDealerOrders = (d.orders || []).filter((o: any) => !isOrderCancelledOrReturned(o.status));
        return {
          id: d.id,
          name: d.name,
          dealerGroup: d.dealerGroup,
          orderCount: activeDealerOrders.length,
          revenue: activeDealerOrders.reduce((sum: number, o: any) => sum + getOrderTotal(o), 0),
        };
      })
      .filter((d: any) => d.orderCount > 0)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    const categoryRevenue = Object.values(productProfitMap).reduce((acc: Record<string, number>, p) => {
      const cat = p.category || 'Diğer';
      acc[cat] = (acc[cat] || 0) + p.revenue;
      return acc;
    }, {});
    const categoryRevenueArr = Object.entries(categoryRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const totalRevenue = activeOrders.reduce((s, o) => s + getOrderTotal(o), 0);
    const totalCost = Object.values(productProfitMap).reduce((s, p) => s + p.cost, 0);
    const totalProfit = Math.max(0, totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    // Gerçek Vade / Alacak Yaşlandırma (sahte fallback rakamları tamamen kaldırıldı)
    const today = new Date();
    let aging30 = 0;
    let aging60 = 0;
    let aging90 = 0;
    let agingOver90 = 0;

    for (const inv of unpaidInvoices || []) {
      const diffDays = Math.ceil((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) continue;
      const amt = typeof inv.totalAmount?.toNumber === 'function' ? inv.totalAmount.toNumber() : Number(inv.totalAmount || 0);
      if (diffDays <= 30) aging30 += amt;
      else if (diffDays <= 60) aging60 += amt;
      else if (diffDays <= 90) aging90 += amt;
      else agingOver90 += amt;
    }

    const agingDistribution = [
      { name: '0-30 Gün Gecikmiş', value: aging30 },
      { name: '31-60 Gün Gecikmiş', value: aging60 },
      { name: '61-90 Gün Gecikmiş', value: aging90 },
      { name: '90+ Gün Gecikmiş', value: agingOver90 },
    ];

    const totalCariler = dbTotalCari > 0 ? dbTotalCari : localAccounts.length;
    const passiveCariler = dbTotalCari > 0 ? dbPassiveCari : localAccounts.filter((a: any) => a.isActive === false).length;
    const churnCariRate = totalCariler > 0 ? Math.round((passiveCariler / totalCariler) * 100) : 0;

    const totalCollections = (collectionsList || []).reduce(
      (sum: number, c: any) => sum + (typeof c.amount?.toNumber === 'function' ? c.amount.toNumber() : Number(c.amount || 0)),
      0
    );
    const collectionPerformance = totalRevenue > 0 ? Math.min(100, Math.round((totalCollections / totalRevenue) * 100)) : 0;

    return NextResponse.json(
      {
        kpis: {
          totalRevenue,
          totalProfit,
          profitMargin,
          orderCount: activeOrders.length,
          b2bRevenue: revenueByChannel['B2B'] || 0,
          b2cRevenue: revenueByChannel['B2C'] || 0,
          avgOrderValue: activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0,
          newCariCount: dbNewCari,
          churnCariRate,
          collectionPerformance,
        },
        revenueByChannel: Object.entries(revenueByChannel).map(([name, value]) => ({ name, value })),
        revenueByMarketplace: Object.entries(revenueByMarketplace).map(([name, value]) => ({ name, value })),
        revenueByDay: revenueByDayArr,
        productProfitability,
        dealerRankings,
        categoryRevenue: categoryRevenueArr,
        agingDistribution,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (err) {
    console.error('[REPORTS ERROR]:', err);
    return NextResponse.json({ error: 'Rapor verileri alınamadı.' }, { status: 500 });
  }
}
