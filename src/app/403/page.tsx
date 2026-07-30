"use client";

import Link from "next/link";
import Image from "next/image";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen w-full bg-[#F9F5F1] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-[#6b1d2f]/10 border border-[#6b1d2f]/20 text-[#6b1d2f] flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-4xl">lock_person</span>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full inline-block">
            403 · Yetkisiz Erişim
          </div>
          <h1 className="text-2xl font-bold text-[#1a0a10]">Bu Sayfaya Erişim Yetkiniz Yok</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Görüntülemeye çalıştığınız yönetim paneli alanı yalnızca yetkili yöneticiler ve personel için erişilebilirdir.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            href="/"
            className="w-full py-3.5 bg-gradient-to-r from-[#6b1d2f] to-[#8b2d3f] text-white font-bold rounded-xl shadow-lg shadow-[#6b1d2f]/20 hover:opacity-95 transition-all text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/giris"
            className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors text-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            Farklı Bir Hesapla Giriş Yap
          </Link>
        </div>
      </div>
    </main>
  );
}
