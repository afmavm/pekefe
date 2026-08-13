"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { CreateProductionOrderSchema } from "./validation";
import { revalidatePath } from "next/cache";

export async function getProductionData() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized && process.env.NODE_ENV === "production") {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
      }
    }

    try {
      const { assertCompanyFeature } = await import("@/lib/tenant-helpers");
      await assertCompanyFeature("production");
    } catch (error: any) {
      return { success: false, error: error.message || "Bu modüle erişim yetkiniz bulunmamaktadır." };
    }

    const [
      finishedGoods,
      rawMaterials,
      productionOrders,
      productionPlans,
      workstations,
      routeSteps,
      wasteLogs,
      warehouses
    ] = await Promise.all([
      // 1. Finished goods
      prisma.product.findMany({
        where: { isRawMaterial: false, isDeleted: false },
        include: {
          recipe: {
            include: {
              ingredient: true,
              ingredientVariant: true,
              mainProductVariant: true,
            }
          },
          variants: true,
        },
        orderBy: { name: 'asc' }
      }).catch(() => []),

      // 2. Raw materials
      prisma.product.findMany({
        where: { isRawMaterial: true, isDeleted: false },
        include: { variants: true },
        orderBy: { name: 'asc' }
      }).catch(() => []),

      // 3. Production orders
      prisma.productionOrder.findMany({
        include: {
          product: true,
          variant: true,
          warehouse: true,
          plan: true,
        },
        orderBy: { date: 'desc' },
        take: 100
      }).catch(() => []),

      // 4. Production plans
      prisma.productionPlan.findMany({
        include: { orders: true },
        orderBy: { startDate: 'desc' },
      }).catch(() => []),

      // 5. Workstations
      prisma.workstation.findMany({
        include: {
          steps: { include: { product: true } }
        },
        orderBy: { code: 'asc' }
      }).catch(() => []),

      // 6. Route steps
      prisma.routeStep.findMany({
        include: {
          product: true,
          workstation: true,
        },
        orderBy: { stepNumber: 'asc' }
      }).catch(() => []),

      // 7. Waste logs
      prisma.wasteLog.findMany({
        include: {
          product: true,
          variant: true,
          warehouse: true,
          productionOrder: true,
        },
        orderBy: { date: 'desc' },
        take: 100
      }).catch(() => []),

      // 8. Warehouses
      prisma.warehouse.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }).catch(() => [])
    ]);

    const defaultWarehouses = warehouses.length > 0 ? warehouses : [
      { id: "merkez-depo", name: "Merkez Depo", code: "WH-MRKZ" }
    ];

    return {
      success: true,
      data: {
        finishedGoods: JSON.parse(JSON.stringify(finishedGoods)),
        rawMaterials: JSON.parse(JSON.stringify(rawMaterials)),
        productionOrders: JSON.parse(JSON.stringify(productionOrders)),
        productionPlans: JSON.parse(JSON.stringify(productionPlans)),
        workstations: JSON.parse(JSON.stringify(workstations)),
        routeSteps: JSON.parse(JSON.stringify(routeSteps)),
        wasteLogs: JSON.parse(JSON.stringify(wasteLogs)),
        warehouses: JSON.parse(JSON.stringify(defaultWarehouses))
      }
    };
  } catch (error) {
    console.error("Error in getProductionData:", error);
    return { success: false, error: "Üretim verileri yüklenirken bir veritabanı hatası oluştu." };
  }
}

export async function createProductionOrderAction(input: {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  warehouseId?: string | null;
  productionPlanId?: string | null;
  notes?: string | null;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  // Safe validation
  const validation = CreateProductionOrderSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { productId, productVariantId, quantity, warehouseId, productionPlanId, notes } = validation.data;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        recipe: true
      }
    });

    if (!product || product.isDeleted) {
      return { success: false, error: "Ürün bulunamadı." };
    }

    if (product.isRawMaterial) {
      return { success: false, error: "Hammadde doğrudan üretilemez." };
    }

    if (!product.recipe || product.recipe.length === 0) {
      return { success: false, error: "Bu ürünün üretim reçetesi (BOM) tanımlanmamış." };
    }

    // Default to first warehouse if not specified
    let selectedWarehouseId = warehouseId;
    if (!selectedWarehouseId) {
      const firstWarehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
      if (!firstWarehouse) {
        return { success: false, error: "Sistemde aktif depo bulunamadı." };
      }
      selectedWarehouseId = firstWarehouse.id;
    }

    // Create a pending production order
    const order = await prisma.productionOrder.create({
      data: {
        productId,
        productVariantId: productVariantId || null,
        quantity,
        warehouseId: selectedWarehouseId,
        productionPlanId: productionPlanId || null,
        notes: notes || null,
        status: "Bekliyor"
      }
    });

    revalidatePath("/admin/production");
    revalidatePath("/admin/production/orders");
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error) {
    console.error("Error in createProductionOrderAction:", error);
    return { success: false, error: "Üretim emri oluşturulurken bir hata oluştu." };
  }
}

export async function approveProductionOrderAction(orderId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    // 1. Fetch production order with recipe details
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: {
            recipe: {
              include: {
                ingredient: true,
                ingredientVariant: true
              }
            }
          }
        },
        warehouse: true
      }
    });

    if (!productionOrder) {
      return { success: false, error: "Üretim emri bulunamadı." };
    }

    if (productionOrder.status !== "Bekliyor") {
      return { success: false, error: "Yalnızca 'Bekliyor' durumundaki emirler onaylanabilir." };
    }

    const warehouseId = productionOrder.warehouseId;
    if (!warehouseId) {
      return { success: false, error: "Üretim emrine atanmış bir depo bulunmamaktadır." };
    }

    if (productionOrder.warehouse?.isLocked) {
      return { success: false, error: "Seçili depo sayım işlemi nedeniyle kilitlidir. Değişiklik yapılamaz." };
    }

    const recipe = productionOrder.product.recipe;
    if (!recipe || recipe.length === 0) {
      return { success: false, error: "Ürünün reçetesi tanımlanmamış." };
    }

    // 2. ACID Transaction for checking stock and incrementing reserved quantities
    const result = await prisma.$transaction(async (tx) => {
      for (const item of recipe) {
        const requiredQty = item.quantity * productionOrder.quantity;

        // Fetch or create StockLocation for the ingredient at the selected warehouse
        let stockLoc = await tx.stockLocation.findFirst({
          where: {
            productId: item.ingredientId,
            productVariantId: item.ingredientVariantId || null,
            warehouseId: warehouseId
          }
        });

        if (!stockLoc) {
          // If no location exists, stock is 0
          return {
            success: false,
            error: `Yetersiz hammadde stoku: ${item.ingredient.name}. Depoda stok bulunmamaktadır.`
          };
        }

        const availableStock = stockLoc.stock - stockLoc.reserved;
        if (availableStock < requiredQty) {
          return {
            success: false,
            error: `Yetersiz hammadde stoku: ${item.ingredient.name} ${item.ingredientVariant ? `(${Object.values(item.ingredientVariant.attributes as Record<string, string>).join(' ')})` : ''}. Gerekli: ${requiredQty} ${item.unit}, Kullanılabilir: ${availableStock} ${item.unit}`
          };
        }

        // Increment reserved quantity
        await tx.stockLocation.update({
          where: { id: stockLoc.id },
          data: {
            reserved: { increment: requiredQty }
          }
        });
      }

      // Update ProductionOrder status
      const updatedOrder = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: "Onaylandı",
          approvedBy: auth.session.user.email || "System Admin",
          startDate: new Date()
        }
      });

      return { success: true, order: updatedOrder };
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/admin/production");
    revalidatePath("/admin/production/orders");
    return { success: true, data: JSON.parse(JSON.stringify(result.order)) };
  } catch (error) {
    console.error("Error in approveProductionOrderAction:", error);
    return { success: false, error: "Üretim emri onaylanırken bir hata oluştu." };
  }
}

export async function processProductionOrderAction(orderId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    // 1. Fetch production order
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: {
            recipe: {
              include: {
                ingredient: true,
                ingredientVariant: true
              }
            }
          }
        },
        warehouse: true
      }
    });

    if (!productionOrder) {
      return { success: false, error: "Üretim emri bulunamadı." };
    }

    if (productionOrder.status === "Tamamlandı") {
      return { success: false, error: "Bu üretim emri zaten tamamlanmış." };
    }

    if (productionOrder.status === "İptal") {
      return { success: false, error: "İptal edilmiş bir üretim emri tamamlanamaz." };
    }

    const warehouseId = productionOrder.warehouseId;
    if (!warehouseId) {
      return { success: false, error: "Üretim emrine atanmış bir depo bulunmamaktadır." };
    }

    if (productionOrder.warehouse?.isLocked) {
      return { success: false, error: "Seçili depo sayım işlemi nedeniyle kilitlidir. Değişiklik yapılamaz." };
    }

    const recipe = productionOrder.product.recipe;
    if (!recipe || recipe.length === 0) {
      return { success: false, error: "Ürünün reçetesi tanımlanmamış." };
    }

    // 2. Transaction for consumption and stock entry
    const result = await prisma.$transaction(async (tx) => {
      // A) Consume ingredients
      for (const item of recipe) {
        const requiredQty = item.quantity * productionOrder.quantity;

        // Fetch StockLocation
        let stockLoc = await tx.stockLocation.findFirst({
          where: {
            productId: item.ingredientId,
            productVariantId: item.ingredientVariantId || null,
            warehouseId: warehouseId
          }
        });

        // If previously Onaylandı, decrement reserved and stock. If Bekliyor, just stock.
        if (productionOrder.status === "Onaylandı") {
          if (!stockLoc) {
            throw new Error(`Kritik Hata: Onaylanmış rezervasyon kaydı ${item.ingredient.name} için bulunamadı.`);
          }
          await tx.stockLocation.update({
            where: { id: stockLoc.id },
            data: {
              stock: { decrement: requiredQty },
              reserved: { decrement: requiredQty }
            }
          });
        } else {
          // Status is Bekliyor - check available stock first
          if (!stockLoc || (stockLoc.stock - stockLoc.reserved) < requiredQty) {
            throw new Error(`Yetersiz Stok: ${item.ingredient.name} için gerekli miktar karşılanamıyor.`);
          }
          await tx.stockLocation.update({
            where: { id: stockLoc.id },
            data: {
              stock: { decrement: requiredQty }
            }
          });
        }

        // Decrement absolute stock on Product/ProductVariant level for sync
        if (item.ingredientVariantId) {
          await tx.productVariant.update({
            where: { id: item.ingredientVariantId },
            data: { stock: { decrement: requiredQty } }
          });
        }
        await tx.product.update({
          where: { id: item.ingredientId },
          data: { stock: { decrement: requiredQty } }
        });

        // Write StockTransaction audit log
        await tx.stockTransaction.create({
          data: {
            productId: item.ingredientId,
            productVariantId: item.ingredientVariantId || null,
            warehouseId: warehouseId,
            type: "PRODUCTION_OUT",
            quantity: -requiredQty,
            description: `${productionOrder.quantity} Adet ${productionOrder.product.name} üretimi için tüketim (Emir: ${orderId})`,
            userId: auth.session.user.id,
            userEmail: auth.session.user.email,
            moduleSource: "PRODUCTION",
            referenceId: orderId
          }
        });
      }

      // B) Add Finished Goods stock
      let targetStockLoc = await tx.stockLocation.findFirst({
        where: {
          productId: productionOrder.productId,
          productVariantId: productionOrder.productVariantId || null,
          warehouseId: warehouseId
        }
      });

      if (targetStockLoc) {
        await tx.stockLocation.update({
          where: { id: targetStockLoc.id },
          data: { stock: { increment: productionOrder.quantity } }
        });
      } else {
        await tx.stockLocation.create({
          data: {
            productId: productionOrder.productId,
            productVariantId: productionOrder.productVariantId || null,
            warehouseId: warehouseId,
            stock: productionOrder.quantity,
            reserved: 0
          }
        });
      }

      // Update absolute stock on Product/Variant
      if (productionOrder.productVariantId) {
        await tx.productVariant.update({
          where: { id: productionOrder.productVariantId },
          data: { stock: { increment: productionOrder.quantity } }
        });
      }
      await tx.product.update({
        where: { id: productionOrder.productId },
        data: { stock: { increment: productionOrder.quantity } }
      });

      // Write StockTransaction audit log for finished goods
      await tx.stockTransaction.create({
        data: {
          productId: productionOrder.productId,
          productVariantId: productionOrder.productVariantId || null,
          warehouseId: warehouseId,
          type: "PRODUCTION_IN",
          quantity: productionOrder.quantity,
          description: `Üretim tamamlandı, depoya giriş yapıldı (Emir: ${orderId})`,
          userId: auth.session.user.id,
          userEmail: auth.session.user.email,
          moduleSource: "PRODUCTION",
          referenceId: orderId
        }
      });

      // Update ProductionOrder status
      const updatedOrder = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: "Tamamlandı",
          completedBy: auth.session.user.email || "System Admin",
          endDate: new Date()
        }
      });

      return updatedOrder;
    });

    revalidatePath("/admin/production");
    revalidatePath("/admin/production/orders");
    revalidatePath("/admin/stock");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };

  } catch (error: any) {
    console.error("Error in processProductionOrderAction:", error);
    return { success: false, error: error.message || "Üretim tamamlanırken bir veritabanı hatası oluştu." };
  }
}

export async function cancelProductionOrderAction(orderId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: {
            recipe: true
          }
        },
        warehouse: true
      }
    });

    if (!productionOrder) {
      return { success: false, error: "Üretim emri bulunamadı." };
    }

    if (productionOrder.status === "Tamamlandı" || productionOrder.status === "İptal") {
      return { success: false, error: "Tamamlanmış veya iptal edilmiş emirler tekrar iptal edilemez." };
    }

    const warehouseId = productionOrder.warehouseId;

    // Transaction to release reservations if Onaylandı
    const result = await prisma.$transaction(async (tx) => {
      if (productionOrder.status === "Onaylandı" && warehouseId) {
        for (const item of productionOrder.product.recipe) {
          const reservedQty = item.quantity * productionOrder.quantity;

          let stockLoc = await tx.stockLocation.findFirst({
            where: {
              productId: item.ingredientId,
              productVariantId: item.ingredientVariantId || null,
              warehouseId: warehouseId
            }
          });

          if (stockLoc) {
            await tx.stockLocation.update({
              where: { id: stockLoc.id },
              data: {
                reserved: {
                  decrement: Math.min(stockLoc.reserved, reservedQty) // Prevent negative values
                }
              }
            });
          }
        }
      }

      const updated = await tx.productionOrder.update({
        where: { id: orderId },
        data: {
          status: "İptal"
        }
      });

      return updated;
    });

    revalidatePath("/admin/production");
    revalidatePath("/admin/production/orders");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error("Error in cancelProductionOrderAction:", error);
    return { success: false, error: "Üretim emri iptal edilirken bir hata oluştu." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REÇETE / BOM AKSİYONLARI
// ─────────────────────────────────────────────────────────────────────────────

export async function createRecipeItemAction(data: {
  mainProductId: string;
  mainProductVariantId?: string | null;
  ingredientId: string;
  ingredientVariantId?: string | null;
  quantity: number;
  unit: string;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  if (data.quantity <= 0) {
    return { success: false, error: "Miktar sıfırdan büyük olmalıdır." };
  }

  try {
    const item = await prisma.recipeItem.create({
      data: {
        mainProductId: data.mainProductId,
        mainProductVariantId: data.mainProductVariantId || null,
        ingredientId: data.ingredientId,
        ingredientVariantId: data.ingredientVariantId || null,
        quantity: data.quantity,
        unit: data.unit,
      }
    });

    revalidatePath("/admin/production");
    revalidatePath("/admin/production/recipes");
    return { success: true, data: JSON.parse(JSON.stringify(item)) };
  } catch (error) {
    console.error("Error in createRecipeItemAction:", error);
    return { success: false, error: "Reçete kalemi eklenirken bir hata oluştu." };
  }
}

export async function deleteRecipeItemAction(id: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    await prisma.recipeItem.delete({
      where: { id }
    });

    revalidatePath("/admin/production");
    revalidatePath("/admin/production/recipes");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteRecipeItemAction:", error);
    return { success: false, error: "Reçete kalemi silinirken bir hata oluştu." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ÜRETİM PLANLAMA AKSİYONLARI
// ─────────────────────────────────────────────────────────────────────────────

export async function createProductionPlanAction(data: {
  name: string;
  startDate: string;
  endDate: string;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const plan = await prisma.productionPlan.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "TASLAK"
      }
    });

    revalidatePath("/admin/production/plans");
    return { success: true, data: JSON.parse(JSON.stringify(plan)) };
  } catch (error) {
    console.error("Error in createProductionPlanAction:", error);
    return { success: false, error: "Üretim planı oluşturulurken bir hata oluştu." };
  }
}

export async function updateProductionPlanStatusAction(planId: string, status: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const updated = await prisma.productionPlan.update({
      where: { id: planId },
      data: { status }
    });

    revalidatePath("/admin/production/plans");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Error in updateProductionPlanStatusAction:", error);
    return { success: false, error: "Plan durumu güncellenirken bir hata oluştu." };
  }
}

export async function deleteProductionPlanAction(id: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    await prisma.productionPlan.delete({
      where: { id }
    });

    revalidatePath("/admin/production/plans");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteProductionPlanAction:", error);
    return { success: false, error: "Plan silinirken bir hata oluştu." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// İŞ İSTASYONLARI VE ROTALAR
// ─────────────────────────────────────────────────────────────────────────────

export async function createWorkstationAction(data: {
  name: string;
  code: string;
  capacity: number;
  unit: string;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const ws = await prisma.workstation.create({
      data: {
        name: data.name,
        code: data.code,
        capacity: data.capacity,
        unit: data.unit,
        isActive: true
      }
    });

    revalidatePath("/admin/production/workstations");
    return { success: true, data: JSON.parse(JSON.stringify(ws)) };
  } catch (error) {
    console.error("Error in createWorkstationAction:", error);
    return { success: false, error: "İş istasyonu oluşturulurken bir hata oluştu." };
  }
}

export async function deleteWorkstationAction(id: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    await prisma.workstation.delete({
      where: { id }
    });

    revalidatePath("/admin/production/workstations");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteWorkstationAction:", error);
    return { success: false, error: "İş istasyonu silinirken bir hata oluştu." };
  }
}

export async function createRouteStepAction(data: {
  productId: string;
  stepNumber: number;
  name: string;
  workstationId: string;
  setupTime: number;
  runTime: number;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    const step = await prisma.routeStep.create({
      data: {
        productId: data.productId,
        stepNumber: data.stepNumber,
        name: data.name,
        workstationId: data.workstationId,
        setupTime: data.setupTime,
        runTime: data.runTime
      }
    });

    revalidatePath("/admin/production/workstations");
    return { success: true, data: JSON.parse(JSON.stringify(step)) };
  } catch (error) {
    console.error("Error in createRouteStepAction:", error);
    return { success: false, error: "Rota adımı eklenirken bir hata oluştu." };
  }
}

export async function deleteRouteStepAction(id: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  try {
    await prisma.routeStep.delete({
      where: { id }
    });

    revalidatePath("/admin/production/workstations");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteRouteStepAction:", error);
    return { success: false, error: "Rota adımı silinirken bir hata oluştu." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FİRE VE HURDA YÖNETİMİ
// ─────────────────────────────────────────────────────────────────────────────

export async function createWasteLogAction(data: {
  productId: string;
  productVariantId?: string | null;
  productionOrderId?: string | null;
  warehouseId: string;
  quantity: number;
  reason: string;
}) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: "Bu işlem için yönetici yetkisi gerekmektedir." };
  }

  if (data.quantity <= 0) {
    return { success: false, error: "Fire miktarı sıfırdan büyük olmalıdır." };
  }

  try {
    // Check if depot is locked
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId }
    });
    if (warehouse?.isLocked) {
      return { success: false, error: "Seçili depo kilitlidir. Fire kaydı girilemez." };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock from the warehouse location
      let stockLoc = await tx.stockLocation.findFirst({
        where: {
          productId: data.productId,
          productVariantId: data.productVariantId || null,
          warehouseId: data.warehouseId
        }
      });

      if (!stockLoc || stockLoc.stock < data.quantity) {
        throw new Error("Depoda fire yazılacak kadar stok bulunmamaktadır.");
      }

      await tx.stockLocation.update({
        where: { id: stockLoc.id },
        data: {
          stock: { decrement: data.quantity }
        }
      });

      // Decrement absolute stock
      if (data.productVariantId) {
        await tx.productVariant.update({
          where: { id: data.productVariantId },
          data: { stock: { decrement: data.quantity } }
        });
      }
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: { decrement: data.quantity } }
      });

      // 2. Create StockTransaction audit log (type: OUT or WASTE)
      await tx.stockTransaction.create({
        data: {
          productId: data.productId,
          productVariantId: data.productVariantId || null,
          warehouseId: data.warehouseId,
          type: "OUT",
          quantity: -data.quantity,
          description: `Fire/Hurda Kaydı: ${data.reason}`,
          userId: auth.session.user.id,
          userEmail: auth.session.user.email,
          moduleSource: "PRODUCTION",
          referenceId: data.productionOrderId || null
        }
      });

      // 3. Create WasteLog entry
      const log = await tx.wasteLog.create({
        data: {
          productId: data.productId,
          productVariantId: data.productVariantId || null,
          productionOrderId: data.productionOrderId || null,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          reason: data.reason
        }
      });

      return log;
    });

    revalidatePath("/admin/production/waste");
    revalidatePath("/admin/stock");
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("Error in createWasteLogAction:", error);
    return { success: false, error: error.message || "Fire kaydı oluşturulurken bir hata oluştu." };
  }
}
