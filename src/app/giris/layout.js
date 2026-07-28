// Giriş sayfası — noindex
export const metadata = {
  title: 'Giriş Yap | Pekefe',
  description: "Pekefe hesabınıza giriş yapın.",
  robots: { index: false, follow: false },
};

export default function GirisLayout({ children }) {
  return children;
}
