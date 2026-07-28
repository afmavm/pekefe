"use client";

import React, { useState } from "react";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export default function InteractiveHotspots() {
  const t = useTranslations("Home");
  const [activeHotspot, setActiveHotspot] = useState(1);

  const hotspotsData: { [key: number]: { title: string; desc: string } } = {
    1: {
      title: t("hotspot_1_title"),
      desc: t("hotspot_1_desc")
    },
    2: {
      title: t("hotspot_2_title"),
      desc: t("hotspot_2_desc")
    },
    3: {
      title: t("hotspot_3_title"),
      desc: t("hotspot_3_desc")
    },
    4: {
      title: t("hotspot_4_title"),
      desc: t("hotspot_4_desc")
    },
    5: {
      title: t("hotspot_5_title"),
      desc: t("hotspot_5_desc")
    }
  };

  const positions = [
    "top-[50%] left-[30%]",
    "top-[65%] left-[45%]",
    "top-[50%] left-[80%]",
    "top-[35%] left-[20%]",
    "top-[10%] left-[50%]"
  ];

  return (
    <section id="teknik-detay" className="py-24 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-[#111827]/5 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 max-w-xl mx-auto">
          <span className="inline-flex items-center gap-2.5 glass-amber rounded-full px-5 py-2.5 text-xs sm:text-sm font-black text-amber-655 dark:text-amber-450 tracking-[0.15em] uppercase mb-4 shadow-sm">
            <Settings className="w-3.5 h-3.5" /> {t("hotspot_section_badge")}
          </span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
            {t("hotspot_section_title_1")} <span className="text-gradient">{t("hotspot_section_title_2")}</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-4 leading-relaxed font-body">
            {t("hotspot_section_desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* L: SVG Schematic */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative bg-slate-100 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-800 rounded-3xl p-4 sm:p-10 w-full max-w-md aspect-square flex items-center justify-center shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-honeycomb opacity-5"></div>
              
              <div className="relative w-full max-w-[280px] sm:w-80 h-[280px] sm:h-[380px] flex items-center justify-center z-10">
                <svg viewBox="0 0 200 300" className="w-full h-full text-slate-300/30 dark:text-slate-400/20 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <rect x="50" y="80" width="100" height="180" rx="15" stroke="#9ca3af" strokeWidth="2" fill="none" strokeDasharray="4 2" opacity="0.4"/>
                  <rect x="60" y="90" width="80" height="160" rx="10" stroke="#f59e0b" strokeWidth="2.5" fill="none" opacity="0.8"/>
                  <path d="M60 90 L100 20 L140 90 Z" stroke="#9ca3af" strokeWidth="2" fill="none" opacity="0.6"/>
                  <path d="M160 110 L190 120 L190 220 L160 230 Z" stroke="#9ca3af" strokeWidth="1.5" fill="none" opacity="0.5"/>
                  <path d="M150 120 L160 125 M150 140 L160 145 M150 160 L160 165 M150 180 L160 185 M150 200 L160 205 M150 220 L160 225" stroke="#9ca3af" strokeWidth="1.5"/>
                  <path d="M150 210 L135 210" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="100" cy="15" r="8" stroke="#9ca3af" strokeWidth="2" fill="none" opacity="0.5"/>
                </svg>

                {/* Hotspots */}
                {[1, 2, 3, 4, 5].map(idx => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setActiveHotspot(idx)}
                    className={`absolute w-8 h-8 rounded-full text-white border border-amber-500 font-bold text-xs flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${positions[idx - 1]} ${activeHotspot === idx ? "active-hotspot" : "bg-orange-500/20"}`}
                  >
                    {idx}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* R: Detail box */}
          <div className="lg:col-span-6 flex flex-col justify-center font-body">
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-amber-500/25 rounded-3xl p-10 min-h-[380px] flex flex-col justify-between relative shadow-md shadow-slate-100 dark:shadow-none">
              <div className="absolute inset-0 bg-honeycomb opacity-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-11 h-11 rounded-2xl bg-orange-500 text-neutral-950 font-display font-extrabold text-base flex items-center justify-center shadow-md">
                    {activeHotspot}
                  </span>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl sm:text-3xl">
                    {hotspotsData[activeHotspot].title}
                  </h3>
                </div>
                <p className="text-slate-800 dark:text-zinc-100 text-base sm:text-lg font-medium leading-relaxed transition-all duration-300 text-left">
                  {hotspotsData[activeHotspot].desc}
                </p>
              </div>

              <div className="flex items-center gap-2.5 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 relative z-10">
                {[1, 2, 3, 4, 5].map(idx => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => setActiveHotspot(idx)}
                    className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${activeHotspot === idx ? "bg-orange-500 w-7" : "bg-slate-300 dark:bg-slate-700"}`}
                  ></button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
