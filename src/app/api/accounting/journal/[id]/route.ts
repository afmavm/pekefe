import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const entry = await prisma.journalEntry.findUnique({
      where: { id: resolvedParams.id },
      include: {
        lines: { include: { debitAccount: true, creditAccount: true } },
      },
    });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const entry = await prisma.journalEntry.update({
      where: { id: resolvedParams.id },
      data: {
        status: data.status,
        description: data.description,
        type: data.type,
      },
      include: {
        lines: { include: { debitAccount: true, creditAccount: true } },
      },
    });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    // Delete lines first (cascade should handle it, but be safe)
    await prisma.journalLine.deleteMany({ where: { journalEntryId: resolvedParams.id } });
    await prisma.journalEntry.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
