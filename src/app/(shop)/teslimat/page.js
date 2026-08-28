"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

export default function TeslimatVeIade() {
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

  const waNum = (settings.socialWhatsapp || settings.contactPhone || "905342709140").replace(/[^0-9]/g, "");
  const email = settings.contactEmail || settings.email || "info@pekefe.com";
  const phone = settings.contactPhone || settings.phone || "+90 534 270 91 40";

  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased pb-section-gap">
      <main className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        
        {/* Header */}
        <header className="mb-12 border-b border-outline-variant/30 pb-8 text-center">
          <span className="inline-block text-[#b45309] font-black text-xs uppercase tracking-widest mb-3 bg-amber-50 dark:bg-amber-900/30 px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
            Güvenli &amp; Özenli Sevkiyat
          </span>
          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-primary font-bold mb-4">
            Siparişlerinizi Nasıl Gönderiyoruz?
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            İspir yaylalarının saf lezzetlerini, ilk günkü tazeliği ve besin değerleriyle sofranıza ulaştırmak için paketleme ve teslimat sürecimizi en üst düzey gıda güvenliği standartlarında yönetiyoruz.
          </p>
        </header>

        {/* 4 Aşamalı Gönderim Süreci Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Adım 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-[#b45309] flex items-center justify-center font-bold text-xl">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-amber-100">
              1. Kırılmaya Karşı Zırhlı Paketleme
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Cam kavanozdaki ham dut pekmezi ve ham bal ürünlerimiz, yüksek basınca dayanıklı <strong>özel hava kanallı koruyucu balonlar (Airbed)</strong> ve darbe emici mukavva köşebentler ile sarılır. Kargo taşınmasında kırılma ve akma riski sıfıra indirilir.
            </p>
          </div>

          {/* Adım 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 flex items-center justify-center font-bold text-xl">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-amber-100">
              2. Doğal Nem ve Tazelik Koruması
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              İspir Kömesi, cevizli pestil ve meyve tatlılarımız hava ve nem geçirmeyen hijyenik gıda ambalajlarında vakumlanarak çift dalga kraft kolilere yerleştirilir. Dış ortam ısısından ve kokulardan tamamen izole edilir.
            </p>
          </div>

          {/* Adım 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 flex items-center justify-center font-bold text-xl">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-amber-100">
              3. Hızlı Sevkiyat &amp; Alıcı Ödemeli Kargo
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Siparişleriniz anlaşmalı <strong>Yurtiçi Kargo ve Sürat Kargo</strong> güvencesiyle 1-2 iş gününde yola çıkar. Kargo ücreti sepetinize eklenmez; teslimat anında kapıda doğrudan kuryeye ödenir. Takip kodunuz SMS ve e-posta ile anında iletilir.
            </p>
          </div>

          {/* Adım 4 */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 flex items-center justify-center font-bold text-xl">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-amber-100">
              4. %100 Hasarsız Teslimat Garantisi
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Kargo taşınması sırasında nadiren de olsa meydana gelebilecek herhangi bir hasar veya sızıntı durumunda, ürününüzün fotoğrafını bize iletmeniz yeterlidir. <strong>Hiçbir ek ücret talep edilmeden anında yenisi gönderilir.</strong>
            </p>
          </div>

        </div>

        {/* İade Politikası Kartı */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 mb-12">
          <h2 className="font-display-lg text-2xl text-primary font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-[#b45309]">assignment_return</span>
            İade ve Değişim Koşulları
          </h2>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              • <strong>14 Gün İçinde İade:</strong> Teslimat tarihinden itibaren 14 takvim günü içerisinde koşulsuz iade talebinde bulunabilirsiniz.
            </p>
            <p>
              • <strong>Gıda Hijyen Kuralı:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca ambalajı açılmış, koruyucu emniyet bandı yırtılmış veya kullanılmış gıda ürünlerinin iadesi kabul edilememektedir.
            </p>
            <p>
              • <strong>Ücret İadesi:</strong> İade edilen ürün depomuza ulaşıp onaylandıktan sonra en geç 5 iş günü içerisinde ödemeniz aynı ödeme kanalı üzerinden iade edilir.
            </p>
          </div>
        </section>

        {/* Canlı İletişim & Destek Kartı */}
        <div className="bg-gradient-to-br from-[#360e17] to-[#6b1d2f] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl font-bold mb-1">Teslimatla İlgili Bir Sorunuz mu Var?</h3>
            <p className="text-amber-100/80 text-xs">Müşteri destek ekibimiz siparişinizin her aşamasında yanınızda.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-xl font-bold text-xs transition shadow-md">
              <span className="material-symbols-outlined text-sm">chat</span> WhatsApp Destek
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-3 rounded-xl font-bold text-xs transition shadow-md">
              <span className="material-symbols-outlined text-sm">mail</span> {email}
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
