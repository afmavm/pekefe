import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'xmlbuilder2';

export interface DespatchLineInput {
  productId: string;
  quantity: number;
}

export interface DespatchAdviceRequest {
  customerAccountId: string;
  invoiceId?: string | null;
  issueDate: Date | string;
  actualDespatchDate: Date | string;
  carrierId?: string | null;
  driverName?: string | null;
  driverIdentityNo?: string | null;
  licensePlate?: string | null;
  lines: DespatchLineInput[];
}

export class DespatchService {
  
  /**
   * SQLite ve PostgreSQL üzerinde gerekli irsaliye tablolarını ve 
   * Invoice tablosuna "stock_movement" bayrağını güvenli bir şekilde ekler.
   */
  static async ensureDespatchTables() {
    try {
      const isSQLite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.includes('.db');

      // 1. despatch_advices tablosunu oluştur
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS despatch_advices (
          despatch_id TEXT PRIMARY KEY,
          despatch_no TEXT UNIQUE NOT NULL,
          ettn_no TEXT UNIQUE NOT NULL,
          customer_id TEXT NOT NULL,
          invoice_id TEXT,
          issue_date TIMESTAMP NOT NULL,
          actual_despatch_date TIMESTAMP NOT NULL,
          carrier_id TEXT,
          driver_name TEXT,
          driver_identity_no TEXT,
          license_plate TEXT,
          status TEXT DEFAULT 'Draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. despatch_lines tablosunu oluştur
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS despatch_lines (
          line_id TEXT PRIMARY KEY,
          despatch_id TEXT NOT NULL,
          stock_id TEXT NOT NULL,
          quantity REAL NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 3. Invoice tablosuna stock_movement kolonunu ekle
      try {
        if (isSQLite) {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE Invoice ADD COLUMN stock_movement INTEGER DEFAULT 0
          `);
        } else {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "Invoice" ADD COLUMN stock_movement BOOLEAN DEFAULT FALSE
          `);
        }
        console.log("[DESPATCH_SERVICE] stock_movement column checked/added to Invoice table.");
      } catch (alterError: any) {
        // Kolon zaten varsa hata yutulur
        if (!alterError.message.includes("duplicate column") && !alterError.message.includes("already exists")) {
          console.warn("[DESPATCH_SERVICE] Invoice alter warning:", alterError.message);
        }
      }
    } catch (e) {
      console.error("[DESPATCH_SERVICE_TABLE_CREATE_ERROR]:", e);
    }
  }

  /**
   * Çift stok düşümünü önleyen, transaction korumalı e-İrsaliye oluşturma fonksiyonu.
   */
  static async createDespatchAdvice(request: DespatchAdviceRequest) {
    // Tabloların varlığından emin ol
    await this.ensureDespatchTables();

    if (!request.lines || request.lines.length === 0) {
      throw new Error("İrsaliye oluşturmak için en az bir satır (ürün) eklemelisiniz.");
    }

    const despatchId = uuidv4();
    const ettnNo = uuidv4();
    const currentYear = new Date(request.issueDate).getFullYear();
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000); // 9 haneli benzersiz fiş no
    const despatchNo = `IRS${currentYear}${randomSuffix}`;

    const issueDateParsed = new Date(request.issueDate);
    const actualDespatchDateParsed = new Date(request.actualDespatchDate);

    // Atomik transaction
    return await prisma.$transaction(async (tx) => {
      let deductStock = true;

      // 1. Fatura kontrolü ve mükerrer stok düşümü engelleme (Gold Standard 2)
      if (request.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: request.invoiceId }
        });

        if (!invoice) {
          throw new Error(`Belirtilen fatura bulunamadı: ${request.invoiceId}`);
        }

        // Eğer fatura üzerinden stok düşümü zaten yapıldıysa (stockMovement === true)
        // irsaliyede stok düşümünü atla
        if ((invoice as any).stockMovement === true || (invoice as any).stockMovement === 1) {
          deductStock = false;
          console.log(`[DESPATCH_STOCK_BYPASS] Invoice ${request.invoiceId} already handled stock movement. Bypassing stock deduction for despatch.`);
        }
      }

      // 2. İrsaliye Üst Bilgisini (DespatchAdvice) kaydet
      // Prisma generated client direct model mapping'i kullanarak raw insert atıyoruz
      const isSQLite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.includes('.db');
      const dateFunc = isSQLite ? "datetime('now')" : "NOW()";

      await tx.$executeRawUnsafe(`
        INSERT INTO despatch_advices (
          despatch_id, despatch_no, ettn_no, customer_id, invoice_id, 
          issue_date, actual_despatch_date, carrier_id, driver_name, 
          driver_identity_no, license_plate, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Draft', ${dateFunc}, ${dateFunc})
      `, 
        despatchId, despatchNo, ettnNo, request.customerAccountId, request.invoiceId || null,
        issueDateParsed.toISOString(), actualDespatchDateParsed.toISOString(), request.carrierId || null,
        request.driverName || null, request.driverIdentityNo || null, request.licensePlate || null
      );

      // 3. İrsaliye Satırlarını (DespatchLine) kaydet ve Stok Güncelle
      const processedLines = [];
      for (const line of request.lines) {
        const lineId = uuidv4();
        
        // Ürün kontrolü
        const product = await tx.product.findUnique({
          where: { id: line.productId }
        });

        if (!product) {
          throw new Error(`Ürün bulunamadı: ${line.productId}`);
        }

        // Satır kaydını ekle
        await tx.$executeRawUnsafe(`
          INSERT INTO despatch_lines (line_id, despatch_id, stock_id, quantity, created_at, updated_at)
          VALUES ($1, $2, $3, $4, ${dateFunc}, ${dateFunc})
        `, lineId, despatchId, line.productId, line.quantity);

        // Stok Düşümü ve Denetim (Audit) Hareketi Loglama
        if (deductStock) {
          if (product.stock < line.quantity) {
            throw new Error(`Yetersiz stok! Ürün: ${product.name} (Stok: ${product.stock}, Sevk: ${line.quantity})`);
          }

          // Envanteri azalt
          await tx.product.update({
            where: { id: line.productId },
            data: { stock: { decrement: line.quantity } }
          });

          // StockTransaction audit log kaydı ekle
          await tx.stockTransaction.create({
            data: {
              productId: line.productId,
              type: 'OUT',
              quantity: line.quantity,
              description: `e-İrsaliye #${despatchNo} sevkiyat çıkışı.`,
              moduleSource: 'DESPATCH',
              referenceId: despatchId
            }
          });
        }

        processedLines.push({
          lineId,
          productId: line.productId,
          productName: product.name,
          quantity: line.quantity
        });
      }

      // 4. Eğer fatura üzerinde stok düşümü henüz yapılmadıysa ve bu irsaliye ile düşüldüyse,
      // faturanın stok hareket bayrağını kilitle
      if (request.invoiceId && deductStock) {
        await tx.invoice.update({
          where: { id: request.invoiceId },
          data: { stockMovement: true } as any
        });
      }

      console.log(`[DESPATCH_CREATED] Despatch Advice #${despatchNo} created successfully. Stock Deducted: ${deductStock}`);

      return {
        despatchId,
        despatchNo,
        ettnNo,
        stockDeducted: deductStock,
        lines: processedLines
      };
    });
  }

  /**
   * xmlbuilder2 kullanarak GİB DespatchAdvice standartlarında XML üreten motor (Gold Standard 3)
   */
  static async generateDespatchXML(despatchId: string): Promise<string> {
    await this.ensureDespatchTables();

    // 1. İrsaliye üst ve satır verilerini sorgula
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM despatch_advices WHERE despatch_id = $1 LIMIT 1`,
      despatchId
    );
    if (!rows || rows.length === 0) {
      throw new Error(`İrsaliye bulunamadı: ${despatchId}`);
    }
    const despatch = rows[0];

    const lines = await prisma.$queryRawUnsafe<any[]>(
      `SELECT dl.*, p.name as product_name, p.sku as product_sku 
       FROM despatch_lines dl
       JOIN Product p ON dl.stock_id = p.id
       WHERE dl.despatch_id = $1`,
      despatchId
    );

    // Cari müşteri bilgilerini sorgula
    const customer = await prisma.currentAccount.findUnique({
      where: { id: despatch.customer_id }
    });
    if (!customer) {
      throw new Error(`İrsaliye müşterisi bulunamadı: ${despatch.customer_id}`);
    }

    // CMSData'dan Gönderici (Biz) bilgilerini çek
    let companyName = "ATAK ARICILIK LİMİTED ŞİRKETİ";
    let companyVkn = "1234567890";
    let companyTaxOffice = "Boğaziçi";
    let companyAddress = "Kayseri OSB 1. Cadde No: 5";
    let companyCity = "Kayseri";

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

    // Taşıyıcı / Kargo cari bilgilerini çöz
    let carrierName = "Kendi Aracımız";
    let carrierVkn = companyVkn;
    if (despatch.carrier_id) {
      const carrierAcc = await prisma.currentAccount.findUnique({
        where: { id: despatch.carrier_id }
      });
      if (carrierAcc) {
        carrierName = carrierAcc.name;
        carrierVkn = carrierAcc.taxId || carrierAcc.tckn || "9999999999";
      }
    }

    // Tarih formatlamaları
    const issueDateObj = new Date(despatch.issue_date);
    const actualDespatchDateObj = new Date(despatch.actual_despatch_date);
    const issueDateStr = issueDateObj.toISOString().split('T')[0];
    const issueTimeStr = issueDateObj.toTimeString().split(' ')[0];
    const actualDespatchDateStr = actualDespatchDateObj.toISOString().split('T')[0];
    const actualDespatchTimeStr = actualDespatchDateObj.toTimeString().split(' ')[0];

    // xmlbuilder2 ile XML oluştur
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('DespatchAdvice', {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2 http://www.oasis-open.org/committees/ubl/schema/xsd/UBL-DespatchAdvice-2.1.xsd'
      });

    // Temel Belge Bilgileri
    root.ele('cbc:UBLVersionID').txt('2.1').up();
    root.ele('cbc:CustomizationID').txt('TR1.2').up();
    root.ele('cbc:ProfileID').txt('TEMELIRSALIYE').up();
    root.ele('cbc:ID').txt(despatch.despatch_no).up();
    root.ele('cbc:UUID').txt(despatch.ettn_no).up();
    root.ele('cbc:IssueDate').txt(issueDateStr).up();
    root.ele('cbc:IssueTime').txt(issueTimeStr).up();
    root.ele('cbc:DespatchAdviceTypeCode').txt('SEVK').up();

    // Sipariş/Fatura Referansları (Varsa)
    if (despatch.invoice_id) {
      root.ele('cac:AdditionalDocumentReference')
        .ele('cbc:ID').txt(despatch.invoice_id).up()
        .ele('cbc:IssueDate').txt(issueDateStr).up()
        .ele('cbc:DocumentType').txt('Fatura Referansı').up()
      .up();
    }

    // Gönderici Taraf (DespatchSupplierParty)
    const supplierParty = root.ele('cac:DespatchSupplierParty').ele('cac:Party');
    supplierParty.ele('cac:PartyIdentification')
      .ele('cbc:ID', { schemeID: 'VKN' }).txt(companyVkn).up()
    .up();
    supplierParty.ele('cac:PartyName')
      .ele('cbc:Name').txt(companyName).up()
    .up();
    supplierParty.ele('cac:PostalAddress')
      .ele('cbc:StreetName').txt(companyAddress).up()
      .ele('cbc:CityName').txt(companyCity).up()
      .ele('cac:Country')
        .ele('cbc:Name').txt('Türkiye').up()
      .up()
    .up();
    supplierParty.ele('cac:PartyTaxScheme')
      .ele('cac:TaxScheme')
        .ele('cbc:Name').txt(companyTaxOffice).up()
      .up()
    .up();
    supplierParty.up().up(); // close cac:Party and cac:DespatchSupplierParty

    // Alıcı Taraf (DeliveryCustomerParty)
    const customerParty = root.ele('cac:DeliveryCustomerParty').ele('cac:Party');
    const customerIdType = customer.taxId || customer.tckn ? (customer.taxId ? 'VKN' : 'TCKN') : 'TCKN';
    const customerIdVal = customer.taxId || customer.tckn || '22222222222';
    
    customerParty.ele('cac:PartyIdentification')
      .ele('cbc:ID', { schemeID: customerIdType }).txt(customerIdVal).up()
    .up();
    customerParty.ele('cac:PartyName')
      .ele('cbc:Name').txt(customer.name).up()
    .up();
    customerParty.ele('cac:PostalAddress')
      .ele('cbc:StreetName').txt(customer.address || 'Adres Belirtilmedi').up()
      .ele('cbc:CityName').txt(customer.address?.includes('/') ? customer.address.split('/').pop()?.trim() || 'İstanbul' : 'İstanbul').up()
      .ele('cac:Country')
        .ele('cbc:Name').txt('Türkiye').up()
      .up()
    .up();
    customerParty.up().up(); // close cac:Party and cac:DeliveryCustomerParty

    // Sevkiyat ve Taşıma Detayları (Shipment)
    const shipment = root.ele('cac:Shipment');
    shipment.ele('cbc:ID').txt('1').up();
    
    // Taşıma Aşaması (Şoför ve Plaka) - Kendi aracımız veya kargo
    const shipmentStage = shipment.ele('cac:ShipmentStage');
    shipmentStage.ele('cbc:ID').txt('1').up();
    shipmentStage.ele('cbc:TransportModeCode').txt('1').up(); // 1 = Kara Yolu

    // Plaka bilgisi varsa ekle
    if (despatch.license_plate) {
      shipmentStage.ele('cac:TransportMeans')
        .ele('cac:RoadTransport')
          .ele('cbc:LicensePlateID').txt(despatch.license_plate).up()
        .up()
      .up();
    }

    // Şoför bilgileri varsa ekle (DriverPerson)
    if (despatch.driver_name) {
      const nameParts = despatch.driver_name.trim().split(' ');
      const driverFirstName = nameParts.slice(0, -1).join(' ') || despatch.driver_name;
      const driverFamilyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Sürücü';

      shipmentStage.ele('cac:DriverPerson')
        .ele('cbc:FirstName').txt(driverFirstName).up()
        .ele('cbc:FamilyName').txt(driverFamilyName).up()
        .ele('cac:IdentityDocumentReference')
          .ele('cbc:ID').txt(despatch.driver_identity_no || '11111111111').up()
        .up()
      .up();
    }
    shipmentStage.up(); // close cac:ShipmentStage

    // Teslimat Adresi (Delivery)
    shipment.ele('cac:Delivery')
      .ele('cac:DeliveryAddress')
        .ele('cbc:StreetName').txt(customer.address || 'Adres Belirtilmedi').up()
        .ele('cbc:CityName').txt('İstanbul').up()
        .ele('cac:Country')
          .ele('cbc:Name').txt('Türkiye').up()
        .up()
      .up()
    .up();

    // Taşıyıcı Firma Detayları (CarrierParty)
    shipment.ele('cac:DeliveryTerms')
      .ele('cac:CarrierParty')
        .ele('cac:PartyIdentification')
          .ele('cbc:ID', { schemeID: carrierVkn.length === 10 ? 'VKN' : 'TCKN' }).txt(carrierVkn).up()
        .up()
        .ele('cac:PartyName')
          .ele('cbc:Name').txt(carrierName).up()
        .up()
      .up()
    .up();

    shipment.up(); // close cac:Shipment

    // İrsaliye Satırları (DespatchLine)
    lines.forEach((line, index) => {
      root.ele('cac:DespatchLine')
        .ele('cbc:ID').txt((index + 1).toString()).up()
        .ele('cbc:DeliveredQuantity', { unitCode: 'C62' }).txt(line.quantity.toString()).up()
        .ele('cac:OrderLineReference')
          .ele('cbc:LineID').txt((index + 1).toString()).up()
        .up()
        .ele('cac:Item')
          .ele('cbc:Name').txt(line.product_name).up()
          .ele('cac:SellersItemIdentification')
            .ele('cbc:ID').txt(line.product_sku).up()
          .up()
        .up()
      .up();
    });

    return root.end({ prettyPrint: true });
  }
}
