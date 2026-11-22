import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ArrowRight } from "lucide-react";
import type { CategoryRecord } from "@/lib/category-utils";
import CategoryCatalogClient from "./CategoryCatalogClient";

interface CategoryPageViewProps {
  mainCategory: CategoryRecord;
  activeSubCategory?: CategoryRecord | null;
  subCategories: CategoryRecord[];
  relatedCategories: CategoryRecord[];
  products: any[];
}

export default function CategoryPageView({
  mainCategory,
  activeSubCategory = null,
  subCategories,
  relatedCategories,
  products,
}: CategoryPageViewProps) {
  const displayCategory = activeSubCategory || mainCategory;
  const heroImage = displayCategory.image || mainCategory.image || "/ispir-manzara-hero.png";
  const pageUrl = activeSubCategory
    ? `https://pekefe.com/${mainCategory.slug}/${activeSubCategory.slug}`
    : `https://pekefe.com/${mainCategory.slug}`;

  // BreadcrumbList JSON-LD
  const breadcrumbItems: any[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Ana Sayfa",
      item: "https://pekefe.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: mainCategory.name,
      item: `https://pekefe.com/${mainCategory.slug}`,
    },
  ];

  if (activeSubCategory) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: activeSubCategory.name,
      item: pageUrl,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // CollectionPage + ItemList JSON-LD
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: displayCategory.name,
    description: displayCategory.metaDescription || displayCategory.shortDesc || "",
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://pekefe.com/urun/${p.id}`,
        name: p.name,
      })),
    },
  };

  const seoParagraphs = (displayCategory.seoDesc || "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-stone-950">
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Breadcrumb Bar */}
      <div className="border-b border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Sayfa konumu" className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            <Link href="/" className="hover:text-[#5D1924] transition-colors font-medium">
              Ana Sayfa
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            {activeSubCategory ? (
              <>
                <Link
                  href={`/${mainCategory.slug}`}
                  className="hover:text-[#5D1924] transition-colors font-medium"
                >
                  {mainCategory.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-stone-900 dark:text-stone-100 font-semibold" aria-current="page">
                  {activeSubCategory.name}
                </span>
              </>
            ) : (
              <span className="text-stone-900 dark:text-stone-100 font-semibold" aria-current="page">
                {mainCategory.name}
              </span>
            )}
          </nav>
        </div>
      </div>

      {/* Category Hero Banner */}
      <section className="relative overflow-hidden border-b border-stone-200 dark:border-stone-800 bg-stone-900">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={`${displayCategory.name} - PEKEFE Erzurum İspir Geleneksel Ürünler`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A0D12]/90 via-[#2A0D12]/65 to-[#2A0D12]/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300/90 mb-3">
              Erzurum İspir · PEKEFE Geleneksel Ürünler
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
              {displayCategory.name}
            </h1>
            {displayCategory.shortDesc && (
              <p className="text-stone-200 text-base sm:text-lg leading-relaxed font-normal">
                {displayCategory.shortDesc}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content: Subcategories + Filter/Sort + Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <CategoryCatalogClient
          products={products}
          mainCategory={mainCategory}
          subCategories={subCategories}
          activeSubCategory={activeSubCategory}
        />

        {/* Özgün Kategori SEO İçerik Alanı */}
        {seoParagraphs.length > 0 && (
          <section
            aria-labelledby="category-seo-heading"
            className="mt-16 pt-12 border-t border-stone-200 dark:border-stone-800"
          >
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B5E3C] mb-2">
                İspir&apos;in Doğallığı, Gelenekten Gelen Lezzet
              </p>
              <h2
                id="category-seo-heading"
                className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-5"
              >
                {displayCategory.name} Hakkında
              </h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
                {seoParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* İlgili Kategoriler */}
        {relatedCategories.length > 0 && (
          <section
            aria-labelledby="related-categories-heading"
            className="mt-16 pt-12 border-t border-stone-200 dark:border-stone-800"
          >
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B5E3C] mb-1.5">
                  Keşfetmeye Devam Edin
                </p>
                <h2
                  id="related-categories-heading"
                  className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100"
                >
                  Diğer PEKEFE Kategorileri
                </h2>
              </div>
              <Link
                href="/kategoriler"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#5D1924] hover:underline"
              >
                Tüm Ürünler
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-[#5D1924]/50 transition-colors flex flex-col"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <Image
                      src={cat.image || "/ispir-manzara-hero.png"}
                      alt={`${cat.name} - PEKEFE`}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#5D1924] transition-colors">
                        {cat.name}
                      </h3>
                      {cat.shortDesc && (
                        <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {cat.shortDesc}
                        </p>
                      )}
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#5D1924]">
                      İncele
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
