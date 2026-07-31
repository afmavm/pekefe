import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { generateUBLXML, InvoiceData } from '@/modules/accounting/server/ubl-generator';

export async function POST(request: NextRequest) {
  let payloadText = '';
  let parsedPayload: any = null;
  
  try {
    payloadText = await request.text();
    parsedPayload = JSON.parse(payloadText);
  } catch (parseError: any) {
    console.error('[WEBHOOK_PARSE_ERROR]:', parseError);
    await logFailedOrder('UNKNOWN', payloadText || '', `Parse Error: ${parseError.message}`);
    return NextResponse.json({ error: 'Payload ayrıştırılamadı (Invalid JSON)' }, { status: 400 });
  }

  const orderId = parsedPayload?.order_id || `ERR-${uuidv4().slice(0, 8)}`;

  try {
    // 1. API SECURITY VERIFICATION
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-wc-webhook-signature');
    const authHeader = request.headers.get('authorization');
    
    const secret = process.env.ECOMMERCE_WEBHOOK_SECRET || 'pekefe_webhook_secret_2026';
    const expectedToken = process.env.ECOMMERCE_WEBHOOK_TOKEN || 'pekefe_auth_token_2026';

    let isAuthorized = false;

    if (signature) {
      const calculatedHash = crypto.createHmac('sha256', secret).update(payloadText).digest('base64');
      if (calculatedHash === signature) {
        isAuthorized = true;
      }
    } else if (authHeader === `Bearer ${expectedToken}`) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      const clientIp = request.headers.get('x-forwarded-for') || 'Bilinmiyor';
      console.warn(`[WEBHOOK_UNAUTHORIZED] IP: ${clientIp} Order: ${orderId}`);
      await logFailedOrder(orderId, payloadText, 'Yetkilendirme Hatası: Geçersiz imza veya token.');
      return NextResponse.json({ error: 'Yetkilendirme başarısız (Unauthorized)' }, { status: 401 });
    }

    // Ensure failed log table exists dynamically
    await ensureFailedOrderTable();

    // 2. INPUT VALIDATIONS
    if (!parsedPayload.customer || !parsedPayload.items || !Array.isArray(parsedPayload.items) || parsedPayload.items.length === 0) {
      await logFailedOrder(orderId, payloadText, 'Validasyon Hatası: Müşteri veya ürün kalemleri boş.');
      return NextResponse.json({ error: 'Validasyon hatası: Eksik sipariş parametreleri.' }, { status: 400 });
    }

    // 3. RESOLVER LOGIC: CUSTOMER MATCHING OR CREATION
    const customerEmail = parsedPayload.customer.email?.trim();
    const customerPhone = parsedPayload.customer.phone?.trim();

    let customer = await prisma.currentAccount.findFirst({
      where: {
        OR: [
          customerEmail ? { email: customerEmail } : undefined,
          customerPhone ? { phone: customerPhone } : undefined
        ].filter(Boolean) as any
      }
    });

    if (!customer) {
      const b2cCount = await prisma.currentAccount.count({ where: { cariTipi: 'INDIVIDUAL' } });
      const b2cCode = `B2C-${String(b2cCount + 10001).padStart(5, '0')}`;
      const customerName = `${parsedPayload.customer.first_name || ''} ${parsedPayload.customer.last_name || ''}`.trim() || 'Perakende Web Müşterisi';
      const firstAddress = parsedPayload.customer.billing_address || parsedPayload.customer.shipping_address;
      const addressText = firstAddress ? `${firstAddress.full_address || ''} ${firstAddress.district || ''}/${firstAddress.city || ''}` : 'Web Sipariş Adresi';

      customer = await prisma.currentAccount.create({
        data: {
          cariKod: b2cCode,
          name: customerName,
          type: 'MUSTERI',
          cariTipi: 'INDIVIDUAL',
          ad: parsedPayload.customer.first_name || null,
          soyad: parsedPayload.customer.last_name || null,
          email: customerEmail || null,
          phone: customerPhone || null,
          address: addressText,
          balance: 0,
          currency: parsedPayload.currency || 'TRY',
          kaynakPlatform: 'E_COMMERCE',
          adresler: JSON.stringify({
            billing: parsedPayload.customer.billing_address || null,
            shipping: parsedPayload.customer.shipping_address || null
          })
        }
      });
      console.log(`[WEBHOOK_CARİ_OLUŞTURULDU] Müşteri: ${customerName}, Kod: ${b2cCode}`);
    }

    // 4. RESOLVER LOGIC: SKU MATCHING (with WEB_FALLBACK support)
    const itemsWithStockCards: { item: any; product: any }[] = [];
    
    for (const item of parsedPayload.items) {
      if (!item.sku) {
        throw new Error(`Sipariş kalemi SKU bilgisi içermiyor: ${item.name || ''}`);
      }

      let product = await prisma.product.findUnique({
        where: { sku: item.sku }
      });

      if (!product) {
        console.warn(`[SKU Eşleşme Hatası - İncelenmeli] SKU: ${item.sku} sistemde bulunamadı. WEB_FALLBACK kullanılıyor.`);
        
        // Find or create fallback product
        product = await prisma.product.findUnique({
          where: { sku: 'WEB_FALLBACK' }
        });

        if (!product) {
          product = await prisma.product.create({
            data: {
              name: 'Bilinmeyen Web Sipariş Ürünü',
              sku: 'WEB_FALLBACK',
              category: 'Diger',
              price: 0.00,
              stock: 99999,
              images: '[]',
              attributes: '{}'
            }
          });
        }
      }

      itemsWithStockCards.push({ item, product });
    }

    // 5. CALCULATIONS: SHIPPING & PROPORTIONAL DISCOUNTS (VAT-Excluded)
    const totalItemsPriceBeforeDiscount = parsedPayload.items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
    const discountAmount = parsedPayload.discount_amount || 0;
    
    const invoiceItemsPayload: any[] = [];
    let totalTaxAmount = 0;

    // Distribute discount proportionally and convert VAT-included to VAT-excluded
    for (const entry of itemsWithStockCards) {
      const { item, product } = entry;
      
      let itemDiscount = 0;
      if (discountAmount > 0 && totalItemsPriceBeforeDiscount > 0) {
        const share = (item.price * item.quantity) / totalItemsPriceBeforeDiscount;
        itemDiscount = discountAmount * share;
      }

      const lineTotalVatIncluded = (item.price * item.quantity) - itemDiscount;
      const unitPriceVatIncluded = lineTotalVatIncluded / item.quantity;
      
      const vatRate = item.vat_rate || 20; 
      const unitPriceVatExcluded = unitPriceVatIncluded / (1 + vatRate / 100);
      const lineTotalVatExcluded = unitPriceVatExcluded * item.quantity;
      const lineTaxAmount = lineTotalVatIncluded - lineTotalVatExcluded;

      totalTaxAmount += lineTaxAmount;

      invoiceItemsPayload.push({
        name: item.name || product.name,
        quantity: item.quantity,
        unitCode: 'C62',
        price: Math.round(unitPriceVatExcluded * 10000) / 10000,
        taxRate: vatRate
      });
    }

    // Add shipping cost if positive
    if (parsedPayload.shipping_fee && parsedPayload.shipping_fee > 0) {
      const shippingVatRate = 20; 
      const shippingExcluded = parsedPayload.shipping_fee / (1 + shippingVatRate / 100);
      const shippingTax = parsedPayload.shipping_fee - shippingExcluded;
      
      totalTaxAmount += shippingTax;

      invoiceItemsPayload.push({
        name: 'Hizmet/Kargo Bedeli',
        quantity: 1,
        unitCode: 'C62',
        price: Math.round(shippingExcluded * 10000) / 10000,
        taxRate: shippingVatRate
      });
    }

    // 6. ERP TRANSACTION EXECUTION
    const invoiceId = `WEB${new Date().getFullYear()}${Math.floor(100000000 + Math.random() * 900000000)}`;
    const invoiceUuid = uuidv4();

    const orderNumber = parsedPayload.order_id;
    const orderDateFormatted = parsedPayload.created_at ? new Date(parsedPayload.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    let companyName = "PEKEFE GERÇEK HASAT LİMİTED ŞİRKETİ";
    let companyVkn = "1234567890";
    let companyTaxOffice = "Boğaziçi";
    let companyAddress = "Kayseri OSB 1. Cadde No: 5";

    try {
      const cmsSettings = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
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
      invoiceTypeCode: 'SATIS',
      currencyCode: parsedPayload.currency || 'TRY',
      orderNumber,
      orderDate: orderDateFormatted,
      supplier: {
        name: companyName,
        taxId: companyVkn,
        taxOffice: companyTaxOffice,
        address: companyAddress,
        city: 'Kayseri',
        country: 'Türkiye'
      },
      customer: {
        name: customer.name,
        taxId: customer.tckn || '2222222222',
        taxOffice: 'Bireysel Perakende',
        address: customer.address || 'Adres Kayıtlı Değil',
        city: parsedPayload.customer.shipping_address?.city || 'İstanbul',
        country: 'Türkiye'
      },
      items: invoiceItemsPayload
    };

    const xml = generateUBLXML(invoiceData);

    await prisma.$transaction(async (tx) => {
      // A. Create Invoice header
      await tx.invoice.create({
        data: {
          id: invoiceId,
          orderId: orderNumber,
          currentAccountId: customer.id,
          date: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
          totalAmount: parsedPayload.total_amount,
          taxAmount: Math.round(totalTaxAmount * 100) / 100,
          status: 'Gönderildi',
          type: 'e-Arşiv',
          externalLink: `/api/invoices/download/${invoiceId}`,
          items: JSON.stringify(invoiceItemsPayload)
        }
      });

      // B. Create Invoice items
      for (const itemPayload of invoiceItemsPayload) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoiceId,
            name: itemPayload.name,
            quantity: itemPayload.quantity,
            unitPrice: itemPayload.price,
            vatRate: itemPayload.taxRate,
            totalAmount: Math.round(itemPayload.price * itemPayload.quantity * (1 + itemPayload.taxRate / 100) * 100) / 100
          }
        });
      }

      // C. Adjust stocks and insert audit transactions
      for (const entry of itemsWithStockCards) {
        const { item, product } = entry;
        if (product.sku !== 'WEB_FALLBACK') {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } }
          });

          await tx.stockTransaction.create({
            data: {
              productId: product.id,
              type: 'SALE',
              quantity: item.quantity,
              description: `E-Ticaret Siparişi #${orderNumber} satışı. SKU: ${product.sku}`,
              moduleSource: 'API',
              referenceId: orderNumber
            }
          });
        }
      }

      // D. Update Customer Balance
      await tx.currentAccount.update({
        where: { id: customer.id },
        data: { balance: { increment: parsedPayload.total_amount } }
      });

      // E. Insert transaction log
      await tx.transaction.create({
        data: {
          currentAccountId: customer.id,
          type: 'Satış Faturası',
          amount: parsedPayload.total_amount,
          description: `E-Ticaret Sipariş #${orderNumber} Satış Faturası. Belge No: ${invoiceId}`,
          date: new Date()
        }
      });
    });

    console.log(`[WEBHOOK_BAŞARILI] Sipariş #${orderNumber} faturaya dönüştürüldü (ID: ${invoiceId})`);
    
    return NextResponse.json({
      success: true,
      message: 'Sipariş ERP\'ye başarıyla işlendi ve satış faturası üretildi.',
      invoiceId,
      invoiceUuid,
      xml
    });

  } catch (executionError: any) {
    console.error(`[WEBHOOK_EXECUTION_ERROR] Order: ${orderId}:`, executionError);
    await logFailedOrder(orderId, payloadText, executionError.message || 'Bilinmeyen veritabanı/transaction hatası.');
    
    return NextResponse.json({
      error: 'Sipariş ERP\'ye işlenirken bir hata oluştu.',
      details: executionError.message
    }, { status: 500 });
  }
}

async function ensureFailedOrderTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS failed_ecommerce_orders (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        payload TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Failed to create/verify failed_ecommerce_orders table:', error);
  }
}

async function logFailedOrder(orderId: string, payload: string, errorMessage: string) {
  try {
    await ensureFailedOrderTable();
    const id = uuidv4();
    const isSQLite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.includes('.db');
    const dateFunc = isSQLite ? "datetime('now')" : "NOW()";

    await prisma.$executeRawUnsafe(
      `INSERT INTO failed_ecommerce_orders (id, order_id, payload, error_message, created_at)
       VALUES ($1, $2, $3, $4, ${dateFunc})`,
      id,
      orderId,
      payload,
      errorMessage
    );
    console.log(`[WEBHOOK_KAYIP_SİPARİŞ_KAYDEDİLDİ] Order: ${orderId}, Log ID: ${id}`);
  } catch (err) {
    console.error('CRITICAL: Failed to write to failed_ecommerce_orders table! Payload:', payload, 'Error:', err);
  }
}
