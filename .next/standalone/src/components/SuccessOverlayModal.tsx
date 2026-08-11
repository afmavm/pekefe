"use client";

import React from "react";
import { CheckCircle2, Truck, Phone, Send } from "lucide-react";
import { useTranslations } from "next-intl";

interface SuccessOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  createdOrderId: string | null;
  whatsappUrl: string;
}

export default function SuccessOverlayModal({ 
  isOpen, 
  onClose, 
  createdOrderId, 
  whatsappUrl 
}: SuccessOverlayModalProps) {
  const t = useTranslations("Home");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-[#0B0F17]/90 backdrop-blur-sm"></div>
      
      <div className="relative glass border border-emerald-500/20 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center shadow-2xl shadow-emerald-500/10 z-10 animate-fade-up">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>

        <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-400 uppercase mb-4">
          ✓ Sipariş Alındı
        </span>

        <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl sm:text-3xl mb-3">Tebrikler!</h3>
        <p className="text-slate-655 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 font-body">
          Siparişiniz başarıyla sisteme kaydedildi! <br />
          Sipariş ID: <strong className="text-amber-600 dark:text-amber-400 font-mono">{createdOrderId}</strong>
        </p>

        <div className="glass border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 mb-6 text-left space-y-3 font-body text-xs sm:text-sm text-slate-655 dark:text-zinc-400">
          <div className="flex items-center gap-2.5"><Truck className="w-4.5 h-4.5 text-amber-500 shrink-0" /> Aynı gün kargoya teslim edilecektir.</div>
          <div className="flex items-center gap-2.5"><Phone className="w-4.5 h-4.5 text-amber-500 shrink-0" /> Teyit için müşteri temsilcimiz arayacaktır.</div>
          <div className="flex items-center gap-2.5"><Send className="w-4.5 h-4.5 text-amber-500 shrink-0" /> Tahmini teslimat süresi: 1-3 iş günü.</div>
        </div>

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 glass border border-slate-200 dark:border-zinc-700 hover:border-amber-500/30 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold py-3 rounded-xl transition-all text-sm cursor-pointer"
          >
            Alışverişe Devam Et
          </button>
          <a 
            href={`${whatsappUrl}${whatsappUrl.includes("?") ? "&" : "?"}text=Sipariş%20ID%3A%20${createdOrderId}%20hakkında%20bilgi%20almak%20istiyorum`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-md"
          >
            <span>WhatsApp İletişim</span>
          </a>
        </div>
      </div>
    </div>
  );
}
