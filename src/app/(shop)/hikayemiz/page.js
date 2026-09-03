"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Hikayemiz() {
  const [isTrtModalOpen, setIsTrtModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsTrtModalOpen(false);
        setZoomLevel(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    <div className="relative w-full min-h-screen bg-surface text-on-surface overflow-hidden">
      {/* Subtle background grain grid */}
      <div className="absolute inset-0 bg-surface-container-lowest pointer-events-none opacity-40 mix-blend-multiply z-0"></div>

      {/* ─── HERO SECTION (Cinematic Editorial Header) ─── */}
      <header className="relative h-[65vh] min-h-[500px] max-h-[700px] flex items-center justify-center overflow-hidden">
        <Image
          src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
          alt="İspir Kaçkar Yaylaları Manzarası"
          fill
          priority
          sizes="100vw"
          className="object-cover filter brightness-[0.55] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#4A0E17]/80 via-[#4A0E17]/40 to-transparent z-10"></div>
        
        <div className="relative z-20 text-center px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto space-y-6">
          <span className="inline-block text-amber-200 text-xs font-semibold tracking-[0.3em] uppercase px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            KÖKLERE DÖNÜŞ · PEKEFE HİKAYESİ
          </span>
          <h1 className="font-display-lg text-[36px] sm:text-[48px] md:text-[60px] lg:text-[68px] text-white leading-[1.15] font-bold drop-shadow-md">
            Bir Öğretmenin Mirası: <br className="hidden md:block" /> İlhan Efe ve Pekefe'nin Doğuşu
          </h1>
          <p className="font-body-md text-amber-100/90 max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed font-light">
            Erzurum İspir'in 2000 rakımlı vadilerinde, toprağa ve insana saygıyla başlayan bir aile zanaatkarlığı öyküsü.
          </p>
          <div className="w-16 h-[1px] bg-secondary mx-auto rounded-full pt-2"></div>
        </div>
      </header>

      {/* ─── CHAPTER I: TOPRAĞA VE ZANAATA ADANMIŞ BİR ÖMÜR ─── */}
      <section className="py-20 md:py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Main Story Photography: İlhan Efe & Okan Efe (White Mulberries Basket) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20 group">
              <Image
                src="/uploads/ispir_hikayemiz_baba_ogul_beyaz_dut.jpg"
                alt="İlhan Efe ve Okan Efe İspir Beyaz Dut Hasadı"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 opacity-90"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white z-20 space-y-1">
                <span className="text-amber-300 text-xs font-mono tracking-widest uppercase block font-bold">İspir'in bereketli toprakları · Hasat Sezonu</span>
                <h3 className="font-display-lg text-xl font-bold">İlhan Efe ve Okan Efe</h3>
                <p className="text-xs text-slate-200 font-body">Asırlık beyaz dut ağaçlarının gölgesinde baba-oğul omuz omuza.</p>
              </div>
            </div>
          </div>

          {/* Narrative Content */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-secondary font-label-md tracking-[0.2em] uppercase block text-xs font-bold">
              BÖLÜM I · EĞİTİMDEN GİRİŞİMCİLİĞE
            </span>
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight">
              Bir Öğretmenin Hayalinden Doğan Doğal Lezzet Yolculuğu
            </h2>
            
            <blockquote className="font-display-lg text-base sm:text-lg italic text-primary/80 leading-relaxed border-l-4 border-secondary pl-5 py-1 bg-white p-4 rounded-r-xl border border-outline-variant/15 shadow-sm">
              "Bizim için her kavanoz sadece bir ürün değil; yılların birikimini, alın terini, memleket sevgisini ve dürüst üretim anlayışını taşıyan bir emektir." — İlhan Efe
            </blockquote>

            <div className="text-on-surface-variant text-base leading-relaxed space-y-4 font-body">
              <p>
                1952 yılında Erzurum'un İspir ilçesinde doğan <strong className="text-primary font-bold">İlhan Efe</strong>, Gümüşhane Öğretmen Lisesi'nden mezun olduktan sonra Van ve İspir'in Değirmenli Köyü'nde uzun yıllar köy öğretmenliği yaptı. İspir Halk Eğitim Müdürlüğü görevinden emekli olduktan sonra, çocukluğundan beri tutkusu ve bildiği iş olan İspir'in asırlık dutlarını en doğru ve saf yöntemlerle insanlara ulaştırma hayalini gerçeğe dönüştürdü.
              </p>
              <p>
                Geleneksel üretimde şıranın yüksek ateşte kontrolsüzce kaynatılarak yakıldığını, meyve şekerlerinin yanmasıyla hem lezzetin bozulduğunu hem de sağlığa zararlı HMF maddesinin yükseldiğini gözlemleyen İlhan Efe; <strong className="text-primary font-bold">"Dut şırasını ateşte yakmadan, güneş ışığında uzun sürelerde ve doğal sıcaklık kullanarak pişirme"</strong> ilkesini benimsedi.
              </p>
              <p>
                2013 yılında Tarım ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK) desteğiyle 500 bin liralık Avrupa Birliği ve Bakanlık onaylı modern tesisini kurarak geleneksel zanaatı çağdaş hijyen standartlarıyla taçlandırdı.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRT HABER & TKDK SPECIAL EDITORIAL SPOTLIGHT ─── */}
      <section className="py-16 bg-[#360e17] text-white relative overflow-hidden reveal-element">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* TRT Haber Interview Archival Photo */}
            <div className="lg:col-span-5 relative">
              <div 
                onClick={() => {
                  setIsTrtModalOpen(true);
                  setZoomLevel(1);
                }}
                className="relative aspect-square sm:aspect-[4/3] lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-amber-500/40 group cursor-pointer hover:border-amber-400 transition-all"
                title="Büyütmek ve Orijinal Haberi Okumak İçin Tıklayın"
              >
                <Image
                  src="/uploads/trthaber_ilhan_efe_roportaj.jpg"
                  alt="TRT Haber Memleketten Haber Var İlhan Efe Röportajı"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-10 transition-opacity group-hover:opacity-90"></div>
                
                {/* Floating Zoom Action Badge */}
                <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-400/40 flex items-center gap-1.5 shadow-lg group-hover:bg-amber-400 group-hover:text-black transition-all">
                  <span className="material-symbols-outlined text-sm">zoom_in</span>
                  <span>Haberi Büyüt &amp; Oku</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-20 space-y-1">
                  <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1 shadow">
                    TRT HABER · 21 EYLÜL 2017
                  </span>
                  <p className="text-xs text-amber-200 font-mono">Memleketten Haber Var Programı Özel Yayını</p>
                  <p className="text-[11px] text-amber-100/75 italic flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[15px]">touch_app</span>
                    Orijinal haber kupürünü büyütüp okumak için tıklayın
                  </p>
                </div>
              </div>
            </div>

            {/* TRT Haber Documentary Transcript & Vision */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
                  BASINDA BİZ · ULUSAL BAŞARI HİKAYESİ
                </span>
                <h2 className="font-display-lg text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  "Tesiste Pekmez Şırasını Yakmadan, Güneş Işığında Doğal Sıcaklıkla Pişiriyoruz"
                </h2>
              </div>

              <blockquote className="text-amber-100/90 text-sm sm:text-base leading-relaxed italic bg-white/5 border-l-4 border-amber-400 p-5 rounded-r-2xl">
                "Şıranın ateşte yakılması durumunda meyve şekeri yanmakta böylece lezzeti bozulmaktadır. Ayrıca ateşte yanmış meyve şekerleri insan sağlığı için zararlıdır. Biz doğal ürünleri doğal kaynaklarla tüketime hazırlıyoruz. Üretimin sonunda ise posa haline gelen dutlarımızı kurutup çuvallayarak hayvan yemi yapıyor, çiftçilerimize kazandırıyoruz. Yıllık ortalama 40-50 ton doğal pekmez üretmekteyiz. Çoğunluğu bayan olmak üzere 10 çalışanımızla örnek bir aile işletmesi olmayı başardık."
                <footer className="text-xs text-amber-300 font-bold font-sans mt-3 not-italic">
                  — İlhan Efe / TRT Haber & TKDK Bülteni
                </footer>
              </blockquote>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center">
                  <div className="text-xl font-mono font-bold text-amber-300">40 - 50 Ton</div>
                  <div className="text-[11px] text-amber-100/80 mt-1">Yıllık Doğal Üretim</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center">
                  <div className="text-xl font-mono font-bold text-emerald-400">Sıfır Atık</div>
                  <div className="text-[11px] text-amber-100/80 mt-1">Döngüsel Hayvan Yemi</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center col-span-2 sm:col-span-1">
                  <div className="text-xl font-mono font-bold text-rose-300">10 Çalışan</div>
                  <div className="text-[11px] text-amber-100/80 mt-1">Kadın İstihdamı & Aile</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── CHAPTER II: DUAL HARVEST GALLERY SHOWCASE (White & Black Mulberry) ─── */}
      <section className="py-20 bg-surface-container-low border-y border-outline-variant/15 reveal-element">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-secondary font-label-md text-xs uppercase tracking-[0.25em] font-bold">
              BÖLÜM II · BAHÇEDEN DOKUNUŞ
            </span>
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl font-bold">
              Asırlık Ağaçlar ve İki Eşsiz Mahsul
            </h2>
            <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed font-body">
              İspir'in 2000 rakımlı temiz dağ havasında organik tarımla yetişen İspir beyaz dutları ve yüksek vadilerdeki şifalı Karadeniz karadutları.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* White Mulberry Harvest Card (İlhan Efe) */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/15 shadow-sm space-y-6 group hover:shadow-md transition-all">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src="/uploads/ispir_hikayemiz_ilhan_efe_beyaz_dut.jpg"
                  alt="İlhan Efe Beyaz Dut Hasadı"
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-3">
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Geleneksel Hasavan İle Hasat
                </span>
                <h3 className="font-display-lg text-primary text-2xl font-bold">
                  Asırlık Ağaçlardan Hasavana Dökülen Beyaz Dutlar
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed font-body">
                  Dört kişinin köşelerinden gergin tuttuğu hasavan (dokuma keten bez) üzerine ağaçtan silkelenen ballı İspir beyaz dutları, toprağa değmeden toplanır. Meyvenin ezilmeden aynı gün sıkılarak şıraya dönüştürülmesi, PEKEFE Dut Gün Pekmezi'nin berrak altın sarısı renginin ve düşük HMF değerinin sırrıdır.
                </p>
              </div>
            </div>

            {/* Black Mulberry Harvest Card (İlhan Efe) */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/15 shadow-sm space-y-6 group hover:shadow-md transition-all">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src="/uploads/ispir_hikayemiz_ilhan_efe_karadut.jpg"
                  alt="İlhan Efe Yabani Karadut Hasadı"
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-3">
                <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Organik Karadut Özü
                </span>
                <h3 className="font-display-lg text-primary text-2xl font-bold">
                  Yüksek Polifenollü Dağ Karadutu
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed font-body">
                  Toplanması büyük sabır gerektiren organik karadutlar, el ile teker teker ayıklanır. Düşük sıcaklıkta vakumlu yöntemle yoğunlaştırılan karadut özümüz, ağız sağlığı ve bağışıklık için doğanın sunduğu en güçlü iksirdir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CHAPTER III: BABA & OĞUL OMUZ OMUZA (Generational Continuity) ─── */}
      <section className="py-20 md:py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal-element">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Narrative Content */}
          <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
            <span className="text-secondary font-label-md tracking-[0.2em] uppercase block text-xs font-bold">
              BÖLÜM III · NESİLLER BOYU SÜREN TUTKU
            </span>
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight">
              Geleneksel Ustalık ve Çağdaş Teknoloji Uyum İçinde
            </h2>
            
            <div className="text-on-surface-variant text-base leading-relaxed space-y-4 font-body">
              <p>
                İlhan Efe'nin kurduğu mütevazı zanaat anlayışı, oğlu <strong className="text-primary font-bold">Okan Efe</strong>'nin vizyonuyla daha da güçlendi. Artan talepleri karşılamak ve hijyen standartlarını en üst düzeye taşımak amacıyla Tarım ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK) desteğiyle Avrupa Birliği ve Bakanlık onaylı modern üretim tesisi kuruldu.
              </p>
              <p>
                TKDK desteğiyle kurulan bu modern tesiste, asırlık miras olan <strong className="text-primary font-bold">dut şırasını ateşte yakmadan, İspir güneşinin doğal sıcaklığında sabırla yoğunlaştırma (Dut Gün Pekmezi zanaatı)</strong>, paslanmaz çelik hijyenik dinlendirme tekneleri ve el değmeden steril vakum paketleme altyapısıyla buluşturuldu.
              </p>
              <p>
                Bugün Pekefe, 10 yılı aşkın süredir aynı disiplinle hareket ediyor: Seri üretime asla geçmeden, her mahsulü kendi mevsiminde, asırlık İspir bahçelerinden 4 kişilik hasavan bezleriyle toprağa değmeden toplayarak zanaatkar ruhla işliyoruz.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/15">
              <div>
                <div className="text-3xl font-display-lg font-bold text-primary">10+ Yıl</div>
                <div className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mt-1">Kesintisiz Zanaat Tecrübesi</div>
              </div>
              <div>
                <div className="text-3xl font-display-lg font-bold text-primary">%100 Saf</div>
                <div className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mt-1">Glikozsuz & Katkısız Güvence</div>
              </div>
            </div>
          </div>

          {/* Image: Father & Son Black Mulberry Harvest */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20 group">
              <Image
                src="/uploads/ispir_hikayemiz_baba_ogul_karadut.jpg"
                alt="İlhan Efe ve Okan Efe Karadut Hasadı"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 opacity-90"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white z-20 space-y-1">
                <span className="text-rose-300 text-xs font-mono tracking-widest uppercase block font-bold">Zanaat Mirası · Karadut Bahçeleri</span>
                <h3 className="font-display-lg text-xl font-bold">Babadan Oğula Aktarılan Dürüst Üretim</h3>
                <p className="text-xs text-slate-200 font-body">İlhan Efe ve Okan Efe dalından toplanan taze karadut sepetleriyle.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── CHAPTER IV: FUTURE VISION & OKAN EFE ─── */}
      <section className="py-20 bg-surface-container-low border-t border-outline-variant/15 reveal-element">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Image: Okan Efe in Orchard */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20 group">
                <Image
                  src="/uploads/ispir_hikayemiz_okan_efe_bahce.jpg"
                  alt="Okan Efe İspir Dut Bahçesinde"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white z-20 space-y-1">
                  <span className="text-amber-300 text-xs font-mono tracking-widest uppercase block font-bold">
                    Zanaatın Geleceği · Genç Vizyon
                  </span>
                  <h3 className="font-display-lg text-xl font-bold">Okan Efe</h3>
                  <p className="text-xs text-slate-200 font-body">İspir asırlık beyaz dut bahçelerinde yeni nesil kalite standartları.</p>
                </div>
              </div>
            </div>

            {/* Content: Quality Assurance & Future */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-secondary font-label-md tracking-[0.2em] uppercase block text-xs font-bold">
                BÖLÜM IV · GELECEĞE MİRAS
              </span>
              <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight">
                Topraktan Sofranıza Güvenle Ulaşan Asil Dokunuş
              </h2>
              <p className="text-on-surface-variant text-base leading-relaxed font-body">
                Okan Efe'nin dinamik vizyonuyla; İspir'in asırlık beyaz dutlarından elde edilen geleneksel <strong>Dut Gün Pekmezi</strong> ve keten sergilerde kurutulan yaprak pestillerimiz, uluslararası gıda güvenliği standartlarında geleceğe taşınıyor. Paketlediğimiz her ürünü nem, ışık ve hava temasından koruyan özel şeffaf hijyen vakumlarıyla ambalajlıyoruz.
              </p>
              
              <div className="space-y-3.5 pt-2">
                <div className="flex gap-4 items-start bg-white p-4 sm:p-5 rounded-2xl border border-outline-variant/15 shadow-sm hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Kontrollü Sıcaklık &amp; İdeal HMF Seviyesi</h4>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5 leading-relaxed">Pekmez şırasının yüksek sıcaklıklarda uzun süre kaynatılmaması ve güneşin doğal sıcaklığından yararlanılarak yoğunlaştırılması, PEKEFE'nin geleneksel üretim anlayışının temelini oluşturur; HMF seviyesi akredite laboratuvar analizleriyle düzenli olarak takip edilir (&lt; 10 mg/kg).</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-white p-4 sm:p-5 rounded-2xl border border-outline-variant/15 shadow-sm hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
                    <span className="material-symbols-outlined text-lg">eco</span>
                  </div>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Sıfır Rafine Şeker &amp; Koruyucu Madde</h4>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5 leading-relaxed">%100 saf meyve özü. Glikoz şurubu, tatlandırıcı, kıvam arttırıcı veya sentetik koruyucular üretimimizin hiçbir aşamasında yer almaz.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-white p-4 sm:p-5 rounded-2xl border border-outline-variant/15 shadow-sm hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                    <span className="material-symbols-outlined text-lg">recycling</span>
                  </div>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Sıfır Atık Modeli &amp; Kadın İstihdamı</h4>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5 leading-relaxed">Şırası çıkarılan dut posaları kurutulup hayvan yemi yapılarak çiftçilerimize kazandırılır; çoğunluğu kadın 10 kişilik kadromuzla yerel kalkınma desteklenir.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── PEKEFE BRAND VALUES (The 4 Pillars) ─── */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-secondary font-label-md text-xs uppercase tracking-[0.25em] font-bold">
            İLKELERİMİZ
          </span>
          <h2 className="font-display-lg text-primary text-3xl sm:text-4xl font-bold">Pekefe Değerleri</h2>
          <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-outline-variant/15 shadow-sm space-y-4 text-center group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto font-bold">
              <span className="material-symbols-outlined text-2xl">nature</span>
            </div>
            <h3 className="font-display-lg text-primary text-xl font-bold">%100 Doğallık</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-body">
              Topraktan aldığımızı, içine hiçbir katkı maddesi eklemeden İlhan Efe titizliğiyle işliyor ve sofranıza sunuyoruz.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-outline-variant/15 shadow-sm space-y-4 text-center group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto font-bold">
              <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
            </div>
            <h3 className="font-display-lg text-primary text-xl font-bold">Modern Gelenek</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-body">
              Atalarımızın asırlık usullerini, şırayı yakmadan güneşte doğal yoğunlaştırma zanaatı ve TKDK onaylı hijyen standartlarıyla geleceğe taşıyoruz.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-outline-variant/15 shadow-sm space-y-4 text-center group hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto font-bold">
              <span className="material-symbols-outlined text-2xl">handshake</span>
            </div>
            <h3 className="font-display-lg text-primary text-xl font-bold">Toplumsal Katkı</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-body">
              Yerel üreticilerimizle omuz omuza çalışarak İspir havzasının mikroekonomisine değer katıyoruz.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION (Editorial Elegance) ─── */}
      <section className="py-20 bg-primary text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-0"></div>
        <div className="relative z-10 px-margin-mobile md:px-0 max-w-2xl mx-auto space-y-6">
          <span className="text-amber-200 text-xs font-mono uppercase tracking-[0.25em] font-bold">
            GERÇEK LEZZETİ DENEYİMLEGİN
          </span>
          <h2 className="font-display-lg text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight">
            İlhan Efe'nin Mirasını Keşfetmeye Hazır mısınız?
          </h2>
          <p className="font-body-md text-amber-100/90 text-base leading-relaxed font-light">
            İspir'in kalbinden gelen dürüst ve doğal mahsul koleksiyonumuz sofranızda yerini almaya hazır.
          </p>
          <div className="pt-4">
            <Link
              className="inline-flex items-center gap-3 bg-white text-primary hover:bg-amber-100 font-bold px-8 py-4 rounded-full text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-105"
              href="/kategoriler"
            >
              <span>Ürünlerimizi Keşfedin</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TRT HABER / ARŞİV LIGHTBOX & HIGH-LEGIBILITY TRANSCRIPT MODAL ─── */}
      {isTrtModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fade-in"
          onClick={() => setIsTrtModalOpen(false)}
        >
          <div 
            className="relative bg-[#20080d] text-white border border-amber-500/40 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#360e17]">
              <div className="flex items-center gap-3">
                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  TRT HABER ARŞİVİ
                </span>
                <span className="text-amber-200 text-xs sm:text-sm font-mono hidden sm:inline">
                  21 Eylül 2017 · "Memleketten Haber Var"
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => prev === 1 ? 1.4 : 1)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Yakınlaştır / Uzaklaştır"
                >
                  <span className="material-symbols-outlined text-base">{zoomLevel === 1 ? 'zoom_in' : 'zoom_out'}</span>
                  <span className="hidden sm:inline">{zoomLevel === 1 ? '%140 Büyüt' : 'Normal Boyut'}</span>
                </button>
                <button
                  onClick={() => setIsTrtModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Kapat"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Two Column / High Res Image + Crisp Full Transcript */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto max-h-[calc(92vh-75px)]">
              {/* Image View with Zoom */}
              <div className="lg:col-span-6 bg-black/50 flex items-center justify-center p-4 border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden min-h-[380px]">
                <div 
                  className="relative w-full max-w-[480px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 cursor-zoom-in"
                  style={{ transform: `scale(${zoomLevel})` }}
                  onClick={() => setZoomLevel(prev => prev === 1 ? 1.4 : 1)}
                  title="Tıklayarak büyütebilirsiniz"
                >
                  <Image
                    src="/uploads/trthaber_ilhan_efe_roportaj.jpg"
                    alt="TRT Haber İlhan Efe Orijinal Haber Kupürü"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Crisp High-Legibility Full Transcript */}
              <div className="lg:col-span-6 p-6 sm:p-8 space-y-5 overflow-y-auto bg-[#26090e]">
                <div className="border-b border-amber-500/20 pb-4">
                  <span className="text-amber-400 font-mono text-[11px] uppercase tracking-widest font-bold block">
                    ORİJİNAL HABER METNİ &amp; BELGESEL DEŞİFRESİ
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                    ERZURUM'DAN HABER VAR
                  </h3>
                  <p className="text-xs text-amber-200/80 font-mono mt-0.5">
                    İspir · Emekli Öğretmen İlhan Efe &amp; Pekefe Tesisi
                  </p>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm text-amber-100/90 leading-relaxed font-sans">
                  <p>
                    Kırsal alanda önemli faaliyetleri destekleyen <strong>Tarım ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK)</strong> dikkat çeken yatırımlardan birini daha TRT Haber aracılığı ile tanıttı. Erzurum'u Karadeniz'e bağlayan İspir ilçesinde emekli öğretmen İlhan Efe'ye ait pekmez üretim tesisi, 21 Eylül Perşembe günü TRT Haber'de yayınlanan <em>'Memleketten Haber Var'</em> isimli programa konuk oldu.
                  </p>
                  <p>
                    Başta pekmez, köme ve pestil gibi yöreye özgü ürünler üreten başarılı girişimci, ürünlerini <strong>'Pekefe'</strong> markasıyla pazara hazırlıyor. Ürünlerini geleneksel üretim teknikleri, gıda hijyeni ve kalite kuralları ile üreten İlhan Efe; Gıda, Tarım ve Hayvancılık Bakanlığı tarafından gerekli üretim izinleri alarak markalaştırdığı ürünlerini Avrupa Birliği standartlarındaki tesisinde üretiyor.
                  </p>
                  <p>
                    Bu üretimi sayesinde TRT Haber kanalı tarafından yayınlanan 'Memleketten haber var' adlı programın konuğu olmayı başaran İlhan Efe, üretim tesisi ile ilgili şu bilgileri aktardı:
                  </p>
                  <blockquote className="bg-black/35 border-l-4 border-amber-400 p-4 rounded-r-xl italic text-amber-200/95 space-y-2">
                    <p>
                      "Emekliliğimden sonra boş durmamak için uğraşlar arıyordum. Bu bağlamda çocukluğumdan beri bildiğim iş olan pekmez üretimini yapmaya karar verdim. Pekmezleri önceleri kendi imkânlarımla ilçemizin meşhur olan dutlarıyla yapıyordum. Ancak bu üretim sınırlı ve istediğim üretim kurallarını içermiyordu. Bu sıralarda TKDK uzmanları ilçemizde tanıtım toplantısı düzenlemişlerdi. Toplantıda yerel ürünlerin üretimi için kurumun destek verdiğini ifade ettiler. Daha sonra yaptığımız görüşmeler neticesinde işimi geliştirmeye karar verdim. 2013 yılında hibe desteği alarak 500 bin liralık modern bir tesis kurdum."
                    </p>
                    <p className="font-semibold text-white not-italic bg-amber-400/10 p-2.5 rounded-lg border border-amber-400/30">
                      "Tesiste pekmez şırasını yakmadan üretim yapıyoruz. Güneş ışığında uzun sürelerde pekmezi pişiriyor ve doğal sıcaklık kullanıyoruz. Şıranın ateşte yakılması durumunda meyve şekeri yanmakta böylece lezzeti bozulmaktadır. Ayrıca ateşte yanmış meyve şekerleri insan sağlığı için zararlıdır."
                    </p>
                    <p>
                      "Böylece doğal ürünleri doğal kaynaklarla tüketime hazırlıyoruz. Üretimin sonunda ise posa haline gelen dutlarımızı kurutup çuvallayarak hayvan yemi yaparak çiftçilerimize kazandırmaktayız. Yeni ürün olarak dut sirkesi üretimine başladık. Talep edilmesi nedeniyle dut sirkesi üretimini artırmayı hedefliyoruz. Sonuç olarak yıllık ortalama 40-50 ton doğal pekmez üretimi yapmaktayız. Tesisimizde şu an çoğunluğu bayan olmak üzere 10 çalışanımız bulunmaktadır. Önemli bir aile işletmesi olmayı başardık."
                    </p>
                  </blockquote>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-amber-300/80 font-mono">
                  <span>✓ Arşiv Belgesi Doğrulandı</span>
                  <span>T.C. TKDK &amp; TRT Haber</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


