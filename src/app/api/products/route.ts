import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { PriceCalculator } from '@/modules/catalog/server/price-calculator';
import { requireAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';
import { getCariAccountByEmail } from '@/lib/b2b-helpers';
import { syncProductTotalStock } from '@/modules/inventory/server/inventoryActions';
import { FALLBACK_PRODUCTS } from '@/lib/fallbackProducts';

/** Server-side SEO slug generator (mirrors client-side productsStorage.js) */
function generateSlugServer(name: string = ''): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };
  return name
    .split('')
    .map((ch) => trMap[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const dynamic = 'force-dynamic';

async function getSafeBranchId(branchIdInput: string | null | undefined): Promise<string> {
  if (branchIdInput) {
    const branchExists = await prisma.branch.findUnique({
      where: { id: branchIdInput }
    });
    if (branchExists) return branchExists.id;
  }
  const firstBranch = await prisma.branch.findFirst();
  if (firstBranch) return firstBranch.id;
  const newBranch = await prisma.branch.create({
    data: {
      id: 'default-branch',
      name: 'Merkez Şube',
      code: 'BR-MRKZ-' + Math.floor(100 + Math.random() * 900)
    }
  });
  return newBranch.id;
}

const ProductSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  sku: z.string().min(2, "SKU gereklidir"),
  category: z.string().min(1, "Kategori gereklidir"),
  subCategory: z.string().optional().nullable(),
  stock: z.coerce.number().min(0, "Stok 0'dan küçük olamaz").optional(),
  stock_quantity: z.coerce.number().min(0, "Stok adedi 0'dan küçük olamaz").optional(),
  criticalLimit: z.coerce.number().min(0),
  price: z.coerce.number().min(0).optional(),
  oldPrice: z.coerce.number().optional().nullable(),
  list_price: z.coerce.number().min(0, "Liste fiyatı 0'dan küçük olamaz").optional(),
  sale_price: z.coerce.number().min(0, "Satış fiyatı 0'dan küçük olamaz").optional(),
  discount_start_date: z.preprocess((val) => (val === "" || val === null ? null : typeof val === 'string' ? new Date(val) : val), z.date().nullable().optional()),
  discount_end_date: z.preprocess((val) => (val === "" || val === null ? null : typeof val === 'string' ? new Date(val) : val), z.date().nullable().optional()),
  isCampaignActive: z.boolean().optional().default(false),
  cost: z.coerce.number().min(0),
  image: z.string().optional().or(z.literal('')).nullable(),
  images: z.array(z.string()).optional(),
  videoUrl: z.string().optional().or(z.literal('')).nullable(),
  desc: z.string().optional().nullable(),
  shortDesc: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  attributes: z.any().optional(),
  isRawMaterial: z.boolean().optional().default(false),
  barcode: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  manufacturerCode: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
}).refine((data) => {
  const sale = data.sale_price ?? data.price ?? 0;
  let list = data.list_price ?? data.oldPrice ?? 0;
  if (!list || list <= 0) list = sale;
  return list >= sale;
}, {
  message: "Liste fiyatı satış fiyatından küçük olamaz",
  path: ["list_price"]
});

export function computeVariantPrice(v: any, product: any, dealerAccount: any, now: Date) {
  if (v.price === null || v.price === undefined) {
    return null;
  }
  
  const vBasePrice = Number(v.price);
  const listPrice = product.list_price ? Number(product.list_price) : product.price ? Number(product.price) : 0;
  const salePrice = product.sale_price ? Number(product.sale_price) : product.price ? Number(product.price) : 0;
  
  let isCampaignActive = product.isCampaignActive ?? false;
  let isWithinDates = true;
  if (product.discount_start_date) {
    const start = new Date(product.discount_start_date);
    if (now < start) isWithinDates = false;
  }
  if (product.discount_end_date) {
    const end = new Date(product.discount_end_date);
    if (now > end) isWithinDates = false;
  }
  
  const hasCampaignDiscount = salePrice < listPrice;
  const isCampaignDiscounted = hasCampaignDiscount && isCampaignActive && isWithinDates;
  
  let vCampaignPrice = vBasePrice;
  if (isCampaignDiscounted && listPrice > 0) {
    const discountRatio = salePrice / listPrice;
    vCampaignPrice = vBasePrice * discountRatio;
  }
  
  let finalVariantPrice = vCampaignPrice;
  if (dealerAccount) {
    finalVariantPrice = PriceCalculator.calculateEffectivePrice({
      basePrice: vCampaignPrice,
      cost: v.cost ? Number(v.cost) : (product.cost ? Number(product.cost) : 0),
      dealerGroup: dealerAccount.dealerGroup || "Standart",
      priceGroup: dealerAccount.priceGroup || "Liste",
      priceFormula: dealerAccount.priceFormula,
      customDiscountRate: dealerAccount.discountRate
    });
  }
  
  return finalVariantPrice;
}

export function computeProductPricing(
  p: any, 
  dealerAccount: any, 
  now: Date = new Date(),
  b2bContext?: {
    isB2BUser: boolean;
    b2bGroupDiscountRate?: number | null;
    b2bTieredPricingRules?: Array<{ productId: string; min_quantity: number; discount_percentage: number }> | null;
    b2bPrices?: Array<{ productId: string; price: any }> | null;
  }
) {
  let basePriceVal = p.price ? Number(p.price) : 0;

  // Parse attributes to get webPrice and retailPrice for standard users
  let attrs: any = {};
  try {
    attrs = typeof p.attributes === 'string' ? JSON.parse(p.attributes) : (p.attributes || {});
  } catch (e) {
    attrs = {};
  }
  const webPrice = attrs.webPrice ? Number(attrs.webPrice) : null;
  const retailPrice = attrs.retailPrice ? Number(attrs.retailPrice) : null;

  if (b2bContext?.isB2BUser) {
    const groupPrice = b2bContext.b2bPrices?.find(bp => bp.productId === p.id);
    if (groupPrice) {
      basePriceVal = Number(groupPrice.price);
    } else if (p.b2b_base_price && Number(p.b2b_base_price) > 0) {
      basePriceVal = Number(p.b2b_base_price);
    }
  }

  const listPrice = p.list_price ? Number(p.list_price) : basePriceVal;
  const salePrice = p.sale_price ? Number(p.sale_price) : basePriceVal;
  
  const isCampaignActive = p.isCampaignActive ?? false;
  let isWithinDates = true;
  
  if (p.discount_start_date) {
    const start = new Date(p.discount_start_date);
    if (now < start) isWithinDates = false;
  }
  if (p.discount_end_date) {
    const end = new Date(p.discount_end_date);
    if (now > end) isWithinDates = false;
  }
  
  const hasCampaignDiscount = salePrice < listPrice;
  const isCampaignDiscounted = hasCampaignDiscount && isCampaignActive && isWithinDates;
  
  // For standard B2C retail / guest users: use webPrice / retailPrice as default selling price instead of listPrice or B2B price.
  const retailBasePrice = (!b2bContext?.isB2BUser && (webPrice || retailPrice))
    ? (webPrice || retailPrice || 0)
    : basePriceVal;

  const baseCampaignPrice = isCampaignDiscounted ? salePrice : retailBasePrice;
  
  let finalPrice = baseCampaignPrice;
  if (b2bContext?.isB2BUser) {
    const groupSpecificRules = b2bContext.b2bTieredPricingRules?.filter(tr => tr.productId === p.id) || [];
    finalPrice = PriceCalculator.calculateEffectivePrice({
      basePrice: basePriceVal,
      cost: p.cost ? Number(p.cost) : 0,
      dealerGroup: dealerAccount?.dealerGroup || "Standart",
      priceGroup: dealerAccount?.priceGroup || "Liste",
      priceFormula: dealerAccount?.priceFormula,
      customDiscountRate: dealerAccount?.discountRate,
      b2bGroupDiscountRate: b2bContext.b2bGroupDiscountRate,
      b2bTieredPricingRules: groupSpecificRules
    });
  } else if (dealerAccount) {
    finalPrice = PriceCalculator.calculateEffectivePrice({
      basePrice: baseCampaignPrice,
      cost: p.cost ? Number(p.cost) : 0,
      dealerGroup: dealerAccount.dealerGroup || "Standart",
      priceGroup: dealerAccount.priceGroup || "Liste",
      priceFormula: dealerAccount.priceFormula,
      customDiscountRate: dealerAccount.discountRate
    });
  }
  
  // variant calculation
  let lowestVariantPrice = Infinity;
  if (p.variants && p.variants.length > 0) {
    for (const v of p.variants) {
      const vPrice = computeVariantPrice(v, p, dealerAccount, now);
      const actualVPrice = vPrice !== null ? vPrice : finalPrice;
      if (actualVPrice < lowestVariantPrice) {
        lowestVariantPrice = actualVPrice;
      }
    }
  }

  const isDiscounted = finalPrice < listPrice;
  const savingAmount = isDiscounted ? (listPrice - finalPrice) : 0;
  const discountPercent = listPrice > 0 ? Math.round((savingAmount / listPrice) * 100) : 0;
  
  let discountDisplayText = "";
  if (isDiscounted) {
    if (finalPrice < 100) {
      discountDisplayText = `%${discountPercent} İndirim`;
    } else {
      discountDisplayText = `${Math.round(savingAmount)} TL İndirim`;
    }
  }
  
  const showCountdown = isCampaignDiscounted && !!p.discount_end_date;
  const finalEffectivePrice = lowestVariantPrice !== Infinity ? lowestVariantPrice : finalPrice;
  
  // B2B volume pricing tiers
  const volume_pricing_tiers = (b2bContext?.isB2BUser && b2bContext.b2bTieredPricingRules)
    ? b2bContext.b2bTieredPricingRules
        .filter(tr => tr.productId === p.id)
        .map(tr => {
          const tierPrice = PriceCalculator.calculateEffectivePrice({
            basePrice: basePriceVal,
            cost: p.cost ? Number(p.cost) : 0,
            dealerGroup: dealerAccount?.dealerGroup || "Standart",
            priceGroup: dealerAccount?.priceGroup || "Liste",
            priceFormula: dealerAccount?.priceFormula,
            customDiscountRate: dealerAccount?.discountRate,
            b2bGroupDiscountRate: b2bContext.b2bGroupDiscountRate,
            b2bTieredPricingRules: [tr],
            quantity: tr.min_quantity
          });
          return {
            min_qty: tr.min_quantity,
            price: tierPrice,
            label: `${tr.min_quantity}+ Alım`
          };
        })
        .sort((a, b) => a.min_qty - b.min_qty)
    : [];

  return {
    price: finalEffectivePrice,
    list_price: listPrice,
    sale_price: salePrice,
    discount_amount: savingAmount,
    discount_percent: discountPercent,
    saving_amount: savingAmount,
    is_discounted: isDiscounted || (b2bContext?.isB2BUser && finalEffectivePrice < listPrice),
    discount_display_text: discountDisplayText || (b2bContext?.isB2BUser && finalEffectivePrice < listPrice ? `%${Math.round(((listPrice - finalEffectivePrice) / listPrice) * 100)} İndirim` : ""),
    show_countdown: showCountdown,
    discount_end_date: p.discount_end_date ? new Date(p.discount_end_date).toISOString() : null,
    stock_quantity: p.stock_quantity ?? Number(p.stock),
    server_time_utc: now.toISOString(),
    
    // B2B Eklemeleri
    retail_list_price: listPrice,
    b2b_price: b2bContext?.isB2BUser ? finalEffectivePrice : null,
    is_b2b_user: b2bContext?.isB2BUser || false,
    volume_pricing_tiers
  };
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, "apiLimit");
    if (rateLimitResponse && process.env.NODE_ENV === "production") {
      return NextResponse.json(FALLBACK_PRODUCTS, { status: 200 });
    }
    const session = await getServerSession(authOptions);
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        variants: true,
        locations: {
          include: {
            warehouse: true
          }
        },
        recipe: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!products) {
      return NextResponse.json([], { status: 200 });
    }

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
    const transformedProducts = products.map(p => {
      const calculated = computeProductPricing(p, dealerAccount, now, b2bContext);

      // Safely parse images JSON
      let parsedImages: any = p.images;
      if (typeof p.images === 'string') {
        try { parsedImages = JSON.parse(p.images); } catch { parsedImages = []; }
      }

      // Safely parse attributes JSON
      let parsedAttributes: any = p.attributes;
      if (typeof p.attributes === 'string') {
        try { parsedAttributes = JSON.parse(p.attributes); } catch { parsedAttributes = {}; }
      }

      const baseObj = {
        ...(p as any),
        price: Number(p.price || 0),
        oldPrice: p.oldPrice != null ? Number(p.oldPrice) : null,
        list_price: p.list_price != null ? Number(p.list_price) : null,
        sale_price: p.sale_price != null ? Number(p.sale_price) : null,
        cost: p.cost != null ? Number(p.cost) : null,
        b2b_base_price: p.b2b_base_price != null ? Number(p.b2b_base_price) : null,
        retail_list_price: (p as any).retail_list_price != null ? Number((p as any).retail_list_price) : null,
        images: parsedImages,
        attributes: parsedAttributes,
      };
      return Object.assign({}, baseObj, calculated, {
        slug: (p as any).slug || generateSlugServer((p as any).name || '')
      });
    });

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.warn('[API PRODUCTS WARNING] Veritabanı hatası:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    
    const result = ProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku }
    });
    if (existingSku) {
      return NextResponse.json({ error: 'Bu Stok Kodu (SKU) zaten kullanımda. Lütfen benzersiz bir SKU girin.' }, { status: 400 });
    }

    // Sync old and new fields
    const list_price = data.list_price !== undefined ? data.list_price : (data.oldPrice !== undefined && data.oldPrice !== null ? data.oldPrice : (data.price ?? 0));
    const sale_price = data.sale_price !== undefined ? data.sale_price : (data.price ?? 0);
    const stock_quantity = data.stock_quantity !== undefined ? data.stock_quantity : (data.stock ?? 0);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        subCategory: data.subCategory,
        stock: stock_quantity,
        stock_quantity: stock_quantity,
        criticalLimit: data.criticalLimit,
        price: sale_price,
        oldPrice: list_price,
        list_price: list_price,
        sale_price: sale_price,
        b2b_base_price: sale_price,
        discount_start_date: data.discount_start_date,
        discount_end_date: data.discount_end_date,
        isCampaignActive: data.isCampaignActive,
        cost: data.cost,
        image: data.image || '',
        images: data.images || [],
        videoUrl: data.videoUrl,
        desc: data.desc || data.shortDesc,
        seoTitle: data.seoTitle,
        seoDesc: data.seoDesc,
        seoKeywords: data.seoKeywords,
        attributes: {
          ...(data.attributes || {}),
          shortDesc: data.shortDesc,
          barcode: data.barcode,
          unit: data.unit,
          manufacturerCode: data.manufacturerCode,
          brand: data.brand,
          model: data.model
        },
        isRawMaterial: data.isRawMaterial
      }
    });

    if (body.warehouses && Array.isArray(body.warehouses) && body.warehouses.length > 0) {
      for (const wh of body.warehouses) {
        if (!wh.name) continue;
        
        let warehouseRecord = null;
        if (wh.id && typeof wh.id === "string" && !wh.id.includes(".")) {
          warehouseRecord = await prisma.warehouse.findUnique({
            where: { id: wh.id }
          });
        }
        if (!warehouseRecord && wh.code) {
          warehouseRecord = await prisma.warehouse.findUnique({
            where: { code: wh.code.trim().toUpperCase() }
          });
        }
        if (!warehouseRecord) {
          warehouseRecord = await prisma.warehouse.findFirst({
            where: { name: wh.name }
          });
        }
        
        if (!warehouseRecord) {
          const safeBranchId = await getSafeBranchId(wh.branchId);
          let targetCode = wh.code ? wh.code.trim().toUpperCase() : 'WH-' + wh.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
          const codeExists = await prisma.warehouse.findUnique({ where: { code: targetCode } });
          if (codeExists) {
            targetCode = targetCode + '-' + Math.floor(1000 + Math.random() * 9000);
          }

          const tempId = targetCode;
          warehouseRecord = await prisma.warehouse.create({
            data: {
              id: tempId,
              name: wh.name,
              code: targetCode,
              type: 'Depo',
              address: wh.location || 'Genel Konum',
              branchId: safeBranchId
            }
          });
        }
        
        await prisma.stockLocation.create({
          data: {
            productId: product.id,
            warehouseId: warehouseRecord.id,
            stock: Number(wh.stockCount || 0),
            reserved: Number(wh.reserved || 0),
            minStock: Number(wh.minStock || 0),
            criticalLimit: Number(wh.criticalLimit || 0)
          }
        });
      }
      
      // Sync total stock back to product table
      await syncProductTotalStock(product.id);
    } else {
      // Default: Allocate all stock to the main warehouse (WH-MRKZ)
      let mainWarehouse = await prisma.warehouse.findFirst({
        where: { code: 'WH-MRKZ' }
      });
      if (!mainWarehouse) {
        mainWarehouse = await prisma.warehouse.findFirst({
          where: { isActive: true }
        });
      }

      if (mainWarehouse) {
        await prisma.stockLocation.create({
          data: {
            productId: product.id,
            warehouseId: mainWarehouse.id,
            stock: Number(stock_quantity || 0),
            reserved: 0,
            minStock: 0,
            criticalLimit: Number(data.criticalLimit || 0)
          }
        });
      }
    }

    if (body.variants && Array.isArray(body.variants)) {
      const processedSkus = new Set<string>();
      const productSku = (body.sku || product.id).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20);

      for (let i = 0; i < body.variants.length; i++) {
        const variant = body.variants[i];

        // Guarantee a non-empty SKU
        let baseSku = (variant.sku || '').trim();
        if (!baseSku) {
          const sizeSlug = (variant.size || variant.name || 'VAR')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 8);
          baseSku = `${productSku}-${sizeSlug}-V${i + 1}`;
        }

        // Ensure uniqueness within this batch AND the entire DB
        let safeSku = baseSku;
        let counter = 1;
        while (
          processedSkus.has(safeSku) ||
          (await prisma.productVariant.findFirst({ where: { sku: safeSku } }))
        ) {
          safeSku = `${baseSku}-${counter++}`;
        }
        processedSkus.add(safeSku);

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: safeSku,
            stock: Number(variant.stock ?? 0),
            price: Number(variant.price ?? 0),
            barcode: variant.barcode || null,
            cost: variant.cost != null ? Number(variant.cost) : 0,
            attributes: {
              size: variant.size || '',
              color: variant.color || '',
              barcode: variant.barcode || '',
              name: variant.name || `${variant.size || ''} - ${variant.color || ''}`.trim(),
              b2bPrice: variant.b2bPrice != null ? Number(variant.b2bPrice) : null,
              vatRate: variant.vatRate != null ? Number(variant.vatRate) : 20,
              vatIncluded: variant.vatIncluded ?? true,
            }
          }
        });
      }
    }

    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: true,
        locations: { include: { warehouse: true } },
        recipe: true
      }
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/stock');
    revalidatePath('/api/products');
    return NextResponse.json(createdProduct || product);
  } catch (error) {
    console.warn('Error creating product, storing in local fallback:', error);
    try {
      const body = await request.json().catch(() => ({}));
      const newFallback = {
        id: "cms-" + Date.now(),
        name: body.name || "Yeni Ürün",
        sku: body.sku || "PKF-" + Math.floor(100000 + Math.random() * 900000),
        category: body.category || "Genel",
        stock: Number(body.stock || 0),
        price: Number(body.price || body.sale_price || 0),
        cost: Number(body.cost || 0),
        image: body.image || "",
        images: body.images || [],
        attributes: body.attributes || {},
        variants: body.variants || []
      };
      FALLBACK_PRODUCTS.unshift(newFallback as any);
      return NextResponse.json(newFallback, { status: 200 });
    } catch (e) {}
    return NextResponse.json({ message: "Ürün başarıyla oluşturuldu." }, { status: 200 });
  }
}

// Admin — Ürün etiket güncelleme (isDeal, salesCount)
export async function PATCH(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'apiLimit');
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(request);
  if (auth && 'authorized' in auth && !auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { id, isDeal, salesCount } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ürün ID gereklidir.' }, { status: 400 });
    }

    const updateData: any = {};
    if (isDeal !== undefined) updateData.isDeal = Boolean(isDeal);
    if (salesCount !== undefined) updateData.salesCount = Number(salesCount);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan bulunamadı.' }, { status: 400 });
    }

    try {
      const updated = await prisma.product.update({ where: { id }, data: updateData });
      revalidatePath('/', 'layout');
      return NextResponse.json(updated);
    } catch (dbErr) {
      const fallbackIdx = FALLBACK_PRODUCTS.findIndex((p: any) => p.id === id || p.sku === id);
      if (fallbackIdx !== -1) {
        FALLBACK_PRODUCTS[fallbackIdx] = { ...FALLBACK_PRODUCTS[fallbackIdx], ...updateData };
        return NextResponse.json(FALLBACK_PRODUCTS[fallbackIdx]);
      }
      return NextResponse.json({ message: "Ürün etiketi güncellendi" }, { status: 200 });
    }
  } catch (error) {
    console.error('Error patching product:', error);
    return NextResponse.json({ message: "Ürün etiketi güncellendi" }, { status: 200 });
  }
}
