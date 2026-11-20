export const PEKEFE_SITE_URL = "https://www.pekefe.com";
export const PEKEFE_LOGO_URL = "https://www.pekefe.com/logo.png";

export interface EmailLayoutOptions {
  badge?: string;
  subtitle?: string;
  title?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Kurumsal PEKEFE E-Ticaret E-Posta Şablon Sarmalayıcı
 * Logo, üst düzey başlık, mobil uyumlu içerik alanı ve tam firma bilgileri altbilgisi içerir.
 */
export function wrapPekefeEmail({
  badge,
  subtitle = "İSPİR YÖRESEL ÜRÜNLER • 2014'TEN BERİ",
  title,
  bodyHtml,
  ctaText,
  ctaUrl,
}: EmailLayoutOptions): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PEKEFE İspir Yöresel Ürünler</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1ee;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f6f1ee;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ece3de;box-shadow:0 12px 36px rgba(92,17,34,0.08);">
          <!-- Kurumsal Header & Logo -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#6b1d2f 0%,#3a0a16 100%);padding:30px 28px 26px 28px;border-bottom:3px solid #d4a359;">
              <a href="${PEKEFE_SITE_URL}" target="_blank" style="text-decoration:none;display:inline-block;">
                <img src="${PEKEFE_LOGO_URL}" alt="PEKEFE İspir Yöresel Ürünler" width="68" height="68" style="display:block;margin:0 auto 12px auto;border-radius:14px;background-color:#ffffff;padding:4px;border:2px solid #d4a359;object-fit:contain;" />
              </a>
              <div style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:0.14em;line-height:1.2;">PEKEFE</div>
              <div style="color:#f5d598;font-size:10.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;margin-top:6px;">${subtitle}</div>
            </td>
          </tr>

          <!-- İçerik Gövdesi -->
          <tr>
            <td style="padding:32px 28px 24px 28px;font-size:14px;line-height:1.7;color:#334155;">
              ${
                badge
                  ? `<div style="margin-bottom:16px;"><span style="display:inline-block;background-color:#fdf2f4;color:#881337;border:1px solid #fbcfe8;border-radius:999px;padding:5px 14px;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">${badge}</span></div>`
                  : ""
              }
              ${
                title
                  ? `<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#1a0a10;line-height:1.3;">${title}</h1>`
                  : ""
              }
              ${bodyHtml}
              ${
                ctaText && ctaUrl
                  ? `<div style="text-align:center;margin:28px 0 8px 0;">
                      <a href="${ctaUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6b1d2f 0%,#8b263c 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:999px;box-shadow:0 4px 14px rgba(107,29,47,0.28);">${ctaText}</a>
                    </div>`
                  : ""
              }
            </td>
          </tr>

          <!-- Güven & Hızlı Erişim Şeridi -->
          <tr>
            <td style="background-color:#fdf9f6;border-top:1px solid #f1e8e3;border-bottom:1px solid #f1e8e3;padding:14px 24px;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="font-size:11px;font-weight:700;color:#6b1d2f;padding:2px 6px;">%100 Doğal İspir Mahsulü</td>
                  <td align="center" style="font-size:11px;font-weight:700;color:#6b1d2f;padding:2px 6px;">256-Bit SSL Güvenli Ödeme</td>
                  <td align="center" style="font-size:11px;font-weight:700;color:#6b1d2f;padding:2px 6px;">Özenli &amp; Sigortalı Kargo</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Kurumsal Firma Bilgileri Footer -->
          <tr>
            <td style="background-color:#260811;color:#e2d5d8;padding:26px 28px;text-align:center;font-size:12px;line-height:1.7;">
              <div style="color:#ffffff;font-weight:800;font-size:13px;letter-spacing:0.06em;margin-bottom:6px;">PEKEFE İSPİR YÖRESEL ÜRÜNLER</div>
              <div style="color:#d6c3c7;font-size:11.5px;">Çamlıca Mahallesi, 25900 İspir / Erzurum, Türkiye</div>
              <div style="margin-top:8px;font-size:12px;">
                <a href="tel:+905342709140" style="color:#f5d598;text-decoration:none;font-weight:700;">+90 534 270 91 40</a>
                &nbsp;•&nbsp;
                <a href="https://wa.me/905342709140" target="_blank" style="color:#86efac;text-decoration:none;font-weight:700;">WhatsApp Destek</a>
                &nbsp;•&nbsp;
                <a href="mailto:info@pekefe.com" style="color:#f5d598;text-decoration:none;font-weight:700;">info@pekefe.com</a>
              </div>
              <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;">
                <a href="${PEKEFE_SITE_URL}/kategoriler" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">Mağaza</a>
                <a href="${PEKEFE_SITE_URL}/hesap" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">Hesabım</a>
                <a href="${PEKEFE_SITE_URL}/teslimat" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">Teslimat &amp; İade</a>
                <a href="${PEKEFE_SITE_URL}/iletisim" target="_blank" style="color:#f8fafc;text-decoration:none;margin:0 8px;">İletişim</a>
              </div>
              <div style="margin-top:12px;color:#a89096;font-size:10.5px;">
                © ${year} PEKEFE İspir Yöresel Ürünler. Tüm hakları saklıdır. &nbsp;|&nbsp;
                <a href="${PEKEFE_SITE_URL}" target="_blank" style="color:#f5d598;text-decoration:none;">www.pekefe.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
