import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { computeProductPricing } from "@/app/api/products/route";
import { getCariAccountByEmail } from "@/lib/b2b-helpers";

export const dynamic = 'force-dynamic';

// GET /api/recommendations?productId=...
export async function GET(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    // 1. Target ürünü bulalım
    const targetProduct = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false }
    });

    if (!targetProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const targetName = targetProduct.name.trim();

    // 2. Tüm silinmemiş siparişleri ve ürünleri çekelim
    const [allProducts, allOrders] = await prisma.$transaction([
      prisma.product.findMany({
        where: { isDeleted: false, isRawMaterial: false },
        include: { variants: true }
      }),
      prisma.order.findMany({
        where: { isDeleted: false },
        select: { summary: true }
      })
    ]);

    // 3. Sipariş analizi yapalım
    // Sipariş özetlerinde targetName içeren siparişleri bulup, içindeki diğer ürünleri sayalım
    const coOccurrences: Record<string, number> = {};

    allOrders.forEach(order => {
      if (!order.summary) return;
      const summaryText = order.summary.toLowerCase();
      if (summaryText.includes(targetName.toLowerCase())) {
        // Bu sipariş hedef ürünü içeriyor. Siparişin içindeki ürünleri ayrıştıralım.
        // Sipariş özeti formatı: [Kargo Firması] Ürün1 (Miktar), Ürün2 (Miktar)
        const cleanSummary = order.summary.replace(/^\[[^\]]+\]\s*/, "");
        const parts = cleanSummary.split(", ");
        parts.forEach(part => {
          const match = part.match(/(.+)\s*\((\d+)\)/);
          const name = match ? match[1].trim() : part.trim();
          if (name && name.toLowerCase() !== targetName.toLowerCase()) {
            coOccurrences[name] = (coOccurrences[name] || 0) + 1;
          }
        });
      }
    });

    // 4. Co-occurrences'ı frekansa göre sıralayıp en uygun ürünleri eşleştirelim
    const sortedNames = Object.entries(coOccurrences)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    const recommendedProducts: any[] = [];
    const addedIds = new Set<string>();

    // Hedef ürünün kendisi önerilmesin
    addedIds.add(targetProduct.id);

    // Sıralı isimlere göre ürünleri bulup ekleyelim
    sortedNames.forEach(name => {
      const prod = allProducts.find(p => p.name.trim().toLowerCase() === name.toLowerCase());
      if (prod && !addedIds.has(prod.id)) {
        recommendedProducts.push(prod);
        addedIds.add(prod.id);
      }
    });

    // 5. Cold start / Yetersiz öneri durumunda aynı kategorideki diğer ürünlerle dolduralım
    if (recommendedProducts.length < 4) {
      const categoryProducts = allProducts.filter(p => 
        p.category === targetProduct.category && 
        !addedIds.has(p.id)
      );
      for (const prod of categoryProducts) {
        if (recommendedProducts.length >= 4) break;
        recommendedProducts.push(prod);
        addedIds.add(prod.id);
      }
    }

    // 6. Hala 4 ürün yoksa genel popüler ürünlerle dolduralım
    if (recommendedProducts.length < 4) {
      for (const prod of allProducts) {
        if (recommendedProducts.length >= 4) break;
        if (!addedIds.has(prod.id)) {
          recommendedProducts.push(prod);
          addedIds.add(prod.id);
        }
      }
    }

    // 7. Session ve Cari kartlarını çekerek dynamic B2B fiyat hesaplayalım
    const session = await getServerSession(authOptions);
    let dealerAccount = null;
    let isB2BUser = false;
    let b2bGroupDiscountRate = 0;
    let b2bTieredRules: any[] = [];
    let b2bPrices: any[] = [];

    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          b2bGroup: {
            include: {
              tieredPricing: true,
              b2bPrices: true
            }
          }
        }
      });

      if (dbUser && (dbUser.customer_type === 'b2b' || dbUser.role === 'DEALER')) {
        isB2BUser = true;
        if (dbUser.b2bGroup) {
          b2bGroupDiscountRate = dbUser.b2bGroup.base_discount_rate;
          b2bTieredRules = dbUser.b2bGroup.tieredPricing;
          b2bPrices = dbUser.b2bGroup.b2bPrices;
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
            where: { group_name: dealerAccount.dealerGroup },
            include: {
              tieredPricing: true,
              b2bPrices: true
            }
          });
          if (groupByName) {
            b2bGroupDiscountRate = groupByName.base_discount_rate;
            b2bTieredRules = groupByName.tieredPricing;
            b2bPrices = groupByName.b2bPrices;
          }
        }
      }
    }
    
    const b2bContext = {
      isB2BUser,
      b2bGroupDiscountRate,
      b2bTieredPricingRules: b2bTieredRules,
      b2bPrices
    };
    
    const now = new Date();

    const formatted = recommendedProducts.slice(0, 4).map(p => {
      const calculated = computeProductPricing(p, dealerAccount, now, b2bContext);
      return {
        ...p,
        ...calculated,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
        attributes: typeof p.attributes === 'string' ? JSON.parse(p.attributes) : p.attributes
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error in recommendations API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

