"use strict";(()=>{var a={};a.id=1397,a.ids=[172,1397,8329],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{a.exports=require("node:process")},1932:a=>{a.exports=require("url")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{a.exports=require("node:tty")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11639:(a,b)=>{Object.defineProperty(b,"__esModule",{value:!0})},11723:a=>{a.exports=require("querystring")},12412:a=>{a.exports=require("assert")},14985:a=>{a.exports=require("dns")},16698:a=>{a.exports=require("node:async_hooks")},21820:a=>{a.exports=require("os")},24424:(a,b)=>{function c(a){for(let b=0;b<a.length;b++){let c=a[b];if("function"!=typeof c)throw Object.defineProperty(Error(`A "use server" file can only export async functions, found ${typeof c}.
Read more: https://nextjs.org/docs/messages/invalid-use-server-value`),"__NEXT_ERROR_CODE",{value:"E352",enumerable:!1,configurable:!0})}}Object.defineProperty(b,"D",{enumerable:!0,get:function(){return c}})},27910:a=>{a.exports=require("stream")},28329:(a,b,c)=>{c.d(b,{getLocalOrders:()=>k,j:()=>j,readLocalOrders:()=>i});var d=c(29021),e=c.n(d),f=c(33873),g=c.n(f);let h=g().join(process.cwd(),"data","orders_db.json");function i(){try{try{let a=g().dirname(h);e().existsSync(a)||e().mkdirSync(a,{recursive:!0}),e().existsSync(h)||e().writeFileSync(h,"[]","utf-8")}catch(a){console.error("Error ensuring local orders DB file:",a)}if(e().existsSync(h)){let a=e().readFileSync(h,"utf-8"),b=JSON.parse(a);return Array.isArray(b)?b:[]}}catch(a){console.error("Error reading local orders DB:",a)}return[]}function j(a){try{let b=i(),c=b.findIndex(b=>b.id===a.id||b.orderNumber&&a.orderNumber&&b.orderNumber===a.orderNumber),d={...a,id:a.id,orderNumber:a.orderNumber||a.id,client:a.client||a.customerName||"M\xfcşteri",date:a.date||new Date().toISOString(),status:a.status||"Yeni",amount:Number(a.amount??a.total??0),createdAt:a.createdAt||new Date().toISOString()};return c>=0?b[c]={...b[c],...d}:b.unshift(d),e().writeFileSync(h,JSON.stringify(b,null,2),"utf-8"),d}catch(b){return console.error("Error saving local order:",b),a}}let k=i},28354:a=>{a.exports=require("util")},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{a.exports=require("node:child_process")},33873:a=>{a.exports=require("path")},34631:a=>{a.exports=require("tls")},38107:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>F,patchFetch:()=>E,routeModule:()=>A,serverHooks:()=>D,workAsyncStorage:()=>B,workUnitAsyncStorage:()=>C});var d={};c.r(d),c.d(d,{GET:()=>z});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(93061);function x(a,b="TRY"){return new Intl.NumberFormat("tr-TR",{style:"currency",currency:b,minimumFractionDigits:2}).format(a)}var y=c(66814);async function z(a){try{let{searchParams:b}=new URL(a.url),c=b.get("id");if(b.get("no"),b.get("type"),!c)return new v.NextResponse("Fatura ID bulunamadı.",{status:400});let d=await w.prisma.invoice.findUnique({where:{id:c},include:{currentAccount:!0,invoiceItems:!0}});if(!d)return new v.NextResponse("Fatura bulunamadı.",{status:404});let e=await w.prisma.cMSData.findUnique({where:{id:"singleton"}}),f=await w.prisma.bank.findMany(),g=d.currentAccount,h="KURUMSAL"===g.cariTipi,i=d.notes?.match(/\[Fatura Tipi:\s*([A-Z]+)\]/)?.[1]||(g.taxNo&&10===g.taxNo.trim().replace(/\s/g,"").length?"EFATURA":"EARSIV"),j="EFATURA"===i?"e-FATURA":"e-ARŞİV FATURA",k=d.notes?.match(/\[eF-Senaryo:\s*([A-Z]+)\]/)?.[1]||"TEMELFATURA",l=d.notes?.match(/\[eF-Tip:\s*([A-Z]+)\]/)?.[1]||"SATIS",m=d.notes?.match(/\[eF-OdemeSekli:\s*([A-Z\/]+)\]/)?.[1]||"",n=d.notes?.match(/\[eF-OdemeArac:\s*([^\]]+)\]/)?.[1]||"",o=d.notes?.match(/\[eF-Tasiyici:\s*([^\]]+)\]/)?.[1]||"",p=d.notes?.match(/\[eF-TasiyiciVKN:\s*([^\]]+)\]/)?.[1]||"",q=d.notes?.match(/\[eF-Gonderim:\s*([^\]]+)\]/)?.[1]||"",r=d.notes?.match(/\[eF-WebSite:\s*([^\]]+)\]/)?.[1]||"";d.notes?.includes("[eF-Gonder: EVET]");let s=d.notes?.match(/\[Ödeme:\s*([^\]]+)\]/)?.[1]||"CARI_HESAP",t=d.notes?.match(/\[e-Fatura No:\s*([A-Za-z0-9]+)\]/)?.[1]||d.notes?.match(/e-Fatura No:\s*([A-Za-z0-9]+)/)?.[1],u=d.notes?.match(/\[Seri No:\s*([A-Za-z0-9]+)\]/)?.[1],z=e?.efaturaPrefix||"GIB",A=e?.earsivPrefix||"EAR",B=await w.prisma.invoice.count({where:{type:d.type,date:{lt:d.date}}}),C=String(B+1).padStart(9,"0"),D=t||u||`${"EFATURA"===i?z:A}${new Date(d.date).getFullYear()}${C}`,E=d.notes?.match(/\[Para:\s*([A-Z]+)/)?.[1]||g.currency||"TRY",F=d.notes?.match(/UUID: ([a-z0-9-]+)/)?.[1]||"c4e12e34-5678-abcd-ef90-123456789abc",G=new Date(d.date).toLocaleDateString("tr-TR"),H=new Date(d.date).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),I=0,J=0,K=d.invoiceItems||[];if(0===K.length){let a="string"==typeof d.items?d.items:d.items?JSON.stringify(d.items):"";K=(await (0,y.sh)(a,d.totalAmount.toNumber())).map((a,b)=>({id:`fallback-${b}`,invoiceId:d.id,name:a.name,quantity:a.quantity,unitPrice:{toNumber:()=>a.price},vatRate:a.taxRate||20,totalAmount:{toNumber:()=>a.price*a.quantity}}))}let L=K.map(a=>{let b=a.quantity,c=a.unitPrice.toNumber(),d=b*c,e=a.name,f=0,g="PERCENT",h=a.name.match(/\s*\[İskonto:\s*([%₺$€])?([0-9.]+)([%₺$€])?\]/);if(h){e=a.name.replace(/\s*\[İskonto:\s*[^\]]+\]/,"").trim();let b=h[1],c=h[2],d=h[3];f=parseFloat(c)||0,g="%"===b||"%"===d?"PERCENT":"AMOUNT"}let i=c,j=d,k=0;if(f>0)if("PERCENT"===g){let a=1-f/100;i=a>0?c/a:0,k=(j=b*i)-d}else j=d+f,i=b>0?j/b:0,k=f;return I+=j,J+=k,{...a,cleanName:e,discountValue:f,discountType:g,grossUnitPrice:i,grossRowTotal:j,rowDiscountAmount:k,netUnitPrice:c,netRowTotal:d}}),M=`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${j} - ${D}</title>
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
    ${"EARSIV"===i&&e?.companyStampUrl?`<div style="position:absolute; bottom:80px; left:40px; opacity:0.85;"><img src="${e.companyStampUrl}" alt="Firma Kaşesi" style="max-width:140px; max-height:100px; transform:rotate(-8deg);" /></div>`:'<div class="stamp-container">GİB ONAYLI<br>E-FATURA SİSTEMİ</div>'}

    <!-- Header Section -->
    <table class="header-table">
      <tr>
        <td class="logo-section">
          ${e?.logoUrl?`<img src="${e.logoUrl}" alt="${e.siteName||"Logo"}" style="max-height:60px; max-width:200px; object-fit:contain; margin-bottom:8px; display:block;" />`:""}
          <div class="company-title">${e?.companyName||"PEKEFE B2B E-TİCARET A.Ş."}</div>
          <div class="company-details">
            ${e?.contactAddress?e.contactAddress.replace(/\n/g,"<br>"):"Merkez Mahallesi İstiklal Caddesi No:45/A<br>Şişli / İSTANBUL"}<br>
            Tel: ${e?.contactPhone||"+90 (212) 555 12 34"}<br>
            E-Posta: ${e?.contactEmail||"muhasebe@atakb2b.com"} | Web: ${e?.siteName?`www.${e.siteName.toLowerCase().replace(/[^a-z0-9]/g,"")}.com`:"www.atakb2b.com"}<br>
            Mersis No: 0123456789012345 | Ticaret Sicil No: 987654<br>
            Şişli Vergi Dairesi - VKN: 1234567890
          </div>
        </td>
        <td class="info-section">
          <div class="invoice-title">${j}</div>
          <table class="info-table" style="float: right; width: auto;">
            <tr>
              <td class="lbl">\xd6zelleştirme No:</td>
              <td class="val">TR1.2</td>
            </tr>
            <tr>
              <td class="lbl">Senaryo:</td>
              <td class="val">${{TEMELFATURA:"TEMEL FATURA",TICARIFATURA:"TİCARİ FATURA"}[k]||k}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura Tipi:</td>
              <td class="val">${{SATIS:"SATIŞ",IADE:"İADE",TEVKIFAT:"TEVKİFAT",ISTISNA:"İSTİSNA",OZELMATRAH:"\xd6ZEL MATRAH"}[l]||l}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura No:</td>
              <td class="val" style="color: #c0392b; font-size: 12px;">${D}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura Tarihi:</td>
              <td class="val">${G}</td>
            </tr>
            <tr>
              <td class="lbl">Fatura Zamanı:</td>
              <td class="val">${H}</td>
            </tr>
            <tr>
              <td class="lbl">ETTN (UUID):</td>
              <td class="val" style="font-size: 8px; word-break: break-all; width: 140px;">${F}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Customer Details -->
    <table class="details-table">
      <tr>
        <td>
          <div class="details-title">M\xdcŞTERİ BİLGİLERİ (ALICI)</div>
          <div class="company-title">${g.name}</div>
          <div class="company-details">
            ${g.address||"Adres bilgisi girilmemiştir."}<br>
            E-Posta: ${g.email||"-"}<br>
            Telefon: ${g.phone||"-"}<br>
            ${g.taxOffice?`Vergi Dairesi: ${g.taxOffice}`:""}<br>
            <strong>${h?"VKN":"TCKN"}:</strong> ${g.taxNo||g.tckn||"-"}
          </div>
        </td>
        <td>
          <div class="details-title">G\xd6NDERİM VE \xd6DEME BİLGİLERİ</div>
          <div class="company-details">
            <strong>\xd6deme Y\xf6ntemi:</strong> ${{CARI_HESAP:"Cari Hesap (Vadeli)",HAVALE_EFT:"Banka Havalesi/EFT",KREDI_KARTI:"Kredi Kartı",NAKIT:"Nakit"}[s]||s}<br>
            ${m?`<strong>\xd6deme Şekli:</strong> ${({NAKIT:"Nakit",KREDIKARTI:"Kredi Kartı",EFT:"EFT/Havale",CEK:"\xc7ek",SENET:"Senet",KAPIDAODEME:"Kapıda \xd6deme",DIGER:"Diğer"})[m]||m}<br>`:""}
            ${n?`<strong>\xd6deme Aracı Kurum:</strong> ${n}<br>`:""}
            <strong>Vade Tarihi:</strong> ${new Date(d.dueDate).toLocaleDateString("tr-TR")}<br>
            ${o?`<strong>Taşıyıcı Firma:</strong> ${({ARAS:"Aras Kargo",MNG:"MNG Kargo",YURTICI:"Yurt İ\xe7i Kargo",PTT:"PTT Kargo",UPS:"UPS Kargo",DHL:"DHL Express",FEDEX:"FedEx",TRENDYOL:"Trendyol Express",DIGER:"Diğer"})[o]||o}<br>`:""}
            ${p?`<strong>Taşıyıcı VKN/TCKN:</strong> ${p}<br>`:""}
            ${q?`<strong>G\xf6nderim Tarihi:</strong> ${new Date(q).toLocaleDateString("tr-TR")}<br>`:""}
            ${r?`<strong>Satış Web Sitesi:</strong> <a href="${r}" style="color:#2980b9;">${r}</a><br>`:""}
            <strong>Para Birimi:</strong> ${E}<br>
            <br>
            <span style="font-size: 9px; color: #777;">
              * Bu fatura 213 sayılı V.U.K. h\xfck\xfcmlerine g\xf6re elektronik ortamda d\xfczenlenmiş olup, aslı ile aynı hukuki vasıflara sahiptir.
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
          <th style="width: 45%;">\xdcr\xfcn / Hizmet A\xe7ıklaması</th>
          <th style="width: 10%; text-align: right;">Miktar</th>
          <th style="width: 10%;">Birim</th>
          <th style="width: 10%; text-align: right;">Birim Fiyat</th>
          <th style="width: 8%; text-align: center;">KDV %</th>
          <th style="width: 12%; text-align: right;">Toplam Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${L.map((a,b)=>`
            <tr>
              <td style="text-align: center;">${b+1}</td>
              <td>
                <div style="font-weight: bold;">${a.cleanName}</div>
                ${a.rowDiscountAmount>0?`<div style="font-size: 9px; color: #777; margin-top: 2px;">Br\xfct Birim Fiyat: ${x(a.grossUnitPrice,E)} | İskonto: ${"PERCENT"===a.discountType?`%${a.discountValue}`:x(a.rowDiscountAmount,E)}</div>`:""}
              </td>
              <td style="text-align: right;">${a.quantity}</td>
              <td>Adet</td>
              <td style="text-align: right;">${x(a.netUnitPrice,E)}</td>
              <td style="text-align: center;">%${a.vatRate}</td>
              <td style="text-align: right; font-weight: bold;">${x(a.netRowTotal+a.netRowTotal*a.vatRate/100,E)}</td>
            </tr>
          `).join("")}
      </tbody>
    </table>

    <!-- Totals Area -->
    <table style="width: 100%;">
      <tr>
        <td style="vertical-align: top; width: 60%;">
          <div class="company-details" style="font-style: italic;">
            <strong>Yazıyla:</strong> # ${function(a,b="TRY"){let c="T\xdcRK LİRASI",d="KURUŞ";"USD"===b?(c="ABD DOLARI",d="SENT"):"EUR"===b&&(c="AVRO",d="SENT");let e=["","BİR","İKİ","\xdc\xc7","D\xd6RT","BEŞ","ALTI","YEDİ","SEKİZ","DOKUZ"],f=["","ON","YİRMİ","OTUZ","KIRK","ELLİ","ALTMIŞ","YETMİŞ","SEKSEN","DOKSAN"],g=["","BİN","MİLYON","MİLYAR","TRİLYON"],h=a.toFixed(2).split("."),i=parseInt(h[0]),j=parseInt(h[1]),k=a=>{let b="",c=Math.floor(a%100/10),d=Math.floor(a/100);return d>0&&(1===d?b+="Y\xdcZ":b+=e[d]+"Y\xdcZ"),b+=f[c]+e[a%10]},l=a=>{if(0===a)return"SIFIR";let b="",c=0;for(;a>0;){let d=a%1e3;if(d>0){let a=k(d);1===c&&"BİR"===a&&(a=""),b=a+g[c]+b}a=Math.floor(a/1e3),c++}return b},m=l(i),n=j>0?l(j):"";return n?`${m} ${c} ${n} ${d}`:`${m} ${c}`}(d.totalAmount.toNumber(),E)} #
          </div>
          <div class="barcode">
            <svg style="height: 40px; width: 160px;"></svg>
            <div style="font-size: 8px; text-align: right; padding-right: 25px; color: #555;">${F.substring(0,18).toUpperCase()}</div>
          </div>
        </td>
        <td style="vertical-align: top; width: 40%;">
          <table class="totals-table">
            <tr>
              <td class="lbl">Mal Hizmet Toplamı:</td>
              <td class="val">${x(I,E)}</td>
            </tr>
            ${J>0?`
            <tr>
              <td class="lbl">Toplam İskonto:</td>
              <td class="val" style="color: #e74c3c;">-${x(J,E)}</td>
            </tr>
            <tr>
              <td class="lbl">KDV Matrahı:</td>
              <td class="val">${x(I-J,E)}</td>
            </tr>
            `:""}
            <tr>
              <td class="lbl">Hesaplanan KDV:</td>
              <td class="val">${x(d.taxAmount.toNumber(),E)}</td>
            </tr>
            <tr class="grand-total">
              <td class="lbl" style="font-size: 11px;">\xd6denecek Toplam Tutar:</td>
              <td class="val" style="font-size: 12px;">${x(d.totalAmount.toNumber(),E)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Bank Account Details (IBAN) & Custom Invoice Footer HTML -->
    ${e?.companyInvoiceFooter?`
    <div style="margin-top: 15px; font-family: Arial, sans-serif;">
      ${e.companyInvoiceFooter}
    </div>
    `:e?.bankName&&e?.bankIban||f&&f.length>0?`
    <div style="margin-top: 20px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; font-family: Arial, sans-serif; text-align: left;">
      <div style="font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; tracking-wider; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        BANKA HESAP BİLGİLERİ (\xd6DEME İ\xc7İN)
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        ${e?.bankName&&e?.bankIban?`
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 4px 0; font-weight: bold; color: #475569; width: 120px;">${e.bankName}</td>
          <td style="padding: 4px 0; font-family: monospace; font-size: 11px; font-weight: bold; color: #0f172a;">${e.bankIban}</td>
          <td style="padding: 4px 0; text-align: right; color: #64748b;">(Ana Hesap)</td>
        </tr>
        `:""}
        ${f.map(a=>`
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 4px 0; font-weight: bold; color: #475569; width: 120px;">${a.name}</td>
          <td style="padding: 4px 0; font-family: monospace; font-size: 11px; font-weight: bold; color: #0f172a;">${a.iban}</td>
          <td style="padding: 4px 0; text-align: right; color: #64748b;">(${a.type} - ${a.currency})</td>
        </tr>
        `).join("")}
      </table>
    </div>
    `:""}

    <!-- Footer Disclaimer -->
    <div class="footer-section">
      ${"EARSIV"===i&&e?.companyStampUrl?"":`<span style="font-size:9px;color:#aaa;">Bu belge ${e?.companyName||"PEKEFE B2B"} tarafından elektronik ortamda d\xfczenlenmiştir.</span>`}
      <br>e-Fatura Entegrasyon Altyapısı PEKEFE B2B Bulut \xc7\xf6z\xfcmleri tarafından sağlanmaktadır.<br>
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
    `;return new v.NextResponse(M,{headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(a){return new v.NextResponse(`Fatura y\xfcklenemedi: ${a.message}`,{status:500})}}let A=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/integrations/efatura/pdf/route",pathname:"/api/integrations/efatura/pdf",filename:"route",bundlePath:"app/api/integrations/efatura/pdf/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\integrations\\efatura\\pdf\\route.ts",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:B,workUnitAsyncStorage:C,serverHooks:D}=A;function E(){return(0,g.patchFetch)({workAsyncStorage:B,workUnitAsyncStorage:C})}async function F(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),A.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/integrations/efatura/pdf/route";"/index"===d&&(d="/");let e=await A.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:y,isDraftMode:z,prerenderManifest:B,routerServerContext:C,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=e,I=(0,k.normalizeAppPath)(d),J=!!(B.dynamicRoutes[I]||B.routes[F]),K=async()=>((null==C?void 0:C.render404)?await C.render404(a,b,y,!1):b.end("This page could not be found"),null);if(J&&!z){let a=!!B.routes[F],b=B.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await K();throw new t.NoFallbackError}}let L=null;!J||A.isDev||z||(L="/index"===(L=F)?"/":L);let M=!0===A.isDev||!J,N=J&&!M;H&&G&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==C?void 0:C.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await A.getIncrementalCache(a,x,B,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:B.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:M,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>A.onRequestError(a,b,d,e,C)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>A.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${O} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${O} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&D&&E&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!J)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await A.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),b}},k=await A.handleResponse({req:a,nextConfig:x,cacheKey:L,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:B,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),z&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&J||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await A.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),J)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{a.exports=require("node:os")},49796:(a,b,c)=>{Object.defineProperty(b,"A",{enumerable:!0,get:function(){return d.registerServerReference}});let d=c(77943)},50172:(a,b,c)=>{Object.defineProperty(b,"__esModule",{value:!0});var d={};Object.defineProperty(b,"default",{enumerable:!0,get:function(){return f.default}});var e=c(11639);Object.keys(e).forEach(function(a){"default"===a||"__esModule"===a||Object.prototype.hasOwnProperty.call(d,a)||a in b&&b[a]===e[a]||Object.defineProperty(b,a,{enumerable:!0,get:function(){return e[a]}})});var f=function(a){if(a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var b=g(void 0);if(b&&b.has(a))return b.get(a);var c={__proto__:null},d=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var e in a)if("default"!==e&&({}).hasOwnProperty.call(a,e)){var f=d?Object.getOwnPropertyDescriptor(a,e):null;f&&(f.get||f.set)?Object.defineProperty(c,e,f):c[e]=a[e]}return c.default=a,b&&b.set(a,c),c}(c(41916));function g(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(g=function(a){return a?c:b})(a)}Object.keys(f).forEach(function(a){"default"===a||"__esModule"===a||Object.prototype.hasOwnProperty.call(d,a)||a in b&&b[a]===f[a]||Object.defineProperty(b,a,{enumerable:!0,get:function(){return f[a]}})})},55511:a=>{a.exports=require("crypto")},55591:a=>{a.exports=require("https")},57975:a=>{a.exports=require("node:util")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66814:(a,b,c)=>{c.d(b,{Fj:()=>p,IJ:()=>k,ch:()=>m,fj:()=>o,mW:()=>l,sh:()=>n});var d=c(49796),e=c(93061),f=c(50172),g=c(87969),h=c(84135),i=c(28329);async function j(){let a=await (0,f.getServerSession)(g.authOptions);if(!a||!a.user)throw Error("Oturum a\xe7ılmamış. L\xfctfen giriş yapınız.");let b=a.user.role||"USER";if("ADMIN"!==b&&"DEALER"!==b&&"SUPER_ADMIN"!==b)throw Error("Yetkisiz işlem. Bu alan sadece yetkili bayilere veya y\xf6neticilere a\xe7ıktır.");return a}async function k(a,b){try{await j();let c=await e.prisma.order.update({where:{id:a},data:{status:b},include:{currentAccount:!0}}),d=c.currentAccount?.email;if(d&&"guest@nexab2b.com"!==d)try{let a="Belirtilmedi",e="—";if(c.summary&&c.summary.startsWith("[")){let b=c.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);b&&(a=b[1].trim(),b[2]&&(e=b[2].trim()))}let f=process.env.NEXTAUTH_URL||"https://pekefe.com",g=c.date?new Date(c.date).toLocaleDateString("tr-TR"):new Date().toLocaleDateString("tr-TR");await h.J.queueEmail(d,"order_status_updated",{kullanici_adi:c.currentAccount?.name||"Değerli M\xfcşterimiz",siparis_no:c.id,siparis_durumu:b,siparis_tutari:Number(c.total).toLocaleString("tr-TR",{minimumFractionDigits:2}),kargo_sirketi:a,takip_no:e,tarih:g,detay_linki:`${f}/hesap`})}catch(a){console.error("Order status notification email failed:",a)}return{success:!0,order:c}}catch(a){return console.error("Error in updateOrderStatusAction:",a),{success:!1,error:a.message||"Sipariş durumu g\xfcncellenemedi."}}}async function l(a,b){try{await j();let c=await e.prisma.order.updateMany({where:{id:{in:a}},data:{status:b}});return Array.isArray(a)&&a.length>0&&e.prisma.order.findMany({where:{id:{in:a}},include:{currentAccount:!0}}).then(a=>{a.forEach(a=>{let c=a.currentAccount?.email;if(c&&"guest@nexab2b.com"!==c){let d=process.env.NEXTAUTH_URL||"https://pekefe.com";h.J.queueEmail(c,"order_status_updated",{kullanici_adi:a.currentAccount?.name||"Değerli M\xfcşterimiz",siparis_no:a.id,siparis_durumu:b,siparis_tutari:Number(a.total).toLocaleString("tr-TR",{minimumFractionDigits:2}),kargo_sirketi:"Standart Kargo",takip_no:"—",tarih:a.date?new Date(a.date).toLocaleDateString("tr-TR"):new Date().toLocaleDateString("tr-TR"),detay_linki:`${d}/hesap`}).catch(a=>console.error("Bulk status email error:",a))}})}).catch(a=>console.error("Error fetching bulk orders for status email:",a)),{success:!0,count:c.count}}catch(a){return console.error("Error in bulkUpdateOrderStatusAction:",a),{success:!1,error:a.message||"Toplu sipariş g\xfcncellemesi başarısız oldu."}}}async function m(a){try{await j();let b=await e.prisma.order.findMany({where:{id:{in:a}},include:{currentAccount:!0}}),c=0,d=0,f=[];for(let a of b)try{let b="B2B"===a.type?"e-Fatura":"e-Arşiv";if(await e.prisma.invoice.findFirst({where:{orderId:a.id}})){d++;continue}let f=a.total.toNumber(),g=f-f/1.2,h=(await n(a.summary||"",f)).map(a=>({name:a.name,quantity:a.quantity,unitPrice:a.price,totalAmount:a.price*a.quantity,vatRate:a.taxRate||20}));await e.prisma.invoice.create({data:{orderId:a.id,currentAccountId:a.currentAccountId,totalAmount:f,taxAmount:g,status:"ODENDI",type:b,dueDate:new Date(Date.now()+6048e5),items:a.summary||"Sipariş Detayı",notes:"Sipariş \xfczerinden otomatik fatura oluşturuldu.",invoiceItems:{create:h}}}),await e.prisma.order.update({where:{id:a.id},data:{status:"Hazırlanıyor"}}),c++}catch(b){f.push(`${a.id}: ${b.message}`)}return{success:!0,count:c,existingCount:d,errors:f}}catch(a){return console.error("Error in bulkGenerateInvoicesAction:",a),{success:!1,error:a.message||"Toplu faturalandırma sırasında hata."}}}async function n(a,b){if(!a)return[];let c=a.replace(/^\[[^\]]+\]\s*/,""),d=c,e=c.match(/^(?:\d+\s*-\s*)(.*)/);e&&(d=e[1]);let f=d.split(/,\s*/),g=[];for(let a of f){let b=a.trim();if(!b)continue;let c=b,d=1,e=b.match(/(.+)\s*\((\d+)\)/),f=b.match(/^(\d+)\s*[xX*]\s*(.+)/),h=b.match(/(.+?)\s*[xX*]\s*(\d+)$/);e?(c=e[1].trim(),d=parseInt(e[2],10)):f?(d=parseInt(f[1],10),c=f[2].trim()):h&&(c=h[1].trim(),d=parseInt(h[2],10));let i=250;c.includes("K\xf6r\xfck")?i=450:c.includes("Kovan")?i=1200:c.includes("Maske")?i=180:c.includes("Demir")?i=90:c.includes("Tel")?i=120:c.includes("S\xfczme")?i=3500:c.includes("Bal")&&(i=150),g.push({name:c,quantity:d,price:i,taxRate:20})}if(void 0!==b&&b>0&&g.length>0){let a=b/1.2,c=g.reduce((a,b)=>a+b.price*b.quantity,0);if(c>0){let b=a/c,d=0;for(let c=0;c<g.length;c++){let e=g[c];c===g.length-1?e.price=(a-d)/e.quantity:(e.price=Math.round(e.price*b*100)/100,d+=e.price*e.quantity)}}}return g}async function o(a){try{await j();let b=null;try{b=await (0,e.w)(e.prisma.order.findUnique({where:{id:a},include:{despatchAdvices:{include:{lines:{include:{product:!0}}}},invoices:{include:{invoiceItems:!0}}}}),2500,null)}catch(a){console.warn("[FULFILLMENT WARNING] Prisma query timed out or failed:",a)}if(!b){let c=(0,i.readLocalOrders)().find(b=>b.id===a||b.orderNumber===a);c&&(b={id:c.id,status:c.status||"Yeni",date:new Date(c.date||Date.now()),total:{toNumber:()=>Number(c.amount||c.total||0)},summary:c.summary||"",type:c.type||"B2C",despatchAdvices:[],invoices:[]})}if(!b)return{success:!1,error:"Sipariş bulunamadı."};let c="function"==typeof b.total?.toNumber?b.total.toNumber():Number(b.total||0),d=(await n(b.summary||"",c)).map(a=>{let c=0;(b.despatchAdvices||[]).forEach(b=>{"Cancelled"!==b.status&&(b.lines||[]).forEach(b=>{(b.product?.name?.toLowerCase().includes(a.name.toLowerCase())||a.name.toLowerCase().includes(b.product?.name?.toLowerCase()))&&(c+=b.quantity)})});let d=0;return(b.invoices||[]).forEach(b=>{"Cancelled"!==b.status&&(b.invoiceItems||[]).forEach(b=>{(b.name?.toLowerCase().includes(a.name.toLowerCase())||a.name.toLowerCase().includes(b.name?.toLowerCase()))&&(d+=b.quantity)})}),{productName:a.name,price:a.price,orderedQty:a.quantity,shippedQty:Math.min(a.quantity,c),invoicedQty:Math.min(a.quantity,d)}}),f=b.date instanceof Date?b.date.toISOString():new Date(b.date||Date.now()).toISOString();return{success:!0,order:{id:b.id,status:b.status,date:f,total:c,summary:b.summary,type:b.type},items:d,waybills:(b.despatchAdvices||[]).map(a=>({id:a.id,despatchNo:a.despatchNo,status:a.status,date:a.createdAt?.toISOString?.()||new Date().toISOString()})),invoices:(b.invoices||[]).map(a=>({id:a.id,totalAmount:"function"==typeof a.totalAmount?.toNumber?a.totalAmount.toNumber():Number(a.totalAmount||0),status:a.status,type:a.type,date:a.date?.toISOString?.()||new Date().toISOString()}))}}catch(a){return console.error("Error in getFulfillmentDetailsAction:",a),{success:!1,error:a.message||"Sevkiyat detayları alınamadı."}}}async function p(a,b,c){try{await j();let d=null;try{d=await (0,e.w)(e.prisma.order.findUnique({where:{id:a}}),2500,null)}catch(a){console.warn("[INVOICE/WAYBILL WARNING] Prisma error:",a)}if(d||(d=(0,i.readLocalOrders)().find(b=>b.id===a||b.orderNumber===a)),!d)return{success:!1,error:"Sipariş bulunamadı."};let f=new Date().toISOString().split("T")[0].replace(/-/g,""),g=Math.floor(1e3+9e3*Math.random()),h=`IRS-${f}-${g}`;return await e.prisma.$transaction(async a=>{let e=!1,f=!1,g=[],i=[],j=0;for(let h of c){let c=0,k=0;if(b){let b=await a.despatchAdvice.findMany({where:{orderId:d.id,status:{not:"Cancelled"}},include:{lines:{include:{product:!0}}}}),e=0;b.forEach(a=>{a.lines.forEach(a=>{(a.product.name.toLowerCase().includes(h.productName.toLowerCase())||h.productName.toLowerCase().includes(a.product.name.toLowerCase()))&&(e+=a.quantity)})});let f=await a.invoice.findMany({where:{orderId:d.id,status:{not:"Cancelled"}},include:{invoiceItems:!0}}),g=0;f.forEach(a=>{a.invoiceItems.forEach(a=>{(a.name.toLowerCase().includes(h.productName.toLowerCase())||h.productName.toLowerCase().includes(a.name.toLowerCase()))&&(g+=a.quantity)})}),c=Math.max(0,h.orderedQty-e),k=Math.max(0,h.orderedQty-g)}else c=h.shipQty,k=h.invoiceQty;if(c>0){e=!0;let b=await a.product.findFirst({where:{name:{contains:h.productName}}});b||(b=await a.product.findFirst()),b&&g.push({productId:b.id,quantity:c})}k>0&&(f=!0,i.push({name:h.productName,quantity:k,unitPrice:h.price,totalAmount:h.price*k}),j+=h.price*k)}let k=null,l=null;if(e&&g.length>0&&(k=(await a.despatchAdvice.create({data:{despatchNo:h,customerAccountId:d.currentAccountId,orderId:d.id,issueDate:new Date,actualDespatchDate:new Date,status:"SEVK_EDILDI",lines:{create:g}}})).id),f&&i.length>0){let b="B2B"===d.type?"e-Fatura":"e-Arşiv",c=await a.invoice.create({data:{orderId:d.id,currentAccountId:d.currentAccountId,totalAmount:j,taxAmount:j-j/1.2,status:"BEKLEMEDE",type:b,dueDate:new Date(Date.now()+2592e6),items:d.summary||"Sipariş Detayı",notes:"Sipariş \xfczerinden akıllı fatura oluşturuldu.",invoiceItems:{create:i}}});l=c.id,k&&await a.despatchAdvice.update({where:{id:k},data:{invoiceId:c.id}})}return await a.order.update({where:{id:d.id},data:{status:b?"Teslim Edildi":"Hazırlanıyor"}}),{success:!0,waybillId:k,invoiceId:l}})}catch(a){return console.error("Error in createInvoiceAndWaybillAction:",a),{success:!1,error:a.message||"Belgeler oluşturulurken hata."}}}(0,c(24424).D)([k,l,m,n,o,p]),(0,d.A)(k,"60b330bdbee7e1938ba4a17c2441324fa45c1f26ed",null),(0,d.A)(l,"6026d5ca06c9df40170a1072b6dddf161fefce5f3e",null),(0,d.A)(m,"4073fba8cd77a5b30e1c1c845d6b79513dcc04efd8",null),(0,d.A)(n,"601789dd6aba9800e6ce201559962e98a4256c7d67",null),(0,d.A)(o,"403fc4c0528ef30f4d8258573e397ef41c2d5af596",null),(0,d.A)(p,"704ecb1979b7bde39e5b7e63340652a250b2178b40",null)},72380:(a,b,c)=>{c.r(b),c.d(b,{"403fc4c0528ef30f4d8258573e397ef41c2d5af596":()=>d.fj,"4073fba8cd77a5b30e1c1c845d6b79513dcc04efd8":()=>d.ch,"601789dd6aba9800e6ce201559962e98a4256c7d67":()=>d.sh,"6026d5ca06c9df40170a1072b6dddf161fefce5f3e":()=>d.mW,"60b330bdbee7e1938ba4a17c2441324fa45c1f26ed":()=>d.IJ,"704ecb1979b7bde39e5b7e63340652a250b2178b40":()=>d.Fj});var d=c(66814)},73024:a=>{a.exports=require("node:fs")},73836:a=>{a.exports=require("node:fs/promises")},74075:a=>{a.exports=require("zlib")},76760:a=>{a.exports=require("node:path")},77598:a=>{a.exports=require("node:crypto")},77943:(a,b,c)=>{a.exports=c(7553).vendored["react-rsc"].ReactServerDOMWebpackServer},78474:a=>{a.exports=require("node:events")},79428:a=>{a.exports=require("buffer")},79646:a=>{a.exports=require("child_process")},81630:a=>{a.exports=require("http")},84297:a=>{a.exports=require("async_hooks")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},91645:a=>{a.exports=require("net")},94735:a=>{a.exports=require("events")}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,4013,5573,8914,9663,3061,3365,4135],()=>b(b.s=38107));module.exports=c})();