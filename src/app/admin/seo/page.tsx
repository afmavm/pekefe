"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Check, Loader2, Globe, AlertCircle, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

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
}

interface SeoErrors {
  siteName?: string;
  siteDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialYoutube?: string;
  socialWhatsapp?: string;
  companyNameField?: string;
  companyVkn?: string;
  companyTaxOffice?: string;
  companyMersis?: string;
}

const defaults: SeoState = {
  siteName: "Atak Arıcılık",
  siteDescription: "",
  socialInstagram: "",
  socialWhatsapp: "",
  socialFacebook: "",
  socialYoutube: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  companyNameField: "",
  companyVkn: "",
  companyTaxOffice: "",
  companyMersis: "",
};

export default function SeoAdminPage() {
  const [seo, setSeo] = useState<SeoState>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<SeoErrors>({});

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          let nameField = data.companyName || "";
          let vkn = "";
          let taxOffice = "";
          let mersis = "";
          
          if (data.companyName && data.companyName.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(data.companyName);
              nameField = parsed.name || "";
              vkn = parsed.vkn || "";
              taxOffice = parsed.taxOffice || "";
              mersis = parsed.mersis || "";
            } catch (e) {}
          }

          setSeo({
            siteName: data.siteName ?? defaults.siteName,
            siteDescription: data.siteDescription ?? "",
            socialInstagram: data.socialInstagram ?? "",
            socialWhatsapp: data.socialWhatsapp ?? "",
            socialFacebook: data.socialFacebook ?? "",
            socialYoutube: data.socialYoutube ?? "",
            contactPhone: data.contactPhone ?? "",
            contactEmail: data.contactEmail ?? "",
            contactAddress: data.contactAddress ?? "",
            companyNameField: nameField,
            companyVkn: vkn,
            companyTaxOffice: taxOffice,
            companyMersis: mersis,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const validateField = (key: keyof SeoState, val: string) => {
    let errorMsg = "";

    if (key === "siteName") {
      if (!val.trim()) {
        errorMsg = "Site adı boş bırakılamaz.";
      } else if (val.length > 80) {
        errorMsg = "Site adı en fazla 80 karakter olmalıdır.";
      }
    }

    if (key === "siteDescription") {
      if (val.length > 200) {
        errorMsg = "Site açıklaması en fazla 200 karakter olmalıdır.";
      }
    }

    if (key === "contactEmail" && val.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        errorMsg = "Geçerli bir e-posta adresi giriniz.";
      }
    }

    if (key === "contactPhone" && val.trim()) {
      // Allows numbers, space, plus, minus, and parentheses
      const phoneRegex = /^[0-9+\s().-]{7,20}$/;
      if (!phoneRegex.test(val)) {
        errorMsg = "Geçerli bir telefon numarası giriniz (örn: 0850 123 4567).";
      }
    }

    if (key === "contactAddress" && val.trim()) {
      if (val.length < 10) {
        errorMsg = "Adres alanı en az 10 karakter olmalıdır.";
      }
    }

    if (key === "socialInstagram" && val.trim()) {
      const isUrl = val.startsWith("http://") || 
                    val.startsWith("https://") || 
                    val.startsWith("instagram.com") ||
                    val.startsWith("www.instagram.com") ||
                    val.startsWith("@");
      if (!isUrl) {
        errorMsg = "Instagram linki veya kullanıcı adı (@kullanici) giriniz.";
      }
    }

    if (key === "socialFacebook" && val.trim()) {
      const isUrl = val.startsWith("http://") || 
                    val.startsWith("https://") || 
                    val.startsWith("facebook.com") ||
                    val.startsWith("www.facebook.com") ||
                    val.startsWith("@");
      if (!isUrl) {
        errorMsg = "Facebook linki veya kullanıcı adı (@kullanici) giriniz.";
      }
    }

    if (key === "socialYoutube" && val.trim()) {
      const isUrl = val.startsWith("http://") || 
                    val.startsWith("https://") || 
                    val.startsWith("youtube.com") ||
                    val.startsWith("www.youtube.com") ||
                    val.startsWith("@");
      if (!isUrl) {
        errorMsg = "YouTube linki veya kanal adı (@kanal) giriniz.";
      }
    }

    if (key === "socialWhatsapp" && val.trim()) {
      const isUrlOrNumber = /^[0-9+\s().-]{7,20}$/.test(val) || 
                            val.startsWith("http://") || 
                            val.startsWith("https://") || 
                            val.startsWith("wa.me");
      if (!isUrlOrNumber) {
        errorMsg = "WhatsApp numarası veya wa.me linki giriniz.";
      }
    }

    if (key === "companyVkn" && val.trim()) {
      if (!/^\d{10,11}$/.test(val.trim())) {
        errorMsg = "VKN/TCKN 10 veya 11 haneli rakamlardan oluşmalıdır.";
      }
    }

    if (key === "companyMersis" && val.trim()) {
      if (!/^\d{15,16}$/.test(val.trim())) {
        errorMsg = "Mersis numarası 15 veya 16 haneli rakamlardan oluşmalıdır.";
      }
    }

    setErrors((prev) => ({ ...prev, [key]: errorMsg ? errorMsg : undefined }));
    return !errorMsg;
  };

  const validateAll = (): boolean => {
    let isValid = true;
    (Object.keys(seo) as Array<keyof SeoState>).forEach((key) => {
      const result = validateField(key, seo[key]);
      if (!result) isValid = false;
    });
    return isValid;
  };

  const save = async () => {
    if (!validateAll()) {
      toast.error("Lütfen formdaki hataları giderdikten sonra tekrar deneyin.");
      return;
    }

    setSaving(true);
    try {
      const serializedCompanyName = JSON.stringify({
        name: seo.companyNameField,
        vkn: seo.companyVkn,
        taxOffice: seo.companyTaxOffice,
        mersis: seo.companyMersis
      });

      const payload = {
        siteName: seo.siteName,
        siteDescription: seo.siteDescription,
        socialInstagram: seo.socialInstagram,
        socialWhatsapp: seo.socialWhatsapp,
        socialFacebook: seo.socialFacebook,
        socialYoutube: seo.socialYoutube,
        contactPhone: seo.contactPhone,
        contactEmail: seo.contactEmail,
        contactAddress: seo.contactAddress,
        companyName: serializedCompanyName
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
      toast.success("SEO ve İletişim ayarları başarıyla güncellendi.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof SeoState, val: string) => {
    setSeo((prev) => ({ ...prev, [key]: val }));
    validateField(key, val);
  };

  const handleBlur = (key: keyof SeoState) => {
    let val = seo[key];
    if (!val) return;
    val = val.trim();

    let updatedVal = val;

    // Automatic link formatters for premium experience
    if (key === "socialInstagram" && val.startsWith("@")) {
      updatedVal = `https://instagram.com/${val.slice(1)}`;
    }
    if (key === "socialFacebook" && val.startsWith("@")) {
      updatedVal = `https://facebook.com/${val.slice(1)}`;
    }
    if (key === "socialYoutube" && val.startsWith("@")) {
      updatedVal = `https://youtube.com/@${val.slice(1)}`;
    }
    if (key === "socialWhatsapp") {
      const cleanNum = val.replace(/\D/g, "");
      if (cleanNum && !val.startsWith("http") && !val.startsWith("wa.me")) {
        if (cleanNum.length === 10 && cleanNum.startsWith("5")) {
          updatedVal = `https://wa.me/90${cleanNum}`;
        } else if (cleanNum.length === 11 && cleanNum.startsWith("05")) {
          updatedVal = `https://wa.me/90${cleanNum.slice(1)}`;
        } else if (cleanNum.startsWith("905")) {
          updatedVal = `https://wa.me/${cleanNum}`;
        }
      }
    }

    if (updatedVal !== val) {
      setSeo((prev) => ({ ...prev, [key]: updatedVal }));
      validateField(key, updatedVal);
    }
  };

  const inputClass = (errorKey?: string) =>
    `w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition bg-white text-slate-900 ${
      errorKey
        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
        : "border-gray-200 focus:ring-[#b45309]/20 focus:border-[#b45309]/40"
    }`;

  const textClass = (errorKey?: string) =>
    `w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition bg-white text-slate-900 resize-none ${
      errorKey
        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
        : "border-gray-200 focus:ring-[#b45309]/20 focus:border-[#b45309]/40"
    }`;

  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#b45309]" />
        <span className="text-sm text-gray-500">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#b45309]" />
            SEO & İletişim Ayarları
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Site adı, açıklaması ve iletişim bilgilerini yönetin.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
            saved ? "bg-emerald-500 text-white animate-pulse" : "bg-[#b45309] hover:bg-amber-700 text-white"
          } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Kaydet"}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700 font-medium">
          Bu alandaki değişiklikler sitenizin arama motoru görünürlüğünü doğrudan etkiler.
          Girdiğiniz veriler gerçek zamanlı kontrol edilerek kaydedilir ve ilgili tüm sayfalarda otomatik güncellenir.
        </p>
      </div>

      {/* Section 1: General Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Genel Site Bilgileri</h2>
        
        <div>
          <label className={labelClass}>Site Adı</label>
          <div className="relative">
            <Globe className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={seo.siteName} 
              onChange={(e) => update("siteName", e.target.value)} 
              onBlur={() => handleBlur("siteName")}
              className={inputClass(errors.siteName)} 
              placeholder="Atak Arıcılık" 
            />
          </div>
          {errors.siteName && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.siteName}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Site Açıklaması (Meta Description)</label>
          <textarea
            value={seo.siteDescription}
            onChange={(e) => update("siteDescription", e.target.value)}
            onBlur={() => handleBlur("siteDescription")}
            rows={3}
            className={textClass(errors.siteDescription)}
            placeholder="Erzurum fabrikamızda üretilen yüksek kaliteli arıcılık ekipmanları..."
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-400">
              Öneri: 120–160 karakter arası.{" "}
              <span className={seo.siteDescription.length > 160 || seo.siteDescription.length < 120 ? "text-amber-500 font-bold" : "text-emerald-600 font-bold"}>
                Mevcut: {seo.siteDescription.length}
              </span>
            </p>
            {errors.siteDescription && (
              <p className="text-red-500 text-xs flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.siteDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Contact Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">İletişim Bilgileri</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Telefon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={seo.contactPhone} 
                onChange={(e) => update("contactPhone", e.target.value)} 
                onBlur={() => handleBlur("contactPhone")}
                className={inputClass(errors.contactPhone)} 
                placeholder="0850 123 45 67" 
              />
            </div>
            {errors.contactPhone && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.contactPhone}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input 
                type="email" 
                value={seo.contactEmail} 
                onChange={(e) => update("contactEmail", e.target.value)} 
                onBlur={() => handleBlur("contactEmail")}
                className={inputClass(errors.contactEmail)} 
                placeholder="destek@atakaricilik.com" 
              />
            </div>
            {errors.contactEmail && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.contactEmail}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Adres</label>
          <div className="relative">
            <textarea 
              value={seo.contactAddress} 
              onChange={(e) => update("contactAddress", e.target.value)} 
              onBlur={() => handleBlur("contactAddress")}
              rows={2} 
              className={textClass(errors.contactAddress)} 
              placeholder="Erzurum, Türkiye" 
            />
          </div>
          {errors.contactAddress && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.contactAddress}
            </p>
          )}
        </div>
      </div>

      {/* Section 2.5: Corporate & Invoicing Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
          <span>E-Belge / Fatura & Firma Resmi Bilgileri</span>
        </h2>
        
        <div>
          <label className={labelClass}>Firma Resmi Unvanı</label>
          <div className="relative">
            <input 
              type="text" 
              value={seo.companyNameField} 
              onChange={(e) => update("companyNameField", e.target.value)} 
              className={textClass(errors.companyNameField)} 
              placeholder="Pekefe Geleneksel LİMİTED ŞİRKETİ" 
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
            Sipariş makbuzu ve resmi fatura şablonlarında gönderici unvanı olarak gösterilir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Firma VKN / TCKN</label>
            <div className="relative">
              <input 
                type="text" 
                value={seo.companyVkn} 
                onChange={(e) => update("companyVkn", e.target.value)} 
                className={textClass(errors.companyVkn)} 
                placeholder="12345678901" 
              />
            </div>
            {errors.companyVkn && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.companyVkn}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Vergi Dairesi</label>
            <div className="relative">
              <input 
                type="text" 
                value={seo.companyTaxOffice} 
                onChange={(e) => update("companyTaxOffice", e.target.value)} 
                className={textClass(errors.companyTaxOffice)} 
                placeholder="Kayseri Kurumlar" 
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Mersis Numarası</label>
            <div className="relative">
              <input 
                type="text" 
                value={seo.companyMersis} 
                onChange={(e) => update("companyMersis", e.target.value)} 
                className={textClass(errors.companyMersis)} 
                placeholder="0123456789012345" 
              />
            </div>
            {errors.companyMersis && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.companyMersis}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Social Media */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Sosyal Medya</h2>
        
        <div>
          <label className={labelClass}>Instagram URL</label>
          <div className="relative">
            <InstagramIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={seo.socialInstagram} 
              onChange={(e) => update("socialInstagram", e.target.value)} 
              onBlur={() => handleBlur("socialInstagram")}
              className={inputClass(errors.socialInstagram)} 
              placeholder="instagram.com/atakaricilik" 
            />
          </div>
          {errors.socialInstagram ? (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.socialInstagram}
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              Kullanıcı adı girebilirsiniz. Otomatik olarak tam linke çevrilir. (Örn: @atakaricilik)
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Facebook URL</label>
          <div className="relative">
            <FacebookIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={seo.socialFacebook} 
              onChange={(e) => update("socialFacebook", e.target.value)} 
              onBlur={() => handleBlur("socialFacebook")}
              className={inputClass(errors.socialFacebook)} 
              placeholder="facebook.com/atakaricilik" 
            />
          </div>
          {errors.socialFacebook ? (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.socialFacebook}
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              Kullanıcı adı girebilirsiniz. Otomatik olarak tam linke çevrilir. (Örn: @atakaricilik)
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>YouTube URL</label>
          <div className="relative">
            <YoutubeIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={seo.socialYoutube} 
              onChange={(e) => update("socialYoutube", e.target.value)} 
              onBlur={() => handleBlur("socialYoutube")}
              className={inputClass(errors.socialYoutube)} 
              placeholder="youtube.com/@atakaricilik" 
            />
          </div>
          {errors.socialYoutube ? (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.socialYoutube}
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              Kanal adı girebilirsiniz. Otomatik olarak tam linke çevrilir. (Örn: @atakaricilik)
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>WhatsApp Telefon Numarası veya Linki</label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={seo.socialWhatsapp} 
              onChange={(e) => update("socialWhatsapp", e.target.value)} 
              onBlur={() => handleBlur("socialWhatsapp")}
              className={inputClass(errors.socialWhatsapp)} 
              placeholder="0544 149 48 51" 
            />
          </div>
          {errors.socialWhatsapp ? (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.socialWhatsapp}
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              Telefon numarası girerseniz, otomatik olarak çalışan bir WhatsApp linkine dönüştürülür. (Örn: 0544...)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

