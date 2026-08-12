(()=>{var a={};a.id=1680,a.ids=[1680],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{"use strict";a.exports=require("node:process")},1932:a=>{"use strict";a.exports=require("url")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{"use strict";a.exports=require("node:tty")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11723:a=>{"use strict";a.exports=require("querystring")},12412:a=>{"use strict";a.exports=require("assert")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},18079:(a,b)=>{"use strict";b.A=function(a){return{id:"credentials",name:"Credentials",type:"credentials",credentials:{},authorize:()=>null,options:a}}},19225:(a,b,c)=>{"use strict";a.exports=c(44870)},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},57975:a=>{"use strict";a.exports=require("node:util")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},73836:a=>{"use strict";a.exports=require("node:fs/promises")},74075:a=>{"use strict";a.exports=require("zlib")},76017:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>H,patchFetch:()=>G,routeModule:()=>C,serverHooks:()=>F,workAsyncStorage:()=>D,workUnitAsyncStorage:()=>E});var d={};c.r(d),c.d(d,{POST:()=>B,dynamic:()=>y});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(93061),x=c(22035);let y="force-dynamic",z=a=>`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pekefe Geleneksel Lezzetler</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #333; }
  .wrapper { max-width: 620px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; }
  .header { background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 40px; text-align: center; }
  .header h1 { color: #fff; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
  .header p { color: #fef3c7; font-size: 12px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
  .body { padding: 36px 40px; }
  .body h2 { font-size: 20px; color: #1a0a10; margin-bottom: 16px; font-weight: 700; }
  .body p { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 14px; }
  .btn { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin: 12px 0 18px; box-shadow: 0 4px 14px rgba(107,29,47,0.25); }
  .info-box { background: #fffbf5; border-left: 4px solid #d97706; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
  .info-box p { color: #78350f; margin: 0; font-size: 13px; margin-bottom: 6px; }
  .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  .order-table th { background: #fcf8f6; padding: 10px 14px; text-align: left; font-weight: 600; color: #6b1d2f; border-bottom: 2px solid #e2e8f0; }
  .order-table td { padding: 10px 14px; border-bottom: 1px solid #eee; color: #444; }
  .order-table .total td { font-weight: 700; color: #6b1d2f; border-top: 2px solid #e2e8f0; background: #fffbf5; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .footer { background: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 24px 40px; text-align: center; }
  .footer p { color: #94a3b8; font-size: 11px; line-height: 1.8; }
  .footer a { color: #6b1d2f; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🌿 PEKEFE</h1>
    <p>Geleneksel &amp; Doğal Lezzetler \xb7 İspir</p>
  </div>
  <div class="body">${a}</div>
  <div class="footer">
    <p>&copy; 2026 Pekefe Geleneksel Lezzetler. T\xfcm Hakları Saklıdır.</p>
    <p>Bu e-posta {{recipientEmail}} adresine g\xf6nderilmiştir.</p>
    <p><a href="mailto:info@pekefe.com">info@pekefe.com</a> | <a href="http://localhost:3000">www.pekefe.com</a></p>
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
      <p style="font-size:12px;color:#888;">Bu kaydı siz oluşturmadıysanız bu e-postayı g\xfcvenle g\xf6z ardı edebilirsiniz.</p>`)}];async function B(a){let b=await (0,x.ZT)(a);if(!b.authorized)return b.response;try{let a=[];for(let b of A)try{await w.prisma.emailTemplate.findUnique({where:{eventType:b.eventType}})?(await w.prisma.emailTemplate.update({where:{eventType:b.eventType},data:{name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables}}),a.push({eventType:b.eventType,action:"updated"})):(await w.prisma.emailTemplate.create({data:{eventType:b.eventType,name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"}}),a.push({eventType:b.eventType,action:"created"}))}catch(c){a.push({eventType:b.eventType,action:"error",error:c.message})}let b=a.filter(a=>"created"===a.action).length,c=a.filter(a=>"updated"===a.action).length,d=a.filter(a=>"error"===a.action).length;return v.NextResponse.json({success:!0,summary:{created:b,updated:c,errors:d,total:A.length},results:a})}catch(a){return console.error("Seed email templates error:",a),v.NextResponse.json({error:"Internal Server Error",details:a.message},{status:500})}}let C=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/admin/seed-email-templates/route",pathname:"/api/admin/seed-email-templates",filename:"route",bundlePath:"app/api/admin/seed-email-templates/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\admin\\seed-email-templates\\route.ts",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:D,workUnitAsyncStorage:E,serverHooks:F}=C;function G(){return(0,g.patchFetch)({workAsyncStorage:D,workUnitAsyncStorage:E})}async function H(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),C.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/admin/seed-email-templates/route";"/index"===d&&(d="/");let e=await C.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:y,isDraftMode:z,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=e,I=(0,k.normalizeAppPath)(d),J=!!(A.dynamicRoutes[I]||A.routes[F]),K=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,y,!1):b.end("This page could not be found"),null);if(J&&!z){let a=!!A.routes[F],b=A.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await K();throw new t.NoFallbackError}}let L=null;!J||C.isDev||z||(L="/index"===(L=F)?"/":L);let M=!0===C.isDev||!J,N=J&&!M;H&&G&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==B?void 0:B.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await C.getIncrementalCache(a,x,A,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:M,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>C.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>C.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${O} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${O} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&D&&E&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!J)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await C.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,B),b}},k=await C.handleResponse({req:a,nextConfig:x,cacheKey:L,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),z&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&J||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await C.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,B),J)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},78474:a=>{"use strict";a.exports=require("node:events")},79428:a=>{"use strict";a.exports=require("buffer")},81630:a=>{"use strict";a.exports=require("http")},84297:a=>{"use strict";a.exports=require("async_hooks")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92280:(a,b,c)=>{"use strict";Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},93021:(a,b,c)=>{"use strict";function d(a){return{createUser:({id:b,...c})=>a.user.create(e(c)),getUser:b=>a.user.findUnique({where:{id:b}}),getUserByEmail:b=>a.user.findUnique({where:{email:b}}),async getUserByAccount(b){let c=await a.account.findUnique({where:{provider_providerAccountId:b},include:{user:!0}});return c?.user??null},updateUser:({id:b,...c})=>a.user.update({where:{id:b},...e(c)}),deleteUser:b=>a.user.delete({where:{id:b}}),linkAccount:b=>a.account.create({data:b}),unlinkAccount:b=>a.account.delete({where:{provider_providerAccountId:b}}),async getSessionAndUser(b){let c=await a.session.findUnique({where:{sessionToken:b},include:{user:!0}});if(!c)return null;let{user:d,...e}=c;return{user:d,session:e}},createSession:b=>a.session.create(e(b)),updateSession:b=>a.session.update({where:{sessionToken:b.sessionToken},...e(b)}),deleteSession:b=>a.session.delete({where:{sessionToken:b}}),async createVerificationToken(b){let c=await a.verificationToken.create(e(b));return"id"in c&&c.id&&delete c.id,c},async useVerificationToken(b){try{let c=await a.verificationToken.delete({where:{identifier_token:b}});return"id"in c&&c.id&&delete c.id,c}catch(a){if(a&&"object"==typeof a&&"code"in a&&"P2025"===a.code)return null;throw a}},getAccount:async(b,c)=>a.account.findFirst({where:{providerAccountId:b,provider:c}}),createAuthenticator:async b=>a.authenticator.create(e(b)),getAuthenticator:async b=>a.authenticator.findUnique({where:{credentialID:b}}),listAuthenticatorsByUserId:async b=>a.authenticator.findMany({where:{userId:b}}),updateAuthenticatorCounter:async(b,c)=>a.authenticator.update({where:{credentialID:b},data:{counter:c}})}}function e(a){let b={};for(let c in a)void 0!==a[c]&&(b[c]=a[c]);return{data:b}}c.d(b,{y:()=>d})},94735:a=>{"use strict";a.exports=require("events")},96487:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,4013,5573,1916,3061,2035],()=>b(b.s=76017));module.exports=c})();