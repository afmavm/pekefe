import React from "react";
import { Settings, Truck, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TrustStrip() {
  const t = useTranslations("Home");

  return (
    <section className="py-14 border-y border-slate-200 dark:border-slate-800/60 bg-slate-100/30 dark:bg-[#111827]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="flex items-center gap-5 p-7 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/85 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 rounded-3xl transition-all duration-300">
            <div className="w-14 h-14 bg-orange-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Settings className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-snug">{t("trust_factory_title")}</h4>
              <p className="text-slate-600 dark:text-zinc-300 text-sm mt-1 leading-relaxed">{t("trust_factory_desc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-7 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/85 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 rounded-3xl transition-all duration-300">
            <div className="w-14 h-14 bg-orange-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-snug">{t("trust_shipping_title")}</h4>
              <p className="text-slate-600 dark:text-zinc-300 text-sm mt-1 leading-relaxed">{t("trust_shipping_desc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-7 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/85 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 rounded-3xl transition-all duration-300">
            <div className="w-14 h-14 bg-orange-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <RotateCcw className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-snug">{t("trust_returns_title")}</h4>
              <p className="text-slate-600 dark:text-zinc-300 text-sm mt-1 leading-relaxed">{t("trust_returns_desc")}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
