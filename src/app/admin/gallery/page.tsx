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
  Search,
  Link as LinkIcon
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
  { id: "aricilik", label: "Arıcılık & Kovanlar" },
  { id: "b2b", label: "B2B & Ekipmanlar" },
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  // Media Library Picker Modal
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [pickerTarget, setPickerTarget] = useState<"src" | "thumb">("src");

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

  // Fetch Media Library Assets for Picker
  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/cms/media", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMediaItems(data);
      }
    } catch {
      console.error("Error fetching media items for picker");
    }
  };

  useEffect(() => {
    fetchItems();
    fetchMedia();
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

  // Open Media Picker
  const openMediaPicker = (target: "src" | "thumb") => {
    setPickerTarget(target);
    setIsMediaPickerOpen(true);
  };

  const selectImageFromPicker = (url: string) => {
    if (pickerTarget === "src") {
      setFormData((prev) => ({
        ...prev,
        src: url,
        thumb: prev.thumb || url
      }));
    } else {
      setFormData((prev) => ({ ...prev, thumb: url }));
    }
    setIsMediaPickerOpen(false);
    toast.success("Görsel seçildi.");
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

  // Toggle Featured
  const handleToggleFeatured = async (item: GalleryItem) => {
    const updatedFeatured = !item.isFeatured;
    try {
      const res = await fetch("/api/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isFeatured: updatedFeatured }),
      });
      if (res.ok) {
        toast.success(updatedFeatured ? "Öge öne çıkarılan olarak işaretlendi." : "Öne çıkarma kaldırıldı.");
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isFeatured: updatedFeatured } : i))
        );
      }
    } catch {
      toast.error("Öne çıkarma durumu değiştirilemedi.");
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

  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === "all" ? true : item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
              Galeri & Albüm Yönetimi
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

      {/* ─── SEARCH & CATEGORY FILTER BAR ─── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Başlık veya açıklamaya göre ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white text-stone-900"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Kategori:
          </span>
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? "bg-[#4A0E17] text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── GALLERY ITEMS GRID ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
          <span className="text-sm text-stone-500 font-bold">Galeri İçeriği Yükleniyor...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
          <ImageIcon className="w-16 h-16 text-stone-300 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-stone-800">Hiç Medya Bulunamadı</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              {activeCategory !== "all" || searchQuery
                ? "Arama veya kategori filtrenize uygun görsel bulunamadı."
                : "Galeri henüz boş. Sağ üstteki 'Yeni Medya Ekle' butonundan ilk görselinizi yükleyebilirsiniz."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const displayThumb = item.thumb || item.src;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group ${
                  !item.active ? "opacity-60 bg-stone-50" : ""
                }`}
              >
                {/* Media Image / Video Container */}
                <div className="relative aspect-video bg-stone-900 overflow-hidden">
                  {displayThumb ? (
                    <Image
                      src={displayThumb}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-500">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                  {/* Type Badge (Video / Image) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow ${
                        item.type === "video" ? "bg-red-600" : "bg-emerald-600"
                      }`}
                    >
                      {item.type === "video" ? <Play className="w-3 h-3 fill-current" /> : <ImageIcon className="w-3 h-3" />}
                      {item.type === "video" ? "Video" : "Görsel"}
                    </span>
                    {item.badge && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-stone-950 uppercase tracking-wider shadow">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Featured Star Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(item)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition z-10 ${
                      item.isFeatured ? "bg-amber-500 text-white shadow-lg" : "bg-black/40 text-white/70 hover:text-white"
                    }`}
                    title={item.isFeatured ? "Öne Çıkarılan" : "Öne Çıkar"}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  {/* Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                      {item.categoryLabel || item.category}
                    </span>
                    <h3 className="text-sm font-bold text-white truncate" title={item.title}>
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-body">
                    {item.desc || "Açıklama girilmedi."}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    {/* Active Status Badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                        item.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200"
                      }`}
                    >
                      {item.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{item.active ? "Yayında" : "Pasif"}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
                        title="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden z-10 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
                  {editingItem ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {editingItem ? "Galeri Ögesini Düzenle" : "Yeni Galeri Ögesi Ekle"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Görsel veya video detaylarını aşağıdan ayarlayın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "image" }))}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                    formData.type === "image"
                      ? "bg-amber-900 text-white border-amber-900 shadow-sm"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Fotoğraf / Görsel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "video" }))}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                    formData.type === "video"
                      ? "bg-red-700 text-white border-red-700 shadow-sm"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video İçi Link / MP4</span>
                </button>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Başlık *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Örn: 2026 Erzurum Hasat Belgeseli"
                    className="w-full px-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Etiket / Rozet
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="Örn: Galeri Özel"
                    className="w-full px-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Kategori *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const sel = CATEGORY_OPTIONS.find((c) => c.id === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                      categoryLabel: sel ? sel.label : e.target.value,
                    }));
                  }}
                  className="w-full px-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white font-medium"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Main Media File / URL */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  {formData.type === "video" ? "Video URL / Dosyası *" : "Görsel URL / Dosyası *"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.src}
                    onChange={(e) => setFormData((prev) => ({ ...prev, src: e.target.value }))}
                    placeholder={
                      formData.type === "video"
                        ? "https://youtube.com/embed/... veya video.mp4"
                        : "https://... veya dosya seçin"
                    }
                    className="w-full px-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white font-mono"
                  />
                  
                  <button
                    type="button"
                    onClick={() => openMediaPicker("src")}
                    className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
                    title="Medya Kütüphanesinden Seç"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span className="hidden sm:inline">Kütüphaneden Seç</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept={formData.type === "video" ? "video/*" : "image/*"}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-amber-400" />}
                    <span>Yükle</span>
                  </button>
                </div>
              </div>

              {/* Thumbnail Image */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Kapak / Önizleme Görseli (Opsiyonel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.thumb}
                    onChange={(e) => setFormData((prev) => ({ ...prev, thumb: e.target.value }))}
                    placeholder="Boş bırakılırsa dosyanın kendisi kapak olur"
                    className="w-full px-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white font-mono"
                  />

                  <button
                    type="button"
                    onClick={() => openMediaPicker("thumb")}
                    className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span className="hidden sm:inline">Kütüphane</span>
                  </button>

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
                    className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition"
                  >
                    {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Yükle</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Açıklama Metni
                </label>
                <textarea
                  rows={3}
                  value={formData.desc}
                  onChange={(e) => setFormData((prev) => ({ ...prev, desc: e.target.value }))}
                  placeholder="Görsel veya video ile ilgili detaylı açıklama..."
                  className="w-full px-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-900 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-stone-800">Sitede Yayında (Aktif)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-900 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-stone-800">Öne Çıkarılan Medya</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-100 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#360a10] text-white font-bold text-xs transition shadow-md"
                >
                  {editingItem ? "Güncelle" : "Galeriye Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MEDIA PICKER MODAL ─── */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm" onClick={() => setIsMediaPickerOpen(false)} />
          
          <div className="bg-white relative z-10 rounded-3xl w-full max-w-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-700" />
                Medya Kütüphanesinden Görsel Seç
              </h3>
              <button onClick={() => setIsMediaPickerOpen(false)} className="p-1 rounded-full text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {mediaItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id || item.url}
                      onClick={() => selectImageFromPicker(item.url)}
                      className="group cursor-pointer bg-stone-50 rounded-2xl overflow-hidden border border-stone-200 hover:border-amber-700 transition flex flex-col h-40 shadow-xs hover:shadow-md"
                    >
                      <div className="relative flex-grow bg-stone-100 overflow-hidden">
                        <Image src={item.url} alt={item.name || "Media"} fill sizes="200px" className="object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                      <div className="p-2 bg-white border-t border-stone-100">
                        <p className="text-[10px] font-bold text-stone-800 truncate">{item.name || "Görsel"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-stone-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">Kütüphanede görsel bulunamadı.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button onClick={() => setIsMediaPickerOpen(false)} className="px-4 py-2 bg-stone-200 text-stone-700 font-bold rounded-xl text-xs">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
