"use client";

const SETTINGS_KEY = "pekefe_global_settings";

export const DEFAULT_SETTINGS = {
  email: "info@pekefe.com",
  phone: "0534 270 91 40",
  address: "Çamlıca Mahallesi, İspir / Erzurum",
  companyTitle: "Pekefe Geleneksel Gıda Ürünleri Ltd. Şti.",
  shippingNote: "Pazartesi-Perşembe günleri saat 14:00'e kadar verilen siparişler aynı gün, diğer günlerdeki siparişler ise ürünlerin tazeliğini korumak amacıyla takip eden ilk iş günü kargoya teslim edilir.",
  mapsLink: "https://maps.google.com/?q=Çamlıca+Mahallesi+İspir+Erzurum",
  instagram: "https://instagram.com/pekefe",
  whatsapp: "https://wa.me/905342709140",
  facebook: "https://facebook.com/pekefe",
  youtube: "https://youtube.com/@pekefe",
};

export function getSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("pekefe_settings_changed"));
  } catch (e) {
    console.error("Error saving settings", e);
  }
}

export async function fetchLiveSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const liveSettings = {
          email: data.contactEmail || DEFAULT_SETTINGS.email,
          phone: data.contactPhone || DEFAULT_SETTINGS.phone,
          address: data.contactAddress || DEFAULT_SETTINGS.address,
          companyTitle: data.companyName || (data.siteName ? `${data.siteName} Ltd. Şti.` : DEFAULT_SETTINGS.companyTitle),
          taxOffice: data.companyTaxOffice || "",
          taxNo: data.companyTaxNo || data.companyVkn || "",
          mersisNo: data.companyMersisNo || data.companyMersis || "",
          website: data.companyWebsite ? data.companyWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '') : "www.pekefe.com",
          shippingCarriers: data.shippingCarriers,
          shippingThreshold: data.shippingThreshold,
          shippingFee: data.shippingFee,
          bankTransferDiscountRate: data.bankTransferDiscountRate,
          cartDiscountType: data.cartDiscountType,
          cartDiscountValue: data.cartDiscountValue,
          campaignsBannerTitle: data.campaignsBannerTitle,
          campaignsBannerDesc: data.campaignsBannerDesc,
          paymentMethodsConfig: data.paymentMethodsConfig,
          cashOnDeliveryFee: data.cashOnDeliveryFee,
          cashOnDeliveryEnabled: data.cashOnDeliveryEnabled,
          mapsLink: data.mapCoordinates
            ? `https://maps.google.com/?q=${encodeURIComponent(data.mapCoordinates)}`
            : data.contactAddress
            ? `https://maps.google.com/?q=${encodeURIComponent(data.contactAddress)}`
            : DEFAULT_SETTINGS.mapsLink,
          instagram: data.socialInstagram || DEFAULT_SETTINGS.instagram,
          whatsapp: data.socialWhatsapp || data.contactPhone || DEFAULT_SETTINGS.whatsapp,
          facebook: data.socialFacebook || DEFAULT_SETTINGS.facebook,
          youtube: data.socialYoutube || DEFAULT_SETTINGS.youtube,
        };
        saveSettings(liveSettings);
        return liveSettings;
      }
    }
  } catch (err) {
    console.error("Error fetching live settings from DB:", err);
  }
  return getSettings();
}
