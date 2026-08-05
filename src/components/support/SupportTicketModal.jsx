"use client";

import { useState } from "react";
import { Send, X, CheckCircle2 } from "lucide-react";

/**
 * SupportTicketModal Component
 * Quick modal form for creating a support ticket in the database.
 * Complies with AGENTS.md design tokens and max 400 lines rule.
 */
export function SupportTicketModal({ isOpen, onClose, setToastMsg, setToastOpen }) {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "Destek Talebi", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setFormData({ name: "", email: "", subject: "Destek Talebi", message: "" });
          onClose();
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Hata oluştu.");
      }
    } catch {
      alert("Sunucu hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="font-bold text-on-surface text-lg">Destek Talebiniz Oluşturuldu!</h3>
            <p className="text-xs text-on-surface-variant">Talebiniz ekibimize iletildi. En kısa sürede e-posta adresinizden dönüş yapılacaktır.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="font-bold text-on-surface text-base">Destek Talebi Oluştur</h3>
              <p className="text-xs text-on-surface-variant">Sorununuzu bize bildirin, ekibimiz hemen incelesin.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Adınız Soyadınız"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">E-Posta</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@mail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Konu</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Talep konusu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Mesajınız</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Detaylı bilgi veriniz..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Gönderiliyor..." : "Talebi Gönder"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
