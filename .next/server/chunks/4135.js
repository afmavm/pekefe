"use strict";exports.id=4135,exports.ids=[4135],exports.modules={84135:(a,b,c)=>{c.d(b,{J:()=>h});var d=c(93061),e=c(35924),f=c(97727);class g{constructor(){this.transporter=null,this.isProcessing=!1,this.lastConfig=""}getTransporter(){let a=(0,f.A)("SMTP_HOST","smtp.turkticaret.net"),b=Number((0,f.A)("SMTP_PORT","587"))||587,c=(0,f.A)("SMTP_USER",""),d=(0,f.A)("SMTP_PASS",""),g="true"===(0,f.A)("SMTP_SECURE","false"),h=`${a}-${b}-${c}-${d}-${g}`;if(!this.transporter||this.lastConfig!==h){if(this.transporter)try{this.transporter.close()}catch(a){console.error("[EmailNotificationService] Error closing old transporter:",a)}this.transporter=e.createTransport({pool:!0,host:a,port:b,secure:g,auth:{user:c,pass:d},connectionTimeout:15e3,greetingTimeout:15e3,socketTimeout:2e4,maxConnections:5,maxMessages:100,rateLimit:10,tls:{rejectUnauthorized:!1}}),this.lastConfig=h,console.log("[EmailNotificationService] Nodemailer transporter initialized dynamically.")}return this.transporter}async seedDefaultTemplate(a){let b={welcome:{name:"Hoş Geldiniz (B2C)",subject:"Pekefe Ailesine Hoş Geldiniz! \uD83C\uDF3F",variables:"kullanici_adi",bodyHtml:`
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
        `}}[a.toLowerCase().trim()];if(!b)throw Error(`Default template not found for event: ${a}`);let c=await d.prisma.emailTemplate.upsert({where:{eventType:a.toLowerCase().trim()},update:{name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"},create:{eventType:a.toLowerCase().trim(),name:b.name,subject:b.subject,bodyHtml:b.bodyHtml,variables:b.variables,status:"ACTIVE"}});return console.log(`[EmailNotificationService] Upserted default template for eventType: ${a}`),c}compileTemplate(a,b){let c=a||"";return Object.entries(b||{}).forEach(([a,b])=>{let d=RegExp(`{{\\s*${a}\\s*}}`,"g");c=c.replace(d,null!=b?String(b):"")}),c=c.replace(/{{\s*\w+\s*}}/g,"")}async queueEmail(a,b,c,e=3){let g=b.toLowerCase().trim();if(!a||!a.includes("@"))return console.warn(`[EmailNotificationService] Invalid recipient email address: ${a}`),"invalid_email";let h="",i="";try{let a=d.prisma.emailTemplate.findUnique({where:{eventType:g}}),b=await (0,d.w)(a,1500,null);b&&"ACTIVE"===b.status&&(h=b.subject,i=b.bodyHtml)}catch{}if(!h||!i)try{let a=await this.seedDefaultTemplate(g);a&&(h=a.subject,i=a.bodyHtml)}catch{}h&&i||(h=`Pekefe Bilgilendirme - ${g.toUpperCase()}`,i="<p>Merhaba {{kullanici_adi}}, işleminiz başarıyla tamamlanmıştır.</p>");let j=this.compileTemplate(h,c),k=this.compileTemplate(i,c);try{let b=this.getTransporter(),c=(0,f.A)("SMTP_USER","info@pekefe.com"),e=(0,f.A)("SMTP_FROM_NAME","PEKEFE İSPİR Y\xd6RESEL"),h=await b.sendMail({from:`"${e}" <${c}>`,to:a,subject:j,html:k});return console.log(`[EmailNotificationService] ✅ EMAIL DIRECTLY SENT to ${a} (MessageID: ${h.messageId})`),d.prisma.emailLog.create({data:{recipient:a,subject:j,bodyHtml:k,eventType:g,status:"SENT",retryCount:0}}).catch(()=>{}),h.messageId||"sent_ok"}catch(b){console.error(`[EmailNotificationService] ❌ Direct email send failed to ${a}:`,b);try{return(await d.prisma.emailLog.create({data:{recipient:a,subject:j,bodyHtml:k,eventType:g,status:"PENDING",retryCount:0,errorMessage:b?.message||"Direct send error"}})).id}catch{return"error_logged"}}}async processQueue(){if(!this.isProcessing){this.isProcessing=!0;try{for(let a of(await d.prisma.emailLog.findMany({where:{status:"PENDING"},take:20,orderBy:{createdAt:"asc"}})))try{let b=this.getTransporter(),c=(0,f.A)("SMTP_USER","info@pekefe.com"),e=(0,f.A)("SMTP_FROM_NAME","Pekefe");await b.sendMail({from:`"${e}" <${c}>`,to:a.recipient,subject:a.subject,html:a.bodyHtml}),await d.prisma.emailLog.update({where:{id:a.id},data:{status:"SENT"}})}catch(c){let b=a.retryCount+1;await d.prisma.emailLog.update({where:{id:a.id},data:{retryCount:b,status:b>=3?"FAILED":"PENDING",errorMessage:c?.message||"Send failed"}})}}catch(a){console.error("[EmailNotificationService] Error processing email queue:",a)}finally{this.isProcessing=!1}}}}let h=new g},97727:(a,b,c)=>{c.d(b,{A:()=>h});var d=c(29021),e=c.n(d),f=c(33873),g=c.n(f);function h(a,b=""){try{let b=g().join(process.cwd(),".env");if(e().existsSync(b))for(let c of e().readFileSync(b,"utf-8").split("\n")){let b=c.trim();if(b.startsWith("#")||!b.includes("="))continue;let[d,...e]=b.split("=");if(d.trim()===a){let a=e.join("=").trim();return(a.startsWith('"')&&a.endsWith('"')||a.startsWith("'")&&a.endsWith("'"))&&(a=a.substring(1,a.length-1)),a=a.replace(/\\"/g,'"').replace(/\\'/g,"'")}}}catch(b){console.error("Error reading live env key:",a,b)}return process.env[a]||b}}};