(()=>{var a={};a.id=7825,a.ids=[7825],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{"use strict";a.exports=require("node:process")},1932:a=>{"use strict";a.exports=require("url")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},7066:a=>{"use strict";a.exports=require("node:tty")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11723:a=>{"use strict";a.exports=require("querystring")},12412:a=>{"use strict";a.exports=require("assert")},16698:a=>{"use strict";a.exports=require("node:async_hooks")},21628:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>N,patchFetch:()=>M,routeModule:()=>I,serverHooks:()=>L,workAsyncStorage:()=>J,workUnitAsyncStorage:()=>K});var d={};c.r(d),c.d(d,{GET:()=>H,POST:()=>G});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(23211),w=c(22035),x=c(30747),y=c(93061);let z=["INSERT","UPDATE","DELETE","DROP","ALTER","TRUNCATE","CREATE","REPLACE","MERGE","UPSERT","GRANT","REVOKE","EXEC","EXECUTE","CALL","PRAGMA","ATTACH","DETACH","LOAD_EXTENSION","--",";--","/*","xp_","sp_","OPENROWSET","BULK INSERT","INFORMATION_SCHEMA","sqlite_master","sqlite_schema","sys.tables","pg_tables"],A=/UNION\s+(ALL\s+)?SELECT/i;function B(a){let b=a.toUpperCase().trim();if(!b.startsWith("SELECT")&&!b.startsWith("WITH"))return{valid:!1,reason:`SQL komutu SELECT veya WITH ile başlamalıdır. \xdcretilen başlangı\xe7: "${a.slice(0,40)}..."`};for(let b of z)if(RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(a))return{valid:!1,reason:`G\xfcvenlik ihlali: SQL i\xe7inde yasak komut tespit edildi → "${b}"`};return A.test(a)?{valid:!1,reason:"G\xfcvenlik ihlali: UNION SELECT injection tespit edildi."}:a.split(";").filter(a=>a.trim().length>0).length>1?{valid:!1,reason:"\xc7oklu SQL ifadesi (statement chaining) g\xfcvenlik gerek\xe7esiyle engellendi."}:{valid:!0}}let C=`
## ERP VERİTABANI ŞEMASI (SQLite)

### ANA TABLOLAR:

**Order** (Siparişler)
- id: TEXT PRIMARY KEY
- currentAccountId: TEXT → cariler.id (m\xfcşteri)
- date: DATETIME (sipariş tarihi)
- status: TEXT → 'Yeni' | 'Hazırlanıyor' | 'Kargolandı' | 'Tamamlandı' | 'İptal' | 'Paketlendi'
- total: REAL (toplam tutar TL)
- type: TEXT → 'B2B' | 'B2C'
- isDeleted: INTEGER (0=aktif, 1=silindi) — Her sorguda WHERE isDeleted=0 ekle!

**Invoice** (Satış Faturaları)
- id: TEXT PRIMARY KEY
- currentAccountId: TEXT → cariler.id
- orderId: TEXT (bağlı sipariş, nullable)
- date: DATETIME
- dueDate: DATETIME (vade tarihi)
- totalAmount: REAL (KDV dahil toplam TL)
- taxAmount: REAL (KDV tutarı)
- status: TEXT → 'Taslak' | 'Kesildi' | 'G\xf6nderildi' | '\xd6dendi' | 'İptal'
- type: TEXT → 'Satış' | 'İade'
- isDeleted: INTEGER

**InvoiceItem** (Fatura Satırları)
- id: TEXT PRIMARY KEY
- invoiceId: TEXT → Invoice.id
- name: TEXT (\xfcr\xfcn adı)
- quantity: REAL (adet)
- unitPrice: REAL (birim fiyat)
- vatRate: REAL (KDV oranı, \xf6rn: 20.0)
- totalAmount: REAL (satır toplam)

**cariler** (CurrentAccount — M\xfcşteri & Tedarik\xe7i Cari)
- id: TEXT PRIMARY KEY
- name: TEXT (firma veya kişi adı)
- type: TEXT → 'MUSTERI' | 'TEDARIKCI' | 'MUSTERI_TEDARIKCI'
- cariTipi: TEXT → 'CORPORATE' | 'INDIVIDUAL'
- balance: REAL (cari bakiye, pozitif = alacak, negatif = bor\xe7)
- isActive: INTEGER
- isDeleted: INTEGER

**Product** (\xdcr\xfcnler / Stok Kartları)
- id: TEXT PRIMARY KEY
- name: TEXT
- sku: TEXT UNIQUE (stok kodu)
- category: TEXT
- stock: REAL (toplam stok miktarı)
- criticalLimit: REAL (kritik stok seviyesi)
- price: REAL (satış fiyatı TL)
- cost: REAL (maliyet TL)
- isDeleted: INTEGER

**StockTransaction** (Stok Hareketleri)
- id: TEXT PRIMARY KEY
- productId: TEXT → Product.id
- warehouseId: TEXT → Warehouse.id (nullable)
- type: TEXT → 'IN' | 'OUT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'SALE' | 'PRODUCTION_IN' | 'PRODUCTION_OUT'
- quantity: REAL (pozitif=giriş, negatif=\xe7ıkış)
- date: DATETIME
- moduleSource: TEXT → 'MANUAL' | 'API' | 'SALE' | 'DESPATCH' | 'PRODUCTION'
- description: TEXT

**StockLocation** (Depo Bazlı Stok)
- id: TEXT PRIMARY KEY
- productId: TEXT → Product.id
- warehouseId: TEXT → Warehouse.id
- stock: REAL (bu depodaki mevcut stok)
- criticalLimit: REAL

**Warehouse** (Depolar)
- id: TEXT PRIMARY KEY
- name: TEXT
- code: TEXT UNIQUE

**Transaction** (Cari Hareketler)
- id: TEXT PRIMARY KEY
- currentAccountId: TEXT → cariler.id
- date: DATETIME
- type: TEXT → 'Tahsilat' | '\xd6deme' | 'Fatura' | 'İade'
- amount: REAL
- description: TEXT

**Bank** (Banka Hesapları)
- id: TEXT PRIMARY KEY
- name: TEXT
- balance: REAL
- currency: TEXT → 'TRY' | 'USD' | 'EUR'

### \xd6ZEL TABLOLAR (Ham SQL):

**supplier_ledger** (Tedarik\xe7i Defteri)
- ledger_id: TEXT PK
- supplier_id: TEXT
- transaction_type: TEXT
- debit: REAL (bor\xe7)
- credit: REAL (alacak)
- balance: REAL
- created_at: DATETIME

**incoming_e_invoices** (Gelen e-Faturalar)
- ettn_no: TEXT PK
- invoice_no: TEXT
- supplier_vkn: TEXT
- invoice_date: TEXT
- total_gross_amount: REAL
- status: TEXT → 'Pending' | 'Approved' | 'Rejected'
- created_at: DATETIME

**despatch_advices** (e-İrsaliyeler)
- despatch_id: TEXT PK
- despatch_no: TEXT
- customer_id: TEXT
- status: TEXT → 'Draft' | 'Sent' | 'Approved'
- issue_date: DATETIME
- created_at: DATETIME

### \xd6NEMLİ NOTLAR:
- Veritabanı SQLite kullanıyor. Tarih işlemleri i\xe7in: strftime('%Y-%m', date) veya date('now', 'start of month')
- "Bu ay" i\xe7in: WHERE date >= date('now', 'start of month')
- "Bug\xfcn" i\xe7in: WHERE date >= date('now', 'start of day')
- "Bu yıl" i\xe7in: WHERE date >= date('now', 'start of year')
- T\xfcrk\xe7e karakter destekli LIKE sorguları i\xe7in: LIKE '%arama%' (case-insensitive değil!)
- Sayısal hesaplama: ROUND(SUM(...), 2) ile 2 ondalık
`;class D{constructor(){this.genAI=null,this.models=["gemini-3.5-flash","gemini-2.5-flash","gemini-2.0-flash"];const a=process.env.GEMINI_API_KEY;a&&a.trim().length>10&&"your-gemini-api-key-here"!==a&&"your-gemini-api-key"!==a&&!a.startsWith("your-")?(this.genAI=new x.ij(a),console.log("[AI_ASSISTANT] Gemini API bağlantısı aktif.")):console.log("[AI_ASSISTANT] GEMINI_API_KEY bulunamadı veya ge\xe7ersiz. Mock mod aktif.")}getModelName(){return this.genAI?this.models[0]:"mock"}async generateWithRetry(a,b,c=0){if(!this.genAI)throw Error("Gemini API bağlı değil");let d=this.models[Math.min(c,this.models.length-1)],e=this.genAI.getGenerativeModel({model:d});try{let f=await e.generateContent({contents:[{role:"user",parts:[{text:a}]}],generationConfig:b});return c>0&&console.log(`[AI_ASSISTANT] Model "${d}" ile başarılı yanit alindi.`),f.response.text().trim()}catch(g){let e=g?.status===429||g?.message?.includes("429")||g?.message?.includes("quota"),f=c+1;if(e&&f<this.models.length+2){let c=Math.min(3e3*f,12e3);return console.warn(`[AI_ASSISTANT] Quota aşımı (${d}). ${c}ms bekleniyor, sonraki deneme: ${this.models[Math.min(f,this.models.length-1)]}`),await new Promise(a=>setTimeout(a,c)),this.generateWithRetry(a,b,f)}throw g}}async translateToSQL(a){if(!this.genAI)return this.mockNL2SQL(a);let b=`Sen, bir T\xfcrk e-ticaret ERP sisteminin AI veritabanı asistanısın. Adın "Pekefe ERP Asistanı".

## G\xdcVENLİK KURALLARI (MUTLAK - İHLAL EDİLEMEZ):
1. YALNIZCA SELECT sorgular \xfcret. INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE ve diğer yazma komutlarını KESİNLİKLE kullanma.
2. Zararlı, ş\xfcpheli veya veri değiştirme niyeti taşıyan sorulara SQL \xfcretme. Bunun yerine T\xfcrk\xe7e olarak nazik\xe7e reddet.
3. Kullanıcı SQL injection girişimi yaparsa (\xf6rn: '; DROP TABLE'), hemen reddet.
4. Kullanıcı "şifreyi g\xf6ster", "t\xfcm kullanıcıları listele" gibi yetkisiz veri isterlerse reddet.

## G\xd6REV:
Kullanıcının T\xfcrk\xe7e sorusunu aşağıdaki veritabanı şemasını kullanarak tek bir g\xfcvenli SQLite SELECT sorgusuna \xe7evir.

${C}

## \xc7IKTI FORMATI:
Yanıtını SADECE aşağıdaki JSON formatında ver, başka hi\xe7bir şey yazma:
{
  "sql": "SELECT ... FROM ... WHERE ... LIMIT 50;",
  "explanation": "Bu sorgunun kısa T\xfcrk\xe7e a\xe7ıklaması (1 c\xfcmle)"
}

Eğer soruyu anlayamadıysan veya g\xfcvenlik kurallarına aykırıysa:
{
  "sql": null,
  "explanation": "Bu soruya yanıt veremiyorum \xe7\xfcnk\xfc: [sebep]",
  "blocked": true
}

## KURALLAR:
- Her zaman LIMIT ekle (max: 100)
- isDeleted=0 kontrol\xfc olan tablolarda bunu WHERE'e ekle
- Tarih işlemlerinde SQLite syntax kullan (strftime, date())
- Sadece şemada bulunan tablo ve kolonları kullan
- Tablo isimleri b\xfcy\xfck-k\xfc\xe7\xfck harfe dikkat et (Product, Order, Invoice vb.). SQLite rezerve kelime \xe7akışmasını \xf6nlemek i\xe7in "Order" tablosunu her zaman \xe7ift tırnak i\xe7inde yaz: "Order"
`,c=`${b}

Kullanıcı sorusu: "${a}"`,d=await this.generateWithRetry(c,{temperature:.1,maxOutputTokens:4096,responseMimeType:"application/json"});try{let a=d.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/,"").trim(),b=JSON.parse(a);return{sql:b.sql||null,explanation:b.explanation||"SQL oluşturuldu.",blocked:b.blocked||!1}}catch{throw Error(`AI yanıtı parse edilemedi: ${d.slice(0,200)}`)}}async executeSQL(a){let b=B(a);if(!b.valid)throw Error(`SQL g\xfcvenlik doğrulaması başarısız: ${b.reason}`);let c=a.trim().replace(/;$/,"");return/LIMIT\s+\d+/i.test(c)||(c=`${c} LIMIT 500`),JSON.parse(JSON.stringify(await y.prisma.$queryRawUnsafe(c),(a,b)=>"bigint"==typeof b?Number(b):b))}async summarizeResults(a,b,c){let d;if(!this.genAI)return this.mockSummary(b);if(0===b.length)return"Belirtilen kriterlere uygun herhangi bir kayıt bulunamadı. L\xfctfen tarih aralığını veya arama kriterlerini genişletin.";this.genAI.getGenerativeModel({model:this.models[0]});let e=(d=b.slice(0,20),`Sen bir ERP sisteminin T\xfcrk\xe7e konuşan veri analisti asistanısın.

Y\xf6netici şunu sordu: "${a}"

\xc7alıştırılan SQL:
${c}

Gelen veri (${b.length} satır):
${JSON.stringify(d,null,2)}

G\xf6revi: Yukarıdaki ham veriyi y\xf6neticiye şık, anlaşılır ve profesyonel bir T\xfcrk\xe7e \xf6zet metin olarak sun.
- Sayısal değerleri T\xfcrk formatında yaz (1.250,00 TL gibi)
- Eğer veri boşsa "Belirtilen kriterlerde herhangi bir kayıt bulunamadı." de
- 2-5 c\xfcmle yeterli
- Madde işaretleri kullanabilirsin
- Tarih bilgilerini T\xfcrk\xe7e formatla (01 Haziran 2026 gibi)
- Sadece \xf6zet metni d\xf6nd\xfcr, SQL veya teknik detay ekleme`);return await this.generateWithRetry(e,{temperature:.7,maxOutputTokens:2048})}mockNL2SQL(a){let b=a.toLowerCase();return/sil|drop|delete|update|insert|alter|truncate/i.test(a)?{sql:null,explanation:"Bu işlem g\xfcvenlik politikamız gereği engellenmiştir.",blocked:!0}:b.includes("satış")||b.includes("sipariş")||b.includes("gelir")?{sql:"SELECT strftime('%Y-%m-%d', date) as tarih, COUNT(*) as siparis_sayisi, ROUND(SUM(total), 2) as toplam_tutar FROM \"Order\" WHERE isDeleted=0 AND date >= date('now', 'start of month') GROUP BY tarih ORDER BY tarih DESC LIMIT 30",explanation:"Bu ay g\xfcnl\xfck sipariş ve satış toplamları"}:b.includes("stok")||b.includes("\xfcr\xfcn")||b.includes("t\xfckenen")?{sql:'SELECT name, sku, stock, criticalLimit, price FROM "Product" WHERE isDeleted=0 AND stock <= criticalLimit ORDER BY stock ASC LIMIT 20',explanation:"Kritik stok seviyesindeki \xfcr\xfcnler"}:b.includes("m\xfcşteri")||b.includes("cari")||b.includes("alacak")?{sql:"SELECT name, balance, type FROM \"cariler\" WHERE isDeleted=0 AND type='MUSTERI' AND balance > 0 ORDER BY balance DESC LIMIT 20",explanation:"En y\xfcksek alacaklı m\xfcşteriler"}:b.includes("fatura")?{sql:"SELECT strftime('%Y-%m', date) as ay, COUNT(*) as fatura_sayisi, ROUND(SUM(totalAmount), 2) as toplam FROM \"Invoice\" WHERE isDeleted=0 GROUP BY ay ORDER BY ay DESC LIMIT 12",explanation:"Aylık fatura sayısı ve toplamları"}:{sql:"SELECT strftime('%Y-%m-%d', date) as tarih, COUNT(*) as siparis_sayisi, ROUND(SUM(total), 2) as toplam FROM \"Order\" WHERE isDeleted=0 ORDER BY date DESC LIMIT 10",explanation:"Son 10 siparişin \xf6zeti"}}mockSummary(a){if(0===a.length)return"Belirtilen kriterlere uygun herhangi bir kayıt bulunamadı.";let b=Object.keys(a[0]),c=a[0],d=b.filter(a=>"number"==typeof c[a]);if(d.length>0){let b=d[0],c=a.reduce((a,c)=>a+(Number(c[b])||0),0);return`Sorgu sonucunda **${a.length} kayıt** bulundu. "${b}" değerlerinin toplamı: **${c.toLocaleString("tr-TR",{maximumFractionDigits:2})}**. Detaylı veriyi aşağıdaki tabloda inceleyebilirsiniz.`}return`Sorgu sonucunda **${a.length} kayıt** d\xf6nd\xfcr\xfcld\xfc. Aşağıdaki tablo detaylı sonu\xe7ları g\xf6stermektedir.`}async askAssistant(a){let b=Date.now();if(!a.question||0===a.question.trim().length)return{success:!1,answer:"L\xfctfen bir soru girin.",sql:null,rows:[],rowCount:0,executionMs:0,error:"Boş soru"};if(a.question.length>500)return{success:!1,answer:"Soru \xe7ok uzun. L\xfctfen 500 karakterden kısa bir soru sorun.",sql:null,rows:[],rowCount:0,executionMs:Date.now()-b,error:"Soru \xe7ok uzun"};try{console.log(`[AI_ASSISTANT] Soru: "${a.question}"`);let{sql:c,explanation:d,blocked:e}=await this.translateToSQL(a.question);if(e||!c)return{success:!1,answer:d||"Bu soru g\xfcvenlik politikası gereği yanıtlanamıyor.",sql:null,rows:[],rowCount:0,executionMs:Date.now()-b,blocked:!0};console.log(`[AI_ASSISTANT] \xdcretilen SQL: ${c}`);let f=B(c);if(!f.valid)return console.warn(`[AI_ASSISTANT_SECURITY] SQL engellendi: ${f.reason}`),{success:!1,answer:`G\xfcvenlik politikası gereği bu sorgu \xe7alıştırılamıyor. (${f.reason})`,sql:c,rows:[],rowCount:0,executionMs:Date.now()-b,blocked:!0,error:f.reason};let g=await this.executeSQL(c);console.log(`[AI_ASSISTANT] ${g.length} satır d\xf6nd\xfc.`);let h=await this.summarizeResults(a.question,g,c);return{success:!0,answer:h,sql:c,rows:g,rowCount:g.length,executionMs:Date.now()-b}}catch(a){return console.error("[AI_ASSISTANT_ERROR]:",a),{success:!1,answer:`Bir hata oluştu: ${a.message||"Bilinmeyen hata"}. L\xfctfen soruyu farklı bir şekilde ifade edin.`,sql:null,rows:[],rowCount:0,executionMs:Date.now()-b,error:a.message}}}}let E=new D,F=new Map;async function G(a){let b,c,d,e=await (0,w.PS)("use_ai_assistant",a);if(!e.ok)return e.response;let f=e.session?.user?.id||"anonymous",g=(c=Date.now(),(d=F.get(f))&&!(c>d.resetAt)?d.count>=10?{allowed:!1,remaining:0,resetIn:d.resetAt-c}:(d.count++,{allowed:!0,remaining:10-d.count,resetIn:d.resetAt-c}):(F.set(f,{count:1,resetAt:c+6e4}),{allowed:!0,remaining:9,resetIn:6e4}));if(!g.allowed)return v.NextResponse.json({success:!1,error:"\xc7ok fazla istek g\xf6nderdiniz. L\xfctfen 1 dakika sonra tekrar deneyin.",resetInSeconds:Math.ceil(g.resetIn/1e3)},{status:429,headers:{"X-RateLimit-Limit":String(10),"X-RateLimit-Remaining":"0","X-RateLimit-Reset":String(Math.ceil(g.resetIn/1e3))}});try{b=await a.json()}catch{return v.NextResponse.json({success:!1,error:"Ge\xe7ersiz JSON formatı."},{status:400})}let{question:h,debug:i=!1}=b;if(!h||"string"!=typeof h||0===h.trim().length)return v.NextResponse.json({success:!1,error:'"question" alanı zorunludur ve boş olamaz.'},{status:400});if(h.length>500)return v.NextResponse.json({success:!1,error:"Soru 500 karakterden uzun olamaz."},{status:400});try{console.log(`[AI_ASSISTANT_API] User: ${f} | Soru: "${h.slice(0,80)}..."`);let a=await E.askAssistant({question:h.trim(),userId:f}),b={success:a.success,answer:a.answer,rowCount:a.rowCount,executionMs:a.executionMs,rateLimit:{remaining:g.remaining,resetInSeconds:Math.ceil(g.resetIn/1e3)}};i&&(b.sql=a.sql,b.rows=a.rows?.slice(0,50)),a.blocked&&(b.blocked=!0),!a.success&&a.error&&(b.errorDetail=a.error);let c=a.success?200:a.blocked?403:500;return v.NextResponse.json(b,{status:c,headers:{"X-RateLimit-Limit":String(10),"X-RateLimit-Remaining":String(g.remaining),"X-AI-Model":E.getModelName(),"X-Execution-Ms":String(a.executionMs)}})}catch(a){return console.error("[AI_ASSISTANT_API_ERROR]:",a),v.NextResponse.json({success:!1,error:"Servis ge\xe7ici olarak kullanılamıyor. L\xfctfen daha sonra tekrar deneyin.",details:void 0},{status:500})}}async function H(a){let b=await (0,w.PS)("use_ai_assistant",a);if(!b.ok)return b.response;let c=!!(process.env.GEMINI_API_KEY&&process.env.GEMINI_API_KEY.trim().length>0&&"your-gemini-api-key"!==process.env.GEMINI_API_KEY);return v.NextResponse.json({status:"operational",mode:c?"live":"mock",model:E.getModelName(),rateLimitPerMinute:10,features:["NL2SQL (Natural Language to SQL)","Turkish language support","Read-only guardrails","Multi-layer SQL validation","Result summarization"],schema:{tables:["Order","Invoice","InvoiceItem","CurrentAccount (cariler)","Product","StockTransaction","StockLocation","Warehouse","Transaction","Bank","supplier_ledger","incoming_e_invoices","despatch_advices"]},message:c?"Gemini API bağlantısı aktif. Ger\xe7ek AI yanıtları i\xe7in hazır.":"⚠️ GEMINI_API_KEY bulunamadı. Mock mod aktif. .env dosyasına GEMINI_API_KEY ekleyin."})}let I=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/ai-assistant/ask/route",pathname:"/api/ai-assistant/ask",filename:"route",bundlePath:"app/api/ai-assistant/ask/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\ETicaret\\Desktop\\PEKEFE\\webtasarim\\pekefe-app\\src\\app\\api\\ai-assistant\\ask\\route.ts",nextConfigOutput:"",userland:d,...{}}),{workAsyncStorage:J,workUnitAsyncStorage:K,serverHooks:L}=I;function M(){return(0,g.patchFetch)({workAsyncStorage:J,workUnitAsyncStorage:K})}async function N(a,b,c){c.requestMeta&&(0,h.setRequestMeta)(a,c.requestMeta),I.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/ai-assistant/ask/route";"/index"===d&&(d="/");let e=await I.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,deploymentId:v,params:w,nextConfig:x,parsedUrl:y,isDraftMode:z,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,resolvedPathname:E,clientReferenceManifest:F,serverActionsManifest:G}=e,H=(0,k.normalizeAppPath)(d),J=!!(A.dynamicRoutes[H]||A.routes[E]),K=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,y,!1):b.end("This page could not be found"),null);if(J&&!z){let a=!!A.routes[E],b=A.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(x.adapterPath)return await K();throw new t.NoFallbackError}}let L=null;!J||I.isDev||z||(L="/index"===(L=E)?"/":L);let M=!0===I.isDev||!J,N=J&&!M;G&&F&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:F,serverActionsManifest:G});let O=a.method||"GET",P=(0,i.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==B?void 0:B.isWrappedByNextServer),S=!!(0,h.getRequestMeta)(a,"minimalMode"),T=(0,h.getRequestMeta)(a,"incrementalCache")||await I.getIncrementalCache(a,x,A,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:w,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:M,incrementalCache:T,cacheLifeProfiles:x.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>I.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g,deploymentId:v}},V=new l.NodeNextRequest(a),W=new l.NodeNextResponse(b),X=m.NextRequestAdapter.fromNodeNextRequest(V,(0,m.signalFromNodeResponse)(b));try{let e,g=async a=>I.handle(X,U).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let f=c.get("next.route");if(f){let b=`${O} ${f}`;a.setAttributes({"next.route":f,"http.route":f,"next.span_name":b}),a.updateName(b),e&&e!==a&&(e.setAttribute("http.route",f),e.updateName(b))}else a.updateName(`${O} ${d}`)}),h=async e=>{var h,i;let j=async({previousCacheEntry:f})=>{try{if(!S&&C&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await g(e);a.fetchMetrics=U.renderOpts.fetchMetrics;let h=U.renderOpts.pendingWaitUntil;h&&c.waitUntil&&(c.waitUntil(h),h=void 0);let i=U.renderOpts.collectedTags;if(!J)return await (0,p.I)(V,W,d,U.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);i&&(b[s.NEXT_CACHE_TAGS_HEADER]=i),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:U.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await I.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:C})},!1,B),b}},k=await I.handleResponse({req:a,nextConfig:x,cacheKey:L,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,responseGenerator:j,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return null;if((null==k||null==(h=k.value)?void 0:h.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==k||null==(i=k.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",C?"REVALIDATED":k.isMiss?"MISS":k.isStale?"STALE":"HIT"),z&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let l=(0,q.fromNodeOutgoingHttpHeaders)(k.value.headers);return S&&J||l.delete(s.NEXT_CACHE_TAGS_HEADER),!k.cacheControl||b.getHeader("Cache-Control")||l.get("Cache-Control")||l.set("Cache-Control",(0,r.getCacheControlHeader)(k.cacheControl)),await (0,p.I)(V,W,new Response(k.value.body,{headers:l,status:k.value.status||200})),null};R&&Q?await h(Q):(e=P.getActiveScopeSpan(),await P.withPropagatedContext(a.headers,()=>P.trace(n.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},h),void 0,!R))}catch(b){if(b instanceof t.NoFallbackError||await I.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:N,isOnDemandRevalidate:C})},!1,B),J)throw b;return await (0,p.I)(V,W,new Response(null,{status:500})),null}}},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{"use strict";a.exports=require("node:child_process")},33873:a=>{"use strict";a.exports=require("path")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{"use strict";a.exports=require("node:os")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},57975:a=>{"use strict";a.exports=require("node:util")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{"use strict";a.exports=require("node:fs")},73836:a=>{"use strict";a.exports=require("node:fs/promises")},74075:a=>{"use strict";a.exports=require("zlib")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},78335:()=>{},78474:a=>{"use strict";a.exports=require("node:events")},79428:a=>{"use strict";a.exports=require("buffer")},81630:a=>{"use strict";a.exports=require("http")},84297:a=>{"use strict";a.exports=require("async_hooks")},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},94735:a=>{"use strict";a.exports=require("events")},96487:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,5592,4013,5573,1916,770,3061,2035],()=>b(b.s=21628));module.exports=c})();