"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Download,
  ExternalLink,
  Trash2,
  Wand2,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface AiVisualItem {
  id: string;
  url: string;
  format: string;
  style: string;
  mode: "branded" | "scene-only";
  provider: "google-gemini" | "google-imagen" | "flux-free";
  prompt: string;
  createdAt: string;
}

interface AiVisualStudioPanelProps {
  pack: any;
  onUpdated: () => void;
}

const AI_FORMATS = [
  { id: "ig-post", label: "Instagram Post", size: "1080×1350 (4:5)" },
  { id: "ig-story", label: "Story / Reels / Shorts", size: "1080×1920 (9:16)" },
  { id: "wa-card", label: "WhatsApp Kartı", size: "1080×1080 (1:1)" },
  { id: "fb-post", label: "Facebook Görseli", size: "1200×630 (16:9)" },
  { id: "gbp-post", label: "Google İşletme", size: "1200×900 (4:3)" },
];

const AI_STYLES = [
  { id: "ispir-sunlight", label: "☀️ Güneşli İspir Yaylası", desc: "Doğal sabah güneşi & ahşap" },
  { id: "marble-studio", label: "🏛️ Lüks Mermer Stüdyo", desc: "Bordo & krem mermer podyum" },
  { id: "rustic-table", label: "🪵 Rustik Kahvaltı Sofrası", desc: "Ceviz masa & bakır kaşık" },
  { id: "golden-cinematic", label: "🎬 Altın Saat Sinematik", desc: "Dramatik lüks reklam ışığı" },
  { id: "minimal-cream", label: "🤍 Minimalist Krem", desc: "Modern traverten & gün ışığı" },
];

const PROVIDER_LABELS: Record<string, { label: string; cls: string }> = {
  "google-gemini": { label: "Google Gemini AI", cls: "bg-blue-600 text-white" },
  "google-imagen": { label: "Google Imagen 3", cls: "bg-indigo-600 text-white" },
  "flux-free": { label: "FLUX.1 AI (Ücretsiz)", cls: "bg-emerald-600 text-white" },
};

export default function AiVisualStudioPanel({ pack, onUpdated }: AiVisualStudioPanelProps) {
  const [format, setFormat] = useState("ig-post");
  const [style, setStyle] = useState("ispir-sunlight");
  const [mode, setMode] = useState<"branded" | "scene-only">("branded");
  const [engine, setEngine] = useState<"auto" | "google" | "flux">("auto");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const aiVisuals: AiVisualItem[] = Array.isArray(pack?.aiGeneratedVisuals)
    ? pack.aiGeneratedVisuals
    : [];

  const handleGenerateAiVisual = async () => {
    if (!pack?.id) return;
    setGenerating(true);
    const toastId = toast.loading(
      "AI fotoğraf stüdyosu sahneyi oluşturup PEKEFE tasarımıyla birleştiriyor (10-20 sn)..."
    );
    try {
      const res = await fetch("/api/social-media/ai-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          format,
          style,
          mode,
          engine,
          customPrompt,
        }),
      });
      const json = await res.json();
      toast.dismiss(toastId);
      if (res.ok && json.visual) {
        const prov = PROVIDER_LABELS[json.visual.provider]?.label || "AI Stüdyo";
        toast.success(`Stüdyo kalitesinde AI görsel üretildi (${prov})!`);
        onUpdated();
      } else {
        toast.error(json.error || "AI görsel üretilemedi.");
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (visualId: string) => {
    setDeletingId(visualId);
    try {
      const res = await fetch(
        `/api/social-media/ai-visual?packId=${encodeURIComponent(pack.id)}&visualId=${encodeURIComponent(visualId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("AI görsel silindi.");
        onUpdated();
      } else {
        toast.error("Görsel silinemedi.");
      }
    } catch {
      toast.error("Silme hatası.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-slate-900 via-[#2a0c16] to-slate-900 text-white p-4 sm:p-5 space-y-4 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <Wand2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">
                AI Reklam Fotoğrafı Stüdyosu
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Google AI + Ücretsiz FLUX.1
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Fotogerçekçi AI reklam arka planı üretir ve gerçek PEKEFE ürün fotoğrafınızı bozmadan üstüne yerleştirir.
            </p>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Format */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mb-1">
            Platform Formatı
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
          >
            {AI_FORMATS.map((f) => (
              <option key={f.id} value={f.id} className="text-slate-900">
                {f.label} — {f.size}
              </option>
            ))}
          </select>
        </div>

        {/* Mode */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mb-1">
            Tasarım Modu
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setMode("branded")}
              className={`px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer border ${
                mode === "branded"
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : "bg-white/5 text-slate-200 border-white/15 hover:bg-white/10"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Markalı Ürünlü
            </button>
            <button
              type="button"
              onClick={() => setMode("scene-only")}
              className={`px-2.5 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer border ${
                mode === "scene-only"
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : "bg-white/5 text-slate-200 border-white/15 hover:bg-white/10"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Saf AI Sahne
            </button>
          </div>
        </div>

        {/* Engine */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mb-1">
            AI Görsel Motoru
          </label>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
          >
            <option value="auto" className="text-slate-900">
              Otomatik (Google AI → Ücretsiz FLUX.1)
            </option>
            <option value="google" className="text-slate-900">
              Sadece Google Gemini / Imagen AI
            </option>
            <option value="flux" className="text-slate-900">
              Sadece FLUX.1 AI (Ücretsiz &amp; Hızlı)
            </option>
          </select>
        </div>
      </div>

      {/* Style Selector Chips */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mb-1.5">
          Sahne &amp; Işık Stili
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {AI_STYLES.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStyle(st.id)}
              className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                idx === AI_STYLES.length - 1 ? "col-span-2 sm:col-span-1" : ""
              } ${
                style === st.id
                  ? "bg-amber-400/20 border-amber-400 text-white shadow-sm"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <div className="text-[11px] font-extrabold leading-tight">{st.label}</div>
              <div className="text-[10px] text-slate-300/80 mt-0.5 truncate">{st.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Turkish Prompt + Generate Button */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="İsteğe bağlı Türkçe sahne notu (örn: Masada kırılmış cevizler, bakır kaşık ve sıcak çay olsun...)"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
        />
        <button
          type="button"
          onClick={handleGenerateAiVisual}
          disabled={generating}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0 disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI Üretiyor...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI Görsel Üret
            </>
          )}
        </button>
      </div>

      {/* Saved AI Generated Visuals Gallery */}
      {aiVisuals.length > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-200">
              Bu Ürün İçin Üretilen AI Stüdyo Görselleri ({aiVisuals.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiVisuals.map((v) => {
              const prov = PROVIDER_LABELS[v.provider] || PROVIDER_LABELS["flux-free"];
              const fmtInfo = AI_FORMATS.find((f) => f.id === v.format);
              return (
                <div
                  key={v.id}
                  className="bg-white/10 border border-white/15 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/5] bg-black/40 overflow-hidden flex items-center justify-center">
                    <img
                      src={v.url}
                      alt={fmtInfo?.label || v.format}
                      className="w-full h-full object-contain"
                    />
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold shadow ${prov.cls}`}
                    >
                      {prov.label}
                    </span>
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-amber-200">
                      {v.mode === "branded" ? "Markalı" : "Saf AI"}
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2 bg-black/30">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        {fmtInfo?.label || v.format}
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {new Date(v.createdAt).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                        title="Tam Boyut Aç"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={v.url}
                        download={`${pack.productSlug || "pekefe"}-${v.format}.png`}
                        className="px-2 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black flex items-center gap-1 transition"
                        title="PNG İndir"
                      >
                        <Download className="w-3 h-3" /> PNG
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-white transition cursor-pointer disabled:opacity-50"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
