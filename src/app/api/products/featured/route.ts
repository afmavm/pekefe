import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { computeProductPricing } from '@/app/api/products/route';
import { getCariAccountByEmail } from '@/lib/b2b-helpers';

/**
 * GET /api/products/featured
 * Fırsat ürünleri, en çok satanlar ve yeni gelenler için tek endpoint.
 * Yanıt: { dealSectionActive, deals, bestsellers, newArrivals }
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'apiLimit');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authOptions);

    // ── B2B context (pricing) ────────────────────────────────────────────────
    let dealerAccount: any = null;
    let isB2BUser = false;
    let b2bGroupDiscountRate = 0;
    let b2bTieredRules: any[] = [];
    let b2bPrices: any[] = [];

    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          b2bGroup: {
            include: { tieredPricing: true, b2bPrices: true },
          },
        } as any,
      });

      if (dbUser && (dbUser.customer_type === 'b2b' || dbUser.role === 'DEALER')) {
        isB2BUser = true;
        const grp = dbUser.b2bGroup as any;
        if (grp) {
          b2bGroupDiscountRate = grp.base_discount_rate ?? grp.discountRate ?? 0;
          b2bTieredRules = grp.tieredPricing ?? [];
          b2bPrices = grp.b2bPrices ?? [];
        }
      }
      dealerAccount = await getCariAccountByEmail(session.user.email);
      if (dealerAccount && dealerAccount.cariTipi === "CORPORATE") {
        isB2BUser = true;
        if (b2bGroupDiscountRate === 0) {
          b2bGroupDiscountRate = dealerAccount.discountRate || 0;
        }
        if ((!b2bTieredRules || b2bTieredRules.length === 0) && (!b2bPrices || b2bPrices.length === 0) && dealerAccount.dealerGroup) {
          const groupByName = await prisma.b2BGroup.findFirst({
            where: { group_name: dealerAccount.dealerGroup }
          });
          if (groupByName) {
            const grp = groupByName as any;
            b2bGroupDiscountRate = grp.base_discount_rate ?? grp.discountRate ?? 0;
            b2bTieredRules = grp.tieredPricing ?? [];
            b2bPrices = grp.b2bPrices ?? [];
          }
        }
      }
    }

    const b2bContext = {
      isB2BUser,
      b2bGroupDiscountRate,
      b2bTieredPricingRules: b2bTieredRules,
      b2bPrices,
    };
    const now = new Date();

    // ── CMS deal settings ────────────────────────────────────────────────────
    const cmsRow = await (prisma as any).$queryRaw`
      SELECT dealSectionActive, dealProductIds FROM CMSData WHERE id = 'singleton' LIMIT 1
    `;
    const cms = Array.isArray(cmsRow) ? cmsRow[0] : null;
    const dealSectionActive = cms ? Boolean(cms.dealSectionActive) : false;
    let dealProductIdList: string[] = [];
    try {
      dealProductIdList = JSON.parse(cms?.dealProductIds || '[]');
    } catch {
      dealProductIdList = [];
    }

    // ── Helper to transform product ──────────────────────────────────────────
    const transform = (p: any) => {
      const calculated = computeProductPricing(p, dealerAccount, now, b2bContext);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        image: p.image,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
        rating: p.rating,
        reviews: p.reviews,
        stock: p.stock,
        isDeal: p.isDeal,
        salesCount: p.salesCount,
        createdAt: p.createdAt,
        attributes: typeof p.attributes === 'string' ? JSON.parse(p.attributes) : p.attributes,
        ...calculated,
      };
    };

    // ── Deals ────────────────────────────────────────────────────────────────
    // Priority order: isDeal flag → dealProductIds from CMS → discounted products
    let dealProducts: any[] = [];
    if (dealSectionActive) {
      // 1) Admin seçtiyse, seçili ürünleri getir
      if (dealProductIdList.length > 0) {
        const rawDeals = await prisma.product.findMany({
          where: { id: { in: dealProductIdList }, isDeleted: false, isRawMaterial: false, stock: { gt: 0 } },
          take: 12,
        });
        // Preserve manual order
        dealProducts = dealProductIdList
          .map((id) => rawDeals.find((p) => p.id === id))
          .filter(Boolean)
          .map(transform);
      }

      // 2) isDeal flag'i olan ürünleri ekle (zaten seçilmemişse)
      const existingIds = new Set(dealProducts.map((p) => p.id));
      const flagDeals = await prisma.product.findMany({
        where: { isDeal: true, isDeleted: false, isRawMaterial: false },
        take: 12,
      });
      for (const p of flagDeals) {
        if (!existingIds.has(p.id)) {
          dealProducts.push(transform(p));
          existingIds.add(p.id);
        }
      }

      // 3) Slot dolmadıysa indirimli ürünlerle tamamla
      if (dealProducts.length < 6) {
        const discounted = await prisma.product.findMany({
          where: {
            id: { notIn: [...existingIds] },
            isCampaignActive: true,
            isDeleted: false,
            isRawMaterial: false
          },
          take: 12 - dealProducts.length,
        });
        dealProducts.push(...discounted.map(transform));
      }
    }

    // ── Bestsellers ──────────────────────────────────────────────────────────
    const rawBestsellers = await prisma.product.findMany({
      where: { isDeleted: false, isRawMaterial: false },
      orderBy: [{ salesCount: 'desc' }, { rating: 'desc' }, { reviews: 'desc' }],
      take: 10,
    });
    const bestsellers = rawBestsellers.map(transform);

    // ── New Arrivals ─────────────────────────────────────────────────────────
    const rawNewArrivals = await prisma.product.findMany({
      where: { isDeleted: false, isRawMaterial: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const newArrivals = rawNewArrivals.map(transform);

    return NextResponse.json({
      dealSectionActive,
      deals: dealProducts,
      bestsellers,
      newArrivals,
    });
  } catch (error) {
    console.error('[/api/products/featured] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
