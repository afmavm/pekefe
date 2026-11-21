exports.id=7368,exports.ids=[7368],exports.modules={8656:(a,b,c)=>{"use strict";c.r(b),c.d(b,{"0024037505dd46d1ab5eac2a648a7cc1d50c3a3ce1":()=>d.CU,"00c01f063e91e92fa49681025c06b3324a6700038e":()=>d.kO,"00d5807e0da63caad4ec4d8a79968bdaef9f7099df":()=>d.iG,"400fdf2c7b9a0750c67cc8ec32b0aa230024390e70":()=>C,"40809c938ac280ffb43a5b6e4cf767413c0693a0ad":()=>E,"60106f8eb8c6ba635cc84c61255a5cce0a3e7e3c25":()=>y,"6013be7ab7fd18b286b71915029d8fe9177daf941c":()=>B,"6083ecc778e2aa138c93148d9979e532938ce9830a":()=>A,"60c40d2a486e8a8fda3b051d656dcaa6892a06c67b":()=>D,"60ec42d9acfcc1cfa47aa8bf8931a211d982117ebf":()=>z,"700c609c12bcb6a2a92a1d8d869cc1be62b7999e2e":()=>d.Rm,"70ff877e85a1f0d428d4f3966e6c69c753da808c8a":()=>F});var d=c(57402),e=c(95349),f=c(9290),g=c(98765),h=c(4469),i=c(25372),j=c(40965),k=c(29021),l=c.n(k),m=c(33873),n=c.n(m);function o(a,b=""){try{let b=n().join(process.cwd(),".env");if(l().existsSync(b))for(let c of l().readFileSync(b,"utf-8").split("\n")){let b=c.trim();if(b.startsWith("#")||!b.includes("="))continue;let[d,...e]=b.split("=");if(d.trim()===a){let a=e.join("=").trim();return(a.startsWith('"')&&a.endsWith('"')||a.startsWith("'")&&a.endsWith("'"))&&(a=a.substring(1,a.length-1)),a=a.replace(/\\"/g,'"').replace(/\\'/g,"'")}}}catch(b){console.error("Error reading live env key:",a,b)}return process.env[a]||b}let p="https://www.pekefe.com";function q({badge:a,subtitle:b="İSPİR Y\xd6RESEL \xdcR\xdcNLER • 2014'TEN BERİ",title:c,bodyHtml:d,ctaText:e,ctaUrl:f}){let g=new Date().getFullYear();return`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PEKEFE İspir Y\xf6resel \xdcr\xfcnler</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1ee;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f1ee;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ece3de;box-shadow:0 12px 36px rgba(92,17,34,0.08);">
          <!-- Kurumsal Header & Logo -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#6b1d2f 0%,#3a0a16 100%);padding:30px 28px 26px 28px;border-bottom:3px solid #d4a359;">
              <a href="${p}" target="_blank" style="text-decoration:none;display:inline-block;">
                <img src="https://www.pekefe.com/logo.png" alt="PEKEFE İspir Y\xf6resel \xdcr\xfcnler" width="68" height="68" style="display:block;margin:0 auto 12px auto;border-radius:14px;background-color:#ffffff;padding:4px;border:2px solid #d4a359;object-fit:contain;" />
              </a>
              <div style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:0.14em;line-height:1.2;">PEKEFE</div>
              <div style="color:#f5d598;font-size:10.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;margin-top:6px;">${b}</div>
            </td>
          </tr>

          <!-- İ\xe7erik G\xf6vdesi -->
          <tr>
            <td style="padding:32px 28px 24px 28px;font-size:14px;line-height:1.7;color:#334155;">
              ${a?`<div style="margin-bottom:16px;"><span style="display:inline-block;background-color:#fdf2f4;color:#881337;border:1px solid #fbcfe8;border-radius:999px;padding:5px 14px;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">${a}</span></div>`:""}
              ${c?`<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#1a0a10;line-height:1.3;">${c}</h1>`:""}
              ${d}
              ${e&&f?`<div style="text-align:center;margin:28px 0 8px 0;">
                      <a href="${f}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6b1d2f 0%,#8b263c 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:999px;box-shadow:0 4px 14px rgba(107,29,47,0.28);">${e}</a>
                    </div>`:""}
            </td>
          </tr>

          <!-- G\xfcven & Hızlı Erişim Şeridi -->
          <tr>
            <td style="background-color:#fdf9f6;border-top:1px solid #f1e8e3;border-bottom:1px solid #f1e8e3;padding:14px 24px;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="font-size:11px;font-weight:700;color:#6b1d2f;padding:2px 6px;">%100 Doğal İspir Mahsul\xfc</td>
                  <td align="center" style="font-size:11px;font-weight:700;color:#6b1d2f;padding:2px 6px;">256-Bit SSL G\xfcvenli \xd6deme</td>
                  <td align="center" style="font-size:11px;font-weight:700;color:#6b1d2f;padding:2px 6px;">\xd6zenli &amp; Sigortalı Kargo</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Kurumsal Firma Bilgileri Footer -->
          <tr>
            <td style="background-color:#260811;color:#e2d5d8;padding:26px 28px;text-align:center;font-size:12px;line-height:1.7;">
              <div style="color:#ffffff;font-weight:800;font-size:13px;letter-spacing:0.06em;margin-bottom:6px;">PEKEFE İSPİR Y\xd6RESEL \xdcR\xdcNLER</div>
              <div style="color:#d6c3c7;font-size:11.5px;">\xc7amlıca Mahallesi, 25900 İspir / Erzurum, T\xfcrkiye</div>
              <div style="margin-top:8px;font-size:12px;">
                <a href="tel:+905342709140" style="color:#f5d598;text-decoration:none;font-weight:700;">+90 534 270 91 40</a>
                &nbsp;•&nbsp;
                <a href="https://wa.me/905342709140" target="_blank" style="color:#86efac;text-decoration:none;font-weight:700;">WhatsApp Destek</a>
                &nbsp;•&nbsp;
                <a href="mailto:info@pekefe.com" style="color:#f5d598;text-decoration:none;font-weight:700;">info@pekefe.com</a>
              </div>
              <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;">
                <a href="${p}/kategoriler" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">Mağaza</a>
                <a href="${p}/hesap" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">Hesabım</a>
                <a href="${p}/teslimat" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">Teslimat &amp; İade</a>
                <a href="${p}/iletisim" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">İletişim</a>
              </div>
              <div style="margin-top:12px;color:#a89096;font-size:10.5px;">
                \xa9 ${g} PEKEFE İspir Y\xf6resel \xdcr\xfcnler. T\xfcm hakları saklıdır. &nbsp;|&nbsp;
                <a href="${p}" target="_blank" style="color:#f5d598;text-decoration:none;">www.pekefe.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}class r{constructor(){this.isProcessing=!1}getTransporter(){let a=o("SMTP_HOST","smtp.turkticaret.net").trim(),b=Number(o("SMTP_PORT","465").trim())||465,c=o("SMTP_USER","").trim(),d=o("SMTP_PASS",""),e=o("SMTP_SECURE","").trim().toLowerCase(),f=c||"info@pekefe.com",g=o("SMTP_FROM_NAME","PEKEFE İSPİR Y\xd6RESEL").trim()||"PEKEFE İSPİR Y\xd6RESEL";return{transporter:j.createTransport({host:a,port:b,secure:465===b||587!==b&&"true"===e,auth:{user:c,pass:d},connectionTimeout:12e3,greetingTimeout:1e4,socketTimeout:15e3,tls:{rejectUnauthorized:!1}}),fromEmail:f,fromName:g}}getSiteUrl(){let a=o("NEXTAUTH_URL_INTERNAL","")||o("NEXTAUTH_URL","")||"https://www.pekefe.com";return a.includes("localhost")&&1?"https://www.pekefe.com":a.replace(/\/$/,"")}getAdminEmail(){let a=o("ADMIN_NOTIFICATION_EMAIL","").trim();if(a&&a.includes("@"))return a;let b=o("SMTP_USER","").trim();return b&&b.includes("@")?b:"info@pekefe.com"}async seedDefaultTemplate(a){let b={welcome:{name:"Hoş Geldiniz (B2C)",subject:"Pekefe Ailesine Hoş Geldiniz! \uD83C\uDF3F",variables:"kullanici_adi",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Geleneksel & Doğal Lezzetler</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700;">Aramıza Hoş Geldiniz! ✨</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe ailesine katıldığınız i\xe7in teşekk\xfcr ederiz. Anadolu'nun bereketli yaylalarından s\xfcz\xfclen %100 doğal lezzetlerimizi inceleyebilir ve siparişinizi oluşturabilirsiniz.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://www.pekefe.com/kategoriler" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">\xdcr\xfcnleri Keşfet</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Sorularınız i\xe7in bu e-postaya yanıt verebilir veya info@pekefe.com adresimizden bize ulaşabilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. T\xfcm hakları saklıdır.</p>
            </div>
          </div>
        `},dealer_applied:{name:"Bayilik Başvurusu Alındı (B2B)",subject:"Bayilik Başvurunuz Alındı - Pekefe B2B",variables:"kullanici_adi",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE B2B</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Kurumsal Bayi Portalı</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700;">Bayilik Başvurunuz Başarıyla Alındı</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe B2B Kurumsal Bayi Portalı i\xe7in yapmış olduğunuz başvuru sistemimize ulaşmıştır. Başvurunuz ekibimiz tarafından incelenmektedir.</p>
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">📌 Başvuru Durumu: İncelemede</p>
                <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.6;">Başvurunuz onaylandığında \xf6zel bayi iskonto oranlarınız tanımlanacak ve tarafınıza bilgilendirme yapılacaktır.</p>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">G\xf6sterdiğiniz ilgi i\xe7in teşekk\xfcr ederiz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe B2B Kurumsal İş Ortaklığı.</p>
            </div>
          </div>
        `},dealer_approved:{name:"Bayilik Başvurusu Onaylandı (B2B)",subject:"Tebrikler! Bayilik Başvurunuz Onaylandı — Pekefe B2B \uD83C\uDFC6",variables:"kullanici_adi,bayi_grubu,fiyat_grubu,kredi_limiti",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE B2B</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Bayilik Onayı</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #15803d; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Tebrikler, Bayiliğiniz Aktif Edildi! 🎉</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe B2B portalı bayilik başvurunuz onaylanmış ve yetkileriniz aktif edilmiştir. Hesabınıza tanımlanan detaylar aşağıdadır:</p>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 45%;">Bayi Grubu:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #6b1d2f;">{{bayi_grubu}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Fiyat Grubu:</td>
                    <td style="padding: 6px 0;">{{fiyat_grubu}} Fiyatı</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Kredi Limiti:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #15803d;">₺{{kredi_limiti}}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="http://localhost:3000/b2b" style="background: linear-gradient(135deg, #15803d, #16a34a); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(21, 128, 61, 0.25);">Bayi Portalına Giriş Yap</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Verimli ve bereketli iş ortaklıkları dileriz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">Pekefe B2B Y\xf6netim Ekibi.</p>
            </div>
          </div>
        `},dealer_rejected:{name:"Bayilik Başvurusu Reddedildi (B2B)",subject:"Bayilik Başvurusu Hakkında - Pekefe B2B",variables:"kullanici_adi",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE B2B</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Bilgilendirme</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #b91c1c; margin-top: 0; font-size: 18px; font-weight: 700;">Bayilik Başvurunuz Hakkında</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Sayın <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe B2B portalı bayilik başvurunuz incelenmiş olup, mevcut kriterler doğrultusunda başvurunuz şu aşamada onaylanamamıştır.</p>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Detaylı bilgi almak i\xe7in info@pekefe.com adresi \xfczerinden bizimle iletişime ge\xe7ebilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">Pekefe B2B Y\xf6netim Ekibi.</p>
            </div>
          </div>
        `},order_received:{name:"Sipariş Alındı (Sipariş Onayı)",subject:"Siparişiniz Alındı — Sipariş No: {{siparis_no}} \uD83D\uDCE6",variables:"kullanici_adi,siparis_no,siparis_tutari,siparis_icerik,odeme_yontemi,kargo_adresi,kargo_sirketi,tarih,detay_linki",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Geleneksel & Doğal Lezzetler — Sipariş Onayı</p>
            </div>
            <!-- Body -->
            <div style="padding: 36px 32px;">
              <div style="text-align: center; margin-bottom: 28px;">
                <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">✅</div>
                <h3 style="color: #1a0a10; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">Siparişiniz Alındı!</h3>
                <p style="color: #64748b; font-size: 13px; margin: 0;">{{tarih}}</p>
              </div>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Siparişiniz başarıyla sistemimize ulaşmış ve hazırlık s\xfcrecine alınmıştır. Aşağıda sipariş detaylarınızı bulabilirsiniz.</p>

              <!-- Sipariş \xd6zeti -->
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 14px; padding: 22px; margin: 24px 0;">
                <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #92400e;">📋 Sipariş \xd6zeti</p>
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 7px 0; font-weight: 600; color: #64748b; width: 42%;">Sipariş Numarası</td>
                    <td style="padding: 7px 0; font-family: monospace; font-weight: 800; color: #6b1d2f;">{{siparis_no}}</td>
                  </tr>
                  <tr style="border-top: 1px solid #fde68a;">
                    <td style="padding: 7px 0; font-weight: 600; color: #64748b;">Sipariş Tutarı</td>
                    <td style="padding: 7px 0; font-weight: 800; color: #15803d; font-size: 16px;">₺{{siparis_tutari}}</td>
                  </tr>
                  <tr style="border-top: 1px solid #fde68a;">
                    <td style="padding: 7px 0; font-weight: 600; color: #64748b;">\xd6deme Y\xf6ntemi</td>
                    <td style="padding: 7px 0; font-weight: 600; color: #1e293b;">{{odeme_yontemi}}</td>
                  </tr>
                </table>
              </div>

              <!-- \xdcr\xfcn Listesi -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin: 20px 0;">
                <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #334155;">🛒 Sipariş Edilen \xdcr\xfcnler</p>
                <div style="font-size: 14px; color: #475569; line-height: 2; white-space: pre-line;">{{siparis_icerik}}</div>
              </div>

              <!-- Kargo Adresi -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 14px; padding: 22px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #0369a1;">📦 Kargo Bilgileri</p>
                <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.7;"><strong>Teslimat Adresi:</strong><br>{{kargo_adresi}}</p>
              </div>

              <!-- CTA Butonu -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{detay_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.3);">Sipariş Durumumu Takip Et</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">Sorularınız i\xe7in <a href="mailto:info@pekefe.com" style="color: #6b1d2f;">info@pekefe.com</a> adresinden bize ulaşabilirsiniz.</p>
            </div>
            <!-- Footer -->
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. T\xfcm hakları saklıdır.</p>
            </div>
          </div>
        `},order_status_updated:{name:"Sipariş Durum G\xfcncellemesi",subject:"Siparişinizin Durumu G\xfcncellendi: {{siparis_durumu}} — Sipariş No: {{siparis_no}} \uD83D\uDCE6",variables:"kullanici_adi,siparis_no,siparis_durumu,siparis_tutari,kargo_sirketi,takip_no,detay_linki,tarih",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Sipariş Durum G\xfcncellemesi</p>
            </div>
            <!-- Body -->
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Siparişinizin Durumu G\xfcncellendi</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;"><strong>{{siparis_no}}</strong> numaralı siparişinizin yeni durumu: <strong style="color: #6b1d2f; font-size: 16px;">{{siparis_durumu}}</strong></p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #334155;">🚚 G\xfcncel Sipariş & Kargo Bilgileri</p>
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 45%;">Sipariş Numarası:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: 800; color: #6b1d2f;">{{siparis_no}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Yeni Durum:</td>
                    <td style="padding: 6px 0; font-weight: 800; color: #15803d;">{{siparis_durumu}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Kargo Şirketi:</td>
                    <td style="padding: 6px 0; font-weight: 600;">{{kargo_sirketi}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Kargo Takip No:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #0369a1;">{{takip_no}}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Butonu -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{detay_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.3);">Sipariş Detayını G\xf6r\xfcnt\xfcle</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">Bizi tercih ettiğiniz i\xe7in teşekk\xfcr ederiz. Sorularınız i\xe7in <a href="mailto:info@pekefe.com" style="color: #6b1d2f;">info@pekefe.com</a> adresinden bize ulaşabilirsiniz.</p>
            </div>
            <!-- Footer -->
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. T\xfcm hakları saklıdır.</p>
            </div>
          </div>
        `},order_cancelled:{name:"Sipariş İptal Bilgilendirmesi",subject:"Siparişiniz İptal Edildi — Sipariş No: #{{siparis_no}}",variables:"kullanici_adi,siparis_no,iptal_nedeni,siparis_ozeti,siparis_tutari,odeme_yontemi,tarih,detay_linki",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fecdd3; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Sipariş İptal Bilgilendirmesi</p>
            </div>
            <!-- Body -->
            <div style="padding: 36px 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;">Sipariş İptal Edildi</span>
              </div>
              <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin-top: 0;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;"><strong>#{{siparis_no}}</strong> numaralı siparişinizin iptal işlemi ger\xe7ekleştirilmiştir. İptal detayları ve gerek\xe7esi aşağıda bilgilerinize sunulmuştur:</p>

              <!-- Cancellation Reason Box -->
              <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 12px; padding: 18px 20px; margin: 22px 0;">
                <p style="margin: 0 0 6px 0; color: #9f1239; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">İptal Nedeni</p>
                <p style="margin: 0; color: #881337; font-size: 14px; font-weight: 600; line-height: 1.6;">{{iptal_nedeni}}</p>
              </div>

              <!-- Order Summary Table -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin: 22px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Sipariş Numarası</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">#{{siparis_no}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">İptal Tarihi</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{tarih}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Sipariş İ\xe7eriği</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{siparis_ozeti}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">\xd6deme Y\xf6ntemi</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{odeme_yontemi}}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0 4px 0; color: #0f172a; font-weight: 700;">Toplam Tutar</td>
                    <td style="padding: 10px 0 4px 0; color: #6b1d2f; font-weight: 800; font-size: 15px; text-align: right;">₺{{siparis_tutari}}</td>
                  </tr>
                </table>
              </div>

              <!-- Refund Info -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                <p style="margin: 0; color: #166534; font-size: 12.5px; line-height: 1.6;">
                  <strong>\xd6deme &amp; İade Bilgilendirmesi:</strong> Kredi kartı veya banka havalesi ile \xf6deme ger\xe7ekleştirdiyseniz, iade tutarınız \xf6deme y\xf6nteminize bağlı olarak <strong>1–7 iş g\xfcn\xfc</strong> i\xe7erisinde hesabınıza/kartınıza yansıtılacaktır. \xd6deme yapılmadıysa tarafınızdan herhangi bir tahsilat yapılmayacaktır.
                </p>
              </div>

              <div style="text-align: center; margin: 28px 0 20px 0;">
                <a href="{{detay_linki}}" style="display: inline-block; background-color: #6b1d2f; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 999px;">Siparişlerimi G\xf6r\xfcnt\xfcle</a>
              </div>

              <p style="color: #64748b; font-size: 12.5px; line-height: 1.6; text-align: center; margin-bottom: 0;">
                Herhangi bir sorunuz veya yeni sipariş desteğiniz i\xe7in <a href="mailto:info@pekefe.com" style="color: #6b1d2f; font-weight: 700;">info@pekefe.com</a> adresinden veya <strong>+90 534 270 91 40</strong> numaralı WhatsApp hattımızdan bize ulaşabilirsiniz.
              </p>
            </div>
            <!-- Footer -->
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. T\xfcm hakları saklıdır.</p>
            </div>
          </div>
        `},newsletter_welcome:{name:"B\xfclten Aboneliği Hoş Geldiniz",subject:"Pekefe B\xfclten Kul\xfcb\xfcne Hoş Geldiniz! \uD83C\uDF3F",variables:"email,brandName,siteUrl",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE B\xdcLTEN KUL\xdcB\xdc</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Geleneksel & Doğal Lezzetler</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Aramıza Hoş Geldiniz! ✨</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe B\xfclten Kul\xfcb\xfc'ne katıldığınız i\xe7in teşekk\xfcr ederiz. İspir yaylalarının en \xf6zel sınırlı rekolte \xfcr\xfcnleri, mevsimsel \xf6zel tadımlar ve size \xf6zel ayrıcalıklı fırsatlardan ilk siz haberdar olacaksınız.</p>
              
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 14px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">🎁 Kul\xfcp \xdcyelerine \xd6zel Ayrıcalıklar</p>
                <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.6;">Butik rekolte \xfcr\xfcnlerinde \xf6ncelikli erişim ve b\xfclten \xfcyelerine \xf6zel s\xfcrpriz indirimler e-posta kutunuza gelecek.</p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="{{siteUrl}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">\xdcr\xfcnleri Keşfet</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">Sorularınız veya istekleriniz i\xe7in bu e-postaya yanıt verebilir veya info@pekefe.com adresimizden bize ulaşabilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. T\xfcm hakları saklıdır.</p>
            </div>
          </div>
        `},forgot_password:{name:"Şifre Sıfırlama Talebi",subject:"Şifre Sıfırlama Talebi - Pekefe",variables:"kullanici_adi,sifirlama_linki",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Hesap G\xfcvenliği</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 18px; font-weight: 700;">Şifre Sıfırlama Talebi</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">Hesabınız i\xe7in şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak i\xe7in aşağıdaki butona tıklayın:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{sifirlama_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Yeni Şifre Oluştur</a>
              </div>
              <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Bu talebi siz yapmadıysanız bu e-postayı g\xfcvenle g\xf6z ardı edebilirsiniz.</p>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler.</p>
            </div>
          </div>
        `},mutabakat:{name:"Cari Hesap Mutabakat Mektubu",subject:"Cari Hesap Mutabakat Talebi — {{tarih}} | PEKEFE",variables:"kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres,portalUrl,portalLabel",bodyHtml:q({subtitle:"CARİ HESAP MUTABAKAT MEKTUBU",badge:"Cari Hesap Bakiye Bilgilendirmesi",title:"Mutabakat Mektubu",bodyHtml:`
            <p style="margin:0 0 12px 0;font-size:15px;color:#1e293b;">Sayın <strong>{{yetkili}}</strong>,</p>
            <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.7;">Firmamız kayıtlarına g\xf6re <strong>{{tarih}}</strong> tarihi itibarıyla cari hesabınıza ait mutabakat ve g\xfcncel bakiye bilgilerinizi bilginize sunarız.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin:0 0 20px 0;border-collapse:separate;">
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;width:42%;">Cari Hesap Adı</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;text-align:right;">{{kullanici_adi}}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Cari Kod</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;font-family:monospace;border-bottom:1px solid #e2e8f0;text-align:right;">{{cari_kod}}</td>
              </tr>
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Mutabakat Tarihi</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right;">{{tarih}}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;">Bakiye Durumu</td>
                <td style="padding:12px 16px;font-size:13px;color:{{bakiye_rengi}};font-weight:800;text-align:right;">{{bakiye_durumu}}</td>
              </tr>
            </table>
            <div style="background-color:#fdf9f6;border:1.5px solid #ece3de;border-radius:14px;padding:18px 20px;text-align:center;margin:0 0 20px 0;">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">G\xfcncel Net Bakiye</div>
              <div style="font-size:22px;font-weight:900;color:{{bakiye_rengi}};letter-spacing:-0.01em;">{{bakiye_etiketi}}</div>
            </div>
            <p style="margin:0;font-size:12.5px;color:#64748b;line-height:1.65;">
              Kayıtlarımızla ilgili herhangi bir farklılık tespit etmeniz halinde 7 iş g\xfcn\xfc i\xe7erisinde
              <a href="mailto:info@pekefe.com" style="color:#6b1d2f;font-weight:700;text-decoration:none;">info@pekefe.com</a>
              adresinden veya WhatsApp destek hattımızdan muhasebe birimimizle iletişime ge\xe7ebilirsiniz.
            </p>
          `,ctaText:"{{portalLabel}}",ctaUrl:"{{portalUrl}}"})},ekstre:{name:"Cari Hesap Ekstre G\xf6nderimi",subject:"Cari Hesap Ekstresi — {{tarih}} | PEKEFE",variables:"kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres,portalUrl,portalLabel",bodyHtml:q({subtitle:"CARİ HESAP EKSTRE BİLDİRİMİ",badge:"Hesap \xd6zeti",title:"Cari Hesap Ekstresi",bodyHtml:`
            <p style="margin:0 0 12px 0;font-size:15px;color:#1e293b;">Sayın <strong>{{yetkili}}</strong>,</p>
            <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.7;"><strong>{{tarih}}</strong> tarihi itibarıyla cari hesabınıza ait g\xfcncel bakiye \xf6zeti aşağıda yer almaktadır.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin:0 0 20px 0;border-collapse:separate;">
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;width:42%;">Cari Hesap Adı</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;border-bottom:1px solid #e2e8f0;text-align:right;">{{kullanici_adi}}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Cari Kod</td>
                <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;font-family:monospace;border-bottom:1px solid #e2e8f0;text-align:right;">{{cari_kod}}</td>
              </tr>
              <tr style="background-color:#f8fafc;">
                <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;">Bakiye Durumu</td>
                <td style="padding:12px 16px;font-size:13px;color:{{bakiye_rengi}};font-weight:800;text-align:right;">{{bakiye_durumu}}</td>
              </tr>
            </table>
            <div style="background-color:#fdf9f6;border:1.5px solid #ece3de;border-radius:14px;padding:18px 20px;text-align:center;margin:0 0 12px 0;">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">G\xfcncel Net Bakiye</div>
              <div style="font-size:22px;font-weight:900;color:{{bakiye_rengi}};">{{bakiye_etiketi}}</div>
            </div>
          `,ctaText:"{{portalLabel}}",ctaUrl:"{{portalUrl}}"})},admin_new_order:{name:"Yeni Sipariş Bildirimi (Y\xf6netici)",subject:"\uD83D\uDEA8 Yeni Sipariş Alındı! — Sipariş No: {{siparis_no}}",variables:"kullanici_adi,siparis_no,siparis_tutari,odeme_yontemi,detay_linki,tarih,siparis_icerik",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE ADMİN</h2>
              <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Y\xf6netici Bildirim Servisi</p>
            </div>
            <div style="padding: 36px 32px;">
              <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">🚨 Yeni Sipariş Alındı!</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba Y\xf6netici,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.7;">{{tarih}} tarihinde yeni bir sipariş aldınız. Detaylar aşağıdadır:</p>
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 45%;">M\xfcşteri:</td>
                    <td style="padding: 6px 0;">{{kullanici_adi}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Sipariş Numarası:</td>
                    <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #6b1d2f;">{{siparis_no}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Sipariş Tutarı:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #15803d;">₺{{siparis_tutari}}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{detay_linki}}" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Sipariş Y\xf6netimine Git</a>
              </div>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">Pekefe Y\xf6netim Paneli.</p>
            </div>
          </div>
        `},cargo_shipped:{name:"Siparişiniz Kargoya Verildi",subject:"Siparişiniz Kargoya Verildi — Sipariş No: #{{siparis_no}} \uD83D\uDE9A",variables:"kullanici_adi,siparis_no,kargo_sirketi,takip_no,tarih,detay_linki",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.05em;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Kargo Bilgilendirmesi</p>
            </div>
            <div style="padding: 36px 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;"><strong>#{{siparis_no}}</strong> numaralı siparişiniz \xf6zenle paketlenerek kargoya teslim edilmiştir.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin: 22px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr><td style="padding: 6px 0; color: #64748b;">Kargo Firması</td><td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">{{kargo_sirketi}}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Takip Numarası</td><td style="padding: 6px 0; color: #6b1d2f; font-weight: 800; font-family: monospace; text-align: right;">{{takip_no}}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Tarih</td><td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">{{tarih}}</td></tr>
                </table>
              </div>
              <div style="text-align: center; margin: 26px 0 12px 0;">
                <a href="{{detay_linki}}" style="display: inline-block; background-color: #6b1d2f; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 999px;">Siparişimi Takip Et</a>
              </div>
            </div>
            <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler.</p>
            </div>
          </div>
        `},forgot_password:{name:"Şifre Sıfırlama Talebi",subject:"PEKEFE — Şifre Sıfırlama Talebiniz",variables:"kullanici_adi,sifirlama_linki,sifirlama_kodu",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">PEKEFE</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Hesap G\xfcvenliği</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;">Hesabınız i\xe7in şifre sıfırlama talebinde bulundunuz. Aşağıdaki doğrulama kodunu veya bağlantıyı kullanarak yeni şifrenizi belirleyebilirsiniz:</p>
              <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: 900; letter-spacing: 0.2em; color: #6b1d2f; font-family: monospace;">{{sifirlama_kodu}}</span>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="{{sifirlama_linki}}" style="display: inline-block; background-color: #6b1d2f; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 999px;">Şifremi Sıfırla</a>
              </div>
            </div>
          </div>
        `},password_changed:{name:"Şifreniz G\xfcncellendi",subject:"PEKEFE — Hesap Şifreniz G\xfcncellendi",variables:"kullanici_adi,tarih",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">PEKEFE</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;">Hesabınızın şifresi <strong>{{tarih}}</strong> tarihinde başarıyla g\xfcncellenmiştir. Bu işlemi siz ger\xe7ekleştirmediyseniz l\xfctfen derhal <a href="mailto:info@pekefe.com" style="color:#6b1d2f;">info@pekefe.com</a> adresinden bizimle iletişime ge\xe7iniz.</p>
            </div>
          </div>
        `},contact_received:{name:"İletişim Mesajınız Alındı",subject:"Mesajınız Bize Ulaştı — PEKEFE",variables:"kullanici_adi,konu,tarih",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 32px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900;">PEKEFE</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #1e293b; font-size: 15px;">Merhaba <strong>{{kullanici_adi}}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.7;"><strong>{{konu}}</strong> konulu mesajınız {{tarih}} tarihinde ekibimize ulaşmıştır. En kısa s\xfcrede size d\xf6n\xfcş yapılacaktır.</p>
            </div>
          </div>
        `},admin_contact_message:{name:"Yeni İletişim Formu Mesajı",subject:"Yeni İletişim Mesajı: {{konu}} — {{kullanici_adi}}",variables:"kullanici_adi,eposta,telefon,konu,mesaj,tarih",bodyHtml:`
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 28px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900;">PEKEFE Y\xd6NETİM</h2>
              <p style="color: #fef3c7; font-size: 11px; margin: 4px 0 0 0;">Yeni İletişim Formu Bildirimi</p>
            </div>
            <div style="padding: 28px; font-size: 14px; color: #334155;">
              <p><strong>G\xf6nderen:</strong> {{kullanici_adi}} ({{eposta}})</p>
              <p><strong>Telefon:</strong> {{telefon}}</p>
              <p><strong>Konu:</strong> {{konu}}</p>
              <p><strong>Tarih:</strong> {{tarih}}</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-top: 12px; white-space: pre-wrap;">{{mesaj}}</div>
            </div>
          </div>
        `}}[a.toLowerCase().trim()];return b?(f.prisma.emailTemplate.upsert({where:{eventType:a.toLowerCase().trim()},update:{name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"},create:{eventType:a.toLowerCase().trim(),name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"}}).catch(()=>{}),b):null}compileTemplate(a,b,c=""){let d=this.getSiteUrl(),e=b||{},f=new Date().toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"}),g=e.kullanici_adi||e.userName||e.name||e.customerName||e.cari_unvan||e.cariUnvan||e.companyName||"Değerli M\xfcşterimiz",h=e.siparis_no||e.orderNo||e.orderNumber||"",i=e.siparis_tutari||e.orderTotal||e.paymentAmount||e.refundAmount||"",j=e.kargo_sirketi||e.kargo_firmasi||e.cargoCompany||e.carrier||"Anlaşmalı Kargo",k=e.takip_no||e.trackingNo||"Hazırlanıyor",l=e.detay_linki||e.orderDetailUrl||`${d}/hesap`,m=e.takip_linki||e.trackingUrl||`${d}/hesap`,n=e.loginUrl||e.aktivasyon_linki||`${d}/giris`,o=e.portalUrl||e.onay_linki||`${d}/b2b`,p=e.shopUrl||e.catalogUrl||`${d}/kategoriler`,q=e.verifyUrl||e.aktivasyon_linki||`${d}/giris`,r=e.resetUrl||e.sifirlama_linki||`${d}/giris`,s=e.userEmail||e.recipientEmail||e.email||e.eposta||c||"",t=e.tarih||e.orderDate||e.paymentDate||e.deliveredAt||f,u=e.iptal_nedeni||e.cancelReason||e.rejectReason||"Operasyonel değerlendirme / m\xfcşteri talebi doğrultusunda işlem yapılmıştır.",v=e.cari_kod||e.cariKod||"PKF-CARI",w={kullanici_adi:g,userName:g,name:g,customerName:g,yetkili:e.yetkili||g,cari_unvan:e.cari_unvan||e.cariUnvan||g,cariUnvan:e.cariUnvan||e.cari_unvan||g,companyName:e.companyName||e.cari_unvan||g,cari_kod:v,cariKod:v,userEmail:s,recipientEmail:s,email:s,eposta:s,siparis_no:h,orderNo:h,orderNumber:h,siparis_tutari:i,orderTotal:i,paymentAmount:i,refundAmount:i,odeme_yontemi:e.odeme_yontemi||e.paymentMethod||e.refundMethod||"Online \xd6deme / Havale",paymentMethod:e.paymentMethod||e.odeme_yontemi||"Online \xd6deme / Havale",refundMethod:e.refundMethod||e.odeme_yontemi||"\xd6deme Y\xf6nteminize İade",kargo_sirketi:j,kargo_firmasi:j,cargoCompany:j,carrier:j,kargo_adresi:e.kargo_adresi||e.shippingAddress||"Kayıtlı Teslimat Adresiniz",shippingAddress:e.shippingAddress||e.kargo_adresi||"Kayıtlı Teslimat Adresiniz",takip_no:k,trackingNo:k,takip_linki:m,trackingUrl:m,detay_linki:l,orderDetailUrl:l,loginUrl:n,portalUrl:o,portalLabel:e.portalLabel||"Hesabım & Ekstre G\xf6r\xfcnt\xfcle",onay_linki:o,shopUrl:p,catalogUrl:p,verifyUrl:q,aktivasyon_linki:q,resetUrl:r,sifirlama_linki:r,contactUrl:e.contactUrl||`${d}/iletisim`,feedbackUrl:e.feedbackUrl||`${d}/hesap`,invoiceUrl:e.invoiceUrl||`${d}/hesap`,adminPanelUrl:e.adminPanelUrl||`${d}/admin`,expiresIn:e.expiresIn||"24 saat",estimatedDelivery:e.estimatedDelivery||"1–3 iş g\xfcn\xfc",refundDays:e.refundDays||"1–7 iş g\xfcn\xfc",tarih:t,orderDate:t,paymentDate:t,deliveredAt:t,iptal_nedeni:u,cancelReason:u,rejectReason:u,bakiye:e.bakiye||"0,00 ₺",bakiye_durumu:e.bakiye_durumu||"MUTABIK",bakiye_rengi:e.bakiye_rengi||"#475569",bakiye_etiketi:e.bakiye_etiketi||`Bakiye: ${e.bakiye||"0,00"} TRY`,vade_tarihi:e.vade_tarihi||t,b2bGroup:e.b2bGroup||"Standart Bayi",discountRate:e.discountRate||"15",...e},x=a||"";return Object.entries(w).forEach(([a,b])=>{let c=RegExp(`{{\\s*${a}\\s*}}`,"g");x=x.replace(c,null!=b?String(b):"")}),(x=(x=x.replace(/{{\s*\w+\s*}}/g,"")).replace(/https?:\/\/localhost:\d+/gi,d)).includes("<h1>\uD83C\uDF3F PEKEFE</h1>")&&!x.includes("/logo.png")?x=x.replace("<h1>\uD83C\uDF3F PEKEFE</h1>",`<a href="${d}" target="_blank" style="text-decoration:none;display:inline-block;"><img src="${d}/logo.png" alt="PEKEFE İspir Y\xf6resel \xdcr\xfcnler" width="68" height="68" style="display:block;margin:0 auto 12px;border-radius:14px;background:#ffffff;padding:4px;border:2px solid #d4a359;object-fit:contain;" /></a><h1 style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:0.14em;margin:0;">PEKEFE</h1>`):!x.includes("/logo.png")&&/<h[12][^>]*>(PEKEFE|MUTABAKAT MEKTUBU)/i.test(x)&&(x=x.replace(/(<h[12][^>]*>(?:PEKEFE|MUTABAKAT MEKTUBU))/i,`<a href="${d}" target="_blank" style="text-decoration:none;display:inline-block;"><img src="${d}/logo.png" alt="PEKEFE İspir Y\xf6resel \xdcr\xfcnler" width="68" height="68" style="display:block;margin:0 auto 12px;border-radius:14px;background:#ffffff;padding:4px;border:2px solid #d4a359;object-fit:contain;" /></a>$1`)),x.includes('<div class="footer">')&&!x.includes("\xc7amlıca Mahallesi")&&(x=x.replace(/<div class="footer">[\s\S]*?<\/div>/i,`<div style="background:#fdf9f6;border-top:1px solid #f1e8e3;border-bottom:1px solid #f1e8e3;padding:12px 20px;text-align:center;font-size:11px;font-weight:700;color:#6b1d2f;">%100 Doğal İspir Mahsul\xfc &nbsp;&middot;&nbsp; 256-Bit SSL G\xfcvenli \xd6deme &nbsp;&middot;&nbsp; \xd6zenli &amp; Sigortalı Kargo</div>
        <div class="footer" style="background:#260811;color:#e2d5d8;padding:24px 28px;text-align:center;font-size:12px;line-height:1.7;">
          <p style="color:#ffffff;font-weight:800;font-size:13px;letter-spacing:0.06em;margin:0 0 4px;">PEKEFE İSPİR Y\xd6RESEL \xdcR\xdcNLER</p>
          <p style="color:#d6c3c7;font-size:11.5px;margin:0 0 6px;">\xc7amlıca Mahallesi, 25900 İspir / Erzurum, T\xfcrkiye</p>
          <p style="margin:0 0 10px;">
            <a href="tel:+905342709140" style="color:#f5d598;text-decoration:none;font-weight:700;">+90 534 270 91 40</a> &nbsp;&bull;&nbsp;
            <a href="https://wa.me/905342709140" target="_blank" style="color:#86efac;text-decoration:none;font-weight:700;">WhatsApp Destek</a> &nbsp;&bull;&nbsp;
            <a href="mailto:info@pekefe.com" style="color:#f5d598;text-decoration:none;font-weight:700;">info@pekefe.com</a>
          </p>
          <p style="margin:10px 0 6px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;">
            <a href="${d}/kategoriler" style="color:#ffffff;text-decoration:none;margin:0 8px;">Mağaza</a>
            <a href="${d}/hesap" style="color:#ffffff;text-decoration:none;margin:0 8px;">Hesabım</a>
            <a href="${d}/teslimat" style="color:#ffffff;text-decoration:none;margin:0 8px;">Teslimat &amp; İade</a>
            <a href="${d}/iletisim" style="color:#ffffff;text-decoration:none;margin:0 8px;">İletişim</a>
          </p>
          <p style="color:#a89096;font-size:10.5px;margin:6px 0 0;">&copy; ${new Date().getFullYear()} PEKEFE İspir Y\xf6resel \xdcr\xfcnler. T\xfcm hakları saklıdır. &nbsp;|&nbsp; <a href="${d}" style="color:#f5d598;text-decoration:none;">www.pekefe.com</a></p>
        </div>`)),x}async queueEmail(a,b,c,d=3){let e=b.toLowerCase().trim();if(!a||!a.includes("@"))return console.warn(`[EmailNotificationService] Invalid recipient email address: ${a}`),"invalid_email";let g="",h="";try{let a=await (0,f.w)(f.prisma.emailTemplate.findFirst({where:{OR:[{eventType:e},{eventType:e.toUpperCase()}],status:"ACTIVE"}}),2e3,null);a&&("mutabakat"!==e&&"ekstre"!==e||a.bodyHtml.includes("\xc7amlıca Mahallesi")&&a.bodyHtml.includes("{{bakiye_etiketi}}"))&&(g=a.subject,h=a.bodyHtml)}catch{}if(!g||!h)try{let a=await this.seedDefaultTemplate(e);a&&(g=a.subject,h=a.bodyHtml)}catch{}g&&h||(g=`PEKEFE Bilgilendirme — ${e.toUpperCase()}`,h="<p>Merhaba {{kullanici_adi}}, işleminiz başarıyla tamamlanmıştır.</p>");let i=this.compileTemplate(g,c,a),j=this.compileTemplate(h,c,a),k=async()=>{let{transporter:b,fromEmail:c,fromName:d}=this.getTransporter();try{return await b.sendMail({from:`"${d}" <${c}>`,to:a,subject:i,html:j})}finally{try{b.close()}catch{}}};try{let b;try{b=await k()}catch(c){console.warn(`[EmailNotificationService] First send attempt failed for ${a}, retrying once:`,c?.message||c),await new Promise(a=>setTimeout(a,1200)),b=await k()}return console.log(`[EmailNotificationService] ✅ EMAIL SENT to ${a} [${e}] (MessageID: ${b.messageId})`),f.prisma.emailLog.create({data:{recipient:a,subject:i,bodyHtml:j,eventType:e,status:"SENT",retryCount:0}}).catch(()=>{}),b.messageId||"sent_ok"}catch(b){console.error(`[EmailNotificationService] ❌ Email send failed to ${a} [${e}]:`,b?.message||b);try{return(await f.prisma.emailLog.create({data:{recipient:a,subject:i,bodyHtml:j,eventType:e,status:"FAILED",retryCount:1,errorMessage:b?.message||"Direct send error"}})).id}catch{return"error_logged"}}}async processQueue(){if(!this.isProcessing){this.isProcessing=!0;try{for(let a of(await f.prisma.emailLog.findMany({where:{status:"PENDING"},take:20,orderBy:{createdAt:"asc"}})))try{let{transporter:b,fromEmail:c,fromName:d}=this.getTransporter();try{await b.sendMail({from:`"${d}" <${c}>`,to:a.recipient,subject:a.subject,html:a.bodyHtml})}finally{try{b.close()}catch{}}await f.prisma.emailLog.update({where:{id:a.id},data:{status:"SENT"}})}catch(c){let b=a.retryCount+1;await f.prisma.emailLog.update({where:{id:a.id},data:{retryCount:b,status:b>=3?"FAILED":"PENDING",errorMessage:c?.message||"Send failed"}})}}catch(a){console.error("[EmailNotificationService] Error processing email queue:",a)}finally{this.isProcessing=!1}}}}let s=new r,t=n().join(process.cwd(),"data","orders_db.json");function u(){try{try{let a=n().dirname(t);l().existsSync(a)||l().mkdirSync(a,{recursive:!0}),l().existsSync(t)||l().writeFileSync(t,"[]","utf-8")}catch(a){console.error("Error ensuring local orders DB file:",a)}if(l().existsSync(t)){let a=l().readFileSync(t,"utf-8"),b=JSON.parse(a);return Array.isArray(b)?b:[]}}catch(a){console.error("Error reading local orders DB:",a)}return[]}function v(a){return String(a||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase()}function w(a,b){try{let c=u(),d=v(a),e=String(a||"").match(/^(?:PKF|B2B|B2C|ORD)-?\d{4}-?([A-Z0-9]+)$/i),f=e?e[1].toUpperCase():null,g=f?f.replace(/^0+/,""):null,h=null,i=!1;for(let e=0;e<c.length;e++){let j=c[e],k=v(j.id),l=v(j.orderNumber),m=k.length>6?k.slice(-6):k.padStart(6,"0");(j.id===a||j.orderNumber===a||d&&(k===d||l===d)||f&&(m===f||g&&k===g))&&(c[e]={...j,...b},h=c[e],i=!0)}if(i)return l().writeFileSync(t,JSON.stringify(c,null,2),"utf-8"),h}catch(a){console.error("Error updating local order status:",a)}return null}async function x(){let a=await (0,g.getServerSession)(h.N);if(!a||!a.user)throw Error("Oturum a\xe7ılmamış. L\xfctfen giriş yapınız.");let b=a.user.role||"USER";if(!(0,i.OY)(b)&&"DEALER"!==b)throw Error("Yetkisiz işlem. Bu alan sadece yetkili bayilere veya y\xf6neticilere a\xe7ıktır.");return a}async function y(a,b){try{await x();let c=null;try{c=await f.prisma.order.update({where:{id:a},data:{status:b},include:{currentAccount:!0}})}catch(a){console.warn("Prisma order update fallback to local disk DB:",a)}let d=w(a,{status:b});!c&&d&&(c={...d,total:d.amount,currentAccount:{name:d.client,email:d.email,phone:d.phone,address:d.address}});let e=c?.currentAccount?.email||d?.email;if(e&&"guest@nexab2b.com"!==e)try{let f="Belirtilmedi",g="—";if(c?.summary&&c.summary.startsWith("[")){let a=c.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);a&&(f=a[1].trim(),a[2]&&(g=a[2].trim()))}let h=process.env.NEXTAUTH_URL||"https://pekefe.com",i=c?.date?new Date(c.date).toLocaleDateString("tr-TR"):new Date().toLocaleDateString("tr-TR");await s.queueEmail(e,"order_status_updated",{kullanici_adi:c?.currentAccount?.name||d?.client||"Değerli M\xfcşterimiz",siparis_no:a,siparis_durumu:b,siparis_tutari:Number(c?.total||d?.amount||0).toLocaleString("tr-TR",{minimumFractionDigits:2}),kargo_sirketi:f,takip_no:g,tarih:i,detay_linki:`${h}/hesap`})}catch(a){console.error("Order status notification email failed:",a)}return{success:!0,order:c}}catch(a){return console.error("Error in updateOrderStatusAction:",a),{success:!1,error:a.message||"Sipariş durumu g\xfcncellenemedi."}}}async function z(a,b){try{await x();let c=null;try{let d=await (0,f.w)(f.prisma.order.findUnique({where:{id:a},include:{currentAccount:!0}}),2e3,null);if(!d){let b=a.replace(/[^a-zA-Z0-9]/g,"");b&&b!==a&&(d=await (0,f.w)(f.prisma.order.findUnique({where:{id:b},include:{currentAccount:!0}}),2e3,null))}if(d){let a=d.id;c=await f.prisma.$transaction(async c=>{let e=await c.order.update({where:{id:a},data:{status:"İptal Edildi"}});if("İptal Edildi"!==d.status&&"İptal"!==d.status){let e=Number(d.total);d.currentAccountId&&(await c.transaction.create({data:{currentAccountId:d.currentAccountId,type:"IPTAL",amount:-e,description:`Sipariş İptali: #${a}${b?` (${b})`:""}`,paymentMethod:d.method||"Belirtilmedi",date:new Date}}),await c.currentAccount.update({where:{id:d.currentAccountId},data:{balance:{decrement:e}}}))}return e})}}catch(a){console.warn("Prisma cancel order fallback to local disk DB:",a)}let d=w(a,{status:"İptal Edildi"}),e=c?.currentAccount?.email||d?.email;if(e&&"guest@nexab2b.com"!==e)try{let b=process.env.NEXTAUTH_URL||"https://pekefe.com";await s.queueEmail(e,"order_status_updated",{kullanici_adi:c?.currentAccount?.name||d?.client||"Değerli M\xfcşterimiz",siparis_no:a,siparis_durumu:"İptal Edildi",siparis_tutari:Number(c?.total||d?.amount||0).toLocaleString("tr-TR",{minimumFractionDigits:2}),kargo_sirketi:"—",takip_no:"—",tarih:new Date().toLocaleDateString("tr-TR"),detay_linki:`${b}/hesap`})}catch(a){console.error("Order cancellation email failed:",a)}return{success:!0,order:c||d}}catch(a){return console.error("Error in cancelOrderAction:",a),{success:!1,error:a.message||"Sipariş iptal edilirken bir hata oluştu."}}}async function A(a,b){try{await x();try{await f.prisma.order.updateMany({where:{id:{in:a}},data:{status:b}})}catch(a){console.warn("Prisma bulk update fallback to local disk DB:",a)}return a.forEach(a=>{w(a,{status:b})}),{success:!0}}catch(a){return console.error("Error in bulkUpdateOrderStatusAction:",a),{success:!1,error:a.message||"Toplu sipariş durumu g\xfcncellenemedi."}}}async function B(a,b){try{for(let c of(await x(),a))await z(c,b);return{success:!0}}catch(a){return console.error("Error in bulkCancelOrdersAction:",a),{success:!1,error:a.message||"Toplu sipariş iptal edilemedi."}}}async function C(a){try{await x();let b=[];try{b=await (0,f.w)(f.prisma.order.findMany({where:{id:{in:a}},include:{currentAccount:!0}}),2500,[])}catch(a){console.warn("[BULK INVOICE WARNING] DB unreachable, fallback to local disk DB:",a)}b&&0!==b.length||(b=u().filter(b=>a.includes(b.id)||b.orderNumber&&a.includes(b.orderNumber)).map(a=>({id:a.id,orderNumber:a.orderNumber||a.id,type:a.type||"B2C",total:{toNumber:()=>Number(a.amount||a.total||0)},summary:a.summary||"",currentAccountId:null,currentAccount:{name:a.client||"M\xfcşteri",taxNo:a.taxId||"",taxOffice:a.taxOffice||"",address:a.address||"",email:a.email||"",phone:a.phone||""}})));let c=0,d=0,e=[];for(let a of b)try{let b="B2B"===a.type?"e-Fatura":"e-Arşiv",e=null;try{e=await (0,f.w)(f.prisma.invoice.findFirst({where:{orderId:a.id}}),1500,null)}catch(a){}if(e){d++;continue}let g="function"==typeof a.total?.toNumber?a.total.toNumber():Number(a.total||a.amount||0),h=g-g/1.2,i=(await D(a.summary||"",g)).map(a=>({name:a.name,quantity:a.quantity,unitPrice:a.price,totalAmount:a.price*a.quantity,vatRate:a.taxRate||20}));try{await f.prisma.invoice.create({data:{orderId:a.id,currentAccountId:a.currentAccountId,totalAmount:g,taxAmount:h,status:"ODENDI",type:b,dueDate:new Date(Date.now()+6048e5),items:a.summary||"Sipariş Detayı",notes:"Sipariş \xfczerinden otomatik fatura oluşturuldu.",invoiceItems:{create:i}}}),await f.prisma.order.update({where:{id:a.id},data:{status:"Hazırlanıyor"}})}catch(a){console.warn("[BULK INVOICE] DB invoice create skipped (offline/unreachable):",a)}w(a.id,{status:"Hazırlanıyor"}),c++}catch(b){e.push(`${a.id}: ${b.message}`)}return{success:!0,count:c,existingCount:d,errors:e}}catch(a){return console.error("Error in bulkGenerateInvoicesAction:",a),{success:!1,error:a.message||"Toplu faturalandırma sırasında hata."}}}async function D(a,b){if(!a)return[];let c=a.replace(/^\[[^\]]+\]\s*/,""),d=c,e=c.match(/^(?:\d+\s*-\s*)(.*)/);e&&(d=e[1]);let f=d.split(/,\s*/),g=[];for(let a of f){let b=a.trim();if(!b)continue;let c=b,d=1,e=b.match(/(.+)\s*\((\d+)\)/),f=b.match(/^(\d+)\s*[xX*]\s*(.+)/),h=b.match(/(.+?)\s*[xX*]\s*(\d+)$/);e?(c=e[1].trim(),d=parseInt(e[2],10)):f?(d=parseInt(f[1],10),c=f[2].trim()):h&&(c=h[1].trim(),d=parseInt(h[2],10));let i=250;c.includes("K\xf6r\xfck")?i=450:c.includes("Kovan")?i=1200:c.includes("Maske")?i=180:c.includes("Demir")?i=90:c.includes("Tel")?i=120:c.includes("S\xfczme")?i=3500:c.includes("Bal")&&(i=150),g.push({name:c,quantity:d,price:i,taxRate:20})}if(void 0!==b&&b>0&&g.length>0){let a=b/1.2,c=g.reduce((a,b)=>a+b.price*b.quantity,0);if(c>0){let b=a/c,d=0;for(let c=0;c<g.length;c++){let e=g[c];c===g.length-1?e.price=(a-d)/e.quantity:(e.price=Math.round(e.price*b*100)/100,d+=e.price*e.quantity)}}}return g}async function E(a){try{await x();let b=null;try{b=await (0,f.w)(f.prisma.order.findUnique({where:{id:a},include:{despatchAdvices:{include:{lines:{include:{product:!0}}}},invoices:{include:{invoiceItems:!0}}}}),2500,null)}catch(a){console.warn("[FULFILLMENT WARNING] Prisma query timed out or failed:",a)}if(!b){let c=u().find(b=>b.id===a||b.orderNumber===a);c&&(b={id:c.id,status:c.status||"Yeni",date:new Date(c.date||Date.now()),total:{toNumber:()=>Number(c.amount||c.total||0)},summary:c.summary||"",type:c.type||"B2C",despatchAdvices:[],invoices:[]})}if(!b)return{success:!1,error:"Sipariş bulunamadı."};let c="function"==typeof b.total?.toNumber?b.total.toNumber():Number(b.total||0),d=(await D(b.summary||"",c)).map(a=>{let c=0;(b.despatchAdvices||[]).forEach(b=>{"Cancelled"!==b.status&&(b.lines||[]).forEach(b=>{(b.product?.name?.toLowerCase().includes(a.name.toLowerCase())||a.name.toLowerCase().includes(b.product?.name?.toLowerCase()))&&(c+=b.quantity)})});let d=0;return(b.invoices||[]).forEach(b=>{"Cancelled"!==b.status&&(b.invoiceItems||[]).forEach(b=>{(b.name?.toLowerCase().includes(a.name.toLowerCase())||a.name.toLowerCase().includes(b.name?.toLowerCase()))&&(d+=b.quantity)})}),{productName:a.name,price:a.price,orderedQty:a.quantity,shippedQty:Math.min(a.quantity,c),invoicedQty:Math.min(a.quantity,d)}}),e=b.date instanceof Date?b.date.toISOString():new Date(b.date||Date.now()).toISOString();return{success:!0,order:{id:b.id,status:b.status,date:e,total:c,summary:b.summary,type:b.type},items:d,waybills:(b.despatchAdvices||[]).map(a=>({id:a.id,despatchNo:a.despatchNo,status:a.status,date:a.createdAt?.toISOString?.()||new Date().toISOString()})),invoices:(b.invoices||[]).map(a=>({id:a.id,totalAmount:"function"==typeof a.totalAmount?.toNumber?a.totalAmount.toNumber():Number(a.totalAmount||0),status:a.status,type:a.type,date:a.date?.toISOString?.()||new Date().toISOString()}))}}catch(a){return console.error("Error in getFulfillmentDetailsAction:",a),{success:!1,error:a.message||"Sevkiyat detayları alınamadı."}}}async function F(a,b,c){try{await x();let d=null;try{d=await (0,f.w)(f.prisma.order.findUnique({where:{id:a}}),2500,null)}catch(a){console.warn("[INVOICE/WAYBILL WARNING] Prisma error:",a)}if(d||(d=u().find(b=>b.id===a||b.orderNumber===a)),!d)return{success:!1,error:"Sipariş bulunamadı."};let e=new Date().toISOString().split("T")[0].replace(/-/g,""),g=Math.floor(1e3+9e3*Math.random()),h=`IRS-${e}-${g}`;return await f.prisma.$transaction(async a=>{let e=!1,f=!1,g=[],i=[],j=0;for(let h of c){let c=0,k=0;if(b){let b=await a.despatchAdvice.findMany({where:{orderId:d.id,status:{not:"Cancelled"}},include:{lines:{include:{product:!0}}}}),e=0;b.forEach(a=>{a.lines.forEach(a=>{(a.product.name.toLowerCase().includes(h.productName.toLowerCase())||h.productName.toLowerCase().includes(a.product.name.toLowerCase()))&&(e+=a.quantity)})});let f=await a.invoice.findMany({where:{orderId:d.id,status:{not:"Cancelled"}},include:{invoiceItems:!0}}),g=0;f.forEach(a=>{a.invoiceItems.forEach(a=>{(a.name.toLowerCase().includes(h.productName.toLowerCase())||h.productName.toLowerCase().includes(a.name.toLowerCase()))&&(g+=a.quantity)})}),c=Math.max(0,h.orderedQty-e),k=Math.max(0,h.orderedQty-g)}else c=h.shipQty,k=h.invoiceQty;if(c>0){e=!0;let b=await a.product.findFirst({where:{name:{contains:h.productName}}});b||(b=await a.product.findFirst()),b&&g.push({productId:b.id,quantity:c})}k>0&&(f=!0,i.push({name:h.productName,quantity:k,unitPrice:h.price,totalAmount:h.price*k}),j+=h.price*k)}let k=null,l=null;if(e&&g.length>0&&(k=(await a.despatchAdvice.create({data:{despatchNo:h,customerAccountId:d.currentAccountId,orderId:d.id,issueDate:new Date,actualDespatchDate:new Date,status:"SEVK_EDILDI",lines:{create:g}}})).id),f&&i.length>0){let b="B2B"===d.type?"e-Fatura":"e-Arşiv",c=await a.invoice.create({data:{orderId:d.id,currentAccountId:d.currentAccountId,totalAmount:j,taxAmount:j-j/1.2,status:"BEKLEMEDE",type:b,dueDate:new Date(Date.now()+2592e6),items:d.summary||"Sipariş Detayı",notes:"Sipariş \xfczerinden akıllı fatura oluşturuldu.",invoiceItems:{create:i}}});l=c.id,k&&await a.despatchAdvice.update({where:{id:k},data:{invoiceId:c.id}})}return await a.order.update({where:{id:d.id},data:{status:b?"Teslim Edildi":"Hazırlanıyor"}}),{success:!0,waybillId:k,invoiceId:l}})}catch(a){return console.error("Error in createInvoiceAndWaybillAction:",a),{success:!1,error:a.message||"Belgeler oluşturulurken hata."}}}(0,c(89337).D)([y,z,A,B,C,D,E,F]),(0,e.A)(y,"60106f8eb8c6ba635cc84c61255a5cce0a3e7e3c25",null),(0,e.A)(z,"60ec42d9acfcc1cfa47aa8bf8931a211d982117ebf",null),(0,e.A)(A,"6083ecc778e2aa138c93148d9979e532938ce9830a",null),(0,e.A)(B,"6013be7ab7fd18b286b71915029d8fe9177daf941c",null),(0,e.A)(C,"400fdf2c7b9a0750c67cc8ec32b0aa230024390e70",null),(0,e.A)(D,"60c40d2a486e8a8fda3b051d656dcaa6892a06c67b",null),(0,e.A)(E,"40809c938ac280ffb43a5b6e4cf767413c0693a0ad",null),(0,e.A)(F,"70ff877e85a1f0d428d4f3966e6c69c753da808c8a",null)},25372:(a,b,c)=>{"use strict";c.d(b,{Fy:()=>m,OY:()=>k,ZT:()=>l});var d=c(67117),e=c(4469),f=c(20457),g=c(9290);async function h(a,b,c){try{let d=b&&(b.headers.get("x-forwarded-for")?.split(",")[0].trim()||b.headers.get("x-real-ip")||b.ip)||"127.0.0.1",e=b?new URL(b.url).pathname:"Bilinmeyen API",f=b?b.method:"Bilinmeyen Metod";await g.prisma.authLog.create({data:{ip:d,userId:c||null,route:e,method:f,failReason:a}})}catch(a){console.error("Audit log logging failed:",a)}}async function i(a){let b=await (0,d.getServerSession)(e.N);return b&&b.user&&b.user.id?{ok:!0,authorized:!0,session:b}:(a&&await h("Oturum bulunamadı veya ge\xe7ersiz.",a),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in oturum a\xe7manız gerekmektedir.",code:"UNAUTHORIZED",statusCode:401},{status:401})})}async function j(a){let b=await i(a);return b.ok?"DEALER"!==b.session.user.role||b.session.user.isApproved?b:(a&&await h("Onaylanmamış \xfcye erişim denemesi.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Hesabınız hen\xfcz onaylanmamıştır. L\xfctfen y\xf6neticinizle iletişime ge\xe7in.",code:"NOT_APPROVED",statusCode:403},{status:403})}):b}function k(a){return["SUPER_ADMIN","ADMIN","STOCK_MANAGER","ORDER_MANAGER","ACCOUNTANT","PRODUCTION_MANAGER","CONTENT_EDITOR","SUPPORT_AGENT","BRANCH_MANAGER","WAREHOUSE_SUPERVISOR","SALES_STAFF"].includes(String(a||"").trim().toUpperCase())}async function l(a){let b=await j(a);return b.ok?["SUPER_ADMIN","ADMIN"].includes(b.session.user.role)?b:(a&&await h("Admin yetkisi eksik.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in y\xf6netici yetkisi gerekmektedir.",code:"FORBIDDEN",statusCode:403},{status:403})}):b}async function m(a){let b=await j(a);return b.ok?k(b.session.user.role)?b:(a&&await h("ERP yetkisi eksik.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in ERP personeli yetkisi gerekmektedir.",code:"FORBIDDEN",statusCode:403},{status:403})}):b}},78335:()=>{},96487:()=>{}};