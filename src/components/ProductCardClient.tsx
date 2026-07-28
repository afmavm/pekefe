"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/navigation";
import { Heart, Star, ShoppingBag, Tag, PackageCheck, PackageX } from "lucide-react";
import { useCartStore } from "@/modules/catalog/store";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { slugify, resolveProductImage } from "@/lib/utils";
import MiniCountdown from "./MiniCountdown";

interface ProductCardClientProps {
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    oldPrice: number | null;
    list_price?: number | null;
    sale_price?: number | null;
    image: string | null;
    images?: any;
    rating: number;
    reviews: number;
    isCampaignActive: boolean;
    stock?: number;
    is_discounted?: boolean;
    discount_display_text?: string;
    discount_end_date?: string | Date | null;
    server_time_utc?: string | Date | null;
    barcode?: string | null;
    attributes?: Record<string, any> | null;
    
    retail_list_price?: number | null;
    b2b_price?: number | null;
    is_b2b_user?: boolean;
  };
  calculatedDealerPrice?: number | null;
  primaryColor: string;
  unitText?: string; // kg, gram, adet vb.
}

export default function ProductCardClient({
  product,
  calculatedDealerPrice,
  primaryColor,
  unitText = "kg"
}: ProductCardClientProps) {
  const addToCart = useCartStore((state) => state.addItem);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(true);
  const tc = useTranslations("Common");
  const tProducts = useTranslations("Products");

  // Determine if out of stock
  const isOutOfStock = product.stock === 0;

  // Görsel URL'sini merkezi çözümleyici ile belirleme
  const imageUrl = resolveProductImage(product.image, product.images) || "https://placehold.co/400x400?text=Gorsel+Yok";

  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const favoritesKey = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
      const favs = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
      setIsFavorite(favs.some((item: any) => item.id === product.id));
    }
  }, [product.id, session]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.is_b2b_user && product.b2b_price ? product.b2b_price : product.price,
      quantity: 1,
      image: imageUrl
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);

    toast.success(`${product.name} sepete eklendi!`, {
      description: `1 ${unitText} başarıyla eklendi.`,
      icon: <ShoppingBag className="w-5 h-5 text-emerald-500" />
    });
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    
    if (typeof window !== "undefined") {
      const favoritesKey = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
      let favs = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
      if (nextState) {
        if (!favs.some((item: any) => item.id === product.id)) {
          const newFavItem = {
            id: product.id,
            name: product.name,
            weight: product.attributes?.weight || `1 ${unitText}`,
            price: `₺${(product.is_b2b_user && product.b2b_price ? product.b2b_price : product.price).toLocaleString("tr-TR")}`,
            img: imageUrl,
            sku: product.sku
          };
          favs.push(newFavItem);
          localStorage.setItem(favoritesKey, JSON.stringify(favs));
        }
        toast.success(`${product.name} favorilerinize eklendi.`);
      } else {
        favs = favs.filter((item: any) => item.id !== product.id);
        localStorage.setItem(favoritesKey, JSON.stringify(favs));
        toast.info(`${product.name} favorilerinizden çıkarıldı.`);
      }
    }
  };

  const listPriceVal = product.list_price ?? product.oldPrice ?? product.price;

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.25rem] overflow-hidden hover:border-amber-500/40 dark:hover:border-amber-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:hover:shadow-[0_20px_50px_rgba(245,158,11,0.05)] lg:hover:-translate-y-2 transition-[transform,box-shadow,border-color] duration-500 ease-out will-change-transform flex flex-col h-full">
      
      {/* Resim Alanı & Etiketler */}
      <Link href={`/products/${slugify(product.name)}`} prefetch={false} className="relative aspect-square w-full bg-white dark:bg-slate-950 overflow-hidden block border-b border-slate-150 dark:border-slate-800">
        {/* Favori Butonu */}
        <button 
          onClick={handleFavoriteToggle}
          className="absolute top-4 right-4 z-25 w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/90 border border-slate-200/40 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-red-500 flex items-center justify-center shadow-md backdrop-blur-md transition-[background-color,color,transform] duration-305 hover:scale-110 active:scale-95"
          type="button"
        >
          <Heart 
            className={`w-5 h-5 transition-transform duration-200 ${isFavorite ? "fill-red-500 text-red-500 scale-110" : "group-hover:scale-105"}`} 
          />
        </button>

        {/* Kampanya / İndirim Rozeti */}
        {product.is_discounted && product.discount_display_text && !isOutOfStock && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md shadow-amber-500/20 animate-pulse">
            <Tag className="w-3.5 h-3.5" /> {product.discount_display_text}
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-4 left-4 z-20 bg-slate-700 dark:bg-slate-800 text-slate-200 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
            {tc("out_of_stock").toUpperCase()}
          </div>
        )}

        {/* Ürün Resmi */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/60 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          </div>
        )}
        <Image 
          src={imageUrl} 
          alt={product.name}
          fill
          unoptimized
          quality={65}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className={`transition-[transform,opacity] duration-700 ease-out lg:group-hover:scale-105 ${
            isImageLoaded ? "opacity-100" : "opacity-0"
          } ${
            isOutOfStock ? "opacity-40 grayscale" : ""
          } ${
            (imageUrl.includes("unsplash.com") || imageUrl.includes("uploads/")) && 
            !imageUrl.toLowerCase().endsWith(".png") && 
            !imageUrl.toLowerCase().endsWith(".svg")
              ? "object-cover p-0"
              : "object-contain p-4"
          }`}
          onLoad={() => setIsImageLoaded(true)}
          priority={false}
        />
      </Link>

      {/* Mini Geri Sayım Sayacı */}
      {!isOutOfStock && product.is_discounted && (
        <MiniCountdown
          discountEndDate={product.discount_end_date}
          serverTimeUtc={product.server_time_utc}
        />
      )}

      {/* İçerik Alanı */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Kategori Bilgisi */}
        <div className="flex mb-2.5">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-full px-3 py-1">
            <Tag className="w-2.5 h-2.5" />
            {product.category}
          </span>
        </div>

        {/* Ürün İsmi */}
        <Link href={`/products/${slugify(product.name)}`} prefetch={false} className="block">
          <h3 className="text-slate-800 dark:text-white font-semibold text-sm leading-snug mb-2.5 line-clamp-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors h-10 font-display">
            {product.name}
          </h3>
        </Link>

        {/* Değerlendirme & Puan */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3.5 h-3.5 ${i < Math.floor(product.rating ?? 5) ? "fill-amber-500 text-amber-500" : "text-slate-200 dark:text-slate-700"}`} 
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {(product.rating ?? 5.0).toFixed(1)} ({product.reviews ?? 0})
          </span>
        </div>

        {/* Birim Bilgisi */}
        <div className="mb-3.5 flex items-center justify-between text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">
            {tc("unit").toUpperCase()}
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            {unitText}
          </span>
        </div>

        {/* SKU & Barkod Alanı */}
        <div className="mb-4 flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100/80 dark:border-slate-800/80 text-[10px] tracking-wide select-none">
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase text-slate-500 dark:text-slate-400">SKU</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{product.sku}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase text-slate-500 dark:text-slate-400">Barkod</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
              {product.barcode
                || product.attributes?.barcode
                || `868${String(product.sku).replace(/\D/g, "").slice(0, 10).padStart(10, "0")}`}
            </span>
          </div>
        </div>

        {/* Ayırıcı Çizgi */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200/60 dark:via-slate-800/60 to-transparent mb-4" />

        {/* Fiyatlandırma & Stok Bilgisi & Satın Alma Alanı */}
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-end justify-between">
            {/* Fiyat Bilgisi */}
            <div>
              {product.is_b2b_user ? (
                <>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium mb-0.5">
                    Perakende: <span className="line-through text-slate-400 dark:text-slate-500 font-medium">₺{(product.retail_list_price ?? listPriceVal).toLocaleString("tr-TR")}</span>
                  </p>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase mb-0.5">Bayi Özel Fiyatı</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">₺</span>
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold text-2xl tracking-tight leading-none">
                        {(product.b2b_price ?? product.price).toLocaleString("tr-TR")}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {product.is_discounted && (
                    <p className="text-slate-400 dark:text-slate-500 text-sm line-through font-semibold mb-0.5">
                      ₺{listPriceVal.toLocaleString("tr-TR")}
                    </p>
                  )}
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-slate-900 dark:text-white font-bold text-lg">₺</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-2xl tracking-tight leading-none">
                      {product.price.toLocaleString("tr-TR")}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Stok Durumu */}
            {isOutOfStock ? (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full shrink-0">
                <PackageX className="w-3.5 h-3.5" />
                {tc("out_of_stock_badge").toUpperCase()}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full shrink-0">
                <PackageCheck className="w-3.5 h-3.5" />
                {tc("in_stock").toUpperCase()}
              </div>
            )}
          </div>

          {/* Sepete Ekle Butonu */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
              isOutOfStock
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : isAdded
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-450 hover:to-orange-450 text-[#0B0F17] shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40 hover:-translate-y-0.5 active:translate-y-0"
            }`}
            type="button"
          >
            <ShoppingBag className="w-4 h-4" />
            {isAdded ? tc("added") : isOutOfStock ? tc("out_of_stock") : tc("add_to_cart").toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
