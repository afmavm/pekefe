// Kullanıcı Sözleşmesi — indexlenebilir
export const metadata = {
  title: 'Kullanıcı Sözleşmesi',
  description: "Pekefe kullanıcı sözleşmesi ve mesafeli satış sözleşmesi. Alışveriş öncesinde lütfen okuyunuz.",
  keywords: ['pekefe kullanıcı sözleşmesi', 'mesafeli satış', 'satış koşulları', 'kullanım şartları'],
  openGraph: {
    title: 'Kullanıcı Sözleşmesi | Pekefe',
    description: "Pekefe kullanıcı ve mesafeli satış sözleşmesi.",
    url: 'https://www.pekefe.com/sozlesme',
  },
  alternates: { canonical: 'https://www.pekefe.com/sozlesme' },
};

export default function SozlesmeLayout({ children }) {
  return children;
}
