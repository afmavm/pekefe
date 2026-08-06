import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const bank = await prisma.bank.findUnique({
      where: { id: resolvedParams.id },
    });
    // In a real scenario you would fetch related transactions here from Transaction model
    // Assuming transactions are mapped generically, or we can just return the bank
    return NextResponse.json(bank);
  } catch (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const bank = await prisma.bank.update({
      where: { id: resolvedParams.id },
      data: {
        name: data.name,
        accountNumber: data.accountNumber,
        iban: data.iban,
        currency: data.currency,
        branch: data.branch,
        type: data.type
      }
    });
    return NextResponse.json(bank);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.bank.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
