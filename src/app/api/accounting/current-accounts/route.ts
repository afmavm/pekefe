import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readLocalOrders } from "@/lib/jsonOrderDb";
import { readLocalAccounts, saveLocalAccount } from "@/lib/jsonCurrentAccountsDb";

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
  const dealersOnly = searchParams.get("dealersOnly") === "true";

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
      console.warn("[CURRENT ACCOUNTS DB WARN] Database query failed, falling back to dynamic accounts:", dbErr);
    }

    // Merge persistent local accounts if any
    const localSavedAccounts = readLocalAccounts();
    const existingIds = new Set(accounts.map(a => a.id));
    const existingCodes = new Set(accounts.map(a => a.cariKod).filter(Boolean));

    localSavedAccounts.forEach(la => {
      if (!existingIds.has(la.id) && (!la.cariKod || !existingCodes.has(la.cariKod))) {
        if (!la.isDeleted) {
          if (type === "ALL" || la.type === type) {
            accounts.push(la);
            existingIds.add(la.id);
          }
        }
      }
    });

    // Fail-Safe / Auto-Seed: If database and local store have no accounts, extract accounts from actual orders & seed defaults
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

      // Attempt to save extracted accounts to database and local store
      for (const acc of accounts) {
        saveLocalAccount(acc);
        try {
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
        } catch {}
      }
    }

    // Filter by kaynakPlatform if specified
    if (kaynakPlatform && kaynakPlatform !== "ALL") {
      accounts = accounts.filter(
        (a) => String(a.kaynakPlatform || "").toUpperCase() === kaynakPlatform.toUpperCase()
      );
    }

    // In Bayi (B2B) Yönetimi mode, exclude B2C retail customers (INDIVIDUAL / Web B2C / non-dealer MUSTERI)
    if (dealersOnly) {
      accounts = accounts.filter((a) => {
        const accType = String(a.type || "").toUpperCase();
        const cariTipi = String(a.cariTipi || "").toUpperCase();
        const platform = String(a.kaynakPlatform || "").toUpperCase();
        if (accType === "TEDARIKCI") return false;
        if (accType === "BAYI") return true;
        if (cariTipi === "CORPORATE" && platform === "PEKEFE_B2B") return true;
        if (platform === "PEKEFE_B2C" || platform === "WEB_B2C") return false;
        if (accType === "MUSTERI" && cariTipi === "INDIVIDUAL") return false;
        return cariTipi === "CORPORATE";
      });
    }

    // Filter by search term if search query is provided
    if (search) {
      const q = search.toLowerCase();
      accounts = accounts.filter(a =>
        String(a.name || "").toLowerCase().includes(q) ||
        String(a.email || "").toLowerCase().includes(q) ||
        String(a.phone || "").toLowerCase().includes(q) ||
        String(a.cariKod || "").toLowerCase().includes(q) ||
        String(a.taxNo || "").toLowerCase().includes(q) ||
        String(a.tckn || "").toLowerCase().includes(q)
      );
    }

    // Auto-assign persistent cariKod & enrich missing phone/address from orders
    const allOrders = readLocalOrders();
    let maxCariNum = 1000;
    for (const a of accounts) {
      const m = String(a.cariKod || "").match(/(\d+)$/);
      if (m) maxCariNum = Math.max(maxCariNum, Number(m[1]));
    }

    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      let dirty = false;
      const patchData: any = {};

      if (!acc.cariKod || String(acc.cariKod).trim() === "") {
        maxCariNum++;
        const nextKod = `PKF-CARI-${String(maxCariNum).padStart(4, "0")}`;
        acc.cariKod = nextKod;
        patchData.cariKod = nextKod;
        dirty = true;
      }

      if (!acc.phone || !acc.address) {
        const accEmail = String(acc.email || "").trim().toLowerCase();
        const matchedOrder = allOrders.find(
          (o) =>
            o.currentAccountId === acc.id ||
            (accEmail && String(o.email || "").trim().toLowerCase() === accEmail)
        );
        if (matchedOrder) {
          if (!acc.phone && matchedOrder.phone) {
            acc.phone = matchedOrder.phone;
            patchData.phone = matchedOrder.phone;
            dirty = true;
          }
          if (!acc.address && matchedOrder.address) {
            acc.address = matchedOrder.address;
            patchData.address = matchedOrder.address;
            dirty = true;
          }
        }
      }

      if (acc.address && (!Array.isArray(acc.adresler) || acc.adresler.length === 0)) {
        acc.adresler = [
          {
            id: `addr-${acc.id}`,
            title: "Kayıtlı Adres",
            address: acc.address,
            city: "",
            district: "",
            isDefault: true,
          },
        ];
      }

      if (dirty) {
        saveLocalAccount(acc);
        prisma.currentAccount
          .update({ where: { id: acc.id }, data: patchData })
          .catch(() => null);
      }
    }

    // Sync each account's balance with actual ekstre ledger (transactions + invoices + deduplicated orders)
    try {
      const accountIds = accounts.map(a => a.id).filter(Boolean);
      if (accountIds.length > 0) {
        const [allTxs, allDbOrders, allDbInvoices] = await Promise.all([
          prisma.transaction.findMany({
            where: { currentAccountId: { in: accountIds } },
            select: { currentAccountId: true, type: true, amount: true, description: true, date: true },
          }),
          prisma.order.findMany({
            where: { currentAccountId: { in: accountIds }, isDeleted: false },
            select: { id: true, currentAccountId: true, total: true, date: true },
          }),
          prisma.invoice.findMany({
            where: { currentAccountId: { in: accountIds }, isDeleted: false },
            select: { id: true, currentAccountId: true, type: true, totalAmount: true, date: true },
          }),
        ]);

        const normalizeOrdKey = (val: string) => String(val || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        const creditKeywords = ["TAHSILAT", "TAHSİLAT", "ALIS", "ALIŞ", "IADE", "İADE", "IPTAL", "İPTAL", "ALACAK_DEVIR", "ALACAK"];

        const txByAcc = new Map<string, typeof allTxs>();
        for (const tx of allTxs) {
          const list = txByAcc.get(tx.currentAccountId) || [];
          list.push(tx);
          txByAcc.set(tx.currentAccountId, list);
        }
        const ordByAcc = new Map<string, typeof allDbOrders>();
        for (const o of allDbOrders) {
          if (!o.currentAccountId) continue;
          const list = ordByAcc.get(o.currentAccountId) || [];
          list.push(o);
          ordByAcc.set(o.currentAccountId, list);
        }
        const invByAcc = new Map<string, typeof allDbInvoices>();
        for (const inv of allDbInvoices) {
          if (!inv.currentAccountId) continue;
          const list = invByAcc.get(inv.currentAccountId) || [];
          list.push(inv);
          invByAcc.set(inv.currentAccountId, list);
        }

        for (const acc of accounts) {
          const createdAtMs = acc.createdAt ? new Date(acc.createdAt).getTime() : 0;
          const minRegMs = createdAtMs > 0 ? createdAtMs - 5 * 60 * 1000 : 0;

          const accTxs = (txByAcc.get(acc.id) || []).filter(tx => !minRegMs || !tx.date || new Date(tx.date).getTime() >= minRegMs);
          const accOrds = (ordByAcc.get(acc.id) || []).filter(o => !minRegMs || !o.date || new Date(o.date).getTime() >= minRegMs);
          const accInvs = (invByAcc.get(acc.id) || []).filter(inv => !minRegMs || !inv.date || new Date(inv.date).getTime() >= minRegMs);

          const processedOrderIds = new Set<string>();
          let totalDebit = 0;
          let totalCredit = 0;

          for (const tx of accTxs) {
            const txTypeUpper = String(tx.type || "").toUpperCase();
            const isCredit = creditKeywords.some(k => txTypeUpper.includes(k));
            const amt = Math.abs(Number(tx.amount || 0));
            if (isCredit) {
              totalCredit += amt;
            } else {
              totalDebit += amt;
              const match = tx.description?.match(/(PKF-?[A-Z0-9-]+|B2B-?[A-Z0-9-]+|ORD-?[A-Z0-9-]+)/i);
              if (match) processedOrderIds.add(normalizeOrdKey(match[1]));
            }
          }

          for (const inv of accInvs) {
            const invTypeUpper = String(inv.type || "").toUpperCase();
            const amt = Math.abs(Number(inv.totalAmount || 0));
            if (invTypeUpper.includes("ALIS")) {
              totalCredit += amt;
            } else {
              totalDebit += amt;
            }
          }

          for (const o of accOrds) {
            const ordKey = normalizeOrdKey(o.id);
            if (processedOrderIds.has(ordKey)) continue;
            totalDebit += Number(o.total || 0);
          }

          const netBalance = Number((Number(acc.openingBalance || 0) + totalDebit - totalCredit).toFixed(2));
          if (Math.abs(Number(acc.balance ?? 0) - netBalance) > 0.005) {
            acc.balance = netBalance;
            prisma.currentAccount
              .update({ where: { id: acc.id }, data: { balance: netBalance } })
              .catch(() => null);
          } else {
            acc.balance = netBalance;
          }
        }
      }
    } catch (syncErr) {
      console.warn("[CURRENT ACCOUNTS SYNC WARN] Balance sync skipped:", syncErr);
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
    const generatedCariKod = data.cariKod?.trim() || `PEKEFE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Clean tanimlar and include kategori
    const tanimlarObj = typeof data.tanimlar === "object" && data.tanimlar !== null ? { ...data.tanimlar } : {};
    if (data.kategori) {
      tanimlarObj.kategori = data.kategori;
    }

    // Ensure email & tckn are null if empty string to avoid unique constraint violations
    const cleanEmail = data.email && typeof data.email === "string" && data.email.trim() ? data.email.trim() : null;
    const cleanTckn = data.tckn && typeof data.tckn === "string" && data.tckn.trim() ? data.tckn.trim() : null;

    let parsedDogumTarihi: Date | null = null;
    if (data.dogumTarihi) {
      const d = new Date(data.dogumTarihi);
      if (!isNaN(d.getTime())) {
        parsedDogumTarihi = d;
      }
    }

    const newAccountId = data.id || `CARI-${Date.now()}`;
    const newAccountData: any = {
      id: newAccountId,
      cariKod: generatedCariKod,
      name: data.name?.trim() || (data.ad && data.soyad ? `${data.ad} ${data.soyad}`.trim() : "Yeni Cari"),
      type: data.type || "MUSTERI",
      cariTipi: data.cariTipi || "CORPORATE",
      ad: data.ad?.trim() || null,
      soyad: data.soyad?.trim() || null,
      tckn: cleanTckn,
      dogumTarihi: parsedDogumTarihi,
      taxNo: data.taxNo?.trim() || null,
      taxId: data.taxId?.trim() || data.taxNo?.trim() || null,
      taxOffice: data.taxOffice?.trim() || null,
      mersisNo: data.mersisNo?.trim() || null,
      yetkiliKisi: data.yetkiliKisi?.trim() || null,
      webSitesi: data.webSitesi?.trim() || null,
      phone: data.phone?.trim() || null,
      email: cleanEmail,
      address: data.address?.trim() || null,
      currency: data.currency || "TRY",
      openingBalance: Number(data.openingBalance) || 0,
      balance: Number(data.balance) || Number(data.openingBalance) || 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      isDeleted: false,
      discountRate: data.discountRate !== undefined && data.discountRate !== null ? Number(data.discountRate) : null,
      creditLimit: data.creditLimit !== undefined && data.creditLimit !== null ? Number(data.creditLimit) : null,
      riskLimit: data.riskLimit !== undefined && data.riskLimit !== null ? Number(data.riskLimit) : null,
      vadeGun: data.vadeGun !== undefined && data.vadeGun !== null ? parseInt(data.vadeGun) : null,
      b2bMinQty: data.b2bMinQty !== undefined && data.b2bMinQty !== null ? Number(data.b2bMinQty) : 1,
      b2bPaymentTerms: data.b2bPaymentTerms || "Nakit",
      b2bCode: data.b2bCode?.trim() || null,
      loyaltyPoints: Number(data.loyaltyPoints) || 0,
      dealerGroup: data.dealerGroup || "Standart",
      priceGroup: data.priceGroup || "Liste",
      priceFormula: data.priceFormula?.trim() || null,
      parentDealerId: data.parentDealerId || null,
      kaynakPlatform: data.kaynakPlatform || "PEKEFE_B2B",
      eFaturaDurumu: Boolean(data.eFaturaDurumu),
      blokeDurumu: Boolean(data.blokeDurumu),
      adresler: Array.isArray(data.adresler) ? data.adresler : [],
      entegrasyonHaritalama: typeof data.entegrasyonHaritalama === "object" && data.entegrasyonHaritalama !== null ? data.entegrasyonHaritalama : {},
      auditLogs: Array.isArray(data.auditLogs) ? data.auditLogs : [],
      dosyalar: Array.isArray(data.dosyalar) ? data.dosyalar : [],
      bankalar: Array.isArray(data.bankalar) ? data.bankalar : [],
      kvkk: typeof data.kvkk === "object" && data.kvkk !== null ? data.kvkk : { izni: "Onay Verildi", aciklama: "" },
      yetkililer: Array.isArray(data.yetkililer) ? data.yetkililer : [],
      tanimlar: tanimlarObj
    };

    // Save to local fallback store
    saveLocalAccount(newAccountData);

    try {
      const account = await prisma.currentAccount.create({ data: newAccountData });
      return NextResponse.json(account);
    } catch (dbErr) {
      console.warn("[POST CURRENT ACCOUNT DB WARN] Database create failed, using local store:", dbErr);
      return NextResponse.json(newAccountData);
    }
  } catch (error: any) {
    console.error("Failed to create account:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
