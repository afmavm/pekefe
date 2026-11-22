"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Eye,
  EyeOff,
  Search,
  Upload,
  X,
  Package,
  Link2,
  Check,
  Loader2,
  CornerDownRight,
} from "lucide-react";
import { slugifyTr, type CategoryRecord } from "@/lib/category-utils";

interface CategoryWithCount extends CategoryRecord {
  productCount?: number;
}

const EMPTY_FORM = {
  id: "",
  name: "",
  parentId: "",
  slug: "",
  image: "",
  shortDesc: "",
  seoDesc: "",
  metaTitle: "",
  metaDescription: "",
  sortOrder: 1,
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Create/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Product assignment modal state
  const [assignCat, setAssignCat] = useState<CategoryWithCount | null>(null);
  const [assignMode, setAssignMode] = useState<"primary" | "additional">("primary");
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories?includeCounts=true", { cache: "no-store" }),
        fetch("/api/products?limit=200", { cache: "no-store" }),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      }
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        const list = Array.isArray(prodJson)
          ? prodJson
          : Array.isArray(prodJson?.products)
          ? prodJson.products
          : [];
        setProducts(list.filter((p: any) => p && !p.isDeleted && !p.isRawMaterial));
      }
    } catch (e) {
      console.error("Kategori yükleme hatası:", e);
      toast.error("Kategoriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mainCategories = useMemo(
    () =>
      categories
        .filter((c) => !c.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr")),
    [categories]
  );

  const getChildren = useCallback(
    (parentId: string) =>
      categories
        .filter((c) => c.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr")),
    [categories]
  );

  const filteredMains = useMemo(() => {
    if (!search.trim()) return mainCategories;
    const q = search.trim().toLowerCase();
    return mainCategories.filter((m) => {
      if (m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q)) return true;
      const kids = getChildren(m.id);
      return kids.some(
        (k) => k.name.toLowerCase().includes(q) || k.slug.toLowerCase().includes(q)
      );
    });
  }, [mainCategories, search, getChildren]);

  const openCreateModal = (parentId = "") => {
    const siblings = parentId ? getChildren(parentId) : mainCategories;
    setForm({
      ...EMPTY_FORM,
      parentId,
      sortOrder: siblings.length + 1,
    });
    setIsEditing(false);
    setSlugTouched(false);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryWithCount) => {
    setForm({
      id: cat.id,
      name: cat.name || "",
      parentId: cat.parentId || "",
      slug: cat.slug || "",
      image: cat.image || "",
      shortDesc: cat.shortDesc || "",
      seoDesc: cat.seoDesc || "",
      metaTitle: cat.metaTitle || "",
      metaDescription: cat.metaDescription || "",
      sortOrder: typeof cat.sortOrder === "number" ? cat.sortOrder : 1,
      isActive: cat.isActive !== false,
    });
    setIsEditing(true);
    setSlugTouched(true);
    setModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: !slugTouched ? slugifyTr(value) : prev.slug,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel yüklenemedi");
      const url = data.url || data.fileUrl || data.path;
      if (url) {
        setForm((prev) => ({ ...prev, image: url }));
        toast.success("Kategori görseli yüklendi.");
      }
    } catch (err: any) {
      toast.error(err.message || "Görsel yüklenirken hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Kategori adı zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: isEditing ? form.id : undefined,
        name: form.name.trim(),
        parentId: form.parentId || null,
        slug: slugifyTr(form.slug || form.name),
        image: form.image.trim() || null,
        shortDesc: form.shortDesc.trim() || null,
        seoDesc: form.seoDesc.trim() || null,
        metaTitle: form.metaTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      };

      const res = await fetch("/api/categories", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi");

      toast.success(isEditing ? "Kategori güncellendi." : "Yeni kategori oluşturuldu.");
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Kategori kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: CategoryWithCount) => {
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
      });
      if (!res.ok) throw new Error("Durum güncellenemedi");
      toast.success(
        `${cat.name} ${!cat.isActive ? "aktif" : "pasif"} duruma alındı.`
      );
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız.");
    }
  };

  const handleMoveOrder = async (
    siblings: CategoryWithCount[],
    index: number,
    direction: -1 | 1
  ) => {
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(swapIdx, 0, moved);

    const items = reordered.map((c, idx) => ({ id: c.id, sortOrder: idx + 1 }));
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", items }),
      });
      if (!res.ok) throw new Error("Sıralama kaydedilemedi");
      toast.success("Kategori sırası güncellendi.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Sıralama hatası.");
    }
  };

  const handleDelete = async (cat: CategoryWithCount) => {
    const hasKids = getChildren(cat.id).length > 0;
    const msg = hasKids
      ? `"${cat.name}" kategorisini ve altındaki tüm alt kategorileri silmek istediğinize emin misiniz?`
      : `"${cat.name}" kategorisini silmek istediğinize emin misiniz?`;
    if (!window.confirm(msg)) return;

    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(cat.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Kategori silinemedi");
      toast.success(`"${cat.name}" silindi.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Silme hatası.");
    }
  };

  const openAssignModal = (cat: CategoryWithCount) => {
    setAssignCat(cat);
    setAssignMode("primary");
    setAssignSearch("");
    setSelectedProductIds([]);
  };

  const handleAssignProducts = async () => {
    if (!assignCat || selectedProductIds.length === 0) {
      toast.error("Lütfen en az bir ürün seçin.");
      return;
    }
    setAssignSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignProducts",
          categoryId: assignCat.id,
          productIds: selectedProductIds,
          mode: assignMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ürünler bağlanamadı");
      toast.success(`${data.updatedCount || selectedProductIds.length} ürün "${assignCat.name}" kategorisine bağlandı.`);
      setAssignCat(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Ürün bağlama hatası.");
    } finally {
      setAssignSaving(false);
    }
  };

  const filteredProductsForAssign = useMemo(() => {
    if (!assignSearch.trim()) return products;
    const q = assignSearch.trim().toLowerCase();
    return products.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.sku || "").toLowerCase().includes(q) ||
        String(p.category || "").toLowerCase().includes(q)
    );
  }, [products, assignSearch]);

  const getStoreUrl = (cat: CategoryWithCount) => {
    if (!cat.parentId) return `/${cat.slug}`;
    const parent = categories.find((c) => c.id === cat.parentId);
    return parent ? `/${parent.slug}/${cat.slug}` : `/${cat.slug}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Üst Başlık ve Aksiyon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#5D1924]/10 text-[#5D1924] flex items-center justify-center shrink-0">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Kategori ve SEO Yönetimi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ana kategori, alt kategori, SEO meta verileri, sıralama ve ürün eşleştirmelerini yönetin.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal("")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5D1924] text-white text-sm font-semibold hover:bg-[#4a131c] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Yeni Kategori Ekle
        </button>
      </div>

      {/* Özet Kartlar ve Arama */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Ana Kategoriler</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{mainCategories.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Alt Kategoriler</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {categories.filter((c) => !!c.parentId).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Aktif Kategoriler</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {categories.filter((c) => c.isActive !== false).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kategori veya slug ara..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-[#5D1924]"
            />
          </div>
        </div>
      </div>

      {/* Kategori Ağacı Listesi */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Kategoriler yükleniyor...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMains.map((main, mIdx) => {
            const subs = getChildren(main.id);
            return (
              <div
                key={main.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
              >
                {/* Ana Kategori Satırı */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {main.image ? (
                      <img
                        src={main.image}
                        alt={main.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <FolderTree className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {main.name}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            main.isActive !== false
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {main.isActive !== false ? "Aktif" : "Pasif"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          {main.productCount ?? 0} ürün
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          /{main.slug}
                        </code>
                        <span>Sıra: {main.sortOrder}</span>
                        {main.metaTitle && (
                          <span className="truncate max-w-md">SEO: {main.metaTitle}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(mainCategories, mIdx, -1)}
                      disabled={mIdx === 0}
                      title="Yukarı Taşı"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(mainCategories, mIdx, 1)}
                      disabled={mIdx === mainCategories.length - 1}
                      title="Aşağı Taşı"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateModal(main.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Alt Kategori
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssignModal(main)}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Ürün Bağla
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(main)}
                      title={main.isActive !== false ? "Pasif Yap" : "Aktif Yap"}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {main.isActive !== false ? (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <Link
                      href={getStoreUrl(main)}
                      target="_blank"
                      title="Mağazada Görüntüle"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEditModal(main)}
                      title="Düzenle"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-blue-600 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(main)}
                      title="Sil"
                      className="p-2 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Alt Kategoriler */}
                {subs.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 divide-y divide-slate-100 dark:divide-slate-800">
                    {subs.map((sub, sIdx) => (
                      <div
                        key={sub.id}
                        className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {sub.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  sub.isActive !== false
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {sub.isActive !== false ? "Aktif" : "Pasif"}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-700">
                                {sub.productCount ?? 0} ürün
                              </span>
                            </div>
                            <code className="text-[11px] text-slate-500">
                              /{main.slug}/{sub.slug}
                            </code>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(subs, sIdx, -1)}
                            disabled={sIdx === 0}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(subs, sIdx, 1)}
                            disabled={sIdx === subs.length - 1}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssignModal(sub)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-amber-200 bg-white text-amber-800 text-xs font-semibold hover:bg-amber-50 cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Ürün Bağla
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(sub)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                          >
                            {sub.isActive !== false ? (
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                          <Link
                            href={`/${main.slug}/${sub.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Kategori Oluştur / Düzenle Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? "Kategoriyi Düzenle" : "Yeni Kategori Oluştur"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Örn: Pestil Çeşitleri"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Üst Kategori
                  </label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    <option value="">Ana Kategori (Üst Kategori Yok)</option>
                    {mainCategories
                      .filter((m) => m.id !== form.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    SEO URL / Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((p) => ({ ...p, slug: slugifyTr(e.target.value) }));
                    }}
                    placeholder="ornek-kategori-slug"
                    className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Önizleme: <code>https://pekefe.com/{form.slug || "..."}</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Kategori Görseli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Kategori Görseli
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {form.image && (
                    <img
                      src={form.image}
                      alt="Önizleme"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                    placeholder="/uploads/... veya görsel yükleyin"
                    className="flex-1 w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold cursor-pointer shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Görsel Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Kısa Açıklama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Kısa Açıklama (Kategori Banner Altı)
                </label>
                <textarea
                  rows={2}
                  value={form.shortDesc}
                  onChange={(e) => setForm((p) => ({ ...p, shortDesc: e.target.value }))}
                  placeholder="Kategori sayfasının üst bölümünde görünecek özgün kısa tanıtım..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              {/* Uzun SEO Açıklaması */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Uzun SEO Açıklaması (Sayfa Altı Editoryal Metin)
                </label>
                <textarea
                  rows={4}
                  value={form.seoDesc}
                  onChange={(e) => setForm((p) => ({ ...p, seoDesc: e.target.value }))}
                  placeholder="Kategoriye özel özgün SEO içerik metni..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>

              {/* SEO Meta Alanları */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5D1924]">
                  Google &amp; SEO Meta Ayarları
                </p>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Meta Title
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {form.metaTitle.length} / 65 karakter
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                    placeholder="Örn: İspir Dut Pestili Çeşitleri ve Fiyatları | PEKEFE"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Meta Description
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {form.metaDescription.length} / 160 karakter
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={form.metaDescription}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, metaDescription: e.target.value }))
                    }
                    placeholder="Arama sonuçlarında görünecek özgün kategori açıklaması..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Aktiflik Durumu */}
              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#5D1924]"
                  />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Kategori Aktif (Mağazada ve Sitemap&apos;te Yayınla)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5D1924] text-white text-sm font-semibold hover:bg-[#4a131c] disabled:opacity-50 cursor-pointer"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? "Değişiklikleri Kaydet" : "Kategoriyi Oluştur"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ürün Bağlama / Taşıma Modalı */}
      {assignCat && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  &ldquo;{assignCat.name}&rdquo; — Ürün Bağla / Taşı
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ürünlerin fiyat, stok, açıklama ve görsellerine dokunmadan kategori ataması yapın.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignCat(null)}
                className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAssignMode("primary")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    assignMode === "primary"
                      ? "bg-[#5D1924] text-white border-[#5D1924]"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  Ana Kategori Olarak Taşı
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode("additional")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    assignMode === "additional"
                      ? "bg-[#5D1924] text-white border-[#5D1924]"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  Ek İlgili Kategori Olarak Bağla (Çoklu Kategori)
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Ürün adı, SKU veya mevcut kategori ara..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
                {filteredProductsForAssign.map((p) => {
                  const checked = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${
                        checked ? "bg-amber-50/60" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds((prev) => [...prev, p.id]);
                          } else {
                            setSelectedProductIds((prev) =>
                              prev.filter((id) => id !== p.id)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded text-[#5D1924]"
                      />
                      <Package className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          SKU: {p.sku} · Mevcut: {p.category}
                          {p.subCategory ? ` / ${p.subCategory}` : ""}
                        </p>
                      </div>
                      {checked && <Check className="w-4 h-4 text-[#5D1924] shrink-0" />}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {selectedProductIds.length} ürün seçildi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignCat(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleAssignProducts}
                  disabled={assignSaving || selectedProductIds.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D1924] text-white text-sm font-semibold hover:bg-[#4a131c] disabled:opacity-50 cursor-pointer"
                >
                  {assignSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Seçili Ürünleri Bağla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
