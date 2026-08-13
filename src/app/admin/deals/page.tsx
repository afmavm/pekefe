"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useProduct } from "@/context/ProductContext";
import { useCMS } from "@/context/CMSContext";
import {
  Tag,
  Search,
  Star,
  CheckCircle2,
  XCircle,
  Sparkles,
  Save,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

// Premium dynamic product image with initials/gradient fallback on error
function ProductImage({ src, name, size = 48 }: { src: string; name: string; size?: number }) {
  const [error, setError] = useState(false);

  const gradient = useMemo(() => {
    const gradients = [
      "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-500/20",
      "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20",
      "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-500/20",
      "from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-500/20",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return gradients[sum % gradients.length];
  }, [name]);

  const initials = useMemo(() => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].slice(0, 1) + words[1].slice(0, 1)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  if (error || !src) {
    return (
      <div 
        className={`rounded-2xl border flex items-center justify-center font-black tracking-wider text-xs shrink-0 bg-gradient-to-br ${gradient}`}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl bg-white border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center shadow-sm relative group"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        onError={() => setError(true)}
        className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}

export default function AdminDealsPage() {
  const { products } = useProduct();
  const { cmsData, updateCMSData } = useCMS();

  const [dealSectionActive, setDealSectionActive] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize from CMS
  useEffect(() => {
    setDealSectionActive(!!cmsData.dealSectionActive);
    try {
      const ids = JSON.parse(cmsData.dealProductIds || "[]");
      setSelectedIds(Array.isArray(ids) ? ids : []);
    } catch {
      setSelectedIds([]);
    }
  }, [cmsData.dealSectionActive, cmsData.dealProductIds]);

  const storeProducts = useMemo(
    () => products.filter((p) => !p.isRawMaterial),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return storeProducts;
    const q = search.toLowerCase();
    return storeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [storeProducts, search]);

  const selectedProducts = useMemo(
    () => storeProducts.filter((p) => selectedIds.includes(String(p.id))),
    [storeProducts, selectedIds]
  );

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setIsDirty(true);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const idsToAdd = filteredProducts.map((p) => String(p.id));
    setSelectedIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    setIsDirty(true);
  };

  const clearAllSelected = () => {
    setSelectedIds([]);
    setIsDirty(true);
  };

  const toggleSection = () => {
    setDealSectionActive((v) => !v);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCMSData({
        dealSectionActive,
        dealProductIds: JSON.stringify(selectedIds),
      });
      setIsDirty(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pekefe_cms_changed"));
        window.dispatchEvent(new CustomEvent("pekefe_products_updated"));
      }
      toast.success("Fırsat ürünleri ve bölüm ayarları başarıyla kaydedildi!");
    } catch (e: any) {
      toast.error(e?.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDealSectionActive(!!cmsData.dealSectionActive);
    try {
      const ids = JSON.parse(cmsData.dealProductIds || "[]");
      setSelectedIds(Array.isArray(ids) ? ids : []);
    } catch {
      setSelectedIds([]);
    }
    setIsDirty(false);
  };

  const safeImg = (src?: string | null) => {
    if (!src) return "";
    if (src.startsWith("http") || src.startsWith("/") || src.startsWith("data:")) return src;
    return "/" + src;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-7xl mx-auto transition-colors duration-200 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Fırsat Ürünleri Yönetimi
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              Ürünler sayfasında gösterilecek vitrin modülünü aktif edin ve sergilenecek ürünleri seçin
            </p>
          </div>
        </div>
      </div>

      {/* Section Toggle Card Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-slate-300">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dealSectionActive
                ? "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                : "bg-slate-100 border border-slate-200"
            }`}
          >
            <Sparkles
              className={`w-5.5 h-5.5 transition-colors duration-300 ${
                dealSectionActive ? "text-amber-600" : "text-slate-400"
              }`}
            />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">
              Fırsat Bölümü Durumu
            </p>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              {dealSectionActive
                ? "Ürünler sayfasında vitrin bölümü aktif olarak gösteriliyor"
                : "Fırsatlar bölümü şu an gizli — aktif etmek için sağdaki butona tıklayın"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end md:self-auto">
          {dealSectionActive && selectedIds.length === 0 && (
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5 px-3 py-1 bg-amber-500/5 border border-amber-500/10 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5" />
              Ürün seçilmedi
            </span>
          )}
          <button
            onClick={toggleSection}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 outline-none p-1 shrink-0 ${
              dealSectionActive
                ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                : "bg-slate-200"
            }`}
            aria-label="Fırsat bölümünü aç/kapat"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 transform ${
                dealSectionActive ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left: Product Picker Grid */}
        <div className="xl:col-span-2 bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Ürün Seçimi
              </p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-slate-500 font-medium">
                  Aşağıdaki listeden fırsat ürünlerini işaretleyin ({selectedIds.length} seçili)
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors border border-amber-200/60 cursor-pointer"
                  >
                    Hepsini Seç
                  </button>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllSelected}
                      className="text-[11px] font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                    >
                      Seçimi Temizle
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ürün adı, kategori veya SKU ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all duration-200 shadow-inner"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[580px] divide-y divide-slate-100 pr-1">
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">
                Arama kriterlerine uygun ürün bulunamadı.
              </div>
            )}
            {filteredProducts.map((p) => {
              const isSelected = selectedIds.includes(String(p.id));
              return (
                <div
                  key={p.id}
                  onClick={() => toggleProduct(String(p.id))}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-200 select-none border-l-4 ${
                    isSelected
                      ? "bg-amber-500/5 border-l-amber-500 border-b border-slate-50"
                      : "hover:bg-slate-50/50 border-l-transparent"
                  }`}
                >
                  {/* Custom Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isSelected
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 border-transparent shadow-[0_0_8px_rgba(245,158,11,0.25)] scale-105"
                        : "border-slate-300 bg-white hover:border-amber-500/50"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3.5 h-3.5 text-white stroke-[3.5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Dynamic Product Image Component */}
                  <ProductImage
                    src={safeImg(p.image)}
                    name={p.name}
                    size={48}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate hover:text-amber-500 transition-colors">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {p.sku}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-amber-600">
                      ₺{p.price.toLocaleString("tr-TR")}
                    </p>
                    {(p as any).isDeal && (
                      <span className="inline-flex items-center text-[9px] font-black text-amber-600 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5">
                        Fırsat
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Products + Stats + Action Card */}
        <div className="space-y-6">
          {/* Selected List Panel */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Seçili Fırsat Ürünleri
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  ({selectedIds.length} ürün seçildi)
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {selectedProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <Tag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">
                    Sol taraftaki listeden ürün seçin
                  </p>
                </div>
              ) : (
                selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition-all duration-200 group">
                    <ProductImage
                      src={safeImg(p.image)}
                      name={p.name}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-450 mt-0.5">
                        {p.sku}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleProduct(String(p.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                      title="Kaldır"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Premium Stats Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              Özet Bilgiler
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-650 font-semibold flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  Fırsat Ürünleri
                </span>
                <span className="font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl text-xs">
                  {selectedIds.length} Adet
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-650 font-semibold flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  Katalog Toplam
                </span>
                <span className="font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl text-xs">
                  {storeProducts.length} Ürün
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-650 font-semibold flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${dealSectionActive ? "bg-emerald-500/10" : "bg-slate-100"}`}>
                    {dealSectionActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  Bölüm Durumu
                </span>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-xl ${
                    dealSectionActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {dealSectionActive ? "Aktif" : "Pasif"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button Controls */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
                isDirty && !saving
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 hover:-translate-y-[1.5px] active:translate-y-0 cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4.5 h-4.5" />
              )}
              {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
            {isDirty && (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Değişiklikleri Geri Al
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

