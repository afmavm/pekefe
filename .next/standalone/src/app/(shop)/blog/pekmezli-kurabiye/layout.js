// Blog yazısı: Pekmezli Kurabiye tarifi için SEO metadata
export const metadata = {
  title: 'Pekmezli Kurabiye Tarifi',
  description: "İspir Dut Pekmezi ile yapılan geleneksel pekmezli kurabiye tarifi. Adım adım, ekşi mayasız, doğal ve lezzetli bir Anadolu klasiği.",
  keywords: ['pekmezli kurabiye', 'dut pekmezi tarifi', 'geleneksel kurabiye', 'ispir pekmezi', 'anadolu tatlıları'],
  openGraph: {
    type: 'article',
    title: 'Pekmezli Kurabiye Tarifi | Pekefe Blog',
    description: "İspir Dut Pekmezi ile yapılan geleneksel pekmezli kurabiye tarifi. Adım adım Anadolu klasiği.",
    url: 'https://www.pekefe.com/blog/pekmezli-kurabiye',
    publishedTime: '2024-10-01T00:00:00.000Z',
    authors: ['Pekefe Mutfak'],
    tags: ['tarif', 'pekmez', 'kurabiye', 'anadolu mutfağı'],
  },
  alternates: { canonical: 'https://www.pekefe.com/blog/pekmezli-kurabiye' },
};

export default function PekmezliKurabiyeLayout({ children }) {
  return children;
}
