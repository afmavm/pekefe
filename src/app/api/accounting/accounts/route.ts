import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
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

    let accounts = await prisma.accountingAccount.findMany({
      orderBy: { code: "asc" },
    }).catch(() => []);

    if (accounts.length === 0) {
      const defaultAccounts = [
        { code: "100", name: "KASA HESABI", type: "VARLIK", balance: 0 },
        { code: "102", name: "BANKALAR HESABI", type: "VARLIK", balance: 0 },
        { code: "120", name: "ALICILAR HESABI (B2B)", type: "VARLIK", balance: 0 },
        { code: "320", name: "SATICILAR HESABI", type: "YUKUMLULUK", balance: 0 },
        { code: "600", name: "YURT İÇİ SATIŞLAR", type: "GELIR", balance: 0 },
        { code: "770", name: "GENEL YÖNETİM GİDERLERİ", type: "GIDER", balance: 0 },
      ];
      for (const acc of defaultAccounts) {
        await prisma.accountingAccount.create({ data: acc }).catch(() => null);
      }
      accounts = await prisma.accountingAccount.findMany({
        orderBy: { code: "asc" },
      }).catch(() => []);
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Accounts GET error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const account = await prisma.accountingAccount.create({ data: body });
  return NextResponse.json(account);
}
