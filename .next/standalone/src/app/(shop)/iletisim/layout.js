// İletişim sayfası için SEO metadata
export const metadata = {
  title: 'İletişim',
  description: "Pekefe ile iletişime geçin. Atatürk Caddesi No:42, İspir, Erzurum. Telefon: +90 (442) 511 00 00. E-posta: destek@pekefe.com",
  keywords: ['pekefe iletişim', 'ispir erzurum adres', 'pekefe telefon', 'müşteri hizmetleri'],
  openGraph: {
    title: 'İletişim | Pekefe',
    description: "Pekefe ile iletişime geçin. Atatürk Caddesi No:42, İspir, Erzurum.",
    url: 'https://www.pekefe.com/iletisim',
  },
  alternates: { canonical: 'https://www.pekefe.com/iletisim' },
};

export default function IletisimLayout({ children }) {
  return children;
}
