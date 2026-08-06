import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: resolvedParams.id },
      include: {
        invoiceItems: true,
        currentAccount: true
      }
    });
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const data = await request.json();
    
    const invoice = await prisma.invoice.findUnique({ where: { id: resolvedParams.id }});
    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
    }
    if (invoice.status === "ONAYLANDI" && data.status !== "ODENDI" && data.status !== "IPTAL") {
      return NextResponse.json({ error: "Onaylı fatura düzenlenemez" }, { status: 400 });
    }

    // Calculate balance change based on status transitions
    const wasApproved = invoice.status !== "TASLAK" && invoice.status !== "IPTAL";
    const willBeApproved = data.status !== "TASLAK" && data.status !== "IPTAL";

    let balanceChange = 0;
    if (!wasApproved && willBeApproved) {
      balanceChange = invoice.type === "SATIS" ? Number(invoice.totalAmount) : -Number(invoice.totalAmount);
    } else if (wasApproved && !willBeApproved) {
      balanceChange = invoice.type === "SATIS" ? -Number(invoice.totalAmount) : Number(invoice.totalAmount);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id: resolvedParams.id },
        data: {
          status: data.status,
        }
      });

      if (balanceChange !== 0) {
        await tx.currentAccount.update({
          where: { id: invoice.currentAccountId },
          data: {
            balance: {
              increment: balanceChange,
            }
          }
        });
      }

      return updatedInvoice;
    }, { maxWait: 10000, timeout: 30000 });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id: resolvedParams.id }});
    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
    }
    if (invoice.status === "ONAYLANDI") {
      return NextResponse.json({ error: "Onaylı fatura silinemez" }, { status: 400 });
    }

    const wasApproved = invoice.status !== "TASLAK" && invoice.status !== "IPTAL";
    const balanceChange = wasApproved
      ? (invoice.type === "SATIS" ? -Number(invoice.totalAmount) : Number(invoice.totalAmount))
      : 0;

    await prisma.$transaction(async (tx) => {
      await tx.invoice.delete({ where: { id: resolvedParams.id } });
      if (balanceChange !== 0) {
        await tx.currentAccount.update({
          where: { id: invoice.currentAccountId },
          data: {
            balance: {
              increment: balanceChange,
            }
          }
        });
      }
    }, { maxWait: 10000, timeout: 30000 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
