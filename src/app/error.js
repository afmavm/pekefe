"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Error({ error, reset }) {
  const isChunkError =
    typeof error?.message === "string" &&
    (error.message.includes("Loading chunk") ||
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.name === "ChunkLoadError");

  useEffect(() => {
    console.error("Platform Error caught:", error);

    if (isChunkError && typeof window !== "undefined") {
      try {
        const lastReload = Number(sessionStorage.getItem("pekefe_chunk_reload") || 0);
        if (Date.now() - lastReload > 15000) {
          sessionStorage.setItem("pekefe_chunk_reload", String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <main className="flex-1 flex items-center justify-center py-section-gap px-margin-mobile md:px-margin-desktop">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-error/10 text-error mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div className="space-y-3">
            <span className="text-secondary font-label-md text-sm uppercase tracking-[0.2em] font-semibold block">
              Bir Aksaklık Oluştu
            </span>
            <h1 className="font-display-lg text-3xl md:text-headline-lg text-primary font-bold">
              Beklenmeyen Bir Durumla Karşılaştık
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
              İsteğinizi işlerken bir sorun meydana geldi. Lütfen tekrar deneyin veya ana sayfaya dönün.
            </p>
            {error?.message && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-left max-w-lg mx-auto overflow-auto font-mono shadow-inner">
                <strong>Hata Detayı:</strong> {error.message}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                if (isChunkError && typeof window !== "undefined") {
                  window.location.reload();
                } else {
                  reset();
                }
              }}
              className="bg-primary text-white px-8 py-4 rounded-xl font-label-md uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Yeniden Dene
            </button>
            <Link
              href="/"
              className="bg-surface-container-high border border-outline-variant/30 text-on-surface px-8 py-4 rounded-xl font-label-md uppercase tracking-wider hover:bg-surface-container-highest transition-all active:scale-95"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
