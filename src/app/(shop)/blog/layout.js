// Blog sayfası için SEO metadata
export const metadata = {
  title: 'Blog & Tarifler',
  description: "Anadolu mutfağı üzerine makaleler, geleneksel tarifler, hasat günlükleri ve İspir'den hikayeler. PEKEFE içerik arşivi.",
  keywords: ['pekefe blog', 'anadolu mutfağı', 'yöresel tarifler', 'ispir', 'pekmez tarifi', 'hasat'],
  openGraph: {
    title: 'Blog & Tarifler | Pekefe',
    description: "Anadolu mutfağı üzerine makaleler, geleneksel tarifler ve İspir'den hikayeler.",
    url: 'https://www.pekefe.com/blog',
  },
  alternates: { canonical: 'https://www.pekefe.com/blog' },
};

export default function BlogLayout({ children }) {
  return children;
}
