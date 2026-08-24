"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

export default function Sozlesme() {
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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="w-full bg-surface-container-lowest text-slate-800 dark:text-slate-100 font-sans antialiased pb-24">
      {/* Top Banner / Hero Header */}
      <div className="bg-primary/5 dark:bg-primary/10 border-b border-outline-variant/20 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold tracking-wider uppercase font-mono">
                <span className="material-symbols-outlined text-sm">gavel</span>
                Hukuki Metinler &amp; Tüketici Hakları
              </div>
              <h1 className="font-display-lg text-3xl sm:text-4xl text-primary font-black tracking-tight">
                Mesafeli Satış Sözleşmesi
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
                6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve 29188 Sayılı Mesafeli Sözleşmeler Yönetmeliği uyarınca düzenlenmiştir.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
                title="Sözleşmeyi Yazdır"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Yazdır / PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Contract Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Quick Highlights Alert */}
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 mb-8 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed font-medium space-y-1">
            <p className="font-extrabold text-amber-900 dark:text-amber-100 uppercase tracking-wider text-[11px]">
              Tüketici Bilgilendirme ve Güvence Notu
            </p>
            <p>
              İşbu sözleşme, www.pekefe.com platformu üzerinden gerçekleştireceğiniz tüm siparişlerde alıcı ile satıcı arasındaki hukuki hak ve yükümlülükleri koruma altına almaktadır. Siparişinizi onayladığınızda işbu sözleşmenin tüm koşullarını kabul etmiş sayılırsınız.
            </p>
          </div>
        </div>

        {/* Contract Articles */}
        <article className="space-y-6 text-slate-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed">

          {/* MADDE 1 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                1
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 1 - Taraflar
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* SATICI */}
              <div className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <span className="text-[11px] font-black text-primary uppercase tracking-wider block">
                  1.1. SATICI BİLGİLERİ
                </span>
                <div className="space-y-1.5 text-xs sm:text-sm font-medium">
                  <p><strong className="text-slate-900 dark:text-white">Unvan:</strong> {settings.companyTitle || "PEKEFE Geleneksel & Doğal Lezzetler"}</p>
                  <p><strong className="text-slate-900 dark:text-white">Adres:</strong> {settings.address || "ÇAMLICA MAH. NO: 00 İSPİR/ ERZURUM"}</p>
                  <p><strong className="text-slate-900 dark:text-white">Telefon:</strong> {settings.phone || "+90 534 270 91 40"}</p>
                  <p><strong className="text-slate-900 dark:text-white">E-Posta:</strong> {settings.email || "info@pekefe.com"}</p>
                  <p><strong className="text-slate-900 dark:text-white">Müşteri Destek / WhatsApp:</strong> {settings.whatsapp || settings.phone || "+90 534 270 91 40"}</p>
                  <p><strong className="text-slate-900 dark:text-white">Web Sitesi:</strong> {settings.website || "www.pekefe.com"}</p>
                  {settings.taxOffice && (
                    <p><strong className="text-slate-900 dark:text-white">Vergi Dairesi &amp; No:</strong> {settings.taxOffice} V.D. {settings.taxNo ? `/ ${settings.taxNo}` : ""}</p>
                  )}
                  {settings.mersisNo && (
                    <p><strong className="text-slate-900 dark:text-white">MERSİS No:</strong> {settings.mersisNo}</p>
                  )}
                </div>
              </div>

              {/* ALICI */}
              <div className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <span className="text-[11px] font-black text-secondary uppercase tracking-wider block">
                  1.2. ALICI (TÜKETİCİ) BİLGİLERİ
                </span>
                <div className="space-y-1.5 text-xs sm:text-sm font-medium">
                  <p><strong className="text-slate-900 dark:text-white">Adı / Soyadı / Unvanı:</strong> Sipariş esnasında Alıcı tarafından beyan edilen ad ve soyad.</p>
                  <p><strong className="text-slate-900 dark:text-white">Teslimat Adresi:</strong> Sipariş formunda belirtilen teslim adresi.</p>
                  <p><strong className="text-slate-900 dark:text-white">Fatura Adresi:</strong> Fatura bilgileri kısmında belirtilen fatura adresi.</p>
                  <p><strong className="text-slate-900 dark:text-white">Telefon / E-posta:</strong> Sipariş esnasında bildirilen iletişim kanalları.</p>
                </div>
              </div>
            </div>
          </section>

          {/* MADDE 2 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                2
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 2 - Sözleşmenin Konusu ve Kapsamı
              </h2>
            </div>
            <p>
              İşbu sözleşmenin konusu; Alıcı'nın, Satıcı'ya ait <strong>www.pekefe.com</strong> internet sitesinden elektronik ortamda siparişini verdiği, sitede nitelikleri ve satış fiyatı belirtilen ürünlerin (pestil, köme, dut şırası ve geleneksel yöresel gıda ürünleri) satışı ve teslimi ile ilgili olarak <strong>6502 sayılı Tüketicinin Korunması Hakkında Kanun</strong> ve <strong>29188 sayılı Mesafeli Sözleşmeler Yönetmeliği</strong> hükümleri gereğince tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.
            </p>
          </section>

          {/* MADDE 3 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                3
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 3 - Sözleşme Konusu Ürün, Fiyat ve Ödeme Esasları
              </h2>
            </div>
            <p>
              <strong>3.1.</strong> Ürünlerin cinsi, türü, miktarı, gramajı, adedi, satış bedeli, KDV dahil toplam tutarı ve kargo ücreti, siparişin tamamlandığı anda Alıcı tarafından onaylanan sipariş özetinde ve Alıcı'ya gönderilen elektronik faturada açıkça gösterildiği gibidir.
            </p>
            <p>
              <strong>3.2. Ödeme Şekli:</strong> Alıcı sipariş bedelini <strong>PAYTR Güvenli Ödeme Altyapısı</strong> üzerinden Kredi Kartı, Banka Kartı (Tek çekim veya Taksitli) ya da Satıcı'nın banka hesaplarına Havale/EFT yoluyla gerçekleştirebilir. Havale ile yapılan ödemelerde 2 iş günü içerisinde hesaba geçmeyen siparişler otomatik olarak iptal edilir.
            </p>
          </section>

          {/* MADDE 4 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                4
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 4 - Teslimat Şartları ve Sevkiyat Esasları
              </h2>
            </div>
            <p>
              <strong>4.1.</strong> Sipariş konusu ürünler, yasal 30 günlük süreyi aşmamak koşuluyla, Alıcı'nın sipariş onayından itibaren ortalama <strong>1 ila 3 iş günü</strong> içerisinde anlaşmalı kargo şirketine teslim edilir. Ürünler Erzurum / İspir merkezli depomuzdan koruyucu, hijyenik ve gıdaya uygun özel ambalajlarla sevk edilir.
            </p>
            <p>
              <strong>4.2.</strong> Teslimat, Alıcı'nın sipariş formunda belirttiği adrese ve teslim almaya yetkili kişi/kişilere yapılır. Teslim anında Alıcı'nın adresinde bulunmaması durumunda dahi Satıcı edimini tam ve eksiksiz yerine getirmiş sayılır.
            </p>
            <p>
              <strong>4.3. Kargo Kontrolü ve Hasar Tutanağı:</strong> Alıcı, teslim aldığı paketi kargo görevlisinin huzurunda kontrol etmekle yükümlüdür. Pakette ezilme, yırtılma, açılma, ıslanma veya kırılma tespit edilirse kargo görevlisine derhal <strong>"Hasar Tespit Tutanağı" (Kargo Zabtı)</strong> tutturulmalı ve paket teslim alınmamalıdır.
            </p>
          </section>

          {/* MADDE 5 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                5
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 5 - Satıcının Hak ve Yükümlülükleri
              </h2>
            </div>
            <p>
              <strong>5.1.</strong> Satıcı, sözleşme konusu ürünü sağlam, eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri, analiz raporları ve faturası ile birlikte teslim etmeyi taahhüt eder.
            </p>
            <p>
              <strong>5.2. Mücbir Sebepler:</strong> Doğal afetler, olumsuz hava koşulları, yangın, deprem, salgın hastalık veya nakliyeyi engelleyen olağanüstü durumlar nedeniyle ürün yasal süresi içinde teslim edilemezse Satıcı durumu 3 gün içinde Alıcı'ya bildirir. Bu takdirde Alıcı; siparişin iptal edilmesini, benzeri bir ürünle değiştirilmesini veya teslimatın engelleyici durumun kalkmasına kadar ertelenmesini talep edebilir. Siparişin iptal edilmesi halinde ödenen tutar en geç <strong>14 gün içerisinde</strong> Alıcı'ya kesintisiz iade edilir.
            </p>
          </section>

          {/* MADDE 6 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                6
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 6 - Alıcının Hak ve Yükümlülükleri
              </h2>
            </div>
            <p>
              <strong>6.1.</strong> Alıcı, internet sitesinde yer alan sözleşme konusu ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin tüm ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul ve beyan eder.
            </p>
            <p>
              <strong>6.2.</strong> Alıcı, teslim aldığı ürünün faturasını ve ambalajını iade ve değişim süreçleri için muhafaza etmekle yükümlüdür.
            </p>
          </section>

          {/* MADDE 7 & 8: CAYMA HAKKI VE İSTİSNALARI */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                7
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 7 - Cayma Hakkı ve İstisnaları (Gıda &amp; Hijyen Güvenliği)
              </h2>
            </div>

            <p>
              <strong>7.1. Genel Kural:</strong> Alıcı, hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin, ürünün kendisine veya gösterdiği adresteki kişiye tesliminden itibaren <strong>14 (on dört) gün</strong> içinde cayma hakkını kullanabilir.
            </p>

            <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-2">
              <span className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider block flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">warning</span>
                7.2. GIDA ÜRÜNLERİNDE CAYMA HAKKI İSTİSNALARI (YÖNETMELİK MADDE 15)
              </span>
              <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesinin (ç) bendi uyarınca: <em>"Çabuk bozulabilen veya son kullanma tarihi geçme ihtimali olan malların teslimine ilişkin sözleşmeler"</em> ile <em>"Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan ve iadesi sağlık ve hijyen açısından uygun olmayan gıda ürünleri"</em> cayma hakkı kapsamı <strong>dışındadır</strong>.
              </p>
              <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed font-medium pt-1">
                Bu doğrultuda; vakumlu ambalajı açılmış, koruyucu güvenlik kilidi bozulmuş veya ısı zinciri kesintiye uğramış pestil, köme ve pekmez türevi doğal gıda ürünlerinde cayma hakkı kullanılamaz.
              </p>
            </div>
          </section>

          {/* MADDE 8 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                8
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 8 - Ayıplı Mal ve Hasarlı Ürün Bildirimi
              </h2>
            </div>
            <p>
              Üretim hatası, bozulma, vakum kaçağı veya sevkiyat kaynaklı hasar barındıran ayıplı ürünlerde Alıcı, teslimat tarihinden itibaren <strong>48 saat içerisinde</strong> durumu Satıcı'nın <strong>{settings.whatsapp || settings.phone || "+90 534 270 91 40"}</strong> numaralı WhatsApp hattına veya <strong>{settings.email || "info@pekefe.com"}</strong> adresine fotoğraflı olarak iletmelidir. Haklı görülen ayıplı mal bildirimlerinde ürün bedeli derhal iade edilir veya Alıcı'ya ücretsiz olarak yeni mahsul sevk edilir.
            </p>
          </section>

          {/* MADDE 9 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                9
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 9 - Gizlilik, Güvenlik ve KVKK Hükümleri
              </h2>
            </div>
            <p>
              Alıcı tarafından işbu sözleşmede ve sipariş formunda belirtilen tüm kişisel bilgiler, <strong>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</strong> kapsamında siparişin ifası ve kanuni yükümlülükler haricinde üçüncü şahıslarla paylaşılmaz. Ödeme sayfasında kart bilgileri hiçbir şekilde Satıcı sunucularında saklanmaz; 256-Bit SSL şifreleme ile doğrudan banka ve lisanslı ödeme kuruluşu güvencesinde işlenir.
            </p>
          </section>

          {/* MADDE 10 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                10
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 10 - Uyuşmazlıkların Çözümü ve Yetkili Mahkeme
              </h2>
            </div>
            <p>
              İşbu sözleşmenin uygulanmasında, Ticaret Bakanlığı'nca her yıl ilan edilen parasal sınırlar dahilinde Alıcı'nın veya Satıcı'nın yerleşim yerindeki <strong>İl ve İlçe Tüketici Hakem Heyetleri</strong> ile <strong>Tüketici Mahkemeleri</strong> yetkilidir. Uyuşmazlık halinde Erzurum / İspir Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          {/* MADDE 11 */}
          <section className="bg-surface-container-low/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-outline-variant/20 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                11
              </div>
              <h2 className="font-display-lg text-lg sm:text-xl text-primary font-bold">
                Madde 11 - Yürürlük
              </h2>
            </div>
            <p>
              Alıcı, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul etmiş sayılır. Satıcı, siparişin gerçekleşmesi öncesinde işbu sözleşmenin sitede Alıcı tarafından okunup kabul edildiğine dair elektronik onayın alınmasını sağlamakla yükümlüdür.
            </p>
            <div className="pt-4 border-t border-outline-variant/15 flex flex-col sm:flex-row justify-between text-xs text-slate-500 font-mono">
              <span>Sözleşme Revizyonu: 2026 / v2.1</span>
              <span>PEKEFE Doğal Gıda Hukuk Müşavirliği</span>
            </div>
          </section>

        </article>
      </main>
    </div>
  );
}

