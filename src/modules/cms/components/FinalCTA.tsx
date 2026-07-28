"use client";

import React from "react";
import Image from "next/image";
import { ShoppingBag, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/modules/catalog/store";

interface FinalCTAProps {
  whatsappUrl: string;
}

export default function FinalCTA({ whatsappUrl }: FinalCTAProps) {
  const t = useTranslations("Home");
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden bg-zinc-950 text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/uploads/beekeeping_harvest_process.jpg" 
          alt="ATAK Arıcılık Hasat Süreci" 
          fill
          sizes="100vw"
          className="object-cover opacity-[0.95] dark:opacity-[0.82] transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950 z-1" />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <span className="inline-flex items-center gap-2 bg-red-500/15 border border-red-500/25 rounded-full px-4 py-2 text-xs font-black text-red-400 tracking-wider uppercase">
          🔥 {t("cta_badge")}
        </span>

        <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
          {t("cta_title_1")} <span className="text-gradient">{t("cta_title_2")}</span>
        </h2>

        <p className="text-zinc-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {t("cta_desc")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-amber-400 text-[#0B0F17] font-extrabold text-lg px-8 py-5 rounded-2xl transition-all duration-300 shadow-md hover:shadow-amber-500/20 cursor-pointer"
          >
            <ShoppingBag className="w-5.5 h-5.5" />
            <span>{t("cta_quick_order")}</span>
          </button>
          <a 
            href={whatsappUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-lg px-8 py-5 rounded-2xl transition-all duration-300 shadow-md hover:shadow-emerald-500/10"
          >
            <Phone className="w-5.5 h-5.5" />
            <span>{t("cta_whatsapp")}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
