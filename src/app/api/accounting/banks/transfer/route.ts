import { NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const BANKS_FILE = path.join(process.cwd(), "data", "banks.json");

function ensureDataDir() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getLocalBanks(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(BANKS_FILE)) {
      const data = fs.readFileSync(BANKS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading local banks:", err);
  }
  return [];
}

function saveLocalBanks(banks: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(BANKS_FILE, JSON.stringify(banks, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving local banks:", err);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { fromBankId, toBankId, amount, description } = data;
    const numAmount = Number(amount) || 0;
    
    if (fromBankId === toBankId) return NextResponse.json({ success: false, error: "Aynı hesap seçilemez" }, { status: 400 });
    if (numAmount <= 0) return NextResponse.json({ success: false, error: "Geçersiz tutar" }, { status: 400 });

    let result: any = null;

    try {
      result = await withTimeout(
        prisma.$transaction(async (tx) => {
          const fromBank = await tx.bank.update({
            where: { id: fromBankId },
            data: { balance: { decrement: numAmount } }
          });
          const toBank = await tx.bank.update({
            where: { id: toBankId },
            data: { balance: { increment: numAmount } }
          });
          return { fromBank, toBank };
        }),
        5000
      );
    } catch (dbErr) {
      console.warn("DB transaction failed for transfer, updating local fallback:", dbErr);
    }

    // Always keep JSON fallback synced
    const currentBanks = getLocalBanks();
    const fromIdx = currentBanks.findIndex(b => b.id === fromBankId);
    const toIdx = currentBanks.findIndex(b => b.id === toBankId);

    if (fromIdx >= 0) {
      currentBanks[fromIdx].balance = (Number(currentBanks[fromIdx].balance) || 0) - numAmount;
    }
    if (toIdx >= 0) {
      currentBanks[toIdx].balance = (Number(currentBanks[toIdx].balance) || 0) + numAmount;
    }
    saveLocalBanks(currentBanks);

    return NextResponse.json({ 
      success: true, 
      data: result || {
        fromBank: currentBanks[fromIdx],
        toBank: currentBanks[toIdx],
        amount: numAmount,
        description
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Transfer başarısız" }, { status: 500 });
  }
}

