"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";
import { fetchProductsFromApi } from "@/utils/productsStorage";
import { addToCart } from "@/utils/cartStorage";

function trNormalize(str = "") {
  if (!str || typeof str !== "string") return "";
  const trMap = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
  };
  return str
    .split("")
    .map((ch) => trMap[ch] || ch)
    .join("")
    .toLowerCase()
    .trim();
}

function parseNumericPrice(val) {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export default function Kategoriler() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        fetchProductsFromApi(),
        fetch("/api/categories", { cache: "no-store" }).then(r => r.ok ? r.json() : [])
      ]);
      const catMap = {};
      if (Array.isArray(catData)) {
        catData.forEach(c => { if (c?.name) catMap[trNormalize(c.name)] = c.name.trim(); });
      }
      if (Array.isArray(prodData)) {
        setProducts(prodData.map(p => ({
          ...p,
          price: parseNumericPrice(p.price),
          categoryDisplay: catMap[trNormalize(p.categoryDisplay || p.category)] || p.categoryDisplay || p.category
        })));
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error("loadProducts error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    const handleUpdated = () => loadProducts();
    window.addEventListener("pekefe_products_updated", handleUpdated);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadProducts();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pekefe_products_updated", handleUpdated);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadProducts]);

  const dynamicCategories = useMemo(() => {
    const catMap = new Map();
    catMap.set("all", "Tüm Ürünler");
    if (Array.isArray(products)) {
      products.forEach(p => {
        const display = p.categoryDisplay || p.category;
        if (display && typeof display === "string" && display.trim()) {
          const key = trNormalize(display);
          if (!catMap.has(key)) catMap.set(key, display.trim());
        }
      });
    }
    const result = [];
    catMap.forEach((name, value) => result.push({ name, value }));
    return result;
  }, [products]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleAddToCart = (productName) => {
    setToastMsg(`${productName} sepete eklendi!`);
    setToastOpen(true);
  };

  const translateImage = (url) => {
    if (!url || typeof url !== "string") return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
    if (url.includes("/pekefe-dut-pekmezi-kavanoz.jpg") || url.includes("/geleneksel-pekmez.png")) return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
    if (url.includes("/premium-pekefe-kavanoz.png")) return "/premium-pekefe-kavanoz-tr.png";
    return url;
  };

  const productsWithBust = useMemo(() =>
    products.filter(Boolean).map(p => ({
      ...p,
      numericPrice: parseNumericPrice(p.price),
      image: translateImage(p.image),
      images: Array.isArray(p.images) ? p.images.map(translateImage) : [translateImage(p.image)]
    })),
  [products]);

  const filteredProducts = useMemo(() => {
    let result = [...productsWithBust];
    if (selectedCategory && selectedCategory !== "all") {
      const sel = trNormalize(selectedCategory);
      result = result.filter(p => {
        const c1 = trNormalize(p.category);
        const c2 = trNormalize(p.categoryDisplay);
        return c1.includes(sel) || sel.includes(c1) || c2.includes(sel) || sel.includes(c2);
      });
    }
    if (searchQuery.trim()) {
      const tokens = trNormalize(searchQuery).split(/\s+/).filter(Boolean);
      result = result.filter(p => {
        const searchableText = trNormalize(
          `${p.name || ""} ${p.desc || ""} ${p.description || ""} ${p.meta || ""} ${p.category || ""} ${p.categoryDisplay || ""} ${p.ingredients || ""}`
        );
        return tokens.every(token => searchableText.includes(token));
      });
    }
    result = result.filter(p => p.numericPrice <= maxPrice);
    if (sortBy === "price-asc") result.sort((a, b) => a.numericPrice - b.numericPrice);
    if (sortBy === "price-desc") result.sort((a, b) => b.numericPrice - a.numericPrice);
    if (sortBy === "name-asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));
    if (sortBy === "name-desc") result.sort((a, b) => (b.name || "").localeCompare(a.name || "", "tr"));
    return result;
  }, [productsWithBust, selectedCategory, searchQuery, maxPrice, sortBy]);

  // Scroll Reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, { threshold: 0.05 });
    const cards = document.querySelectorAll(".reveal-card");
    cards.forEach((card) => {
      card.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-8");
      observer.observe(card);
    });
    return () => { cards.forEach((card) => observer.unobserve(card)); };
  }, [filteredProducts]);

  const BANNER_IMAGES = [
    { src: "/uploads/ispir-dut-bahcesi-hasat-baba-ogul.jpg", label: "1. Doğal Hasat" },
    { src: "/uploads/ispir-bakir-kazan-ahsap-cendere.webp", label: "2. Bakır Kazan" },
    { src: "/uploads/ispir-keten-bezde-pestil-serimi.webp", label: "3. İspir Güneşi" },
    { src: "/uploads/ispir-el-sarimi-pestil-cesitleri.webp", label: "4. Gurme Mahsul" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] pb-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-7">

        {/* ── HERO BANNER ─────────────────────── */}
        <header className="relative w-full h-[200px] md:h-[250px] rounded-3xl overflow-hidden shadow-lg flex items-center">
          <div className="absolute inset-0 grid grid-cols-4 z-0">
            {BANNER_IMAGES.map((img, i) => (
              <div key={i} className="relative overflow-hidden border-r border-white/10 last:border-0 group/panel">
                <Image
                  alt={img.label}
                  src={img.src}
                  fill
                  sizes="25vw"
                  className="object-cover brightness-75 transition-transform duration-700 group-hover/panel:scale-105"
                  priority={i < 2}
                />
                <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-amber-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full opacity-0 group-hover/panel:opacity-100 transition-opacity duration-300">
                  {img.label}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#6b1d2f]/85 via-[#6b1d2f]/55 to-[#6b1d2f]/25 z-10" />
          <div className="relative z-20 px-8 md:px-16 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-amber-200/90 text-[10px] font-bold tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              PEKEFE · Mahsulün Serüveni
            </span>
            <h1 className="text-white text-[28px] md:text-[38px] font-extrabold leading-tight drop-shadow-md">
              {dynamicCategories.find((c) => c.value === selectedCategory)?.name || "Tüm Ürünler"}
            </h1>
            <p className="text-white/65 text-sm hidden md:block">
              {filteredProducts.length} ürün listeleniyor
            </p>
          </div>
        </header>

        {/* ── MOBİL KATEGORİ ÇUBUĞU ────────────── */}
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {dynamicCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.value
                  ? "bg-[#6b1d2f] text-white border-[#6b1d2f] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#6b1d2f]/30"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── ANA İÇERİK ───────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── SİDEBAR ─────────────────────── */}
          <aside className="hidden lg:flex w-56 xl:w-60 flex-shrink-0 sticky top-24 flex-col gap-4">

            {/* Arama */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ürün Ara</p>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
                <input
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6b1d2f]/50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Kategoriler */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Kategoriler</p>
              <div className="flex flex-col gap-1">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`w-full text-left flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat.value
                        ? "bg-[#6b1d2f] text-white shadow-sm shadow-[#6b1d2f]/15"
                        : "text-slate-600 hover:bg-[#6b1d2f]/5 hover:text-[#6b1d2f]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {selectedCategory === cat.value && (
                      <span className="material-symbols-outlined text-[14px] text-white/80">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Fiyat Filtresi */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Maks. Fiyat</p>
                <span className="text-xs font-extrabold text-[#6b1d2f] font-mono">₺{maxPrice.toLocaleString("tr-TR")}</span>
              </div>
              <input
                type="range" min="0" max="5000" step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#6b1d2f] bg-slate-200"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>₺0</span><span>₺5.000</span>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400">
              <span className="font-extrabold text-[#6b1d2f]">{filteredProducts.length}</span> ürün bulundu
            </p>
          </aside>

          {/* ── ÜRÜN GRID ────────────────────── */}
          <main className="flex-grow w-full min-w-0">

            {/* Üst çubuk */}
            <div className="hidden lg:flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500">
                <span className="font-bold text-slate-800">{filteredProducts.length}</span> ürün listeleniyor
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6b1d2f]/40 transition cursor-pointer shadow-sm"
              >
                <option value="recommended">Tavsiye Edilen</option>
                <option value="price-asc">Fiyat: Düşük → Yüksek</option>
                <option value="price-desc">Fiyat: Yüksek → Düşük</option>
                <option value="name-asc">İsim: A → Z</option>
                <option value="name-desc">İsim: Z → A</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4 shadow-sm">
                    <div className="w-full aspect-square bg-slate-100 rounded-xl" />
                    <div className="h-4 bg-slate-100 rounded-full w-2/3" />
                    <div className="h-3 bg-slate-100 rounded-full w-full" />
                    <div className="h-3 bg-slate-100 rounded-full w-4/5" />
                    <div className="h-8 bg-slate-100 rounded-xl w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <span className="material-symbols-outlined text-slate-300 text-6xl">search_off</span>
                <h3 className="text-lg font-bold text-slate-700">Eşleşen Mahsul Bulunamadı</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Filtrelerinizi değiştirerek veya aramayı genişleterek tekrar deneyin.
                </p>
                <button
                  onClick={() => { setSelectedCategory("all"); setSearchQuery(""); setMaxPrice(5000); setSortBy("recommended"); }}
                  className="mt-2 px-5 py-2.5 border border-[#6b1d2f] text-[#6b1d2f] rounded-xl text-xs font-bold hover:bg-[#6b1d2f] hover:text-white transition cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="reveal-card">
                    <ProductCard
                      id={p.id}
                      name={p.name}
                      desc={p.desc}
                      meta={p.meta}
                      price={p.price}
                      priceMin={p.priceMin}
                      priceMax={p.priceMax}
                      oldPrice={p.oldPrice}
                      b2b_price={p.b2b_price}
                      variants={p.variants || []}
                      image={p.image}
                      tag={p.tag}
                      stock={p.stock}
                      onAddToCart={(selectedVar) => {
                        const varLabel = selectedVar?.attributes?.size || selectedVar?.attributes?.name || selectedVar?.name || selectedVar?.size || "";
                        const itemToAdd = {
                          id: selectedVar?.id || `${p.id}_var`,
                          productId: p.id,
                          name: varLabel ? `${p.name} (${varLabel})` : p.name,
                          price: selectedVar?.price ? Number(selectedVar.price) : p.price,
                          sku: selectedVar?.sku || p.sku || p.id,
                          image: p.image,
                          quantity: 1
                        };
                        addToCart(itemToAdd);
                        handleAddToCart(itemToAdd.name);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Toast message={toastMsg} isOpen={toastOpen} onClose={() => setToastOpen(false)} />
    </div>
  );
}
