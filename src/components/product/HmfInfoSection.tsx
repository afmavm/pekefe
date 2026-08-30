"use client";

import React from "react";
import Image from "next/image";

interface HmfInfoSectionProps {
  productName?: string;
  isMulberryMolasses?: boolean;
}

const steps = [
  {
    number: "01",
    title: "HMF",
    subtitle: "Doğal Bileşik",
    desc: "Şeker içeren gıdalarda yüksek sıcaklık etkisiyle oluşabilen bir bileşiktir.",
    icon: "biotech",
    badge: "5-HMF"
  },
  {
    number: "02",
    title: "Sıcaklık",
    subtitle: "Isıl İşlem Süresi",
    desc: "Yüksek sıcaklık ve uzun süreli ısıl işlem HMF oluşumunu artırabilir.",
    icon: "device_thermostat",
    badge: "Isı & Süre"
  },
  {
    number: "03",
    title: "PEKEFE Yöntemi",
    subtitle: "Güneşte Doğal Yoğunlaşma",
    desc: "Dut şırasını yüksek ateşte uzun süre kaynatmak yerine güneşin doğal sıcaklığından yararlanılır.",
    icon: "wb_sunny",
    badge: "Güneşin Sıcağı"
  },
  {
    number: "04",
    title: "Amaç",
    subtitle: "Özgün Lezzet & Karakter",
    desc: "Dutun doğal aromasını ve geleneksel üretim karakterini korumaya odaklanılır.",
    icon: "eco",
    badge: "Saf Karakter"
  }
];

export function HmfInfoSection({
  productName = "PEKEFE Geleneksel İspir Dut Gün Pekmezi",
  isMulberryMolasses = true
}: HmfInfoSectionProps) {
  return (
    <section
      aria-labelledby="hmf-info-title"
      className="w-full my-16 md:my-24 py-12 md:py-16 px-6 md:px-12 rounded-[32px] bg-[#FAF8F5] dark:bg-slate-900/90 border border-amber-900/10 dark:border-amber-500/15 shadow-sm relative overflow-hidden transition-all duration-300 motion-reduce:transition-none"
    >
      {/* Decorative ambient subtle glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 bg-rose-900/5 dark:bg-rose-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 relative z-10">
        
        {/* ─── 1. HEADER & INTRO: HMF NEDİR? (Grid with Scientific Photo) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <header className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300/40 dark:border-amber-700/40 text-amber-900 dark:text-amber-200 text-xs font-semibold tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm text-[#b45309] dark:text-amber-400" aria-hidden="true">
                biotech
              </span>
              <span>Bilgilendirici Rehber &amp; Laboratuvar Analizi</span>
            </div>

            <h2
              id="hmf-info-title"
              className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#360e17] dark:text-amber-100 leading-tight tracking-tight"
            >
              HMF Nedir? <br />
              <span className="text-lg sm:text-2xl md:text-3xl font-light italic text-[#8B2635] dark:text-amber-300/90 font-serif">
                Pekmez üretiminde sıcaklık ve süre neden önemlidir?
              </span>
            </h2>

            <div className="w-16 h-0.5 bg-[#b45309] rounded-full opacity-80" />

            <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-sans pt-1">
              <p>
                <strong className="text-slate-900 dark:text-white font-semibold">HMF (5-Hidroksimetilfurfural)</strong>, şeker içeren gıdaların yüksek sıcaklığa maruz kalması sırasında oluşabilen doğal bir bileşiktir.
              </p>
              <p>
                Özellikle dut pekmezi, bal, reçel ve benzeri meyve şekeri bakımından zengin ürünlerde <strong className="text-slate-900 dark:text-white font-semibold">sıcaklık ve ısıl işlem süresi</strong>, HMF oluşumunu etkileyen önemli faktörler arasında yer alır.
              </p>
              <p>
                Pekmez üretiminde dut şırasının <strong className="text-slate-900 dark:text-white font-semibold">çok yüksek sıcaklıklarda ve uzun süre kaynatılması</strong>, HMF oluşumunun artmasına neden olabilir. Bu nedenle geleneksel pekmez üretiminde sıcaklığın kontrol edilmesi ve şıranın gereğinden fazla ısıya maruz bırakılmaması büyük önem taşır.
              </p>
            </div>
          </header>

          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-700 group">
              <Image
                src="/uploads/hmf-bilimsel-laboratuvar-analizi.jpg"
                alt="PEKEFE İspir Dut Şırası Laboratuvar Analizi ve HMF Testi"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">Akredite Laboratuvar Standartları</span>
                <span className="text-xs font-serif font-bold">Saf Dut Şırası ve HMF Kontrollü Analiz</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. 4 AŞAMALI GÖRSEL ANLATIM KARTLARI ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#8B2635] dark:text-amber-300">
              4 Aşamada Bilimsel &amp; Geleneksel Bakış
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Kontrollü Isı &amp; Doğal Güneş</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-amber-900/10 dark:border-slate-700/80 hover:border-[#b45309]/40 dark:hover:border-amber-400/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 motion-reduce:transition-none"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                      {step.number}
                    </span>
                    <span
                      className="material-symbols-outlined text-xl text-slate-500 dark:text-slate-400 group-hover:text-[#b45309] dark:group-hover:text-amber-400 transition-colors"
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                      {step.title}
                    </h4>
                    <p className="text-[11px] font-medium text-[#b45309] dark:text-amber-300/90 tracking-wide">
                      {step.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    {step.badge}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 group-hover:bg-[#b45309] transition-colors" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 3. PEKEFE'YE ÖZEL BÖLÜM & İLHAN EFE QUOTE ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
          
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b45309]" aria-hidden="true" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-[#360e17] dark:text-amber-100">
                PEKEFE'de HMF'ye Neden Dikkat Ediyoruz?
              </h3>
            </div>

            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              PEKEFE'nin geleneksel üretim anlayışında dut şırasını <strong className="text-slate-900 dark:text-white font-semibold">yüksek ateşte uzun süre kaynatmak yerine, güneş ışığının ve doğal sıcaklığın etkisinden yararlanarak kontrollü biçimde yoğunlaştırmak</strong> esastır.
            </p>

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Bu yaklaşım, İlhan Efe'nin İspir vadisinde yıllardır sürdürdüğü geleneksel üretim kültürünün ve ustalığının temel taşlarından biridir.
            </p>
          </div>

          {/* Premium Callout / Quote Box */}
          <div className="lg:col-span-5 flex items-center">
            <blockquote className="w-full p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-50/90 to-amber-100/40 dark:from-slate-800 dark:to-slate-800/60 border-l-4 border-[#b45309] dark:border-amber-400 shadow-sm relative space-y-3">
              <span
                className="material-symbols-outlined text-3xl sm:text-4xl text-[#b45309]/30 dark:text-amber-400/30 absolute top-4 right-4 pointer-events-none"
                aria-hidden="true"
              >
                format_quote
              </span>
              
              <p className="font-serif italic text-slate-800 dark:text-amber-50 text-base sm:text-lg leading-relaxed">
                “Şırayı yakmadan, güneşin doğal sıcaklığından yararlanarak, uzun sürede yoğunlaştırmak.”
              </p>

              <footer className="pt-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#360e17] text-amber-200 flex items-center justify-center text-xs font-serif font-bold shadow-xs">
                  İE
                </div>
                <div>
                  <cite className="not-italic text-xs font-bold text-[#360e17] dark:text-amber-200 block">
                    İlhan Efe
                  </cite>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Geleneksel İspir Üretim Kültürü
                  </span>
                </div>
              </footer>
            </blockquote>
          </div>

        </div>

        {/* ─── 4. BİLİMSEL AÇIKLAMA: DOĞAL ÜRETİM, KONTROLLÜ SÜREÇ ─── */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-amber-100 font-bold text-sm sm:text-base">
            <span className="material-symbols-outlined text-[#b45309] dark:text-amber-400 text-lg sm:text-xl" aria-hidden="true">
              verified
            </span>
            <h3>Doğal Üretim, Kontrollü Süreç</h3>
          </div>

          <div className="space-y-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            <p>
              HMF oluşumu yalnızca sıcaklığa bağlı değildir. <strong className="text-slate-800 dark:text-slate-200">Süre, pH dengesi, meyve şekeri konsantrasyonu ve ortam koşulları</strong> da HMF miktarını etkileyebilmektedir.
            </p>
            <p className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-slate-800 dark:text-amber-100 text-xs sm:text-sm font-medium">
              Bu nedenle PEKEFE'nin yaklaşımı: <strong className="text-[#360e17] dark:text-amber-200 font-bold">“HMF yoktur” demek değil; yüksek sıcaklıkta gereksiz ve uzun süreli kaynatmadan kaçınan geleneksel üretim yöntemini benimsemektir.</strong>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default HmfInfoSection;
