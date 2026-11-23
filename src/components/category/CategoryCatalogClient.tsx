"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";
import { addToCart } from "@/utils/cartStorage";
import type { CategoryRecord } from "@/lib/category-utils";
import { Search, SlidersHorizontal, ArrowRight, PackageCheck } from "lucide-react";

interface CategoryCatalogClientProps {
  products: any[];
  mainCategory: CategoryRecord;
  subCategories: CategoryRecord[];
  activeSubCategory?: CategoryRecord | null;
  subCategoryCounts?: Record<string, number>;
  mainCategoryTotalCount?: number;
}

export default function CategoryCatalogClient({
  products,
  mainCategory,
  subCategories,
  activeSubCategory = null,
  subCategoryCounts = {},
  mainCategoryTotalCount,
}: CategoryCatalogClientProps) {
  const [sortBy, setSortBy] = useState<string>("newest");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const hasSalesData = useMemo(
    () => products.some((p) => Number(p?.salesCount || 0) > 0),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];

    if (onlyInStock) {
      list = list.filter((p) => Number(p?.stock ?? p?.stock_quantity ?? 0) > 0);
    }

    if (priceRange === "under500") {
      list = list.filter((p) => Number(p?.price || 0) < 500);
    } else if (priceRange === "500to1000") {
      list = list.filter((p) => {
        const pr = Number(p?.price || 0);
        return pr >= 500 && pr <= 1000;
      });
    } else if (priceRange === "over1000") {
      list = list.filter((p) => Number(p?.price || 0) > 1000);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          String(p?.name || "").toLowerCase().includes(q) ||
          String(p?.shortDesc || p?.desc || "").toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
        break;
      case "bestseller":
        list.sort((a, b) => Number(b?.salesCount || 0) - Number(a?.salesCount || 0));
        break;
      case "newest":
      default:
        list.sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        );
        break;
    }

    return list;
  }, [products, onlyInStock, priceRange, searchQuery, sortBy]);

  const handleAddToCart = (product: any) => {
    const chosenVariant = product?.selectedVariant || null;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.activePrice ?? product.price ?? 0),
        image: product.image,
        category: product.category || mainCategory.name,
        variant: chosenVariant,
        selectedVariant: chosenVariant,
      },
      1
    );
    setToastMsg(`${product.name} sepete eklendi.`);
    setToastOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Alt Kategori Bağlantıları (Mobilde Yatay Kaydırmalı, Masaüstünde Sarılı) */}
      {subCategories.length > 0 && (
        <nav
          aria-label="Alt Kategoriler"
          className="flex flex-nowrap sm:flex-wrap items-center gap-2.5 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-stone-200 dark:border-stone-800 pb-5"
          style={{ scrollbarWidth: "none" }}
        >
          <Link
            href={`/${mainCategory.slug}`}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
              !activeSubCategory
                ? "bg-[#5D1924] text-white border-[#5D1924]"
                : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#5D1924] hover:text-[#5D1924]"
            }`}
          >
            <span>Tümü</span>
            {typeof mainCategoryTotalCount === "number" && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${!activeSubCategory ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-500"}`}>
                {mainCategoryTotalCount}
              </span>
            )}
          </Link>
          {subCategories.map((sub) => {
            const isActive = activeSubCategory?.id === sub.id;
            const subCount = subCategoryCounts[sub.id];
            return (
              <Link
                key={sub.id}
                href={`/${mainCategory.slug}/${sub.slug}`}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                  isActive
                    ? "bg-[#5D1924] text-white border-[#5D1924]"
                    : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-[#5D1924] hover:text-[#5D1924]"
                }`}
              >
                <span>{sub.name}</span>
                {typeof subCount === "number" && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-500"}`}>
                    {subCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Filtre ve Sıralama Çubuğu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            <strong className="text-stone-900 dark:text-white">{filteredProducts.length}</strong> ürün listeleniyor
          </span>

          <span className="hidden sm:inline-block h-4 w-px bg-stone-300 dark:bg-stone-700" />

          <label className="inline-flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-[#5D1924] focus:ring-[#5D1924]"
            />
            <PackageCheck className="w-4 h-4 text-[#5D1924]" />
            <span>Stokta Olanlar</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {products.length > 0 && (
            <select
              aria-label="Fiyat Aralığı"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-sm font-medium rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#5D1924]"
            >
              <option value="all">Tüm Fiyatlar</option>
              <option value="under500">₺500 Altı</option>
              <option value="500to1000">₺500 – ₺1.000</option>
              <option value="over1000">₺1.000 Üzeri</option>
            </select>
          )}
          {products.length > 2 && (
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kategori içinde ara..."
                aria-label="Kategori içinde ara"
                className="w-full sm:w-52 pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#5D1924]"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-stone-500 shrink-0" />
            <label htmlFor="category-sort" className="sr-only">
              Sıralama
            </label>
            <select
              id="category-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-sm font-medium rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#5D1924]"
            >
              <option value="newest">En Yeni Ürünler</option>
              <option value="price_asc">Fiyat: Artan</option>
              <option value="price_desc">Fiyat: Azalan</option>
              {hasSalesData && <option value="bestseller">Çok Satanlar</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Ürün Listesi veya Şeffaf Boş Durum */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => handleAddToCart(product)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 px-6 py-14 text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B5E3C] mb-2">
            Mevsimlik Hasat &amp; Hazırlık
          </p>
          <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3">
            {searchQuery || onlyInStock || priceRange !== "all"
              ? "Seçtiğiniz filtrelere uygun ürün bulunamadı"
              : `${activeSubCategory ? activeSubCategory.name : mainCategory.name} koleksiyonumuz hazırlanıyor`}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
            {searchQuery || onlyInStock || priceRange !== "all"
              ? "Arama ifadesini temizleyebilir veya fiyat/stok filtresini kaldırarak tüm ürünleri görebilirsiniz."
              : "İspir'in mevsimlik hasat takvimine göre yeni ürünlerimiz özenle hazırlanıp satışa açılmaktadır. Bu süreçte stokta bulunan diğer doğal lezzetlerimizi inceleyebilirsiniz."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(searchQuery || onlyInStock || priceRange !== "all") ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setOnlyInStock(false);
                  setPriceRange("all");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#5D1924] text-white text-sm font-semibold hover:bg-[#4a131c] transition-colors"
              >
                Filtreleri Temizle
              </button>
            ) : (
              <Link
                href="/kategoriler"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D1924] text-white text-sm font-semibold hover:bg-[#4a131c] transition-colors"
              >
                Tüm Ürünleri İncele
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      <Toast message={toastMsg} isOpen={toastOpen} onClose={() => setToastOpen(false)} />
    </div>
  );
}
