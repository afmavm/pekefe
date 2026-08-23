import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readLocalOrders } from "@/lib/jsonOrderDb";

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

  try {
    let accounts: any[] = [];

    try {
      accounts = await prisma.currentAccount.findMany({
        where: {
          AND: [
            type !== "ALL" ? { type } : {},
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
    } catch (dbErr) {
      console.warn("[CURRENT ACCOUNTS DB WARN] Database query failed, falling back to dynamic order-based current accounts:", dbErr);
    }

    // Fail-Safe / Auto-Seed: If database has no accounts or query failed, extract accounts from actual orders & seed defaults
    if (!accounts || accounts.length === 0) {
      const localOrders = readLocalOrders();
      const extractedAccountsMap = new Map<string, any>();

      // Extract unique customers from actual orders
      localOrders.forEach((o, index) => {
        const clientName = o.client || o.customerName || "Müşteri";
        const email = o.email || `musteri_${index + 1}@pekefe.com`;
        const phone = o.phone || "05XX XXX XX XX";
        const key = email.toLowerCase().trim() || clientName.toLowerCase().trim();

        if (!extractedAccountsMap.has(key)) {
          extractedAccountsMap.set(key, {
            id: o.currentAccountId || `CARI-${index + 1001}`,
            cariKod: `PKF-CARI-${String(index + 1001).padStart(4, '0')}`,
            name: clientName,
            type: o.type === "B2B" ? "BAYI" : "MUSTERI",
            cariTipi: "INDIVIDUAL",
            phone: phone,
            email: email,
            address: o.address || "Belirtilmemiş",
            balance: 0,
            currency: "TRY",
            openingBalance: 0,
            isActive: true,
            dealerGroup: o.type === "B2B" ? "B2B Bayi" : "Perakende",
            priceGroup: "Liste",
            kaynakPlatform: o.type === "B2B" ? "PEKEFE_B2B" : "PEKEFE_B2C",
            createdAt: o.date || o.createdAt || new Date().toISOString()
          });
        }
      });

      // Always guarantee at least default business accounts exist
      if (extractedAccountsMap.size === 0) {
        extractedAccountsMap.set("pekefe_ana_bayi", {
          id: "CARI-0001",
          cariKod: "PKF-CARI-0001",
          name: "Muhammed Akçelik (Ana Bayi)",
          email: "muhammed@pekefe.com",
          phone: "0544 149 48 51",
          type: "BAYI",
          cariTipi: "CORPORATE",
          kaynakPlatform: "PEKEFE_B2B",
          balance: 0,
          currency: "TRY",
          openingBalance: 0,
          isActive: true,
          dealerGroup: "VIP Bayi",
          priceGroup: "Toptan Liste",
          createdAt: new Date().toISOString()
        });
      }

      accounts = Array.from(extractedAccountsMap.values());

      // Attempt to save extracted accounts to database for permanent consistency
      try {
        for (const acc of accounts) {
          await prisma.currentAccount.upsert({
            where: { id: acc.id },
            update: {},
            create: {
              id: acc.id,
              cariKod: acc.cariKod,
              name: acc.name,
              email: acc.email,
              phone: acc.phone,
              address: acc.address,
              type: acc.type,
              cariTipi: acc.cariTipi,
              kaynakPlatform: acc.kaynakPlatform,
              balance: 0,
              openingBalance: 0
            }
          }).catch(() => null);
        }
      } catch {}
    }

    // Filter by search term if search query is provided
    if (search) {
      const q = search.toLowerCase();
      accounts = accounts.filter(a =>
        String(a.name || "").toLowerCase().includes(q) ||
        String(a.email || "").toLowerCase().includes(q) ||
        String(a.phone || "").toLowerCase().includes(q) ||
        String(a.cariKod || "").toLowerCase().includes(q)
      );
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
    
    const count = await prisma.currentAccount.count().catch(() => 0);
    const generatedCariKod = data.cariKod || `PEKEFE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newAccountData = {
      id: `CARI-${Date.now()}`,
      cariKod: generatedCariKod,
      name: data.name,
      type: data.type || "MUSTERI",
      cariTipi: data.cariTipi || "CORPORATE",
      ad: data.ad || null,
      soyad: data.soyad || null,
      tckn: data.tckn || null,
      taxNo: data.taxNo || null,
      taxOffice: data.taxOffice || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      currency: data.currency || "TRY",
      openingBalance: Number(data.openingBalance) || 0,
      balance: Number(data.openingBalance) || 0,
      dealerGroup: data.dealerGroup || "Standart",
      priceGroup: data.priceGroup || "Liste",
      kaynakPlatform: data.kaynakPlatform || "PEKEFE_B2B",
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      const account = await prisma.currentAccount.create({ data: newAccountData });
      return NextResponse.json(account);
    } catch {
      return NextResponse.json(newAccountData);
    }
  } catch (error: any) {
    console.error("Failed to create account:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
