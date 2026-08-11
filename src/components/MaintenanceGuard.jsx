"use client";

import { useCMS } from "@/context/CMSContext";
import { useSession } from "next-auth/react";
import { Wrench, Phone, Mail, ShieldAlert, Sparkles } from "lucide-react";
import Image from "next/image";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { cmsData } = useCMS();
  const { data: session } = useSession();

  const isMaintenanceMode = cmsData?.maintenanceMode === true;
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "admin";

  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#4a1320] to-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl space-y-6 animate-in zoom-in-95 duration-500">
          
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-xl flex items-center justify-center">
              <Image src="/logo.png" alt="PEKEFE" width={70} height={70} className="w-auto h-12 object-contain" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-xs font-bold text-amber-300">
            <Wrench className="w-3.5 h-3.5 animate-spin" />
            <span>Sistem Güncelleniyor</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {cmsData?.siteName || "PEKEFE Geleneksel & Doğal Lezzetler"}
            </h1>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Sizlere daha iyi hizmet verebilmek için sitemizde kısa süreli bir bakım ve altyapı iyileştirmesi yapılmaktadır.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-2 text-slate-300 text-left">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>İletişim & Destek</span>
            </div>
            {cmsData?.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>Telefon: <strong>{cmsData.contactPhone}</strong></span>
              </div>
            )}
            {cmsData?.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>E-posta: <strong>{cmsData.contactEmail}</strong></span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            Anlayışınız için teşekkür ederiz. Çok kısa süre içinde tekrar yayında olacağız!
          </p>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}
