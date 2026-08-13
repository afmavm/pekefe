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
    let platformWhere: any = {};
    if (kaynakPlatform !== "ALL") {
      const normalized = kaynakPlatform.replace(/_/g, " ").toUpperCase();
      if (normalized.includes("B2B")) {
        platformWhere = {
          kaynakPlatform: { in: ["PEKEFE_B2B", "PEKEFE B2B", "B2B"] }
        };
      } else {
        platformWhere = { kaynakPlatform };
      }
    }

    let accounts = await prisma.currentAccount.findMany({
      where: {
        AND: [
          type !== "ALL" ? { type } : {},
          platformWhere,
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
    }).catch(() => []);

    // Auto-seed default current accounts from users/dealers if database is empty
    if (accounts.length === 0 && !search) {
      try {
        const users = await prisma.user.findMany({ take: 5 }).catch(() => []);
        if (users.length > 0) {
          for (const u of users) {
            const cariKod = `PKF-CARI-${String(u.id).substring(0, 6).toUpperCase()}`;
            await prisma.currentAccount.create({
              data: {
                cariKod,
                name: u.name || u.email || "B2B Bayi Müşterisi",
                email: u.email,
                type: u.role === "DEALER" ? "BAYI" : "MUSTERI",
                cariTipi: "CORPORATE",
                kaynakPlatform: "PEKEFE_B2B",
                creditLimit: 50000,
                riskLimit: 100000,
                vadeGun: 30,
                dealerGroup: u.role === "DEALER" ? "VIP Bayi" : "Standart",
                priceGroup: "Liste",
                balance: 0,
                openingBalance: 0,
              }
            }).catch(() => null);
          }
        } else {
          // Default initial business account
          await prisma.currentAccount.create({
            data: {
              cariKod: "PKF-CARI-0001",
              name: "Pekefe Ana Bayi & Kurumsal Müşteri",
              email: "bayi@pekefe.com",
              phone: "0544 149 48 51",
              type: "BAYI",
              cariTipi: "CORPORATE",
              kaynakPlatform: "PEKEFE_B2B",
              taxOffice: "Kayseri V.D.",
              taxNo: "1234567890",
              creditLimit: 100000,
              riskLimit: 250000,
              vadeGun: 30,
              dealerGroup: "VIP Bayi",
              priceGroup: "Toptan Liste",
              balance: 0,
              openingBalance: 0,
            }
          }).catch(() => null);
        }

        // Re-fetch after seeding
        accounts = await prisma.currentAccount.findMany({
          where: { isDeleted: false },
          orderBy: { name: "asc" }
        }).catch(() => []);
      } catch (seedErr) {
        console.warn("[CURRENT ACCOUNT SEED WARNING] Auto seed skipped:", seedErr);
      }
    }

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
    const generatedCariKod = data.cariKod || `PEKEFE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

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
        kaynakPlatform: data.kaynakPlatform || "PEKEFE_B2B",
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
