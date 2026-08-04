"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

function getVariantLabel(v) {
  if (!v) return "";
  let attrs = v.attributes;
  if (typeof attrs === "string") {
    try { attrs = JSON.parse(attrs); } catch (e) {}
  }
  if (attrs && typeof attrs === "object") {
    const size  = (attrs.size  || "").trim();
    const color = (attrs.color || "").trim();
    // If only one field exists, show it alone; if both exist combine with bullet
    if (size && color && size !== color) return `${size} · ${color}`;
    if (size)  return size;
    if (color) return color;
    return attrs.name || v.name || v.size || "";
  }
  return v.size || v.name || "";
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
  meta,
  price,
  priceMin,
  priceMax,
  oldPrice,
  b2b_price,
  variants = [],
  image,
  tag,
  stock,
  onAddToCart,
  className = ""
}) {
  const [imgError, setImgError] = useState(false);
  const { data: session } = useSession();

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
    <div className={`flex flex-col md:flex-row gap-8 items-center border-b border-outline-variant/10 pb-12 ${className}`}>
      {/* Image Frame - Luxury Editorial Full-Bleed Presentation */}
      <div className="w-full md:w-1/2 aspect-square bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/15 relative group shadow-sm hover:shadow-md transition-all">
        {tag && (
          <span className="absolute top-4 left-4 backdrop-blur-md bg-secondary/90 text-white font-label-sm text-[10px] px-3.5 py-1 rounded-full uppercase font-bold shadow-md tracking-wider z-10">
            {tag}
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-4 right-4 bg-slate-800/90 text-white text-[10px] px-3.5 py-1 rounded-full uppercase font-bold z-10 shadow-md">
            Tükendi
          </span>
        )}
        {!imgError && image ? (
          <Image
            src={image}
            alt={name || "Pekefe Ürünü"}
            fill
            sizes="(max-width: 768px) 100vw, 35vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            unoptimized={typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl">eco</span>
          </div>
        )}
      </div>

      {/* Editorial Description Column */}
      <div className="w-full md:w-1/2 space-y-4">
        <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-widest">{meta}</span>
        <h3 className="font-display-lg text-primary text-xl font-bold leading-snug">
          {name}
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-3">
          {stripHtmlTags(desc)}
        </p>

        {/* Interactive Variant Pills */}
        {hasVariants && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Gramaj / Ürün Çeşidi:</span>
            <div className="flex flex-wrap gap-2">
              {variants.map((v, i) => {
                const label = getVariantLabel(v);
                const vPrice = v.price ? Number(v.price) : null;
                const isSelected = selectedVariant?.id === v.id || (selectedVariant && getVariantLabel(selectedVariant) === label);
                return (
                  <button
                    key={v.id || i}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? "border-primary bg-primary text-white font-bold shadow-md scale-105"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:border-primary/50 font-medium"
                    }`}
                  >
                    <span>{label}</span>
                    {vPrice ? (
                      <span className={`font-bold ${isSelected ? "text-amber-300" : "text-secondary"}`}>
                        ₺{vPrice.toLocaleString("tr-TR")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clean Luxury Price Display */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-outline-variant/15">
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-2xl md:text-3xl font-display-lg text-primary font-extrabold tracking-tight">
              {fmt(activePrice)}
            </span>
            {activeOldPrice && activeOldPrice > activePrice && (
              <span className="text-sm text-on-surface-variant/70 line-through font-medium">
                {fmt(activeOldPrice)}
              </span>
            )}
            {isB2B && numericB2B && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Bayi</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onAddToCart && !isOutOfStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(selectedVariant);
                }}
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-sm font-label-md text-xs font-bold uppercase tracking-wider"
                aria-label={`${name} sepete ekle`}
              >
                <span className="material-symbols-outlined text-base">shopping_cart</span>
                <span>Sepete Ekle</span>
              </button>
            )}
            <Link
              href={`/urun/${id}`}
              className="border border-secondary hover:bg-secondary hover:text-white text-secondary font-label-sm text-xs px-5 py-2.5 rounded-lg tracking-wider uppercase transition-all font-bold"
            >
              Detaylar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
