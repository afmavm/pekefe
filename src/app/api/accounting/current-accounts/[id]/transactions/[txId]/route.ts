import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

const CREDIT_KEYWORDS = [
  "TAHSILAT",
  "TAHSİLAT",
  "ALIS",
  "ALIŞ",
  "IADE",
  "İADE",
  "IPTAL",
  "İPTAL",
  "ALACAK_DEVIR",
  "ALACAK",
];

const normalizeOrdKey = (val: string) =>
  String(val || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

async function recalcAndPersistAccountBalance(accountId: string) {
  const account = await prisma.currentAccount.findUnique({
    where: { id: accountId },
    select: { id: true, openingBalance: true },
  });
  if (!account) return 0;

  const [txs, orders, invoices] = await Promise.all([
    prisma.transaction.findMany({
      where: { currentAccountId: accountId },
      select: { type: true, amount: true, description: true },
    }),
    prisma.order.findMany({
      where: { currentAccountId: accountId, isDeleted: false },
      select: { id: true, total: true },
    }),
    prisma.invoice.findMany({
      where: { currentAccountId: accountId, isDeleted: false },
      select: { type: true, totalAmount: true },
    }),
  ]);

  const processedOrderIds = new Set<string>();
  let totalDebit = 0;
  let totalCredit = 0;

  for (const tx of txs) {
    const tUp = String(tx.type || "").toUpperCase();
    const isCredit = CREDIT_KEYWORDS.some((k) => tUp.includes(k));
    const amt = Math.abs(Number(tx.amount || 0));
    if (isCredit) {
      totalCredit += amt;
    } else {
      totalDebit += amt;
      const match = tx.description?.match(
        /(PKF-?[A-Z0-9-]+|B2B-?[A-Z0-9-]+|ORD-?[A-Z0-9-]+)/i
      );
      if (match) processedOrderIds.add(normalizeOrdKey(match[1]));
    }
  }

  for (const inv of invoices) {
    const iUp = String(inv.type || "").toUpperCase();
    const amt = Math.abs(Number(inv.totalAmount || 0));
    if (iUp.includes("ALIS")) totalCredit += amt;
    else totalDebit += amt;
  }

  for (const o of orders) {
    if (processedOrderIds.has(normalizeOrdKey(o.id))) continue;
    totalDebit += Number(o.total || 0);
  }

  const netBalance = Number(
    (Number(account.openingBalance || 0) + totalDebit - totalCredit).toFixed(2)
  );

  await prisma.currentAccount.update({
    where: { id: accountId },
    data: { balance: netBalance },
  });

  return netBalance;
}

async function ensureAdminSession() {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || "").toUpperCase();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "MUHASEBE", "ACCOUNTANT", "MANAGER"].includes(role)) {
    return null;
  }
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    const session = await ensureAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id: accountId, txId } = await params;
    const body = await request.json();

    const existing = await prisma.transaction.findFirst({
      where: { id: txId, currentAccountId: accountId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Hareket kaydı bulunamadı." },
        { status: 404 }
      );
    }

    const amount = Math.abs(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Geçerli ve sıfırdan büyük bir tutar girin." },
        { status: 400 }
      );
    }

    const nextType = String(body.type || existing.type || "TAHSILAT").trim();
    const nextDescription = String(
      body.description !== undefined ? body.description : existing.description
    ).trim();
    const nextPaymentMethod =
      body.paymentMethod !== undefined
        ? String(body.paymentMethod || "").trim() || null
        : existing.paymentMethod;

    let nextDate = existing.date;
    if (body.date) {
      const parsed = new Date(body.date);
      if (!isNaN(parsed.getTime())) nextDate = parsed;
    }

    const updated = await prisma.transaction.update({
      where: { id: txId },
      data: {
        type: nextType,
        amount,
        description: nextDescription || nextType,
        paymentMethod: nextPaymentMethod,
        date: nextDate,
      },
    });

    const newBalance = await recalcAndPersistAccountBalance(accountId);

    return NextResponse.json({
      success: true,
      transaction: updated,
      newBalance,
    });
  } catch (error: any) {
    console.error("[TX UPDATE ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Hareket güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    const session = await ensureAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id: accountId, txId } = await params;

    const existing = await prisma.transaction.findFirst({
      where: { id: txId, currentAccountId: accountId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Hareket kaydı bulunamadı." },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id: txId },
    });

    const newBalance = await recalcAndPersistAccountBalance(accountId);

    return NextResponse.json({
      success: true,
      deletedId: txId,
      newBalance,
    });
  } catch (error: any) {
    console.error("[TX DELETE ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Hareket silinemedi." },
      { status: 500 }
    );
  }
}
