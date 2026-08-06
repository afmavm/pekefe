import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const item = await prisma.budgetItem.findUnique({ where: { id: resolvedParams.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const item = await prisma.budgetItem.update({
      where: { id: resolvedParams.id },
      data: {
        year: data.year !== undefined ? Number(data.year) : undefined,
        month: data.month !== undefined ? Number(data.month) : undefined,
        category: data.category,
        planned: data.planned !== undefined ? Number(data.planned) : undefined,
        actual: data.actual !== undefined ? Number(data.actual) : undefined,
        notes: data.notes,
      },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.budgetItem.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
