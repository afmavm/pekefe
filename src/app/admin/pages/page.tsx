"use client";

import { useState, useEffect } from "react";
import {
  Plus, FileText, Trash2, Edit3, Eye, Search, Clock, X, AlertCircle, Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createBuilderPageAction, deleteBuilderPageAction } from "@/modules/cms/builder/cmsBuilderActions";

interface CmsPage {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
      status === "published" || status === "PUBLISHED" || status === "ACTIVE"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-amber-50 text-amber-700 border-amber-200"
    }`}>
      {status === "published" || status === "PUBLISHED" || status === "ACTIVE" ? "Yayında" : "Taslak"}
    </span>
  );
}

export default function PagesAdminPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create page modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/cms/pages", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPages(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim() || !newPageSlug.trim()) {
      toast.error("Tüm alanları doldurmanız zorunludur.");
      return;
    }
    setCreating(true);
    try {
      const res = await createBuilderPageAction(newPageName, newPageSlug);
      if (res.success && res.page) {
        toast.success(`Sayfa başarıyla oluşturuldu: ${newPageName}`);
        setPages((prev) => [...prev, res.page as any]);
        setShowCreateModal(false);
        setNewPageName("");
        setNewPageSlug("");
      } else {
        toast.error(res.error || "Sayfa oluşturulamadı.");
      }
    } catch {
      toast.error("Sayfa oluşturulurken hata oluştu.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (pageId: string, name: string) => {
    if (name === "Ana Sayfa" || name === "Home") {
      toast.error("Ana Sayfa korumalıdır ve silinemez.");
      return;
    }
    if (confirm(`"${name}" sayfasını silmek istediğinize emin misiniz?`)) {
      try {
        const res = await deleteBuilderPageAction(pageId);
        if (res.success) {
          toast.success("Sayfa başarıyla silindi.");
          setPages((prev) => prev.filter((p) => p.id !== pageId));
        } else {
          toast.error(res.error || "Sayfa silinemedi.");
        }
      } catch {
        toast.error("Sayfa silinirken hata oluştu.");
      }
    }
  };

  const filtered = pages.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#b45309]" />
            Sayfa Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Blog, Hakkımızda, SSS ve özel sayfaları buradan yönetin.
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#b45309] hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Sayfa
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Sayfa adı veya slug ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309]/40 transition bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-5 py-3">Sayfa Adı</th>
              <th className="px-5 py-3">Slug / URL</th>
              <th className="px-5 py-3">Durum</th>
              <th className="px-5 py-3">Son Güncelleme</th>
              <th className="px-5 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-[#b45309] rounded-full animate-spin" />
                    Sayfalar yükleniyor...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  {search ? "Arama sonucu bulunamadı." : "Henüz sayfa eklenmemiş."}
                </td>
              </tr>
            ) : (
              filtered.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50/60 transition group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{page.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      /{page.slug}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={page.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(page.updatedAt).toLocaleDateString("tr-TR")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
                      <Link
                        href={page.slug === "home" ? "/" : (`/${page.slug}` as any)}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-blue-650 hover:bg-blue-50 rounded-lg transition"
                        title="Önizle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link 
                        href={`/admin/site-editor?pageId=${page.id}`}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" 
                        title="Tasarım Stüdyosunda Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      {page.slug !== "home" && (
                        <button 
                          onClick={() => handleDelete(page.id, page.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-amber-50 rounded-lg transition" 
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL DIALOG: SAYFA EKLEME / ADD NEW PAGE ──────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleCreate}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 text-gray-800"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#b45309] flex items-center gap-2">
                <Plus className="w-5 h-5 shrink-0 text-[#b45309]" />
                Yeni Sayfa Ekle
              </h3>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-650 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Sayfa Başlığı</label>
                <input 
                  type="text" 
                  value={newPageName}
                  onChange={(e) => {
                    setNewPageName(e.target.value);
                    // Autofill slug
                    setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="Hakkımızda"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309]/40 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Sayfa Adresi (Slug)</label>
                <div className="flex items-center gap-1 bg-gray-50 px-3.5 py-2.5 border border-gray-200 rounded-xl">
                  <span className="text-sm text-gray-400 font-mono">/tr/</span>
                  <input 
                    type="text" 
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="hakkimizda"
                    required
                    className="flex-1 bg-transparent border-none p-0 text-sm text-gray-800 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-[#b45309] hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#b45309]/10 flex items-center gap-1.5"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Oluştur
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

