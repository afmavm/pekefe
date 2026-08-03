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

  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased pb-section-gap">
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        <header className="mb-12 border-b border-outline-variant/30 pb-6 text-center lg:text-left">
          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-headline-lg text-primary font-bold mb-4">
            Mesafeli Satış Sözleşmesi
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base">
            Pekefe üzerinden gerçekleştireceğiniz alışverişlerde geçerli olan hukuki sözleşmedir.
          </p>
        </header>

        <article className="space-y-6 text-on-surface-variant text-sm sm:text-base leading-relaxed">
          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Madde 1 - Taraflar
            </h2>
            <p className="mb-4">
              <strong>Satıcı:</strong> {settings.companyTitle} <br />
              <strong>Adres:</strong> {settings.address} <br />
              <strong>Telefon:</strong> {settings.phone} | <strong>E-posta:</strong> {settings.email}
            </p>
            <p>
              <strong>Alıcı:</strong> Pekefe platformu üzerinden sipariş formunu doldurarak alışveriş
              yapan tüm bireysel veya kurumsal müşterilerdir.
            </p>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Madde 2 - Sözleşmenin Konusu
            </h2>
            <p>
              İşbu sözleşmenin konusu, Alıcı'nın Satıcı'ya ait internet sitesi üzerinden elektronik
              ortamda siparişini verdiği, sözleşmede belirtilen niteliklere ve satış fiyatına sahip
              ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında
              Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve
              yükümlülüklerinin saptanmasıdır.
            </p>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Madde 3 - Teslimat ve Ödeme
            </h2>
            <p className="mb-3">
              Sipariş bedeli, Alıcı tarafından seçilen ödeme yöntemi (Kredi Kartı, Banka Kartı veya Havale)
              ile tahsil edildikten sonra işleme alınır.
            </p>
            <p>
              Ürünlerin teslimatı, gıda güvenliği kurallarına uygun koruyucu ambalajlarla anlaşmalı kargo
              şirketi tarafından Alıcı'nın belirtmiş olduğu adrese gerçekleştirilir.
            </p>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Madde 4 - Cayma Hakkı İstisnası
            </h2>
            <p>
              Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesinin (ç) bendi uyarınca, "çabuk bozulabilen
              veya son kullanma tarihi geçebilecek malların teslimine ilişkin sözleşmelerde" cayma hakkı
              kullanılamaz. Gıda güvenliği ve hijyen standartlarını korumak amacıyla, ambalajı açılmış
              veya ısı zinciri bozulmuş gıda maddelerinin iadesi kabul edilmemektedir.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
