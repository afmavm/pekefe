"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant mt-auto" aria-label="Site Alt Bilgisi">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-gutter px-margin-mobile md:px-margin-desktop py-10 md:py-section-gap max-w-container-max mx-auto">
        {/* Brand Column */}
        <div className="space-y-4 md:space-y-6">
          <Link href="/" className="flex items-center gap-3 font-display-lg text-headline-md text-primary hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="PEKEFE Logo" width={56} height={56} className="h-10 md:h-12 w-auto object-contain drop-shadow-md" />
            <span className="font-bold text-xl md:text-2xl tracking-tight text-[#6b1d2f] dark:text-amber-400">Pekefe</span>
          </Link>
          <p className="text-on-surface-variant text-xs md:text-body-md leading-relaxed">
            İspir’in bereketli topraklarından, geleneksel yöntemlerle hazırlanan en doğal lezzetler.
          </p>
          {/* Social Media & Direct Contact Badges */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/80 block mb-3">
              Sosyal Medya & İletişim
            </span>
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Instagram */}
              <a
                className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-[#6b1d2f] hover:text-white hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] hover:border-transparent hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
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
                className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-[#6b1d2f] hover:text-white hover:bg-[#25D366] hover:border-[#25D366] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
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
                className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-[#6b1d2f] hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
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
                className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-[#6b1d2f] hover:text-white hover:bg-[#FF0000] hover:border-[#FF0000] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
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
                className="w-10 h-10 rounded-xl bg-white border border-outline-variant/40 shadow-sm flex items-center justify-center text-[#6b1d2f] hover:text-white hover:bg-[#EA4335] hover:border-[#EA4335] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
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

        {/* Links Column 1 */}
        <nav aria-label="Kurumsal Linkler">
          <h4 className="font-label-md text-xs sm:text-label-md text-on-surface mb-4 sm:mb-6 uppercase tracking-widest font-bold">Kurumsal</h4>
          <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm">
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/hikayemiz">
                Hikayemiz
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/tesisimiz">
                Üretim Tesisimiz
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/galeri">
                Görsel &amp; Video Galeri
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/blog">
                Blog ve Tarifler
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/kampanyalar">
                Kampanyalar &amp; Duyurular
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/b2b">
                B2B Portal
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/iletisim">
                İletişim
              </Link>
            </li>
          </ul>
        </nav>

        {/* Links Column 2 */}
        <nav aria-label="Yardım Linkleri">
          <h4 className="font-label-md text-xs sm:text-label-md text-on-surface mb-4 sm:mb-6 uppercase tracking-widest font-bold">Yardım</h4>
          <ul className="space-y-2.5 sm:space-y-4 text-xs sm:text-sm">
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/teslimat">
                Teslimat ve İade
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/sozlesme">
                Mesafeli Satış Sözleşmesi
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/gizlilik">
                Gizlilik Politikası
              </Link>
            </li>
            <li>
              <Link className="text-on-surface-variant hover:text-secondary hover:translate-x-1 transition-all inline-block" href="/sss">
                Sıkça Sorulan Sorular
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contact Column */}
        <address aria-label="İletişim Bilgileri" style={{ fontStyle: 'normal' }}>
          <h4 className="font-label-md text-xs sm:text-label-md text-on-surface mb-4 sm:mb-6 uppercase tracking-widest font-bold">İletişim</h4>
          <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
            <li className="flex gap-3 text-on-surface-variant items-center">
              <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">mail</span>
              <a href={`mailto:${settings.email || "info@pekefe.com"}`} className="hover:text-primary transition-colors truncate">
                {settings.email || "info@pekefe.com"}
              </a>
            </li>
            <li className="flex gap-3 text-on-surface-variant items-center">
              <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">phone</span>
              <a href={`tel:${(settings.phone || "05342709140").replace(/[^0-9+]/g, "")}`} className="hover:text-primary transition-colors">
                {settings.phone || "0534 270 91 40"}
              </a>
            </li>
            <li className="flex gap-3 text-on-surface-variant items-start">
              <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5" aria-hidden="true">location_on</span>
              <a
                href={settings.mapsLink || "https://maps.google.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors whitespace-pre-line"
              >
                {settings.address || "Çamlıca Mahallesi, İspir / Erzurum"}
              </a>
            </li>
          </ul>
        </address>
      </div>

      <div className="px-margin-mobile md:px-margin-desktop py-6 sm:py-8 border-t border-outline-variant/60 max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-center md:text-left">
        <p className="text-[11px] sm:text-label-sm text-on-surface-variant/80 font-label-sm">
          &copy; 2026 Pekefe Geleneksel Ürünler. Tüm hakları saklıdır.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Card Brands */}
          <div className="flex items-center gap-4">
            {/* Visa */}
            <svg className="h-3 w-auto text-on-surface-variant/50 hover:text-[#1A1F71] transition-all duration-300 hover:scale-105" viewBox="0 0 30 10" fill="currentColor" aria-label="Visa">
              <path d="M11.3 0.3L9.1 9.7H6.3L8.5 0.3h2.8zm7.3 0.2c-0.5-0.2-1.3-0.5-2.3-0.5-2.6 0-4.4 1.4-4.4 3.3 0 1.5 1.3 2.3 2.3 2.8 1 .5 1.4 0.8 1.4 1.2 0 0.6-0.7 0.9-1.4 0.9-0.9 0-1.6-0.2-2.5-0.6L11 7.2c0.5 0.2 1.3 0.4 2.1 0.4 2.6 0 4.3-1.3 4.3-3.2 0-1.1-0.7-1.9-2.2-2.6-0.9-0.5-1.5-0.8-1.5-1.3 0-0.5 0.5-1 1.6-1 0.9 0 1.5 0.2 2 0.4l0.3-2zM24 0h-2.2c-0.7 0-1.2 0.4-1.5 1L17.2 9.7h2.8l0.6-1.5h3.4l0.3 1.5H27L24 0zm-3 5.7l1.4-3.8 0.8 3.8h-2.2zM5.3 0L2.5 6.6 2.2 5C1.6 3 0.7 1.3 0.2 0.3H0l0.1 9.4h2.8l4.2-9.7H5.3z" />
            </svg>

            {/* Mastercard */}
            <svg className="h-5 w-auto opacity-45 hover:opacity-100 transition-all duration-300 hover:scale-105" viewBox="0 0 36 22" fill="none" aria-label="Mastercard">
              <circle cx="11" cy="11" r="11" fill="#EB001B" />
              <circle cx="25" cy="11" r="11" fill="#F79E1B" fillOpacity="0.85" />
            </svg>

            {/* Troy */}
            <svg className="h-4.5 w-auto text-on-surface-variant/50 hover:text-[#00A5DF] transition-all duration-300 hover:scale-105" viewBox="0 0 54 18" fill="none" aria-label="Troy">
              <text x="0" y="14" fill="currentColor" fontSize="13" fontWeight="bold" fontFamily="sans-serif" letterSpacing="-0.5">troy</text>
              <circle cx="38" cy="9" r="5" fill="#00A5DF" />
              <path d="M38 4a5 5 0 0 1 5 5" stroke="#9FD430" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* SSL Protection Badge */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/70 border-l border-outline-variant/60 pl-4 sm:pl-5">
            <span className="material-symbols-outlined text-base md:text-[18px] text-[#00A86B]" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <span className="font-bold text-[9px] sm:text-[10px] tracking-wider uppercase">256-Bit SSL Güvenli Altyapı</span>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-6 md:bottom-28 md:right-9 bg-primary text-on-primary w-11 h-11 md:w-14 md:h-14 rounded-full shadow-xl transition-all duration-300 hover:bg-secondary flex items-center justify-center cursor-pointer border border-white/20 z-40 ${
          showBackToTop ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"
        }`}
        aria-label="Yukarı Git"
      >
        <span className="material-symbols-outlined text-xl md:text-2xl">arrow_upward</span>
      </button>
    </footer>
  );
}
