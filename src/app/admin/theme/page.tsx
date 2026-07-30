"use client";

import { useState, useEffect } from "react";
import { Palette, Save, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const FONTS = ["Outfit", "Inter", "Roboto", "Poppins", "Montserrat", "Playfair Display"];
const BORDER_RADII = [0, 4, 8, 12, 16, 24, 32];
const LAYOUT_WIDTHS = ["max-w-3xl", "max-w-4xl", "max-w-5xl", "max-w-6xl", "max-w-7xl"];

interface ThemeState {
  primaryColor: string;
  secondaryColor: string;
  logoFont: string;
  logoSize: number;
  logoWeight: string;
  borderRadius: number;
  layoutWidth: string;
}

const defaultTheme: ThemeState = {
  primaryColor: "#b45309",
  secondaryColor: "#1F2937",
  logoFont: "Outfit",
  logoSize: 18,
  logoWeight: "font-black",
  borderRadius: 12,
  layoutWidth: "max-w-4xl",
};

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: color }} />
      <span className="text-xs font-mono text-gray-600">{color}</span>
    </div>
  );
}

export default function ThemeAdminPage() {
  const [theme, setTheme] = useState<ThemeState>(defaultTheme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setTheme({
            primaryColor: data.primaryColor ?? defaultTheme.primaryColor,
            secondaryColor: data.secondaryColor ?? defaultTheme.secondaryColor,
            logoFont: data.logoFont ?? defaultTheme.logoFont,
            logoSize: Number(data.logoSize ?? defaultTheme.logoSize),
            logoWeight: data.logoWeight ?? defaultTheme.logoWeight,
            borderRadius: Number(data.borderRadius ?? defaultTheme.borderRadius),
            layoutWidth: data.layoutWidth ?? defaultTheme.layoutWidth,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      toast.success("Tema ayarları kaydedildi.");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof ThemeState, val: string | number) =>
    setTheme((prev) => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#b45309]" />
        <span className="text-sm text-gray-500">Tema ayarları yükleniyor...</span>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309]/40 transition bg-white text-slate-900";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#b45309]" />
            Tema Ayarları
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Sitenizin görsel kimliğini buradan yönetin.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
            saved ? "bg-emerald-500 text-white" : "bg-[#b45309] hover:bg-amber-700 text-white"
          } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Kaydet"}
        </button>
      </div>

      {/* Preview banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ backgroundColor: theme.primaryColor }}
      >
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at top right, white, transparent 60%)" }} />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-2">Canlı Önizleme — Logo</p>
          <span
            style={{
              fontFamily: theme.logoFont,
              fontSize: `${theme.logoSize}px`,
              borderRadius: `${theme.borderRadius}px`,
            }}
            className={`${theme.logoWeight} tracking-tight`}
          >
            Pekefe
          </span>
          <div className="mt-3 flex gap-2">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.primaryColor, border: "2px solid rgba(255,255,255,0.3)" }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.secondaryColor, border: "2px solid rgba(255,255,255,0.3)" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colors */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Renkler</h2>
          
          <div>
            <label className={labelClass}>Ana Renk</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className={inputClass + " flex-1"}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>İkincil Renk</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={(e) => update("secondaryColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={theme.secondaryColor}
                onChange={(e) => update("secondaryColor", e.target.value)}
                className={inputClass + " flex-1"}
              />
            </div>
          </div>

          {/* Quick palette */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Hızlı Palet</p>
            <div className="flex flex-wrap gap-2">
              {["#b45309","#1D4ED8","#059669","#7C3AED","#D97706","#0E7490","#374151"].map((c) => (
                <button
                  key={c}
                  onClick={() => update("primaryColor", c)}
                  className="w-7 h-7 rounded-lg border-2 transition hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: theme.primaryColor === c ? "white" : "transparent",
                    boxShadow: theme.primaryColor === c ? `0 0 0 2px ${c}` : "none",
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Typography & Layout */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Yazı Tipi & Düzen</h2>
          
          <div>
            <label className={labelClass}>Logo Fontu</label>
            <select
              value={theme.logoFont}
              onChange={(e) => update("logoFont", e.target.value)}
              className={inputClass + " cursor-pointer"}
            >
              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Logo Boyutu (px)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={12}
                max={36}
                value={theme.logoSize}
                onChange={(e) => update("logoSize", Number(e.target.value))}
                className="flex-1 accent-[#b45309]"
              />
              <span className="text-sm font-bold text-gray-700 w-10 text-right">{theme.logoSize}px</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Logo Ağırlığı</label>
            <div className="grid grid-cols-3 gap-2">
              {["font-medium", "font-bold", "font-black"].map((w) => (
                <button
                  key={w}
                  onClick={() => update("logoWeight", w)}
                  className={`py-2 text-xs rounded-lg border transition ${
                    theme.logoWeight === w
                      ? "border-[#b45309] bg-amber-50 text-[#b45309] font-semibold"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className={w}>Aa</span>
                  <p className="mt-0.5 font-normal">{w.replace("font-", "")}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Kenar Yuvarlaklığı</label>
            <div className="flex flex-wrap gap-2">
              {BORDER_RADII.map((r) => (
                <button
                  key={r}
                  onClick={() => update("borderRadius", r)}
                  className={`w-10 h-10 border transition text-xs font-semibold ${
                    theme.borderRadius === r
                      ? "border-[#b45309] bg-amber-50 text-[#b45309]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                  style={{ borderRadius: `${r}px` }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>İçerik Genişliği</label>
            <select
              value={theme.layoutWidth}
              onChange={(e) => update("layoutWidth", e.target.value)}
              className={inputClass + " cursor-pointer"}
            >
              {LAYOUT_WIDTHS.map((w) => (
                <option key={w} value={w}>
                  {w} {w === "max-w-4xl" ? "(Varsayılan)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

