import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const account = await prisma.currentAccount.findUnique({
      where: { id: resolvedParams.id },
      include: {
        transactions: { orderBy: { date: "desc" } },
        invoices: { orderBy: { date: "desc" } },
        orders: { orderBy: { date: "desc" } },
        subAccounts: true
      }
    });

    if (!account) {
      return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(account, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("GET Current Account error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const session = await getServerSession(authOptions);
    const updatedBy = session?.user?.name || session?.user?.email || "Yönetici";

    // 1. Fetch existing account
    const existing = await prisma.currentAccount.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });
    }

    // 2. Audit Trail logging
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

    trackedFields.forEach(({ key, label }) => {
      if (data[key] !== undefined) {
        const oldValue = (existing as any)[key];
        const newValue = data[key];
        
        // Compare values
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

    // Parse existing audit logs
    let currentLogs: any[] = [];
    if (existing.auditLogs) {
      try {
        currentLogs = typeof existing.auditLogs === "string" 
          ? JSON.parse(existing.auditLogs) 
          : (existing.auditLogs as any[]);
        if (!Array.isArray(currentLogs)) currentLogs = [];
      } catch (e) {
        currentLogs = [];
      }
    }

    // Prepend new logs to have latest logs first
    const updatedLogs = [...newLogs, ...currentLogs];

    // 3. Update Current Account
    const updateData: any = {
      cariKod: data.cariKod === "" ? null : data.cariKod,
      name: data.name,
      type: data.type,
      cariTipi: data.cariTipi,
      ad: data.ad,
      soyad: data.soyad,
      tckn: data.tckn === "" ? null : data.tckn,
      dogumTarihi: data.dogumTarihi ? new Date(data.dogumTarihi) : undefined,
      taxNo: data.taxNo,
      taxId: data.taxId,
      taxOffice: data.taxOffice,
      mersisNo: data.mersisNo,
      yetkiliKisi: data.yetkiliKisi,
      webSitesi: data.webSitesi,
      phone: data.phone,
      email: data.email === "" ? null : data.email,
      address: data.address,
      currency: data.currency,
      isActive: data.isActive,
      discountRate: data.discountRate !== undefined ? (data.discountRate === null ? null : Number(data.discountRate)) : undefined,
      creditLimit: data.creditLimit !== undefined ? (data.creditLimit === null ? null : Number(data.creditLimit)) : undefined,
      riskLimit: data.riskLimit !== undefined ? (data.riskLimit === null ? null : Number(data.riskLimit)) : undefined,
      vadeGun: data.vadeGun !== undefined ? (data.vadeGun === null ? null : Number(data.vadeGun)) : undefined,
      dealerGroup: data.dealerGroup,
      priceGroup: data.priceGroup,
      priceFormula: data.priceFormula,
      kaynakPlatform: data.kaynakPlatform,
      eFaturaDurumu: data.eFaturaDurumu !== undefined ? Boolean(data.eFaturaDurumu) : undefined,
      blokeDurumu: data.blokeDurumu !== undefined ? Boolean(data.blokeDurumu) : undefined,
      adresler: data.adresler !== undefined ? data.adresler : undefined,
      entegrasyonHaritalama: data.entegrasyonHaritalama !== undefined ? data.entegrasyonHaritalama : undefined,
      dosyalar: data.dosyalar !== undefined ? data.dosyalar : undefined,
      bankalar: data.bankalar !== undefined ? data.bankalar : undefined,
      kvkk: data.kvkk !== undefined ? data.kvkk : undefined,
      yetkililer: data.yetkililer !== undefined ? data.yetkililer : undefined,
      tanimlar: data.tanimlar !== undefined ? data.tanimlar : undefined,
      auditLogs: updatedLogs
    };

    // Clean undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated = await prisma.currentAccount.update({
      where: { id: resolvedParams.id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH Current Account error:", error);
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // soft delete to preserve historical integrity
    await prisma.currentAccount.update({
      where: { id: resolvedParams.id },
      data: { isDeleted: true }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Current Account error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
