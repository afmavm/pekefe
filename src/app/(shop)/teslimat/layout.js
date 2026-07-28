// Teslimat ve İade Politikası — indexlenebilir
export const metadata = {
  title: 'Teslimat ve İade Politikası',
  description: "Pekefe teslimat süreci, kargo bilgileri, soğuk zincir paketleme ve iade koşulları. 14 gün içinde açılmamış ürünlerde iade garantisi.",
  keywords: ['pekefe teslimat', 'iade politikası', 'soğuk zincir kargo', 'kargo süresi', 'ücretsiz kargo'],
  openGraph: {
    title: 'Teslimat ve İade Politikası | Pekefe',
    description: "Pekefe teslimat süreci ve iade koşulları. 14 günde iade garantisi.",
    url: 'https://www.pekefe.com/teslimat',
  },
  alternates: { canonical: 'https://www.pekefe.com/teslimat' },
};

export default function TeslimatLayout({ children }) {
  return children;
}
