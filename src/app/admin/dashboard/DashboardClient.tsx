"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  ShoppingCart,
  Users,
  FileText,
  Layers,
  Image as ImageIcon,
  Navigation,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  Zap,
  Activity,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Truck,
  RotateCcw,
  Scale,
  DollarSign,
  Star,
  Flame
} from "lucide-react";

// --- Sub-components for Visuals ---

function ProgressBar({ value, max, color = "#f97316" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function MiniLineChart({ data, color = "#f97316" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 200;
  const height = 60;
  const pad = 4;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((max - v) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `M ${points[0]} L ${points.join(" L ")} L ${width - pad},${height - pad} L ${pad},${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-client-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-client-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={pad + ((data.length - 1) / (data.length - 1)) * (width - pad * 2)}
        cy={pad + ((max - data[data.length - 1]) / range) * (height - pad * 2)}
        r="3"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DonutChart({
  segments,
}: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const paths = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const el = (
      <circle
        key={seg.label}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth="12"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg viewBox="0 0 140 140" className="w-[140px] h-[140px] shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
      {paths}
      <text x={cx} y={cy - 6} textAnchor="middle" className="text-xl font-black fill-slate-800 font-sans" fontSize="20" fontWeight="900">
        {total.toLocaleString("tr-TR")}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400 font-sans font-bold" fontSize="8">
        SİPARİŞ
      </text>
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Yeni: "bg-blue-50 text-blue-600 border-blue-100",
    "Ödeme Bekliyor": "bg-yellow-50 text-yellow-700 border-yellow-200",
    Bekliyor: "bg-amber-50 text-amber-600 border-amber-100",
    Hazırlanıyor: "bg-orange-50 text-orange-600 border-orange-100",
    Paketlendi: "bg-cyan-50 text-cyan-600 border-cyan-100",
    Kargolandı: "bg-indigo-50 text-indigo-600 border-indigo-100",
    "Teslim Edildi": "bg-emerald-50 text-emerald-700 border-emerald-200",
    Tamamlandı: "bg-emerald-50 text-emerald-600 border-emerald-100",
    İptal: "bg-red-50 text-red-600 border-red-100",
    "İptal Edildi": "bg-red-50 text-red-600 border-red-100",
    Kuyrukta: "bg-purple-50 text-purple-600 border-purple-100 animate-pulse"
  };
  const cls = map[status] ?? "bg-slate-50 text-slate-600 border-slate-100";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {status}
    </span>
  );
}

// --- Main Dashboard Client Component ---

export default function DashboardClient({ initialData, scanResults, siteName, domain }: {
  initialData: any;
  scanResults: any;
  siteName: string;
  domain: string;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  
  // Keep track of previous order IDs to animate new arrivals
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const previousOrdersRef = useRef<any[]>(initialData?.recentOrders || []);

  const knownAppIdsRef = useRef<string[]>([]);

  const playNewApplicationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 bell chime
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        const startTime = ctx.currentTime + index * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (error) {
      console.warn("Failed to play notification chime on dashboard:", error);
    }
  };

  const fetchApplicationsForDashboard = async (isFirstLoad = false) => {
    try {
      const res = await fetch(`/api/applications`);
      if (!res.ok) return;
      const apps = await res.json();
      const appsList = Array.isArray(apps) ? apps : [];
      const currentIds = appsList.map((a: any) => a.id);
      
      if (isFirstLoad) {
        knownAppIdsRef.current = currentIds;
      } else {
        const newApps = appsList.filter((a: any) => !knownAppIdsRef.current.includes(a.id));
        if (newApps.length > 0) {
          playNewApplicationSound();
          newApps.forEach((app) => {
            toast.success(`Yeni bayi başvurusu alındı: ${app.companyName}`, {
              duration: 8000,
              icon: "🔔",
              description: `${app.contactName} tarafından yeni bir başvuru yapıldı. Detaylar için tıklayın.`
            });
          });
          knownAppIdsRef.current = currentIds;
        }
      }
    } catch (e) {
      // silently ignore background polling errors
    }
  };

  useEffect(() => {
    fetchApplicationsForDashboard(true);
    const appInterval = setInterval(() => {
      fetchApplicationsForDashboard(false);
    }, 10000);
    return () => clearInterval(appInterval);
  }, []);

  const speedScore = scanResults?.speedScore || 85;
  const speedLabel = speedScore >= 80 ? "Mükemmel" : speedScore >= 50 ? "İyileştirme Gerekli" : "Zayıf";
  const speedColor = speedScore >= 80 ? "#10b981" : speedScore >= 50 ? "#f59e0b" : "#ef4444";

  // Polling data fetch (Gold Standard 3 & 4)
  const fetchDashboardData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?range=Bu Ay&mode=core`);
      if (res.ok) {
        const freshData = await res.json();
        
        // Find if there are new orders that were not in the previous set
        const oldIds = new Set(previousOrdersRef.current.map(o => o.id));
        const currentNewIds = new Set<string>();
        
        freshData.recentOrders?.forEach((o: any) => {
          if (!oldIds.has(o.id) && oldIds.size > 0) {
            currentNewIds.add(o.id);
          }
        });

        if (currentNewIds.size > 0) {
          setNewOrderIds(prev => new Set([...prev, ...currentNewIds]));
          // Remove highlight animation after 4 seconds
          setTimeout(() => {
            setNewOrderIds(prev => {
              const copy = new Set(prev);
              currentNewIds.forEach(id => copy.delete(id));
              return copy;
            });
          }, 4000);
        }

        previousOrdersRef.current = freshData.recentOrders || [];
        setData(freshData);
      }
    } catch (err) {
      console.error("Dashboard polling error:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (!pollingActive) return;

    // Poll every 8 seconds for real-time B2B/B2C order webhook syncing
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [pollingActive]);

  const kpis = data?.kpis || {};
  const erpStock = data?.erpStockStats || {
    totalStockValue: 0,
    criticalStocks: [],
    depletedProducts: [],
    warehouseDistribution: [],
    recentMovements: [],
    topSellingProducts: [],
    fastestDepletingProducts: []
  };

  // Order breakdown donut segments
  const b2bCount = kpis.b2bOrderCount || 0;
  const b2cCount = kpis.b2cOrderCount || 0;
  const otherCount = kpis.otherOrderCount || 0;
  const orderSegments = [
    { value: b2bCount, color: "#6366f1", label: "B2B Bayi" },
    { value: b2cCount, color: "#f97316", label: "B2C Web" },
    { value: otherCount, color: "#3b82f6", label: "Diğer" }
  ];

  const monthlyOrdersTrend = kpis.monthlyOrdersTrend || [12, 19, 14, 25, 22, 18, 31, 28, 24, 35];

  // Dynamic AP/AR progress for cards
  const arValue = kpis.totalAR || 0;
  const apValue = kpis.totalAP || 0;
  const totalBalance = arValue + apValue || 1;
  const arPct = Math.round((arValue / totalBalance) * 100);
  const apPct = Math.round((apValue / totalBalance) * 100);
  const netLiquidity = arValue - apValue;
  const arApRatio = apValue > 0 ? (arValue / apValue).toFixed(2) : "∞";

  return (
    <div className="space-y-6">
      
      {/* ============================================================
          ACTIONABLE METRICS ALERT GRID (Gold Standard 2)
         ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* e-Fatura Alert */}
        <Link 
          href="/admin/invoices"
          className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group"
        >
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">e-Fatura Havuzu</span>
            <span className="block text-sm font-black text-slate-800">
              {kpis.pendingIncomingInvoices || 0} Onay Bekliyor
            </span>
          </div>
          {kpis.pendingIncomingInvoices > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] font-black text-white items-center justify-center">
                {kpis.pendingIncomingInvoices}
              </span>
            </span>
          )}
        </Link>

        {/* Web Orders Alert */}
        <Link 
          href="/admin/orders"
          className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group"
        >
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Web Siparişler</span>
            <span className="block text-sm font-black text-slate-800">
              {kpis.pendingShippingOrders || 0} Sevk Bekliyor
            </span>
          </div>
          {kpis.pendingShippingOrders > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[8px] font-black text-white items-center justify-center">
                {kpis.pendingShippingOrders}
              </span>
            </span>
          )}
        </Link>

        {/* e-İrsaliye Alert */}
        <Link 
          href="/admin/despatch"
          className="bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group"
        >
          <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">e-İrsaliye İşlemi</span>
            <span className="block text-sm font-black text-slate-800">
              {kpis.pendingDespatchAdvices || 0} Paketlendi
            </span>
          </div>
          {kpis.pendingDespatchAdvices > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-violet-500 text-[8px] font-black text-white items-center justify-center">
                {kpis.pendingDespatchAdvices}
              </span>
            </span>
          )}
        </Link>

        {/* Critical Stock Alert */}
        <Link 
          href="/admin/stock"
          className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group"
        >
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kritik Stok</span>
            <span className="block text-sm font-black text-slate-800">
              {kpis.criticalStockCount || 0} Ürün Kritik
            </span>
          </div>
          {kpis.criticalStockCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[8px] font-black text-white items-center justify-center">
                {kpis.criticalStockCount}
              </span>
            </span>
          )}
        </Link>

        {/* Cargo Queue Alert */}
        <Link 
          href="/admin/orders"
          className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group col-span-2 md:col-span-1"
        >
          <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hata Kuyruğu</span>
            <span className="block text-sm font-black text-slate-800">
              {kpis.pendingCargoQueue || 0} Kargo Bekleyen
            </span>
          </div>
        </Link>
      </div>

      {/* ============================================================
          FINANCIAL HEALTH COCKPIT (Gold Standard 1)
          AR / AP / Net Liquidity - Dynamic progress bars
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Receivables (AR) Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Müşteri Alacakları (AR)</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                ₺{(arValue).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-emerald-600 font-bold">Alınacak Nakit Akışı Havuzu</span>
              <span className="text-[10px] font-black text-slate-400">{arPct}%</span>
            </div>
            <div className="relative h-1.5 bg-emerald-50 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${arPct}%` }} />
            </div>
          </div>
        </div>

        {/* Payables (AP) Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tedarikçi Borçları (AP)</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                ₺{(apValue).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-amber-600 font-bold">Ödenecek Tedarikçi Yükümlülüğü</span>
              <span className="text-[10px] font-black text-slate-400">{apPct}%</span>
            </div>
            <div className="relative h-1.5 bg-amber-50 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${apPct}%` }} />
            </div>
          </div>
        </div>

        {/* Net Liquidity / Cash Position Card */}
        <div className={`border rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-36 ${
          netLiquidity >= 0 
            ? "bg-gradient-to-br from-blue-50 to-white border-blue-100" 
            : "bg-gradient-to-br from-red-50 to-white border-red-100"
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Cari Likidite Dengesi</span>
              <p className={`text-3xl font-extrabold mt-1 ${netLiquidity >= 0 ? "text-slate-900" : "text-red-600"}`}>
                ₺{netLiquidity.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`p-2 rounded-xl ${netLiquidity >= 0 ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}`}>
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">AR / AP Rasyosu: <strong>{arApRatio}x</strong></span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              netLiquidity >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
            }`}>
              {netLiquidity >= 0 ? "✓ Pozitif Denge" : "⚠ Negatif Denge"}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          PROFIT MARGIN + SALES PERFORMANCE CARDS
         ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Toplam Ciro</span>
            <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            ₺{(kpis.totalRevenue || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Bu ay toplam satış</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Net Kâr</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">
            ₺{(kpis.totalProfit || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">%55 maliyet tahmini ile</p>
        </div>

        {/* Profit Margin */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kâr Marjı</span>
            <div className="p-1.5 bg-violet-50 text-violet-500 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">%{kpis.profitMargin || 0}</p>
          <div className="mt-1.5">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-violet-500 transition-all duration-700"
                style={{ width: `${Math.min(100, kpis.profitMargin || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ort. Sepet</span>
            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            ₺{((kpis.averageOrderValue || 0)).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Sipariş başına ortalama</p>
        </div>
      </div>

      {/* ============================================================
          MAIN GRID: PERFORMANCE SCORE + MONTHLY TREND
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Speed / Performance Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-slate-700">Mağaza Performans Skoru</h2>
            </div>
            <div className="flex items-center gap-2">
              {loading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
              <button 
                onClick={() => fetchDashboardData(true)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-6 mb-5">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-slate-900 leading-none">{speedScore}</span>
                <span className="text-lg font-semibold text-slate-400">/100</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">{speedLabel}!</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <ProgressBar value={speedScore} max={100} color={speedColor} />
            <div className="flex justify-between mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
              <span>Zayıf</span>
              <span>İyileştirme Gerekli</span>
              <span>Mükemmel</span>
            </div>
          </div>

          {/* Page speed metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Yükleme Süresi", value: scanResults?.loadTime || "2.4s", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Etkileşim", value: scanResults?.interactivity || "120ms", icon: Zap, color: "text-violet-500", bg: "bg-violet-50" },
              { label: "Görsel Stabil.", value: scanResults?.visualStability || "0.05", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Sunucu Yanıtı", value: scanResults?.serverResponse || "1.1s", icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-50" },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className={`w-7 h-7 ${m.bg} rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wide">{m.label}</p>
                  <p className="text-sm font-black text-slate-800">{m.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales volume metric card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Aylık Sipariş Trendi</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Hacim</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900">{kpis.orderCount || 0} Sipariş</span>
            <p className="text-xs text-slate-400 mt-1">Son 30 günde tamamlanan satış</p>
          </div>
          <div className="h-[70px] mt-4">
            <MiniLineChart data={monthlyOrdersTrend} color="#f97316" />
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold uppercase">
            <span>Oca</span>
            <span>May</span>
            <span>Kas</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          DONUT DISTRIBUTION + WAREHOUSE DISTRIBUTION GRID
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order Channel Breakdowns */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700">Sipariş Kanalları</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">Bu ayki siparişlerin tiplerine dağılımı</p>
          <div className="flex items-center gap-5">
            <DonutChart segments={orderSegments} />
            <div className="space-y-2 flex-1 min-w-0">
              {orderSegments.map((seg) => {
                const pct = Math.round((seg.value / (kpis.orderCount || 1)) * 100);
                return (
                  <div key={seg.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-xs text-slate-600 truncate">{seg.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 shrink-0">{seg.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Warehouse Stock Valuation Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-500" />
            Depo Bazlı Stok Dağılımı ve Değerlemesi
          </h3>
          <p className="text-xs text-slate-400">Depolardaki toplam stok ve maliyet değerlemesi (Mevcut: ₺{erpStock.totalStockValue?.toLocaleString("tr-TR")})</p>
          <div className="space-y-3 pt-2">
            {erpStock.warehouseDistribution?.length > 0 ? (
              erpStock.warehouseDistribution?.map((wh: any) => {
                const totalStockAll = erpStock.warehouseDistribution.reduce((sum: number, w: any) => sum + w.stock, 0) || 1;
                return (
                  <div key={wh.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">{wh.name} ({wh.code})</span>
                      <span className="font-bold text-slate-900">
                        {wh.stock?.toLocaleString("tr-TR")} Adet · ₺{wh.value?.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <ProgressBar value={wh.stock} max={totalStockAll} color="#f97316" />
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-8">Henüz depo verisi bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          TOP SELLING + FASTEST DEPLETING PRODUCTS (NEW!)
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              En Çok Satan Ürünler
            </h3>
            <Link href="/admin/products" className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
              Tümü <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(erpStock.topSellingProducts || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Star className="w-7 h-7 text-slate-200" />
                <p className="text-xs text-slate-400 italic">Henüz satış verisi bulunmuyor.</p>
              </div>
            ) : (
              (erpStock.topSellingProducts || []).map((p: any, idx: number) => {
              const maxQty = erpStock.topSellingProducts?.[0]?.quantity || 1;
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    idx === 0 ? "bg-amber-100 text-amber-700" :
                    idx === 1 ? "bg-slate-100 text-slate-600" :
                    idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-400"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-slate-700 truncate pr-2">{p.name}</span>
                      <span className="text-xs font-black text-slate-900 shrink-0">{p.quantity} adet</span>
                    </div>
                    <ProgressBar value={p.quantity} max={maxQty} color={idx === 0 ? "#f59e0b" : "#f97316"} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 shrink-0 min-w-[60px] text-right">
                    ₺{Number(p.revenue || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Fastest Depleting Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              En Hızlı Tükenen Ürünler
            </h3>
            <Link href="/admin/stock" className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
              Stok <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(erpStock.fastestDepletingProducts || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Flame className="w-7 h-7 text-slate-200" />
                <p className="text-xs text-slate-400 italic">Henüz stok hareket verisi bulunmuyor.</p>
              </div>
            ) : (
              (erpStock.fastestDepletingProducts || []).map((p: any, idx: number) => {
              const maxQty = erpStock.fastestDepletingProducts?.[0]?.quantity || 1;
              return (
                <div key={p.sku} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    idx === 0 ? "bg-red-100 text-red-600" :
                    idx === 1 ? "bg-orange-100 text-orange-600" :
                    "bg-slate-50 text-slate-400"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-slate-700 truncate pr-2">{p.name}</span>
                      <span className="text-xs font-black text-red-600 shrink-0">{p.quantity} adet</span>
                    </div>
                    <ProgressBar value={p.quantity} max={maxQty} color={idx === 0 ? "#ef4444" : "#f97316"} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0 font-mono">{p.sku}</span>
                </div>
              );
            })
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          LIVE POLLING WEBHOOK FEED (Gold Standard 3)
         ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Canlı Webhook Sipariş Akışı (pekefe.com)
            </h2>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Canlı Akış Aktif</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={pollingActive} 
                onChange={(e) => setPollingActive(e.target.checked)}
                className="rounded text-orange-500 cursor-pointer"
              />
              <span>Otomatik Güncelle</span>
            </label>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition pl-2 border-l border-slate-200"
            >
              Tüm Siparişler <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {data?.recentOrders?.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400 text-sm">
            Canlı sipariş akışı bekleniyor...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Sipariş ID</th>
                  <th className="px-5 py-3">Müşteri / Bayi Cari</th>
                  <th className="px-5 py-3">Kanal</th>
                  <th className="px-5 py-3 text-right">Tutar</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recentOrders?.map((order: any) => {
                  const isNew = newOrderIds.has(order.id);
                  return (
                    <tr 
                      key={order.id} 
                      className={`transition-colors duration-1000 ${
                        isNew ? "bg-orange-50/70" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {order.id.startsWith('OR-') || order.id.startsWith('B2B-') ? order.id : `#${order.id.slice(-8).toUpperCase()}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {order.currentAccount?.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            order.type === "B2B"
                              ? "bg-violet-50 text-violet-600 border-violet-100"
                              : "bg-orange-50 text-orange-600 border-orange-100"
                          }`}
                        >
                          {order.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-slate-800">
                          ₺{order.total?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400">
                          {new Date(order.date).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================
          CRITICAL STOCKS + RECENT MOVEMENTS
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Critical Stocks & Depleted */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Kritik Stok & Tükenenler
          </h3>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {erpStock.criticalStocks?.length === 0 && erpStock.depletedProducts?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                <p className="text-xs text-slate-400 italic">Kritik seviyede ürün bulunmuyor.</p>
              </div>
            ) : (
              <>
                {erpStock.depletedProducts?.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center bg-red-50/50 border border-red-100 p-2.5 rounded-xl text-xs">
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800 truncate" title={p.name}>{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{p.sku}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                      Tükendi
                    </span>
                  </div>
                ))}
                {erpStock.criticalStocks?.map((loc: any) => (
                  <div key={loc.id} className="flex justify-between items-center bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-xs">
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800 truncate" title={loc.productName}>{loc.productName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{loc.sku} · {loc.warehouseName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-black text-amber-700 text-sm">{loc.stock}</span>
                      <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest">Limit: {loc.criticalLimit}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Son Stok Hareketleri
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2">Ürün / SKU</th>
                  <th className="px-4 py-2">Depo</th>
                  <th className="px-4 py-2 text-center">Tür</th>
                  <th className="px-4 py-2 text-right">Miktar</th>
                  <th className="px-4 py-2 text-right">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {erpStock.recentMovements?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 italic">Son zamanlarda stok hareketi bulunmuyor.</td>
                  </tr>
                ) : (
                  erpStock.recentMovements?.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <span className="block font-bold text-slate-700 truncate max-w-[150px]" title={m.productName}>{m.productName}</span>
                        <span className="text-[9px] font-mono text-slate-400">{m.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{m.warehouseName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          m.type === 'IN' || m.type === 'Giriş' || m.quantity > 0
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {m.type || (m.quantity > 0 ? 'Giriş' : 'Çıkış')}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-[10px]">
                        {new Date(m.date).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}

