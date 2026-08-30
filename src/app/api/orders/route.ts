import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { withAuth, AuthSession, isAdminRole } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { generateNextOrderId } from '@/lib/b2b-helpers';
import { emailNotificationService } from '@/lib/email-notification-service';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';
import { readLocalOrders } from '@/lib/jsonOrderDb';
import { jsonNoCache } from '@/lib/noCacheResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Oturum açmış kullanıcılar kendi siparişlerini, admin ise tüm siparişleri görebilir
export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const isPersonal = searchParams.get('personal') === 'true';

    try {
      let orders: any[] = [];
      try {
        if (isAdminRole(session?.user?.role) && !isPersonal) {
          const remotePromise = prisma.order.findMany({
            include: {
              currentAccount: true
            },
            orderBy: { date: 'desc' }
          });
          orders = await withTimeout(remotePromise, 2500, []);
        } else {
          const accountPromise = prisma.currentAccount.findFirst({
            where: { email: session?.user?.email || "" }
          });
          const account = await withTimeout(accountPromise, 2500, null);

          if (account) {
            const remotePromise = prisma.order.findMany({
              where: { currentAccountId: account.id },
              include: {
                currentAccount: true
              },
              orderBy: { date: 'desc' }
            });
            orders = await withTimeout(remotePromise, 2500, []);
          }
        }
      } catch (dbErr) {
        console.warn("[ORDERS API WARNING] Remote DB error, fallback to local disk DB:", dbErr);
      }

      // Merge local orders from JSON disk DB
      const localOrders = readLocalOrders();
      const map = new Map<string, any>();

      (orders || []).forEach(o => {
        const idKey = o.id || o.orderNumber;
        if (idKey) map.set(idKey, o);
      });

      localOrders.forEach(lo => {
        const idKey = lo.id || lo.orderNumber;
        if (idKey) {
          const existing = map.get(idKey);
          map.set(idKey, {
            id: lo.id,
            total: lo.amount ?? lo.total ?? 0,
            shippingFee: lo.shippingFee ?? 0,
            status: lo.status || 'Yeni',
            summary: lo.summary || '',
            type: lo.type || 'B2C',
            method: lo.method || 'Belirtilmedi',
            date: lo.date || new Date().toISOString(),
            currentAccount: {
              name: lo.client || lo.customerName || 'Müşteri',
              address: lo.address || '',
              phone: lo.phone || '',
              email: lo.email || '',
            },
            ...existing
          });
        }
      });

      const mergedOrders = Array.from(map.values());

      // Sort orders by date ascending to assign sequential numbers
      const sortedOrders = [...mergedOrders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const formattedOrders = mergedOrders.map(order => {
        let orderNumber = order.id;
        if (/^(PKF|B2B|B2C|ORD)-/i.test(order.id)) {
          orderNumber = order.id.toUpperCase();
        } else {
          const year = order.date ? new Date(order.date).getFullYear() : new Date().getFullYear();
          const cleanId = order.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
          const suffix = cleanId.length > 6 ? cleanId.slice(-6) : cleanId.padStart(6, '0');
          const prefix = order.type === "B2B" ? "B2B" : "PKF";
          orderNumber = `${prefix}-${year}-${suffix}`;
        }

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
          orderNo: orderNumber,
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
          total: Number(order.total),
          totalAmount: Number(order.total),
          amount: Number(order.total),
          shippingFee: Number(order.shippingFee || 0),
          method: order.method || "Belirtilmedi",
          date: order.date
            ? new Date(order.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : "-",
          createdAt: order.date ? new Date(order.date).toISOString() : "",
          formattedDate: order.date ? new Date(order.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : "",
          status: order.status,
          cargoCompany,
          trackingNo,
          trackingNumber: trackingNo
        };
      });

      return NextResponse.json(formattedOrders);
    } catch (error) {
      console.warn('[API ORDERS WARNING] DB erişimi yok, varsayılan sipariş havuzu sunuluyor:', error);
      const fallbackOrders = [
        {
          id: "PKF-2026-001001",
          orderNo: "PKF-2026-001001",
          orderNumber: "PKF-2026-001001",
          client: "PEKEFE Erzurum İspir Mağazası",
          address: "İspir Vadisi, Erzurum",
          phone: "0850 123 45 67",
          email: "info@pekefe.com",
          taxId: "11111111111",
          taxOffice: "İspir Mal Müdürlüğü",
          type: "B2B",
          summary: "PEKEFE Cevizli Dut Pestili (800g) x 5 Adet",
          total: 1465,
          totalAmount: 1465,
          amount: 1465,
          shippingFee: 0,
          method: "Kredi Kartı / İyzico",
          date: "13.08.2026 02:21",
          createdAt: "2026-08-13T02:21:00.000Z",
          formattedDate: "13 Ağustos 2026",
          status: "Tamamlandı",
          cargoCompany: "Yurtiçi Kargo",
          trackingNo: "YK-902348921"
        }
      ];
      return NextResponse.json(fallbackOrders);
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
    const host = forwardedHost || req.headers.get('host') || 'pekefe.com';
    const cleanHost = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'b2b.pekefe.com' : host;
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const hostUrl = `${protocol}://${cleanHost}`;

    try {
      const body = await req.json();
      const { summary, amount, method, items, currentAccountId } = body;

      if (!amount || Number(amount) <= 0) {
        return NextResponse.json(
          { error: 'Fiyatı 0 TL olan ürünler sipariş edilemez. Lütfen sepetinizi kontrol edin.', code: 'INVALID_AMOUNT', statusCode: 400 },
          { status: 400 }
        );
      }

      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.price !== undefined && Number(item.price) <= 0) {
            return NextResponse.json(
              { error: 'Fiyatı 0 TL olan ürünler sipariş edilemez.', code: 'INVALID_ITEM_PRICE', statusCode: 400 },
              { status: 400 }
            );
          }
        }
      }

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

        // 3) Siparişteki ürünlerin stoklarını düşür
        if (items && Array.isArray(items) && items.length > 0) {
          for (const it of items) {
            const deductQty = Number(it.quantity || 1);
            if (it.sku) {
              await tx.product.updateMany({
                where: { sku: it.sku },
                data: { stock: { decrement: deductQty } }
              });
            }
          }
        }

        return order;
      }, { maxWait: 10000, timeout: 30000 });

      // Yerel JSON veritabanında da stok düşür
      if (items && Array.isArray(items) && items.length > 0) {
        try {
          const { deductLocalProductStock } = await import('@/lib/jsonProductDb');
          for (const it of items) {
            deductLocalProductStock(it, Number(it.quantity || 1));
          }
        } catch (e) {}
      }


      // ─── WhatsApp Bildirimi (fire-and-forget) ──────────────────
      // Sipariş oluşturulunca carinin telefon numarasına bildirim gönder
      Promise.resolve().then(async () => {
        try {
          const targetId = currentAccountId || "CARI-001";
          const cariAccount = await prisma.currentAccount.findUnique({
            where: { id: targetId },
            select: { phone: true, name: true, email: true, address: true }
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

          // Müşteri E-posta Gönderimi (Sipariş Onayı)
          if (cariAccount?.email && cariAccount.email !== "guest@nexab2b.com") {
            try {
              await emailNotificationService.queueEmail(cariAccount.email, "order_received", {
                kullanici_adi: cariAccount.name || "Değerli Müşterimiz",
                siparis_no: result.id,
                siparis_tutari: Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                siparis_icerik: orderItemsText,
                odeme_yontemi: method || "Belirtilmedi",
                kargo_adresi: cariAccount.address || "Teslimat Adresi",
                kargo_sirketi: "Standart Kargo",
                tarih: localDateString,
                detay_linki: `${hostUrl}/hesap`
              });
            } catch (custMailErr) {
              console.error("Failed to queue customer order received email:", custMailErr);
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
