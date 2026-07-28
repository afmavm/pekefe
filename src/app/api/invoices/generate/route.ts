import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUBLXML, InvoiceData } from '@/modules/accounting/server/ubl-generator';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { orderId, type } = await request.json();
    const docType = type || "e-Fatura";

    // 1. Fetch Order with Relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        currentAccount: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    // Fetch all orders to determine chronological index for the sequential order number
    const allOrders = await prisma.order.findMany({
      orderBy: { date: 'asc' }
    });
    const orderYear = order.date ? new Date(order.date).getFullYear() : new Date().getFullYear();
    const chronologicalIndex = allOrders.findIndex(o => o.id === order.id) + 1;
    const sequenceStr = String(chronologicalIndex).padStart(4, '0');
    const cleanId = order.id.replace(/^ORD-/, "");
    const suffix = (cleanId.length > 8 ? cleanId.slice(-8) : cleanId).toUpperCase();
    const orderNumber = `${orderYear}-${suffix}-${sequenceStr}`;
    const orderDateFormatted = order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // 2. Prepare Data for UBL
    const invoiceUuid = uuidv4();
    const invoiceId = `NEX${new Date().getFullYear()}${Math.floor(Math.random() * 900000000 + 100000000)}`;
    
    // Query dynamic CMS site name for supplier company branding
    let companyName = "ATAK ARICILIK LİMİTED ŞİRKETİ";
    let companyVkn = "1234567890";
    let companyTaxOffice = "Boğaziçi";
    let companyAddress = "Kayseri OSB 1. Cadde No: 5";

    try {
      const cmsSettings = await prisma.cMSData.findUnique({
        where: { id: 'singleton' }
      });
      if (cmsSettings) {
        if (cmsSettings.companyName && cmsSettings.companyName.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(cmsSettings.companyName);
            companyName = parsed.name || companyName;
            companyVkn = parsed.vkn || companyVkn;
            companyTaxOffice = parsed.taxOffice || companyTaxOffice;
          } catch (e) {}
        } else if (cmsSettings.companyName) {
          companyName = cmsSettings.companyName;
        } else if (cmsSettings.siteName) {
          companyName = `${cmsSettings.siteName.toUpperCase()} LİMİTED ŞİRKETİ`;
        }

        if (cmsSettings.contactAddress) {
          companyAddress = cmsSettings.contactAddress;
        }
      }
    } catch (e) {}

    const invoiceData: InvoiceData = {
      id: invoiceId,
      uuid: invoiceUuid,
      issueDate: new Date().toISOString().split('T')[0],
      issueTime: new Date().toLocaleTimeString('tr-TR'),
      invoiceTypeCode: docType === "e-İrsaliye" ? "SEVK" : "SATIS",
      currencyCode: "TRY",
      orderNumber,
      orderDate: orderDateFormatted,
      supplier: {
        name: companyName,
        taxId: companyVkn,
        taxOffice: companyTaxOffice,
        address: companyAddress,
        city: "Kayseri",
        country: "Türkiye"
      },
      customer: {
        name: order.currentAccount.name,
        taxId: order.currentAccount.taxId || "2222222222",
        taxOffice: order.currentAccount.taxOffice || "Vergi Dairesi",
        address: order.currentAccount.address || "Müşteri Adres Bilgisi Kayıtlı Değil",
        city: "İstanbul",
        country: "Türkiye"
      },
      items: [
        {
          name: order.summary || "B2B Sipariş İçeriği",
          quantity: 1,
          unitCode: "C62",
          price: order.total.toNumber() / 1.20,
          taxRate: 20
        }
      ]
    };

    // 3. Generate XML
    const xml = generateUBLXML(invoiceData);

    // 4. Save Invoice, Update Balance and Create Transaction
    const { savedInvoice } = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          id: invoiceId,
          orderId: order.id,
          currentAccountId: order.currentAccountId,
          date: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          totalAmount: order.total,
          taxAmount: order.total.toNumber() - (order.total.toNumber() / 1.20),
          status: "Gönderildi",
          type: docType,
          externalLink: `/api/invoices/download/${invoiceId}`,
          items: JSON.stringify(invoiceData.items)
        }
      });

      // Sevk İrsaliyesi doesn't alter financial balance, only invoices do
      if (docType !== "e-İrsaliye") {
        await tx.currentAccount.update({
          where: { id: order.currentAccountId },
          data: { balance: { increment: order.total } }
        });
      }

      let transactionType = "Satış Faturası";
      if (docType === "e-Arşiv") transactionType = "e-Arşiv Satış Faturası";
      else if (docType === "e-İrsaliye") transactionType = "Sevk İrsaliyesi";

      await tx.transaction.create({
        data: {
          currentAccountId: order.currentAccountId,
          type: transactionType,
          amount: docType === "e-İrsaliye" ? 0 : order.total,
          description: `Sipariş #${orderNumber} için ${docType} oluşturuldu. Document ID: ${invoiceId}`,
          date: new Date()
        }
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "Kargolandı" }
      });

      return { savedInvoice: inv };
    }, { maxWait: 10000, timeout: 30000 });

    return NextResponse.json({ 
      success: true, 
      invoiceId: savedInvoice.id,
      xml: xml 
    });

  } catch (error) {
    console.error('Invoice Generation Error:', error);
    return NextResponse.json({ error: 'Fatura oluşturulurken bir hata oluştu.' }, { status: 500 });
  }
}
