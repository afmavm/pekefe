"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { emailNotificationService } from "@/lib/email-notification-service";

/**
 * Asserts that the current session belongs to a verified ADMIN or DEALER profile.
 * Limiting action entry points strictly for role-based security.
 */
async function assertAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Oturum açılmamış. Lütfen giriş yapınız.");
  }
  
  const role = (session.user as any).role || "USER";
  if (role !== "ADMIN" && role !== "DEALER" && role !== "SUPER_ADMIN") {
    throw new Error("Yetkisiz işlem. Bu alan sadece yetkili bayilere veya yöneticilere açıktır.");
  }
  
  return session;
}

/**
 * Updates a single order's status securely on the database.
 */
export async function updateOrderStatusAction(orderId: string, status: string) {
  try {
    await assertAuth();
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { currentAccount: true }
    });

    // Send Status Update Email to Customer
    const recipientEmail = updated.currentAccount?.email;
    if (recipientEmail && recipientEmail !== "guest@nexab2b.com") {
      try {
        let cargoCompany = "Belirtilmedi";
        let trackingNo = "—";
        if (updated.summary && updated.summary.startsWith("[")) {
          const carrierMatch = updated.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);
          if (carrierMatch) {
            cargoCompany = carrierMatch[1].trim();
            if (carrierMatch[2]) trackingNo = carrierMatch[2].trim();
          }
        }

        const hostUrl = process.env.NEXTAUTH_URL || "https://pekefe.com";
        const orderDateStr = updated.date ? new Date(updated.date).toLocaleDateString("tr-TR") : new Date().toLocaleDateString("tr-TR");

        await emailNotificationService.queueEmail(recipientEmail, "order_status_updated", {
          kullanici_adi: updated.currentAccount?.name || "Değerli Müşterimiz",
          siparis_no: updated.id,
          siparis_durumu: status,
          siparis_tutari: Number(updated.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
          kargo_sirketi: cargoCompany,
          takip_no: trackingNo,
          tarih: orderDateStr,
          detay_linki: `${hostUrl}/hesap`
        });
      } catch (mailErr) {
        console.error("Order status notification email failed:", mailErr);
      }
    }

    return { success: true, order: updated };
  } catch (error: any) {
    console.error("Error in updateOrderStatusAction:", error);
    return { success: false, error: error.message || "Sipariş durumu güncellenemedi." };
  }
}

/**
 * Bulk updates the status of multiple orders.
 */
export async function bulkUpdateOrderStatusAction(orderIds: string[], status: string) {
  try {
    await assertAuth();
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: { status }
    });

    // Send status update emails for bulk orders
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { currentAccount: true }
      }).then(orders => {
        orders.forEach(ord => {
          const recipientEmail = ord.currentAccount?.email;
          if (recipientEmail && recipientEmail !== "guest@nexab2b.com") {
            const hostUrl = process.env.NEXTAUTH_URL || "https://pekefe.com";
            emailNotificationService.queueEmail(recipientEmail, "order_status_updated", {
              kullanici_adi: ord.currentAccount?.name || "Değerli Müşterimiz",
              siparis_no: ord.id,
              siparis_durumu: status,
              siparis_tutari: Number(ord.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
              kargo_sirketi: "Standart Kargo",
              takip_no: "—",
              tarih: ord.date ? new Date(ord.date).toLocaleDateString("tr-TR") : new Date().toLocaleDateString("tr-TR"),
              detay_linki: `${hostUrl}/hesap`
            }).catch(e => console.error("Bulk status email error:", e));
          }
        });
      }).catch(e => console.error("Error fetching bulk orders for status email:", e));
    }

    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Error in bulkUpdateOrderStatusAction:", error);
    return { success: false, error: error.message || "Toplu sipariş güncellemesi başarısız oldu." };
  }
}

/**
 * Bulk generates e-Invoices / e-Archive documents for selected orders.
 * B2B orders generate e-Fatura, while B2C orders generate e-Arşiv.
 */
export async function bulkGenerateInvoicesAction(orderIds: string[]) {
  try {
    await assertAuth();
    
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { currentAccount: true }
    });
    
    let successCount = 0;
    let existingCount = 0;
    const errors = [];
    
    for (const order of orders) {
      try {
        const docType = order.type === "B2B" ? "e-Fatura" : "e-Arşiv";
        
        // Ensure there is no existing invoice to avoid double billing
        const existing = await prisma.invoice.findFirst({
          where: { orderId: order.id }
        });
        
        if (existing) {
          existingCount++;
          continue;
        }
        
        // Calculate items subtotal and tax amounts
        let totalAmount = order.total.toNumber();
        let taxAmount = totalAmount - (totalAmount / 1.20);
        
        // Parse items from summary
        const parsed = await parseOrderSummaryBackend(order.summary || "", totalAmount);
        const invItemsData = parsed.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalAmount: item.price * item.quantity,
          vatRate: item.taxRate || 20
        }));

        // Create invoice document
        await prisma.invoice.create({
          data: {
            orderId: order.id,
            currentAccountId: order.currentAccountId,
            totalAmount: totalAmount,
            taxAmount: taxAmount,
            status: "ODENDI",
            type: docType,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
            items: order.summary || "Sipariş Detayı",
            notes: "Sipariş üzerinden otomatik fatura oluşturuldu.",
            invoiceItems: {
              create: invItemsData
            }
          }
        });
        
        // Update order status to indicate invoicing completed
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "Hazırlanıyor" } // Advance queue status
        });
        
        successCount++;
      } catch (err: any) {
        errors.push(`${order.id}: ${err.message}`);
      }
    }
    
    return { success: true, count: successCount, existingCount, errors };
  } catch (error: any) {
    console.error("Error in bulkGenerateInvoicesAction:", error);
    return { success: false, error: error.message || "Toplu faturalandırma sırasında hata." };
  }
}

/**
 * Backend Helper: Parses Order summary into individual item lists
 */
export async function parseOrderSummaryBackend(summaryText: string, orderTotal?: number) {
  if (!summaryText) return [];
  
  const cleanSummary = summaryText.replace(/^\[[^\]]+\]\s*/, "");
  let processedSummary = cleanSummary;
  const platformMatch = cleanSummary.match(/^(?:\d+\s*-\s*)(.*)/);
  if (platformMatch) {
    processedSummary = platformMatch[1];
  }
  
  const parts = processedSummary.split(/,\s*/);
  const items = [];
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    let name = trimmedPart;
    let quantity = 1;
    
    const parentheseMatch = trimmedPart.match(/(.+)\s*\((\d+)\)/);
    const prefixMatch = trimmedPart.match(/^(\d+)\s*[xX*]\s*(.+)/);
    const suffixMatch = trimmedPart.match(/(.+?)\s*[xX*]\s*(\d+)$/);

    if (parentheseMatch) {
      name = parentheseMatch[1].trim();
      quantity = parseInt(parentheseMatch[2], 10);
    } else if (prefixMatch) {
      quantity = parseInt(prefixMatch[1], 10);
      name = prefixMatch[2].trim();
    } else if (suffixMatch) {
      name = suffixMatch[1].trim();
      quantity = parseInt(suffixMatch[2], 10);
    }

    let basePrice = 250;
    if (name.includes("Körük")) basePrice = 450;
    else if (name.includes("Kovan")) basePrice = 1200;
    else if (name.includes("Maske")) basePrice = 180;
    else if (name.includes("Demir")) basePrice = 90;
    else if (name.includes("Tel")) basePrice = 120;
    else if (name.includes("Süzme")) basePrice = 3500;
    else if (name.includes("Bal")) basePrice = 150;

    items.push({
      name,
      quantity,
      price: basePrice,
      taxRate: 20
    });
  }

  if (orderTotal !== undefined && orderTotal > 0 && items.length > 0) {
    const targetSubtotal = orderTotal / 1.20;
    const estimatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (estimatedTotal > 0) {
      const factor = targetSubtotal / estimatedTotal;
      let calculatedSubtotal = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (i === items.length - 1) {
          const remainingSubtotal = targetSubtotal - calculatedSubtotal;
          item.price = remainingSubtotal / item.quantity;
        } else {
          item.price = Math.round((item.price * factor) * 100) / 100;
          calculatedSubtotal += item.price * item.quantity;
        }
      }
    }
  }

  return items;
}

/**
 * Server Action: Fetches all order items and their current waybill/invoice quantities
 */
export async function getFulfillmentDetailsAction(orderId: string) {
  try {
    await assertAuth();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        despatchAdvices: {
          include: { lines: { include: { product: true } } }
        },
        invoices: {
          include: { invoiceItems: true }
        }
      }
    });

    if (!order) {
      return { success: false, error: "Sipariş bulunamadı." };
    }

    const parsed = await parseOrderSummaryBackend(order.summary || "", order.total.toNumber());

    const items = parsed.map(item => {
      let shippedQty = 0;
      order.despatchAdvices.forEach(da => {
        if (da.status !== "Cancelled") {
          da.lines.forEach(l => {
            if (l.product.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(l.product.name.toLowerCase())) {
              shippedQty += l.quantity;
            }
          });
        }
      });

      let invoicedQty = 0;
      order.invoices.forEach(inv => {
        if (inv.status !== "Cancelled") {
          inv.invoiceItems.forEach(ii => {
            if (ii.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(ii.name.toLowerCase())) {
              invoicedQty += ii.quantity;
            }
          });
        }
      });

      return {
        productName: item.name,
        price: item.price,
        orderedQty: item.quantity,
        shippedQty: Math.min(item.quantity, shippedQty),
        invoicedQty: Math.min(item.quantity, invoicedQty)
      };
    });

    return { 
      success: true, 
      order: {
        id: order.id,
        status: order.status,
        date: order.date.toISOString(),
        total: order.total.toNumber(),
        summary: order.summary,
        type: order.type
      }, 
      items,
      waybills: order.despatchAdvices.map(da => ({ id: da.id, despatchNo: da.despatchNo, status: da.status, date: da.createdAt.toISOString() })),
      invoices: order.invoices.map(inv => ({ id: inv.id, totalAmount: inv.totalAmount.toNumber(), status: inv.status, type: inv.type, date: inv.date.toISOString() }))
    };
  } catch (error: any) {
    console.error("Error in getFulfillmentDetailsAction:", error);
    return { success: false, error: error.message || "Sevkiyat detayları alınamadı." };
  }
}

/**
 * Server Action: Creates invoices and/or waybills for selected quantities
 */
export async function createInvoiceAndWaybillAction(
  orderId: string,
  together: boolean,
  items: Array<{ productName: string; price: number; orderedQty: number; shipQty: number; invoiceQty: number }>
) {
  try {
    await assertAuth();

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { success: false, error: "Sipariş bulunamadı." };
    }

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000);
    const despatchNo = `IRS-${dateStr}-${randStr}`;
    const invoiceNo = `FAT-${dateStr}-${randStr}`;

    const result = await prisma.$transaction(async (tx) => {
      let createWaybill = false;
      let createInvoice = false;

      const daLinesData: any[] = [];
      const invItemsData: any[] = [];
      let totalInvoiceAmount = 0;

      for (const item of items) {
        let shipQty = 0;
        let invoiceQty = 0;

        if (together) {
          const existingDespatches = await tx.despatchAdvice.findMany({
            where: { orderId: order.id, status: { not: "Cancelled" } },
            include: { lines: { include: { product: true } } }
          });
          let shippedQtySoFar = 0;
          existingDespatches.forEach(da => {
            da.lines.forEach(l => {
              if (l.product.name.toLowerCase().includes(item.productName.toLowerCase()) || item.productName.toLowerCase().includes(l.product.name.toLowerCase())) {
                shippedQtySoFar += l.quantity;
              }
            });
          });

          const existingInvoices = await tx.invoice.findMany({
            where: { orderId: order.id, status: { not: "Cancelled" } },
            include: { invoiceItems: true }
          });
          let invoicedQtySoFar = 0;
          existingInvoices.forEach(inv => {
            inv.invoiceItems.forEach(ii => {
              if (ii.name.toLowerCase().includes(item.productName.toLowerCase()) || item.productName.toLowerCase().includes(ii.name.toLowerCase())) {
                invoicedQtySoFar += ii.quantity;
              }
            });
          });

          shipQty = Math.max(0, item.orderedQty - shippedQtySoFar);
          invoiceQty = Math.max(0, item.orderedQty - invoicedQtySoFar);
        } else {
          shipQty = item.shipQty;
          invoiceQty = item.invoiceQty;
        }

        if (shipQty > 0) {
          createWaybill = true;
          let dbProduct = await tx.product.findFirst({
            where: { name: { contains: item.productName } }
          });
          if (!dbProduct) {
            dbProduct = await tx.product.findFirst();
          }
          if (dbProduct) {
            daLinesData.push({
              productId: dbProduct.id,
              quantity: shipQty
            });
          }
        }

        if (invoiceQty > 0) {
          createInvoice = true;
          invItemsData.push({
            name: item.productName,
            quantity: invoiceQty,
            unitPrice: item.price,
            totalAmount: item.price * invoiceQty
          });
          totalInvoiceAmount += item.price * invoiceQty;
        }
      }

      let newDaId: string | null = null;
      let newInvId: string | null = null;

      if (createWaybill && daLinesData.length > 0) {
        const da = await tx.despatchAdvice.create({
          data: {
            despatchNo,
            customerAccountId: order.currentAccountId,
            orderId: order.id,
            issueDate: new Date(),
            actualDespatchDate: new Date(),
            status: "SEVK_EDILDI",
            lines: {
              create: daLinesData
            }
          }
        });
        newDaId = da.id;
      }

      if (createInvoice && invItemsData.length > 0) {
        const docType = order.type === "B2B" ? "e-Fatura" : "e-Arşiv";
        const inv = await tx.invoice.create({
          data: {
            orderId: order.id,
            currentAccountId: order.currentAccountId,
            totalAmount: totalInvoiceAmount,
            taxAmount: totalInvoiceAmount - (totalInvoiceAmount / 1.20),
            status: "BEKLEMEDE",
            type: docType,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: order.summary || "Sipariş Detayı",
            notes: "Sipariş üzerinden akıllı fatura oluşturuldu.",
            invoiceItems: {
              create: invItemsData
            }
          }
        });
        newInvId = inv.id;

        if (newDaId) {
          await tx.despatchAdvice.update({
            where: { id: newDaId },
            data: { invoiceId: inv.id }
          });
        }
      }

      const nextStatus = together ? "Teslim Edildi" : "Hazırlanıyor";
      await tx.order.update({
        where: { id: order.id },
        data: { status: nextStatus }
      });

      return { success: true, waybillId: newDaId, invoiceId: newInvId };
    });

    return result;
  } catch (error: any) {
    console.error("Error in createInvoiceAndWaybillAction:", error);
    return { success: false, error: error.message || "Belgeler oluşturulurken hata." };
  }
}
