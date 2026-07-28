"use client";

import { useState } from "react";
import { Lock, Zap, Check, RefreshCw, Star, Hammer, ClipboardList, Shield } from "lucide-react";
import { toast } from "sonner";
import { upgradeCompanyToProAction } from "@/modules/cms/super-admin/superActions";

interface UpgradeGateProps {
  moduleName: string;
  moduleKey: string;
  description?: string;
  icon?: React.ElementType;
}

export default function UpgradeGate({ 
  moduleName, 
  moduleKey,
  description = "Bu modüle ve diğer tüm gelişmiş ERP özelliklerine erişmek için şirketinizi PRO pakete yükseltebilirsiniz.",
  icon: Icon = Lock
}: UpgradeGateProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    
    // Simulate a premium card processing delay (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const result = await upgradeCompanyToProAction();
      if (result.success) {
        setSuccess(true);
        toast.success("Tebrikler! Şirketiniz başarıyla PRO pakete yükseltildi.");
        
        // Wait 1 second to let user see the success check animation, then reload
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err.message || "Yükseltme işlemi sırasında bir hata oluştu.");
      setUpgrading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6 my-12 animate-fade-in">
      <div className="w-full max-w-[580px] bg-white border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-100/50 p-8 md:p-10 text-center relative overflow-hidden">
        {/* Decorative Background Blob */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Icon Badge */}
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 rounded-2xl flex items-center justify-center mx-auto shadow-sm relative">
            <Icon className="w-7 h-7 text-amber-600 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-600 text-white rounded-md shadow">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          {/* Text Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-widest">
              <Star className="w-3.5 h-3.5 fill-current" />
              PRO Paket Özelliği
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              {moduleName} Modülü Kilitli
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
              {description}
            </p>
          </div>

          {/* Premium List of Pro Perks */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5 max-w-md mx-auto">
            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-600">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Gelişmiş Üretim Planlama & Reçete Yönetimi (MRP)</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-600">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Ön Muhasebe & Banka API Entegrasyonları</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-600">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Antigravity Akıllı AI Patron Asistanı (NL2SQL)</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-600">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Sınırsız Bayi, Personel ve Depo Kaydı</span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            {success ? (
              <button
                disabled
                className="w-full max-w-xs py-3.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Yükseltildi!
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full max-w-xs py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {upgrading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> İşleniyor...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" /> PRO'ya Yükselt
                  </>
                )}
              </button>
            )}
            <p className="text-[10px] text-slate-400 font-medium mt-3">
              30 gün para iade garantisi. İstediğiniz zaman iptal edebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
