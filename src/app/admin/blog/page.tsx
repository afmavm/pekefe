"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, X, Save, Search, 
  Calendar, Tag, Upload, Star, Clock, Filter, ImageIcon, Check, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  image?: string;
  metaDesc?: string;
  isFeatured?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["Genel", "Haberler", "Tarifler", "Sağlık", "Üretim", "Kampanya"];

const emptyPost = {
  title: "",
  slug: "",
  content: "",
  category: "Genel",
  image: "",
  metaDesc: "",
  isFeatured: false,
  isActive: true,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Media Library Picker Modal
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<any[]>([]);

  const fetchPosts = () => {
    setLoading(true);
    fetch("/api/blog?admin=true", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/cms/media", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setMediaItems(data);
    } catch {
      console.error("Error fetching media for blog picker");
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchMedia();
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Calculate Reading Time
  const calculateReadingTime = (text: string) => {
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    const words = cleanText.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes > 0 ? `${minutes} dk okuma` : "1 dk okuma";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, image: data.url }));
        toast.success("Kapak görseli yüklendi.");
      } else {
        toast.error(data.error || "Görsel yüklenemedi.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setUploadingImage(false);
      if (e.target.value) e.target.value = "";
    }
  };

  const selectImageFromPicker = (url: string) => {
    setForm((prev) => ({ ...prev, image: url }));
    setIsMediaPickerOpen(false);
    toast.success("Görsel medya deposundan seçildi.");
  };

  const openCreate = () => {
    setEditingPost(null);
    setForm(emptyPost);
    setModalOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      category: post.category,
      image: post.image || "",
      metaDesc: post.metaDesc || "",
      isFeatured: Boolean(post.isFeatured),
      isActive: Boolean(post.isActive),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Başlık ve içerik alanları zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const url = editingPost ? `/api/blog/${editingPost.id}` : "/api/blog";
      const method = editingPost ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: form.slug || generateSlug(form.title) })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingPost ? "Yazı güncellendi." : "Yazı oluşturuldu.");
        setModalOpen(false);
        fetchPosts();
      } else {
        toast.error(data.error || "Bir hata oluştu.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Yazı başarıyla silindi.");
      } else {
        toast.error("Silme işlemi başarısız.");
        fetchPosts();
      }
    } catch {
      toast.error("Bağlantı hatası.");
      fetchPosts();
    }
  };

  const handleToggleActive = async (post: BlogPost) => {
    const nextState = !post.isActive;
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isActive: nextState } : p))
    );
    toast.success(nextState ? "Yazı yayınlandı." : "Yazı gizlendi (taslak yapıldı).");

    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, isActive: nextState })
      });
      if (!res.ok) fetchPosts();
    } catch {
      toast.error("Hata oluştu.");
      fetchPosts();
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    const nextFeatured = !post.isFeatured;
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isFeatured: nextFeatured } : p))
    );
    toast.success(nextFeatured ? "Yazı öne çıkarıldı." : "Öne çıkarma kaldırıldı.");

    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, isFeatured: nextFeatured })
      });
      if (!res.ok) fetchPosts();
    } catch {
      toast.error("Hata oluştu.");
      fetchPosts();
    }
  };

  const filtered = posts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" ? true : p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR");

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#b45309]" /> Blog & Makale Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Toplam {posts.length} yazı · {posts.filter(p => p.isActive).length} yayında · {posts.filter(p => p.isFeatured).length} öne çıkarılan
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-3 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-amber-900/10"
        >
          <Plus className="w-4 h-4" /> Yeni Yazı Oluştur
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Yazı veya başlık ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b45309] text-xs font-semibold"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === "all" ? "bg-[#b45309] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tümü ({posts.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = posts.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat ? "bg-[#b45309] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Blog Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-bold text-sm">Aranan kriterlere uygun blog yazısı bulunamadı.</p>
          <button onClick={openCreate} className="text-[#b45309] font-bold text-xs hover:underline cursor-pointer">
            + Yeni bir yazı oluşturun
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 transition p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {post.image ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 relative">
                      <Image src={post.image} alt={post.title} fill sizes="80px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl shrink-0 bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base tracking-tight leading-snug">{post.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        post.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {post.isActive ? "Yayında" : "Taslak"}
                      </span>
                      {post.isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Öne Çıkan
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold flex-wrap">
                      <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3 text-amber-600" /> {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(post.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {calculateReadingTime(post.content)}
                      </span>
                      <span className="text-slate-400 font-mono">/blog/{post.slug}</span>
                    </div>

                    {post.metaDesc && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">{post.metaDesc}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(post)}
                    title={post.isFeatured ? "Öne Çıkarmayı Kaldır" : "Öne Çıkar"}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition border ${
                      post.isFeatured ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-600"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${post.isFeatured ? "fill-amber-600" : ""}`} />
                  </button>

                  <button
                    onClick={() => handleToggleActive(post)}
                    title={post.isActive ? "Gizle" : "Yayınla"}
                    className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition text-slate-600 cursor-pointer"
                  >
                    {post.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                  </button>
                  
                  <button
                    onClick={() => openEdit(post)}
                    className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center hover:bg-blue-100 transition text-blue-600 cursor-pointer"
                    title="Düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirm(post.id)}
                    className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center hover:bg-red-100 transition text-red-700 cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete confirm inline banner */}
              {deleteConfirm === post.id && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-red-700">Bu blog yazısını kalıcı olarak silmek istediğinizden emin misiniz?</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                      İptal
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition cursor-pointer">
                      Kalıcı Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL — Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#b45309]" />
                {editingPost ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı Oluştur"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Makale / Yazı Başlığı *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({ 
                      ...prev, 
                      title,
                      slug: prev.slug || generateSlug(title)
                    }));
                  }}
                  placeholder="örn: İspir Ham Dut Pekmezinin Faydaları ve Üretim Sırları"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#b45309] focus:bg-white outline-none text-xs font-semibold"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">URL Bağlantısı (Slug)</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 text-xs font-mono shrink-0">/blog/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 bg-transparent text-xs font-mono text-slate-800 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Category & Cover Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#b45309] outline-none text-xs font-semibold"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Kapak Görseli</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.image}
                      onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                      placeholder="https://... veya medya seçin"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#b45309] focus:bg-white outline-none text-xs font-semibold min-w-0"
                    />

                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition shrink-0 flex items-center gap-1"
                      title="Medya Kütüphanesinden Seç"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-700" />
                      <span className="hidden sm:inline">Kütüphaneden</span>
                    </button>

                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => imageFileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadingImage ? "..." : "Yükle"}</span>
                    </button>
                    <input
                      type="file"
                      ref={imageFileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">SEO Meta Açıklaması</label>
                <textarea
                  value={form.metaDesc}
                  onChange={(e) => setForm((prev) => ({ ...prev, metaDesc: e.target.value }))}
                  rows={2}
                  placeholder="Google arama sonuçlarında görünecek 120-160 karakterlik özet..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#b45309] focus:bg-white outline-none text-xs font-semibold resize-none"
                />
              </div>

              {/* Rich Content Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Makale İçeriği *</label>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">Zengin Metin Editörü</span>
                </div>
                <RichTextEditor
                  value={form.content}
                  onChange={(val) => setForm((prev) => ({ ...prev, content: val }))}
                  placeholder="Blog içeriğini buraya girin. Görseller, başlıklar, listeler ve biçimlendirmeler kullanabilirsiniz..."
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative w-12 h-6.5 rounded-full transition-all ${form.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <div className={`absolute top-0.5 w-5.5 h-5.5 bg-white rounded-full shadow transition-all ${form.isActive ? "left-6" : "left-0.5"}`} />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{form.isActive ? "Yayın Durumu: AÇIK" : "Yayın Durumu: TASLAK"}</p>
                    <p className="text-[11px] text-slate-500">{form.isActive ? "Ziyaretçiler görebilir" : "Taslak olarak kalır"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))}
                    className={`relative w-12 h-6.5 rounded-full transition-all ${form.isFeatured ? "bg-amber-600" : "bg-slate-300"}`}
                  >
                    <div className={`absolute top-0.5 w-5.5 h-5.5 bg-white rounded-full shadow transition-all ${form.isFeatured ? "left-6" : "left-0.5"}`} />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-amber-900">{form.isFeatured ? "Öne Çıkarılan Makale" : "Normal Yayın"}</p>
                    <p className="text-[11px] text-amber-700">Ana sayfada manşette gösterilir</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white rounded-b-3xl shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-md"
              >
                {saving ? (
                  <span className="animate-pulse">Kaydediliyor...</span>
                ) : (
                  <><Save className="w-4 h-4" /> {editingPost ? "Yazıyı Güncelle" : "Yayınla"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA PICKER MODAL */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsMediaPickerOpen(false)} />
          
          <div className="bg-white relative z-10 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#b45309]" />
                Medya Kütüphanesinden Kapak Görseli Seç
              </h3>
              <button onClick={() => setIsMediaPickerOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
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
                      className="group cursor-pointer bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-[#b45309] transition flex flex-col h-40 shadow-xs hover:shadow-md"
                    >
                      <div className="relative flex-grow bg-slate-100 overflow-hidden">
                        <Image src={item.url} alt={item.name || "Media"} fill sizes="200px" className="object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                      <div className="p-2 bg-white border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-800 truncate">{item.name || "Görsel"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">Kütüphanede görsel bulunamadı.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsMediaPickerOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
