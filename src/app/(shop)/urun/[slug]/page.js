import React from "react";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import {
  getAllCategoriesServer,
  getPublishedProductsServer,
} from "@/lib/category-server";
import {
  resolveProductCategories,
  slugifyTr,
} from "@/lib/category-utils";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.pekefe.com";

function stripHtml(str = "") {
  return String(str || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toAbsoluteUrl(url) {
  if (!url || typeof url !== "string") return `${BASE_URL}/pekefe-dut-pekmezi-kavanoz-tr.jpg`;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `${BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

async function findProductBySlugServer(rawSlug) {
  const slug = decodeURIComponent(String(rawSlug || "")).trim();
  if (!slug) return null;
  const products = await getPublishedProductsServer();
  const lower = slug.toLowerCase();

  return (
    products.find((p) => {
      const pSlug = (p.slug || slugifyTr(p.name || "")).toLowerCase();
      return (
        pSlug === lower ||
        String(p.id || "").toLowerCase() === lower ||
        String(p.sku || "").toLowerCase() === lower
      );
    }) || null
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await findProductBySlugServer(slug);

  if (!product) {
    return {
      title: "Ürün Bulunamadı | PEKEFE İspir Yöresel Ürünler",
      robots: { index: false, follow: false },
    };
  }

  const canonicalSlug = product.slug || slugifyTr(product.name) || product.id;
  const canonicalUrl = `${BASE_URL}/urun/${canonicalSlug}`;
  const title = product.seoTitle || `${product.name} | PEKEFE İspir Yöresel Ürünler`;
  const cleanDesc = stripHtml(product.seoDesc || product.shortDesc || product.desc || "");
  const description =
    cleanDesc.length >= 40
      ? cleanDesc.slice(0, 158)
      : `${product.name} — Erzurum İspir'in doğal ve katkısız geleneksel lezzeti. PEKEFE güvencesiyle taze paketlenerek kapınızda.`;
  const imageUrl = toAbsoluteUrl(product.image);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PEKEFE İspir Yöresel Ürünler",
      locale: "tr_TR",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 1200,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function UrunDetayPage({ params }) {
  const resolvedParams = await params;
  const [product, allCategories] = await Promise.all([
    findProductBySlugServer(resolvedParams?.slug),
    getAllCategoriesServer({ activeOnly: true }),
  ]);

  let productJsonLd = null;
  let breadcrumbJsonLd = null;

  if (product) {
    const canonicalSlug = product.slug || slugifyTr(product.name) || product.id;
    const canonicalUrl = `${BASE_URL}/urun/${canonicalSlug}`;
    const mainImage = toAbsoluteUrl(product.image);
    const galleryImages = Array.isArray(product.images)
      ? product.images
          .filter((u) => typeof u === "string" && u.trim())
          .map(toAbsoluteUrl)
      : [];
    const allImages = Array.from(new Set([mainImage, ...galleryImages]));
    const cleanDesc = stripHtml(product.shortDesc || product.desc || product.name).slice(0, 500);
    const price = Number(product.price || 0);
    const stock = Number(product.stock ?? product.stock_quantity ?? 0);

    productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: allImages,
      description: cleanDesc,
      sku: product.sku || product.id,
      mpn: product.sku || product.id,
      brand: {
        "@type": "Brand",
        name: "PEKEFE",
      },
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "TRY",
        price: price.toFixed(2),
        availability:
          stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: "PEKEFE İspir Yöresel Ürünler",
        },
      },
    };

    const resolvedCats = resolveProductCategories(product, allCategories);
    const crumbItems = [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: BASE_URL },
    ];
    if (resolvedCats.main) {
      crumbItems.push({
        "@type": "ListItem",
        position: crumbItems.length + 1,
        name: resolvedCats.main.name,
        item: `${BASE_URL}/${resolvedCats.main.slug}`,
      });
    }
    if (resolvedCats.main && resolvedCats.sub) {
      crumbItems.push({
        "@type": "ListItem",
        position: crumbItems.length + 1,
        name: resolvedCats.sub.name,
        item: `${BASE_URL}/${resolvedCats.main.slug}/${resolvedCats.sub.slug}`,
      });
    }
    crumbItems.push({
      "@type": "ListItem",
      position: crumbItems.length + 1,
      name: product.name,
      item: canonicalUrl,
    });

    breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbItems,
    };
  }

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductDetailClient params={params} />
    </>
  );
}
