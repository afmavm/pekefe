import { NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { readLocalOrders } from "@/lib/jsonOrderDb";

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const { searchParams } = new URL(request.url);

    const from  = searchParams.get("from");
    const to    = searchParams.get("to");
    const type  = searchParams.get("type") || "ALL"; // ALL | TX | ORDER | INVOICE
    const page  = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") || 50)));

    let account: any = null;

    // 1) Cari hesabı veritabanından çek (id, cariKod veya email eşleşmesi)
    try {
      account = await withTimeout(
        prisma.currentAccount.findFirst({
          where: {
            OR: [
              { id: accountId },
              { cariKod: accountId },
              { email: accountId },
            ]
          },
          select: {
            id: true,
            name: true,
            cariKod: true,
            email: true,
            phone: true,
            balance: true,
            currency: true,
            openingBalance: true,
            createdAt: true,
          }
        }),
        2500,
        null
      );

      // Eğer accountId bir User ID ise User üzerinden cari hesabı bul
      if (!account) {
        const user = await withTimeout(
          prisma.user.findUnique({
            where: { id: accountId },
            select: { email: true, name: true, createdAt: true }
          }),
          1500,
          null
        );
        if (user?.email) {
          account = await withTimeout(
            prisma.currentAccount.findFirst({
              where: { email: user.email },
              select: {
                id: true,
                name: true,
                cariKod: true,
                email: true,
                phone: true,
                balance: true,
                currency: true,
                openingBalance: true,
                createdAt: true,
              }
            }),
            1500,
            null
          );
          if (!account) {
            account = {
              id: accountId,
              name: user.name || "Müşteri",
              cariKod: `B2C-${user.email}`,
              email: user.email,
              phone: null,
              balance: 0,
              currency: "TRY",
              openingBalance: 0,
              createdAt: user.createdAt,
            };
          }
        }
      }
    } catch (dbErr) {
      console.warn("[EKSTRE DB WARN] Database find query failed:", dbErr);
    }

    // DB'de ve User'da bulunamadıysa (örneğin salt yerel/offline mod):
    if (!account) {
      // Yalnızca accountId ile doğrudan eşleşen yerel sipariş var mı kontrol et
      const localOrders = readLocalOrders();
      const matched = localOrders.find(
        o => o.currentAccountId === accountId || (o.email && o.email.toLowerCase() === accountId.toLowerCase())
      );
      if (matched) {
        account = {
          id: accountId,
          name: matched.client || matched.customerName || "Müşteri",
          cariKod: accountId,
          email: matched.email || null,
          phone: matched.phone || null,
          balance: 0,
          currency: "TRY",
          openingBalance: 0,
          createdAt: matched.createdAt || matched.date || new Date().toISOString(),
        };
      } else {
        account = {
          id: accountId,
          name: "Müşteri",
          cariKod: accountId,
          email: null,
          phone: null,
          balance: 0,
          currency: "TRY",
          openingBalance: 0,
          createdAt: new Date().toISOString(),
        };
      }
    }

    // 2) Tarih sınırlandırması: Müşterinin kayıt tarihinden ÖNCEKİ hiçbir kayıt ekstrede yer alamaz!
    const accountCreatedAt = account.createdAt ? new Date(account.createdAt) : new Date();
    // Kayıt anında oluşturulan eşzamanlı siparişler için 5 dakikalık tolerans payı
    const minRegistrationTime = new Date(accountCreatedAt.getTime() - 5 * 60 * 1000);

    let effectiveFrom = minRegistrationTime;
    if (from) {
      const fromDate = new Date(from);
      if (fromDate > effectiveFrom) {
        effectiveFrom = fromDate;
      }
    }

    let effectiveTo: Date | null = null;
    if (to) {
      effectiveTo = new Date(to);
      effectiveTo.setHours(23, 59, 59, 999);
    }

    const dateFilter: any = { gte: effectiveFrom };
    if (effectiveTo) {
      dateFilter.lte = effectiveTo;
    }

    // 3) Cari hesaba ait hareketleri (Transaction), siparişleri (Order) ve faturaları (Invoice) çek
    let dbTransactions: any[] = [];
    let dbOrders: any[] = [];
    let dbInvoices: any[] = [];

    try {
      if (type === "ALL" || type === "TX") {
        dbTransactions = await withTimeout(
          prisma.transaction.findMany({
            where: {
              currentAccountId: account.id,
              date: dateFilter,
            },
            orderBy: { date: "asc" }
          }),
          2000,
          []
        );
      }

      if (type === "ALL" || type === "ORDER") {
        dbOrders = await withTimeout(
          prisma.order.findMany({
            where: {
              currentAccountId: account.id,
              isDeleted: false,
              date: dateFilter,
            },
            orderBy: { date: "asc" }
          }),
          2000,
          []
        );
      }

      if (type === "ALL" || type === "INVOICE") {
        dbInvoices = await withTimeout(
          prisma.invoice.findMany({
            where: {
              currentAccountId: account.id,
              isDeleted: false,
              date: dateFilter,
            },
            orderBy: { date: "asc" }
          }),
          2000,
          []
        );
      }
    } catch (dbErr) {
      console.warn("[EKSTRE DB WARN] Database rows query skipped:", dbErr);
    }

    // 4) Yerel Sipariş (JSON) Kontrolü:
    // Eğer DB'den sipariş gelmediyse (veya offline moddaysa), SADECE ve SADECE bu kullanıcıya ait siparişleri al
    if (dbOrders.length === 0 && (type === "ALL" || type === "ORDER")) {
      const localOrders = readLocalOrders();
      const userEmail = (account.email || "").toLowerCase().trim();
      const userPhone = (account.phone || "").replace(/\D/g, "");

      const strictlyUserOrders = localOrders.filter(lo => {
        // Yalnızca bu cari / kullanıcı ile birebir eşleşenler
        const matchesId = lo.currentAccountId && lo.currentAccountId === account.id;
        const matchesEmail = userEmail && lo.email && lo.email.toLowerCase().trim() === userEmail;
        const matchesPhone = userPhone && lo.phone && lo.phone.replace(/\D/g, "") === userPhone;
        
        if (!matchesId && !matchesEmail && !matchesPhone) return false;

        // Kayıt tarihinden önceki kayıtlar KESİNLİKLE elenir
        const orderDate = new Date(lo.date || lo.createdAt || Date.now());
        if (orderDate < minRegistrationTime) return false;

        if (from && orderDate < new Date(from)) return false;
        if (effectiveTo && orderDate > effectiveTo) return false;

        return true;
      });

      dbOrders = strictlyUserOrders.map(lo => ({
        id: lo.id,
        currentAccountId: account.id,
        date: lo.date || lo.createdAt || new Date().toISOString(),
        total: lo.amount ?? lo.total ?? 0,
        status: lo.status || "Yeni",
        summary: lo.summary || `Sipariş #${lo.orderNumber || lo.id}`,
        type: lo.type || "B2C",
        method: lo.method || "B2C Web",
        orderNumber: lo.orderNumber || lo.id,
      }));
    }

    // 5) Çift kaydı engellemek için Transaction'larda borç olarak işlenmiş sipariş ID'lerini tespit et
    const normalizeOrdKey = (val: string) => String(val || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const creditKeywords = ["TAHSILAT", "TAHSİLAT", "ALIS", "ALIŞ", "IADE", "İADE", "IPTAL", "İPTAL", "ALACAK_DEVIR", "ALACAK"];
    const processedOrderIds = new Set<string>();
    dbTransactions.forEach(tx => {
      const txTypeUpper = String(tx.type || "").toUpperCase();
      if (creditKeywords.some(k => txTypeUpper.includes(k))) return;
      const match = tx.description?.match(/(PKF-?[A-Z0-9-]+|B2B-?[A-Z0-9-]+|ORD-?[A-Z0-9-]+)/i);
      if (match) processedOrderIds.add(normalizeOrdKey(match[1]));
    });

    const allRows: any[] = [];

    // Transaction kayıtlarını ekle
    dbTransactions.forEach(tx => {
      const txTypeUpper = String(tx.type || "").toUpperCase();
      let debit = 0;
      let credit = 0;
      const amt = Math.abs(Number(tx.amount || 0));

      if (creditKeywords.some(k => txTypeUpper.includes(k))) {
        credit = amt;
      } else {
        debit = amt;
      }

      allRows.push({
        id: tx.id,
        date: tx.date || new Date().toISOString(),
        type: tx.type || "İŞLEM",
        source: "TX",
        description: tx.description || `${tx.type || 'Finansal İşlem'}`,
        debit,
        credit,
        runningBalance: 0,
      });
    });

    // Fatura kayıtlarını ekle (Transaction'a dönüşmemiş olanlar)
    dbInvoices.forEach(inv => {
      const invTypeUpper = String(inv.type || "").toUpperCase();
      let debit = 0;
      let credit = 0;
      const amt = Math.abs(Number(inv.totalAmount || 0));

      if (invTypeUpper.includes("ALIS")) {
        credit = amt;
      } else {
        debit = amt;
      }

      allRows.push({
        id: inv.id,
        date: inv.date || new Date().toISOString(),
        type: inv.type || "FATURA",
        source: "INVOICE",
        description: `Fatura #${inv.id}`,
        debit,
        credit,
        runningBalance: 0,
      });
    });

    // Sipariş kayıtlarını ekle (Transaction'a veya faturaya konu olmamış olanlar)
    dbOrders.forEach(o => {
      const ordKey = normalizeOrdKey(o.orderNumber || o.id);
      if (processedOrderIds.has(ordKey)) {
        return; // Zaten borç Transaction'ı olarak işlendiği için mükerrer gösterme
      }

      const totalAmt = Number(o.total || o.amount || 0);
      allRows.push({
        id: o.id,
        date: o.date || o.createdAt || new Date().toISOString(),
        type: "SİPARİŞ",
        source: "ORDER",
        description: `Sipariş #${o.orderNumber || o.id}`,
        debit: totalAmt,
        credit: 0,
        runningBalance: 0,
      });
    });

    // 6) Kronolojik sıralama (eskiden yeniye) ve Kümülatif Bakiye (running balance) hesabı
    allRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = Number(account.openingBalance || 0);
    allRows.forEach(row => {
      running += (row.debit || 0) - (row.credit || 0);
      row.runningBalance = running;
    });

    // Tabloda en son hareket üstte gözüksün diye ters çevir (en yeniden eskiye)
    const displayRows = [...allRows].reverse();

    const totalDebit = allRows.reduce((acc, r) => acc + (r.debit || 0), 0);
    const totalCredit = allRows.reduce((acc, r) => acc + (r.credit || 0), 0);
    const netBalance = Number((Number(account.openingBalance || 0) + totalDebit - totalCredit).toFixed(2));

    // Veritabanındaki cari bakiye ile hesaplanan net bakiye farklıysa senkronize et
    if (isMySQL && account?.id && Math.abs(Number(account.balance ?? 0) - netBalance) > 0.005) {
      prisma.currentAccount.update({
        where: { id: account.id },
        data: { balance: netBalance },
      }).catch(() => {});
    }

    // Sayfalama (pagination)
    const startIndex = (page - 1) * limit;
    const paginatedRows = displayRows.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      account: { ...account, balance: netBalance },
      summary: {
        totalDebit,
        totalCredit,
        netBalance,
        currentBalance: netBalance,
        openingBalance: Number(account.openingBalance || 0),
        rowCount: allRows.length,
      },
      pagination: {
        page,
        limit,
        total: allRows.length,
        totalPages: Math.max(1, Math.ceil(allRows.length / limit)),
      },
      rows: paginatedRows,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error("Ekstre API error:", error);
    return NextResponse.json({
      account: null,
      summary: { totalDebit: 0, totalCredit: 0, netBalance: 0, currentBalance: 0, openingBalance: 0, rowCount: 0 },
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
      rows: []
    }, { headers: NO_CACHE_HEADERS });
  }
}
