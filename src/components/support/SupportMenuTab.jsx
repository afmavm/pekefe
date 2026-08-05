"use client";

import Link from "next/link";
import { MessageCircle, MessageSquare, Bot, Ticket, HelpCircle } from "lucide-react";

/**
 * SupportMenuTab Component
 * Renders the multi-channel support menu options as shown in user screenshot.
 * Complies with AGENTS.md design tokens and max 400 lines rule.
 */
export function SupportMenuTab({
  whatsappUrl,
  onLiveChatClick,
  onAiAssistantClick,
  onTicketClick,
  onClose,
}) {
  return (
    <div className="p-4 space-y-3 overflow-y-auto max-h-[420px] custom-scrollbar bg-transparent">
      {/* 1. WhatsApp Destek */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3.5 p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-emerald-500/40 rounded-2xl group transition-all cursor-pointer shadow-sm"
      >
        <div className="w-11 h-11 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 border border-emerald-500/20">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-on-surface text-sm mb-0.5 group-hover:text-emerald-500 transition-colors">
            WhatsApp Destek
          </h4>
          <p className="text-xs text-on-surface-variant/80 truncate">Hızlı yanıt için bize yazın</p>
        </div>
      </a>

      {/* 2. Canlı Destek */}
      <button
        type="button"
        onClick={onLiveChatClick}
        className="w-full flex items-center gap-3.5 p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-sky-500/40 rounded-2xl group transition-all text-left cursor-pointer shadow-sm"
      >
        <div className="w-11 h-11 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 border border-sky-500/20">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-on-surface text-sm mb-0.5 group-hover:text-sky-500 transition-colors">
            Canlı Destek
          </h4>
          <p className="text-xs text-on-surface-variant/80 truncate">Müşteri temsilcisiyle görüşün</p>
        </div>
      </button>

      {/* 3. Akıllı Asistan (AI) */}
      <button
        type="button"
        onClick={onAiAssistantClick}
        className="w-full flex items-center gap-3.5 p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-purple-500/40 rounded-2xl group transition-all text-left cursor-pointer shadow-sm"
      >
        <div className="w-11 h-11 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 border border-purple-500/20">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-on-surface text-sm mb-0.5 group-hover:text-purple-500 transition-colors">
            Akıllı Asistan (AI)
          </h4>
          <p className="text-xs text-on-surface-variant/80 truncate">Sıkça sorulan sorulara otomatik cevap</p>
        </div>
      </button>

      {/* 4. Destek Talebi Oluştur */}
      <button
        type="button"
        onClick={onTicketClick}
        className="w-full flex items-center gap-3.5 p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-amber-500/40 rounded-2xl group transition-all text-left cursor-pointer shadow-sm"
      >
        <div className="w-11 h-11 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 border border-amber-500/20">
          <Ticket className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-on-surface text-sm mb-0.5 group-hover:text-amber-500 transition-colors">
            Destek Talebi Oluştur
          </h4>
          <p className="text-xs text-on-surface-variant/80 truncate">Kapsamlı sorunlar için bilet açın</p>
        </div>
      </button>

      {/* 5. Yardım Merkezi (SSS) */}
      <Link
        href="/sss"
        onClick={onClose}
        className="flex items-center justify-center gap-2 p-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/20 rounded-xl text-xs font-bold transition-all mt-3 cursor-pointer"
      >
        <HelpCircle className="w-4 h-4 text-secondary" />
        <span>Yardım Merkezi (SSS)</span>
      </Link>
    </div>
  );
}
