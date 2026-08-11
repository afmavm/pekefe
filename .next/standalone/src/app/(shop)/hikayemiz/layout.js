// Hikayemiz sayfası için SEO metadata
export const metadata = {
  title: 'Hikayemiz',
  description: "1987'den bu yana Erzurum İspir'in yüksek yaylalarında büyüyen bir ailenin ve geleneksel üretim tutkusunun hikayesi. İlhan Efe ve Pekefe'nin köklerine yolculuk.",
  keywords: ['pekefe hikayesi', 'ispir', 'erzurum', 'ilhan efe', 'geleneksel üretim', 'anadolu gastronomisi'],
  openGraph: {
    title: 'Hikayemiz | Pekefe',
    description: "1987'den bu yana Erzurum İspir'in yüksek yaylalarında büyüyen bir ailenin ve geleneksel üretim tutkusunun hikayesi.",
    url: 'https://www.pekefe.com/hikayemiz',
  },
  alternates: { canonical: 'https://www.pekefe.com/hikayemiz' },
};

export default function HikayemizLayout({ children }) {
  return children;
}
