"use client";

import { useState } from "react";
import { Send, Package, Handshake, ShoppingBag, Truck, MessageSquarePlus, Sparkles } from "lucide-react";

interface SupportWhatsAppTabProps {
  whatsappBaseUrl: string;
  onClose: () => void;
}

const PRESET_OPTIONS = [
  {
    id: "products",
    label: "Ürünleriniz hakkında bilgi almak istiyorum",
    message:
      "Merhaba PEKEFE ekibi, ürünleriniz (dut pekmezi, pestil, cevizli sucuk ve diğer doğal ürünler) hakkında detaylı bilgi ve fiyat almak istiyorum.",
    icon: Package,
    color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "dealership",
    label: "Bayilik hakkında bilgi almak istiyorum",
    message:
      "Merhaba PEKEFE ekibi, toptan satış ve bayilik (B2B) şartlarınız hakkında bilgi almak istiyorum.",
    icon: Handshake,
    color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "order",
    label: "Sipariş vermek istiyorum",
    message:
      "Merhaba PEKEFE ekibi, yeni bir sipariş oluşturmak istiyorum. Yardımcı olabilir misiniz?",
    icon: ShoppingBag,
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "shipping",
    label: "Siparişim / Kargo durumum hakkında bilgi almak istiyorum",
    message:
      "Merhaba PEKEFE ekibi, vermiş olduğum siparişim ve kargo durumu hakkında bilgi almak istiyorum.",
    icon: Truck,
    color: "text-purple-600 bg-purple-500/10 border-purple-500/20",
  },
];

export function SupportWhatsAppTab({ whatsappBaseUrl, onClose }: SupportWhatsAppTabProps) {
  const [selectedId, setSelectedId] = useState<string>("products");
  const [customMessage, setCustomMessage] = useState<string>(PRESET_OPTIONS[0].message);

  const buildWhatsAppHref = (text: string) => {
    const cleanBase = whatsappBaseUrl.split("?")[0];
    return `${cleanBase}?text=${encodeURIComponent(text.trim())}`;
  };

  const handleSelectOption = (opt: (typeof PRESET_OPTIONS)[number]) => {
    setSelectedId(opt.id);
    setCustomMessage(opt.message);
  };

  const handleSend = () => {
    const textToSend = customMessage.trim() || PRESET_OPTIONS[0].message;
    window.open(buildWhatsAppHref(textToSend), "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="p-4 space-y-3 overflow-y-auto max-h-[430px] custom-scrollbar bg-transparent">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <p className="text-[11px] font-bold text-on-surface-variant">
          Konu seçin veya mesajınızı düzenleyip gönderin:
        </p>
      </div>

      {/* Hazır Mesaj Seçenekleri */}
      <div className="space-y-2">
        {PRESET_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm"
                  : "bg-surface-container-low hover:bg-surface-container border-outline-variant/20"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${opt.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-on-surface leading-snug flex-1">
                {opt.label}
              </span>
            </button>
          );
        })}

        {/* Özel Mesaj Seçeneği */}
        <button
          type="button"
          onClick={() => {
            setSelectedId("custom");
            setCustomMessage("");
          }}
          className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedId === "custom"
              ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm"
              : "bg-surface-container-low hover:bg-surface-container border-outline-variant/20"
          }`}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-slate-600 bg-slate-500/10 border-slate-500/20">
            <MessageSquarePlus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-on-surface leading-snug flex-1">
            Farklı bir konuda mesaj yazmak istiyorum
          </span>
        </button>
      </div>

      {/* Mesaj Önizleme & Düzenleme Alanı */}
      <div className="space-y-2 pt-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-1">
          Gönderilecek WhatsApp Mesajı
        </label>
        <textarea
          rows={3}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Mesajınızı buraya yazabilirsiniz..."
          className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-emerald-500 resize-none"
        />

        <button
          type="button"
          onClick={handleSend}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>WhatsApp ile Gönder</span>
        </button>
      </div>
    </div>
  );
}
