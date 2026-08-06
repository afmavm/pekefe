import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { getCariAccountByEmail } from "@/lib/b2b-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const account = await getCariAccountByEmail(session.user.email);
    if (!account) {
      return NextResponse.json({ error: "Cari hesap bulunamadı" }, { status: 404 });
    }

    // Vadesi geçen faturaları sorgula
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        currentAccountId: account.id,
        status: { notIn: ["ODENDI", "IPTAL"] },
        type: { not: "ALIS" },
        dueDate: { lt: new Date() }
      }
    });

    const overdueDebt = unpaidInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount.toNumber(),
      0
    );

    return NextResponse.json({
      success: true,
      id: account.id,
      name: account.name,
      email: account.email,
      balance: account.balance.toNumber(),
      creditLimit: account.creditLimit ? account.creditLimit.toNumber() : 0,
      riskLimit: account.riskLimit ? account.riskLimit.toNumber() : 0,
      blokeDurumu: account.blokeDurumu,
      overdueDebt
    });
  } catch (error) {
    console.error("Error fetching B2B limits:", error);
    return NextResponse.json(
      { error: "Limit sorgulanırken hata oluştu" },
      { status: 500 }
    );
  }
}
