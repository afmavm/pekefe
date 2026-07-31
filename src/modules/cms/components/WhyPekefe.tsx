import React from "react";
import { 
  Award, CheckCircle2, Flame, ShieldCheck, Wind, Package, Microscope, Truck 
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function WhyPekefe() {
  const t = useTranslations("Home");

  return (
    <section id="neden-pekefe" className="py-24 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111827]/10 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* L: Section Copy */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="inline-flex items-center gap-2.5 glass-amber rounded-full px-5 py-2.5 text-xs sm:text-sm font-black text-amber-655 dark:text-amber-450 tracking-[0.15em] uppercase shadow-sm">
              <Award className="w-3.5 h-3.5 text-amber-500" /> {t("why_badge")}
            </span>
            
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
              {t("why_title_1")} <br />
              <span className="text-gradient">{t("why_title_2")}</span> {t("why_title_3")}
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-body">
              {t("why_desc")}
            </p>

            <div className="space-y-4 font-body pt-2">
              {[
                t("why_bullet_1"),
                t("why_bullet_2"),
                t("why_bullet_3"),
                t("why_bullet_4")
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-slate-800 dark:text-zinc-100 text-sm font-semibold">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* R: Features Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl text-left space-y-4 shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                <Flame className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">{t("feature_no_extinguish_title")}</h4>
              <p className="text-slate-550 dark:text-slate-550 text-xs leading-relaxed font-body">
                {t("feature_no_extinguish_desc")}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl text-left space-y-4 shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">{t("feature_stainless_title")}</h4>
              <p className="text-slate-550 dark:text-slate-550 text-xs leading-relaxed font-body">
                {t("feature_stainless_desc")}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl text-left space-y-4 shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                <Wind className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">{t("feature_ergonomic_title")}</h4>
              <p className="text-slate-550 dark:text-slate-550 text-xs leading-relaxed font-body">
                {t("feature_ergonomic_desc")}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl text-left space-y-4 shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                <Package className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">{t("feature_factory_title")}</h4>
              <p className="text-slate-550 dark:text-slate-550 text-xs leading-relaxed font-body">
                {t("feature_factory_desc")}
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
