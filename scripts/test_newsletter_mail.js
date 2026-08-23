const path = require('path');

async function testNewsletterMail() {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: 'smtp.turkticaret.net',
    port: 465,
    secure: true,
    auth: {
      user: 'info@pekefe.com',
      pass: 'Pekefe.25'
    },
    tls: { rejectUnauthorized: false }
  });

  const mailOptions = {
    from: '"PEKEFE Geleneksel Lezzetler" <info@pekefe.com>',
    to: 'afmavm@gmail.com',
    subject: 'Pekefe Bülten Kulübüne Hoş Geldiniz! 🌿',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #6b1d2f 0%, #3b0a18 100%); padding: 36px 32px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">PEKEFE BÜLTEN KULÜBÜ</h2>
          <p style="color: #fef3c7; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Geleneksel & Doğal Lezzetler</p>
        </div>
        <div style="padding: 36px 32px;">
          <h3 style="color: #1a0a10; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Aramıza Hoş Geldiniz! ✨</h3>
          <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-top: 24px;">Merhaba,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.7;">Pekefe Bülten Kulübü'ne katıldığınız için teşekkür ederiz. İspir yaylalarının en özel sınırlı rekolte ürünleri, mevsimsel özel tadımlar ve size özel ayrıcalıklı fırsatlardan ilk siz haberdar olacaksınız.</p>
          
          <div style="background-color: #fffbf5; border: 1px solid #fde68a; border-radius: 14px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">🎁 Kulüp Üyelerine Özel Ayrıcalıklar</p>
            <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.6;">Butik rekolte ürünlerinde öncelikli erişim ve bülten üyelerine özel sürpriz indirimler e-posta kutunuza gelecek.</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="http://localhost:3000" style="background: linear-gradient(135deg, #6b1d2f, #8b2d3f); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(107, 29, 47, 0.25);">Ürünleri Keşfet</a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">Sorularınız veya istekleriniz için bu e-postaya yanıt verebilir veya info@pekefe.com adresimizden bize ulaşabilirsiniz.</p>
        </div>
        <div style="background-color: #fcf8f6; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ DIRECT INSTANT NEWSLETTER MAIL SENT SUCCESSFUL:', info.messageId);
  } catch (err) {
    console.error('❌ MAIL SENDING ERROR:', err);
  }
}

testNewsletterMail();
