(()=>{var a={};a.id=7123,a.ids=[7123],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{"use strict";a.exports=require("node:process")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{"use strict";a.exports=require("node:tty")},7840:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>J,patchFetch:()=>I,routeModule:()=>E,serverHooks:()=>H,workAsyncStorage:()=>F,workUnitAsyncStorage:()=>G});var d={};c.r(d),c.d(d,{POST:()=>B});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(93061),x=c(55511),y=c.n(x),z=c(78796),A=c(61288);async function B(a){let b="",c=null;try{b=await a.text(),c=JSON.parse(b)}catch(a){return console.error("[WEBHOOK_PARSE_ERROR]:",a),await D("UNKNOWN",b||"",`Parse Error: ${a.message}`),v.NextResponse.json({error:"Payload ayrıştırılamadı (Invalid JSON)"},{status:400})}let d=c?.order_id||`ERR-${(0,z.A)().slice(0,8)}`;try{let e=a.headers.get("x-webhook-signature")||a.headers.get("x-wc-webhook-signature"),f=a.headers.get("authorization"),g=process.env.ECOMMERCE_WEBHOOK_SECRET||"pekefe_webhook_secret_2026",h=process.env.ECOMMERCE_WEBHOOK_TOKEN||"pekefe_auth_token_2026",i=!1;if(e?y().createHmac("sha256",g).update(b).digest("base64")===e&&(i=!0):f===`Bearer ${h}`&&(i=!0),!i){let c=a.headers.get("x-forwarded-for")||"Bilinmiyor";return console.warn(`[WEBHOOK_UNAUTHORIZED] IP: ${c} Order: ${d}`),await D(d,b,"Yetkilendirme Hatası: Ge\xe7ersiz imza veya token."),v.NextResponse.json({error:"Yetkilendirme başarısız (Unauthorized)"},{status:401})}if(await C(),!c.customer||!c.items||!Array.isArray(c.items)||0===c.items.length)return await D(d,b,"Validasyon Hatası: M\xfcşteri veya \xfcr\xfcn kalemleri boş."),v.NextResponse.json({error:"Validasyon hatası: Eksik sipariş parametreleri."},{status:400});let j=c.customer.email?.trim(),k=c.customer.phone?.trim(),l=await w.prisma.currentAccount.findFirst({where:{OR:[j?{email:j}:void 0,k?{phone:k}:void 0].filter(Boolean)}});if(!l){let a=await w.prisma.currentAccount.count({where:{cariTipi:"INDIVIDUAL"}}),b=`B2C-${String(a+10001).padStart(5,"0")}`,d=`${c.customer.first_name||""} ${c.customer.last_name||""}`.trim()||"Perakende Web M\xfcşterisi",e=c.customer.billing_address||c.customer.shipping_address,f=e?`${e.full_address||""} ${e.district||""}/${e.city||""}`:"Web Sipariş Adresi";l=await w.prisma.currentAccount.create({data:{cariKod:b,name:d,type:"MUSTERI",cariTipi:"INDIVIDUAL",ad:c.customer.first_name||null,soyad:c.customer.last_name||null,email:j||null,phone:k||null,address:f,balance:0,currency:c.currency||"TRY",kaynakPlatform:"E_COMMERCE",adresler:JSON.stringify({billing:c.customer.billing_address||null,shipping:c.customer.shipping_address||null})}}),console.log(`[WEBHOOK_CARİ_OLUŞTURULDU] M\xfcşteri: ${d}, Kod: ${b}`)}let m=[];for(let a of c.items){if(!a.sku)throw Error(`Sipariş kalemi SKU bilgisi i\xe7ermiyor: ${a.name||""}`);let b=await w.prisma.product.findUnique({where:{sku:a.sku}});!b&&(console.warn(`[SKU Eşleşme Hatası - İncelenmeli] SKU: ${a.sku} sistemde bulunamadı. WEB_FALLBACK kullanılıyor.`),(b=await w.prisma.product.findUnique({where:{sku:"WEB_FALLBACK"}}))||(b=await w.prisma.product.create({data:{name:"Bilinmeyen Web Sipariş \xdcr\xfcn\xfc",sku:"WEB_FALLBACK",category:"Diger",price:0,stock:99999,images:"[]",attributes:"{}"}}))),m.push({item:a,product:b})}let n=c.items.reduce((a,b)=>a+b.price*b.quantity,0),o=c.discount_amount||0,p=[],q=0;for(let a of m){let{item:b,product:c}=a,d=0;if(o>0&&n>0){let a=b.price*b.quantity/n;d=o*a}let e=b.price*b.quantity-d,f=e/b.quantity,g=b.vat_rate||20,h=f/(1+g/100),i=h*b.quantity,j=e-i;q+=j,p.push({name:b.name||c.name,quantity:b.quantity,unitCode:"C62",price:Math.round(1e4*h)/1e4,taxRate:g})}if(c.shipping_fee&&c.shipping_fee>0){let a=c.shipping_fee/1.2,b=c.shipping_fee-a;q+=b,p.push({name:"Hizmet/Kargo Bedeli",quantity:1,unitCode:"C62",price:Math.round(1e4*a)/1e4,taxRate:20})}let r=`WEB${new Date().getFullYear()}${Math.floor(1e8+9e8*Math.random())}`,s=(0,z.A)(),t=c.order_id,u=c.created_at?new Date(c.created_at).toISOString().split("T")[0]:new Date().toISOString().split("T")[0],x="PEKEFE GER\xc7EK HASAT LİMİTED ŞİRKETİ",B="1234567890",E="Boğazi\xe7i",F="Kayseri OSB 1. Cadde No: 5";try{let a=await w.prisma.cMSData.findUnique({where:{id:"singleton"}});if(a){if(a.companyName&&a.companyName.trim().startsWith("{"))try{let b=JSON.parse(a.companyName);x=b.name||x,B=b.vkn||B,E=b.taxOffice||E}catch(a){}else a.companyName&&(x=a.companyName);a.contactAddress&&(F=a.contactAddress)}}catch(a){}let G={id:r,uuid:s,issueDate:new Date().toISOString().split("T")[0],issueTime:new Date().toLocaleTimeString("tr-TR"),invoiceTypeCode:"SATIS",currencyCode:c.currency||"TRY",orderNumber:t,orderDate:u,supplier:{name:x,taxId:B,taxOffice:E,address:F,city:"Kayseri",country:"T\xfcrkiye"},customer:{name:l.name,taxId:l.tckn||"2222222222",taxOffice:"Bireysel Perakende",address:l.address||"Adres Kayıtlı Değil",city:c.customer.shipping_address?.city||"İstanbul",country:"T\xfcrkiye"},items:p},H=(0,A.K)(G);return await w.prisma.$transaction(async a=>{for(let b of(await a.invoice.create({data:{id:r,orderId:t,currentAccountId:l.id,date:new Date,dueDate:new Date(Date.now()+6048e5),totalAmount:c.total_amount,taxAmount:Math.round(100*q)/100,status:"G\xf6nderildi",type:"e-Arşiv",externalLink:`/api/invoices/download/${r}`,items:JSON.stringify(p)}}),p))await a.invoiceItem.create({data:{invoiceId:r,name:b.name,quantity:b.quantity,unitPrice:b.price,vatRate:b.taxRate,totalAmount:Math.round(b.price*b.quantity*(1+b.taxRate/100)*100)/100}});for(let b of m){let{item:c,product:d}=b;"WEB_FALLBACK"!==d.sku&&(await a.product.update({where:{id:d.id},data:{stock:{decrement:c.quantity}}}),await a.stockTransaction.create({data:{productId:d.id,type:"SALE",quantity:c.quantity,description:`E-Ticaret Siparişi #${t} satışı. SKU: ${d.sku}`,moduleSource:"API",referenceId:t}}))}await a.currentAccount.update({where:{id:l.id},data:{balance:{increment:c.total_amount}}}),await a.transaction.create({data:{currentAccountId:l.id,type:"Satış Faturası",amount:c.total_amount,description:`E-Ticaret Sipariş #${t} Satış Faturası. Belge No: ${r}`,date:new Date}})}),console.log(`[WEBHOOK_BAŞARILI] Sipariş #${t} faturaya d\xf6n\xfcşt\xfcr\xfcld\xfc (ID: ${r})`),v.NextResponse.json({success:!0,message:"Sipariş ERP'ye başarıyla işlendi ve satış faturası \xfcretildi.",invoiceId:r,invoiceUuid:s,xml:H})}catch(a){return console.error(`[WEBHOOK_EXECUTION_ERROR] Order: ${d}:`,a),await D(d,b,a.message||"Bilinmeyen veritabanı/transaction hatası."),v.NextResponse.json({error:"Sipariş ERP'ye işlenirken bir hata oluştu.",details:a.message},{status:500})}}async function C(){try{await w.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS failed_ecommerce_orders (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        payload TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)}catch(a){console.error("Failed to create/verify failed_ecommerce_orders table:",a)}}async function D(a,b,c){try{await C();let d=(0,z.A)(),e=!process.env.DATABASE_URL||process.env.DATABASE_URL.startsWith("file:")||process.env.DATABASE_URL.includes(".db");await w.prisma.$executeRawUnsafe(`INSERT INTO failed_ecommerce_orders (id, order_id, payload, error_message, created_at)
       VALUES ($1, $2, $3, $4, ${e?"datetime('now')":"NOW()"})`,d,a,b,c),console.log(`[WEBHOOK_KAYIP_SİPARİŞ_KAYDEDİLDİ] Order: ${a}, Log ID: ${d}`)}catch(a){console.error("CRITICAL: Failed to write to failed_ecommerce_orders table! Payload:",b,"Error:",a)}}let E=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/webhooks/ecommerce/order-created/route",pathname:"/api/webhooks/ecommerce/order-created",filename:"route",bundlePath:"app/api/webhooks/ecommerce/order-created/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\webhooks\\ecommerce\\order-created\\route.ts",nextConfigOutput:"standalone",userland:d,...{}}),{workAsyncStorage:F,workUnitAsyncStorage:G,serverHooks:H}=E;function I(){return(0,g.patchFetch)({workAsyncStorage:F,workUnitAsyncStorage:G})}async function J(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),E.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/webhooks/ecommerce/order-created/route";"/index"===d&&(d="/");let e=await E.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:y,isDraftMode:z,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=e,I=(0,k.normalizeAppPath)(d),J=!!(A.dynamicRoutes[I]||A.routes[F]),K=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,y,!1):b.end("This page could not be found"),null);if(J&&!z){let a=!!A.routes[F],b=A.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await K();throw new t.NoFallbackError}}let L=null;!J||E.isDev||z||(L="/index"===(L=F)?"/":L);let M=!0===E.isDev||!J,N=J&&!M;H&&G&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==B?void 0:B.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await E.getIncrementalCache(a,x,A,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:M,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>E.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>E.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${O} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${O} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&C&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!J)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await E.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:C})},!1,B),b}},k=await E.handleResponse({req:a,nextConfig:x,cacheKey:L,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",C?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),z&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&J||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await E.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:C})},!1,B),J)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},19225:(a,b,c)=>{"use strict";a.exports=c(44870)},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},55511:a=>{"use strict";a.exports=require("crypto")},57975:a=>{"use strict";a.exports=require("node:util")},61288:(a,b,c)=>{"use strict";function d(a){let b=a.items.reduce((a,b)=>a+b.price*b.quantity*b.taxRate/100,0),c=a.items.reduce((a,b)=>a+b.price*b.quantity,0),d=c+b,e=a.orderNumber?`
    <cac:OrderReference>
        <cbc:ID>${a.orderNumber}</cbc:ID>
        <cbc:IssueDate>${a.orderDate||a.issueDate}</cbc:IssueDate>
    </cac:OrderReference>`:"";return`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 http://www.oasis-open.org/committees/ubl/schema/xsd/UBL-Invoice-2.1.xsd">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>TEMELFATURA</cbc:ProfileID>
    <cbc:ID>${a.id}</cbc:ID>
    <cbc:UUID>${a.uuid}</cbc:UUID>
    <cbc:IssueDate>${a.issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${a.issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>${a.invoiceTypeCode}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${a.currencyCode}</cbc:DocumentCurrencyCode>${e}
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:WebsiteURI>https://nexab2b.com</cbc:WebsiteURI>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${a.supplier.taxId}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${a.supplier.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${a.supplier.address}</cbc:StreetName>
                <cbc:CityName>${a.supplier.city}</cbc:CityName>
                <cbc:Country>
                    <cbc:Name>${a.supplier.country}</cbc:Name>
                </cbc:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${a.supplier.taxOffice}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${a.customer.taxId}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${a.customer.name}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${a.customer.address}</cbc:StreetName>
                <cbc:CityName>${a.customer.city}</cbc:CityName>
                <cbc:Country>
                    <cbc:Name>${a.customer.country}</cbc:Name>
                </cbc:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${a.currencyCode}">${b.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${a.currencyCode}">${c.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${a.currencyCode}">${b.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${a.currencyCode}">${c.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${a.currencyCode}">${c.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${a.currencyCode}">${d.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${a.currencyCode}">${d.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${a.items.map((b,c)=>`
    <cac:InvoiceLine>
        <cbc:ID>${c+1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${b.unitCode}">${b.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${a.currencyCode}">${(b.price*b.quantity).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${a.currencyCode}">${(b.price*b.quantity*b.taxRate/100).toFixed(2)}</cbc:TaxAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${b.name}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${a.currencyCode}">${b.price.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `).join("")}
</Invoice>`}c.d(b,{K:()=>d})},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},73836:a=>{"use strict";a.exports=require("node:fs/promises")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},78474:a=>{"use strict";a.exports=require("node:events")},78796:(a,b,c)=>{"use strict";c.d(b,{A:()=>f});let d=new Uint8Array(16),e=[];for(let a=0;a<256;++a)e.push((a+256).toString(16).slice(1));let f=function(a,b,c){return b||a||!crypto.randomUUID?function(a,b,c){let f=(a=a||{}).random??a.rng?.()??crypto.getRandomValues(d);if(f.length<16)throw Error("Random bytes length must be >= 16");if(f[6]=15&f[6]|64,f[8]=63&f[8]|128,b){if((c=c||0)<0||c+16>b.length)throw RangeError(`UUID byte range ${c}:${c+15} is out of buffer bounds`);for(let a=0;a<16;++a)b[c+a]=f[a];return b}return function(a,b=0){return(e[a[b+0]]+e[a[b+1]]+e[a[b+2]]+e[a[b+3]]+"-"+e[a[b+4]]+e[a[b+5]]+"-"+e[a[b+6]]+e[a[b+7]]+"-"+e[a[b+8]]+e[a[b+9]]+"-"+e[a[b+10]]+e[a[b+11]]+e[a[b+12]]+e[a[b+13]]+e[a[b+14]]+e[a[b+15]]).toLowerCase()}(f)}(a,b,c):crypto.randomUUID()}},84297:a=>{"use strict";a.exports=require("async_hooks")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92280:(a,b,c)=>{"use strict";Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,3061],()=>b(b.s=7840));module.exports=c})();