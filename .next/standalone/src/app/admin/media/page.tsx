"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Image as ImageIcon, Plus, Trash2, Upload, Link2, Loader2, Info, FileImage, Sparkles 
} from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: string;
  tag: string;
  alt: string;
  createdAt: string;
}

export default function MediaAdminPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all media items on mount
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/media", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch {
      toast.error("Medya dosyaları yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Add dynamic URL image link
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      const res = await fetch("/api/cms/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Bağlantı resmi kütüphaneye eklendi!");
        setItems((prev) => [data.item, ...prev]);
        setNewUrl("");
      } else {
        toast.error(data.error || "Resim bağlantısı eklenemedi.");
      }
    } catch {
      toast.error("Resim bağlantısı eklenirken sunucu hatası oluştu.");
    }
  };

  // Trigger local file selection
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5 MB limitini aşamaz.");
      return;
    }

    setUploading(true);
    const uploadToast = toast.loading("Resim sunucuya yükleniyor ve kaydediliyor...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cms/media", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      toast.dismiss(uploadToast);
      if (res.ok && data.success) {
        toast.success("Resim başarıyla yüklendi ve veritabanına kaydedildi!");
        setItems((prev) => [data.item, ...prev]);
      } else {
        toast.error(data.error || "Görsel yüklenemedi.");
      }
    } catch {
      toast.dismiss(uploadToast);
      toast.error("Görsel yüklenirken bağlantı hatası oluştu.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Permanent Delete
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}" görselini kütüphaneden kalıcı olarak silmek istediğinize emin misiniz?`)) {
      try {
        const res = await fetch(`/api/cms/media?id=${id}`, {
          method: "DELETE"
        });
        const data = await res.json();

        if (res.ok && data.success) {
          toast.success("Görsel kalıcı olarak silindi.");
          setItems((prev) => prev.filter((item) => item.id !== id));
        } else {
          toast.error(data.error || "Görsel silinemedi.");
        }
      } catch {
        toast.error("Görsel silinirken sunucu hatası oluştu.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#b45309]" />
          Medya Kütüphanesi
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Sitenizde ve kovan bakım kataloglarında kullanacağınız görselleri yönetin.
        </p>
      </div>

      {/* Creation and Upload Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Drag & Drop Local Upload Box */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#b45309]" />
              Bilgisayardan Görsel Yükle
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Kovan körüğü, elbise ve diğer B2B katalog resimlerini cihazınızdan yükleyin (Maks. 5 MB).
            </p>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />

          <button
            onClick={triggerFileSelect}
            disabled={uploading}
            className="w-full py-8 border-2 border-dashed border-gray-250 hover:border-[#b45309]/50 rounded-2xl flex flex-col items-center justify-center gap-2 group transition bg-gray-50 hover:bg-[#b45309]/5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[#b45309] animate-spin" />
            ) : (
              <FileImage className="w-8 h-8 text-gray-450 group-hover:text-[#b45309] transition" />
            )}
            <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-800">
              {uploading ? "Dosya işleniyor..." : "Dosya Seçin veya Sürükleyin"}
            </span>
          </button>
        </div>

        {/* Right: URL Image Links */}
        <form onSubmit={handleAddLink} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#b45309]" />
              Bağlantı/Link ile Görsel Ekle
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Sitenizde harici barındırılan veya CDN üzerinde hazır olan resimleri ekleyin.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... veya resim adresi"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              className="flex-1 px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 bg-white text-slate-900 transition"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#b45309] hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
        </form>

      </div>

      {/* Grid Library List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
          Kütüphane Görselleri ({items.length} Öğe)
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
            <span className="text-xs font-bold uppercase tracking-wider">Görseller yükleniyor...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold uppercase tracking-wider">Kütüphane boş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs aspect-square flex flex-col justify-between"
              >
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gray-50 border-b border-gray-100">
                  <Image 
                    src={item.url} 
                    alt={item.alt || item.name} 
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                      title="Kalıcı Olarak Sil"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
                <div className="px-3 py-2 bg-white flex flex-col shrink-0">
                  <span className="text-[10px] font-bold text-gray-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-[8px] text-gray-450 uppercase font-bold font-mono tracking-wider mt-0.5 flex justify-between">
                    <span>{item.size}</span>
                    <span className="text-orange-500">{item.tag}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

