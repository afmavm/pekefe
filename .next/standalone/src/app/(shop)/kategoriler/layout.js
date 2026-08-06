// Ürünler & Kategoriler sayfası için SEO metadata
export const metadata = {
  title: 'Ürün Koleksiyonları',
  description: "İspir Dut Kömesi, Organik Dut Pekmezi, Erzurum Çiçek Balı ve tüm yöresel lezzetlerimizi keşfedin. Coğrafi işaretli, katkısız ve geleneksel üretim.",
  keywords: ['ispir kömesi', 'dut pekmezi', 'organik bal', 'yöresel ürün koleksiyonu', 'kategoriler'],
  openGraph: {
    title: 'Ürün Koleksiyonları | Pekefe',
    description: "İspir Dut Kömesi, Organik Dut Pekmezi, Erzurum Çiçek Balı ve tüm yöresel lezzetlerimizi keşfedin.",
    url: 'https://www.pekefe.com/kategoriler',
  },
  alternates: { canonical: 'https://www.pekefe.com/kategoriler' },
};

export default function KategorilerLayout({ children }) {
  return children;
}
