"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { parseNumericPrice } from "@/utils/productsStorage";

function CardCountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) {
      setTimeLeft(null);
      return;
    }

    const targetTime = new Date(endDate).getTime();
    if (isNaN(targetTime)) return;

    const calculateTime = () => {
      const difference = targetTime - Date.now();
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
    <div className="bg-gradient-to-r from-rose-50 via-amber-50/70 to-rose-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
        </span>
        <span className="text-[11px] sm:text-xs font-black text-[#6b1d2f] dark:text-rose-300 uppercase tracking-wider truncate">
          Fırsat Bitiş
        </span>
      </div>

      <div className="flex items-center gap-1.5 font-mono shrink-0">
        {timeLeft.days > 0 && (
          <>
            <span className="bg-white dark:bg-slate-900 text-[#6b1d2f] dark:text-amber-400 text-xs font-black px-2 py-1 rounded-lg border border-rose-200 dark:border-slate-700 shadow-xs min-w-[26px] text-center">
              {timeLeft.days}g
            </span>
            <span className="text-[#6b1d2f]/50 dark:text-slate-500 text-xs font-black">:</span>
          </>
        )}
        <span className="bg-white dark:bg-slate-900 text-[#6b1d2f] dark:text-amber-400 text-xs sm:text-sm font-black px-2 py-1 rounded-lg border border-rose-200 dark:border-slate-700 shadow-xs min-w-[28px] text-center">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="text-[#6b1d2f]/50 dark:text-slate-500 text-xs font-black">:</span>
        <span className="bg-white dark:bg-slate-900 text-[#6b1d2f] dark:text-amber-400 text-xs sm:text-sm font-black px-2 py-1 rounded-lg border border-rose-200 dark:border-slate-700 shadow-xs min-w-[28px] text-center">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="text-[#6b1d2f]/50 dark:text-slate-500 text-xs font-black">:</span>
        <span className="bg-rose-600 text-white text-xs sm:text-sm font-black px-2 py-1 rounded-lg shadow-sm min-w-[28px] text-center animate-pulse">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
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

export function ProductCard(props) {
  const p = props.product || {};
  const id = props.id || p.id;
  const name = props.name || p.name;
  const desc = props.desc || p.desc;
  const shortDesc = props.shortDesc || p.shortDesc;
  const meta = props.meta || p.meta;
  const price = props.price ?? p.price ?? p.sale_price;
  const priceMin = props.priceMin ?? p.priceMin;
  const priceMax = props.priceMax ?? p.priceMax;
  const oldPrice = props.oldPrice ?? p.oldPrice ?? p.list_price;
  const list_price = props.list_price ?? p.list_price;
  const b2b_price = props.b2b_price ?? p.b2b_price;
  const discount_end_date = props.discount_end_date || p.discount_end_date;
  const discount_start_date = props.discount_start_date || p.discount_start_date;
  const isCampaignActive = props.isCampaignActive ?? p.isCampaignActive;
  const is_campaign_active = props.is_campaign_active ?? p.is_campaign_active;
  const is_discounted = props.is_discounted ?? p.is_discounted;
  const attributes = props.attributes || p.attributes || {};
  const badgeText1 = props.badgeText1 || p.badgeText1 || attributes?.badgeText1 || "";
  const badgeText2 = props.badgeText2 || p.badgeText2 || attributes?.badgeText2 || "";
  const variants = props.variants || p.variants || [];
  const image = props.image || p.image;
  const tag = props.tag || p.tag;
  const stock = props.stock ?? p.stock;
  const onAddToCart = props.onAddToCart;
  const className = props.className || "";

  const [imgError, setImgError] = useState(false);
  const { data: session } = useSession();

  const cardDesc = shortDesc || desc || "";
  const isB2B = session?.user?.role === "dealer" || session?.user?.customer_type === "B2B";

  // Attributes fallback
  const finalBadge1 = badgeText1 || attributes?.badgeText1 || "";
  const finalBadge2 = badgeText2 || attributes?.badgeText2 || "";
  const finalIsCampaign = isCampaignActive ?? is_campaign_active ?? is_discounted ?? attributes?.isCampaignActive ?? false;
  const finalEndDate = discount_end_date || attributes?.discount_end_date || null;

  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? variants[0] : null);

  // Active campaign status check
  const activeCampaign = Boolean(finalIsCampaign);

  // Numeric computations
  const rawListPrice = oldPrice || list_price || attributes?.oldPrice || attributes?.list_price;
  const numericPrice = parseNumericPrice(price);
  const numericOld = rawListPrice ? parseNumericPrice(rawListPrice) : null;
  const numericB2B = b2b_price ? parseNumericPrice(b2b_price) : null;

  // Active Price Resolution
  let activePrice = numericPrice;
  let activeOldPrice = (numericOld && numericOld > numericPrice) ? numericOld : null;

  if (selectedVariant) {
    if (selectedVariant.price != null && Number(selectedVariant.price) > 0) {
      activePrice = Number(selectedVariant.price);
    }
    // Only show oldPrice for variant if explicitly defined in database and higher than active price
    const variantOldPrice = selectedVariant.oldPrice != null ? Number(selectedVariant.oldPrice) : (selectedVariant.list_price != null ? Number(selectedVariant.list_price) : null);
    if (variantOldPrice && variantOldPrice > activePrice) {
      activeOldPrice = variantOldPrice;
    } else {
      activeOldPrice = null;
    }
  }

  if (isB2B && numericB2B) {
    activeOldPrice = activePrice;
    activePrice = numericB2B;
  }

  const fmt = (n) => `₺${Number(n).toLocaleString("tr-TR")}`;
  const isOutOfStock = stock === 0;

  const discountPercent = (activeOldPrice && activePrice && activeOldPrice > activePrice)
    ? Math.round(((activeOldPrice - activePrice) / activeOldPrice) * 100)
    : null;

  return (
    <div className={`group relative bg-white dark:bg-slate-900 border border-outline-variant/15 hover:border-[#6b1d2f]/30 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full overflow-hidden ${className}`}>
      
      {/* Top Part: Image & Main Info */}
      <div className="space-y-4">
        
        {/* Luxury Editorial Image Frame */}
        <div className="w-full aspect-square bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 relative group/img shadow-xs">
          
          {/* Top Left: Badges (Badge 1 & Badge 2 & Tag) */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5 max-w-[70%] pointer-events-none">
            {finalBadge1 && (
              <span className="bg-amber-500 text-amber-950 font-bold text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-xs uppercase tracking-wider truncate">
                {finalBadge1}
              </span>
            )}
            {finalBadge2 && (
              <span className="bg-[#6b1d2f] text-white font-bold text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-xs uppercase tracking-wider truncate">
                {finalBadge2}
              </span>
            )}
            {tag && !finalBadge1 && !finalBadge2 && (
              <span className="bg-[#6b1d2f] text-white font-bold text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full shadow-md tracking-wider uppercase">
                {tag}
              </span>
            )}
          </div>

          {/* Top Right: Discount Badge & Out of Stock */}
          <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
            {discountPercent && discountPercent > 0 && (
              <span className="bg-red-600 text-white font-black text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full shadow-md tracking-wider uppercase animate-pulse">
                %{discountPercent} İNDİRİM
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-slate-900 text-white text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold shadow-md">
                Tükendi
              </span>
            )}
          </div>

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
        {activeCampaign && finalEndDate && (
          <CardCountdownTimer endDate={finalEndDate} />
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
                onAddToCart(selectedVariant ? { ...selectedVariant, price: activePrice } : { price: activePrice, id: id });
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
