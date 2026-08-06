"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  getProductBySlug,
  fetchProductsFromApi,
  formatDbProductToStorefront,
  getProducts,
} from "@/utils/productsStorage";
import { addToCart } from "@/utils/cartStorage";
import { resolveProductMediaItems } from "@/lib/utils";

// Helper image translation
export const translateImage = (url) => {
  if (!url) return url;
  if (
    url.includes("/pekefe-dut-pekmezi-kavanoz.jpg") ||
    url.includes("/geleneksel-pekmez.jpg") ||
    url.includes("/geleneksel-pekmez.png")
  ) return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
  if (url.includes("/premium-pekefe-kavanoz.png")) return "/premium-pekefe-kavanoz-tr.png";
  return url;
};

// Helper variant label
export const getVariantLabel = (v) => {
  if (!v) return "";
  let attrs = v.attributes;
  if (typeof attrs === "string") { try { attrs = JSON.parse(attrs); } catch {} }
  if (attrs && typeof attrs === "object") {
    const size  = (attrs.size  || "").trim();
    const color = (attrs.color || "").trim();
    if (size && color && size !== color) return `${size} · ${color}`;
    if (size)  return size;
    if (color) return color;
    return attrs.name || v.name || v.size || "";
  }
  return v.size || v.name || "";
};

export function useProductDetailState(params) {
  const resolvedParams = use(params);
  const slugOrId = resolvedParams?.slug || resolvedParams?.id;

  const [productState, setProductState] = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);

  useEffect(() => {
    const cached = getProductBySlug(slugOrId);
    if (cached) { setProductState(cached); setIsLoading(false); }

    const loadProduct = async () => {
      try {
        const res = await fetch(`/api/products/${slugOrId}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const raw = await res.json();
          if (raw?.id) { setProductState(formatDbProductToStorefront(raw)); setIsLoading(false); return; }
        }
      } catch {}
      const all = await fetchProductsFromApi();
      const found = getProductBySlug(slugOrId);
      if (found) { setProductState(found); }
      else if (Array.isArray(all)) {
        const byId = all.find((p) => String(p.id) === String(slugOrId));
        if (byId) setProductState(byId);
      }
      setIsLoading(false);
    };
    loadProduct();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchProductsFromApi().then(() => {
          const fresh = getProductBySlug(slugOrId);
          if (fresh) setProductState(fresh);
        });
      }
    };
    const handleUpdated = () => {
      const fresh = getProductBySlug(slugOrId);
      if (fresh) setProductState(fresh);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pekefe_products_updated", handleUpdated);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pekefe_products_updated", handleUpdated);
    };
  }, [slugOrId]);

  const product = useMemo(() => {
    if (!productState) return null;
    return {
      ...productState,
      image:  productState.image  ? translateImage(productState.image)  : productState.image,
      images: productState.images ? productState.images.map(translateImage) : productState.images,
    };
  }, [productState]);

  useEffect(() => {
    if (product?.slug && typeof window !== "undefined" && slugOrId !== product.slug && slugOrId === product.id) {
      window.history.replaceState(null, "", `/urun/${product.slug}`);
    }
  }, [product, slugOrId]);

  const mediaList = useMemo(() => {
    if (!product) return [];
    return resolveProductMediaItems(product.image, product.images, product.videoUrl);
  }, [product]);

  const [selectedMedia, setSelectedMedia] = useState(null);
  useEffect(() => {
    if (mediaList.length > 0) setSelectedMedia(mediaList[0]);
    else if (product) setSelectedMedia({ id: "def", type: "image", url: product.image || "/premium-pekefe-kavanoz.png", name: "Görsel" });
  }, [mediaList, product]);

  const variantsList = useMemo(() => {
    if (!product) return [];
    if (product.variants?.length > 0)             return product.variants;
    if (product.attributes?.variants?.length > 0) return product.attributes.variants;
    return [];
  }, [product]);

  const [selectedVariant, setSelectedVariant] = useState(null);
  useEffect(() => {
    if (variantsList.length > 0) {
      setSelectedVariant((prev) => {
        if (!prev) return variantsList[0];
        const prevLabel = getVariantLabel(prev);
        return variantsList.find((v) => (v.id && prev.id && v.id === prev.id) || getVariantLabel(v) === prevLabel) || variantsList[0];
      });
    } else {
      setSelectedVariant(null);
    }
  }, [variantsList]);

  const displayPrice = useMemo(() => {
    if (selectedVariant?.price && Number(selectedVariant.price) > 0) return Number(selectedVariant.price);
    if (product?.price && Number(product.price) > 0) return Number(product.price);
    return 280;
  }, [selectedVariant, product]);

  const [quantity,          setQuantity]         = useState(1);
  const [mainImage,         setMainImage]        = useState(product?.images?.[0] ?? product?.image ?? "/premium-pekefe-kavanoz.png");
  const [activeTab,         setActiveTab]        = useState("urun_aciklamasi");
  const [failedImages,      setFailedImages]     = useState({});
  const [toastOpen,         setToastOpen]        = useState(false);
  const [toastMsg,          setToastMsg]         = useState("");
  const [isFavorite,        setIsFavorite]       = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen]= useState(false);
  const [isShareModalOpen,  setIsShareModalOpen] = useState(false);
  const [newReview,         setNewReview]        = useState({ author: "", rating: 5, comment: "" });
  const [reviewsList,       setReviewsList]      = useState([
    { id: "1", author: "Ayşe Yıldız", rating: 5, date: "12.06.2026", comment: "Kıvamı ve tadı harika. Çocukluğumdaki o gerçek lezzeti sonunda buldum. Paketleme de çok özenliydi, sapasağlam ulaştı." },
    { id: "2", author: "Mehmet Kaya", rating: 5, date: "05.07.2026", comment: "İspirli biri olarak söylüyorum, tam kıvamında ve çok lezzetli. Tahinle harika oluyor." },
  ]);

  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomScale,       setZoomScale]       = useState(1);
  const [mousePos,        setMousePos]        = useState({ x: 50, y: 50 });
  const [isHoveringZoom,  setIsHoveringZoom]  = useState(false);

  useEffect(() => {
    if (product) {
      setMainImage(product.images?.[0] ?? product.image);
      setQuantity(1);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isZoomModalOpen && e.key === "Escape") { setIsZoomModalOpen(false); setZoomScale(1); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomModalOpen]);

  const sessionResult = useSession();
  const session = sessionResult?.data;

  useEffect(() => {
    if (typeof window === "undefined" || !product) return;
    const key = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
    const favs = JSON.parse(localStorage.getItem(key) || "[]");
    const targetId = String(product.id || slugOrId);
    setIsFavorite(favs.some((item) => String(item.id) === targetId || String(item.sku) === targetId));
  }, [product, slugOrId, session]);

  const handleQuantityChange = (val) => {
    if (quantity + val >= 1) setQuantity(quantity + val);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const finalPrice = selectedVariant?.price ? Number(selectedVariant.price) : Number(product.price);
    if (!finalPrice || finalPrice <= 0) {
      setToastMsg("Fiyatı 0 TL olan ürünler sepete eklenemez.");
      setToastOpen(true);
      return;
    }
    const variantLabel = getVariantLabel(selectedVariant);
    const uniqueCartId = selectedVariant?.id
      ? `${product.id}_${selectedVariant.id}`
      : variantLabel ? `${product.id}_${variantLabel.replace(/\s+/g, "_")}` : product.id;

    const success = addToCart(
      { ...product, id: uniqueCartId, productId: product.id, variantLabel, price: finalPrice, sku: selectedVariant?.sku || product.sku || product.id },
      quantity
    );
    if (success !== false) {
      const label = variantLabel ? ` · ${variantLabel}` : "";
      setToastMsg(`${product.name}${label} (${quantity} adet) sepete eklendi!`);
      setToastOpen(true);
    }
  };

  const handleFavoriteToggle = () => {
    if (!product) return;
    const key = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
    const targetId = String(product.id || slugOrId);
    let favs = JSON.parse(localStorage.getItem(key) || "[]");
    const exists = favs.some((item) => String(item.id) === targetId || String(item.sku) === targetId);
    if (exists) {
      favs = favs.filter((item) => String(item.id) !== targetId && String(item.sku) !== targetId);
      setIsFavorite(false);
      setToastMsg(`${product.name} favorilerinizden çıkarıldı.`);
    } else {
      favs.push({
        id: targetId, name: product.name,
        price: `₺${Number(product.price).toLocaleString("tr-TR")}`,
        img: selectedMedia?.url || product.image || "/premium-pekefe-kavanoz.png",
        image: selectedMedia?.url || product.image || "/premium-pekefe-kavanoz.png",
        sku: product.sku || targetId,
        weight: product.attributes?.specsWeight || "1 Kg",
      });
      setIsFavorite(true);
      setToastMsg(`${product.name} favorilerinize eklendi! ❤️`);
    }
    localStorage.setItem(key, JSON.stringify(favs));
    setToastOpen(true);
    window.dispatchEvent(new Event("pekefe_favorites_changed"));
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
    const harvest  = product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos";
    return (
      `*${product?.name || "Pekefe Yöresel Mahsul"}*\n` +
      `✨ *Pekefe Asırlık Erzurum Mahsulleri*\n` +
      (priceText ? `💰 *Fiyat:* ${priceText}\n` : "") +
      `🏔️ *Rakım / Hasat:* ${altitude} · ${harvest}\n` +
      `🌿 *Kalite:* %100 Doğal & Coğrafi İşaretli\n\n` +
      `📸 *Ürünü İncele & Sipariş Ver:* \n${shareUrl}`
    );
  };

  const handleShareClick = async () => {
    const shareUrl  = getPublicShareUrl();
    const shareText = getWhatsAppShareText();
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product?.name || "Pekefe Erzurum Mahsulleri", text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if (err.name !== "AbortError") setIsShareModalOpen(true);
        return;
      }
    }
    setIsShareModalOpen(true);
  };

  const handleAddReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.author.trim() || !newReview.comment.trim()) {
      setToastMsg("Lütfen adınızı ve yorumunuzu doldurunuz.");
      setToastOpen(true);
      return;
    }
    setReviewsList((prev) => [
      { id: Math.random().toString(), author: newReview.author.trim(), rating: newReview.rating, date: new Date().toLocaleDateString("tr-TR"), comment: newReview.comment.trim() },
      ...prev,
    ]);
    setIsReviewModalOpen(false);
    setNewReview({ author: "", rating: 5, comment: "" });
    setToastMsg("Değerlendirmeniz başarıyla iletildi. Teşekkür ederiz!");
    setToastOpen(true);
  };

  const fullDescriptionText = useMemo(() => {
    if (!product) return "";
    const attrs = product.attributes || {};
    const c = product.desc || attrs.desc || product.description || attrs.description || product.recipeDetails || attrs.recipeDetails || attrs.harvestStory || product.details;
    return c?.trim() || `${product.name}, İspir'in 2000 rakımlı yüksek yaylalarındaki yabani dut ağaçlarından toplanıp geleneksel yöntemlerle kısık meşe odunu ateşinde ve el yapımı bakır kazanlarda kaynatılarak üretilmiştir.`;
  }, [product]);

  const summaryDescription = useMemo(() => {
    if (!product) return "";
    const attrs = product.attributes || {};
    const c = product.shortDesc || attrs.shortDesc || product.desc || attrs.desc || product.description || attrs.harvestStory || attrs.details || product.details;
    return c?.trim().replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ") || "İspir'in 2000 rakımlı yüksek yaylalarında doğal yöntemlerle hazırlanan katkısız ve saf geleneksel lezzet.";
  }, [product]);

  const harvestStoryText = useMemo(() => {
    if (!product) return "";
    const attrs = product.attributes || {};
    const c = attrs.harvestStory || product.harvestStory || attrs.details || product.details || product.desc || attrs.desc || product.description;
    return c?.trim() || "İspir'in 2000 rakımlı yüksek yaylalarından toplanan mahsullerimiz geleneksel yöntemlerle kısık odun ateşinde bakır kazanlarda kaynatılarak üretilmektedir.";
  }, [product]);

  const ingredientsText = product?.attributes?.ingredients || product?.ingredients || "%100 Saf Katkısız Ve İlave Şekersiz İspir Hasadı";
  const ritualText      = product?.attributes?.ritual || product?.ritual || "Oda sıcaklığında (18°C - 22°C) muhafaza edilmesi ve seramik veya ahşap kaşık ile tüketilmesi tavsiye edilir.";
  const nutrientsData   = product?.attributes?.nutrients || product?.nutrients || { energy: "310 kcal", carb: "71.5 g", protein: "1.2 g", calcium: "180 mg", iron: "8.5 mg" };
  const hmfLevelText    = product?.attributes?.hmfLevel || "< 10 mg/kg (Analiz Raporlu)";

  const specificationsList = useMemo(() => {
    const attrs = product?.attributes || {};
    if (attrs.specifications?.length > 0)  return attrs.specifications;
    if (product?.specifications?.length > 0) return product.specifications;
    return [
      { key: "Menşei",          value: attrs.specsMaterial  || "Erzurum / İspir" },
      { key: "Kurutma Yöntemi", value: attrs.specsBellows   || "Keten Bezlerde Güneşte Doğal Kurutma" },
      { key: "Kalınlık",        value: attrs.specsDimensions|| "< 1.5 mm (İpeksi Dokulu)" },
      { key: "Şeker / Glikoz",  value: attrs.specsWeight    || "0.0% (Sadece Doğal Meyve Şekeri)" },
      { key: "HMF Seviyesi",    value: hmfLevelText },
    ];
  }, [product, hmfLevelText]);

  const recommendations = useMemo(() => {
    const allProds = getProducts();
    return allProds
      .filter((p) => p.id !== (product?.id || slugOrId) && p.slug !== slugOrId)
      .slice(0, 3)
      .map((p) => ({
        ...p,
        image:  p.image  ? translateImage(p.image)  : p.image,
        images: p.images ? p.images.map(translateImage) : p.images,
      }));
  }, [slugOrId, product]);

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type":    "Product",
    name:       product.name,
    image:      product.images?.[0] ? `https://www.pekefe.com${product.images[0]}` : "https://www.pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    description: product.seoDesc || product.shortDesc || product.description || product.details,
    sku:        product.sku || product.id,
    brand:      { "@type": "Brand", name: "PEKEFE" },
    offers:     { "@type": "Offer", url: `https://www.pekefe.com/urun/${product.slug || product.id}`, priceCurrency: "TRY", price: displayPrice, itemCondition: "https://schema.org/NewCondition", availability: "https://schema.org/InStock" },
  } : null;

  return {
    slugOrId, product, isLoading, mediaList, selectedMedia, setSelectedMedia,
    variantsList, selectedVariant, setSelectedVariant, displayPrice, quantity, handleQuantityChange,
    mainImage, activeTab, setActiveTab, failedImages, setFailedImages, toastOpen, setToastOpen,
    toastMsg, setToastMsg, isFavorite, handleFavoriteToggle, handleAddToCart,
    isReviewModalOpen, setIsReviewModalOpen, isShareModalOpen, setIsShareModalOpen,
    newReview, setNewReview, reviewsList, handleAddReviewSubmit, handleShareClick,
    getPublicShareUrl, getWhatsAppShareText, isZoomModalOpen, setIsZoomModalOpen,
    zoomScale, setZoomScale, mousePos, setMousePos, isHoveringZoom, setIsHoveringZoom,
    fullDescriptionText, summaryDescription, harvestStoryText, ingredientsText,
    ritualText, nutrientsData, hmfLevelText, specificationsList, recommendations, productSchema,
  };
}
