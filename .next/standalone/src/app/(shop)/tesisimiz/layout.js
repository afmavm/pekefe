// Tesisimiz sayfası için SEO metadata
export const metadata = {
  title: 'Tesisimiz',
  description: "ISO 9001, ISO 22000 ve Helal sertifikalı üretim tesisimizi keşfedin. Vakumlu düşük sıcaklık teknolojisi ile HMF değeri sıfıra yakın, laboratuvar onaylı üretim.",
  keywords: ['pekefe tesis', 'iso 9001', 'iso 22000', 'helal sertifikası', 'vakumlu üretim', 'gıda güvenliği'],
  openGraph: {
    title: 'Tesisimiz | Pekefe',
    description: "ISO 9001, ISO 22000 ve Helal sertifikalı üretim tesisimizi keşfedin. Vakumlu düşük sıcaklık teknolojisi ile laboratuvar onaylı üretim.",
    url: 'https://www.pekefe.com/tesisimiz',
  },
  alternates: { canonical: 'https://www.pekefe.com/tesisimiz' },
};

export default function TesisimizLayout({ children }) {
  return children;
}
