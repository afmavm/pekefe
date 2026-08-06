import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

function generateJournalNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `FIS-${year}-${rand}`;
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const entries = await prisma.journalEntry.findMany({
    where: {
      ...(status && { status }),
      ...(type && { type }),
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    },
    include: {
      lines: {
        include: {
          debitAccount: true,
          creditAccount: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const { lines, ...entryData } = body;

  // Borç-alacak dengesi ve hesap validasyonları
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Fiş satırları boş olamaz." }, { status: 400 });
  }

  for (const line of lines) {
    if (!line.debitAccountId || !line.creditAccountId) {
      return NextResponse.json({ error: "Borç ve alacak hesapları seçilmelidir." }, { status: 400 });
    }
    if (line.debitAccountId === line.creditAccountId) {
      return NextResponse.json({ error: "Borç ve alacak hesabı aynı olamaz." }, { status: 400 });
    }
    if (Number(line.amount) <= 0) {
      return NextResponse.json({ error: "İşlem tutarı sıfırdan büyük olmalıdır." }, { status: 400 });
    }
  }

  const entry = await prisma.journalEntry.create({
    data: {
      ...entryData,
      number: generateJournalNumber(),
      lines: { create: lines },
    },
    include: { lines: { include: { debitAccount: true, creditAccount: true } } },
  });
  return NextResponse.json(entry);
}
