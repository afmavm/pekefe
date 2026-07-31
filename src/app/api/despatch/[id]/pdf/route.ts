import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: despatchId } = await params;

    const despatch = await prisma.despatchAdvice.findUnique({
      where: { id: despatchId },
      include: {
        customerAccount: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!despatch) {
      return new NextResponse("İrsaliye bulunamadı.", { status: 404 });
    }

    const cmsData = await prisma.cMSData.findUnique({
      where: { id: "singleton" },
    });

    const account = despatch.customerAccount;
    const issueDate = new Date(despatch.issueDate).toLocaleDateString("tr-TR");
    const issueTime = new Date(despatch.issueDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const despatchDate = new Date(despatch.actualDespatchDate).toLocaleDateString("tr-TR");

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Sevk İrsaliyesi - ${despatch.despatchNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      color: #1a1a2e;
      background: #fff;
      padding: 24px;
      font-size: 12px;
    }
    .page {
      max-width: 820px;
      margin: auto;
      border: 2px solid #1a1a2e;
      padding: 24px;
      position: relative;
    }
    /* GIB Watermark */
    .gib-stamp {
      position: absolute;
      bottom: 90px;
      left: 40px;
      border: 2.5px dashed #e67e22;
      color: #e67e22;
      padding: 10px 14px;
      transform: rotate(-10deg);
      font-weight: 900;
      text-align: center;
      border-radius: 6px;
      opacity: 0.75;
      font-size: 11px;
      letter-spacing: 1px;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 3px solid #1a1a2e;
    }
    .company-logo img {
      max-height: 60px;
      max-width: 180px;
      object-fit: contain;
      margin-bottom: 6px;
      display: block;
    }
    .company-name {
      font-size: 16px;
      font-weight: 900;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .company-info {
      font-size: 10px;
      line-height: 1.6;
      color: #555;
    }
    .doc-info {
      text-align: right;
      min-width: 220px;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 900;
      color: #e67e22;
      letter-spacing: 1px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .doc-subtitle {
      font-size: 11px;
      font-weight: bold;
      color: #555;
      margin-bottom: 10px;
    }
    .meta-table {
      border-collapse: collapse;
      font-size: 10px;
      width: 100%;
    }
    .meta-table td {
      padding: 2px 4px;
    }
    .meta-table td.lbl {
      font-weight: bold;
      color: #666;
      text-align: right;
      padding-right: 8px;
      white-space: nowrap;
    }
    .meta-table td.val {
      font-weight: 700;
      color: #111;
    }
    /* Parties */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .party-box {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
    }
    .party-box .party-title {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #e67e22;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .party-box .party-name {
      font-size: 13px;
      font-weight: 900;
      color: #111;
      margin-bottom: 4px;
    }
    .party-box .party-detail {
      font-size: 10px;
      line-height: 1.6;
      color: #555;
    }
    /* Transport */
    .transport-box {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 18px;
      background: #fafafa;
    }
    .transport-box .section-title {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #1a1a2e;
      margin-bottom: 10px;
    }
    .transport-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      font-size: 10px;
    }
    .transport-grid .t-lbl { color: #888; font-weight: bold; margin-bottom: 2px; }
    .transport-grid .t-val { font-weight: 900; color: #111; }
    /* Line Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table thead tr {
      background: #1a1a2e;
      color: #fff;
    }
    .items-table th {
      padding: 7px 8px;
      font-size: 10px;
      font-weight: 700;
      text-align: left;
    }
    .items-table th.right { text-align: right; }
    .items-table td {
      padding: 7px 8px;
      font-size: 11px;
      border-bottom: 1px solid #eee;
    }
    .items-table td.right { text-align: right; font-weight: bold; }
    .items-table tbody tr:nth-child(even) { background: #f9f9f9; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1a1a2e; }
    .qty-badge {
      background: #e67e22;
      color: #fff;
      font-weight: 900;
      font-size: 12px;
      padding: 2px 10px;
      border-radius: 20px;
      display: inline-block;
    }
    /* Total */
    .totals-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .total-box {
      border: 2px solid #1a1a2e;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 900;
      color: #1a1a2e;
    }
    .total-box span { color: #e67e22; font-size: 16px; }
    /* Legal note */
    .legal-note {
      font-size: 9px;
      color: #888;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 10px;
      margin-top: 10px;
    }
    /* Signature boxes */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
    }
    .sig-box {
      border-top: 1px solid #aaa;
      padding-top: 8px;
      text-align: center;
      font-size: 10px;
      color: #555;
      font-weight: bold;
    }
    /* Footer */
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 9px;
      color: #aaa;
    }
    @media print {
      body { padding: 0; }
      .page { border: none; max-width: 100%; }
      #print-bar, #print-spacer { display: none !important; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- GİB Watermark -->
    <div class="gib-stamp">
      GİB ONAYLI<br>
      e-İRSALİYE
    </div>

    <!-- Header -->
    <div class="header">
      <div class="company-logo">
        ${cmsData?.logoUrl ? `<img src="${cmsData.logoUrl}" alt="${cmsData.siteName || 'Logo'}" />` : ""}
        <div class="company-name">${cmsData?.companyName || "PEKEFE B2B E-TİCARET A.Ş."}</div>
        <div class="company-info">
          ${cmsData?.contactAddress?.replace(/\n/g, "<br>") || "Merkez Mah. İstiklal Cad. No:45/A<br>Şişli / İSTANBUL"}<br>
          Tel: ${cmsData?.contactPhone || "+90 (212) 555 12 34"} | E-Posta: ${cmsData?.contactEmail || "info@atakb2b.com"}<br>
          VKN: 1234567890 | Ticaret Sicil: 987654
        </div>
      </div>

      <div class="doc-info">
        <div class="doc-title">Sevk İrsaliyesi</div>
        <div class="doc-subtitle">e-İrsaliye (GİB Entegre)</div>
        <table class="meta-table">
          <tr><td class="lbl">İrsaliye No:</td><td class="val">${despatch.despatchNo}</td></tr>
          <tr><td class="lbl">ETTN No:</td><td class="val" style="font-size:9px">${despatch.ettnNo.substring(0,18).toUpperCase()}…</td></tr>
          <tr><td class="lbl">Düzenleme Tarihi:</td><td class="val">${issueDate} ${issueTime}</td></tr>
          <tr><td class="lbl">Sevk Tarihi:</td><td class="val">${despatchDate}</td></tr>
          <tr><td class="lbl">Durum:</td><td class="val" style="color:#27ae60">${despatch.status}</td></tr>
        </table>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-box">
        <div class="party-title">📦 Gönderen (Satıcı)</div>
        <div class="party-name">${cmsData?.companyName || "PEKEFE B2B E-TİCARET A.Ş."}</div>
        <div class="party-detail">
          ${cmsData?.contactAddress?.replace(/\n/g, "<br>") || "Merkez Mah. İstiklal Cad. No:45/A<br>Şişli / İSTANBUL"}<br>
          VKN: 1234567890<br>
          Tel: ${cmsData?.contactPhone || "+90 (212) 555 12 34"}
        </div>
      </div>
      <div class="party-box">
        <div class="party-title">🏢 Alıcı (Müşteri)</div>
        <div class="party-name">${account.cariTipi === "KURUMSAL" ? (account.name || `${account.ad || ""} ${account.soyad || ""}`.trim()) : `${account.ad || ""} ${account.soyad || ""}`.trim()}</div>
        <div class="party-detail">
          ${account.address ? account.address.replace(/\n/g, "<br>") : "—"}<br>
          ${account.taxNo ? `VKN/TCKN: ${account.taxNo}<br>` : ""}
          ${account.taxOffice ? `Vergi Dairesi: ${account.taxOffice}<br>` : ""}
          Tel: ${account.phone || "—"} | E-Posta: ${account.email || "—"}
        </div>
      </div>
    </div>

    <!-- Transport Info -->
    ${(despatch.carrierId || despatch.driverName || despatch.licensePlate) ? `
    <div class="transport-box">
      <div class="section-title">🚛 Taşıma Bilgileri</div>
      <div class="transport-grid">
        <div>
          <div class="t-lbl">Taşıyıcı</div>
          <div class="t-val">${despatch.carrierId || "—"}</div>
        </div>
        <div>
          <div class="t-lbl">Sürücü Adı</div>
          <div class="t-val">${despatch.driverName || "—"}</div>
        </div>
        <div>
          <div class="t-lbl">TC Kimlik No</div>
          <div class="t-val">${despatch.driverIdentityNo || "—"}</div>
        </div>
        <div>
          <div class="t-lbl">Plaka</div>
          <div class="t-val">${despatch.licensePlate || "—"}</div>
        </div>
      </div>
    </div>
    ` : ""}

    <!-- Line Items -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:5%">No</th>
          <th style="width:50%">Ürün / Hizmet Açıklaması</th>
          <th style="width:15%">Ürün Kodu</th>
          <th style="width:10%">Birim</th>
          <th class="right" style="width:20%">Miktar</th>
        </tr>
      </thead>
      <tbody>
        ${despatch.lines.map((line, idx) => `
        <tr>
          <td style="text-align:center;color:#888">${idx + 1}</td>
          <td style="font-weight:bold">${line.product?.name || "—"}</td>
          <td style="font-family:monospace;font-size:10px;color:#555">${line.product?.sku || line.productId.substring(0, 10)}</td>
          <td>Adet</td>
          <td class="right"><span class="qty-badge">${line.quantity}</span></td>
        </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Total -->
    <div class="totals-row">
      <div class="total-box">
        Toplam Kalem Sayısı: <span>${despatch.lines.length}</span> &nbsp;|&nbsp;
        Toplam Adet: <span>${despatch.lines.reduce((s, l) => s + l.quantity, 0)}</span>
      </div>
    </div>

    <!-- Signature Boxes -->
    <div class="signatures">
      <div class="sig-box">Gönderen İmza / Kaşe</div>
      <div class="sig-box">Taşıyıcı İmza</div>
      <div class="sig-box">Teslim Alan İmza / Kaşe</div>
    </div>

    <!-- Legal Note -->
    <div class="legal-note">
      Bu belge 213 sayılı V.U.K. hükümlerine göre elektronik ortamda düzenlenmiş Sevk İrsaliyesidir. GİB entegrasyonu ile oluşturulmuştur.<br>
      ${cmsData?.companyName || "PEKEFE B2B"} | ${cmsData?.contactPhone || ""} | ${cmsData?.contactEmail || ""}
    </div>

    <!-- Footer -->
    <div class="footer">
      e-İrsaliye Altyapısı PEKEFE B2B Bulut Çözümleri tarafından sağlanmaktadır. | Yazılım Versiyonu: v4.2.1-prod
    </div>

  </div>

  <!-- Print Toolbar (hidden on print) -->
  <div id="print-bar" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a1a2e;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 12px rgba(0,0,0,0.4);font-family:Arial,sans-serif;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="color:#e67e22;font-weight:900;font-size:13px;letter-spacing:1px;">🖨️ YAZDIR / PDF KAYDET</span>
      <span style="color:#94a3b8;font-size:11px;">Yazdır'a tıklayın veya &nbsp;<kbd style="background:#334155;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;">Ctrl+P</kbd>&nbsp; kullanın</span>
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="window.print()" style="background:#e67e22;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:900;font-size:13px;cursor:pointer;letter-spacing:0.5px;">🖨️ Yazdır</button>
      <button onclick="window.close()" style="background:#334155;color:#e2e8f0;border:none;padding:8px 16px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">✕ Kapat</button>
    </div>
  </div>
  <!-- Spacer for toolbar -->
  <div id="print-spacer" style="height:52px;"></div>

  <script>
    window.onload = () => {
      document.title = "\u0130rsaliye - ${despatch.despatchNo}";
      // Auto-trigger print dialog after short delay so page renders fully
      setTimeout(() => { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    console.error("İrsaliye PDF hatası:", err);
    return new NextResponse("İrsaliye oluşturulamadı: " + err.message, { status: 500 });
  }
}
