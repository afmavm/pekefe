"use client";

import { useState, useTransition, useRef } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Check,
  LayoutDashboard,
  AlertCircle,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  X
} from "lucide-react";
import { Link } from "@/navigation";
import { toast } from "sonner";
import { CMSData, CMSPage, SectionBlock } from "../types";
import { updateCmsSettingsAction, updatePageSectionsAction } from "../server/cmsActions";
import SectionsManager from "./SectionsManager";
import SeoCampaignEditor from "./SeoCampaignEditor";

type ViewportSize = "desktop" | "tablet" | "mobile";

interface CmsDashboardProps {
  initialCmsData: CMSData;
  initialPages: CMSPage[];
}

const SECTION_DEFINITIONS: SectionBlock[] = [
  {
    id: "topbar",
    type: "topbar",
    label: "Üst Bilgi Çubuğu",
    icon: "📢",
    visible: true,
    fields: {
      topBarText1: "Türkiye'nin Her Yerine Güvenli Sevkiyat",
      topBarText2: "304 Paslanmaz Çelik ve Dayanıklı Tasarım",
      announcementActive: true,
      announcementSpeed: 15,
    }
  },
  {
    id: "hero",
    type: "hero",
    label: "Hero Bölümü",
    icon: "🦸",
    visible: true,
    fields: {
      heroTitle: "Atak Arıcılık Körükleri",
      heroSubtitle: "Profesyonel Paslanmaz Arıcılık Ekipmanları",
      buttonText: "Siparişe Başla",
      heroAlignment: "center",
    }
  },
  {
    id: "categories",
    type: "categories",
    label: "Kategori Bölümü",
    icon: "🗂️",
    visible: true,
    fields: {
      categoryTitle: "Ürün Gruplarını Keşfedin",
      categorySubtitle: "Arıcılık Malzemeleri ve Paslanmaz Ekipmanlar",
    }
  },
  {
    id: "featured",
    type: "featured",
    label: "Öne Çıkan Ürünler",
    icon: "⭐",
    visible: true,
    fields: {
      featuredTitle: "Öne Çıkan Ürünler",
    }
  },
  {
    id: "ticker",
    type: "ticker",
    label: "Duyuru Bandı",
    icon: "📣",
    visible: true,
    fields: {
      announcement: "Paslanmaz Arı Körükleri ve Ekipmanları",
      announcement2: "%100 Yerli İmalat",
    }
  },
  {
    id: "trust",
    type: "trust",
    label: "Güven Blokları",
    icon: "🛡️",
    visible: true,
  },
  {
    id: "app",
    type: "app",
    label: "Uygulama Tanıtımı",
    icon: "📱",
    visible: true,
    fields: {
      appTitle: "Mobil Uygulamamızı İndirin",
      appSubtitle: "Atak Arıcılık B2B bayilik sistemi artık cebinizde.",
    }
  },
  {
    id: "b2b-cta",
    type: "b2b-cta",
    label: "Bayi Çağrısı (B2B CTA)",
    icon: "🤝",
    visible: true,
  },
  {
    id: "contact",
    type: "contact",
    label: "İletişim Bilgileri",
    icon: "📞",
    visible: true,
    fields: {
      contactPhone: "0 (444) 00 00",
      contactEmail: "info@atakb2b.com",
      contactAddress: "Kayseri Organize Sanayi Bölgesi",
    }
  },
  {
    id: "footer",
    type: "footer",
    label: "Alt Bilgi (Footer)",
    icon: "🗒️",
    visible: true,
    fields: {
      siteName: "Atak Arıcılık",
      siteDescription: "Fabrikadan Direkt Paslanmaz Arıcılık Ekipmanları",
      footerSlogan: "GELENEKSEL LEZZET VE KALİTE",
      contactPhone: "0 (444) 00 00",
      contactEmail: "info@atakb2b.com",
      contactAddress: "Kayseri OSB",
      socialInstagram: "https://instagram.com/...",
      socialWhatsapp: "+90 500 000 00 00",
    }
  }
];

export default function CmsDashboard({
  initialCmsData,
  initialPages
}: CmsDashboardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [cmsValues, setCmsValues] = useState<any>(initialCmsData || {});
  const [pages, setPages] = useState<CMSPage[]>(initialPages);
  
  // Custom pages check
  const activePage = pages[0] || { id: "default-landing", name: "Ana Sayfa", slug: "landing", sections: SECTION_DEFINITIONS };
  const [sections, setSections] = useState<SectionBlock[]>(
    Array.isArray(activePage.sections) ? activePage.sections : SECTION_DEFINITIONS
  );

  const [selectedId, setSelectedId] = useState<string | null>("hero");
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [editorMode, setEditorMode] = useState<"sections" | "theme" | "seo">("sections");
  const [logoUploading, setLogoUploading] = useState(false);
  const [stampUploading, setStampUploading] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const selectedSection = sections.find((s) => s.id === selectedId) ?? null;

  const handleFieldChange = (key: string, value: any) => {
    setCmsValues((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSectionFieldChange = (sectionId: string, key: string, value: any) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId) {
          const updatedFields = { ...(s.fields || {}), [key]: value };
          return { ...s, fields: updatedFields };
        }
        return s;
      })
    );
    // Also mirror to global values for immediate layout preview compatibility
    handleFieldChange(key, value);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Dosya yüklenemedi");

      const data = await res.json();
      if (data.url) {
        handleFieldChange("logoUrl", data.url);
        toast.success("Logo başarıyla yüklendi.");
      }
    } catch (err: any) {
      toast.error("Logo yüklenirken bir hata oluştu: " + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStampUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Dosya yüklenemedi");

      const data = await res.json();
      if (data.url) {
        handleFieldChange("companyStampUrl", data.url);
        toast.success("Firma kaşesi başarıyla yüklendi.");
      }
    } catch (err: any) {
      toast.error("Kaşe yüklenirken bir hata oluştu: " + err.message);
    } finally {
      setStampUploading(false);
    }
  };

  const toggleVisible = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      // 1. Update CMS settings singleton
      const settingsRes = await updateCmsSettingsAction(cmsValues);
      
      // 2. Update page layout sections json
      let sectionsRes: any = { success: true };
      if (activePage.id !== "default-landing") {
        sectionsRes = await updatePageSectionsAction(activePage.id, sections);
      }

      if (settingsRes.success && sectionsRes.success) {
        toast.success("Değişiklikler başarıyla kaydedildi!");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // Refresh preview frame
        setIframeLoading(true);
        setIframeKey((prev) => prev + 1);
      } else {
        toast.error(settingsRes.error || "Tasarım kaydedilemedi.");
      }
    });
  };

  const viewportWidth = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50/50">
      {/* Top Editor Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold uppercase transition bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200/50"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Panel
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            CMS &amp; Tasarım Stüdyosu
          </h1>
        </div>

        {/* Viewport size switcher */}
        <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg">
          {(["desktop", "tablet", "mobile"] as ViewportSize[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewport(v)}
              className={`p-1.5 rounded-md transition-all ${
                viewport === v ? "bg-white text-[#f97316] shadow-xs" : "text-slate-400 hover:text-slate-600"
              }`}
              title={v === "desktop" ? "Masaüstü" : v === "tablet" ? "Tablet" : "Mobil"}
            >
              {v === "desktop" && <Monitor className="w-4 h-4" />}
              {v === "tablet" && <Tablet className="w-4 h-4" />}
              {v === "mobile" && <Smartphone className="w-4 h-4" />}
            </button>
          ))}
        </div>

        {/* Save & Reset */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            saved
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
              : "bg-orange-500 hover:bg-amber-700 text-white shadow-md shadow-red-700/10"
          } disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Kaydet"}
        </button>
      </header>

      {/* Main Studio Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Navigation tabs & Layout tree */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
          {/* Studio Tab Switchers */}
          <div className="p-3 border-b border-slate-100 flex gap-1.5 shrink-0 bg-slate-50/50">
            <button
              onClick={() => {
                setEditorMode("sections");
              }}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                editorMode === "sections"
                  ? "bg-white text-[#f97316] shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Bölümler
            </button>
            <button
              onClick={() => {
                setEditorMode("theme");
                setSelectedId(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                editorMode === "theme"
                  ? "bg-white text-[#f97316] shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Renk &amp; Stil
            </button>
            <button
              onClick={() => {
                setEditorMode("seo");
                setSelectedId(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                editorMode === "seo"
                  ? "bg-white text-[#f97316] shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Kampanya &amp; SEO
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {editorMode === "sections" ? (
              <SectionsManager
                sections={sections}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                onToggleVisible={toggleVisible}
                onReorder={(reordered) => setSections(reordered)}
              />
            ) : editorMode === "theme" ? (
              <div className="p-4 space-y-5">
                <div className="rounded-xl border border-[#f97316]/15 bg-orange-500/5 p-3 text-[10px] text-[#f97316] font-black flex items-start gap-2 leading-relaxed uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Stil ayarları tüm mağaza genelinde geçerli olur.</span>
                </div>

                {/* Typography Settings */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Genel Tipografi &amp; Logo</h3>
                  
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Logo Resmi Görsel Seçimi</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cmsValues.logoUrl || ""}
                        onChange={(e) => handleFieldChange("logoUrl", e.target.value)}
                        placeholder="/uploads/logo.png"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#f97316] font-mono text-[10px]"
                      />
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0" title="Logo Yükle">
                        {logoUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f97316]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={logoUploading}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Yazı Tipi (Font-Family)</label>
                    <select
                      value={cmsValues.logoFont || "Outfit"}
                      onChange={(e) => handleFieldChange("logoFont", e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700"
                    >
                      {["Outfit", "Inter", "Roboto", "Poppins", "Montserrat"].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Logo Boyutu ({cmsValues.logoSize || 18}px)</label>
                    <input
                      type="range"
                      min="12"
                      max="36"
                      value={cmsValues.logoSize || 18}
                      onChange={(e) => handleFieldChange("logoSize", Number(e.target.value))}
                      className="w-full accent-[#f97316]"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Firma Kaşesi (e-Arşiv Fatura)</label>
                    <p className="text-[9px] text-slate-400 mb-1.5">Yüklediğiniz kaşe resmi, e-Arşiv fatura çıktılarında otomatik olarak görünür.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cmsValues.companyStampUrl || ""}
                        onChange={(e) => handleFieldChange("companyStampUrl", e.target.value)}
                        placeholder="/uploads/kase.png"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#f97316] font-mono text-[10px]"
                      />
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0" title="Kaşe Yükle">
                        {stampUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f97316]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStampUpload}
                          className="hidden"
                          disabled={stampUploading}
                        />
                      </label>
                    </div>
                    {cmsValues.companyStampUrl && (
                      <div className="mt-2">
                        <img src={cmsValues.companyStampUrl} alt="Firma Kaşesi Önizleme" className="max-h-16 max-w-[140px] object-contain border border-dashed border-slate-200 rounded p-1" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Settings */}
                <div className="space-y-4 mt-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">Renk Paleti</h3>
                  
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ana Renk (Primary)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsValues.primaryColor || "#f97316"}
                        onChange={(e) => handleFieldChange("primaryColor", e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shadow-xs"
                      />
                      <input
                        type="text"
                        value={cmsValues.primaryColor || "#f97316"}
                        onChange={(e) => handleFieldChange("primaryColor", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#f97316] font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">İkincil Renk (Secondary)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={cmsValues.secondaryColor || "#1F2937"}
                        onChange={(e) => handleFieldChange("secondaryColor", e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shadow-xs"
                      />
                      <input
                        type="text"
                        value={cmsValues.secondaryColor || "#1F2937"}
                        onChange={(e) => handleFieldChange("secondaryColor", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#f97316] font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <SeoCampaignEditor values={cmsValues} onChange={handleFieldChange} />
              </div>
            )}
          </div>
        </aside>

        {/* CENTER PANEL: Live interactive preview iframe */}
        <div className="flex-1 flex flex-col items-center overflow-hidden bg-slate-100">
          <div className="flex-1 flex items-center justify-center w-full py-4 px-3 overflow-auto">
            <div
              className="bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 h-full relative"
              style={{
                width: viewportWidth[viewport],
                maxWidth: "100%",
                minHeight: "450px"
              }}
            >
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-white/80 backdrop-blur-xs z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Değişiklikler Uygulanıyor...</p>
                </div>
              )}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src="/tr"
                className="w-full h-full border-0"
                onLoad={() => setIframeLoading(false)}
                title="Canlı Görsel Önizleme"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Fields Editor details for the selected section block */}
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
          {selectedSection ? (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{selectedSection.icon}</span>
                  <div>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">{selectedSection.label}</h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Bölüm Parametreleri</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleVisible(selectedSection.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                    selectedSection.visible
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-150"
                  }`}
                >
                  {selectedSection.visible ? (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Görünür
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Gizli
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedSection.fields ? (
                  Object.keys(selectedSection.fields).map((fieldKey) => {
                    const fields = selectedSection.fields || {};
                    const fieldValue = fields[fieldKey];
                    const label = fieldKey.replace(/([A-Z])/g, " $1").trim(); // Decamelcase labels
                    const inputClass =
                      "w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#f97316] transition-all bg-white font-semibold text-slate-800";

                    return (
                      <div key={fieldKey} className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest capitalize">
                          {label}
                        </label>
                        {typeof fieldValue === "boolean" ? (
                          <div className="flex items-center justify-between py-1 bg-slate-50/50 px-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-600">Aktif mi?</span>
                            <button
                              type="button"
                              onClick={() => handleSectionFieldChange(selectedSection.id, fieldKey, !fieldValue)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                fieldValue ? "bg-orange-500" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  fieldValue ? "translate-x-5" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        ) : typeof fieldValue === "number" ? (
                          <input
                            type="number"
                            value={fieldValue}
                            onChange={(e) => handleSectionFieldChange(selectedSection.id, fieldKey, Number(e.target.value))}
                            className={inputClass}
                          />
                        ) : (
                          <textarea
                            rows={3}
                            value={fieldValue}
                            onChange={(e) => handleSectionFieldChange(selectedSection.id, fieldKey, e.target.value)}
                            className={inputClass}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Settings className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider">Özelleştirilebilir Alan Bulunmuyor.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <Settings className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-wider">Düzenlenecek Bölümü Sol Panelden Seçin.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
