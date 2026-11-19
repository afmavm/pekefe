import { NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { readLocalOrders } from "@/lib/jsonOrderDb";
import { readLocalAccounts, updateLocalAccount, deleteLocalAccount } from "@/lib/jsonCurrentAccountsDb";

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const targetId = resolvedParams.id;

    let account: any = null;
    try {
      account = await withTimeout(
        prisma.currentAccount.findUnique({
          where: { id: targetId },
          include: {
            transactions: { orderBy: { date: "desc" } },
            invoices: { orderBy: { date: "desc" } },
            orders: { orderBy: { date: "desc" } },
            subAccounts: true
          }
        }),
        1500,
        null
      );
    } catch (dbErr) {
      console.warn("[GET CURRENT ACCOUNT DB WARN] Database findUnique failed:", dbErr);
    }

    // Fail-Safe: If not found by direct id in DB, try matching by cariKod, email, or User id
    if (!account) {
      try {
        account = await withTimeout(
          prisma.currentAccount.findFirst({
            where: {
              OR: [
                { cariKod: targetId },
                { email: targetId }
              ]
            },
            include: {
              transactions: { orderBy: { date: "desc" } },
              invoices: { orderBy: { date: "desc" } },
              orders: { orderBy: { date: "desc" } },
              subAccounts: true
            }
          }),
          1500,
          null
        );

        if (!account) {
          const user = await withTimeout(
            prisma.user.findUnique({
              where: { id: targetId },
              select: { email: true, name: true, createdAt: true }
            }),
            1500,
            null
          );
          if (user?.email) {
            account = await withTimeout(
              prisma.currentAccount.findFirst({
                where: { email: user.email },
                include: {
                  transactions: { orderBy: { date: "desc" } },
                  invoices: { orderBy: { date: "desc" } },
                  orders: { orderBy: { date: "desc" } },
                  subAccounts: true
                }
              }),
              1500,
              null
            );
          }
        }
      } catch {}
    }

    // Fail-Safe: Check local saved accounts
    if (!account) {
      const localAccounts = readLocalAccounts();
      const matchedLocal = localAccounts.find(
        a => a.id === targetId || a.cariKod === targetId || (a.email && a.email.toLowerCase() === targetId.toLowerCase())
      );
      if (matchedLocal) {
        account = {
          ...matchedLocal,
          transactions: matchedLocal.transactions || [],
          invoices: matchedLocal.invoices || [],
          orders: matchedLocal.orders || [],
          subAccounts: matchedLocal.subAccounts || []
        };
      }
    }

    // Fail-Safe: If still not found, search strictly matching local orders
    if (!account) {
      const localOrders = readLocalOrders();
      const clientOrders = localOrders.filter(
        o => o.currentAccountId === targetId || (o.email && o.email.toLowerCase() === targetId.toLowerCase())
      );

      const sampleOrder = clientOrders[0];
      const clientName = sampleOrder?.client || sampleOrder?.customerName || "Müşteri";
      const email = sampleOrder?.email || "";
      const phone = sampleOrder?.phone || "";
      const address = sampleOrder?.address || "";

      account = {
        id: targetId,
        cariKod: `PKF-CARI-${targetId.replace(/[^0-9]/g, '') || '1001'}`,
        name: clientName,
        type: "MUSTERI",
        cariTipi: "INDIVIDUAL",
        phone: phone,
        email: email,
        address: address,
        balance: 0,
        currency: "TRY",
        openingBalance: 0,
        isActive: true,
        dealerGroup: "Perakende",
        priceGroup: "Liste",
        kaynakPlatform: "PEKEFE_B2C",
        createdAt: sampleOrder?.date || new Date().toISOString(),
        transactions: [],
        invoices: [],
        orders: clientOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber || o.id,
          total: o.amount || o.total || 0,
          status: o.status || "Hazırlanıyor",
          date: o.date || o.createdAt || new Date().toISOString()
        })),
        adresler: address ? [
          {
            id: "addr-01",
            title: "Teslimat Adresi",
            fullAddress: address,
            city: "Erzurum",
            district: "Palandöken",
            type: "both"
          }
        ] : [],
        auditLogs: [],
        entegrasyonHaritalama: {}
      };
    }

    // Enrich missing cariKod / phone / address / adresler
    if (account) {
      const patchData: any = {};
      if (!account.cariKod || String(account.cariKod).trim() === "") {
        const suffix = String(account.id || "").replace(/\D/g, "").slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
        account.cariKod = `PKF-CARI-${suffix.padStart(4, "0")}`;
        patchData.cariKod = account.cariKod;
      }

      const localOrders = readLocalOrders();
      const accEmail = String(account.email || "").trim().toLowerCase();
      const matchedOrder = localOrders.find(
        (o) =>
          o.currentAccountId === account.id ||
          (accEmail && String(o.email || "").trim().toLowerCase() === accEmail)
      );
      if (matchedOrder) {
        if (!account.phone && matchedOrder.phone) {
          account.phone = matchedOrder.phone;
          patchData.phone = matchedOrder.phone;
        }
        if (!account.address && matchedOrder.address) {
          account.address = matchedOrder.address;
          patchData.address = matchedOrder.address;
        }
      }

      if (account.address && (!Array.isArray(account.adresler) || account.adresler.length === 0)) {
        account.adresler = [
          {
            id: `addr-${account.id}`,
            title: "Kayıtlı Adres",
            address: account.address,
            city: "",
            district: "",
            isDefault: true,
          },
        ];
      }

      if (Object.keys(patchData).length > 0) {
        updateLocalAccount(account.id, patchData);
        withTimeout(
          prisma.currentAccount.update({ where: { id: account.id }, data: patchData }),
          1500,
          null as any
        ).catch(() => null);
      }
    }

    return NextResponse.json(account, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("GET Current Account error:", error);
    return NextResponse.json({
      id: "CARI-UNKNOWN",
      cariKod: "PKF-CARI-UNKNOWN",
      name: "Müşteri",
      type: "MUSTERI",
      cariTipi: "INDIVIDUAL",
      phone: "",
      email: "",
      address: "",
      balance: 0,
      currency: "TRY",
      openingBalance: 0,
      isActive: true,
      dealerGroup: "Perakende",
      priceGroup: "Liste",
      kaynakPlatform: "PEKEFE_B2C",
      createdAt: new Date().toISOString(),
      transactions: [],
      invoices: [],
      orders: [],
      adresler: [],
      auditLogs: [],
      entegrasyonHaritalama: {}
    }, { headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const session = await getServerSession(authOptions);
    const updatedBy = session?.user?.name || session?.user?.email || "Yönetici";

    let existing: any = null;
    try {
      existing = await prisma.currentAccount.findUnique({
        where: { id: resolvedParams.id }
      });
    } catch {}

    const newLogs: any[] = [];
    const trackedFields = [
      { key: "creditLimit", label: "Kredi Limiti" },
      { key: "riskLimit", label: "Risk Limiti" },
      { key: "blokeDurumu", label: "Bloke Durumu" },
      { key: "priceGroup", label: "Fiyat Grubu" },
      { key: "discountRate", label: "İskonto Oranı" },
      { key: "vadeGun", label: "Vade Opsiyonu (Gün)" },
      { key: "dealerGroup", label: "Bayi Grubu" },
      { key: "eFaturaDurumu", label: "e-Fatura Durumu" },
      { key: "isActive", label: "Aktiflik Durumu" }
    ];

    if (existing) {
      trackedFields.forEach(({ key, label }) => {
        if (data[key] !== undefined) {
          const oldValue = (existing as any)[key];
          const newValue = data[key];
          
          if (oldValue !== newValue) {
            newLogs.push({
              id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              field: label,
              oldValue: oldValue === null || oldValue === undefined ? "-" : String(oldValue),
              newValue: newValue === null || newValue === undefined ? "-" : String(newValue),
              updatedBy,
              date: new Date().toISOString()
            });
          }
        }
      });
    }

    let currentLogs: any[] = [];
    if (existing?.auditLogs) {
      try {
        currentLogs = typeof existing.auditLogs === "string" 
          ? JSON.parse(existing.auditLogs) 
          : (existing.auditLogs as any[]);
        if (!Array.isArray(currentLogs)) currentLogs = [];
      } catch (e) {
        currentLogs = [];
      }
    }

    const updatedLogs = [...newLogs, ...currentLogs];

    // Sanitize and map only valid CurrentAccount columns for Prisma
    const cleanUpdateData: any = {};

    if (data.cariKod !== undefined) cleanUpdateData.cariKod = data.cariKod?.trim() || null;
    if (data.name !== undefined) cleanUpdateData.name = data.name?.trim() || "Cari";
    if (data.type !== undefined) cleanUpdateData.type = data.type;
    if (data.cariTipi !== undefined) cleanUpdateData.cariTipi = data.cariTipi;
    if (data.ad !== undefined) cleanUpdateData.ad = data.ad?.trim() || null;
    if (data.soyad !== undefined) cleanUpdateData.soyad = data.soyad?.trim() || null;
    if (data.tckn !== undefined) cleanUpdateData.tckn = data.tckn?.trim() ? data.tckn.trim() : null;

    if (data.dogumTarihi !== undefined) {
      if (data.dogumTarihi) {
        const d = new Date(data.dogumTarihi);
        cleanUpdateData.dogumTarihi = !isNaN(d.getTime()) ? d : null;
      } else {
        cleanUpdateData.dogumTarihi = null;
      }
    }

    if (data.taxNo !== undefined) cleanUpdateData.taxNo = data.taxNo?.trim() || null;
    if (data.taxId !== undefined) cleanUpdateData.taxId = data.taxId?.trim() || null;
    if (data.taxOffice !== undefined) cleanUpdateData.taxOffice = data.taxOffice?.trim() || null;
    if (data.mersisNo !== undefined) cleanUpdateData.mersisNo = data.mersisNo?.trim() || null;
    if (data.yetkiliKisi !== undefined) cleanUpdateData.yetkiliKisi = data.yetkiliKisi?.trim() || null;
    if (data.webSitesi !== undefined) cleanUpdateData.webSitesi = data.webSitesi?.trim() || null;
    if (data.phone !== undefined) cleanUpdateData.phone = data.phone?.trim() || null;
    if (data.email !== undefined) cleanUpdateData.email = data.email?.trim() ? data.email.trim() : null;
    if (data.address !== undefined) cleanUpdateData.address = data.address?.trim() || null;

    if (data.currency !== undefined) cleanUpdateData.currency = data.currency;
    if (data.openingBalance !== undefined) cleanUpdateData.openingBalance = Number(data.openingBalance) || 0;
    if (data.balance !== undefined) cleanUpdateData.balance = Number(data.balance) || 0;
    if (data.isActive !== undefined) cleanUpdateData.isActive = Boolean(data.isActive);
    if (data.isDeleted !== undefined) cleanUpdateData.isDeleted = Boolean(data.isDeleted);
    if (data.discountRate !== undefined) cleanUpdateData.discountRate = data.discountRate !== null ? Number(data.discountRate) : null;
    if (data.creditLimit !== undefined) cleanUpdateData.creditLimit = data.creditLimit !== null ? Number(data.creditLimit) : null;
    if (data.riskLimit !== undefined) cleanUpdateData.riskLimit = data.riskLimit !== null ? Number(data.riskLimit) : null;
    if (data.vadeGun !== undefined) cleanUpdateData.vadeGun = data.vadeGun !== null ? parseInt(data.vadeGun) : null;
    if (data.b2bMinQty !== undefined) cleanUpdateData.b2bMinQty = data.b2bMinQty !== null ? Number(data.b2bMinQty) : null;
    if (data.b2bPaymentTerms !== undefined) cleanUpdateData.b2bPaymentTerms = data.b2bPaymentTerms || "Nakit";
    if (data.b2bCode !== undefined) cleanUpdateData.b2bCode = data.b2bCode?.trim() || null;
    if (data.loyaltyPoints !== undefined) cleanUpdateData.loyaltyPoints = Number(data.loyaltyPoints) || 0;
    if (data.dealerGroup !== undefined) cleanUpdateData.dealerGroup = data.dealerGroup;
    if (data.priceGroup !== undefined) cleanUpdateData.priceGroup = data.priceGroup;
    if (data.priceFormula !== undefined) cleanUpdateData.priceFormula = data.priceFormula?.trim() || null;
    if (data.parentDealerId !== undefined) cleanUpdateData.parentDealerId = data.parentDealerId || null;
    if (data.kaynakPlatform !== undefined) cleanUpdateData.kaynakPlatform = data.kaynakPlatform;
    if (data.eFaturaDurumu !== undefined) cleanUpdateData.eFaturaDurumu = Boolean(data.eFaturaDurumu);
    if (data.blokeDurumu !== undefined) cleanUpdateData.blokeDurumu = Boolean(data.blokeDurumu);

    if (data.adresler !== undefined) cleanUpdateData.adresler = Array.isArray(data.adresler) ? data.adresler : [];
    if (data.entegrasyonHaritalama !== undefined) {
      cleanUpdateData.entegrasyonHaritalama = typeof data.entegrasyonHaritalama === "object" && data.entegrasyonHaritalama !== null ? data.entegrasyonHaritalama : {};
    }
    if (data.dosyalar !== undefined) cleanUpdateData.dosyalar = Array.isArray(data.dosyalar) ? data.dosyalar : [];
    if (data.bankalar !== undefined) cleanUpdateData.bankalar = Array.isArray(data.bankalar) ? data.bankalar : [];
    if (data.kvkk !== undefined) cleanUpdateData.kvkk = typeof data.kvkk === "object" && data.kvkk !== null ? data.kvkk : { izni: "Onay Verildi", aciklama: "" };
    if (data.yetkililer !== undefined) cleanUpdateData.yetkililer = Array.isArray(data.yetkililer) ? data.yetkililer : [];

    if (data.tanimlar !== undefined || data.kategori !== undefined) {
      const tanimlarObj = typeof data.tanimlar === "object" && data.tanimlar !== null ? { ...data.tanimlar } : {};
      if (data.kategori) tanimlarObj.kategori = data.kategori;
      cleanUpdateData.tanimlar = tanimlarObj;
    }

    cleanUpdateData.auditLogs = updatedLogs;

    // Update in local fallback store
    updateLocalAccount(resolvedParams.id, cleanUpdateData);

    let updatedAccount: any = { id: resolvedParams.id, ...(existing || {}), ...cleanUpdateData };
    if (existing) {
      try {
        updatedAccount = await prisma.currentAccount.update({
          where: { id: resolvedParams.id },
          data: cleanUpdateData
        });
      } catch (dbErr) {
        console.warn("[PATCH CURRENT ACCOUNT DB WARN] Database update failed, updated in local store:", dbErr);
      }
    }

    return NextResponse.json(updatedAccount, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error("PATCH Current Account error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const targetId = resolvedParams.id;

    // Delete from local store
    deleteLocalAccount(targetId);

    // Soft delete in database
    try {
      await prisma.currentAccount.update({
        where: { id: targetId },
        data: { isDeleted: true, isActive: false }
      });
    } catch (dbErr) {
      console.warn("[DELETE CURRENT ACCOUNT DB WARN] Database soft delete failed:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Cari kart silindi." }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error("DELETE Current Account error:", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}
