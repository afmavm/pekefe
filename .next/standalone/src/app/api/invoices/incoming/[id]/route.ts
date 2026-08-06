import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UBLInvoiceProcessor } from '@/lib/ubl-invoice-processor';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const ettn_no = resolvedParams.id;

    // e-Faturayı kuyruktan çek
    const incomingRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT xml_content, status, error_message FROM incoming_e_invoices WHERE ettn_no = $1 LIMIT 1',
      ettn_no
    );

    if (!incomingRows || incomingRows.length === 0) {
      return NextResponse.json(
        { error: 'Belirtilen e-Fatura gelen kutusunda bulunamadı.' },
        { status: 404 }
      );
    }

    const { xml_content, status, error_message } = incomingRows[0];
    
    // XML verisini ayrıştır
    const parsed = UBLInvoiceProcessor.parseXML(xml_content);

    // Cari eşleşmesini kontrol et
    let resolvedSupplierId = null;
    let supplierName = '';
    const supplierRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT supplier_id, supplier_name FROM suppliers WHERE tax_no = $1 OR supplier_code = $1 LIMIT 1',
      parsed.supplier_vkn
    );
    if (supplierRows && supplierRows.length > 0) {
      resolvedSupplierId = supplierRows[0].supplier_id;
      supplierName = supplierRows[0].supplier_name;
    }

    // Her satır için stok eşleşmesini ve fiyat uyuşmazlığını kontrol et
    const resolvedLines = [];
    let hasMismatchedProducts = false;
    let hasPriceDisputes = false;

    for (let i = 0; i < parsed.lines.length; i++) {
      const line = parsed.lines[i];
      let stockId = null;
      let stockName = '';
      let systemCost = 0;
      let defaultWarehouseId = null;

      // Stok Kartı Arama
      let stockRows: any[] = [];
      if (line.item_code) {
        stockRows = await prisma.$queryRawUnsafe<any[]>(
          'SELECT stock_id, stock_name, current_cost, default_warehouse_id FROM stocks WHERE supplier_part_no = $1 OR stock_code = $1 LIMIT 1',
          line.item_code
        );
      }

      if ((!stockRows || stockRows.length === 0) && line.barcode) {
        stockRows = await prisma.$queryRawUnsafe<any[]>(
          'SELECT stock_id, stock_name, current_cost, default_warehouse_id FROM stocks WHERE barcode = $1 LIMIT 1',
          line.barcode
        );
      }

      if (!stockRows || stockRows.length === 0) {
        stockRows = await prisma.$queryRawUnsafe<any[]>(
          'SELECT stock_id, stock_name, current_cost, default_warehouse_id FROM stocks WHERE stock_name = $1 LIMIT 1',
          line.item_name
        );
      }

      let isDisputed = false;
      if (stockRows && stockRows.length > 0) {
        stockId = stockRows[0].stock_id;
        stockName = stockRows[0].stock_name;
        systemCost = parseFloat(stockRows[0].current_cost) || 0;
        defaultWarehouseId = stockRows[0].default_warehouse_id;

        // Fiyat uyuşmazlığı kontrolü (Fatura Net Fiyatı ile Sistem Güncel AOM Maliyeti karşılaştırması)
        // Sapma Payı: %5
        const netUnitPrice = line.unit_price * (1 - line.discount_rate / 100);
        // Fatura dövizli ise, TRY maliyetle karşılaştırmak için kuru hesaba katıyoruz
        const localNetUnitPrice = netUnitPrice * parsed.exchange_rate;
        
        if (systemCost > 0) {
          const priceVariance = Math.abs(localNetUnitPrice - systemCost) / systemCost;
          if (priceVariance > 0.05) {
            isDisputed = true;
            hasPriceDisputes = true;
          }
        }
      } else {
        hasMismatchedProducts = true;
      }

      resolvedLines.push({
        lineIndex: i,
        itemCode: line.item_code,
        itemName: line.item_name,
        barcode: line.barcode,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        vatRate: line.vat_rate,
        discountRate: line.discount_rate,
        lineNetAmount: line.line_net_amount,
        lineVatAmount: line.line_vat_amount,
        lineGrossAmount: line.line_gross_amount,
        stockId,
        stockName,
        systemCost,
        defaultWarehouseId,
        isDisputed
      });
    }

    // Faturanın güncel mantıksal durumunu belirle
    let resolvedStatus = status;
    if (status !== 'Processed') {
      if (!resolvedSupplierId) {
        resolvedStatus = 'Supplier NotFound';
      } else if (hasMismatchedProducts) {
        resolvedStatus = 'Product NotFound';
      } else if (hasPriceDisputes) {
        resolvedStatus = 'Disputed';
      } else {
        resolvedStatus = 'Pending'; // Ready for approval
      }
    }

    return NextResponse.json({
      status: resolvedStatus,
      errorMessage: error_message,
      supplierName: supplierName || parsed.notes || 'Bilinmeyen Cari',
      resolvedSupplierId,
      resolvedLines,
      parsed
    });

  } catch (error: any) {
    console.error('[API_INCOMING_INVOICE_DETAILS_GET_ERROR]:', error);
    return NextResponse.json(
      { error: 'e-Fatura detayları ayrıştırılırken hata oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
