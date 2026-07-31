import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { generateUBLXML, InvoiceData } from '@/modules/accounting/server/ubl-generator';
import crypto from 'crypto';

// Fatura için e-Fatura UBL XML Üret (Sadece Admin)
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params, session }: { params: { id: string }, session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { id } = await params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { currentAccount: true }
      });

      if (!invoice) {
        return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 });
      }

      let items = [];
      try {
        items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items as any);
      } catch (e) {}

      let companyName = "PEKEFE GERÇEK HASAT TİCARET A.Ş.";
      let companyVkn = "1234567890";
      let companyTaxOffice = "KAYSERİ";
      let companyAddress = "Merkez Mah. Apikültür Cad. No:44";

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

      const supplier = {
        name: companyName,
        taxId: companyVkn,
        taxOffice: companyTaxOffice,
        address: companyAddress,
        city: "KAYSERİ",
        country: "TÜRKİYE"
      };

      const customer = {
        name: invoice.currentAccount.name,
        taxId: invoice.currentAccount.taxId || "11111111111",
        taxOffice: invoice.currentAccount.taxOffice || "BİLİNMEYEN",
        address: invoice.currentAccount.address || "Belirtilmemiş",
        city: "TÜRKİYE",
        country: "TÜRKİYE"
      };

      // Format items
      const formattedItems = items.map((it: any) => ({
        name: it.name || "Hizmet/Ürün",
        quantity: Number(it.quantity || 1),
        unitCode: "C62",
        price: Number(it.price || 0),
        taxRate: Number(it.taxRate || 20)
      }));

      // If items are empty, create a dummy item to satisfy schema
      if (formattedItems.length === 0) {
        formattedItems.push({
          name: "Muhtelif Ürün/Hizmet Satışı",
          quantity: 1,
          unitCode: "C62",
          price: invoice.totalAmount.toNumber() - invoice.taxAmount.toNumber(),
          taxRate: invoice.taxAmount.toNumber() > 0 ? 20 : 0
        });
      }

      let orderNumber = undefined;
      let orderDateFormatted = undefined;

      if (invoice.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: invoice.orderId }
        });
        if (order) {
          const allOrders = await prisma.order.findMany({
            orderBy: { date: 'asc' }
          });
          const orderYear = order.date ? new Date(order.date).getFullYear() : new Date().getFullYear();
          const chronologicalIndex = allOrders.findIndex(o => o.id === order.id) + 1;
          const sequenceStr = String(chronologicalIndex).padStart(4, '0');
          const cleanId = order.id.replace(/^ORD-/, "");
          const suffix = (cleanId.length > 8 ? cleanId.slice(-8) : cleanId).toUpperCase();
          orderNumber = `${orderYear}-${suffix}-${sequenceStr}`;
          orderDateFormatted = order.date ? new Date(order.date).toISOString().split('T')[0] : "";
        }
      }

      const isoDate = invoice.date.toISOString();

      const ublData: InvoiceData = {
        id: invoice.id,
        uuid: crypto.randomUUID(),
        issueDate: isoDate.split("T")[0],
        issueTime: isoDate.split("T")[1].substring(0, 8),
        invoiceTypeCode: invoice.type === "Alış Faturası" ? "IADE" : "SATIS",
        currencyCode: "TRY",
        orderNumber,
        orderDate: orderDateFormatted,
        customer,
        supplier,
        items: formattedItems
      };

      const xml = generateUBLXML(ublData);

      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="Fatura_${invoice.id}.xml"`
        }
      });

    } catch (error: any) {
      console.error("UBL Generate Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
