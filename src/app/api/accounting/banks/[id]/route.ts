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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    try {
      const bank = await withTimeout(
        prisma.bank.findUnique({
          where: { id }
        }),
        3000
      );
      if (bank) return NextResponse.json({ success: true, data: bank });
    } catch (err) {
      console.warn("DB findUnique failed, checking local JSON");
    }

    const localBanks = getLocalBanks();
    const found = localBanks.find(b => b.id === id);
    if (found) {
      return NextResponse.json({ success: true, data: found });
    }
    return NextResponse.json({ success: false, error: "Banka hesabı bulunamadı" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await request.json();

    const cleanIban = (data.iban || "").replace(/\s+/g, "").toUpperCase();

    const updatePayload: any = {
      name: data.name,
      accountNumber: data.accountNumber ?? "",
      iban: cleanIban,
      currency: data.currency || "TRY",
      branch: data.branch || "",
      type: data.type || "VADESIZ"
    };
    if (data.balance !== undefined) {
      updatePayload.balance = Number(data.balance) || 0;
    }

    let updatedBank: any = null;
    try {
      updatedBank = await withTimeout(
        prisma.bank.update({
          where: { id },
          data: updatePayload
        }),
        3000
      );
    } catch (err) {
      console.warn("DB bank update failed, updating local fallback:", err);
    }

    const currentBanks = getLocalBanks();
    const index = currentBanks.findIndex(b => b.id === id);
    if (index >= 0) {
      currentBanks[index] = { ...currentBanks[index], ...updatePayload };
      updatedBank = currentBanks[index];
    } else {
      updatedBank = { id, ...updatePayload };
      currentBanks.push(updatedBank);
    }
    saveLocalBanks(currentBanks);

    return NextResponse.json({ success: true, data: updatedBank });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    try {
      await withTimeout(
        prisma.bank.delete({ where: { id } }),
        3000
      );
    } catch (err) {
      console.warn("DB bank delete failed, deleting from local fallback:", err);
    }

    const currentBanks = getLocalBanks();
    const filtered = currentBanks.filter(b => b.id !== id);
    saveLocalBanks(filtered);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Silme başarısız" }, { status: 500 });
  }
}

