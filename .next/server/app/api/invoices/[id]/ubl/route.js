(()=>{var a={};a.id=7050,a.ids=[7050],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{"use strict";a.exports=require("node:process")},1932:a=>{"use strict";a.exports=require("url")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{"use strict";a.exports=require("node:tty")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11723:a=>{"use strict";a.exports=require("querystring")},12412:a=>{"use strict";a.exports=require("assert")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},18079:(a,b)=>{"use strict";b.A=function(a){return{id:"credentials",name:"Credentials",type:"credentials",credentials:{},authorize:()=>null,options:a}}},19225:(a,b,c)=>{"use strict";a.exports=c(44870)},27013:(a,b,c)=>{"use strict";c.d(b,{Eb:()=>f,YO:()=>g,rr:()=>h});var d=c(23211);let e={};function f(a,b=10,c=6e4){let d=Date.now();return!e[a]||d>e[a].resetTime?(e[a]={count:1,resetTime:d+c},{success:!0,remaining:b-1}):(e[a].count+=1,e[a].count>b)?{success:!1,remaining:0}:{success:!0,remaining:b-e[a].count}}async function g(a,b,c=60,e=6e4){return f(a.headers.get("x-forwarded-for")?.split(",")[0]||"127.0.0.1",c,e).success?null:d.NextResponse.json({error:"Aşırı istek g\xf6nderildi. L\xfctfen bir s\xfcre sonra tekrar deneyiniz."},{status:429})}function h(a){if(!a)return"***";if(a.includes("@")){let[b,c]=a.split("@");return`${b.slice(0,2)}***@${c}`}return a.length>=7?`${a.slice(0,4)}***${a.slice(-2)}`:`${a.slice(0,1)}***`}},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},57975:a=>{"use strict";a.exports=require("node:util")},61288:(a,b,c)=>{"use strict";function d(a){let b=a.items.reduce((a,b)=>a+b.price*b.quantity*b.taxRate/100,0),c=a.items.reduce((a,b)=>a+b.price*b.quantity,0),d=c+b,e=a.orderNumber?`
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
</Invoice>`}c.d(b,{K:()=>d})},62099:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>I,patchFetch:()=>H,routeModule:()=>D,serverHooks:()=>G,workAsyncStorage:()=>E,workUnitAsyncStorage:()=>F});var d={};c.r(d),c.d(d,{GET:()=>C});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(93061),x=c(22035),y=c(27013),z=c(61288),A=c(55511),B=c.n(A);let C=(0,x.ru)(async(a,{params:b,session:c})=>{let d=await (0,y.YO)(a,"apiLimit");if(d)return d;try{let a,c,{id:d}=await b,e=await w.prisma.invoice.findUnique({where:{id:d},include:{currentAccount:!0}});if(!e)return v.NextResponse.json({error:"Fatura bulunamadı"},{status:404});let f=[];try{f="string"==typeof e.items?JSON.parse(e.items):e.items}catch(a){}let g="PEKEFE GER\xc7EK HASAT TİCARET A.Ş.",h="1234567890",i="KAYSERİ",j="Merkez Mah. Apik\xfclt\xfcr Cad. No:44";try{let a=await w.prisma.cMSData.findUnique({where:{id:"singleton"}});if(a){if(a.companyName&&a.companyName.trim().startsWith("{"))try{let b=JSON.parse(a.companyName);g=b.name||g,h=b.vkn||h,i=b.taxOffice||i}catch(a){}else a.companyName?g=a.companyName:a.siteName&&(g=`${a.siteName.toUpperCase()} LİMİTED ŞİRKETİ`);a.contactAddress&&(j=a.contactAddress)}}catch(a){}let k={name:g,taxId:h,taxOffice:i,address:j,city:"KAYSERİ",country:"T\xdcRKİYE"},l={name:e.currentAccount.name,taxId:e.currentAccount.taxId||"11111111111",taxOffice:e.currentAccount.taxOffice||"BİLİNMEYEN",address:e.currentAccount.address||"Belirtilmemiş",city:"T\xdcRKİYE",country:"T\xdcRKİYE"},m=f.map(a=>({name:a.name||"Hizmet/\xdcr\xfcn",quantity:Number(a.quantity||1),unitCode:"C62",price:Number(a.price||0),taxRate:Number(a.taxRate||20)}));if(0===m.length&&m.push({name:"Muhtelif \xdcr\xfcn/Hizmet Satışı",quantity:1,unitCode:"C62",price:e.totalAmount.toNumber()-e.taxAmount.toNumber(),taxRate:20*(e.taxAmount.toNumber()>0)}),e.orderId){let b=await w.prisma.order.findUnique({where:{id:e.orderId}});if(b){let d=await w.prisma.order.findMany({orderBy:{date:"asc"}}),e=b.date?new Date(b.date).getFullYear():new Date().getFullYear(),f=d.findIndex(a=>a.id===b.id)+1,g=String(f).padStart(4,"0"),h=b.id.replace(/^ORD-/,""),i=(h.length>8?h.slice(-8):h).toUpperCase();a=`${e}-${i}-${g}`,c=b.date?new Date(b.date).toISOString().split("T")[0]:""}}let n=e.date.toISOString(),o={id:e.id,uuid:B().randomUUID(),issueDate:n.split("T")[0],issueTime:n.split("T")[1].substring(0,8),invoiceTypeCode:"Alış Faturası"===e.type?"IADE":"SATIS",currencyCode:"TRY",orderNumber:a,orderDate:c,customer:l,supplier:k,items:m},p=(0,z.K)(o);return new v.NextResponse(p,{headers:{"Content-Type":"application/xml; charset=utf-8","Content-Disposition":`attachment; filename="Fatura_${e.id}.xml"`}})}catch(a){return console.error("UBL Generate Error:",a),v.NextResponse.json({error:a.message},{status:500})}},{role:"ADMIN",requireApproved:!0}),D=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/invoices/[id]/ubl/route",pathname:"/api/invoices/[id]/ubl",filename:"route",bundlePath:"app/api/invoices/[id]/ubl/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\invoices\\[id]\\ubl\\route.ts",nextConfigOutput:"standalone",userland:d,...{}}),{workAsyncStorage:E,workUnitAsyncStorage:F,serverHooks:G}=D;function H(){return(0,g.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:F})}async function I(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),D.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/invoices/[id]/ubl/route";"/index"===d&&(d="/");let e=await D.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:y,isDraftMode:z,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=e,I=(0,k.normalizeAppPath)(d),J=!!(A.dynamicRoutes[I]||A.routes[F]),K=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,y,!1):b.end("This page could not be found"),null);if(J&&!z){let a=!!A.routes[F],b=A.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await K();throw new t.NoFallbackError}}let L=null;!J||D.isDev||z||(L="/index"===(L=F)?"/":L);let M=!0===D.isDev||!J,N=J&&!M;H&&G&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==B?void 0:B.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await D.getIncrementalCache(a,x,A,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:M,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>D.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>D.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${O} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${O} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&C&&E&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!J)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await D.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:C})},!1,B),b}},k=await D.handleResponse({req:a,nextConfig:x,cacheKey:L,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:E,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",C?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),z&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&J||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await D.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:C})},!1,B),J)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},73836:a=>{"use strict";a.exports=require("node:fs/promises")},74075:a=>{"use strict";a.exports=require("zlib")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},78474:a=>{"use strict";a.exports=require("node:events")},79428:a=>{"use strict";a.exports=require("buffer")},81630:a=>{"use strict";a.exports=require("http")},84297:a=>{"use strict";a.exports=require("async_hooks")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92280:(a,b,c)=>{"use strict";Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},93021:(a,b,c)=>{"use strict";function d(a){return{createUser:({id:b,...c})=>a.user.create(e(c)),getUser:b=>a.user.findUnique({where:{id:b}}),getUserByEmail:b=>a.user.findUnique({where:{email:b}}),async getUserByAccount(b){let c=await a.account.findUnique({where:{provider_providerAccountId:b},include:{user:!0}});return c?.user??null},updateUser:({id:b,...c})=>a.user.update({where:{id:b},...e(c)}),deleteUser:b=>a.user.delete({where:{id:b}}),linkAccount:b=>a.account.create({data:b}),unlinkAccount:b=>a.account.delete({where:{provider_providerAccountId:b}}),async getSessionAndUser(b){let c=await a.session.findUnique({where:{sessionToken:b},include:{user:!0}});if(!c)return null;let{user:d,...e}=c;return{user:d,session:e}},createSession:b=>a.session.create(e(b)),updateSession:b=>a.session.update({where:{sessionToken:b.sessionToken},...e(b)}),deleteSession:b=>a.session.delete({where:{sessionToken:b}}),async createVerificationToken(b){let c=await a.verificationToken.create(e(b));return"id"in c&&c.id&&delete c.id,c},async useVerificationToken(b){try{let c=await a.verificationToken.delete({where:{identifier_token:b}});return"id"in c&&c.id&&delete c.id,c}catch(a){if(a&&"object"==typeof a&&"code"in a&&"P2025"===a.code)return null;throw a}},getAccount:async(b,c)=>a.account.findFirst({where:{providerAccountId:b,provider:c}}),createAuthenticator:async b=>a.authenticator.create(e(b)),getAuthenticator:async b=>a.authenticator.findUnique({where:{credentialID:b}}),listAuthenticatorsByUserId:async b=>a.authenticator.findMany({where:{userId:b}}),updateAuthenticatorCounter:async(b,c)=>a.authenticator.update({where:{credentialID:b},data:{counter:c}})}}function e(a){let b={};for(let c in a)void 0!==a[c]&&(b[c]=a[c]);return{data:b}}c.d(b,{y:()=>d})},94735:a=>{"use strict";a.exports=require("events")},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,4013,5573,1916,3061,2035],()=>b(b.s=62099));module.exports=c})();