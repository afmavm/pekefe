"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";

export function ProductCard({
  id,
  name,
  desc,
  meta,
  price,
  image,
  tag,
  onAddToCart,
  className = ""
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`flex flex-col md:flex-row gap-8 items-center border-b border-outline-variant/10 pb-12 ${className}`}>
      {/* Image Frame */}
      <div className="w-full md:w-1/2 aspect-square bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 relative group flex items-center justify-center p-4">
        {tag && (
          <span className="absolute top-4 left-4 bg-secondary text-white font-label-sm text-[9px] px-3 py-1 rounded-full uppercase font-bold shadow-sm tracking-wider z-10">
            {tag}
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
      <div className="w-full md:w-1/2 space-y-4">
        <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-widest">{meta}</span>
        <h3 className="font-display-lg text-primary text-xl font-bold leading-snug">
          {name}
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          {desc}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-display-lg text-primary font-bold">{price}</span>
          <div className="flex items-center gap-3">
            {onAddToCart && (
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
