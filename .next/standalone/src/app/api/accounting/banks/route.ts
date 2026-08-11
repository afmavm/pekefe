import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api-handler";
import { z } from "zod";

// 1. Zod Şeması: Gelen verinin KESİN kurallarını belirliyoruz
const createBankSchema = z.object({
  name: z.string().min(2, "Banka adı en az 2 karakter olmalıdır"),
  accountNumber: z.string().default(""),
  iban: z.string().startsWith("TR", "IBAN TR ile başlamalıdır").or(z.literal("")).default(""),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  balance: z.coerce.number().default(0), // Gelen string "100" değerini güvenli bir şekilde sayıya çevirir
  branch: z.string().optional(),
  type: z.enum(["VADESIZ", "VADELI", "KREDI"]).default("VADESIZ")
});

export async function GET(request: Request) {
  return apiHandler(request, "GET /api/accounting/banks", async () => {
    const banks = await prisma.bank.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ success: true, data: banks });
  });
}

export async function POST(request: Request) {
  return apiHandler(request, "POST /api/accounting/banks", async () => {
    // 2. İsteği al ve doğrula (Hatalıysa catch bloğuna düşer ve 400 döner)
    const rawData = await request.json();
    const validatedData = createBankSchema.parse(rawData);

    // 3. Sadece doğrulanmış temiz (validatedData) veriyi veritabanına yaz
    const bank = await prisma.bank.create({
      data: validatedData
    });

    return NextResponse.json({ success: true, data: bank }, { status: 201 });
  });
}
