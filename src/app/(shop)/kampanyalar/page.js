"use client";

import { useState } from "react";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";

export default function Kampanyalar() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setToast({
        isOpen: true,
        message: "Bültene başarıyla abone olundu! Fırsatlar e-postanıza iletilecektir.",
        type: "success",
      });
    }
  };

  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased pb-section-gap">
      {/* 1. Hero Seasonal Banner: Harvest Festival */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-8">
        <div className="relative w-full rounded-2xl overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center group shadow-lg">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage: "url('/ispir-manzara-hero.png')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/45 to-transparent"></div>
          </div>
          <div className="relative z-10 p-8 md:p-16 max-w-2xl text-white">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-white font-label-sm text-xs uppercase tracking-widest mb-6">
              Geleneksel Hasat
            </span>
            <h1 className="font-display-lg text-[32px] sm:text-[44px] md:text-display-lg mb-6 leading-tight font-bold">
              Hasat Festivali: <br />
              İspir Dut Pekmezi
            </h1>
            <p className="font-body-lg text-white/90 mb-8 text-base md:text-lg leading-relaxed">
              Anadolu'nun bereketli topraklarından, geleneksel yöntemlerle hazırlanan en taze dut
              pekmezlerimizle tanışın. Doğal enerji ve sağlık şimdi sofranızda.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/kategoriler"
                className="px-8 py-4 bg-white text-primary font-label-md rounded-lg hover:bg-primary hover:text-white transition-all duration-300 premium-shadow active:scale-95 text-center font-bold text-sm"
              >
                Hemen Keşfet
              </Link>
              <Link
                href="/hikayemiz"
                className="px-8 py-4 border-2 border-white/30 text-white font-label-md rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-300 active:scale-95 text-center font-bold text-sm"
              >
                Üretim Hikayemiz
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Lifestyle Banner: Loyalty Program */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-section-gap">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-surface-container-low rounded-2xl overflow-hidden premium-shadow border border-outline-variant/10">
          <div className="order-2 lg:order-1 p-8 md:p-16 flex flex-col justify-center">
            <span className="text-secondary font-label-md text-xs uppercase tracking-[0.2em] font-semibold mb-2 block">
              Ayrıcalıklı Kulüp
            </span>
            <h2 className="font-headline-lg text-primary text-3xl md:text-headline-lg mb-6 font-bold">
              Pekefe Dostu Olun
            </h2>
            <p className="font-body-md text-on-surface-variant mb-8 leading-relaxed text-base">
              Her alışverişinizde puan kazanın, size özel indirimlerden ve sınırlı üretim
              ürünlerimizden ilk siz haberdar olun. Geleneksel lezzet yolculuğunda sadık
              dostlarımıza özel ayrıcalıklar sizi bekliyor.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-secondary font-label-md font-bold text-sm">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  stars
                </span>
                Her siparişte %5 Lezzet Puanı
              </li>
              <li className="flex items-center gap-3 text-secondary font-label-md font-bold text-sm">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_shipping
                </span>
                Ücretsiz Kargo Ayrıcalığı
              </li>
            </ul>
            <Link
              className="inline-flex items-center gap-2 text-primary font-label-md border-b-2 border-primary w-fit pb-1 hover:gap-4 transition-all duration-300 font-bold text-sm"
              href="/kayit"
            >
              Hemen Katılın{" "}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="order-1 lg:order-2 relative min-h-[400px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/ispir-dut-hasadi.png')",
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* 3. Secondary Banners: New Arrivals & Best Sellers */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-section-gap mb-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* New Arrivals */}
          <Link href="/kategoriler" className="relative h-[380px] rounded-3xl overflow-hidden group cursor-pointer shadow-xl border border-outline-variant/10 block">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage: "url('/geleneksel-kazan.png')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:via-black/25 transition-all duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white z-10">
              <span className="font-label-sm text-xs text-white bg-secondary/90 w-fit px-4 py-1.5 rounded-full mb-4 font-bold uppercase tracking-wider">
                YENİ
              </span>
              <h3 className="font-display-lg text-2xl sm:text-3xl mb-2 font-bold">Yeni Gelenler</h3>
              <p className="font-body-md text-sm text-white/85 mb-4 max-w-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                İspir yaylalarının en taze mahsulleri ve yeni sezon ürünleri raflarda yerini aldı.
              </p>
              <span className="material-symbols-outlined text-2xl group-hover:translate-x-3 transition-transform duration-300 w-fit">
                arrow_right_alt
              </span>
            </div>
          </Link>

          {/* Best Sellers */}
          <Link href="/kategoriler" className="relative h-[380px] rounded-3xl overflow-hidden group cursor-pointer shadow-xl border border-outline-variant/10 block">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage: "url('/vakumlu-uretim.png')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:via-black/25 transition-all duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white z-10">
              <span className="font-label-sm text-xs text-white bg-secondary/90 w-fit px-4 py-1.5 rounded-full mb-4 font-bold uppercase tracking-wider">
                POPÜLER
              </span>
              <h3 className="font-display-lg text-2xl sm:text-3xl mb-2 font-bold">En Çok Tercih Edilenler</h3>
              <p className="font-body-md text-sm text-white/85 mb-4 max-w-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                Binlerce sofranın vazgeçilmez klasiği haline gelen geleneksel lezzetlerimiz.
              </p>
              <span className="material-symbols-outlined text-2xl group-hover:translate-x-3 transition-transform duration-300 w-fit">
                arrow_right_alt
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Newsletter / Micro-interaction Section */}
      <section className="bg-primary text-white py-20 px-margin-mobile rounded-2xl max-w-container-max mx-auto overflow-hidden relative shadow-md">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {!subscribed ? (
            <>
              <h2 className="font-display-lg text-3xl md:text-display-lg mb-4 font-bold">
                Gelenekten Haberdar Olun
              </h2>
              <p className="font-body-md text-white/80 mb-10 text-base">
                En taze hasat dönemleri ve özel indirimlerden haberdar olmak için bültenimize kayıt olun.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input
                  className="flex-grow px-6 py-4 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all placeholder:text-white/50 text-white outline-none"
                  placeholder="E-posta adresiniz"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  className="px-8 py-4 bg-secondary text-white font-label-md text-sm rounded-lg hover:bg-secondary-container transition-all active:scale-95 font-bold cursor-pointer"
                  type="submit"
                >
                  Abone Ol
                </button>
              </form>
            </>
          ) : (
            <div className="animate-fade-in py-6 space-y-4 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border border-white/20 text-secondary mb-2">
                <span className="material-symbols-outlined text-white text-3xl">mark_email_read</span>
              </div>
              <h3 className="font-display-lg text-white text-2xl font-bold">Harika! Bültene Abone Oldunuz.</h3>
              <p className="font-body-md text-white/85 leading-relaxed text-base">
                Kayıt işleminiz <strong className="text-secondary font-bold">{email}</strong> adresiyle başarıyla tamamlandı. En yeni kampanyalar ve indirimler e-postanıza gelecektir.
              </p>
            </div>
          )}
        </div>
      </section>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}
