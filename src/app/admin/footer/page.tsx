"use client";

import { useState, useEffect } from "react";
import { 
  Info, 
  Save, 
  Check, 
  Loader2, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle 
} from "lucide-react";
import { toast } from "sonner";
import { useCMS } from "@/context/CMSContext";

import { saveSettings } from "@/utils/settingsStorage";

export default function FooterAdminPage() {
  const { cmsData, updateCMSData } = useCMS();
  const [footerText, setFooterText] = useState("");
  const [footerSlogan, setFooterSlogan] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialWhatsapp, setSocialWhatsapp] = useState("");
  const [mapCoordinates, setMapCoordinates] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (cmsData) {
      setFooterText(cmsData.footerText ?? "© 2026 Pekefe Geleneksel Ürünler. Tüm Hakları Saklıdır.");
      setFooterSlogan(cmsData.footerSlogan ?? "İspir Yayla Lezzetleri");
      setContactPhone(cmsData.contactPhone ?? "+90 (442) 511 00 00");
      setContactEmail(cmsData.contactEmail ?? "info@pekefe.com");
      setContactAddress(cmsData.contactAddress ?? "Atatürk Cad. No:42, İspir, Erzurum, Türkiye");
      setSocialInstagram(cmsData.socialInstagram ?? "https://instagram.com/pekefe");
      setSocialFacebook(cmsData.socialFacebook ?? "https://facebook.com/pekefe");
      setSocialYoutube(cmsData.socialYoutube ?? "https://youtube.com/@pekefe");
      setSocialWhatsapp(cmsData.socialWhatsapp ?? "https://wa.me/904425110000");
      setMapCoordinates(cmsData.mapCoordinates ?? "");
    }
  }, [cmsData]);

  const save = async () => {
    if (footerText.length > 200) {
      toast.error("Telif hakkı metni en fazla 200 karakter olmalıdır.");
      return;
    }
    if (footerSlogan.length > 100) {
      toast.error("Slogan en fazla 100 karakter olmalıdır.");
      return;
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error("Geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (contactPhone && !/^[0-9+\s().-]{7,20}$/.test(contactPhone)) {
      toast.error("Geçerli bir telefon numarası giriniz.");
      return;
    }
    if (contactAddress && contactAddress.length < 10) {
      toast.error("Adres en az 10 karakter olmalıdır.");
      return;
    }

    setSaving(true);
    try {
      await updateCMSData({ 
        footerText,
        footerSlogan,
        contactPhone,
        contactEmail,
        contactAddress,
        socialInstagram,
        socialFacebook,
        socialYoutube,
        socialWhatsapp,
        mapCoordinates,
      });

      saveSettings({
        email: contactEmail,
        phone: contactPhone,
        address: contactAddress,
        instagram: socialInstagram,
        whatsapp: socialWhatsapp,
        facebook: socialFacebook,
        youtube: socialYoutube,
        mapsLink: mapCoordinates ? `https://maps.google.com/?q=${encodeURIComponent(mapCoordinates)}` : `https://maps.google.com/?q=${encodeURIComponent(contactAddress)}`,
      });

      setSaved(true);
      toast.success("İletişim ve sosyal medya ayarları başarıyla kaydedildi.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error("Ayarlar kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309]/40 transition bg-white text-slate-900";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#b45309]" />
            Footer & Link Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Alt bilgi (footer) alanlarını, iletişim bilgilerini ve sosyal medya linklerini düzenleyin.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol Sütun: Genel Bilgiler & İletişim */}
        <div className="space-y-6">
          {/* Bölüm 1: Genel Telif ve Slogan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b45309]"></span>
              Telif ve Marka Bilgisi
            </h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slogan</label>
              <input
                type="text"
                value={footerSlogan}
                onChange={(e) => setFooterSlogan(e.target.value)}
                className={inputClass}
                placeholder="Profesyonel Ekipman"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telif Hakkı Metni</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className={inputClass}
                placeholder="© 2026 Pekefe. Tüm Hakları Saklıdır."
              />
            </div>
          </div>

          {/* Bölüm 2: İletişim Bilgileri */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              İletişim Bilgileri
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-400" /> Telefon Numarası
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={inputClass}
                placeholder="+90 544 149 48 51"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-gray-400" /> E-posta Adresi
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={inputClass}
                placeholder="info@atakaricilik.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> Açık Adres
              </label>
              <textarea
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className={`${inputClass} min-h-[80px] resize-none`}
                placeholder="Erzurum, Türkiye"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" /> Harita Koordinatları (Enlem, Boylam)
              </label>
              <input
                type="text"
                value={mapCoordinates}
                onChange={(e) => setMapCoordinates(e.target.value)}
                className={inputClass}
                placeholder="Örn: 39.9079, 41.2826"
              />
              <p className="text-[11px] text-gray-400 mt-1">Haritada tam konum göstermek için enlem ve boylam girin (örn: 39.9079, 41.2826). Boş bırakılırsa yazılı adres aranır.</p>
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Sosyal Medya */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 h-full">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Sosyal Medya Bağlantıları
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <svg className="w-4 h-4 fill-[#E1306C]" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg> 
                Instagram Link / Kullanıcı Adı
              </label>
              <input
                type="text"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                className={inputClass}
                placeholder="instagram.com/atakaricilik"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook Link / Kullanıcı Adı
              </label>
              <input
                type="text"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                className={inputClass}
                placeholder="facebook.com/atakaricilik"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <svg className="w-4 h-4 fill-[#FF0000]" viewBox="0 0 24 24">
                  <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                </svg>
                YouTube Kanal Linki
              </label>
              <input
                type="text"
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                className={inputClass}
                placeholder="youtube.com/@atakaricilik"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp Numarası (Sadece Rakamlar)
              </label>
              <input
                type="text"
                value={socialWhatsapp}
                onChange={(e) => setSocialWhatsapp(e.target.value)}
                className={inputClass}
                placeholder="905441494851"
              />
              <p className="text-[11px] text-gray-400 mt-1">Örn: Ülke kodu ile birlikte boşluksuz yazın (örn: 905441494851)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

