// Kayıt sayfası — noindex
export const metadata = {
  title: 'Hesap Oluştur | Pekefe',
  description: "Pekefe'ye üye olun, Pekefe Dostu kulübüne katılın ve ayrıcalıklı alışveriş deneyiminin keyfini çıkarın.",
  robots: { index: false, follow: false },
};

export default function KayitLayout({ children }) {
  return children;
}
