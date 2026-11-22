import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCategoriesServer,
  getCategoryBySlugServer,
  getPublishedProductsServer,
} from "@/lib/category-server";
import { productMatchesCategory } from "@/lib/category-utils";
import CategoryPageView from "@/components/category/CategoryPageView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const category = await getCategoryBySlugServer(categorySlug, { activeOnly: true });

  if (!category) {
    return {
      title: "Kategori Bulunamadı | PEKEFE",
      robots: { index: false, follow: false },
    };
  }

  const title = category.metaTitle || `${category.name} | PEKEFE Geleneksel Ürünler`;
  const description =
    category.metaDescription ||
    category.shortDesc ||
    `${category.name} çeşitlerini PEKEFE kalitesiyle keşfedin.`;
  const canonicalUrl = `https://pekefe.com/${category.slug}`;
  const ogImage = category.image
    ? category.image.startsWith("http")
      ? category.image
      : `https://pekefe.com${category.image}`
    : "https://pekefe.com/og-image.jpg";

  const hasFilterParams = Object.keys(resolvedSearchParams || {}).length > 0;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: hasFilterParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PEKEFE Geleneksel Ürünler",
      locale: "tr_TR",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${category.name} - PEKEFE`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function MainCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const allCategories = await getAllCategoriesServer({ activeOnly: true });
  const mainCategory = allCategories.find((c) => !c.parentId && c.slug === categorySlug);

  if (!mainCategory) {
    notFound();
  }

  const subCategories = allCategories
    .filter((c) => c.parentId === mainCategory.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const relatedCategories = allCategories
    .filter((c) => !c.parentId && c.id !== mainCategory.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 4);

  const allProducts = await getPublishedProductsServer();
  const products = allProducts.filter((p) =>
    productMatchesCategory(p, mainCategory, allCategories)
  );
  const subCategoryCounts: Record<string, number> = {};
  for (const sub of subCategories) {
    subCategoryCounts[sub.id] = allProducts.filter((p) =>
      productMatchesCategory(p, sub, allCategories)
    ).length;
  }

  return (
    <CategoryPageView
      mainCategory={mainCategory}
      activeSubCategory={null}
      subCategories={subCategories}
      relatedCategories={relatedCategories}
      products={products}
      subCategoryCounts={subCategoryCounts}
      mainCategoryTotalCount={products.length}
    />
  );
}
