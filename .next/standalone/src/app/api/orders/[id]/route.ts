import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        date: true,
        total: true,
        type: true,
        shippingFee: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching single order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const body = await request.json();
    const { cargoCompany, trackingNo, status } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { currentAccount: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    // ── Özet güncelleme (kargo bilgisi) ──────────────────────────
    let cleanSummary = order.summary || "";
    if (cleanSummary.startsWith("[")) {
      cleanSummary = cleanSummary.replace(/^\[[^\]]+\]\s*/, "");
    }
    let newSummary = cleanSummary;
    if (cargoCompany) {
      newSummary = trackingNo
        ? `[${cargoCompany} | ${trackingNo}] ${cleanSummary}`
        : `[${cargoCompany}] ${cleanSummary}`;
    }

    const newStatus = status || order.status;

    let invoiceCreatedId: string | null = null;

    const result = await prisma.$transaction(async (tx) => {
      // 1) Siparişi güncelle
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus, summary: newSummary }
      });

      // ── Otomatik Fatura Oluşturma ────────────────────────────────
      // Sipariş "Tamamlandı" durumuna geçince ve henüz fatura yoksa
      const COMPLETED_STATUSES = ["Tamamlandı", "Teslim Edildi", "Kargoya Verildi"];
      const CANCELLED_STATUSES  = ["İptal", "Iptal", "İade", "IADE"];

      if (
        COMPLETED_STATUSES.includes(newStatus) &&
        !COMPLETED_STATUSES.includes(order.status) // Daha önce tamamlanmamışsa
      ) {
        // Bu sipariş için zaten fatura var mı?
        const existingInvoice = await tx.invoice.findFirst({
          where: { orderId: orderId }
        });

        if (!existingInvoice && order.currentAccountId) {
          const orderTotal   = Number(order.total);
          const kdvOrani     = 0.20; // Varsayılan %20 KDV
          const netTutar     = orderTotal / (1 + kdvOrani);
          const kdvTutar     = orderTotal - netTutar;

          // Vade tarihi: sipariş tarihinden 30 gün
          const dueDate = new Date(order.date);
          dueDate.setDate(dueDate.getDate() + 30);

          const newInv = await tx.invoice.create({
            data: {
              orderId:          orderId,
              currentAccountId: order.currentAccountId,
              date:             new Date(),
              dueDate:          dueDate,
              totalAmount:      orderTotal,
              taxAmount:        Number(kdvTutar.toFixed(2)),
              status:           "KESILDI",
              type:             order.type === "B2B" ? "SATIS" : "SATIS",
              notes:            `Sipariş #${orderId} için otomatik oluşturuldu.`,
              items:            [{
                name:        cleanSummary || "Sipariş Kalemi",
                quantity:    1,
                unitPrice:   Number(netTutar.toFixed(2)),
                vatRate:     20,
                totalAmount: orderTotal,
              }],
              invoiceItems: {
                create: [{
                  name:        cleanSummary || "Sipariş Kalemi",
                  quantity:    1,
                  unitPrice:   Number(netTutar.toFixed(2)),
                  vatRate:     20,
                  totalAmount: orderTotal,
                }]
              }
            }
          });
          invoiceCreatedId = newInv.id;
        }
      }

      // ── İptal/İade durumunda cari bakiyeyi geri al ───────────────
      if (
        CANCELLED_STATUSES.includes(newStatus) &&
        !CANCELLED_STATUSES.includes(order.status)
      ) {
        const reverseAmount = Number(order.total);

        await tx.transaction.create({
          data: {
            currentAccountId: order.currentAccountId,
            type:             newStatus.toUpperCase().includes("IADE") ? "IADE" : "IPTAL",
            amount:           -reverseAmount,
            description:      `Sipariş ${newStatus}: #${orderId}`,
            paymentMethod:    order.method || "Belirtilmedi",
            date:             new Date(),
          }
        });

        await tx.currentAccount.update({
          where: { id: order.currentAccountId },
          data:  { balance: { decrement: reverseAmount } }
        });
      }

      return updatedOrder;
    });

    // ─── e-Fatura Gönderimi & WhatsApp Bildirimleri (fire-and-forget) ───
    if (invoiceCreatedId) {
      Promise.resolve().then(async () => {
        try {
          const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          
          // 1) e-Fatura gönder
          const eInvoiceRes = await fetch(`${appUrl}/api/integrations/efatura`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId: invoiceCreatedId }),
          });
          const eInvoiceData = await eInvoiceRes.json();

          // 2) WhatsApp ile Fatura PDF Linkini Gönder (Cari Kartta telefon varsa)
          if (eInvoiceData.success && order.currentAccount?.phone) {
            const cleanPhone = order.currentAccount.phone.replace(/[^0-9+]/g, '');
            if (cleanPhone) {
              await fetch(`${appUrl}/api/notifications/whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone: cleanPhone,
                  template: 'invoice',
                  invoiceNo: eInvoiceData.data.invoiceNumber,
                  pdfUrl: `${appUrl}${eInvoiceData.data.pdfUrl}`,
                  amount: Number(order.total),
                }),
              });
            }
          }
        } catch (err) {
          console.error('Order status PATCH trigger communications error:', err);
        }
      });
    }

    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    console.error('Error patching order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
