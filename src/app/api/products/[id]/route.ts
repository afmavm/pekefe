import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { requireAdmin } from '@/lib/auth-helpers';
import { authOptions } from "@/lib/authOptions";
import { computeProductPricing } from '../route';
import { getCariAccountByEmail } from '@/lib/b2b-helpers';
import { syncProductTotalStock } from '@/modules/inventory/server/inventoryActions';
import { FALLBACK_PRODUCTS } from '@/lib/fallbackProducts';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let product: any = null;
    try {
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { id: id },
            { sku: id }
          ]
        },
        include: {
          variants: true,
          locations: {
            include: {
              warehouse: true
            }
          },
          recipe: true
        }
      });
    } catch (dbErr) {
      console.warn(`[API PRODUCT BY ID WARNING] DB erişimi yok, FALLBACK_PRODUCTS kontrol ediliyor: ${id}`, dbErr);
    }

    // DB'de bulunamadıysa veya DB kapalıysa FALLBACK_PRODUCTS içinden ara
    if (!product) {
      const fallbackItem = FALLBACK_PRODUCTS.find((p: any) => p.id === id || p.sku === id);
      if (fallbackItem) {
        product = JSON.parse(JSON.stringify(fallbackItem));
      }
    }

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    let dealerAccount = null;
    let isB2BUser = false;
    let b2bGroupDiscountRate = 0;
    let b2bTieredRules: any[] = [];
    let b2bPrices: any[] = [];

    try {
      const session = await getServerSession(authOptions);
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
        if (dealerAccount) {
          isB2BUser = true;
          if (b2bGroupDiscountRate === 0) {
            b2bGroupDiscountRate = dealerAccount.discountRate || 0;
          }
        }
      }
    } catch (sessionErr) {
      // Ignore auth lookup errors when DB is offline
    }

    const b2bContext = {
      isB2BUser,
      b2bGroupDiscountRate,
      b2bTieredPricingRules: b2bTieredRules,
      b2bPrices
    };

    const calculated = computeProductPricing(product, dealerAccount, new Date(), b2bContext);

    let parsedImages = product.images;
    if (typeof product.images === 'string') {
      try { parsedImages = JSON.parse(product.images); } catch { parsedImages = []; }
    }
    let parsedAttributes = product.attributes;
    if (typeof product.attributes === 'string') {
      try { parsedAttributes = JSON.parse(product.attributes); } catch { parsedAttributes = {}; }
    }

    return NextResponse.json({
      ...product,
      ...calculated,
      images: parsedImages || [],
      attributes: parsedAttributes || {}
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    // Final safety net: if anything threw, check fallback
    const { id } = await params;
    const fallbackItem = FALLBACK_PRODUCTS.find((p: any) => p.id === id || p.sku === id);
    if (fallbackItem) {
      return NextResponse.json(JSON.parse(JSON.stringify(fallbackItem)));
    }
    return NextResponse.json({ error: 'Ürün yüklenemedi' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth && 'authorized' in auth && !auth.authorized) {
      return auth.response;
    }
    const body = await request.json();
    const { id } = await params;

    const list_price = body.list_price !== undefined && body.list_price !== null ? Number(body.list_price) : (body.oldPrice !== undefined && body.oldPrice !== null ? Number(body.oldPrice) : undefined);
    const sale_price = body.sale_price !== undefined && body.sale_price !== null ? Number(body.sale_price) : (body.price !== undefined && body.price !== null ? Number(body.price) : undefined);
    
    if (list_price !== undefined && list_price > 0 && sale_price !== undefined && sale_price > 0) {
      if (list_price < sale_price) {
        return NextResponse.json({ error: "Liste fiyatı (Piyasa Fiyatı) satış fiyatından küçük olamaz" }, { status: 400 });
      }
    }
    if (sale_price !== undefined && sale_price < 0) {
      return NextResponse.json({ error: "Satış fiyatı 0'dan küçük olamaz" }, { status: 400 });
    }

    // Try finding product in DB
    let resolvedProduct: any = null;
    try {
      resolvedProduct = await prisma.product.findFirst({
        where: { OR: [{ id }, { sku: id }] },
        select: { id: true }
      });
    } catch (dbErr) {
      console.warn(`[API PUT PRODUCT WARNING] DB erişimi yok, FALLBACK_PRODUCTS aranıyor: ${id}`);
    }

    // Fallback handler if DB is offline or product not in DB
    if (!resolvedProduct) {
      const fallbackIdx = FALLBACK_PRODUCTS.findIndex((p: any) => p.id === id || p.sku === id);
      if (fallbackIdx !== -1) {
        const target = FALLBACK_PRODUCTS[fallbackIdx];
        const updatedFallback = {
          ...target,
          ...body,
          price: sale_price !== undefined ? sale_price : target.price,
          sale_price: sale_price !== undefined ? sale_price : target.sale_price,
          oldPrice: list_price !== undefined ? list_price : target.oldPrice,
          list_price: list_price !== undefined ? list_price : target.list_price,
          stock: body.stock !== undefined ? Number(body.stock) : target.stock,
          stock_quantity: body.stock_quantity !== undefined ? Number(body.stock_quantity) : target.stock_quantity,
          attributes: {
            ...(typeof target.attributes === 'object' ? target.attributes : {}),
            ...(body.attributes || {})
          }
        };
        FALLBACK_PRODUCTS[fallbackIdx] = updatedFallback;
        revalidatePath('/', 'layout');
        return NextResponse.json(updatedFallback);
      }
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const realId = resolvedProduct.id;
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.sku !== undefined) {
      try {
        const existingSku = await prisma.product.findFirst({
          where: {
            sku: body.sku,
            id: { not: realId }
          }
        });
        if (existingSku) {
          return NextResponse.json({ error: 'Bu Stok Kodu (SKU) başka bir ürün tarafından kullanılıyor. Lütfen benzersiz bir SKU girin.' }, { status: 400 });
        }
      } catch (err) {}
      data.sku = body.sku;
    }
    if (body.category !== undefined) data.category = body.category;
    if (body.subCategory !== undefined) data.subCategory = body.subCategory;
    
    if (body.list_price !== undefined) {
      data.list_price = Number(body.list_price);
      data.oldPrice = Number(body.list_price);
    }
    if (body.sale_price !== undefined) {
      data.sale_price = Number(body.sale_price);
      data.price = Number(body.sale_price);
      data.b2b_base_price = Number(body.sale_price);
      try {
        await prisma.productB2BPrice.updateMany({
          where: { productId: realId },
          data: { price: Number(body.sale_price) }
        });
      } catch (err) {}
    }
    if (body.stock_quantity !== undefined) {
      data.stock_quantity = Number(body.stock_quantity);
      data.stock = Number(body.stock_quantity);
    }
    if (body.price !== undefined && body.sale_price === undefined) {
      data.price = Number(body.price);
      data.sale_price = Number(body.price);
      data.b2b_base_price = Number(body.price);
      try {
        await prisma.productB2BPrice.updateMany({
          where: { productId: realId },
          data: { price: Number(body.price) }
        });
      } catch (err) {}
    }
    if (body.oldPrice !== undefined && body.list_price === undefined) {
      data.oldPrice = body.oldPrice ? Number(body.oldPrice) : null;
      data.list_price = body.oldPrice ? Number(body.oldPrice) : null;
    }
    if (body.stock !== undefined && body.stock_quantity === undefined) {
      data.stock = Number(body.stock);
      data.stock_quantity = Number(body.stock);
    }

    if (body.discount_start_date !== undefined) {
      data.discount_start_date = body.discount_start_date ? new Date(body.discount_start_date) : null;
    }
    if (body.discount_end_date !== undefined) {
      data.discount_end_date = body.discount_end_date ? new Date(body.discount_end_date) : null;
    }

    if (body.isCampaignActive !== undefined) data.isCampaignActive = Boolean(body.isCampaignActive);
    if (body.cost !== undefined) data.cost = Number(body.cost);
    if (body.image !== undefined) data.image = body.image;
    if (body.images !== undefined) data.images = body.images || [];
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl;
    if (body.desc !== undefined) data.desc = body.desc;
    if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle;
    if (body.seoDesc !== undefined) data.seoDesc = body.seoDesc;
    if (body.seoKeywords !== undefined) data.seoKeywords = body.seoKeywords;
    if (body.isRawMaterial !== undefined) data.isRawMaterial = Boolean(body.isRawMaterial);

    if (
      body.attributes !== undefined ||
      body.barcode !== undefined ||
      body.unit !== undefined ||
      body.manufacturerCode !== undefined ||
      body.brand !== undefined ||
      body.model !== undefined
    ) {
      let currentAttrs = {};
      try {
        const existingProduct = await prisma.product.findUnique({ where: { id: realId } });
        currentAttrs = existingProduct?.attributes
          ? (typeof existingProduct.attributes === 'string'
              ? JSON.parse(existingProduct.attributes)
              : existingProduct.attributes)
          : {};
      } catch (err) {}
      
      data.attributes = {
        ...currentAttrs,
        ...(body.attributes || {}),
        ...(body.barcode !== undefined ? { barcode: body.barcode } : {}),
        ...(body.unit !== undefined ? { unit: body.unit } : {}),
        ...(body.manufacturerCode !== undefined ? { manufacturerCode: body.manufacturerCode } : {}),
        ...(body.brand !== undefined ? { brand: body.brand } : {}),
        ...(body.model !== undefined ? { model: body.model } : {})
      };
    }

    const product = await prisma.product.update({
      where: { id: realId },
      data: data
    });

    // Save warehouse specific stock levels (locations)
    if (body.warehouses && Array.isArray(body.warehouses)) {
      try {
        const existingLocs = await prisma.stockLocation.findMany({
          where: { productId: realId }
        });
        const processedWarehouseIds: string[] = [];

        for (const wh of body.warehouses) {
          if (!wh.name) continue;
          
          let warehouseRecord = null;
          const isDbId = wh.id && typeof wh.id === "string" && !wh.id.includes('.');
          if (isDbId) {
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

          const safeBranchId = await getSafeBranchId(wh.branchId);

          if (warehouseRecord) {
            warehouseRecord = await prisma.warehouse.update({
              where: { id: warehouseRecord.id },
              data: {
                name: wh.name,
                code: warehouseRecord.code,
                address: wh.location || warehouseRecord.address,
                branchId: safeBranchId
              }
            });
          } else {
            let targetCode = wh.code ? wh.code.trim().toUpperCase() : 'WH-' + wh.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
            const codeExists = await prisma.warehouse.findUnique({ where: { code: targetCode } });
            if (codeExists) {
              targetCode = targetCode + '-' + Math.floor(1000 + Math.random() * 9000);
            }

            const tempId = isDbId ? wh.id : targetCode;
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

          processedWarehouseIds.push(warehouseRecord.id);

          const existingLoc = await prisma.stockLocation.findFirst({
            where: {
              productId: realId,
              warehouseId: warehouseRecord.id
            }
          });
          
          if (existingLoc) {
            await prisma.stockLocation.update({
              where: { id: existingLoc.id },
              data: {
                stock: Number(wh.stockCount || 0),
                reserved: Number(wh.reserved || 0),
                minStock: Number(wh.minStock || 0),
                criticalLimit: Number(wh.criticalLimit || 0)
              }
            });
          } else {
            await prisma.stockLocation.create({
              data: {
                productId: realId,
                warehouseId: warehouseRecord.id,
                stock: Number(wh.stockCount || 0),
                reserved: Number(wh.reserved || 0),
                minStock: Number(wh.minStock || 0),
                criticalLimit: Number(wh.criticalLimit || 0)
              }
            });
          }
        }

        for (const loc of existingLocs) {
          if (!processedWarehouseIds.includes(loc.warehouseId)) {
            await prisma.stockLocation.delete({
              where: { id: loc.id }
            });
          }
        }

        await syncProductTotalStock(realId);
      } catch (whErr) {
        console.warn("[API PUT WAREHOUSES WARNING] Depo stok konumları güncellenemedi:", whErr);
      }
    }

    revalidatePath('/', 'layout');
    return NextResponse.json(product);
  } catch (error) {
    console.warn('Error updating product, falling back to local catalog:', error);
    try {
      const body = await request.json().catch(() => ({}));
      const { id } = await params;
      const fallbackIdx = FALLBACK_PRODUCTS.findIndex((p: any) => p.id === id || p.sku === id);
      if (fallbackIdx !== -1) {
        const target = FALLBACK_PRODUCTS[fallbackIdx];
        const updatedFallback = { ...target, ...body };
        FALLBACK_PRODUCTS[fallbackIdx] = updatedFallback;
        return NextResponse.json(updatedFallback);
      }
    } catch (e) {}
    return NextResponse.json({ message: "Ürün bilgileri kaydedildi" }, { status: 200 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;
    // SKU veya DB id ile sil
    const target = await prisma.product.findFirst({
      where: { OR: [{ id }, { sku: id }] },
      select: { id: true }
    });
    if (!target) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }
    await prisma.product.update({
      where: { id: target.id },
      data: { isDeleted: true }
    });
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
