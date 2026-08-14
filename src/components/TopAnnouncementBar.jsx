"use client";

import { useCMS } from "@/context/CMSContext";
import { Phone, MessageCircle, Sparkles, ShieldCheck, Truck, Star, Package, Clock, Award, Tag, Zap } from "lucide-react";

const ICON_MAP = {
  truck: Truck,
  shield: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  package: Package,
  clock: Clock,
  award: Award,
  tag: Tag,
  zap: Zap,
  phone: Phone,
};

const DEFAULT_ITEMS = [
  { id: "1", text: "Türkiye'nin Her Yerine Güvenli Sevkiyat", icon: "truck", enabled: true },
  { id: "2", text: "%100 Doğal ve Tescilli Lezzet", icon: "shield", enabled: true },
];

export default function TopAnnouncementBar() {
  const { cmsData } = useCMS();

  const isBarActive = cmsData?.announcementActive;
  if (isBarActive === false || isBarActive === "false" || isBarActive === 0 || isBarActive === "0") {
    return null;
  }

  const showAnn1 = cmsData?.announcement1Enabled !== false && cmsData?.announcement1Enabled !== "false" && cmsData?.announcement1Enabled !== 0;
  const showAnn2 = cmsData?.announcement2Enabled !== false && cmsData?.announcement2Enabled !== "false" && cmsData?.announcement2Enabled !== 0;
  const showPhone = cmsData?.contactPhoneEnabled !== false && cmsData?.contactPhoneEnabled !== "false" && cmsData?.contactPhoneEnabled !== 0;
  const showWhatsapp = cmsData?.socialWhatsappEnabled !== false && cmsData?.socialWhatsappEnabled !== "false" && cmsData?.socialWhatsappEnabled !== 0;

  const text1 = showAnn1 ? (cmsData?.announcement !== undefined ? cmsData.announcement : "Tüm Türkiye'ye Aynı Gün Kargo ve Fabrika Fiyatları!") : "";
  const text2 = showAnn2 ? (cmsData?.announcement2 !== undefined ? cmsData.announcement2 : "🔥 %100 Yerli İmalat Paslanmaz Arı Körükleri ve Ekipmanları") : "";
  const phone = showPhone ? (cmsData?.contactPhone || "0544 149 48 51") : "";
  const whatsapp = showWhatsapp ? (cmsData?.socialWhatsapp || "05441494851") : "";

  // Parse topBarItems from cmsData
  let topBarItems = DEFAULT_ITEMS;
  try {
    const raw = cmsData?.topBarItems;
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) {
        topBarItems = parsed;
      }
    }
  } catch {}

  const enabledItems = topBarItems.filter((item) => item.enabled !== false);

  return (
    <div className="bg-gradient-to-r from-[#6b1d2f] via-[#8b2d3f] to-[#521321] text-white text-xs py-2 px-4 shadow-sm border-b border-amber-500/20 z-50">
      <div className="max-w-container-max mx-auto flex items-center justify-between gap-4 font-semibold">
        
        {/* Left: Dynamic top bar items */}
        {enabledItems.length > 0 && (
          <div className="hidden lg:flex items-center gap-4 text-[11px] text-amber-200/90 shrink-0">
            {enabledItems.map((item, idx) => {
              const IconComp = ICON_MAP[item.icon] || Sparkles;
              return (
                <span key={item.id || idx} className={`flex items-center gap-1.5 ${idx === 0 ? "bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10" : ""}`}>
                  <IconComp className={`w-3.5 h-3.5 ${idx === 0 ? "text-amber-400" : "text-emerald-400"}`} />
                  {item.text}
                </span>
              );
            })}
          </div>
        )}

        {/* Center: Dynamic Announcement */}
        {(text1 || text2) && (
          <div className="flex-1 overflow-hidden text-center text-xs tracking-wide font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
            {text1 && <span className="truncate">{text1}</span>}
            {text2 && (
              <span className="hidden md:inline-block text-amber-200/80 font-normal">
                {text1 ? `• ${text2}` : text2}
              </span>
            )}
          </div>
        )}

        {/* Right: Contact & WhatsApp */}
        {(phone || whatsapp) && (
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
        )}

      </div>
    </div>
  );
}
