/**
 * manifest.js — PEKEFE Gastronomi Platformu
 * Next.js App Router tarafından otomatik olarak /manifest.json endpoint'ine dönüştürülür.
 * Mobil cihazlarda "Ana Ekrana Ekle" (PWA) desteği sağlar.
 */

export default function manifest() {
  return {
    name: 'Pekefe — Doğanın En Saf Hali',
    short_name: 'Pekefe',
    description: "İspir'in eşsiz doğasından sofranıza uzanan, katkısız ve geleneksel yöntemlerle hazırlanan yöresel ürünler.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F9FF',
    theme_color: '#610000',
    lang: 'tr',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
