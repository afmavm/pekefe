"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, RefreshCw } from "lucide-react";

/**
 * SupportChatTab Component
 * Interactive Gemini AI Assistant chat window with message history & quick FAQs.
 * Complies with AGENTS.md design tokens and max 400 lines rule.
 */
export function SupportChatTab({ onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Merhaba! ben Pekefe Akıllı Asistanı. Ürünlerimiz, kargo takibi veya siparişleriniz hakkında merak ettiğiniz her şeyi sorabilirsiniz.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickFaqs = [
    "Kargo ne kadar sürer?",
    "Pekmez nasıl saklanmalı?",
    "Katkı maddesi var mı?",
    "İade ve değişim var mı?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input.trim();
    if (!query || isTyping) return;

    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      const replyText = data.reply || data.response || "Üzgünüm, şu anda yanıt oluşturamadım. Lütfen WhatsApp veya Canlı Destek üzerinden bizimle iletişime geçin.";
      setMessages((prev) => [...prev, { sender: "bot", text: replyText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Bağlantı hatası oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-transparent">
      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-primary text-white font-bold rounded-br-none shadow-md"
                  : "bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-bl-none shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface-container-high border border-outline-variant/20 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              <span
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick FAQ Pills */}
      {messages.length < 4 && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-surface-container-low/50 border-t border-outline-variant/10">
          {quickFaqs.map((faq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(faq)}
              className="text-[10px] font-bold bg-surface-container hover:bg-primary hover:text-white text-on-surface px-2.5 py-1 rounded-full border border-outline-variant/20 transition-all cursor-pointer"
            >
              {faq}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-surface-container-lowest border-t border-outline-variant/20 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-full px-4 py-2.5 outline-none text-xs text-on-surface placeholder-on-surface-variant/60 focus:border-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-9 h-9 bg-primary hover:bg-primary/90 text-white font-bold rounded-full flex items-center justify-center shrink-0 transition shadow-md disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
