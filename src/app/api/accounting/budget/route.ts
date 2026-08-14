import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") ?? new Date().getFullYear().toString());
    const month = searchParams.get("month");

    const items = await prisma.budgetItem.findMany({
      where: { year, ...(month && { month: parseInt(month) }) },
      orderBy: [{ month: "asc" }, { category: "asc" }],
    }).catch(() => []);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Budget GET error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const item = await prisma.budgetItem.upsert({
    where: { year_month_category: { year: body.year, month: body.month, category: body.category } },
    update: { planned: body.planned },
    create: body,
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const deleted = await prisma.budgetItem.delete({ where: { id } });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Budget delete error:", error);
    return NextResponse.json({ error: "Failed to delete budget item" }, { status: 500 });
  }
}
