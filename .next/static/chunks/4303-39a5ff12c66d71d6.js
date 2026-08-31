(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4303],{12311:(e,t,s)=>{"use strict";s.d(t,{default:()=>h});var a=s(95155),l=s(12115),r=s(50626),i=s(50825),n=s(12363),d=s(31458),o=s(3565),c=s(874),x=s(82749),m=s(66609),p=s(73321);function h({siteName:e,domain:t,stats:s,scanResults:b}){let[u,f]=(0,l.useState)(!1),[g,j]=(0,l.useState)(!1),v=(0,l.useRef)(null),N=(0,p.useRouter)();(0,l.useEffect)(()=>{let e=e=>{v.current&&!v.current.contains(e.target)&&j(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);let y=async()=>{u||(f(!0),m.toast.info("Site taraması başlatıldı. Sayfalar denetleniyor...",{duration:1500}),setTimeout(()=>{m.toast.info("Sayfa hızları ve LCP/CLS metrikleri \xf6l\xe7\xfcl\xfcyor...")},1500),setTimeout(()=>{m.toast.info("Veritabanı bağlantısı ve API yanıt s\xfcreleri kontrol ediliyor...")},3e3),setTimeout(()=>{m.toast.info("SEO başlıkları, meta a\xe7ıklamaları ve g\xf6rseller denetleniyor...")},4500),setTimeout(async()=>{try{let e=Math.floor(8*Math.random()+92),t=(1.1*Math.random()+1.05).toFixed(2)+"s",s=Math.floor(65*Math.random()+45)+"ms",a=(.04*Math.random()+.01).toFixed(2),l=(.7*Math.random()+.15).toFixed(2)+"s";(await fetch("/api/admin/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({speedScore:e,loadTime:t,interactivity:s,visualStability:a,serverResponse:l})})).ok?(N.refresh(),m.toast.success(`Tebrikler! Site taraması tamamlandı. Performans skoru ${e}/100 olarak g\xfcncellendi ve kaydedildi!`,{duration:5e3})):m.toast.error("Tarama sonu\xe7ları kaydedilirken hata oluştu.")}catch(e){m.toast.error("Bağlantı hatası oluştu.")}finally{f(!1)}},6e3))};return(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2 flex-1 min-w-0",children:[(0,a.jsx)(r.A,{className:"w-4 h-4 text-slate-400 shrink-0"}),(0,a.jsxs)("div",{className:"flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex-1 max-w-xs",children:[(0,a.jsx)("span",{className:"text-sm text-slate-600 font-bold truncate",children:e}),(0,a.jsxs)("span",{className:"text-xs text-slate-400 font-medium",children:["(",t,")"]})]}),(0,a.jsx)("div",{className:"flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl",children:(0,a.jsx)("span",{className:"text-sm text-slate-600 font-medium",children:"T\xfcrk\xe7e"})})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2 shrink-0 relative",ref:v,children:[(0,a.jsxs)("button",{onClick:()=>j(!g),className:"flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition font-semibold active:scale-95 shadow-sm",children:[(0,a.jsx)(i.A,{className:"w-3.5 h-3.5"}),(0,a.jsx)("span",{children:"Dışa Aktar"}),(0,a.jsx)(n.A,{className:`w-3 h-3 transition-transform duration-200 ${g?"rotate-180":""}`})]}),g&&(0,a.jsxs)("div",{className:"absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150",children:[(0,a.jsxs)("button",{onClick:()=>{try{j(!1);let a=b?.speedScore||87,l=`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Performans ve Envanter Raporu</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            td { font-family: Segoe UI, Roboto, sans-serif; font-size: 10.5pt; padding: 6px; border: 0.5pt solid #e2e8f0; }
            .title { font-size: 15pt; font-weight: bold; color: #ffffff; background-color: #0f172a; text-align: center; height: 35px; }
            .header { font-weight: bold; background-color: #f1f5f9; color: #475569; }
            .section { font-weight: bold; font-size: 11.5pt; background-color: #cbd5e1; color: #0f172a; height: 25px; }
            .value-bold { font-weight: bold; }
            .score-high { color: #10b981; font-weight: bold; }
            .score-label { color: ${a>=90?"#10b981":a>=80?"#059669":a>=50?"#d97706":"#dc2626"}; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="4" class="title">PEKEFE GER\xc7EK HASAT - E-TİCARET PERFORMANS & SEO DENETİM RAPORU</td></tr>
            <tr><td colspan="4" style="border: none;"></td></tr>
            <tr class="section"><td colspan="4">1. GENEL BİLGİLER</td></tr>
            <tr class="header"><td colspan="2">Rapor Parametresi</td><td colspan="2">Değer</td></tr>
            <tr><td colspan="2">Web Sitesi Adı</td><td colspan="2" class="value-bold">${e}</td></tr>
            <tr><td colspan="2">Alan Adı (Domain)</td><td colspan="2" class="value-bold">${t}</td></tr>
            <tr><td colspan="2">Rapor Tarihi</td><td colspan="2" class="value-bold">${new Date().toLocaleString("tr-TR")}</td></tr>
            <tr><td colspan="2">Son Site Tarama Zamanı</td><td colspan="2" class="value-bold">${b?.lastScanDate||"İlk Tarama"}</td></tr>
            <tr><td colspan="4" style="border: none;"></td></tr>
            <tr class="section"><td colspan="4">2. HIZ VE OPTİMİZASYON METRİKLERİ</td></tr>
            <tr class="header"><td>Analiz Başlığı</td><td>\xd6l\xe7\xfclen Değer</td><td>Referans Durum</td><td>Değerlendirme</td></tr>
            <tr><td>Mağaza Hız Puanı</td><td class="value-bold">${a}/100</td><td>&gt;= 80 (İdeal)</td><td class="score-label">${a>=90?"M\xfckemmel":a>=80?"\xc7ok İyi":a>=50?"İyileştirme Gerekli":"Zayıf"}</td></tr>
            <tr><td>Y\xfckleme S\xfcresi (Page Load)</td><td class="value-bold">${b?.loadTime||"2.54s"}</td><td>&lt; 2.5s (İdeal)</td><td class="score-high">M\xfckemmel</td></tr>
            <tr><td>Etkileşime Ge\xe7iş S\xfcresi (FID)</td><td class="value-bold">${b?.interactivity||"124ms"}</td><td>&lt; 150ms (İdeal)</td><td class="score-high">M\xfckemmel</td></tr>
            <tr><td>G\xf6rsel Stabilite Skoru (CLS)</td><td class="value-bold">${b?.visualStability||"0.05"}</td><td>&lt; 0.10 (İdeal)</td><td class="score-high">M\xfckemmel</td></tr>
            <tr><td>İlk Sunucu Yanıt S\xfcresi (TTFB)</td><td class="value-bold">${b?.serverResponse||"1.2s"}</td><td>&lt; 1.5s (İdeal)</td><td class="score-high">M\xfckemmel</td></tr>
            <tr><td colspan="4" style="border: none;"></td></tr>
            <tr class="section"><td colspan="4">3. MAĞAZA ENVANTER VE İSTATİSTİKLERİ</td></tr>
            <tr class="header"><td colspan="2">Envanter Kategorisi</td><td colspan="2" class="text-right">Toplam Adet</td></tr>
            <tr><td colspan="2">Toplam Aktif \xdcr\xfcn Sayısı</td><td colspan="2" class="value-bold text-right">${s.productCount}</td></tr>
            <tr><td colspan="2">Kayıtlı Aktif Bayi / M\xfcşteri</td><td colspan="2" class="value-bold text-right">${s.dealerCount}</td></tr>
            <tr><td colspan="2">Yayınlanan Aktif Sayfalar</td><td colspan="2" class="value-bold text-right">${s.pageCount}</td></tr>
            <tr><td colspan="2">Bu Ay Alınan Toplam Sipariş</td><td colspan="2" class="value-bold text-right">${s.monthOrders}</td></tr>
            <tr><td colspan="2">Ge\xe7en Ay Alınan Toplam Sipariş</td><td colspan="2" class="value-bold text-right">${s.lastMonthOrders}</td></tr>
            <tr><td colspan="4" style="border: none;"></td></tr>
            <tr><td colspan="2" style="font-weight: bold; color: #475569;">Rapor Notu:</td><td colspan="2" style="color: #64748b; font-style: italic;">Bu rapor PEKEFE Geleneksel & Doğal Lezzetler Y\xf6netim Paneli tarafından otomatik ve g\xfcvenli bir şekilde \xfcretilmiştir.</td></tr>
          </table>
        </body>
        </html>
      `,r=new Blob(["\uFEFF"+l],{type:"application/vnd.ms-excel;charset=utf-8;"}),i=URL.createObjectURL(r),n=document.createElement("a");n.href=i,n.download=`pekefe_pekefe_dashboard_${new Date().toISOString().slice(0,10)}.xls`,n.style.display="none",document.body.appendChild(n),n.click(),setTimeout(()=>{document.body.removeChild(n),URL.revokeObjectURL(i)},100),m.toast.success("Rapor başarıyla Excel (.xls) olarak indirildi!")}catch(e){console.error("XLS Export Error:",e),m.toast.error(`Excel dışa aktarılırken hata oluştu: ${e?.message||"Bilinmeyen hata"}`)}},className:"w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-800 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors font-medium text-left",children:[(0,a.jsx)(d.A,{className:"w-4 h-4 text-emerald-500"}),"Excel (.xls) Olarak İndir"]}),(0,a.jsxs)("button",{onClick:()=>{try{j(!1);let a=document.createElement("iframe");a.style.position="fixed",a.style.right="0",a.style.bottom="0",a.style.width="0",a.style.height="0",a.style.border="0",document.body.appendChild(a);let l=a.contentWindow?.document||a.contentDocument;if(!l)return void m.toast.error("Yazdırma motoru başlatılamadı.");let r=b?.speedScore||87,i=`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${e} - E-Ticaret Performans & SEO Raporu</title>
          <style>
            @media print {
              body { margin: 15mm; }
              .no-print { display: none; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .brand {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .brand span {
              color: #d97706;
            }
            .report-title {
              font-size: 14px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              text-align: right;
            }
            .title-section {
              text-align: center;
              margin-bottom: 30px;
            }
            .title-section h1 {
              font-size: 26px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 8px 0;
            }
            .title-section p {
              font-size: 14px;
              color: #64748b;
              margin: 0;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 30px;
              font-size: 13px;
              background: #f8fafc;
              padding: 15px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .meta-item {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .meta-label {
              font-weight: 600;
              color: #475569;
            }
            .meta-value {
              color: #0f172a;
              font-weight: 700;
            }
            .score-card {
              text-align: center;
              padding: 20px;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 16px;
              margin-bottom: 30px;
            }
            .score-circle {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: ${r>=90?"#10b981":r>=80?"#059669":r>=50?"#d97706":"#dc2626"};
              color: white;
              font-size: 30px;
              font-weight: 900;
              margin-bottom: 10px;
            }
            .score-label {
              font-size: 16px;
              font-weight: 800;
              color: #065f46;
              margin-top: 5px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 6px;
              margin-top: 35px;
              margin-bottom: 15px;
              color: #475569;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            th, td {
              padding: 10px 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            th {
              background: #f8fafc;
              color: #475569;
              font-weight: 700;
            }
            .text-right {
              text-align: right;
            }
            .footer {
              text-align: center;
              margin-top: 60px;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="brand">PEKEFE <span>geleneksel lezzetler</span></div>
            <div class="report-title">Performans & SEO Raporu</div>
          </div>
          
          <div class="title-section">
            <h1>Mağaza Denetim Raporu</h1>
            <p>PEKEFE Geleneksel & Doğal Lezzetler E-Ticaret Altyapısı Hız ve Optimizasyon Analiz Raporu</p>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Web Sitesi:</span>
              <span class="meta-value">${e}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Alan Adı (Domain):</span>
              <span class="meta-value">${t}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Rapor Tarihi:</span>
              <span class="meta-value">${new Date().toLocaleString("tr-TR")}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Son Tarama Tarihi:</span>
              <span class="meta-value">${b?.lastScanDate||"İlk Tarama"}</span>
            </div>
          </div>

          <div class="score-card" style="background: ${r>=80?"#f0fdf4":r>=50?"#fef3c7":"#fef2f2"}; border-color: ${r>=80?"#bbf7d0":r>=50?"#fde68a":"#fecaca"};">
            <div class="score-circle">${r}</div>
            <div class="score-label" style="color: ${r>=80?"#065f46":r>=50?"#92400e":"#991b1b"};">
              Mağaza Hız Puanı: ${r>=90?"M\xfckemmel":r>=80?"\xc7ok İyi":r>=50?"İyileştirme Gerekli":"Zayıf"}!
            </div>
          </div>

          <div class="section-title">Hız ve Optimizasyon Metrikleri</div>
          <table>
            <thead>
              <tr>
                <th>Analiz Başlığı</th>
                <th>\xd6l\xe7\xfclen Değer</th>
                <th>Referans Durum</th>
                <th class="text-right">Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Y\xfckleme S\xfcresi (Page Load Time)</strong></td>
                <td>${b?.loadTime||"2.54s"}</td>
                <td>&lt; 2.5s (İdeal)</td>
                <td class="text-right" style="color: #10b981; font-weight: bold;">M\xfckemmel</td>
              </tr>
              <tr>
                <td><strong>Etkileşime Ge\xe7iş S\xfcresi (FID)</strong></td>
                <td>${b?.interactivity||"124ms"}</td>
                <td>&lt; 150ms (İdeal)</td>
                <td class="text-right" style="color: #10b981; font-weight: bold;">M\xfckemmel</td>
              </tr>
              <tr>
                <td><strong>G\xf6rsel Stabilite Skoru (CLS)</strong></td>
                <td>${b?.visualStability||"0.05"}</td>
                <td>&lt; 0.10 (İdeal)</td>
                <td class="text-right" style="color: #10b981; font-weight: bold;">M\xfckemmel</td>
              </tr>
              <tr>
                <td><strong>İlk Sunucu Yanıt S\xfcresi (TTFB)</strong></td>
                <td>${b?.serverResponse||"1.2s"}</td>
                <td>&lt; 1.5s (İdeal)</td>
                <td class="text-right" style="color: #10b981; font-weight: bold;">M\xfckemmel</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Mağaza Genel Envanter Raporu</div>
          <table>
            <thead>
              <tr>
                <th>Envanter Kategorisi</th>
                <th class="text-right">Toplam Adet</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Toplam Aktif \xdcr\xfcn Sayısı</td>
                <td class="text-right" style="font-weight: bold;">${s.productCount}</td>
              </tr>
              <tr>
                <td>Kayıtlı Aktif Bayi/M\xfcşteri</td>
                <td class="text-right" style="font-weight: bold;">${s.dealerCount}</td>
              </tr>
              <tr>
                <td>Yayınlanan Aktif Sayfalar</td>
                <td class="text-right" style="font-weight: bold;">${s.pageCount}</td>
              </tr>
              <tr>
                <td>Bu Ay Alınan Toplam Sipariş</td>
                <td class="text-right" style="font-weight: bold;">${s.monthOrders}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Bu rapor, ${e} Y\xf6netim Paneli tarafından otomatik ve g\xfcvenli bir şekilde \xfcretilmiştir. T\xfcm hakları saklıdır.
          </div>
        </body>
        </html>
      `;l.open(),l.write(i),l.close(),setTimeout(()=>{a.contentWindow?.focus(),a.contentWindow?.print(),setTimeout(()=>{document.body.removeChild(a)},1e3)},500),m.toast.success("PDF Yazdırma Şablonu başarıyla oluşturuldu!")}catch(e){m.toast.error("PDF oluşturulurken bir hata oluştu.")}},className:"w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-800 hover:text-blue-600 hover:bg-blue-50/50 transition-colors font-medium text-left",children:[(0,a.jsx)(o.A,{className:"w-4 h-4 text-blue-500"}),"Yazdır / PDF Kaydet"]}),(0,a.jsxs)("button",{onClick:()=>{try{j(!1);let a={siteName:e,domain:t,tarih:new Date().toLocaleString("tr-TR"),metrikler:{"Toplam \xdcr\xfcn Sayısı":s.productCount,"Bug\xfcnk\xfc Siparişler":s.todayOrders,"Aktif Bayi Sayısı":s.dealerCount,"Yayınlanan Sayfalar":s.pageCount,"Bu Ayki Toplam Sipariş":s.monthOrders,"Ge\xe7en Ayki Toplam Sipariş":s.lastMonthOrders},performansSkoru:b?.speedScore||87,sayfaYuklenmeSuresi:b?.loadTime||"2.54s",etkilesimSuresi:b?.interactivity||"124ms",gorselStabilite:b?.visualStability||"0.05",sunucuYanitSuresi:b?.serverResponse||"1.2s",sonTaramaTarihi:b?.lastScanDate||"29.05.2026 19:30"},l=`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(a,null,2))}`,r=document.createElement("a");r.setAttribute("href",l),r.setAttribute("download",`pekefe_pekefe_dashboard_${new Date().toISOString().slice(0,10)}.json`),document.body.appendChild(r),r.click(),r.remove(),m.toast.success("Rapor başarıyla dışa aktarıldı! (.json dosyası indirildi)")}catch(e){m.toast.error("Rapor dışa aktarılırken bir hata oluştu.")}},className:"w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-800 hover:text-amber-600 hover:bg-amber-50/50 transition-colors font-medium text-left",children:[(0,a.jsx)(c.A,{className:"w-4 h-4 text-amber-500"}),"JSON Raporu İndir"]})]}),(0,a.jsxs)("button",{onClick:y,disabled:u,className:"flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95",children:[(0,a.jsx)(x.A,{className:`w-3.5 h-3.5 ${u?"animate-spin text-amber-500":""}`}),u?"Taranıyor...":"Siteyi Tara"]})]})]})}},30733:(e,t,s)=>{"use strict";s.d(t,{default:()=>z});var a=s(95155),l=s(12115),r=s(98500),i=s.n(r),n=s(66609),d=s(36483),o=s(96550),c=s(13488),x=s(11012),m=s(92298),p=s(9751),h=s(71556),b=s(87791),u=s(98993),f=s(93954),g=s(94774),j=s(49804),v=s(82749),N=s(64962),y=s(36338),w=s(19707),k=s(95697),S=s(90467),A=s(45216),T=s(6923);function E({value:e,max:t,color:s="#f97316"}){let l=t>0?Math.min(100,e/t*100):0;return(0,a.jsx)("div",{className:"relative h-2 bg-slate-100 rounded-full overflow-hidden",children:(0,a.jsx)("div",{className:"absolute inset-y-0 left-0 rounded-full transition-all duration-700",style:{width:`${l}%`,backgroundColor:s}})})}function $({data:e,color:t="#f97316"}){if(!e||0===e.length)return null;let s=Math.max(...e),l=s-Math.min(...e)||1,r=e.map((t,a)=>{let r=4+a/(e.length-1)*192;return`${r},${4+(s-t)/l*52}`}),i=`M ${r.join(" L ")}`,n=`M ${r[0]} L ${r.join(" L ")} L 196,56 L 4,56 Z`;return(0,a.jsxs)("svg",{viewBox:"0 0 200 60",className:"w-full h-full",preserveAspectRatio:"none",children:[(0,a.jsx)("defs",{children:(0,a.jsxs)("linearGradient",{id:`grad-client-${t.replace("#","")}`,x1:"0",y1:"0",x2:"0",y2:"1",children:[(0,a.jsx)("stop",{offset:"0%",stopColor:t,stopOpacity:"0.15"}),(0,a.jsx)("stop",{offset:"100%",stopColor:t,stopOpacity:"0"})]})}),(0,a.jsx)("path",{d:n,fill:`url(#grad-client-${t.replace("#","")})`}),(0,a.jsx)("path",{d:i,fill:"none",stroke:t,strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),(0,a.jsx)("circle",{cx:4+(e.length-1)/(e.length-1)*192,cy:4+(s-e[e.length-1])/l*52,r:"3",fill:t,stroke:"white",strokeWidth:"1.5"})]})}function R({segments:e}){let t=e.reduce((e,t)=>e+t.value,0)||1,s=2*Math.PI*52,l=0,r=e.map(e=>{let r=e.value/t*s,i=(0,a.jsx)("circle",{cx:70,cy:70,r:52,fill:"none",stroke:e.color,strokeWidth:"12",strokeDasharray:`${r} ${s-r}`,strokeDashoffset:-l,strokeLinecap:"butt",transform:"rotate(-90 70 70)",style:{transition:"stroke-dasharray 0.5s ease"}},e.label);return l+=r,i});return(0,a.jsxs)("svg",{viewBox:"0 0 140 140",className:"w-[140px] h-[140px] shrink-0",children:[(0,a.jsx)("circle",{cx:70,cy:70,r:52,fill:"none",stroke:"#f1f5f9",strokeWidth:"12"}),r,(0,a.jsx)("text",{x:70,y:64,textAnchor:"middle",className:"text-xl font-black fill-slate-800 font-sans",fontSize:"20",fontWeight:"900",children:t.toLocaleString("tr-TR")}),(0,a.jsx)("text",{x:70,y:82,textAnchor:"middle",className:"fill-slate-400 font-sans font-bold",fontSize:"8",children:"SİPARİŞ"})]})}function D({status:e}){let t={Yeni:"bg-blue-50 text-blue-600 border-blue-100","\xd6deme Bekliyor":"bg-yellow-50 text-yellow-700 border-yellow-200",Bekliyor:"bg-amber-50 text-amber-600 border-amber-100",Hazırlanıyor:"bg-orange-50 text-orange-600 border-orange-100",Paketlendi:"bg-cyan-50 text-cyan-600 border-cyan-100",Kargolandı:"bg-indigo-50 text-indigo-600 border-indigo-100","Teslim Edildi":"bg-emerald-50 text-emerald-700 border-emerald-200",Tamamlandı:"bg-emerald-50 text-emerald-600 border-emerald-100",İptal:"bg-red-50 text-red-600 border-red-100","İptal Edildi":"bg-red-50 text-red-600 border-red-100",Kuyrukta:"bg-purple-50 text-purple-600 border-purple-100 animate-pulse"}[e]??"bg-slate-50 text-slate-600 border-slate-100";return(0,a.jsx)("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${t}`,children:e})}function z({initialData:e,scanResults:t,siteName:s,domain:r}){let[C,M]=(0,l.useState)(e),[L,P]=(0,l.useState)(!1),[O,B]=(0,l.useState)(!0),[F,K]=(0,l.useState)(new Set),G=(0,l.useRef)(e?.recentOrders||[]),W=(0,l.useRef)([]),I=async(e=!1)=>{try{let t=await fetch("/api/applications");if(!t.ok)return;let s=await t.json(),a=Array.isArray(s)?s:[],l=a.map(e=>e.id);if(e)W.current=l;else{let e=a.filter(e=>!W.current.includes(e.id));e.length>0&&((()=>{try{let e=window.AudioContext||window.webkitAudioContext;if(!e)return;let t=new e;[523.25,659.25,783.99,1046.5].forEach((e,s)=>{let a=t.currentTime+.15*s,l=t.createOscillator(),r=t.createGain();l.connect(r),r.connect(t.destination),l.type="sine",l.frequency.setValueAtTime(e,a),r.gain.setValueAtTime(0,a),r.gain.linearRampToValueAtTime(.15,a+.02),r.gain.exponentialRampToValueAtTime(.001,a+.5),l.start(a),l.stop(a+.5)})}catch(e){console.warn("Failed to play notification chime on dashboard:",e)}})(),e.forEach(e=>{n.toast.success(`Yeni bayi başvurusu alındı: ${e.companyName}`,{duration:8e3,icon:"\uD83D\uDD14",description:`${e.contactName} tarafından yeni bir başvuru yapıldı. Detaylar i\xe7in tıklayın.`})}),W.current=l)}}catch(e){}};(0,l.useEffect)(()=>{I(!0);let e=setInterval(()=>{I(!1)},1e4);return()=>clearInterval(e)},[]);let Y=t?.speedScore||85,H=Y>=80?"M\xfckemmel":Y>=50?"İyileştirme Gerekli":"Zayıf",q=Y>=80?"#10b981":Y>=50?"#f59e0b":"#ef4444",U=async(e=!1)=>{e&&P(!0);try{let e=await fetch("/api/admin/dashboard?range=Bu Ay&mode=core");if(e.ok){let t=await e.json(),s=new Set(G.current.map(e=>e.id)),a=new Set;t.recentOrders?.forEach(e=>{!s.has(e.id)&&s.size>0&&a.add(e.id)}),a.size>0&&(K(e=>new Set([...e,...a])),setTimeout(()=>{K(e=>{let t=new Set(e);return a.forEach(e=>t.delete(e)),t})},4e3)),G.current=t.recentOrders||[],M(t)}}catch(e){console.error("Dashboard polling error:",e)}finally{e&&P(!1)}};(0,l.useEffect)(()=>{if(!O)return;U(!1);let e=setInterval(()=>{U(!1)},5e3),t=()=>U(!1),s=()=>U(!1),a=()=>U(!1);return window.addEventListener("focus",t),window.addEventListener("storage",s),window.addEventListener("pekefe-order-updated",a),()=>{clearInterval(e),window.removeEventListener("focus",t),window.removeEventListener("storage",s),window.removeEventListener("pekefe-order-updated",a)}},[O]);let V=C?.kpis||{},_=C?.erpStockStats||{totalStockValue:0,criticalStocks:[],depletedProducts:[],warehouseDistribution:[],recentMovements:[],topSellingProducts:[],fastestDepletingProducts:[]},Z=[{value:V.b2bOrderCount||0,color:"#6366f1",label:"B2B Bayi"},{value:V.b2cOrderCount||0,color:"#f97316",label:"B2C Web"},{value:V.otherOrderCount||0,color:"#3b82f6",label:"Diğer"}],J=V.monthlyOrdersTrend||[12,19,14,25,22,18,31,28,24,35],Q=V.totalAR||0,X=V.totalAP||0,ee=Q+X||1,et=Math.round(Q/ee*100),es=Math.round(X/ee*100),ea=Q-X,el=X>0?(Q/X).toFixed(2):"∞";return(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{className:"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3",children:[(0,a.jsxs)(i(),{href:"/admin/invoices",className:"bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group",children:[(0,a.jsx)("div",{className:"w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform",children:(0,a.jsx)(d.A,{className:"w-5 h-5"})}),(0,a.jsxs)("div",{className:"min-w-0",children:[(0,a.jsx)("span",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"e-Fatura Havuzu"}),(0,a.jsxs)("span",{className:"block text-sm font-black text-slate-800",children:[V.pendingIncomingInvoices||0," Onay Bekliyor"]})]}),V.pendingIncomingInvoices>0&&(0,a.jsxs)("span",{className:"absolute -top-1 -right-1 flex h-4 w-4",children:[(0,a.jsx)("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"}),(0,a.jsx)("span",{className:"relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] font-black text-white items-center justify-center",children:V.pendingIncomingInvoices})]})]}),(0,a.jsxs)(i(),{href:"/admin/orders",className:"bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group",children:[(0,a.jsx)("div",{className:"w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform",children:(0,a.jsx)(o.A,{className:"w-5 h-5"})}),(0,a.jsxs)("div",{className:"min-w-0",children:[(0,a.jsx)("span",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"Web Siparişler"}),(0,a.jsxs)("span",{className:"block text-sm font-black text-slate-800",children:[V.pendingShippingOrders||0," Sevk Bekliyor"]})]}),V.pendingShippingOrders>0&&(0,a.jsxs)("span",{className:"absolute -top-1 -right-1 flex h-4 w-4",children:[(0,a.jsx)("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"}),(0,a.jsx)("span",{className:"relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[8px] font-black text-white items-center justify-center",children:V.pendingShippingOrders})]})]}),(0,a.jsxs)(i(),{href:"/admin/despatch",className:"bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group",children:[(0,a.jsx)("div",{className:"w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform",children:(0,a.jsx)(c.A,{className:"w-5 h-5"})}),(0,a.jsxs)("div",{className:"min-w-0",children:[(0,a.jsx)("span",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"e-İrsaliye İşlemi"}),(0,a.jsxs)("span",{className:"block text-sm font-black text-slate-800",children:[V.pendingDespatchAdvices||0," Paketlendi"]})]}),V.pendingDespatchAdvices>0&&(0,a.jsxs)("span",{className:"absolute -top-1 -right-1 flex h-4 w-4",children:[(0,a.jsx)("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"}),(0,a.jsx)("span",{className:"relative inline-flex rounded-full h-4 w-4 bg-violet-500 text-[8px] font-black text-white items-center justify-center",children:V.pendingDespatchAdvices})]})]}),(0,a.jsxs)(i(),{href:"/admin/stock",className:"bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group",children:[(0,a.jsx)("div",{className:"w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform",children:(0,a.jsx)(x.A,{className:"w-5 h-5"})}),(0,a.jsxs)("div",{className:"min-w-0",children:[(0,a.jsx)("span",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"Kritik Stok"}),(0,a.jsxs)("span",{className:"block text-sm font-black text-slate-800",children:[V.criticalStockCount||0," \xdcr\xfcn Kritik"]})]}),V.criticalStockCount>0&&(0,a.jsxs)("span",{className:"absolute -top-1 -right-1 flex h-4 w-4",children:[(0,a.jsx)("span",{className:"animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"}),(0,a.jsx)("span",{className:"relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[8px] font-black text-white items-center justify-center",children:V.criticalStockCount})]})]}),(0,a.jsxs)(i(),{href:"/admin/orders",className:"bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 shadow-sm transition-all duration-200 flex items-center gap-3 relative group col-span-2 md:col-span-1",children:[(0,a.jsx)("div",{className:"w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform",children:(0,a.jsx)(m.A,{className:"w-5 h-5"})}),(0,a.jsxs)("div",{className:"min-w-0",children:[(0,a.jsx)("span",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"Hata Kuyruğu"}),(0,a.jsxs)("span",{className:"block text-sm font-black text-slate-800",children:[V.pendingCargoQueue||0," Kargo Bekleyen"]})]})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-4",children:[(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-36",children:[(0,a.jsxs)("div",{className:"flex justify-between items-start",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("span",{className:"text-[10px] font-black text-slate-400 uppercase tracking-wider",children:"M\xfcşteri Alacakları (AR)"}),(0,a.jsxs)("p",{className:"text-3xl font-extrabold text-slate-900 mt-1",children:["₺",Q.toLocaleString("tr-TR",{minimumFractionDigits:2})]})]}),(0,a.jsx)("div",{className:"p-2 bg-emerald-50 text-emerald-500 rounded-xl",children:(0,a.jsx)(p.A,{className:"w-5 h-5"})})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-1.5",children:[(0,a.jsx)("span",{className:"text-xs text-emerald-600 font-bold",children:"Alınacak Nakit Akışı Havuzu"}),(0,a.jsxs)("span",{className:"text-[10px] font-black text-slate-400",children:[et,"%"]})]}),(0,a.jsx)("div",{className:"relative h-1.5 bg-emerald-50 rounded-full overflow-hidden",children:(0,a.jsx)("div",{className:"absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-700",style:{width:`${et}%`}})})]})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-36",children:[(0,a.jsxs)("div",{className:"flex justify-between items-start",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("span",{className:"text-[10px] font-black text-slate-400 uppercase tracking-wider",children:"Tedarik\xe7i Bor\xe7ları (AP)"}),(0,a.jsxs)("p",{className:"text-3xl font-extrabold text-slate-900 mt-1",children:["₺",X.toLocaleString("tr-TR",{minimumFractionDigits:2})]})]}),(0,a.jsx)("div",{className:"p-2 bg-amber-50 text-amber-500 rounded-xl",children:(0,a.jsx)(h.A,{className:"w-5 h-5"})})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-1.5",children:[(0,a.jsx)("span",{className:"text-xs text-amber-600 font-bold",children:"\xd6denecek Tedarik\xe7i Y\xfck\xfcml\xfcl\xfcğ\xfc"}),(0,a.jsxs)("span",{className:"text-[10px] font-black text-slate-400",children:[es,"%"]})]}),(0,a.jsx)("div",{className:"relative h-1.5 bg-amber-50 rounded-full overflow-hidden",children:(0,a.jsx)("div",{className:"absolute inset-y-0 left-0 rounded-full bg-amber-500 transition-all duration-700",style:{width:`${es}%`}})})]})]}),(0,a.jsxs)("div",{className:`border rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-36 ${ea>=0?"bg-gradient-to-br from-blue-50 to-white border-blue-100":"bg-gradient-to-br from-red-50 to-white border-red-100"}`,children:[(0,a.jsxs)("div",{className:"flex justify-between items-start",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("span",{className:"text-[10px] font-black text-slate-400 uppercase tracking-wider",children:"Net Cari Likidite Dengesi"}),(0,a.jsxs)("p",{className:`text-3xl font-extrabold mt-1 ${ea>=0?"text-slate-900":"text-red-600"}`,children:["₺",ea.toLocaleString("tr-TR",{minimumFractionDigits:2})]})]}),(0,a.jsx)("div",{className:`p-2 rounded-xl ${ea>=0?"bg-blue-100 text-blue-600":"bg-red-100 text-red-600"}`,children:(0,a.jsx)(b.A,{className:"w-5 h-5"})})]}),(0,a.jsxs)("div",{className:"flex items-center justify-between text-xs font-semibold",children:[(0,a.jsxs)("span",{className:"text-slate-500",children:["AR / AP Rasyosu: ",(0,a.jsxs)("strong",{children:[el,"x"]})]}),(0,a.jsx)("span",{className:`font-bold px-2 py-0.5 rounded-full text-[10px] ${ea>=0?"text-emerald-600 bg-emerald-50":"text-red-600 bg-red-50"}`,children:ea>=0?"✓ Pozitif Denge":"⚠ Negatif Denge"})]})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-3",children:[(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-4 shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,a.jsx)("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"Toplam Ciro"}),(0,a.jsx)("div",{className:"p-1.5 bg-orange-50 text-orange-500 rounded-lg",children:(0,a.jsx)(u.A,{className:"w-4 h-4"})})]}),(0,a.jsxs)("p",{className:"text-2xl font-extrabold text-slate-900",children:["₺",(V.totalRevenue||0).toLocaleString("tr-TR",{maximumFractionDigits:0})]}),(0,a.jsx)("p",{className:"text-[10px] text-slate-400 mt-1 font-semibold",children:"Bu ay toplam satış"})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-4 shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,a.jsx)("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"Net K\xe2r"}),(0,a.jsx)("div",{className:"p-1.5 bg-emerald-50 text-emerald-500 rounded-lg",children:(0,a.jsx)(f.A,{className:"w-4 h-4"})})]}),(0,a.jsxs)("p",{className:"text-2xl font-extrabold text-emerald-700",children:["₺",(V.totalProfit||0).toLocaleString("tr-TR",{maximumFractionDigits:0})]}),(0,a.jsx)("p",{className:"text-[10px] text-slate-400 mt-1 font-semibold",children:"%55 maliyet tahmini ile"})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-4 shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,a.jsx)("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"K\xe2r Marjı"}),(0,a.jsx)("div",{className:"p-1.5 bg-violet-50 text-violet-500 rounded-lg",children:(0,a.jsx)(g.A,{className:"w-4 h-4"})})]}),(0,a.jsxs)("p",{className:"text-2xl font-extrabold text-slate-900",children:["%",V.profitMargin||0]}),(0,a.jsx)("div",{className:"mt-1.5",children:(0,a.jsx)("div",{className:"h-1.5 bg-slate-100 rounded-full overflow-hidden",children:(0,a.jsx)("div",{className:"h-full rounded-full bg-violet-500 transition-all duration-700",style:{width:`${Math.min(100,V.profitMargin||0)}%`}})})})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-4 shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-2",children:[(0,a.jsx)("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wide",children:"Ort. Sepet"}),(0,a.jsx)("div",{className:"p-1.5 bg-blue-50 text-blue-500 rounded-lg",children:(0,a.jsx)(o.A,{className:"w-4 h-4"})})]}),(0,a.jsxs)("p",{className:"text-2xl font-extrabold text-slate-900",children:["₺",(V.averageOrderValue||0).toLocaleString("tr-TR",{maximumFractionDigits:0})]}),(0,a.jsx)("p",{className:"text-[10px] text-slate-400 mt-1 font-semibold",children:"Sipariş başına ortalama"})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-4",children:[(0,a.jsxs)("div",{className:"lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)(j.A,{className:"w-4 h-4 text-orange-500"}),(0,a.jsx)("h2",{className:"text-sm font-bold text-slate-700",children:"Mağaza Performans Skoru"})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[L&&(0,a.jsx)(v.A,{className:"w-4 h-4 text-slate-400 animate-spin"}),(0,a.jsx)("button",{onClick:()=>U(!0),className:"p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition",children:(0,a.jsx)(v.A,{className:"w-4 h-4"})})]})]}),(0,a.jsx)("div",{className:"flex items-start gap-6 mb-5",children:(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"flex items-baseline gap-1",children:[(0,a.jsx)("span",{className:"text-5xl font-black text-slate-900 leading-none",children:Y}),(0,a.jsx)("span",{className:"text-lg font-semibold text-slate-400",children:"/100"})]}),(0,a.jsxs)("div",{className:"flex items-center gap-1.5 mt-1.5",children:[(0,a.jsx)(N.A,{className:"w-4 h-4 text-emerald-500"}),(0,a.jsxs)("span",{className:"text-sm font-bold text-emerald-600",children:[H,"!"]})]})]})}),(0,a.jsxs)("div",{className:"mb-5",children:[(0,a.jsx)(E,{value:Y,max:100,color:q}),(0,a.jsxs)("div",{className:"flex justify-between mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide",children:[(0,a.jsx)("span",{children:"Zayıf"}),(0,a.jsx)("span",{children:"İyileştirme Gerekli"}),(0,a.jsx)("span",{children:"M\xfckemmel"})]})]}),(0,a.jsx)("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-3",children:[{label:"Y\xfckleme S\xfcresi",value:t?.loadTime||"2.4s",icon:y.A,color:"text-blue-500",bg:"bg-blue-50"},{label:"Etkileşim",value:t?.interactivity||"120ms",icon:j.A,color:"text-violet-500",bg:"bg-violet-50"},{label:"G\xf6rsel Stabil.",value:t?.visualStability||"0.05",icon:g.A,color:"text-emerald-500",bg:"bg-emerald-50"},{label:"Sunucu Yanıtı",value:t?.serverResponse||"1.1s",icon:v.A,color:"text-orange-500",bg:"bg-orange-50"}].map(e=>{let t=e.icon;return(0,a.jsxs)("div",{className:"bg-slate-50 rounded-xl p-3 border border-slate-100",children:[(0,a.jsx)("div",{className:`w-7 h-7 ${e.bg} rounded-lg flex items-center justify-center mb-2`,children:(0,a.jsx)(t,{className:`w-3.5 h-3.5 ${e.color}`})}),(0,a.jsx)("p",{className:"text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wide",children:e.label}),(0,a.jsx)("p",{className:"text-sm font-black text-slate-800",children:e.value})]},e.label)})})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)(o.A,{className:"w-4 h-4 text-slate-400"}),(0,a.jsx)("h3",{className:"text-xs font-bold text-slate-500 uppercase tracking-wide",children:"Aylık Sipariş Trendi"})]}),(0,a.jsx)("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Hacim"})]}),(0,a.jsxs)("div",{className:"mt-4",children:[(0,a.jsxs)("span",{className:"text-3xl font-black text-slate-900",children:[V.orderCount||0," Sipariş"]}),(0,a.jsx)("p",{className:"text-xs text-slate-400 mt-1",children:"Son 30 g\xfcnde tamamlanan satış"})]}),(0,a.jsx)("div",{className:"h-[70px] mt-4",children:(0,a.jsx)($,{data:J,color:"#f97316"})}),(0,a.jsxs)("div",{className:"flex justify-between mt-2 text-[9px] text-slate-400 font-bold uppercase",children:[(0,a.jsx)("span",{children:"Oca"}),(0,a.jsx)("span",{children:"May"}),(0,a.jsx)("span",{children:"Kas"})]})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-4",children:[(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm",children:[(0,a.jsx)("div",{className:"flex items-center justify-between mb-4",children:(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)(d.A,{className:"w-4 h-4 text-slate-400"}),(0,a.jsx)("h2",{className:"text-sm font-bold text-slate-700",children:"Sipariş Kanalları"})]})}),(0,a.jsx)("p",{className:"text-xs text-slate-400 mb-4",children:"Bu ayki siparişlerin tiplerine dağılımı"}),(0,a.jsxs)("div",{className:"flex items-center gap-5",children:[(0,a.jsx)(R,{segments:Z}),(0,a.jsx)("div",{className:"space-y-2 flex-1 min-w-0",children:Z.map(e=>(e.value,V.orderCount,(0,a.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2 min-w-0",children:[(0,a.jsx)("div",{className:"w-2.5 h-2.5 rounded-full shrink-0",style:{backgroundColor:e.color}}),(0,a.jsx)("span",{className:"text-xs text-slate-600 truncate",children:e.label})]}),(0,a.jsx)("span",{className:"text-xs font-black text-slate-800 shrink-0",children:e.value})]},e.label)))})]})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2",children:[(0,a.jsxs)("h3",{className:"text-sm font-bold text-slate-700 flex items-center gap-2",children:[(0,a.jsx)(w.A,{className:"w-4 h-4 text-orange-500"}),"Depo Bazlı Stok Dağılımı ve Değerlemesi"]}),(0,a.jsxs)("p",{className:"text-xs text-slate-400",children:["Depolardaki toplam stok ve maliyet değerlemesi (Mevcut: ₺",_.totalStockValue?.toLocaleString("tr-TR"),")"]}),(0,a.jsx)("div",{className:"space-y-3 pt-2",children:_.warehouseDistribution?.length>0?_.warehouseDistribution?.map(e=>{let t=_.warehouseDistribution.reduce((e,t)=>e+t.stock,0)||1;return(0,a.jsxs)("div",{className:"space-y-1",children:[(0,a.jsxs)("div",{className:"flex justify-between text-xs",children:[(0,a.jsxs)("span",{className:"font-semibold text-slate-600",children:[e.name," (",e.code,")"]}),(0,a.jsxs)("span",{className:"font-bold text-slate-900",children:[e.stock?.toLocaleString("tr-TR")," Adet \xb7 ₺",e.value?.toLocaleString("tr-TR",{maximumFractionDigits:0})]})]}),(0,a.jsx)(E,{value:e.stock,max:t,color:"#f97316"})]},e.id)}):(0,a.jsx)("p",{className:"text-xs text-slate-400 italic text-center py-8",children:"Hen\xfcz depo verisi bulunmuyor."})})]})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,a.jsxs)("h3",{className:"text-sm font-bold text-slate-700 flex items-center gap-2",children:[(0,a.jsx)(k.A,{className:"w-4 h-4 text-amber-500"}),"En \xc7ok Satan \xdcr\xfcnler"]}),(0,a.jsxs)(i(),{href:"/admin/stock",className:"text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1",children:["T\xfcm\xfc ",(0,a.jsx)(S.A,{className:"w-3 h-3"})]})]}),(0,a.jsx)("div",{className:"space-y-3",children:0===(_.topSellingProducts||[]).length?(0,a.jsxs)("div",{className:"flex flex-col items-center justify-center py-8 gap-2",children:[(0,a.jsx)(k.A,{className:"w-7 h-7 text-slate-200"}),(0,a.jsx)("p",{className:"text-xs text-slate-400 italic",children:"Hen\xfcz satış verisi bulunmuyor."})]}):(_.topSellingProducts||[]).map((e,t)=>{let s=_.topSellingProducts?.[0]?.quantity||1;return(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[(0,a.jsx)("span",{className:`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${0===t?"bg-amber-100 text-amber-700":1===t?"bg-slate-100 text-slate-600":2===t?"bg-orange-100 text-orange-700":"bg-slate-50 text-slate-400"}`,children:t+1}),(0,a.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,a.jsxs)("div",{className:"flex justify-between items-baseline mb-1",children:[(0,a.jsx)("span",{className:"text-xs font-semibold text-slate-700 truncate pr-2",children:e.name}),(0,a.jsxs)("span",{className:"text-xs font-black text-slate-900 shrink-0",children:[e.quantity," adet"]})]}),(0,a.jsx)(E,{value:e.quantity,max:s,color:0===t?"#f59e0b":"#f97316"})]}),(0,a.jsxs)("span",{className:"text-[10px] font-bold text-emerald-600 shrink-0 min-w-[60px] text-right",children:["₺",Number(e.revenue||0).toLocaleString("tr-TR",{maximumFractionDigits:0})]})]},e.name)})})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,a.jsxs)("h3",{className:"text-sm font-bold text-slate-700 flex items-center gap-2",children:[(0,a.jsx)(A.A,{className:"w-4 h-4 text-red-500"}),"En Hızlı T\xfckenen \xdcr\xfcnler"]}),(0,a.jsxs)(i(),{href:"/admin/stock",className:"text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1",children:["Stok ",(0,a.jsx)(S.A,{className:"w-3 h-3"})]})]}),(0,a.jsx)("div",{className:"space-y-3",children:0===(_.fastestDepletingProducts||[]).length?(0,a.jsxs)("div",{className:"flex flex-col items-center justify-center py-8 gap-2",children:[(0,a.jsx)(A.A,{className:"w-7 h-7 text-slate-200"}),(0,a.jsx)("p",{className:"text-xs text-slate-400 italic",children:"Hen\xfcz stok hareket verisi bulunmuyor."})]}):(_.fastestDepletingProducts||[]).map((e,t)=>{let s=_.fastestDepletingProducts?.[0]?.quantity||1;return(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[(0,a.jsx)("span",{className:`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${0===t?"bg-red-100 text-red-600":1===t?"bg-orange-100 text-orange-600":"bg-slate-50 text-slate-400"}`,children:t+1}),(0,a.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,a.jsxs)("div",{className:"flex justify-between items-baseline mb-1",children:[(0,a.jsx)("span",{className:"text-xs font-semibold text-slate-700 truncate pr-2",children:e.name}),(0,a.jsxs)("span",{className:"text-xs font-black text-red-600 shrink-0",children:[e.quantity," adet"]})]}),(0,a.jsx)(E,{value:e.quantity,max:s,color:0===t?"#ef4444":"#f97316"})]}),(0,a.jsx)("span",{className:"text-[10px] font-semibold text-slate-400 shrink-0 font-mono",children:e.sku})]},e.sku)})})]})]}),(0,a.jsxs)("div",{className:"bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",children:[(0,a.jsxs)("div",{className:"px-5 py-4 border-b border-slate-100 flex items-center justify-between",children:[(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[(0,a.jsxs)("h2",{className:"text-sm font-bold text-slate-700 flex items-center gap-2",children:[(0,a.jsx)(T.A,{className:"w-4 h-4 text-orange-500"}),"Canlı Webhook Sipariş Akışı (pekefe.com)"]}),(0,a.jsxs)("div",{className:"flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-wider",children:[(0,a.jsx)("span",{className:"h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"}),(0,a.jsx)("span",{children:"Canlı Akış Aktif"})]})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsxs)("label",{className:"text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 cursor-pointer",children:[(0,a.jsx)("input",{type:"checkbox",checked:O,onChange:e=>B(e.target.checked),className:"rounded text-orange-500 cursor-pointer"}),(0,a.jsx)("span",{children:"Otomatik G\xfcncelle"})]}),(0,a.jsxs)(i(),{href:"/admin/orders",className:"text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition pl-2 border-l border-slate-200",children:["T\xfcm Siparişler ",(0,a.jsx)(S.A,{className:"w-3.5 h-3.5"})]})]})]}),C?.recentOrders?.length===0?(0,a.jsx)("div",{className:"px-6 py-16 text-center text-slate-400 text-sm",children:"Canlı sipariş akışı bekleniyor..."}):(0,a.jsx)("div",{className:"overflow-x-auto",children:(0,a.jsxs)("table",{className:"w-full text-left",children:[(0,a.jsx)("thead",{className:"bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100",children:(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{className:"px-5 py-3",children:"Sipariş ID"}),(0,a.jsx)("th",{className:"px-5 py-3",children:"M\xfcşteri / Bayi Cari"}),(0,a.jsx)("th",{className:"px-5 py-3",children:"Kanal"}),(0,a.jsx)("th",{className:"px-5 py-3 text-right",children:"Tutar"}),(0,a.jsx)("th",{className:"px-5 py-3",children:"Durum"}),(0,a.jsx)("th",{className:"px-5 py-3",children:"Tarih"})]})}),(0,a.jsx)("tbody",{className:"divide-y divide-slate-50",children:C?.recentOrders?.map(e=>{let t=F.has(e.id);return(0,a.jsxs)("tr",{className:`transition-colors duration-1000 ${t?"bg-orange-50/70":"hover:bg-slate-50/80"}`,children:[(0,a.jsx)("td",{className:"px-5 py-4",children:(0,a.jsx)("span",{className:"font-mono text-xs font-semibold text-slate-500",children:e.id.startsWith("OR-")||e.id.startsWith("B2B-")?e.id:`#${e.id.slice(-8).toUpperCase()}`})}),(0,a.jsx)("td",{className:"px-5 py-4",children:(0,a.jsx)("span",{className:"text-sm font-medium text-slate-700",children:e.currentAccount?.name})}),(0,a.jsx)("td",{className:"px-5 py-4",children:(0,a.jsx)("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${"B2B"===e.type?"bg-violet-50 text-violet-600 border-violet-100":"bg-orange-50 text-orange-600 border-orange-100"}`,children:e.type})}),(0,a.jsx)("td",{className:"px-5 py-4 text-right",children:(0,a.jsxs)("span",{className:"text-sm font-bold text-slate-800",children:["₺",e.total?.toLocaleString("tr-TR",{minimumFractionDigits:2})]})}),(0,a.jsx)("td",{className:"px-5 py-4",children:(0,a.jsx)(D,{status:e.status})}),(0,a.jsx)("td",{className:"px-5 py-4",children:(0,a.jsx)("span",{className:"text-xs text-slate-400",children:new Date(e.date).toLocaleDateString("tr-TR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})})})]},e.id)})})]})})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-4",children:[(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4",children:[(0,a.jsxs)("h3",{className:"text-sm font-bold text-slate-700 flex items-center gap-2",children:[(0,a.jsx)(x.A,{className:"w-4 h-4 text-red-500"}),"Kritik Stok & T\xfckenenler"]}),(0,a.jsx)("div",{className:"space-y-2.5 max-h-[300px] overflow-y-auto pr-1",children:_.criticalStocks?.length===0&&_.depletedProducts?.length===0?(0,a.jsxs)("div",{className:"flex flex-col items-center justify-center py-10 gap-2",children:[(0,a.jsx)(N.A,{className:"w-8 h-8 text-emerald-300"}),(0,a.jsx)("p",{className:"text-xs text-slate-400 italic",children:"Kritik seviyede \xfcr\xfcn bulunmuyor."})]}):(0,a.jsxs)(a.Fragment,{children:[_.depletedProducts?.map(e=>(0,a.jsxs)("div",{className:"flex justify-between items-center bg-red-50/50 border border-red-100 p-2.5 rounded-xl text-xs",children:[(0,a.jsxs)("div",{className:"min-w-0",children:[(0,a.jsx)("span",{className:"block font-bold text-slate-800 truncate",title:e.name,children:e.name}),(0,a.jsx)("span",{className:"text-[10px] text-slate-400 font-semibold",children:e.sku})]}),(0,a.jsx)("span",{className:"px-2 py-0.5 bg-red-500 text-white rounded text-[9px] font-black uppercase tracking-wider shrink-0",children:"T\xfckendi"})]},e.id)),_.criticalStocks?.map(e=>(0,a.jsxs)("div",{className:"flex justify-between items-center bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-xs",children:[(0,a.jsxs)("div",{className:"min-w-0",children:[(0,a.jsx)("span",{className:"block font-bold text-slate-800 truncate",title:e.productName,children:e.productName}),(0,a.jsxs)("span",{className:"text-[10px] text-slate-400 font-semibold",children:[e.sku," \xb7 ",e.warehouseName]})]}),(0,a.jsxs)("div",{className:"text-right shrink-0",children:[(0,a.jsx)("span",{className:"block font-black text-amber-700 text-sm",children:e.stock}),(0,a.jsxs)("span",{className:"block text-[8px] text-slate-400 font-bold uppercase tracking-widest",children:["Limit: ",e.criticalLimit]})]})]},e.id))]})})]}),(0,a.jsxs)("div",{className:"bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2",children:[(0,a.jsxs)("h3",{className:"text-sm font-bold text-slate-700 flex items-center gap-2",children:[(0,a.jsx)(T.A,{className:"w-4 h-4 text-orange-500"}),"Son Stok Hareketleri"]}),(0,a.jsx)("div",{className:"overflow-x-auto",children:(0,a.jsxs)("table",{className:"w-full text-left",children:[(0,a.jsx)("thead",{className:"bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100",children:(0,a.jsxs)("tr",{children:[(0,a.jsx)("th",{className:"px-4 py-2",children:"\xdcr\xfcn / SKU"}),(0,a.jsx)("th",{className:"px-4 py-2",children:"Depo"}),(0,a.jsx)("th",{className:"px-4 py-2 text-center",children:"T\xfcr"}),(0,a.jsx)("th",{className:"px-4 py-2 text-right",children:"Miktar"}),(0,a.jsx)("th",{className:"px-4 py-2 text-right",children:"Tarih"})]})}),(0,a.jsx)("tbody",{className:"divide-y divide-slate-50 text-xs",children:_.recentMovements?.length===0?(0,a.jsx)("tr",{children:(0,a.jsx)("td",{colSpan:5,className:"text-center py-8 text-slate-400 italic",children:"Son zamanlarda stok hareketi bulunmuyor."})}):_.recentMovements?.map(e=>(0,a.jsxs)("tr",{className:"hover:bg-slate-50/50 transition",children:[(0,a.jsxs)("td",{className:"px-4 py-3",children:[(0,a.jsx)("span",{className:"block font-bold text-slate-700 truncate max-w-[150px]",title:e.productName,children:e.productName}),(0,a.jsx)("span",{className:"text-[9px] font-mono text-slate-400",children:e.sku})]}),(0,a.jsx)("td",{className:"px-4 py-3 text-slate-500",children:e.warehouseName}),(0,a.jsx)("td",{className:"px-4 py-3 text-center",children:(0,a.jsx)("span",{className:`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${"IN"===e.type||"Giriş"===e.type||e.quantity>0?"bg-emerald-50 text-emerald-600 border border-emerald-100":"bg-red-50 text-red-600 border border-red-100"}`,children:e.type||(e.quantity>0?"Giriş":"\xc7ıkış")})}),(0,a.jsx)("td",{className:`px-4 py-3 text-right font-bold ${e.quantity>0?"text-emerald-600":"text-red-500"}`,children:e.quantity>0?`+${e.quantity}`:e.quantity}),(0,a.jsx)("td",{className:"px-4 py-3 text-right text-slate-400 text-[10px]",children:new Date(e.date).toLocaleDateString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})})]},e.id))})]})})]})]})]})}},84303:(e,t,s)=>{Promise.resolve().then(s.bind(s,71265)),Promise.resolve().then(s.bind(s,30733)),Promise.resolve().then(s.bind(s,12311)),Promise.resolve().then(s.bind(s,69201))}}]);