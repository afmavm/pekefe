import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const accounts = await prisma.accountingAccount.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const account = await prisma.accountingAccount.create({ data: body });
  return NextResponse.json(account);
}
