import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { fromBankId, toBankId, amount, description } = data;
    
    if (fromBankId === toBankId) return NextResponse.json({ error: "Aynı hesap seçilemez" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const fromBank = await tx.bank.update({
        where: { id: fromBankId },
        data: { balance: { decrement: Number(amount) } }
      });
      const toBank = await tx.bank.update({
        where: { id: toBankId },
        data: { balance: { increment: Number(amount) } }
      });
      return { fromBank, toBank };
    }, { maxWait: 10000, timeout: 30000 });
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}
