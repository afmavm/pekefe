import { NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-helpers';
import { readLocalOrders } from '@/lib/jsonOrderDb';
import { readLocalProducts } from '@/lib/jsonProductDb';
import { readLocalAccounts } from '@/lib/jsonCurrentAccountsDb';
import { getVisitorStats } from '@/lib/visitor-analytics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeKey(val?: string): string {
  if (!val) return '';
  return String(val).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function normalizeTrStatus(status?: string): string {
  if (!status) return '';
  return String(status)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isOrderCancelledOrReturned(status?: string): boolean {
  const s = normalizeTrStatus(status);
  return s.includes('iptal') || s.includes('cancel') || s.includes('iade') || s.includes('refund');
}

function formatDisplayOrderId(rawId: string, type: string, dateVal: Date): string {
  if (/^(PKF|B2B|B2C|ORD)-/i.test(rawId)) {
    return rawId.toUpperCase();
  }
  const year = !isNaN(dateVal.getTime()) ? dateVal.getFullYear() : new Date().getFullYear();
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = cleanId.length > 6 ? cleanId.slice(-6) : cleanId.padStart(6, '0');
  const prefix = type === 'B2B' ? 'B2B' : 'PKF';
  return `${prefix}-${year}-${suffix}`;
}

export async function GET(request: Request) {
  const auth = await requirePermission('view_dashboard', request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'Bu Ay';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const mode = searchParams.get('mode') || 'core';

  try {
    let startDate = new Date();
    let endDate = new Date();

    if (range === 'Bugün') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'Dün') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'Bu Ay') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'Bu Yıl') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (['2023', '2024', '2025'].includes(range)) {
      startDate = new Date(`${range}-01-01`);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(`${range}-12-31`);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'Özel' && start && end) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    // 1. Prisma sorgularını timeout korumalı çalıştır
    const [
      dbOrders,
      dbProducts,
      locations,
      warehouses,
      recentMovements,
      invoiceItems,
      outboundTransactions,
      arSum,
      apSum,
      integrations,
      errorLogs,
      dbAccountsCount,
    ] = await Promise.all([
      withTimeout(
        prisma.order.findMany({
          where: { isDeleted: false },
          orderBy: { date: 'desc' },
          include: { currentAccount: true },
        }),
        2000,
        [] as any[]
      ),
      withTimeout(
        prisma.product.findMany({
          where: { isDeleted: false },
          include: { locations: true },
        }),
        2000,
        [] as any[]
      ),
      withTimeout(
        prisma.stockLocation.findMany({
          include: { product: true, warehouse: true },
        }),
        1500,
        [] as any[]
      ),
      withTimeout(
        prisma.warehouse.findMany({
          include: { locations: { include: { product: true } } },
        }),
        1500,
        [] as any[]
      ),
      withTimeout(
        prisma.stockTransaction.findMany({
          take: 10,
          orderBy: { date: 'desc' },
          include: { product: true, warehouse: true },
        }),
        1500,
        [] as any[]
      ),
      withTimeout(prisma.invoiceItem.findMany({}), 1500, [] as any[]),
      withTimeout(
        prisma.stockTransaction.findMany({
          where: { quantity: { lt: 0 } },
          include: { product: true },
        }),
        1500,
        [] as any[]
      ),
      withTimeout(
        prisma.currentAccount.aggregate({
          where: {
            OR: [{ type: { contains: 'MUSTERI' } }, { type: { contains: 'customer' } }],
            balance: { gt: 0 },
            isDeleted: false,
          },
          _sum: { balance: true },
        }),
        1500,
        { _sum: { balance: null } } as any
      ),
      withTimeout(
        prisma.currentAccount.aggregate({
          where: {
            OR: [{ type: { contains: 'TEDARIKCI' } }, { type: { contains: 'supplier' } }],
            balance: { gt: 0 },
            isDeleted: false,
          },
          _sum: { balance: true },
        }),
        1500,
        { _sum: { balance: null } } as any
      ),
      withTimeout(prisma.integration.findMany(), 1500, [] as any[]),
      withTimeout(
        prisma.integrationLog.findMany({
          where: { status: 'err' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        1500,
        [] as any[]
      ),
      withTimeout(
        prisma.currentAccount.count({
          where: {
            OR: [{ type: { contains: 'MUSTERI' } }, { type: { contains: 'BAYI' } }],
            isDeleted: false,
            isActive: true,
          },
        }),
        1500,
        0
      ),
    ]);

    // 2. Yerel JSON DB verilerini oku ve Prisma ile tekilleştirerek birleştir
    const localOrders = readLocalOrders();
    const localProducts = readLocalProducts();
    const localAccounts = readLocalAccounts();

    // Sipariş birleştirme (Prisma + Local JSON)
    const orderMap = new Map<string, any>();
    for (const o of dbOrders || []) {
      const key = normalizeKey(o.id);
      if (!key) continue;
      const totalVal = typeof o.total?.toNumber === 'function' ? o.total.toNumber() : Number(o.total || 0);
      const dateObj = o.date ? new Date(o.date) : new Date();
      orderMap.set(key, {
        id: o.id,
        orderNumber: formatDisplayOrderId(o.id, o.type || 'B2C', dateObj),
        total: totalVal,
        status: o.status || 'Yeni',
        type: o.type || 'B2C',
        method: o.method || 'Belirtilmedi',
        summary: o.summary || '',
        date: dateObj,
        currentAccount: o.currentAccount ? { name: o.currentAccount.name } : { name: 'Misafir Müşteri' },
        items: [],
      });
    }

    for (const lo of localOrders || []) {
      const rawId = lo.id || lo.orderNumber || '';
      const key = normalizeKey(rawId);
      if (!key) continue;
      const existing = orderMap.get(key);
      const dateObj = lo.date ? new Date(lo.date) : lo.createdAt ? new Date(lo.createdAt) : existing?.date || new Date();
      const typeVal = lo.type || existing?.type || 'B2C';
      const totalVal = Number(lo.total ?? lo.amount ?? existing?.total ?? 0);
      orderMap.set(key, {
        id: existing?.id || rawId,
        orderNumber: formatDisplayOrderId(rawId, typeVal, dateObj),
        total: totalVal,
        status: lo.status || existing?.status || 'Yeni',
        type: typeVal,
        method: lo.method || existing?.method || 'Belirtilmedi',
        summary: lo.summary || existing?.summary || '',
        date: dateObj,
        currentAccount: existing?.currentAccount || { name: lo.client || lo.customerName || 'Müşteri' },
        items: Array.isArray(lo.items) ? lo.items : existing?.items || [],
      });
    }

    const allMergedOrders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Mod filtresi (B2B / B2C / core)
    const modeFilteredOrders = allMergedOrders.filter((o) => {
      if (mode === 'b2b') return o.type === 'B2B';
      if (mode === 'b2c') return o.type !== 'B2B';
      return true;
    });

    // Tarih aralığı filtresi
    const rangedOrders = modeFilteredOrders.filter((o) => {
      const d = o.date instanceof Date ? o.date : new Date(o.date);
      return d >= startDate && d <= endDate;
    });

    const activeOrdersInRange = rangedOrders.filter((o) => !isOrderCancelledOrReturned(o.status));
    const cancelledOrdersInRange = rangedOrders.filter((o) => isOrderCancelledOrReturned(o.status));
    const allActiveOrders = modeFilteredOrders.filter((o) => !isOrderCancelledOrReturned(o.status));

    // Finansal AR / AP
    const localAR = localAccounts
      .filter(
        (a: any) =>
          (a.type?.includes('MUSTERI') || a.type?.includes('BAYI') || a.type?.includes('customer')) &&
          Number(a.balance || 0) > 0
      )
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    const localAP = localAccounts
      .filter((a: any) => (a.type?.includes('TEDARIKCI') || a.type?.includes('supplier')) && Number(a.balance || 0) > 0)
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    const dbAR = arSum?._sum?.balance
      ? typeof arSum._sum.balance.toNumber === 'function'
        ? arSum._sum.balance.toNumber()
        : Number(arSum._sum.balance)
      : 0;
    const dbAP = apSum?._sum?.balance
      ? typeof apSum._sum.balance.toNumber === 'function'
        ? apSum._sum.balance.toNumber()
        : Number(apSum._sum.balance)
      : 0;

    const totalAR = dbAR > 0 ? dbAR : localAR;
    const totalAP = dbAP > 0 ? dbAP : localAP;

    // Aksiyon metrikleri (tüm aktif siparişlerden hesaplanır)
    const pendingShippingOrders = allActiveOrders.filter((o) =>
      ['Yeni', 'Yeni Sipariş', 'Hazırlanıyor', 'Hazirlaniyor', 'Ödeme Bekliyor', 'Ödeme Bekleniyor'].includes(o.status)
    ).length;

    const pendingDespatchAdvices = allActiveOrders.filter((o) => o.status === 'Paketlendi').length;

    let pendingIncomingInvoices = 0;
    try {
      const invCnt = await withTimeout(
        prisma.invoice.count({ where: { status: { in: ['Bekliyor', 'Onay Bekliyor'] } } }),
        1000,
        0
      );
      pendingIncomingInvoices = Number(invCnt || 0);
    } catch {}

    let pendingCargoQueue = 0;
    try {
      const res = await withTimeout(
        prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) as cnt FROM failed_cargo_requests WHERE status = 'PENDING'`
        ),
        1000,
        []
      );
      pendingCargoQueue = Number(res?.[0]?.cnt || 0);
    } catch {}

    // Ürün & Stok birleştirme (Prisma + Local JSON)
    const productMap = new Map<string, any>();
    for (const p of dbProducts || []) {
      const locStock =
        Array.isArray(p.locations) && p.locations.length > 0
          ? p.locations.reduce((s: number, l: any) => s + Number(l.stock || 0), 0)
          : Number(p.stock || 0);
      const costNum = typeof p.cost?.toNumber === 'function' ? p.cost.toNumber() : Number(p.cost || 0);
      const priceNum = typeof p.price?.toNumber === 'function' ? p.price.toNumber() : Number(p.price || 0);
      productMap.set(String(p.id), {
        id: String(p.id),
        name: p.name,
        sku: p.sku,
        category: p.category || 'Diğer',
        stock: locStock,
        criticalLimit: Number(p.criticalLimit ?? 5),
        cost: costNum,
        price: priceNum,
        locations: p.locations || [],
      });
    }

    for (const lp of localProducts || []) {
      if (!lp || lp.isDeleted) continue;
      const pid = String(lp.id);
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          id: pid,
          name: lp.name,
          sku: lp.sku,
          category: lp.category || 'Diğer',
          stock: Number(lp.stock ?? lp.stock_quantity ?? 0),
          criticalLimit: Number(lp.criticalLimit ?? 5),
          cost: Number(lp.cost ?? 0),
          price: Number(lp.price ?? lp.sale_price ?? 0),
          locations: [],
        });
      }
    }

    const combinedProducts = Array.from(productMap.values());

    // Kritik stok ve tükenen ürünler (Sayaç ve Liste %100 aynı kuralı kullanır)
    const criticalStocksList: any[] = [];
    const seenCriticalIds = new Set<string>();

    for (const p of combinedProducts) {
      if (p.stock <= p.criticalLimit) {
        seenCriticalIds.add(p.id);
        criticalStocksList.push({
          id: p.id,
          productName: p.name,
          sku: p.sku,
          warehouseName: 'İspir Üretim & Merkez Depo',
          stock: p.stock,
          criticalLimit: p.criticalLimit,
        });
      }
    }
    const criticalStockCount = criticalStocksList.length;

    const depletedProductsList = combinedProducts
      .filter((p) => p.stock <= 0)
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku }));

    // Depo dağılımı ve stok değerleme (Maliyet bazlı tutarlı hesaplama)
    const totalStockValue = combinedProducts.reduce(
      (sum, p) => sum + p.stock * (p.cost > 0 ? p.cost : p.price),
      0
    );

    const warehouseDistribution =
      warehouses && warehouses.length > 0
        ? warehouses.map((w: any) => {
            const totalStock = (w.locations || []).reduce((sum: number, l: any) => sum + Number(l.stock || 0), 0);
            const totalVal = (w.locations || []).reduce(
              (sum: number, l: any) =>
                sum +
                Number(l.stock || 0) *
                  (l.product?.cost?.toNumber ? l.product.cost.toNumber() : Number(l.product?.cost || 0)),
              0
            );
            return {
              id: w.id,
              name: w.name,
              code: w.code,
              stock: totalStock,
              value: totalVal,
            };
          })
        : [
            {
              id: 'wh-1',
              name: 'İspir Üretim & Merkez Depo',
              code: 'WH-MRKZ',
              stock: combinedProducts.reduce((s, p) => s + p.stock, 0),
              value: totalStockValue,
            },
          ];

    const transformedMovements = (recentMovements || []).map((m: any) => ({
      id: m.id,
      date: m.date,
      productName: m.product?.name || 'Bilinmeyen Ürün',
      sku: m.product?.sku || 'N/A',
      warehouseName: m.warehouse?.name || 'Genel Depo',
      quantity: m.quantity,
      type: m.type,
      description: m.description,
    }));

    // Ciro, Kâr & Ortalama Sepet (Seçilen aralıkta aktif siparişler)
    const totalRevenue = activeOrdersInRange.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const orderCount = activeOrdersInRange.length;
    const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
    const totalCost = totalRevenue * 0.55;
    const totalProfit = Math.max(0, totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    // Gerçek günlük satış grafiği
    const salesByDay = activeOrdersInRange.reduce((acc: any, order) => {
      const dateStr = new Date(order.date).toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr, revenue: 0, count: 0 };
      acc[dateStr].revenue += Number(order.total || 0);
      acc[dateStr].count += 1;
      return acc;
    }, {});
    const chartData = Object.values(salesByDay);

    const statusCounts = rangedOrders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const channelRevenue = activeOrdersInRange.reduce((acc: any, order) => {
      acc[order.type] = (acc[order.type] || 0) + Number(order.total || 0);
      return acc;
    }, {});
    const barChartData = Object.entries(channelRevenue).map(([name, revenue]) => ({ name, revenue }));

    // En çok satan ürünler (fatura + aktif siparişlerden gerçek hesaplama)
    const salesMap: Record<string, { quantity: number; revenue: number }> = {};
    (invoiceItems || []).forEach((item: any) => {
      if (!salesMap[item.name]) salesMap[item.name] = { quantity: 0, revenue: 0 };
      salesMap[item.name].quantity += Number(item.quantity || 0);
      salesMap[item.name].revenue +=
        typeof item.totalAmount?.toNumber === 'function'
          ? item.totalAmount.toNumber()
          : Number(item.totalAmount || 0);
    });

    activeOrdersInRange.forEach((order) => {
      if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((it: any) => {
          const name = it.name || it.productName || 'Ürün';
          const qty = Number(it.quantity || 1);
          const rev = Number(it.price || it.total || 0) * qty;
          if (!salesMap[name]) salesMap[name] = { quantity: 0, revenue: 0 };
          salesMap[name].quantity += qty;
          salesMap[name].revenue += rev;
        });
      } else if (order.summary) {
        const cleanSummary = order.summary.replace(/^\[.*?\]\s*/, '');
        cleanSummary.split(', ').forEach((itemStr: string) => {
          const match = itemStr.match(/^(.*?)\s*\((\d+)\)$/);
          if (match) {
            const name = match[1].trim();
            const qty = parseInt(match[2], 10) || 0;
            if (name && qty > 0) {
              const matchedProd = combinedProducts.find((p) => p.name === name);
              const unitPrice = matchedProd ? matchedProd.price : Number(order.total || 0) / qty;
              if (!salesMap[name]) salesMap[name] = { quantity: 0, revenue: 0 };
              salesMap[name].quantity += qty;
              salesMap[name].revenue += unitPrice * qty;
            }
          }
        });
      }
    });

    const topSellingProducts = Object.entries(salesMap)
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // En hızlı tükenen ürünler (gerçek çıkış hareketlerinden)
    const depletionMap: Record<string, { name: string; sku: string; qty: number }> = {};
    (outboundTransactions || []).forEach((t: any) => {
      if (t.product) {
        if (!depletionMap[t.product.id]) {
          depletionMap[t.product.id] = { name: t.product.name, sku: t.product.sku, qty: 0 };
        }
        depletionMap[t.product.id].qty += Math.abs(Number(t.quantity || 0));
      }
    });
    const fastestDepletingProducts = Object.values(depletionMap)
      .map((d) => ({ name: d.name, sku: d.sku, quantity: d.qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Kanal dağılımı (seçilen aralıktaki aktif siparişler)
    const b2bOrderCount = activeOrdersInRange.filter((o) => o.type === 'B2B').length;
    const b2cOrderCount = activeOrdersInRange.filter((o) => o.type === 'B2C').length;
    const otherOrderCount = Math.max(0, activeOrdersInRange.length - (b2bOrderCount + b2cOrderCount));

    // Son 6 ayın gerçek aktif sipariş trendi
    const trendList: Array<{ year: number; month: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      trendList.push({ year: d.getFullYear(), month: d.getMonth(), count: 0 });
    }
    allActiveOrders.forEach((o) => {
      const oDate = new Date(o.date);
      const match = trendList.find(
        (t) => t.year === oDate.getFullYear() && t.month === oDate.getMonth()
      );
      if (match) match.count++;
    });
    const monthlyOrdersTrend = trendList.map((t) => t.count);

    // Entegrasyonlar
    const activeIntegrationCount = (integrations || []).filter(
      (i: any) => i.status === 'ACTIVE' || i.status === 'Aktif' || i.status === 'Active'
    ).length;

    const integrationAlerts = (integrations || [])
      .filter((i: any) => i.status === 'Hata' || i.status === 'Pasif' || i.status === 'INACTIVE' || i.status === 'HATA')
      .map((i: any) => {
        const matchingLog = (errorLogs || []).find((l: any) => l.integrationId === i.id);
        return {
          id: i.id,
          name: i.name,
          status: i.status,
          lastSync: i.lastSync,
          message: matchingLog?.message || `${i.name} entegrasyonu pasif.`,
        };
      });

    const activeDealerCount =
      dbAccountsCount > 0
        ? dbAccountsCount
        : localAccounts.filter((a: any) => a.type?.includes('MUSTERI') || a.type?.includes('BAYI')).length;

    return NextResponse.json(
      {
        chartData,
        pieChartData,
        barChartData,
        integrationAlerts,
        visitorStats: getVisitorStats(),
        recentOrders: modeFilteredOrders.slice(0, 8).map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: Number(o.total || 0),
          status: o.status,
          type: o.type,
          date: new Date(o.date).toISOString(),
          currentAccount: o.currentAccount,
        })),
        erpStockStats: {
          totalStockValue,
          criticalStocks: criticalStocksList,
          depletedProducts: depletedProductsList,
          warehouseDistribution,
          recentMovements: transformedMovements,
          topSellingProducts,
          fastestDepletingProducts,
        },
        kpis: {
          totalRevenue,
          orderCount,
          cancelledOrderCount: cancelledOrdersInRange.length,
          averageOrderValue,
          activeDealerCount,
          criticalStockCount,
          activeIntegrationCount,
          profitMargin,
          totalProfit: Math.round(totalProfit),
          totalAR,
          totalAP,
          pendingIncomingInvoices,
          pendingShippingOrders,
          pendingCargoQueue,
          pendingDespatchAdvices,
          b2bOrderCount,
          b2cOrderCount,
          otherOrderCount,
          monthlyOrdersTrend,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[DASHBOARD CRITICAL ERROR]:', error);
    return NextResponse.json({ error: 'Dashboard verileri alınamadı.' }, { status: 500 });
  }
}
