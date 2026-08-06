import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const expense = await prisma.expense.findUnique({ where: { id: resolvedParams.id } });
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const expense = await prisma.expense.update({
      where: { id: resolvedParams.id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        category: data.category,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        taxAmount: data.taxAmount !== undefined ? Number(data.taxAmount) : undefined,
        description: data.description,
        supplier: data.supplier,
        receiptNo: data.receiptNo,
        paymentMethod: data.paymentMethod,
        status: data.status,
      },
    });
    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.expense.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
