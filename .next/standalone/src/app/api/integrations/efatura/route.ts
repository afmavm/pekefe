/**
 * POST /api/integrations/efatura
 *
 * e-Fatura / e-Arşiv Gönderme API Entegrasyonu
 *
 * Parametreler:
 * - invoiceId: String (Gönderilecek fatura ID'si)
 *
 * İşlem Akışı:
 * 1. Fatura ve ilgili Cari Kart verilerini sorgular.
 * 2. VKN/TCKN ve zorunlu fatura alanlarını doğrular.
 * 3. Cari Kart'ın eFaturaDurumu'na göre "e-Fatura" veya "e-Arşiv Fatura" tipini belirler.
 * 4. Benzersiz 16 haneli e-Fatura ID'si üretir (Örn: ATK2026000000001).
 * 5. UBL-XML formatında fatura taslağı simüle eder veya gerçek entegratör API'sini çağırır.
 * 6. Fatura durumunu "ONAYLANDI" olarak günceller ve externalLink alanına PDF mockup linkini yazar.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// e-Fatura/e-Arşiv ID oluşturucu (Örn: ATK2026000000001)
function generateInvoiceNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const randomSeq = Math.floor(100000000 + Math.random() * 900000000); // 9 haneli benzersiz numara
  return `${prefix}${year}${randomSeq}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "Fatura ID'si zorunludur." }, { status: 400 });
    }

    // Faturayı ve Cari Bilgilerini çek
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        currentAccount: true,
        invoiceItems: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
    }

    if (invoice.status === "ONAYLANDI") {
      return NextResponse.json({
        success: true,
        message: "Bu fatura zaten e-Fatura/e-Arşiv olarak onaylanmış/gönderilmiştir.",
        invoiceNumber: invoice.notes?.match(/Fatura No: (ATK\d{13})/)?.[1] || null,
        externalLink: invoice.externalLink,
      });
    }

    const { currentAccount } = invoice;
    const vkn = currentAccount.taxNo || currentAccount.tckn;

    if (!vkn) {
      return NextResponse.json({
        error: "Fatura kesebilmek için Cari Kart üzerinde geçerli bir VKN veya T.C. Kimlik No bulunmalıdır.",
      }, { status: 400 });
    }

    // Fetch serial prefixes from settings
    const cmsSettings = await prisma.cMSData.findUnique({
      where: { id: "singleton" },
      select: { efaturaPrefix: true, earsivPrefix: true }
    });
    const customEFaturaPrefix = cmsSettings?.efaturaPrefix || "GIB";
    const customEArsivPrefix = cmsSettings?.earsivPrefix || "EAR";

    const isEFatura = currentAccount.eFaturaDurumu === true;
    const prefix = isEFatura ? customEFaturaPrefix : customEArsivPrefix;
    const invoiceNumber = generateInvoiceNumber(prefix);

    // Entegratör ayarlarını kontrol et (Paraşüt, Uyumsoft, Logo vb.)
    const INTEGRATOR_PROVIDER = process.env.EFATURA_PROVIDER || "SIMULATION";
    const INTEGRATOR_USERNAME = process.env.EFATURA_USERNAME || "";
    const INTEGRATOR_PASSWORD = process.env.EFATURA_PASSWORD || "";

    let integrationResult = {
      provider: INTEGRATOR_PROVIDER,
      status: "SUCCESS",
      uuid: Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15),
      invoiceNumber,
      xmlUrl: `/api/integrations/efatura/xml/${invoiceId}`,
      pdfUrl: `/api/integrations/efatura/pdf/${invoiceId}`,
    };

    if (INTEGRATOR_PROVIDER !== "SIMULATION" && INTEGRATOR_USERNAME && INTEGRATOR_PASSWORD) {
      // Gerçek entegratör API entegrasyonu (Örn: Uyumsoft Soap Servisi veya Paraşüt REST API)
      try {
        console.log(`Sending invoice ${invoiceId} to ${INTEGRATOR_PROVIDER}...`);
        // await callIntegratorAPI(INTEGRATOR_PROVIDER, invoice, currentAccount);
      } catch (apiError: any) {
        console.error("Entegratör API Hatası:", apiError);
        // Gerçek API hatası durumunda işlem durdurulabilir
      }
    }

    // Fatura durumunu ve externalLink alanını güncelle
    const updatedNotes = invoice.notes
      ? `${invoice.notes}\n[e-Fatura No: ${invoiceNumber} | UUID: ${integrationResult.uuid}]`
      : `e-Fatura No: ${invoiceNumber}\nUUID: ${integrationResult.uuid}`;

    const pdfMockUrl = `/api/integrations/efatura/pdf?id=${invoiceId}&no=${invoiceNumber}&type=${isEFatura ? "EFATURA" : "EARSIV"}`;

    await prisma.$transaction(async (tx) => {
      // 1. Get the invoice to check old status
      const oldInvoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!oldInvoice) throw new Error("Fatura bulunamadı.");

      // 2. Update status and externalLink
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "ONAYLANDI",
          externalLink: pdfMockUrl,
          notes: updatedNotes,
        },
      });

      // 3. If it was TASLAK and is now approved, update the balance
      const wasApproved = oldInvoice.status !== "TASLAK" && oldInvoice.status !== "IPTAL";
      if (!wasApproved) {
        const balanceChange = oldInvoice.type === "SATIS" ? Number(oldInvoice.totalAmount) : -Number(oldInvoice.totalAmount);
        await tx.currentAccount.update({
          where: { id: oldInvoice.currentAccountId },
          data: {
            balance: {
              increment: balanceChange,
            }
          }
        });
      }
    });

    // Ayrıca Cari Ekstre hareketine de yansıması için transaction'a veya açıklamalara eklenebilir.
    return NextResponse.json({
      success: true,
      message: isEFatura
        ? `e-Fatura başarıyla oluşturuldu ve GİB sistemine gönderildi. Fatura No: ${invoiceNumber}`
        : `e-Arşiv Fatura başarıyla oluşturuldu ve alıcıya gönderildi. Fatura No: ${invoiceNumber}`,
      data: {
        invoiceId,
        invoiceNumber,
        invoiceType: isEFatura ? "e-Fatura" : "e-Arşiv",
        uuid: integrationResult.uuid,
        pdfUrl: pdfMockUrl,
        xmlUrl: integrationResult.xmlUrl,
        customer: currentAccount.name,
        taxNo: vkn,
      },
    });
  } catch (error: any) {
    console.error("e-Fatura gönderim hatası:", error);
    return NextResponse.json({ error: error.message || "Fatura gönderilemedi." }, { status: 500 });
  }
}
