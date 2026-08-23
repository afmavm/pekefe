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
  images: {
    unoptimized: true,
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
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
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
      {
        source: "/_next/static/:path*",
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
