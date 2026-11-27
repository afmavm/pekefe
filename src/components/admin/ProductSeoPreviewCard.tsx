"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle, ExternalLink, Globe, ShoppingBag, Share2 } from "lucide-react";

interface ProductSeoPreviewCardProps {
  name: string;
  slug?: string;
  seoTitle?: string;
  seoDesc?: string;
  barcode?: string;
  price?: number;
  stock?: number;
  mediaCount?: number;
  description?: string;
}

function makePreviewSlug(name: string, slug?: string): string {
  if (slug && slug.trim()) return slug.trim();
  return String(name || "urun-adi")
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "urun-adi";
}

export default function ProductSeoPreviewCard({
  name,
  slug,
  seoTitle,
  seoDesc,
  barcode,
  price = 0,
  stock = 0,
  mediaCount = 0,
  description = "",
}: ProductSeoPreviewCardProps) {
  const effectiveSlug = makePreviewSlug(name, slug);
  const displayTitle = (seoTitle || "").trim() || `${name || "PEKEFE Ürün Adı"} | PEKEFE İspir Yöresel Ürünler`;
  const cleanFallbackDesc = String(description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const displayDesc =
    (seoDesc || "").trim() ||
    cleanFallbackDesc.slice(0, 158) ||
    "Erzurum İspir yaylalarından %100 doğal, ilave şekersiz ve katkısız geleneksel PEKEFE lezzeti. Güvenli ambalaj ve hızlı kargo ile kapınızda.";

  const titleLen = displayTitle.length;
  const descLen = displayDesc.length;
  const cleanBarcode = String(barcode || "").replace(/\D/g, "");
  const hasValidGtin = [8, 12, 13, 14].includes(cleanBarcode.length);

  const checks = [
    { label: "Ürün Adı", ok: Boolean(name && name.trim().length >= 3) },
    { label: "Satış Fiyatı (> ₺0)", ok: Number(price || 0) > 0 },
    { label: "Stok (> 0)", ok: Number(stock || 0) > 0 },
    { label: "Ürün Görseli", ok: Number(mediaCount || 0) > 0 },
    { label: "EAN / GTIN Barkod", ok: hasValidGtin },
    { label: "Açıklama (20+ krk)", ok: displayDesc.length >= 20 },
  ];
  const passedCount = checks.filter((c) => c.ok).length;
  const readyPct = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
      {/* 1. Canlı Google Arama (SERP) Önizlemesi */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            Canlı Google Arama (SERP) Önizlemesi
          </span>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span
              className={`px-2 py-0.5 rounded-full ${
                titleLen <= 60 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              Başlık: {titleLen}/60
            </span>
            <span
              className={`px-2 py-0.5 rounded-full ${
                descLen >= 100 && descLen <= 160
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Açıklama: {descLen}/160
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="w-5 h-5 rounded-full bg-[#6b1d2f] text-amber-300 font-black text-[9px] flex items-center justify-center shrink-0">
              P
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 leading-tight">PEKEFE İspir Yöresel Ürünler</div>
              <div className="text-[10px] text-slate-500 truncate">
                https://www.pekefe.com › urun › {effectiveSlug}
              </div>
            </div>
          </div>
          <p className="text-[15px] font-semibold text-[#1a0dab] leading-snug line-clamp-1">
            {displayTitle}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {displayDesc}
          </p>
          {Number(price || 0) > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">
                ₺{Number(price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
              <span>·</span>
              <span className={Number(stock || 0) > 0 ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold"}>
                {Number(stock || 0) > 0 ? "Stokta var" : "Stokta yok"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Google Merchant Center & Sosyal Medya Uyumluluk Kartı */}
      <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              Google Merchant Center
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                readyPct === 100
                  ? "bg-emerald-100 text-emerald-800"
                  : readyPct >= 70
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-700"
              }`}
            >
              %{readyPct} Hazır
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {checks.map((c) => (
              <div
                key={c.label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${
                  c.ok
                    ? "bg-white border-emerald-200/80 text-emerald-800"
                    : "bg-white border-amber-200 text-amber-800"
                }`}
              >
                {c.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70">
          <a
            href="/google-merchant.xml"
            target="_blank"
            rel="noreferrer"
            className="flex-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 transition"
          >
            XML Feed <ExternalLink className="w-3 h-3" />
          </a>
          <Link
            href="/admin/social-media"
            className="flex-1 px-3 py-1.5 rounded-lg bg-[#6b1d2f] hover:bg-[#521423] text-white text-[10px] font-bold flex items-center justify-center gap-1 transition"
          >
            <Share2 className="w-3 h-3" /> Sosyal Medya AI
          </Link>
        </div>
      </div>
    </div>
  );
}
