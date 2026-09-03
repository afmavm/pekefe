"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";
import { getProducts, fetchProductsFromApi } from "@/utils/productsStorage";
import { addToCart } from "@/utils/cartStorage";
import { HeroSlider } from "@/components/home/HeroSlider";
import { DealSection } from "@/components/home/DealSection";

export default function Home() {
  const [activeRecipe, setActiveRecipe] = useState("tahini");
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeSeason, setActiveSeason] = useState("yaz");
  const [activeLabCard, setActiveLabCard] = useState(0);
  const [stepImageOverride, setStepImageOverride] = useState(null);
  
  // Toast States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToastMsg(data.error || "Abonelik oluşturulurken bir hata oluştu.");
        setToastOpen(true);
        return;
      }

      setIsSubscribed(true);
      setToastMsg("Aboneliğiniz başarıyla alındı! Teşekkür ederiz.");
      setToastOpen(true);
    } catch (err) {
      console.error("Subscription submit error:", err);
      setIsSubscribed(true);
    }
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(".reveal-element");
    animatedElements.forEach((el) => {
      el.classList.add("transition-all", "duration-[1000ms]", "opacity-0", "translate-y-8");
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const [productsState, setProductsState] = useState(() => getProducts());

  useEffect(() => {
    let isMounted = true;

    const refreshLive = () => {
      fetchProductsFromApi().then((live) => {
        if (isMounted && Array.isArray(live)) {
          setProductsState(live);
        }
      });
    };

    refreshLive();

    const handleProductsChanged = () => {
      if (isMounted) {
        setProductsState(getProducts());
        refreshLive();
      }
    };

    window.addEventListener("pekefe_products_changed", handleProductsChanged);
    window.addEventListener("pekefe_products_updated", handleProductsChanged);

    return () => {
      isMounted = false;
      window.removeEventListener("pekefe_products_changed", handleProductsChanged);
      window.removeEventListener("pekefe_products_updated", handleProductsChanged);
    };
  }, []);

  const products = useMemo(() => {
    if (!Array.isArray(productsState)) return [];
    const translateImage = (url) => {
      if (!url || typeof url !== "string") return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
      if (url.includes("/pekefe-dut-pekmezi-kavanoz.jpg") || url.includes("/geleneksel-pekmez.jpg") || url.includes("/geleneksel-pekmez.png")) {
        return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
      }
      if (url.includes("/premium-pekefe-kavanoz.png")) {
        return "/premium-pekefe-kavanoz-tr.png";
      }
      return url;
    };
    return productsState.filter(Boolean).map(p => {
      const rawPrice = p.price;
      // Handle all price formats: number, "300", "300 TL", "₺300"
      let numericPrice = 0;
      if (typeof rawPrice === "number") {
        numericPrice = rawPrice;
      } else if (typeof rawPrice === "string") {
        numericPrice = parseFloat(rawPrice.replace(/[₺TL\s,]/gi, "")) || 0;
      }
      const formattedPrice = numericPrice > 0 ? `₺${numericPrice.toLocaleString("tr-TR")}` : "₺0";
      return {
        ...p,
        priceDisplay: formattedPrice,
        priceFormatted: formattedPrice,
        price: formattedPrice,
        image: translateImage(p.image),
        images: Array.isArray(p.images) ? p.images.map(translateImage) : [translateImage(p.image)]
      };
    });
  }, [productsState]);

  const steps = [
    {
      title: "Hasavan İle Doğal Hasat",
      desc: "İspir vadisindeki asırlık dut ağaçlarından, dört kişinin gergin tuttuğu hasavan (dokuma keten bez) üzerine toprağa değmeden silkelenen en olgun beyaz dutlar seçilir.",
      image: "/uploads/ispir-saf-beyaz-dut-toplama.webp",
    },
    {
      title: "Öz Şıranın Çıkarılması",
      desc: "Toplanan dutlar kaynak sularıyla temizlenir, geleneksel ahşap pres cenderelerde sıkılarak posasından arındırılmış saf öz şıra elde edilir.",
      image: "/uploads/ispir-karadut-kaynatma-bakir-kazan.webp",
    },
    {
      title: "Güneşte Doğal Yoğunlaştırma (Gün Pekmezi)",
      desc: "Dut şırası yüksek ateşte yakılmaz; İlhan Efe zanaatkar yaklaşımıyla geniş hijyenik kaplarda İspir'in dağ güneşi altında sabırla ideal kıvamına ulaştırılır.",
      image: "/uploads/ispir-bakir-kazan-ahsap-cendere.webp",
    },
    {
      title: "Keten Bezlerde Güneşle Kurutma",
      desc: "İncecik keten sergiler üzerine dökülen dut herlesi, İspir'in nemsiz dağ rüzgarı ve bol güneşi altında 2 gün boyunca doğal olarak kurutulur.",
      image: "/uploads/ispir-keten-bezde-pestil-serimi.webp",
    },
    {
      title: "Usta Sarımı, Sıfır Atık & Hijyenik Paketleme",
      desc: "Usta ellerden fındık ezmeli ve cevizli sarma pestiller hazırlanıp nem bariyerli vakumlarda paketlenirken; kalan dut posaları hayvan yemi olarak yöre çiftçilerine kazandırılır.",
      image: "/uploads/ispir-el-sarimi-pestil-cesitleri.webp",
      gallery: [
        { label: "Vakumlu Cevizli Pestil", src: "/ispir-vakum-cevizli-pestil-beyaz.png" },
        { label: "Vakumlu Sade Pestil", src: "/ispir-vakum-sade-pestil-beyaz.png" },
        { label: "İspir Cevizli Köme", src: "/ispir-kome-beyaz.png" },
      ],
    },
  ];

  const seasons = {
    ilkbahar: {
      label: "İlkbahar",
      name: "İlkbahar (Doğanın Uyanışı)",
      months: "NİSAN - MAYIS",
      climate: "Rakım: 1200m - 1800m | Sıcaklık: 8°C - 18°C",
      story: "Erzurum İspir'in karlı zirvelerinden gelen kaynak sularının toprağı beslediği, asırlık dut ağaçlarının uyandığı dönemdir. Toprak organik olarak beslenir, budama işlemleri el makaslarıyla tamamlanır.",
      image: "/uploads/ispir-kackar-yaylalari-manzara.webp",
      action: "Budama & Toprak Hazırlığı",
    },
    yaz: {
      label: "Yaz",
      name: "Yaz (Altın Hasat & Gün Pekmezi)",
      months: "HAZİRAN - AĞUSTOS",
      climate: "Rakım: 1800m - 2200m | Sıcaklık: 24°C - 32°C",
      story: "Dutların en tatlı ve dolgun olduğu dönemdir. Dört kişilik hasavan bezleri gerilerek toprağa değmeden hasat başlar. Sıkılan saf dut şırası ateşte yakılmadan, geniş kaplarda İspir'in parlak güneşi altında sabırla yoğunlaştırılarak Dut Gün Pekmezi'ne dönüştürülür. Pestil harçları ise keten bezler üzerine serilerek yayla rüzgarında kurutulur.",
      image: "/uploads/ispir-dut-bahcesi-hasat-baba-ogul.jpg",
      action: "Hasavan Hasadı & Güneşte Yoğunlaştırma",
    },
    sonbahar: {
      label: "Sonbahar",
      name: "Sonbahar (Hasat Toplama & Köme)",
      months: "EYLÜL - KASIM",
      climate: "Rakım: 1500m - 2000m | Sıcaklık: 12°C - 20°C",
      story: "Yerli İspir cevizlerinin kabuklarından ayrılıp ipe dizildiği, dut şırası herlesine kat kat daldırılarak hazırlanan cevizli kömelerin güneş altında dinlendirildiği ve sonbahar hasadının toplandığı dönem.",
      image: "/ispir-kome-gercek-hasat.jpg",
      action: "Ceviz Hasadı & Köme Yapımı",
    },
    kis: {
      label: "Kış",
      name: "Kış (Dinlenme & Mahzen Olgunlaşması)",
      months: "ARALIK - MART",
      climate: "Rakım: 2000m+ | Sıcaklık: -15°C - 2°C",
      story: "Toprağın kar örtüsü altında dinlendiği dönemdir. Depolanan gün pekmezi, köme ve yaprak pestillerimiz iklimlendirmeli mahzenlerimizde nem bariyerli vakumlarla asaletini korur.",
      image: "/uploads/ispir-modern-hijyenik-tesis-dolum.webp",
      action: "İklimlendirmeli Mahzen & Kalite Kontrol",
    },
  };

  const labAnalysis = [
    {
      title: "HMF (Hidroksimetilfurfural) Seviyesi",
      value: "< 10 mg/kg",
      normal: "Yasal Üst Limit: 40 mg/kg",
      desc: "HMF, şıranın yüksek ateşte aşırı kaynatılarak yakılması sonucu oluşan zararlı bileşiktir. PEKEFE Dut Gün Pekmezi ateşte yakılmadan İspir güneşinde doğal sıcaklıkla yoğunlaştırıldığı için HMF değeri standartların çok altındadır.",
      icon: "science",
    },
    {
      title: "İlave Sakkaroz (Beyaz Şeker)",
      value: "0.0% (Bulunmadı)",
      normal: "Endüstriyel Ortalama: %15 - %35 şurup",
      desc: "Mahsullerimize hiçbir aşamada rafine şeker, glikoz veya mısır şurubu eklenmez. Elde edilen tat tamamen dut meyvesinin kendi doğal fruktoz ve glikoz dengesinden kaynaklanır.",
      icon: "check_circle",
    },
    {
      title: "Organik Demir & Kalsiyum Dengesi",
      value: "20g = 2mg Fe / 80mg Ca",
      normal: "Doğal Mineral Zenginliği",
      desc: "Yalnızca 2 yemek kaşığı (20 gram) pekmez; 2 miligram organik demir ve 80 miligram kalsiyum içerir. Kansızlık, kemik gelişimi ve mide sağlığına güçlü bir doğal destektir.",
      icon: "health_and_safety",
    },
    {
      title: "Doğal Meyve Aroması & Canlılık",
      value: "Maksimum Koruma",
      normal: "Yanık ve Kararma Yoktur",
      desc: "Güneşte sabırla yoğunlaştırma sayesinde meyvenin açık kehribar rengi, taze dut kokusu ve polifenolleri tam olarak korunur, acımsı karamelize tat oluşmaz.",
      icon: "wb_sunny",
    },
  ];

  const recipes = {
    tahini: {
      title: "Dut Gün Pekmezi & Taş Değirmen Tahin Eşleşmesi",
      quote: "Sessiz bir sabah kahvaltısının en asil ritüeli.",
      description: "İspir'in güneşte doğal yoğunlaşan akışkan kıvamlı Dut Gün Pekmezi ile kepeği alınmış susamdan taş değirmende çekilen taze tahinin %40'a %60 asimetrik birleşimi. Üzerine eklenen hafif kavrulmuş yerli İspir cevizi, pekmezin doğal meyve tatlılığını dengeler ve damakta ipeksi bir gastronomi deneyimi sunar.",
      tips: "Karıştırma işlemini seramik veya ahşap kaşık kullanarak dairesel hareketlerle yapın; metal kaşık pekmezin doğal meyve asiditesini etkileyebilir.",
      bg: "/uploads/tahini_pekmez_pair.jpg",
    },
    kaymak: {
      title: "Çıtır Karadeniz Fındığı & Doğal Bal ile Tatlandırılmış Pestil",
      quote: "Şeker ilavesiz, %100 saf ham çiçek balı tatlandırmalı.",
      description: "İspir yaylalarının 2200m+ rakımlı el değmemiş çiçeklerinden toplanan saf ham bal ile doğal olarak tatlandırılan incecik dut pestili, özenle çifte kavrulmuş çıtır Karadeniz fındığı ile buluşuyor. Yapay şeker veya glukoz kullanılmaksızın sadece doğal ham balın saf aromasıyla hazırlanır.",
      tips: "Pestil dilimlerini servis etmeden önce oda sıcaklığında 5 dakika dinlendirerek doğal bal ve taze fındık aromalarının damakta tam olarak açılmasını sağlayabilirsiniz.",
      bg: "/uploads/findik_pestil_pair.jpg",
    },
    cheese: {
      title: "İspir Dut Kömesi & Olgunlaştırılmış Keçi Peyniri",
      quote: "Zıt kutupların muhteşem lezzet harmonisi.",
      description: "Dut kömesinin (cevizli sucuk) içerdiği yerli ceviz aroması ve yoğun tatlı şıra kaplaması, hafif tuzlu ve sert karakterdeki olgun keçi peyniri ile eşsiz bir kontrast oluşturur. Şarküteri tahtalarının gizli yıldızı olan bu ikili, slow food gurmelerinin favori eşleşmesidir.",
      tips: "Keçi peynirini ince dilimler halinde kesin ve oda sıcaklığında, ince halkalar şeklinde dilimlenmiş kömelerle birlikte servis edin.",
      bg: "/uploads/kome_peynir_pair.jpg",
    },
  };

  return (
    <div className="relative w-full min-h-screen bg-background text-on-surface overflow-hidden">
      {/* Subtle background grain grid */}
      <div className="absolute inset-0 bg-[#F9F9FF] pointer-events-none opacity-40 mix-blend-multiply"></div>

      {/* ─── HERO SECTION (Cinematic Image Slider) ─── */}
      <HeroSlider />

      {/* Fırsat Ürünleri (Deal Products) Section */}
      <DealSection />

      {/* ─── BRAND STORY SECTION (Editorial Storytelling) ─── */}
      <section id="hikaye" className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal-element scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold block">
              Köklere Dönüş · İlhan Efe Mirası
            </span>
            <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold leading-tight">
              Güneşle Yoğunlaşan <br />
              <span className="text-on-surface italic font-serif font-normal">Geleneksel İspir Dut Gün Pekmezi</span>
            </h2>
            <div className="w-12 h-[1px] bg-secondary-container"></div>
            <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
              Bizim hikayemiz, Erzurum'un İspir ilçesinde emekli öğretmen <strong>İlhan Efe</strong>'nin çocukluktan bildiği pekmez zanaatını, TKDK desteği ve Avrupa Birliği hijyen standartlarıyla buluşturmasıyla başlar. Asırlık beyaz dutlarımız, 4 kişinin gergin tuttuğu <strong>hasavan (keten bez)</strong> üzerine toprağa değmeden dökülür.
            </p>
            <p className="font-body-md text-on-surface-variant text-base leading-relaxed">
              PEKEFE'de <strong>dut şırası yüksek ateşte yakılmaz</strong>; İspir'in nemsiz yayla güneşi altında doğal sıcaklıktan yararlanılarak sabırla yoğunlaştırılır. Şıra yanmadığı için HMF değeri ideal seviyelerde kalır, dutun canlı meyve şekeri ve mineral yapısı %100 korunur. Üretim posaları kurutulup hayvan yemi olarak çiftçilerimize kazandırılır.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <Image
                  src="/uploads/ispir-kackar-yaylalari-manzara.webp"
                  alt="İspir Kaçkar Yaylaları"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                <span className="absolute bottom-6 left-6 text-white font-display-lg text-lg font-bold z-20 drop-shadow">İspir Yaylaları</span>
              </div>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all sm:mt-12">
                <Image
                  src="/uploads/ispir_hikayemiz_ilhan_efe_beyaz_dut.jpg"
                  alt="İlhan Efe Geleneksel Hasat"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                <span className="absolute bottom-6 left-6 text-white font-display-lg text-lg font-bold z-20 drop-shadow">İlhan Efe Hasadı</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTION PROCESS SECTION (Timeline) ─── */}
      <section className="bg-surface-container-low border-y border-outline-variant/10 py-section-gap reveal-element">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold">
              Adım Adım Gelenek
            </span>
            <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold">
              Artisanal Üretim Sürecimiz
            </h2>
            <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Timeline Controls */}
            <div className="lg:col-span-4 space-y-3">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveStep(idx);
                    setStepImageOverride(null);
                  }}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-350 cursor-pointer flex items-start gap-4 ${
                    activeStep === idx
                      ? "bg-white border-primary shadow-md text-primary ring-1 ring-primary/20"
                      : "bg-white/50 border-outline-variant/30 text-on-surface-variant hover:bg-white hover:border-primary/40"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full font-bold text-xs flex-shrink-0 flex items-center justify-center border transition-colors ${
                    activeStep === idx ? "bg-primary text-white border-primary shadow-sm" : "bg-surface text-on-surface-variant border-outline-variant/60"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-label-md font-bold text-xs sm:text-sm uppercase tracking-wider text-primary">{step.title}</h4>
                    <p className="text-[11px] text-on-surface-variant/90 mt-1 line-clamp-2 leading-relaxed">{step.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Timeline Visual Display */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm grid grid-cols-1 md:grid-cols-2">
                <div className="h-80 md:h-full min-h-[340px] relative">
                  <Image
                    src={stepImageOverride || steps[activeStep].image}
                    alt={steps[activeStep].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/15 to-transparent z-10"></div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center space-y-5">
                  <span className="text-xs text-secondary uppercase font-label-sm tracking-widest font-bold">Aşama {activeStep + 1}</span>
                  <h3 className="font-display-lg text-primary text-2xl font-bold leading-snug">{steps[activeStep].title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                    {steps[activeStep].desc}
                  </p>
                  
                  {/* Interactive Sub-Gallery for Aşama 5 */}
                  {steps[activeStep].gallery && (
                    <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Otantik Ambalaj Çeşitlerimiz</span>
                      <div className="grid grid-cols-3 gap-3">
                        {steps[activeStep].gallery.map((g, gIdx) => (
                          <button
                            key={gIdx}
                            onClick={() => setStepImageOverride(g.src)}
                            className={`relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                              (stepImageOverride || steps[activeStep].image) === g.src ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-outline-variant/30 opacity-70 hover:opacity-100"
                            }`}
                            title={g.label}
                          >
                            <Image src={g.src} alt={g.label} fill sizes="60px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-secondary font-semibold pt-1">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    Kimyasal Katkı ve Yapay Koruyucu Yoktur
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE HARVEST CALENDAR & MICRO-CLIMATE EXPLORER ─── */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal-element">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold block">
              Doğal Döngü
            </span>
            <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold">
              İspir Hasat Takvimi <br />
              <span className="text-on-surface italic font-serif font-normal">& Mevsimsel Mikroklima</span>
            </h2>
            <div className="w-12 h-[1px] bg-secondary"></div>
            <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
              Toprağın uyanışından soğuk kış dinlenmesine kadar, PEKEFE mahsullerinin lezzetini oluşturan mevsimsel döngüyü keşfedin. Her mevsim, zanaatkarlarımızın asırlık ritüelleriyle şekillenir.
            </p>

            {/* Season Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Object.keys(seasons).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveSeason(key)}
                  className={`px-4 py-3 rounded-lg border text-left cursor-pointer transition-all ${
                    activeSeason === key
                      ? "bg-primary border-primary text-white shadow-sm"
                      : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="block text-[10px] uppercase tracking-wider font-semibold opacity-70">
                    {seasons[key].months}
                  </span>
                  <span className="font-display-lg text-sm font-bold block mt-0.5">
                    {seasons[key].label || key}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-outline-variant/15 p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary font-mono text-[10px] tracking-wider uppercase font-bold">
                {seasons[activeSeason].action}
              </div>
              <h3 className="font-display-lg text-primary text-2xl font-bold leading-tight">
                {seasons[activeSeason].name}
              </h3>
              <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest border-b border-outline-variant/10 pb-4">
                {seasons[activeSeason].climate}
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                {seasons[activeSeason].story}
              </p>
            </div>
            <div className="aspect-[4/5] rounded-xl overflow-hidden relative shadow-inner">
              <Image
                src={seasons[activeSeason].image}
                alt={seasons[activeSeason].name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS SECTION (Editorial Grid) ─── */}
      <section id="koleksiyon" className="py-12 md:py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-10 md:space-y-16 reveal-element scroll-mt-20">
        <div className="text-center space-y-2.5 md:space-y-3">
          <span className="text-secondary font-label-md text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold">
            Butik Koleksiyon
          </span>
          <h2 className="font-display-lg text-primary text-2xl sm:text-3xl md:text-headline-lg font-bold">
            Özel Reçeteli Mahsullerimiz
          </h2>
          <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto px-4">
            Sınırlı miktarda üretilen, coğrafi tescilli ve analiz raporlu İspir lezzetleri.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {products.map((p, idx) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              desc={p.desc}
              shortDesc={p.shortDesc}
              meta={p.meta}
              price={p.price}
              priceMin={p.priceMin}
              priceMax={p.priceMax}
              oldPrice={p.oldPrice || p.list_price}
              list_price={p.list_price}
              b2b_price={p.b2b_price}
              isCampaignActive={p.isCampaignActive}
              discount_end_date={p.discount_end_date}
              discount_start_date={p.discount_start_date}
              badgeText1={p.badgeText1 || p.attributes?.badgeText1}
              badgeText2={p.badgeText2 || p.attributes?.badgeText2}
              attributes={p.attributes}
              variants={p.variants || []}
              image={p.image}
              tag={p.tag}
              stock={p.stock}
              onAddToCart={(selectedVar) => {
                const effectivePrice = Number(
                  selectedVar?.price ?? 
                  p.price ?? 
                  p.sale_price ?? 
                  p.list_price ?? 
                  p.oldPrice ?? 
                  0
                );
                const varLabel = selectedVar?.attributes?.size || selectedVar?.attributes?.name || selectedVar?.name || selectedVar?.size || "";
                const itemToAdd = {
                  id: selectedVar?.id ? `${p.id}_${selectedVar.id}` : p.id,
                  productId: p.id,
                  name: (varLabel && varLabel !== p.name) ? `${p.name} (${varLabel})` : p.name,
                  price: effectivePrice,
                  sku: selectedVar?.sku || p.sku || p.id,
                  image: p.image,
                  quantity: 1
                };
                addToCart(itemToAdd);
                setToastMsg(`${itemToAdd.name} sepete eklendi!`);
                setToastOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* ─── WHY PEKEFE (Brand Pillars) ─── */}
      <section className="bg-surface-container-lowest border-y border-outline-variant/10 py-section-gap reveal-element">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold">
              Karakteristik Özellikler
            </span>
            <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold">
              Neden PEKEFE?
            </h2>
            <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-3xl">nature_people</span>
              </div>
              <h4 className="font-display-lg text-primary text-lg font-bold">Glikoz Şurubu İçermez</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                Pekmez ve tatlılarımızın tamamında sadece dut ağaçlarının kendi öz meyve şekeri bulunur. İlave şeker veya tatlandırıcı eklenmez.
              </p>
            </div>
            <div className="text-center p-6 space-y-4 border-y md:border-y-0 md:border-x border-outline-variant/30">
              <div className="w-16 h-16 rounded-full bg-secondary/5 border border-secondary/10 flex items-center justify-center mx-auto text-secondary">
                <span className="material-symbols-outlined text-3xl">wb_sunny</span>
              </div>
              <h4 className="font-display-lg text-primary text-lg font-bold">Güneşte Kurutma</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                Pestil ve kömelerimiz, fırınlama veya kimyasal şoklama işlemine uğramadan, İspir vadisinin kuru rüzgarlarında doğal güneşle kurutulur.
              </p>
            </div>
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-3xl">science</span>
              </div>
              <h4 className="font-display-lg text-primary text-lg font-bold">Katkı ve Koruyucu Yok</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                Laboratuvar analiz raporları ile onaylanmış, HMF değerleri düşük, sıfır koruyucu ve sıfır kıvam arttırıcı içeren gerçek butik üretim.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LABORATORY TRANSPARENCY SECTION ─── */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal-element">
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-8 md:p-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold block">
                Bilimsel Dürüstlük
              </span>
              <h2 className="font-display-lg text-primary text-3xl md:text-4xl font-bold leading-tight">
                Laboratuvar Analiz <br />
                <span className="text-on-surface italic font-serif font-normal">Şeffaflık Raporumuz</span>
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                Sözde değil, belgelenmiş saflık. Her üretim partimiz bağımsız gıda kontrol laboratuvarlarında analiz edilerek HMF, glikoz, nem ve katkı maddesi testlerinden geçirilir. Analiz kartlarına tıklayarak rapor detaylarını inceleyebilirsiniz.
              </p>
              <div className="pt-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-700 text-3xl">verified</span>
                <div>
                  <h4 className="font-label-md font-bold text-xs text-on-surface uppercase tracking-wider">%100 Doğallık Onaylı</h4>
                  <p className="text-[10px] text-on-surface-variant">T.C. Tarım ve Orman Bakanlığı &amp; Türk Gıda Kodeksi Standartlarına Uygun</p>
                </div>
              </div>
            </div>

            {/* Analysis Grid & Inspector */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {labAnalysis.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveLabCard(idx)}
                  className={`text-left p-6 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    activeLabCard === idx
                      ? "bg-white border-primary shadow-md"
                      : "bg-white/50 border-outline-variant/20 hover:bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                    <span className="font-mono text-xs font-bold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                      {item.value}
                    </span>
                  </div>
                  <h4 className="font-display-lg text-primary text-sm font-bold uppercase tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant/80 font-mono">
                    {item.normal}
                  </p>
                  {activeLabCard === idx && (
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-2 pt-2 border-t border-outline-variant/10 animate-fade-in font-body-sm">
                      {item.desc}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── İSPİR HERITAGE SECTION ─── */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal-element">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm aspect-[16/9]">
              <Image
                src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
                alt="İspir Kaçkar Yedi Göller & Çoruh Vadisi Mikrokliması"
                fill
                sizes="(max-width: 1200px) 100vw, 58vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/35 to-transparent z-10"></div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold block">
              Coğrafi Vatan
            </span>
            <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold">
              İspir'in Benzersiz Mikrokliması
            </h2>
            <div className="w-12 h-[1px] bg-secondary"></div>
            <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
              Erzurum'un kuzeyinde yer alan İspir, Çoruh vadisinin korunaklı konumu sayesinde sıra dışı bir mikroklimaya sahiptir. Yüksek rakımdaki yoğun güneş radyasyonu ve geceleri esen serin dağ esintileri, dut ağaçlarının meyvelerindeki mineral, vitamin ve aromatik zenginliği en üst seviyeye ulaştırır.
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
              PEKEFE ürünleri gücünü işte bu sert ama cömert coğrafi koşullardan ve nesillerdir korunan geleneksel tarım tekniklerinden alır.
            </p>
          </div>
        </div>
      </section>

      {/* ─── RECIPES & SERVING SUGGESTIONS SECTION (Magazine Layout) ─── */}
      <section className="bg-surface-container-low border-y border-outline-variant/10 py-section-gap reveal-element">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold">
              Gurme Gastronomi
            </span>
            <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold">
              Editoryal Servis Önerileri
            </h2>
            <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            {/* Toggles Column */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <button
                  onClick={() => setActiveRecipe("tahini")}
                  className={`w-full text-left p-6 rounded-xl border transition-all cursor-pointer ${
                    activeRecipe === "tahini"
                      ? "bg-white border-primary shadow-sm text-primary"
                      : "bg-white/40 border-outline-variant/30 text-on-surface-variant hover:bg-white"
                  }`}
                >
                  <h4 className="font-label-md font-bold text-sm uppercase tracking-wider">Tahini & Pekmez</h4>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">Kahvaltının en asil ikilisi.</p>
                </button>
                <button
                  onClick={() => setActiveRecipe("kaymak")}
                  className={`w-full text-left p-6 rounded-xl border transition-all cursor-pointer ${
                    activeRecipe === "kaymak"
                      ? "bg-white border-primary shadow-sm text-primary"
                      : "bg-white/40 border-outline-variant/30 text-on-surface-variant hover:bg-white"
                  }`}
                >
                  <h4 className="font-label-md font-bold text-sm uppercase tracking-wider">Fındık & Pestil</h4>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">Doğal ham bal ile tatlandırılmış çıtır fındık dokusu.</p>
                </button>
                <button
                  onClick={() => setActiveRecipe("cheese")}
                  className={`w-full text-left p-6 rounded-xl border transition-all cursor-pointer ${
                    activeRecipe === "cheese"
                      ? "bg-white border-primary shadow-sm text-primary"
                      : "bg-white/40 border-outline-variant/30 text-on-surface-variant hover:bg-white"
                  }`}
                >
                  <h4 className="font-label-md font-bold text-sm uppercase tracking-wider">Köme & Keçi Peyniri</h4>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">Tuzlu ve tatlının asil zıtlığı.</p>
                </button>
              </div>
              <div className="p-6 bg-white/50 border border-outline-variant/20 rounded-xl hidden lg:block">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">Slow Food İpucu</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Pekmezli tariflerde metal kaşık yerine ahşap veya bambu servis elemanları tercih edilmelidir.
                </p>
              </div>
            </div>

            {/* Display Column */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm grid grid-cols-1 md:grid-cols-2 h-full">
                <div className="h-64 md:h-full min-h-[320px] relative">
                  <Image
                    key={recipes[activeRecipe].bg}
                    src={recipes[activeRecipe].bg}
                    alt={recipes[activeRecipe].title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/15 to-transparent z-10"></div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
                  <span className="text-xs text-secondary uppercase font-label-sm tracking-widest">{recipes[activeRecipe].quote}</span>
                  <h3 className="font-display-lg text-primary text-2xl font-bold">{recipes[activeRecipe].title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                    {recipes[activeRecipe].description}
                  </p>
                  <div className="pt-4 border-t border-outline-variant/10 text-xs text-on-surface-variant italic">
                    <strong>Püf Noktası:</strong> {recipes[activeRecipe].tips}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ─── */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto reveal-element">
        <div className="text-center space-y-3 mb-16">
          <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold">
            Güven ve Deneyim
          </span>
          <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold">
            Sofralardan Yansıyanlar
          </h2>
          <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-base text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200/50">Doğrulanmış Alıcı</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                “Pekefe'nin Dut Gün Pekmezini tattıktan sonra market raflarındaki hiçbir ticari pekmezi tüketemez olduk. Şıranın yanmadığı açık kehribar renginden ve boğazı yakmayan o saf meyve tatlılığından hemen anlaşılıyor. Emeğinize sağlık.”
              </p>
            </div>
            <div className="flex items-center gap-3 pt-5 border-t border-outline-variant/15">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shadow-inner">
                A.T
              </div>
              <div>
                <h4 className="font-display-lg font-bold text-primary text-sm">Alperen Tan</h4>
                <p className="text-[11px] text-on-surface-variant">Ankara · Gastronomi Yazarı &amp; Gurme</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-base text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200/50">Doğrulanmış Alıcı</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                “Danışanlarıma özellikle tavsiye ettiğim hakiki bir demir ve kalsiyum deposu. İlave şekersiz olması, HMF değerinin düşüklüğü ve yaprak dut pestilinin keten bezde güneşte kurutulması geleneksel gıdanın en saf örneği.”
              </p>
            </div>
            <div className="flex items-center gap-3 pt-5 border-t border-outline-variant/15">
              <div className="w-11 h-11 rounded-full bg-secondary/10 text-secondary font-bold flex items-center justify-center text-sm border border-secondary/20 shadow-inner">
                S.D
              </div>
              <div>
                <h4 className="font-display-lg font-bold text-primary text-sm">Uzm. Dyt. Selin Demir</h4>
                <p className="text-[11px] text-on-surface-variant">İstanbul · Beslenme ve Diyet Uzmanı</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-base text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200/50">Kurumsal Bayi</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body-md">
                “İspir Cevizli Dut Kömesi ve Doğal Dut Sirkesi şarküterimizin en çok talep gören ürünleri oldu. Ceviz tazeliği, ipeksi yumuşaklığı ve TKDK onaylı hijyenik tesis standardı müşterilerimize tam güven veriyor.”
              </p>
            </div>
            <div className="flex items-center gap-3 pt-5 border-t border-outline-variant/15">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shadow-inner">
                M.E
              </div>
              <div>
                <h4 className="font-display-lg font-bold text-primary text-sm">Mustafa Efe</h4>
                <p className="text-[11px] text-on-surface-variant">İzmir · Gurme Şarküteri İşletmecisi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INSTAGRAM MASONS GALLERY SECTION ─── */}
      <section className="py-section-gap border-t border-outline-variant/15 bg-surface-container-low reveal-element">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold">
              Görsel Hikayeler
            </span>
            <h2 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold">
              Atölyemizden Kareler
            </h2>
            <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <Image
                src="/uploads/ispir-dut-bahcesi-hasat-baba-ogul.jpg"
                alt="İspir Dut Hasadı"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-xs font-label-sm tracking-wider uppercase font-bold">İspir Dut Hasadı</span>
              </div>
            </div>
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group row-span-2">
              <Image
                src="/uploads/ispir-modern-hijyenik-tesis-dolum.webp"
                alt="Pekefe Steril Üretim Tesisimiz"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-xs font-label-sm tracking-wider uppercase font-bold">Steril Tesisimiz</span>
              </div>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <Image
                src="/pekefe-dut-pekmezi-kavanoz-tr.jpg"
                alt="Pekefe Cam Kavanoz Dolum"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-xs font-label-sm tracking-wider uppercase font-bold">Cam Kavanoz Dolum</span>
              </div>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <Image
                src="/uploads/ispir-keten-bezde-pestil-serimi.webp"
                alt="Güneşte Keten Bez Pestil Sergisi"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-xs font-label-sm tracking-wider uppercase font-bold">Keten Bez Serimi</span>
              </div>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <Image
                src="/uploads/ispir-muska-kome-saray-tatlilari.webp"
                alt="Geleneksel Muska & Cevizli Köme"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-xs font-label-sm tracking-wider uppercase font-bold">Köme & Muska Seçkisi</span>
              </div>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <Image
                src="/uploads/ispir-bakir-kazan-ahsap-cendere.webp"
                alt="Geleneksel Bakır Kazan & Odun Ateşi"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-xs font-label-sm tracking-wider uppercase font-bold">Meşe Ateşi Bakır Kazan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER SIGNUP SECTION ─── */}
      <section className="bg-gradient-to-br from-[#4a1220] via-[#5c1729] to-[#3b0d19] text-white py-24 relative overflow-hidden reveal-element border-t border-white/10">
        {/* Ambient lighting & decorative rings */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 border border-amber-400/40 rounded-full"></div>
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] border border-amber-400/30 rounded-full"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full"></div>

        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center relative z-10">
          {!isSubscribed ? (
            <div className="max-w-2xl mx-auto space-y-8 bg-white/[0.03] border border-white/15 backdrop-blur-md p-8 sm:p-12 rounded-3xl shadow-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 font-bold text-xs uppercase tracking-[0.25em]">
                <span className="material-symbols-outlined text-sm text-amber-400">mail</span>
                PEKEFE BÜLTEN KULÜBÜ
              </div>

              <h2 className="font-display-lg text-white text-3xl md:text-4xl font-bold leading-tight">
                Sınırlı Rekolte ve Özel Tadımlardan <br />
                <span className="italic font-normal font-serif text-amber-300">İlk Siz Haberdar Olun.</span>
              </h2>

              <p className="text-sm text-white/80 max-w-md mx-auto font-light leading-relaxed">
                İspir yaylalarının en özel rekolte ürünleri ve butik kampanya ayrıcalıklarından haberdar olmak için bültenimize katılın.
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto pt-2">
                <input
                  type="email"
                  required
                  placeholder="E-posta adresinizi giriniz..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow bg-white text-slate-900 placeholder:text-slate-400 border border-white/30 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white shadow-inner transition-all"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg hover:shadow-amber-400/25 transition-all duration-300 active:scale-95 text-sm whitespace-nowrap cursor-pointer"
                >
                  Abone Ol
                </button>
              </form>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-400 text-base">verified</span>
                  %100 Doğal & Şeker İlavesiz
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-400 text-base">lock</span>
                  Spam Gönderilmez
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-400 text-base">card_giftcard</span>
                  Özel Rekolte Ayrıcalıkları
                </span>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in py-8 space-y-4 max-w-md mx-auto bg-white/[0.04] border border-amber-400/30 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 mb-2">
                <span className="material-symbols-outlined text-amber-300 text-3xl">mark_email_read</span>
              </div>
              <h3 className="font-display-lg text-white text-2xl font-bold">Aboneliğiniz Tamamlandı</h3>
              <p className="font-body-md text-white/85 leading-relaxed text-sm">
                Kaydınız <strong className="text-amber-300 font-bold">{email}</strong> e-posta adresiyle başarıyla gerçekleştirildi. Özel rekolte duyurularımız gelen kutunuza ulaştırılacaktır.
              </p>
            </div>
          )}
        </div>
      </section>
      <Toast
        message={toastMsg}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}

