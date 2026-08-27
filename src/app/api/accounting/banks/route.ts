import { NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { z } from "zod";
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
  return [
    {
      id: "bank-ziraat-1",
      name: "Ziraat Bankası",
      accountNumber: "12345678",
      iban: "TR120001000123456789012345",
      currency: "TRY",
      balance: 0,
      branch: "İspir Şubesi",
      type: "VADESIZ"
    }
  ];
}

function saveLocalBanks(banks: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(BANKS_FILE, JSON.stringify(banks, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving local banks:", err);
  }
}

const createBankSchema = z.object({
  name: z.string().min(2, "Banka adı en az 2 karakter olmalıdır"),
  accountNumber: z.string().optional().default(""),
  iban: z.string().optional().default("").transform(v => (v || "").replace(/\s+/g, "").toUpperCase()),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]).default("TRY"),
  balance: z.coerce.number().default(0),
  branch: z.string().optional().default(""),
  type: z.enum(["VADESIZ", "VADELI", "KREDI", "DIGER"]).default("VADESIZ"),
  logo: z.string().optional().default("")
});

export async function GET() {
  try {
    const banks = await withTimeout(prisma.bank.findMany({ orderBy: { name: "asc" } }), 3000);
    if (Array.isArray(banks) && banks.length > 0) {
      saveLocalBanks(banks);
      return NextResponse.json({ success: true, data: banks });
    }
  } catch (err) {
    console.warn("Prisma banks unreachable, using local JSON fallback");
  }
  const localBanks = getLocalBanks();
  return NextResponse.json({ success: true, data: localBanks });
}

export async function POST(request: Request) {
  try {
    const rawData = await request.json();
    const validatedData = createBankSchema.parse(rawData);

    let createdBank: any = null;

    try {
      createdBank = await withTimeout(
        prisma.bank.create({
          data: validatedData
        }),
        3000
      );
    } catch (dbErr) {
      console.warn("DB write failed for bank, using local fallback:", dbErr);
    }

    if (!createdBank) {
      createdBank = {
        id: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ...validatedData,
        createdAt: new Date().toISOString()
      };
    }

    // Local JSON update with duplicate IBAN prevention
    const currentBanks = getLocalBanks();
    const existingIndex = currentBanks.findIndex(
      b => b.id === createdBank.id || (createdBank.iban && b.iban === createdBank.iban)
    );
    if (existingIndex >= 0) {
      currentBanks[existingIndex] = { ...currentBanks[existingIndex], ...createdBank };
      createdBank = currentBanks[existingIndex];
    } else {
      currentBanks.push(createdBank);
    }
    saveLocalBanks(currentBanks);

    return NextResponse.json({ success: true, data: createdBank }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bank:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors.map(e => e.message).join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || "Banka hesabı kaydedilemedi." },
      { status: 500 }
    );
  }
}

