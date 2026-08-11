"use client";

import { useCMS } from "@/context/CMSContext";
import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProducts } from "@/utils/productsStorage";
import { Flame, Clock, Tag } from "lucide-react";

export function DealSection() {
  const { cmsData } = useCMS();
  const [dealProducts, setDealProducts] = useState([]);

  const isActive = cmsData?.dealSectionActive === true || cmsData?.dealSectionActive === "true";

  useEffect(() => {
    if (!isActive) return;

    let targetIds = [];
    if (cmsData?.dealProductIds) {
      try {
        const parsed = typeof cmsData.dealProductIds === "string"
          ? JSON.parse(cmsData.dealProductIds)
          : cmsData.dealProductIds;
        if (Array.isArray(parsed)) targetIds = parsed;
      } catch (e) {}
    }

    const allProducts = getProducts();

    if (targetIds.length > 0) {
      const filtered = allProducts.filter((p) => targetIds.includes(String(p.id)));
      setDealProducts(filtered.length > 0 ? filtered : allProducts.slice(0, 4));
    } else {
      // Pick first 4 products as default deals
      setDealProducts(allProducts.slice(0, 4));
    }
  }, [cmsData?.dealSectionActive, cmsData?.dealProductIds, isActive]);

  if (!isActive || dealProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border-y border-amber-500/20 relative overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
              <Flame className="w-4 h-4 animate-bounce" />
              Sınırlı Rekolte Fırsatları
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Günün Öne Çıkan Fırsat Ürünleri
            </h2>
            <p className="text-xs md:text-sm text-on-surface-variant max-w-xl">
              İspir yaylalarının en özel rekolte ürünlerinde süreli özel fiyat avantajları.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-white/80 backdrop-blur px-4 py-2 rounded-2xl border border-orange-200 shadow-sm w-fit">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Stoklar Tükenmeden İnceleyin</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {dealProducts.map((product) => (
            <div key={product.id} className="relative group">
              <div className="absolute -top-2 -right-2 z-20 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                Fırsat Ürünü
              </div>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
