/**
 * GET /api/accounting/current-accounts/[id]/ekstre
 *
 * Bir cari hesabın tüm hareketlerini birleşik olarak döndürür:
 * - Transaction kayıtları (tahsilat, ödeme, devir, satış, alış)
 * - Sipariş kayıtları (B2B/B2C)
 * - Fatura kayıtları
 *
 * Query params:
 *   ?from=2024-01-01   başlangıç tarihi (opsiyonel)
 *   ?to=2024-12-31     bitiş tarihi (opsiyonel)
 *   ?type=ALL|TX|ORDER|INVOICE
 *   ?page=1&limit=50
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const { searchParams } = new URL(request.url);

    const from    = searchParams.get("from");
    const to      = searchParams.get("to");
    const type    = searchParams.get("type") || "ALL";
    const page    = Math.max(1, Number(searchParams.get("page") || 1));
    const limit   = Math.min(200, Math.max(10, Number(searchParams.get("limit") || 50)));
    const skip    = (page - 1) * limit;

    // Tarih filtresi
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to)   dateFilter.lte = new Date(to + "T23:59:59Z");

    // ── Cari hesap bilgisi ────────────────────────────────────────
    const account = await prisma.currentAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true, name: true, cariKod: true, balance: true,
        currency: true, openingBalance: true,
      }
    });

    if (!account) {
      return NextResponse.json({ error: "Cari hesap bulunamadı." }, { status: 404 });
    }

    // ── Transaction hareketleri ───────────────────────────────────
    let transactions: any[] = [];
    if (type === "ALL" || type === "TX") {
      transactions = await prisma.transaction.findMany({
        where: {
          currentAccountId: accountId,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        orderBy: { date: "desc" },
      });
    }

    // ── Sipariş hareketleri ───────────────────────────────────────
    let orders: any[] = [];
    if (type === "ALL" || type === "ORDER") {
      orders = await prisma.order.findMany({
        where: {
          currentAccountId: accountId,
          isDeleted: false,
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        orderBy: { date: "desc" },
      });
    }

    // ── Fatura hareketleri ────────────────────────────────────────
    let invoices: any[] = [];
    if (type === "ALL" || type === "INVOICE") {
      invoices = await prisma.invoice.findMany({
        where: {
          currentAccountId: accountId,
          isDeleted: false,
          status: { not: "TASLAK" },
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        orderBy: { date: "desc" },
      });
    }

    // ── Birleştir ve normalize et ─────────────────────────────────
    const allRows: any[] = [
      ...transactions.map((t) => ({
        id:          t.id,
        source:      "TX",
        date:        t.date,
        type:        t.type,
        description: t.description,
        amount:      Number(t.amount),
        debit:       Number(t.amount) > 0 ? Number(t.amount)  : 0,
        credit:      Number(t.amount) < 0 ? -Number(t.amount) : 0,
        paymentMethod: t.paymentMethod,
        referenceId: null,
      })),
      ...orders.map((o) => ({
        id:          o.id,
        source:      "ORDER",
        date:        o.date,
        type:        "SATIS",
        description: `Sipariş #${o.id} — ${o.summary || "Satış"}`,
        amount:      Number(o.total),
        debit:       Number(o.total),
        credit:      0,
        paymentMethod: o.method || "-",
        referenceId: o.id,
        status:      o.status,
      })),
      ...invoices.map((inv) => ({
        id:          inv.id,
        source:      "INVOICE",
        date:        inv.date,
        type:        inv.type,
        description: `Fatura — ${inv.notes || inv.type}`,
        amount:      inv.type === "SATIS" ? Number(inv.totalAmount) : -Number(inv.totalAmount),
        debit:       inv.type === "SATIS" ? Number(inv.totalAmount) : 0,
        credit:      inv.type !== "SATIS" ? Number(inv.totalAmount) : 0,
        paymentMethod: "-",
        referenceId: inv.orderId,
        status:      inv.status,
      })),
    ];

    // Tarihe göre sırala (en yeni en üste)
    allRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Kümülatif bakiye hesapla (en eskiden en yeniye)
    const withBalance = [...allRows].reverse().reduce<any[]>((acc, row) => {
      const prevBalance = acc.length > 0 ? acc[acc.length - 1].runningBalance : Number(account.openingBalance);
      acc.push({ ...row, runningBalance: prevBalance + row.amount });
      return acc;
    }, []).reverse();

    // Sayfalama
    const total     = withBalance.length;
    const paginated = withBalance.slice(skip, skip + limit);

    // Özet
    const totalDebit  = allRows.reduce((s, r) => s + r.debit,  0);
    const totalCredit = allRows.reduce((s, r) => s + r.credit, 0);

    return NextResponse.json({
      account: {
        ...account,
        balance: Number(account.balance),
      },
      summary: {
        totalDebit:    Number(totalDebit.toFixed(2)),
        totalCredit:   Number(totalCredit.toFixed(2)),
        netBalance:    Number((totalDebit - totalCredit).toFixed(2)),
        currentBalance: Number(account.balance),
        openingBalance: Number(account.openingBalance),
        rowCount:       total,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      rows: paginated,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error("Ekstre API error:", error);
    return NextResponse.json(
      { error: error.message || "Ekstre verileri alınamadı." },
      { status: 500 }
    );
  }
}
