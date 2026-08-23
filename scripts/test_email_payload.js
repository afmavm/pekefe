const nodemailer = require('nodemailer');

async function testDirectSend() {
  console.log('Sending direct email test to info@pekefe.com...');
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

  const info = await transporter.sendMail({
    from: '"PEKEFE İSPİR YÖRESEL" <info@pekefe.com>',
    to: 'info@pekefe.com',
    subject: 'Pekefe Müşteri Bildirim Testi 🌿',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #6b1d2f;">Pekefe E-Posta Bildirim Sistemi Aktif!</h2>
        <p>Merhaba <strong>İlhan Efe</strong>,</p>
        <p>Müşterilere yapılan tüm işlemler (sipariş onayı, kargo güncellemesi, yeni üyelik) artık doğrudan ve kesintisiz iletilmektedir.</p>
        <p style="color: #888; font-size: 12px;">© 2026 Pekefe Geleneksel Lezzetler</p>
      </div>
    `
  });

  console.log('✅ Direct send success! Message ID:', info.messageId);
}

testDirectSend();
