// Hesap, gizlilik, sozlesme, teslimat sayfaları — noindex
export const metadata = {
  title: 'Hesabım',
  description: "Pekefe müşteri hesabınız. Siparişlerinizi, adreslerinizi ve hesap bilgilerinizi yönetin.",
  robots: { index: false, follow: false },
};

export default function HesapLayout({ children }) {
  return children;
}
