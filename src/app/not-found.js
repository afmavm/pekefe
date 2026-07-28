import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Sayfa Bulunamadı — 404",
  description: "Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı kalmış olabilir.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-1 flex items-center justify-center py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <span className="font-display-lg text-8xl font-bold text-primary/20 block tracking-tighter">
            404
          </span>
          <div className="space-y-3">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold block">
              Kaybolmuş Gibisiniz
            </span>
            <h1 className="font-display-lg text-3xl md:text-headline-lg text-primary font-bold">
              Aradığınız Lezzet İzimizi Bulamadık
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Ulaşmaya çalıştığınız sayfa taşınmış veya silinmiş olabilir. Sizi İspir yaylalarının taze ürünler koleksiyonuna geri götürelim.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="bg-primary text-white px-8 py-4 rounded-xl font-label-md uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              Ana Sayfaya Dön
            </Link>
            <Link
              href="/kategoriler"
              className="bg-surface-container-high border border-outline-variant/30 text-on-surface px-8 py-4 rounded-xl font-label-md uppercase tracking-wider hover:bg-surface-container-highest transition-all active:scale-95"
            >
              Koleksiyonları İncele
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
