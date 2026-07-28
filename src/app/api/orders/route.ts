import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession, isAdminRole } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { generateNextOrderId } from '@/lib/b2b-helpers';
import { emailNotificationService } from '@/lib/email-notification-service';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';

// Oturum açmış kullanıcılar kendi siparişlerini, admin ise tüm siparişleri görebilir
export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const isPersonal = searchParams.get('personal') === 'true';

    try {
      let orders;
      if (isAdminRole(session.user.role) && !isPersonal) {
        orders = await prisma.order.findMany({
          include: {
            currentAccount: true
          },
          orderBy: { date: 'desc' }
        });
      } else {
        const account = await prisma.currentAccount.findFirst({
          where: { email: session.user.email || "" }
        });

        if (!account) {
          return NextResponse.json([]);
        }

        orders = await prisma.order.findMany({
          where: { currentAccountId: account.id },
          include: {
            currentAccount: true
          },
          orderBy: { date: 'desc' }
        });
      }

      // Sort orders by date ascending to assign sequential numbers
      const sortedOrders = [...orders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const formattedOrders = orders.map(order => {
        const year = order.date ? new Date(order.date).getFullYear() : new Date().getFullYear();
        
        // Find chronological 1-based index of this order in the database
        const chronologicalIndex = sortedOrders.findIndex(o => o.id === order.id) + 1;
        const sequenceStr = String(chronologicalIndex).padStart(4, '0');
        
        const cleanId = order.id.replace(/^ORD-/, "");
        const suffix = (cleanId.length > 8 ? cleanId.slice(-8) : cleanId).toUpperCase();
        const orderNumber = order.id.startsWith("B2B-") ? order.id : `${year}-${suffix}-${sequenceStr}`;

        let cargoCompany = undefined;
        let trackingNo = undefined;
        if (order.summary && order.summary.startsWith("[")) {
          const carrierMatch = order.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);
          if (carrierMatch) {
            cargoCompany = carrierMatch[1].trim();
            if (carrierMatch[2]) {
              trackingNo = carrierMatch[2].trim();
            }
          }
        }

        return {
          id: order.id,
          orderNumber,
          client: order.currentAccount?.name || "Bilinmeyen",
          address: order.currentAccount?.address || "Açık adres bulunmamaktadır",
          phone: order.currentAccount?.phone || "Belirtilmedi",
          email: order.currentAccount?.email || "Belirtilmedi",
          taxId: order.currentAccount?.taxId || "Bireysel / 11111111111",
          taxOffice: order.currentAccount?.taxOffice || "Belirtilmedi",
          type: (order.type === "B2B" || order.type === "B2C"
            ? order.type
            : (order.currentAccount?.cariTipi === "CORPORATE" ? "B2B" : "B2C")) as "B2B" | "B2C",
          summary: order.summary || "",
          amount: Number(order.total),
          shippingFee: Number(order.shippingFee || 0),
          method: order.method || "Belirtilmedi",
          date: order.date.toLocaleString('tr-TR'),
          status: order.status,
          cargoCompany,
          trackingNo,
          trackingNumber: trackingNo
        };
      });

      return NextResponse.json(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { requireApproved: true }
);

// Sipariş oluşturma (Oturum açmış ve onaylanmış bayi/kullanıcılar için)
export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    const forwardedHost = req.headers.get('x-forwarded-host');
    const host = forwardedHost || req.headers.get('host') || 'atakaricilik.com';
    const cleanHost = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'b2b.atakaricilik.com' : host;
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const hostUrl = `${protocol}://${cleanHost}`;

    try {
      const body = await req.json();
      const { summary, amount, method, items, currentAccountId } = body;

      // Güvenlik Kontrolü: Bayi sadece kendi cari hesabına veya admin ise herhangi bir cari hesaba sipariş girebilir
      if (!isAdminRole(session.user.role)) {
        const dealerAccount = await prisma.currentAccount.findFirst({
          where: { email: session.user.email || "" }
        });
        
        if (!dealerAccount || (currentAccountId && dealerAccount.id !== currentAccountId)) {
          return NextResponse.json(
            { error: 'Kendi bayi hesabınız haricinde sipariş oluşturamazsınız.', code: 'FORBIDDEN', statusCode: 403 },
            { status: 403 }
          );
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const account = await tx.currentAccount.findUnique({
          where: { id: currentAccountId || "CARI-001" }
        });
        const orderType = account?.cariTipi === "CORPORATE" ? "B2B" : "B2C";

        const customOrderId = await generateNextOrderId(orderType, tx);
        const order = await tx.order.create({
          data: {
            id: customOrderId,
            currentAccountId: currentAccountId || "CARI-001",
            status: "Yeni",
            total: Number(amount),
            summary: summary,
            type: orderType,
            method: method
          }
        });

        // ─── Stok Düşümü ───────────────────────────────────────────
        if (items && Array.isArray(items)) {
          for (const item of items) {
            await tx.product.update({
              where: { sku: item.sku },
              data: { stock: { decrement: Number(item.quantity) } }
            });
          }
        }

        // ─── Cari Karta İşle: Transaction + Bakiye ─────────────────
        const targetAccountId = currentAccountId || "CARI-001";
        const orderTotal = Number(amount);

        // 1) Transaction (ekstre hareketi) kaydı oluştur
        await tx.transaction.create({
          data: {
            currentAccountId: targetAccountId,
            type: "SATIS",
            amount: orderTotal,
            description: `Sipariş #${order.id} — ${summary || "Satış"}`,
            paymentMethod: method || "Belirtilmedi",
            date: new Date(),
          }
        });

        // 2) Cari hesap bakiyesini artır (alacak — müşteri bize borçlu)
        await tx.currentAccount.update({
          where: { id: targetAccountId },
          data: { balance: { increment: orderTotal } }
        });

        return order;
      }, { maxWait: 10000, timeout: 30000 });


      // ─── WhatsApp Bildirimi (fire-and-forget) ──────────────────
      // Sipariş oluşturulunca carinin telefon numarasına bildirim gönder
      Promise.resolve().then(async () => {
        try {
          const targetId = currentAccountId || "CARI-001";
          const cariAccount = await prisma.currentAccount.findUnique({
            where: { id: targetId },
            select: { phone: true, name: true }
          });

          // 1. Müşteriye WhatsApp Bildirimi
          const phone = cariAccount?.phone?.replace(/[^0-9+]/g, "");
          if (phone && phone.length >= 10) {
            await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/notifications/whatsapp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: phone.startsWith("+") ? phone : `+90${phone.replace(/^0/, "")}`,
                type: "order",
                orderId: result.id,
                accountName: cariAccount?.name || "",
                amount: Number(amount),
              }),
            });
          }

          // 2. Yöneticiye E-posta ve WhatsApp Bildirimleri
          const cmsSettings = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
          const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || cmsSettings?.contactEmail;
          const adminNotificationWhatsapp = process.env.ADMIN_NOTIFICATION_WHATSAPP || cmsSettings?.contactPhone;
          const localDateString = new Date().toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

          // Sipariş içeriği metnini hazırla
          let orderItemsText = "";
          if (items && Array.isArray(items) && items.length > 0) {
            const skus = items.map(item => item.sku).filter(Boolean);
            const dbProducts = await prisma.product.findMany({
              where: { sku: { in: skus } },
              select: { sku: true, name: true }
            });
            const skuToName = new Map(dbProducts.map(p => [p.sku, p.name]));
            orderItemsText = items.map(item => `• ${skuToName.get(item.sku) || item.sku} (${item.quantity} adet)`).join("\n");
          } else {
            orderItemsText = summary || "Sipariş Detayı Bulunmuyor";
          }

          // Yönetici E-posta Gönderimi
          if (adminNotificationEmail) {
            try {
              await emailNotificationService.queueEmail(adminNotificationEmail, "admin_new_order", {
                kullanici_adi: cariAccount?.name || "Bilinmeyen Müşteri",
                siparis_no: result.id,
                siparis_tutari: Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                odeme_yontemi: method || "Belirtilmedi",
                detay_linki: `${hostUrl}/admin/orders/${result.id}`,
                tarih: localDateString,
                siparis_icerik: orderItemsText
              });
            } catch (adminMailErr) {
              console.error("Failed to queue admin order received email from quick order:", adminMailErr);
            }
          }

          // Yönetici WhatsApp Gönderimi
          try {
            await WhatsAppNotificationService.sendAdminNewOrderNotification({
              siparisNo: result.id,
              kullaniciAdi: cariAccount?.name || "Bilinmeyen Müşteri",
              siparisTutari: Number(amount),
              odemeYontemi: method || "Belirtilmedi",
              orderId: result.id,
              siparisIcerik: orderItemsText,
              adminPhone: adminNotificationWhatsapp,
              hostUrl: hostUrl
            });
          } catch (whatsappErr) {
            console.error("Failed to send admin order received WhatsApp from quick order:", whatsappErr);
          }

        } catch (e) {
          console.error("Admin order notification dispatch failed:", e);
        }
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('Error creating order:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

  },
  { requireApproved: true }
);

// Sipariş durumunu güncelleme (Sadece Admin)
export const PATCH = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { orderId, status } = body;

      // Mevcut siparişi getir (bakiye iadesi için)
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { currentAccount: true }
      });

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: orderId },
          data: { status }
        });

        // ─── İptal / İade durumunda cari bakiyeyi geri al ───────────
        if (
          existingOrder &&
          (status === "İptal" || status === "İade" || status === "Iptal") &&
          existingOrder.status !== "İptal" &&
          existingOrder.status !== "İade"
        ) {
          const reverseAmount = Number(existingOrder.total);

          // Ters Transaction kaydı
          await tx.transaction.create({
            data: {
              currentAccountId: existingOrder.currentAccountId,
              type: status === "İade" ? "IADE" : "IPTAL",
              amount: -reverseAmount,
              description: `Sipariş ${status}: #${orderId}`,
              paymentMethod: existingOrder.method || "Belirtilmedi",
              date: new Date(),
            }
          });

          // Bakiyeyi düşür
          await tx.currentAccount.update({
            where: { id: existingOrder.currentAccountId },
            data: { balance: { decrement: reverseAmount } }
          });
        }

        return order;
      }, { maxWait: 10000, timeout: 30000 });

      return NextResponse.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
