"use client";

import { useState } from "react";
import {
  Users,
  Eye,
  Calendar,
  CalendarRange,
  Globe,
  Smartphone,
  Monitor,
  TrendingUp,
  TrendingDown,
  Radio,
  Compass,
  FileBarChart2,
  Percent,
} from "lucide-react";
import type { VisitorStatsSummary } from "@/lib/visitor-analytics";

interface VisitorConversionInfo {
  todayOrders: number;
  weekOrders: number;
}

interface VisitorAnalyticsWidgetProps {
  stats?: VisitorStatsSummary | null;
  conversion?: VisitorConversionInfo | null;
}

function formatNumber(n?: number | null): string {
  return Number(n || 0).toLocaleString("tr-TR");
}

function formatStartedAt(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

const SOURCE_STYLE_MAP: Record<string, { bar: string; badge: string }> = {
  "Google Ads": { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  "Google Organik": { bar: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  Instagram: { bar: "bg-pink-500", badge: "bg-pink-50 text-pink-700 border-pink-200" },
  Facebook: { bar: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  WhatsApp: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  YouTube: { bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  Doğrudan: { bar: "bg-[#6b1d2f]", badge: "bg-rose-50 text-[#6b1d2f] border-rose-200" },
  Diğer: { bar: "bg-slate-400", badge: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function VisitorAnalyticsWidget({ stats, conversion }: VisitorAnalyticsWidgetProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const realtime = stats?.realtime || {
    activeVisitors: 0,
    mobile: 0,
    desktop: 0,
    activePages: [],
  };
  const daily = stats?.daily || {
    date: "",
    uniqueVisitors: 0,
    pageviews: 0,
    yesterdayVisitors: 0,
    changePercent: null,
  };
  const weekly = stats?.weekly || {
    uniqueVisitors: 0,
    pageviews: 0,
    dailyAverage: 0,
    trend: [],
  };
  const yearly = stats?.yearly || {
    year: new Date().getFullYear(),
    uniqueVisitors: 0,
    pageviews: 0,
    dailyAverage: 0,
  };
  const devices = stats?.devices || {
    mobile: 0,
    desktop: 0,
    mobilePercent: 0,
    desktopPercent: 0,
  };
  const topPages = stats?.topPages || [];
  const trafficSources = stats?.trafficSources || [];

  const maxTrendVal = Math.max(1, ...weekly.trend.map((d) => d.visitors));
  const startedLabel = formatStartedAt(stats?.startedAt);

  // Real Conversion Rate Calculation (Son 7 Gün & Bugün)
  const todayOrders = Number(conversion?.todayOrders || 0);
  const weekOrders = Number(conversion?.weekOrders || 0);
  const weekConversionRate =
    weekly.uniqueVisitors > 0 ? Math.min(100, (weekOrders / weekly.uniqueVisitors) * 100) : 0;
  const todayConversionRate =
    daily.uniqueVisitors > 0 ? Math.min(100, (todayOrders / daily.uniqueVisitors) * 100) : 0;

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Web Sitesi Ziyaretçi İstatistikleri
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                GERÇEK ZAMANLI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Botlar ve admin paneli hariç gerçek mağaza ziyaretçileri
              {startedLabel ? ` • Kayıt başlangıcı: ${startedLabel}` : ""}
            </p>
          </div>
        </div>

        {/* Right Header Pills: Conversion Rate + Device Split */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            title={`Son 7 günde ${formatNumber(weekly.uniqueVisitors)} tekil ziyaretçiden ${formatNumber(weekOrders)} aktif sipariş • Bugün: ${formatNumber(todayOrders)} sipariş (%${todayConversionRate.toFixed(1)})`}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#6b1d2f] bg-rose-50/80 border border-rose-200/80 rounded-xl px-2.5 py-1"
          >
            <Percent className="w-3.5 h-3.5 text-[#6b1d2f]" />
            <span>Dönüşüm (7g):</span>
            <span className="font-black tabular-nums">
              %{weekConversionRate.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="text-[10px] font-medium text-rose-700/80 hidden sm:inline">
              ({formatNumber(weekOrders)} sipariş)
            </span>
          </div>

          {(devices.mobile > 0 || devices.desktop > 0) && (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl px-2.5 py-1">
              <span className="inline-flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                Mobil %{devices.mobilePercent}
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                Masaüstü %{devices.desktopPercent}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* 4 Primary KPI Cards: Anlık, Günlük, Haftalık, Yıllık */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. ANLIK */}
          <div className="relative rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4 transition hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                Anlık Ziyaretçi
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Son 5 dk
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {formatNumber(realtime.activeVisitors)}
              </span>
              <span className="text-xs font-semibold text-emerald-700">kişi çevrimiçi</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-slate-400" />
                {formatNumber(realtime.mobile)} mobil
              </span>
              <span className="inline-flex items-center gap-1">
                <Monitor className="w-3 h-3 text-slate-400" />
                {formatNumber(realtime.desktop)} masaüstü
              </span>
            </div>
          </div>

          {/* 2. GÜNLÜK */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-blue-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Günlük Ziyaretçi
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Bugün
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 tabular-nums">
                  {formatNumber(daily.uniqueVisitors)}
                </span>
                <span className="text-xs font-semibold text-slate-500">tekil</span>
              </div>
              {daily.changePercent !== null && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    daily.changePercent >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {daily.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {daily.changePercent >= 0 ? `+${daily.changePercent}%` : `${daily.changePercent}%`}
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {formatNumber(daily.pageviews)} görüntüleme
              </span>
              <span>
                Dün: {formatNumber(daily.yesterdayVisitors)} • {formatNumber(todayOrders)} sipariş
              </span>
            </div>
          </div>

          {/* 3. HAFTALIK */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-violet-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-violet-600" />
                Haftalık Ziyaretçi
              </span>
              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                Son 7 Gün
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {formatNumber(weekly.uniqueVisitors)}
              </span>
              <span className="text-xs font-semibold text-slate-500">tekil</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {formatNumber(weekly.pageviews)} görüntüleme
              </span>
              <span>Ort. {formatNumber(weekly.dailyAverage)}/gün</span>
            </div>
          </div>

          {/* 4. YILLIK */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-orange-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6b1d2f] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6b1d2f]" />
                Yıllık Ziyaretçi
              </span>
              <span className="text-[10px] font-bold text-[#6b1d2f] bg-rose-50 px-2 py-0.5 rounded-full">
                {yearly.year} Yılı
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {formatNumber(yearly.uniqueVisitors)}
              </span>
              <span className="text-xs font-semibold text-slate-500">tekil</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {formatNumber(yearly.pageviews)} görüntüleme
              </span>
              <span>Ort. {formatNumber(yearly.dailyAverage)}/gün</span>
            </div>
          </div>
        </div>

        {/* Middle Row: 7-Day Trend Bar Chart + Live Active Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* 7-Day Bar Trend */}
          <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600">
                Son 7 Günlük Tekil Ziyaretçi Trendi
              </span>
              {hoveredDay && (
                <span className="text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                  {hoveredDay}
                </span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-2 items-end h-20">
              {weekly.trend.map((day, idx) => {
                const heightPct = day.visitors > 0 ? Math.max(14, Math.round((day.visitors / maxTrendVal) * 100)) : 6;
                const isToday = idx === weekly.trend.length - 1;
                return (
                  <div
                    key={day.date}
                    onClick={() =>
                      setHoveredDay(
                        `${day.label}: ${formatNumber(day.visitors)} ziyaretçi • ${formatNumber(day.pageviews)} görüntüleme`
                      )
                    }
                    onMouseEnter={() =>
                      setHoveredDay(
                        `${day.label}: ${formatNumber(day.visitors)} ziyaretçi • ${formatNumber(day.pageviews)} görüntüleme`
                      )
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex flex-col items-center justify-end h-full gap-1 cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                      {formatNumber(day.visitors)}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isToday
                            ? "bg-[#6b1d2f] group-hover:bg-[#8a263d]"
                            : day.visitors > 0
                            ? "bg-violet-400/80 group-hover:bg-violet-500"
                            : "bg-slate-200/80"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] truncate max-w-full ${
                        isToday ? "font-black text-[#6b1d2f]" : "font-medium text-slate-400"
                      }`}
                    >
                      {isToday ? "Bugün" : day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Currently Active Pages */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600">
                Şu An İncelenen Sayfalar
              </span>
              <span className="text-[10px] font-bold text-emerald-700">
                {formatNumber(realtime.activeVisitors)} aktif
              </span>
            </div>
            {realtime.activePages.length > 0 ? (
              <div className="space-y-1.5">
                {realtime.activePages.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center justify-between gap-2 bg-white border border-slate-200/70 rounded-lg px-2.5 py-1.5 text-[11px]"
                  >
                    <span className="font-mono text-slate-700 truncate" title={item.path}>
                      {item.path}
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {formatNumber(item.count)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center py-4">
                <p className="text-[11px] text-slate-400">
                  Şu an mağazada aktif ziyaretçi yok.<br />
                  Ziyaretçiler geldiğinde anlık olarak burada görünür.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Traffic Sources + Top Visited Pages (Last 7 Days) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Traffic Sources */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-600" />
                Trafik Kaynakları (Son 7 Gün)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Google Ads • Instagram • Doğrudan
              </span>
            </div>
            {trafficSources.length > 0 ? (
              <div className="space-y-2">
                {trafficSources.map((src) => {
                  const style = SOURCE_STYLE_MAP[src.source] || SOURCE_STYLE_MAP["Diğer"];
                  return (
                    <div key={src.source} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.badge}`}>
                          {src.source}
                        </span>
                        <span className="font-bold text-slate-700 tabular-nums">
                          {formatNumber(src.visits)} oturum{" "}
                          <span className="text-slate-400 font-medium">(%{src.percent})</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                          style={{ width: `${Math.max(4, src.percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 py-4 text-center">
                Yeni ziyaretler geldikçe trafik kaynakları (Google Ads, Instagram, Doğrudan vb.) burada otomatik sınıflandırılır.
              </p>
            )}
          </div>

          {/* Top Visited Pages */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <FileBarChart2 className="w-3.5 h-3.5 text-blue-600" />
                En Çok Ziyaret Edilen Sayfalar (Son 7 Gün)
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Görüntüleme sayısı
              </span>
            </div>
            {topPages.length > 0 ? (
              <div className="space-y-2">
                {topPages.map((pg) => (
                  <div key={pg.path} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <a
                        href={pg.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-slate-700 hover:text-[#6b1d2f] truncate transition"
                        title={pg.path}
                      >
                        {pg.path}
                      </a>
                      <span className="shrink-0 font-bold text-slate-700 tabular-nums">
                        {formatNumber(pg.views)}{" "}
                        <span className="text-slate-400 font-medium">(%{pg.percent})</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500/85 transition-all duration-500"
                        style={{ width: `${Math.max(4, pg.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 py-4 text-center">
                Sayfa ziyaretleri biriktikçe en çok incelenen ürün ve kategori sayfaları burada listelenir.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
