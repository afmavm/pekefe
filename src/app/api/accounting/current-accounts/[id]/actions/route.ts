import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { emailNotificationService } from "@/lib/email-notification-service";

/**
 * Cari Hesap Finansal İşlemler API
 *
 * Bakiye Mantığı (muhasebe açısından):
 *  - balance > 0  → Müşteri bize BORÇLU (alacak)
 *  - balance < 0  → Biz müşteriye BORÇLUYUZ (veresiye fazlası)
 *
 * İşlem Etkileri:
 *  - TAHSİLAT   : Müşteri ödedi → balance AZALIR (borç kapandı)
 *  - ÖDEME      : Biz ödedik   → balance ARTAR  (müşteri lehine)
 *  - SATIS      : Satış yaptık → balance ARTAR  (müşteri borçlandı)
 *  - ALIŞ       : Aldık        → balance AZALIR (bizim borcumuz arttı)
 *  - ALACAK DEVİR: Devir açılış → balance ARTAR
 *  - BORÇ DEVİR : Devir açılış → balance AZALIR
 */

// Tüm desteklenen işlem tipleri ve bakiye etkileri
const ACTION_CONFIG: Record<string, { label: string; balanceMultiplier: number; type: string }> = {
  tahsilat:       { label: "Tahsilat",        balanceMultiplier: -1, type: "TAHSILAT" },
  ödeme:          { label: "Ödeme",           balanceMultiplier: +1, type: "ODEME" },
  satis:          { label: "Satış",           balanceMultiplier: +1, type: "SATIS" },
  alis:           { label: "Alış",            balanceMultiplier: -1, type: "ALIS" },
  isAlma:         { label: "İş Alma",         balanceMultiplier: +1, type: "IS_ALMA" },
  "Alacak Devri": { label: "Alacak Devri",    balanceMultiplier: +1, type: "ALACAK_DEVIR" },
  "Borç Devri":   { label: "Borç Devri",      balanceMultiplier: -1, type: "BORC_DEVIR" },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const accountId = resolvedParams.id;
    const session = await getServerSession(authOptions);
    const updatedBy = session?.user?.name || session?.user?.email || "Yönetici";

    const body = await request.json();
    const {
      action,        // "tahsilat" | "ödeme" | "satis" | "alis" | "isAlma" | "Alacak Devri" | "Borç Devri"
      amount,
      description,
      paymentMethod,
      bankId,
      belgeTipi,     // Belge türü: "Satış Fatura", "Alış Fatura" vb.
      devirTipi,     // "Alacak Devri" | "Borç Devri"
      belgeNo,
      belgeTarihi,
      kdvOrani,
      iskonto,
      doviz,
      urunAciklama,
      
      // Tahsilat detayları
      referansNo,
      tahsilatTuru,
      matchedInvoices, // array of { invoiceId: string, amount: number }
      iban,
      dekontNo,
      islemRefNo,
      cekNo,
      bankaAdi,
      sube,
      kesideTarihi,
      cekVadeTarihi,
      senetNo,
      duzenlemeTarihi,
      senetVadeTarihi,
      muhasebeNotu,
      icNot,
    } = body;

    // ── Devir ve Ödeme için action'ı normalize et ──────────────────
    let normalizedAction = action === "devir" ? (devirTipi || "Alacak Devri") : action;
    if (normalizedAction === "odeme") {
      normalizedAction = "ödeme";
    }

    // ── Cari hesabı bul ───────────────────────────────────────────
    const account = await prisma.currentAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });
    }

    // ── İletişim tetikleyicileri (mutabakat, sms, email) ──────────
    if (["mutabakat", "sms", "email"].includes(action)) {
      const labelMap: Record<string, string> = {
        mutabakat: "Mutabakat Gönderimi",
        sms: "SMS Gönderimi",
        email: "E-posta Gönderimi",
      };
      const msgMap: Record<string, string> = {
        mutabakat: "Cari hesap mutabakat mektubu oluşturuldu ve gönderildi.",
        sms: "Cari bakiye hatırlatma SMS'i gönderildi.",
        email: "Cari ekstre detayları e-posta ile iletildi.",
      };

      if (action === "mutabakat" || action === "email") {
        if (!account.email) {
          return NextResponse.json({ 
            error: "Cari hesaba tanımlı bir e-posta adresi bulunamadı. Lütfen önce e-posta adresi giriniz." 
          }, { status: 400 });
        }

        try {
          const eventType = action === "mutabakat" ? "mutabakat" : "ekstre";
          const balance = Number(account.balance);
          const isBorc = balance > 0;
          const formattedBalance = Math.abs(balance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          await emailNotificationService.queueEmail(
            account.email,
            eventType,
            {
              kullanici_adi: account.name,
              cari_kod: account.cariKod || "-",
              bakiye: formattedBalance,
              bakiye_durumu: isBorc ? "BORÇLU" : balance < 0 ? "ALACAKLI" : "MUTABIK",
              bakiye_rengi: isBorc ? "#dc2626" : balance < 0 ? "#16a34a" : "#475569",
              bakiye_etiketi: isBorc ? `Borcunuz: ${formattedBalance} TRY` : balance < 0 ? `Alacağınız: ${formattedBalance} TRY` : `Bakiye: 0,00 TRY`,
              tarih: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }),
              yetkili: account.yetkiliKisi || account.name,
              telefon: account.phone || "-",
              vade_gun: account.vadeGun ? `${account.vadeGun} Gün` : "-",
              adres: account.address || "-",
            }
          );
        } catch (emailErr: any) {
          console.error("[ACTIONS_EMAIL_QUEUE_ERROR]:", emailErr);
          return NextResponse.json({ 
            error: `E-posta kuyruğa alınırken hata oluştu: ${emailErr.message || emailErr}` 
          }, { status: 500 });
        }
      }

      if (action === "sms") {
        if (!account.phone) {
          return NextResponse.json({ 
            error: "Cari hesaba tanımlı bir telefon numarası bulunamadı." 
          }, { status: 400 });
        }
      }

      const currentLogs = parseAuditLogs(account.auditLogs);
      const log = {
        id: `comm-${Date.now()}`,
        field: labelMap[action],
        oldValue: "-",
        newValue: msgMap[action],
        updatedBy,
        date: new Date().toISOString(),
      };

      const updated = await prisma.currentAccount.update({
        where: { id: accountId },
        data: { auditLogs: [log, ...currentLogs] },
      });

      return NextResponse.json({ success: true, message: msgMap[action], auditLogs: updated.auditLogs });
    }

    // ── Finansal işlemler ─────────────────────────────────────────
    const config = ACTION_CONFIG[normalizedAction];
    if (!config) {
      return NextResponse.json({ error: `Geçersiz işlem tipi: ${normalizedAction}` }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Geçersiz tutar. Lütfen pozitif bir sayı girin." }, { status: 400 });
    }

    const balanceChange = parsedAmount * config.balanceMultiplier;

    // Belge açıklaması oluştur
    const docLabel = belgeTipi
      ? `${config.label} — ${belgeTipi}`
      : devirTipi
      ? devirTipi
      : config.label;

    const finalDescription =
      description ||
      `${docLabel}${belgeNo ? ` (#${belgeNo})` : ""}${urunAciklama ? `: ${urunAciklama}` : ""}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1) Transaction (ekstre hareketi) kaydı
      const trx = await tx.transaction.create({
        data: {
          currentAccountId: accountId,
          type: config.type,
          amount: balanceChange,
          description: finalDescription,
          paymentMethod: paymentMethod || "Nakit",
          date: belgeTarihi ? new Date(belgeTarihi) : new Date(),
        },
      });

      // 2) Cari hesap bakiyesini güncelle
      const updatedAccount = await tx.currentAccount.update({
        where: { id: accountId },
        data: { balance: { increment: balanceChange } },
      });

      // 3) Banka bakiyesini güncelle (eğer banka seçilmişse)
      if (bankId) {
        try {
          await tx.bank.update({
            where: { id: bankId },
            data: {
              balance: {
                // Tahsilat = bankaya para giriyor, Ödeme = bankadan para çıkıyor
                increment: config.balanceMultiplier > 0 ? -parsedAmount : parsedAmount,
              },
            },
          });
        } catch (e) {
          // Banka bulunamazsa devam et
        }
      }

      // 3.5) Fatura kapatma işlemlerini gerçekleştir
      let closedCount = 0;
      if (action === "tahsilat" && Array.isArray(matchedInvoices) && matchedInvoices.length > 0) {
        for (const match of matchedInvoices) {
          const invId = match.invoiceId;
          const matchAmt = Number(match.amount);
          if (invId && matchAmt > 0) {
            const invoice = await tx.invoice.findUnique({ where: { id: invId } });
            if (invoice) {
              closedCount++;
              const isFullyClosed = matchAmt >= invoice.totalAmount.toNumber();
              const newStatus = isFullyClosed ? "ODENDI" : "KISMI";
              await tx.invoice.update({
                where: { id: invId },
                data: {
                  status: newStatus,
                  notes: `${invoice.notes || ""}\n[Kapatma: ${matchAmt.toFixed(2)} ${doviz || "TRY"} - Ref: ${referansNo || "-"}]`.trim(),
                }
              });
            }
          }
        }
      }

      // 3.6) Kasa/Banka Gelir Hareketi (Income) oluştur
      if (action === "tahsilat") {
        let incomeMethod = "HAVALE";
        if (paymentMethod === "Nakit") {
          incomeMethod = "NAKIT";
        } else if (paymentMethod === "Kredi Kartı" || paymentMethod === "Pos Tahsilatı") {
          incomeMethod = "KREDI_KARTI";
        }
        
        await tx.income.create({
          data: {
            date: belgeTarihi ? new Date(belgeTarihi) : new Date(),
            category: "Cari Tahsilat",
            description: `${account.name} cari tahsilatı - ${paymentMethod} (${finalDescription})`,
            amount: parsedAmount,
            currentAccountId: accountId,
            paymentMethod: incomeMethod,
            bankId: (paymentMethod === "Banka Havalesi" || paymentMethod === "EFT" || paymentMethod === "Kredi Kartı" || paymentMethod === "Pos Tahsilatı") ? (bankId || null) : null,
            status: "ALINDI",
          }
        });
      }

      // 3.7) Kasa/Banka Gider Hareketi (Expense) oluştur
      if (normalizedAction === "ödeme") {
        let expenseMethod = "HAVALE";
        if (paymentMethod === "Nakit") {
          expenseMethod = "NAKIT";
        } else if (paymentMethod === "Kredi Kartı" || paymentMethod === "Pos Tahsilatı") {
          expenseMethod = "KREDI_KARTI";
        }
        
        await tx.expense.create({
          data: {
            date: belgeTarihi ? new Date(belgeTarihi) : new Date(),
            category: "Cari Ödeme",
            description: `${account.name} cari ödemesi - ${paymentMethod} (${finalDescription})`,
            amount: parsedAmount,
            supplier: account.name,
            receiptNo: belgeNo || null,
            paymentMethod: expenseMethod,
            bankId: (paymentMethod === "Banka Havalesi" || paymentMethod === "EFT" || paymentMethod === "Kredi Kartı" || paymentMethod === "Pos Tahsilatı") ? (bankId || null) : null,
            status: "ODENDI",
          }
        });
      }

      // 4) Audit log ekle
      const currentLogs = parseAuditLogs(updatedAccount.auditLogs);
      const newLog = {
        id: `fin-${Date.now()}`,
        field: docLabel,
        oldValue: `${account.balance.toFixed(2)} TRY`,
        newValue: `${updatedAccount.balance.toFixed(2)} TRY (${balanceChange > 0 ? "+" : ""}${balanceChange.toFixed(2)} TRY)`,
        updatedBy,
        date: new Date().toISOString(),
        meta: {
          belgeTipi: belgeTipi || null,
          belgeNo: belgeNo || null,
          kdvOrani: kdvOrani || null,
          iskonto: iskonto || null,
          doviz: doviz || "TRY",
          paymentMethod: paymentMethod || null,
          referansNo: referansNo || null,
          dekontNo: dekontNo || null,
          islemRefNo: islemRefNo || null,
          cekNo: cekNo || null,
          bankaAdi: bankaAdi || null,
          sube: sube || null,
          kesideTarihi: kesideTarihi || null,
          cekVadeTarihi: cekVadeTarihi || null,
          senetNo: senetNo || null,
          duzenlemeTarihi: duzenlemeTarihi || null,
          senetVadeTarihi: senetVadeTarihi || null,
          muhasebeNotu: muhasebeNotu || null,
          icNot: icNot || null,
          matchedInvoicesCount: closedCount,
        },
      };

      await tx.currentAccount.update({
        where: { id: accountId },
        data: { auditLogs: [newLog, ...currentLogs] },
      });

      return {
        transaction: trx,
        newBalance: updatedAccount.balance,
        balanceChange,
        actionType: config.type,
        label: docLabel,
        closedInvoicesCount: closedCount,
      };
    }, { maxWait: 10000, timeout: 30000 });

    return NextResponse.json({
      success: true,
      message: `${docLabel} başarıyla kaydedildi. Yeni Bakiye: ${result.newBalance.toFixed(2)} TRY`,
      ...result,
    });
  } catch (error: any) {
    console.error("Current Account action error:", error);
    return NextResponse.json(
      { error: error.message || "İşlem gerçekleştirilemedi." },
      { status: 500 }
    );
  }
}

// ── Yardımcı: auditLogs'u güvenle parse et ────────────────────────────────
function parseAuditLogs(raw: any): any[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
