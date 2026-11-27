/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  serverExternalPackages: ["iyzipay", "@prisma/client"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  images: {
    unoptimized: true,
    qualities: [75, 100],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin/products",
        destination: "/admin/stock",
        permanent: true,
      },
      {
        source: "/admin/products/new",
        destination: "/admin/stock/form",
        permanent: true,
      },
      {
        source: "/admin/products/create",
        destination: "/admin/stock/form",
        permanent: true,
      },
      {
        source: "/admin/stock/new",
        destination: "/admin/stock/form",
        permanent: true,
      },
      {
        source: "/admin/stock/create",
        destination: "/admin/stock/form",
        permanent: true,
      },
      {
        source: "/admin/products/form",
        destination: "/admin/stock/form",
        permanent: true,
      },
      {
        source: "/gizlilik-politikasi",
        destination: "/gizlilik",
        permanent: true,
      },
      {
        source: "/kvkk",
        destination: "/gizlilik",
        permanent: true,
      },
      {
        source: "/kullanim-sartlari",
        destination: "/sozlesme",
        permanent: true,
      },
      // Eski Google Search Console'da indekslenmiş ürün URL'leri -> 301 kalıcı yönlendirme
      {
        source: "/urun/sade-pestil",
        destination: "/urun/pekefe-sade-dut-pestili",
        statusCode: 301,
      },
      {
        source: "/urun/ispir-kome",
        destination: "/urun/pekefe-ispir-dut-komesi-cevizli",
        statusCode: 301,
      },
      {
        source: "/urun/cevizli-pestil",
        destination: "/urun/pekefe-cevizli-dut-pestili",
        statusCode: 301,
      },
      {
        source: "/urun/dut-pekmezi",
        destination: "/urun/pekefe-ispir-dut-pekmezi",
        statusCode: 301,
      },
      {
        source: "/urun/karadut-pekmezi",
        destination: "/urun/pekefe-ispir-karadut-pekmezi",
        statusCode: 301,
      },
      {
        source: "/urun/pekefe-geleneksel-ispir-dut-gun-pekmezi",
        destination: "/urun/pekefe-ispir-dut-pekmezi",
        statusCode: 301,
      },
      {
        source: "/urun/pekefe-geleneksel-ispir-cevizli-kome-cevizli-sucuk",
        destination: "/urun/pekefe-ispir-dut-komesi-cevizli",
        statusCode: 301,
      },
      {
        source: "/urun/pekefe-hakiki-yaprak-dut-pestili",
        destination: "/urun/pekefe-sade-dut-pestili",
        statusCode: 301,
      },
      {
        source: "/mesafeli-satis-sozlesmesi",
        destination: "/sozlesme",
        permanent: true,
      },
      {
        source: "/iptal-iade-kosullari",
        destination: "/teslimat",
        permanent: true,
      },
      {
        source: "/hesabim",
        destination: "/hesap",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/paytr_callback.php",
          destination: "/api/webhooks/paytr",
        },
        {
          source: "/callback.php",
          destination: "/api/webhooks/paytr",
        },
        {
          source: "/uploads/:path*",
          destination: "/api/uploads/:path*",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/((?!_next/static|_next/image|uploads|favicon.ico|.*\\.).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
