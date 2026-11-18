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
  DEFAULT_CATEGORIES,
  LocalCategory
} from '@/lib/jsonCategoryDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Prisma üzerinden kategori çekmeyi dene (1.2 saniye timeout ile)
    const fetchFromPrisma = prisma.categoryDetail.findMany();
    const categories = await withTimeout<any[] | null>(fetchFromPrisma, 1200, null);

    if (categories && Array.isArray(categories) && categories.length > 0) {
      const mapped = categories.map(c => ({
        ...c,
        attributes: c.attributes as any,
        variants: c.variants as any
      }));
      // Yerel JSON DB'yi de arka planda senkronize et
      saveLocalCategoriesBulk(mapped);
      return NextResponse.json(mapped);
    }

    // Prisma boşsa veya timeout olduysa yerel JSON DB'den oku
    const localCats = readLocalCategories();
    return NextResponse.json(localCats);
  } catch (error) {
    console.warn('[API CATEGORIES WARNING] Veritabanı erişimi yok, yerel kategori deposu sunuluyor:', error);
    const localCats = readLocalCategories();
    return NextResponse.json(localCats);
  }
}

// Kategori oluştur (Admin only)
export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      
      let customId = body.id;
      if (!customId || customId.startsWith("cms")) {
        const localList = readLocalCategories();
        customId = `PKF-KAT-${String(localList.length + 1).padStart(3, '0')}`;
      }

      // 1. Önce yerel JSON DB'ye güvenle kaydet
      const savedCategory = saveLocalCategory({
        id: customId,
        name: body.name,
        parentId: body.parentId ? String(body.parentId) : null,
        attributes: body.attributes || [],
        variants: body.variants || []
      });

      // 2. Uzak Prisma DB erişilebilirse arka planda / senkron olarak da yaz
      try {
        await withTimeout(
          prisma.categoryDetail.upsert({
            where: { id: customId },
            update: {
              name: body.name,
              parentId: body.parentId ? String(body.parentId) : null,
              attributes: body.attributes || [],
              variants: body.variants || []
            },
            create: {
              id: customId,
              name: body.name,
              parentId: body.parentId ? String(body.parentId) : null,
              attributes: body.attributes || [],
              variants: body.variants || []
            }
          }),
          1500,
          null
        );
      } catch (prismaErr) {
        console.warn('[API CATEGORIES] Uzak DB senkronizasyonu atlandı (yerel JSON DB güncellendi):', prismaErr);
      }

      revalidatePath('/kategoriler');
      revalidatePath('/', 'layout');
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
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const body = await req.json();
      const id = body.id || searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
      }

      // Mevcut kategoriyi bularak eksik alanları koru
      const localCats = readLocalCategories();
      const existing = localCats.find(c => String(c.id).trim().toLowerCase() === String(id).trim().toLowerCase());

      // 1. Önce yerel JSON DB'de güncelle
      const updatedCategory = saveLocalCategory({
        id: id,
        name: body.name !== undefined ? body.name : (existing?.name || 'Kategori'),
        parentId: body.parentId !== undefined ? (body.parentId ? String(body.parentId) : null) : (existing?.parentId || null),
        attributes: body.attributes !== undefined ? body.attributes : (existing?.attributes || []),
        variants: body.variants !== undefined ? body.variants : (existing?.variants || [])
      });

      // 2. Uzak Prisma DB erişilebilirse senkronize et
      try {
        await withTimeout(
          prisma.categoryDetail.upsert({
            where: { id: body.id },
            update: {
              name: body.name,
              parentId: body.parentId ? String(body.parentId) : null,
              attributes: body.attributes || [],
              variants: body.variants || []
            },
            create: {
              id: body.id,
              name: body.name,
              parentId: body.parentId ? String(body.parentId) : null,
              attributes: body.attributes || [],
              variants: body.variants || []
            }
          }),
          1500,
          null
        );
      } catch (prismaErr) {
        console.warn('[API CATEGORIES] Uzak DB senkronizasyonu atlandı (yerel JSON DB güncellendi):', prismaErr);
      }

      revalidatePath('/kategoriler');
      revalidatePath('/', 'layout');
      return NextResponse.json(updatedCategory);
    } catch (error: any) {
      console.error('[API CATEGORIES] Kategori güncelleme hatası:', error);
      return NextResponse.json({ error: 'Kategori güncellenemedi.' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Kategori sil (Admin only)
export const DELETE = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

      // 1. Yerel JSON DB'den sil (alt kategorilerle birlikte)
      const deleteResult = deleteLocalCategory(id);

      // 2. Uzak Prisma DB erişilebilirse oradan da sil
      try {
        const idsToDelete = deleteResult.deletedIds.length > 0 ? deleteResult.deletedIds : [id];
        await withTimeout(
          prisma.categoryDetail.deleteMany({
            where: {
              id: { in: idsToDelete }
            }
          }),
          1500,
          null
        );
      } catch (prismaErr) {
        console.warn('[API CATEGORIES] Uzak DB silme işlemi atlandı (yerel JSON DB güncellendi):', prismaErr);
      }

      revalidatePath('/kategoriler');
      revalidatePath('/', 'layout');
      return NextResponse.json({ 
        success: true, 
        message: 'Kategori başarıyla silindi.',
        deletedIds: deleteResult.deletedIds 
      });
    } catch (error: any) {
      console.error('[API CATEGORIES] Kategori silme hatası:', error);
      return NextResponse.json({ error: 'Kategori silinemedi.' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
