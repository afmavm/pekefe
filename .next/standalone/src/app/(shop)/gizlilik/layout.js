// Gizlilik Politikası — indexlenebilir
export const metadata = {
  title: 'Gizlilik Politikası',
  description: "Pekefe gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğu hakkında KVKK uyumlu bilgilendirme.",
  keywords: ['pekefe gizlilik', 'kvkk', 'kişisel veri', 'çerez politikası', 'gizlilik sözleşmesi'],
  openGraph: {
    title: 'Gizlilik Politikası | Pekefe',
    description: "KVKK uyumlu gizlilik politikamız hakkında bilgi alın.",
    url: 'https://www.pekefe.com/gizlilik',
  },
  alternates: { canonical: 'https://www.pekefe.com/gizlilik' },
};

export default function GizlilikLayout({ children }) {
  return children;
}
