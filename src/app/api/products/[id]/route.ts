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
    // id parametresi hem DB id hem de SKU olabilir
    const product = await prisma.product.findFirst({
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

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }


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
      if (dealerAccount) {
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

    const calculated = computeProductPricing(product, dealerAccount, new Date(), b2bContext);

    return NextResponse.json({
      ...product,
      ...calculated,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      attributes: typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const { id } = await params;

    // id parametresi SKU veya gerçek DB id olabilir — gerçek DB id'yi çöz
    const resolvedProduct = await prisma.product.findFirst({
      where: { OR: [{ id }, { sku: id }] },
      select: { id: true }
    });
    if (!resolvedProduct) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }
    const realId = resolvedProduct.id;

    const list_price = body.list_price !== undefined ? Number(body.list_price) : (body.oldPrice !== undefined && body.oldPrice !== null ? Number(body.oldPrice) : undefined);
    const sale_price = body.sale_price !== undefined ? Number(body.sale_price) : (body.price !== undefined ? Number(body.price) : undefined);
    
    if (list_price !== undefined && sale_price !== undefined) {
      if (list_price < sale_price) {
        return NextResponse.json({ error: "Liste fiyatı satış fiyatından küçük olamaz" }, { status: 400 });
      }
    }
    if (sale_price !== undefined && sale_price < 0) {
      return NextResponse.json({ error: "Satış fiyatı 0'dan küçük olamaz" }, { status: 400 });
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.sku !== undefined) {
      const existingSku = await prisma.product.findFirst({
        where: {
          sku: body.sku,
          id: { not: realId }
        }
      });
      if (existingSku) {
        return NextResponse.json({ error: 'Bu Stok Kodu (SKU) başka bir ürün tarafından kullanılıyor. Lütfen benzersiz bir SKU girin.' }, { status: 400 });
      }
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
      await prisma.productB2BPrice.updateMany({
        where: { productId: realId },
        data: { price: Number(body.sale_price) }
      });
    }
    if (body.stock_quantity !== undefined) {
      data.stock_quantity = Number(body.stock_quantity);
      data.stock = Number(body.stock_quantity);
    }
    if (body.price !== undefined && body.sale_price === undefined) {
      data.price = Number(body.price);
      data.sale_price = Number(body.price);
      data.b2b_base_price = Number(body.price);
      await prisma.productB2BPrice.updateMany({
        where: { productId: realId },
        data: { price: Number(body.price) }
      });
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
      const existingProduct = await prisma.product.findUnique({ where: { id: realId } });
      const currentAttrs = existingProduct?.attributes
        ? (typeof existingProduct.attributes === 'string'
            ? JSON.parse(existingProduct.attributes)
            : existingProduct.attributes)
        : {};
      
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
      // Find all existing locations for this product first
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

        // Find if stock location entry exists for this product and warehouse
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

      // Prune locations: delete any StockLocation for this product where warehouseId is not in processedWarehouseIds
      for (const loc of existingLocs) {
        if (!processedWarehouseIds.includes(loc.warehouseId)) {
          await prisma.stockLocation.delete({
            where: { id: loc.id }
          });
        }
      }

      // Sync total stock back to product table based on new locations
      await syncProductTotalStock(realId);
    } else if (body.stock !== undefined) {
      // Quick Stock Edit scenario: body.stock is sent, but body.warehouses is not provided.
      // We will identify the main warehouse (code: WH-MRKZ, or the first active warehouse) and allocate the stock to it.
      const existingLocs = await prisma.stockLocation.findMany({
        where: { productId: realId }
      });

      let mainWarehouse = await prisma.warehouse.findFirst({
        where: { code: 'WH-MRKZ' }
      });
      if (!mainWarehouse) {
        mainWarehouse = await prisma.warehouse.findFirst({
          where: { isActive: true }
        });
      }

      if (mainWarehouse) {
        const otherLocsSum = existingLocs
          .filter(l => l.warehouseId !== mainWarehouse!.id)
          .reduce((sum, l) => sum + l.stock, 0);

        const targetMainStock = Math.max(0, Number(body.stock) - otherLocsSum);

        const mainLoc = existingLocs.find(l => l.warehouseId === mainWarehouse!.id);
        if (mainLoc) {
          await prisma.stockLocation.update({
            where: { id: mainLoc.id },
            data: { stock: targetMainStock }
          });
        } else {
          await prisma.stockLocation.create({
            data: {
              productId: realId,
              warehouseId: mainWarehouse.id,
              stock: targetMainStock
            }
          });
        }

        // Sync total stock back to product table
        await syncProductTotalStock(realId);
      }
    }

    // Save/update variants
    if (body.variants && Array.isArray(body.variants)) {
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: realId }
      });
      const existingVariantIds = existingVariants.map(v => v.id);
      const incomingVariantIds = body.variants.map((v: any) => v.id).filter(Boolean);

      // 1. Delete variants that are not in the incoming payload
      const toDelete = existingVariantIds.filter(vId => !incomingVariantIds.includes(vId));
      if (toDelete.length > 0) {
        await prisma.productVariant.deleteMany({
          where: { id: { in: toDelete } }
        });
      }

      // 2. Add or Update ALL incoming variants (never skip)
      const processedSkus = new Set<string>();
      const productSku = (body.sku || realId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 20);

      for (let i = 0; i < body.variants.length; i++) {
        const variant = body.variants[i];

        // --- Guarantee a non-empty SKU ---
        let baseSku = (variant.sku || '').trim();
        if (!baseSku) {
          // Auto-generate from product SKU + size slug + index
          const sizeSlug = (variant.size || variant.name || 'VAR')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 8);
          baseSku = `${productSku}-${sizeSlug}-V${i + 1}`;
        }

        // Ensure uniqueness within this batch AND across the entire table
        let safeSku = baseSku;
        let counter = 1;
        while (
          processedSkus.has(safeSku) ||
          (await prisma.productVariant.findFirst({ where: { sku: safeSku, productId: { not: realId } } }))
        ) {
          safeSku = `${baseSku}-${counter++}`;
        }
        processedSkus.add(safeSku);

        const variantData = {
          stock: Number(variant.stock ?? 0),
          price: Number(variant.price ?? 0),
          attributes: {
            size: variant.size || '',
            color: variant.color || '',
            barcode: variant.barcode || '',
            name: variant.name || `${variant.size || ''} - ${variant.color || ''}`.trim(),
            b2bPrice: variant.b2bPrice != null ? Number(variant.b2bPrice) : null,
            vatRate: variant.vatRate != null ? Number(variant.vatRate) : 20,
            vatIncluded: variant.vatIncluded ?? true,
          }
        };

        const existingById = variant.id ? existingVariants.find((v: any) => v.id === variant.id) : null;
        const existingBySku = existingVariants.find((v: any) => v.sku === baseSku || v.sku === safeSku);
        const targetVariant = existingById || existingBySku;

        if (targetVariant) {
          await prisma.productVariant.update({
            where: { id: targetVariant.id },
            data: { ...variantData, sku: safeSku }
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: realId,
              sku: safeSku,
              ...variantData
            }
          });
        }
      }
    }

    revalidatePath('/', 'layout');
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
