"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ImageIcon,
  Video,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Eye,
  Tag,
  Filter,
  Loader2,
  RefreshCw,
  X,
  FileVideo,
  FileImage,
  Star,
} from "lucide-react";
import { toast } from "sonner";

interface GalleryItem {
  id: string;
  type: "image" | "video";
  category: string;
  categoryLabel: string;
  title: string;
  desc: string;
  src: string;
  thumb?: string;
  badge?: string;
  isFeatured?: boolean;
  active: boolean;
  order: number;
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  { id: "medya", label: "Belgesel & Medya" },
  { id: "hasat", label: "Hasat & Doğal Yaşam" },
  { id: "uretim", label: "Geleneksel Üretim" },
  { id: "dolum", label: "Hijyen & Dolum" },
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: "image" as "image" | "video",
    category: "uretim",
    categoryLabel: "Geleneksel Üretim",
    title: "",
    desc: "",
    src: "",
    thumb: "",
    badge: "Galeri Özel",
    isFeatured: false,
    active: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Fetch all gallery items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch {
      toast.error("Galeri verileri sunucudan çekilemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Open modal for NEW item
  const handleOpenNewModal = () => {
    setEditingItem(null);
    setFormData({
      type: "image",
      category: "uretim",
      categoryLabel: "Geleneksel Üretim",
      title: "",
      desc: "",
      src: "",
      thumb: "",
      badge: "Galeri Özel",
      isFeatured: false,
      active: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for EDITING item
  const handleOpenEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      category: item.category,
      categoryLabel: item.categoryLabel,
      title: item.title,
      desc: item.desc || "",
      src: item.src,
      thumb: item.thumb || "",
      badge: item.badge || "Galeri Özel",
      isFeatured: Boolean(item.isFeatured),
      active: Boolean(item.active),
    });
    setIsModalOpen(true);
  };

  // Handle direct file upload for Main Media (Src)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu 50 MB limitini aşamaz.");
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading("Medya dosyası sunucuya yükleniyor...");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/gallery", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (res.ok && data.success) {
        toast.success("Dosya başarıyla yüklendi!");
        const isVid = file.type.startsWith("video/") || file.name.match(/\.(mp4|webm|mov)$/i);
        setFormData((prev) => ({
          ...prev,
          src: data.url,
          type: isVid ? "video" : "image",
          thumb: prev.thumb || (isVid ? "" : data.url),
        }));
      } else {
        toast.error(data.error || "Dosya yüklenemedi.");
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Dosya yüklenirken sunucu hatası oluştu.");
    } finally {
      setUploading(false);
    }
  };

  // Handle file upload for Thumbnail
  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    const loadingToast = toast.loading("Kapak görseli yükleniyor...");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/gallery", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (res.ok && data.success) {
        toast.success("Kapak görseli yüklendi!");
        setFormData((prev) => ({ ...prev, thumb: data.url }));
      } else {
        toast.error(data.error || "Kapak görseli yüklenemedi.");
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Kapak görseli yüklenirken hata oluştu.");
    } finally {
      setUploadingThumb(false);
    }
  };

  // Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Lütfen bir başlık girin.");
      return;
    }
    if (!formData.src.trim()) {
      toast.error("Lütfen bir resim veya video dosyası yükleyin / URL girin.");
      return;
    }

    const payload = {
      ...formData,
      thumb: formData.thumb.trim() || formData.src,
      ...(editingItem && { id: editingItem.id }),
    };

    const method = editingItem ? "PUT" : "POST";
    const saveToast = toast.loading(editingItem ? "Galeri ögesi güncelleniyor..." : "Yeni galeri ögesi ekleniyor...");

    try {
      const res = await fetch("/api/gallery", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      toast.dismiss(saveToast);

      if (res.ok && data.success) {
        toast.success(editingItem ? "Galeri ögesi başarıyla güncellendi!" : "Yeni öge galeriye eklendi!");
        setIsModalOpen(false);
        fetchItems();
      } else {
        toast.error(data.error || "İşlem başarısız oldu.");
      }
    } catch {
      toast.dismiss(saveToast);
      toast.error("Sunucuya bağlanırken hata oluştu.");
    }
  };

  // Toggle Active/Passive
  const handleToggleActive = async (item: GalleryItem) => {
    const updatedStatus = !item.active;
    try {
      const res = await fetch("/api/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, active: updatedStatus }),
      });
      if (res.ok) {
        toast.success(`Durum ${updatedStatus ? "Aktif" : "Pasif"} olarak güncellendi.`);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, active: updatedStatus } : i))
        );
      }
    } catch {
      toast.error("Durum değiştirilemedi.");
    }
  };

  // Delete Item
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" ögesini galeriden silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Galeri ögesi silindi.");
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        toast.error(data.error || "Silinemedi.");
      }
    } catch {
      toast.error("Silme işleminde sunucu hatası oluştu.");
    }
  };

  const filteredItems = activeCategory === "all"
    ? items
    : items.filter((i) => i.category === activeCategory);

  const videoCount = items.filter((i) => i.type === "video").length;
  const imageCount = items.filter((i) => i.type === "image").length;
  const activeCount = items.filter((i) => i.active).length;

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#FAF9F6] min-h-screen text-slate-800">
      
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-900 font-bold">
              <ImageIcon className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold font-display-lg text-amber-950">
              Galeri Yönetimi
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1 font-body">
            Görsel &amp; Video Galeri sayfasındaki (`/galeri`) tüm ortam dosyalarını yönetin, yeni fotoğraf ve videolar ekleyin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchItems}
            className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            onClick={handleOpenNewModal}
            className="bg-[#4A0E17] hover:bg-[#360a10] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Medya Ekle</span>
          </button>
        </div>
      </div>

      {/* ─── STATS CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xl">
            {items.length}
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Toplam İçerik</div>
            <div className="text-lg font-bold text-stone-800">Medya Arşivi</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Video İçerikleri</div>
            <div className="text-lg font-bold text-stone-800">{videoCount} Adet</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Fotoğraf Arşivi</div>
            <div className="text-lg font-bold text-stone-800">{imageCount} Adet</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">Yayındaki Medyalar</div>
            <div className="text-lg font-bold text-stone-800">{activeCount} Aktif</div>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY FILTER BAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrele:
          </span>
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === "all"
                ? "bg-[#4A0E17] text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Tümü ({items.length})
          </button>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = items.filter((i) => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#4A0E17] text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-xs text-stone-500 font-mono">
          Gösterilen: {filteredItems.length} / {items.length}
        </div>
      </div>

      {/* ─── MEDIA GRID ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-stone-200 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A0E17]" />
          <p className="text-sm text-stone-500">Galeri verileri yükleniyor...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 space-y-3 p-8">
          <ImageIcon className="w-12 h-12 mx-auto text-stone-300" />
          <h3 className="text-lg font-bold text-stone-700">Henüz Medya Bulunmuyor</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Bu kategoride kayıtlı görsel veya video bulunmuyor. Yeni Medya Ekle butonunu kullanarak hemen içerik yükleyebilirsiniz.
          </p>
          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-2 bg-[#4A0E17] text-white px-4 py-2 rounded-xl text-xs font-bold mt-2"
          >
            <Plus className="w-4 h-4" /> Medya Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm flex flex-col justify-between group ${
                !item.active ? "opacity-60 border-dashed border-stone-300" : "border-stone-200 hover:shadow-md"
              }`}
            >
              <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
                <Image
                  src={item.thumb || item.src}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-white/20">
                    {item.type === "video" ? (
                      <>
                        <Video className="w-3 h-3 text-blue-400" /> Video
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-emerald-400" /> Fotoğraf
                      </>
                    )}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      item.active ? "bg-emerald-500 text-white" : "bg-stone-700 text-stone-300"
                    }`}
                  >
                    {item.active ? "Yayında" : "Pasif"}
                  </span>
                </div>

                {/* Bottom Overlay Title */}
                <div className="absolute bottom-3 left-3 right-3 text-white z-20">
                  <span className="text-[10px] font-mono text-amber-200 uppercase font-bold block">
                    {item.badge || item.categoryLabel}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-amber-800 bg-amber-50 font-bold px-2 py-0.5 rounded uppercase">
                    {item.categoryLabel}
                  </span>
                  <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-body leading-relaxed line-clamp-2">
                    {item.desc || "Açıklama belirtilmedi."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                      item.active
                        ? "bg-amber-50 text-amber-900 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    {item.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {item.active ? "Yayından Kaldır" : "Yayına Al"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
                      title="Düzenle"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 rounded-lg text-stone-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT MEDIA ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#4A0E17] text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold font-display-lg text-lg">
                  {editingItem ? "Galeri Ögesini Düzenle" : "Yeni Galeri İçeriği Ekle"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Type and Category Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Medya Türü
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "image" })}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        formData.type === "image"
                          ? "bg-[#4A0E17] text-white border-[#4A0E17]"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" /> Fotoğraf
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "video" })}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        formData.type === "video"
                          ? "bg-[#4A0E17] text-white border-[#4A0E17]"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      <Video className="w-4 h-4" /> Video
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Galeri Kategorisi
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const selectedCat = CATEGORY_OPTIONS.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        categoryLabel: selectedCat?.label || "Galeri Özel",
                      });
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#4A0E17]"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    İçerik Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: İspirin bereketli topraklarında Dut Hasadı"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4A0E17]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Etiket / Rozet
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: TRT Haber Özel"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4A0E17]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  İçerik Açıklaması
                </label>
                <textarea
                  rows={3}
                  placeholder="İçeriğin detaylı açıklamasını ve hikayesini yazın..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4A0E17]"
                />
              </div>

              {/* Media File Upload / URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Medya Dosyası (Görsel veya Video) *
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Resim veya Video URL adresi veya sunucu yolu (/uploads/...)"
                    value={formData.src}
                    onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4A0E17]"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Dosya Yükle</span>
                  </button>
                </div>
              </div>

              {/* Optional Custom Thumbnail */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Kapak Görseli / Küçük Resim (Opsiyonel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Video kapak resmi URL'si (Boş bırakılırsa dosyanın kendisi kullanılır)"
                    value={formData.thumb}
                    onChange={(e) => setFormData({ ...formData, thumb: e.target.value })}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4A0E17]"
                  />
                  <input
                    type="file"
                    ref={thumbInputRef}
                    onChange={handleThumbUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={uploadingThumb}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                  >
                    {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Kapak Seç</span>
                  </button>
                </div>
              </div>

              {/* Switches: Active & Featured */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-[#4A0E17] rounded focus:ring-0"
                  />
                  <span className="text-xs font-bold text-stone-700">Sitede Yayına Al (Aktif)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-[#4A0E17] rounded focus:ring-0"
                  />
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Öne Çıkar (Manşet)
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-[#4A0E17] hover:bg-[#360a10] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {editingItem ? "Güncellemeleri Kaydet" : "Galeriye Ekle"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
