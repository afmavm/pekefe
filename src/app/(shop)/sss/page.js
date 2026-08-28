"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

const faqData = [
  {
    category: "siparis",
    categoryTitle: "Sipariş & Teslimat",
    categoryIcon: "local_shipping",
    questions: [
      { 
        id: "siparis-1", 
        q: "Siparişim ne kadar sürede kargoya verilir?", 
        a: "Siparişleriniz genellikle 1-2 iş günü içerisinde özenle hazırlanarak kargoya teslim edilir. Pazartesi - Perşembe günleri saat 14:00'e kadar verilen siparişler aynı gün kargoya verilebilmektedir. Hafta sonu ve resmi tatillerde sipariş kabulü devam etmekte olup, kargo sevkiyatı ilk iş gününde gerçekleştirilir." 
      },
      { 
        id: "siparis-2", 
        q: "Siparişim kaç günde elime ulaşır?", 
        a: "Türkiye genelinde anlaşmalı kargo firmalarımız ile teslimat süresi ortalama 2-4 iş günüdür. Doğu Anadolu ve kırsal bölgelere yapılan gönderimlerde süre kargo aktarma merkezlerinin dağıtım planına bağlı olarak 3-5 iş gününü bulabilmektedir." 
      },
      { 
        id: "siparis-3", 
        q: "Kargo ücreti ne kadar ve nasıl tahsil edilir?", 
        a: "Kargo sistemimiz Alıcı Ödemeli olarak çalışmaktadır. Kargo bedeli sipariş tutarınıza eklenmez; ürünler kapınıza ulaştığında kargo görevlisine nakit veya kartla doğrudan ödenir. Sipariş aşamasında herhangi bir kargo ücreti tahsil edilmez." 
      },
      { 
        id: "siparis-4", 
        q: "Hangi kargo firmaları ile çalışıyorsunuz?", 
        a: "Gönderimlerimizi öncelikli olarak Yurtiçi Kargo ve Sürat Kargo ile gerçekleştirmekteyiz. Siparişiniz kargoya verildiğinde takip numarası ve kargo firması bilgisi SMS ve e-posta yoluyla tarafınıza iletilir." 
      },
      { 
        id: "siparis-5", 
        q: "Siparişimi nasıl takip edebilirim?", 
        a: "Siparişiniz kargo firmasına teslim edildiğinde SMS ve e-posta ile kargo takip kodunuz paylaşılır. Ayrıca sitemize giriş yaparak 'Hesabım > Siparişlerim' sekmesinden kargonuzun güncel durumunu anlık olarak izleyebilirsiniz." 
      },
      { 
        id: "siparis-6", 
        q: "Kapıda ürün bedeli ödeme seçeneği var mı?", 
        a: "Ürün bedelleri için kapıda ödeme seçeneğimiz bulunmamaktadır. Alışverişinizi sipariş aşamasında 256-bit SSL korumalı altyapımız üzerinden kredi kartı, banka kartı veya indirimli Havale/EFT yöntemleriyle güvenle tamamlayabilirsiniz. Yalnızca kargo taşıma bedeli teslimat anında kuryeye ödenir." 
      },
      { 
        id: "siparis-7", 
        q: "Teslimat adresimi sonradan değiştirebilir miyim?", 
        a: "Siparişiniz kargoya verilmeden önce müşteri hizmetlerimizle iletişime geçmeniz halinde teslimat adresinizi güncelleyebiliriz. Ürün kargoya çıktıktan sonra adres değişikliği için kargo firmasının müşteri hizmetleriyle görüşerek şubeden teslim veya yönlendirme talep edebilirsiniz." 
      }
    ]
  },
  {
    category: "urunler",
    categoryTitle: "Ürünler & Kalite",
    categoryIcon: "verified",
    questions: [
      { 
        id: "urun-1", 
        q: "Ürünleriniz doğal ve katkısız mı?", 
        a: "PEKEFE ürünlerinin tamamı %100 doğaldır. Hiçbir sentetik katkı maddesi, koruyucu, renklendirici, kıvam arttırıcı veya glikoz şurubu içermez. T.C. Tarım ve Orman Bakanlığı onaylı kayıtlı tesisimizde, ISO 22000 Gıda Güvenliği ve Türk Gıda Kodeksi standartlarına tam uyumlu olarak üretilmekte ve bağımsız akredite laboratuvarlarca periyodik olarak test edilmektedir." 
      },
      { 
        id: "urun-2", 
        q: "Ham dut pekmezi nedir, kaynatılmış pekmezden farkı nedir?", 
        a: "Ham dut pekmezi; İspir yaylalarından toplanan taze beyaz dut şırasının yüksek ateşte yakılmadan, modern vakumlu kazanlarda 60-65°C'yi aşmayan düşük sıcaklıklarda yoğunlaştırılmasıyla üretilir. Bu sayede dutun doğal enzimleri, vitaminleri ve polifenolleri korunur; sağlığa zararlı HMF (kanserojen yanık bileşiği) oluşumu engellenir." 
      },
      { 
        id: "urun-3", 
        q: "HMF değeri neden bu kadar önemlidir?", 
        a: "HMF (Hidroksimetilfurfural), gıdaların yüksek ısıda aşırı kaynatılması sonucu oluşan ve sağlığı tehdit eden bir bileşiktir. T.C. Tarım ve Orman Bakanlığı ve Türk Gıda Kodeksi bal tebliğinde HMF üst sınırını 40 mg/kg olarak belirlemiştir. PEKEFE ham dut pekmezi ve ham bal ürünlerinde HMF değeri 10 mg/kg'ın dahi altındadır ve her üretim partisinin akredite laboratuvar analiz raporu mevcuttur." 
      },
      { 
        id: "urun-4", 
        q: "İspir Kömesi nedir ve coğrafi işaret tescili var mıdır?", 
        a: "İspir Kömesi; İspir beyaz dut şırası, yerli İspir cevizi, bal ve tam buğday ununun bakır kazanlarda geleneksel usulle karıştırılıp iplere dizilerek İspir güneşinde kurutulmasıyla yapılan tescilli bir yöresel lezzettir. TÜRKPATENT tarafından Coğrafi İşaret ile tescillenmiş olup yalnızca İspir yöresine özgü standartlarda üretilir." 
      },
      { 
        id: "urun-5", 
        q: "İspir Kaçkar Ham Balı neden bu kadar değerlidir?", 
        a: "2200 metre ve üzeri rakımlı Kaçkar eteklerindeki el değmemiş yayla florasından (kekik, karaçalı, korunga, yabani dağ çiçekleri) toplanan ham bal; polifenol, prolin ve diastaz değerleri açısından ova ballarına kıyasla kat kat zengindir. Hasat sonrasında hiçbir ısıl işlem veya mikronize filtreleme uygulanmadan, kovan saflığında kavanozlanır." 
      },
      { 
        id: "urun-6", 
        q: "Ürünlerin saklama koşulları ve raf ömrü nedir?", 
        a: "Ham dut pekmezi ve ham bal; doğrudan güneş ışığı almayan, serin ve nemsiz bir ortamda (18°C - 22°C oda sıcaklığında) kapağı kapalı olarak 24 ay boyunca tazeliğini korur. Buzdolabına konulması önerilmez. Kurutulmuş pestil ve köme ürünleri ise serin ve kuru yerde 12 ay muhafaza edilebilir." 
      },
      { 
        id: "urun-7", 
        q: "Ham balın kristalleşmesi (donması) bozulduğu anlamına mı gelir?", 
        a: "Kesinlikle hayır. Kristalleşme, ısıl işlem görmemiş ve enzim zenginliği korunmuş %100 doğal ham çiçek ballarının en somut kalite ve saflık göstergesidir. Balınızı pürüzsüz kıvama getirmek isterseniz kavanozu 40°C'yi geçmeyen ılık su dolu bir kapta (benmari usulü) bekleterek çözdürebilirsiniz. Enzimleri yok ettiği için mikrodalga kullanımı önerilmez." 
      },
      { 
        id: "urun-8", 
        q: "Ürünlerinizde ilave şeker, glikoz veya tatlandırıcı var mı?", 
        a: "Kesinlikle hayır. PEKEFE ürünlerinin tamamında yalnızca meyvenin kendi doğal meyve şekeri (fruktoz ve glikoz) bulunur. Ürünlerimize sofra şekeri, mısır şurubu, glikoz şurubu, tatlandırıcı veya renklendirici hiçbir yapay madde eklenmez." 
      }
    ]
  },
  {
    category: "odeme",
    categoryTitle: "Ödeme & Güvenlik",
    categoryIcon: "payment",
    questions: [
      { 
        id: "odeme-1", 
        q: "Hangi ödeme yöntemlerini kullanabilirim?", 
        a: "Sitemizde tüm Visa, Mastercard ve Troy özellikli kredi kartları ve banka kartları ile 3D Secure güvencesinde ödeme yapabilirsiniz. Ayrıca ek indirim avantajı sağlayan Banka Havalesi / EFT seçeneğiyle de siparişinizi oluşturabilirsiniz." 
      },
      { 
        id: "odeme-2", 
        q: "Havale / EFT ile ödemelerde ek indirim var mı?", 
        a: "Evet! Havale veya EFT yöntemiyle ödeme yapan müşterilerimize özel sepet indirimi uygulanmaktadır. Güncel indirim oranı ödeme ekranında ve kampanyalar sayfamızda belirtilmektedir. Ödemeniz onaylandıktan sonra siparişiniz hızla kargoya hazırlanır." 
      },
      { 
        id: "odeme-3", 
        q: "Kredi kartı bilgilerim güvende mi?", 
        a: "Ödeme altyapımız uluslararası PCI-DSS Level 1 güvenlik sertifikasına sahip PayTR sistemi üzerinden sağlanmaktadır. Kredi kartı bilgileriniz sunucularımızda asla saklanmaz; tüm veri akışı 256-bit SSL şifreleme ve bankaların 3D Secure güvenlik onay mekanizmasıyla gerçekleşir." 
      },
      { 
        id: "odeme-4", 
        q: "İndirim kuponunu nasıl kullanabilirim?", 
        a: "Sepet sayfasında yer alan 'İndirim Kodunuzu Giriniz' alanına sahip olduğunuz kupon kodunu yazıp 'Uygula' butonuna tıklayarak indiriminizi anında sepet toplamına yansıtabilirsiniz." 
      },
      { 
        id: "odeme-5", 
        q: "Taksit seçenekleri sunuluyor mu?", 
        a: "Anlaşmalı bankaların kredi kartlarına özel olarak peşin fiyatına veya yasal vade farkıyla 2, 3 ve 6 taksit seçenekleri ödeme sayfasında kart bilgilerinizi girdiğinizde otomatik olarak listelenmektedir." 
      }
    ]
  },
  {
    category: "iade",
    categoryTitle: "İade & Değişim",
    categoryIcon: "assignment_return",
    questions: [
      { 
        id: "iade-1", 
        q: "Ürünleri nasıl iade edebilirim?", 
        a: "Siparişinizi teslim aldığınız tarihten itibaren 14 takvim günü içerisinde iade talebinde bulunabilirsiniz. Gıda güvenliği ve hijyen mevzuatı gereği iade edilecek ürünlerin ambalajının açılmamış, emniyet bandının zarar görmemiş ve orijinal formunun bozulmamış olması zorunludur." 
      },
      { 
        id: "iade-2", 
        q: "Kargoda hasar gören veya yanlış gelen ürünler için ne yapmalıyım?", 
        a: "Teslimat anında dış pakette ezilme veya akma fark ederseniz kargo görevlisine 'Hasar Tespit Tutanağı' tutturunuz. Paketi açtıktan sonra bir sorun fark ederseniz, ürünün fotoğraflarını çekerek 24 saat içinde WhatsApp hattımıza veya info@pekefe.com adresimize iletmeniz yeterlidir; derhal yenisi ücretsiz olarak gönderilir." 
      },
      { 
        id: "iade-3", 
        q: "İade süreci ve ücret iadesi nasıl işliyor?", 
        a: "İade talebiniz onaylandıktan sonra tarafınıza iletilen kargo iade koduyla ürünü ücretsiz gönderebilirsiniz. Ürün depomuza ulaşıp kontrolleri tamamlandıktan sonra en geç 5 iş günü içerisinde ödemeniz kartınıza veya banka hesabınıza iade edilir." 
      },
      { 
        id: "iade-4", 
        q: "İade kargo ücretini kim karşılar?", 
        a: "Hasarlı, eksik veya hatalı gönderilen ürünlerde iade kargo ücreti tamamen firmamıza aittir. Keyfi cayma hakkı kapsamındaki iadelerde ise Mesafeli Satış Sözleşmesi gereğince kargo bedeli alıcı tarafından karşılanır." 
      }
    ]
  },
  {
    category: "kurumsal",
    categoryTitle: "Kurumsal & B2B",
    categoryIcon: "storefront",
    questions: [
      { 
        id: "b2b-1", 
        q: "Toptan veya kurumsal (B2B) sipariş verebilir miyim?", 
        a: "Evet! Restoranlar, butik gurme marketler, oteller ve kurumsal firmalar için toptan koli ve palet bazında özel fiyat listelerimiz bulunmaktadır. Sitemizdeki B2B Bayi Portalı üzerinden başvuruda bulunabilir veya info@pekefe.com adresinden kurumsal fiyat teklifi talep edebilirsiniz." 
      },
      { 
        id: "b2b-2", 
        q: "Toptan siparişlerde minimum alım miktarı nedir?", 
        a: "Kurumsal B2B alımlarda minimum sipariş miktarı ürün çeşidine göre 1 koli (10-24 adet) olarak belirlenmiştir. Belirli ciro ve düzenli sipariş kotasını dolduran bayilerimize özel kademeli iskonto avantajları sunulmaktadır." 
      },
      { 
        id: "b2b-3", 
        q: "Fason üretim veya özel etiketleme (Private Label) yapıyor musunuz?", 
        a: "Belirli üretim hacmi gereksinimlerini karşılayan kurumsal iş ortaklarımız için modern tesisimizde fason dolum ve özel marka etiketleme hizmeti sunmaktayız. Detaylı bilgi için kurumsal ekibimizle iletişime geçebilirsiniz." 
      },
      { 
        id: "b2b-4", 
        q: "Yurt dışına ihracatınız bulunuyor mu?", 
        a: "Başta Avrupa ülkeleri olmak üzere uluslararası standartlarda gıda sertifikasyonu, menşei şahadetnamesi ve fitosaniter belgeleriyle kurumsal ihracat operasyonları yürütmekteyiz. İhracat talepleriniz için info@pekefe.com adresinden bilgi alabilirsiniz." 
      },
      { 
        id: "b2b-5", 
        q: "Kurumsal E-Fatura düzenleniyor mu?", 
        a: "Evet, tüm siparişleriniz için T.C. Gelir İdaresi Başkanlığı (GİB) mevzuatına uygun E-Fatura veya E-Arşiv fatura düzenlenmektedir. Kurumsal alımlarda fatura bilgilerinizi sipariş esnasında girmeniz yeterlidir." 
      }
    ]
  },
  {
    category: "hesap",
    categoryTitle: "Üyelik & Hesap",
    categoryIcon: "manage_accounts",
    questions: [
      { 
        id: "hesap-1", 
        q: "Alışveriş yapmak için üye olmak zorunda mıyım?", 
        a: "Sipariş takibinizin eksiksiz yapılabilmesi, adreslerinizin kaydedilmesi ve size özel indirim kuponlarından faydalanabilmeniz için ücretsiz üyelik oluşturmanız gerekmektedir. Üyelik işlemi yalnızca 1 dakikanızı alır." 
      },
      { 
        id: "hesap-2", 
        q: "Şifremi unuttum, hesabıma nasıl erişebilirim?", 
        a: "Giriş yap sayfasında bulunan 'Şifremi Unuttum' bağlantısına tıklayarak kayıtlı e-posta adresinizi giriniz. Birkaç dakika içerisinde şifre sıfırlama bağlantısı e-posta kutunuza ulaştırılacaktır." 
      },
      { 
        id: "hesap-3", 
        q: "Kişisel verilerim ve gizliliğim nasıl korunuyor?", 
        a: "Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında yüksek güvenlikli sunucularda saklanmaktadır. Verileriniz hiçbir şekilde üçüncü şahıslarla ticari amaçla paylaşılmaz." 
      }
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
            Sıkça Sorulan Sorular
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-[#360e17] dark:text-amber-50 mb-5 leading-tight">
            Size Nasıl Yardımcı Olabiliriz?
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Sipariş ve teslimat süreçleri, ürün kalitemiz, ödeme güvenliği ve kurumsal talepleriniz hakkında merak ettiğiniz tüm soruların yanıtları burada.
          </p>
          <div className="mt-10 max-w-2xl mx-auto relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#b45309] transition-colors pointer-events-none">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-12 pr-12 py-4 rounded-2xl focus:ring-2 focus:ring-[#b45309] focus:border-transparent outline-none shadow-lg text-sm font-medium placeholder-slate-400 transition-all"
              placeholder="Kargo, iade, organik, coğrafi işaret... bir konu arayın"
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
              { value: faqData.length, label: "Konu Başlığı", icon: "category" },
              { value: totalQ, label: "Soru ve Yanıt", icon: "quiz" },
              { value: "24/7", label: "Destek Hattı", icon: "headset_mic" },
              { value: "1-2", label: "İş Günü Yanıt", icon: "schedule_send" }
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

      {/* İÇERİK */}
      <section className="py-16">
        <div className="px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-28 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">Konu Başlıkları</p>
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-1">Hızlı İletişim</p>
                <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">chat</span>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">WhatsApp</div>
                    <div className="text-[10px] text-emerald-600">Hızlı yanıt</div>
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
                <p className="text-lg font-bold text-slate-500 mb-2">Aradığınız konuya uygun soru bulunamadı.</p>
                <p className="text-sm text-slate-400 mb-6">Farklı bir kelime deneyebilir veya bize doğrudan yazabilirsiniz.</p>
                <button onClick={() => setSearchQuery("")}
                  className="px-6 py-2.5 bg-[#b45309] text-white text-sm font-bold rounded-xl hover:bg-amber-800 transition cursor-pointer">
                  Aramayı Temizle
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
                    <p className="text-xs text-slate-500 font-medium">{cat.questions.length} soru ve yanıt</p>
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
              <span className="text-amber-400 font-black text-xs uppercase tracking-widest block mb-3">Hâlâ Yardıma mı İhtiyacınız Var?</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Aklınızdaki Her Konuda Yanınızdayız</h2>
              <p className="text-amber-100/80 text-sm leading-relaxed">Ürün seçimi, sipariş takibi, kurumsal tedarik veya diğer tüm konularda müşteri hizmetleri ekibimiz size destek vermekten memnuniyet duyar.</p>
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

      {/* ALT YÖNLENDİRME */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: "storefront", title: "Ürünlerimizi İnceleyin", desc: "Doğal dut pekmezi, ham çiçek balı ve İspir yöresel lezzetleri", href: "/kategoriler", label: "Kategorilere Git" },
            { icon: "local_offer", title: "Kampanyalar ve Fırsatlar", desc: "Aktif indirim kodları ve avantajlı paket seçenekleri", href: "/kampanyalar", label: "Fırsatlara Bak" },
            { icon: "phone_in_talk", title: "İletişime Geçin", desc: "Adres, telefon ve canlı destek bilgilerimize ulaşın", href: "/iletisim", label: "Bize Ulaşın" }
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
