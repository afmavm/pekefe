import { XMLParser } from 'fast-xml-parser';
import { prisma } from './prisma';
import crypto from 'crypto';

export interface ParsedInvoiceLine {
  item_code: string;
  item_name: string;
  barcode: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount_rate: number;
  line_net_amount: number;
  line_vat_amount: number;
  line_gross_amount: number;
}

export interface ParsedInvoice {
  invoice_no: string;
  ettn_no: string;
  invoice_date: string;
  supplier_vkn: string;
  currency: string;
  exchange_rate: number;
  total_net_amount: number;
  total_vat_amount: number;
  total_gross_amount: number;
  notes: string;
  lines: ParsedInvoiceLine[];
}

export class UBLInvoiceProcessor {
  /**
   * Helper function to safely extract text values from XML nodes.
   * Handles objects parsed with attributes (e.g. {"#text": "...", "@_attr": "..."})
   */
  private static getTagValue(node: any): string {
    if (node === undefined || node === null) return '';
    if (typeof node === 'object') {
      if ('#text' in node) return String(node['#text']).trim();
      return '';
    }
    return String(node).trim();
  }

  /**
   * Cleans UBL namespaces (prefixes like cbc:, cac:, ext:, ds:) from XML tags
   * to ensure a clean tag structure for parsing.
   */
  public static cleanXmlNamespaces(xmlStr: string): string {
    return xmlStr.replace(/<\/?[a-zA-Z0-9_-]+:/g, (match) => {
      return match.startsWith('</') ? '</' : '<';
    });
  }

  /**
   * Parses UBL-TR v2.1 XML and maps it to a clean JSON object structure.
   */
  public static parseXML(xmlContent: string): ParsedInvoice {
    const cleanedXml = this.cleanXmlNamespaces(xmlContent);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });

    const jsonObj = parser.parse(cleanedXml);
    const invoice = jsonObj.Invoice;
    if (!invoice) {
      throw new Error('Geçersiz XML: UBL-TR Fatura kök elementi (Invoice) bulunamadı!');
    }

    const invoice_no = this.getTagValue(invoice.ID);
    const ettn_no = this.getTagValue(invoice.UUID);
    const invoice_date = this.getTagValue(invoice.IssueDate);

    if (!invoice_no) throw new Error('Geçersiz UBL-TR: Fatura Numarası (ID) bulunamadı!');
    if (!ettn_no) throw new Error('Geçersiz UBL-TR: Fatura ETTN No (UUID) bulunamadı!');
    if (!invoice_date) throw new Error('Geçersiz UBL-TR: Fatura Tarihi (IssueDate) bulunamadı!');

    // Resolve AccountingSupplierParty -> Party -> PartyIdentification
    const supplierParty = invoice.AccountingSupplierParty?.Party;
    if (!supplierParty) {
      throw new Error('Geçersiz UBL-TR: Tedarikçi bilgileri (AccountingSupplierParty/Party) bulunamadı!');
    }

    let supplier_vkn = '';
    const partyIds = supplierParty.PartyIdentification;
    if (partyIds) {
      const idArray = Array.isArray(partyIds) ? partyIds : [partyIds];
      for (const partyId of idArray) {
        const idVal = this.getTagValue(partyId.ID);
        const scheme = partyId.ID?.['@_schemeID'] || '';
        if (scheme === 'VKN' || scheme === 'TCKN' || idVal.length === 10 || idVal.length === 11) {
          supplier_vkn = idVal;
          break;
        }
      }
    }

    // Fallback if VKN/TCKN is not resolved using schemeID attribute
    if (!supplier_vkn && partyIds) {
      const idArray = Array.isArray(partyIds) ? partyIds : [partyIds];
      for (const partyId of idArray) {
        const idVal = this.getTagValue(partyId.ID);
        if (idVal.length === 10 || idVal.length === 11) {
          supplier_vkn = idVal;
          break;
        }
      }
    }

    if (!supplier_vkn) {
      throw new Error('Geçersiz UBL-TR: Tedarikçi VKN veya TCKN numarası bulunamadı!');
    }

    // Resolve currency and exchange rate
    const currency = this.getTagValue(invoice.DocumentCurrencyCode) || 'TRY';
    let exchange_rate = 1.0000;
    const exchangeRateNode = invoice.PricingExchangeRate || invoice.PaymentExchangeRate;
    if (exchangeRateNode && exchangeRateNode.CalculationRate) {
      exchange_rate = parseFloat(this.getTagValue(exchangeRateNode.CalculationRate)) || 1.0000;
    }

    // Parse financial totals
    const lmt = invoice.LegalMonetaryTotal;
    if (!lmt) {
      throw new Error('Geçersiz UBL-TR: Fatura parasal toplam bilgileri (LegalMonetaryTotal) bulunamadı!');
    }

    const total_net_amount = parseFloat(this.getTagValue(lmt.TaxExclusiveAmount)) || 0.00;
    
    let total_vat_amount = 0.00;
    const taxTotals = invoice.TaxTotal;
    if (taxTotals) {
      const taxTotalArray = Array.isArray(taxTotals) ? taxTotals : [taxTotals];
      for (const tt of taxTotalArray) {
        total_vat_amount += parseFloat(this.getTagValue(tt.TaxAmount)) || 0.00;
      }
    }

    const total_gross_amount = parseFloat(this.getTagValue(lmt.PayableAmount)) || (total_net_amount + total_vat_amount);

    // Resolve invoice notes
    let notes = '';
    if (invoice.Note) {
      const noteArray = Array.isArray(invoice.Note) ? invoice.Note : [invoice.Note];
      notes = noteArray.map((n: any) => this.getTagValue(n)).join(' | ');
    }

    // Parse invoice lines
    const linesRaw = invoice.InvoiceLine;
    if (!linesRaw) {
      throw new Error('Geçersiz UBL-TR: Faturada hiç satır kalemi (InvoiceLine) bulunamadı!');
    }

    const lineArray = Array.isArray(linesRaw) ? linesRaw : [linesRaw];
    const lines: ParsedInvoiceLine[] = [];

    for (const line of lineArray) {
      const quantity = parseFloat(this.getTagValue(line.InvoicedQuantity)) || 0;
      const unit_price = parseFloat(this.getTagValue(line.Price?.PriceAmount)) || 0;

      if (quantity <= 0) {
        throw new Error(`Fatura satırında geçersiz miktar: ${quantity}`);
      }

      // VAT Rate
      let vat_rate = 0.00;
      const taxSubtotal = line.TaxTotal?.TaxSubtotal;
      if (taxSubtotal) {
        const subtotalArray = Array.isArray(taxSubtotal) ? taxSubtotal : [taxSubtotal];
        if (subtotalArray.length > 0) {
          vat_rate = parseFloat(this.getTagValue(subtotalArray[0].Percent)) || 
                     parseFloat(this.getTagValue(subtotalArray[0].TaxCategory?.Percent)) || 0.00;
        }
      }

      // Discount rate
      let discount_rate = 0.00;
      const allowanceCharge = line.AllowanceCharge;
      if (allowanceCharge) {
        const allowanceArray = Array.isArray(allowanceCharge) ? allowanceCharge : [allowanceCharge];
        for (const ac of allowanceArray) {
          const isCharge = this.getTagValue(ac.ChargeIndicator) === 'true';
          if (!isCharge) {
            const factor = parseFloat(this.getTagValue(ac.MultiplierFactorNumeric));
            if (!isNaN(factor)) {
              discount_rate = factor * 100.0; // E.g., 0.10 -> 10%
            } else {
              const amount = parseFloat(this.getTagValue(ac.Amount)) || 0;
              const grossBeforeDiscount = quantity * unit_price;
              if (grossBeforeDiscount > 0) {
                discount_rate = (amount / grossBeforeDiscount) * 100.0;
              }
            }
            break;
          }
        }
      }

      const item_name = this.getTagValue(line.Item?.Name) || this.getTagValue(line.Item?.Description) || 'Tanımsız Ürün';
      const item_code = this.getTagValue(line.Item?.ManufacturersItemIdentification?.ID) || 
                        this.getTagValue(line.Item?.SellersItemIdentification?.ID) || 
                        this.getTagValue(line.Item?.BuyersItemIdentification?.ID) || '';
      const barcode = this.getTagValue(line.Item?.StandardItemIdentification?.ID) || '';

      // Line totals
      const net_unit_price = unit_price * (1.0 - (discount_rate / 100.0));
      const line_net_amount = Math.round(quantity * net_unit_price * 100) / 100;
      const line_vat_amount = Math.round(line_net_amount * (vat_rate / 100.0) * 100) / 100;
      const line_gross_amount = line_net_amount + line_vat_amount;

      lines.push({
        item_code,
        item_name,
        barcode,
        quantity,
        unit_price,
        vat_rate,
        discount_rate,
        line_net_amount,
        line_vat_amount,
        line_gross_amount
      });
    }

    return {
      invoice_no,
      ettn_no,
      invoice_date,
      supplier_vkn,
      currency,
      exchange_rate,
      total_net_amount,
      total_vat_amount,
      total_gross_amount,
      notes,
      lines
    };
  }

  /**
   * Processes the UBL-TR E-Invoice XML, resolves suppliers and products,
   * logs to incoming inbox queue, and executes the purchase invoice SP transaction.
   */
  public static async processEInvoice(xmlContent: string): Promise<{ success: boolean; invoiceId?: string; status: string; error?: string }> {
    let parsed: ParsedInvoice;
    
    // 1. XML Ayrıştırma (Parsing)
    try {
      parsed = this.parseXML(xmlContent);
    } catch (err: any) {
      console.error('[UBL_INVOICE_PROCESSOR] UBL XML parsing failed:', err.message);
      return {
        success: false,
        status: 'Failed',
        error: `XML Ayrıştırma Hatası: ${err.message}`
      };
    }

    // Mükerrer e-Fatura kontrolü (Resmi fatura tablosundan)
    try {
      const existingInvoice = await prisma.$queryRawUnsafe<any[]>(
        'SELECT invoice_id FROM invoice_headers WHERE ettn_no = $1 LIMIT 1',
        parsed.ettn_no
      );
      if (existingInvoice && existingInvoice.length > 0) {
        return {
          success: true,
          invoiceId: existingInvoice[0].invoice_id,
          status: 'Processed',
          error: 'Bu e-Fatura (ETTN) sistemde zaten işlenmiş durumda.'
        };
      }
    } catch (dbErr: any) {
      console.warn('[UBL_INVOICE_PROCESSOR] Duplicate check warning:', dbErr.message);
    }

    // 2. Akıllı Cari Eşleştirme (Supplier Resolver)
    let supplierId = '';
    try {
      const supplierRows = await prisma.$queryRawUnsafe<any[]>(
        'SELECT supplier_id FROM suppliers WHERE tax_no = $1 OR supplier_code = $1 LIMIT 1',
        parsed.supplier_vkn
      );

      if (!supplierRows || supplierRows.length === 0) {
        // Tedarikçi bulunamadı: faturayı gelen kutusunda askıya al
        const errMsg = `Cari Kart Bulunamadı - İncelemede (VKN/TCKN: ${parsed.supplier_vkn})`;
        await this.upsertIncomingInbox(parsed, xmlContent, 'Supplier NotFound', errMsg);
        throw new Error(errMsg);
      }
      supplierId = supplierRows[0].supplier_id;
    } catch (err: any) {
      console.warn('[UBL_INVOICE_PROCESSOR] Supplier resolution error:', err.message);
      return {
        success: false,
        status: 'Supplier NotFound',
        error: err.message
      };
    }

    // 3. Akıllı Stok ve Depo Eşleştirme (Stock/Product Resolver)
    const resolvedLines: any[] = [];
    try {
      for (const line of parsed.lines) {
        let stockId = '';
        let warehouseId = '';

        // Arama kriterleri:
        // 1. supplier_part_no = fatura_item_code veya stock_code = fatura_item_code
        // 2. barcode = fatura_barcode (barkod varsa)
        // 3. stock_name = fatura_item_name
        let stockRows: any[] = [];
        
        if (line.item_code) {
          stockRows = await prisma.$queryRawUnsafe<any[]>(
            'SELECT stock_id, default_warehouse_id FROM stocks WHERE supplier_part_no = $1 OR stock_code = $1 LIMIT 1',
            line.item_code
          );
        }

        if ((!stockRows || stockRows.length === 0) && line.barcode) {
          stockRows = await prisma.$queryRawUnsafe<any[]>(
            'SELECT stock_id, default_warehouse_id FROM stocks WHERE barcode = $1 LIMIT 1',
            line.barcode
          );
        }

        if (!stockRows || stockRows.length === 0) {
          stockRows = await prisma.$queryRawUnsafe<any[]>(
            'SELECT stock_id, default_warehouse_id FROM stocks WHERE stock_name = $1 LIMIT 1',
            line.item_name
          );
        }

        if (!stockRows || stockRows.length === 0) {
          const errMsg = `Eşleşmeyen Ürün Kodu: ${line.item_code || 'Kodsuz'} (${line.item_name}) - Fatura Askıya Alındı`;
          await this.upsertIncomingInbox(parsed, xmlContent, 'Product NotFound', errMsg);
          throw new Error(errMsg);
        }

        stockId = stockRows[0].stock_id;
        warehouseId = stockRows[0].default_warehouse_id;

        // Varsayılan depo tanımlanmamışsa, sistemdeki ilk depoyu fallback olarak seçiyoruz.
        if (!warehouseId) {
          const whRows = await prisma.$queryRawUnsafe<any[]>(
            'SELECT warehouse_id FROM warehouses LIMIT 1'
          );
          if (!whRows || whRows.length === 0) {
            const errMsg = 'Fiziksel envanter girişi için sistemde kayıtlı hiçbir depo bulunamadı!';
            await this.upsertIncomingInbox(parsed, xmlContent, 'Failed', errMsg);
            throw new Error(errMsg);
          }
          warehouseId = whRows[0].warehouse_id;
        }

        // Faturadaki satır tutarı doğruluğu (Miktar * Birim Fiyat doğrulaması)
        const lineNetBeforeDiscount = line.quantity * line.unit_price;
        const discountAmount = lineNetBeforeDiscount * (line.discount_rate / 100.0);
        const expectedNet = Math.round((lineNetBeforeDiscount - discountAmount) * 100) / 100;
        
        if (Math.abs(line.line_net_amount - expectedNet) > 0.10) {
          throw new Error(`Satır tutar doğrulaması başarısız! Satır net tutarı: ${line.line_net_amount}, beklenen: ${expectedNet}`);
        }

        resolvedLines.push({
          stock_id: stockId,
          warehouse_id: warehouseId,
          quantity: line.quantity,
          unit_price: line.unit_price,
          vat_rate: line.vat_rate,
          discount_rate: line.discount_rate
        });
      }
    } catch (err: any) {
      console.warn('[UBL_INVOICE_PROCESSOR] Product resolution error:', err.message);
      return {
        success: false,
        status: 'Product NotFound',
        error: err.message
      };
    }

    // 4. Veritabanı Entegrasyonu
    try {
      const isSQLite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.includes('.db');
      let invoiceId = '';

      if (isSQLite) {
        invoiceId = await this.createPurchaseInvoiceSQLite(parsed, supplierId, resolvedLines);
      } else {
        const result = await prisma.$queryRawUnsafe<any[]>(
          `SELECT create_purchase_invoice(
            $1, $2, $3::uuid, $4::date, $5, $6::numeric, $7::numeric, $8::numeric, $9::numeric, $10, $11::jsonb
          ) AS invoice_id`,
          parsed.invoice_no,
          parsed.ettn_no ? parsed.ettn_no : null,
          supplierId,
          parsed.invoice_date,
          parsed.currency,
          parsed.exchange_rate,
          parsed.total_net_amount,
          parsed.total_vat_amount,
          parsed.total_gross_amount,
          parsed.notes,
          JSON.stringify(resolvedLines)
        );
        invoiceId = result[0]?.invoice_id;
      }

      // Durumu 'Processed' (İşlendi) olarak güncelle ve faturayla ilişkilendir
      await this.upsertIncomingInbox(parsed, xmlContent, 'Processed', null, invoiceId);

      return {
        success: true,
        invoiceId,
        status: 'Processed'
      };
    } catch (execErr: any) {
      console.error('[UBL_INVOICE_PROCESSOR] Database transaction execution failed:', execErr.message);
      await this.upsertIncomingInbox(parsed, xmlContent, 'Failed', `Veritabanı Entegrasyon Hatası: ${execErr.message}`);
      return {
        success: false,
        status: 'Failed',
        error: execErr.message
      };
    }
  }

  /**
   * Helper function to insert or update incoming e-invoices in the inbox queue.
   */
  private static async upsertIncomingInbox(
    parsed: ParsedInvoice,
    xmlContent: string,
    status: string,
    errorMessage: string | null,
    processedInvoiceId: string | null = null
  ): Promise<void> {
    try {
      const isSQLite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.includes('.db');

      const existing = await prisma.$queryRawUnsafe<any[]>(
        'SELECT ettn_no FROM incoming_e_invoices WHERE ettn_no = $1 LIMIT 1',
        parsed.ettn_no
      );

      if (existing && existing.length > 0) {
        if (isSQLite) {
          await prisma.$queryRawUnsafe(
            `UPDATE incoming_e_invoices 
             SET invoice_no = $2, supplier_vkn = $3, invoice_date = $4, 
                 total_gross_amount = $5, currency = $6, exchange_rate = $7,
                 xml_content = $8, status = $9, error_message = $10, 
                 processed_invoice_id = $11, updated_at = datetime('now')
             WHERE ettn_no = $1`,
            parsed.ettn_no,
            parsed.invoice_no,
            parsed.supplier_vkn,
            parsed.invoice_date,
            parsed.total_gross_amount,
            parsed.currency,
            parsed.exchange_rate,
            xmlContent,
            status,
            errorMessage,
            processedInvoiceId
          );
        } else {
          await prisma.$queryRawUnsafe(
            `UPDATE incoming_e_invoices 
             SET invoice_no = $2, supplier_vkn = $3, invoice_date = $4::date, 
                 total_gross_amount = $5::numeric, currency = $6, exchange_rate = $7::numeric,
                 xml_content = $8, status = $9, error_message = $10, 
                 processed_invoice_id = $11::uuid, updated_at = NOW()
             WHERE ettn_no = $1`,
            parsed.ettn_no,
            parsed.invoice_no,
            parsed.supplier_vkn,
            parsed.invoice_date,
            parsed.total_gross_amount,
            parsed.currency,
            parsed.exchange_rate,
            xmlContent,
            status,
            errorMessage,
            processedInvoiceId
          );
        }
      } else {
        if (isSQLite) {
          await prisma.$queryRawUnsafe(
            `INSERT INTO incoming_e_invoices (
              ettn_no, invoice_no, supplier_vkn, invoice_date, total_gross_amount, 
              currency, exchange_rate, xml_content, status, error_message, processed_invoice_id, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, datetime('now'), datetime('now')
            )`,
            parsed.ettn_no,
            parsed.invoice_no,
            parsed.supplier_vkn,
            parsed.invoice_date,
            parsed.total_gross_amount,
            parsed.currency,
            parsed.exchange_rate,
            xmlContent,
            status,
            errorMessage,
            processedInvoiceId
          );
        } else {
          await prisma.$queryRawUnsafe(
            `INSERT INTO incoming_e_invoices (
              ettn_no, invoice_no, supplier_vkn, invoice_date, total_gross_amount, 
              currency, exchange_rate, xml_content, status, error_message, processed_invoice_id
            ) VALUES (
              $1, $2, $3, $4::date, $5::numeric, $6, $7::numeric, $8, $9, $10, $11::uuid
            )`,
            parsed.ettn_no,
            parsed.invoice_no,
            parsed.supplier_vkn,
            parsed.invoice_date,
            parsed.total_gross_amount,
            parsed.currency,
            parsed.exchange_rate,
            xmlContent,
            status,
            errorMessage,
            processedInvoiceId
          );
        }
      }
    } catch (err: any) {
      console.error('[UBL_INVOICE_PROCESSOR] Inbox logging upsert failed:', err.message);
    }
  }

  /**
   * Transactional SQLite implementation of purchase invoice creation.
   * Mirrors the create_purchase_invoice stored procedure.
   */
  private static async createPurchaseInvoiceSQLite(
    parsed: ParsedInvoice,
    supplierId: string,
    resolvedLines: any[]
  ): Promise<string> {
    const invoiceId = crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID();

    return await prisma.$transaction(async (tx) => {
      // 1. Check duplicate invoice_no
      const existing = await tx.$queryRawUnsafe<any[]>(
        'SELECT invoice_id FROM invoice_headers WHERE invoice_no = $1 LIMIT 1',
        parsed.invoice_no
      );
      if (existing && existing.length > 0) {
        throw new Error(`HATA: ${parsed.invoice_no} seri numaralı alış faturası sistemde zaten mevcut!`);
      }

      if (parsed.ettn_no) {
        const existingEttn = await tx.$queryRawUnsafe<any[]>(
          'SELECT invoice_id FROM invoice_headers WHERE ettn_no = $1 LIMIT 1',
          parsed.ettn_no
        );
        if (existingEttn && existingEttn.length > 0) {
          throw new Error(`HATA: ${parsed.ettn_no} ETTN kodlu e-Fatura sistemde zaten kayıtlı!`);
        }
      }

      // 2. Insert into invoice_headers (including open_amount)
      await tx.$queryRawUnsafe(
        `INSERT INTO invoice_headers (
          invoice_id, invoice_no, ettn_no, supplier_id, invoice_date, received_date,
          currency, exchange_rate, total_net_amount, total_vat_amount, total_gross_amount, open_amount, status, notes
        ) VALUES ($1, $2, $3, $4, $5, datetime('now'), $6, $7, $8, $9, $10, $11, $12, $13)`,
        invoiceId,
        parsed.invoice_no,
        parsed.ettn_no || null,
        supplierId,
        parsed.invoice_date,
        parsed.currency,
        parsed.exchange_rate,
        parsed.total_net_amount,
        parsed.total_vat_amount,
        parsed.total_gross_amount,
        parsed.total_gross_amount, // open_amount initially equals total_gross_amount
        'Approved',
        parsed.notes || ''
      );

      // 3. Insert into invoice_lines and update stocks and envanter
      for (const line of resolvedLines) {
        const lineId = crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID();
        
        const net_unit_price = line.unit_price * (1.0 - (line.discount_rate || 0) / 100.0);
        const line_net = Math.round(line.quantity * net_unit_price * 100) / 100;
        const line_vat = Math.round(line_net * (line.vat_rate / 100.0) * 100) / 100;
        const line_gross = line_net + line_vat;

        await tx.$queryRawUnsafe(
          `INSERT INTO invoice_lines (
            line_id, invoice_id, stock_id, warehouse_id, quantity, unit_price,
            vat_rate, discount_rate, line_net_amount, line_vat_amount, line_gross_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          lineId,
          invoiceId,
          line.stock_id,
          line.warehouse_id,
          line.quantity,
          line.unit_price,
          line.vat_rate,
          line.discount_rate || 0,
          line_net,
          line_vat,
          line_gross
        );

        // AOM calculate
        const stockRows = await tx.$queryRawUnsafe<any[]>(
          'SELECT total_stock, current_cost FROM stocks WHERE stock_id = $1 LIMIT 1',
          line.stock_id
        );
        if (!stockRows || stockRows.length === 0) {
          throw new Error(`Stok kartı bulunamadı: ${line.stock_id}`);
        }
        const current_stock = stockRows[0].total_stock || 0;
        const current_cost = stockRows[0].current_cost || 0;
        
        const local_unit_price = net_unit_price * parsed.exchange_rate;
        let new_cost = local_unit_price;
        if (current_stock + line.quantity > 0) {
          if (current_stock < 0) {
            new_cost = local_unit_price;
          } else {
            new_cost = ((current_stock * current_cost) + (line.quantity * local_unit_price)) / (current_stock + line.quantity);
          }
        }
        new_cost = Math.round(new_cost * 10000) / 10000; // 4 decimals

        // Update stocks
        await tx.$queryRawUnsafe(
          'UPDATE stocks SET total_stock = total_stock + $1, current_cost = $2 WHERE stock_id = $3',
          line.quantity,
          new_cost,
          line.stock_id
        );

        // Update stock_inventory
        const invRows = await tx.$queryRawUnsafe<any[]>(
          'SELECT inventory_id FROM stock_inventory WHERE stock_id = $1 AND warehouse_id = $2 LIMIT 1',
          line.stock_id,
          line.warehouse_id
        );
        if (invRows && invRows.length > 0) {
          await tx.$queryRawUnsafe(
            `UPDATE stock_inventory 
             SET current_stock = current_stock + $1, last_updated = datetime('now') 
             WHERE stock_id = $2 AND warehouse_id = $3`,
            line.quantity,
            line.stock_id,
            line.warehouse_id
          );
        } else {
          const invId = crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID();
          await tx.$queryRawUnsafe(
            `INSERT INTO stock_inventory (inventory_id, stock_id, warehouse_id, current_stock, last_updated) 
             VALUES ($1, $2, $3, $4, datetime('now'))`,
            invId,
            line.stock_id,
            line.warehouse_id,
            line.quantity
          );
        }
      }

      // 4. Update suppliers balance
      const supplierRows = await tx.$queryRawUnsafe<any[]>(
        'SELECT balance FROM suppliers WHERE supplier_id = $1 LIMIT 1',
        supplierId
      );
      const current_balance = supplierRows[0]?.balance || 0;
      const local_credit = Math.round(parsed.total_gross_amount * parsed.exchange_rate * 100) / 100;
      const new_balance = current_balance + local_credit;

      await tx.$queryRawUnsafe(
        'UPDATE suppliers SET balance = $1 WHERE supplier_id = $2',
        new_balance,
        supplierId
      );

      // 5. Insert into supplier_ledger (Credit/Alacak transaction)
      const ledgerId = crypto.randomUUID ? crypto.randomUUID() : require('crypto').randomUUID();
      await tx.$queryRawUnsafe(
        `INSERT INTO supplier_ledger (
          ledger_id, supplier_id, transaction_date, transaction_type, document_no,
          debit, credit, debit_fc, credit_fc, currency, exchange_rate, balance, description, created_at
        ) VALUES ($1, $2, datetime('now'), 'Purchase Invoice', $3, 0.00, $4, 0.00, $5, $6, $7, $8, $9, datetime('now'))`,
        ledgerId,
        supplierId,
        parsed.invoice_no,
        local_credit,
        parsed.total_gross_amount,
        parsed.currency,
        parsed.exchange_rate,
        new_balance,
        parsed.notes || 'Alış Faturası Girişi (Sistem Kaydı)'
      );

      return invoiceId;
    });
  }
}
