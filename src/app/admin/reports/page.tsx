"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart2, TrendingUp, Package, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Download, RefreshCw, Loader2,
  Award, ShoppingBag, PieChart, ChevronDown, FileSpreadsheet, FileText,
  UserPlus, CheckCircle2, AlertTriangle, Printer, Sparkles
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RechartsPie, Pie, Cell
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#b45309", "#d97706", "#059669", "#1e293b", "#7c3aed", "#be185d"];

const RANGE_OPTIONS = [
  { label: "Son 7 Gün", value: "7" },
  { label: "Son 30 Gün", value: "30" },
  { label: "Son 90 Gün", value: "90" },
  { label: "Son 365 Gün", value: "365" },
  { label: "Tüm Zamanlar", value: "all" },
];

interface ReportData {
  kpis: {
    totalRevenue: number; totalProfit: number; profitMargin: number;
    orderCount: number; b2bRevenue: number; b2cRevenue: number; avgOrderValue: number;
    collectionPerformance: number; newCariCount: number; churnCariRate: number;
  };
  revenueByDayArr: { date: string; b2b: number; b2c: number }[];
  revenueByMarketplace: { name: string; value: number }[];
  productProfitability: { name: string; sku: string; category: string; soldQty: number; revenue: number; profit: number; margin: number }[];
  dealerRankings: { id: string; name: string; dealerGroup: string; orderCount: number; revenue: number }[];
  categoryRevenue: { name: string; value: number }[];
  agingDistribution: { name: string; value: number }[];
}

const fmt = (n: number) => n?.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) ?? "0";

const renderPieLabel = (props: { name?: string; percent?: number }) =>
  `${props.name ?? ""} %${(((props.percent ?? 0)) * 100).toFixed(0)}`;

function KpiCard({ label, value, sub, color, icon: Icon, up }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition hover:border-amber-300">
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {up !== undefined && (
          up
            ? <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-black"><ArrowUpRight className="w-3 h-3" />Büyüme</span>
            : <span className="flex items-center gap-1 text-red-500 text-[10px] font-black"><ArrowDownRight className="w-3 h-3" />Düşüş</span>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const [activeTab, setActiveTab] = useState<"revenue" | "products" | "dealers" | "channels">("revenue");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      toast.error("Rapor verileri yüklenirken hata oluştu.");
    } finally { 
      setLoading(false); 
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    setShowExportMenu(false);
    const BOM = "\uFEFF";
    const rows = [
      ["Ürün", "SKU", "Kategori", "Satış Adedi", "Ciro (TL)", "Kâr (TL)", "Margin (%)"],
      ...data.productProfitability.map(p => [p.name, p.sku, p.category, p.soldQty, p.revenue.toFixed(2), p.profit.toFixed(2), p.margin])
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pekefe-karlilik-raporu-${range}gun.csv`; a.click();
    toast.success("CSV raporu bilgisayarınıza indirildi.");
  };

  const handleExportXLS = () => {
    if (!data) return;
    setShowExportMenu(false);

    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          td { font-family: Segoe UI, Roboto, sans-serif; font-size: 10pt; padding: 6px; border: 0.5pt solid #cbd5e1; }
          .title { font-size: 14pt; font-weight: bold; color: #ffffff; background-color: #b45309; text-align: center; height: 35px; }
          .header { font-weight: bold; background-color: #f8fafc; color: #475569; }
          .section { font-weight: bold; font-size: 11pt; background-color: #d97706; color: #ffffff; height: 26px; }
          .value-bold { font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .margin-high { background-color: #dcfce7; color: #15803d; font-weight: bold; }
          .margin-mid { background-color: #fef9c3; color: #a16207; font-weight: bold; }
          .margin-low { background-color: #fee2e2; color: #b91c1c; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="7" class="title">PEKEFE Geleneksel — DETAYLI KÂRLILIK VE ANALİTİK RAPORU</td></tr>
          <tr><td colspan="7" style="border: none; height: 10px;"></td></tr>
          
          <tr class="section"><td colspan="7">1. RAPOR ÖZETİ VE ANAHTAR METRİKLER (KPI)</td></tr>
          <tr class="header"><td colspan="3">Metrik</td><td colspan="4" class="text-right">Değer</td></tr>
          <tr><td colspan="3">Rapor Dönemi</td><td colspan="4" class="value-bold text-right">${range === "all" ? "Tüm Zamanlar" : `${range} Günlük Rapor`}</td></tr>
          <tr><td colspan="3">Oluşturulma Tarihi</td><td colspan="4" class="value-bold text-right">${new Date().toLocaleString("tr-TR")}</td></tr>
          <tr><td colspan="3">Toplam Ciro (TL)</td><td colspan="4" class="value-bold text-right">${data.kpis.totalRevenue.toLocaleString("tr-TR")} TL</td></tr>
          <tr><td colspan="3">Net Kâr (TL)</td><td colspan="4" class="value-bold text-right" style="color: #16a34a;">${data.kpis.totalProfit.toLocaleString("tr-TR")} TL</td></tr>
          <tr><td colspan="3">Ortalama Kâr Marjı (%)</td><td colspan="4" class="value-bold text-right" style="color: #b45309;">%${data.kpis.profitMargin}</td></tr>
          <tr><td colspan="3">Toplam Sipariş Adedi</td><td colspan="4" class="value-bold text-right">${data.kpis.orderCount} Sipariş</td></tr>
          <tr><td colspan="3">B2B Geliri (TL)</td><td colspan="4" class="value-bold text-right">${data.kpis.b2bRevenue.toLocaleString("tr-TR")} TL</td></tr>
          <tr><td colspan="3">B2C Geliri (TL)</td><td colspan="4" class="value-bold text-right">${data.kpis.b2cRevenue.toLocaleString("tr-TR")} TL</td></tr>
          <tr><td colspan="3">Ortalama Sipariş Değeri (AOV)</td><td colspan="4" class="value-bold text-right">${data.kpis.avgOrderValue.toLocaleString("tr-TR")} TL</td></tr>
          
          <tr><td colspan="7" style="border: none; height: 15px;"></td></tr>
          
          <tr class="section"><td colspan="7">2. ÜRÜN BAZLI KÂRLILIK VE MARJ DAĞILIMI</td></tr>
          <tr class="header">
            <td>Ürün Adı</td>
            <td>SKU</td>
            <td class="text-center">Kategori</td>
            <td class="text-right">Satış Adedi</td>
            <td class="text-right">Ciro (TL)</td>
            <td class="text-right">Kâr (TL)</td>
            <td class="text-center">Margin (%)</td>
          </tr>
          ${data.productProfitability.map((p) => {
            const marginStyle = p.margin >= 20 ? "margin-high" : p.margin >= 10 ? "margin-mid" : "margin-low";
            return `
              <tr>
                <td>${p.name}</td>
                <td>${p.sku}</td>
                <td class="text-center">${p.category}</td>
                <td class="text-right">${p.soldQty}</td>
                <td class="text-right">${p.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</td>
                <td class="text-right">${p.profit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</td>
                <td class="${marginStyle} text-center">%${p.margin}</td>
              </tr>
            `;
          }).join("")}

          <tr><td colspan="7" style="border: none; height: 15px;"></td></tr>
          <tr class="section"><td colspan="7">3. EN ÇOK CİRO GETİREN BAYİLER</td></tr>
          <tr class="header">
            <td class="text-center">Sıra</td>
            <td colspan="2">Bayi Adı</td>
            <td class="text-center">Bayi Grubu</td>
            <td class="text-right" colspan="2">Sipariş Sayısı</td>
            <td class="text-right">Toplam Ciro (TL)</td>
          </tr>
          ${data.dealerRankings.map((d, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td colspan="2">${d.name}</td>
              <td class="text-center">${d.dealerGroup}</td>
              <td class="text-right" colspan="2">${d.orderCount} Sipariş</td>
              <td class="text-right">${d.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</td>
            </tr>
          `).join("")}
          
          <tr><td colspan="7" style="border: none; height: 15px;"></td></tr>
          <tr><td colspan="3" style="font-weight: bold; color: #475569;">Rapor Notu:</td><td colspan="4" style="color: #64748b; font-style: italic;">Bu rapor PEKEFE Yönetim Paneli tarafından otomatik üretilmiştir.</td></tr>
        </table>
      </body>
      </html>
    `;

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + htmlTable], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pekefe-karlilik-raporu-${range}gun.xls`;
    link.click();
    toast.success("Excel raporu indirildi.");
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">

      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-[#b45309]" /> Analitik & Kârlılık Raporları
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ürün bazlı kârlılık, B2B/B2C ciro kırılımları, cari alacak yaşlandırma ve kanal performansları.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Range Picker */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  range === opt.value ? "bg-white text-[#b45309] shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Export Menu Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Dışa Aktar</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={handleExportXLS}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 transition font-bold text-left cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel (.xls) Olarak İndir
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-800 hover:bg-amber-50 hover:text-amber-700 transition font-bold text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#b45309]" />
                  CSV Olarak İndir
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition font-bold text-left border-t border-slate-100 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  Yazdır / PDF Raporu Al
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={fetchData} 
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Finansal Raporlar Hesaplanıyor...</p>
        </div>
      ) : data && (
        <>
          {/* KPI Grid - 6 Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Toplam Ciro" value={`${fmt(data.kpis.totalRevenue)} ₺`} icon={DollarSign} color="bg-blue-50 text-blue-600" />
            <KpiCard label="Net Kâr" value={`${fmt(data.kpis.totalProfit)} ₺`} sub={`Marj: %${data.kpis.profitMargin}`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
            <KpiCard label="Tahsilat Performansı" value={`%${data.kpis.collectionPerformance}`} sub="Bu Ayki Oran" icon={CheckCircle2} color="bg-amber-50 text-amber-700" />
            <KpiCard label="Yeni Cari" value={`${data.kpis.newCariCount} Cari`} sub="Bu Ay Kazanılan" icon={UserPlus} color="bg-purple-50 text-purple-600" />
            <KpiCard label="Pasif Cari Oranı" value={`%${data.kpis.churnCariRate}`} sub="Pasif / Churn" icon={AlertTriangle} color="bg-red-50 text-red-600" />
            
            <div className="bg-[#b45309] rounded-2xl p-4 shadow-sm text-white flex flex-col justify-between">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className="text-sm font-black truncate">B2B: {fmt(data.kpis.b2bRevenue)} ₺</p>
                <p className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">B2C: {fmt(data.kpis.b2cRevenue)} ₺</p>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            {([
              { id: "revenue", label: "Ciro Trendi", icon: TrendingUp },
              { id: "products", label: "Ürün Kârlılığı", icon: Package },
              { id: "dealers", label: "Cari Hesap Sıralaması", icon: Users },
              { id: "channels", label: "Yaşlandırma & Kanallar", icon: PieChart },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="w-4 h-4 text-amber-700" /> {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: Revenue Trend */}
          {activeTab === "revenue" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6">B2B / B2C Ciro Karşılaştırması</h2>
              {data.revenueByDayArr.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
                  <TrendingUp className="w-10 h-10 text-slate-300" />
                  <p className="text-xs font-bold">Seçilen dönemde satış verisi bulunamadı.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={data.revenueByDayArr} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="b2bGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b45309" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#b45309" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="b2cGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: any) => [`${fmt(v)} ₺`]} />
                    <Legend />
                    <Area type="monotone" dataKey="b2b" name="B2B (Bayi Satışları)" stroke="#b45309" fill="url(#b2bGrad)" strokeWidth={2.5} dot={false} />
                    <Area type="monotone" dataKey="b2c" name="B2C (Perakende)" stroke="#3b82f6" fill="url(#b2cGrad)" strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* TAB: Product Profitability */}
          {activeTab === "products" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Ürün Bazlı Net Kârlılık Raporu</h2>
                <p className="text-xs text-slate-500 font-semibold">Stok çıkış maliyetlerinden hesaplanır</p>
              </div>
              {data.productProfitability.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
                  <Package className="w-10 h-10 text-slate-300" />
                  <p className="text-xs font-bold">Seçilen dönemde satış hareketi bulunamadı.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Ürün</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-right">Satış Adedi</th>
                        <th className="px-4 py-3 text-right">Ciro</th>
                        <th className="px-4 py-3 text-right">Kâr</th>
                        <th className="px-4 py-3 text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {data.productProfitability.map((p, i) => (
                        <tr key={p.sku} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            {i === 0 ? <Award className="w-4 h-4 text-amber-600" /> : <span className="text-slate-400 font-bold">{i + 1}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-extrabold text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase">{p.category}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold">{p.soldQty}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">{fmt(p.revenue)} ₺</td>
                          <td className={`px-4 py-3 text-right font-extrabold ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(p.profit)} ₺</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              p.margin >= 20 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                              p.margin >= 10 ? "bg-amber-50 text-amber-800 border-amber-200" : 
                              "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              %{p.margin}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: Dealer Rankings */}
          {activeTab === "dealers" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6">En Çok Satış Yapılan Top 10 Cari Hesap</h2>
              {data.dealerRankings.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
                  <Users className="w-10 h-10 text-slate-300" />
                  <p className="text-xs font-bold">Bu dönemde siparişi bulunan cari bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.dealerRankings.map((dealer, i) => {
                    const maxRev = data.dealerRankings[0].revenue || 1;
                    const pct = Math.round((dealer.revenue / maxRev) * 100);
                    return (
                      <div key={dealer.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition border border-slate-200">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          i === 0 ? "bg-amber-100 text-amber-900 border border-amber-300" : 
                          i === 1 ? "bg-slate-200 text-slate-800" : 
                          i === 2 ? "bg-amber-50 text-amber-800" : 
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-extrabold text-sm text-slate-900 truncate">{dealer.name}</p>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                              dealer.dealerGroup === "Platin" ? "bg-purple-50 text-purple-700 border border-purple-200" : 
                              dealer.dealerGroup === "Gold" ? "bg-amber-50 text-amber-800 border border-amber-200" : 
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {dealer.dealerGroup}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-sm text-slate-900">{fmt(dealer.revenue)} ₺</p>
                          <p className="text-[10px] text-slate-500 font-bold">{dealer.orderCount} Sipariş</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: Channel Analysis */}
          {activeTab === "channels" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Aging Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6">Cari Alacak Yaşlandırma Dağılımı</h2>
                  {!data.agingDistribution || data.agingDistribution.length === 0 ? (
                    <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
                      <PieChart className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-bold">Açık fatura bakiyesi bulunamadı.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPie>
                        <Pie 
                          data={data.agingDistribution} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={65} 
                          outerRadius={105} 
                          paddingAngle={4} 
                          dataKey="value" 
                          label={renderPieLabel} 
                          labelLine={false}
                        >
                          {data.agingDistribution.map((_, idx) => {
                            const agingColors = ["#10b981", "#f59e0b", "#d97706", "#dc2626"];
                            return <Cell key={idx} fill={agingColors[idx % agingColors.length]} />;
                          })}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`${fmt(v)} ₺`]} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* 2. Channel Distribution Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6">Kanal Bazlı Gelir Dağılımı</h2>
                  {data.revenueByMarketplace.length === 0 ? (
                    <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
                      <PieChart className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-bold">Veri bulunamadı.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPie>
                        <Pie 
                          data={data.revenueByMarketplace} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={65} 
                          outerRadius={105} 
                          paddingAngle={4} 
                          dataKey="value" 
                          label={renderPieLabel} 
                          labelLine={false}
                        >
                          {data.revenueByMarketplace.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`${fmt(v)} ₺`]} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  )}
                </div>

              </div>

              {/* 3. Category Revenue Bar Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6">Kategori Bazlı Gelir Dağılımı</h2>
                {data.categoryRevenue.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
                    <BarChart2 className="w-10 h-10 text-slate-300" />
                    <p className="text-xs font-bold">Veri bulunamadı.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.categoryRevenue.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                      <Tooltip formatter={(v: any) => [`${fmt(v)} ₺`]} />
                      <Bar dataKey="value" name="Ciro" fill="#b45309" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
