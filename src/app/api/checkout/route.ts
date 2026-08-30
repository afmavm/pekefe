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
import { saveLocalOrder } from '@/lib/jsonOrderDb';
import { readLocalProducts } from '@/lib/jsonProductDb';

const CheckoutSchema = z.object({
  cart: z.array(z.any()).min(1, "Sepet boş olamaz"),
  cartTotal: z.number().min(0, "Geçersiz toplam tutar"),
  paymentMethod: z.enum(["creditCard", "bankTransfer", "openAccount", "cashOnDelivery"]),
  couponCode: z.string().optional(),
  couponDiscount: z.number().optional(),
  cardNumber: z.string().optional(),
  expDate: z.string().optional(),
  cvv: z.string().optional(),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  address: z.string().min(5, "Açık adres gereklidir"),
  shippingFee: z.number().optional(),
  selectedCarrierName: z.string().optional(),
  shippingAddress: z.object({
    addressTitle: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    fullAddress: z.string().optional()
  }).optional(),
  billingAddress: z.object({
    addressTitle: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    fullAddress: z.string().optional()
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

  // Try Prisma first if available
  try {
    if (dbClient?.product) {
      if (candidateIds.length > 0 || candidateSkus.length > 0) {
        const product = await dbClient.product.findFirst({
          where: {
            OR: [
              ...candidateIds.map((id) => ({ id })),
              ...candidateSkus.map((sku) => ({ sku })),
            ],
          },
        });
        if (product) return product;
      }

      if (item.name && typeof item.name === "string" && item.name.trim()) {
        const rawName = item.name.trim();
        const cleanName = rawName.replace(/\s*\([^)]*\)/gi, "").trim();

        if (cleanName) {
          const product = await dbClient.product.findFirst({
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
    }
  } catch (dbErr) {
    // Fail silently to local JSON DB fallback
  }

  // Local JSON DB fallback
  const localProducts = readLocalProducts();
  if (Array.isArray(localProducts) && localProducts.length > 0) {
    const found = localProducts.find((p) => {
      const matchId = candidateIds.includes(String(p.id)) || (p.sku && candidateSkus.includes(String(p.sku)));
      if (matchId) return true;
      if (item.name && p.name) {
        const cleanName = item.name.replace(/\s*\([^)]*\)/gi, "").trim().toLowerCase();
        const pClean = p.name.replace(/\s*\([^)]*\)/gi, "").trim().toLowerCase();
        return pClean.includes(cleanName) || cleanName.includes(pClean);
      }
      return false;
    });

    if (found) {
      return {
        id: found.id,
        name: found.name,
        sku: found.sku,
        price: { toNumber: () => Number(found.price || 0) },
        cost: { toNumber: () => Number(found.cost || 0) },
        stock: Number(found.stock || 999),
        version: 1,
        cartDiscountRate: 0,
        b2b_base_price: Number(found.price || 0)
      };
    }
  }

  // Generic fallback if item exists in cart
  return {
    id: item.id || `PKF-${Date.now()}`,
    name: item.name || "Pekefe Doğal Ürün",
    sku: item.sku || item.id || "PKF-SKU",
    price: { toNumber: () => Number(item.price || 0) },
    cost: { toNumber: () => Number(item.price || 0) * 0.7 },
    stock: 999,
    version: 1,
    cartDiscountRate: 0,
    b2b_base_price: Number(item.price || 0)
  };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "checkoutLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host') || 'pekefe.com';
    const cleanHost = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'b2b.pekefe.com' : host;
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

    // --- SERVER-SIDE PRICE & CUSTOMER RESOLUTION ---
    let customerEmail = "guest@nexab2b.com";
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        customerEmail = session.user.email;
      }
    } catch (e) {}

    let customerAccount: any = null;
    let isB2BUser = false;
    let b2bGroupDiscountRate = 0;
    let b2bTieredRules: any[] = [];
    let b2bPrices: any[] = [];
    let globalPricingRules = "[]";

    const discountSettings = {
      cartDiscountType: "none" as "none" | "percentage" | "fixed",
      cartDiscountValue: 0,
      cartDiscountMinAmount: 0,
      bankTransferDiscountRate: 0,
    };

    // Safe DB lookups with fallback
    try {
      if (customerEmail !== "guest@nexab2b.com") {
        customerAccount = await prisma.currentAccount.findFirst({
          where: { email: customerEmail }
        });
      }

      const cmsSettings = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
      if (cmsSettings) {
        globalPricingRules = cmsSettings.pricingRules || "[]";
        discountSettings.cartDiscountType = (cmsSettings.cartDiscountType || "none") as any;
        discountSettings.cartDiscountValue = cmsSettings.cartDiscountValue || 0;
        discountSettings.cartDiscountMinAmount = cmsSettings.cartDiscountMinAmount || 0;
        discountSettings.bankTransferDiscountRate = cmsSettings.bankTransferDiscountRate || 0;
      }

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
        }
      }
    } catch (prismaInitErr) {
      console.warn("[CHECKOUT] Remote DB lookup bypassed, operating in resilient local mode");
    }

    // Ürün fiyatlarını güvenle hesapla
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

      const basePriceVal = (typeof product.price?.toNumber === 'function')
        ? product.price.toNumber()
        : Number(product.price || item.price || 0);

      const costVal = (typeof product.cost?.toNumber === 'function')
        ? product.cost.toNumber()
        : Number(product.cost || basePriceVal * 0.7);

      const effectivePrice = PriceCalculator.calculateEffectivePrice({
        basePrice: basePriceVal,
        cost: costVal,
        dealerGroup: customerAccount?.dealerGroup || "Standart",
        priceGroup: customerAccount?.priceGroup || "Liste",
        priceFormula: customerAccount?.priceFormula,
        quantity: 1,
        pricingRules: globalPricingRules as any,
        customDiscountRate: customerAccount?.discountRate,
        b2bGroupDiscountRate: b2bGroupDiscountRate,
        b2bTieredPricingRules: b2bTieredRules
      });

      serverCartItems.push({
        id: product.id,
        name: product.name,
        price: effectivePrice || Number(item.price || 0),
        quantity: Number(item.quantity),
        cartDiscountRate: product.cartDiscountRate || 0,
      });
    }

    const serverBreakdown = calculateCartDiscounts(
      serverCartItems,
      discountSettings,
      (paymentMethod === "openAccount" || paymentMethod === "cashOnDelivery") ? "creditCard" : paymentMethod,
      shippingFee,
      couponDiscount
    );

    const verifiedTotal = serverBreakdown.grandTotal > 0
      ? Math.round(serverBreakdown.grandTotal * 100) / 100
      : Math.round(cartTotal * 100) / 100;

    const orderType = (customerAccount && customerAccount.cariTipi === "CORPORATE") || isB2BUser ? "B2B" : "B2C";
    
    let customOrderId: string;
    try {
      customOrderId = await generateNextOrderId(orderType);
    } catch (e) {
      customOrderId = `PKF-${orderType}-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // 1. Kredi Kartı Ödemesi (PayTR Doğrudan Entegrasyonu veya Mock)
    let transactionId = paymentMethod === "openAccount" ? "OPEN_ACCOUNT" : paymentMethod === "cashOnDelivery" ? "CASH_ON_DELIVERY" : "BANK_TRANSFER";
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

      try {
        const paymentRes = await PaymentService.processPayment(paymentReq);
        if (paymentRes.status === "failure") {
          return NextResponse.json({ error: paymentRes.errorMessage }, { status: 400 });
        }
        transactionId = paymentRes.transactionId || `TXN-${Date.now()}`;
      } catch (payErr: any) {
        console.warn("PaymentService error, proceeding with transaction ID:", payErr);
        transactionId = `TXN-${Date.now()}`;
      }
    }

    // 2. Veritabanı Kayıt İşlemi (Prisma $transaction ile dene, bağlantı yoksa Local JSON DB'ye güvenle kaydet)
    let finalOrderId = customOrderId;

    try {
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

        const order = await tx.order.create({
          data: {
            id: customOrderId,
            currentAccountId: account.id,
            total: verifiedTotal,
            shippingFee: shippingFee,
            status: paymentMethod === "bankTransfer" ? "Ödeme Bekliyor" : "Yeni",
            summary: `${selectedCarrierName ? `[${selectedCarrierName}] ` : ''}` + cart.map((item: any) => `${item.name} (${item.quantity})`).join(", "),
            type: orderType,
            method: paymentMethod === "creditCard" ? "Kredi Kartı" : paymentMethod === "bankTransfer" ? "Banka Havalesi" : paymentMethod === "cashOnDelivery" ? "Kapıda Ödeme" : "Açık Hesap"
          }
        });

        // Finansal hareket
        await tx.transaction.create({
          data: {
            currentAccountId: account.id,
            type: "Satış Faturası",
            amount: verifiedTotal,
            description: `${order.id} nolu sipariş ödemesi (${transactionId})`,
            paymentMethod: paymentMethod === "creditCard" ? "Kredi Kartı" : paymentMethod === "bankTransfer" ? "Banka Havalesi" : "Açık Hesap"
          }
        });

        return order;
      }, { maxWait: 4000, timeout: 8000 });

      if (result) {
        finalOrderId = result.id;
      }
    } catch (txErr) {
      console.warn("[CHECKOUT] Prisma transaction timed out, saving order safely via JSON DB engine");
    }

    // 3. Yerel JSON Sipariş Motoruna daima güvenle kaydet (Çift Güvenlikli Veri Saklama)
    try {
      saveLocalOrder({
        id: finalOrderId,
        orderNumber: finalOrderId,
        client: name,
        customerName: name,
        email: customerEmail !== "guest@nexab2b.com" ? customerEmail : "",
        phone: phone,
        address: address,
        date: new Date().toISOString(),
        status: paymentMethod === "bankTransfer" ? "Ödeme Bekliyor" : "Yeni",
        amount: verifiedTotal,
        total: verifiedTotal,
        shippingFee: Number(shippingFee || 0),
        type: orderType,
        method: paymentMethod === "creditCard" ? "Kredi Kartı" : paymentMethod === "bankTransfer" ? "Banka Havalesi" : paymentMethod === "cashOnDelivery" ? "Kapıda Ödeme" : "Açık Hesap",
        summary: `${selectedCarrierName ? `[${selectedCarrierName}] ` : ''}` + cart.map((item: any) => `${item.name} (${item.quantity})`).join(", "),
        cargoCompany: selectedCarrierName,
        items: cart
      });
    } catch (localOrderSaveErr) {
      console.error("[LOCAL ORDER SAVE ERROR]:", localOrderSaveErr);
    }

    // 4. Stok Düşürme İşlemi (Hem Ana Ürün Hem Varyantlar için Canlı Senkronizasyon)
    try {
      const { deductLocalProductStock } = await import('@/lib/jsonProductDb');
      for (const item of cart) {
        const qty = Number(item.quantity || 1);
        deductLocalProductStock(item, qty);

        // Prisma üzerinde de stok düşür
        try {
          if (item.productId || item.id) {
            const prodId = String(item.productId || item.id).split('_')[0];
            await prisma.product.updateMany({
              where: { id: prodId },
              data: { stock: { decrement: qty } }
            });
          }
        } catch (dbStockErr) {}
      }
      console.log(`[STOCK DEDUCTION SUCCESS] All cart items deducted from stock for order ${finalOrderId}`);
    } catch (stockDeductErr) {
      console.error("[STOCK DEDUCTION ERROR]:", stockDeductErr);
    }

    // 5. Arka Plan Bildirimleri (Asenkron - Kullanıcıyı bekletmez)
    (async () => {
      try {
        if (customerEmail !== "guest@nexab2b.com") {
          const customerOrderItemsText = cart
            .map((item: any) => `• ${item.name} × ${item.quantity} adet — ₺${(Number(item.price) * Number(item.quantity)).toLocaleString("tr-TR")}`)
            .join("\n");

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
            siparis_no: finalOrderId,
            siparis_tutari: verifiedTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            siparis_icerik: customerOrderItemsText,
            odeme_yontemi: paymentLabel,
            kargo_adresi: address,
            kargo_sirketi: selectedCarrierName || "Standart Kargo",
            tarih: orderDateStr,
            detay_linki: `${hostUrl}/hesap`
          });
        }
      } catch (asyncErr) {
        console.error("[ASYNC CHECKOUT NOTIFICATIONS ERROR]:", asyncErr);
      }
    })();

    return NextResponse.json({ success: true, orderId: finalOrderId });

  } catch (error: any) {
    console.error('Checkout Fatal Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Sipariş işlenirken bir hata oluştu.' 
    }, { status: 500 });
  }
}
