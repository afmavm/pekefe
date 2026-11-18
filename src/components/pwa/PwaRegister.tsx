'use client';

import { useEffect, useState } from 'react';

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => {
            // Service worker successfully registered
          })
          .catch((err) => {
            console.warn('PWA Service Worker registration skipped:', err);
          });
      });
    }

    // 2. Check if already running in standalone mode (installed)
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    // 3. Listen for beforeinstallprompt (Desktop Chrome/Edge & Android Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      const dismissed = localStorage.getItem('pekefe_pwa_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowToast(true), 4000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowToast(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowToast(false);
  };

  const handleDismiss = () => {
    setShowToast(false);
    try {
      localStorage.setItem('pekefe_pwa_dismissed', 'true');
    } catch (e) {}
  };

  if (isInstalled || !showToast || !isInstallable) return null;

  return (
    <aside
      aria-label="Uygulama Yükleme Bildirimi"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-[#6b1d2f]/15 dark:border-amber-400/20 shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-white border border-stone-200/60 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          <img
            src="/logo.png"
            alt="PEKEFE Firma Logosu"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug">
            PEKEFE Uygulamasını Yükleyin
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
            Masaüstünüzde veya ana ekranınızda bağımsız uygulama olarak hemen kullanın.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-[#6b1d2f] hover:bg-[#521624] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Uygulamayı Yükle
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 text-xs font-medium transition-colors cursor-pointer"
            >
              Daha Sonra
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
          aria-label="Kapat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
