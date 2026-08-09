import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/seo/JsonLd";
import { AuthProvider } from "@/components/providers/AuthProvider";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  metadataBase: new URL("https://www.pekefe.com"),
  title: {
    default: "PEKEFE | Geleneksel İspir Yaylası Dut Pekmezi & Ham Çiçek Balı",
    template: "%s | PEKEFE Geleneksel Gastronomi",
  },
  description: "İspir'in 2200m+ rakımlı el değmemiş yaylalarından sofranıza uzanan, bakır kazanlarda ağır ağır üretilen %100 doğal ham dut pekmezi, ham bal ve yöresel lezzetler.",
  keywords: [
    "İspir Dut Pekmezi",
    "Pekefe",
    "Geleneksel Pekmez",
    "Kaçkar Ham Balı",
    "Coğrafi İşaretli Pekmez",
    "Organik Dut Pekmezi",
    "Erzurum Yöresel Ürünler",
    "Ham Çiçek Balı",
    "İspir Kömesi",
    "Gıda Zanaatı",
  ],
  authors: [{ name: "PEKEFE Gastronomi A.Ş." }],
  creator: "PEKEFE Gastronomi",
  publisher: "PEKEFE Gastronomi",
  verification: {
    google: "QTYkkg0-x4Z8s5nuv0Qg3T0ePXA35ZhKuLp0ryCXS2s",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://www.pekefe.com",
    languages: {
      "tr-TR": "https://www.pekefe.com",
      "en-US": "https://www.pekefe.com/en",
    },
  },
  openGraph: {
    title: "PEKEFE | Doğanın En Saf Hali - İspir Dut Pekmezi & Ham Bal",
    description: "İspir'in 2200m rakımlı yaylalarından geleneksel yöntemlerle hazırlanan %100 doğal ham dut pekmezi ve ham bal koleksiyonu.",
    url: "https://www.pekefe.com",
    siteName: "PEKEFE Gastronomi",
    images: [
      {
        url: "https://www.pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg",
        width: 1200,
        height: 630,
        alt: "PEKEFE Geleneksel İspir Dut Pekmezi Kavanozu",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PEKEFE | Geleneksel İspir Dut Pekmezi & Ham Bal",
    description: "%100 Katkısız, 2200m rakımlı İspir yaylalarından odun ateşinde ağır ağır üretilen sınırlı rekolte lezzetler.",
    images: ["https://www.pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg"],
    creator: "@pekefe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PEKEFE Gastronomi",
  url: "https://www.pekefe.com",
  logo: "https://www.pekefe.com/logo.png",
  description: "İspir yaylası geleneksel dut pekmezi, ham çiçek balı ve yöresel gastronomi ürünleri üreticisi.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Kayseri OSB 1. Cadde No: 5",
    addressLocality: "Kayseri",
    addressRegion: "Kayseri",
    postalCode: "38070",
    addressCountry: "TR",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+90-850-000-0000",
    contactType: "customer service",
    availableLanguage: ["Turkish", "English"],
  },
  sameAs: [
    "https://www.instagram.com/pekefe",
    "https://www.facebook.com/pekefe",
    "https://twitter.com/pekefe",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PEKEFE Gastronomi",
  url: "https://www.pekefe.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.pekefe.com/kategoriler?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr"
      className={`${playfair.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <meta name="google-site-verification" content="QTYkkg0-x4Z8s5nuv0Qg3T0ePXA35ZhKuLp0ryCXS2s" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="min-h-full flex flex-col bg-surface font-body-md text-on-surface">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
