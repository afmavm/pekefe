"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Globe, Save, Check, Loader2, AlertCircle, Phone, Mail, MapPin, 
  MessageCircle, Search, ShieldCheck, FileCode, Share2, Sparkles, 
  Eye, RefreshCw, Link as LinkIcon, Image as ImageIcon, Code, Upload
} from "lucide-react";
import { toast } from "sonner";
import SeoIssuesWidget from "@/components/SeoIssuesWidget";

// High-fidelity custom SVG icons for social channels compatible with all Lucide versions
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

interface SeoState {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  ogImageUrl: string;
  googleVerificationCode: string;
  bingVerificationCode: string;
  robotsIndex: boolean;
  
  socialInstagram: string;
  socialWhatsapp: string;
  socialFacebook: string;
  socialYoutube: string;
  
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  companyNameField: string;
  companyVkn: string;
  companyTaxOffice: string;
  companyMersis: string;
  mapCoordinates: string;

  gtmId: string;
  gaMeasurementId: string;
  gtmEnabled: boolean;
  gtmRequireConsent: boolean;
}

const defaults: SeoState = {
  siteName: "PEKEFE | Geleneksel İspir Dut Pekmezi & Ham Çiçek Balı",
  siteDescription: "İspir'in 2200m+ rakımlı el değmemiş yaylalarından sofranıza uzanan, bakır kazanlarda ağır ağır üretilen %100 doğal ham dut pekmezi, ham bal ve yöresel lezzetler.",
  siteKeywords: "İspir Dut Pekmezi, Pekefe, Geleneksel Pekmez, Kaçkar Ham Balı, Coğrafi İşaretli Pekmez, Erzurum Yöresel Ürünler",
  ogImageUrl: "/og-image.jpg",
  googleVerificationCode: "QTYkkg0-x4Z8s5nuv0Qg3T0ePXA35ZhKuLp0ryCXS2s",
  bingVerificationCode: "",
  robotsIndex: true,
  socialInstagram: "https://instagram.com/pekefe",
  socialWhatsapp: "05441494851",
  socialFacebook: "",
  socialYoutube: "",
  contactPhone: "0544 149 48 51",
  contactEmail: "info@pekefe.com",
  contactAddress: "İspir, Erzurum, Türkiye",
  companyNameField: "PEKEFE İspir Yöresel Ürünler",
  companyVkn: "",
  companyTaxOffice: "",
  companyMersis: "",
  mapCoordinates: "",
  gtmId: "GTM-MVFDVLJL, GTM-5G6JF6TV",
  gaMeasurementId: "",
  gtmEnabled: true,
  gtmRequireConsent: false,
};

export default function SeoAdminPage() {
  const [seo, setSeo] = useState<SeoState>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"meta" | "social" | "audit" | "corporate" | "indexing" | "analytics">("meta");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSeo({
            siteName: data.siteName ?? defaults.siteName,
            siteDescription: data.siteDescription ?? defaults.siteDescription,
            siteKeywords: data.siteKeywords ?? defaults.siteKeywords,
            ogImageUrl: data.ogImageUrl ?? defaults.ogImageUrl,
            googleVerificationCode: data.googleVerificationCode ?? defaults.googleVerificationCode,
            bingVerificationCode: data.bingVerificationCode ?? "",
            robotsIndex: data.robotsIndex !== undefined ? !!data.robotsIndex : true,
            socialInstagram: data.socialInstagram ?? "",
            socialWhatsapp: data.socialWhatsapp ?? "",
            socialFacebook: data.socialFacebook ?? "",
            socialYoutube: data.socialYoutube ?? "",
            contactPhone: data.contactPhone ?? "",
            contactEmail: data.contactEmail ?? "",
            contactAddress: data.contactAddress ?? "",
            companyNameField: data.companyName || "",
            companyVkn: data.companyTaxNo || "",
            companyTaxOffice: data.companyTaxOffice || "",
            companyMersis: data.companyMersisNo || "",
            mapCoordinates: data.mapCoordinates || "",
            gtmId: data.gtmId !== undefined && data.gtmId !== null ? String(data.gtmId) : defaults.gtmId,
            gaMeasurementId: data.gaMeasurementId || "",
            gtmEnabled: data.gtmEnabled !== undefined ? Boolean(data.gtmEnabled === true || data.gtmEnabled === 1 || data.gtmEnabled === "true") : true,
            gtmRequireConsent: data.gtmRequireConsent !== undefined ? Boolean(data.gtmRequireConsent === true || data.gtmRequireConsent === 1 || data.gtmRequireConsent === "true") : false,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        siteName: seo.siteName,
        siteDescription: seo.siteDescription,
        siteKeywords: seo.siteKeywords,
        ogImageUrl: seo.ogImageUrl,
        googleVerificationCode: seo.googleVerificationCode,
        bingVerificationCode: seo.bingVerificationCode,
        robotsIndex: seo.robotsIndex,
        socialInstagram: seo.socialInstagram,
        socialWhatsapp: seo.socialWhatsapp,
        socialFacebook: seo.socialFacebook,
        socialYoutube: seo.socialYoutube,
        contactPhone: seo.contactPhone,
        contactEmail: seo.contactEmail,
        contactAddress: seo.contactAddress,
        companyName: seo.companyNameField,
        companyTaxNo: seo.companyVkn,
        companyTaxOffice: seo.companyTaxOffice,
        companyMersisNo: seo.companyMersis,
        mapCoordinates: seo.mapCoordinates,
        gtmId: seo.gtmId.trim().toUpperCase(),
        gaMeasurementId: seo.gaMeasurementId.trim().toUpperCase(),
        gtmEnabled: seo.gtmEnabled,
        gtmRequireConsent: seo.gtmRequireConsent,
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Kayıt sırasında bir hata oluştu.");
      }
      
      setSaved(true);
      toast.success("SEO, İndeksleme ve İletişim ayarları başarıyla güncellendi.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof SeoState, val: any) => {
    setSeo((prev) => ({ ...prev, [key]: val }));
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309] transition bg-white text-slate-900 placeholder-gray-400";

  const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#b45309]" />
        <span className="text-sm text-gray-500 font-semibold">SEO Komuta Merkezi Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#b45309]" />
            SEO & Arama Motoru İyileştirme Paneli
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Meta etiketleri, Google SERP görünürlüğü, indeksleme ve otomatik SEO denetimini yönetin.
          </p>
        </div>
        
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition shadow-md ${
            saved 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
              : "text-white bg-[#b45309] hover:bg-amber-800 shadow-amber-900/10"
          } ${saving ? "opacity-75 cursor-not-allowed" : ""}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Değişiklikleri Kaydet"}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("meta")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            activeTab === "meta"
              ? "bg-[#b45309] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Search className="w-4 h-4" />
          Meta & SERP Arama
        </button>

        <button
          onClick={() => setActiveTab("social")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            activeTab === "social"
              ? "bg-[#b45309] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Share2 className="w-4 h-4" />
          Sosyal Medya & Open Graph
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            activeTab === "audit"
              ? "bg-[#b45309] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          Canlı SEO Denetimi & Taramalar
        </button>

        <button
          onClick={() => setActiveTab("indexing")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            activeTab === "indexing"
              ? "bg-[#b45309] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Code className="w-4 h-4" />
          Google Console & Robots.txt
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            activeTab === "analytics"
              ? "bg-[#b45309] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <FileCode className="w-4 h-4" />
          Google Tag Manager & Analitik
        </button>

        <button
          onClick={() => setActiveTab("corporate")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
            activeTab === "corporate"
              ? "bg-[#b45309] text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Firma & Schema.org Yapısal Veri
        </button>
      </div>

      {/* TAB 1: META & SERP PREVIEW */}
      {activeTab === "meta" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#b45309]" />
              Arama Motoru Meta Bilgileri
            </h2>

            <div>
              <label className={labelClass}>Site Başlığı (Meta Title) *</label>
              <input
                type="text"
                value={seo.siteName}
                onChange={(e) => update("siteName", e.target.value)}
                className={inputClass + " font-bold"}
                placeholder="PEKEFE | Geleneksel İspir Dut Pekmezi"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[11px] text-gray-400">Google Önerisi: 50–60 karakter.</p>
                <span className={`text-[11px] font-bold ${seo.siteName.length > 60 || seo.siteName.length < 30 ? "text-amber-600" : "text-emerald-600"}`}>
                  Mevcut: {seo.siteName.length} Karakter
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Site Açıklaması (Meta Description) *</label>
              <textarea
                value={seo.siteDescription}
                onChange={(e) => update("siteDescription", e.target.value)}
                rows={4}
                className={inputClass + " resize-none"}
                placeholder="İspir'in 2200m rakımlı yaylalarından sofranıza uzanan doğal ham bal..."
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[11px] text-gray-400">Google Önerisi: 120–160 karakter.</p>
                <span className={`text-[11px] font-bold ${seo.siteDescription.length > 160 || seo.siteDescription.length < 120 ? "text-amber-600" : "text-emerald-600"}`}>
                  Mevcut: {seo.siteDescription.length} Karakter
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Anahtar Kelimeler (Meta Keywords)</label>
              <textarea
                value={seo.siteKeywords}
                onChange={(e) => update("siteKeywords", e.target.value)}
                rows={2}
                className={inputClass + " resize-none"}
                placeholder="İspir Dut Pekmezi, Pekefe, Ham Bal, Yöresel Ürünler"
              />
              <p className="text-[11px] text-gray-400 mt-1">Virgül (,) ile ayırarak yazın.</p>
            </div>
          </div>

          {/* Live SERP Simulator Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col min-h-[380px] sticky top-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#b45309]" />
                  Google Arama Sonucu (SERP) Simülatörü
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Canlı Önizleme
                </span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 font-sans space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-[10px]">P</div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-800 font-medium">www.pekefe.com</span>
                    <span className="text-[10px] text-gray-400">https://www.pekefe.com</span>
                  </div>
                </div>

                <h3 className="text-base text-blue-800 font-bold hover:underline cursor-pointer tracking-normal leading-snug line-clamp-1">
                  {seo.siteName || "PEKEFE | Geleneksel Dut Pekmezi"}
                </h3>

                <p className="text-xs text-gray-600 leading-normal line-clamp-2">
                  {seo.siteDescription || "İspir yaylasının saf ham balı ve bakır kazanlarda üretilen %100 doğal ham dut pekmezi..."}
                </p>
              </div>

              <div className="mt-4 p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>SEO İpucu:</strong> Arama sonuçlarında başlıklarınızın sonuna kelime kesilmemesi için 60 karakteri geçmemeye özen gösterin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL MEDIA & OPEN GRAPH */}
      {activeTab === "social" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#b45309]" />
              Sosyal Medya Bağlantıları & Open Graph
            </h2>

            <div>
              <label className={labelClass}>Sosyal Paylaşım Görsel Linki (og:image)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={seo.ogImageUrl}
                  onChange={(e) => update("ogImageUrl", e.target.value)}
                  className={inputClass}
                  placeholder="/og-image.jpg veya https://www.pekefe.com/og-image.jpg"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">WhatsApp veya Facebook'ta link paylaşıldığında çıkan kapak resmi.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className={labelClass}>Instagram Profil Linki</label>
                <div className="relative">
                  <InstagramIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={seo.socialInstagram}
                    onChange={(e) => update("socialInstagram", e.target.value)}
                    className={inputClass + " pl-10"}
                    placeholder="https://instagram.com/pekefe"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>WhatsApp İletişim Numarası veya Linki</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    value={seo.socialWhatsapp}
                    onChange={(e) => update("socialWhatsapp", e.target.value)}
                    className={inputClass + " pl-10"}
                    placeholder="05441494851"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Facebook Sayfa Linki</label>
                <div className="relative">
                  <FacebookIcon className="absolute left-3 top-3 w-4 h-4 text-blue-600" />
                  <input
                    type="text"
                    value={seo.socialFacebook}
                    onChange={(e) => update("socialFacebook", e.target.value)}
                    className={inputClass + " pl-10"}
                    placeholder="https://facebook.com/pekefe"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>YouTube Kanal Linki</label>
                <div className="relative">
                  <YoutubeIcon className="absolute left-3 top-3 w-4 h-4 text-red-600" />
                  <input
                    type="text"
                    value={seo.socialYoutube}
                    onChange={(e) => update("socialYoutube", e.target.value)}
                    className={inputClass + " pl-10"}
                    placeholder="https://youtube.com/@pekefe"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col min-h-[380px] sticky top-6">
              <span className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#b45309]" />
                WhatsApp & Sosyal Medya Paylaşım Kartı
              </span>

              <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-xl border border-slate-800">
                <div className="relative h-44 w-full bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                  {seo.ogImageUrl ? (
                    <Image
                      src={seo.ogImageUrl}
                      alt="OG Cover"
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-600" />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
                    PEKEFE.COM
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">
                    {seo.siteName || "PEKEFE İspir Yöresel Ürünler"}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {seo.siteDescription || "İspir yaylasının geleneksel dut pekmezi ve ham bal koleksiyonu."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SEO AUDIT WIDGET */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <SeoIssuesWidget />
        </div>
      )}

      {/* TAB 4: GOOGLE CONSOLE & ROBOTS.TXT */}
      {activeTab === "indexing" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
            <Code className="w-4 h-4 text-[#b45309]" />
            Arama Motoru Doğrulama & İndeksleme Kodları
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Google Search Console Meta Doğrulama Kodu</label>
              <input
                type="text"
                value={seo.googleVerificationCode}
                onChange={(e) => update("googleVerificationCode", e.target.value)}
                className={inputClass + " font-mono text-xs"}
                placeholder="QTYkkg0-x4Z8s5nuv0Qg3T0ePXA35ZhKuLp0ryCXS2s"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                <code>&lt;meta name="google-site-verification" content="..." /&gt;</code> içindeki kod.
              </p>
            </div>

            <div>
              <label className={labelClass}>Bing Webmaster Verification Kodu</label>
              <input
                type="text"
                value={seo.bingVerificationCode}
                onChange={(e) => update("bingVerificationCode", e.target.value)}
                className={inputClass + " font-mono text-xs"}
                placeholder="0123456789ABCDEF0123456789ABCDEF"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Arama Motoru İndeksleme İzni (Robots.txt)</h3>
                <p className="text-xs text-gray-500">Google ve diğer botların sitenizi indekslemesine izin verin.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${seo.robotsIndex ? "text-emerald-600" : "text-red-600"}`}>
                  {seo.robotsIndex ? "INDEX, FOLLOW (İzinli)" : "NOINDEX, NOFOLLOW (Engelli)"}
                </span>
                <button
                  type="button"
                  onClick={() => update("robotsIndex", !seo.robotsIndex)}
                  className={`relative inline-flex w-12 h-6.5 rounded-full transition-colors duration-200 shrink-0 ${
                    seo.robotsIndex ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 bg-white rounded-full shadow transition-transform duration-200 ${
                      seo.robotsIndex ? "translate-x-5.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-700 font-mono">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span>Sitemap XML Adresiniz: <strong>https://www.pekefe.com/sitemap.xml</strong></span>
              </div>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-lg border border-gray-200 transition shrink-0"
              >
                Sitemap'i Görüntüle ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GOOGLE TAG MANAGER & ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#b45309]" />
                Google Tag Manager (GTM) &amp; Google Analytics 4 Yönetimi
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Takip kodlarını kod değişikliği yapmadan doğrudan buradan güncelleyebilir veya pasife alabilirsiniz. Yönetim paneli trafiği otomatik olarak hariç tutulur.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                seo.gtmEnabled && seo.gtmId
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${seo.gtmEnabled && seo.gtmId ? "bg-emerald-500" : "bg-gray-400"}`} />
              {seo.gtmEnabled && seo.gtmId ? "Aktif" : "Pasif"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Google Tag Manager Container ID&apos;leri (Çoklu Destek)</label>
              <input
                type="text"
                value={seo.gtmId}
                onChange={(e) => update("gtmId", e.target.value.toUpperCase())}
                className={inputClass + " font-mono"}
                placeholder="GTM-MVFDVLJL, GTM-5G6JF6TV"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Birden fazla GTM kapsayıcısını virgülle ayırarak girebilirsiniz (Örn: <code className="font-mono text-gray-600">GTM-MVFDVLJL, GTM-5G6JF6TV</code>).
              </p>
              {/* Aktif GTM Rozetleri */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {seo.gtmId
                  .split(/[\s,;]+/)
                  .map((s) => s.trim().toUpperCase())
                  .filter((s) => /^GTM-[A-Z0-9]+$/i.test(s))
                  .map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono text-xs font-bold"
                    >
                      {id}
                      <button
                        type="button"
                        onClick={() => {
                          const next = seo.gtmId
                            .split(/[\s,;]+/)
                            .map((s) => s.trim().toUpperCase())
                            .filter((s) => s && s !== id)
                            .join(", ");
                          update("gtmId", next);
                        }}
                        className="text-amber-600 hover:text-rose-600 cursor-pointer"
                        title={`${id} kapsayıcısını kaldır`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Google Analytics 4 (GA4) Ölçüm Kimliği (Opsiyonel)</label>
              <input
                type="text"
                value={seo.gaMeasurementId}
                onChange={(e) => update("gaMeasurementId", e.target.value.toUpperCase())}
                className={inputClass + " font-mono"}
                placeholder="G-XXXXXXXXXX"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                GA4&apos;ü GTM üzerinden yönetiyorsanız bu alanı boş bırakabilirsiniz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/70 cursor-pointer">
              <input
                type="checkbox"
                checked={seo.gtmEnabled}
                onChange={(e) => update("gtmEnabled", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#b45309]"
              />
              <div>
                <span className="block text-sm font-bold text-gray-900">Takip Kodlarını Aktif Et</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Kapalı olduğunda sitede hiçbir GTM veya GA4 betiği çalıştırılmaz.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/70 cursor-pointer">
              <input
                type="checkbox"
                checked={seo.gtmRequireConsent}
                onChange={(e) => update("gtmRequireConsent", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#b45309]"
              />
              <div>
                <span className="block text-sm font-bold text-gray-900">Çerez Onayı Bekle (KVKK Modu)</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Aktif edilirse yalnızca çerez onayını kabul eden ziyaretçilerde yüklenir.
                </span>
              </div>
            </label>
          </div>

          {/* Canlı Script Önizlemesi */}
          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <span>Canlı Siteye Enjekte Edilecek Script Önizlemesi</span>
              <span className="text-emerald-400 font-mono">
                {seo.gtmId
                  .split(/[\s,;]+/)
                  .filter((s) => /^GTM-[A-Z0-9]+$/i.test(s.trim())).length}{" "}
                Kapsayıcı
              </span>
            </div>
              <pre className="text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{(() => {
  const validIds = seo.gtmId
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^GTM-[A-Z0-9]+$/i.test(s));
  if (!seo.gtmEnabled || validIds.length === 0) {
    return "<!-- Google Tag Manager şu an pasif veya geçerli GTM ID girilmemiş -->";
  }
  const loaders = validIds
    .map((id) => `<script async src="https://www.googletagmanager.com/gtm.js?id=${id}"></script>`)
    .join("\n");
  return `${loaders}
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>`;
})()}
            </pre>
          </div>

          {/* Google Merchant Center Ürün Feed'i */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Google Merchant Center — Canlı Ürün Feed&apos;i (XML &amp; TSV)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Yayındaki tüm PEKEFE ürünleri fiyat, indirim, stok, kategori, görsel galerisi, kargo ve GTIN/identifier_exists alanlarıyla Google Merchant Center standardında otomatik sunulur.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                <Check className="w-3.5 h-3.5" />
                RSS 2.0 / TRY / TR
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                readOnly
                value="https://www.pekefe.com/google-merchant.xml"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-blue-200 font-mono text-xs text-slate-800 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText("https://www.pekefe.com/google-merchant.xml");
                  toast.success("Google Merchant Center XML adresi kopyalandı.");
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
              >
                URL Kopyala
              </button>
              <a
                href="/google-merchant.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold text-center transition shrink-0"
              >
                XML Önizle ↗
              </a>
              <a
                href="/google-merchant.xml?format=tsv"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold text-center transition shrink-0"
              >
                TSV İndir
              </a>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Kurulum:</strong> Google Merchant Center → <em>Ürünler</em> → <em>Ürün kaynağı ekle</em> → <em>Dosyadan ürün ekle</em> → <em>Bağlantı girin</em> adımına yukarıdaki XML adresini yapıştırıp günlük otomatik çekim (Scheduled Fetch) planlayın.
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: CORPORATE & SCHEMA.ORG */}
      {activeTab === "corporate" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#b45309]" />
            Firma Resmi Bilgileri & Schema.org Yapısal Veri
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Firma Resmi Unvanı</label>
              <input
                type="text"
                value={seo.companyNameField}
                onChange={(e) => update("companyNameField", e.target.value)}
                className={inputClass}
                placeholder="PEKEFE İspir Yöresel Ürünler"
              />
            </div>

            <div>
              <label className={labelClass}>İletişim Telefonu</label>
              <input
                type="text"
                value={seo.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                className={inputClass}
                placeholder="0544 149 48 51"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>VKN / TCKN</label>
              <input
                type="text"
                value={seo.companyVkn}
                onChange={(e) => update("companyVkn", e.target.value)}
                className={inputClass}
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className={labelClass}>Vergi Dairesi</label>
              <input
                type="text"
                value={seo.companyTaxOffice}
                onChange={(e) => update("companyTaxOffice", e.target.value)}
                className={inputClass}
                placeholder="Erzurum Kurumlar"
              />
            </div>

            <div>
              <label className={labelClass}>Mersis Numarası</label>
              <input
                type="text"
                value={seo.companyMersis}
                onChange={(e) => update("companyMersis", e.target.value)}
                className={inputClass}
                placeholder="0123456789012345"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Açık Adres</label>
            <textarea
              value={seo.contactAddress}
              onChange={(e) => update("contactAddress", e.target.value)}
              rows={2}
              className={inputClass + " resize-none"}
              placeholder="İspir, Erzurum, Türkiye"
            />
          </div>

          <div>
            <label className={labelClass}>Harita Koordinatları (Lat, Long)</label>
            <input
              type="text"
              value={seo.mapCoordinates}
              onChange={(e) => update("mapCoordinates", e.target.value)}
              className={inputClass}
              placeholder="40.4811, 40.9953"
            />
            <p className="text-[11px] text-gray-400 mt-1">Google Maps aramasında yerel işletme (LocalBusiness) olarak gösterilmesi içindir.</p>
          </div>
        </div>
      )}
    </div>
  );
}
