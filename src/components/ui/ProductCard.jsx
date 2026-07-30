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
    return attrs.size || attrs.name || v.name || v.size || "";
  }
  return v.size || v.name || "";
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

  // Determine displayed price
  const numericB2B = b2b_price ? Number(b2b_price) : null;
  const numericPrice = typeof price === "number" ? price : parseFloat(String(price || "0").replace(/[₺TL\s,]/gi, "")) || 0;
  const numericOld = oldPrice ? Number(oldPrice) : null;

  const displayPrice = isB2B && numericB2B ? numericB2B : numericPrice;
  const displayOld  = isB2B && numericB2B ? numericPrice : numericOld;

  // Format helper
  const fmt = (n) => `₺${Number(n).toLocaleString("tr-TR")}`;

  // Price display string
  let priceDisplay;
  if (priceMin != null && priceMax != null && priceMin !== priceMax) {
    // Multiple variants with different prices
    if (isB2B && numericB2B) {
      priceDisplay = <span className="text-xl font-display-lg text-amber-700 font-bold">{fmt(numericB2B)} <span className="text-xs font-normal text-slate-500">Bayi</span></span>;
    } else {
      priceDisplay = (
        <span className="text-xl font-display-lg text-primary font-bold">
          {fmt(priceMin)}<span className="text-sm font-normal text-on-surface-variant mx-1">-</span>{fmt(priceMax)}
        </span>
      );
    }
  } else {
    priceDisplay = (
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-display-lg text-primary font-bold">{fmt(displayPrice)}</span>
        {displayOld && displayOld > displayPrice && (
          <span className="text-sm text-on-surface-variant line-through">{fmt(displayOld)}</span>
        )}
        {isB2B && numericB2B && (
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Bayi</span>
        )}
      </div>
    );
  }

  // Variant badge row (show up to 3 variants)
  const hasVariants = Array.isArray(variants) && variants.length > 0;

  const isOutOfStock = stock === 0;

  return (
    <div className={`flex flex-col md:flex-row gap-8 items-center border-b border-outline-variant/10 pb-12 ${className}`}>
      {/* Image Frame */}
      <div className="w-full md:w-1/2 aspect-square bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 relative group flex items-center justify-center p-4">
        {tag && (
          <span className="absolute top-4 left-4 bg-secondary text-white font-label-sm text-[9px] px-3 py-1 rounded-full uppercase font-bold shadow-sm tracking-wider z-10">
            {tag}
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-4 right-4 bg-slate-700 text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold z-10">
            Tükendi
          </span>
        )}
        {!imgError && image ? (
          <Image
            src={image}
            alt={name || "Pekefe Ürünü"}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-contain p-8 transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"
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
      <div className="w-full md:w-1/2 space-y-3">
        <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-widest">{meta}</span>
        <h3 className="font-display-lg text-primary text-xl font-bold leading-snug">
          {name}
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          {desc}
        </p>

        {/* Variant badges */}
        {hasVariants && (
          <div className="flex flex-wrap gap-2 pt-1">
            {variants.slice(0, 4).map((v, i) => {
              const label = getVariantLabel(v);
              const vPrice = v.price ? Number(v.price) : null;
              return (
                <span key={v.id || i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-outline-variant/30 bg-surface-container-low text-[11px] font-semibold text-primary">
                  {label}
                  {vPrice ? <span className="text-secondary font-bold">₺{vPrice.toLocaleString("tr-TR")}</span> : null}
                </span>
              );
            })}
            {variants.length > 4 && (
              <span className="text-[10px] text-on-surface-variant self-center">+{variants.length - 4} seçenek</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {priceDisplay}
          <div className="flex items-center gap-3">
            {onAddToCart && !isOutOfStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                className="bg-primary/5 hover:bg-primary text-primary hover:text-white p-2.5 rounded-lg border border-primary/10 transition-all cursor-pointer flex items-center justify-center"
                aria-label={`${name} sepete ekle`}
              >
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
              </button>
            )}
            <Link
              href={`/urun/${id}`}
              className="border border-secondary hover:bg-secondary hover:text-white text-secondary font-label-sm text-xs px-6 py-2.5 rounded-md tracking-wider uppercase transition-all"
            >
              Detayları Gör
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
