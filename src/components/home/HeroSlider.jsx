"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

const HERO_SLIDES = [
  {
    id: "slide-1",
    tag: "Erzurum İspir'in Geleneksel El Emeği Mirası",
    title: "Zamanın Yavaş Akışında,",
    highlightTitle: "Doğanın Saf İmzası.",
    subtitle: "2000 metre rakımlı İspir yaylalarından şafak vakti toplanan saf beyaz dutlar; meşe odun ateşinde ve bakır kazanlarda kaynatılarak asırlık lezzetine kavuşur.",
    image: "/ispir-manzara-hero.png",
    primaryCta: { text: "Seçkin Mahsulleri Keşfet", href: "/kategoriler" },
    secondaryCta: { text: "Hikayemizi İncele", href: "/hikayemiz" },
  },
  {
    id: "slide-2",
    tag: "Odun Ateşi & Geleneksel Bakır Kazanlar",
    title: "Kuşaktan Kuşağa Aktarılan",
    highlightTitle: "Asırlık Usuller.",
    subtitle: "Hiçbir katkı maddesi, ilave şeker veya koruyucu kimyasal içermeyen %100 saf ve yoğun gövdeli geleneksel Pekefe lezzet şöleni.",
    image: "/geleneksel-kazan.png",
    primaryCta: { text: "Geleneksel Pekmezler", href: "/kategoriler" },
    secondaryCta: { text: "Üretim Tesisimiz", href: "/tesisimiz" },
  },
  {
    id: "slide-3",
    tag: "Güneşte Keten Bezlerde Doğal Kurutma",
    title: "İpeksi Dokusuyla Güneşte",
    highlightTitle: "Olgunlaşan Pestil.",
    subtitle: "Keten sergilere milimetrik hassasiyetle dökülen dut herlesi, İspir'in nemsiz dağ rüzgârları ve bol güneşi altında eşsiz aromasına kavuşur.",
    image: "/ispir-pestil-kurutma-gercek.png",
    primaryCta: { text: "Sade Dut Pestili İncele", href: "/urun/pekefe-sade-dut-pestili" },
    secondaryCta: { text: "Tüm Pestil Çeşitleri", href: "/kategoriler" },
  },
  {
    id: "slide-4",
    tag: "Yerli İspir Cevizi ile Harmanlanmış",
    title: "Asil Tatların Zarafet Dolu",
    highlightTitle: "Zengin Uyumu.",
    subtitle: "İpe dizilmiş yerli cevizlerin kaynayan saf şıra herlesine daldırılmasıyla üretilen coğrafi tescilli saray lezzeti İspir Cevizli Dut Kömesi.",
    image: "/ispir-kome-gercek-hasat.jpg",
    primaryCta: { text: "Köme & Tatlı Koleksiyonu", href: "/kategoriler" },
    secondaryCta: { text: "Rekolte Kulübü", href: "/rekolte-kulubu" },
  },
];

const SLIDE_DURATION = 6000; // 6 seconds per slide

export function HeroSlider({ customSlides }) {
  const [slides, setSlides] = useState(customSlides || HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Sync customSlides or localStorage & listen for live changes
  useEffect(() => {
    const loadSlides = () => {
      if (customSlides && Array.isArray(customSlides) && customSlides.length > 0) {
        setSlides(customSlides);
      } else if (typeof window !== "undefined") {
        const saved = localStorage.getItem("pekefe_hero_slides");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const activeOnly = parsed.filter((s) => s.active !== false);
              setSlides(activeOnly.length > 0 ? activeOnly : parsed);
            }
          } catch (e) {}
        }
      }
    };

    loadSlides();

    if (typeof window !== "undefined") {
      window.addEventListener("pekefe_hero_slides_changed", loadSlides);
      return () => window.removeEventListener("pekefe_hero_slides_changed", loadSlides);
    }
  }, [customSlides]);

  // Infinite Sequential Loop: 0 -> 1 -> 2 -> ... -> (N-1) -> 0 -> 1
  const nextSlide = useCallback(() => {
    setSlides((currentList) => {
      if (!currentList || currentList.length === 0) return currentList;
      setCurrentIndex((prev) => (prev + 1) % currentList.length);
      return currentList;
    });
    setProgressKey((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setSlides((currentList) => {
      if (!currentList || currentList.length === 0) return currentList;
      setCurrentIndex((prev) => (prev - 1 + currentList.length) % currentList.length);
      return currentList;
    });
    setProgressKey((prev) => prev + 1);
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setProgressKey((prev) => prev + 1);
  };

  // Dynamic Infinite Autoplay Timer for ANY number of slides (N >= 1)
  useEffect(() => {
    if (isPaused || !slides || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
      setProgressKey((prevKey) => prevKey + 1);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, slides]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide(); // Swipe left -> next
    } else if (touchEndX.current - touchStartX.current > 50) {
      prevSlide(); // Swipe right -> prev
    }
  };

  const safeIndex = currentIndex % (slides.length || 1);
  const currentSlide = slides[safeIndex] || slides[0];

  return (
    <section
      className="relative h-[calc(100vh-80px)] min-h-[520px] max-h-[780px] sm:max-h-[850px] flex items-end justify-start overflow-hidden bg-slate-950 select-none group/slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── SLIDE BACKGROUND IMAGES (CRYSTAL CLEAR HIGH-RES & KEN BURNS EFFECT) ─── */}
      {slides.map((slide, index) => {
        const isActive = index === safeIndex;
        return (
          <div
            key={slide.id || index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={slide.image}
                alt={slide.title || "Pekefe Hasat Görseli"}
                fill
                priority={index === 0}
                quality={100}
                unoptimized
                className={`object-cover filter brightness-100 contrast-[1.02] saturate-[1.05] ${
                  isActive ? "animate-ken-burns" : ""
                }`}
                sizes="100vw"
              />
            </div>

            {/* Ultra-Soft Subtle Ambient Overlay — Keeps Photo 100% Clear & Text Perfectly Readable */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/10 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent h-1/3 bottom-0 top-auto"></div>
          </div>
        );
      })}

      {/* ─── FIT-TO-VIEWPORT TYPOGRAPHY CONTENT (SOL ALT - TAM EKRAN DÜZENİ) ─── */}
      <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full z-20 pb-20 pt-16 text-white relative">
        <div className="max-w-2xl text-left space-y-4 animate-fade-in" key={safeIndex}>
          
          {/* Animated Live Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md shadow-lg max-w-full">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="whitespace-nowrap font-label-sm text-[11px] sm:text-xs uppercase tracking-[0.15em] text-white font-extrabold drop-shadow">
              {currentSlide.tag}
            </span>
          </div>

          {/* Title with Serif Highlight */}
          <h1 className="font-display-lg text-[28px] sm:text-[38px] md:text-[48px] lg:text-[54px] text-white leading-[1.12] font-bold tracking-tight drop-shadow-xl">
            {currentSlide.title} <br />
            <span className="text-secondary-fixed italic font-normal font-serif relative">
              {currentSlide.highlightTitle}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-xs sm:text-sm md:text-base text-white/90 leading-relaxed font-light max-w-lg drop-shadow-md line-clamp-3 sm:line-clamp-none">
            {currentSlide.subtitle}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href={currentSlide.primaryCta.href}>
              <Button size="lg" className="shadow-2xl shadow-primary/40 font-bold px-6 h-12 text-xs sm:text-sm cursor-pointer hover:scale-102 transition-transform">
                {currentSlide.primaryCta.text}
              </Button>
            </Link>
            <Link href={currentSlide.secondaryCta.href}>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/20 backdrop-blur-md px-6 h-12 text-xs sm:text-sm cursor-pointer hover:scale-102 transition-transform bg-black/30"
              >
                {currentSlide.secondaryCta.text}
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* ─── FIT-TO-VIEWPORT NAVIGATION & COUNTER CONTROLS (EKRANA TAM OTURAN OKLAR & SAYAÇ) ─── */}
      <div className="absolute bottom-6 left-0 right-0 z-30 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex items-center justify-between gap-4 pointer-events-none">
        
        {/* Slide Counter & Dots */}
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full pointer-events-auto shadow-xl">
          <span className="font-mono text-xs font-bold text-amber-400">
            {String(safeIndex + 1).padStart(2, "0")}
          </span>
          <span className="text-white/40 text-xs font-mono">/</span>
          <span className="font-mono text-xs font-medium text-white/60">
            {String(slides.length).padStart(2, "0")}
          </span>

          <div className="h-3 w-px bg-white/20 mx-1"></div>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Slayt ${i + 1}`}
                className={`transition-all duration-500 rounded-full cursor-pointer ${
                  i === safeIndex
                    ? "w-6 h-2 bg-amber-400 shadow-md shadow-amber-400/50"
                    : "w-2 h-2 bg-white/40 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Manual Arrow Controls */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <button
            onClick={prevSlide}
            aria-label="Önceki Slayt"
            className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xl"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            onClick={nextSlide}
            aria-label="Sonraki Slayt"
            className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xl"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>

      </div>

      {/* ─── BOTTOM SEQUENTIAL PROGRESS BAR LINE ─── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-40">
        {!isPaused && (
          <div
            key={progressKey}
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{
              animation: `slideProgress ${SLIDE_DURATION}ms linear forwards`,
            }}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      ` }} />

    </section>
  );
}
