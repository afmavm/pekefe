"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

const faqData = [
  {
    category: "siparis",
    categoryTitle: "Siparis & Teslimat",
    categoryIcon: "local_shipping",
    questions: [
      { id: "siparis-1", q: "Siparisim ne kadar surede kargoya verilir?", a: "Siparisleriniz 1-2 is gunu icinde hazirlanip kargoya verilir. Pazartesi-Persembe 14:00 a kadar verilen siparisler ayni gun kargoya cikabilir." },
      { id: "siparis-2", q: "Siparisim kac gunde elime ulasilir?", a: "Turkiye genelinde 2-4 is gunu icinde teslim edilir. Dogu Anadolu bolgelerine 3-5 is gunu surebilir." },
      { id: "siparis-3", q: "Kargo ucreti ne kadar?", a: "Kargo Ucret Alici Odemeli sistemiyle calisir. Sepet toplamina eklenmez, teslimat aninda kapida kurye gorevlisine odenir." },
      { id: "siparis-4", q: "Hangi kargo firmalariyla calisiyorsunuz?", a: "Yurtici Kargo ve Surat Kargo ile calisiyoruz. Kargo cikisinda takip numarasi SMS ve e-posta ile bildirilir." },
      { id: "siparis-5", q: "Siparisimi nasil takip edebilirim?", a: "Kargo cikisinda size SMS ve e-posta ile takip numarasi gonderilir. Hesabinizdaki Siparislerim bolumunden de anlik takip yapabilirsiniz." },
      { id: "siparis-6", q: "Kapida odeme secenegi var mi?", a: "Kapida odeme aktif degildir. Odemenizi siparis sirasinda kredi karti, banka karti veya havale/EFT ile gerceklestirebilirsiniz." },
      { id: "siparis-7", q: "Teslimat adresimi degistirebilir miyim?", a: "Siparis kargoya verilmeden once iletisime gececeginiz takdirde adresi guncelleyebiliyoruz. Kargo ciktiktan sonra kargo firmasi musteri hizmetleriyle iletisime geciniz." }
    ]
  },
  {
    category: "urunler",
    categoryTitle: "Urunler & Kalite",
    categoryIcon: "verified",
    questions: [
      { id: "urun-1", q: "Urunleriniz organik mi?", a: "Pekefe urunleri hicbir sentetik katki maddesi, koruyucu veya renklendirici icermez. ISO 22000 standardina uygun uretim hattinda hazirlanir, bagimsiz laboratuvarlarca analiz edilir." },
      { id: "urun-2", q: "Ham dut pekmezi nedir?", a: "Dutun taze suyu isil islem uygulanmadan veya max 65 derecede vakumlu sistemlerde yogunlastirilir. Dogal enzimler, antioksidanlar ve vitaminler korunur. Pisirilmis pekmezde ise HMF degeri yukselip besin icerigi azalir." },
      { id: "urun-3", q: "HMF degeri neden onemli?", a: "HMF (Hidroksimetilfurfural), yuksek sicaklikta islenen gidalarda olusur. AB ve Turk Gida Kodeksi siniri 40 mg/kg dir. Pekefe urunlerinde bu sinirin cok altindadir; akredite lab raporlariyla belgelenir." },
      { id: "urun-4", q: "Ispir Komesi nedir ve cografi isaret var mi?", a: "Dut suyu ile bugdayununun bakir kazanlarda kaynatilmasiyla yapilan geleneksel bir tatlidir. TURKPATENT Cografi Isaret tescillidir. Yalnizca Ispir sinirlarinda uretilen urunler bu ismi kullanabilir." },
      { id: "urun-5", q: "Ispir bali neden degerli?", a: "1800-2500 m rakimli Kackar florasi, kara cicek, kusburnu, yabani gul ve dag kekigiyle beslenir. Polifenol ve antioksidan bakimindan ova balindan kat kat ustundur. Pekefe bali hasat sonrasi yalnizca suzme isleminden gecirir." },
      { id: "urun-6", q: "Saklama kosullari ve son kullanma tarihi nedir?", a: "Pekmez ve bal; serin, karanlik ve nemsiz ortamda acilmadan 24 ay dayanir. Acildiktan sonra oda sicakliginda muhafaza edilmeli. Kurutulmus urunler 12 ay dayanir." },
      { id: "urun-7", q: "Bal kristallesirse bozulmus mu?", a: "Hayir, kristallesme dogal ve saf balin kalite gostergesidir. Benmari ile 40 derece asmayacak sekilde eritebilirsiniz. Mikrodalga onerilmez, enzimleri tahrip eder." },
      { id: "urun-8", q: "Urunlere seker veya glikoz ekleniyor mu?", a: "Kesinlikle hayir. Pekmezlere tatlandirici, seker veya glikoz surubu eklenmez. Ballar yalnizca suzme isleminden gecer, herhangi bir isil islem ya da katki uygulanmaz." }
    ]
  },
  {
    category: "odeme",
    categoryTitle: "Odeme & Guvenlik",
    categoryIcon: "payment",
    questions: [
      { id: "odeme-1", q: "Hangi odeme yontemlerini kullanabilirim?", a: "Kredi karti, banka karti (Visa, Mastercard, Troy) ve havale/EFT ile guvenli odeme yapabilirsiniz. Siparis tutarina gore 2, 3 veya 6 taksit secanekleri de mevcuttur." },
      { id: "odeme-2", q: "Havale ile odeyen musterilere indirim var mi?", a: "Evet! Havale veya EFT ile odeme yapan musterilerimize ozel ek sepet indirimi uygulanir. Guncel oran odeme sayfasinda ve kampanyalar bolumunde belirtilmektedir." },
      { id: "odeme-3", q: "Kredi karti bilgilerim guvende mi?", a: "Odeme altyapimiz PCI DSS Level 1 uyumlu Paytr sistemi uzerinden calisir. Kart bilgileriniz sunucularda saklanmaz; tum islemler SSL/TLS sifreli baglantiyla gerceklesiyor." },
      { id: "odeme-4", q: "Indirim kodu nasil kullanilir?", a: "Sepet sayfasindaki Indirim Kodunuzu Giriniz alanina kodunuzu yazip Uygula butonuna tiklamaniz yeterlidir. Gecerli kod girildiginde indirim tutari sepet ozetine aninda yansir." },
      { id: "odeme-5", q: "Taksit secenekleri nelerdir?", a: "2 ve 3 taksit ek ucret olmaksizin, 6 taksit kucuk vade farkiyla sunulmaktadir. Taksit secenekleri odeme sayfasinda kartiniza gore otomatik listelenir." }
    ]
  },
  {
    category: "iade",
    categoryTitle: "Iade & Degisim",
    categoryIcon: "assignment_return",
    questions: [
      { id: "iade-1", q: "Urunu iade edebilir miyim?", a: "Teslim tarihinden itibaren 14 takvim gunu icinde iade talebinde bulunabilirsiniz. Gida urunleri icin ambalajin acilmamis ve orijinal durumda olmasi zorunludur." },
      { id: "iade-2", q: "Hasarli veya yanlis urun gelirse ne yapmaliyim?", a: "Gorunur hasarda kargo teslimini kabul etmeyip tutanak tutturabilirsiniz. Ambalaj acildiktan sonra hasar ya da yanlis urun fark ederseniz fotografini cekerek info@pekefe.com adresine gonderin, 24 saat icinde cozum uretiriz." },
      { id: "iade-3", q: "Iade sureci nasil isliyor?", a: "Iade talebinizde size bir iade kodu ve adres bilgisi gonderilir. Urunu orijinal ambalajinda kargolayarak gondermeniz yeterlidir. Urunde ulasilip incelendikten sonra 5 is gunu icinde odemeniz iade edilir." },
      { id: "iade-4", q: "Iade kargo ucreti kime ait?", a: "Yanlis, eksik veya hasarli urun kaynakli iadelerde kargo ucreti bize aittir. Musteri kaynakli iadelerde ise kargo ucreti musteriye aittir." }
    ]
  },
  {
    category: "kurumsal",
    categoryTitle: "Kurumsal & B2B",
    categoryIcon: "storefront",
    questions: [
      { id: "b2b-1", q: "Toptan siparis verebilir miyim?", a: "Evet! B2B Bayi Portali uzerinden koli ve palet bazinda toptan siparis verebilirsiniz. Restoran, otel, organik market ve ihracat firmalarına ozel fiyat listeleri ve vade secenekleri sunuyoruz. Teklif icin info@pekefe.com adresine yazin." },
      { id: "b2b-2", q: "Minimum siparis miktari nedir?", a: "B2B icin minimum siparis 1 koli (urune gore 10-24 birim) dir. Koli fiyatlari perakendeden yuzde 20-30 daha avantajlidir. 5000 TL uzeri ilk siparislerde Hos Geldin Indirimi uygulanir." },
      { id: "b2b-3", q: "Ozel etiket uretimi yapiliyor mu?", a: "Evet, belirli minimum miktarlarda white label hizmet veriyoruz. Urunlerimiz sizin markanizla etiketlenip hazirlanabilir. Detay icin info@pekefe.com adresine yaziniz." },
      { id: "b2b-4", q: "Ihracat yapiyor musunuz?", a: "Almanya, Hollanda, Isvicre ve Avustralya basta olmak uzere cesitli ulkelere ihracat gerceklestiriyoruz. Gumruk ve fitosanitari belgeler tarafimizca hazirlanir." },
      { id: "b2b-5", q: "E-fatura duzenleniyor mu?", a: "Evet, hem bireysel hem kurumsal musterilere e-fatura ve e-arsiv fatura duzenlenmektedir. Fatura bilgilerinizi siparis sirasinda veya sonrasinda iletmeniz yeterlidir." }
    ]
  },
  {
    category: "hesap",
    categoryTitle: "Uyelik & Hesap",
    categoryIcon: "manage_accounts",
    questions: [
      { id: "hesap-1", q: "Uye olmak zorunda miyim?", a: "Evet, alisveris yapabilmek icin ucretsiz uyelik olusturmaniz gerekiyor. Uyelik sayesinde siparis gecmisinizi takip edebilir ve ozel kampanyalardan haberdar olabilirsiniz." },
      { id: "hesap-2", q: "Sifremi unuttum, ne yapmaliyim?", a: "Giris sayfasindaki Sifremi Unuttum baglantisina tiklayin ve kayitli e-posta adresinizi girin. Birkac dakika icinde sifre sifirlama e-postasi alirsiniz." },
      { id: "hesap-3", q: "Kisisel verilerim nasil korunuyor?", a: "Kisisel verileriniz KVKK kapsaminda islenir ve 3. taraflarla pazarlama amaciyla paylasilmaz. Gizlilik Politikasi sayfamizi inceleyebilirsiniz." }
    ]
  }
];

export default function SSS() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordionId, setActiveAccordionId] = useState("siparis-1");
  const [activeCategory, setActiveCategory] = useState("siparis");

  useEffect(() => {
    setSettings(getSettings());
    fetchLiveSettings().then((live) => { if (live) setSettings(live); });
    const handler = () => setSettings(getSettings());
    window.addEventListener("pekefe_settings_changed", handler);
    return () => window.removeEventListener("pekefe_settings_changed", handler);
  }, []);

  const toggleAccordion = (id) => setActiveAccordionId(activeAccordionId === id ? null : id);

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 130, behavior: "smooth" });
  };

  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return faqData;
    return faqData.map(cat => ({
      ...cat,
      questions: cat.questions.filter(item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.questions.length > 0);
  }, [searchQuery]);

  const totalQ = faqData.reduce((a, c) => a + c.questions.length, 0);
  const waNum = (settings.socialWhatsapp || settings.contactPhone || "905342709140").replace(/[^0-9]/g, "");
  const email = settings.contactEmail || settings.email || "info@pekefe.com";
  const phone = settings.contactPhone || settings.phone || "+90 534 270 91 40";

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">

      {/* HERO */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-amber-50 to-white dark:from-[#1a0807] dark:to-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-400/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 px-4 md:px-8 max-w-5xl mx-auto text-center">
          <span className="inline-block text-[#b45309] font-black text-xs uppercase tracking-widest mb-4 bg-amber-50 dark:bg-amber-900/30 px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
            Sikca Sorulan Sorular
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#360e17] dark:text-amber-50 mb-5 leading-tight">
            Size Nasil Yardimci Olabiliriz?
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Siparis ve teslimat, urunler ve kalite, odeme guvenligi ve kurumsal alis verisin hakkinda merak ettiginiz tum sorularin yanitlari burada.
          </p>
          <div className="mt-10 max-w-2xl mx-auto relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#b45309] transition-colors pointer-events-none">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-12 pr-12 py-4 rounded-2xl focus:ring-2 focus:ring-[#b45309] focus:border-transparent outline-none shadow-lg text-sm font-medium placeholder-slate-400 transition-all"
              placeholder="Kargo, iade, organik, cografi isaret... bir konu arayin"
              type="search"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {[
              { value: faqData.length, label: "Konu Basligi", icon: "category" },
              { value: totalQ, label: "Soru ve Yanit", icon: "quiz" },
              { value: "24/7", label: "Destek Hatti", icon: "headset_mic" },
              { value: "1-2", label: "Is Gunu Yanit", icon: "schedule_send" }
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 shadow-sm">
                <span className="material-symbols-outlined text-[#b45309] text-2xl">{s.icon}</span>
                <div className="text-left">
                  <div className="text-xl font-black text-[#360e17] dark:text-amber-100">{s.value}</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ICERIK */}
      <section className="py-16">
        <div className="px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-28 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">Konu Basliklari</p>
              <div className="space-y-1">
                {faqData.map((cat) => (
                  <button key={cat.category} onClick={() => handleCategoryClick(cat.category)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs cursor-pointer transition-all text-left ${
                      activeCategory === cat.category
                        ? "bg-[#b45309] text-white shadow-md"
                        : "text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700"
                    }`}>
                    <span className="material-symbols-outlined text-lg flex-shrink-0">{cat.categoryIcon}</span>
                    <span className="leading-tight flex-1">{cat.categoryTitle}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeCategory === cat.category ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                      {cat.questions.length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-1">Hizli Iletisim</p>
                <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">chat</span>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">WhatsApp</div>
                    <div className="text-[10px] text-emerald-600">Hizli yanit</div>
                  </div>
                </a>
                <a href={`mailto:${email}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-blue-600 text-lg">mail</span>
                  <div>
                    <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300">E-Posta</div>
                    <div className="text-[10px] text-blue-600 truncate max-w-[130px]">{email}</div>
                  </div>
                </a>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-14">
            {filteredFaq.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-slate-300 text-6xl mb-4 block">search_off</span>
                <p className="text-lg font-bold text-slate-500 mb-2">Aradiginiz konuya uygun soru bulunamadi.</p>
                <p className="text-sm text-slate-400 mb-6">Farkli bir kelime deneyin ya da bize dogrudan yazin.</p>
                <button onClick={() => setSearchQuery("")}
                  className="px-6 py-2.5 bg-[#b45309] text-white text-sm font-bold rounded-xl hover:bg-amber-800 transition cursor-pointer">
                  Aramay Temizle
                </button>
              </div>
            ) : filteredFaq.map((cat) => (
              <div key={cat.category} id={`cat-${cat.category}`} className="scroll-mt-32">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30 flex items-center justify-center shadow-sm border border-amber-200 dark:border-amber-800 flex-shrink-0">
                    <span className="material-symbols-outlined text-[#b45309] text-xl">{cat.categoryIcon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#360e17] dark:text-amber-100">{cat.categoryTitle}</h2>
                    <p className="text-xs text-slate-500 font-medium">{cat.questions.length} soru ve yanit</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {cat.questions.map((item) => {
                    const isOpen = activeAccordionId === item.id;
                    return (
                      <div key={item.id}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? "border-[#b45309]/30 bg-amber-50/60 dark:bg-amber-900/10 shadow-sm" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-amber-200 dark:hover:border-amber-800"}`}>
                        <button
                          onClick={() => { toggleAccordion(item.id); setActiveCategory(cat.category); }}
                          className="w-full flex justify-between items-start gap-4 p-5 cursor-pointer text-left" aria-expanded={isOpen}>
                          <div className="flex items-start gap-3">
                            <span className={`material-symbols-outlined text-lg mt-0.5 flex-shrink-0 ${isOpen ? "text-[#b45309]" : "text-slate-400"}`}>
                              {isOpen ? "help" : "help_outline"}
                            </span>
                            <h3 className={`text-sm font-bold leading-snug ${isOpen ? "text-[#360e17] dark:text-amber-100" : "text-slate-700 dark:text-slate-200"}`}>{item.q}</h3>
                          </div>
                          <span className={`material-symbols-outlined transition-transform duration-300 flex-shrink-0 mt-0.5 ${isOpen ? "rotate-180 text-[#b45309]" : "text-slate-400"}`}>expand_more</span>
                        </button>
                        <div className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
                          <div className="px-5 pb-5 pl-[3.25rem]">
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="lg:hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 flex flex-wrap gap-3">
              <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex-1 justify-center">
                <span className="material-symbols-outlined text-sm">chat</span>WhatsApp
              </a>
              <a href={`mailto:${email}`}
                className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex-1 justify-center">
                <span className="material-symbols-outlined text-sm">mail</span>E-Posta
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-20">
        <div className="bg-gradient-to-br from-[#360e17] to-[#6b1d2f] rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-xl">
              <span className="text-amber-400 font-black text-xs uppercase tracking-widest block mb-3">Hala Yardiminiza mi Ihtiyaciniz Var?</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Aklinizdaki Her Konuda Yanimizdayiz</h2>
              <p className="text-amber-100/80 text-sm leading-relaxed">Urun secimi, siparis takibi, kurumsal alim veya baska herhangi bir konuda musteri hizmetleri ekibimiz size yardimci olmaktan mutluluk duyar.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-7 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95">
                <span className="material-symbols-outlined">chat</span>WhatsApp
              </a>
              <a href={`mailto:${email}`}
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-7 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95">
                <span className="material-symbols-outlined">mail</span>E-Posta
              </a>
              <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95">
                <span className="material-symbols-outlined">call</span>Ara
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ALT YONLENDIRME */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: "storefront", title: "Urunlerimizi Inceleyin", desc: "Dogal pekmez, bal ve Ispir yoresel lezzetleri", href: "/kategoriler", label: "Kategorilere Git" },
            { icon: "local_offer", title: "Kampanyalar ve Kuponlar", desc: "Aktif indirim kodlari ve mevsimlik firsat paketleri", href: "/kampanyalar", label: "Firsatlara Bak" },
            { icon: "phone_in_talk", title: "Iletisime Gecin", desc: "Adres, telefon ve harita bilgilerimize ulasin", href: "/iletisim", label: "Bize Ulasin" }
          ].map((card, i) => (
            <Link key={i} href={card.href}
              className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-4 border border-amber-100 dark:border-amber-800">
                <span className="material-symbols-outlined text-[#b45309]">{card.icon}</span>
              </div>
              <h3 className="font-bold text-sm text-[#360e17] dark:text-amber-100 mb-1">{card.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{card.desc}</p>
              <span className="text-xs font-bold text-[#b45309] flex items-center gap-1 group-hover:gap-2 transition-all">
                {card.label} <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

