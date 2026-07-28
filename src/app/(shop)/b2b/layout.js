// B2B Bayi Portalı için SEO metadata
export const metadata = {
  title: 'B2B Bayi Portalı',
  description: "Pekefe toptan satış ve kurumsal bayi portalı. Restoran, otel, organik market ve ihracat firmalarına özel koli fiyatları, Platinum Bayi ayrıcalıkları.",
  keywords: ['pekefe toptan', 'b2b bayi', 'kurumsal sipariş', 'toptan pekmez', 'toptan bal', 'wholesale'],
  openGraph: {
    title: 'B2B Bayi Portalı | Pekefe',
    description: "Pekefe kurumsal bayi portalı. Toptan koli fiyatları ve Platinum Bayi ayrıcalıkları.",
    url: 'https://www.pekefe.com/b2b',
  },
  robots: { index: false, follow: false }, // B2B portalı arama motorlarına kapalı
  alternates: { canonical: 'https://www.pekefe.com/b2b' },
};

export default function B2bLayout({ children }) {
  return children;
}
