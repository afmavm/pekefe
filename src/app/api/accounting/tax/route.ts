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

    const declarations = await prisma.taxDeclaration.findMany({
      orderBy: { dueDate: "asc" },
    }).catch(() => []);

    return NextResponse.json(declarations);
  } catch (error) {
    console.error("Tax GET error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const declaration = await prisma.taxDeclaration.create({ data: body });
  return NextResponse.json(declaration);
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const { id, ...data } = body;
  const declaration = await prisma.taxDeclaration.update({ where: { id }, data });
  return NextResponse.json(declaration);
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
    const deleted = await prisma.taxDeclaration.delete({ where: { id } });
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Tax delete error:", error);
    return NextResponse.json({ error: "Failed to delete tax declaration" }, { status: 500 });
  }
}
