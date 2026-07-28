"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/modules/catalog/store";
import { 
  Flame, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Star, 
  Microscope 
} from "lucide-react";
import { toast } from "sonner";

interface HomeHeroProps {
  productSmoker: {
    id: string;
    name: string;
    sku: string;
    price: number;
    oldPrice: number;
    image: string | null;
    stock?: number;
  };
}

export default function HomeHero({ productSmoker }: HomeHeroProps) {
  const t = useTranslations("Home");
  const tc = useTranslations("Common");
  const { setIsCartOpen, addItem } = useCartStore();

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const addToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "/Logo.jpg",
      sku: product.sku || "",
      quantity: 1
    });
    toast.success(`${product.name} sepete eklendi!`);
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-24 overflow-hidden bg-zinc-950 text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/uploads/honey_sunset_hero.jpg" 
          alt="ATAK Arıcılık Sunset Hero" 
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.98] dark:opacity-[0.88] transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 via-zinc-950/20 to-transparent z-1" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950 z-2" />
      </div>

      <div className="absolute w-[600px] h-[600px] bg-orange-500/5 rounded-full filter blur-[100px] -top-32 -right-32 pointer-events-none z-1"></div>
      <div className="absolute w-[400px] h-[400px] bg-amber-600/5 rounded-full filter blur-[80px] bottom-0 -left-20 pointer-events-none z-1"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* L: Copy */}
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center gap-2 sm:gap-2.5 bg-zinc-950/65 backdrop-blur-md border border-amber-500/30 rounded-full px-4 py-2 sm:px-5.5 sm:py-3 text-[10px] sm:text-xs font-black text-amber-300 tracking-[0.12em] sm:tracking-[0.16em] uppercase shadow-lg shadow-black/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="leading-none">{t("hero_badge")}</span>
            </div>

            <h1 className="font-display font-bold leading-[1.05] tracking-tight">
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-white">{t("hero_title_1")}</span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-gradient mt-1">{t("hero_title_2")}</span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-white mt-1">{t("hero_title_3")}</span>
            </h1>

            <p className="text-zinc-300 text-base sm:text-lg max-w-lg leading-relaxed font-body">
              {t("hero_desc")}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => handleScrollTo("urunler")}
                className="flex items-center gap-3 bg-orange-500 hover:bg-amber-400 text-[#0B0F17] font-extrabold text-base px-8 py-4.5 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
              >
                <Flame className="w-5 h-5" />
                <span>{t("hero_explore")}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-base px-8 py-4.5 rounded-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>{t("hero_quick_order")}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-4 pt-6 border-t border-zinc-800/80 max-w-xl">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-100"><ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" /> {t("secure_payment")}</div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-100"><Truck className="w-5 h-5 text-amber-400 shrink-0" /> {t("same_day_cargo")}</div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-100"><RotateCcw className="w-5 h-5 text-amber-400 shrink-0" /> {t("returns")}</div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-zinc-100"><Star className="w-5 h-5 text-amber-400 shrink-0" /> {t("reviews_count")}</div>
            </div>
          </div>

          {/* R: Featured Smoker Highlight Card */}
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent rounded-full opacity-60 pointer-events-none filter blur-xl"></div>
            
            <div className="relative bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-black/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-neutral-950 text-xs font-black px-5 py-1.5 rounded-full whitespace-nowrap tracking-wider">
                ⭐ {t("best_seller")}
              </div>

              <div className="bg-gradient-to-br from-slate-900/40 to-slate-950/40 rounded-2xl h-56 flex flex-col items-center justify-center mb-6 border border-zinc-850 relative overflow-hidden group">
                <div className="absolute inset-0 bg-honeycomb opacity-10"></div>
                {(() => {
                  const logoFiles = [
                    "Logo.jpg",
                    "1779016776947-365377533-Logo.jpg",
                    "1779836095322-585290292-Logo.jpg",
                    "1782089456145-zv5143ue6.jpg",
                    "1782255313244-2htzyv7ae.jpg",
                    "1782678055703-rxrd8ozbn.jpg",
                    "1782771313524-51cs7qjdj.jpg"
                  ];

                  const isLogo = (url: string) => {
                    if (!url) return false;
                    return logoFiles.some(logo => url.includes(logo)) || url.toLowerCase().includes("logo");
                  };

                  let target = productSmoker.image || "";
                  if (isLogo(target) && (productSmoker as any).images) {
                    const parsed = Array.isArray((productSmoker as any).images) 
                      ? (productSmoker as any).images 
                      : (typeof (productSmoker as any).images === 'string' ? JSON.parse((productSmoker as any).images) : []);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      const nonLogo = parsed.find((img: string) => !isLogo(img));
                      if (nonLogo) target = nonLogo;
                    }
                  }

                  let clean = target.trim();
                  if (clean.startsWith("public/uploads/")) {
                    clean = clean.replace("public/uploads/", "/uploads/");
                  } else if (clean.startsWith("/public/uploads/")) {
                    clean = clean.replace("/public/uploads/", "/uploads/");
                  }
                  const finalSrc = (clean.startsWith("http") || clean.startsWith("/") || clean.startsWith("data:")) ? clean : "/" + clean;

                  return (
                    <Image
                      src={finalSrc}
                      alt={productSmoker.name || "ATAK Arı Körüğü"}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 384px"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  );
                })()}
              </div>

              <h3 className="font-display font-bold text-white text-xl leading-tight mb-1">{productSmoker.name}</h3>
              <p className="text-zinc-400 text-sm mb-4">{t("no_extinguish")}</p>

              <div className="flex items-end justify-between mb-6">
                <div>
                  {productSmoker.oldPrice > productSmoker.price && (
                    <span className="text-zinc-550 line-through text-sm">₺{productSmoker.oldPrice}</span>
                  )}
                  <div className="text-gradient font-display font-bold text-3xl leading-none mt-1">₺{productSmoker.price}</div>
                </div>
                {productSmoker.oldPrice > productSmoker.price && (
                  <span className="bg-orange-500/10 text-amber-400 border border-amber-500/20 rounded-xl px-3 py-1.5 text-xs font-extrabold">
                    %{Math.round(((productSmoker.oldPrice - productSmoker.price) / productSmoker.oldPrice) * 100)} İndirim
                  </span>
                )}
              </div>

              {productSmoker.stock !== undefined && productSmoker.stock <= 0 ? (
                <button 
                  disabled
                  className="w-full bg-zinc-800 text-zinc-500 border border-zinc-700/50 font-extrabold text-sm py-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>{tc("out_of_stock_badge")}</span>
                </button>
              ) : (
                <button 
                  onClick={() => addToCart(productSmoker)}
                  className="w-full bg-orange-500 hover:bg-amber-400 text-[#0B0F17] font-extrabold text-sm py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-amber-500/10 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>{t("add_to_cart")}</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Micro Stats Bar */}
        <div className="mt-20 grid grid-cols-3 gap-6 border-t border-zinc-800 pt-12 text-center">
          <div>
            <div className="font-display font-bold text-3xl sm:text-4xl text-gradient">3.500+</div>
            <div className="text-zinc-400 text-xs sm:text-sm mt-1 font-body">{t("stats_happy_beekeepers")}</div>
          </div>
          <div className="border-x border-zinc-800">
            <div className="font-display font-bold text-3xl sm:text-4xl text-gradient">2021</div>
            <div className="text-zinc-400 text-xs sm:text-sm mt-1 font-body">{t("stats_founded_year")}</div>
          </div>
          <div>
            <div className="font-display font-bold text-3xl sm:text-4xl text-gradient">%100</div>
            <div className="text-zinc-400 text-xs sm:text-sm mt-1 font-body">{t("stats_local_production")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
