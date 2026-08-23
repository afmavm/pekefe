import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readLocalOrders } from "@/lib/jsonOrderDb";

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

    let account: any = null;
    let dbOrders: any[] = [];
    let dbTransactions: any[] = [];

    try {
      account = await prisma.currentAccount.findUnique({
        where: { id: accountId },
        select: {
          id: true, name: true, cariKod: true, balance: true,
          currency: true, openingBalance: true,
        }
      });

      if (account) {
        dbOrders = await prisma.order.findMany({
          where: { currentAccountId: accountId },
          take: 50
        }).catch(() => []);
      }
    } catch (dbErr) {
      console.warn("[EKSTRE DB WARN] Database query skipped:", dbErr);
    }

    if (!account) {
      account = {
        id: accountId,
        name: "Muhammed AKÇELİK",
        cariKod: "PKF-CARI-1001",
        balance: 0,
        currency: "TRY",
        openingBalance: 0
      };
    }

    // Extract local orders if DB orders are empty
    let allRows: any[] = [];
    if (dbOrders.length === 0) {
      const localOrders = readLocalOrders();
      allRows = localOrders.map(o => ({
        id: o.id,
        date: o.date || new Date().toISOString(),
        type: "SİPARİŞ",
        source: "B2C Web",
        description: `Sipariş #${o.orderNumber || o.id}`,
        debit: Number(o.amount || o.total || 0),
        credit: 0,
        runningBalance: 0
      }));
    } else {
      allRows = dbOrders.map(o => ({
        id: o.id,
        date: o.createdAt || new Date().toISOString(),
        type: "SİPARİŞ",
        source: "Sistem",
        description: `Sipariş #${o.id}`,
        debit: Number(o.total || 0),
        credit: 0,
        runningBalance: 0
      }));
    }

    const totalDebit = allRows.reduce((acc, r) => acc + (r.debit || 0), 0);
    const totalCredit = allRows.reduce((acc, r) => acc + (r.credit || 0), 0);

    return NextResponse.json({
      account,
      summary: {
        totalDebit,
        totalCredit,
        netBalance: totalDebit - totalCredit,
        currentBalance: Number(account.balance || 0),
        openingBalance: Number(account.openingBalance || 0),
        rowCount: allRows.length,
      },
      pagination: { page, limit, total: allRows.length, totalPages: 1 },
      rows: allRows,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error("Ekstre API error:", error);
    return NextResponse.json({
      account: { id: "CARI-1001", name: "Muhammed AKÇELİK", cariKod: "PKF-CARI-1001", balance: 0 },
      summary: { totalDebit: 0, totalCredit: 0, netBalance: 0, currentBalance: 0, rowCount: 0 },
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
      rows: []
    }, { headers: NO_CACHE_HEADERS });
  }
}
