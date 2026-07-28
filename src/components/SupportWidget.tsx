"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, MessageSquare, Ticket, HelpCircle, Bot, Send } from "lucide-react";
import { Link, usePathname } from "@/navigation";
import { useCMS } from "@/context/CMSContext";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function SupportWidget() {
  const t = useTranslations("Support");
  const { cmsData } = useCMS();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "chatbot">("menu");
  const [chatMessages, setChatMessages] = useState<{sender: 'bot'|'user', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "chatbot") {
      scrollToBottom();
    }
  }, [chatMessages, activeTab]);

  // Initialize bot welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const formattedWelcome = t('bot_welcome');
      setChatMessages([
        { sender: 'bot', text: formattedWelcome }
      ]);
    }
  }, [t, chatMessages.length, cmsData?.siteName]);

  // Hide widget in admin pages — AFTER all hooks
  if (pathname?.startsWith("/admin")) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      
      setChatMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: t("bot_connection_error") }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLiveChat = () => {
    // Tawk.to API call example
    // @ts-ignore
    if (typeof Tawk_API !== 'undefined') {
      // @ts-ignore
      Tawk_API.toggle();
    } else {
      toast.success(t("live_chat_redirecting"));
      setTimeout(() => {
        window.open(getWhatsAppLink(), "_blank");
      }, 500);
    }
    setIsOpen(false);
  };

  // WhatsApp link generator
  const getWhatsAppLink = () => {
    const rawNumber = cmsData.socialWhatsapp || cmsData.contactPhone || "905441494851";
    if (rawNumber.startsWith("http") || rawNumber.startsWith("wa.me")) {
      return rawNumber.startsWith("http") ? rawNumber : `https://${rawNumber}`;
    }
    // Clean non-numeric characters
    const cleanNumber = rawNumber.replace(/\D/g, "");
    // Ensure it starts with 90 if it's 10 digits
    const finalNumber = cleanNumber.length === 10 ? `90${cleanNumber}` : cleanNumber;
    return `https://wa.me/${finalNumber}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Menu/Chatbot Window */}
      <div 
        className={`absolute bottom-20 right-0 w-[350px] bg-white/85 dark:bg-zinc-950/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-zinc-800/80 transition-all duration-300 origin-bottom-right overflow-hidden flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ maxHeight: '500px', height: 'calc(100vh - 120px)' }}
      >
        {/* Header */}
        <div className="bg-zinc-950/95 dark:bg-zinc-950/98 text-white p-5 flex justify-between items-center shrink-0 border-b border-amber-500/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/20">
              {activeTab === "menu" ? <LifeBuoyIcon /> : <Bot className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-100">
                {activeTab === "menu" 
                  ? t("assistant_title") 
                  : t("ai_assistant_title")
                }
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium">{activeTab === "menu" ? t("how_can_help") : t("ready_to_answer")}</p>
            </div>
          </div>
          {activeTab === "chatbot" && (
            <button onClick={() => setActiveTab("menu")} className="text-zinc-400 hover:text-white transition text-xs font-bold uppercase underline">
              {t("back")}
            </button>
          )}
        </div>

        {/* Content - Menu */}
        {activeTab === "menu" && (
          <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-transparent">
            <a 
              href={getWhatsAppLink()} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-4 p-4 bg-white/70 dark:bg-zinc-900/35 hover:bg-white/90 dark:hover:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 rounded-2xl group transition-all"
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-0.5">{t("whatsapp_support")}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("fast_reply_desc")}</p>
              </div>
            </a>

            <button 
              onClick={handleLiveChat}
              className="w-full flex items-center gap-4 p-4 bg-white/70 dark:bg-zinc-900/35 hover:bg-white/90 dark:hover:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-2xl group transition-all text-left"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-0.5">{t("live_chat")}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("chat_agent_desc")}</p>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab("chatbot")}
              className="w-full flex items-center gap-4 p-4 bg-white/70 dark:bg-zinc-900/35 hover:bg-white/90 dark:hover:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 hover:border-amber-500/40 dark:hover:border-amber-500/40 rounded-2xl group transition-all text-left"
            >
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-0.5">{t("ai_chat")}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("faq_auto_desc")}</p>
              </div>
            </button>

            <Link 
              href="/account/tickets" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-4 p-4 bg-white/70 dark:bg-zinc-900/35 hover:bg-white/90 dark:hover:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 hover:border-amber-500/40 dark:hover:border-amber-500/40 rounded-2xl group transition-all"
            >
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-0.5">{t("create_ticket")}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("ticket_desc")}</p>
              </div>
            </Link>

            <Link 
              href="/help" 
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 p-3 bg-slate-100/80 dark:bg-zinc-800/40 hover:bg-slate-200/80 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl text-xs font-bold transition-colors mt-2"
            >
              <HelpCircle className="w-4 h-4" /> {t("help_center")}
            </Link>
          </div>
        )}

        {/* Content - Chatbot */}
        {activeTab === "chatbot" && (
          <>
            <div className="flex-1 p-4 overflow-y-auto bg-transparent space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-br-none shadow-md shadow-amber-500/10' : 'bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200 rounded-bl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/80 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-md border-t border-slate-200/60 dark:border-zinc-850/80 flex items-center gap-2 shrink-0">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("chat_placeholder")} 
                className="flex-1 bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-full px-4 py-2.5 outline-none text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-50 text-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-amber-500/25"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isTyping}
                className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-full flex items-center justify-center shrink-0 hover:from-amber-400 hover:to-orange-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Toggle Button Container with tooltip/radar */}
      <div className="relative group mt-auto flex items-center justify-end">
        {/* Radar Glow Ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-amber-500/40 dark:bg-amber-500/30 animate-ping opacity-75 pointer-events-none -z-10" />
        )}
        
        {/* Floating Label (Tooltip) */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/80 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-x-2 group-hover:translate-x-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {t("assistant_title")}
        </div>

        {/* Main Gradient Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.55)] hover:scale-110 active:scale-95 transition-all duration-300 relative border border-amber-400/20"
        >
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center shadow-md">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          </span>
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}

function LifeBuoyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="9.17" x2="18.36" y2="5.64"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>
  );
}
