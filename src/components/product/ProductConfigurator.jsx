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
    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
      {/* Provenance & Title */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-secondary uppercase font-mono tracking-[0.25em] font-bold block">
            Rakım: {product?.altitude || product?.attributes?.altitude || "2000 Metre"} · Hasat:{" "}
            {product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos"}
          </span>
          {isOutOfStock && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              Stokta Tükenmiştir
            </span>
          )}
        </div>
        <h1 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold leading-tight tracking-tight">
          {product?.name}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex text-secondary">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
          </div>
          <span className="text-on-surface-variant font-label-sm text-xs uppercase tracking-wider underline cursor-pointer">
            Doğrulanmış Mahsul Raporları
          </span>
        </div>
      </div>

      {/* Variant Selector */}
      {variantsList.length > 0 && (
        <div className="space-y-3 p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-secondary">straighten</span>
              Gramaj / Ürün Çeşidi:
            </label>
            <span className="text-xs text-secondary font-bold font-mono">
              {getVariantLabel(selectedVariant)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
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
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-start gap-0.5 cursor-pointer ${
                    isSelected
                      ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20 scale-102"
                      : vStock <= 0 
                      ? "border-gray-200 bg-gray-100 text-gray-400 line-through"
                      : "border-outline-variant/30 bg-surface text-on-surface-variant hover:border-secondary/60 hover:bg-secondary/5"
                  }`}
                >
                  {hasBoth ? (
                    <>
                      <span className="font-extrabold leading-tight">{sizeText}</span>
                      <span className={`text-[10px] font-semibold ${isSelected ? "text-secondary-container" : "text-secondary"}`}>
                        {colorText}
                      </span>
                    </>
                  ) : (
                    <span>{label}</span>
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

      {/* Price */}
      <div className="border-b border-outline-variant/10 pb-6 space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-primary font-display-lg text-2xl md:text-3xl font-bold tracking-tight">₺{displayPrice}</span>
          {product?.oldPrice && Number(product.oldPrice) > Number(displayPrice) && (
            <span className="text-sm font-semibold text-slate-400 line-through font-mono">
              ₺{product.oldPrice}
            </span>
          )}
          {product?.oldPrice && Number(product.oldPrice) > Number(displayPrice) && (
            <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full animate-pulse">
              %{Math.round(((Number(product.oldPrice) - Number(displayPrice)) / Number(product.oldPrice)) * 100)} İNDİRİM
            </span>
          )}
        </div>
        {selectedVariant && selectedVariant.vatRate != null ? (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-mono inline-block">
            %{selectedVariant.vatRate} KDV {selectedVariant.vatIncluded !== false ? "Dahil" : "Hariç"}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-mono inline-block">
            KDV Dahil
          </span>
        )}
      </div>

      {/* Summary Description */}
      <p className="text-slate-700 dark:text-slate-200 font-sans text-sm md:text-[15px] leading-relaxed font-medium">
        {summaryDescription}
      </p>

      {/* Micro Pillars */}
      <div className="grid grid-cols-2 gap-4 border-y border-outline-variant/15 py-5">
        <div className="flex items-center gap-3 p-3 bg-surface-container-low/60 rounded-2xl border border-outline-variant/10">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">eco</span>
          </div>
          <span className="text-xs text-slate-800 dark:text-slate-100 font-extrabold uppercase tracking-wider">%100 Doğal &amp; Saf</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-surface-container-low/60 rounded-2xl border border-outline-variant/10">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">local_fire_department</span>
          </div>
          <span className="text-xs text-slate-800 dark:text-slate-100 font-extrabold uppercase tracking-wider">Odun Ateşinde Bakır</span>
        </div>
      </div>

      {/* Action Pane */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center border border-outline-variant/30 rounded-lg overflow-hidden h-14 bg-surface shadow-inner"
            role="group"
            aria-label="Ürün adedi"
          >
            <button
              onClick={() => handleQuantityChange(-1)}
              className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant disabled:opacity-30"
              aria-label="Adet azalt"
              disabled={isOutOfStock}
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <input
              className="w-10 text-center border-none focus:ring-0 font-bold bg-transparent outline-none text-sm font-mono"
              type="number"
              value={isOutOfStock ? 0 : quantity}
              readOnly
              aria-label="Seçili adet"
              aria-live="polite"
            />
            <button
              onClick={() => handleQuantityChange(1)}
              className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant disabled:opacity-30"
              aria-label="Adet artır"
              disabled={isOutOfStock}
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          {isOutOfStock ? (
            <Button disabled size="lg" className="flex-grow shadow-md h-14 bg-slate-300 text-slate-600 border border-slate-300 cursor-not-allowed">
              <span className="material-symbols-outlined text-base mr-1">block</span>
              Stokta Tükenmiştir
            </Button>
          ) : (
            <Button onClick={handleAddToCart} size="lg" className="flex-grow shadow-md h-14">
              Sepete Ekle
            </Button>
          )}
        </div>

        <div className="flex gap-4 pt-2">
          <Button
            variant={isFavorite ? "default" : "outline"}
            className={`flex-1 h-12 cursor-pointer flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider ${
              isFavorite
                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md shadow-rose-600/20"
                : "bg-surface hover:border-rose-300 hover:text-rose-600 text-on-surface-variant"
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
            className="flex-1 h-12 bg-surface cursor-pointer flex items-center justify-center gap-2 hover:border-secondary hover:text-secondary transition"
            onClick={handleShareClick}
          >
            <span className="material-symbols-outlined text-base">share</span>
            Paylaş
          </Button>
        </div>
      </div>

      {/* Quick Trust Metrics */}
      <div className="p-5 bg-surface-container-low border border-outline-variant/10 rounded-xl space-y-3">
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
          <span>İspir'den doğrudan kapınıza kargo (24 saatte kargoya verilir)</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
          <span>Analiz sertifikalı ve Coğrafi İşaret logolu orijinal kutu</span>
        </div>
      </div>
    </div>
  );
}
