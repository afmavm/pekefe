// Kampanyalar sayfası için SEO metadata
export const metadata = {
  title: 'Kampanyalar & Özel Koleksiyonlar',
  description: "Pekefe hasat festivali, Pekefe Dostu kulüp ayrıcalıkları ve sezonluk ürün lansmanları. İspir'den gelen en taze yöresel lezzetleri kaçırmayın.",
  keywords: ['pekefe kampanyalar', 'hasat festivali', 'pekefe dostu', 'sezonluk ürünler', 'yöresel kampanya'],
  openGraph: {
    title: 'Kampanyalar & Özel Koleksiyonlar | Pekefe',
    description: "Hasat festivali, Pekefe Dostu kulüp ayrıcalıkları ve sezonluk yöresel lezzetler.",
    url: 'https://www.pekefe.com/kampanyalar',
  },
  alternates: { canonical: 'https://www.pekefe.com/kampanyalar' },
};

export default function KampanyalarLayout({ children }) {
  return children;
}
