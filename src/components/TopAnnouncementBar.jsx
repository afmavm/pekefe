"use client";

import { useCMS } from "@/context/CMSContext";
import { Phone, MessageCircle, Sparkles, ShieldCheck, Truck } from "lucide-react";

export default function TopAnnouncementBar() {
  const { cmsData } = useCMS();

  if (cmsData?.announcementActive === false) {
    return null;
  }

  const text1 = cmsData?.announcement || "Tüm Türkiye'ye Aynı Gün Kargo ve Fabrika Fiyatları!";
  const text2 = cmsData?.announcement2 || "🔥 %100 Yerli İmalat Paslanmaz Arı Körükleri ve Ekipmanları";
  const subText = cmsData?.topBarText1 || "Türkiye'nin Her Yerine Güvenli Sevkiyat";
  const phone = cmsData?.contactPhone || "0534 270 91 40";
  const whatsapp = cmsData?.socialWhatsapp || "905342709140";

  return (
    <div className="bg-gradient-to-r from-[#6b1d2f] via-[#8b2d3f] to-[#521321] text-white text-xs py-2 px-4 shadow-sm border-b border-amber-500/20 z-50">
      <div className="max-w-container-max mx-auto flex items-center justify-between gap-4 font-semibold">
        
        {/* Left: Shipping / Guarantee badge */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-amber-200/90 shrink-0">
          <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            {subText}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            %100 Doğal ve Tescilli Lezzet
          </span>
        </div>

        {/* Center: Dynamic Announcement */}
        <div className="flex-1 overflow-hidden text-center text-xs tracking-wide font-bold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span className="truncate">{text1}</span>
          {text2 && (
            <span className="hidden md:inline-block text-amber-200/80 font-normal">
              • {text2}
            </span>
          )}
        </div>

        {/* Right: Contact & WhatsApp */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 text-[11px]">
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 text-white/90 hover:text-amber-300 transition">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>{phone}</span>
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold transition shadow-sm"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
