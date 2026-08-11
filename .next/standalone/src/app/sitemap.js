/**
 * sitemap.js — PEKEFE Gastronomi Platformu
 * Next.js App Router tarafından otomatik olarak /sitemap.xml endpoint'ine dönüştürülür.
 */

import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://www.pekefe.com';

const FALLBACK_PRODUCT_SLUGS = [
  'dut-pekmezi',
  'karadut-pekmezi',
  'sade-pestil',
  'cevizli-pestil',
  'ispir-kome',
  'ispir-tek-cekim-kome',
  'muska-tatlisi',
  'sarma-tatlisi',
];

const BLOG_SLUGS = [
  'pekmezli-kurabiye',
  'geleneksel-ispir-dut-pekmezi-nasil-uretilir',
  'ham-cicek-bali-ve-islenmis-bal-arasindaki-farklar',
  'pestil-ve-kome-hazirlamanin-incelikleri',
  'dut-pekmezinin-sagliga-faydalari',
  'ispir-yaylalarinin-2200m-rakimli-flora-zenginligi',
];

export default async function sitemap() {
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/rekolte-kulubu`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/mensei-dogrulama`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/akademi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tadim-odasi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/kategoriler`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/hikayemiz`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tesisimiz`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/galeri`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/kampanyalar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/sss`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/iletisim`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/teslimat`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/gizlilik`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/sozlesme`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  let dbProductSlugs = [];
  try {
    const products = await prisma.product.findMany({
      select: { sku: true, updatedAt: true }
    });
    if (products && products.length > 0) {
      dbProductSlugs = products.map(p => ({
        url: `${BASE_URL}/urun/${p.sku}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    }
  } catch (e) {
    console.error("Sitemap DB products error:", e);
  }

  const fallbackPages = FALLBACK_PRODUCT_SLUGS.map((slug) => ({
    url: `${BASE_URL}/urun/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const productPages = dbProductSlugs.length > 0 ? dbProductSlugs : fallbackPages;

  const blogPages = BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date('2026-02-01'),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...blogPages];
}
