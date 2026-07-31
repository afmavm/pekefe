import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentService, PaymentRequest } from '@/modules/orders/server/payment-service';
import { emailNotificationService } from '@/lib/email-notification-service';
import { WhatsAppNotificationService } from '@/lib/whatsapp-service';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { z } from 'zod';
import { PriceCalculator } from '@/modules/catalog/server/price-calculator';
import { calculateCartDiscounts } from '@/modules/orders/server/discount-calculator';
import { withRateLimit } from '@/lib/rate-limit';
import { generateNextOrderId } from '@/lib/b2b-helpers';

const CheckoutSchema = z.object({
  cart: z.array(z.any()).min(1, "Sepet boş olamaz"),
  cartTotal: z.number().min(0, "Geçersiz toplam tutar"),
  paymentMethod: z.enum(["creditCard", "bankTransfer", "openAccount"]),
  couponCode: z.string().optional(),
  couponDiscount: z.number().optional(),
  cardNumber: z.string().optional(),
  expDate: z.string().optional(),
  cvv: z.string().optional(),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  address: z.string().min(10, "Açık adres gereklidir"),
  shippingFee: z.number().optional(),
  selectedCarrierName: z.string().optional(),
  shippingAddress: z.object({
    addressTitle: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    city: z.string(),
    district: z.string(),
    fullAddress: z.string()
  }).optional(),
  billingAddress: z.object({
    addressTitle: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    city: z.string(),
    district: z.string(),
    fullAddress: z.string()
  }).optional()
});

async function findProductForCartItem(dbClient: any, item: any) {
  if (!item) return null;

  const candidateIds: string[] = [];
  const candidateSkus: string[] = [];

  // 1. Explicit productId
  if (item.productId && typeof item.productId === "string" && item.productId.trim()) {
    candidateIds.push(item.productId.trim());
  }

  // 2. Exact item.id
  if (item.id && typeof item.id === "string" && item.id.trim()) {
    const rawId = item.id.trim();
    candidateIds.push(rawId);

    // 3. Prefix before underscore if item.id is formatted like "productId_variantId"
    if (rawId.includes("_")) {
      const prefix = rawId.split("_")[0];
      if (prefix && prefix.trim()) {
        candidateIds.push(prefix.trim());
      }
    }
  }

  // 4. Explicit item.sku
  if (item.sku && typeof item.sku === "string" && item.sku.trim()) {
    candidateSkus.push(item.sku.trim());
  }

  // Query 1: Match by ID or SKU candidates
  if (candidateIds.length > 0 || candidateSkus.length > 0) {
    let product = await dbClient.product.findFirst({
      where: {
        OR: [
          ...candidateIds.map((id) => ({ id })),
          ...candidateSkus.map((sku) => ({ sku })),
        ],
      },
    });

    if (product) return product;
  }

  // Query 2: Fallback by Product Name
  if (item.name && typeof item.name === "string" && item.name.trim()) {
    const rawName = item.name.trim();
    // Clean name: strip parenthetical variant labels like "(500 Gr)" or "(1 Kg)"
    const cleanName = rawName.replace(/\s*\([^)]*\)/gi, "").trim();

    if (cleanName) {
      let product = await dbClient.product.findFirst({
        where: {
          OR: [
            { name: { equals: cleanName } },
            { name: { equals: rawName } },
            { name: { contains: cleanName } },
          ],
        },
      });
      if (product) return product;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "checkoutLimit");
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host') || 'atakaricilik.com';
    const cleanHost = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'b2b.atakaricilik.com' : host;
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const hostUrl = `${protocol}://${cleanHost}`;

    const body = await request.json();
    const resultSchema = CheckoutSchema.safeParse(body);

    if (!resultSchema.success) {
      return NextResponse.json({ error: 'Geçersiz veri: ' + resultSchema.error.issues[0].message }, { status: 400 });
    }

    const { 
      cart, cartTotal, paymentMethod, couponCode, couponDiscount = 0,
      cardNumber, expDate, cvv, name, phone, address,
      shippingFee = 0, selectedCarrierName = "",
      shippingAddress, billingAddress
    } = resultSchema.data;

    // --- SERVER-SIDE PRICE VALIDATION ---
    const session = await getServerSession(authOptions);
    const customerEmail = session?.user?.email || "guest@nexab2b.com";

    let customerAccount = null;
    if (customerEmail !== "guest@nexab2b.com") {
      customerAccount = await prisma.currentAccount.findFirst({
        where: { email: customerEmail }
      });
    }

    // CMS ayarlarını al
    const cmsSettings = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
    const globalPricingRules = cmsSettings?.pricingRules || "[]";

    // Discount ayarlarını al
    const discountSettings = {
      cartDiscountType: (cmsSettings?.cartDiscountType || "none") as "none" | "percentage" | "fixed",
      cartDiscountValue: cmsSettings?.cartDiscountValue || 0,
      cartDiscountMinAmount: cmsSettings?.cartDiscountMinAmount || 0,
      bankTransferDiscountRate: cmsSettings?.bankTransferDiscountRate || 0,
    };

    // B2B Group parameters resolution
    let isB2BUser = false;
    let b2bGroupDiscountRate = 0;
    let b2bTieredRules: any[] = [];
    let b2bPrices: any[] = [];

    if (customerEmail !== "guest@nexab2b.com") {
      const dbUser = await prisma.user.findUnique({
        where: { email: customerEmail },
        include: {
          b2bGroup: {
            include: {
              tieredPricing: true,
              b2bPrices: true
            }
          }
        }
      });

      if (dbUser && (dbUser.customer_type === 'b2b' || dbUser.role === 'DEALER')) {
        isB2BUser = true;
        if (dbUser.b2bGroup) {
          b2bGroupDiscountRate = dbUser.b2bGroup.base_discount_rate;
          b2bTieredRules = dbUser.b2bGroup.tieredPricing;
          b2bPrices = dbUser.b2bGroup.b2bPrices;
        }
      }

      if (customerAccount) {
        isB2BUser = true;
        if (b2bGroupDiscountRate === 0) {
          b2bGroupDiscountRate = customerAccount.discountRate || 0;
        }
        if ((!b2bTieredRules || b2bTieredRules.length === 0) && (!b2bPrices || b2bPrices.length === 0) && customerAccount.dealerGroup) {
          const groupByName = await prisma.b2BGroup.findFirst({
            where: { group_name: customerAccount.dealerGroup },
            include: {
              tieredPricing: true,
              b2bPrices: true
            }
          });
          if (groupByName) {
            b2bGroupDiscountRate = groupByName.base_discount_rate;
            b2bTieredRules = groupByName.tieredPricing;
            b2bPrices = groupByName.b2bPrices;
          }
        }
      }
    }

    // Server tarafında ürün fiyatlarını ve indirimlerini hesapla
    const serverCartItems: Array<{
      id: string | number;
      name: string;
      price: number;
      quantity: number;
      cartDiscountRate: number;
    }> = [];

    for (const item of cart) {
      const product = await findProductForCartItem(prisma, item);

      if (!product) {
        return NextResponse.json({ 
          error: `Ürün bulunamadı: ${item.name || item.id}` 
        }, { status: 400 });
      }

      let basePriceVal = product.price.toNumber();
      if (isB2BUser) {
        const groupPrice = b2bPrices.find(bp => bp.productId === product.id);
        if (groupPrice) {
          basePriceVal = Number(groupPrice.price);
        } else if (product.b2b_base_price && Number(product.b2b_base_price) > 0) {
          basePriceVal = Number(product.b2b_base_price);
        }
      }

      const groupSpecificRules = b2bTieredRules.filter(tr => tr.productId === product.id);

      // quantity=1 ile birim fiyat hesapla (products API ile tutarlı)
      // Kademeli miktar indirimleri calculateCartDiscounts içinde otomatik uygulanır
      const effectivePrice = PriceCalculator.calculateEffectivePrice({
        basePrice: basePriceVal,
        cost: product.cost.toNumber(),
        dealerGroup: customerAccount?.dealerGroup || "Standart",
        priceGroup: customerAccount?.priceGroup || "Liste",
        priceFormula: customerAccount?.priceFormula,
        quantity: 1,
        pricingRules: globalPricingRules as any,
        customDiscountRate: customerAccount?.discountRate,
        b2bGroupDiscountRate: b2bGroupDiscountRate,
        b2bTieredPricingRules: groupSpecificRules
      });

      serverCartItems.push({
        id: product.id,
        name: product.name,
        price: effectivePrice,
        quantity: Number(item.quantity),
        cartDiscountRate: product.cartDiscountRate || 0,
      });
    }

    // Merkezi discount motoru ile server-side toplam hesapla
    const serverBreakdown = calculateCartDiscounts(
      serverCartItems,
      discountSettings,
      paymentMethod === "openAccount" ? "creditCard" : paymentMethod,
      shippingFee,
      couponDiscount
    );

    const serverTotal = Math.round(serverBreakdown.grandTotal * 100) / 100;
    const clientTotal = Math.round(cartTotal * 100) / 100;

    // Güvenlik: Server kendi fiyatını kullanır (verifiedTotal = serverTotal)
    // Ürün fiyatları DB'den çekiliyor, gerçek güvenlik PriceCalculator'da sağlanıyor
    // Client total sadece loglama için kullanılır
    if (serverTotal > 0) {
      console.log(`[CHECKOUT] Client: ${clientTotal} TL, Server: ${serverTotal} TL, Fark: ${Math.abs(serverTotal - clientTotal).toFixed(2)} TL`);
    }

    const verifiedTotal = serverTotal;

    // B2B validation block for open account
    if (paymentMethod === "openAccount") {
      if (!customerAccount) {
        return NextResponse.json({ error: "Açık hesap ödemesi sadece B2B bayileri için geçerlidir." }, { status: 400 });
      }

      // Calculate overdue debt (vadesi geçen borç)
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          currentAccountId: customerAccount.id,
          status: { notIn: ["ODENDI", "IPTAL"] },
          type: { not: "ALIS" },
          dueDate: { lt: new Date() }
        }
      });
      const overdueDebt = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0);

      // Business Rule: Bloke Durumu && Overdue Debt > 0
      if (customerAccount.blokeDurumu && overdueDebt > 0) {
        return NextResponse.json({
          error: `Yeni siparişiniz bloke edilmiştir. Vadesi geçen borç tutarınız: ${overdueDebt.toLocaleString("tr-TR")} TL. B2B açık hesap siparişi girmek için lütfen borç bakiyenizi kapatın.`
        }, { status: 400 });
      }

      // Risk limit check
      if (customerAccount.riskLimit !== null && customerAccount.riskLimit !== undefined) {
        const outstandingDebt = customerAccount.balance.toNumber() < 0 ? -customerAccount.balance.toNumber() : 0;
        const newOutstandingDebt = outstandingDebt + verifiedTotal;
        const riskLimitNum = customerAccount.riskLimit.toNumber();
        if (newOutstandingDebt > riskLimitNum) {
          return NextResponse.json({
            error: `Risk limitiniz yetersizdir. Kalan limitiniz: ${(riskLimitNum - outstandingDebt).toLocaleString("tr-TR")} TL. Sipariş Tutarı: ${verifiedTotal.toLocaleString("tr-TR")} TL.`
          }, { status: 400 });
        }
      }
    }

    // Determine order type based on customer group / cari tipi
    const orderType = (customerAccount && customerAccount.cariTipi === "CORPORATE") ? "B2B" : "B2C";

    // Generate sequential B2B or B2C order ID
    const customOrderId = await generateNextOrderId(orderType);

    // 1. Ödeme işlemi (kredi kartı)
    let transactionId = paymentMethod === "openAccount" ? "OPEN_ACCOUNT" : "BANK_TRANSFER";
    if (paymentMethod === "creditCard") {
      if (!cardNumber || !expDate || !cvv) {
        return NextResponse.json({ error: "Kredi kartı bilgileri eksik." }, { status: 400 });
      }

      const [rawMonth, rawYear] = (expDate || "").split('/');
      const cleanMonth = (rawMonth || "").trim();
      let cleanYear = (rawYear || "").trim();
      if (cleanYear.length === 2) cleanYear = `20${cleanYear}`;

      const paymentReq: PaymentRequest = {
        cardNumber: cardNumber.replace(/\s+/g, ""),
        expireMonth: cleanMonth,
        expireYear: cleanYear,
        cvv: cvv.trim(),
        amount: verifiedTotal,
        orderId: customOrderId,
        customerName: name,
        customerEmail: customerEmail
      };

      const paymentRes = await PaymentService.processPayment(paymentReq);
      
      if (paymentRes.status === "failure") {
        return NextResponse.json({ error: paymentRes.errorMessage }, { status: 400 });
      }
      transactionId = paymentRes.transactionId!;
    }

    // 2. Veritabanı işlemleri
    const result = await prisma.$transaction(async (tx) => {
      let account = null;
      if (customerEmail !== "guest@nexab2b.com") {
        account = await tx.currentAccount.findFirst({
          where: { email: customerEmail }
        });
      }

      if (account) {
        account = await tx.currentAccount.update({
          where: { id: account.id },
          data: {
            phone: phone || account.phone,
            address: address || account.address,
          }
        });
      } else {
        let resolvedCariTipi = "INDIVIDUAL";
        let resolvedType = "B2C";
        if (customerEmail !== "guest@nexab2b.com") {
          const dbUser = await tx.user.findUnique({
            where: { email: customerEmail }
          });
          if (dbUser && (dbUser.customer_type === 'b2b' || dbUser.role === 'DEALER')) {
            resolvedCariTipi = "CORPORATE";
            resolvedType = "B2B";
          }
        }
        
        account = await tx.currentAccount.create({
          data: {
            name: name,
            email: customerEmail !== "guest@nexab2b.com" ? customerEmail : null,
            phone: phone,
            address: address,
            type: resolvedType,
            cariTipi: resolvedCariTipi
          }
        });
      }

      if (!account) throw new Error("Cari hesap oluşturulamadı.");

      const order = await tx.order.create({
        data: {
          id: customOrderId,
          currentAccountId: account.id,
          total: verifiedTotal,
          shippingFee: shippingFee,
          status: paymentMethod === "bankTransfer" ? "Ödeme Bekliyor" : "Yeni",
          summary: `${selectedCarrierName ? `[${selectedCarrierName}] ` : ''}` + cart.map((item: any) => `${item.name} (${item.quantity})`).join(", "),
          type: orderType,
          method: paymentMethod === "creditCard" ? "Kredi Kartı" : paymentMethod === "bankTransfer" ? "Banka Havalesi" : "Açık Hesap"
        }
      });

      // Sadakat Puanı Kazanımı (Pekefe Lezzet Puanı: Her 1 TL Harcama = 1 PTS Puan)
      const earnedLoyaltyPoints = Math.floor(verifiedTotal);
      if (earnedLoyaltyPoints > 0 && account) {
        account = await tx.currentAccount.update({
          where: { id: account.id },
          data: {
            loyaltyPoints: { increment: earnedLoyaltyPoints }
          }
        });
      }

      // Yeni Sipariş Bildirimi Ekle
      try {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const notifTitle = `${account.name} cari hesabından yeni sipariş.`;
        const notifMsg = `${name} adlı müşteriden yeni sipariş alındınız. Sipariş Tutarı: ${verifiedTotal.toLocaleString("tr-TR")} ₺, Sipariş Tarihi: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR")}`;
        
        await tx.$executeRawUnsafe(
          `INSERT INTO admin_notifications (id, title, message, type, isRead, createdAt, orderId) 
           VALUES (?, ?, ?, 'ORDER', 0, ?, ?)`,
          notifId,
          notifTitle,
          notifMsg,
          new Date().toISOString(),
          customOrderId
        );
      } catch (err) {
        console.error("Failed to create admin notification:", err);
      }

      // Stok güncelleme ve Optimistic Locking
      for (const item of cart) {
        const product = await findProductForCartItem(tx, item);

        if (product) {
          if (product.stock < Number(item.quantity)) {
            throw new Error(`Yetersiz stok - Ürün: ${product.name} (Mevcut: ${product.stock}, Talep: ${item.quantity})`);
          }

          // Her ödeme türünde Product.stock düş (stok her zaman eksilmeli)
          const updateResult = await tx.product.updateMany({
            where: { 
              id: product.id,
              version: product.version
            },
            data: { 
              stock: product.stock - Number(item.quantity),
              version: { increment: 1 }
            }
          });

          if (updateResult.count === 0) {
            throw new Error(`Stok güncelleme çakışması (Concurrency Conflict) - Ürün: ${product.name}. Lütfen tekrar deneyin.`);
          }

          // Stok hareketi kaydı (tüm ödeme türleri)
          await tx.stockTransaction.create({
            data: {
              productId: product.id,
              type: "SALE",
              quantity: -Number(item.quantity), // negative = çıkış
              description: `Satış yapıldı (Sipariş: ${order.id}) - ${paymentMethod === "bankTransfer" ? "Banka Havalesi" : paymentMethod === "creditCard" ? "Kredi Kartı" : "Açık Hesap"}`,
              moduleSource: "API"
            }
          });

          // Havale için ek olarak StockLocation'da rezervasyon da oluştur
          if (paymentMethod === "bankTransfer") {
            let location = await tx.stockLocation.findFirst({
              where: { productId: product.id }
            });
            if (location) {
              await tx.stockLocation.update({
                where: { id: location.id },
                data: {
                  // Stok zaten Product.stock'tan düşüldü, location'ı da güncelle
                  stock: Math.max(0, location.stock - Number(item.quantity))
                }
              });
            }
          }
        }
      }

      // B2B Kredi / Cari Hesap bakiyesi güncellemeleri
      if (paymentMethod === "openAccount") {
        // Update User current_balance
        const dbUser = await tx.user.findUnique({
          where: { email: customerEmail }
        });
        if (dbUser) {
          await tx.user.update({
            where: { id: dbUser.id },
            data: {
              current_balance: (dbUser.current_balance ? dbUser.current_balance.toNumber() : 0) + verifiedTotal
            }
          });
        }

        // Update CurrentAccount balance
        await tx.currentAccount.update({
          where: { id: account.id },
          data: {
            balance: account.balance.toNumber() + verifiedTotal
          }
        });
      }

      // Finansal kayıt
      await tx.transaction.create({
        data: {
          currentAccountId: account.id,
          type: "Satış Faturası",
          amount: verifiedTotal,
          description: `${order.id} nolu sipariş ödemesi (${transactionId})`,
          paymentMethod: paymentMethod === "creditCard" ? "Kredi Kartı" : paymentMethod === "bankTransfer" ? "Banka Havalesi" : "Açık Hesap"
        }
      });

      // Kupon/kampanya kullanım sayısını artır
      if (couponCode) {
        const upperCode = couponCode.toUpperCase();
        const coupon = await tx.coupon.findUnique({ where: { code: upperCode } });
        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { uses: { increment: 1 } }
          });
        } else {
          const campaign = await tx.campaign.findUnique({ where: { code: upperCode } });
          if (campaign) {
            await tx.campaign.update({
              where: { id: campaign.id },
              data: { usedCount: { increment: 1 } }
            });
          }
        }
      }

      return order;
    }, { maxWait: 10000, timeout: 30000 });

    // 3. E-posta bildirimi (Kuyruğa al) — Müşteriye sipariş onayı
    if (customerEmail !== "guest@nexab2b.com") {
      try {
        // Sipariş içeriği — her ürünü satır satır listele
        const customerOrderItemsText = cart
          .map((item: any) => `• ${item.name} × ${item.quantity} adet — ₺${(Number(item.price) * Number(item.quantity)).toLocaleString("tr-TR")}`)
          .join("\n");

        // Teslimat adresi
        const shippingAddr = shippingAddress
          ? `${shippingAddress.firstName} ${shippingAddress.lastName}\n${shippingAddress.fullAddress}\n${shippingAddress.district} / ${shippingAddress.city}\nTel: ${shippingAddress.phone}`
          : address;

        const paymentLabel =
          paymentMethod === "creditCard" ? "Kredi Kartı" :
          paymentMethod === "bankTransfer" ? "Banka Havalesi / EFT" :
          "Açık Hesap (Vadeli)";

        const orderDateStr = new Date().toLocaleDateString("tr-TR", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        });

        await emailNotificationService.queueEmail(customerEmail, "order_received", {
          kullanici_adi: name,
          siparis_no: result.id,
          siparis_tutari: verifiedTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          siparis_icerik: customerOrderItemsText,
          odeme_yontemi: paymentLabel,
          kargo_adresi: shippingAddr,
          kargo_sirketi: selectedCarrierName || "Standart Kargo",
          tarih: orderDateStr,
          detay_linki: `${hostUrl}/hesap`
        });
      } catch (mailErr) {
        console.error("Failed to queue order received email:", mailErr);
      }
    }

    // Yönetici Bildirimleri (E-posta ve WhatsApp)
    const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || cmsSettings?.contactEmail;
    const adminNotificationWhatsapp = process.env.ADMIN_NOTIFICATION_WHATSAPP || cmsSettings?.contactPhone;
    const orderItemsText = cart.map((item: any) => `• ${item.name} (${item.quantity} adet)`).join("\n");
    const localDateString = new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    if (adminNotificationEmail) {
      try {
        await emailNotificationService.queueEmail(adminNotificationEmail, "admin_new_order", {
          kullanici_adi: name,
          siparis_no: result.id,
          siparis_tutari: verifiedTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          odeme_yontemi: result.method || "Belirtilmedi",
          detay_linki: `${hostUrl}/admin/orders/${result.id}`,
          tarih: localDateString,
          siparis_icerik: orderItemsText
        });
      } catch (adminMailErr) {
        console.error("Failed to queue admin order received email:", adminMailErr);
      }
    }

    try {
      await WhatsAppNotificationService.sendAdminNewOrderNotification({
        siparisNo: result.id,
        kullaniciAdi: name,
        siparisTutari: verifiedTotal,
        odemeYontemi: result.method || "Belirtilmedi",
        orderId: result.id,
        siparisIcerik: orderItemsText,
        adminPhone: adminNotificationWhatsapp,
        hostUrl: hostUrl
      });
    } catch (whatsappErr) {
      console.error("Failed to send admin order received WhatsApp:", whatsappErr);
    }

    // 4. n8n Otomasyon Webhook Tetikleyici
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/order-received";
      const webhookPayload = {
        orderId: result.id,
        date: result.date,
        status: result.status,
        total: verifiedTotal,
        paymentMethod: result.method,
        customer: {
          name: name,
          email: customerEmail,
          phone: phone
        },
        shippingAddress: shippingAddress || {
          addressTitle: "Standart",
          firstName: name.split(' ')[0] || '',
          lastName: name.split(' ').slice(1).join(' ') || '',
          phone: phone,
          city: address.split('-')[0]?.trim() || '',
          district: '',
          fullAddress: address
        },
        billingAddress: billingAddress || shippingAddress || {
          addressTitle: "Standart",
          firstName: name.split(' ')[0] || '',
          lastName: name.split(' ').slice(1).join(' ') || '',
          phone: phone,
          city: address.split('-')[0]?.trim() || '',
          district: '',
          fullAddress: address
        },
        items: cart.map((item: any) => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity || item.qty || 1
        }))
      };

      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload)
      }).catch(err => {
        console.error("n8n Webhook connection error:", err.message);
      });
    } catch (webhookErr) {
      console.error("Error building or triggering n8n webhook:", webhookErr);
    }

    return NextResponse.json({ success: true, orderId: result.id });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Sipariş işlenirken bir hata oluştu.' }, { status: 500 });
  }
}
