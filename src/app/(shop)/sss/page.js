"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

const faqData = [
  {
    category: "order",
    categoryTitle: "Sipariş ve Teslimat",
    categoryIcon: "local_shipping",
    questions: [
      {
        id: "order-1",
        q: "Siparişim ne kadar sürede ulaşır?",
        a: "Siparişleriniz, ürünün hazırlanma süresine bağlı olarak 24-48 saat içerisinde kargoya teslim edilir. Türkiye genelinde teslimat süremiz kargo firmasına bağlı olarak genellikle 2-4 iş günüdür. Erzurum'dan taze taze çıkan paketleriniz, en güvenli şekilde adresinize ulaştırılır."
      },
      {
        id: "order-2",
        q: "Kargo ücreti ne kadar?",
        a: "₺750 ve üzeri siparişlerde kargo tamamen ücretsizdir. Bu tutarın altındaki siparişleriniz için standart kargo ücreti ödeme sayfasında otomatik olarak hesaplanacaktır. Hiçbir gizli ücret veya sürpriz ek kalem bulunmaz."
      },
      {
        id: "order-3",
        q: "Soğuk zincir kargo nedir?",
        a: "Ürünlerimiz özellikle sıcak yaz aylarında bozulmaması için termal yalıtımlı soğuk zincir kutuları ile gönderilir. Bu kutular taşıma süresi boyunca ürünü ideal sıcaklıkta tutar. Soğuk zincir kargo seçeneği ödeme sayfasında görüntülenir."
      }
    ]
  },
  {
    category: "products",
    categoryTitle: "Ürünler ve Kalite",
    categoryIcon: "verified",
    questions: [
      {
        id: "prod-1",
        q: "Ürünleriniz organik mi?",
        a: "Pekefe ürünlerinin tamamı geleneksel yöntemlerle, hiçbir katkı maddesi ve koruyucu içermeden üretilir. İspir'in 2.200m rakımlı yaylalarından toplanan mahsullerimiz doğal döngüsünde yetişmektedir."
      },
      {
        id: "prod-2",
        q: "Saklama koşulları nelerdir?",
        a: "Özellikle pekmez ve bal ürünlerimizi serin ve güneş görmeyen bir yerde muhafaza etmenizi öneririz. Kurutulmuş ürünlerimiz ise nemsiz ortamlarda uzun süre tazeliğini korur."
      },
      {
        id: "prod-3",
        q: "Coğrafi işaret nedir ve İspir Kömesi için geçerli mi?",
        a: "Coğrafi İşaret; belirli bir coğrafi bölgeden gelen, o bölgenin özelliklerini, iklimini, toprağını ve insan emeğini taşıyan ürünleri tanımlayan resmi bir tescildir. İspir Dut Kömesi, Türk Patent ve Marka Kurumu (TÜRKPATENT) tarafından Coğrafi İşaret tescili almış özgün bir üründür; yalnızca İspir'de üretilenler bu adı kullanabilir."
      },
      {
        id: "prod-4",
        q: "HMF değeri ne anlama gelir?",
        a: "HMF (Hidroksimetilfurfural), yüksek ısıda kaynatılan gıdalarda oluşan ve sağlığı olumsuz etkileyen bir bileşiktir. Pekefe'nin vakumlu düşük sıcaklık (maks. 65°C) üretim yöntemi sayesinde tüm ürünlerimizde HMF değeri uluslararası limitlerin çok altındadır ve sertifikalı laboratuvar analizleri ile belgelenmektedir."
      }
    ]
  },
  {
    category: "returns",
    categoryTitle: "İade ve Geri Ödeme",
    categoryIcon: "assignment_return",
    questions: [
      {
        id: "ret-1",
        q: "Hasarlı ürün gelirse ne yapmalıyım?",
        a: "Paketiniz hasarlı ulaştıysa kargo görevlisine tutanak tutturarak ürünü kabul etmeyiniz. Eğer kutu açıldıktan sonra bir sorun fark ederseniz, ürünün fotoğraflarını çekerek müşteri hizmetlerimizle iletişime geçiniz; derhal telafi edilecektir."
      },
      {
        id: "ret-2",
        q: "İade süresi ne kadar?",
        a: "Ürünü teslim aldıktan itibaren 14 takvim günü içinde iade talebinde bulunabilirsiniz. Gıda ürünlerinin iadesi için ambalajın açılmamış ve orijinal durumda olması gerekmektedir. İade süreciniz başlatıldıktan sonra 5 iş günü içinde ödemeniz iade edilir."
      }
    ]
  },
  {
    category: "b2b",
    categoryTitle: "Kurumsal & B2B",
    categoryIcon: "storefront",
    questions: [
      {
        id: "b2b-1",
        q: "Toptan sipariş verebilir miyim?",
        a: "Evet, B2B Bayi Portalımız üzerinden koli bazlı toptan sipariş verebilirsiniz. Restoran, otel, kuru yemişçi, organik market ve ihracat firmalarına özel fiyat listeleri ve vade seçenekleri mevcuttur. Kurumsal teklifler için info@pekefe.com adresinden bizimle iletişime geçebilirsiniz."
      },
      {
        id: "b2b-2",
        q: "Minimum sipariş miktarı nedir?",
        a: "B2B siparişlerinde minimum sipariş miktarı 1 koli (ürüne göre 10-20 birim) olup koli fiyatları perakende birim fiyatından %20-25 daha avantajlıdır. Platinum Bayi statüsündeki firmalarımız için özel fiyatlandırma uygulanmaktadır."
      }
    ]
  }
];

export default function SSS() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(getSettings());
    fetchLiveSettings().then((live) => {
      if (live) setSettings(live);
    });

    const handleSettingsChange = () => {
      setSettings(getSettings());
    };
    window.addEventListener("pekefe_settings_changed", handleSettingsChange);
    return () => {
      window.removeEventListener("pekefe_settings_changed", handleSettingsChange);
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordionId, setActiveAccordionId] = useState("order-1"); // Open first item by default
  const [activeCategory, setActiveCategory] = useState("order");

  const toggleAccordion = (id) => {
    setActiveAccordionId(activeAccordionId === id ? null : id);
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    const element = document.getElementById(catId);
    if (element) {
      const yOffset = -120; // sticky header spacing
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Dynamic search and filter mapping
  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return faqData;

    return faqData
      .map(cat => {
        const matchingQuestions = cat.questions.filter(
          item =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return {
          ...cat,
          questions: matchingQuestions
        };
      })
      .filter(cat => cat.questions.length > 0);
  }, [searchQuery]);

  return (
    <div className="bg-pattern min-h-screen">
      {/* Hero Section */}
      <section className="relative py-section-gap overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-10"
            style={{
              backgroundImage: "url('/uploads/ispir-yedi-goller-kackar-manzara.webp')",
            }}
          ></div>
        </div>
        <div className="relative z-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
          <h1 className="font-display-lg text-display-lg mb-6 text-primary font-bold">
            Size Nasıl Yardımcı Olabiliriz?
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Pekefe geleneksel ürünleri, sipariş süreçleri ve kalite standartlarımız hakkında merak ettiğiniz tüm soruların yanıtlarını burada bulabilirsiniz.
          </p>

          {/* SearchBar Component */}
          <div className="mt-12 max-w-xl mx-auto relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 px-6 py-4 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm font-body-md"
              placeholder="Soru ara..."
              type="search"
              aria-label="SSS konularında arama yap"
              id="sss-search"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary/50">
              search
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Categories & Accordions */}
      <section className="pb-section-gap">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Sidebar Nav */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-28 space-y-2">
              {faqData.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => handleCategoryClick(cat.category)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-label-md cursor-pointer transition-colors text-left ${
                    activeCategory === cat.category
                      ? "bg-primary-container text-white font-bold"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined">{cat.categoryIcon}</span>
                  {cat.categoryTitle}
                </button>
              ))}
            </div>
          </aside>

          {/* Accordions */}
          <div className="lg:col-span-9 space-y-12">
            {filteredFaq.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-5xl mb-4">search_off</span>
                <p className="font-headline-md text-on-surface-variant">Aradığınız kriterlere uygun soru bulunamadı.</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 bg-primary text-white font-label-md px-6 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  Aramayı Temizle
                </button>
              </div>
            ) : (
              filteredFaq.map((cat) => (
                <div key={cat.category} id={cat.category} className="scroll-mt-28">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">{cat.categoryIcon}</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary font-bold">{cat.categoryTitle}</h2>
                  </div>

                  <div className="space-y-4">
                    {cat.questions.map((item) => {
                      const isOpen = activeAccordionId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`accordion-item bg-surface-container-lowest rounded-2xl shadow-sm border transition-all ${
                            isOpen ? "border-primary/20 bg-white" : "border-transparent hover:border-outline-variant/20"
                          }`}
                        >
                          <button
                            onClick={() => toggleAccordion(item.id)}
                            className="w-full flex justify-between items-center p-6 cursor-pointer text-left"
                            aria-expanded={isOpen}
                            aria-controls={`answer-${item.id}`}
                            id={`question-${item.id}`}
                          >
                            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold pr-4">
                              {item.q}
                            </h3>
                            <span
                              className={`material-symbols-outlined transition-transform duration-300 text-secondary flex-shrink-0 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                              aria-hidden="true"
                            >
                              expand_more
                            </span>
                          </button>
                          <div
                            id={`answer-${item.id}`}
                            role="region"
                            aria-labelledby={`question-${item.id}`}
                            className={`transition-all duration-300 overflow-hidden ${
                              isOpen ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <p className="font-body-md text-on-surface-variant leading-relaxed px-6">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="bg-primary rounded-[32px] p-8 md:p-16 text-center text-on-primary relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary rounded-full blur-[100px] opacity-20 transition-transform duration-700 group-hover:scale-125"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display-lg text-display-lg mb-6 font-bold text-white">Hala Sorularınız mı Var?</h2>
            <p className="font-body-lg text-body-lg text-on-primary/80 mb-10">
              Müşteri hizmetleri ekibimiz size yardımcı olmaktan mutluluk duyacaktır. Bize her zaman ulaşabilirsiniz.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                className="px-8 py-4 bg-secondary text-white font-label-md rounded-full hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 shadow-lg cursor-pointer"
                href={`mailto:${settings.email}`}
              >
                <span className="material-symbols-outlined">mail</span>
                Bize Yazın
              </a>
              <a
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-label-md rounded-full hover:bg-white/20 active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
              >
                <span className="material-symbols-outlined">call</span>
                Hemen Arayın
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
