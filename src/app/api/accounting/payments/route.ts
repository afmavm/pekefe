import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type") || "ALL";

    const transactions = await prisma.transaction.findMany({
      include: { currentAccount: true },
      orderBy: { date: "desc" },
    });

    const payments = transactions
      .map((t) => {
        let mappedType = "TAHSILAT";
        const dbTypeUpper = t.type.toUpperCase();

        if (
          dbTypeUpper.includes("TAHSILAT") ||
          dbTypeUpper.includes("TAHSİLAT") ||
          dbTypeUpper.includes("RECEIPT") ||
          dbTypeUpper.includes("GELIR")
        ) {
          mappedType = "TAHSILAT";
        } else if (
          dbTypeUpper.includes("ODEME") ||
          dbTypeUpper.includes("ÖDEME") ||
          dbTypeUpper.includes("PAYMENT") ||
          dbTypeUpper.includes("GIDER")
        ) {
          mappedType = "ODEME";
        } else if (
          dbTypeUpper.includes("IADE") ||
          dbTypeUpper.includes("İADE") ||
          dbTypeUpper.includes("REFUND")
        ) {
          mappedType = "IADE";
        } else {
          mappedType = t.amount.toNumber() >= 0 ? "TAHSILAT" : "ODEME";
        }

        return {
          id: t.id,
          currentAccount: t.currentAccount ? { name: t.currentAccount.name } : undefined,
          amount: Math.abs(t.amount.toNumber()),
          type: mappedType,
          method: t.paymentMethod || "NAKIT",
          status: "TAMAMLANDI",
          date: t.date.toISOString(),
          description: t.description,
        };
      })
      .filter((p) => typeParam === "ALL" || p.type === typeParam);

    return NextResponse.json(payments, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { currentAccountId, type, method, amount, description, date } = body;

    if (!currentAccountId || !type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "currentAccountId, type ve amount zorunludur" },
        { status: 400 }
      );
    }

    const account = await prisma.currentAccount.findUnique({
      where: { id: currentAccountId },
    });
    if (!account) {
      return NextResponse.json({ error: "Cari hesap bulunamadı" }, { status: 404 });
    }

    // In Cari accounting logic:
    // ODEME (Outgoing payment to supplier/customer) -> balance increases -> positive amount
    // TAHSILAT (Incoming collection from customer) -> balance decreases -> negative amount
    // IADE (Refund / return) -> typically reduces customer balance -> negative amount
    const typeUpper = type.toUpperCase();
    const isOutgoing =
      typeUpper.includes("ODEME") ||
      typeUpper.includes("ÖDEME") ||
      typeUpper.includes("PAYMENT");
    const balanceChange = isOutgoing ? Math.abs(amount) : -Math.abs(amount);

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create Transaction record
      const t = await tx.transaction.create({
        data: {
          currentAccountId,
          type,
          paymentMethod: method || "NAKIT",
          amount: balanceChange,
          description: description || "",
          date: date ? new Date(date) : new Date(),
        },
        include: { currentAccount: true },
      });

      // 2. Update CurrentAccount balance in database
      await tx.currentAccount.update({
        where: { id: currentAccountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      return t;
    }, { maxWait: 10000, timeout: 30000 });

    const mappedType =
      typeUpper.includes("IADE") ||
      typeUpper.includes("İADE") ||
      typeUpper.includes("REFUND")
        ? "IADE"
        : isOutgoing ? "ODEME" : "TAHSILAT";

    return NextResponse.json(
      {
        id: transaction.id,
        currentAccount: transaction.currentAccount
          ? { name: transaction.currentAccount.name }
          : undefined,
        amount: Math.abs(transaction.amount.toNumber()),
        type: mappedType,
        method: transaction.paymentMethod || "NAKIT",
        status: "TAMAMLANDI",
        date: transaction.date.toISOString(),
        description: transaction.description,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("payments POST error:", error);
    return NextResponse.json(
      { error: error.message || "İşlem kaydedilemedi" },
      { status: 500 }
    );
  }
}
