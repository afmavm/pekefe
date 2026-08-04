"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";
import { getProducts, fetchLiveProducts } from "@/utils/productsStorage";
import { addToCart } from "@/utils/cartStorage";

const initialProducts = [
  {
    id: "dut-pekmezi",
    name: "Geleneksel İspir Dut Pekmezi",
    category: "pekmez",
    desc: "İspir'in 2000 rakımlı yaylalarındaki yabani mulberlerden toplanıp odun ateşinde ve bakır kazanlarda kaynatılan, katkısız saf dut pekmezi.",
    meta: "800g · Cam Kavanoz",
    price: 280,
    image: "/pekefe-dut-pekmezi-kavanoz.jpg",
    tag: "En Çok Satan",
  },
  {
    id: "karadut-pekmezi",
    name: "Yabani Karadut Pekmezi",
    category: "pekmez",
    desc: "Geleneksel vakumlu kaynatma tekniği ile yüksek HMF değerleri üretilmeden, vitamin ve mineralleri korunarak üretilen premium karadut özü.",
    meta: "450g · Şişe Şeklinde Cam",
    price: 320,
    image: "/premium-pekefe-kavanoz.png",
    tag: "Özel Hasat",
  },
  {
    id: "sade-pestil",
    name: "Sade Dut Pestili",
    category: "pestil",
    desc: "Dut şırası ve tam buğday ununun bakır kazanlarda pişirilip keten sergiler üzerinde İspir güneşi altında kurutulmasıyla üretilen incecik sade pestil.",
    meta: "500g · Kraft Kutu",
    price: 180,
    image: "/ispir-pestil-kurutma-gercek.png",
    tag: "Doğal Güneşte Kurutulmuş",
  },
  {
    id: "cevizli-pestil",
    name: "Cevizli Rulo Pestil",
    category: "pestil",
    desc: "İspir yöresinin yerli cevizleriyle harmanlanan, ipeksi kıvamda serilen geleneksel dut pestilinin rulo haline getirilmiş en asil şekli.",
    meta: "500g · Premium Hediye Kutusu",
    price: 220,
    image: "/ispir-vakum-cevizli-pestil-beyaz.png",
    tag: "Geleneksel Reçete",
  },
  {
    id: "ispir-kome",
    name: "İspir Dut Kömesi (Cevizli)",
    category: "kome",
    desc: "İpe dizilen taze İspir cevizlerinin, kaynayan dut herlesine (şıra karışımı) defalarca batırılarak güneşte kurutulmasıyla elde edilen efsanevi lezzet.",
    meta: "1kg · Pamuk Torba",
    price: 380,
    image: "/ispir-kome-gercek-hasat.jpg",
    tag: "Coğrafi İşaretli",
  },
  {
    id: "ispir-tek-cekim-kome",
    name: "İspir Tek Çekim Dut Kömesi",
    category: "kome",
    desc: "Dullerine sadece tek daldırma yapılarak ceviz yoğunluğu en üst seviyede tutulmuş, hafif tatlı butik seri.",
    meta: "500g · Butik Paket",
    price: 240,
    image: "/ispir-kome-beyaz.png",
    tag: "Sınırlı Hasat",
  },
  {
    id: "muska-tatlisi",
    name: "Dut Pestil Muska Tatlısı",
    category: "tatli",
    desc: "İncecik kesilen sade dut pestilinin içerisine yerli ceviz, bal ve pekmez karışımı muska şeklinde sarılarak elde edilen enfes saray tatlısı.",
    meta: "350g · Özel Sunum Kabı",
    price: 200,
    image: "/ispir-vakum-sade-pestil-beyaz.png",
    tag: "El Emeği",
  },
  {
    id: "sarma-tatlisi",
    name: "Dut Pestil Sarma Tatlısı",
    category: "tatli",
    desc: "Dut pestilinin içerisine bol miktarda dövülmüş ceviz ve antep fıstığı kreması sarılarak hazırlanan gurme lezzet dilimleri.",
    meta: "400g · Premium Sunum Kutusu",
    price: 210,
    image: "/ispir-vakum-cevizli-pestil-beyaz.png",
    tag: "Gurme Seri",
  }
];

const categories = [
  { name: "Tüm Ürünler", value: "all" },
  { name: "Geleneksel Pekmezler", value: "pekmez" },
  { name: "Pestil Çeşitleri", value: "pestil" },
  { name: "Cevizli Kömeler", value: "kome" },
  { name: "Gurme Tatlılar", value: "tatli" }
];

export default function Kategoriler() {
  const [products, setProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  const loadLiveData = async () => {
    try {
      const [catRes, prodData] = await Promise.all([
        fetch("/api/categories?t=" + Date.now(), { cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetchLiveProducts()
      ]);
      if (Array.isArray(catRes)) setDbCategories(catRes);
      if (Array.isArray(prodData) && prodData.length > 0) setProducts(prodData);
    } catch (e) {
      console.error("loadLiveData error:", e);
    }
  };

  useEffect(() => {
    loadLiveData();

    const handleProductsChange = () => {
      loadLiveData();
    };

    window.addEventListener("pekefe_products_changed", handleProductsChange);
    window.addEventListener("focus", handleProductsChange);

    // Auto-sync polling every 3 seconds
    const interval = setInterval(() => {
      loadLiveData();
    }, 3000);

    return () => {
      window.removeEventListener("pekefe_products_changed", handleProductsChange);
      window.removeEventListener("focus", handleProductsChange);
      clearInterval(interval);
    };
  }, []);

  const dynamicCategories = useMemo(() => {
    const catMap = new Map();
    catMap.set("all", "Tüm Ürünler");

    // 1. Harvest from DB Categories table (/api/categories)
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      dbCategories.forEach(c => {
        if (c && c.name) {
          const key = String(c.name).toLowerCase().trim();
          catMap.set(key, c.name.trim());
        }
      });
    }

    // 2. Harvest from live product catalog (/api/products)
    if (Array.isArray(products) && products.length > 0) {
      products.forEach(p => {
        const rawCat = p.categoryDisplay || p.category;
        if (rawCat && typeof rawCat === "string" && rawCat.trim()) {
          const key = String(rawCat).toLowerCase().trim();
          if (!catMap.has(key)) {
            catMap.set(key, rawCat.trim());
          }
        }
      });
    }

    const result = [];
    catMap.forEach((displayName, categoryKey) => {
      result.push({ name: displayName, value: categoryKey });
    });
    return result;
  }, [dbCategories, products]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended"); // recommended, price-asc, price-desc
  
  // Toast States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleAddToCart = (productName) => {
    setToastMsg(`${productName} sepete eklendi!`);
    setToastOpen(true);
  };

  const productsWithBust = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const translateImage = (url) => {
      if (!url || typeof url !== "string") return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
      if (url.includes("/pekefe-dut-pekmezi-kavanoz.jpg") || url.includes("/geleneksel-pekmez.jpg") || url.includes("/geleneksel-pekmez.png")) {
        return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
      }
      if (url.includes("/premium-pekefe-kavanoz.png")) {
        return "/premium-pekefe-kavanoz-tr.png";
      }
      return url;
    };
    return products.filter(Boolean).map(p => ({
      ...p,
      image: translateImage(p.image),
      images: Array.isArray(p.images) ? p.images.map(translateImage) : [translateImage(p.image)]
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(productsWithBust)) return [];
    let result = [...productsWithBust];

    // Filter by Category (Flexible matching by slug or name)
    if (selectedCategory !== "all") {
      const selectedKey = String(selectedCategory).toLowerCase().trim();
      result = result.filter((p) => {
        if (!p) return false;
        const pCatKey = String(p.category || p.categoryDisplay || "").toLowerCase().trim();
        const pCatDisplayKey = String(p.categoryDisplay || p.category || "").toLowerCase().trim();
        return pCatKey === selectedKey || pCatDisplayKey === selectedKey;
      });
    }

    // Filter by Search Query
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p && (
            (p.name && String(p.name).toLowerCase().includes(q)) ||
            (p.desc && String(p.desc).toLowerCase().includes(q))
          )
      );
    }

    // Filter by Price
    result = result.filter((p) => p && typeof p.price === "number" && p.price <= maxPrice);

    // Sort Products
    if (sortBy === "price-asc") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [productsWithBust, selectedCategory, searchQuery, maxPrice, sortBy]);

  // Scroll Reveal Animations hook
  useEffect(() => {
    const observerOptions = {
      threshold: 0.05,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      });
    }, observerOptions);

    const animatedCards = document.querySelectorAll(".reveal-card");
    animatedCards.forEach((card) => {
      card.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-8");
      observer.observe(card);
    });

    return () => {
      animatedCards.forEach((card) => observer.unobserve(card));
    };
  }, [filteredProducts]);

  return (
    <div className="relative w-full min-h-screen bg-background text-on-surface overflow-hidden pb-24">
      {/* Subtle background grain grid */}
      <div className="absolute inset-0 bg-[#F9F9FF] pointer-events-none opacity-40 mix-blend-multiply z-0"></div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-12 relative z-10">
        
        {/* Premium Visual Category Journey Collage Banner */}
        <header className="relative w-full min-h-[260px] md:h-[300px] rounded-3xl overflow-hidden shadow-xl flex items-center justify-center border border-outline-variant/20 group">
          {/* 4-Stage Product Journey Collage Grid */}
          <div className="absolute inset-0 z-0 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/15">
            <div className="relative h-full overflow-hidden group/item">
              <Image
                alt="1. İspir Dut Hasadı"
                className="object-cover transition-transform duration-700 group-hover/item:scale-110 filter brightness-[0.80]"
                src="/uploads/ispir-dut-bahcesi-hasat-baba-ogul.jpg"
                fill
                sizes="25vw"
                priority
              />
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-amber-200 tracking-wider uppercase opacity-0 group-hover/item:opacity-100 transition-opacity">
                1. Doğal Hasat
              </div>
            </div>
            <div className="relative h-full overflow-hidden group/item">
              <Image
                alt="2. Odun Ateşinde Bakır Kazan"
                className="object-cover transition-transform duration-700 group-hover/item:scale-110 filter brightness-[0.80]"
                src="/uploads/ispir-bakir-kazan-ahsap-cendere.webp"
                fill
                sizes="25vw"
                priority
              />
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-amber-200 tracking-wider uppercase opacity-0 group-hover/item:opacity-100 transition-opacity">
                2. Meşe Ateşi
              </div>
            </div>
            <div className="relative h-full overflow-hidden group/item">
              <Image
                alt="3. Güneşte Keten Bez Serimi"
                className="object-cover transition-transform duration-700 group-hover/item:scale-110 filter brightness-[0.80]"
                src="/uploads/ispir-keten-bezde-pestil-serimi.webp"
                fill
                sizes="25vw"
                priority
              />
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-amber-200 tracking-wider uppercase opacity-0 group-hover/item:opacity-100 transition-opacity">
                3. Doğal Kurutma
              </div>
            </div>
            <div className="relative h-full overflow-hidden group/item">
              <Image
                alt="4. Vakumlu Gurme Lezzetler"
                className="object-cover transition-transform duration-700 group-hover/item:scale-110 filter brightness-[0.80]"
                src="/uploads/ispir-el-sarimi-pestil-cesitleri.webp"
                fill
                sizes="25vw"
                priority
              />
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-amber-200 tracking-wider uppercase opacity-0 group-hover/item:opacity-100 transition-opacity">
                4. Gurme Mahsul
              </div>
            </div>
          </div>

          {/* Cinematic Overlay & Center Copy */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/50 to-primary/70 z-10"></div>
          
          <div className="relative z-20 text-center px-6 py-8 max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 text-secondary-fixed text-[11px] font-semibold tracking-[0.25em] uppercase px-4 py-1.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20 shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              PEKEFE BUTİK MAĞAZA · MAHSULÜN SERÜVENİ
            </span>

            <h1 className="font-display-lg text-[34px] md:text-[48px] text-white leading-tight font-bold drop-shadow-md">
              {dynamicCategories.find((c) => c.value === selectedCategory)?.name || "Tüm Ürünler"}
            </h1>

            {/* Journey steps pill bar */}
            <div className="hidden sm:flex items-center justify-center gap-2 pt-1">
              <span className="text-[10px] text-amber-100 font-mono uppercase tracking-wider bg-black/30 backdrop-blur-md px-3 py-1 rounded-md border border-white/15">1. Hasat</span>
              <span className="text-amber-300 text-xs">→</span>
              <span className="text-[10px] text-amber-100 font-mono uppercase tracking-wider bg-black/30 backdrop-blur-md px-3 py-1 rounded-md border border-white/15">2. Bakır Kazan</span>
              <span className="text-amber-300 text-xs">→</span>
              <span className="text-[10px] text-amber-100 font-mono uppercase tracking-wider bg-black/30 backdrop-blur-md px-3 py-1 rounded-md border border-white/15">3. İspir Güneşi</span>
              <span className="text-amber-300 text-xs">→</span>
              <span className="text-[10px] text-amber-100 font-mono uppercase tracking-wider bg-black/30 backdrop-blur-md px-3 py-1 rounded-md border border-white/15">4. Sofra</span>
            </div>
            
            <div className="w-16 h-[1px] bg-secondary mx-auto mt-3 rounded-full"></div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-gutter items-start">
          {/* Sidebar / Filters (Glassmorphic) */}
          <aside className="w-full lg:w-72 flex-shrink-0 sticky lg:top-24 bg-white rounded-2xl border border-outline-variant/15 p-8 shadow-sm space-y-8">
            
            {/* Search Input */}
            <div className="space-y-3">
              <h3 className="font-label-md text-primary text-xs uppercase tracking-widest font-bold border-l-2 border-secondary pl-3">
                Ürün Ara
              </h3>
              <Input
                placeholder="Arama yapın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h3 className="font-label-md text-primary text-xs uppercase tracking-widest font-bold border-l-2 border-secondary pl-3">
                Kategoriler
              </h3>
              <div className="flex flex-col gap-2">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`text-left py-2 px-3 rounded-lg text-xs font-body-md transition-colors cursor-pointer flex justify-between items-center ${
                      selectedCategory === cat.value
                        ? "bg-primary/5 text-primary font-bold"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {selectedCategory === cat.value && (
                      <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-label-md text-primary text-xs uppercase tracking-widest font-bold border-l-2 border-secondary pl-3">
                  Maksimum Fiyat
                </h3>
                <span className="font-mono text-xs font-bold text-primary">{maxPrice} TL</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-1 bg-surface-container rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                <span>₺0</span>
                <span>₺5000</span>
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-3">
              <h3 className="font-label-md text-primary text-xs uppercase tracking-widest font-bold border-l-2 border-secondary pl-3">
                Sıralama
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white py-3 px-3 rounded-lg border border-outline-variant/30 text-xs font-body-md focus:outline-none focus:ring-1 focus:ring-primary text-on-surface outline-none"
              >
                <option value="recommended">Tavsiye Edilen</option>
                <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
              </select>
            </div>

          </aside>

          {/* Product Grid List (Asymmetrical Grid) */}
          <main className="flex-grow w-full">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-outline-variant/15 shadow-sm space-y-4">
                <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
                <h3 className="font-display-lg text-primary text-lg font-bold">Eşleşen Mahsul Bulunamadı</h3>
                <p className="text-xs text-on-surface-variant font-light max-w-sm mx-auto">
                  Arama kriterlerinizi genişletebilir veya diğer ürün kategorilerimizi inceleyebilirsiniz.
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                    setMaxPrice(500);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Filtreleri Temizle
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12">
                {filteredProducts.map((p, idx) => (
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
                      className={idx % 2 === 1 ? "lg:flex-row-reverse" : ""}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMsg}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
