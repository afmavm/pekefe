"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/navigation";
import { ArrowRight, ShieldCheck, UserCheck, LogIn } from "lucide-react";

interface HomeHeroClientProps {
  primaryColor: string;
  buttonText: string;
  b2bButtonText: string;
}

export default function HomeHeroClient({
  primaryColor,
  buttonText,
  b2bButtonText
}: HomeHeroClientProps) {
  const { data: session } = useSession();

  const isUser = !!session?.user;
  const isApprovedDealer = 
    session?.user && 
    ((session.user as any).role === "ADMIN" || (session.user as any).isApproved === true);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
      {/* Ürünleri Keşfet Butonu */}
      <Link 
        href="/products" 
        className="px-10 py-4.5 text-white font-black rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all tracking-wide text-[15px] w-full sm:w-auto flex items-center justify-center gap-2.5 shadow-xl shadow-red-950/20"
        style={{ backgroundColor: primaryColor }}
      >
        {buttonText} <ArrowRight className="w-5 h-5 animate-pulse" />
      </Link>

      {/* Bayi Durum Butonları */}
      {isUser ? (
        isApprovedDealer ? (
          <Link 
            href="/b2b-portal" 
            className="px-10 py-4.5 bg-neutral-900 border border-neutral-800 text-white font-black rounded-2xl hover:bg-neutral-800 active:scale-[0.98] transition-all tracking-wide text-[15px] w-full sm:w-auto flex items-center justify-center gap-2.5 shadow-lg"
          >
            <UserCheck className="w-5 h-5 text-emerald-400" /> Toptan B2B Portalı
          </Link>
        ) : (
          <Link 
            href="/account" 
            className="px-10 py-4.5 bg-neutral-900 border border-neutral-800 text-white font-black rounded-2xl hover:bg-neutral-800 active:scale-[0.98] transition-all tracking-wide text-[15px] w-full sm:w-auto flex items-center justify-center gap-2.5 shadow-lg"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400 animate-pulse" /> Onay Bekleyen Bayilik
          </Link>
        )
      ) : (
        <>
          {/* Bayi Başvurusu Yap Butonu */}
          <Link 
            href="/kayit" 
            className="px-10 py-4.5 bg-white border border-zinc-200 text-zinc-800 font-black rounded-2xl hover:bg-zinc-50 active:scale-[0.98] transition-all tracking-wide text-[15px] w-full sm:w-auto flex items-center justify-center gap-2.5 shadow-sm shadow-zinc-200"
          >
            {b2bButtonText}
          </Link>

          {/* Bayi Girişi Yap Butonu */}
          <Link 
            href="/giris" 
            className="px-10 py-4.5 bg-neutral-900 border border-neutral-800 text-white font-black rounded-2xl hover:bg-neutral-800 active:scale-[0.98] transition-all tracking-wide text-[15px] w-full sm:w-auto flex items-center justify-center gap-2.5 shadow-lg"
          >
            <LogIn className="w-4.5 h-4.5 text-zinc-400" /> Giriş Yap
          </Link>
        </>
      )}
    </div>
  );
}
