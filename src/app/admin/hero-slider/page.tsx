"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Sliders, Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Save, UploadCloud, RefreshCw, Layers, Check, Sparkles, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
  image: string;
  active: boolean;
  objectPositionX?: number; // 0% - 100%
  objectPositionY?: number; // 0% - 100%
  imageScale?: number;      // 1.0 - 1.6
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    tag: "Erzurum İspir'in Geleneksel El Emeği Mirası",
    title: "Zamanın Yavaş Akışında,",
    highlightTitle: "Doğanın Saf İmzası.",
    subtitle: "2000 metre rakımlı İspir yaylalarından şafak vakti toplanan saf beyaz dutlar; meşe odun ateşinde ve bakır kazanlarda kaynatılarak asırlık lezzetine kavuşur.",
    image: "/ispir-manzara-hero.png",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
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
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
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
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
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
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Köme & Tatlı Koleksiyonu", href: "/kategoriler" },
    secondaryCta: { text: "Rekolte Kulübü", href: "/rekolte-kulubu" },
  },
];

export default function AdminHeroSliderPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, posX: 50, posY: 50 });
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState<HeroSlide>({
    id: "",
    tag: "",
    title: "",
    highlightTitle: "",
    subtitle: "",
    image: "/ispir-manzara-hero.png",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Keşfet", href: "/kategoriler" },
    secondaryCta: { text: "Hikayemiz", href: "/hikayemiz" },
  });

  // Load initial slides
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pekefe_hero_slides");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlides(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }
      setSlides(DEFAULT_SLIDES);
      setLoading(false);
    }
  }, []);

  // Save slides to localStorage & dispatch change event
  const saveAllSlides = (updatedSlides: HeroSlide[]) => {
    setSlides(updatedSlides);
    if (typeof window !== "undefined") {
      localStorage.setItem("pekefe_hero_slides", JSON.stringify(updatedSlides));
      window.dispatchEvent(new Event("pekefe_hero_slides_changed"));
    }
  };

  const handleOpenAddModal = () => {
    setEditingSlide(null);
    setForm({
      id: Math.random().toString(),
      tag: "Coğrafi İşaretli İspir Mahsulü",
      title: "Yeni Slayt Başlığı",
      highlightTitle: "Doğanın Saf Dokusu",
      subtitle: "Slayt açıklama metninizi buraya yazabilirsiniz.",
      image: "/ispir-manzara-hero.png",
      active: true,
      primaryCta: { text: "İncele", href: "/kategoriler" },
      secondaryCta: { text: "Detaylar", href: "/hikayemiz" },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setForm({ ...slide });
    setIsModalOpen(true);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image.trim()) {
      toast.error("Başlık ve Görsel URL alanları zorunludur.");
      return;
    }

    let newSlides: HeroSlide[];
    if (editingSlide) {
      newSlides = slides.map((s) => (s.id === editingSlide.id ? form : s));
      toast.success("Slayt başarıyla güncellendi.");
    } else {
      newSlides = [...slides, form];
      toast.success("Yeni slayt eklendi.");
    }

    saveAllSlides(newSlides);
    setIsModalOpen(false);
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      toast.error("En az bir slayt kalmalıdır.");
      return;
    }
    if (confirm("Bu slaytı silmek istediğinize emin misiniz?")) {
      const updated = slides.filter((s) => s.id !== id);
      saveAllSlides(updated);
      toast.success("Slayt silindi.");
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = slides.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    saveAllSlides(updated);
    toast.success("Slayt yayın durumu güncellendi.");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...slides];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    saveAllSlides(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === slides.length - 1) return;
    const updated = [...slides];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    saveAllSlides(updated);
  };

  const handleResetDefaults = () => {
    if (confirm("Varsayılan İspir slaytlarına dönmek istediğinize emin misiniz?")) {
      saveAllSlides(DEFAULT_SLIDES);
      toast.success("Slaytlar varsayılana sıfırlandı.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, image: data.url }));
        if (data.optimized) {
          toast.success(`⚡ Görsel otomatik olarak tavsiye edilen 1920x1080 WebP formatına çevrildi ve optimize edildi!`);
        } else {
          toast.success("Görsel başarıyla yüklendi!");
        }
      } else {
        toast.error(data.error || "Görsel yüklenirken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Görsel yüklenemedi.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      posX: form.objectPositionX ?? 50,
      posY: form.objectPositionY ?? 50,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage || !previewBoxRef.current) return;
    const rect = previewBoxRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;

    const newX = Math.min(100, Math.max(0, Math.round(dragStartPos.current.posX - deltaX)));
    const newY = Math.min(100, Math.max(0, Math.round(dragStartPos.current.posY - deltaY)));

    setForm((prev) => ({ ...prev, objectPositionX: newX, objectPositionY: newY }));
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Otomatik 1920x1080 WebP & Kadraj Hizalama Aktif</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hero Slayt Yönetimi</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Ana sayfa girişinde yer alan yüksek çözünürlüklü sinematik görselleri, metinleri ve buton bağlantılarını buradan canlı olarak yönetebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
            title="Varsayılana Sıfırla"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Sıfırla</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-700/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Slayt Ekle</span>
          </button>
        </div>
      </div>

      {/* Recommended Image Sizes & Auto Converter Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-300/80 rounded-2xl p-5 flex items-start gap-4 text-slate-800 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300/40 font-bold">
          ⚡
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Otomatik Görsel Dönüştürücü & İnteraktif Kadrajlama Aktiftir</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">KADRAJ MODU</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Görselinizi yükledikten sonra düzenleme modalında fare ile sürükleyerek <strong>(Drag & Pan)</strong> veya odak butonlarını kullanarak resmin görünmesini istediğiniz açısını hassas şekilde ayarlayabilirsiniz.
          </p>
        </div>
      </div>

      {/* Slide Cards List */}
      <div className="space-y-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`bg-white border rounded-2xl p-5 md:p-6 shadow-sm transition-all flex flex-col md:flex-row gap-6 items-start md:items-center justify-between ${
              slide.active ? "border-slate-200/80 hover:border-amber-400" : "border-slate-200 bg-slate-50/60 opacity-60"
            }`}
          >
            {/* Image Thumbnail */}
            <div className="relative w-full md:w-56 aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shrink-0 shadow-inner group">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                style={{
                  objectPosition: `${slide.objectPositionX ?? 50}% ${slide.objectPositionY ?? 50}%`,
                  transform: `scale(${slide.imageScale ?? 1.0})`,
                }}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold font-mono rounded">
                Slayt #{index + 1}
              </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md">
                  {slide.tag || "Hasat Mirası"}
                </span>
                {!slide.active && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                    Gizli / Pasif
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Kadraj: X:{slide.objectPositionX ?? 50}% Y:{slide.objectPositionY ?? 50}%
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 truncate">
                {slide.title} <span className="text-amber-700 italic font-serif font-normal">{slide.highlightTitle}</span>
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-light">
                {slide.subtitle}
              </p>

              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                <span>Sol Buton: <strong className="text-slate-800">{slide.primaryCta?.text}</strong> ({slide.primaryCta?.href})</span>
                <span>Sağ Buton: <strong className="text-slate-800">{slide.secondaryCta?.text}</strong> ({slide.secondaryCta?.href})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex md:flex-col items-center justify-end gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 cursor-pointer"
                  title="Yukarı Taşı"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === slides.length - 1}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 cursor-pointer"
                  title="Aşağı Taşı"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(slide.id)}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    slide.active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
                  }`}
                  title={slide.active ? "Gizle" : "Yayınla"}
                >
                  {slide.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleOpenEditModal(slide)}
                  className="p-2 hover:bg-amber-50 text-amber-700 rounded-lg transition cursor-pointer"
                  title="Düzenle / Kadrajla"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Edit / Add Modal with Real-time Live Slide Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 border border-slate-100 my-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{editingSlide ? "Slaytı Düzenle & Kadrajla" : "Yeni Slayt Ekle & Kadrajla"}</span>
                  <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md font-mono font-bold">
                    CANLI KADRAJLAMA MODU
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Görseli fare ile sürükleyerek veya aşağıdaki kadraj butonlarıyla dilediğiniz açıya hizalayabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* LIVE REAL-TIME VISUAL SLIDE PREVIEW BOX WITH MOUSE DRAG & PAN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>Slayt Vitrin Canlı Önizleme & Kadraj Alanı</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded">
                    💡 İpucu: Resmi Fare ile Sürükleyebilirsiniz (Drag & Pan)
                  </span>
                </label>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  Odak: X: %{form.objectPositionX ?? 50} | Y: %{form.objectPositionY ?? 50} | Zoom: %{Math.round((form.imageScale ?? 1.0) * 100)}
                </span>
              </div>

              <div
                ref={previewBoxRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative w-full aspect-[21/9] sm:aspect-[16/7] rounded-2xl overflow-hidden bg-slate-950 border-2 transition-colors border-slate-900 shadow-xl group/preview select-none flex items-end justify-start p-4 sm:p-6 text-white ${
                  isDraggingImage ? "cursor-grabbing border-amber-500" : "cursor-grab hover:border-amber-400/80"
                }`}
              >
                {/* Background Image Preview */}
                {form.image ? (
                  <Image
                    src={form.image}
                    alt="Canlı Önizleme"
                    fill
                    unoptimized
                    style={{
                      objectPosition: `${form.objectPositionX ?? 50}% ${form.objectPositionY ?? 50}%`,
                      transform: `scale(${form.imageScale ?? 1.0})`,
                    }}
                    className="object-cover filter brightness-100 contrast-[1.02] saturate-[1.05] transition-all duration-75"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-mono">
                    Görsel Seçilmedi
                  </div>
                )}

                {/* Ambient Soft Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/15 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent h-1/2 bottom-0 top-auto pointer-events-none"></div>

                {/* Watermark Badge & Drag Hint */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold font-mono rounded-lg border border-white/20 flex items-center gap-1.5 z-20 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>VITRIN CANLI GÖRÜNÜMÜ</span>
                </div>

                {/* Dragging Overlay Indicator */}
                {isDraggingImage && (
                  <div className="absolute inset-0 bg-amber-500/10 border-2 border-amber-400 z-30 pointer-events-none flex items-center justify-center">
                    <span className="px-4 py-2 bg-black/80 text-amber-300 text-xs font-bold rounded-full shadow-2xl backdrop-blur-md">
                      🎯 Görsel Açı/Kadraj Ayarlanıyor (X: %{form.objectPositionX} Y: %{form.objectPositionY})
                    </span>
                  </div>
                )}

                {/* Overlaid Typography Content */}
                <div className="relative z-20 space-y-2 max-w-lg text-left drop-shadow-md pointer-events-none">
                  {form.tag && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white">
                        {form.tag}
                      </span>
                    </div>
                  )}

                  <h2 className="text-base sm:text-2xl font-bold leading-tight drop-shadow-lg">
                    {form.title || "Başlık Giriniz"} <br />
                    <span className="text-amber-300 italic font-serif font-normal">
                      {form.highlightTitle}
                    </span>
                  </h2>

                  {form.subtitle && (
                    <p className="text-[10px] sm:text-xs text-white/90 line-clamp-2 leading-relaxed font-light drop-shadow">
                      {form.subtitle}
                    </p>
                  )}

                  <div className="pt-1 flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-700 text-white rounded-md text-[10px] font-bold shadow">
                      {form.primaryCta?.text || "Buton 1"}
                    </span>
                    <span className="px-3 py-1 bg-black/40 border border-white/30 text-white rounded-md text-[10px] font-bold backdrop-blur-md">
                      {form.secondaryCta?.text || "Buton 2"}
                    </span>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE FRAMING & ZOOM CONTROLS PANEL */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🎯 Kadraj Hazır Ayarları:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, objectPositionX: 50, objectPositionY: 50 }))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
                    >
                      🎯 Ortala
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, objectPositionX: 25, objectPositionY: 50 }))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
                    >
                      ⬅️ Sol Odak
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, objectPositionX: 75, objectPositionY: 50 }))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
                    >
                      ➡️ Sağ Odak
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, objectPositionX: 50, objectPositionY: 20 }))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
                    >
                      ⬆️ Üst Odak
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, objectPositionX: 50, objectPositionY: 80 }))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer"
                    >
                      ⬇️ Alt Odak
                    </button>
                  </div>
                </div>

                {/* Fine Tuning Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Yatay Kadraj (X):</span>
                      <span className="font-mono text-amber-700 font-bold">%{form.objectPositionX ?? 50}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.objectPositionX ?? 50}
                      onChange={(e) => setForm({ ...form, objectPositionX: Number(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Dikey Kadraj (Y):</span>
                      <span className="font-mono text-amber-700 font-bold">%{form.objectPositionY ?? 50}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.objectPositionY ?? 50}
                      onChange={(e) => setForm({ ...form, objectPositionY: Number(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Yakınlaştırma (Scale):</span>
                      <span className="font-mono text-amber-700 font-bold">%{Math.round((form.imageScale ?? 1.0) * 100)}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={160}
                      step={5}
                      value={Math.round((form.imageScale ?? 1.0) * 100)}
                      onChange={(e) => setForm({ ...form, imageScale: Number(e.target.value) / 100 })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* FORM INPUTS */}
            <form onSubmit={handleSaveSlide} className="space-y-4 text-xs font-semibold text-slate-700">
              
              {/* Görsel Yükleme / URL */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900">Slayt Arka Plan Görseli *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="/ispir-manzara-hero.png veya https://..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-amber-600 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>{isUploading ? "Dönüştürülüyor..." : "Görsel Seç & Yükle"}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Üst Etiket */}
              <div className="space-y-1">
                <label className="block font-bold">Üst Canlı Rozet / Etiket Metni</label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="Örn: Erzurum İspir'in Geleneksel El Emeği Mirası"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-amber-600"
                />
              </div>

              {/* Başlıklar Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold">Ana Başlık (Düz Metin) *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Örn: Zamanın Yavaş Akışında,"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-amber-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold">Vurgulu Başlık (İtalik Serif)</label>
                  <input
                    type="text"
                    value={form.highlightTitle}
                    onChange={(e) => setForm({ ...form, highlightTitle: e.target.value })}
                    placeholder="Örn: Doğanın Saf İmzası."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Alt Açıklama */}
              <div className="space-y-1">
                <label className="block font-bold">Açıklama Metni (Subtitle)</label>
                <textarea
                  rows={2}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="İspir yaylalarından toplanan saf beyaz dutlar..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-amber-600 resize-none font-normal"
                />
              </div>

              {/* CTAs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-2">
                  <label className="block font-bold text-amber-800">1. Buton (Sol - Ana Buton)</label>
                  <input
                    type="text"
                    placeholder="Buton Metni"
                    value={form.primaryCta?.text || ""}
                    onChange={(e) =>
                      setForm({ ...form, primaryCta: { ...form.primaryCta, text: e.target.value } })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-600 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Bağlantı URL (/kategoriler)"
                    value={form.primaryCta?.href || ""}
                    onChange={(e) =>
                      setForm({ ...form, primaryCta: { ...form.primaryCta, href: e.target.value } })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-600 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">2. Buton (Sağ - İkincil Buton)</label>
                  <input
                    type="text"
                    placeholder="Buton Metni"
                    value={form.secondaryCta?.text || ""}
                    onChange={(e) =>
                      setForm({ ...form, secondaryCta: { ...form.secondaryCta, text: e.target.value } })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-600 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Bağlantı URL (/hikayemiz)"
                    value={form.secondaryCta?.href || ""}
                    onChange={(e) =>
                      setForm({ ...form, secondaryCta: { ...form.secondaryCta, href: e.target.value } })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-600 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-700/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Slaytı Kaydet</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
