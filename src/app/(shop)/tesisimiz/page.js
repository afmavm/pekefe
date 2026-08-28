"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const processStations = [
  {
    step: "01",
    title: "Hasat Kabulü & Doğal Kaynak Suyu ile Yıkama",
    subtitle: "Saf İspir Doğası",
    desc: "İspir'in 2000m+ rakımlı el değmemiş bahçelerinden şafak vakti toplanan dutlar, Kaçkar zirvelerinden gelen buz gibi doğal kaynak suları ile el değmeden 3 kademeli havuzlarda arındırılır.",
    icon: "water_drop",
    tag: "3 Kademeli Yıkama",
    temp: "12°C Kaynak Suyu"
  },
  {
    step: "02",
    title: "Vakum Altında Düşük Isıda Konsantrasyon",
    subtitle: "Maksimum 65°C / Sıfır HMF",
    desc: "Geleneksel açık ateş kaynatmanın besin değerlerini yakıcı etkisini ortadan kaldırıyoruz. Kapalı vakum kazanlarımızda şıra 60-65°C'de yoğunlaştırılır; doğal enzimler, vitaminler ve mineraller %100 korunur.",
    icon: "thermostat",
    tag: "Vakumlu Düşük Isı",
    temp: "60°C - 65°C"
  },
  {
    step: "03",
    title: "El Değmeden HEPA Filtreli Hijyenik Dolum",
    subtitle: "Steril Temiz Oda Standartları",
    desc: "Pastörizasyona tabi tutulmadan doğal akışkanlığı korunan lezzetlerimiz, HEPA 14 hava filtreli pozitif basınçlı dolum kabinlerinde el değmeden cam kavanozlara doldurulur ve emniyet bandıyla mühürlenir.",
    icon: "sanitizer",
    tag: "HEPA 14 Temiz Oda",
    temp: "Otomatik Dolum"
  },
  {
    step: "04",
    title: "Akredite Laboratuvar Analizi & Mühürleme",
    subtitle: "Türk Gıda Kodeksi Tam Uyum",
    desc: "Her üretim partisinden numuneler alınarak HMF, prolin, nem ve saflık analizleri yapılır. Analiz raporu onaylanmayan hiçbir kavanoz tesisimizden sevk edilmez.",
    icon: "verified",
    tag: "Tescilli Analiz",
    temp: "Parti Bazlı Rapor"
  }
];

const facilityFeatures = [
  {
    icon: "precision_manufacturing",
    title: "304L Paslanmaz Krom Donanım",
    desc: "Tüm boru hatları, pişirme kazanları ve dolum nozulları gıda normlarına uygun AISI 304L paslanmaz çelikten imal edilmiştir.",
    badge: "Gıda Sınıfı Çelik"
  },
  {
    icon: "air",
    title: "Pozitif Basınçlı Hava Sirkülasyonu",
    desc: "Üretim salonlarındaki hava mikropartikül filtrelerinden geçirilerek dış ortam toz ve bakterilerinden %99.9 oranında izole edilir.",
    badge: "Partikülsüz Hava"
  },
  {
    icon: "science",
    title: "Tesis İçi Ön Kontrol Laboratuvarı",
    desc: "Hammadde kabulünden son ambalaja kadar refraktometre (Brix) ve pH ölçümleri anlık olarak dijital sensörlerle takip edilir.",
    badge: "Gerçek Zamanlı Kalite"
  },
  {
    icon: "ac_unit",
    title: "İklimlendirmeli Akıllı Depolama",
    desc: "Mamul ürünlerimiz 18°C - 22°C sabit sıcaklık ve optimum nem kontrollü özel karanlık mahzen odalarımızda dinlendirilir.",
    badge: "Sabit İklim (18-22°C)"
  }
];

export default function Tesisimiz() {
  const [activeStation, setActiveStation] = useState(0);

  return (
    <div className="w-full bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-amber-200 selection:text-amber-900">
      
      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full min-h-[75vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0807] via-[#2d0f15] to-[#FAF8F5] dark:to-slate-950 px-4">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <Image
            alt="Pekefe İspir Modern Üretim Tesisi"
            className="object-cover object-center scale-105 filter brightness-75"
            src="/uploads/ispir-modern-hijyenik-tesis-dolum.webp"
            fill
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] dark:from-slate-950 via-black/40 to-black/60 z-10" />

        <div className="relative z-20 text-center max-w-4xl mx-auto py-20 px-4 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            İspir / Erzurum · TKDK &amp; Bakanlık Onaylı Tesis
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] drop-shadow-md">
            Geleneksel Miras, <br />
            <span className="italic font-light text-amber-200">Modern Mühendislik</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-200 font-light max-w-2xl mx-auto leading-relaxed drop-shadow">
            İspir'in asırlık dut ve bal zanaatini, 60°C vakumlu pişirme teknolojisi ve tavizsiz gıda güvenliği standartlarıyla geleceğe taşıyoruz.
          </p>

          {/* Quick Stats Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { val: "60-65°C", lbl: "Vakumlu Düşük Isı", sub: "Besin Değeri Koruma" },
              { val: "< 10 mg", lbl: "Sıfır Yanık HMF", sub: "Kanserojen Yanık Yok" },
              { val: "2200m+", lbl: "Yayla Rakımı", sub: "İspir Kaçkar Florası" },
              { val: "ISO 22000", lbl: "Gıda Güvenliği", sub: "Tescilli Üretim Hattı" }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center hover:bg-white/15 transition-all">
                <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{stat.val}</div>
                <div className="text-xs font-bold text-white mt-0.5">{stat.lbl}</div>
                <div className="text-[10px] text-slate-300">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VAKUM TEKNOLOJİSİ & BİLİMSEL FARKLILIK ─── */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[#b45309] font-black text-xs uppercase tracking-widest block bg-amber-100/60 dark:bg-amber-900/30 w-fit px-3.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
              Bilimsel Üretim Yaklaşımı
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#360e17] dark:text-amber-100 leading-tight">
              Neden Açık Ateşte Değil, <br />
              <span className="italic font-normal text-amber-800 dark:text-amber-300">Vakum Altında Pişiriyoruz?</span>
            </h2>
            <div className="w-16 h-1 bg-[#b45309] rounded-full" />
            
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Geleneksel açık kazanlarda 100°C ve üzeri aşırı kaynatma; dutun içindeki vitaminleri, antioksidanları ve canlı enzimleri tahrip eder. En önemlisi, aşırı ısı şekerin karamelize olarak <strong>HMF (Hidroksimetilfurfural)</strong> adı verilen zararlı bileşiğin oluşmasına sebep olur.
            </p>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              PEKEFE tesislerimizde geliştirdiğimiz <strong>Vakumlu Kapalı Sistem</strong> teknolojisi ile kaynama noktasını 60-65°C'ye düşürüyoruz. Meyvenin nektarı ağır ağır, besin değerini yitirmeden ve kararmadan altın kıvamına ulaşır.
            </p>

            {/* Comparison Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">cancel</span> Geleneksel Açık Kaynatma
                </div>
                <div className="text-xs text-rose-900/80 dark:text-rose-200/80 leading-relaxed">
                  100°C+ aşırı ısı, vitamin kaybı, yüksek HMF yanık riski ve kararmış acımsı tat.
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">check_circle</span> PEKEFE Vakumlu Sistem
                </div>
                <div className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                  Maks 65°C, %100 korunan vitamin ve polifenoller, sıfır yanık ve berrak açık renk.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 group">
              <Image
                alt="Vakumlu Konsantrasyon Kazanları"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                src="/uploads/ispir-bakir-kazan-ahsap-cendere.webp"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono">Modern Laboratuvar Standartları</span>
                <h4 className="text-xl font-bold font-serif">Vakum Altında Düşük Isı Pişirme Ünitesi</h4>
                <p className="text-xs text-slate-300 mt-1">İspir / Erzurum Entegre Üretim Tesisi</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 4 AŞAMALI İNTERAKTİF ÜRETİM AKIŞI ─── */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[#b45309] font-black text-xs uppercase tracking-widest block">
              ADIM ADIM ÜRETİM DİSİPLİNİ
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#360e17] dark:text-amber-100">
              Bahçeden Sofraya 4 Aşamalı Yolculuk
            </h2>
            <div className="w-12 h-1 bg-[#b45309] mx-auto rounded-full" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ürünlerimizin her bir kavanozu, aşağıdaki hassas mühendislik ve hijyen aşamalarından geçerek hazırlanır.
            </p>
          </div>

          {/* Station Nav Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {processStations.map((st, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStation(idx)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                  activeStation === idx
                    ? "bg-[#360e17] text-white border-[#360e17] shadow-lg scale-102"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${activeStation === idx ? "bg-amber-400 text-slate-950" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                    {st.step}
                  </span>
                  <span className="material-symbols-outlined text-lg">{st.icon}</span>
                </div>
                <div>
                  <div className="text-xs font-bold line-clamp-1">{st.title}</div>
                  <div className={`text-[10px] ${activeStation === idx ? "text-amber-200" : "text-slate-400"}`}>{st.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Active Station Detail Card */}
          <div className="bg-[#FAF8F5] dark:bg-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-[#b45309] font-mono">{processStations[activeStation].step}</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-[#b45309] px-3 py-1 rounded-full">
                  {processStations[activeStation].tag}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {processStations[activeStation].temp}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#360e17] dark:text-amber-100">
                {processStations[activeStation].title}
              </h3>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {processStations[activeStation].desc}
              </p>
            </div>

            <div className="lg:col-span-5 relative aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
              <Image
                alt={processStations[activeStation].title}
                className="object-cover"
                src={
                  activeStation === 0 ? "/uploads/ispir_hikayemiz_baba_ogul_beyaz_dut.jpg" :
                  activeStation === 1 ? "/uploads/ispir-bakir-kazan-ahsap-cendere.webp" :
                  activeStation === 2 ? "/uploads/ispir-modern-hijyenik-tesis-dolum.webp" :
                  "/uploads/ispir-keten-bezde-pestil-serimi.webp"
                }
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ─── HİJYEN & MÜHENDİSLİK STANDARTLARI (BENTO GRID) ─── */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-[#b45309] font-black text-xs uppercase tracking-widest block">
            MÜHENDİSLİK &amp; HİJYEN
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#360e17] dark:text-amber-100">
            Tavizsiz Gıda Güvenliği Standartları
          </h2>
          <div className="w-12 h-1 bg-[#b45309] mx-auto rounded-full" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Uluslararası gıda normlarına uygun, en son teknoloji hijyen ekipmanlarıyla donatılmış steril üretim alanı.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {facilityFeatures.map((feat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-[#b45309] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">{feat.icon}</span>
                </div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-amber-100">{feat.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{feat.desc}</p>
              </div>
              <span className="text-[10px] font-bold font-mono text-[#b45309] bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full w-fit border border-amber-200/60 dark:border-amber-800">
                {feat.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TKDK & BAKANLIK BELGELENDİRME VE AKREDİTASYON ─── */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-20">
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
