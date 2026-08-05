"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

export default function Iletisim() {
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showLiveMap, setShowLiveMap] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    fetchLiveSettings().then((live) => {
      if (live) setSettings(live);
    });

    const handleSettingsChange = () => {
      setSettings(getSettings());
    };
    window.addEventListener("pekefe_settings_changed", handleSettingsChange);
    return () => {
      window.removeEventListener("pekefe_settings_changed", handleSettingsChange);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setToast({
      isOpen: true,
      message: "Mesajınız iletildi! En kısa sürede sizinle iletişime geçeceğiz.",
      type: "success",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-secondary-fixed to-transparent"></div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center">
          <span className="font-label-md text-secondary tracking-widest uppercase mb-4 block">
            Bize Ulaşın
          </span>
          <h1 className="font-display-lg text-[40px] md:text-display-lg text-primary mb-6">
            İletişim
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Geleneksel lezzetlerimize dair merak ettiklerinizi sormak veya görüşlerinizi paylaşmak için bizimle dilediğiniz zaman iletişime geçebilirsiniz.
          </p>
        </div>
      </section>

      {/* Contact Info & Form Grid */}
      <section className="pb-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-xl premium-shadow space-y-8 border border-outline-variant/10">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-secondary-fixed text-secondary p-3 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div>
                    <h3 className="font-label-md text-primary uppercase mb-1">Adres</h3>
                    <a
                      href={settings.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body-md text-on-surface hover:text-primary transition-colors whitespace-pre-line"
                    >
                      {settings.address}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-secondary-fixed text-secondary p-3 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <div>
                    <h3 className="font-label-md text-primary uppercase mb-1">Telefon</h3>
                    <a href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`} className="font-body-md text-on-surface hover:text-primary transition-colors">
                      {settings.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-secondary-fixed text-secondary p-3 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <h3 className="font-label-md text-primary uppercase mb-1">E-Posta</h3>
                    <a href={`mailto:${settings.email}`} className="font-body-md text-on-surface hover:text-primary transition-colors">
                      {settings.email}
                    </a>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-outline-variant/20">
                <h3 className="font-label-md text-on-surface-variant mb-4 font-bold text-xs uppercase tracking-widest">Sosyal Medya & İletişim</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Instagram */}
                  <a
                    className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-primary] hover:text-white hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] hover:border-transparent hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                    href={settings.instagram || "https://instagram.com/pekefe"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Pekefe Instagram Sayfası"
                    title="Instagram'da Takip Edin"
                  >
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>

                  {/* WhatsApp Direct Line */}
                  <a
                    className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-primary] hover:text-white hover:bg-[#25D366] hover:border-[#25D366] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                    href={settings.whatsapp || "https://wa.me/904425110000"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Pekefe WhatsApp Canlı Destek"
                    title="WhatsApp Canlı İletişim"
                  >
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.481 1.332 5.001L2 22l5.127-1.343c1.472.804 3.136 1.227 4.881 1.227h.004c5.506 0 9.99-4.478 9.99-9.985 0-2.667-1.039-5.176-2.928-7.064C17.186 3.041 14.677 2 12.012 2zm5.82 14.153c-.247.697-1.43 1.328-1.974 1.411-.504.077-1.161.115-3.32-.777-2.76-1.141-4.54-3.957-4.677-4.14-.136-.183-1.116-1.485-1.116-2.833 0-1.348.705-2.01.956-2.28.247-.27.538-.338.718-.338.18 0 .359.004.516.012.167.008.391-.063.612.467.225.539.764 1.86.832 1.997.067.137.112.298.022.476-.09.178-.135.29-.27.447-.135.158-.283.353-.404.474-.135.135-.276.282-.119.551.157.27.697 1.15 1.498 1.863 1.03 0.918 1.898 1.203 2.168 1.338.27.135.427.112.585-.067.157-.18.674-.787.854-1.056.18-.27.359-.225.606-.135.247.09 1.571.741 1.841.876.27.135.449.202.516.315.067.113.067.653-.18 1.35z"/>
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-primary] hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                    href={settings.facebook || "https://facebook.com/pekefe"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Pekefe Facebook Sayfası"
                    title="Facebook'ta Takip Edin"
                  >
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a
                    className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-primary] hover:text-white hover:bg-[#FF0000] hover:border-[#FF0000] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                    href={settings.youtube || "https://youtube.com/@pekefe"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Pekefe YouTube Kanalı"
                    title="YouTube Kanalımızı İzleyin"
                  >
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>

                  {/* Location Map Pin */}
                  <a
                    className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-primary] hover:text-white hover:bg-[#EA4335] hover:border-[#EA4335] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                    href={settings.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Pekefe Harita Konumu"
                    title="İspir Tesis Konumu"
                  >
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            {/* Interactive Map Component */}
            <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-outline-variant/20 shadow-xl group">
              {showLiveMap ? (
                <iframe
                  title="İspir Erzurum Haritası"
                  src="https://maps.google.com/maps?q=İspir,Erzurum&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <a
                  href={settings.mapsLink || "https://maps.google.com/?q=İspir+Erzurum"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full block relative cursor-pointer overflow-hidden group"
                  title="Google Haritalar'da Aç"
                >
                  <Image
                    className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
                    alt="İspir Erzurum Haritası"
                    src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center mb-3 shadow-2xl group-hover:scale-110 transition-transform duration-300 ring-4 ring-white/20">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        location_on
                      </span>
                    </div>
                    <p className="font-display text-white text-lg font-bold tracking-tight">İspir, Erzurum</p>
                    <span className="mt-2.5 text-xs text-white/90 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 font-semibold flex items-center gap-1.5 group-hover:bg-primary group-hover:border-primary transition-all">
                      <span>Google Haritalar'da Aç</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </span>
                  </div>
                </a>
              )}

              {/* Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setShowLiveMap(!showLiveMap)}
                className="absolute top-3 right-3 z-20 bg-surface/90 hover:bg-surface text-primary border border-outline-variant/30 text-xs font-bold px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-md flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-sm">{showLiveMap ? "photo_camera" : "map"}</span>
                <span>{showLiveMap ? "Fotoğraf Görünümü" : "Canlı Haritaya Geç"}</span>
              </button>
            </div>
          </div>
          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl premium-shadow border border-outline-variant/10 h-full">
              <h2 className="font-headline-md text-primary mb-8">Bize Mesaj Gönderin</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      Ad Soyad
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-lg bg-surface-container-low border-transparent focus:border-primary focus:ring-0 transition-all font-body-md outline-none"
                      placeholder="Adınız Soyadınız"
                      required
                      type="text"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      E-Posta
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-lg bg-surface-container-low border-transparent focus:border-primary focus:ring-0 transition-all font-body-md outline-none"
                      placeholder="ornek@mail.com"
                      required
                      type="email"
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                    Konu
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border-transparent focus:border-primary focus:ring-0 transition-all font-body-md outline-none"
                    placeholder="Mesajınızın konusu"
                    required
                    type="text"
                  />
                </div>
                <div className="space-y-2 group">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                    Mesaj
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg bg-surface-container-low border-transparent focus:border-primary focus:ring-0 transition-all font-body-md outline-none resize-none"
                    placeholder="Size nasıl yardımcı olabiliriz?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                  ></textarea>
                </div>
                {submitted && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-semibold flex items-center gap-3 animate-fade-in" role="status">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Mesajınız başarıyla alındı. Teşekkür ederiz!</span>
                  </div>
                )}
                <div className="pt-4">
                  <button
                    className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-lg font-label-md uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
                    type="submit"
                  >
                    Mesaj Gönder
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      {/* FAQ Shortcut */}
      <section className="bg-secondary-fixed py-16">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="material-symbols-outlined text-4xl text-secondary mb-2">help_outline</span>
            <h2 className="font-headline-md text-on-secondary-fixed">Hızlı Cevaba mı İhtiyacınız Var?</h2>
            <p className="font-body-md text-on-secondary-fixed-variant mb-6">
              Sıkça sorulan sorular sayfamızda sipariş, teslimat ve iade süreçlerine dair birçok cevabı bulabilirsiniz.
            </p>
            <Link
              className="inline-flex items-center gap-2 font-label-md text-primary border-b-2 border-primary pb-1 hover:gap-4 transition-all"
              href="/sss"
            >
              SSS Sayfasına Git
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}


