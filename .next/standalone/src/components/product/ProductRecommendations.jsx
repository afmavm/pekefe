"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * ProductRecommendations
 * Bottom grid section showing related boutique items.
 * Extracted from urun/[slug]/page.js for AGENTS.md §4 compliance.
 */
export function ProductRecommendations({
  recommendations,
  failedImages,
  setFailedImages,
  setToastMsg,
  setToastOpen,
}) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="mt-24 border-t border-outline-variant/15 pt-16">
      <h2 className="font-display-lg text-primary text-2xl md:text-3xl font-bold mb-8 tracking-tight">
        Seçkin Mahsuller Koleksiyonu
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {recommendations.map((rec) => (
          <div key={rec.id} className="group cursor-pointer">
            <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 relative aspect-[3/4] p-4 flex items-center justify-center">
              {failedImages[rec.id] ? (
                <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center text-primary z-10">
                  <span className="material-symbols-outlined text-3xl">eco</span>
                </div>
              ) : (
                <Image
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                  src={rec.image}
                  alt={rec.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  onError={() => setFailedImages((prev) => ({ ...prev, [rec.id]: true }))}
                />
              )}
              {rec.tag && (
                <span className="absolute top-4 left-4 bg-secondary text-white text-[8px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                  {rec.tag}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setToastMsg(`${rec.name} sepete eklendi!`);
                  setToastOpen(true);
                }}
                className="absolute bottom-4 right-4 bg-surface hover:bg-primary text-primary hover:text-white p-3.5 rounded-lg shadow-sm border border-outline-variant/20 transition-all cursor-pointer flex items-center justify-center z-10"
              >
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
              </button>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="font-display-lg text-primary text-sm font-bold leading-snug group-hover:underline">
                <Link href={`/urun/${rec.slug || rec.id}`}>{rec.name}</Link>
              </h3>
              <div className="text-secondary font-bold text-xs font-mono">₺{rec.price}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
