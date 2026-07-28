"use client";

import Link from "next/link";

export default function TeslimatVeIade() {
  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased pb-section-gap">
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        <header className="mb-12 border-b border-outline-variant/30 pb-6 text-center lg:text-left">
          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-headline-lg text-primary font-bold mb-4">
            Teslimat ve İade Politikası
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base">
            Pekefe ürünlerinin en taze haliyle sofranıza ulaşması için teslimat ve iade süreçlerimizi
            büyük bir özenle yönetiyoruz.
          </p>
        </header>

        <article className="space-y-8 text-on-surface-variant text-sm sm:text-base leading-relaxed">
          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-lg sm:text-xl text-primary font-bold mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined">local_shipping</span>
              1. Teslimat Süreci
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Kargo Firması:</strong> Siparişleriniz, yöresel gıda taşımacılığı standartlarına
                uygun olarak anlaşmalı kargo firmalarımız aracılığıyla gönderilir.
              </li>
              <li>
                <strong>Gönderim Süresi:</strong> Pazartesi-Perşembe günleri saat 14:00'e kadar verilen
                siparişler aynı gün, diğer günlerdeki siparişler ise ürünlerin tazeliğini korumak
                amacıyla takip eden ilk iş günü kargoya teslim edilir.
              </li>
              <li>
                <strong>Paketleme:</strong> Ballarımız ve pekmezlerimiz kırılmayı önleyen hava kanallı
                özel ambalajlarda, tereyağı ve peynir gibi soğuk zincir gerektiren ürünlerimiz ise buz
                aküleri eşliğinde ısı yalıtımlı strafor kutularda sevk edilmektedir.
              </li>
            </ul>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-lg sm:text-xl text-primary font-bold mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined">restart_alt</span>
              2. İade Koşulları
            </h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Hasarlı Kargo:</strong> Kargo teslimatı sırasında pakette herhangi bir akma,
                kırılma veya ezilme tespit ederseniz kargo görevlisine "Hasar Tespit Tutanağı"
                tutturmanız gerekmektedir. Tutanağı tutulan siparişlerin değişimi ücretsiz olarak
                hızla gerçekleştirilir.
              </li>
              <li>
                <strong>Gıda Ürünlerinde İade:</strong> Türk Ticaret Kanunu gıda maddeleri maddesi
                uyarınca, ambalajı açılmış, bozulma riski bulunan hızlı tüketim ürünlerinin (pekmez,
                bal, tereyağı vb.) keyfi iadesi kabul edilememektedir.
              </li>
              <li>
                <strong>Diğer Ürünler:</strong> Gıda dışı veya ambalajı açılmamış uzun ömürlü kuru gıda
                ürünlerini teslim aldığınız tarihten itibaren 14 gün içerisinde iade edebilirsiniz.
              </li>
            </ul>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-lg sm:text-xl text-primary font-bold mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined">help</span>
              Destek ve İletişim
            </h2>
            <p className="mb-4">
              Teslimat veya iade ile ilgili her türlü soru, görüş ve öneriniz için destek ekibimizle
              iletişime geçebilirsiniz:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 font-semibold text-primary">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">mail</span> info@pekefe.com
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">phone</span> +90 (442) 511 00 00
              </span>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
