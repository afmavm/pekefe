"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/modules/catalog/store";
import { ShoppingBag, Flame, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import ProductCardClient from "@/components/ProductCardClient";
import { Link } from "@/navigation";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  oldPrice?: number | null;
  desc?: string | null;
  image?: string | null;
  category?: string | null;
  attributes?: any;
  rating?: number;
  reviews?: number;
  isCampaignActive?: boolean;
  stock?: number;
  is_discounted?: boolean;
  discount_display_text?: string;
  discount_end_date?: string | Date | null;
  server_time_utc?: string;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const t = useTranslations("Home");
  const tProducts = useTranslations("Products");
  const { addItem } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const addToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "/Logo.jpg",
      sku: product.sku || "",
      quantity: 1
    });
    toast.success(`${product.name} sepete eklendi!`);
  };

  const displayProducts = products && products.length > 0
    ? products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        oldPrice: p.oldPrice || Math.round(p.price * 1.3),
        desc: p.desc || "",
        image: p.image || null,
        category: p.category || "Arıcılık",
        attributes: p.attributes || {},
        rating: p.rating || 5,
        reviews: p.reviews || 12,
        isCampaignActive: p.isCampaignActive || false,
        stock: p.stock ?? 10,
        is_discounted: p.is_discounted,
        discount_display_text: p.discount_display_text,
        discount_end_date: p.discount_end_date,
        server_time_utc: p.server_time_utc,
      }))
    : [];

  const uniqueCategories = ["all", ...Array.from(new Set(displayProducts.map(p => p.category || "Arıcılık")))];

  const filteredProducts = activeCategory === "all"
    ? displayProducts
    : displayProducts.filter(p => p.category === activeCategory);

  return (
    <section id="urunler" className="py-24 sm:py-32 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 max-w-xl mx-auto">
          <span className="inline-flex items-center gap-2.5 glass-amber rounded-full px-5 py-2.5 text-xs sm:text-sm font-black text-amber-655 dark:text-amber-450 tracking-[0.15em] uppercase mb-4 shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5" /> {t("catalog_badge")}
          </span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
            {t("catalog_title_1")} <span className="text-gradient">{t("catalog_title_highlight")}</span>
          </h2>
          <p className="text-slate-655 dark:text-slate-400 text-sm sm:text-base mt-4 leading-relaxed font-body">
            {t("catalog_desc")}
          </p>
        </div>

        {/* Category Tabs */}
        {displayProducts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all border duration-250 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-orange-500 text-neutral-950 border-amber-500 shadow-md shadow-amber-500/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                }`}
              >
                {cat === "all" ? t("category_all") : cat.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {displayProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 dark:bg-zinc-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 max-w-lg mx-auto">
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">
              {t("catalog_no_products")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(p => (
              <ProductCardClient
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  category: p.category || "Arıcılık",
                  price: p.price,
                  oldPrice: p.oldPrice || null,
                  image: p.image || null,
                  rating: p.rating || 5,
                  reviews: p.reviews || 12,
                  isCampaignActive: p.isCampaignActive || false,
                  stock: p.stock ?? 10,
                  is_discounted: p.is_discounted,
                  discount_display_text: p.discount_display_text,
                  discount_end_date: p.discount_end_date,
                  server_time_utc: p.server_time_utc,
                  barcode: (p as any).barcode || (p as any).attributes?.barcode || null,
                  attributes: (p as any).attributes,
                }}
                primaryColor="#b45309"
                unitText={p.attributes?.unit || "adet"}
              />
            ))}
          </div>
        )}

        {/* Tüm Ürünleri Gör Butonu */}
        {displayProducts.length > 0 && (
          <div className="mt-16 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              {tProducts("show_all")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
