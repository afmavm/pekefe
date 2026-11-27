(()=>{var a={};a.id=3495,a.ids=[3495],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{"use strict";a.exports=require("node:process")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5063:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>T,patchFetch:()=>S,routeModule:()=>O,serverHooks:()=>R,workAsyncStorage:()=>P,workUnitAsyncStorage:()=>Q});var d={};c.r(d),c.d(d,{GET:()=>N,dynamic:()=>E,runtime:()=>D});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(68206),x=c(9288),y=c.n(x),z=c(29021),A=c.n(z),B=c(33873),C=c.n(B);let D="nodejs",E="force-dynamic",F={"ig-post":{width:1080,height:1350},"ig-story-1":{width:1080,height:1920},"ig-story-2":{width:1080,height:1920},"ig-story-3":{width:1080,height:1920},"ig-reels":{width:1080,height:1920},"fb-post":{width:1200,height:630},"wa-card":{width:1080,height:1080},"yt-shorts":{width:1080,height:1920},"gbp-post":{width:1200,height:900}},G=[{name:"Kraliyet Bordo",bgStart:"#3d0d19",bgMid:"#6b1d2f",bgEnd:"#280810",cardBg:"rgba(0,0,0,0.28)",cardStroke:"rgba(253,230,138,0.35)",titleColor:"#ffffff",subColor:"#f3e5e8",accentBg:"#f59e0b",accentText:"#23070e",pillBg:"rgba(245,158,11,0.22)",pillText:"#fde68a",ctaBg:"#ffffff",ctaText:"#6b1d2f",footerText:"#fde68a",imgBorder:"#f59e0b"},{name:"Doğal Krem",bgStart:"#fdf9f5",bgMid:"#f6ebe0",bgEnd:"#ecdbc9",cardBg:"#6b1d2f",cardStroke:"#8b2b41",titleColor:"#ffffff",subColor:"#fde68a",accentBg:"#d97706",accentText:"#ffffff",pillBg:"#6b1d2f",pillText:"#fde68a",ctaBg:"#6b1d2f",ctaText:"#ffffff",footerText:"#6b1d2f",imgBorder:"#6b1d2f"},{name:"Gece L\xfcks",bgStart:"#0f172a",bgMid:"#1e1b18",bgEnd:"#09090b",cardBg:"rgba(255,255,255,0.06)",cardStroke:"rgba(251,191,36,0.45)",titleColor:"#fef08a",subColor:"#e2e8f0",accentBg:"#fbbf24",accentText:"#0f172a",pillBg:"rgba(251,191,36,0.18)",pillText:"#fde047",ctaBg:"#fbbf24",ctaText:"#0f172a",footerText:"#cbd5e1",imgBorder:"#fbbf24"},{name:"Yayla Z\xfcmr\xfct",bgStart:"#064e3b",bgMid:"#065f46",bgEnd:"#022c22",cardBg:"rgba(0,0,0,0.24)",cardStroke:"rgba(110,231,183,0.38)",titleColor:"#ffffff",subColor:"#d1fae5",accentBg:"#f59e0b",accentText:"#1c1917",pillBg:"rgba(52,211,153,0.22)",pillText:"#a7f3d0",ctaBg:"#ffffff",ctaText:"#064e3b",footerText:"#a7f3d0",imgBorder:"#34d399"},{name:"Altın Hasat",bgStart:"#78350f",bgMid:"#92400e",bgEnd:"#451a03",cardBg:"rgba(0,0,0,0.26)",cardStroke:"rgba(254,243,199,0.4)",titleColor:"#fffbeb",subColor:"#fef3c7",accentBg:"#6b1d2f",accentText:"#ffffff",pillBg:"rgba(255,251,235,0.2)",pillText:"#fef3c7",ctaBg:"#fffbeb",ctaText:"#78350f",footerText:"#fde68a",imgBorder:"#fde68a"}];function H(a){return String(a||"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;").replace(/\s+/g," ").trim()}function I(a,b,c){let d=H(a);if(!d)return[];let e=d.split(" "),f=[],g="";for(let a of e){let d=g?`${g} ${a}`:a;if(d.length<=b)g=d;else if(g&&f.push(g),g=a,f.length>=c)break}if(g&&f.length<c&&f.push(g),f.length===c&&e.join(" ").length>f.join(" ").length){let a=f[c-1];f[c-1]=a.length>3?a.slice(0,b-1)+"…":a}return f}function J(a,b,c,d,e,f,g=800,h="start"){if(0===a.length)return"";let i=a.map((a,c)=>`<tspan x="${b}" dy="${0===c?0:d}">${a}</tspan>`).join("");return`<text x="${b}" y="${c}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="${e}" font-weight="${g}" fill="${f}" text-anchor="${h}">${i}</text>`}async function K(a){if(a)try{let b=a;if(b.startsWith("https://www.pekefe.com/")?b=b.replace("https://www.pekefe.com",""):b.startsWith("https://pekefe.com/")&&(b=b.replace("https://pekefe.com","")),b.startsWith("/")){let a=b.split("?")[0].replace(/^\/+/,""),c=C().join(process.cwd(),"public",a);if(A().existsSync(c)&&A().statSync(c).isFile())return A().readFileSync(c)}if(a.startsWith("http://")||a.startsWith("https://")){let b=await fetch(a,{signal:AbortSignal.timeout(4e3)});if(b.ok)return Buffer.from(await b.arrayBuffer())}}catch(a){console.warn("[SOCIAL VISUAL] Product image load warning:",a)}for(let a of["premium-pekefe-kavanoz.png","pekefe-dut-pekmezi-kavanoz-tr.jpg","logo.png"]){let b=C().join(process.cwd(),"public",a);if(A().existsSync(b))return A().readFileSync(b)}return null}async function L(a,b,c,d){let e=Buffer.from(`<svg width="${b}" height="${c}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${b}" height="${c}" rx="${d}" ry="${d}" fill="#ffffff"/></svg>`);return y()(a).resize(b,c,{fit:"cover",position:"centre"}).composite([{input:e,blend:"dest-in"}]).png().toBuffer()}async function M(a,b,c){var d;let{width:e,height:f}=F[b],g=G[(("wa-card"===b?3:"ig-post"===b?1:2*("yt-shorts"===b))+c)%G.length],h=await K(a.productImage),i=(d=a.productPrice)&&!(d<=0)?`${Number(d).toLocaleString("tr-TR")} TL`:"TAZE MAHSUL",j="",k={x:160,y:420,w:760,h:620,r:36};if("ig-post"===b){k={x:140,y:440,w:800,h:620,r:36};let b=I(a.instagram.post.hook,32,3),c=I(a.productName,34,1);j=`
      <svg width="${e}" height="${f}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${g.bgStart}"/>
            <stop offset="55%" stop-color="${g.bgMid}"/>
            <stop offset="100%" stop-color="${g.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${e}" height="${f}" fill="url(#bg)"/>
        <circle cx="980" cy="120" r="240" fill="${g.imgBorder}" fill-opacity="0.10"/>
        <circle cx="80" cy="1240" r="220" fill="${g.imgBorder}" fill-opacity="0.08"/>

        <!-- Top Badge & Brand -->
        <rect x="64" y="54" width="430" height="54" rx="27" fill="${g.pillBg}" stroke="${g.cardStroke}" stroke-width="2"/>
        <text x="279" y="88" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="800" fill="${g.pillText}" text-anchor="middle" letter-spacing="2">%100 DOGAL \xb7 ISPIR YORESEL</text>
        <text x="1016" y="92" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="900" fill="${g.footerText}" text-anchor="end" letter-spacing="4">PEKEFE</text>

        <!-- Hook Banner -->
        <rect x="64" y="140" width="952" height="250" rx="30" fill="${g.cardBg}" stroke="${g.cardStroke}" stroke-width="2.5"/>
        ${J(b,104,215,58,42,g.titleColor,900,"start")}

        <!-- Image Border Frame -->
        <rect x="${k.x-6}" y="${k.y-6}" width="${k.w+12}" height="${k.h+12}" rx="${k.r+4}" fill="none" stroke="${g.imgBorder}" stroke-width="8"/>

        <!-- Bottom Info Bar -->
        <rect x="64" y="1120" width="952" height="164" rx="28" fill="${g.ctaBg}" stroke="${g.cardStroke}" stroke-width="2"/>
        ${J(c,102,1188,38,30,g.ctaText,900,"start")}
        <text x="102" y="1234" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="600" fill="${g.ctaText}" fill-opacity="0.78">Katkisiz \xb7 Geleneksel Uretim \xb7 www.pekefe.com</text>

        <!-- Price Pill -->
        <rect x="748" y="1146" width="236" height="112" rx="22" fill="${g.accentBg}"/>
        <text x="866" y="1186" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="800" fill="${g.accentText}" text-anchor="middle">TAZE MAHSUL</text>
        <text x="866" y="1236" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" font-weight="900" fill="${g.accentText}" text-anchor="middle">${H(i)}</text>
      </svg>`}else if("wa-card"===b){k={x:64,y:200,w:460,h:610,r:32};let b=I(a.productName,19,3),c=I(a.whatsapp.statusCaption,26,4);j=`
      <svg width="${e}" height="${f}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${g.bgStart}"/>
            <stop offset="50%" stop-color="${g.bgMid}"/>
            <stop offset="100%" stop-color="${g.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${e}" height="${f}" fill="url(#bg)"/>

        <rect x="64" y="64" width="460" height="54" rx="27" fill="${g.pillBg}" stroke="${g.cardStroke}" stroke-width="2"/>
        <text x="294" y="98" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="800" fill="${g.pillText}" text-anchor="middle" letter-spacing="2">WHATSAPP YENI MAHSUL DUYURU</text>
        <text x="1016" y="102" font-family="DejaVu Sans, Arial, sans-serif" font-size="32" font-weight="900" fill="${g.footerText}" text-anchor="end" letter-spacing="4">PEKEFE</text>

        <rect x="${k.x-6}" y="${k.y-6}" width="${k.w+12}" height="${k.h+12}" rx="${k.r+4}" fill="none" stroke="${g.imgBorder}" stroke-width="8"/>

        <!-- Right Text Column -->
        ${J(b,568,275,52,40,g.titleColor,900,"start")}
        ${J(c,568,470,38,25,g.subColor,500,"start")}

        <!-- Price Badge -->
        <rect x="568" y="680" width="290" height="106" rx="24" fill="${g.accentBg}"/>
        <text x="713" y="748" font-family="DejaVu Sans, Arial, sans-serif" font-size="42" font-weight="900" fill="${g.accentText}" text-anchor="middle">${H(i)}</text>

        <!-- Footer CTA -->
        <rect x="64" y="884" width="952" height="126" rx="26" fill="${g.ctaBg}"/>
        <text x="106" y="958" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="900" fill="${g.ctaText}">Siparis Hatti: +90 534 270 91 40</text>
        <text x="974" y="958" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="900" fill="${g.ctaText}" text-anchor="end">www.pekefe.com</text>
      </svg>`}else if("fb-post"===b||"gbp-post"===b){let c="gbp-post"===b;k=c?{x:56,y:120,w:470,h:660,r:30}:{x:48,y:56,w:450,h:518,r:28};let d=c?a.productName:a.facebook.hook,h=c?a.googleBusiness.summary:a.facebook.questionForEngagement||a.facebook.postText,l=I(d,25,3),m=I(h,38,c?5:4),n=c?574:542;j=`
      <svg width="${e}" height="${f}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${g.bgStart}"/>
            <stop offset="55%" stop-color="${g.bgMid}"/>
            <stop offset="100%" stop-color="${g.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${e}" height="${f}" fill="url(#bg)"/>
        <rect x="${k.x-6}" y="${k.y-6}" width="${k.w+12}" height="${k.h+12}" rx="${k.r+4}" fill="none" stroke="${g.imgBorder}" stroke-width="7"/>

        <rect x="${n}" y="${c?120:58}" width="440" height="46" rx="23" fill="${g.pillBg}" stroke="${g.cardStroke}" stroke-width="2"/>
        <text x="${n+220}" y="${c?149:87}" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="800" fill="${g.pillText}" text-anchor="middle" letter-spacing="1.5">${c?"ERZURUM ISPIR \xb7 GOOGLE ISLETME":"PEKEFE ISPIR \xb7 YENI URUN"}</text>

        ${J(l,n,c?240:172,c?56:48,c?42:36,g.titleColor,900,"start")}
        ${J(m,n,c?440:345,36,23,g.subColor,500,"start")}

        <!-- Price + CTA -->
        <rect x="${n}" y="${f-140}" width="220" height="84" rx="20" fill="${g.accentBg}"/>
        <text x="${n+110}" y="${f-86}" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="900" fill="${g.accentText}" text-anchor="middle">${H(i)}</text>

        <rect x="${n+240}" y="${f-140}" width="340" height="84" rx="20" fill="${g.ctaBg}"/>
        <text x="${n+410}" y="${f-89}" font-family="DejaVu Sans, Arial, sans-serif" font-size="24" font-weight="900" fill="${g.ctaText}" text-anchor="middle">Siparis Ver \xb7 pekefe.com</text>
      </svg>`}else{let c=b.startsWith("ig-story-"),d="ig-story-1"===b?0:"ig-story-2"===b?1:2,h=a.instagram.story.slides?.[d],l="ig-reels"===b?"REELS \xb7 ISPIR YORESEL":"yt-shorts"===b?"YOUTUBE SHORTS \xb7 PEKEFE":`HIKAYE ${d+1}/3 \xb7 PEKEFE ISPIR`,m="ig-reels"===b?a.instagram.reels.hook0_3s:"yt-shorts"===b?a.youtube.shortsTitle:h?.headline||a.instagram.post.hook,n="ig-reels"===b?a.instagram.reels.cta15_25s:"yt-shorts"===b?`${a.productName} \xb7 %100 Dogal Erzurum Ispir Uretimi`:h?.body||a.productName,o="ig-story-1"===b?h?.stickerSuggestion||"Anket: Dogal mi, Katkisiz mi?":"ig-story-2"===b?h?.stickerSuggestion||"%100 Katkisiz \xb7 Geleneksel Uretim":"ig-reels"===b?"IZLE VE KAYDET \xb7 www.pekefe.com":"yt-shorts"===b?"SIPARIS ICIN: WWW.PEKEFE.COM":`SIMDI INCELE \xb7 ${i}`;k={x:140,y:740,w:800,h:760,r:44};let p=I(m,26,3),q=I(n,38,3),r=c?[0,1,2].map(a=>`<rect x="${64+324*a}" y="54" width="304" height="10" rx="5" fill="${a<=d?g.imgBorder:"rgba(255,255,255,0.22)"}"/>`).join(""):"";j=`
      <svg width="${e}" height="${f}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${g.bgStart}"/>
            <stop offset="50%" stop-color="${g.bgMid}"/>
            <stop offset="100%" stop-color="${g.bgEnd}"/>
          </linearGradient>
        </defs>
        <rect width="${e}" height="${f}" fill="url(#bg)"/>
        ${r}

        <!-- Top Badge & Logo -->
        <rect x="64" y="106" width="460" height="58" rx="29" fill="${g.pillBg}" stroke="${g.cardStroke}" stroke-width="2"/>
        <text x="294" y="143" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="800" fill="${g.pillText}" text-anchor="middle" letter-spacing="2">${l}</text>
        <text x="1016" y="146" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="900" fill="${g.footerText}" text-anchor="end" letter-spacing="4">PEKEFE</text>

        <!-- Hook Card -->
        <rect x="64" y="206" width="952" height="474" rx="36" fill="${g.cardBg}" stroke="${g.cardStroke}" stroke-width="2.5"/>
        ${J(p,110,298,64,48,g.titleColor,900,"start")}
        ${J(q,110,520,42,28,g.subColor,500,"start")}

        <!-- Product Image Frame -->
        <rect x="${k.x-8}" y="${k.y-8}" width="${k.w+16}" height="${k.h+16}" rx="${k.r+6}" fill="none" stroke="${g.imgBorder}" stroke-width="9"/>

        <!-- Price Badge below Image -->
        <rect x="330" y="1552" width="420" height="92" rx="26" fill="${g.accentBg}"/>
        <text x="540" y="1613" font-family="DejaVu Sans, Arial, sans-serif" font-size="42" font-weight="900" fill="${g.accentText}" text-anchor="middle">${H(i)}</text>

        <!-- Bottom CTA Pill -->
        <rect x="64" y="1684" width="952" height="114" rx="30" fill="${g.ctaBg}"/>
        <text x="540" y="1752" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="900" fill="${g.ctaText}" text-anchor="middle">${H(o.slice(0,48))}</text>

        <!-- Footer -->
        <text x="64" y="1858" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="${g.footerText}">ERZURUM ISPIR \xb7 %100 DOGAL</text>
        <text x="1016" y="1858" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="${g.footerText}" text-anchor="end">www.pekefe.com</text>
      </svg>`}let l=[];if(h)try{let a=await L(h,k.w,k.h,k.r);l.push({input:a,left:k.x,top:k.y})}catch(a){console.warn("[SOCIAL VISUAL] Image composite skipped:",a)}return y()(Buffer.from(j)).composite(l).png({compressionLevel:8}).toBuffer()}async function N(a){try{let{searchParams:b}=new URL(a.url),c=b.get("packId")||"",d=b.get("format")||"ig-post",e=Number(b.get("v")||b.get("variant")||0),f=Number.isFinite(e)?Math.abs(Math.floor(e)):0,g="1"===b.get("download"),h=F[d]?d:"ig-post",i=await (0,w._t)(),j=i.packs.find(a=>a.id===c)||i.packs[0];if(!j)return v.NextResponse.json({error:"İ\xe7erik paketi bulunamadı."},{status:404});let k=await M(j,h,f),l={"Content-Type":"image/png","Cache-Control":"no-cache, no-store, must-revalidate"};if(g){let a=(j.productSlug||"pekefe-urun").replace(/[^a-z0-9-_]/gi,"");l["Content-Disposition"]=`attachment; filename="pekefe-${a}-${h}-v${f+1}.png"`}return new v.NextResponse(new Uint8Array(k),{status:200,headers:l})}catch(a){return console.error("[SOCIAL VISUAL ERROR]",a),v.NextResponse.json({error:a?.message||"G\xf6rsel oluşturulamadı."},{status:500})}}let O=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/social-media/visual/route",pathname:"/api/social-media/visual",filename:"route",bundlePath:"app/api/social-media/visual/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\social-media\\visual\\route.tsx",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:P,workUnitAsyncStorage:Q,serverHooks:R}=O;function S(){return(0,g.patchFetch)({workAsyncStorage:P,workUnitAsyncStorage:Q})}async function T(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),O.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/social-media/visual/route";"/index"===d&&(d="/");let e=await O.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:y,isDraftMode:z,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,resolvedPathname:E,clientReferenceManifest:F,serverActionsManifest:G}=e,H=(0,k.normalizeAppPath)(d),I=!!(A.dynamicRoutes[H]||A.routes[E]),J=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,y,!1):b.end("This page could not be found"),null);if(I&&!z){let a=!!A.routes[E],b=A.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await J();throw new t.NoFallbackError}}let K=null;!I||O.isDev||z||(K="/index"===(K=E)?"/":K);let L=!0===O.isDev||!I,M=I&&!L;G&&F&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:F,serverActionsManifest:G});let N=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==B?void 0:B.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await O.getIncrementalCache(a,x,A,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:L,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>O.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>O.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${N} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${N} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&C&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!I)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await O.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,B),b}},k=await O.handleResponse({req:a,nextConfig:x,cacheKey:K,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!I)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",C?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),z&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&I||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${N} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":N,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await O.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,B),I)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},7066:a=>{"use strict";a.exports=require("node:tty")},9288:a=>{"use strict";a.exports=require("sharp")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},55511:a=>{"use strict";a.exports=require("crypto")},57975:a=>{"use strict";a.exports=require("node:util")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},73836:a=>{"use strict";a.exports=require("node:fs/promises")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},78474:a=>{"use strict";a.exports=require("node:events")},84297:a=>{"use strict";a.exports=require("async_hooks")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,3061,9050,5519],()=>b(b.s=5063));module.exports=c})();