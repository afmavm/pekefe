/**
 * robots.js — PEKEFE İspir Yöresel Ürünler Platformu (pekefe.com)
 * Next.js App Router tarafından otomatik olarak /robots.txt endpoint'ine dönüştürülür.
 */

export default function robots() {
  const disallowedPrivateRoutes = [
    '/hesap',
    '/hesap/',
    '/hesabim',
    '/hesabim/',
    '/sepet',
    '/sepet/',
    '/giris',
    '/login',
    '/kayit',
    '/reset-password',
    '/admin',
    '/admin/',
    '/api/',
    '/_next/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/llms.txt',
          '/rekolte-kulubu',
          '/mensei-dogrulama',
          '/akademi',
          '/tadim-odasi',
          '/kategoriler',
          '/hikayemiz',
          '/tesisimiz',
          '/galeri',
          '/blog',
          '/blog/',
          '/sss',
          '/iletisim',
          '/kampanyalar',
          '/teslimat',
          '/gizlilik',
          '/sozlesme',
          '/urun/',
        ],
        disallow: disallowedPrivateRoutes,
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: ['/', '/llms.txt', '/urun/', '/kategoriler', '/hikayemiz', '/tesisimiz', '/sss', '/blog/'],
        disallow: disallowedPrivateRoutes,
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot', 'BLEXBot'],
        disallow: '/',
      },
    ],
    sitemap: 'https://www.pekefe.com/sitemap.xml',
    host: 'https://www.pekefe.com',
  };
}
