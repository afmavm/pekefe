// SSS sayfası için SEO metadata
export const metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: "Pekefe ürünleri, sipariş süreci, teslimat, iade koşulları, coğrafi işaret ve B2B toptan sipariş hakkında merak ettiğiniz her şey.",
  keywords: ['pekefe sss', 'sıkça sorulan sorular', 'sipariş', 'teslimat', 'iade', 'toptan sipariş'],
  openGraph: {
    title: 'Sıkça Sorulan Sorular | Pekefe',
    description: "Pekefe ürünleri, sipariş, teslimat ve iade hakkında merak ettiğiniz her şey.",
    url: 'https://www.pekefe.com/sss',
  },
  alternates: { canonical: 'https://www.pekefe.com/sss' },
};

export default function SssLayout({ children }) {
  return children;
}
