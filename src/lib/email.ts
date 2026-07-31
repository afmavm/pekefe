import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.turkticaret.net',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOrderConfirmationEmail = async (to: string, orderId: string, name: string, total: number) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'test@example.com') {
    console.warn(`[EMAIL_MOCK] Sending order confirmation to ${to} for order ${orderId}`);
    return;
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #6b1d2f; margin: 0; font-size: 24px; font-weight: bold;">PEKEFE</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase;">Geleneksel & Doğal Lezzetler</p>
        </div>
        <h3 style="color: #1a0a10; margin-bottom: 16px;">Siparişiniz Alındı! 🎉</h3>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Merhaba <strong>${name}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Siparişiniz başarıyla alınmıştır. Pekefe'yi tercih ettiğiniz için teşekkür ederiz.</p>
        <div style="background-color: #fffbf5; border: 1px solid #fde68a; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0; color: #78350f; font-size: 13px; text-transform: uppercase; font-weight: bold;">Sipariş Numarası</p>
          <p style="margin: 6px 0 0 0; color: #6b1d2f; font-size: 20px; font-weight: bold; font-family: monospace;">${orderId}</p>
        </div>
        <p style="color: #374151; font-size: 16px;">Ödenen Tutar: <strong style="color: #15803d;">${total.toLocaleString('tr-TR')} ₺</strong></p>
        <hr style="border-color: #f1f5f9; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Bu e-posta otomatik olarak oluşturulmuştur. © ${new Date().getFullYear()} Pekefe Geleneksel Lezzetler.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Pekefe" <${process.env.SMTP_USER}>`,
      to,
      subject: `Sipariş Onayı - ${orderId}`,
      html,
    });
    console.log(`Order confirmation email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};
