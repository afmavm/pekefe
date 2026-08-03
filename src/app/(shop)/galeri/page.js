"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";

export default function Galeri() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGalleryData() {
      try {
        const res = await fetch("/api/gallery", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMediaItems(data.filter((item) => item.active !== false));
          }
        }
      } catch (err) {
        console.error("Failed to load gallery items from API", err);
      } finally {
        setLoading(false);
      }
    }
    loadGalleryData();
  }, []);

  const instagramPosts = [
    { src: "/uploads/ispir_hikayemiz_baba_ogul_beyaz_dut.jpg", likes: 482, caption: "İspir Aktaş vadisinde şafak vakti baba-oğul dut hasadı." },
    { src: "/uploads/ispir-bakir-kazan-ahsap-cendere.webp", likes: 620, caption: "Meşe odunu ateşinde bakır kazanların tütüşü." },
    { src: "/uploads/ispir-keten-bezde-pestil-serimi.webp", likes: 534, caption: "İspir güneşi altında keten bezlerde kuruyan ipeksi pestil." },
    { src: "/pekefe-dut-pekmezi-kavanoz-tr.jpg", likes: 710, caption: "Katkısız %100 saf İspir dut pekmezi cam kavanozlarımız." },
  ];

  const featuredMedia = mediaItems.find((item) => item.isFeatured) || mediaItems[0];

  const filteredMedia = activeTab === "all"
    ? mediaItems
    : mediaItems.filter((item) => item.category === activeTab);

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
  }, [mediaItems]);

  return (
    <div className="relative w-full min-h-screen bg-[#FAF9F6] text-on-surface overflow-hidden pb-24">
      {/* Subtle background grain grid */}
      <div className="absolute inset-0 bg-[#F9F9FF] pointer-events-none opacity-40 mix-blend-multiply z-0"></div>

      {/* ─── HERO HEADER BANNER ─── */}
      <header className="relative h-[48vh] min-h-[380px] flex items-center justify-center overflow-hidden">
        <Image
          src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
          alt="İspir Kaçkar Dağları Manzarası"
          fill
          priority
          sizes="100vw"
          className="object-cover filter brightness-[0.55] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#4A0E17]/85 via-[#4A0E17]/40 to-transparent z-10"></div>
        
        <div className="relative z-20 text-center px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-amber-200 text-xs font-semibold tracking-[0.3em] uppercase px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            PEKEFE GÖRSEL MİRAS · SİNEMATİK GALERİ
          </span>
          <h1 className="font-display-lg text-[36px] sm:text-[48px] md:text-[56px] text-white leading-tight font-bold drop-shadow-md">
            Geleneksel Zanaat ve Üretim Galerisi
          </h1>
          <p className="font-body-md text-amber-100/90 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-light">
            Erzurum İspir yaylalarındaki doğal meşe ateşinden hijyenik ambalajlama tesislerimize uzanan lezzet belgeseli.
          </p>
          <div className="w-16 h-[1px] bg-secondary mx-auto rounded-full pt-1"></div>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-16 relative z-10">

        {/* ─── FEATURED DOCUMENTARY BANNER (TRT HABER) ─── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-secondary font-label-md text-xs uppercase tracking-[0.2em] font-bold">
              ÖNE ÇIKAN MEDYA
            </span>
            <span className="text-xs text-on-surface-variant font-mono">Ulusal Basın &amp; Belgesel</span>
          </div>

          <div
            onClick={() => setSelectedMedia(mediaItems[0])}
            className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20 group cursor-pointer"
          >
            <Image
              className="object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.70]"
              alt="TRT Haber İspir'in Saklı Altını"
              src="/ilhan-efe-trt.jpg"
              fill
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
            
            {/* Center Animated Play Button */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-primary border-2 border-white/30">
                <span className="material-symbols-outlined text-[44px] ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 p-6 sm:p-10 w-full z-20 space-y-2">
              <span className="inline-block px-3 py-1 bg-amber-400 text-amber-950 font-label-sm text-[10px] uppercase font-bold rounded-full tracking-widest backdrop-blur-md">
                TRT Haber Belgeseli
              </span>
              <h3 className="font-display-lg text-2xl sm:text-3xl md:text-4xl text-white font-bold drop-shadow-md">
                TRT Haber: İspir'in Saklı Altını Pekefe Dut Pekmezi
              </h3>
              <p className="font-body-md text-amber-100/90 text-xs sm:text-sm max-w-2xl drop-shadow-sm font-light">
                İlhan Efe'nin öğretmenlikten geleneksel zanaata uzanan yarım asırlık pekmez serüveninin TRT Haber ekranlarındaki belgeseli.
              </p>
            </div>
          </div>
        </section>

        {/* ─── CATEGORY FILTER TABS ─── */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-outline-variant/15 pb-6">
            <h2 className="font-display-lg text-primary text-2xl sm:text-3xl font-bold">
              Görsel &amp; Video Koleksiyonu
            </h2>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Tüm Medyalar" },
                { id: "medya", label: "Belgesel & Medya" },
                { id: "hasat", label: "Hasat & Doğal Yaşam" },
                { id: "uretim", label: "Geleneksel Üretim" },
                { id: "dolum", label: "Hijyen & Dolum" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? "bg-primary border-primary text-white shadow-md scale-105"
                      : "bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── MEDIA GRID ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className="bg-white rounded-3xl overflow-hidden border border-outline-variant/15 shadow-sm group hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                  <Image
                    className="object-cover transition-transform duration-700 group-hover:scale-108"
                    alt={item.title}
                    src={item.thumb}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                  
                  {/* Top Badge */}
                  <span className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                    {item.badge}
                  </span>

                  {/* Icon Indicator (Video Play vs Image Expand) */}
                  <div className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">
                      {item.type === "video" ? "play_arrow" : "fullscreen"}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-2">
                  <span className="text-[10px] text-secondary font-mono tracking-widest uppercase font-bold">
                    {item.categoryLabel}
                  </span>
                  <h3 className="font-display-lg text-primary text-xl font-bold leading-snug group-hover:text-amber-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-body leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── INSTAGRAM SOCIAL GALLERY ─── */}
        <section className="bg-white p-8 md:p-12 rounded-3xl border border-outline-variant/15 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-outline-variant/10 pb-6">
            <div>
              <span className="text-secondary font-label-md text-xs uppercase tracking-[0.25em] font-bold block">
                CANLI TOPLULUK AKIŞI
              </span>
              <h2 className="font-display-lg text-primary text-2xl sm:text-3xl font-bold mt-1">
                @pekefegida Instagram Kareleri
              </h2>
            </div>
            <button
              onClick={() => setToast({ isOpen: true, message: "@pekefegida Instagram sayfamıza yönlendiriliyorsunuz...", type: "info" })}
              className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>Bizi Takip Edin</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {instagramPosts.map((post, idx) => (
              <div
                key={idx}
                onClick={() => setToast({ isOpen: true, message: `@pekefegida: ${post.caption}`, type: "info" })}
                className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-outline-variant/15 shadow-sm"
              >
                <Image
                  src={post.src}
                  alt={`Pekefe Instagram Paylaşımı ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4 text-center z-10 space-y-2">
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <span className="material-symbols-outlined text-rose-300" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                    <span>{post.likes}</span>
                  </div>
                  <p className="text-[11px] font-body line-clamp-3 text-amber-100">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ─── INTERACTIVE LIGHTBOX MODAL (VIDEO & IMAGE) ─── */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-surface-container-lowest rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 bg-primary text-white border-b border-white/10">
              <div>
                <span className="text-[10px] text-amber-300 font-mono tracking-widest uppercase font-bold block">
                  {selectedMedia.categoryLabel || "Pekefe Galeri"}
                </span>
                <h3 className="font-display-lg text-lg font-bold">{selectedMedia.title}</h3>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {selectedMedia.type === "video" ? (
                <video src={selectedMedia.src} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <Image
                  src={selectedMedia.src}
                  alt={selectedMedia.title}
                  fill
                  className="object-contain"
                  priority
                />
              )}
            </div>

            <div className="px-6 py-4 bg-white space-y-1">
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                {selectedMedia.desc}
              </p>
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

