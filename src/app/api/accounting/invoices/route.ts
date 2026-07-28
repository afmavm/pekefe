import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ALL";
  const type = searchParams.get("type") || "ALL";

  try {
    // Auto-mark overdue invoices before returning list
    await prisma.invoice.updateMany({
      where: {
        status: { notIn: ["ODENDI", "IPTAL", "VADESI_GECTI"] },
        dueDate: { lt: new Date() },
      },
      data: { status: "VADESI_GECTI" },
    });

    const invoices = await prisma.invoice.findMany({
      where: {
        AND: [
          status !== "ALL" ? { status } : {},
          type !== "ALL" ? { type } : {},
        ]
      },
      include: {
        currentAccount: true,
        invoiceItems: true,
      },
      orderBy: { date: "desc" }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 550 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();
    
    // Create Invoice and InvoiceItems inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Safe mapping for incoming item fields to prevent Prisma crashes
      const itemsPayload = (data.items ?? []).map((item: any) => {
        const name = item.description || item.name || "Ürün/Hizmet";
        const quantity = Number(item.quantity ?? 1);
        const unitPrice = Number(item.unitPrice ?? 0);
        const vatRate = Number(item.taxRate ?? item.vatRate ?? 18);
        const totalAmount = Number(item.totalAmount ?? (quantity * unitPrice));
        return { name, quantity, unitPrice, vatRate, totalAmount };
      }, { maxWait: 10000, timeout: 30000 });

      const inv = await tx.invoice.create({
        data: {
          currentAccount: { connect: { id: data.currentAccountId } },
          date: new Date(data.date),
          dueDate: new Date(data.dueDate),
          totalAmount: data.totalAmount,
          taxAmount: data.taxAmount,
          status: data.status || "TASLAK",
          type: data.type || "SATIS",
          notes: data.notes || "",
          items: itemsPayload,
          invoiceItems: {
            create: itemsPayload.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              totalAmount: item.totalAmount,
            }))
          }
        }
      });

      // Update CurrentAccount balance if the invoice is approved/sent/paid
      const isApproved = inv.status !== "TASLAK" && inv.status !== "IPTAL";
      if (isApproved) {
        const balanceChange = inv.type === "SATIS" ? Number(inv.totalAmount) : -Number(inv.totalAmount);
        await tx.currentAccount.update({
          where: { id: data.currentAccountId },
          data: {
            balance: {
              increment: balanceChange,
            }
          }
        });
      }

      return inv;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
