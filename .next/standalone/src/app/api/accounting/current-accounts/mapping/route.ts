import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const updatedBy = session?.user?.name || session?.user?.email || "Yönetici";

    const body = await request.json();
    const { primaryId, duplicateIds } = body as { primaryId: string; duplicateIds: string[] };

    if (!primaryId || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
      return NextResponse.json({ error: "Geçersiz eşleştirme parametreleri." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch primary account
      const primary = await tx.currentAccount.findUnique({
        where: { id: primaryId }
      });

      if (!primary) {
        throw new Error("Birincil cari kart bulunamadı.");
      }

      // 2. Fetch duplicate accounts
      const duplicates = await tx.currentAccount.findMany({
        where: { id: { in: duplicateIds } }
      });

      if (duplicates.length === 0) {
        throw new Error("Eşleştirilecek mükerrer cari kart bulunamadı.");
      }

      // 3. Collect balances, addresses, integrations, files, and names
      let totalBalanceTransfer = 0;
      let mergedAddresses = Array.isArray(primary.adresler) ? (primary.adresler as any[]) : [];
      let mergedIntegrations = typeof primary.entegrasyonHaritalama === "object" && primary.entegrasyonHaritalama 
        ? { ...(primary.entegrasyonHaritalama as Record<string, any>) }
        : {};
      let mergedFiles = Array.isArray(primary.dosyalar) ? (primary.dosyalar as any[]) : [];
      const duplicateNames: string[] = [];

      for (const dup of duplicates) {
        duplicateNames.push(dup.name);
        totalBalanceTransfer += dup.balance.toNumber();

        // Merge addresses
        if (dup.adresler && Array.isArray(dup.adresler)) {
          mergedAddresses = [...mergedAddresses, ...(dup.adresler as any[])];
        }

        // Merge integrations
        if (dup.entegrasyonHaritalama && typeof dup.entegrasyonHaritalama === "object") {
          mergedIntegrations = { ...mergedIntegrations, ...(dup.entegrasyonHaritalama as Record<string, any>) };
        }

        // Merge files
        if (dup.dosyalar && Array.isArray(dup.dosyalar)) {
          mergedFiles = [...mergedFiles, ...(dup.dosyalar as any[])];
        }
      }

      // De-duplicate addresses by some basic heuristic (e.g. fullAddress or title + city)
      const seenAddr = new Set();
      mergedAddresses = mergedAddresses.filter(addr => {
        const key = `${addr.city}-${addr.district}-${(addr.fullAddress || "").substring(0, 15)}`.toLowerCase();
        if (seenAddr.has(key)) return false;
        seenAddr.add(key);
        return true;
      });

      // De-duplicate files by URL
      const seenFiles = new Set();
      mergedFiles = mergedFiles.filter(file => {
        if (!file.url || seenFiles.has(file.url)) return false;
        seenFiles.add(file.url);
        return true;
      });

      // 4. Update relations to the primary account
      // Relink invoices
      await tx.invoice.updateMany({
        where: { currentAccountId: { in: duplicateIds } },
        data: { currentAccountId: primaryId }
      });

      // Relink orders
      await tx.order.updateMany({
        where: { currentAccountId: { in: duplicateIds } },
        data: { currentAccountId: primaryId }
      });

      // Relink transactions
      await tx.transaction.updateMany({
        where: { currentAccountId: { in: duplicateIds } },
        data: { currentAccountId: primaryId }
      });

      // Relink sub-accounts
      await tx.subAccount.updateMany({
        where: { currentAccountId: { in: duplicateIds } },
        data: { currentAccountId: primaryId }
      });

      // 5. Delete (or mark isDeleted: true) duplicates
      await tx.currentAccount.updateMany({
        where: { id: { in: duplicateIds } },
        data: { isDeleted: true, balance: 0 }
      });

      // 6. Record Audit Log on primary
      let currentLogs: any[] = [];
      if (primary.auditLogs) {
        try {
          currentLogs = typeof primary.auditLogs === "string" 
            ? JSON.parse(primary.auditLogs) 
            : (primary.auditLogs as any[]);
          if (!Array.isArray(currentLogs)) currentLogs = [];
        } catch (e) {
          currentLogs = [];
        }
      }

      const mergeLog = {
        id: `merge-${Date.now()}`,
        field: "Mükerrer Eşleştirme",
        oldValue: `Bakiye: ${primary.balance.toNumber()} TRY`,
        newValue: `Bakiye: ${primary.balance.toNumber() + totalBalanceTransfer} TRY (Eşleştirilen: ${duplicateNames.join(", ")})`,
        updatedBy,
        date: new Date().toISOString()
      };

      const updatedLogs = [mergeLog, ...currentLogs];

      // 7. Update primary account with aggregated numbers and logs
      const updatedPrimary = await tx.currentAccount.update({
        where: { id: primaryId },
        data: {
          balance: primary.balance.toNumber() + totalBalanceTransfer,
          adresler: mergedAddresses,
          entegrasyonHaritalama: mergedIntegrations,
          dosyalar: mergedFiles,
          auditLogs: updatedLogs
        }
      });

      return updatedPrimary;
    });

    return NextResponse.json({ success: true, account: result });
  } catch (error: any) {
    console.error("Account merge error:", error);
    return NextResponse.json({ error: error.message || "Eşleştirme sırasında bir hata oluştu." }, { status: 500 });
  }
}
