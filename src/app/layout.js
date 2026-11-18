import "./globals.css";
import JsonLd from "@/components/seo/JsonLd";
import AnalyticsScripts from "@/components/seo/AnalyticsScripts";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const playfair = { variable: "font-playfair" };
const manrope = { variable: "font-manrope" };

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6b1d2f",
};

export const metadata = {
  metadataBase: new URL("https://www.pekefe.com"),
  applicationName: "PEKEFE",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PEKEFE",
  },
  title: {
    default: "PEKEFE | Geleneksel İspir Dut Gün Pekmezi, Pestil & Cevizli Köme",
    template: "%s | PEKEFE İspir Yöresel Ürünler",
  },
  description: "2014'ten bu yana İspir yaylalarından sofranıza uzanan; yüksek ateşte kaynatılmadan güneşin doğal sıcaklığıyla yoğunlaştırılan %100 doğal İspir dut pekmezi, yaprak dut pestili, cevizli köme ve dut sirkesi.",
  keywords: [
    "İspir Dut Pekmezi",
    "İspir Gün Pekmezi",
    "Pekefe",
    "İspir Kömesi",
    "Cevizli Sucuk",
    "Yaprak Dut Pestili",
    "Doğal Dut Sirkesi",
    "Erzurum İspir Yöresel Ürünler",
    "Geleneksel Pekmez",
    "Katkısız Dut Pekmezi",
  ],
  authors: [{ name: "PEKEFE İspir Yöresel Ürünler" }],
  creator: "PEKEFE İspir Yöresel Ürünler",
  publisher: "PEKEFE İspir Yöresel Ürünler",
  verification: {
    google: "QTYkkg0-x4Z8s5nuv0Qg3T0ePXA35ZhKuLp0ryCXS2s",
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", type: "image/png" },
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://www.pekefe.com",
    languages: {
      "tr-TR": "https://www.pekefe.com",
    },
  },
  openGraph: {
    title: "PEKEFE | Geleneksel İspir Dut Gün Pekmezi, Pestil & Cevizli Köme",
    description: "İspir yaylalarından geleneksel yöntemlerle, güneşin doğal sıcaklığında yoğunlaştırılarak hazırlanan %100 saf dut pekmezi, yaprak pestil ve cevizli köme koleksiyonu.",
    url: "https://www.pekefe.com",
    siteName: "PEKEFE İspir Yöresel Ürünler",
    images: [
      {
        url: "https://www.pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg",
        width: 1200,
        height: 630,
        alt: "PEKEFE Geleneksel İspir Dut Gün Pekmezi Kavanozu",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PEKEFE | Geleneksel İspir Dut Gün Pekmezi, Pestil & Köme",
    description: "%100 Katkısız, İspir yaylalarından güneş altında doğal olarak yoğunlaştırılan geleneksel dut pekmezi, pestil ve cevizli köme.",
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
  name: "PEKEFE İspir Yöresel Ürünler",
  alternateName: "Pekefe",
  url: "https://www.pekefe.com",
  logo: "https://www.pekefe.com/logo.png",
  description: "2014'ten bu yana İspir yaylalarında güneşin doğal sıcaklığıyla geleneksel dut pekmezi, yaprak dut pestili, cevizli İspir Kömesi ve doğal dut sirkesi üreten Erzurum İspir merkezli gıda firması.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Çamlıca Mahallesi",
    addressLocality: "İspir",
    addressRegion: "Erzurum",
    postalCode: "25900",
    addressCountry: "TR",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+90-534-270-91-40",
    contactType: "customer service",
    availableLanguage: ["Turkish"],
    email: "info@pekefe.com",
  },
  sameAs: [
    "https://www.instagram.com/ulkuefe255",
    "https://www.facebook.com/ulkuefe255",
    "https://youtube.com/@pekefe",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PEKEFE İspir Yöresel Ürünler",
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
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-icon.png" sizes="512x512" />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="min-h-full flex flex-col bg-surface font-body-md text-on-surface overflow-x-hidden">
        <AuthProvider>
          {children}
          <PwaRegister />
          <AnalyticsScripts />
        </AuthProvider>
      </body>
    </html>
  );
}
