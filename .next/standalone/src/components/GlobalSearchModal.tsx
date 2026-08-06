"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Search, X, ShoppingBag, ArrowRight, Sparkles, Tag, 
  Layers, Package, Check, ChevronRight, Zap, Flame, Clock
} from "lucide-react";
import { getProducts, fetchLiveProducts } from "@/utils/productsStorage";
import { addToCart } from "@/utils/cartStorage";
import { toast } from "sonner";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_TAGS = [
  "Dut Pekmezi",
  "Cevizli Köme",
  "Sade Pestil",
  "Karadut Özü",
  "Muska Tatlısı",
  "Sarma Tatlısı"
];

const CATEGORY_LINKS = [
  { name: "Geleneksel Pekmezler", slug: "pekmez", icon: "🍯" },
  { name: "Pestil Çeşitleri", slug: "pestil", icon: "🌾" },
  { name: "Cevizli Kömeler", slug: "kome", icon: "🌰" },
  { name: "Gurme Tatlılar", slug: "tatli", icon: "✨" },
];

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load and auto-index products live from local storage and API
  const loadIndex = () => {
    fetchLiveProducts().then((live) => {
      if (live && live.length > 0) setProducts(live);
      else setProducts(getProducts());
    });
  };

  useEffect(() => {
    loadIndex();

    // Listen to admin updates in real-time
    const handleSync = () => {
      loadIndex();
    };

    window.addEventListener("pekefe_products_changed", handleSync);
    window.addEventListener("pekefe_search_index_updated", handleSync);
    return () => {
      window.removeEventListener("pekefe_products_changed", handleSync);
      window.removeEventListener("pekefe_search_index_updated", handleSync);
    };
  }, []);

  // Keyboard shortcut listener (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          window.dispatchEvent(new CustomEvent("open_global_search"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Live Auto-Index Search Engine
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return products.filter((p) => {
      if (!p) return false;
      const nameMatch = (p.name || "").toLowerCase().includes(q);
      const categoryMatch = (p.category || "").toLowerCase().includes(q) || (p.categoryDisplay || "").toLowerCase().includes(q);
      const descMatch = (p.desc || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      const skuMatch = (p.sku || "").toLowerCase().includes(q);
      const metaMatch = (p.meta || "").toLowerCase().includes(q);
      return nameMatch || categoryMatch || descMatch || skuMatch || metaMatch;
    });
  }, [query, products]);

  // Category Matches
  const categoryResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return CATEGORY_LINKS.filter(c => c.name.toLowerCase().includes(q) || c.slug.includes(q));
  }, [query]);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variant: product.meta || product.unit || "Standart",
      quantity: 1
    });
    toast.success(`${product.name} sepete eklendi.`);
  };

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 px-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Input Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-orange-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün adı, gramaj, kategori veya içerik arayın..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 font-semibold text-base outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden md:inline-block px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-mono font-bold rounded-md">
              ESC
            </span>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 divide-y divide-slate-100 dark:divide-slate-800/60">

          {/* If Search Query Provided */}
          {query.trim() ? (
            <div className="space-y-5">
              
              {/* Product Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Ürün Sonuçları ({searchResults.length})
                  </span>
                  <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/50">
                    Canlı Otomatik İndeksli
                  </span>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        onClick={() => handleNavigate(`/urun/${p.id}`)}
                        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          idx === selectedIndex
                            ? "bg-orange-50/60 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/50 shadow-sm"
                            : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                            <Image
                              src={p.image || "/pekefe-dut-pekmezi-kavanoz-tr.jpg"}
                              alt={p.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400 tracking-wide">
                                {p.categoryDisplay || p.category}
                              </span>
                              {p.meta && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  • {p.meta}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                              {p.name}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            ₺{p.price}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(e, p)}
                            className="p-2 bg-slate-900 hover:bg-orange-500 text-white rounded-xl transition cursor-pointer shadow-sm"
                            title="Sepete Ekle"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <Package className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      "{query}" ile eşleşen ürün bulunamadı.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Lütfen farklı bir gramaj veya ürün adı deneyin.
                    </p>
                  </div>
                )}
              </div>

              {/* Category Quick Matches */}
              {categoryResults.length > 0 && (
                <div className="pt-4 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Kategori Sonuçları
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryResults.map((cat) => (
                      <div
                        key={cat.slug}
                        onClick={() => handleNavigate(`/kategoriler?cat=${cat.slug}`)}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 border border-slate-200/60 dark:border-slate-800 rounded-xl cursor-pointer flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 transition"
                      >
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span> {cat.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Default View: Popular Searches & Categories */
            <div className="space-y-6">
              
              {/* Popular Tags */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Popüler Aramalar</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuery(tag)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer border-none flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-orange-400" /> {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories Grid */}
              <div className="pt-5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span>Kategori Kataloğu</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {CATEGORY_LINKS.map((c) => (
                    <div
                      key={c.slug}
                      onClick={() => handleNavigate(`/kategoriler?cat=${c.slug}`)}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-500 hover:text-white border border-slate-200/60 dark:border-slate-800 rounded-2xl cursor-pointer transition text-center group"
                    >
                      <span className="text-xl block mb-1">{c.icon}</span>
                      <span className="text-xs font-bold block truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-mono">⌘K</kbd> / <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-mono">Ctrl+K</kbd> Hızlı Arama
            </span>
          </div>
          <span className="text-orange-600 dark:text-orange-400 font-bold">PEKEFE Gelişmiş Arama Motoru</span>
        </div>

      </div>
    </div>
  );
}
