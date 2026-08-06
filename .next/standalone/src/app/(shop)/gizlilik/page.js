"use client";

import Link from "next/link";

export default function Gizlilik() {
  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased pb-section-gap">
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        <header className="mb-12 border-b border-outline-variant/30 pb-6 text-center lg:text-left">
          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-headline-lg text-primary font-bold mb-4">
            Gizlilik Politikası ve KVKK
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base">
            Kişisel verilerinizin güvenliği ve korunması Pekefe olarak en öncelikli konularımızdan biridir.
          </p>
        </header>

        <article className="space-y-6 text-on-surface-variant text-sm sm:text-base leading-relaxed">
          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Veri Sorumlusu
            </h2>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca kişisel verileriniz, veri
              sorumlusu olarak Pekefe Geleneksel Gıda Ürünleri Ltd. Şti. tarafından aşağıda açıklanan
              kapsamda işlenebilecektir.
            </p>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Kişisel Verilerin Hangi Amaçla İşleneceği
            </h2>
            <p className="mb-3">
              Siparişlerinizin oluşturulması, ödemelerin tahsil edilmesi, kargo gönderimlerinizin
              sağlanması ve üyelik işlemlerinizin yürütülebilmesi amacıyla ad soyad, telefon, e-posta
              ve adres bilgileriniz işlenmektedir.
            </p>
            <p>
              Ayrıca, bültene kaydolmanız durumunda güncel kampanya ve duyurulardan haberdar edilmeniz
              amacıyla e-posta adresiniz pazarlama süreçlerinde kullanılmaktadır.
            </p>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Kişisel Verilerin Paylaşılması
            </h2>
            <p>
              Kişisel verileriniz, yalnızca siparişlerinizin teslimatı amacıyla kargo firmalarıyla ve
              güvenli ödeme işlemlerinin gerçekleştirilmesi amacıyla lisanslı ödeme geçidi aracılarıyla
              kanuni sınırlar çerçevesinde paylaşılmaktadır. Verileriniz hiçbir şekilde üçüncü şahıslara
              pazarlama amacıyla satılmamaktadır.
            </p>
          </section>

          <section className="bg-surface-container-low p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h2 className="font-headline-md text-base sm:text-lg text-primary font-bold mb-3">
              Haklarınız
            </h2>
            <p>
              KVKK'nın 11. maddesi kapsamında, info@pekefe.com adresine yazılı başvuru göndererek
              verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, düzeltilmesini
              veya silinmesini isteme hakkına sahipsiniz.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
