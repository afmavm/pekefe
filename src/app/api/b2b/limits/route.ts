import { NextRequest, NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { getCariAccountByEmail } from "@/lib/b2b-helpers";
import { readLocalAccounts } from "@/lib/jsonCurrentAccountsDb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: true, isB2B: false }, { status: 200 });
    }

    const email = session.user.email.trim().toLowerCase();
    const role = String((session.user as any)?.role || "").toUpperCase();
    const sessionCustomerType = String((session.user as any)?.customer_type || "").toLowerCase();

    let isB2B = role === "DEALER" || (sessionCustomerType === "b2b" && role !== "ADMIN" && role !== "SUPER_ADMIN");
    let account: any = null;

    try {
      const dbUser = await withTimeout(
        prisma.user.findUnique({
          where: { email },
          select: { role: true, customer_type: true, isApproved: true },
        }),
        1200,
        null
      );
      if (dbUser) {
        if (dbUser.role === "DEALER" && dbUser.isApproved !== false) isB2B = true;
        if (dbUser.customer_type === "b2b" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") {
          isB2B = true;
        }
      }

      account = await withTimeout(getCariAccountByEmail(email), 1500, null);
    } catch {}

    // Yerel cari hesap fallback
    if (!account) {
      try {
        const localAccounts = readLocalAccounts();
        account = localAccounts.find((a: any) => {
          const e1 = String(a?.email || "").trim().toLowerCase();
          const e2 = String(a?.entegrasyonHaritalama?.b2bEmail || "").trim().toLowerCase();
          return e1 === email || e2 === email;
        }) || null;
      } catch {}
    }

    if (account) {
      const accType = String(account.type || "").toUpperCase();
      const cariTipi = String(account.cariTipi || "").toUpperCase();
      const dealerGroup = String(account.dealerGroup || "").trim();
      const isAccountB2B =
        accType === "BAYI" ||
        accType === "BAYİ" ||
        accType === "B2B" ||
        cariTipi === "CORPORATE" ||
        (Boolean(dealerGroup) && dealerGroup.toLowerCase() !== "standart");

      if (isAccountB2B && !account.blokeDurumu) {
        isB2B = true;
      }
      if (account.blokeDurumu) {
        isB2B = false;
      }
    }

    if (!account) {
      return NextResponse.json({
        success: true,
        isB2B,
        balance: 0,
        creditLimit: 0,
        riskLimit: 0,
        blokeDurumu: false,
        overdueDebt: 0,
      });
    }

    // Vadesi geçen faturaları sorgula
    let overdueDebt = 0;
    try {
      const unpaidInvoices = await withTimeout(
        prisma.invoice.findMany({
          where: {
            currentAccountId: account.id,
            status: { notIn: ["ODENDI", "IPTAL"] },
            type: { not: "ALIS" },
            dueDate: { lt: new Date() },
          },
        }),
        1200,
        []
      );
      overdueDebt = unpaidInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.totalAmount?.toNumber?.() ?? inv.totalAmount ?? 0),
        0
      );
    } catch {}

    return NextResponse.json({
      success: true,
      isB2B,
      id: account.id,
      name: account.name,
      email: account.email,
      balance: Number(account.balance?.toNumber?.() ?? account.balance ?? 0),
      creditLimit: Number(account.creditLimit?.toNumber?.() ?? account.creditLimit ?? 0),
      riskLimit: Number(account.riskLimit?.toNumber?.() ?? account.riskLimit ?? 0),
      blokeDurumu: Boolean(account.blokeDurumu),
      overdueDebt,
    });
  } catch (error) {
    console.error("Error fetching B2B limits:", error);
    return NextResponse.json(
      { success: false, isB2B: false, error: "Limit sorgulanırken hata oluştu" },
      { status: 500 }
    );
  }
}
