"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Tesisimiz() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll("section > div, header > div.relative");
    animatedElements.forEach((el) => {
      el.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-10");
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased">
      {/* Hero Section */}
      <header className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            alt="Pekefe İspir Üretim Tesisi"
            className="object-cover object-center brightness-[0.65] scale-102"
            src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
            fill
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-transparent z-10"></div>
        </div>
        <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto flex flex-col items-center">
          <span className="font-label-md text-label-sm text-secondary tracking-[0.2em] uppercase mb-4 bg-black/40 px-5 py-2 rounded-full backdrop-blur-sm border border-secondary/30 text-xs font-bold">
            İspir, Erzurum
          </span>
          <h1 className="font-display-lg text-[38px] sm:text-[48px] md:text-[64px] lg:text-[76px] text-white mb-8 drop-shadow-lg max-w-4xl leading-[1.1] font-bold">
            Modern Teknoloji ile Geleneksel Üretim
          </h1>
          <p className="font-body-lg text-white/95 max-w-3xl drop-shadow-md text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed">
            Doğanın sunduğu en saf lezzetleri, en yüksek standartlardaki tesisimizde, besin değerlerini kaybetmeden sizlere ulaştırıyoruz.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap space-y-section-gap">
        {/* Modern Teknoloji & Gelenek */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[48px] font-bold leading-tight">
              Vakum Altında Üretim
            </h2>
            <div className="w-16 h-1 bg-secondary rounded-full mb-6"></div>
            <div className="space-y-6 text-on-surface-variant leading-relaxed text-base sm:text-lg lg:text-[18px]">
              <p>
                Geleneksel pekmez üretiminde yüksek ateşte kaynatma işlemi, meyvenin içindeki vitamin ve minerallerin büyük bir kısmının kaybolmasına neden olur. Ayrıca yüksek ısıda kaynatma işlemi, HMF (Hidroksimetilfurfural) adı verilen ve sağlığı olumsuz etkileyen bileşenlerin oluşumuna yol açabilir.
              </p>
              <p>
                Pekefe olarak biz, İspir'deki modern tesisimizde <strong className="text-primary font-bold">"Vakum Altında Pişirme"</strong> teknolojisini kullanıyoruz. Bu yöntem sayesinde, ürünlerimizi 60-65 dereceyi geçmeyen düşük ısılarda, kapalı sistemlerde üretiyoruz. Böylece meyvenin doğal yapısı, mineral ve vitamin değerleri korunurken, kanserojen HMF oluşumu tamamen engellenir ve besin değerleri en üst seviyede kalır.
              </p>
            </div>
            <div className="pt-4 flex gap-4">
              <div className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(139,0,0,0.04)] border border-outline-variant/35 flex-1 hover:border-secondary/20 transition-all duration-300">
                <span className="material-symbols-outlined text-4xl text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                  thermostat
                </span>
                <span className="font-label-md text-primary text-center font-bold leading-tight">
                  Düşük Isı
                  <br />
                  <span className="text-secondary font-semibold text-xs sm:text-sm">(Maks 65°C)</span>
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(139,0,0,0.04)] border border-outline-variant/35 flex-1 hover:border-secondary/20 transition-all duration-300">
                <span className="material-symbols-outlined text-4xl text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                  health_and_safety
                </span>
                <span className="font-label-md text-primary text-center font-bold leading-tight">
                  %0 HMF
                  <br />
                  <span className="text-secondary font-semibold text-xs sm:text-sm">Garantisi</span>
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2 rounded-2xl overflow-hidden shadow-xl border border-outline-variant/20 relative h-[400px] sm:h-[500px] lg:h-[550px] group">
            <Image
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Pekefe Üretim Tesis İçi"
              src="/uploads/ispir-modern-hijyenik-tesis-dolum.webp"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </div>
        </section>

        {/* TKDK Destekli Tesis */}
        <section className="bg-surface-container-lowest rounded-3xl p-8 md:p-16 shadow-[0_8px_40px_rgba(139,0,0,0.03)] border border-outline-variant/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-container/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/3 flex justify-center">
              <Image
                className="object-contain drop-shadow-md"
                alt="Pekefe TKDK Onaylı Üretim"
                src="/logo.png"
                width={160}
                height={160}
              />
            </div>
            <div className="md:w-2/3 space-y-6">
              <h3 className="font-display-lg text-primary text-2xl sm:text-3xl lg:text-[36px] font-bold">
                TKDK Destekli Örnek Tesis
              </h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed text-base sm:text-lg lg:text-[18px]">
                Tesisimiz, Tarım ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK) standartlarına en üst seviyede uygun olarak inşa edilmiş ve onaylanmıştır. Bölgenin en kapsamlı ve modern üretim alanlarından biri olan tesisimiz, yerel kalkınmaya ve istihdama katkı sağlarken, aynı zamanda uluslararası kalite sertifikasyonlarında üretim yapma kapasitesine sahiptir.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/[0.08] text-secondary font-label-sm uppercase tracking-wider text-xs font-bold border border-secondary/20">
                  <span className="material-symbols-outlined text-[16px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>{" "}
                  ISO 9001
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/[0.08] text-secondary font-label-sm uppercase tracking-wider text-xs font-bold border border-secondary/20">
                  <span className="material-symbols-outlined text-[16px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>{" "}
                  ISO 22000
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/[0.08] text-secondary font-label-sm uppercase tracking-wider text-xs font-bold border border-secondary/20">
                  <span className="material-symbols-outlined text-[16px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>{" "}
                  Helal Sertifikası
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Hijyen Standartları (Bento Grid) */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[48px] font-bold">
              Tavizsiz Hijyen Standardı
            </h2>
            <p className="font-body-lg text-on-surface-variant text-base sm:text-lg">
              Üretimin her aşamasında en yüksek uluslararası gıda güvenliği standartlarını hassasiyetle uyguluyoruz.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Item 1 */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_30px_rgba(139,0,0,0.04)] border border-outline-variant/30 flex flex-col items-start hover:border-secondary/20 hover:-translate-y-1.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  sanitizer
                </span>
              </div>
              <h4 className="font-display-lg text-[22px] font-bold text-on-surface mb-3">Tam Otomasyon</h4>
              <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
                Ürünlerimiz, el değmeden, hijyenik ve kapalı sistem paslanmaz krom kazanlarda işlenir ve ambalajlanır.
              </p>
            </div>
            {/* Bento Item 2 */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_30px_rgba(139,0,0,0.04)] border border-outline-variant/30 flex flex-col items-start hover:border-secondary/20 hover:-translate-y-1.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  science
                </span>
              </div>
              <h4 className="font-display-lg text-[22px] font-bold text-on-surface mb-3">Laboratuvar Kontrolü</h4>
              <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
                Hammadde kabulünden dolum aşamasına kadar tüm serilerimiz akredite analizler ve testlerden geçmektedir.
              </p>
            </div>
            {/* Bento Item 3 */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_30px_rgba(139,0,0,0.04)] border border-outline-variant/30 flex flex-col items-start hover:border-secondary/20 hover:-translate-y-1.5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  ac_unit
                </span>
              </div>
              <h4 className="font-display-lg text-[22px] font-bold text-on-surface mb-3">İklimlendirme</h4>
              <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
                Üretim ve depolama alanlarımız, ürünlerin tazeliğini korumak için optimum nem ve sıcaklıkta sabit tutulur.
              </p>
            </div>
          </div>
        </section>

        {/* Galeri - Tesisimizden Kareler */}
        <section className="space-y-8 pt-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-secondary font-label-md text-xs uppercase tracking-[0.25em] font-bold block">
              ZANAAT VE HİJYEN
            </span>
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[48px] font-bold">
              Tesisimizden Kareler
            </h2>
            <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px]">
            {/* Main Facility Photo */}
            <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-md relative group border border-outline-variant/20">
              <Image
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Pekefe Steril Üretim ve Dolum Tesisimiz"
                src="/uploads/ispir-modern-hijyenik-tesis-dolum.webp"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6 z-10">
                <span className="text-white font-display-lg text-lg font-bold">Pekefe Steril Üretim ve Dolum Tesisimiz</span>
              </div>
            </div>

            {/* Harvest Photo */}
            <div className="rounded-2xl overflow-hidden shadow-md relative group border border-outline-variant/20">
              <Image
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                alt="İspir Dut Bahçesi Doğal Hasadı"
                src="/uploads/ispir_hikayemiz_baba_ogul_beyaz_dut.jpg"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 z-10">
                <span className="text-white text-xs font-bold font-body">İspir Dut Bahçesi Hasadı</span>
              </div>
            </div>

            {/* Copper Cauldron Photo */}
            <div className="rounded-2xl overflow-hidden shadow-md relative group border border-outline-variant/20">
              <Image
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Odun Ateşinde Bakır Kazanlar"
                src="/uploads/ispir-bakir-kazan-ahsap-cendere.webp"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 z-10">
                <span className="text-white text-xs font-bold font-body">Odun Ateşi Bakır Kazanlar</span>
              </div>
            </div>

            {/* Linen Sun Drying Photo */}
            <div className="col-span-2 rounded-2xl overflow-hidden shadow-md relative group border border-outline-variant/20">
              <Image
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Güneşte Keten Bezde Pestil Kurutma"
                src="/uploads/ispir-keten-bezde-pestil-serimi.webp"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6 z-10">
                <span className="text-white font-display-lg text-lg font-bold">Keten Bezlerde Güneşte Doğal Kurutma</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
