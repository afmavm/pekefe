exports.id=8841,exports.ids=[8841],exports.modules={25372:(a,b,c)=>{"use strict";c.d(b,{Fy:()=>m,OY:()=>k,ZT:()=>l});var d=c(67117),e=c(4469),f=c(20457),g=c(9290);async function h(a,b,c){try{let d=b&&(b.headers.get("x-forwarded-for")?.split(",")[0].trim()||b.headers.get("x-real-ip")||b.ip)||"127.0.0.1",e=b?new URL(b.url).pathname:"Bilinmeyen API",f=b?b.method:"Bilinmeyen Metod";await g.prisma.authLog.create({data:{ip:d,userId:c||null,route:e,method:f,failReason:a}})}catch(a){console.error("Audit log logging failed:",a)}}async function i(a){let b=await (0,d.getServerSession)(e.N);return b&&b.user&&b.user.id?{ok:!0,authorized:!0,session:b}:(a&&await h("Oturum bulunamadı veya ge\xe7ersiz.",a),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in oturum a\xe7manız gerekmektedir.",code:"UNAUTHORIZED",statusCode:401},{status:401})})}async function j(a){let b=await i(a);return b.ok?"DEALER"!==b.session.user.role||b.session.user.isApproved?b:(a&&await h("Onaylanmamış \xfcye erişim denemesi.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Hesabınız hen\xfcz onaylanmamıştır. L\xfctfen y\xf6neticinizle iletişime ge\xe7in.",code:"NOT_APPROVED",statusCode:403},{status:403})}):b}function k(a){return["SUPER_ADMIN","ADMIN","STOCK_MANAGER","ORDER_MANAGER","ACCOUNTANT","PRODUCTION_MANAGER","CONTENT_EDITOR","SUPPORT_AGENT","BRANCH_MANAGER","WAREHOUSE_SUPERVISOR","SALES_STAFF"].includes(a)}async function l(a){let b=await j(a);return b.ok?["SUPER_ADMIN","ADMIN"].includes(b.session.user.role)?b:(a&&await h("Admin yetkisi eksik.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in y\xf6netici yetkisi gerekmektedir.",code:"FORBIDDEN",statusCode:403},{status:403})}):b}async function m(a){let b=await j(a);return b.ok?k(b.session.user.role)?b:(a&&await h("ERP yetkisi eksik.",a,b.session.user.id),{ok:!1,authorized:!1,response:f.NextResponse.json({error:"Bu işlem i\xe7in ERP personeli yetkisi gerekmektedir.",code:"FORBIDDEN",statusCode:403},{status:403})}):b}},43181:(a,b,c)=>{"use strict";c.r(b),c.d(b,{"001a2ad6f2eeba428911370419557f39a96e71cd1a":()=>d.CU,"0087c88653fb1fd337c70b631ba06d4838d944b009":()=>d.iG,"00fd8d75748694f49f8537ba620aae44585020f0ec":()=>d.kO,"4027b9f5b7708bf1d2cfdf682a4dab0d6a6b4213e5":()=>C,"40800c2595f8035165db150fdc61af23eb29e2fa8e":()=>A,"604c69f9da923e0e8d468a63372ec2f7bb2de36798":()=>z,"605410f1b261abe6f5aafdc21b693479badff5cded":()=>w,"609a59c8bd22f283931e43899cd4cd95bb3c677e99":()=>x,"60e0ffec520e022f4e254b1d86fc068d36418adf0a":()=>B,"60f5a79f0e355d513925a32aaaf86bf9dad1574df1":()=>y,"705107a7df57e1edae89dc40a614fd2517e0cb8153":()=>D,"7074979e5441fd5a8a6655c20966741a9b0b92263e":()=>d.Rm});var d=c(57402),e=c(95349),f=c(9290),g=c(98765),h=c(4469),i=c(25372),j=c(40965),k=c(29021),l=c.n(k),m=c(33873),n=c.n(m);function o(a,b=""){try{let b=n().join(process.cwd(),".env");if(l().existsSync(b))for(let c of l().readFileSync(b,"utf-8").split("\n")){let b=c.trim();if(b.startsWith("#")||!b.includes("="))continue;let[d,...e]=b.split("=");if(d.trim()===a){let a=e.join("=").trim();return(a.startsWith('"')&&a.endsWith('"')||a.startsWith("'")&&a.endsWith("'"))&&(a=a.substring(1,a.length-1)),a=a.replace(/\\"/g,'"').replace(/\\'/g,"'")}}}catch(b){console.error("Error reading live env key:",a,b)}return process.env[a]||b}class p{constructor(){this.transporter=null,this.isProcessing=!1,this.lastConfig=""}getTransporter(){let a=o("SMTP_HOST","smtp.turkticaret.net"),b=Number(o("SMTP_PORT","587"))||587,c=o("SMTP_USER",""),d=o("SMTP_PASS",""),e="true"===o("SMTP_SECURE","false"),f=`${a}-${b}-${c}-${d}-${e}`;if(!this.transporter||this.lastConfig!==f){if(this.transporter)try{this.transporter.close()}catch(a){console.error("[EmailNotificationService] Error closing old transporter:",a)}this.transporter=j.createTransport({pool:!0,host:a,port:b,secure:e,auth:{user:c,pass:d},connectionTimeout:15e3,greetingTimeout:15e3,socketTimeout:2e4,maxConnections:5,maxMessages:100,rateLimit:10,tls:{rejectUnauthorized:!1}}),this.lastConfig=f,console.log("[EmailNotificationService] Nodemailer transporter initialized dynamically.")}return this.transporter}async seedDefaultTemplate(a){let b={welcome:{name:"Hoş Geldiniz (B2C)",subject:"Pekefe Ailesine Hoş Geldiniz! \uD83C\uDF3F",variables:"kullanici_adi",bodyHtml:`
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
                <a href="http://localhost:3000/magaza" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">\xdcr\xfcnleri Keşfet</a>
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
        `},mutabakat:{name:"Cari Hesap Mutabakat Mektubu",subject:"Cari Hesap Mutabakat Talebi — {{tarih}} | Pekefe",variables:"kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres",bodyHtml:`
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><title>Mutabakat Mektubu</title></head>
          <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
              <tr><td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6b1d2f 0%,#3b0a18 100%);padding:36px 40px;text-align:center;">
                      <p style="margin:0 0 4px 0;font-size:11px;color:#fef3c7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">PEKEFE GER\xc7EK HASAT</p>
                      <h1 style="margin:0 0 4px 0;font-size:26px;color:#ffffff;font-weight:900;">MUTABAKAT MEKTUBU</h1>
                      <p style="margin:0;font-size:11px;color:#fef3c7;letter-spacing:0.1em;text-transform:uppercase;">Cari Hesap Bakiye Bilgilendirmesi</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 40px;">
                      <p style="font-size:15px;color:#334155;line-height:1.8;">Sayın <strong style="color:#1e293b;">{{yetkili}}</strong>,</p>
                      <p style="font-size:15px;color:#475569;line-height:1.8;">Firmamız kayıtlarına g\xf6re <strong>{{tarih}}</strong> tarihi itibarıyla cari hesap mutabakat bilgilerinizi sunuyoruz.</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:24px 0;">
                        <tr style="background-color:#f8fafc;">
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;">Cari Hesap Adı</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;">{{kullanici_adi}}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:600;">Cari Kod</td>
                          <td style="padding:12px 20px;font-size:13px;color:#1e293b;font-weight:700;font-family:monospace;">{{cari_kod}}</td>
                        </tr>
                      </table>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="http://localhost:3000/b2b" style="background:linear-gradient(135deg,#6b1d2f,#8b2d3f);color:#ffffff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;box-shadow:0 4px 12px rgba(107,29,47,0.25);">🔐 Bayi Portalına Giriş Yap</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#fcf8f6;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `},ekstre:{name:"Cari Hesap Ekstre G\xf6nderimi",subject:"Cari Hesap Ekstresi — {{tarih}} | Pekefe",variables:"kullanici_adi,cari_kod,bakiye,bakiye_durumu,bakiye_rengi,bakiye_etiketi,tarih,yetkili,telefon,vade_gun,adres",bodyHtml:`
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><title>Ekstre Bilgilendirmesi</title></head>
          <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
              <tr><td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6b1d2f 0%,#3b0a18 100%);padding:36px 40px;text-align:center;">
                      <p style="margin:0 0 4px 0;font-size:11px;color:#fef3c7;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">PEKEFE GER\xc7EK HASAT</p>
                      <h1 style="margin:0 0 4px 0;font-size:26px;color:#ffffff;font-weight:900;">CARİ HESAP EKSTRESİ</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 40px;">
                      <p style="font-size:15px;color:#334155;line-height:1.8;">Sayın <strong style="color:#1e293b;">{{yetkili}}</strong>,</p>
                      <p style="font-size:15px;color:#475569;line-height:1.8;"><strong>{{tarih}}</strong> tarihi itibarıyla cari hesabınıza ait bakiye bilgileri aşağıda yer almaktadır.</p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="http://localhost:3000/b2b" style="background:linear-gradient(135deg,#6b1d2f,#8b2d3f);color:#ffffff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;box-shadow:0 4px 12px rgba(107,29,47,0.25);">📋 Hesap Hareketlerimi G\xf6r\xfcnt\xfcle</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#fcf8f6;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">\xa9 ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `},admin_new_order:{name:"Yeni Sipariş Bildirimi (Y\xf6netici)",subject:"\uD83D\uDEA8 Yeni Sipariş Alındı! — Sipariş No: {{siparis_no}}",variables:"kullanici_adi,siparis_no,siparis_tutari,odeme_yontemi,detay_linki,tarih,siparis_icerik",bodyHtml:`
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
        `}}[a.toLowerCase().trim()];if(!b)throw Error(`Default template not found for event: ${a}`);let c=await f.prisma.emailTemplate.upsert({where:{eventType:a.toLowerCase().trim()},update:{name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"},create:{eventType:a.toLowerCase().trim(),name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"}});return console.log(`[EmailNotificationService] Upserted default template for eventType: ${a}`),c}compileTemplate(a,b){let c=a||"";return Object.entries(b||{}).forEach(([a,b])=>{let d=RegExp(`{{\\s*${a}\\s*}}`,"g");c=c.replace(d,null!=b?String(b):"")}),c=c.replace(/{{\s*\w+\s*}}/g,"")}async queueEmail(a,b,c,d=3){let e=b.toLowerCase().trim();if(!a||!a.includes("@"))return console.warn(`[EmailNotificationService] Invalid recipient email address: ${a}`),"invalid_email";let g="",h="";try{let a=f.prisma.emailTemplate.findUnique({where:{eventType:e}}),b=await (0,f.w)(a,1500,null);b&&"ACTIVE"===b.status&&(g=b.subject,h=b.bodyHtml)}catch{}if(!g||!h)try{let a=await this.seedDefaultTemplate(e);a&&(g=a.subject,h=a.bodyHtml)}catch{}g&&h||(g=`Pekefe Bilgilendirme - ${e.toUpperCase()}`,h="<p>Merhaba {{kullanici_adi}}, işleminiz başarıyla tamamlanmıştır.</p>");let i=this.compileTemplate(g,c),j=this.compileTemplate(h,c);try{let b=this.getTransporter(),c=o("SMTP_USER","info@pekefe.com"),d=o("SMTP_FROM_NAME","PEKEFE İSPİR Y\xd6RESEL"),g=await b.sendMail({from:`"${d}" <${c}>`,to:a,subject:i,html:j});return console.log(`[EmailNotificationService] ✅ EMAIL DIRECTLY SENT to ${a} (MessageID: ${g.messageId})`),f.prisma.emailLog.create({data:{recipient:a,subject:i,bodyHtml:j,eventType:e,status:"SENT",retryCount:0}}).catch(()=>{}),g.messageId||"sent_ok"}catch(b){console.error(`[EmailNotificationService] ❌ Direct email send failed to ${a}:`,b);try{return(await f.prisma.emailLog.create({data:{recipient:a,subject:i,bodyHtml:j,eventType:e,status:"PENDING",retryCount:0,errorMessage:b?.message||"Direct send error"}})).id}catch{return"error_logged"}}}async processQueue(){if(!this.isProcessing){this.isProcessing=!0;try{for(let a of(await f.prisma.emailLog.findMany({where:{status:"PENDING"},take:20,orderBy:{createdAt:"asc"}})))try{let b=this.getTransporter(),c=o("SMTP_USER","info@pekefe.com"),d=o("SMTP_FROM_NAME","Pekefe");await b.sendMail({from:`"${d}" <${c}>`,to:a.recipient,subject:a.subject,html:a.bodyHtml}),await f.prisma.emailLog.update({where:{id:a.id},data:{status:"SENT"}})}catch(c){let b=a.retryCount+1;await f.prisma.emailLog.update({where:{id:a.id},data:{retryCount:b,status:b>=3?"FAILED":"PENDING",errorMessage:c?.message||"Send failed"}})}}catch(a){console.error("[EmailNotificationService] Error processing email queue:",a)}finally{this.isProcessing=!1}}}}let q=new p,r=n().join(process.cwd(),"data","orders_db.json");function s(){try{try{let a=n().dirname(r);l().existsSync(a)||l().mkdirSync(a,{recursive:!0}),l().existsSync(r)||l().writeFileSync(r,"[]","utf-8")}catch(a){console.error("Error ensuring local orders DB file:",a)}if(l().existsSync(r)){let a=l().readFileSync(r,"utf-8"),b=JSON.parse(a);return Array.isArray(b)?b:[]}}catch(a){console.error("Error reading local orders DB:",a)}return[]}function t(a){return String(a||"").replace(/[^a-zA-Z0-9]/g,"").toUpperCase()}function u(a,b){try{let c=s(),d=t(a),e=c.findIndex(b=>b.id===a||b.orderNumber===a||d&&(t(b.id)===d||t(b.orderNumber)===d));if(e>=0)return c[e]={...c[e],...b},l().writeFileSync(r,JSON.stringify(c,null,2),"utf-8"),c[e]}catch(a){console.error("Error updating local order status:",a)}return null}async function v(){let a=await (0,g.getServerSession)(h.N);if(!a||!a.user)throw Error("Oturum a\xe7ılmamış. L\xfctfen giriş yapınız.");let b=a.user.role||"USER";if(!(0,i.OY)(b)&&"DEALER"!==b)throw Error("Yetkisiz işlem. Bu alan sadece yetkili bayilere veya y\xf6neticilere a\xe7ıktır.");return a}async function w(a,b){try{await v();let c=null;try{c=await f.prisma.order.update({where:{id:a},data:{status:b},include:{currentAccount:!0}})}catch(a){console.warn("Prisma order update fallback to local disk DB:",a)}let d=u(a,{status:b});!c&&d&&(c={...d,total:d.amount,currentAccount:{name:d.client,email:d.email,phone:d.phone,address:d.address}});let e=c?.currentAccount?.email||d?.email;if(e&&"guest@nexab2b.com"!==e)try{let f="Belirtilmedi",g="—";if(c?.summary&&c.summary.startsWith("[")){let a=c.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);a&&(f=a[1].trim(),a[2]&&(g=a[2].trim()))}let h=process.env.NEXTAUTH_URL||"https://pekefe.com",i=c?.date?new Date(c.date).toLocaleDateString("tr-TR"):new Date().toLocaleDateString("tr-TR");await q.queueEmail(e,"order_status_updated",{kullanici_adi:c?.currentAccount?.name||d?.client||"Değerli M\xfcşterimiz",siparis_no:a,siparis_durumu:b,siparis_tutari:Number(c?.total||d?.amount||0).toLocaleString("tr-TR",{minimumFractionDigits:2}),kargo_sirketi:f,takip_no:g,tarih:i,detay_linki:`${h}/hesap`})}catch(a){console.error("Order status notification email failed:",a)}return{success:!0,order:c}}catch(a){return console.error("Error in updateOrderStatusAction:",a),{success:!1,error:a.message||"Sipariş durumu g\xfcncellenemedi."}}}async function x(a,b){try{await v();let c=null;try{let d=await (0,f.w)(f.prisma.order.findUnique({where:{id:a},include:{currentAccount:!0}}),2e3,null);if(!d){let b=a.replace(/[^a-zA-Z0-9]/g,"");b&&b!==a&&(d=await (0,f.w)(f.prisma.order.findUnique({where:{id:b},include:{currentAccount:!0}}),2e3,null))}if(d){let a=d.id;c=await f.prisma.$transaction(async c=>{let e=await c.order.update({where:{id:a},data:{status:"İptal Edildi"}});if("İptal Edildi"!==d.status&&"İptal"!==d.status){let e=Number(d.total);d.currentAccountId&&(await c.transaction.create({data:{currentAccountId:d.currentAccountId,type:"IPTAL",amount:-e,description:`Sipariş İptali: #${a}${b?` (${b})`:""}`,paymentMethod:d.method||"Belirtilmedi",date:new Date}}),await c.currentAccount.update({where:{id:d.currentAccountId},data:{balance:{decrement:e}}}))}return e})}}catch(a){console.warn("Prisma cancel order fallback to local disk DB:",a)}let d=u(a,{status:"İptal Edildi"}),e=c?.currentAccount?.email||d?.email;if(e&&"guest@nexab2b.com"!==e)try{let b=process.env.NEXTAUTH_URL||"https://pekefe.com";await q.queueEmail(e,"order_status_updated",{kullanici_adi:c?.currentAccount?.name||d?.client||"Değerli M\xfcşterimiz",siparis_no:a,siparis_durumu:"İptal Edildi",siparis_tutari:Number(c?.total||d?.amount||0).toLocaleString("tr-TR",{minimumFractionDigits:2}),kargo_sirketi:"—",takip_no:"—",tarih:new Date().toLocaleDateString("tr-TR"),detay_linki:`${b}/hesap`})}catch(a){console.error("Order cancellation email failed:",a)}return{success:!0,order:c||d}}catch(a){return console.error("Error in cancelOrderAction:",a),{success:!1,error:a.message||"Sipariş iptal edilirken bir hata oluştu."}}}async function y(a,b){try{await v();try{await f.prisma.order.updateMany({where:{id:{in:a}},data:{status:b}})}catch(a){console.warn("Prisma bulk update fallback to local disk DB:",a)}return a.forEach(a=>{u(a,{status:b})}),{success:!0}}catch(a){return console.error("Error in bulkUpdateOrderStatusAction:",a),{success:!1,error:a.message||"Toplu sipariş durumu g\xfcncellenemedi."}}}async function z(a,b){try{for(let c of(await v(),a))await x(c,b);return{success:!0}}catch(a){return console.error("Error in bulkCancelOrdersAction:",a),{success:!1,error:a.message||"Toplu sipariş iptal edilemedi."}}}async function A(a){try{await v();let b=[];try{b=await (0,f.w)(f.prisma.order.findMany({where:{id:{in:a}},include:{currentAccount:!0}}),2500,[])}catch(a){console.warn("[BULK INVOICE WARNING] DB unreachable, fallback to local disk DB:",a)}b&&0!==b.length||(b=s().filter(b=>a.includes(b.id)||b.orderNumber&&a.includes(b.orderNumber)).map(a=>({id:a.id,orderNumber:a.orderNumber||a.id,type:a.type||"B2C",total:{toNumber:()=>Number(a.amount||a.total||0)},summary:a.summary||"",currentAccountId:null,currentAccount:{name:a.client||"M\xfcşteri",taxNo:a.taxId||"",taxOffice:a.taxOffice||"",address:a.address||"",email:a.email||"",phone:a.phone||""}})));let c=0,d=0,e=[];for(let a of b)try{let b="B2B"===a.type?"e-Fatura":"e-Arşiv",e=null;try{e=await (0,f.w)(f.prisma.invoice.findFirst({where:{orderId:a.id}}),1500,null)}catch(a){}if(e){d++;continue}let g="function"==typeof a.total?.toNumber?a.total.toNumber():Number(a.total||a.amount||0),h=g-g/1.2,i=(await B(a.summary||"",g)).map(a=>({name:a.name,quantity:a.quantity,unitPrice:a.price,totalAmount:a.price*a.quantity,vatRate:a.taxRate||20}));try{await f.prisma.invoice.create({data:{orderId:a.id,currentAccountId:a.currentAccountId,totalAmount:g,taxAmount:h,status:"ODENDI",type:b,dueDate:new Date(Date.now()+6048e5),items:a.summary||"Sipariş Detayı",notes:"Sipariş \xfczerinden otomatik fatura oluşturuldu.",invoiceItems:{create:i}}}),await f.prisma.order.update({where:{id:a.id},data:{status:"Hazırlanıyor"}})}catch(a){console.warn("[BULK INVOICE] DB invoice create skipped (offline/unreachable):",a)}u(a.id,{status:"Hazırlanıyor"}),c++}catch(b){e.push(`${a.id}: ${b.message}`)}return{success:!0,count:c,existingCount:d,errors:e}}catch(a){return console.error("Error in bulkGenerateInvoicesAction:",a),{success:!1,error:a.message||"Toplu faturalandırma sırasında hata."}}}async function B(a,b){if(!a)return[];let c=a.replace(/^\[[^\]]+\]\s*/,""),d=c,e=c.match(/^(?:\d+\s*-\s*)(.*)/);e&&(d=e[1]);let f=d.split(/,\s*/),g=[];for(let a of f){let b=a.trim();if(!b)continue;let c=b,d=1,e=b.match(/(.+)\s*\((\d+)\)/),f=b.match(/^(\d+)\s*[xX*]\s*(.+)/),h=b.match(/(.+?)\s*[xX*]\s*(\d+)$/);e?(c=e[1].trim(),d=parseInt(e[2],10)):f?(d=parseInt(f[1],10),c=f[2].trim()):h&&(c=h[1].trim(),d=parseInt(h[2],10));let i=250;c.includes("K\xf6r\xfck")?i=450:c.includes("Kovan")?i=1200:c.includes("Maske")?i=180:c.includes("Demir")?i=90:c.includes("Tel")?i=120:c.includes("S\xfczme")?i=3500:c.includes("Bal")&&(i=150),g.push({name:c,quantity:d,price:i,taxRate:20})}if(void 0!==b&&b>0&&g.length>0){let a=b/1.2,c=g.reduce((a,b)=>a+b.price*b.quantity,0);if(c>0){let b=a/c,d=0;for(let c=0;c<g.length;c++){let e=g[c];c===g.length-1?e.price=(a-d)/e.quantity:(e.price=Math.round(e.price*b*100)/100,d+=e.price*e.quantity)}}}return g}async function C(a){try{await v();let b=null;try{b=await (0,f.w)(f.prisma.order.findUnique({where:{id:a},include:{despatchAdvices:{include:{lines:{include:{product:!0}}}},invoices:{include:{invoiceItems:!0}}}}),2500,null)}catch(a){console.warn("[FULFILLMENT WARNING] Prisma query timed out or failed:",a)}if(!b){let c=s().find(b=>b.id===a||b.orderNumber===a);c&&(b={id:c.id,status:c.status||"Yeni",date:new Date(c.date||Date.now()),total:{toNumber:()=>Number(c.amount||c.total||0)},summary:c.summary||"",type:c.type||"B2C",despatchAdvices:[],invoices:[]})}if(!b)return{success:!1,error:"Sipariş bulunamadı."};let c="function"==typeof b.total?.toNumber?b.total.toNumber():Number(b.total||0),d=(await B(b.summary||"",c)).map(a=>{let c=0;(b.despatchAdvices||[]).forEach(b=>{"Cancelled"!==b.status&&(b.lines||[]).forEach(b=>{(b.product?.name?.toLowerCase().includes(a.name.toLowerCase())||a.name.toLowerCase().includes(b.product?.name?.toLowerCase()))&&(c+=b.quantity)})});let d=0;return(b.invoices||[]).forEach(b=>{"Cancelled"!==b.status&&(b.invoiceItems||[]).forEach(b=>{(b.name?.toLowerCase().includes(a.name.toLowerCase())||a.name.toLowerCase().includes(b.name?.toLowerCase()))&&(d+=b.quantity)})}),{productName:a.name,price:a.price,orderedQty:a.quantity,shippedQty:Math.min(a.quantity,c),invoicedQty:Math.min(a.quantity,d)}}),e=b.date instanceof Date?b.date.toISOString():new Date(b.date||Date.now()).toISOString();return{success:!0,order:{id:b.id,status:b.status,date:e,total:c,summary:b.summary,type:b.type},items:d,waybills:(b.despatchAdvices||[]).map(a=>({id:a.id,despatchNo:a.despatchNo,status:a.status,date:a.createdAt?.toISOString?.()||new Date().toISOString()})),invoices:(b.invoices||[]).map(a=>({id:a.id,totalAmount:"function"==typeof a.totalAmount?.toNumber?a.totalAmount.toNumber():Number(a.totalAmount||0),status:a.status,type:a.type,date:a.date?.toISOString?.()||new Date().toISOString()}))}}catch(a){return console.error("Error in getFulfillmentDetailsAction:",a),{success:!1,error:a.message||"Sevkiyat detayları alınamadı."}}}async function D(a,b,c){try{await v();let d=null;try{d=await (0,f.w)(f.prisma.order.findUnique({where:{id:a}}),2500,null)}catch(a){console.warn("[INVOICE/WAYBILL WARNING] Prisma error:",a)}if(d||(d=s().find(b=>b.id===a||b.orderNumber===a)),!d)return{success:!1,error:"Sipariş bulunamadı."};let e=new Date().toISOString().split("T")[0].replace(/-/g,""),g=Math.floor(1e3+9e3*Math.random()),h=`IRS-${e}-${g}`;return await f.prisma.$transaction(async a=>{let e=!1,f=!1,g=[],i=[],j=0;for(let h of c){let c=0,k=0;if(b){let b=await a.despatchAdvice.findMany({where:{orderId:d.id,status:{not:"Cancelled"}},include:{lines:{include:{product:!0}}}}),e=0;b.forEach(a=>{a.lines.forEach(a=>{(a.product.name.toLowerCase().includes(h.productName.toLowerCase())||h.productName.toLowerCase().includes(a.product.name.toLowerCase()))&&(e+=a.quantity)})});let f=await a.invoice.findMany({where:{orderId:d.id,status:{not:"Cancelled"}},include:{invoiceItems:!0}}),g=0;f.forEach(a=>{a.invoiceItems.forEach(a=>{(a.name.toLowerCase().includes(h.productName.toLowerCase())||h.productName.toLowerCase().includes(a.name.toLowerCase()))&&(g+=a.quantity)})}),c=Math.max(0,h.orderedQty-e),k=Math.max(0,h.orderedQty-g)}else c=h.shipQty,k=h.invoiceQty;if(c>0){e=!0;let b=await a.product.findFirst({where:{name:{contains:h.productName}}});b||(b=await a.product.findFirst()),b&&g.push({productId:b.id,quantity:c})}k>0&&(f=!0,i.push({name:h.productName,quantity:k,unitPrice:h.price,totalAmount:h.price*k}),j+=h.price*k)}let k=null,l=null;if(e&&g.length>0&&(k=(await a.despatchAdvice.create({data:{despatchNo:h,customerAccountId:d.currentAccountId,orderId:d.id,issueDate:new Date,actualDespatchDate:new Date,status:"SEVK_EDILDI",lines:{create:g}}})).id),f&&i.length>0){let b="B2B"===d.type?"e-Fatura":"e-Arşiv",c=await a.invoice.create({data:{orderId:d.id,currentAccountId:d.currentAccountId,totalAmount:j,taxAmount:j-j/1.2,status:"BEKLEMEDE",type:b,dueDate:new Date(Date.now()+2592e6),items:d.summary||"Sipariş Detayı",notes:"Sipariş \xfczerinden akıllı fatura oluşturuldu.",invoiceItems:{create:i}}});l=c.id,k&&await a.despatchAdvice.update({where:{id:k},data:{invoiceId:c.id}})}return await a.order.update({where:{id:d.id},data:{status:b?"Teslim Edildi":"Hazırlanıyor"}}),{success:!0,waybillId:k,invoiceId:l}})}catch(a){return console.error("Error in createInvoiceAndWaybillAction:",a),{success:!1,error:a.message||"Belgeler oluşturulurken hata."}}}(0,c(89337).D)([w,x,y,z,A,B,C,D]),(0,e.A)(w,"605410f1b261abe6f5aafdc21b693479badff5cded",null),(0,e.A)(x,"609a59c8bd22f283931e43899cd4cd95bb3c677e99",null),(0,e.A)(y,"60f5a79f0e355d513925a32aaaf86bf9dad1574df1",null),(0,e.A)(z,"604c69f9da923e0e8d468a63372ec2f7bb2de36798",null),(0,e.A)(A,"40800c2595f8035165db150fdc61af23eb29e2fa8e",null),(0,e.A)(B,"60e0ffec520e022f4e254b1d86fc068d36418adf0a",null),(0,e.A)(C,"4027b9f5b7708bf1d2cfdf682a4dab0d6a6b4213e5",null),(0,e.A)(D,"705107a7df57e1edae89dc40a614fd2517e0cb8153",null)},78335:()=>{},96487:()=>{}};