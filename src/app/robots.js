/**
 * robots.js — PEKEFE İspir Yöresel Ürünler Platformu
 * Next.js App Router tarafından otomatik olarak /robots.txt endpoint'ine dönüştürülür.
 */

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
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
        disallow: [
          '/hesap',
          '/hesap/',
          '/sepet',
          '/sepet/',
          '/giris',
          '/kayit',
          '/b2b',
          '/admin',
          '/admin/',
          '/api/',
          '/_next/',
        ],
      },
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
          'BLEXBot',
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://www.pekefe.com/sitemap.xml',
    host: 'https://www.pekefe.com',
  };
}
