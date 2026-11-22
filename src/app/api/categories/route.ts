import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma, withTimeout } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import {
  readLocalCategories,
  saveLocalCategory,
  deleteLocalCategory,
  saveLocalCategoriesBulk,
  ensureUniqueSlug,
} from '@/lib/jsonCategoryDb';
import {
  RESERVED_CATEGORY_SLUGS,
  slugifyTr,
  normalizeCategoryRecord,
  productMatchesCategory,
} from '@/lib/category-utils';
import {
  ensureCategoryColumnsExist,
  getAllCategoriesServer,
  getPublishedProductsServer,
} from '@/lib/category-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function revalidateAllCategoryPaths(slugs: string[] = []) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/kategoriler');
    revalidatePath('/sitemap.xml');
    for (const s of slugs) {
      if (s) revalidatePath(`/${s}`);
    }
  } catch (e) {
    // ignore revalidation errors in non-request contexts
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'apiLimit');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const includeCounts = searchParams.get('includeCounts') === 'true';

    const categories = await getAllCategoriesServer({ activeOnly });

    if (includeCounts) {
      const products = await getPublishedProductsServer();
      const withCounts = categories.map((cat) => ({
        ...cat,
        productCount: products.filter((p) => productMatchesCategory(p, cat, categories)).length,
      }));
      return NextResponse.json(withCounts);
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.warn('[API CATEGORIES WARNING] Fallback to local categories:', error);
    const localCats = readLocalCategories();
    return NextResponse.json(localCats);
  }
}

// Yeni kategori oluştur (Admin only)
export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, 'apiLimit');
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const name = String(body.name || '').trim();
      if (!name || name.length < 2) {
        return NextResponse.json({ error: 'Kategori adı en az 2 karakter olmalıdır.' }, { status: 400 });
      }

      const current = await getAllCategoriesServer({ activeOnly: false });
      const rawSlug = body.slug ? slugifyTr(String(body.slug)) : slugifyTr(name);
      if (!rawSlug) {
        return NextResponse.json({ error: 'Geçerli bir URL (slug) oluşturulamadı.' }, { status: 400 });
      }
      if (!body.parentId && RESERVED_CATEGORY_SLUGS.has(rawSlug)) {
        return NextResponse.json(
          { error: `"${rawSlug}" sistem tarafından ayrılmış bir URL'dir. Lütfen farklı bir slug girin.` },
          { status: 400 }
        );
      }

      const uniqueSlug = ensureUniqueSlug(rawSlug, current);

      let customId = body.id;
      if (!customId || String(customId).startsWith('cms')) {
        let maxNum = current.length;
        current.forEach((c) => {
          const m = String(c.id).match(/PKF-KAT-(\d+)/i);
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        });
        customId = `PKF-KAT-${String(maxNum + 1).padStart(3, '0')}`;
      }

      const payload = {
        id: customId,
        name,
        slug: uniqueSlug,
        parentId: body.parentId ? String(body.parentId) : null,
        shortDesc: body.shortDesc !== undefined ? String(body.shortDesc || '') : null,
        seoDesc: body.seoDesc !== undefined ? String(body.seoDesc || '') : null,
        metaTitle: body.metaTitle !== undefined ? String(body.metaTitle || '') : null,
        metaDescription: body.metaDescription !== undefined ? String(body.metaDescription || '') : null,
        image: body.image !== undefined ? String(body.image || '') : null,
        sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : current.length + 1,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        attributes: Array.isArray(body.attributes) ? body.attributes : [],
        variants: Array.isArray(body.variants) ? body.variants : [],
      };

      const savedCategory = saveLocalCategory(payload);

      try {
        await ensureCategoryColumnsExist();
        await withTimeout(
          prisma.categoryDetail.upsert({
            where: { id: savedCategory.id },
            update: {
              name: savedCategory.name,
              slug: savedCategory.slug,
              parentId: savedCategory.parentId,
              shortDesc: savedCategory.shortDesc,
              seoDesc: savedCategory.seoDesc,
              metaTitle: savedCategory.metaTitle,
              metaDescription: savedCategory.metaDescription,
              image: savedCategory.image,
              sortOrder: savedCategory.sortOrder,
              isActive: savedCategory.isActive,
              attributes: savedCategory.attributes || [],
              variants: savedCategory.variants || [],
            },
            create: {
              id: savedCategory.id,
              name: savedCategory.name,
              slug: savedCategory.slug,
              parentId: savedCategory.parentId,
              shortDesc: savedCategory.shortDesc,
              seoDesc: savedCategory.seoDesc,
              metaTitle: savedCategory.metaTitle,
              metaDescription: savedCategory.metaDescription,
              image: savedCategory.image,
              sortOrder: savedCategory.sortOrder,
              isActive: savedCategory.isActive,
              attributes: savedCategory.attributes || [],
              variants: savedCategory.variants || [],
            },
          }),
          1800,
          null
        );
      } catch (prismaErr) {
        console.warn('[API CATEGORIES] Uzak DB senkronizasyonu atlandı:', prismaErr);
      }

      revalidateAllCategoryPaths([savedCategory.slug]);
      return NextResponse.json(savedCategory);
    } catch (error: any) {
      console.error('[API CATEGORIES] Kategori oluşturma hatası:', error);
      return NextResponse.json({ error: 'Kategori oluşturulamadı.' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Kategori güncelle (Admin only)
export const PUT = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, 'apiLimit');
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const body = await req.json();
      const id = body.id || searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'Kategori ID gerekli.' }, { status: 400 });
      }

      const current = await getAllCategoriesServer({ activeOnly: false });
      const existing = current.find(
        (c) => String(c.id).trim().toLowerCase() === String(id).trim().toLowerCase()
      );

      const name = body.name !== undefined ? String(body.name).trim() : existing?.name || 'Kategori';
      const parentId =
        body.parentId !== undefined
          ? body.parentId
            ? String(body.parentId)
            : null
          : existing?.parentId ?? null;

      // Kendisini üst kategori olarak seçmeyi engelle
      if (parentId && String(parentId) === String(id)) {
        return NextResponse.json({ error: 'Bir kategori kendisinin üst kategorisi olamaz.' }, { status: 400 });
      }

      const desiredSlug =
        body.slug !== undefined && String(body.slug).trim() !== ''
          ? slugifyTr(String(body.slug))
          : existing?.slug || slugifyTr(name);

      if (!parentId && RESERVED_CATEGORY_SLUGS.has(desiredSlug)) {
        return NextResponse.json(
          { error: `"${desiredSlug}" sistem tarafından ayrılmış bir URL'dir. Lütfen farklı bir slug girin.` },
          { status: 400 }
        );
      }

      const uniqueSlug = ensureUniqueSlug(desiredSlug, current, String(id));

      const updatedCategory = saveLocalCategory({
        id: String(id),
        name,
        slug: uniqueSlug,
        parentId,
        shortDesc: body.shortDesc !== undefined ? body.shortDesc : existing?.shortDesc ?? null,
        seoDesc: body.seoDesc !== undefined ? body.seoDesc : existing?.seoDesc ?? null,
        metaTitle: body.metaTitle !== undefined ? body.metaTitle : existing?.metaTitle ?? null,
        metaDescription:
          body.metaDescription !== undefined ? body.metaDescription : existing?.metaDescription ?? null,
        image: body.image !== undefined ? body.image : existing?.image ?? null,
        sortOrder:
          typeof body.sortOrder === 'number' ? body.sortOrder : existing?.sortOrder ?? 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing?.isActive ?? true,
        attributes: body.attributes !== undefined ? body.attributes : existing?.attributes || [],
        variants: body.variants !== undefined ? body.variants : existing?.variants || [],
      });

      try {
        await ensureCategoryColumnsExist();
        await withTimeout(
          prisma.categoryDetail.upsert({
            where: { id: updatedCategory.id },
            update: {
              name: updatedCategory.name,
              slug: updatedCategory.slug,
              parentId: updatedCategory.parentId,
              shortDesc: updatedCategory.shortDesc,
              seoDesc: updatedCategory.seoDesc,
              metaTitle: updatedCategory.metaTitle,
              metaDescription: updatedCategory.metaDescription,
              image: updatedCategory.image,
              sortOrder: updatedCategory.sortOrder,
              isActive: updatedCategory.isActive,
              attributes: updatedCategory.attributes || [],
              variants: updatedCategory.variants || [],
            },
            create: {
              id: updatedCategory.id,
              name: updatedCategory.name,
              slug: updatedCategory.slug,
              parentId: updatedCategory.parentId,
              shortDesc: updatedCategory.shortDesc,
              seoDesc: updatedCategory.seoDesc,
              metaTitle: updatedCategory.metaTitle,
              metaDescription: updatedCategory.metaDescription,
              image: updatedCategory.image,
              sortOrder: updatedCategory.sortOrder,
              isActive: updatedCategory.isActive,
              attributes: updatedCategory.attributes || [],
              variants: updatedCategory.variants || [],
            },
          }),
          1800,
          null
        );
      } catch (prismaErr) {
        console.warn('[API CATEGORIES] Uzak DB güncelleme atlandı:', prismaErr);
      }

      revalidateAllCategoryPaths([existing?.slug || '', updatedCategory.slug]);
      return NextResponse.json(updatedCategory);
    } catch (error: any) {
      console.error('[API CATEGORIES] Kategori güncelleme hatası:', error);
      return NextResponse.json({ error: 'Kategori güncellenemedi.' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Toplu sıralama, aktif/pasif ve kategori-ürün eşleştirme (Admin only)
export const PATCH = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, 'apiLimit');
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const action = body.action;

      if (action === 'reorder' && Array.isArray(body.items)) {
        const current = await getAllCategoriesServer({ activeOnly: false });
        const orderMap = new Map<string, number>();
        body.items.forEach((it: any) => {
          if (it?.id && typeof it.sortOrder === 'number') {
            orderMap.set(String(it.id), it.sortOrder);
          }
        });

        const updated = current.map((c) =>
          orderMap.has(c.id) ? { ...c, sortOrder: orderMap.get(c.id)! } : c
        );
        saveLocalCategoriesBulk(updated);

        try {
          await ensureCategoryColumnsExist();
          await Promise.all(
            body.items.map((it: any) =>
              withTimeout(
                prisma.categoryDetail.updateMany({
                  where: { id: String(it.id) },
                  data: { sortOrder: Number(it.sortOrder) },
                }),
                1200,
                null
              )
            )
          );
        } catch (err) {
          console.warn('[API CATEGORIES] Reorder DB sync atlandı:', err);
        }

        revalidateAllCategoryPaths(updated.map((c) => c.slug));
        return NextResponse.json({ success: true, categories: updated });
      }

      if (action === 'assignProducts' && body.categoryId && Array.isArray(body.productIds)) {
        const categories = await getAllCategoriesServer({ activeOnly: false });
        const targetCat = categories.find((c) => c.id === String(body.categoryId));
        if (!targetCat) {
          return NextResponse.json({ error: 'Hedef kategori bulunamadı.' }, { status: 404 });
        }

        const parentCat = targetCat.parentId
          ? categories.find((c) => c.id === targetCat.parentId) || null
          : null;

        const productIds: string[] = body.productIds.map((x: any) => String(x));
        const mode: 'primary' | 'additional' = body.mode === 'additional' ? 'additional' : 'primary';

        let updatedCount = 0;

        for (const pid of productIds) {
          try {
            const prod = await withTimeout(
              prisma.product.findUnique({ where: { id: pid } }),
              1500,
              null
            );
            if (!prod) continue;

            let attrs: any = prod.attributes;
            if (typeof attrs === 'string') {
              try {
                attrs = JSON.parse(attrs);
              } catch {
                attrs = {};
              }
            }
            if (!attrs || typeof attrs !== 'object') attrs = {};

            const existingIds: string[] = Array.isArray(attrs.categoryIds)
              ? attrs.categoryIds.map(String)
              : [];

            if (mode === 'primary') {
              const newCatName = parentCat ? parentCat.name : targetCat.name;
              const newSubName = parentCat ? targetCat.name : prod.subCategory;
              const nextIds = Array.from(
                new Set([
                  ...existingIds,
                  targetCat.id,
                  ...(parentCat ? [parentCat.id] : []),
                ])
              );
              await withTimeout(
                prisma.product.update({
                  where: { id: pid },
                  data: {
                    category: newCatName,
                    subCategory: newSubName,
                    attributes: { ...attrs, categoryIds: nextIds },
                  },
                }),
                1500,
                null
              );
            } else {
              // Çoklu ek kategori bağlama (ürünün ana kategorisini bozmadan)
              const nextIds = Array.from(
                new Set([
                  ...existingIds,
                  targetCat.id,
                  ...(parentCat ? [parentCat.id] : []),
                ])
              );
              await withTimeout(
                prisma.product.update({
                  where: { id: pid },
                  data: {
                    attributes: { ...attrs, categoryIds: nextIds },
                  },
                }),
                1500,
                null
              );
            }
            updatedCount++;
          } catch (e) {
            console.warn('[API CATEGORIES] Ürün atama hatası:', pid, e);
          }
        }

        revalidateAllCategoryPaths([targetCat.slug, parentCat?.slug || '']);
        return NextResponse.json({
          success: true,
          updatedCount,
          category: targetCat,
        });
      }

      if (action === 'removeProductFromCategory' && body.categoryId && body.productId) {
        const categories = await getAllCategoriesServer({ activeOnly: false });
        const targetCat = categories.find((c) => c.id === String(body.categoryId));
        if (!targetCat) {
          return NextResponse.json({ error: 'Kategori bulunamadı.' }, { status: 404 });
        }

        const prod = await withTimeout(
          prisma.product.findUnique({ where: { id: String(body.productId) } }),
          1500,
          null
        );
        if (prod) {
          let attrs: any = prod.attributes;
          if (typeof attrs === 'string') {
            try {
              attrs = JSON.parse(attrs);
            } catch {
              attrs = {};
            }
          }
          if (!attrs || typeof attrs !== 'object') attrs = {};
          const existingIds: string[] = Array.isArray(attrs.categoryIds)
            ? attrs.categoryIds.map(String)
            : [];
          const nextIds = existingIds.filter(
            (x) => x !== targetCat.id && x !== targetCat.slug
          );
          await withTimeout(
            prisma.product.update({
              where: { id: prod.id },
              data: {
                subCategory:
                  prod.subCategory === targetCat.name ? null : prod.subCategory,
                attributes: { ...attrs, categoryIds: nextIds },
              },
            }),
            1500,
            null
          );
        }

        revalidateAllCategoryPaths([targetCat.slug]);
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: 'Geçersiz PATCH işlemi.' }, { status: 400 });
    } catch (error: any) {
      console.error('[API CATEGORIES PATCH ERROR]:', error);
      return NextResponse.json({ error: 'İşlem tamamlanamadı.' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Kategori sil (Admin only)
export const DELETE = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, 'apiLimit');
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

      const deleteResult = deleteLocalCategory(id);

      try {
        const idsToDelete = deleteResult.deletedIds.length > 0 ? deleteResult.deletedIds : [id];
        await withTimeout(
          prisma.categoryDetail.deleteMany({
            where: {
              id: { in: idsToDelete },
            },
          }),
          1500,
          null
        );
      } catch (prismaErr) {
        console.warn('[API CATEGORIES] Uzak DB silme atlandı:', prismaErr);
      }

      revalidateAllCategoryPaths();
      return NextResponse.json({ success: true, deletedIds: deleteResult.deletedIds });
    } catch (error: any) {
      console.error('[API CATEGORIES] Kategori silme hatası:', error);
      return NextResponse.json({ error: 'Kategori silinemedi.' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
