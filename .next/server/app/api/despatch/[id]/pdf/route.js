(()=>{var a={};a.id=4321,a.ids=[4321],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{"use strict";a.exports=require("node:process")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{"use strict";a.exports=require("node:tty")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},19225:(a,b,c)=>{"use strict";a.exports=c(44870)},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},55511:a=>{"use strict";a.exports=require("crypto")},57975:a=>{"use strict";a.exports=require("node:util")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},73836:a=>{"use strict";a.exports=require("node:fs/promises")},76760:a=>{"use strict";a.exports=require("node:path")},77049:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>D,patchFetch:()=>C,routeModule:()=>y,serverHooks:()=>B,workAsyncStorage:()=>z,workUnitAsyncStorage:()=>A});var d={};c.r(d),c.d(d,{GET:()=>x});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(93061);async function x(a,{params:b}){try{let{id:a}=await b,c=await w.prisma.despatchAdvice.findUnique({where:{id:a},include:{customerAccount:!0,lines:{include:{product:!0}}}});if(!c)return new v.NextResponse("İrsaliye bulunamadı.",{status:404});let d=await w.prisma.cMSData.findUnique({where:{id:"singleton"}}),e=c.customerAccount,f=new Date(c.issueDate).toLocaleDateString("tr-TR"),g=new Date(c.issueDate).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),h=new Date(c.actualDespatchDate).toLocaleDateString("tr-TR"),i=`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Sevk İrsaliyesi - ${c.despatchNo}</title>
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
        ${d?.logoUrl?`<img src="${d.logoUrl}" alt="${d.siteName||"Logo"}" />`:""}
        <div class="company-name">${d?.companyName||"PEKEFE B2B E-TİCARET A.Ş."}</div>
        <div class="company-info">
          ${d?.contactAddress?.replace(/\n/g,"<br>")||"Merkez Mah. İstiklal Cad. No:45/A<br>Şişli / İSTANBUL"}<br>
          Tel: ${d?.contactPhone||"+90 (212) 555 12 34"} | E-Posta: ${d?.contactEmail||"info@atakb2b.com"}<br>
          VKN: 1234567890 | Ticaret Sicil: 987654
        </div>
      </div>

      <div class="doc-info">
        <div class="doc-title">Sevk İrsaliyesi</div>
        <div class="doc-subtitle">e-İrsaliye (GİB Entegre)</div>
        <table class="meta-table">
          <tr><td class="lbl">İrsaliye No:</td><td class="val">${c.despatchNo}</td></tr>
          <tr><td class="lbl">ETTN No:</td><td class="val" style="font-size:9px">${c.ettnNo.substring(0,18).toUpperCase()}…</td></tr>
          <tr><td class="lbl">D\xfczenleme Tarihi:</td><td class="val">${f} ${g}</td></tr>
          <tr><td class="lbl">Sevk Tarihi:</td><td class="val">${h}</td></tr>
          <tr><td class="lbl">Durum:</td><td class="val" style="color:#27ae60">${c.status}</td></tr>
        </table>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-box">
        <div class="party-title">📦 G\xf6nderen (Satıcı)</div>
        <div class="party-name">${d?.companyName||"PEKEFE B2B E-TİCARET A.Ş."}</div>
        <div class="party-detail">
          ${d?.contactAddress?.replace(/\n/g,"<br>")||"Merkez Mah. İstiklal Cad. No:45/A<br>Şişli / İSTANBUL"}<br>
          VKN: 1234567890<br>
          Tel: ${d?.contactPhone||"+90 (212) 555 12 34"}
        </div>
      </div>
      <div class="party-box">
        <div class="party-title">🏢 Alıcı (M\xfcşteri)</div>
        <div class="party-name">${"KURUMSAL"===e.cariTipi&&e.name||`${e.ad||""} ${e.soyad||""}`.trim()}</div>
        <div class="party-detail">
          ${e.address?e.address.replace(/\n/g,"<br>"):"—"}<br>
          ${e.taxNo?`VKN/TCKN: ${e.taxNo}<br>`:""}
          ${e.taxOffice?`Vergi Dairesi: ${e.taxOffice}<br>`:""}
          Tel: ${e.phone||"—"} | E-Posta: ${e.email||"—"}
        </div>
      </div>
    </div>

    <!-- Transport Info -->
    ${c.carrierId||c.driverName||c.licensePlate?`
    <div class="transport-box">
      <div class="section-title">🚛 Taşıma Bilgileri</div>
      <div class="transport-grid">
        <div>
          <div class="t-lbl">Taşıyıcı</div>
          <div class="t-val">${c.carrierId||"—"}</div>
        </div>
        <div>
          <div class="t-lbl">S\xfcr\xfcc\xfc Adı</div>
          <div class="t-val">${c.driverName||"—"}</div>
        </div>
        <div>
          <div class="t-lbl">TC Kimlik No</div>
          <div class="t-val">${c.driverIdentityNo||"—"}</div>
        </div>
        <div>
          <div class="t-lbl">Plaka</div>
          <div class="t-val">${c.licensePlate||"—"}</div>
        </div>
      </div>
    </div>
    `:""}

    <!-- Line Items -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:5%">No</th>
          <th style="width:50%">\xdcr\xfcn / Hizmet A\xe7ıklaması</th>
          <th style="width:15%">\xdcr\xfcn Kodu</th>
          <th style="width:10%">Birim</th>
          <th class="right" style="width:20%">Miktar</th>
        </tr>
      </thead>
      <tbody>
        ${c.lines.map((a,b)=>`
        <tr>
          <td style="text-align:center;color:#888">${b+1}</td>
          <td style="font-weight:bold">${a.product?.name||"—"}</td>
          <td style="font-family:monospace;font-size:10px;color:#555">${a.product?.sku||a.productId.substring(0,10)}</td>
          <td>Adet</td>
          <td class="right"><span class="qty-badge">${a.quantity}</span></td>
        </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Total -->
    <div class="totals-row">
      <div class="total-box">
        Toplam Kalem Sayısı: <span>${c.lines.length}</span> &nbsp;|&nbsp;
        Toplam Adet: <span>${c.lines.reduce((a,b)=>a+b.quantity,0)}</span>
      </div>
    </div>

    <!-- Signature Boxes -->
    <div class="signatures">
      <div class="sig-box">G\xf6nderen İmza / Kaşe</div>
      <div class="sig-box">Taşıyıcı İmza</div>
      <div class="sig-box">Teslim Alan İmza / Kaşe</div>
    </div>

    <!-- Legal Note -->
    <div class="legal-note">
      Bu belge 213 sayılı V.U.K. h\xfck\xfcmlerine g\xf6re elektronik ortamda d\xfczenlenmiş Sevk İrsaliyesidir. GİB entegrasyonu ile oluşturulmuştur.<br>
      ${d?.companyName||"PEKEFE B2B"} | ${d?.contactPhone||""} | ${d?.contactEmail||""}
    </div>

    <!-- Footer -->
    <div class="footer">
      e-İrsaliye Altyapısı PEKEFE B2B Bulut \xc7\xf6z\xfcmleri tarafından sağlanmaktadır. | Yazılım Versiyonu: v4.2.1-prod
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
      document.title = "\u0130rsaliye - ${c.despatchNo}";
      // Auto-trigger print dialog after short delay so page renders fully
      setTimeout(() => { window.print(); }, 400);
    };
  </script>
</body>
</html>`;return new v.NextResponse(i,{headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(a){return console.error("İrsaliye PDF hatası:",a),new v.NextResponse("İrsaliye oluşturulamadı: "+a.message,{status:500})}}let y=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/despatch/[id]/pdf/route",pathname:"/api/despatch/[id]/pdf",filename:"route",bundlePath:"app/api/despatch/[id]/pdf/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\despatch\\[id]\\pdf\\route.ts",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:z,workUnitAsyncStorage:A,serverHooks:B}=y;function C(){return(0,g.patchFetch)({workAsyncStorage:z,workUnitAsyncStorage:A})}async function D(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),y.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/despatch/[id]/pdf/route";"/index"===d&&(d="/");let e=await y.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:z,isDraftMode:A,prerenderManifest:B,routerServerContext:C,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=e,I=(0,k.normalizeAppPath)(d),J=!!(B.dynamicRoutes[I]||B.routes[F]),K=async()=>((null==C?void 0:C.render404)?await C.render404(a,b,z,!1):b.end("This page could not be found"),null);if(J&&!A){let a=!!B.routes[F],b=B.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await K();throw new t.NoFallbackError}}let L=null;!J||y.isDev||A||(L="/index"===(L=F)?"/":L);let M=!0===y.isDev||!J,N=J&&!M;H&&G&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==C?void 0:C.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await y.getIncrementalCache(a,x,B,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:B.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:M,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>y.onRequestError(a,b,d,e,C)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>y.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${O} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${O} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&D&&E&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!J)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await y.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),b}},k=await y.handleResponse({req:a,nextConfig:x,cacheKey:L,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:B,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),A&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&J||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await y.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),J)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},78474:a=>{"use strict";a.exports=require("node:events")},84297:a=>{"use strict";a.exports=require("async_hooks")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92280:(a,b,c)=>{"use strict";Object.defineProperty(b,"I",{enumerable:!0,get:function(){return g}});let d=c(28208),e=c(47617),f=c(62018);async function g(a,b,c,g){if((0,d.isNodeNextResponse)(b)){var h;b.statusCode=c.status,b.statusMessage=c.statusText;let d=["set-cookie","www-authenticate","proxy-authenticate","vary"];null==(h=c.headers)||h.forEach((a,c)=>{if("x-middleware-set-cookie"!==c.toLowerCase())if("set-cookie"===c.toLowerCase())for(let d of(0,f.splitCookiesString)(a))b.appendHeader(c,d);else{let e=void 0!==b.getHeader(c);(d.includes(c.toLowerCase())||!e)&&b.appendHeader(c,a)}});let{originalResponse:i}=b;c.body&&"HEAD"!==a.method?await (0,e.pipeToNodeResponse)(c.body,i,g):i.end()}}},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,3061],()=>b(b.s=77049));module.exports=c})();