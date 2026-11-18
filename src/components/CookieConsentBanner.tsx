"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, SlidersHorizontal, X, Check } from "lucide-react";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "pekefe_cookie_consent_v1";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: false,
    timestamp: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      }
    } catch {
      setVisible(true);
    }

    const handleOpenSettings = () => {
      setShowDetails(true);
      setVisible(true);
    };
    window.addEventListener("pekefe_open_cookie_settings", handleOpenSettings);
    return () => window.removeEventListener("pekefe_open_cookie_settings", handleOpenSettings);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const finalPrefs: CookiePreferences = {
      ...prefs,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPrefs));
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(
        JSON.stringify({ a: finalPrefs.analytics, m: finalPrefs.marketing })
      )}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(
        new CustomEvent("pekefe_cookie_consent_updated", { detail: finalPrefs })
      );
    } catch {}
    setPreferences(finalPrefs);
    setVisible(false);
    setShowDetails(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSaveSelected = () => {
    saveConsent(preferences);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Çerez ve KVKK Aydınlatma Tercihleri"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 z-[95] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Sol: Metin */}
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>KVKK &amp; Çerez (Cookie) Aydınlatma Tercihleri</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                PEKEFE olarak 6698 sayılı KVKK kapsamında; sepetinizin korunması, güvenli ödeme (PayTR 3D Secure) ve alışveriş deneyiminizin iyileştirilmesi için çerezler kullanıyoruz. Detaylı bilgi için{" "}
                <Link href="/gizlilik" className="text-[#6b1d2f] dark:text-amber-400 font-bold underline hover:opacity-80">
                  Gizlilik ve KVKK Aydınlatma Metni
                </Link>{" "}
                sayfamızı inceleyebilirsiniz.
              </p>
            </div>
          </div>

          {/* Sağ: Aksiyon Butonları */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tercihleri Yönet</span>
            </button>

            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Sadece Zorunlular
            </button>

            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6b1d2f] hover:bg-[#831843] text-white text-xs font-extrabold shadow-md shadow-[#6b1d2f]/20 transition flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Check className="w-4 h-4" />
              <span>Tümünü Kabul Et</span>
            </button>
          </div>
        </div>

        {/* Detaylı Tercih Paneli */}
        {showDetails && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Zorunlu Çerezler */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">Zorunlu Oturum Çerezleri</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Her Zaman Aktif</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sepet yönetimi, üye girişi ve 256-bit SSL güvenli ödeme işlemleri için teknik olarak zorunludur.
                </p>
              </div>

              {/* Analitik Çerezler */}
              <label className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-2 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">Performans &amp; Analitik</span>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#6b1d2f] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sayfa hızını ve ziyaretçi trafiğini anonim olarak ölçümleyerek mağaza deneyimini geliştirmemizi sağlar.
                </p>
              </label>

              {/* Pazarlama Çerezleri */}
              <label className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-2 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">Kampanya &amp; Kişiselleştirme</span>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#6b1d2f] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Yeni hasat dönemleri ve size özel yöresel lezzet kampanyalarını sunmamıza yardımcı olur.
                </p>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSelected}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer border-none"
              >
                Seçimlerimi Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
