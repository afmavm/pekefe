"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

function CardCountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    // Target endDate if available, or default to a 24h flash deal
    const targetTime = endDate 
      ? new Date(endDate).getTime() 
      : (Date.now() + 24 * 60 * 60 * 1000);

    const calculateTime = () => {
      const difference = targetTime - Date.now();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-orange-50 border border-orange-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 text-[10px] font-bold text-orange-700 shadow-2xs">
      <span className="flex items-center gap-1 font-mono">
        <span className="material-symbols-outlined text-xs text-orange-500">schedule</span> Fırsat Bitiş:
      </span>
      <span className="font-mono font-black text-orange-800 tracking-wider">
        {String(timeLeft.hours).padStart(2, "0")}s {String(timeLeft.minutes).padStart(2, "0")}d {String(timeLeft.seconds).padStart(2, "0")}s
      </span>
    </div>
  );
}

function getVariantLabel(v) {
  if (!v) return "";
  let attrs = v.attributes;
  if (typeof attrs === "string") {
    try { attrs = JSON.parse(attrs); } catch (e) {}
  }
  let label = "";
  if (attrs && typeof attrs === "object") {
    const size  = (attrs.size  || "").trim();
    const color = (attrs.color || "").trim();
    if (size && color && size !== color) label = `${size} · ${color}`;
    else if (size)  label = size;
    else if (color) label = color;
    else label = attrs.name || v.name || v.size || "";
  } else {
    label = v.size || v.name || "";
  }

  // Clean leading dashes, currency symbols or price suffixes embedded in string
  return String(label)
    .replace(/^[\s\-–—]+/, "")
    .replace(/-\s*₺\d+/gi, "")
    .trim();
}

function stripHtmlTags(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ProductCard({
  id,
  name,
  desc,
  shortDesc,
  meta,
  price,
  priceMin,
  priceMax,
  oldPrice,
  b2b_price,
  discount_end_date,
  variants = [],
  image,
  tag,
  stock,
  onAddToCart,
  className = ""
}) {
  const [imgError, setImgError] = useState(false);
  const { data: session } = useSession();

  const cardDesc = shortDesc || desc || "";

  const isB2B = session?.user?.role === "dealer" || session?.user?.customer_type === "B2B";

  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? variants[0] : null);

  // Numeric computations
  const numericB2B = b2b_price ? Number(b2b_price) : null;
  const numericPrice = typeof price === "number" ? price : parseFloat(String(price || "0").replace(/[₺TL\s,]/gi, "")) || 0;
  const numericOld = oldPrice ? Number(oldPrice) : null;

  // Active Price Resolution
  let activePrice = numericPrice;
  let activeOldPrice = numericOld;

  if (selectedVariant) {
    if (selectedVariant.price != null && Number(selectedVariant.price) > 0) {
      activePrice = Number(selectedVariant.price);
    }
    if (selectedVariant.oldPrice != null && Number(selectedVariant.oldPrice) > 0) {
      activeOldPrice = Number(selectedVariant.oldPrice);
    }
  }

  if (isB2B && numericB2B) {
    activeOldPrice = activePrice;
    activePrice = numericB2B;
  }

  const fmt = (n) => `₺${Number(n).toLocaleString("tr-TR")}`;

  const isOutOfStock = stock === 0;

  return (
    <div className={`group relative bg-white dark:bg-slate-900 border border-outline-variant/15 hover:border-[#6b1d2f]/30 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full overflow-hidden ${className}`}>
      
      {/* Top Part: Image & Main Info */}
      <div className="space-y-4">
        
        {/* Luxury Editorial Image Frame */}
        <div className="w-full aspect-square bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 relative group/img shadow-xs">
          {tag ? (
            <span className="absolute top-3 left-3 bg-[#6b1d2f] text-white font-label-sm text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full uppercase font-bold shadow-md tracking-wider z-10">
              {tag}
            </span>
          ) : activeOldPrice && activeOldPrice > activePrice ? (
            <span className="absolute top-3 left-3 bg-red-600 text-white font-label-sm text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full uppercase font-bold shadow-md tracking-wider z-10 animate-pulse">
              %{Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100)} İNDİRİM
            </span>
          ) : null}
          {isOutOfStock && (
            <span className="absolute top-3 right-3 bg-slate-800 text-white text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full uppercase font-bold z-10 shadow-md">
              Tükendi
            </span>
          )}
          {!imgError && image ? (
            <Image
              src={image}
              alt={name || "Pekefe Ürünü"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
              unoptimized={typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">eco</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-2">
          {meta && (
            <span className="text-[10px] text-amber-800 dark:text-amber-400 font-mono uppercase tracking-widest block font-bold">
              {meta}
            </span>
          )}
          <h3 className="font-display-lg text-[#6b1d2f] dark:text-amber-300 text-base sm:text-lg font-bold leading-snug line-clamp-2">
            {name}
          </h3>
          {cardDesc && (
            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
              {stripHtmlTags(cardDesc)}
            </p>
          )}
        </div>

        {/* Interactive Variant Pills */}
        {hasVariants && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gramaj / Çeşit:</span>
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v, i) => {
                const label = getVariantLabel(v);
                const vPrice = v.price ? Number(v.price) : null;
                const isSelected = selectedVariant?.id === v.id || (selectedVariant && getVariantLabel(selectedVariant) === label);
                return (
                  <button
                    key={v.id || i}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer border ${
                      isSelected
                        ? "border-[#6b1d2f] bg-[#6b1d2f] text-white font-bold shadow-sm"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:border-[#6b1d2f]/40 font-medium"
                    }`}
                  >
                    <span>{label}</span>
                    {vPrice ? (
                      <span className={`font-bold ${isSelected ? "text-amber-300" : "text-[#c5a059]"}`}>
                        ₺{vPrice.toLocaleString("tr-TR")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Part: Pricing & Clean Action Buttons */}
      <div className="pt-4 mt-4 border-t border-outline-variant/15 space-y-3">
        
        {/* Live Campaign Countdown Timer for Discounted Items */}
        {activeOldPrice && activeOldPrice > activePrice && (
          <CardCountdownTimer endDate={discount_end_date} />
        )}

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-display-lg text-[#6b1d2f] dark:text-amber-400 font-extrabold tracking-tight">
              {fmt(activePrice)}
            </span>
            {activeOldPrice && activeOldPrice > activePrice && (
              <span className="text-xs text-slate-400 line-through font-medium">
                {fmt(activeOldPrice)}
              </span>
            )}
          </div>
          {isB2B && numericB2B && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Bayi</span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full">
          {onAddToCart && !isOutOfStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(selectedVariant);
              }}
              className="flex-1 bg-[#6b1d2f] hover:bg-[#521321] text-white px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-xs font-bold uppercase tracking-wider active:scale-95 shrink-0"
              aria-label={`${name} sepete ekle`}
            >
              <span className="material-symbols-outlined text-base">shopping_cart</span>
              <span>Sepete Ekle</span>
            </button>
          )}
          <Link
            href={`/urun/${id}`}
            className="border border-[#c5a059] text-[#6b1d2f] hover:bg-[#c5a059] hover:text-white text-xs px-3.5 py-2.5 rounded-xl tracking-wider uppercase transition-all font-bold text-center active:scale-95 shrink-0"
          >
            Detaylar
          </Link>
        </div>
      </div>

    </div>
  );
}
