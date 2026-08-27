import ShopClientLayout from "@/components/providers/ShopClientLayout";

export const metadata = {
  metadataBase: new URL('https://www.pekefe.com'),
  title: {
    default: 'Pekefe | Doğanın En Saf Hali',
    template: '%s | Pekefe'
  },
  description: "İspir'in eşsiz doğasından sofranıza uzanan, katkısız ve geleneksel yöntemlerle hazırlanan yöresel ürünler.",
  keywords: ['pekefe', 'ispir pekmezi', 'dut pekmezi', 'organik bal', 'yöresel ürünler', 'erzurum', 'coğrafi işaret'],
  authors: [{ name: 'PEKEFE İspir Yöresel Ürünler', url: 'https://www.pekefe.com' }],
  creator: 'PEKEFE İspir Yöresel Ürünler',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://www.pekefe.com',
    siteName: 'Pekefe',
    title: 'Pekefe | Doğanın En Saf Hali',
    description: "İspir'in eşsiz doğasından sofranıza uzanan, katkısız ve geleneksel yöntemlerle hazırlanan yöresel ürünler.",
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Pekefe — İspir Geleneksel Lezzetleri' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pekefe | Doğanın En Saf Hali',
    description: "İspir'in eşsiz doğasından sofranıza uzanan, katkısız ve geleneksel yöntemlerle hazırlanan yöresel ürünler.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: 'https://www.pekefe.com' },
};

export default function ShopLayout({ children }) {
  return (
    <ShopClientLayout>
      {children}
    </ShopClientLayout>
  );
}
