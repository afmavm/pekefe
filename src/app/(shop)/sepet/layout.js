// Sepet & ödeme sayfaları noindex — checkout güvenliği
export const metadata = {
  title: 'Sepetim',
  description: "Pekefe alışveriş sepetiniz.",
  robots: { index: false, follow: false },
};

export default function SepetLayout({ children }) {
  return children;
}
