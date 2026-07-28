import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const tax = await prisma.taxDeclaration.findUnique({ where: { id: resolvedParams.id } });
    if (!tax) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tax);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const tax = await prisma.taxDeclaration.update({
      where: { id: resolvedParams.id },
      data: {
        period: data.period,
        type: data.type,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        taxBase: data.taxBase !== undefined ? (data.taxBase ? Number(data.taxBase) : null) : undefined,
        taxRate: data.taxRate !== undefined ? (data.taxRate ? Number(data.taxRate) : null) : undefined,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidDate: data.paidDate !== undefined ? (data.paidDate ? new Date(data.paidDate) : null) : undefined,
        notes: data.notes,
      },
    });
    return NextResponse.json(tax);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.taxDeclaration.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
