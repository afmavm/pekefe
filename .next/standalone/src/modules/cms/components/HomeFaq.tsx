"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { HelpCircle, Plus } from "lucide-react";

export default function HomeFaq() {
  const t = useTranslations("Home");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="sss" className="py-24 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-[#111827]/5 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2.5 glass-amber rounded-full px-5 py-2.5 text-xs sm:text-sm font-black text-amber-655 dark:text-amber-450 tracking-[0.15em] uppercase mb-4 shadow-sm">
            <HelpCircle className="w-3.5 h-3.5" /> {t("sss_badge")}
          </span>
          <h2 className="font-display font-bold text-4xl text-slate-900 dark:text-white leading-tight">
            {t("sss_title_1")} <span className="text-gradient">{t("sss_title_2")}</span>
          </h2>
        </div>

        <div className="space-y-3 font-body">
          {[
            { q: t("faq_q1"), a: t("faq_a1") },
            { q: t("faq_q2"), a: t("faq_a2") },
            { q: t("faq_q3"), a: t("faq_a3") },
            { q: t("faq_q4"), a: t("faq_a4") },
            { q: t("faq_q5"), a: t("faq_a5") },
            { q: t("faq_q6"), a: t("faq_a6") }
          ].map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-amber-600 dark:text-white dark:hover:text-amber-400 transition-colors"
              >
                <span className="text-sm sm:text-base">{faq.q}</span>
                <Plus className={`w-4 h-4 text-amber-655 dark:text-amber-400 transition-transform ${openFaq === idx ? "rotate-45" : ""}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-150 dark:border-slate-800/60 animate-fade-up">
                  <p className="text-slate-800 dark:text-zinc-100 text-sm font-medium leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
