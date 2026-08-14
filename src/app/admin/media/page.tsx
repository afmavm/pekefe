"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Image as ImageIcon, Plus, Trash2, Upload, Link2, Loader2, Info, FileImage, 
  Sparkles, Search, Copy, Check, Eye, X, Filter, Grid, List, CheckSquare, Square, Download
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<"all" | "local" | "url">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection & Detail Modal
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Upload File Logic (Used for drag-and-drop & file picker)
  const uploadSingleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen sadece geçerli resim dosyası seçin (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5 MB limitini aşamaz.");
      return;
    }

    setUploading(true);
    const uploadToast = toast.loading(`${file.name} sunucuya yükleniyor...`);

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
        toast.success("Resim başarıyla kütüphaneye yüklendi!");
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

  // Drag and Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadSingleFile(file);
    }
  };

  // Copy Link to Clipboard
  const copyToClipboard = (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Görsel bağlantısı panoya kopyalandı!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Permanent Single Delete
  const handleDelete = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`"${name}" görselini kütüphaneden kalıcı olarak silmek istediğinize emin misiniz?`)) {
      try {
        const res = await fetch(`/api/cms/media?id=${id}`, { method: "DELETE" });
        const data = await res.json();

        if (res.ok && data.success) {
          toast.success("Görsel kalıcı olarak silindi.");
          setItems((prev) => prev.filter((item) => item.id !== id));
          setSelectedIds((prev) => prev.filter((i) => i !== id));
          if (previewItem?.id === id) setPreviewItem(null);
        } else {
          toast.error(data.error || "Görsel silinemedi.");
        }
      } catch {
        toast.error("Görsel silinirken sunucu hatası oluştu.");
      }
    }
  };

  // Bulk Selection & Delete
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Seçtiğiniz ${selectedIds.length} görseli kalıcı olarak silmek istediğinize emin misiniz?`)) {
      const deleteToast = toast.loading("Görseller siliniyor...");
      try {
        let deletedCount = 0;
        for (const id of selectedIds) {
          const res = await fetch(`/api/cms/media?id=${id}`, { method: "DELETE" });
          if (res.ok) deletedCount++;
        }
        toast.dismiss(deleteToast);
        toast.success(`${deletedCount} görsel kütüphaneden temizlendi.`);
        setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
      } catch {
        toast.dismiss(deleteToast);
        toast.error("Toplu silme esnasında hata oluştu.");
      }
    }
  };

  // Filtered List
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === "all" ? true :
                       filterTag === "local" ? item.tag === "LOCAL" :
                       item.tag === "URL";
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#b45309]" />
            Medya Kütüphanesi & Dosya Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ürün katalogları, afişler ve içerik görsellerini yükleyin, arayın ve yönetin.
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{items.length} Dosya</span>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Seçilenleri Sil ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Creation and Upload Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Drag & Drop Local Upload Box */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white rounded-2xl border transition p-6 flex flex-col justify-between space-y-4 shadow-sm ${
            isDragging ? "border-[#b45309] bg-amber-50/40 ring-4 ring-[#b45309]/10" : "border-gray-100"
          }`}
        >
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#b45309]" />
              Bilgisayardan Dosya Yükle
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              PNG, JPG, WEBP formatındaki ürün ve afiş resimlerinizi bırakın (Maks. 5 MB).
            </p>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadSingleFile(file);
            }} 
            accept="image/*" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-7 border-2 border-dashed border-gray-200 hover:border-[#b45309]/60 rounded-2xl flex flex-col items-center justify-center gap-2 group transition bg-gray-50/70 hover:bg-[#b45309]/5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[#b45309] animate-spin" />
            ) : (
              <FileImage className="w-8 h-8 text-gray-400 group-hover:text-[#b45309] transition" />
            )}
            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">
              {uploading ? "Yükleniyor..." : isDragging ? "Dosyayı Bırakın!" : "Görsel Seçin veya Buraya Sürükleyin"}
            </span>
          </button>
        </div>

        {/* URL Image Links Form */}
        <form onSubmit={handleAddLink} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#b45309]" />
              Harici Bağlantı / CDN Linki Ekle
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              İnternet üzerinde hazır barındırılan resim adresini kütüphaneye kaydedin.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... veya görsel web adresi"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309] bg-white text-slate-900 transition"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition shadow-sm uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Bağlantıyı Kütüphaneye Ekle
            </button>
          </div>
        </form>
      </div>

      {/* Toolbar: Search, Filters & View Switcher */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Görsel veya dosya adı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 bg-white text-slate-900"
          />
        </div>

        {/* Filter Pills & Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Tag Filter */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
            <button
              onClick={() => setFilterTag("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterTag === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilterTag("local")}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterTag === "local" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sunucu Yüklemeleri
            </button>
            <button
              onClick={() => setFilterTag("url")}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterTag === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Harici Linkler
            </button>
          </div>

          {/* Select All Checkbox */}
          {filteredItems.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 px-2 py-1 rounded-lg border border-gray-200 transition"
              title="Tümünü Seç / Seçimi Kaldır"
            >
              {selectedIds.length === filteredItems.length ? (
                <CheckSquare className="w-4 h-4 text-[#b45309]" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span className="hidden sm:inline">Tümünü Seç</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-lg transition ${
                viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-900"
              }`}
              title="Kare Görünüm"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-lg transition ${
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-900"
              }`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid / List Library Rendering */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
            <span className="text-xs font-bold uppercase tracking-wider">Kütüphane Taranıyor...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold text-gray-600">Aranan kriterlere uygun görsel bulunamadı.</p>
            <p className="text-xs text-gray-400 mt-1">Arama terimini veya filtreleri sıfırlamayı deneyin.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  onClick={() => setPreviewItem(item)}
                  className={`group relative bg-white border rounded-2xl overflow-hidden transition duration-200 cursor-pointer aspect-square flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isSelected ? "border-[#b45309] ring-2 ring-[#b45309]/20" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Select Checkbox */}
                  <div 
                    onClick={(e) => toggleSelect(item.id, e)}
                    className="absolute top-2 left-2 z-20 w-6 h-6 rounded-lg bg-white/90 backdrop-blur-md border border-gray-200 flex items-center justify-center shadow transition hover:scale-105"
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#b45309]" />
                    ) : (
                      <div className="w-3 h-3 rounded-sm border border-gray-300" />
                    )}
                  </div>

                  {/* Image Container */}
                  <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gray-50">
                    <Image 
                      src={item.url} 
                      alt={item.alt || item.name} 
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover transition duration-500 group-hover:scale-105" 
                    />
                    
                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => copyToClipboard(item.url, item.id, e)}
                        className="p-2 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition shadow-md"
                        title="Bağlantıyı Kopyala"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, item.name, e)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-md"
                        title="Kalıcı Olarak Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-2.5 bg-white border-t border-gray-100 flex flex-col shrink-0">
                    <span className="text-[11px] font-bold text-gray-800 truncate" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 mt-0.5">
                      <span>{item.size}</span>
                      <span className={`px-1.5 py-0.5 rounded ${item.tag === "LOCAL" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                        {item.tag}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => setPreviewItem(item)}
                  className={`p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50 transition cursor-pointer ${
                    isSelected ? "bg-amber-50/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div onClick={(e) => toggleSelect(item.id, e)} className="cursor-pointer">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-[#b45309]" /> : <Square className="w-4 h-4 text-gray-300" />}
                    </div>

                    <div className="w-12 h-12 relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                      <Image src={item.url} alt={item.name} fill sizes="50px" className="object-cover" />
                    </div>

                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-900 truncate max-w-xs sm:max-w-md">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{item.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-bold text-gray-500 hidden md:inline">{item.size}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.tag === "LOCAL" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                      {item.tag}
                    </span>

                    <button
                      onClick={(e) => copyToClipboard(item.url, item.id, e)}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
                      title="Bağlantıyı Kopyala"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, item.name, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Detail Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewItem(null)} />

          <div className="bg-white relative z-10 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="overflow-hidden pr-4">
                <h3 className="font-extrabold text-base text-gray-900 truncate">{previewItem.name}</h3>
                <p className="text-xs text-gray-400">Görsel Detay & Önizleme</p>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-red-100 hover:text-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Image Preview */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="relative w-full h-80 bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
                <Image src={previewItem.url} alt={previewItem.name} fill sizes="800px" className="object-contain" />
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block font-bold text-[10px] uppercase">Dosya Boyutu</span>
                    <span className="font-bold text-gray-800">{previewItem.size}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold text-[10px] uppercase">Depolama Türü</span>
                    <span className="font-bold text-gray-800">{previewItem.tag === "LOCAL" ? "Sunucu Yüklemesi" : "Harici Bağlantı"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold text-[10px] uppercase">Kayıt Tarihi</span>
                    <span className="font-bold text-gray-800">{previewItem.createdAt ? new Date(previewItem.createdAt).toLocaleDateString("tr-TR") : "Bilinmiyor"}</span>
                  </div>
                </div>

                {/* Copy URL Input Box */}
                <div>
                  <span className="text-gray-400 block font-bold text-[10px] uppercase mb-1">Görsel URL Adresi</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={previewItem.url}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-mono text-gray-800 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(previewItem.url, previewItem.id)}
                      className="px-4 py-2 bg-[#b45309] hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      {copiedId === previewItem.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === previewItem.id ? "Kopyalandı!" : "Kopyala"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDelete(previewItem.id, previewItem.name)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                Görseli Kalıcı Sil
              </button>
              <button 
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
