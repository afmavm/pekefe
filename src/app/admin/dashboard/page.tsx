import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import DashboardToolbar from "@/components/DashboardToolbar";
import SeoIssuesWidget from "@/components/SeoIssuesWidget";
import DashboardClient from "./DashboardClient";
import fs from "fs";
import path from "path";
import { Clock, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

// Fetch initial dashboard metrics in parallel using Prisma & Local JSON DB fallback
async function getInitialDashboardData() {
  try {
    const { readLocalProducts } = await import("@/lib/jsonProductDb");
    const { readLocalOrders } = await import("@/lib/jsonOrderDb");
    const { readLocalAccounts } = await import("@/lib/jsonCurrentAccountsDb");
    const { getVisitorStats, getIstanbulDateString } = await import("@/lib/visitor-analytics");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      dbProducts,
      dbOrders,
      locations,
      warehouses,
      recentMovements,
      invoiceItems,
      outboundTransactions,
      arSum,
      apSum
    ] = await Promise.all([
      prisma.product.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          criticalLimit: true,
          locations: { select: { stock: true } },
          price: true,
          cost: true
        }
      }).catch(() => []),
      prisma.order.findMany({
        where: { isDeleted: false },
        orderBy: { date: 'desc' },
        include: { currentAccount: true }
      }).catch(() => []),
      prisma.stockLocation.findMany({
        include: { product: true, warehouse: true }
      }).catch(() => []),
      prisma.warehouse.findMany({
        include: { locations: { include: { product: true } } }
      }).catch(() => []),
      prisma.stockTransaction.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: { product: true, warehouse: true }
      }).catch(() => []),
      prisma.invoiceItem.findMany({}).catch(() => []),
      prisma.stockTransaction.findMany({
        where: { quantity: { lt: 0 } },
        include: { product: true }
      }).catch(() => []),
      prisma.currentAccount.aggregate({
        where: {
          OR: [{ type: { contains: 'MUSTERI' } }, { type: { contains: 'customer' } }],
          balance: { gt: 0 },
          isDeleted: false
        },
        _sum: { balance: true }
      }).catch(() => ({ _sum: { balance: null } })),
      prisma.currentAccount.aggregate({
        where: {
          OR: [{ type: { contains: 'TEDARIKCI' } }, { type: { contains: 'supplier' } }],
          balance: { gt: 0 },
          isDeleted: false
        },
        _sum: { balance: true }
      }).catch(() => ({ _sum: { balance: null } }))
    ]);

    // Merge with Local JSON DB for offline/local resilience
    const localProducts = readLocalProducts();
    const localOrders = readLocalOrders();
    const localAccounts = readLocalAccounts();

    const existingProductIds = new Set((dbProducts || []).map(p => String(p.id)));
    const finalProducts = [
      ...(dbProducts || []),
      ...localProducts.filter(p => p && !existingProductIds.has(String(p.id))).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: Number(p.stock ?? p.stock_quantity ?? 0),
        criticalLimit: 5,
        locations: [{ stock: Number(p.stock ?? p.stock_quantity ?? 0) }],
        price: Number(p.price ?? p.sale_price ?? 0),
        cost: Number(p.cost ?? 0)
      }))
    ];

    const localOrderMap = new Map((localOrders || []).map(o => [String(o.id || o.orderNumber), o]));
    const finalOrders = [
      ...(dbOrders || []).map(o => {
        const local = localOrderMap.get(String(o.id));
        if (local) {
          return {
            ...o,
            status: local.status || o.status,
            total: { toNumber: () => Number(local.total || local.amount || (typeof o.total?.toNumber === 'function' ? o.total.toNumber() : o.total)) }
          };
        }
        return o;
      }),
      ...localOrders.filter(o => o && !(dbOrders || []).some(dbo => String(dbo.id) === String(o.id))).map(o => ({
        id: o.id || o.orderNumber,
        orderNumber: o.orderNumber || o.id,
        total: { toNumber: () => Number(o.amount || o.total || 0) },
        status: o.status || "Yeni",
        type: o.type || "B2C",
        date: o.date ? new Date(o.date) : new Date(o.createdAt || Date.now()),
        currentAccount: o.customerName ? { name: o.customerName } : (o.client ? { name: o.client } : null),
        summary: o.summary || "",
        items: o.items || []
      }))
    ];

    const isOrderCancelledOrReturned = (status?: string) => {
      if (!status) return false;
      const s = String(status);
      const trLower = s.toLocaleLowerCase('tr-TR');
      return (
        trLower.includes('iptal') ||
        s.includes('İptal') ||
        s.includes('Iptal') ||
        s.toLowerCase().includes('cancel') ||
        trLower.includes('iade') ||
        s.includes('İade') ||
        s.includes('Iade') ||
        s.toLowerCase().includes('refund')
      );
    };

    const activeOrders = finalOrders.filter(o => !isOrderCancelledOrReturned(o.status));

    const monthOrders = activeOrders.filter(o => {
      const d = o.date instanceof Date ? o.date : new Date(o.date);
      return d >= startOfMonth;
    });

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthOrders = activeOrders.filter(o => {
      const d = o.date instanceof Date ? o.date : new Date(o.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const monthOrdersCount = monthOrders.length;
    const lastMonthOrdersCount = lastMonthOrders.length;

    // Financial calculations
    const localAR = localAccounts
      .filter((a: any) => (a.type?.includes('MUSTERI') || a.type?.includes('BAYI') || a.type?.includes('customer')) && Number(a.balance || 0) > 0)
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    const localAP = localAccounts
      .filter((a: any) => (a.type?.includes('TEDARIKCI') || a.type?.includes('supplier')) && Number(a.balance || 0) > 0)
      .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

    const totalAR = arSum._sum.balance ? arSum._sum.balance.toNumber() : localAR;
    const totalAP = apSum._sum.balance ? apSum._sum.balance.toNumber() : localAP;

    const criticalStockCount = finalProducts.filter(p => Number(p.stock) <= Number(p.criticalLimit || 5)).length;

    const totalRevenue = activeOrders.reduce((sum, o: any) => {
      const val = typeof o.total?.toNumber === 'function' ? o.total.toNumber() : Number(o.total || o.amount || 0);
      return sum + val;
    }, 0);

    const averageOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;
    const totalProfit = Math.max(0, totalRevenue - (totalRevenue * 0.55));
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    // ERP Stok & Depo Değerlemeleri (Maliyet bazlı tutarlı hesaplama)
    const totalStockValue = finalProducts.reduce((sum, p) => {
      const unitCost = Number(p.cost || 0) > 0 ? Number(p.cost) : Number(p.price || 0);
      return sum + (Number(p.stock || 0) * unitCost);
    }, 0);

    const criticalStocksList = finalProducts
      .filter(p => Number(p.stock) <= Number(p.criticalLimit || 5))
      .map(p => ({
        id: String(p.id),
        productName: p.name,
        sku: p.sku,
        warehouseName: 'İspir Merkez Depo',
        stock: Number(p.stock),
        criticalLimit: Number(p.criticalLimit || 5)
      }));

    const depletedProductsList = finalProducts
      .filter(p => Number(p.stock) <= 0)
      .map(p => ({
        id: String(p.id),
        name: p.name,
        sku: p.sku
      }));

    const warehouseDistribution = warehouses.length > 0 ? warehouses.map(w => {
      const totalStock = w.locations.reduce((sum, l) => sum + l.stock, 0);
      const totalVal = w.locations.reduce((sum, l) => sum + (l.stock * (l.product?.cost ? l.product.cost.toNumber() : 0)), 0);
      return {
        id: w.id,
        name: w.name,
        code: w.code,
        stock: totalStock,
        value: totalVal
      };
    }) : [
      {
        id: "wh-1",
        name: "İspir Merkez Depo",
        code: "WH-MRKZ",
        stock: finalProducts.reduce((s, p) => s + Number(p.stock || 0), 0),
        value: totalStockValue
      }
    ];

    const transformedMovements = recentMovements.length > 0 ? recentMovements.map(m => ({
      id: m.id,
      date: m.date,
      productName: m.product?.name || 'Bilinmeyen Ürün',
      sku: m.product?.sku || 'N/A',
      warehouseName: m.warehouse?.name || 'Genel Depo',
      quantity: m.quantity,
      type: m.type,
      description: m.description
    })) : finalProducts.slice(0, 5).map(p => ({
      id: `mov-${p.id}`,
      date: new Date().toISOString(),
      productName: p.name,
      sku: p.sku,
      warehouseName: 'İspir Merkez Depo',
      quantity: Number(p.stock),
      type: 'Giriş',
      description: 'İlk Stok Tanımı'
    }));

    // Top Selling Products compilation from active orders
    const salesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of activeOrders) {
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const name = item.name || item.productName || 'Ürün';
          const qty = Number(item.quantity || 1);
          const rev = Number(item.price || item.total || 0) * qty;
          if (!salesMap[name]) salesMap[name] = { name, quantity: 0, revenue: 0 };
          salesMap[name].quantity += qty;
          salesMap[name].revenue += rev;
        }
      }
    }
    const topSellingProducts = Object.values(salesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // Dynamic B2B / B2C channel splits from active orders
    const b2bOrderCount = activeOrders.filter(o => o.type === 'B2B').length;
    const b2cOrderCount = activeOrders.filter(o => o.type === 'B2C' || !o.type).length;
    const otherOrderCount = Math.max(0, activeOrders.length - (b2bOrderCount + b2cOrderCount));

    // Calculate 6-month trend from active orders
    const trendList: Array<{ year: number; month: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      trendList.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0
      });
    }
    activeOrders.forEach(o => {
      const oDate = o.date instanceof Date ? o.date : new Date(o.date);
      const match = trendList.find(t => t.year === oDate.getFullYear() && t.month === oDate.getMonth());
      if (match) {
        match.count++;
      }
    });
    const monthlyOrdersTrend = trendList.map(t => t.count);

    const fastestDepletingProducts = finalProducts
      .filter(p => Number(p.stock) <= Number(p.criticalLimit || 5))
      .map(p => ({
        name: p.name,
        sku: p.sku,
        quantity: Number(p.stock)
      }))
      .slice(0, 5);

    const recentOrdersMapped = finalOrders.slice(0, 8).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id,
      total: typeof o.total?.toNumber === 'function' ? o.total.toNumber() : Number(o.total || o.amount || 0),
      status: o.status || "Yeni",
      type: o.type || "B2C",
      date: o.date instanceof Date ? o.date.toISOString() : (o.date || new Date().toISOString()),
      currentAccount: o.currentAccount ? { name: o.currentAccount.name } : { name: "Doğrudan Sipariş" }
    }));

    const cancelledOrderCount = finalOrders.filter(o => isOrderCancelledOrReturned(o.status)).length;
    const activeDealerCount = localAccounts.filter((a: any) => a.type?.includes("MUSTERI") || a.type?.includes("BAYI") || a.type?.includes("customer")).length || 1;

    const visitorStats = getVisitorStats();
    const todayTrStr = visitorStats.daily.date;
    const last7DateSet = new Set(visitorStats.weekly.trend.map((d) => d.date));
    let todayOrderCount = 0;
    let weekOrderCount = 0;
    for (const o of activeOrders) {
      const oDate = o.date instanceof Date ? o.date : new Date(o.date);
      if (isNaN(oDate.getTime())) continue;
      const trDay = getIstanbulDateString(oDate);
      if (trDay === todayTrStr) todayOrderCount += 1;
      if (last7DateSet.has(trDay)) weekOrderCount += 1;
    }

    return {
      visitorStats,
      visitorConversion: {
        todayOrders: todayOrderCount,
        weekOrders: weekOrderCount,
      },
      recentOrders: recentOrdersMapped,
      erpStockStats: {
        totalStockValue,
        criticalStocks: criticalStocksList,
        depletedProducts: depletedProductsList,
        warehouseDistribution,
        recentMovements: transformedMovements,
        topSellingProducts,
        fastestDepletingProducts
      },
      kpis: {
        totalRevenue,
        orderCount: activeOrders.length,
        cancelledOrderCount,
        averageOrderValue,
        activeDealerCount,
        criticalStockCount,
        activeIntegrationCount: 3,
        profitMargin: totalRevenue > 0 ? profitMargin : 0,
        totalProfit: Math.round(totalProfit),
        totalAR,
        totalAP,
        pendingIncomingInvoices: 0,
        pendingShippingOrders: activeOrders.filter(o => o.status === 'Hazırlanıyor' || o.status === 'Yeni' || o.status === 'Ödeme Bekliyor').length,
        pendingCargoQueue: 0,
        pendingDespatchAdvices: 0,
        b2bOrderCount,
        b2cOrderCount,
        otherOrderCount,
        monthlyOrdersTrend,
        monthOrders: monthOrdersCount,
        lastMonthOrders: lastMonthOrdersCount
      }
    };

  } catch (error) {
    console.error("Error fetching initial dashboard data:", error);
    return null;
  }
}

export default async function AdminDashboardPage() {
  const initialData = await getInitialDashboardData();
  const headersList = await headers();
  const host = headersList.get("host") || "pekefe.com";
  const domain = host.split(":")[0];

  let productCount = 0, todayOrders = 0, dealerCount = 0, pageCount = 0, cmsData: any = null;
  try {
    const { readLocalProducts } = await import("@/lib/jsonProductDb");
    const { readLocalOrders } = await import("@/lib/jsonOrderDb");
    const { readLocalAccounts } = await import("@/lib/jsonCurrentAccountsDb");
    const { getVisitorStats, getIstanbulDateString } = await import("@/lib/visitor-analytics");

    [productCount, todayOrders, dealerCount, pageCount, cmsData] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }).catch(() => 0),
      prisma.order.count({ where: { date: { gte: new Date(new Date().setHours(0,0,0,0)) }, isDeleted: false } }).catch(() => 0),
      prisma.currentAccount.count({ where: { type: "MUSTERI", isActive: true, isDeleted: false } }).catch(() => 0),
      prisma.cMSPage.count({ where: { status: "published" } }).catch(() => 0),
      prisma.cMSData.findFirst({ where: { id: "singleton" } }).catch(() => null)
    ]);

    const localProducts = readLocalProducts();
    const localOrders = readLocalOrders();
    const localAccounts = readLocalAccounts();

    if (productCount === 0 && localProducts.length > 0) {
      productCount = localProducts.length;
    }
    if (dealerCount === 0 && localAccounts.length > 0) {
      dealerCount = localAccounts.filter((a: any) => a.type?.includes("MUSTERI") || a.type?.includes("BAYI")).length || localAccounts.length;
    }

    const isCancelled = (status?: string) => {
      if (!status) return false;
      const s = String(status);
      const trLower = s.toLocaleLowerCase('tr-TR');
      return trLower.includes('iptal') || s.includes('İptal') || s.includes('Iptal') || s.toLowerCase().includes('cancel');
    };
    const activeLocalOrders = localOrders.filter(o => !isCancelled(o.status));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayActiveOrders = activeLocalOrders.filter(o => {
      const d = o.date ? new Date(o.date) : (o.createdAt ? new Date(o.createdAt) : null);
      return d && d >= todayStart;
    });

    if (todayOrders === 0) {
      todayOrders = todayActiveOrders.length;
    }
  } catch (e) {
    console.error("AdminDashboardPage error:", e);
  }

  const siteName = cmsData?.siteName || "Pekefe";

  // Read scan results from local JSON file
  let scanResults = {
    speedScore: 87,
    loadTime: "2.54s",
    interactivity: "124ms",
    visualStability: "0.05",
    serverResponse: "1.2s",
    lastScanDate: "29.05.2026 19:30"
  };

  try {
    const dataPath = path.join(process.cwd(), "src", "data", "scan-results.json");
    if (fs.existsSync(dataPath)) {
      scanResults = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    }
  } catch (error) {
    console.error("Error reading scan results:", error);
  }

  const monthOrders = initialData?.kpis?.monthOrders || 0;
  const lastMonthOrders = initialData?.kpis?.lastMonthOrders || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <DashboardToolbar 
        siteName={siteName} 
        domain={domain} 
        stats={{ productCount, todayOrders, dealerCount, pageCount, monthOrders, lastMonthOrders }} 
        scanResults={scanResults}
      />

      {/* --- Summary heading --- */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Özet —</p>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Yönetim Kokpiti
            <a href="/" target="_blank" className="text-orange-500 hover:text-orange-600 transition">
              <ExternalLink className="w-4 h-4" />
            </a>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Son 30 Gün (Canlı Polling Aktif)</span>
        </div>
      </div>

      {/* Render the Client Dashboard containing live interactions */}
      <DashboardClient 
        initialData={initialData} 
        scanResults={scanResults}
        siteName={siteName}
        domain={domain}
      />

      {/* SEO Issues widget rendered below */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          <SeoIssuesWidget />
        </div>
      </div>
      
    </div>
  );
}

