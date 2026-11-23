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
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/llms.txt',
          '/google-merchant.xml',
          '/api/feeds/google-merchant',
          '/rekolte-kulubu',
          '/mensei-dogrulama',
          '/akademi',
          '/tadim-odasi',
          '/kategoriler',
          '/pestil-cesitleri',
          '/pekmez-cesitleri',
          '/kome-cesitleri',
          '/yoresel-urunler',
          '/hediyelik-lezzetler',
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
