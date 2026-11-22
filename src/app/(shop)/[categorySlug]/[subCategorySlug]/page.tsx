import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCategoriesServer,
  getSubCategoryBySlugServer,
  getPublishedProductsServer,
} from "@/lib/category-server";
import { productMatchesCategory } from "@/lib/category-utils";
import CategoryPageView from "@/components/category/CategoryPageView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ categorySlug: string; subCategorySlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { categorySlug, subCategorySlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const match = await getSubCategoryBySlugServer(categorySlug, subCategorySlug, {
    activeOnly: true,
  });

  if (!match) {
    return {
      title: "Alt Kategori Bulunamadı | PEKEFE",
      robots: { index: false, follow: false },
    };
  }

  const { parent, sub } = match;
  const title = sub.metaTitle || `${sub.name} | ${parent.name} | PEKEFE`;
  const description =
    sub.metaDescription ||
    sub.shortDesc ||
    `${sub.name} çeşitlerini PEKEFE kalitesiyle inceleyin ve sipariş verin.`;
  const canonicalUrl = `https://pekefe.com/${parent.slug}/${sub.slug}`;
  const ogImgRaw = sub.image || parent.image || "/og-image.jpg";
  const ogImage = ogImgRaw.startsWith("http")
    ? ogImgRaw
    : `https://pekefe.com${ogImgRaw}`;

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
          alt: `${sub.name} - PEKEFE`,
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

export default async function SubCategoryPage({ params }: PageProps) {
  const { categorySlug, subCategorySlug } = await params;
  const allCategories = await getAllCategoriesServer({ activeOnly: true });

  const mainCategory = allCategories.find((c) => !c.parentId && c.slug === categorySlug);
  if (!mainCategory) {
    notFound();
  }

  const activeSubCategory = allCategories.find(
    (c) => c.parentId === mainCategory.id && c.slug === subCategorySlug
  );
  if (!activeSubCategory) {
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
    productMatchesCategory(p, activeSubCategory, allCategories)
  );
  const mainProducts = allProducts.filter((p) =>
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
      activeSubCategory={activeSubCategory}
      subCategories={subCategories}
      relatedCategories={relatedCategories}
      products={products}
      subCategoryCounts={subCategoryCounts}
      mainCategoryTotalCount={mainProducts.length}
    />
  );
}
