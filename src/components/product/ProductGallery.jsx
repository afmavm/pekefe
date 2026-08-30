"use client";

import Image from "next/image";
import { isVideoUrl } from "@/lib/utils";

/**
 * ProductGallery
 * Main hero image display + horizontal thumbnail selector.
 * Extracted from urun/[slug]/page.js (lines 544-626) for AGENTS.md §4 compliance.
 *
 * @param {Object}   product        - Full product object
 * @param {Array}    mediaList      - Resolved media items [{id, type, url, name}]
 * @param {Object}   selectedMedia  - Currently active media item
 * @param {Function} setSelectedMedia
 * @param {string}   mainImage      - Fallback image URL
 * @param {Function} onImageClick   - Called when user clicks hero image (opens lightbox)
 */
export function ProductGallery({
  product,
  mediaList,
  selectedMedia,
  setSelectedMedia,
  mainImage,
  onImageClick,
}) {
  const isVideo =
    selectedMedia &&
    (selectedMedia.type === "video" || isVideoUrl(selectedMedia.url));

  const badge1 = product?.badgeText1 || product?.attributes?.badgeText1;
  const badge2 = product?.badgeText2 || product?.attributes?.badgeText2;
  const tag = product?.tag;

  return (
    <div className="lg:col-span-7 space-y-6">
      {/* Hero Display */}
      <div
        onClick={() => {
          if (!isVideo) onImageClick?.();
        }}
        className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/15 aspect-[4/5] md:aspect-square max-h-[650px] w-full relative shadow-md group cursor-zoom-in"
        title="Görseli büyütmek için tıklayın"
      >
        {/* Top Left: Badges (Badge 1 & Badge 2 & Tag) */}
        <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1.5 max-w-[75%] pointer-events-none">
          {badge1 && (
            <span className="bg-amber-500 text-amber-950 font-black text-[11px] sm:text-xs px-3.5 py-1 rounded-full shadow-lg backdrop-blur-xs uppercase tracking-wider">
              {badge1}
            </span>
          )}
          {badge2 && (
            <span className="bg-[#6b1d2f] text-white font-black text-[11px] sm:text-xs px-3.5 py-1 rounded-full shadow-lg backdrop-blur-xs uppercase tracking-wider">
              {badge2}
            </span>
          )}
          {tag && !badge1 && !badge2 && (
            <span className="backdrop-blur-md bg-secondary/90 text-white font-label-sm text-[10px] px-3.5 py-1.5 rounded-full uppercase font-bold shadow-md tracking-widest">
              {tag}
            </span>
          )}
        </div>

        {isVideo ? (
          <div className="w-full h-full relative flex items-center justify-center bg-on-surface rounded-xl overflow-hidden">
            <video
              src={selectedMedia.url}
              controls
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <>
            <Image
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              src={selectedMedia?.url || mainImage || "/premium-pekefe-kavanoz.png"}
              alt={product?.name || "Ürün Görseli"}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {/* Hover Zoom Badge Overlay */}
            <div className="absolute inset-0 bg-on-surface/25 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-surface/95 text-on-surface px-4 py-2.5 rounded-full text-xs font-extrabold shadow-xl border border-outline-variant/50 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="material-symbols-outlined text-lg text-secondary">zoom_in</span>
                <span>Tıkla &amp; Detaylı İncele</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Horizontal Thumbnail Strip */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
        {mediaList.length > 0
          ? mediaList.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedMedia(item)}
                className={`relative aspect-square bg-surface-container-low rounded-xl border overflow-hidden cursor-pointer w-20 flex-shrink-0 transition-all ${
                  selectedMedia?.url === item.url
                    ? "border-primary shadow-md ring-2 ring-primary/20 scale-105"
                    : "border-outline-variant/30 hover:border-outline opacity-80 hover:opacity-100"
                }`}
              >
                {item.type === "video" || isVideoUrl(item.url) ? (
                  <div className="relative w-full h-full bg-on-surface flex flex-col items-center justify-center text-secondary rounded-lg">
                    <span className="material-symbols-outlined text-2xl animate-pulse">play_circle</span>
                    <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">VIDEO</span>
                  </div>
                ) : (
                  <Image
                    className="object-cover"
                    src={item.url}
                    alt={`${product?.name} görsel ${index + 1}`}
                    fill
                    sizes="80px"
                  />
                )}
              </button>
            ))
          : (product?.images || [mainImage]).map((img, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedMedia({ type: "image", url: img })}
                className={`relative aspect-square bg-surface-container-low rounded-xl border overflow-hidden cursor-pointer w-20 flex-shrink-0 transition-all ${
                  selectedMedia?.url === img
                    ? "border-primary shadow-md ring-2 ring-primary/20 scale-105"
                    : "border-outline-variant/30 hover:border-outline opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  className="object-cover"
                  src={img}
                  alt={`${product?.name} görsel ${index + 1}`}
                  fill
                  sizes="80px"
                />
              </button>
            ))}
      </div>
    </div>
  );
}
