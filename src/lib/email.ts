import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
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
      <div style="font-family: Arial, sans-serif; max-w-xl; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
        <h2 style="color: #b45309; margin-bottom: 16px;">Siparişiniz Alındı!</h2>
        <p style="color: #374151; font-size: 16px;">Merhaba <strong>${name}</strong>,</p>
        <p style="color: #374151; font-size: 16px;">Siparişiniz başarıyla alınmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.</p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 14px; text-transform: uppercase;">Sipariş Numarası</p>
          <p style="margin: 4px 0 0 0; color: #111827; font-size: 20px; font-weight: bold;">${orderId}</p>
        </div>
        <p style="color: #374151; font-size: 16px;">Ödenen Tutar: <strong>${total.toLocaleString('tr-TR')} ₺</strong></p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">Siparişinizin durumunu sitemizdeki "Kargom Nerede?" bölümünden takip edebilirsiniz.</p>
        <hr style="border-color: #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Bu e-posta otomatik olarak oluşturulmuştur. Atak Arıcılık B2B Platformu.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Atak Arıcılık B2B" <${process.env.SMTP_USER}>`,
      to,
      subject: `Sipariş Onayı - ${orderId}`,
      html,
    });
    console.log(`Order confirmation email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};
