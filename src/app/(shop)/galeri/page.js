"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";

export default function Galeri() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const videos = {
    trt: {
      title: "TRT Haber: İspir'in Saklı Altını",
      desc: "Yarım asırlık pekmez geleneğimizin ulusal ekranlara yansıyan yolculuğu.",
      src: "/pekefe_tanitim.mp4",
    },
    kurutma: {
      title: "Güneşte Kurutma İşlemi",
      desc: "Geleneksel yöntemlerle dutların güneşte süzülme süreci.",
      src: "/pestil_yapimi.mp4",
    },
    dolum: {
      title: "Kıvam ve Dolum Süreci",
      desc: "Hijyenik koşullarda el değmeden ambalajlama ve vakumlu pişirme dolumu.",
      src: "/karisim.mp4",
    },
    dogasi: {
      title: "İspir'in Eşsiz Doğası",
      desc: "2000 rakımlı İspir dağlarında doğal hammadde kaynağımız.",
      src: "/magaza.mp4",
    },
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll("section > div, header > div");
    animatedElements.forEach((el) => {
      el.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-10");
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased pb-section-gap">
      <main>
        {/* Header */}
        <header className="pt-section-gap pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-primary mb-4 leading-tight">
            Görsel ve Video Galeri
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Geleneksel üretimimizin ardındaki emeği, kaliteyi ve markamızın yolculuğunu keşfedin.
          </p>
        </header>

        {/* Feature Video: TRT Haber */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
          <h2 className="font-headline-md text-on-surface mb-6 border-l-4 border-primary pl-4">
            Hikayemizin İzinde
          </h2>
          <div
            onClick={() => setSelectedVideo(videos.trt)}
            className="relative w-full aspect-video rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(139,0,0,0.08)] group cursor-pointer bg-surface-container-highest"
          >
            <Image
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              alt="TRT Haber İspir'in Saklı Altını"
              src="/ilhan-efe-trt.jpg"
              fill
              sizes="100vw"
            />
            <div className="absolute inset-0 video-overlay-gradient"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-primary/95 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                <span className="material-symbols-outlined text-[40px] ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="inline-block px-3 py-1 bg-secondary-container/90 text-on-secondary-container font-label-sm text-xs uppercase rounded-full mb-3 backdrop-blur-md">
                Belgesel
              </div>
              <h3 className="font-headline-md text-headline-lg-mobile text-white drop-shadow-md">
                TRT Haber: İspir'in Saklı Altını
              </h3>
              <p className="font-body-md text-body-md text-surface-container mt-2 max-w-3xl drop-shadow-sm">
                Yarım asırlık pekmez geleneğimizin ulusal ekranlara yansıyan yolculuğu.
              </p>
            </div>
          </div>
        </section>

        {/* Video Cards Grid */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap bg-surface-container-low py-16 rounded-3xl">
          <h2 className="font-headline-md text-on-surface mb-10 px-8 text-center">Üretimden Kareler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter px-8">
            {/* Card 1 */}
            <div
              onClick={() => setSelectedVideo(videos.kurutma)}
              className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(139,0,0,0.04)] group cursor-pointer bg-surface-container-lowest transition-all duration-300"
            >
              <Image
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                alt="Güneşte Kurutma"
                src="/ispir-pestil-kurutma-gercek.png"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-on-background/20 group-hover:bg-on-background/40 transition-colors duration-300 z-10"></div>
              <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-md rounded-full p-2 text-primary z-20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_circle
                </span>
              </div>
              <div className="absolute bottom-0 left-0 p-6 w-full video-overlay-gradient z-20">
                <h4 className="font-label-md text-on-primary font-bold">Güneşte Kurutma</h4>
                <p className="font-label-sm text-surface-variant mt-1 text-xs">Geleneksel yöntem</p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => setSelectedVideo(videos.dolum)}
              className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(139,0,0,0.04)] group cursor-pointer bg-surface-container-lowest md:-translate-y-4 transition-transform duration-300"
            >
              <Image
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                alt="Kıvam ve Dolum"
                src="/vakumlu-uretim.png"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-on-background/20 group-hover:bg-on-background/40 transition-colors duration-300 z-10"></div>
              <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-md rounded-full p-2 text-primary z-20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_circle
                </span>
              </div>
              <div className="absolute bottom-0 left-0 p-6 w-full video-overlay-gradient z-20">
                <h4 className="font-label-md text-on-primary font-bold">Kıvam ve Dolum</h4>
                <p className="font-label-sm text-surface-variant mt-1 text-xs">Saf kalite</p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => setSelectedVideo(videos.dogasi)}
              className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(139,0,0,0.04)] group cursor-pointer bg-surface-container-lowest"
            >
              <Image
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                alt="İspir'in Doğası"
                src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-on-background/20 group-hover:bg-on-background/40 transition-colors duration-300 z-10"></div>
              <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-md rounded-full p-2 text-primary z-20">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_circle
                </span>
              </div>
              <div className="absolute bottom-0 left-0 p-6 w-full video-overlay-gradient z-20">
                <h4 className="font-label-md text-on-primary font-bold">İspir'in Doğası</h4>
                <p className="font-label-sm text-surface-variant mt-1 text-xs">Kaynağımız</p>
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Grid */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
          <h2 className="font-headline-md text-on-surface mb-8 border-l-4 border-secondary pl-4">
            Instagram Akışı
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative aspect-square group overflow-hidden rounded-lg bg-surface-container-low cursor-pointer">
              <Image
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Pekefe İspir Hasadı Instagram Gönderisi"
                src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                <span className="text-white font-bold ml-2">342</span>
              </div>
            </div>

            <div className="relative aspect-square group overflow-hidden rounded-lg bg-surface-container-low cursor-pointer">
              <Image
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Geleneksel Bakır Kazan Kaynatma Instagram Gönderisi"
                src="/geleneksel-kazan.png"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                <span className="text-white font-bold ml-2">512</span>
              </div>
            </div>

            <div className="relative aspect-square group overflow-hidden rounded-lg bg-surface-container-low cursor-pointer">
              <Image
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Vakumlu Üretim Teknolojisi Instagram Gönderisi"
                src="/vakumlu-uretim.png"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                <span className="text-white font-bold ml-2">298</span>
              </div>
            </div>

            <div className="relative aspect-square group overflow-hidden rounded-lg bg-surface-container-low cursor-pointer">
              <Image
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Geleneksel İspir Dut Pekmezi Instagram Gönderisi"
                src="/pekefe-dut-pekmezi-kavanoz.jpg"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                <span className="text-white font-bold ml-2">405</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => setToast({ isOpen: true, message: "@pekefegida Instagram sayfamıza yönlendiriliyorsunuz...", type: "info" })}
              className="inline-flex items-center gap-2 bg-transparent border-2 border-outline hover:border-primary text-on-surface hover:text-primary font-label-md px-6 py-3 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              Bizi Takip Edin
            </button>
          </div>
        </section>
      </main>

      {/* Video Lightbox Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/30">
              <h3 className="font-headline-md text-primary text-lg font-bold">{selectedVideo.title}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-on-surface-variant hover:text-error transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video src={selectedVideo.src} controls autoPlay className="w-full h-full object-contain" />
            </div>
            <div className="px-6 py-4 bg-surface-container-low">
              <p className="font-body-md text-on-surface-variant">{selectedVideo.desc}</p>
            </div>
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}
