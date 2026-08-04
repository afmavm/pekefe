"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { getProductBySlug, fetchProductsFromApi, formatDbProductToStorefront, generateSlug, getProducts } from "@/utils/productsStorage";
import { addToCart } from "@/utils/cartStorage";
import JsonLd from "@/components/seo/JsonLd";
import { resolveProductMediaItems, isVideoUrl } from "@/lib/utils";

export default function UrunDetay({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slugOrId = resolvedParams?.slug || resolvedParams?.id;

  const [productState, setProductState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Try localStorage first (instant)
    const cached = getProductBySlug(slugOrId);
    if (cached) {
      setProductState(cached);
      setIsLoading(false);
    }

    // 2. Fetch fresh from API — try direct endpoint first then full list
    const loadProduct = async () => {
      try {
        // Try direct product API by ID/slug first
        const directRes = await fetch(`/api/products/${slugOrId}?t=${Date.now()}`, { cache: 'no-store' });
        if (directRes.ok) {
          const raw = await directRes.json();
          if (raw && raw.id) {
            const formatted = formatDbProductToStorefront(raw);
            setProductState(formatted);
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback: load all products then find
      const all = await fetchProductsFromApi();
      const found = getProductBySlug(slugOrId);
      if (found) {
        setProductState(found);
      } else if (Array.isArray(all)) {
        // Last resort: match by id in fresh data
        const byId = all.find(p => String(p.id) === String(slugOrId));
        if (byId) setProductState(byId);
      }
      setIsLoading(false);
    };

    loadProduct();

    // Re-fetch when tab becomes active again
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchProductsFromApi().then(() => {
          const fresh = getProductBySlug(slugOrId);
          if (fresh) setProductState(fresh);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Listen to admin updates broadcast
    const handleUpdated = () => {
      const fresh = getProductBySlug(slugOrId);
      if (fresh) setProductState(fresh);
    };
    window.addEventListener("pekefe_products_updated", handleUpdated);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pekefe_products_updated", handleUpdated);
    };
  }, [slugOrId]);

  const translateImage = (url) => {
    if (!url) return url;
    if (url.includes("/pekefe-dut-pekmezi-kavanoz.jpg") || url.includes("/geleneksel-pekmez.jpg") || url.includes("/geleneksel-pekmez.png")) {
      return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
    }
    if (url.includes("/premium-pekefe-kavanoz.png")) {
      return "/premium-pekefe-kavanoz-tr.png";
    }
    return url;
  };

  const product = useMemo(() => {
    if (!productState) return null;
    return {
      ...productState,
      image: productState.image ? translateImage(productState.image) : productState.image,
      images: productState.images ? productState.images.map(translateImage) : productState.images
    };
  }, [productState]);

  // Canonical URL check: if user landed via ID (e.g. /urun/cms7y76vq0005uetc6rj8y5z6), silently update URL to slug
  useEffect(() => {
    if (product && product.slug && typeof window !== "undefined") {
      const expectedSlug = product.slug;
      if (slugOrId !== expectedSlug && slugOrId === product.id) {
        window.history.replaceState(null, "", `/urun/${expectedSlug}`);
      }
    }
  }, [product, slugOrId]);

  const mediaList = useMemo(() => {
    if (!product) return [];
    return resolveProductMediaItems(product.image, product.images, product.videoUrl);
  }, [product]);

  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    if (mediaList.length > 0) {
      setSelectedMedia(mediaList[0]);
    } else if (product) {
      setSelectedMedia({ id: "def", type: "image", url: product.image || "/premium-pekefe-kavanoz.png", name: "Görsel" });
    }
  }, [mediaList, product]);

  const variantsList = useMemo(() => {
    if (!product) return [];
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants;
    }
    if (product.attributes && product.attributes.variants && Array.isArray(product.attributes.variants) && product.attributes.variants.length > 0) {
      return product.attributes.variants;
    }
    return [];
  }, [product]);

  const getVariantLabel = (v) => {
    if (!v) return "";
    let attrs = v.attributes;
    if (typeof attrs === "string") {
      try { attrs = JSON.parse(attrs); } catch (e) {}
    }
    if (attrs && typeof attrs === "object") {
      return attrs.size || attrs.name || v.name || v.size || "";
    }
    return v.size || v.name || "";
  };

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(product && product.images && product.images[0] ? product.images[0] : (product ? product.image : "/premium-pekefe-kavanoz.png"));
  const [activeTab, setActiveTab] = useState("urun_aciklamasi");
  const [failedImages, setFailedImages] = useState({});

  // Image Zoom Lightbox Modal States
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHoveringZoom, setIsHoveringZoom] = useState(false);

  // Keyboard navigation for image lightbox modal (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isZoomModalOpen) return;
      if (e.key === "Escape") {
        setIsZoomModalOpen(false);
        setZoomScale(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomModalOpen]);

  useEffect(() => {
    if (variantsList.length > 0) {
      setSelectedVariant((prev) => {
        if (!prev) return variantsList[0];
        const prevLabel = getVariantLabel(prev);
        const match = variantsList.find((v) => (v.id && prev.id && v.id === prev.id) || getVariantLabel(v) === prevLabel);
        return match || variantsList[0];
      });
    } else {
      setSelectedVariant(null);
    }
  }, [variantsList]);

  const displayPrice = useMemo(() => {
    if (selectedVariant && selectedVariant.price && Number(selectedVariant.price) > 0) {
      return Number(selectedVariant.price);
    }
    if (product && product.price && Number(product.price) > 0) {
      return Number(product.price);
    }
    return 280;
  }, [selectedVariant, product]);

  const sessionResult = useSession();
  const session = sessionResult?.data;
  
  // Review Submission, Share Modal & Favorites State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newReview, setNewReview] = useState({ author: "", rating: 5, comment: "" });
  const [reviewsList, setReviewsList] = useState([
    { id: "1", author: "Ayşe Yıldız", rating: 5, date: "12.06.2026", comment: "Kıvamı ve tadı harika. Çocukluğumdaki o gerçek lezzeti sonunda buldum. Paketleme de çok özenliydi, sapasağlam ulaştı." },
    { id: "2", author: "Mehmet Kaya", rating: 5, date: "05.07.2026", comment: "İspirli biri olarak söylüyorum, tam kıvamında ve çok lezzetli. Tahinle harika oluyor." }
  ]);

  // Sync favorites state
  useEffect(() => {
    if (typeof window !== "undefined" && product) {
      const favoritesKey = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
      const favs = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
      const targetId = String(product.id || slugOrId);
      setIsFavorite(favs.some((item) => String(item.id) === targetId || String(item.sku) === targetId));
    }
  }, [product, slugOrId, session]);

  const handleFavoriteToggle = () => {
    if (!product) return;
    const favoritesKey = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
    const targetId = String(product.id || slugOrId);
    let favs = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    const exists = favs.some((item) => String(item.id) === targetId || String(item.sku) === targetId);

    if (exists) {
      favs = favs.filter((item) => String(item.id) !== targetId && String(item.sku) !== targetId);
      localStorage.setItem(favoritesKey, JSON.stringify(favs));
      setIsFavorite(false);
      setToastMsg(`${product.name} favorilerinizden çıkarıldı.`);
      setToastOpen(true);
    } else {
      const newFavItem = {
        id: targetId,
        name: product.name,
        price: `₺${Number(product.price).toLocaleString("tr-TR")}`,
        img: selectedMedia?.url || product.image || "/premium-pekefe-kavanoz.png",
        image: selectedMedia?.url || product.image || "/premium-pekefe-kavanoz.png",
        sku: product.sku || targetId,
        weight: product.attributes?.specsWeight || "1 Kg"
      };
      favs.push(newFavItem);
      localStorage.setItem(favoritesKey, JSON.stringify(favs));
      setIsFavorite(true);
      setToastMsg(`${product.name} favorilerinize eklendi! ❤️`);
      setToastOpen(true);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pekefe_favorites_changed"));
    }
  };

  const getPublicShareUrl = () => {
    const slug = product?.slug || slugOrId;
    if (typeof window === "undefined") return `https://www.pekefe.com/urun/${slug}`;
    let href = window.location.origin + `/urun/${slug}`;
    if (href.includes("localhost") || href.includes("127.0.0.1")) {
      href = href.replace(/http:\/\/(localhost|127\.0\.0\.1):3000/, "https://www.pekefe.com");
    }
    return href;
  };

  const getWhatsAppShareText = () => {
    const shareUrl = getPublicShareUrl();
    const priceText = product?.price ? `₺${Number(product.price).toLocaleString("tr-TR")}` : "";
    const altitude = product?.altitude || product?.attributes?.altitude || "2000 Metre";
    const harvest = product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos";

    return (
      `*${product?.name || "Pekefe Yöresel Mahsul"}*\n` +
      `✨ *Pekefe Asırlık Erzurum Mahsulleri*\n` +
      (priceText ? `💰 *Fiyat:* ${priceText}\n` : "") +
      `🏔️ *Rakım / Hasat:* ${altitude} · ${harvest}\n` +
      `🌿 *Kalite:* %100 Doğal & Coğrafi İşaretli\n\n` +
      `📸 *Ürünü İncele & Sipariş Ver:* \n` +
      `${shareUrl}`
    );
  };

  const handleShareClick = async () => {
    const shareUrl = getPublicShareUrl();
    const shareText = getWhatsAppShareText();

    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "Pekefe Erzurum Mahsulleri",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          setIsShareModalOpen(true);
        }
        return;
      }
    }
    setIsShareModalOpen(true);
  };

  // Toast States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Sync main image if product changes
  useEffect(() => {
    if (product) {
      setMainImage(product.images && product.images[0] ? product.images[0] : product.image);
      setQuantity(1);
    }
  }, [product]);

  const handleAddReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.author.trim() || !newReview.comment.trim()) {
      setToastMsg("Lütfen adınızı ve yorumunuzu doldurunuz.");
      setToastOpen(true);
      return;
    }

    const reviewObj = {
      id: Math.random().toString(),
      author: newReview.author.trim(),
      rating: newReview.rating,
      date: new Date().toLocaleDateString("tr-TR"),
      comment: newReview.comment.trim()
    };

    setReviewsList(prev => [reviewObj, ...prev]);
    setIsReviewModalOpen(false);
    setNewReview({ author: "", rating: 5, comment: "" });
    setToastMsg("Değerlendirmeniz başarıyla iletildi. Teşekkür ederiz!");
    setToastOpen(true);
  };

  const recommendations = useMemo(() => {
    const allProds = getProducts();
    const filtered = allProds.filter(p => p.id !== (product?.id || slugOrId) && p.slug !== slugOrId).slice(0, 3);
    return filtered.map(p => ({
      ...p,
      image: p.image ? translateImage(p.image) : p.image,
      images: p.images ? p.images.map(translateImage) : p.images
    }));
  }, [slugOrId, product]);

  const handleQuantityChange = (val) => {
    if (quantity + val >= 1) {
      setQuantity(quantity + val);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const finalPrice = selectedVariant && selectedVariant.price ? Number(selectedVariant.price) : Number(product.price);
    if (!finalPrice || finalPrice <= 0) {
      setToastMsg("Fiyatı 0 TL olan ürünler sepete eklenemez.");
      setToastOpen(true);
      return;
    }
    const variantLabel = getVariantLabel(selectedVariant);
    const uniqueCartId = selectedVariant?.id 
      ? `${product.id}_${selectedVariant.id}` 
      : (variantLabel ? `${product.id}_${variantLabel.replace(/\s+/g, '_')}` : product.id);

    const cartItem = {
      ...product,
      id: uniqueCartId,
      productId: product.id,
      name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
      price: finalPrice,
      sku: selectedVariant?.sku || product.sku || product.id
    };
    const success = addToCart(cartItem, quantity);
    if (success !== false) {
      setToastMsg(`${cartItem.name} (${quantity} adet) sepete eklendi!`);
      setToastOpen(true);
    }
  };

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images && product.images[0] ? `https://www.pekefe.com${product.images[0]}` : `https://www.pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg`,
    "description": product.seoDesc || product.shortDesc || product.description || product.details,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "PEKEFE"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.pekefe.com/urun/${product.slug || product.id}`,
      "priceCurrency": "TRY",
      "price": displayPrice,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock"
    }
  } : null;

  // Dynamic tab data fetched directly from Admin Management page attributes with robust fallback
  const fullDescriptionText = useMemo(() => {
    if (!product) return "";
    const attrs = product.attributes || {};
    const candidate = product.desc || attrs.desc || product.description || attrs.description || product.recipeDetails || attrs.recipeDetails || attrs.harvestStory || product.details;
    if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    return `${product.name || "PEKEFE Geleneksel Mahsulü"}, İspir'in 2000 rakımlı yüksek yaylalarındaki yabani dut ağaçlarından toplanıp geleneksel yöntemlerle kısık meşe odunu ateşinde ve el yapımı bakır kazanlarda kaynatılarak üretilmiştir. Hiçbir katkı maddesi, ilave şeker, koruyucu veya aroma verici sentetik içermez. %100 saf ve doğal besleyici özelliğe sahiptir.`;
  }, [product]);

  const summaryDescription = useMemo(() => {
    if (!product) return "";
    const attrs = product.attributes || {};
    const candidate = product.shortDesc || attrs.shortDesc || product.desc || attrs.desc || product.description || attrs.harvestStory || attrs.details || product.details;
    if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    }
    return "İspir'in 2000 rakımlı yüksek yaylalarında doğal yöntemlerle hazırlanan katkısız ve saf geleneksel lezzet.";
  }, [product]);

  const harvestStoryText = useMemo(() => {
    if (!product) return "";
    const attrs = product.attributes || {};
    const candidate = attrs.harvestStory || product.harvestStory || attrs.details || product.details || product.desc || attrs.desc || product.description;
    if (candidate && typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    return "İspir'in 2000 rakımlı yüksek yaylalarından toplanan mahsullerimiz geleneksel yöntemlerle kısık odun ateşinde bakır kazanlarda kaynatılarak üretilmektedir.";
  }, [product]);

  const ingredientsText = product?.attributes?.ingredients || product?.ingredients || "%100 Saf Katkısız Ve İlave Şekersiz İspir Hasadı";
  const ritualText = product?.attributes?.ritual || product?.ritual || "Oda sıcaklığında (18°C - 22°C) muhafaza edilmesi ve seramik veya ahşap kaşık ile tüketilmesi tavsiye edilir.";
  
  const nutrientsData = product?.attributes?.nutrients || product?.nutrients || {
    energy: "310 kcal",
    carb: "71.5 g",
    protein: "1.2 g",
    calcium: "180 mg",
    iron: "8.5 mg"
  };

  const hmfLevelText = product?.attributes?.hmfLevel || "< 10 mg/kg (Analiz Raporlu)";

  const specificationsList = useMemo(() => {
    const attrs = product?.attributes || {};
    if (attrs.specifications && Array.isArray(attrs.specifications) && attrs.specifications.length > 0) {
      return attrs.specifications;
    }
    if (product?.specifications && Array.isArray(product.specifications) && product.specifications.length > 0) {
      return product.specifications;
    }
    // Build specs dynamically from admin attributes if individual fields exist
    const list = [];
    list.push({ key: "Menşei", value: attrs.specsMaterial || "Erzurum / İspir" });
    list.push({ key: "Kurutma Yöntemi", value: attrs.specsBellows || "Keten Bezlerde Güneşte Doğal Kurutma" });
    if (attrs.specsDimensions) {
      list.push({ key: "Kalınlık", value: attrs.specsDimensions });
    } else {
      list.push({ key: "Kalınlık", value: "< 1.5 mm (İpeksi Dokulu)" });
    }
    if (attrs.specsWeight) {
      list.push({ key: "Şeker / Glikoz", value: attrs.specsWeight });
    } else {
      list.push({ key: "Şeker / Glikoz", value: "0.0% (Sadece Doğal Meyve Şekeri)" });
    }
    list.push({ key: "HMF Seviyesi", value: hmfLevelText });
    return list;
  }, [product, hmfLevelText]);

  // ── Loading / Not-Found Guards ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="animate-pulse flex flex-col lg:flex-row gap-10 w-full max-w-5xl px-6">
          <div className="bg-surface-container-low rounded-2xl w-full lg:w-1/2 aspect-square" />
          <div className="flex flex-col gap-4 flex-1 py-4">
            <div className="h-4 bg-surface-container-low rounded-full w-1/3" />
            <div className="h-8 bg-surface-container-low rounded-full w-3/4" />
            <div className="h-4 bg-surface-container-low rounded-full w-1/2" />
            <div className="h-12 bg-surface-container-low rounded-2xl w-1/4 mt-4" />
            <div className="h-10 bg-surface-container rounded-2xl w-full mt-4" />
            <div className="h-10 bg-primary/20 rounded-2xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative w-full min-h-screen bg-background flex flex-col items-center justify-center gap-6 text-center px-6">
        <span className="material-symbols-outlined text-6xl text-outline-variant">inventory_2</span>
        <h1 className="font-display text-2xl text-on-surface">Ürün Bulunamadı</h1>
        <p className="text-on-surface-variant">Bu ürün mevcut değil veya kaldırılmış olabilir.</p>
        <Link href="/kategoriler" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-2xl font-label-md hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Tüm Ürünlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-background text-on-surface pb-24 overflow-hidden">
      {productSchema && <JsonLd data={productSchema} />}
      {/* Subtle background grain grid */}
      <div className="absolute inset-0 bg-[#F9F9FF] pointer-events-none opacity-40 mix-blend-multiply"></div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-base relative z-10">
        {/* Minimal Breadcrumbs */}
        <nav className="flex items-center gap-2 py-8 text-on-surface-variant font-label-sm text-[10px] uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="/">
            Mağaza
          </Link>
          <span className="material-symbols-outlined text-[10px] text-outline">chevron_right</span>
          <Link className="hover:text-primary transition-colors" href="/kategoriler">
            {product?.categoryDisplay || product?.category || "Gıda"}
          </Link>
          <span className="material-symbols-outlined text-[10px] text-outline">chevron_right</span>
          <span className="text-primary font-bold">{product?.name}</span>
        </nav>

        {/* ─── ASYMMETRICAL EDITORIAL SHOWCASE GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">
          
          {/* LEFT: Spacious Gallery Display (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div 
              onClick={() => {
                if (selectedMedia?.type !== "video" && !isVideoUrl(selectedMedia?.url)) {
                  setIsZoomModalOpen(true);
                  setZoomScale(1);
                }
              }}
              className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/15 aspect-[4/5] md:aspect-square max-h-[650px] w-full relative shadow-md group cursor-zoom-in"
              title="Görseli büyütmek için tıklayın"
            >
              {product?.tag && (
                <span className="absolute top-4 left-4 backdrop-blur-md bg-secondary/90 text-white font-label-sm text-[10px] px-3.5 py-1.5 rounded-full uppercase font-bold shadow-md tracking-widest z-10">
                  {product.tag}
                </span>
              )}
              
              {selectedMedia && (selectedMedia.type === "video" || isVideoUrl(selectedMedia.url)) ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black rounded-xl overflow-hidden">
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <>
                  <Image
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    src={selectedMedia?.url || mainImage || "/premium-pekefe-kavanoz.png"}
                    alt={product?.name || "Ürün Görseli"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  {/* Hover Zoom Badge Overlay */}
                  <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white/95 text-slate-900 px-4 py-2.5 rounded-full text-xs font-extrabold shadow-xl border border-white/50 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="material-symbols-outlined text-lg text-amber-600">zoom_in</span>
                      <span>Tıkla & Detaylı İncele</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Horizontal gallery list */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {mediaList.length > 0 ? mediaList.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMedia(item)}
                  className={`relative aspect-square bg-surface-container-low rounded-xl border overflow-hidden cursor-pointer w-20 flex-shrink-0 transition-all ${
                    selectedMedia?.url === item.url ? "border-primary shadow-md ring-2 ring-primary/20 scale-105" : "border-outline-variant/30 hover:border-outline opacity-80 hover:opacity-100"
                  }`}
                >
                  {item.type === "video" || isVideoUrl(item.url) ? (
                    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center text-amber-400 rounded-lg">
                      <span className="material-symbols-outlined text-2xl animate-pulse">play_circle</span>
                      <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">VIDEO</span>
                    </div>
                  ) : (
                    <Image className="object-cover" src={item.url} alt={`${product?.name} görsel ${index + 1}`} fill sizes="80px" />
                  )}
                </button>
              )) : (
                (product?.images || [mainImage]).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMedia({ type: "image", url: img })}
                    className={`relative aspect-square bg-surface-container-low rounded-xl border overflow-hidden cursor-pointer w-20 flex-shrink-0 transition-all ${
                      selectedMedia?.url === img ? "border-primary shadow-md ring-2 ring-primary/20 scale-105" : "border-outline-variant/30 hover:border-outline opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Image className="object-cover" src={img} alt={`${product?.name} görsel ${index + 1}`} fill sizes="80px" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Sticky Configurator & Brand Story (5 Columns) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] text-secondary uppercase font-mono tracking-[0.25em] font-bold block">
                Rakım: {product?.altitude || product?.attributes?.altitude || "2000 Metre"} · Hasat: {product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos"}
              </span>
              <h1 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold leading-tight tracking-tight">
                {product?.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex text-secondary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <span className="text-on-surface-variant font-label-sm text-xs uppercase tracking-wider underline cursor-pointer">
                  Doğrulanmış Mahsul Raporları
                </span>
              </div>
            </div>

            {/* Ölçü / Gramaj Varyant Seçimi */}
            {variantsList.length > 0 && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-amber-600">straighten</span>
                    Ölçü / Gramaj Seçimi:
                  </label>
                  <span className="text-xs text-amber-700 font-bold font-mono">
                    {getVariantLabel(selectedVariant)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variantsList.map((v, i) => {
                    const label = getVariantLabel(v);
                    const isSelected = selectedVariant ? (selectedVariant.id === v.id || getVariantLabel(selectedVariant) === label) : i === 0;
                    return (
                      <button
                        key={v.id || i}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-600/20 scale-102"
                            : "border-slate-200 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50"
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`font-mono font-extrabold ${isSelected ? "text-white" : "text-amber-700"}`}>
                          ₺{v.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-primary font-display-lg text-2xl md:text-3xl font-bold tracking-tight border-b border-outline-variant/10 pb-6 flex items-baseline gap-3">
              <span>₺{displayPrice}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 font-mono">
                KDV Dahil
              </span>
            </div>

            <p className="text-on-surface-variant font-body-md text-sm md:text-base leading-relaxed font-light">
              {summaryDescription}
            </p>

            {/* Micro Pillars */}
            <div className="grid grid-cols-2 gap-4 border-y border-outline-variant/10 py-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">eco</span>
                <span className="font-label-sm text-xs text-on-surface font-bold uppercase tracking-wider">0% Katkı Maddesi</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">history_edu</span>
                <span className="font-label-sm text-xs text-on-surface font-bold uppercase tracking-wider">Asırlık Tarifler</span>
              </div>
            </div>

            {/* Action Pane */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-outline-variant/30 rounded-lg overflow-hidden h-14 bg-white shadow-inner" role="group" aria-label="Ürün adedi">
                  <button onClick={() => handleQuantityChange(-1)} className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant" aria-label="Adet azalt">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <input
                    className="w-10 text-center border-none focus:ring-0 font-bold bg-transparent outline-none text-sm font-mono"
                    type="number"
                    value={quantity}
                    readOnly
                    aria-label="Seçili adet"
                    aria-live="polite"
                  />
                  <button onClick={() => handleQuantityChange(1)} className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant" aria-label="Adet artır">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-grow shadow-md h-14"
                >
                  Sepete Ekle
                </Button>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  variant={isFavorite ? "default" : "outline"}
                  className={`flex-1 h-12 cursor-pointer flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider ${
                    isFavorite 
                      ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md shadow-rose-600/20" 
                      : "bg-white hover:border-rose-300 hover:text-rose-600 text-slate-700"
                  }`}
                  onClick={handleFavoriteToggle}
                >
                  <span className={`material-symbols-outlined text-lg ${isFavorite ? "text-white" : "text-rose-500"}`} style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                    favorite
                  </span>
                  {isFavorite ? "Favorilerinizde" : "Favorilere Ekle"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 bg-white cursor-pointer flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-700 transition"
                  onClick={handleShareClick}
                >
                  <span className="material-symbols-outlined text-base">share</span>
                  Paylaş
                </Button>
              </div>
            </div>

            {/* Quick trust metrics */}
            <div className="p-5 bg-surface-container-low border border-outline-variant/10 rounded-xl space-y-3">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
                <span>İspir'den doğrudan kapınıza kargo (24 saatte kargoya verilir)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span>Analiz sertifikalı ve Coğrafi İşaret logolu orijinal kutu</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── TECHNICAL TABS & INGREDIENT TRANSPARENCY ─── */}
        <div className="border-t border-outline-variant/15 pt-12">
          
          {/* High-Contrast Segmented Luxury Tab Bar (Zero Native Scrollbar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 shadow-sm mb-8">
            <button
              onClick={() => setActiveTab("urun_aciklamasi")}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center ${
                activeTab === "urun_aciklamasi"
                  ? "bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                  : "text-on-surface-variant hover:text-primary hover:bg-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-lg shrink-0">description</span>
              <span className="truncate">Ürün Açıklaması</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${activeTab === "urun_aciklamasi" ? "bg-amber-400 text-slate-950" : "bg-primary/10 text-primary"}`}>
                Özel Reçete
              </span>
            </button>

            <button
              onClick={() => setActiveTab("aciklama")}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center ${
                activeTab === "aciklama"
                  ? "bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                  : "text-on-surface-variant hover:text-primary hover:bg-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-lg shrink-0">auto_stories</span>
              <span className="truncate">Mahsul Hikayesi & Detaylar</span>
            </button>

            <button
              onClick={() => setActiveTab("besin")}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center ${
                activeTab === "besin"
                  ? "bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                  : "text-on-surface-variant hover:text-primary hover:bg-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-lg shrink-0">science</span>
              <span className="truncate">Analiz & Besin Değerleri</span>
            </button>

            <button
              onClick={() => setActiveTab("yorumlar")}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center ${
                activeTab === "yorumlar"
                  ? "bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                  : "text-on-surface-variant hover:text-primary hover:bg-white/70"
              }`}
            >
              <span className="material-symbols-outlined text-lg shrink-0">rate_review</span>
              <span className="truncate">Müşteri Yorumları ({reviewsList.length})</span>
            </button>
          </div>

          <div className="py-4 min-h-[350px]">
            {/* DEDICATED TAB 1: ÜRÜN AÇIKLAMASI */}
            {activeTab === "urun_aciklamasi" && (
              <div className="bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                
                {/* Prominent Header Banner inside Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <span className="material-symbols-outlined text-2xl">description</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary block">
                        PEKEFE ÖZEL REÇETE VE AÇIKLAMA
                      </span>
                      <h3 className="font-display-lg text-primary text-2xl md:text-3xl font-bold tracking-tight">
                        {product?.name} Hakkında Detaylı Açıklama
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-bold font-mono">
                    <span className="material-symbols-outlined text-base text-amber-600">verified</span>
                    <span>%100 Doğal İspir Hasadı</span>
                  </div>
                </div>

                {/* Two-Column Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Left Column: Rich HTML Description Body */}
                  <div className="lg:col-span-8 space-y-8">
                    {fullDescriptionText && /<[a-z][\s\S]*>/i.test(fullDescriptionText) ? (
                      <div 
                        className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg prose max-w-none dark:prose-invert prose-headings:text-primary prose-strong:text-primary prose-strong:font-bold"
                        dangerouslySetInnerHTML={{ __html: fullDescriptionText }}
                      />
                    ) : (
                      <div className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg whitespace-pre-line space-y-4">
                        {fullDescriptionText}
                      </div>
                    )}

                    {/* Highlights / Quick Pillar Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-outline-variant/15">
                      <div className="p-5 bg-surface-container-low border border-outline-variant/15 rounded-2xl flex items-start gap-3 shadow-xs">
                        <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">%100 Doğal İçerik</h4>
                          <p className="text-xs text-on-surface-variant font-light mt-0.5">Katkı maddesi, koruyucu veya ilave şeker içermez.</p>
                        </div>
                      </div>

                      <div className="p-5 bg-surface-container-low border border-outline-variant/15 rounded-2xl flex items-start gap-3 shadow-xs">
                        <span className="material-symbols-outlined text-secondary text-2xl">terrain</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">İspir Yöresi Hasadı</h4>
                          <p className="text-xs text-on-surface-variant font-light mt-0.5">İspirin bereketli yaylalarında yetişen asırlık mahsuller.</p>
                        </div>
                      </div>

                      <div className="p-5 bg-surface-container-low border border-outline-variant/15 rounded-2xl flex items-start gap-3 shadow-xs">
                        <span className="material-symbols-outlined text-primary text-2xl">local_fire_department</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">Odun Ateşinde Bakır Kazan</h4>
                          <p className="text-xs text-on-surface-variant font-light mt-0.5">Geleneksel yöntemlerle kısık ateşte yavaş pişirme.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Key Summary & Attributes Card */}
                  <div className="lg:col-span-4 space-y-6 bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 shadow-inner">
                    <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                      <span className="material-symbols-outlined text-primary text-2xl">info</span>
                      <div>
                        <h4 className="font-display-lg text-primary text-base font-bold">Ürün Özet Nitelikleri</h4>
                        <p className="text-xs text-on-surface-variant font-light">Öne çıkan temel teknik bilgiler</p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                        <span className="text-xs text-on-surface-variant font-semibold">Kategori</span>
                        <span className="text-xs text-primary font-bold">{product?.categoryDisplay || product?.category || "Geleneksel"}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                        <span className="text-xs text-on-surface-variant font-semibold">Stok Kodu (SKU)</span>
                        <span className="text-xs text-primary font-bold font-mono">{product?.sku || "PRD-PKF-001"}</span>
                      </div>

                      {product?.barcode && (
                        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                          <span className="text-xs text-on-surface-variant font-semibold">Barkod</span>
                          <span className="text-xs text-primary font-bold font-mono">{product.barcode}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                        <span className="text-xs text-on-surface-variant font-semibold">Hasat Yeri</span>
                        <span className="text-xs text-primary font-bold">Erzurum / İspir</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                        <span className="text-xs text-on-surface-variant font-semibold">Yayla Yüksekliği</span>
                        <span className="text-xs text-primary font-bold font-mono">{product?.attributes?.altitude || product?.altitude || "2200 Metre"}</span>
                      </div>

                      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                        <span className="text-xs text-on-surface-variant font-semibold">Stok Durumu</span>
                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                          {product?.status || "Stokta Var"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: MAHSUL HİKAYESİ & DETAYLAR */}
            {activeTab === "aciklama" && (
              <div className="bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <span className="material-symbols-outlined text-2xl">auto_stories</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary block">
                        PEKEFE ZANAATKARLIK VE YAVAŞ ÜRETİM
                      </span>
                      <h3 className="font-display-lg text-primary text-2xl md:text-3xl font-bold tracking-tight">
                        Asırlık Zanaatkarlık ve Yavaş Üretim
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-bold font-mono">
                    <span className="material-symbols-outlined text-base text-amber-600">local_fire_department</span>
                    <span>Geleneksel Odun Ateşi</span>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-7 space-y-6">
                    {typeof harvestStoryText === "string" && /<[a-z][\s\S]*>/i.test(harvestStoryText) ? (
                      <div 
                        className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg prose max-w-none dark:prose-invert prose-headings:text-primary prose-strong:text-primary prose-strong:font-bold"
                        dangerouslySetInnerHTML={{ __html: harvestStoryText }}
                      />
                    ) : (
                      <div className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg whitespace-pre-line">
                        {harvestStoryText}
                      </div>
                    )}
                    
                    <div className="p-6 bg-surface-container-low border border-outline-variant/15 rounded-2xl space-y-2.5 shadow-xs">
                      <span className="text-[10px] text-secondary font-extrabold uppercase tracking-widest block">İçindekiler Temizliği</span>
                      <p className="text-base font-bold text-primary">{ingredientsText}</p>
                      <p className="text-xs text-on-surface-variant font-light">Renklendirici, koruyucu, nişasta bazlı glikoz veya aroma verici sentetikler içermez.</p>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6 bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 shadow-inner">
                    <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                      <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                      <div>
                        <h4 className="font-display-lg text-primary text-base font-bold">Teknik Spesifikasyonlar</h4>
                        <p className="text-xs text-on-surface-variant font-light">Laboratuvar & ambalaj detayları</p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {specificationsList.map((spec, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                          <span className="text-xs text-on-surface-variant font-semibold">{spec.key}</span>
                          <span className="text-xs text-primary font-bold font-mono">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: ANALİZ & BESİN DEĞERLERİ */}
            {activeTab === "besin" && (
              <div className="bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <span className="material-symbols-outlined text-2xl">science</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary block">
                        PEKEFE LABORATUVAR VE BESİN ANALİZİ
                      </span>
                      <h3 className="font-display-lg text-primary text-2xl md:text-3xl font-bold tracking-tight">
                        100g Besin Değerleri ve Analiz Raporu
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-bold font-mono">
                    <span className="material-symbols-outlined text-base text-amber-600">verified</span>
                    <span>Akredite Laboratuvar Raporlu</span>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Nutrients Table */}
                  <div className="lg:col-span-6 bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20">
                          <th className="py-3.5 font-display-lg text-xs uppercase tracking-wider font-extrabold text-primary">Besin Ögesi</th>
                          <th className="py-3.5 font-display-lg text-xs uppercase tracking-wider font-extrabold text-primary text-right">100g Değeri</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-mono text-on-surface-variant">
                        <tr className="border-b border-outline-variant/10">
                          <td className="py-3 font-semibold text-slate-700">Enerji (Energy)</td>
                          <td className="py-3 text-right font-bold text-primary">{nutrientsData.energy}</td>
                        </tr>
                        <tr className="border-b border-outline-variant/10">
                          <td className="py-3 font-semibold text-slate-700">Karbonhidrat (Carbohydrate)</td>
                          <td className="py-3 text-right font-bold text-primary">{nutrientsData.carb}</td>
                        </tr>
                        <tr className="border-b border-outline-variant/10">
                          <td className="py-3 font-semibold text-slate-700">Protein (Protein)</td>
                          <td className="py-3 text-right font-bold text-primary">{nutrientsData.protein}</td>
                        </tr>
                        <tr className="border-b border-outline-variant/10">
                          <td className="py-3 font-semibold text-slate-700">Kalsiyum (Calcium)</td>
                          <td className="py-3 text-right font-bold text-primary">{nutrientsData.calcium}</td>
                        </tr>
                        <tr className="border-b border-outline-variant/10">
                          <td className="py-3 font-semibold text-slate-700">Demir (Iron)</td>
                          <td className="py-3 text-right font-bold text-primary">{nutrientsData.iron}</td>
                        </tr>
                        <tr className="border-b border-outline-variant/10">
                          <td className="py-3 font-semibold text-slate-700">HMF Değeri (Analiz)</td>
                          <td className="py-3 text-right font-bold text-amber-600">{hmfLevelText}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Ritual & High-Contrast Info Banner */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="p-7 bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl shadow-inner space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-2xl">restaurant_menu</span>
                        <h4 className="font-display-lg text-primary text-base font-bold">Tüketim & Servis Ritüeli</h4>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed font-light">
                        {ritualText}
                      </p>
                    </div>

                    <div className="flex items-center gap-3.5 bg-amber-500/10 border-2 border-amber-600/40 p-4.5 rounded-2xl shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-xl">info</span>
                      </div>
                      <span className="text-xs md:text-sm font-bold text-amber-950 dark:text-amber-200 leading-relaxed">
                        Yukarıdaki değerler akredite gıda laboratuvarı mevsimsel analiz raporlarına dayanmaktadır.
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MÜŞTERİ YORUMLARI */}
            {activeTab === "yorumlar" && (
              <div className="bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <span className="material-symbols-outlined text-2xl">rate_review</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary block">
                        PEKEFE MÜŞTERİ DENEYİMİ VE DEĞERLENDİRMELERİ
                      </span>
                      <h3 className="font-display-lg text-primary text-2xl md:text-3xl font-bold tracking-tight">
                        Doğrulanmış Müşteri Yorumları ({reviewsList.length})
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-bold font-mono">
                    <span className="material-symbols-outlined text-base text-amber-600">star</span>
                    <span>5.0 / 5 Tam Puan</span>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 text-center shadow-inner space-y-4">
                      <div className="text-5xl font-display-lg text-primary font-bold">5.0</div>
                      <div className="flex justify-center text-amber-500 gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        ))}
                      </div>
                      <div className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">{reviewsList.length} Doğrulanmış Müşteri</div>
                      <Button
                        className="w-full py-3.5 cursor-pointer shadow-md"
                        onClick={() => setIsReviewModalOpen(true)}
                      >
                        Yorum Gönder
                      </Button>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-8 space-y-4">
                    {reviewsList.map(rev => (
                      <div key={rev.id} className="p-6 bg-surface-container-low/50 border border-outline-variant/15 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex text-amber-500 gap-0.5 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: i < rev.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                              ))}
                            </div>
                            <div className="font-bold text-xs text-primary uppercase tracking-wide flex items-center gap-1.5">
                              <span>{rev.author}</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-mono font-bold">Doğrulanmış Alıcı</span>
                            </div>
                          </div>
                          <span className="text-on-surface-variant/80 text-[10px] font-mono">{rev.date}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-light">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* ─── FULLSCREEN IMAGE ZOOM & INSPECTION LIGHTBOX MODAL ─── */}
        {isZoomModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-8 animate-in fade-in duration-200">
            
            {/* Lightbox Top Header */}
            <div className="flex justify-between items-center z-10 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <span className="material-symbols-outlined text-xl">zoom_in</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base md:text-lg font-display-lg leading-tight">
                    {product?.name}
                  </h3>
                  <p className="text-slate-400 text-xs font-mono">
                    Fareyi görsel üzerinde gezdirerek detayları inceleyebilirsiniz
                  </p>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/10 rounded-xl border border-white/15 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.max(1, prev - 0.5))}
                    className="w-8 h-8 rounded-lg text-white hover:bg-white/20 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                    title="Uzaklaştır (-)"
                  >
                    <span className="material-symbols-outlined text-base">zoom_out</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 min-w-[45px] text-center">
                    {Math.round((zoomScale === 1 && isHoveringZoom ? 2.2 : zoomScale) * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale(prev => Math.min(3.5, prev + 0.5))}
                    className="w-8 h-8 rounded-lg text-white hover:bg-white/20 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                    title="Yakınlaştır (+)"
                  >
                    <span className="material-symbols-outlined text-base">zoom_in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    className="px-2.5 py-1 text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                    title="Sıfırla"
                  >
                    1:1
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsZoomModalOpen(false);
                    setZoomScale(1);
                  }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/15 flex items-center justify-center cursor-pointer transition-colors"
                  title="Kapat (Esc)"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
            </div>

            {/* Center Inspection Stage with Dynamic Lens & Mouse Magnifier */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden select-none">
              
              {/* Left Arrow Navigation */}
              {(mediaList.length > 1 || (product?.images && product.images.length > 1)) && (
                <button
                  type="button"
                  onClick={() => {
                    const list = mediaList.length > 0 ? mediaList : (product?.images || []).map(img => ({ type: "image", url: img }));
                    const currentIdx = list.findIndex(m => (m.url || m) === (selectedMedia?.url || mainImage));
                    const prevIdx = (currentIdx - 1 + list.length) % list.length;
                    setSelectedMedia(list[prevIdx]);
                  }}
                  className="absolute left-2 md:left-6 z-20 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-amber-600 text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-2xl backdrop-blur-md transition-all hover:scale-110"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
              )}

              {/* Main Image Stage */}
              <div 
                onMouseEnter={() => setIsHoveringZoom(true)}
                onMouseLeave={() => {
                  setIsHoveringZoom(false);
                  setMousePos({ x: 50, y: 50 });
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setMousePos({ x, y });
                }}
                className="relative max-w-4xl w-full h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-slate-900/60 shadow-2xl cursor-crosshair group"
              >
                <Image
                  src={selectedMedia?.url || mainImage || "/premium-pekefe-kavanoz.png"}
                  alt={product?.name || "Detaylı Ürün Görseli"}
                  fill
                  priority
                  className="object-contain transition-transform duration-150 ease-out"
                  style={{
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                    transform: `scale(${isHoveringZoom && zoomScale === 1 ? 2.2 : zoomScale})`,
                  }}
                />

                {/* Floating Hint Overlay */}
                {!isHoveringZoom && (
                  <div className="absolute bottom-6 bg-slate-950/80 text-amber-300 border border-amber-500/30 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl pointer-events-none animate-pulse">
                    <span className="material-symbols-outlined text-base">center_focus_strong</span>
                    <span>Büyüteç etkisi için imleci görsel üzerinde gezdirin</span>
                  </div>
                )}
              </div>

              {/* Right Arrow Navigation */}
              {(mediaList.length > 1 || (product?.images && product.images.length > 1)) && (
                <button
                  type="button"
                  onClick={() => {
                    const list = mediaList.length > 0 ? mediaList : (product?.images || []).map(img => ({ type: "image", url: img }));
                    const currentIdx = list.findIndex(m => (m.url || m) === (selectedMedia?.url || mainImage));
                    const nextIdx = (currentIdx + 1) % list.length;
                    setSelectedMedia(list[nextIdx]);
                  }}
                  className="absolute right-2 md:right-6 z-20 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-amber-600 text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-2xl backdrop-blur-md transition-all hover:scale-110"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_right</span>
                </button>
              )}

            </div>

            {/* Bottom Thumbnail Strip */}
            <div className="z-10 border-t border-white/10 pt-4 flex justify-center">
              <div className="flex gap-3 overflow-x-auto no-scrollbar p-1 max-w-2xl">
                {(mediaList.length > 0 ? mediaList : (product?.images || [mainImage]).map(img => ({ type: "image", url: img }))).map((item, index) => {
                  const itemUrl = typeof item === "string" ? item : item.url;
                  const isCurrent = (selectedMedia?.url || mainImage) === itemUrl;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedMedia(typeof item === "string" ? { type: "image", url: item } : item)}
                      className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden cursor-pointer shrink-0 transition-all ${
                        isCurrent ? "border-amber-400 scale-105 shadow-lg shadow-amber-500/30" : "border-white/20 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={itemUrl}
                        alt={`Görsel ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ─── YORUM GÖNDER MODAL ─── */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">Müşteri Değerlendirmesi Ekle</h3>
                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    value={newReview.author}
                    onChange={e => setNewReview({ ...newReview, author: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Puanınız *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="text-amber-500 hover:scale-110 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: star <= newReview.rating ? "'FILL' 1" : "'FILL' 0" }}>
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Yorumunuz *</label>
                  <textarea
                    rows={4}
                    required
                    value={newReview.comment}
                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Ürün kalitesi, lezzeti ve paketlemesi hakkındaki deneyiminizi yazın..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-600/20"
                  >
                    Gönder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── PAYLAŞ MODAL (SHARE MODAL) ─── */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-100 animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
                    <span className="material-symbols-outlined text-xl">share</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Ürünü Paylaş</h3>
                    <p className="text-xs text-slate-500 font-medium">Sevdiklerinizle veya sosyal medyada paylaşın</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsShareModalOpen(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Product Preview Card */}
              <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                <div className="relative w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-200/80 flex-shrink-0 p-1">
                  <Image 
                    src={selectedMedia?.url || product?.image || "/premium-pekefe-kavanoz.png"} 
                    alt={product?.name || "Ürün"} 
                    fill 
                    className="object-contain p-1" 
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{product?.name}</h4>
                  <p className="text-[11px] text-amber-700 font-bold font-mono mt-0.5">₺{displayPrice}</p>
                  <span className="text-[10px] text-slate-400 font-semibold truncate block">Pekefe Asırlık Erzurum Mahsulleri</span>
                </div>
              </div>

              {/* Share Platform Buttons Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    const text = getWhatsAppShareText();
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/60 text-emerald-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">chat</span>
                  </div>
                  <span className="text-xs font-extrabold">WhatsApp</span>
                </button>

                {/* Instagram */}
                <button
                  type="button"
                  onClick={() => {
                    const text = `${product?.name || "Pekefe"} - ₺${displayPrice}\n${getPublicShareUrl()}`;
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(text);
                    }
                    window.open("https://www.instagram.com", "_blank");
                    setToastMsg("Ürün detayları & bağlantı kopyalandı! Instagram'da paylaşabilirsiniz.");
                    setToastOpen(true);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-pink-50 hover:bg-pink-100/90 border border-pink-200/60 text-pink-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                  </div>
                  <span className="text-xs font-extrabold">Instagram</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    const text = `*${product?.name || "Pekefe"}*\n💰 Fiyat: ₺${displayPrice}\n✨ Pekefe Asırlık Erzurum Mahsulleri`;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/90 border border-sky-200/60 text-sky-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">send</span>
                  </div>
                  <span className="text-xs font-extrabold">Telegram</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100/90 border border-blue-200/60 text-blue-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">thumb_up</span>
                  </div>
                  <span className="text-xs font-extrabold">Facebook</span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    const text = `${product?.name || "Pekefe"} - Pekefe Asırlık Erzurum Mahsulleri 🌾`;
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/90 border border-slate-200 text-slate-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">tag</span>
                  </div>
                  <span className="text-xs font-extrabold">X (Twitter)</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(url);
                    }
                    setToastMsg("Ürün bağlantısı panoya kopyalandı!");
                    setToastOpen(true);
                    setIsShareModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200/60 text-amber-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">content_copy</span>
                  </div>
                  <span className="text-xs font-extrabold">Kopyala</span>
                </button>
              </div>

              {/* Copy link input bar */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? getPublicShareUrl() : ""}
                  className="w-full bg-transparent text-xs font-mono text-slate-600 outline-none px-2 truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(url);
                    }
                    setToastMsg("Ürün bağlantısı panoya kopyalandı!");
                    setToastOpen(true);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition whitespace-nowrap cursor-pointer shadow-sm shadow-amber-600/20"
                >
                  Kopyala
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ─── SUGGESTIONS / BOUTIQUE COLLECTION ─── */}
        <section className="mt-24 border-t border-outline-variant/15 pt-16">
          <h2 className="font-display-lg text-primary text-2xl md:text-3xl font-bold mb-8 tracking-tight">
            Seçkin Mahsuller Koleksiyonu
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="group cursor-pointer">
                <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 relative aspect-[3/4] p-4 flex items-center justify-center">
                  {failedImages[rec.id] ? (
                    <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center text-primary z-10">
                      <span className="material-symbols-outlined text-3xl">eco</span>
                    </div>
                  ) : (
                    <Image
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                      src={rec.image}
                      alt={rec.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      onError={() => setFailedImages((prev) => ({ ...prev, [rec.id]: true }))}
                    />
                  )}
                  {rec.tag && (
                    <span className="absolute top-4 left-4 bg-secondary text-white text-[8px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                      {rec.tag}
                    </span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setToastMsg(`${rec.name} sepete eklendi!`);
                      setToastOpen(true);
                    }}
                    className="absolute bottom-4 right-4 bg-white hover:bg-primary text-primary hover:text-white p-3.5 rounded-lg shadow-sm border border-outline-variant/20 transition-all cursor-pointer flex items-center justify-center z-10"
                  >
                    <span className="material-symbols-outlined text-sm">shopping_cart</span>
                  </button>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="font-display-lg text-primary text-sm font-bold leading-snug group-hover:underline">
                    <Link href={`/urun/${rec.slug || rec.id}`}>{rec.name}</Link>
                  </h3>
                  <div className="text-secondary font-bold text-xs font-mono">₺{rec.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <Toast
        message={toastMsg}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
