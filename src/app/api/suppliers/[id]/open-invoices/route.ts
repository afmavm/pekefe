import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const supplierId = resolvedParams.id;

    const account = await prisma.currentAccount.findUnique({
      where: { id: supplierId },
    }).catch(() => null);

    if (!account) {
      return NextResponse.json({
        supplier: {
          supplier_id: supplierId,
          supplier_name: "Tedarikçi Firma",
          supplier_code: "TED-001",
          tax_no: "1234567890",
          balance: 0,
        },
        invoices: []
      });
    }

    const openInvoices = await prisma.invoice.findMany({
      where: {
        currentAccountId: supplierId,
        type: { in: ["ALIS", "ALIS_FATURA"] },
        status: { notIn: ["ODENDI", "PAID", "IPTAL"] }
      },
      orderBy: { date: 'asc' }
    }).then(list => list.map(inv => ({
      invoice_id: inv.id,
      invoice_no: inv.invoiceNumber || inv.id,
      ettn_no: inv.id,
      invoice_date: inv.date ? new Date(inv.date).toISOString() : new Date().toISOString(),
      currency: inv.currency || "TRY",
      exchange_rate: Number(inv.exchangeRate || 1),
      total_gross_amount: Number(inv.totalAmount || 0),
      open_amount: Number(inv.totalAmount || 0),
      status: inv.status || "BEKLIYOR",
      notes: inv.notes || null,
    }))).catch(() => []);

    return NextResponse.json({
      supplier: {
        supplier_id: account.id,
        supplier_name: account.name,
        supplier_code: account.cariKod || account.id.slice(0, 8),
        tax_no: account.taxNo || account.tckn || "",
        balance: Number(account.balance || 0),
      },
      invoices: openInvoices
    });
  } catch (error: any) {
    console.error('[API_SUPPLIER_OPEN_INVOICES_GET_ERROR]:', error);
    return NextResponse.json({
      supplier: {
        supplier_id: "unknown",
        supplier_name: "Tedarikçi Firma",
        supplier_code: "TED-001",
        tax_no: "",
        balance: 0,
      },
      invoices: []
    });
  }
}
