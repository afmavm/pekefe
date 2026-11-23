/**
 * sitemap.js — PEKEFE İspir Yöresel Ürünler Platformu (pekefe.com)
 * Next.js App Router tarafından otomatik olarak /sitemap.xml endpoint'ine dönüştürülür.
 */

import { prisma, withTimeout } from '@/lib/prisma';
import { readLocalProducts } from '@/lib/jsonProductDb';
import { getAllCategoriesServer } from '@/lib/category-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generateSlug(text) {
  if (!text) return '';
  const trMap = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };
  return text
    .toString()
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => trMap[match])
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const BASE_URL = 'https://www.pekefe.com';

const FALLBACK_PRODUCT_SLUGS = [
  'pekefe-geleneksel-ispir-dut-gun-pekmezi',
  'pekefe-geleneksel-ispir-cevizli-kome-cevizli-sucuk',
  'pekefe-hakiki-yaprak-dut-pestili',
  'pekefe-dogal-fermantasyon-ispir-dut-sirkesi',
];

const BLOG_SLUGS = [
  'pekmezli-kurabiye',
  'geleneksel-ispir-dut-pekmezi-nasil-uretilir',
  'pestil-ve-kome-hazirlamanin-incelikleri',
  'dut-pekmezinin-sagliga-faydalari',
  'ispir-yaylalarinin-2200m-rakimli-flora-zenginligi',
];

export default async function sitemap() {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/kategoriler`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/rekolte-kulubu`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/hikayemiz`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/tesisimiz`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/tadim-odasi`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${BASE_URL}/akademi`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${BASE_URL}/mensei-dogrulama`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${BASE_URL}/galeri`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/kampanyalar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/sss`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/iletisim`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
    { url: `${BASE_URL}/teslimat`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/gizlilik`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/sozlesme`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ];

  let productEntries = [];

  try {
    const dbProducts = await withTimeout(
      prisma.product.findMany({
        where: { isDeleted: false },
        select: { id: true, sku: true, name: true, attributes: true, updatedAt: true },
      }),
      1500,
      []
    );

    const localProducts = readLocalProducts();
    const combined = dbProducts && dbProducts.length > 0 ? dbProducts : localProducts;

    const activeProducts = combined.filter((p) => {
      if (p.isDeleted) return false;
      if (p.active === false) return false;
      const attrs = typeof p.attributes === 'object' && p.attributes ? p.attributes : {};
      if (attrs.isActive === false) return false;
      return true;
    });

    if (activeProducts.length > 0) {
      const seenUrls = new Set();
      for (const p of activeProducts) {
        const slug = p.slug || generateSlug(p.name || '') || p.id || p.sku;
        const fullUrl = `${BASE_URL}/urun/${slug}`;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          productEntries.push({
            url: fullUrl,
            lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
          });
        }
      }
    }
  } catch (e) {
    console.warn('[SITEMAP WARN] Fallback to default product slugs:', e);
  }

  if (productEntries.length === 0) {
    productEntries = FALLBACK_PRODUCT_SLUGS.map((slug) => ({
      url: `${BASE_URL}/urun/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));
  }

  const blogPages = BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date('2026-02-01'),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Aktif Ana ve Alt Kategoriler (Dinamik SEO Sitemap)
  let categoryEntries = [];
  try {
    const activeCategories = await getAllCategoriesServer({ activeOnly: true });
    const catById = new Map(activeCategories.map((c) => [c.id, c]));
    for (const cat of activeCategories) {
      if (!cat.slug) continue;
      if (!cat.parentId) {
        categoryEntries.push({
          url: `${BASE_URL}/${cat.slug}`,
          lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.92,
        });
      } else {
        const parent = catById.get(cat.parentId);
        if (parent && parent.slug) {
          categoryEntries.push({
            url: `${BASE_URL}/${parent.slug}/${cat.slug}`,
            lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.85,
          });
        }
      }
    }
  } catch (e) {
    console.warn('[SITEMAP WARN] Category entries fallback:', e);
  }

  return [...staticPages, ...categoryEntries, ...productEntries, ...blogPages];
}
