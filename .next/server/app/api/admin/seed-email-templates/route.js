"use strict";(()=>{var a={};a.id=1680,a.ids=[1680],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{a.exports=require("node:process")},1932:a=>{a.exports=require("url")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{a.exports=require("node:tty")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11723:a=>{a.exports=require("querystring")},12412:a=>{a.exports=require("assert")},16698:a=>{a.exports=require("node:async_hooks")},19225:(a,b,c)=>{a.exports=c(44870)},22035:(a,b,c)=>{c.d(b,{Fy:()=>m,OY:()=>k,PS:()=>p,ZT:()=>l,ru:()=>o,xE:()=>n});var d=c(41916),e=c(87969),f=c(23211),g=c(93061);async function h(a,b,c){try{let d=b&&(b.headers.get("x-forwarded-for")?.split(",")[0].trim()||b.headers.get("x-real-ip")||b.ip)||"127.0.0.1",e=b?new URL(b.url).pathname:"Bilinmeyen API",f=b?b.method:"Bilinmeyen Metod";await g.prisma.authLog.create({data:{ip:d,userId:c||null,route:e,method:f,failReason:a}})}catch(a){console.error("Audit log logging failed:",a)}}async function i(a){let b=await (0,d.getServerSession)(e.authOptions);return b&&b.user&&b.user.id?{ok:!0,authorized:!0,session:b}:(a&&await h("Oturum bulunamadı veya ge\xe7ersiz.",a),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in oturum a\xe7manız gerekmektedir.",code:"UNAUTHORIZED",statusCode:401},{status:401})})}async function j(a){let b=await i(a);return b.ok?"DEALER"!==b.session.user.role||b.session.user.isApproved?b:(a&&await h("Onaylanmamış \xfcye erişim denemesi.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Hesabınız hen\xfcz onaylanmamıştır. L\xfctfen y\xf6neticinizle iletişime ge\xe7in.",code:"NOT_APPROVED",statusCode:403},{status:403})}):b}function k(a){return["SUPER_ADMIN","ADMIN","STOCK_MANAGER","ORDER_MANAGER","ACCOUNTANT","PRODUCTION_MANAGER","CONTENT_EDITOR","SUPPORT_AGENT","BRANCH_MANAGER","WAREHOUSE_SUPERVISOR","SALES_STAFF"].includes(String(a||"").trim().toUpperCase())}async function l(a){let b=await j(a);return b.ok?["SUPER_ADMIN","ADMIN"].includes(b.session.user.role)?b:(a&&await h("Admin yetkisi eksik.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in y\xf6netici yetkisi gerekmektedir.",code:"FORBIDDEN",statusCode:403},{status:403})}):b}async function m(a){let b=await j(a);return b.ok?k(b.session.user.role)?b:(a&&await h("ERP yetkisi eksik.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in ERP personeli yetkisi gerekmektedir.",code:"FORBIDDEN",statusCode:403},{status:403})}):b}async function n(a,b){let c,d;"string"==typeof a?d=a:(c=a,d=b||"");let e=await j(c);return e.ok&&"ADMIN"!==e.session.user.role&&"SUPER_ADMIN"!==e.session.user.role&&e.session.user.id!==d?(c&&await h(`Yetkisiz kaynak erişim denemesi (Beklenen Sahip: ${d}, İsteyen: ${e.session.user.id})`,c,e.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu kaynağa erişim veya işlem yapma yetkiniz bulunmamaktadır.",code:"FORBIDDEN",statusCode:403},{status:403})}):e}function o(a,b){return async(c,d)=>{let e;return(e=b?.role==="ADMIN"||b?.role==="SUPER_ADMIN"?await l(c):b?.requireApproved!==!1?await j(c):await i(c)).ok?b?.role&&"ADMIN"!==b.role&&"SUPER_ADMIN"!==b.role&&e.session.user.role!==b.role&&!k(e.session.user.role)?(await h(`Yetersiz rol yetkisi (Gerekli: ${b.role})`,c,e.session.user.id),f.NextResponse.json({error:"Bu işlem i\xe7in gerekli yetkiniz bulunmamaktadır.",code:"FORBIDDEN",statusCode:403},{status:403})):a(c,{...d,session:e.session}):e.response}}async function p(a,b){let c=await j(b);if(!c.ok)return c;let d=c.session.user;if("SUPER_ADMIN"===d.role||"ADMIN"===d.role)return c;try{if(!await g.prisma.userRole.findFirst({where:{userId:d.id,role:{permissions:{some:{permission:{name:a}}}}}}))return b&&await h(`Yetkisiz API erişim denemesi (Gerekli Yetki: ${a})`,b,d.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:`Bu işlem i\xe7in gerekli yetkiniz bulunmamaktadır: ${a}`,code:"FORBIDDEN",statusCode:403},{status:403})}}catch(c){if(console.error("Error verifying permission in DB:",c),!(d.permissions||[]).includes(a))return b&&await h(`Yetkisiz API erişim denemesi - Fallback Kontrol (Gerekli Yetki: ${a})`,b,d.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:`Bu işlem i\xe7in gerekli yetkiniz bulunmamaktadır: ${a}`,code:"FORBIDDEN",statusCode:403},{status:403})}}return c}},28354:a=>{a.exports=require("util")},28486:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>H,patchFetch:()=>G,routeModule:()=>C,serverHooks:()=>F,workAsyncStorage:()=>D,workUnitAsyncStorage:()=>E});var d={};c.r(d),c.d(d,{POST:()=>B,dynamic:()=>y});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(93061),x=c(22035);let y="force-dynamic",z=a=>`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PEKEFE İspir Y\xf6resel \xdcr\xfcnler</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; background: #f6f1ee; color: #334155; }
  .wrapper { max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 36px rgba(92,17,34,0.08); border: 1px solid #ece3de; }
  .header { background: linear-gradient(135deg, #6b1d2f 0%, #3a0a16 100%); padding: 30px 28px 26px; text-align: center; border-bottom: 3px solid #d4a359; }
  .header img { display: block; margin: 0 auto 12px; width: 68px; height: 68px; border-radius: 14px; background: #ffffff; padding: 4px; border: 2px solid #d4a359; object-fit: contain; }
  .header h1 { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 0.14em; margin: 0; }
  .header p { color: #f5d598; font-size: 10.5px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; }
  .body { padding: 32px 28px; }
  .body h2 { font-size: 20px; color: #1a0a10; margin-bottom: 16px; font-weight: 800; }
  .body p { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 14px; }
  .btn { display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #6b1d2f, #8b263c); color: #ffffff !important; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 14px; margin: 14px 0 18px; box-shadow: 0 4px 14px rgba(107,29,47,0.28); }
  .info-box { background: #fffbf5; border-left: 4px solid #d4a359; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
  .info-box p { color: #78350f; margin: 0 0 6px; font-size: 13px; }
  .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  .order-table th { background: #fcf8f6; padding: 10px 14px; text-align: left; font-weight: 700; color: #6b1d2f; border-bottom: 2px solid #e2e8f0; }
  .order-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .order-table .total td { font-weight: 800; color: #6b1d2f; border-top: 2px solid #e2e8f0; background: #fffbf5; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .divider { border: none; border-top: 1px solid #f1f5f9; margin: 22px 0; }
  .trust-bar { background: #fdf9f6; border-top: 1px solid #f1e8e3; border-bottom: 1px solid #f1e8e3; padding: 12px 20px; text-align: center; font-size: 11px; font-weight: 700; color: #6b1d2f; }
  .footer { background: #260811; color: #e2d5d8; padding: 26px 28px; text-align: center; font-size: 12px; line-height: 1.7; }
  .footer p { color: #d6c3c7; font-size: 11.5px; margin: 4px 0; }
  .footer a { color: #f5d598; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <a href="https://www.pekefe.com" target="_blank" style="text-decoration:none;display:inline-block;">
      <img src="https://www.pekefe.com/logo.png" alt="PEKEFE İspir Y\xf6resel \xdcr\xfcnler" width="68" height="68" />
    </a>
    <h1>PEKEFE</h1>
    <p>İspir Y\xf6resel \xdcr\xfcnler &middot; 2014'ten Beri</p>
  </div>
  <div class="body">${a}</div>
  <div class="trust-bar">%100 Doğal İspir Mahsul\xfc &nbsp;&middot;&nbsp; 256-Bit SSL G\xfcvenli \xd6deme &nbsp;&middot;&nbsp; \xd6zenli &amp; Sigortalı Kargo</div>
  <div class="footer">
    <p style="color:#ffffff;font-weight:800;font-size:13px;letter-spacing:0.06em;">PEKEFE İSPİR Y\xd6RESEL \xdcR\xdcNLER</p>
    <p>\xc7amlıca Mahallesi, 25900 İspir / Erzurum, T\xfcrkiye</p>
    <p>
      <a href="tel:+905342709140">+90 534 270 91 40</a> &nbsp;&bull;&nbsp;
      <a href="https://wa.me/905342709140" target="_blank" style="color:#86efac;">WhatsApp Destek</a> &nbsp;&bull;&nbsp;
      <a href="mailto:info@pekefe.com">info@pekefe.com</a>
    </p>
    <p style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.12);">
      <a href="https://www.pekefe.com/kategoriler" style="color:#ffffff;margin:0 8px;">Mağaza</a>
      <a href="https://www.pekefe.com/hesap" style="color:#ffffff;margin:0 8px;">Hesabım</a>
      <a href="https://www.pekefe.com/teslimat" style="color:#ffffff;margin:0 8px;">Teslimat &amp; İade</a>
      <a href="https://www.pekefe.com/iletisim" style="color:#ffffff;margin:0 8px;">İletişim</a>
    </p>
    <p style="color:#a89096;font-size:10.5px;margin-top:8px;">Bu e-posta {{recipientEmail}} adresine g\xf6nderilmiştir. &copy; ${new Date().getFullYear()} PEKEFE. <a href="https://www.pekefe.com">www.pekefe.com</a></p>
  </div>
</div>
</body>
</html>`,A=[{eventType:"WELCOME",name:"Hoş Geldiniz - Yeni \xdcyelik",subject:"Pekefe Ailesine Hoş Geldiniz, {{userName}}! \uD83C\uDF3F",variables:JSON.stringify(["userName","userEmail","loginUrl","recipientEmail"]),bodyHtml:z(`<h2>Aramıza Hoş Geldiniz, {{userName}}! ✨</h2>
      <p>Pekefe ailesine katıldığınız i\xe7in teşekk\xfcr ederiz. Hesabınız başarıyla oluşturulmuştur.</p>
      <p>Anadolu'nun bereketli yaylalarından s\xfcz\xfclen %100 doğal ve geleneksel \xfcr\xfcn koleksiyonumuz artık hizmetinizde!</p>
      <div class="info-box"><p>✅ Hesabınız <strong>{{userEmail}}</strong> adresiyle aktif edilmiştir.</p></div>
      <a href="{{loginUrl}}" class="btn">Alışverişe Başla &rarr;</a>`)},{eventType:"PASSWORD_RESET",name:"Şifre Sıfırlama İsteği",subject:"Şifrenizi Sıfırlayın - Pekefe",variables:JSON.stringify(["userName","resetUrl","expiresIn","recipientEmail"]),bodyHtml:z(`<h2>Şifre Sıfırlama Talebi</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>Hesabınız i\xe7in şifre sıfırlama talebinde bulunuldu. Şifrenizi yenilemek i\xe7in aşağıdaki butona tıklayın.</p>
      <div class="info-box"><p>⌛ Bu bağlantı g\xfcvenlik nedeniyle <strong>{{expiresIn}}</strong> i\xe7inde ge\xe7erliliğini yitirecektir.</p></div>
      <a href="{{resetUrl}}" class="btn">Şifremi Sıfırla &rarr;</a>
      <hr class="divider" />
      <p style="font-size:12px;color:#888;">Bu talebi siz yapmadıysanız bu e-postayı g\xfcvenle g\xf6z ardı edebilirsiniz.</p>`)},{eventType:"ORDER_CONFIRMED",name:"Sipariş Onaylandı",subject:"Siparişiniz Alındı — #{{orderNo}} \uD83D\uDCE6",variables:JSON.stringify(["userName","orderNo","orderDate","orderTotal","shippingAddress","orderDetailUrl","recipientEmail"]),bodyHtml:z(`<h2>Siparişiniz alındı! 🎉</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>Siparişiniz tarafımıza ulaşmış ve \xf6zenle hazırlanmaya başlanmıştır. \xdcr\xfcnleriniz kargoya teslim edildiğinde bilgilendirileceksiniz.</p>
      <div class="info-box">
        <p>📦 Sipariş No: <strong>#{{orderNo}}</strong></p>
        <p>📅 Sipariş Tarihi: <strong>{{orderDate}}</strong></p>
        <p>📍 Teslimat Adresi: <strong>{{shippingAddress}}</strong></p>
        <p>💰 Toplam Tutar: <strong>{{orderTotal}}</strong></p>
      </div>
      <a href="{{orderDetailUrl}}" class="btn">Sipariş Detayını G\xf6r &rarr;</a>`)},{eventType:"ORDER_SHIPPED",name:"Sipariş Kargoya Verildi",subject:"Siparişiniz Kargoya Verildi — #{{orderNo}} \uD83D\uDE9A",variables:JSON.stringify(["userName","orderNo","cargoCompany","trackingNo","trackingUrl","estimatedDelivery","recipientEmail"]),bodyHtml:z(`<h2>Siparişiniz yola \xe7ıktı! 🚚</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz <strong>{{cargoCompany}}</strong> aracılığıyla kargoya verilmiştir.</p>
      <div class="info-box">
        <p>🔍 Kargo Takip No: <strong>{{trackingNo}}</strong></p>
        <p>📅 Tahmini Teslim Tarihi: <strong>{{estimatedDelivery}}</strong></p>
      </div>
      <a href="{{trackingUrl}}" class="btn">Kargo Takibi Yap &rarr;</a>`)},{eventType:"ORDER_DELIVERED",name:"Sipariş Teslim Edildi",subject:"Siparişiniz Teslim Edildi — #{{orderNo}} ✅",variables:JSON.stringify(["userName","orderNo","deliveredAt","feedbackUrl","shopUrl","recipientEmail"]),bodyHtml:z(`<h2>Siparişiniz teslim edildi! ✅</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz <strong>{{deliveredAt}}</strong> tarihinde başarıyla teslim edilmiştir.</p>
      <p>Geleneksel lezzetlerimiz ve alışveriş deneyiminiz hakkındaki g\xf6r\xfcşleriniz bizim i\xe7in \xe7ok değerlidir.</p>
      <a href="{{feedbackUrl}}" class="btn">Değerlendirme Yap &rarr;</a>`)},{eventType:"PAYMENT_RECEIVED",name:"\xd6deme Alındı",subject:"\xd6demeniz Onaylandı — #{{orderNo}} \uD83D\uDCB3",variables:JSON.stringify(["userName","orderNo","paymentAmount","paymentMethod","paymentDate","invoiceUrl","recipientEmail"]),bodyHtml:z(`<h2>\xd6demeniz alındı! 💳</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz i\xe7in \xf6demeniz başarıyla onaylanmıştır.</p>
      <div class="info-box">
        <p>💰 \xd6deme Tutarı: <strong>{{paymentAmount}}</strong></p>
        <p>💳 \xd6deme Y\xf6ntemi: <strong>{{paymentMethod}}</strong></p>
        <p>📅 \xd6deme Tarihi: <strong>{{paymentDate}}</strong></p>
      </div>
      <a href="{{invoiceUrl}}" class="btn">Faturayı İndir &rarr;</a>`)},{eventType:"ORDER_CANCELLED",name:"Sipariş İptal Edildi",subject:"Siparişiniz İptal Edildi — #{{orderNo}}",variables:JSON.stringify(["userName","orderNo","cancelReason","refundAmount","refundMethod","refundDays","shopUrl","recipientEmail"]),bodyHtml:z(`<h2>Siparişiniz iptal edildi</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz aşağıdaki nedenle iptal edilmiştir:</p>
      <div class="info-box"><p>📝 İptal Nedeni: <strong>{{cancelReason}}</strong></p></div>
      <p>\xd6deme yapıldıysa, <strong>{{refundAmount}}</strong> tutarındaki iade işlemi <strong>{{refundDays}}</strong> iş g\xfcn\xfc i\xe7erisinde <strong>{{refundMethod}}</strong> aracılığıyla ger\xe7ekleştirilecektir.</p>
      <a href="{{shopUrl}}" class="btn">Alışverişe Devam Et &rarr;</a>`)},{eventType:"ORDER_RETURNED",name:"İade Onaylandı",subject:"İadeniz Onaylandı — #{{orderNo}} \uD83D\uDD04",variables:JSON.stringify(["userName","orderNo","refundAmount","refundDays","refundMethod","recipientEmail"]),bodyHtml:z(`<h2>İadeniz onaylandı! 🔄</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>#{{orderNo}}</strong> numaralı siparişiniz i\xe7in yaptığınız iade talebi onaylanmıştır.</p>
      <div class="info-box">
        <p>💰 İade Edilecek Tutar: <strong>{{refundAmount}}</strong></p>
        <p>💳 İade Y\xf6ntemi: <strong>{{refundMethod}}</strong></p>
        <p>⌛ Tahmini İade S\xfcresi: <strong>{{refundDays}} iş g\xfcn\xfc</strong></p>
      </div>`)},{eventType:"B2B_APPROVED",name:"B2B Bayi Hesabı Onaylandı",subject:"Tebrikler! Bayi Hesabınız Aktif Edildi — Pekefe B2B \uD83C\uDFC6",variables:JSON.stringify(["userName","companyName","b2bGroup","discountRate","loginUrl","catalogUrl","recipientEmail"]),bodyHtml:z(`<h2>Tebrikler! Bayi hesabınız aktif edildi! 🏆</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>{{companyName}}</strong> firması adına yapmış olduğunuz Pekefe B2B bayi başvurusu onaylanmıştır!</p>
      <div class="info-box">
        <p>🏷️ Bayi Grubu: <strong>{{b2bGroup}}</strong></p>
        <p>💰 \xd6zel İndirim Oranınız: <strong>%{{discountRate}}</strong></p>
      </div>
      <p>Artık Pekefe B2B bayi fiyatlarıyla giriş yapabilir ve siparişlerinizi \xf6zel iskonto oranlarıyla verebilirsiniz.</p>
      <a href="{{loginUrl}}" class="btn">Bayi Paneline Giriş Yap &rarr;</a>`)},{eventType:"B2B_REJECTED",name:"B2B Bayi Başvurusu Reddedildi",subject:"B2B Başvurunuz Hakkında Bilgilendirme — Pekefe B2B",variables:JSON.stringify(["userName","companyName","rejectReason","contactUrl","recipientEmail"]),bodyHtml:z(`<h2>Bayi Başvurunuz Hakkında</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p><strong>{{companyName}}</strong> firması adına yaptığınız Pekefe B2B bayi başvurusu incelenmiş olup, bu aşamada onaylanamamıştır.</p>
      <div class="info-box"><p>📝 Gerek\xe7e: <strong>{{rejectReason}}</strong></p></div>
      <p>Bilgilerinizi g\xfcncelleyerek bizimle iletişime ge\xe7ebilirsiniz.</p>
      <a href="{{contactUrl}}" class="btn">İletişime Ge\xe7in &rarr;</a>`)},{eventType:"LOW_STOCK_ALERT",name:"Kritik Stok Uyarısı (Admin)",subject:"Kritik Stok Uyarısı — {{productName}}",variables:JSON.stringify(["productName","sku","currentStock","criticalLimit","warehouseName","adminPanelUrl","recipientEmail"]),bodyHtml:z(`<h2>⚠️ Kritik Stok Seviyesi Uyarısı</h2>
      <p>Aşağıdaki \xfcr\xfcn\xfcn stok seviyesi kritik limitin altına d\xfcşm\xfcşt\xfcr.</p>
      <table class="order-table">
        <tbody>
          <tr><td>\xdcr\xfcn Adı</td><td><strong>{{productName}}</strong></td></tr>
          <tr><td>SKU</td><td><strong>{{sku}}</strong></td></tr>
          <tr><td>Mevcut Stok</td><td><span class="badge badge-warning">{{currentStock}} Adet</span></td></tr>
          <tr><td>Kritik Limit</td><td><strong>{{criticalLimit}} Adet</strong></td></tr>
          <tr><td>Bulunduğu Depo</td><td><strong>{{warehouseName}}</strong></td></tr>
        </tbody>
      </table>
      <a href="{{adminPanelUrl}}" class="btn">Y\xf6netim Paneline Git &rarr;</a>`)},{eventType:"EMAIL_VERIFICATION",name:"E-posta Doğrulama",subject:"E-posta Adresinizi Doğrulayın — Pekefe ✉️",variables:JSON.stringify(["userName","verifyUrl","expiresIn","recipientEmail"]),bodyHtml:z(`<h2>E-posta adresinizi doğrulayın ✉️</h2>
      <p>Merhaba <strong>{{userName}}</strong>,</p>
      <p>\xdcyelik kaydınızı tamamlamak ve hesabınızı aktif etmek i\xe7in l\xfctfen e-posta adresinizi doğrulayın.</p>
      <div class="info-box"><p>⌛ Bu bağlantı <strong>{{expiresIn}}</strong> i\xe7inde ge\xe7erliliğini yitirecektir.</p></div>
      <a href="{{verifyUrl}}" class="btn">E-postamı Doğrula &rarr;</a>
      <hr class="divider" />
      <p style="font-size:12px;color:#888;">Bu kaydı siz oluşturmadıysanız bu e-postayı g\xfcvenle g\xf6z ardı edebilirsiniz.</p>`)}];async function B(a){let b=await (0,x.ZT)(a);if(!b.authorized)return b.response;try{let a=[];for(let b of A)try{await w.prisma.emailTemplate.findUnique({where:{eventType:b.eventType}})?(await w.prisma.emailTemplate.update({where:{eventType:b.eventType},data:{name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables}}),a.push({eventType:b.eventType,action:"updated"})):(await w.prisma.emailTemplate.create({data:{eventType:b.eventType,name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"}}),a.push({eventType:b.eventType,action:"created"}))}catch(c){a.push({eventType:b.eventType,action:"error",error:c.message})}let b=a.filter(a=>"created"===a.action).length,c=a.filter(a=>"updated"===a.action).length,d=a.filter(a=>"error"===a.action).length;return v.NextResponse.json({success:!0,summary:{created:b,updated:c,errors:d,total:A.length},results:a})}catch(a){return console.error("Seed email templates error:",a),v.NextResponse.json({error:"Internal Server Error",details:a.message},{status:500})}}let C=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/admin/seed-email-templates/route",pathname:"/api/admin/seed-email-templates",filename:"route",bundlePath:"app/api/admin/seed-email-templates/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\admin\\seed-email-templates\\route.ts",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:D,workUnitAsyncStorage:E,serverHooks:F}=C;function G(){return(0,g.patchFetch)({workAsyncStorage:D,workUnitAsyncStorage:E})}async function H(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),C.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/admin/seed-email-templates/route";"/index"===d&&(d="/");let e=await C.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:y,isDraftMode:z,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=e,I=(0,k.normalizeAppPath)(d),J=!!(A.dynamicRoutes[I]||A.routes[F]),K=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,y,!1):b.end("This page could not be found"),null);if(J&&!z){let a=!!A.routes[F],b=A.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await K();throw new t.NoFallbackError}}let L=null;!J||C.isDev||z||(L="/index"===(L=F)?"/":L);let M=!0===C.isDev||!J,N=J&&!M;H&&G&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==B?void 0:B.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await C.getIncrementalCache(a,x,A,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:M,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>C.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>C.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${O} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${O} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&D&&E&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!J)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await C.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,B),b}},k=await C.handleResponse({req:a,nextConfig:x,cacheKey:L,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),z&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&J||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await C.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,B),J)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{a.exports=require("node:child_process")},33873:a=>{a.exports=require("path")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{a.exports=require("node:os")},55511:a=>{a.exports=require("crypto")},55591:a=>{a.exports=require("https")},57975:a=>{a.exports=require("node:util")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{a.exports=require("node:fs")},73836:a=>{a.exports=require("node:fs/promises")},74075:a=>{a.exports=require("zlib")},76760:a=>{a.exports=require("node:path")},77598:a=>{a.exports=require("node:crypto")},78474:a=>{a.exports=require("node:events")},79428:a=>{a.exports=require("buffer")},81630:a=>{a.exports=require("http")},84297:a=>{a.exports=require("async_hooks")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92280:(a,b,c)=>{Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},94735:a=>{a.exports=require("events")}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,4013,5573,8914,3061,3365],()=>b(b.s=28486));module.exports=c})();