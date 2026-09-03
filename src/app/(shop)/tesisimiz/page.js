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

    const animatedElements = document.querySelectorAll(".reveal-element");
    animatedElements.forEach((el) => {
      el.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-10");
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-amber-200 selection:text-amber-900">
      
      {/* ─── HERO SECTION (Cinematic Editorial Header) ─── */}
      <header className="relative h-[65vh] min-h-[520px] max-h-[720px] flex items-center justify-center overflow-hidden">
        <Image
          src="/uploads/ispir-modern-hijyenik-tesis-dolum.webp"
          alt="PEKEFE İspir Modern Üretim ve Dolum Tesisi"
          fill
          priority
          sizes="100vw"
          className="object-cover filter brightness-[0.50] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#360e17]/90 via-[#360e17]/40 to-transparent z-10" />

        <div className="relative z-20 text-center px-4 md:px-8 max-w-4xl mx-auto space-y-5">
          <span className="inline-block text-amber-200 text-xs font-semibold tracking-[0.3em] uppercase px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
            İSPİR · ERZURUM · TKDK VE BAKANLIK ONAYLI TESİS
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.15] drop-shadow-md">
            Zanaatın ve Bilimin <br className="hidden md:block" /> Buluştuğu Butik Tesisimiz
          </h1>
          <p className="text-amber-100/90 max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed font-light drop-shadow">
            Doğanın sunduğu en saf lezzetleri, şırayı ateşte yakmadan İspir yayla güneşinin doğal sıcaklığı ve TKDK onaylı hijyen standartlarında geleceğe taşıyoruz.
          </p>
          <div className="w-16 h-[2px] bg-[#b45309] mx-auto rounded-full pt-1" />
        </div>
      </header>

      {/* ─── QUICK METRICS BAR ─── */}
      <section className="relative z-20 -mt-12 max-w-5xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-[#b45309] font-mono">Doğal Güneş</div>
            <div className="text-xs font-bold text-slate-800 dark:text-amber-100">Şırayı Yakmama</div>
            <div className="text-[11px] text-slate-500">Doğal Sıcaklık &amp; Kıvam</div>
          </div>
          <div className="space-y-1 border-l border-slate-100 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">&lt; 10 mg</div>
            <div className="text-xs font-bold text-slate-800 dark:text-amber-100">Kontrollü HMF</div>
            <div className="text-[11px] text-slate-500">Doğal Sıcaklıkla Koruma</div>
          </div>
          <div className="space-y-1 border-l border-slate-100 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-[#360e17] dark:text-amber-300 font-mono">2200m+</div>
            <div className="text-xs font-bold text-slate-800 dark:text-amber-100">Yayla Rakımı</div>
            <div className="text-[11px] text-slate-500">Saf Kaçkar Florası</div>
          </div>
          <div className="space-y-1 border-l border-slate-100 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">ISO 22000</div>
            <div className="text-xs font-bold text-slate-800 dark:text-amber-100">Gıda Güvenliği</div>
            <div className="text-[11px] text-slate-500">TKDK &amp; AB Onaylı</div>
          </div>
        </div>
      </section>

      {/* ─── CHAPTER I: VAKUM TEKNOLOJİSİ & BİLİMSEL SAFLIK ─── */}
      <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto reveal-element">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Visual Showcase (Kazanlar) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 group">
              <Image
                src="/uploads/ispir-bakir-kazan-ahsap-cendere.webp"
                alt="Geleneksel ve Modern Vakumlu Kazanlar"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent z-10" />
              <div className="absolute bottom-6 left-6 right-6 text-white z-20 space-y-1">
                <span className="text-amber-300 text-xs font-mono tracking-widest uppercase block font-bold">Kapalı Sistem · Düşük Sıcaklık</span>
                <h3 className="font-serif text-xl font-bold">Vakum Altında Yoğunlaştırma Ünitesi</h3>
                <p className="text-xs text-slate-200">Meyve şekeri yanmadan, berrak ve altın sarısı kıvamında üretilir.</p>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[#b45309] font-bold text-xs uppercase tracking-[0.25em] block">
              BÖLÜM I · ŞIRAYI YAKMADAN, DOĞAL SICAKLIKLA
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#360e17] dark:text-amber-100 leading-tight">
              Ateşte Yakarak Değil, <br />
              <span className="italic font-normal text-[#b45309]">Güneşin Doğal Sıcaklığıyla</span>
            </h2>
            <div className="w-12 h-[2px] bg-[#b45309]" />

            <div className="space-y-4 text-slate-600 dark:text-slate-300 text-base leading-relaxed">
              <p>
                Geleneksel açık kazanlarda 100°C'nin üzerinde yapılan kontrolsüz ve aşırı kaynatma, dut şırasındaki meyve şekerlerinin yanmasına yol açar. Yanmış meyve şekeri hem dutun o asil kokusunu acılaştırır hem de sağlığa zararlı <strong>HMF (5-Hidroksimetilfurfural)</strong> oranını artırır.
              </p>
              <p>
                Kurucumuz emekli öğretmen <strong>İlhan Efe</strong>'nin TRT Haber bültenlerinde dile getirdiği gibi: <em>"Tesiste pekmez şırasını yakmadan üretim yapıyoruz. Güneş ışığında uzun sürelerde ve doğal sıcaklık kullanarak pişiriyoruz."</em>
              </p>
              <p>
                Ayrıca üretim sonunda posa haline gelen dutlarımız kurutulup çuvallanarak <strong>hayvan yemi olarak yöre çiftçilerine kazandırılmakta</strong>, böylece tesisimizde sıfır atıklı döngüsel bir ekonomi işletilmektedir.
              </p>
            </div>

            {/* Comparison Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">wb_sunny</span> Güneşle Doğal Yoğunlaşma
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">Yanık riski olmadan dutun canlı meyve aroması ve vitaminleri korunur.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">recycling</span> Sıfır Atık &amp; Çiftçiye Destek
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">Dut posaları kurutularak doğal hayvan yemine dönüştürülür.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── CHAPTER II: TAVİZSİZ HİJYEN VE MÜHENDİSLİK ─── */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 reveal-element">
        <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[#b45309] font-bold text-xs uppercase tracking-[0.25em] block">
              BÖLÜM II · TAVİZSİZ STANDARTLAR
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#360e17] dark:text-amber-100">
              Gıda Güvenliği &amp; Mühendislik
            </h2>
            <div className="w-12 h-[2px] bg-[#b45309] mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Uluslararası ISO 22000 normlarına uygun, el değmeden üretim ve steril dolum altyapısı.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-[#FAF8F5] dark:bg-slate-950 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-[#b45309] flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">precision_manufacturing</span>
              </div>
              <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-amber-100">
                304L Paslanmaz Çelik Krom
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tüm pişirme kazanlarımız, boru hatlarımız ve dolum nozullarımız gıda normlarına uygun sertifikalı AISI 304L krom çelikten imal edilmiştir.
              </p>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-950 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">sanitizer</span>
              </div>
              <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-amber-100">
                HEPA Filtreli Temiz Oda
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Dolum ve ambalajlama salonlarımız pozitif basınçlı HEPA 14 hava filtrasyonu ile dış ortam toz, partikül ve bakterilerinden tamamen arındırılmıştır.
              </p>
            </div>

            <div className="bg-[#FAF8F5] dark:bg-slate-950 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">ac_unit</span>
              </div>
              <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-amber-100">
                İklimlendirmeli Akıllı Mahzen
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ürünlerimiz 18°C - 22°C sabit sıcaklık ve optimum nem kontrolü sağlanan karanlık dinlendirme mahzenlerimizde ilk günkü saflığıyla korunur.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ─── CHAPTER III: TESİSİMİZDEN VE HASATTAN KARELER (Editorial Gallery) ─── */}
      <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto reveal-element">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-[#b45309] font-bold text-xs uppercase tracking-[0.25em] block">
            BÖLÜM III · GÖRSEL ARŞİV
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#360e17] dark:text-amber-100">
            Tesisimizden ve Üretimimizden Kareler
          </h2>
          <div className="w-12 h-[2px] bg-[#b45309] mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          
          {/* Big Photo 1 */}
          <div className="md:col-span-2 rounded-3xl overflow-hidden shadow-lg relative group border border-slate-200/80 dark:border-slate-800">
            <Image
              src="/uploads/ispir-modern-hijyenik-tesis-dolum.webp"
              alt="PEKEFE Hijyenik Dolum ve Üretim Hattı"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 z-10">
              <span className="text-white font-serif text-lg font-bold">Steril Dolum ve Hijyen Hattı</span>
            </div>
          </div>

          {/* Photo 2 */}
          <div className="rounded-3xl overflow-hidden shadow-lg relative group border border-slate-200/80 dark:border-slate-800">
            <Image
              src="/uploads/ispir_hikayemiz_baba_ogul_beyaz_dut.jpg"
              alt="İspir Dut Bahçeleri Hasadı"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 z-10">
              <span className="text-white font-serif text-base font-bold">İspir Yaylası Doğal Hasadı</span>
            </div>
          </div>

          {/* Photo 3 */}
          <div className="rounded-3xl overflow-hidden shadow-lg relative group border border-slate-200/80 dark:border-slate-800">
            <Image
              src="/uploads/ispir-bakir-kazan-ahsap-cendere.webp"
              alt="Geleneksel Bakır Kazanlar"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 z-10">
              <span className="text-white font-serif text-base font-bold">Geleneksel Ahşap Cendere &amp; Bakır Kazanlar</span>
            </div>
          </div>

          {/* Big Photo 4 */}
          <div className="md:col-span-2 rounded-3xl overflow-hidden shadow-lg relative group border border-slate-200/80 dark:border-slate-800">
            <Image
              src="/uploads/ispir-keten-bezde-pestil-serimi.webp"
              alt="Keten Bezlerde Güneşte Pestil Kurutma"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 z-10">
              <span className="text-white font-serif text-lg font-bold">Keten Bezlerde İspir Güneşiyle Doğal Kurutma</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── CHAPTER IV: TKDK VE RESMİ AKREDİTASYON ─── */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-24 reveal-element">
        <div className="bg-gradient-to-br from-[#360e17] to-[#541423] rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-amber-300 border border-white/15">
              <span className="material-symbols-outlined text-sm">verified</span> T.C. Tarım ve Orman Bakanlığı &amp; TKDK Onaylı
            </div>

            <h3 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">
              Bölgesel Kalkınmaya Öncülük Eden <br />
              <span className="italic font-light text-amber-200">Avrupa Birliği Standartlarında Tesis</span>
            </h3>

            <p className="text-sm text-slate-200 leading-relaxed font-light">
              Tesisimiz, Tarım ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK) standartlarına en üst seviyede uygun olarak inşa edilmiş ve ruhsatlandırılmıştır. İspir vadisinde sözleşmeli organik üreticilerimize pazar güvencesi sağlarken, Türkiye'nin en saf lezzetlerini uluslararası normlarda üretmekteyiz.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {["ISO 9001:2015", "ISO 22000:2018", "Türk Gıda Kodeksi Uyumlu", "TÜRKPATENT Coğrafi İşaret"].map((c, i) => (
                <span key={i} className="bg-white/15 border border-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-100 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span> {c}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4 text-center sm:text-left bg-white/10 p-6 rounded-2xl border border-white/15 backdrop-blur-md">
            <h4 className="text-base font-bold text-amber-200">Tesis Ziyareti &amp; Kurumsal Tedarik</h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              Tesisimizi yerinde incelemek, zanaatkar üretim sürecimize tanıklık etmek veya kurumsal toptan alım görüşmesi yapmak için bizimle iletişime geçebilirsiniz.
            </p>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">mail</span> Randevu &amp; İletişim
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
