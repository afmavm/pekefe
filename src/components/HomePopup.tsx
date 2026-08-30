"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCMS } from "@/context/CMSContext";
import { X, Copy, Check, Clock, Gift } from "lucide-react";
import { Link } from "@/navigation";

export default function HomePopup() {
  const { cmsData } = useCMS();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (cmsData?.popupConfig) {
      try {
        const parsed = typeof cmsData.popupConfig === 'string'
          ? JSON.parse(cmsData.popupConfig)
          : cmsData.popupConfig;
          
        setConfig(parsed);
        
        if (!parsed.isActive) {
          setIsOpen(false);
          return;
        }

        // Check target page rules if defined
        if (parsed.targetPage === "home_only" && typeof window !== "undefined") {
          const path = window.location.pathname;
          // check if home page
          const isHome = path === "/" || path === "/tr" || path === "/en" || path === "";
          if (!isHome) return;
        }

        // Frequency check
        const freq = parsed.displayFrequency || "once_per_session";
        if (freq === "once_per_session" && sessionStorage.getItem('homePopupDismissed')) {
          return;
        }
        if (freq === "once_per_day") {
          const lastShown = localStorage.getItem('homePopupLastShown');
          if (lastShown) {
            const diffHours = (Date.now() - Number(lastShown)) / (1000 * 60 * 60);
            if (diffHours < 24) return;
          }
        }

        // Delay timer
        const delayMs = (parsed.showDelay !== undefined ? Number(parsed.showDelay) : 2) * 1000;
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem('homePopupLastShown', String(Date.now()));
        }, delayMs);

        return () => clearTimeout(timer);
      } catch (e) {
        console.error("Error parsing popupConfig", e);
      }
    }
  }, [cmsData?.popupConfig]);

  // Countdown timer effect
  useEffect(() => {
    if (!config?.countdownEnabled || !config?.countdownEndDate) return;

    const targetDate = new Date(config.countdownEndDate).getTime();
    if (isNaN(targetDate)) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      if (diff === 0) {
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [config?.countdownEnabled, config?.countdownEndDate]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('homePopupDismissed', 'true');
  };

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (config?.couponCode) {
      navigator.clipboard.writeText(config.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />
      
      <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden w-full max-w-3xl flex flex-col md:flex-row z-10 animate-in zoom-in-95 duration-400">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/90 backdrop-blur-md hover:bg-white text-slate-500 hover:text-red-600 rounded-full flex items-center justify-center shadow-md transition group"
        >
          <X className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Image Section */}
        {config.imageUrl && (
          <div className="md:w-1/2 h-56 md:h-auto relative min-h-[220px]">
            <Image 
              src={config.imageUrl} 
              alt={config.title || "Kampanya"} 
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 md:to-transparent md:from-black/5" />
          </div>
        )}

        {/* Content Section */}
        <div className={`p-8 md:p-10 flex flex-col justify-center ${config.imageUrl ? 'md:w-1/2' : 'w-full text-center items-center'}`}>
          
          {/* Badge */}
          {config.badge && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-black text-amber-900 bg-amber-100 rounded-full w-max mb-3 border border-amber-200">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              {config.badge}
            </span>
          )}

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2.5 tracking-tight leading-tight">
            {config.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-600 font-medium leading-relaxed mb-5">
            {config.description}
          </p>
          
          {/* Countdown Timer */}
          {config.countdownEnabled && timeLeft && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 text-center">
              <div className="text-[10px] font-extrabold text-amber-900 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Teklif Bitişine Kalan Süre:</span>
              </div>
              <div className="flex items-center justify-center gap-2 font-mono text-sm font-black text-amber-950">
                <div className="bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-sm">{String(timeLeft.hours).padStart(2, '0')}sa</div>:
                <div className="bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-sm">{String(timeLeft.minutes).padStart(2, '0')}dk</div>:
                <div className="bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-sm">{String(timeLeft.seconds).padStart(2, '0')}sn</div>
              </div>
            </div>
          )}

          {/* Coupon Code Banner */}
          {config.couponCode && (
            <div 
              onClick={handleCopyCoupon}
              className="bg-amber-50/80 hover:bg-amber-100/80 border-2 border-dashed border-amber-300 rounded-xl p-3 mb-5 flex items-center justify-between cursor-pointer transition shadow-sm group"
            >
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">İndirim Kodu:</span>
                <span className="font-mono font-black text-sm text-amber-950 tracking-wider">{config.couponCode}</span>
              </div>
              <button 
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  copied ? "bg-emerald-600 text-white" : "bg-white text-slate-800 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Kopyalandı!" : "Kodu Kopyala"}</span>
              </button>
            </div>
          )}

          {/* Action Button */}
          {config.buttonText && config.buttonLink && (
            <Link 
              href={config.buttonLink}
              onClick={handleClose}
              className="inline-flex items-center justify-center px-6 py-3.5 font-bold text-white rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-sm"
              style={{ backgroundColor: cmsData?.primaryColor || '#b45309' }}
            >
              {config.buttonText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
