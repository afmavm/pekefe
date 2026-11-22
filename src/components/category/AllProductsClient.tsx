"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";
import { addToCart } from "@/utils/cartStorage";
import {
  trNormalize,
  productMatchesCategory,
  type CategoryRecord,
} from "@/lib/category-utils";
import { Search, SlidersHorizontal, ArrowRight, PackageCheck, ChevronDown } from "lucide-react";

interface AllProductsClientProps {
  initialProducts: any[];
  allCategories: CategoryRecord[];
  mainCategories: CategoryRecord[];
}

const BANNER_IMAGES = [
  { src: "/uploads/ispir-dut-bahcesi-hasat-baba-ogul.jpg", label: "1. Doğal Hasat" },
  { src: "/uploads/ispir-bakir-kazan-ahsap-cendere.webp", label: "2. Bakır Kazan" },
  { src: "/uploads/ispir-keten-bezde-pestil-serimi.webp", label: "3. İspir Güneşi" },
  { src: "/uploads/ispir-el-sarimi-pestil-cesitleri.webp", label: "4. Özel Yöresel Mahsul" },
];

export default function AllProductsClient({
  initialProducts,
  allCategories,
  mainCategories,
}: AllProductsClientProps) {
  // selectedCategoryId: "all" veya aktif bir CategoryRecord.id
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [expandedMainIds, setExpandedMainIds] = useState<Record<string, boolean>>({});
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const safeProducts = useMemo(
    () => (Array.isArray(initialProducts) ? initialProducts.filter(Boolean) : []),
    [initialProducts]
  );

  const getSubCategories = (parentId: string) =>
    allCategories
      .filter((c) => c.parentId === parentId && c.isActive !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of allCategories) {
      map[cat.id] = safeProducts.filter((p) =>
        productMatchesCategory(p, cat, allCategories)
      ).length;
    }
    return map;
  }, [allCategories, safeProducts]);

  const selectedCategoryObj = useMemo(
    () =>
      selectedCategoryId === "all"
        ? null
        : allCategories.find((c) => c.id === selectedCategoryId) || null,
    [selectedCategoryId, allCategories]
  );

  const filteredProducts = useMemo(() => {
    let result = [...safeProducts];

    if (selectedCategoryObj) {
      result = result.filter((p) =>
        productMatchesCategory(p, selectedCategoryObj, allCategories)
      );
    }

    if (onlyInStock) {
      result = result.filter((p) => Number(p.stock ?? p.stock_quantity ?? 0) > 0);
    }

    if (searchQuery.trim()) {
      const tokens = trNormalize(searchQuery).split(/\s+/).filter(Boolean);
      result = result.filter((p) => {
        const searchableText = trNormalize(
          `${p.name || ""} ${p.shortDesc || ""} ${p.desc || ""} ${p.category || ""} ${p.subCategory || ""}`
        );
        return tokens.every((token) => searchableText.includes(token));
      });
    }

    result = result.filter((p) => Number(p.price || 0) <= maxPrice);

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case "name-asc":
        result.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "tr"));
        break;
      case "bestseller":
        result.sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    return result;
  }, [safeProducts, selectedCategoryObj, allCategories, onlyInStock, searchQuery, maxPrice, sortBy]);

  const handleAddToCart = (product: any) => {
    const chosenVariant = product?.selectedVariant || null;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.activePrice ?? product.price ?? 0),
        image: product.image,
        category: product.category || "Geleneksel Ürünler",
        variant: chosenVariant,
        selectedVariant: chosenVariant,
      },
      1
    );
    setToastMsg(`${product.name} sepete eklendi.`);
    setToastOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] dark:bg-stone-950 pb-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-7">
        {/* HERO BANNER */}
        <header className="relative w-full h-[200px] md:h-[250px] rounded-3xl overflow-hidden shadow-lg flex items-center">
          <div className="absolute inset-0 grid grid-cols-4 z-0">
            {BANNER_IMAGES.map((img, i) => (
              <div
                key={i}
                className="relative overflow-hidden border-r border-white/10 last:border-0"
              >
                <Image
                  alt={img.label}
                  src={img.src}
                  fill
                  sizes="25vw"
                  className="object-cover brightness-75"
                  priority={i < 2}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#5D1924]/90 via-[#5D1924]/60 to-[#5D1924]/25 z-10" />
          <div className="relative z-20 px-8 md:px-16 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-amber-200/90 text-[10px] font-bold tracking-[0.2em] uppercase">
              PEKEFE · Erzurum İspir Geleneksel Ürünler
            </span>
            <h1 className="font-serif text-white text-[28px] md:text-[40px] font-bold leading-tight">
              {selectedCategoryObj ? selectedCategoryObj.name : "Tüm Ürünler"}
            </h1>
            <p className="text-white/80 text-sm">
              {filteredProducts.length} ürün listeleniyor
            </p>
          </div>
        </header>

        {/* MOBİL KATEGORİ ÇUBUĞU */}
        <div
          className="flex lg:hidden gap-2 overflow-x-auto pb-1 -mx-4 px-4"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              selectedCategoryId === "all"
                ? "bg-[#5D1924] text-white border-[#5D1924]"
                : "bg-white text-stone-700 border-stone-200"
            }`}
          >
            Tüm Ürünler ({safeProducts.length})
          </button>
          {mainCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                selectedCategoryId === cat.id
                  ? "bg-[#5D1924] text-white border-[#5D1924]"
                  : "bg-white text-stone-700 border-stone-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ANA İÇERİK GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SOL FİLTRE PANELİ */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
            {/* Arama */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Ürün Ara
              </p>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün ara..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-[#5D1924]"
                />
              </div>
            </div>

            {/* Kategoriler — Yeni 5 Ana + Alt Kategori Hiyerarşisi */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                Kategoriler
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    selectedCategoryId === "all"
                      ? "bg-[#5D1924] text-white"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  <span>Tüm Ürünler</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCategoryId === "all"
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                    }`}
                  >
                    {safeProducts.length}
                  </span>
                </button>

                {mainCategories.map((cat) => {
                  const subs = getSubCategories(cat.id);
                  const isActive = selectedCategoryId === cat.id;
                  const hasActiveChild = subs.some((s) => s.id === selectedCategoryId);
                  const isExpanded = Boolean(expandedMainIds[cat.id]) || isActive || hasActiveChild;
                  const count = categoryCounts[cat.id] ?? 0;

                  return (
                    <div key={cat.id} className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            if (subs.length > 0) {
                              setExpandedMainIds((prev) => ({ ...prev, [cat.id]: true }));
                            }
                          }}
                          className={`flex-1 flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-[#5D1924] text-white"
                              : hasActiveChild
                              ? "bg-[#5D1924]/10 text-[#5D1924]"
                              : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                          }`}
                        >
                          <span className="truncate pr-2">{cat.name}</span>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded-full shrink-0 ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                        {subs.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMainIds((prev) => ({
                                ...prev,
                                [cat.id]: !isExpanded,
                              }))
                            }
                            aria-label={`${cat.name} alt kategorileri`}
                            className="p-2 rounded-lg text-stone-400 hover:text-[#5D1924] hover:bg-stone-100 transition-colors cursor-pointer"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                isExpanded ? "rotate-180 text-[#5D1924]" : ""
                              }`}
                            />
                          </button>
                        )}
                        <Link
                          href={`/${cat.slug}`}
                          title={`${cat.name} sayfasına git`}
                          className="p-2 rounded-lg text-stone-400 hover:text-[#5D1924] hover:bg-stone-100 transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {subs.length > 0 && isExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-stone-200 dark:border-stone-800 ml-3">
                          {subs.map((sub) => {
                            const subActive = selectedCategoryId === sub.id;
                            const subCount = categoryCounts[sub.id] ?? 0;
                            return (
                              <div key={sub.id} className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategoryId(sub.id)}
                                  className={`flex-1 flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                    subActive
                                      ? "bg-[#5D1924] text-white font-semibold"
                                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-[#5D1924]"
                                  }`}
                                >
                                  <span className="truncate pr-1">{sub.name}</span>
                                  <span
                                    className={`text-[10px] ${
                                      subActive ? "text-white/80" : "text-stone-400"
                                    }`}
                                  >
                                    {subCount}
                                  </span>
                                </button>
                                <Link
                                  href={`/${cat.slug}/${sub.slug}`}
                                  title={`${sub.name} sayfasına git`}
                                  className="p-1 rounded text-stone-400 hover:text-[#5D1924]"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fiyat & Stok */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="uppercase tracking-wider text-stone-500">Maks. Fiyat</span>
                  <span className="text-[#5D1924]">₺{maxPrice.toLocaleString("tr-TR")}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#5D1924] cursor-pointer"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer pt-2 border-t border-stone-100 dark:border-stone-800">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5D1924]"
                />
                <PackageCheck className="w-4 h-4 text-[#5D1924]" />
                <span>Sadece Stokta Olanlar</span>
              </label>
            </div>
          </aside>

          {/* SAĞ ÜRÜN LİSTESİ */}
          <main className="lg:col-span-9 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 px-4 py-3">
              <span className="text-sm text-stone-600 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-white">
                  {filteredProducts.length}
                </strong>{" "}
                ürün listeleniyor
              </span>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-400" />
                <select
                  aria-label="Sıralama"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:border-[#5D1924]"
                >
                  <option value="newest">En Yeni Ürünler</option>
                  <option value="price-asc">Fiyat: Artan</option>
                  <option value="price-desc">Fiyat: Azalan</option>
                  <option value="bestseller">Çok Satanlar</option>
                  <option value="name-asc">İsim: A-Z</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-16 px-6 text-center">
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-white mb-2">
                  Seçilen filtrelere uygun ürün bulunamadı
                </h2>
                <p className="text-sm text-stone-500 mb-6">
                  Filtreleri temizleyerek tüm PEKEFE ürünlerini görüntüleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("all");
                    setSearchQuery("");
                    setMaxPrice(5000);
                    setOnlyInStock(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#5D1924] text-white text-sm font-semibold hover:bg-[#4a131c] transition-colors cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Toast message={toastMsg} isOpen={toastOpen} onClose={() => setToastOpen(false)} />
    </div>
  );
}
