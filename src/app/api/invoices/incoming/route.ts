import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized && process.env.NODE_ENV === "production") {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return auth.response;
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'All';
    const lists = searchParams.get('lists') === 'true';

    if (lists) {
      const suppliers = await prisma.currentAccount.findMany({
        where: { type: { in: ["TEDARIKCI", "BOTH", "SUPPLIER"] } },
        select: { id: true, name: true, taxNo: true }
      }).then(list => list.map(s => ({ id: s.id, name: s.name, tax_no: s.taxNo || "" }))).catch(() => []);

      const stocks = await prisma.product.findMany({
        select: { id: true, name: true, sku: true, barcode: true, cost: true }
      }).then(list => list.map(p => ({ id: p.id, name: p.name, code: p.sku || "", barcode: p.barcode || "", current_cost: Number(p.cost || 0) }))).catch(() => []);

      return NextResponse.json({ suppliers, stocks, warehouses: [] });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        type: { in: ["ALIS", "ALIS_FATURA", "e-Fatura"] },
        ...(status !== "All" ? { status } : {})
      },
      select: {
        id: true,
        invoiceNumber: true,
        date: true,
        totalAmount: true,
        currency: true,
        exchangeRate: true,
        status: true,
        notes: true,
        currentAccount: { select: { taxNo: true } }
      },
      orderBy: { date: 'desc' }
    }).then(list => list.map(inv => ({
      ettn_no: inv.id,
      invoice_no: inv.invoiceNumber || inv.id,
      supplier_vkn: inv.currentAccount?.taxNo || "-",
      invoice_date: inv.date ? new Date(inv.date).toISOString() : new Date().toISOString(),
      total_gross_amount: Number(inv.totalAmount || 0),
      currency: inv.currency || "TRY",
      exchange_rate: Number(inv.exchangeRate || 1),
      status: inv.status || "AKTARILDI",
      error_message: null,
    }))).catch(() => []);

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('[API_INCOMING_INVOICES_GET_ERROR]:', error);
    return NextResponse.json([]);
  }
}
