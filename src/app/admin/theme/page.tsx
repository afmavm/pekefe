"use client";

import { useState, useEffect } from "react";
import { 
  Palette, Save, Check, Loader2, RefreshCw, Layout, Type, Sparkles, 
  RotateCcw, Monitor, Smartphone, Sun, Moon, Eye, Layers, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

const FONTS = [
  "Outfit", "Inter", "Roboto", "Poppins", "Montserrat", 
  "Playfair Display", "Merriweather", "Cinzel"
];

const BORDER_RADII = [0, 4, 8, 12, 16, 24, 32];
const LAYOUT_WIDTHS = [
  { label: "Kompakt (max-w-4xl)", value: "max-w-4xl" },
  { label: "Standart (max-w-6xl)", value: "max-w-6xl" },
  { label: "Geniş (max-w-7xl)", value: "max-w-7xl" },
  { label: "Tam Ekran (max-w-full)", value: "max-w-full" }
];

interface ThemeState {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoFont: string;
  logoSize: number;
  logoWeight: string;
  borderRadius: number;
  layoutWidth: string;
  buttonStyle: "pill" | "rounded" | "sharp";
  headerStyle: "sticky" | "fixed" | "static";
}

const defaultTheme: ThemeState = {
  primaryColor: "#b45309",
  secondaryColor: "#1F2937",
  accentColor: "#f59e0b",
  logoFont: "Outfit",
  logoSize: 22,
  logoWeight: "font-black",
  borderRadius: 16,
  layoutWidth: "max-w-7xl",
  buttonStyle: "rounded",
  headerStyle: "sticky"
};

const PRESET_THEMES = [
  {
    name: "Doğal Kehribar (PEKEFE Orijinal)",
    primary: "#b45309",
    secondary: "#1F2937",
    accent: "#f59e0b",
    desc: "Geleneksel İspir Bal ve Pekmez tonları"
  },
  {
    name: "Zümrüt Organik (Yayla Doğası)",
    primary: "#059669",
    secondary: "#064e3b",
    accent: "#10b981",
    desc: "Ekolojik dağ yaylaları ve taze organik doku"
  },
  {
    name: "Geleneksel Ceviz & Dut",
    primary: "#78350f",
    secondary: "#451a03",
    accent: "#d97706",
    desc: "Kuru fasulye, ceviz ve pekmez harmanı"
  },
  {
    name: "Vişne & Gurme Saray",
    primary: "#9f1239",
    secondary: "#4c0519",
    accent: "#fb7185",
    desc: "Şık ziyafet ve saray mutfağı stili"
  },
  {
    name: "Gece Asaleti (Premium Gold)",
    primary: "#0f172a",
    secondary: "#1e293b",
    accent: "#fbbf24",
    desc: "Koyu temalı lüks ve gurme tasarım"
  }
];

export default function ThemeAdminPage() {
  const [theme, setTheme] = useState<ThemeState>(defaultTheme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"presets" | "colors" | "typography" | "layout">("presets");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setTheme({
            primaryColor: data.primaryColor ?? defaultTheme.primaryColor,
            secondaryColor: data.secondaryColor ?? defaultTheme.secondaryColor,
            accentColor: data.accentColor ?? defaultTheme.accentColor,
            logoFont: data.logoFont ?? defaultTheme.logoFont,
            logoSize: Number(data.logoSize ?? defaultTheme.logoSize),
            logoWeight: data.logoWeight ?? defaultTheme.logoWeight,
            borderRadius: Number(data.borderRadius ?? defaultTheme.borderRadius),
            layoutWidth: data.layoutWidth ?? defaultTheme.layoutWidth,
            buttonStyle: data.buttonStyle ?? defaultTheme.buttonStyle,
            headerStyle: data.headerStyle ?? defaultTheme.headerStyle,
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
      toast.success("Tema ayarları başarıyla kaydedildi ve tüm siteye uygulandı!");
      
      // Broadcast settings updated event across tabs & windows
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("settings-updated"));
      }

      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setTheme((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
    toast.success(`"${preset.name}" hazır teması uygulandı.`);
  };

  const resetToDefault = () => {
    setTheme(defaultTheme);
    toast.info("Tema ayarları varsayılana sıfırlandı.");
  };

  const update = (key: keyof ThemeState, val: any) =>
    setTheme((prev) => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#b45309]" />
        <span className="text-sm font-semibold text-slate-500">Tema konfigürasyonu yükleniyor...</span>
      </div>
    );
  }

  const inputClass =
    "w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309] transition bg-white text-slate-900 shadow-xs";
  const labelClass = "block text-xs font-bold text-slate-700 uppercase mb-1.5";

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-[#b45309]" /> Tema & Görsel Kimlik Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Renk paleti, logo tipografisi, buton stilleri ve kenar yuvarlaklıklarını canlı yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefault}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Varsayılana Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Sıfırla
          </button>

          <button
            onClick={save}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
              saved ? "bg-emerald-600 text-white" : "bg-[#b45309] hover:bg-amber-800 text-white"
            } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Kaydediliyor..." : saved ? "Değişiklikler Saklandı!" : "Ayarları Kaydet"}
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel + Live Device Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "presets" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Hazır Temalar
            </button>
            <button
              onClick={() => setActiveTab("colors")}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "colors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-600" /> Renk Paleti
            </button>
            <button
              onClick={() => setActiveTab("typography")}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "typography" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Type className="w-3.5 h-3.5 text-amber-600" /> Logo & Yazı
            </button>
            <button
              onClick={() => setActiveTab("layout")}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "layout" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layout className="w-3.5 h-3.5 text-amber-600" /> Düzen & Şekil
            </button>
          </div>

          {/* TAB 1: PRESET THEMES */}
          {activeTab === "presets" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Tek Tıkla Hazır Kurumsal Temalar</h2>
                <p className="text-xs text-slate-500 mt-0.5">Markanızın konseptine en uygun renk paletini 1 tıkla seçin.</p>
              </div>

              <div className="space-y-3">
                {PRESET_THEMES.map((preset) => {
                  const isActive = theme.primaryColor === preset.primary && theme.secondaryColor === preset.secondary;
                  return (
                    <div
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                        isActive 
                          ? "border-[#b45309] bg-amber-50/50 shadow-sm" 
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{preset.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-[#b45309] text-white text-[10px] font-bold rounded-full">Aktif</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{preset.desc}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-6 h-6 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: preset.primary }} title="Ana Renk" />
                        <div className="w-6 h-6 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: preset.secondary }} title="İkincil Renk" />
                        <div className="w-6 h-6 rounded-lg border border-black/10 shadow-xs" style={{ backgroundColor: preset.accent }} title="Vurgu Rengi" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COLOR PALETTE */}
          {activeTab === "colors" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Özel Renk Paleti Özelleştirme</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sitenin ana, ikincil ve vurgu renk kodlarını özgürce tanımlayın.</p>
              </div>

              {/* Primary Color */}
              <div>
                <label className={labelClass}>Ana Renk (Primary Brand Color)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="w-11 h-11 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white shadow-xs"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className={inputClass + " flex-1 font-mono uppercase"}
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className={labelClass}>İkincil Renk (Secondary Header/Footer)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => update("secondaryColor", e.target.value)}
                    className="w-11 h-11 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white shadow-xs"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => update("secondaryColor", e.target.value)}
                    className={inputClass + " flex-1 font-mono uppercase"}
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className={labelClass}>Vurgu & Rozet Rengi (Accent / Badges)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.accentColor || "#f59e0b"}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className="w-11 h-11 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white shadow-xs"
                  />
                  <input
                    type="text"
                    value={theme.accentColor || "#f59e0b"}
                    onChange={(e) => update("accentColor", e.target.value)}
                    className={inputClass + " flex-1 font-mono uppercase"}
                  />
                </div>
              </div>

              {/* Quick Swatches */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600 mb-2.5">Hızlı Renk Seçimi</p>
                <div className="flex flex-wrap gap-2.5">
                  {["#b45309","#1D4ED8","#059669","#7C3AED","#D97706","#0E7490","#374151","#be185d","#0f172a"].map((c) => (
                    <button
                      key={c}
                      onClick={() => update("primaryColor", c)}
                      className="w-8 h-8 rounded-xl border-2 transition duration-200 hover:scale-110 shadow-xs cursor-pointer"
                      style={{
                        backgroundColor: c,
                        borderColor: theme.primaryColor === c ? "white" : "transparent",
                        boxShadow: theme.primaryColor === c ? `0 0 0 2.5px ${c}` : "none",
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY & LOGO */}
          {activeTab === "typography" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Logo & Tipografi Yapılandırması</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sitenin üst logosunun font ailesini ve boyutunu özelleştirin.</p>
              </div>

              <div>
                <label className={labelClass}>Logo Font Ailesi</label>
                <select
                  value={theme.logoFont}
                  onChange={(e) => update("logoFont", e.target.value)}
                  className={inputClass + " cursor-pointer"}
                >
                  {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Logo Metin Boyutu ({theme.logoSize}px)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={14}
                    max={36}
                    value={theme.logoSize}
                    onChange={(e) => update("logoSize", Number(e.target.value))}
                    className="flex-1 accent-[#b45309] cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    {theme.logoSize}px
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Logo Metin Ağırlığı (Font Weight)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Normal (Medium)", val: "font-medium" },
                    { label: "Kalın (Bold)", val: "font-bold" },
                    { label: "Ekstra Kalın (Black)", val: "font-black" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => update("logoWeight", item.val)}
                      className={`p-3 rounded-xl border transition text-center cursor-pointer ${
                        theme.logoWeight === item.val
                          ? "border-[#b45309] bg-amber-50 text-[#b45309] font-bold shadow-xs"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span style={{ fontFamily: theme.logoFont }} className={`text-base block ${item.val}`}>Pekefe</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT & STYLES */}
          {activeTab === "layout" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Kenar Ovalleştirmeleri & Buton Stilleri</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sitedeki tüm kartların, butonların ve kutuların kenar kavislerini belirleyin.</p>
              </div>

              <div>
                <label className={labelClass}>Genel Kenar Ovalleşmesi (Border Radius: {theme.borderRadius}px)</label>
                <div className="flex flex-wrap gap-2.5">
                  {BORDER_RADII.map((r) => (
                    <button
                      key={r}
                      onClick={() => update("borderRadius", r)}
                      className={`w-11 h-11 border transition text-xs font-bold flex items-center justify-center cursor-pointer ${
                        theme.borderRadius === r
                          ? "border-[#b45309] bg-amber-50 text-[#b45309] shadow-xs"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                      style={{ borderRadius: `${r}px` }}
                    >
                      {r}px
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Buton Tasarım Şekli</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Yuvarlatılmış", val: "rounded" },
                    { label: "Tam Oval (Pill)", val: "pill" },
                    { label: "Keskin Köşeli", val: "sharp" },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      onClick={() => update("buttonStyle", btn.val)}
                      className={`py-3 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        theme.buttonStyle === btn.val
                          ? "border-[#b45309] bg-amber-50 text-[#b45309]"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Site İçerik Konteyner Genişliği</label>
                <select
                  value={theme.layoutWidth}
                  onChange={(e) => update("layoutWidth", e.target.value)}
                  className={inputClass + " cursor-pointer"}
                >
                  {LAYOUT_WIDTHS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Live Interactive Device Preview Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#b45309]" /> Canlı Önizleme Simülatörü
            </span>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  previewDevice === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Masaüstü Görünümü"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masaüstü</span>
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  previewDevice === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Mobil Görünüm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobil</span>
              </button>
            </div>
          </div>

          {/* Interactive Frame Box */}
          <div className={`mx-auto transition-all duration-300 bg-slate-900 p-3 rounded-[32px] shadow-2xl ${
            previewDevice === "mobile" ? "max-w-[340px]" : "w-full"
          }`}>
            
            {/* Screen Container */}
            <div 
              className="bg-slate-50 rounded-[22px] overflow-hidden border border-slate-800 space-y-4 pb-6 min-h-[480px]"
            >
              
              {/* Header Bar */}
              <div 
                className="p-4 text-white flex items-center justify-between transition-all"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                <span
                  style={{
                    fontFamily: theme.logoFont,
                    fontSize: `${Math.min(theme.logoSize, 20)}px`,
                  }}
                  className={`${theme.logoWeight} tracking-tight`}
                >
                  Pekefe<span style={{ color: theme.primaryColor }}>.com</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-white/20">
                    Sepet (2)
                  </span>
                </div>
              </div>

              {/* Hero Banner Box */}
              <div className="p-4 mx-4 text-white relative overflow-hidden transition-all shadow-md" style={{
                backgroundColor: theme.primaryColor,
                borderRadius: `${theme.borderRadius}px`
              }}>
                <span className="text-[9px] uppercase font-bold tracking-widest bg-black/20 px-2 py-0.5 rounded-md inline-block mb-1">
                  %100 Doğal & Coğrafi Tescilli
                </span>
                <h3 className="text-sm font-black leading-tight">İspir Kaçkar Yayla Balı</h3>
                <p className="text-[11px] opacity-90 mt-1 line-clamp-2">2200m rakımda yetişen saf ve analizli katkısız bal gurme sofranızda.</p>

                <div className="mt-3">
                  <button 
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-white transition shadow-sm"
                    style={{
                      borderRadius: theme.buttonStyle === "pill" ? "9999px" : theme.buttonStyle === "sharp" ? "0px" : `${Math.max(6, theme.borderRadius - 4)}px`
                    }}
                  >
                    Hemen İncele →
                  </button>
                </div>
              </div>

              {/* Sample Product Card */}
              <div className="mx-4 p-3.5 bg-white border border-slate-200 shadow-xs space-y-2.5 transition-all" style={{
                borderRadius: `${theme.borderRadius}px`
              }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-amber-900 bg-amber-50 border border-amber-200">
                    En Çok Satan
                  </span>
                  <span className="text-[11px] font-bold text-slate-900">450.00 TL</span>
                </div>

                <h4 className="text-xs font-extrabold text-slate-900">İspir Geleneksel Dut Pekmezi</h4>
                <p className="text-[10px] text-slate-500">Meşe odun ateşinde karamelize edilmeden pişirilen şifa kaynağı.</p>

                <button 
                  className="w-full py-2 text-xs font-bold text-white transition shadow-xs text-center"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius: theme.buttonStyle === "pill" ? "9999px" : theme.buttonStyle === "sharp" ? "0px" : `${Math.max(6, theme.borderRadius - 4)}px`
                  }}
                >
                  Sepete Ekle
                </button>
              </div>

              {/* Palette Color Swatches Details */}
              <div className="mx-4 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Aktif Tema Paleti</span>
                <div className="flex items-center justify-around text-center">
                  <div>
                    <div className="w-5 h-5 rounded-full mx-auto border border-black/10" style={{ backgroundColor: theme.primaryColor }} />
                    <span className="text-[9px] font-mono text-slate-600 mt-1 block">{theme.primaryColor}</span>
                  </div>
                  <div>
                    <div className="w-5 h-5 rounded-full mx-auto border border-black/10" style={{ backgroundColor: theme.secondaryColor }} />
                    <span className="text-[9px] font-mono text-slate-600 mt-1 block">{theme.secondaryColor}</span>
                  </div>
                  <div>
                    <div className="w-5 h-5 rounded-full mx-auto border border-black/10" style={{ backgroundColor: theme.accentColor || "#f59e0b" }} />
                    <span className="text-[9px] font-mono text-slate-600 mt-1 block">{theme.accentColor || "#f59e0b"}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
