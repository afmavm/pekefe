/**
 * manifest.js — PEKEFE Gastronomi Platformu
 * Next.js App Router tarafından otomatik olarak /manifest.json endpoint'ine dönüştürülür.
 * Mobil cihazlarda "Ana Ekrana Ekle" (PWA) desteği sağlar.
 */

export default function manifest() {
  return {
    name: 'PEKEFE',
    short_name: 'PEKEFE',
    description: "İspir'in 2200m+ rakımlı el değmemiş yaylalarından sofranıza uzanan, yüksek ateşte kaynatılmadan güneşin doğal sıcaklığıyla yoğunlaştırılan %100 doğal İspir dut gün pekmezi, yaprak pestil ve cevizli köme.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#faf8f5',
    theme_color: '#6b1d2f',
    lang: 'tr',
    dir: 'ltr',
    categories: ['shopping', 'food', 'lifestyle', 'business'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      }
    ],
    shortcuts: [
      {
        name: 'Doğal Mağaza',
        short_name: 'Mağaza',
        description: 'PEKEFE doğal dut pekmezi ve bal ürünlerini keşfedin',
        url: '/',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Kategoriler',
        short_name: 'Kategoriler',
        description: 'Tüm yöresel ürün kategorileri',
        url: '/kategoriler',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'B2B Bayi Portalı',
        short_name: 'B2B Bayi',
        description: 'Toptan sipariş ve kurumsal bayi girişi',
        url: '/b2b',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Siparişlerim',
        short_name: 'Siparişler',
        description: 'Geçmiş siparişlerinizi ve kargo durumunuzu inceleyin',
        url: '/hesap',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      }
    ],
    screenshots: [
      {
        src: '/ispir-manzara-hero.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'PEKEFE İspir Yaylaları Doğal Üretim'
      },
      {
        src: '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
        sizes: '750x1334',
        type: 'image/jpeg',
        form_factor: 'narrow',
        label: 'Geleneksel İspir Dut Pekmezi'
      }
    ]
  };
}
