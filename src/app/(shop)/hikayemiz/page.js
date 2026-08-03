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
    <>
      {/* Hero Section */}
      <header className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/uploads/ispir-yedi-goller-kackar-manzara.webp')",
          }}
        ></div>
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="relative z-10 text-center px-margin-mobile md:px-0 max-w-5xl mx-auto">
          <h1 className="font-display-lg text-[38px] sm:text-[48px] md:text-[64px] lg:text-[76px] text-surface-container-lowest mb-8 drop-shadow-lg leading-[1.1] font-bold">
            Bir Öğretmenin Mirası: <br className="hidden md:block" /> İlhan Efe ve Pekefe'nin Doğuşu
          </h1>
          <p className="font-body-lg text-surface-container-lowest opacity-95 max-w-3xl mx-auto drop-shadow-md text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed">
            İspir'in zirvelerinden bir eğitimcinin vizyonuyla başlayan, doğallığı teknolojiyle buluşturan bir lezzet serüveni.
          </p>
        </div>
      </header>

      {/* Biography & Our Story Section */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-secondary font-label-md tracking-widest uppercase block text-sm sm:text-base font-bold mb-2">
              Eğitimden Girişimciliğe
            </span>
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[48px] font-bold leading-tight mb-8">
              Bir Öğretmenin Hayalinden Doğan Doğal Lezzet Yolculuğu
            </h2>
            
            <div className="font-display-lg text-lg sm:text-xl lg:text-[22px] italic text-primary/80 font-medium leading-relaxed border-l-4 border-secondary pl-6 mb-8">
              Her güzel hikâye, samimiyetle atılan küçük bir adımla başlar. Bizim hikâyemiz ise Erzurum'un eşsiz doğasıyla çevrili İspir'de, toprağa ve emeğe duyulan sevgiyle başladı.
            </div>

            <div className="text-on-surface-variant text-base sm:text-lg lg:text-[18px] leading-relaxed space-y-6">
              <p>
                1952 yılında İspir'de doğan <strong className="text-primary font-bold">İlhan Efe</strong>, ilk ve orta öğrenimini memleketi İspir'de tamamladıktan sonra Gümüşhane Öğretmen Lisesi'nden mezun oldu. Öğretmenlik mesleğine ilk olarak Van'da başladı ve burada dört yıl görev yaptı. Ardından memleketi İspir'in Değirmenli Köyü'ne tayin oldu. Yedi yıl köy öğretmenliği yaptıktan sonra İspir Halk Eğitim Müdürlüğü'ne atanarak eğitim hayatını burada sürdü ve bu görevinden emekli oldu.
              </p>
              <p>
                Ancak emeklilik, onun için yeni bir başlangıcın adıydı.
              </p>
              <p>
                Girişimci ruhu sayesinde hayatı boyunca farklı sektörlerde çeşitli girişimlerde bulundu. Her deneyim ona yeni bilgiler kazandırdı. Fakat asıl tutkusu, çocukluğundan beri içinde büyüdüğü toprakların en değerli armağanlarından biri olan <strong className="text-primary font-bold">İspir dutunu</strong> en doğal haliyle insanlara ulaştırmaktı.
              </p>
              <p>
                O dönem üretilen pekmezlerin büyük çoğunluğu yüksek ısıda, odun ateşinde kaynatılarak hazırlanıyordu. İlhan Efe ise bu yöntemin dutun doğal yapısındaki değerli bileşenleri olumsuz etkileyebileceğini biliyordu. Bu nedenle tamamen farklı bir üretim anlayışı geliştirmeye karar verdi.
              </p>
              <p>
                Kendi imkânlarıyla tasarladığı özel bir sistem sayesinde, bahçesinde yetişen dutları yüksek ısıya maruz bırakmadan, kontrollü ve doğal yöntemlerle yoğunlaştırarak pekmez üretmeye başladı. İlk üretimler yalnızca ailesi ve yakın çevresi içindi.
              </p>
              <p>
                Bir gün Trabzon'dan İspir'e gelen Arıcılar Birliği Başkanı <strong className="text-primary font-bold">Avni Haliloğlu</strong>, bu doğal pekmezin tadına baktı. Lezzeti ve kalitesinden etkilenerek bir miktar pekmez satın aldı. Ardından her yıl artan taleple birlikte üretim kapasitesi de büyümeye başladı.
              </p>
              <p>
                Artan ilgi, ilk kurulan mütevazı üretim sisteminin artık yetersiz kalmasına neden oldu. Bunun üzerine hazırlanan proje, Tarım ve Kırsal Kalkınmayı Destekleme kapsamında değerlendirilerek onay aldı. Sağlanan <strong className="text-primary font-bold">%50 hibe desteği</strong> ile modern üretim tesisi kuruldu ve geleneksel bilgi, çağdaş üretim altyapısıyla buluştu.
              </p>
              <p>
                Bugün yaklaşık <strong className="text-primary font-bold">10 yıldır</strong> aynı heyecan ve aynı özenle üretim yapıyoruz.
              </p>
              <p>
                Üretimimizin temelinde hiçbir zaman seri üretim anlayışı değil; doğallık, kalite ve güven yer aldı. Bahçelerimizden özenle toplanan dutları, geliştirdiğimiz özel üretim yöntemiyle işleyerek hem doğanın sunduğu lezzeti hem de emeğin değerini sofralara ulaştırıyoruz.
              </p>
              <p>
                Çünkü bizim için her kavanoz sadece bir ürün değil; yılların birikimini, alın terini, memleket sevgisini ve dürüst üretim anlayışını taşıyan bir emektir.
              </p>

              <h3 className="font-display-lg text-primary text-2xl sm:text-3xl font-bold pt-6 pb-2">
                Bugün ve Gelecek
              </h3>

              <p>
                İlk günkü heyecanımızı hiç kaybetmeden üretmeye devam ediyoruz. Hedefimiz yalnızca pekmez üretmek değil; İspir'in bereketli topraklarında yetişen doğal ürünleri en saf haliyle sizlerle buluşturmak ve her zaman güvenle tercih edilen bir marka olmaktır.
              </p>
              <p>
                Bizi tercih eden herkesi ailemizin bir parçası olarak görüyor, doğal, kaliteli ve katkısız ürünler üretmeye aynı özenle devam ediyoruz.
              </p>
            </div>

            <div className="bg-secondary/[0.06] border-l-4 border-secondary p-6 rounded-r-2xl my-8">
              <p className="font-body-lg text-secondary font-bold text-base sm:text-lg lg:text-[19px] leading-relaxed">
                Toprağın bereketini, emeğin değerini ve doğallığın gerçek lezzetini sofralarınıza ulaştırmak için çalışıyoruz.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 lg:sticky lg:top-24 mt-8 lg:mt-0">
            <div className="relative group w-full h-[500px] md:h-[650px] lg:h-[700px]">
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-secondary/20 rounded-xl transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
              <Image
                alt="İlhan Efe ve İspir Üretim Tesisleri"
                className="object-cover rounded-xl shadow-xl transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1"
                src="/ilhan-efe-trt.jpg"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-surface-container-low py-section-gap">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[48px] font-bold mb-4">Değerlerimiz</h2>
            <div className="w-24 h-1 bg-secondary mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_4px_20px_rgba(139,0,0,0.04)] text-center group hover:translate-y-[-8px] transition-transform duration-300 border border-transparent hover:border-secondary/20">
              <div className="w-16 h-16 bg-secondary-container/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">nature</span>
              </div>
              <h3 className="font-headline-md text-primary mb-4">100% Doğallık</h3>
              <p className="text-on-surface-variant">
                Topraktan aldığımızı, içine hiçbir katkı maddesi eklemeden, İlhan Efe titizliğiyle size sunuyoruz.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_4px_20px_rgba(139,0,0,0.04)] text-center group hover:translate-y-[-8px] transition-transform duration-300 border border-transparent hover:border-secondary/20">
              <div className="w-16 h-16 bg-secondary-container/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">precision_manufacturing</span>
              </div>
              <h3 className="font-headline-md text-primary mb-4">Modern Gelenek</h3>
              <p className="text-on-surface-variant">
                Atalarımızın usullerini, mineralleri koruyan en modern üretim teknolojileriyle birleştiriyoruz.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_4px_20px_rgba(139,0,0,0.04)] text-center group hover:translate-y-[-8px] transition-transform duration-300 border border-transparent hover:border-secondary/20">
              <div className="w-16 h-16 bg-secondary-container/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">handshake</span>
              </div>
              <h3 className="font-headline-md text-primary mb-4">Toplumsal Katkı</h3>
              <p className="text-on-surface-variant">
                Arıcılar Birliği ve yerel üreticilerle iş birliği içinde İspir ekonomisine değer katıyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Production Revolution Section */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative w-full h-64 overflow-hidden rounded-xl shadow-lg hover:scale-102 transition-transform duration-500">
                <Image
                  className="object-cover"
                  alt="Düşük Sıcaklıkta Vakumlu Pişirme Sistemi"
                  src="/vakumlu-uretim.png"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="relative w-full h-80 overflow-hidden rounded-xl shadow-lg hover:scale-102 transition-transform duration-500">
                <Image
                  className="object-cover"
                  alt="İspir Beyaz Dut Hasadı"
                  src="/ispir-dut-hasadi.png"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </div>
            <div className="pt-8 space-y-4">
              <div className="relative w-full h-80 overflow-hidden rounded-xl shadow-lg hover:scale-102 transition-transform duration-500">
                <Image
                  className="object-cover"
                  alt="Pekefe Vakumlu Modern Üretim Tesisleri"
                  src="/ispir-modern-tesis.png"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="relative w-full h-64 overflow-hidden rounded-xl shadow-lg hover:scale-102 transition-transform duration-500">
                <Image
                  className="object-cover"
                  alt="Premium Pekefe Kavanozu ve İspir Manzarası"
                  src="/premium-pekefe-kavanoz.png"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-8">
            <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[48px] font-bold">Üretimde Devrim: Teknoloji ve Saflık</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="shrink-0 font-display-lg text-secondary opacity-30 text-[40px] leading-none">01</div>
                <div>
                  <h4 className="font-headline-md text-on-surface mb-2">TKDK Desteği ile Modern Tesis</h4>
                  <p className="text-on-surface-variant">
                    Geleneksel odun ateşi yerine, TKDK desteğiyle kurduğumuz modern tesisimizde, ürünlerin mineral değerlerini koruyan özel vakumlu pişirme sistemleri kullanıyoruz.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 font-display-lg text-secondary opacity-30 text-[40px] leading-none">02</div>
                <div>
                  <h4 className="font-headline-md text-on-surface mb-2">Avni Haliloğlu ve Kalite Onayı</h4>
                  <p className="text-on-surface-variant">
                    Üretim yolculuğumuz, Arıcılar Birliği Başkanı Avni Haliloğlu’nun ilk tadımıyla ve "Bu lezzet Türkiye'ye yayılmalı" onayıyla büyük bir ivme kazandı.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 font-display-lg text-secondary opacity-30 text-[40px] leading-none">03</div>
                <div>
                  <h4 className="font-headline-md text-on-surface mb-2">Sıfır Kayıp, Maksimum Besin</h4>
                  <p className="text-on-surface-variant">
                    Özel üretim teknolojimiz sayesinde, meyvenin içindeki vitamin ve mineraller yüksek ısıda kaybolmadan, en saf haliyle kavanozlara ulaşıyor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Guarantee */}
      <section className="mb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="bg-primary p-12 md:p-20 rounded-3xl text-surface-container-lowest flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display-lg text-3xl sm:text-4xl lg:text-[48px] font-bold mb-6">Saflık ve Kalite Güvencesi</h2>
            <p className="font-body-lg opacity-90 leading-relaxed mb-8 text-base sm:text-lg lg:text-[20px]">
              Pekefe etiketini taşıyan her kavanoz, İspir'in 2000 rakımlı havasını, kirlenmemiş toprağını ve İlhan Efe'nin dürüst üretim sözünü taşır. Ürünlerimizde asla rafine şeker, glikoz şurubu veya hiçbir kimyasal koruyucu bulunmaz.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full font-label-md border border-white/20">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>{" "}
                Analiz Raporlu
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full font-label-md border border-white/20">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  eco
                </span>{" "}
                Organik Sertifikalı
              </span>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-6">
            <Image
              alt="Pekefe Logo"
              width={192}
              height={192}
              className="object-contain hover:scale-105 transition-transform duration-500"
              src="/logo.png"
            />
            <p className="font-display-lg text-headline-md italic opacity-60 text-center text-surface-container-lowest">
              Geleneksel İspir Ürünleri
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-section-gap bg-surface-container-low text-center">
        <div className="px-margin-mobile md:px-0 max-w-2xl mx-auto">
          <h2 className="font-display-lg text-primary text-3xl sm:text-4xl lg:text-[48px] font-bold mb-8">Gerçek Lezzeti Deneyimleyin</h2>
          <p className="font-body-lg text-on-surface-variant mb-10 text-base sm:text-lg lg:text-[20px]">
            İlhan Efe'nin mirası, İspir'in kalbinden gelen bu özel koleksiyonu keşfetmeye hazır mısınız?
          </p>
          <Link
            className="inline-flex items-center gap-4 bg-primary text-surface-container-lowest px-12 py-5 rounded-full font-label-md uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg"
            href="/kategoriler"
          >
            Ürünlerimizi Keşfedin
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>
    </>
  );
}
