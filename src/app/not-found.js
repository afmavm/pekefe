import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CMSProvider } from "@/context/CMSContext";

export const metadata = {
  title: "Sayfa Bulunamadı (404) | PEKEFE İspir Yöresel Ürünler",
  description: "Aradığınız sayfa taşınmış veya kaldırılmış olabilir. PEKEFE'nin geleneksel İspir dut pekmezi, yaprak dut pestili ve cevizli köme koleksiyonlarını keşfedin.",
  robots: { index: false, follow: true },
};

const POPULAR_CATEGORIES = [
  {
    title: "İspir Dut Gün Pekmezi",
    desc: "Güneşin doğal sıcaklığıyla yoğunlaştırılan geleneksel pekmez",
    href: "/urun/pekefe-geleneksel-ispir-dut-gun-pekmezi",
    icon: "sunny",
  },
  {
    title: "Hakiki Yaprak Dut Pestili",
    desc: "Keten bez sergilerde kurutulan %100 saf İspir dut pestili",
    href: "/urun/pekefe-hakiki-yaprak-dut-pestili",
    icon: "eco",
  },
  {
    title: "Geleneksel Cevizli İspir Kömesi",
    desc: "Yerli İspir cevizi ve dut şırası banyosuyla hazırlanan köme",
    href: "/urun/pekefe-geleneksel-ispir-cevizli-kome-cevizli-sucuk",
    icon: "workspace_premium",
  },
  {
    title: "Doğal Fermantasyon Dut Sirkesi",
    desc: "Canlı sirke anası ile geleneksel yavaş fermantasyon",
    href: "/urun/pekefe-dogal-fermantasyon-ispir-dut-sirkesi",
    icon: "science",
  },
];

export default function NotFound() {
  return (
    <CMSProvider>
      <div className="min-h-screen flex flex-col bg-surface text-on-surface">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-3xl mx-auto text-center space-y-10">
            <div className="space-y-3">
              <span className="font-display-lg text-7xl md:text-8xl font-black text-primary/20 block tracking-tighter">
                404
              </span>
              <span className="text-secondary font-label-md text-xs uppercase tracking-[0.2em] font-extrabold block">
                İspir Yaylalarında Yolunuzu mu Kaybettiniz?
              </span>
              <h1 className="font-display-lg text-3xl md:text-4xl text-primary font-bold">
                Aradığınız Sayfa Bulunamadı
              </h1>
              <p className="font-body-lg text-on-surface-variant max-w-lg mx-auto leading-relaxed text-sm md:text-base">
                Ulaşmaya çalıştığınız adres taşınmış, kaldırılmış veya hatalı yazılmış olabilir. Sizi İspir’in geleneksel ve doğal lezzet koleksiyonuna davet edelim.
              </p>
            </div>

            {/* Popüler Ürün & Kategori Kısayolları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {POPULAR_CATEGORIES.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 shadow-xs hover:shadow-md transition-all flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/"
                className="bg-primary text-white px-8 py-4 min-h-[48px] rounded-xl font-label-md text-xs font-extrabold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md active:scale-95 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">home</span>
                Ana Sayfaya Dön
              </Link>
              <Link
                href="/kategoriler"
                className="bg-surface-container-high border border-outline-variant/30 text-on-surface px-8 py-4 min-h-[48px] rounded-xl font-label-md text-xs font-extrabold uppercase tracking-wider hover:bg-surface-container-highest transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">storefront</span>
                Tüm Ürünleri İncele
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </CMSProvider>
  );
}
