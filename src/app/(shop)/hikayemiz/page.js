"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Hikayemiz() {
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
              <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 group">
                <Image
                  src="/uploads/trthaber_ilhan_efe_roportaj.jpg"
                  alt="TRT Haber Memleketten Haber Var İlhan Efe Röportajı"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1 shadow">
                    TRT HABER · 21 EYLÜL 2017
                  </span>
                  <p className="text-xs text-amber-200 font-mono">Memleketten Haber Var Programı Özel Yayını</p>
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
                İlhan Efe'nin kurduğu mütevazı zanaat anlayışı, oğlu <strong className="text-primary font-bold">Okan Efe</strong>'nin vizyonuyla daha da güçlendi. Artan müşteri taleplerini karşılamak ve hijyen standartlarını uluslararası düzeye taşımak amacıyla Tarım ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK) desteğiyle modern üretim tesisi kuruldu.
              </p>
              <p>
                TKDK hibe desteğiyle kurulan bu tesiste, babadan kalma odun ateşi zanaatı; besin değerini, renk ve vitaminleri tam koruyan <strong className="text-primary font-bold">vakumlu düşük sıcaklık pişirme teknolojisi</strong> ile birleştirildi.
              </p>
              <p>
                Bugün Pekefe, 10 yılı aşkın süredir aynı disiplinle hareket ediyor: Seri üretime asla geçmeden, her mahsulü kendi mevsiminde, kendi bahçesinden el işçiliğiyle toplayarak işliyoruz.
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
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border border-outline-variant/20 group">
                <Image
                  src="/uploads/ispir_hikayemiz_okan_efe_bahce.jpg"
                  alt="Okan Efe İspir Dut Bahçesinde"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <span className="absolute bottom-6 left-6 text-white font-display-lg text-lg font-bold z-20">
                  Okan Efe · Gelecek Vizyonu
                </span>
              </div>
            </div>

            {/* Content: Quality Assurance & Future */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-secondary font-label-md tracking-[0.2em] uppercase block text-xs font-bold">
                BÖLÜM IV · GELECEĞE MİRAS
              </span>
              <h2 className="font-display-lg text-primary text-3xl sm:text-4xl font-bold">
                Topraktan Sofranıza Güvenle Ulaşan Asil Dokunuş
              </h2>
              <p className="text-on-surface-variant text-base leading-relaxed font-body">
                İlk günkü tutkuyu hiç kaybetmeden, İspir'in bereketli topraklarında organik ve geleneksel yöntemlerle yetiştirilen doğal mahsulleri en saf haliyle sunuyoruz. Paketlediğimiz her ürünü nem, ışık ve dış etkenlerden koruyan özel şeffaf hijyen vakumlarıyla ambalajlıyoruz.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Düşük HMF Seviyesi (&lt; 10 mg/kg)</h4>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5">Yüksek ısı uygulanmadığı için kanserojen riski taşıyan HMF oluşmaz, akredite lab raporlarıyla belgelenir.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-lg">eco</span>
                  </div>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Sıfır Rafine Şeker &amp; Koruyucu</h4>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5">Meyvenin kendi fruktoz ve tat dengesi dışında ilave tatlandırıcı veya koruyucu madde kesinlikle kullanılmaz.</p>
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
              Atalarımızın asırlık usullerini, mineralleri koruyan vakumlu pişirme teknolojileriyle harmanlıyoruz.
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
    </div>
  );
}


