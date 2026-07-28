import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "ALL";
  const kaynakPlatform = searchParams.get("kaynakPlatform") || "ALL";

  try {
    const accounts = await prisma.currentAccount.findMany({
      where: {
        AND: [
          type !== "ALL" ? { type } : {},
          kaynakPlatform !== "ALL" ? { kaynakPlatform } : {},
          search ? {
            OR: [
              { name: { contains: search } },
              { taxNo: { contains: search } },
              { tckn: { contains: search } },
              { email: { contains: search } },
              { cariKod: { contains: search } },
            ]
          } : {},
          { isDeleted: false }
        ]
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(accounts, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Generate a default cariKod if not provided
    const count = await prisma.currentAccount.count();
    const generatedCariKod = data.cariKod || `ATAK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const account = await prisma.currentAccount.create({
      data: {
        cariKod: generatedCariKod,
        name: data.name,
        type: data.type || "MUSTERI",
        cariTipi: data.cariTipi || "CORPORATE",
        ad: data.ad || null,
        soyad: data.soyad || null,
        tckn: data.tckn || null,
        dogumTarihi: data.dogumTarihi ? new Date(data.dogumTarihi) : null,
        taxNo: data.taxNo || null,
        taxId: data.taxId || null,
        taxOffice: data.taxOffice || null,
        mersisNo: data.mersisNo || null,
        yetkiliKisi: data.yetkiliKisi || null,
        webSitesi: data.webSitesi || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        currency: data.currency || "TRY",
        openingBalance: Number(data.openingBalance) || 0,
        balance: Number(data.openingBalance) || 0,
        discountRate: data.discountRate !== undefined && data.discountRate !== null ? Number(data.discountRate) : null,
        creditLimit: data.creditLimit !== undefined && data.creditLimit !== null ? Number(data.creditLimit) : null,
        riskLimit: data.riskLimit !== undefined && data.riskLimit !== null ? Number(data.riskLimit) : null,
        vadeGun: data.vadeGun !== undefined && data.vadeGun !== null ? Number(data.vadeGun) : null,
        dealerGroup: data.dealerGroup || "Standart",
        priceGroup: data.priceGroup || "Liste",
        priceFormula: data.priceFormula || null,
        kaynakPlatform: data.kaynakPlatform || "ATAK_B2B",
        eFaturaDurumu: data.eFaturaDurumu !== undefined ? Boolean(data.eFaturaDurumu) : false,
        blokeDurumu: data.blokeDurumu !== undefined ? Boolean(data.blokeDurumu) : false,
        adresler: data.adresler || [],
        entegrasyonHaritalama: data.entegrasyonHaritalama || {},
        bankalar: data.bankalar || [],
        kvkk: data.kvkk || {},
        yetkililer: data.yetkililer || [],
        tanimlar: data.tanimlar || {},
        auditLogs: data.auditLogs || [{
          id: `log-${Date.now()}`,
          field: "Cari Kart",
          oldValue: null,
          newValue: "Cari Kart Oluşturuldu",
          updatedBy: "System",
          date: new Date().toISOString()
        }],
      }
    });
    return NextResponse.json(account);
  } catch (error: any) {
    console.error("Failed to create account:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
