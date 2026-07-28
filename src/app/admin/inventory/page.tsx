import { getInventoryOverview } from "@/modules/inventory/server/inventoryActions";
import { getCriticalStocks } from "@/modules/inventory/server/inventoryActions";
import {
  Package, Warehouse, TrendingDown, AlertTriangle, Activity,
  ArrowLeftRight, ClipboardCheck, BarChart3, XCircle, RefreshCw,
  Store, TrendingUp, Layers3, FileBarChart, Tags
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Envanter & Depo Genel Bakış | Atak Arıcılık ERP",
  description: "Envanter & Depo modülü genel bakış: kritik stoklar, depo dağılımı, son hareketler.",
};

const MODULE_LINKS = [
  { href: "/admin/stock", icon: Package, label: "Ürünler", desc: "Ürün kartları & SKU yönetimi", color: "bg-blue-50 text-blue-600" },
  { href: "/admin/deals", icon: Tags, label: "Fırsat Ürünleri", desc: "Fırsat & kampanya ürünleri", color: "bg-pink-50 text-pink-600" },
  { href: "/admin/inventory/stock-status", icon: Layers3, label: "Stok Durumu", desc: "Depo & şube bazlı anlık stok", color: "bg-emerald-50 text-emerald-600" },
  { href: "/admin/inventory/movements", icon: Activity, label: "Stok Hareketleri", desc: "Değiştirilemez audit log", color: "bg-violet-50 text-violet-600" },
  { href: "/admin/inventory/warehouses", icon: Warehouse, label: "Depolar", desc: "Şube → Depo hiyerarşisi", color: "bg-orange-50 text-orange-600" },
  { href: "/admin/inventory/shelves", icon: Store, label: "Raf Yönetimi", desc: "WMS uyumlu raf adresleme", color: "bg-cyan-50 text-cyan-600" },
  { href: "/admin/inventory/transfers", icon: ArrowLeftRight, label: "Depolar Arası Transfer", desc: "In-Transit akış yönetimi", color: "bg-amber-50 text-amber-600" },
  { href: "/admin/inventory/cycle-count", icon: ClipboardCheck, label: "Sayım İşlemleri", desc: "Periyodik & anlık sayım", color: "bg-rose-50 text-rose-600" },
  { href: "/admin/inventory/critical", icon: AlertTriangle, label: "Kritik Stoklar", desc: "Minimum altı & tükenen ürünler", color: "bg-red-50 text-red-600" },
  { href: "/admin/inventory/reports", icon: FileBarChart, label: "Envanter Raporları", desc: "PDF & Excel kurumsal çıktı", color: "bg-indigo-50 text-indigo-600" },
];

const TX_TYPE_MAP: Record<string, { label: string; color: string }> = {
  IN: { label: "Giriş", color: "text-emerald-600 bg-emerald-50" },
  OUT: { label: "Çıkış", color: "text-red-600 bg-red-50" },
  TRANSFER_IN: { label: "Transfer Giriş", color: "text-blue-600 bg-blue-50" },
  TRANSFER_OUT: { label: "Transfer Çıkış", color: "text-orange-600 bg-orange-50" },
  SALE: { label: "Satış", color: "text-purple-600 bg-purple-50" },
  RETURN: { label: "İade", color: "text-cyan-600 bg-cyan-50" },
  CYCLE_SURPLUS: { label: "Sayım Fazlası", color: "text-teal-600 bg-teal-50" },
  CYCLE_DEFICIT: { label: "Sayım Eksiği", color: "text-rose-600 bg-rose-50" },
};

export default async function InventoryOverviewPage() {
  const [overviewResult, critResult] = await Promise.all([
    getInventoryOverview(),
    getCriticalStocks(),
  ]);

  const stats = overviewResult.data?.stats;
  const recentTransactions = overviewResult.data?.recentTransactions || [];
  const recentTransfers = overviewResult.data?.recentTransfers || [];
  const warehouseDist = overviewResult.data?.warehouseDistribution || [];
  const criticalData = critResult.data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-orange-500" />
              Envanter & Depo
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">SAP Business One uyumlu kurumsal envanter altyapısı</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Gerçek zamanlı veriler
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Toplam Ürün", value: stats.totalProducts, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Aktif Depo", value: stats.totalWarehouses, icon: Warehouse, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Şube", value: stats.totalBranches, icon: Store, color: "text-violet-500", bg: "bg-violet-50" },
            { label: "Kritik Stok", value: stats.criticalStocks, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Tükenen", value: stats.zeroStocks, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
            {
              label: "Stok Değeri",
              value: new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(stats.totalStockValue),
              icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 leading-tight">{value}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module Navigation Cards */}
      <div>
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Modüller</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {MODULE_LINKS.map(({ href, icon: Icon, label, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5 transition-all hover:shadow-md group"
            >
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Critical Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Kritik Stok Uyarıları
            </h3>
            <Link href="/admin/inventory/critical" className="text-[10px] text-orange-500 font-semibold hover:underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {criticalData?.outOfStock?.slice(0, 3).map((p: any) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.sku}</p>
                </div>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                  Tükendi
                </span>
              </div>
            ))}
            {criticalData?.critical?.slice(0, 3).map((p: any) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.sku}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                  {p.stock} / {p.criticalLimit}
                </span>
              </div>
            ))}
            {(!criticalData?.outOfStock?.length && !criticalData?.critical?.length) && (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-slate-400 font-semibold">Kritik stok uyarısı yok ✓</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              Son Stok Hareketleri
            </h3>
            <Link href="/admin/inventory/movements" className="text-[10px] text-orange-500 font-semibold hover:underline">
              Audit Log
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTransactions.slice(0, 6).map((tx: any) => {
              const txInfo = TX_TYPE_MAP[tx.type] || { label: tx.type, color: "text-slate-600 bg-slate-100" };
              return (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{tx.product?.name}</p>
                    <p className="text-[10px] text-slate-400">{tx.warehouse?.name || "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${txInfo.color}`}>
                      {txInfo.label}
                    </span>
                    <span className={`text-[10px] font-bold ${tx.quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                    </span>
                  </div>
                </div>
              );
            })}
            {recentTransactions.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-slate-400 font-semibold">Henüz stok hareketi yok</p>
              </div>
            )}
          </div>
        </div>

        {/* Warehouse Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              Depo Stok Dağılımı
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {warehouseDist.slice(0, 5).map((wh: any) => {
              const maxValue = Math.max(...warehouseDist.map((w: any) => w.value));
              const pct = maxValue > 0 ? (wh.value / maxValue) * 100 : 0;
              return (
                <div key={wh.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[60%]">{wh.name}</span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(wh.value)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {warehouseDist.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Depo verisi bulunamadı</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transfers */}
      {recentTransfers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              Son Transferler
            </h3>
            <Link href="/admin/inventory/transfers" className="text-[10px] text-orange-500 font-semibold hover:underline">
              Tümünü Yönet
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ürün</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kaynak</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Hedef</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Miktar</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Statü</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTransfers.map((t: any) => {
                  const statusMap: Record<string, string> = {
                    "Taslak": "bg-slate-100 text-slate-600",
                    "Yolda": "bg-amber-100 text-amber-700",
                    "Tamamlandı": "bg-emerald-100 text-emerald-700",
                    "Reddedildi": "bg-red-100 text-red-700",
                  };
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800 max-w-[180px] truncate">{t.product?.name}</td>
                      <td className="px-4 py-3 text-slate-500">{t.fromWarehouse?.name}</td>
                      <td className="px-4 py-3 text-slate-500">{t.toWarehouse?.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{t.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMap[t.status] || "bg-slate-100 text-slate-600"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

