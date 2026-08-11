"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, X, Save, Search, Calendar, Tag, Upload } from "lucide-react";
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
  isActive: true,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
        setForm(prev => ({ ...prev, image: data.url }));
        toast.success("Kapak görseli başarıyla yüklendi.");
      } else {
        toast.error(data.error || "Görsel yüklenirken hata oluştu.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    } finally {
      setUploadingImage(false);
      if (e.target.value) e.target.value = "";
    }
  };

  const fetchPosts = () => {
    setLoading(true);
    fetch("/api/blog?admin=true")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPosts(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

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
      isActive: post.isActive,
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
    } catch (err) {
      toast.error("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Yazı silindi.");
        setDeleteConfirm(null);
        fetchPosts();
      } else {
        toast.error("Silme işlemi başarısız.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
  };

  const handleToggleActive = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, isActive: !post.isActive })
      });
      if (res.ok) {
        toast.success(post.isActive ? "Yazı gizlendi." : "Yazı yayınlandı.");
        fetchPosts();
      }
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR");

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-orange-500" /> Blog Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {posts.length} yazı · {posts.filter(p => p.isActive).length} yayında
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Yeni Yazı
        </button>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Yazı ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-xs font-semibold"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-sm">Henüz yazı bulunmuyor</p>
          <button onClick={openCreate} className="mt-4 text-orange-500 font-semibold text-sm hover:underline cursor-pointer">
            İlk yazıyı oluşturun →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-slate-200 hover:border-orange-200 transition-colors p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {post.image && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 relative">
                      <Image src={post.image} alt={post.title} fill sizes="64px" className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-800 text-sm truncate">{post.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${post.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {post.isActive ? "Yayında" : "Gizli"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" /> {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(post.createdAt)}
                      </span>
                      <span className="text-slate-350 truncate max-w-[200px]">/blog/{post.slug}</span>
                    </div>
                    {post.metaDesc && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{post.metaDesc}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(post)}
                    title={post.isActive ? "Gizle" : "Yayınla"}
                    className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 transition text-slate-500 cursor-pointer"
                  >
                    {post.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center hover:bg-blue-100 transition text-blue-600 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(post.id)}
                    className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center hover:bg-red-100 transition text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete confirm */}
              {deleteConfirm === post.id && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-red-700">Bu yazıyı silmek istediğinize emin misiniz?</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                      İptal
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-750 transition cursor-pointer">
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL — Oluştur/Düzenle */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-base font-bold text-slate-900">
                {editingPost ? "Yazıyı Düzenle" : "Yeni Blog Yazısı"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Başlık */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Başlık *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => {
                    const title = e.target.value;
                    setForm(prev => ({ 
                      ...prev, 
                      title,
                      slug: prev.slug || generateSlug(title)
                    }));
                  }}
                  placeholder="Blog yazısının başlığı"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-400 focus:bg-white outline-none text-xs font-semibold"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">URL Slug</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 text-xs font-semibold shrink-0">/blog/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 bg-transparent text-xs font-mono text-slate-750 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Kategori + Görsel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Kategori</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-400 outline-none text-xs font-semibold"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Kapak Görseli</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.image}
                      onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://... veya dosya yükleyin"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-400 focus:bg-white outline-none text-xs font-semibold min-w-0"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => imageFileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingImage ? "..." : "Yükle"}
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

              {/* Meta Açıklama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">SEO Meta Açıklaması</label>
                <textarea
                  value={form.metaDesc}
                  onChange={e => setForm(prev => ({ ...prev, metaDesc: e.target.value }))}
                  rows={2}
                  placeholder="Arama motorlarında görünecek kısa açıklama"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-orange-400 focus:bg-white outline-none text-xs font-semibold resize-none"
                />
              </div>

              {/* İçerik */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">İçerik *</label>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 rounded-full px-2.5 py-0.5">HTML Editör</span>
                </div>
                <RichTextEditor
                  value={form.content}
                  onChange={val => setForm(prev => ({ ...prev, content: val }))}
                  placeholder="Yazı içeriğini buraya girip biçimlendirebilirsiniz. Görsel, tablo, başlık ve bağlantılar ekleyebilirsiniz..."
                />
              </div>

              {/* Durum */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative w-12 h-6 rounded-full transition-all ${form.isActive ? "bg-emerald-500" : "bg-slate-350"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? "left-7" : "left-1"}`} />
                </button>
                <div>
                  <p className="text-xs font-bold text-slate-800">{form.isActive ? "Yayında" : "Taslak"}</p>
                  <p className="text-[11px] text-slate-500">{form.isActive ? "Ziyaretçiler görebilir" : "Sadece adminler görebilir"}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <span className="animate-pulse">Kaydediliyor...</span>
                ) : (
                  <><Save className="w-4 h-4" /> {editingPost ? "Güncelle" : "Yayınla"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

