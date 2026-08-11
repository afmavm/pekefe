"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Bot, ArrowLeft } from "lucide-react";
import { getSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";
import { SupportMenuTab } from "./support/SupportMenuTab";
import { SupportChatTab } from "./support/SupportChatTab";
import { SupportTicketModal } from "./support/SupportTicketModal";

/**
 * SupportWidget Component
 * Floating Support Hub & AI Assistant matching user screenshot design.
 * Fully compliant with AGENTS.md design tokens & max 400 lines rule.
 */
export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("menu"); // "menu" | "chatbot"
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [settings] = useState(getSettings() || DEFAULT_SETTINGS);
  const pathname = usePathname();

  // Hide widget on admin routes
  if (pathname?.startsWith("/admin")) return null;

  const getWhatsAppLink = () => {
    const rawNumber = settings.whatsapp || settings.phone || "904425110000";
    if (rawNumber.startsWith("http") || rawNumber.startsWith("wa.me")) {
      return rawNumber.startsWith("http") ? rawNumber : `https://${rawNumber}`;
    }
    const cleanNumber = rawNumber.replace(/\D/g, "");
    const finalNumber = cleanNumber.length === 10 ? `90${cleanNumber}` : cleanNumber;
    return `https://wa.me/${finalNumber}`;
  };

  const handleLiveChat = () => {
    window.open(getWhatsAppLink(), "_blank");
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 md:bottom-8 right-5 md:right-8 z-50 flex flex-col items-end">
        {/* Floating Menu / Chatbot Window */}
        <div
          className={`absolute bottom-20 right-0 w-[350px] sm:w-[380px] bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-outline-variant/20 transition-all duration-300 origin-bottom-right overflow-hidden flex flex-col ${
            isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-0 opacity-0 pointer-events-none"
          }`}
          style={{ maxHeight: "540px" }}
        >
          {/* Widget Header matching screenshot */}
          <div className="bg-surface-container-highest text-on-surface p-5 flex justify-between items-center shrink-0 border-b border-outline-variant/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center border border-secondary/20 shrink-0">
                {activeTab === "menu" ? <LifeBuoyIcon /> : <Bot className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-primary tracking-tight">
                  {activeTab === "menu" ? "Pekefe Destek" : "Akıllı Asistan (AI)"}
                </h3>
                <p className="text-[11px] text-on-surface-variant font-medium">
                  {activeTab === "menu" ? "Size nasıl yardımcı olabiliriz?" : "7/24 Yanıtlamaya Hazır"}
                </p>
              </div>
            </div>

            {activeTab === "chatbot" ? (
              <button
                type="button"
                onClick={() => setActiveTab("menu")}
                className="text-secondary hover:text-primary text-xs font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Geri</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active Tab Content */}
          {activeTab === "menu" ? (
            <SupportMenuTab
              whatsappUrl={getWhatsAppLink()}
              onLiveChatClick={handleLiveChat}
              onAiAssistantClick={() => setActiveTab("chatbot")}
              onTicketClick={() => setIsTicketModalOpen(true)}
              onClose={() => setIsOpen(false)}
            />
          ) : (
            <SupportChatTab onClose={() => setIsOpen(false)} />
          )}
        </div>

        {/* Floating Toggle Button (FAB) */}
        <div className="relative group flex items-center justify-end">
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping opacity-75 pointer-events-none -z-10" />
          )}

          {/* Tooltip Label */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/30 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-x-2 group-hover:translate-x-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pekefe Destek</span>
          </div>

          {/* Main FAB */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative border border-white/20 cursor-pointer"
            aria-label="Pekefe Destek Merkezi"
          >
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </span>
            {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Ticket Creation Modal */}
      <SupportTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
    </>
  );
}

function LifeBuoyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="14.83" y1="9.17" x2="18.36" y2="5.64" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  );
}
