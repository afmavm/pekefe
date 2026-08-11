// Galeri sayfası için SEO metadata
export const metadata = {
  title: 'Galeri',
  description: "İspir yaylalarının hasatından üretim sürecine uzanan fotoğraf ve video galerimiz. TRT Belgeseli, hasat anları ve Pekefe tesisinden kareler.",
  keywords: ['pekefe galeri', 'ispir hasat', 'dut pekmezi üretim', 'trt belgeseli', 'pekefe tesis fotoğraf'],
  openGraph: {
    title: 'Galeri | Pekefe',
    description: "İspir yaylalarından üretim sürecine fotoğraf ve video galerimiz. TRT Belgeseli ve hasat anları.",
    url: 'https://www.pekefe.com/galeri',
  },
  alternates: { canonical: 'https://www.pekefe.com/galeri' },
};

export default function GaleriLayout({ children }) {
  return children;
}
