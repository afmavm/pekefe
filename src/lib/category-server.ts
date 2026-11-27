import { prisma, withTimeout } from '@/lib/prisma';
import { readLocalCategories } from '@/lib/jsonCategoryDb';
import { readLocalProducts } from '@/lib/jsonProductDb';
import {
  CategoryRecord,
  PEKEFE_DEFAULT_CATEGORIES,
  normalizeCategoryRecord,
  productMatchesCategory,
  slugifyTr,
} from '@/lib/category-utils';
import {
  resolveWebRetailPrice,
  resolveMarketListPrice,
} from '@/lib/pricing-resolver';

let _ensuredColumns = false;

/**
 * Canlı MySQL veritabanında CategoryDetail tablosunda yeni SEO/hiyerarşi sütunları
 * yoksa otomatik olarak (mevcut verilere zarar vermeden) ekler.
 */
export async function ensureCategoryColumnsExist(): Promise<void> {
  if (_ensuredColumns) return;
  try {
    const cols: any = await withTimeout(
      prisma.$queryRawUnsafe(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CategoryDetail'
      `),
      1500,
      null
    );
    if (!Array.isArray(cols) || cols.length === 0) return;

    const existing = new Set(cols.map((c: any) => String(c.COLUMN_NAME || c.column_name).toLowerCase()));
    const alterStatements: string[] = [];

    if (!existing.has('slug')) alterStatements.push('ADD COLUMN `slug` VARCHAR(191) NULL');
    if (!existing.has('shortdesc')) alterStatements.push('ADD COLUMN `shortDesc` TEXT NULL');
    if (!existing.has('seodesc')) alterStatements.push('ADD COLUMN `seoDesc` LONGTEXT NULL');
    if (!existing.has('metatitle')) alterStatements.push('ADD COLUMN `metaTitle` VARCHAR(255) NULL');
    if (!existing.has('metadescription')) alterStatements.push('ADD COLUMN `metaDescription` TEXT NULL');
    if (!existing.has('image')) alterStatements.push('ADD COLUMN `image` VARCHAR(512) NULL');
    if (!existing.has('sortorder')) alterStatements.push('ADD COLUMN `sortOrder` INT NOT NULL DEFAULT 0');
    if (!existing.has('isactive')) alterStatements.push('ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT 1');
    if (!existing.has('createdat')) alterStatements.push('ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)');
    if (!existing.has('updatedat')) alterStatements.push('ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)');

    if (alterStatements.length > 0) {
      await withTimeout(
        prisma.$executeRawUnsafe(`ALTER TABLE \`CategoryDetail\` ${alterStatements.join(', ')}`),
        2500,
        null
      );
    }
    _ensuredColumns = true;
  } catch (err) {
    console.warn('[CATEGORY SERVER] ensureCategoryColumnsExist atlandı:', err);
  }
}

/**
 * Tüm kategorileri Prisma (timeout korumalı) + JSON fallback ile çeker.
 * Eksik slug / metadata alanlarını PEKEFE_DEFAULT_CATEGORIES ile zenginleştirir.
 */
export async function getAllCategoriesServer(options?: { activeOnly?: boolean }): Promise<CategoryRecord[]> {
  let rawCategories: any[] | null = null;

  try {
    await ensureCategoryColumnsExist();
    const dbCats = await withTimeout<any[] | null>(
      prisma.categoryDetail.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      1500,
      null
    );
    if (Array.isArray(dbCats) && dbCats.length > 0) {
      // Eğer DB'de henüz yeni 5 ana kategori yoksa, JSON'daki güncel mimariyi kullan
      const hasModern = dbCats.some(
        (c: any) => c.slug === 'pestil-cesitleri' || c.slug === 'pekmez-cesitleri'
      );
      rawCategories = hasModern ? dbCats : readLocalCategories();
    }
  } catch (err) {
    console.warn('[CATEGORY SERVER] Prisma okuma fallback:', err);
  }

  if (!rawCategories || rawCategories.length === 0) {
    rawCategories = readLocalCategories();
  }

  const defaultBySlug = new Map(PEKEFE_DEFAULT_CATEGORIES.map((d) => [d.slug, d]));

  const normalized = rawCategories.map((c, idx) => {
    const rec = normalizeCategoryRecord(c, idx);
    const def = defaultBySlug.get(rec.slug);
    if (def) {
      return {
        ...rec,
        shortDesc: rec.shortDesc || def.shortDesc,
        seoDesc: rec.seoDesc || def.seoDesc,
        metaTitle: rec.metaTitle || def.metaTitle,
        metaDescription: rec.metaDescription || def.metaDescription,
        image: rec.image || def.image,
      };
    }
    return rec;
  });

  const filtered = options?.activeOnly ? normalized.filter((c) => c.isActive !== false) : normalized;
  return filtered.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'tr'));
}

export async function getCategoryBySlugServer(
  slug: string,
  options?: { activeOnly?: boolean }
): Promise<CategoryRecord | null> {
  const all = await getAllCategoriesServer({ activeOnly: options?.activeOnly ?? true });
  return all.find((c) => !c.parentId && c.slug === slug) || null;
}

export async function getSubCategoryBySlugServer(
  parentSlug: string,
  subSlug: string,
  options?: { activeOnly?: boolean }
): Promise<{ parent: CategoryRecord; sub: CategoryRecord } | null> {
  const all = await getAllCategoriesServer({ activeOnly: options?.activeOnly ?? true });
  const parent = all.find((c) => !c.parentId && c.slug === parentSlug);
  if (!parent) return null;
  const sub = all.find((c) => c.parentId === parent.id && c.slug === subSlug);
  if (!sub) return null;
  return { parent, sub };
}

/**
 * Yayında olan (satışa açık, silinmemiş, hammadde olmayan) ürünleri çeker ve serileştirir.
 */
export async function getPublishedProductsServer(): Promise<any[]> {
  let rawProducts: any[] = [];

  try {
    const dbProds = await withTimeout<any[] | null>(
      prisma.product.findMany({
        where: {
          isDeleted: false,
          isRawMaterial: false,
        },
        include: {
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      1800,
      null
    );
    if (Array.isArray(dbProds) && dbProds.length > 0) {
      rawProducts = dbProds;
    }
  } catch (err) {
    console.warn('[CATEGORY SERVER] Prisma product fallback:', err);
  }

  if (rawProducts.length === 0) {
    rawProducts = readLocalProducts();
  }

  return rawProducts
    .filter((p) => {
      if (!p) return false;
      if (p.isDeleted === true || p.isRawMaterial === true) return false;
      if (p.active === false || p.isPublished === false) return false;
      let attrs: any = p.attributes;
      if (typeof attrs === 'string') {
        try {
          attrs = JSON.parse(attrs);
        } catch {
          attrs = {};
        }
      }
      if (attrs?.isActive === false || attrs?.isPublished === false) return false;
      return true;
    })
    .map((p) => {
      let attrs: any = p.attributes;
      if (typeof attrs === 'string') {
        try {
          attrs = JSON.parse(attrs);
        } catch {
          attrs = {};
        }
      }
      // Google Merchant Center, JSON-LD ve halka açık SSR sayfaları HER ZAMAN Web Perakende fiyatını kullanır
      const effectivePrice = resolveWebRetailPrice({ ...p, attributes: attrs });
      const listPrice = resolveMarketListPrice({ ...p, attributes: attrs }, effectivePrice);
      const salePrice = effectivePrice;
      const effectiveStock = typeof p.stock === 'number' ? p.stock : Number(p.stock_quantity || 0);

      return {
        id: String(p.id),
        slug: p.slug ? String(p.slug) : slugifyTr(String(p.name || p.id || '')),
        name: String(p.name || ''),
        sku: String(p.sku || ''),
        category: String(p.category || ''),
        subCategory: p.subCategory ? String(p.subCategory) : null,
        seoTitle: p.seoTitle ? String(p.seoTitle) : (attrs?.seoTitle ? String(attrs.seoTitle) : null),
        seoDesc: p.seoDesc ? String(p.seoDesc) : (attrs?.seoDesc ? String(attrs.seoDesc) : null),
        price: effectivePrice,
        oldPrice: listPrice && listPrice > effectivePrice ? listPrice : null,
        list_price: listPrice,
        sale_price: salePrice,
        stock: effectiveStock,
        stock_quantity: effectiveStock,
        image: p.image || '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
        images: Array.isArray(p.images) ? p.images : [],
        desc: p.desc || '',
        shortDesc: p.shortDesc || attrs?.shortDesc || '',
        isCampaignActive: Boolean(p.isCampaignActive),
        discount_start_date: p.discount_start_date ? new Date(p.discount_start_date).toISOString() : null,
        discount_end_date: p.discount_end_date ? new Date(p.discount_end_date).toISOString() : null,
        salesCount: Number(p.salesCount || 0),
        rating: Number(p.rating || 5),
        reviews: Number(p.reviews || 0),
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        attributes: attrs || {},
        variants: Array.isArray(p.variants)
          ? p.variants.map((v: any) => ({
              id: String(v.id),
              sku: v.sku || '',
              stock: Number(v.stock || 0),
              price: v.price != null ? Number(v.price) : null,
              attributes: v.attributes || {},
            }))
          : [],
      };
    });
}

export async function getProductsForCategoryServer(
  targetCategory: CategoryRecord,
  allCategories: CategoryRecord[]
): Promise<any[]> {
  const allProducts = await getPublishedProductsServer();
  return allProducts.filter((p) => productMatchesCategory(p, targetCategory, allCategories));
}
