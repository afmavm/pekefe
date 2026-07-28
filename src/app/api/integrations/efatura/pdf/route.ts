import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { parseOrderSummaryBackend } from "@/modules/orders/server/orderActions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("id");
    const invoiceNo = searchParams.get("no") || "ATK2026000000001";
    const type = searchParams.get("type") || "EFATURA";

    if (!invoiceId) {
      return new NextResponse("Fatura ID bulunamadı.", { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        currentAccount: true,
        invoiceItems: true,
      },
    });

    if (!invoice) {
      return new NextResponse("Fatura bulunamadı.", { status: 404 });
    }

    const cmsData = await prisma.cMSData.findUnique({
      where: { id: "singleton" },
    });

    const banks = await prisma.bank.findMany();

    const account = invoice.currentAccount;
    const isCompany = account.cariTipi === "KURUMSAL";

    // Dynamic resolution of invoice type (e-Fatura or e-Arşiv)
    const noteType = invoice.notes?.match(/\[Fatura Tipi:\s*([A-Z]+)\]/)?.[1];
    const resolvedType = noteType || (account.taxNo && account.taxNo.trim().replace(/\s/g, "").length === 10 ? "EFATURA" : "EARSIV");
    const title = resolvedType === "EFATURA" ? "e-FATURA" : "e-ARŞİV FATURA";

    // e-Fatura metadata from notes
    const efSenaryo = invoice.notes?.match(/\[eF-Senaryo:\s*([A-Z]+)\]/)?.[1] || "TEMELFATURA";
    const efTip = invoice.notes?.match(/\[eF-Tip:\s*([A-Z]+)\]/)?.[1] || "SATIS";
    const efOdemeSekli = invoice.notes?.match(/\[eF-OdemeSekli:\s*([A-Z\/]+)\]/)?.[1] || "";
    const efOdemeArac = invoice.notes?.match(/\[eF-OdemeArac:\s*([^\]]+)\]/)?.[1] || "";
    const efTasiyici = invoice.notes?.match(/\[eF-Tasiyici:\s*([^\]]+)\]/)?.[1] || "";
    const efTasiyiciVKN = invoice.notes?.match(/\[eF-TasiyiciVKN:\s*([^\]]+)\]/)?.[1] || "";
    const efGonderim = invoice.notes?.match(/\[eF-Gonderim:\s*([^\]]+)\]/)?.[1] || "";
    const efWebSite = invoice.notes?.match(/\[eF-WebSite:\s*([^\]]+)\]/)?.[1] || "";
    const efGonder = invoice.notes?.includes("[eF-Gonder: EVET]");

    // Human-readable labels
    const senaryoLabel: Record<string,string> = { TEMELFATURA: "TEMEL FATURA", TICARIFATURA: "TİCARİ FATURA" };
    const tipLabel: Record<string,string> = { SATIS: "SATIŞ", IADE: "İADE", TEVKIFAT: "TEVKİFAT", ISTISNA: "İSTİSNA", OZELMATRAH: "ÖZEL MATRAH" };
    const odemeSekliLabel: Record<string,string> = { NAKIT: "Nakit", KREDIKARTI: "Kredi Kartı", EFT: "EFT/Havale", CEK: "Çek", SENET: "Senet", KAPIDAODEME: "Kapıda Ödeme", DIGER: "Diğer" };
    const tasiyiciLabel: Record<string,string> = { ARAS: "Aras Kargo", MNG: "MNG Kargo", YURTICI: "Yurt İçi Kargo", PTT: "PTT Kargo", UPS: "UPS Kargo", DHL: "DHL Express", FEDEX: "FedEx", TRENDYOL: "Trendyol Express", DIGER: "Diğer" };

    // Payment method from notes
    const paymentCode = invoice.notes?.match(/\[Ödeme:\s*([^\]]+)\]/)?.[1] || "CARI_HESAP";
    const paymentMethodMap: Record<string,string> = { CARI_HESAP: "Cari Hesap (Vadeli)", HAVALE_EFT: "Banka Havalesi/EFT", KREDI_KARTI: "Kredi Kartı", NAKIT: "Nakit" };
    const paymentMethodLabel = paymentMethodMap[paymentCode] || paymentCode;

    // Dynamic resolution of Serial No / Fatura No
    const parsedEFaturaNo = invoice.notes?.match(/\[e-Fatura No:\s*([A-Za-z0-9]+)\]/)?.[1]
      || invoice.notes?.match(/e-Fatura No:\s*([A-Za-z0-9]+)/)?.[1];
    const parsedSerial = invoice.notes?.match(/\[Seri No:\s*([A-Za-z0-9]+)\]/)?.[1];
    
    const customEFaturaPrefix = cmsData?.efaturaPrefix || "GIB";
    const customEArsivPrefix = cmsData?.earsivPrefix || "EAR";
    const defaultPrefix = resolvedType === "EFATURA" ? customEFaturaPrefix : customEArsivPrefix;

    // Count how many invoices exist before this one to get a sequential number
    const previousCount = await prisma.invoice.count({
      where: {
        type: invoice.type,
        date: {
          lt: invoice.date
        }
      }
    });
    const sequenceNumber = String(previousCount + 1).padStart(9, '0');

    const resolvedInvoiceNo = parsedEFaturaNo || parsedSerial || `${defaultPrefix}${new Date(invoice.date).getFullYear()}${sequenceNumber}`;

    // Dynamic currency resolution
    const currency = invoice.notes?.match(/\[Para:\s*([A-Z]+)/)?.[1] || account.currency || "TRY";

    const uuid = invoice.notes?.match(/UUID: ([a-z0-9-]+)/)?.[1] || "c4e12e34-5678-abcd-ef90-123456789abc";

    const invoiceDate = new Date(invoice.date).toLocaleDateString("tr-TR");
    const invoiceTime = new Date(invoice.date).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });

    // Reconstruct gross price, discounts and totals
    let grossTotal = 0;
    let totalDiscount = 0;

    let dbItems = invoice.invoiceItems || [];
    if (dbItems.length === 0) {
      const itemsString = typeof invoice.items === "string" 
        ? invoice.items 
        : (invoice.items ? JSON.stringify(invoice.items) : "");
      const parsedList = await parseOrderSummaryBackend(itemsString, invoice.totalAmount.toNumber());
      dbItems = parsedList.map((item, idx) => ({
        id: `fallback-${idx}`,
        invoiceId: invoice.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: { toNumber: () => item.price },
        vatRate: item.taxRate || 20,
        totalAmount: { toNumber: () => item.price * item.quantity }
      })) as any;
    }

    const parsedItems = dbItems.map((item) => {
      const quantity = item.quantity;
      const netUnitPrice = item.unitPrice.toNumber();
      const netRowTotal = quantity * netUnitPrice;

      let cleanName = item.name;
      let discountValue = 0;
      let discountType: "PERCENT" | "AMOUNT" = "PERCENT";

      const discMatch = item.name.match(/\s*\[İskonto:\s*([%₺$€])?([0-9.]+)([%₺$€])?\]/);
      if (discMatch) {
        cleanName = item.name.replace(/\s*\[İskonto:\s*[^\]]+\]/, "").trim();
        const prefix = discMatch[1];
        const valStr = discMatch[2];
        const suffix = discMatch[3];
        
        discountValue = parseFloat(valStr) || 0;
        if (prefix === "%" || suffix === "%") {
          discountType = "PERCENT";
        } else {
          discountType = "AMOUNT";
        }
      }

      let grossUnitPrice = netUnitPrice;
      let grossRowTotal = netRowTotal;
      let rowDiscountAmount = 0;

      if (discountValue > 0) {
        if (discountType === "PERCENT") {
          const factor = 1 - (discountValue / 100);
          grossUnitPrice = factor > 0 ? (netUnitPrice / factor) : 0;
          grossRowTotal = quantity * grossUnitPrice;
          rowDiscountAmount = grossRowTotal - netRowTotal;
        } else {
          grossRowTotal = netRowTotal + discountValue;
          grossUnitPrice = quantity > 0 ? (grossRowTotal / quantity) : 0;
          rowDiscountAmount = discountValue;
        }
      }

      grossTotal += grossRowTotal;
      totalDiscount += rowDiscountAmount;

      return {
        ...item,
        cleanName,
        discountValue,
        discountType,
        grossUnitPrice,
        grossRowTotal,
        rowDiscountAmount,
        netUnitPrice,
        netRowTotal
      };
    });

    // HTML Output for official styled invoice
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${resolvedInvoiceNo}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      margin: 0;
      padding: 20px;
      font-size: 11px;
      background-color: #fff;
    }
    .invoice-box {
      max-width: 800px;
      margin: auto;
      border: 1px solid #ccc;
      padding: 20px;
      position: relative;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .header-table td {
      vertical-align: top;
    }
    .logo-section {
      width: 50%;
    }
    .company-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #111;
    }
    .company-details {
      line-height: 1.4;
      color: #555;
    }
    .info-section {
      width: 50%;
      text-align: right;
    }
    .invoice-title {
      font-size: 18px;
      font-weight: bold;
      color: #c0392b;
      margin-bottom: 10px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .info-table td {
      padding: 3px 0;
      font-size: 10px;
    }
    .info-table td.lbl {
      color: #666;
      text-align: right;
      padding-right: 10px;
      font-weight: bold;
    }
    .info-table td.val {
      text-align: left;
      width: 120px;
      font-weight: bold;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .details-table td {
      vertical-align: top;
      width: 50%;
      border: 1px solid #ddd;
      padding: 10px;
    }
    .details-title {
      font-size: 12px;
      font-weight: bold;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
      margin-bottom: 8px;
      color: #2c3e50;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      padding: 6px;
      font-weight: bold;
      text-align: left;
      font-size: 10px;
    }
    .items-table td {
      border: 1px solid #ddd;
      padding: 6px;
      font-size: 10px;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .totals-table td {
      padding: 4px 6px;
      font-size: 10px;
    }
    .totals-table td.lbl {
      text-align: right;
      font-weight: bold;
      color: #555;
    }
    .totals-table td.val {
      text-align: right;
      width: 120px;
      font-weight: bold;
      border-bottom: 1px solid #ddd;
    }
    .totals-table tr.grand-total td {
      font-size: 12px;
      font-weight: bold;
      color: #c0392b;
      border-bottom: 2px double #c0392b;
    }
    .footer-section {
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 10px;
      text-align: center;
      color: #777;
      font-size: 9px;
    }
    .barcode {
      margin-top: 15px;
      text-align: right;
    }
    .stamp-container {
      position: absolute;
      bottom: 80px;
      left: 50px;
      border: 2px dashed #3498db;
      color: #3498db;
      padding: 10px;
      transform: rotate(-10deg);
      font-weight: bold;
      text-align: center;
      border-radius: 5px;
      opacity: 0.8;
      font-size: 10px;
    }
    @media print {
      body { padding: 0; }
      .invoice-box { border: none; }
      #print-bar, #print-spacer { display: none !important; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>

  <div class="invoice-box">
    <!-- GİB Stamp (text watermark for e-Fatura, real image for e-Arşiv) -->
    ${resolvedType === "EARSIV" && cmsData?.companyStampUrl
      ? `<div style="position:absolute; bottom:80px; left:40px; opacity:0.85;"><img src="${cmsData.companyStampUrl}" alt="Firma Kaşesi" style="max-width:140px; max-height:100px; transform:rotate(-8deg);" /></div>`
      : `<div class="stamp-container">GİB ONAYLI<br>E-FATURA SİSTEMİ</div>`
    }

    <!-- Header Section -->
    <table class="header-table">
      <tr>
        <td class="logo-section">
          ${cmsData?.logoUrl
            ? `<img src="${cmsData.logoUrl}" alt="${cmsData.siteName || 'Logo'}" style="max-height:60px; max-width:200px; object-fit:contain; margin-bottom:8px; display:block;" />`
            : ``
          }
          <div class="company-title">${cmsData?.companyName || "ATAK B2B E-TİCARET A.Ş."}</div>
          <div class="company-details">
            ${cmsData?.contactAddress ? cmsData.contactAddress.replace(/\n/g, "<br>") : "Merkez Mahallesi İstiklal Caddesi No:45/A<br>Şişli / İSTANBUL"}<br>
            Tel: ${cmsData?.contactPhone || "+90 (212) 555 12 34"}<br>
            E-Posta: ${cmsData?.contactEmail || "muhasebe@atakb2b.com"} | Web: ${cmsData?.siteName ? `www.${cmsData.siteName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "www.atakb2b.com"}<br>
            Mersis No: 0123456789012345 | Ticaret Sicil No: 987654<br>
            Şişli Vergi Dairesi - VKN: 1234567890
          </div>
        </td>
        <td class="info-section">
          <div class="invoice-title">${title}</div>
          <table class="info-table" style="float: right; width: auto;">
            <tr>
              <td class="lbl">Özelleştirme No:</td>
              <td class="val">TR1.2</td>
            </tr>
            <tr>
              <td class="lbl">Senaryo:</td>
              <td class="val">${senaryoLabel[efSenaryo] || efSenaryo}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura Tipi:</td>
              <td class="val">${tipLabel[efTip] || efTip}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura No:</td>
              <td class="val" style="color: #c0392b; font-size: 12px;">${resolvedInvoiceNo}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura Tarihi:</td>
              <td class="val">${invoiceDate}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura Zamanı:</td>
              <td class="val">${invoiceTime}</td>
            </tr>
            <tr>
              <td class="lbl">ETTN (UUID):</td>
              <td class="val" style="font-size: 8px; word-break: break-all; width: 140px;">${uuid}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Customer Details -->
    <table class="details-table">
      <tr>
        <td>
          <div class="details-title">MÜŞTERİ BİLGİLERİ (ALICI)</div>
          <div class="company-title">${account.name}</div>
          <div class="company-details">
            ${account.address || "Adres bilgisi girilmemiştir."}<br>
            E-Posta: ${account.email || "-"}<br>
            Telefon: ${account.phone || "-"}<br>
            ${account.taxOffice ? `Vergi Dairesi: ${account.taxOffice}` : ""}<br>
            <strong>${isCompany ? "VKN" : "TCKN"}:</strong> ${account.taxNo || account.tckn || "-"}
          </div>
        </td>
        <td>
          <div class="details-title">GÖNDERİM VE ÖDEME BİLGİLERİ</div>
          <div class="company-details">
            <strong>Ödeme Yöntemi:</strong> ${paymentMethodLabel}<br>
            ${efOdemeSekli ? `<strong>Ödeme Şekli:</strong> ${odemeSekliLabel[efOdemeSekli] || efOdemeSekli}<br>` : ""}
            ${efOdemeArac ? `<strong>Ödeme Aracı Kurum:</strong> ${efOdemeArac}<br>` : ""}
            <strong>Vade Tarihi:</strong> ${new Date(invoice.dueDate).toLocaleDateString("tr-TR")}<br>
            ${efTasiyici ? `<strong>Taşıyıcı Firma:</strong> ${tasiyiciLabel[efTasiyici] || efTasiyici}<br>` : ""}
            ${efTasiyiciVKN ? `<strong>Taşıyıcı VKN/TCKN:</strong> ${efTasiyiciVKN}<br>` : ""}
            ${efGonderim ? `<strong>Gönderim Tarihi:</strong> ${new Date(efGonderim).toLocaleDateString("tr-TR")}<br>` : ""}
            ${efWebSite ? `<strong>Satış Web Sitesi:</strong> <a href="${efWebSite}" style="color:#2980b9;">${efWebSite}</a><br>` : ""}
            <strong>Para Birimi:</strong> ${currency}<br>
            <br>
            <span style="font-size: 9px; color: #777;">
              * Bu fatura 213 sayılı V.U.K. hükümlerine göre elektronik ortamda düzenlenmiş olup, aslı ile aynı hukuki vasıflara sahiptir.
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Line Items -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">No</th>
          <th style="width: 45%;">Ürün / Hizmet Açıklaması</th>
          <th style="width: 10%; text-align: right;">Miktar</th>
          <th style="width: 10%;">Birim</th>
          <th style="width: 10%; text-align: right;">Birim Fiyat</th>
          <th style="width: 8%; text-align: center;">KDV %</th>
          <th style="width: 12%; text-align: right;">Toplam Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${parsedItems.map((item, idx) => {
          return `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td>
                <div style="font-weight: bold;">${item.cleanName}</div>
                ${item.rowDiscountAmount > 0 ? `<div style="font-size: 9px; color: #777; margin-top: 2px;">Brüt Birim Fiyat: ${formatCurrency(item.grossUnitPrice, currency)} | İskonto: ${item.discountType === "PERCENT" ? `%${item.discountValue}` : formatCurrency(item.rowDiscountAmount, currency)}</div>` : ""}
              </td>
              <td style="text-align: right;">${item.quantity}</td>
              <td>Adet</td>
              <td style="text-align: right;">${formatCurrency(item.netUnitPrice, currency)}</td>
              <td style="text-align: center;">%${item.vatRate}</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(item.netRowTotal + (item.netRowTotal * item.vatRate / 100), currency)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- Totals Area -->
    <table style="width: 100%;">
      <tr>
        <td style="vertical-align: top; width: 60%;">
          <div class="company-details" style="font-style: italic;">
            <strong>Yazıyla:</strong> # ${convertToText(invoice.totalAmount.toNumber(), currency)} #
          </div>
          <div class="barcode">
            <svg style="height: 40px; width: 160px;"></svg>
            <div style="font-size: 8px; text-align: right; padding-right: 25px; color: #555;">${uuid.substring(0, 18).toUpperCase()}</div>
          </div>
        </td>
        <td style="vertical-align: top; width: 40%;">
          <table class="totals-table">
            <tr>
              <td class="lbl">Mal Hizmet Toplamı:</td>
              <td class="val">${formatCurrency(grossTotal, currency)}</td>
            </tr>
            ${totalDiscount > 0 ? `
            <tr>
              <td class="lbl">Toplam İskonto:</td>
              <td class="val" style="color: #e74c3c;">-${formatCurrency(totalDiscount, currency)}</td>
            </tr>
            <tr>
              <td class="lbl">KDV Matrahı:</td>
              <td class="val">${formatCurrency(grossTotal - totalDiscount, currency)}</td>
            </tr>
            ` : ""}
            <tr>
              <td class="lbl">Hesaplanan KDV:</td>
              <td class="val">${formatCurrency(invoice.taxAmount.toNumber(), currency)}</td>
            </tr>
            <tr class="grand-total">
              <td class="lbl" style="font-size: 11px;">Ödenecek Toplam Tutar:</td>
              <td class="val" style="font-size: 12px;">${formatCurrency(invoice.totalAmount.toNumber(), currency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Bank Account Details (IBAN) -->
    ${(cmsData?.bankName && cmsData?.bankIban) || (banks && banks.length > 0) ? `
    <div style="margin-top: 20px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; font-family: Arial, sans-serif; text-align: left;">
      <div style="font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; tracking-wider; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        BANKA HESAP BİLGİLERİ (ÖDEME İÇİN)
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        ${cmsData?.bankName && cmsData?.bankIban ? `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 4px 0; font-weight: bold; color: #475569; width: 120px;">${cmsData.bankName}</td>
          <td style="padding: 4px 0; font-family: monospace; font-size: 11px; font-weight: bold; color: #0f172a;">${cmsData.bankIban}</td>
          <td style="padding: 4px 0; text-align: right; color: #64748b;">(Ana Hesap)</td>
        </tr>
        ` : ""}
        ${banks.map(bank => `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 4px 0; font-weight: bold; color: #475569; width: 120px;">${bank.name}</td>
          <td style="padding: 4px 0; font-family: monospace; font-size: 11px; font-weight: bold; color: #0f172a;">${bank.iban}</td>
          <td style="padding: 4px 0; text-align: right; color: #64748b;">(${bank.type} - ${bank.currency})</td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ""}

    <!-- Footer Disclaimer -->
    <div class="footer-section">
      ${resolvedType === "EARSIV" && cmsData?.companyStampUrl
        ? ``
        : `<span style="font-size:9px;color:#aaa;">Bu belge ${cmsData?.companyName || "Atak B2B"} tarafından elektronik ortamda düzenlenmiştir.</span>`
      }
      <br>e-Fatura Entegrasyon Altyapısı ATAK B2B Bulut Çözümleri tarafından sağlanmaktadır.<br>
      Raporlama Kodu: ISO-9001:2015 | Yazılım Versiyonu: v4.2.1-prod
    </div>
  </div>

  <!-- Print Toolbar (hidden on print) -->
  <div id="print-bar" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1e293b;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 12px rgba(0,0,0,0.4);font-family:Arial,sans-serif;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="color:#f97316;font-weight:900;font-size:13px;letter-spacing:1px;">🖨️ YAZDIR / PDF KAYDET</span>
      <span style="color:#94a3b8;font-size:11px;">Yazdır'a tıklayın veya &nbsp;<kbd style="background:#334155;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;">Ctrl+P</kbd>&nbsp; kullanın</span>
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="window.print()" style="background:#f97316;color:#000;border:none;padding:8px 20px;border-radius:8px;font-weight:900;font-size:13px;cursor:pointer;letter-spacing:0.5px;">🖨️ Yazdır</button>
      <button onclick="window.close()" style="background:#334155;color:#e2e8f0;border:none;padding:8px 16px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">✕ Kapat</button>
    </div>
  </div>
  <!-- Spacer for toolbar -->
  <div id="print-spacer" style="height:52px;"></div>

  <script>
    window.onload = function() {
      // Auto-trigger print dialog after short delay so page renders fully
      setTimeout(() => { window.print(); }, 400);
    };
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    return new NextResponse(`Fatura yüklenemedi: ${err.message}`, { status: 500 });
  }
}

// Convert amount to Turkish text
function convertToText(num: number, currencyCode = "TRY"): string {
  let currency = "TÜRK LİRASI";
  let subCurrency = "KURUŞ";
  if (currencyCode === "USD") {
    currency = "ABD DOLARI";
    subCurrency = "SENT";
  } else if (currencyCode === "EUR") {
    currency = "AVRO";
    subCurrency = "SENT";
  }
  
  const ones = ["", "BİR", "İKİ", "ÜÇ", "DÖRT", "BEŞ", "ALTI", "YEDİ", "SEKİZ", "DOKUZ"];
  const tens = ["", "ON", "YİRMİ", "OTUZ", "KIRK", "ELLİ", "ALTMIŞ", "YETMİŞ", "SEKSEN", "DOKSAN"];
  const thousands = ["", "BİN", "MİLYON", "MİLYAR", "TRİLYON"];

  const parts = num.toFixed(2).split(".");
  const integerPart = parseInt(parts[0]);
  const decimalPart = parseInt(parts[1]);

  const helper = (n: number): string => {
    let text = "";
    const b = n % 10;
    const o = Math.floor((n % 100) / 10);
    const y = Math.floor(n / 100);

    if (y > 0) {
      if (y === 1) text += "YÜZ";
      else text += ones[y] + "YÜZ";
    }
    text += tens[o] + ones[b];
    return text;
  };

  const getIntegerText = (n: number): string => {
    if (n === 0) return "SIFIR";
    let text = "";
    let i = 0;
    while (n > 0) {
      const triplet = n % 1000;
      if (triplet > 0) {
        let tripletText = helper(triplet);
        if (i === 1 && tripletText === "BİR") {
          tripletText = ""; // "Bir Bin" instead of "Bin" fixed
        }
        text = tripletText + thousands[i] + text;
      }
      n = Math.floor(n / 1000);
      i++;
    }
    return text;
  };

  const integerText = getIntegerText(integerPart);
  const decimalText = decimalPart > 0 ? getIntegerText(decimalPart) : "";

  if (decimalText) {
    return `${integerText} ${currency} ${decimalText} ${subCurrency}`;
  }
  return `${integerText} ${currency}`;
}
