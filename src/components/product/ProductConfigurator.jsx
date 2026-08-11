"use client";

import { Button } from "@/components/ui/Button";

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
  return (
    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
      {/* Provenance & Title */}
      <div className="space-y-4">
        <span className="text-[10px] text-secondary uppercase font-mono tracking-[0.25em] font-bold block">
          Rakım: {product?.altitude || product?.attributes?.altitude || "2000 Metre"} · Hasat:{" "}
          {product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos"}
        </span>
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

              return (
                <button
                  key={v.id || i}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-start gap-0.5 cursor-pointer ${
                    isSelected
                      ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20 scale-102"
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
                    ₺{v.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price */}
      <div className="text-primary font-display-lg text-2xl md:text-3xl font-bold tracking-tight border-b border-outline-variant/10 pb-6 flex items-baseline gap-3">
        <span>₺{displayPrice}</span>
        {selectedVariant && selectedVariant.vatRate != null ? (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 font-mono">
            %{selectedVariant.vatRate} KDV {selectedVariant.vatIncluded !== false ? "Dahil" : "Hariç"}
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 font-mono">
            KDV Dahil
          </span>
        )}
      </div>

      {/* Summary Description */}
      <p className="text-on-surface-variant font-body-md text-sm md:text-base leading-relaxed font-light">
        {summaryDescription}
      </p>

      {/* Micro Pillars */}
      <div className="grid grid-cols-2 gap-4 border-y border-outline-variant/10 py-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">eco</span>
          <span className="font-label-sm text-xs text-on-surface font-bold uppercase tracking-wider">0% Katkı Maddesi</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary">history_edu</span>
          <span className="font-label-sm text-xs text-on-surface font-bold uppercase tracking-wider">Asırlık Tarifler</span>
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
              className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant"
              aria-label="Adet azalt"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <input
              className="w-10 text-center border-none focus:ring-0 font-bold bg-transparent outline-none text-sm font-mono"
              type="number"
              value={quantity}
              readOnly
              aria-label="Seçili adet"
              aria-live="polite"
            />
            <button
              onClick={() => handleQuantityChange(1)}
              className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant"
              aria-label="Adet artır"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          <Button onClick={handleAddToCart} size="lg" className="flex-grow shadow-md h-14">
            Sepete Ekle
          </Button>
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
