"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

function CampaignCountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) return;
    const calculateTime = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl p-4 space-y-2 shadow-md animate-pulse">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">schedule</span> Sınırlı Süreli Kampanya Fırsatı
        </span>
        <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full uppercase">Canlı İndirim</span>
      </div>
      <div className="flex items-center gap-2 font-mono font-black text-lg justify-center sm:justify-start">
        <div className="flex flex-col items-center bg-black/20 px-2.5 py-1 rounded-xl">
          <span className="text-xl leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="text-[9px] font-sans text-orange-200 uppercase font-semibold">Gün</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center bg-black/20 px-2.5 py-1 rounded-xl">
          <span className="text-xl leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-[9px] font-sans text-orange-200 uppercase font-semibold">Saat</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center bg-black/20 px-2.5 py-1 rounded-xl">
          <span className="text-xl leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-[9px] font-sans text-orange-200 uppercase font-semibold">Dakika</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center bg-black/20 px-2.5 py-1 rounded-xl">
          <span className="text-xl leading-none text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-[9px] font-sans text-orange-200 uppercase font-semibold">Saniye</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductConfigurator
 * Right column of the product detail showcase grid.
 * Includes: variant pills, price, quantity stepper, CTA buttons, trust metrics.
 *
 * Extracted from urun/[slug]/page.js (lines 628-789).
 */
export function ProductConfigurator({
  product,
  variantsList,
  selectedVariant,
  setSelectedVariant,
  getVariantLabel,
  displayPrice,
  displayOldPrice,
  discountPercent,
  summaryDescription,
  quantity,
  handleQuantityChange,
  handleAddToCart,
  isFavorite,
  handleFavoriteToggle,
  handleShareClick,
}) {
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock != null ? product.stock : 0);
  const isOutOfStock = currentStock <= 0;

  return (
    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
      {/* Provenance & Title */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] sm:text-[11px] font-extrabold text-secondary uppercase font-mono tracking-wider">
            <span className="material-symbols-outlined text-[14px]">terrain</span>
            Rakım: {product?.altitude || product?.attributes?.altitude || "2200 Metre"} · Hasat: {product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos"}
          </span>
          {isOutOfStock && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              Stokta Tükenmiştir
            </span>
          )}
        </div>

        <h1 className="font-display-lg text-primary dark:text-amber-400 text-2xl sm:text-3xl lg:text-[30px] font-extrabold leading-snug tracking-tight text-slate-900">
          {product?.name}
        </h1>

        <div className="flex items-center gap-3 pt-0.5">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined text-[17px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">5.0</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs font-bold text-secondary hover:underline cursor-pointer flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Doğrulanmış Mahsul Raporlu
          </span>
        </div>
      </div>

      {/* Variant Selector */}
      {variantsList.length > 0 && (
        <div className="space-y-3 p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-secondary">straighten</span>
              Gramaj / Ürün Çeşidi:
            </label>
            <span className="text-xs text-secondary font-black font-mono">
              {getVariantLabel(selectedVariant)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {variantsList.map((v, i) => {
              const label = getVariantLabel(v);
              const isSelected = selectedVariant
                ? selectedVariant.id === v.id || getVariantLabel(selectedVariant) === label
                : i === 0;
              let attrs = v.attributes;
              if (typeof attrs === "string") {
                try { attrs = JSON.parse(attrs); } catch {}
              }
              const sizeText = (attrs?.size || v.size || "").trim();
              const colorText = (attrs?.color || v.color || "").trim();
              const hasBoth = sizeText && colorText && sizeText !== colorText;
              const vStock = v.stock != null ? v.stock : (product?.stock || 0);

              return (
                <button
                  key={v.id || i}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-start gap-0.5 cursor-pointer shadow-xs ${
                    isSelected
                      ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/25 ring-2 ring-secondary/30 scale-[1.02]"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-secondary hover:bg-secondary/5"
                  }`}
                >
                  <span className="leading-snug">{sizeText || label}</span>
                  {hasBoth && (
                    <span className={`text-[10px] font-normal ${isSelected ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                      {colorText}
                    </span>
                  )}
                  <span className={`font-mono font-extrabold mt-0.5 ${isSelected ? "text-white" : "text-secondary"}`}>
                    ₺{v.price} {vStock <= 0 ? "(Stok Yok)" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaign Countdown Timer */}
      {(product?.discount_end_date || product?.attributes?.discount_end_date) && (
        <CampaignCountdownTimer endDate={product?.discount_end_date || product?.attributes?.discount_end_date} />
      )}

      {/* Price Block */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-primary dark:text-amber-400 font-display-lg text-3xl sm:text-4xl font-black tracking-tight font-mono">
            ₺{displayPrice}
          </span>
          {displayOldPrice && Number(displayOldPrice) > Number(displayPrice) && (
            <span className="text-base font-semibold text-slate-400 line-through font-mono">
              ₺{displayOldPrice}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full animate-pulse font-mono">
              %{discountPercent} İNDİRİM
            </span>
          )}
        </div>
        <div>
          {selectedVariant && selectedVariant.vatRate != null ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/80 font-mono inline-block">
              %{selectedVariant.vatRate} KDV {selectedVariant.vatIncluded !== false ? "Dahil" : "Hariç"}
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/80 font-mono inline-block">
              %1 KDV Dahil
            </span>
          )}
        </div>
      </div>

      {/* Short Summary Description */}
      {summaryDescription && (
        <p className="text-slate-700 dark:text-slate-200 font-sans text-sm md:text-[15px] leading-relaxed font-medium">
          {summaryDescription}
        </p>
      )}

      {/* Micro Pillars */}
      <div className="grid grid-cols-2 gap-3.5 border-y border-slate-200 dark:border-slate-800 py-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">eco</span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider">%100 Doğal &amp; Katkısız</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">local_fire_department</span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider">Odun Ateşinde Bakır</span>
        </div>
      </div>

      {/* Action Pane */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden h-13 bg-white dark:bg-slate-800 shadow-xs"
            role="group"
            aria-label="Ürün adedi"
          >
            <button
              onClick={() => handleQuantityChange(-1)}
              className="px-3.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-600 dark:text-slate-300 disabled:opacity-30 h-full flex items-center justify-center"
              aria-label="Adet azalt"
              disabled={isOutOfStock}
            >
              <span className="material-symbols-outlined text-sm font-bold">remove</span>
            </button>
            <input
              className="w-10 text-center border-none focus:ring-0 font-extrabold bg-transparent outline-none text-sm font-mono text-slate-800 dark:text-white"
              type="number"
              value={isOutOfStock ? 0 : quantity}
              readOnly
              aria-label="Seçili adet"
              aria-live="polite"
            />
            <button
              onClick={() => handleQuantityChange(1)}
              className="px-3.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-600 dark:text-slate-300 disabled:opacity-30 h-full flex items-center justify-center"
              aria-label="Adet artır"
              disabled={isOutOfStock}
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
            </button>
          </div>

          {isOutOfStock ? (
            <Button disabled size="lg" className="flex-grow shadow-md h-13 bg-slate-300 text-slate-600 border border-slate-300 cursor-not-allowed rounded-xl font-bold">
              <span className="material-symbols-outlined text-base mr-1">block</span>
              Stokta Tükenmiştir
            </Button>
          ) : (
            <Button onClick={handleAddToCart} size="lg" className="flex-grow shadow-lg shadow-primary/20 h-13 rounded-xl font-extrabold text-sm uppercase tracking-wider">
              Sepete Ekle
            </Button>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant={isFavorite ? "default" : "outline"}
            className={`flex-1 h-11 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider ${
              isFavorite
                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md shadow-rose-600/20"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 text-slate-700 dark:text-slate-200"
            }`}
            onClick={handleFavoriteToggle}
          >
            <span
              className={`material-symbols-outlined text-lg ${isFavorite ? "text-white" : "text-rose-500"}`}
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            {isFavorite ? "Favorilerinizde" : "Favorilere Ekle"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-2 hover:border-secondary hover:text-secondary transition text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider"
            onClick={handleShareClick}
          >
            <span className="material-symbols-outlined text-base">share</span>
            Paylaş
          </Button>
        </div>
      </div>

      {/* Quick Trust Metrics */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-xs">
        <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0">local_shipping</span>
          <span>İspir'den doğrudan kapınıza kargo (24 saatte kargoya verilir)</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">verified_user</span>
          <span>Analiz sertifikalı ve Coğrafi İşaret logolu orijinal kutu</span>
        </div>
      </div>
    </div>
  );
}
