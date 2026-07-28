"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
// locale is hardcoded for admin panel

export interface Section {
  id: string;
  type: string;
  title: string;
  content: any;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  status: string;
  sections: Section[];
}

interface CMSData {
  heroTitle: string;
  heroSubtitle: string;
  buttonText: string;
  announcement: string;
  announcement2?: string;
  maintenanceMode: boolean;
  topBarText1?: string;
  topBarText2?: string;
  siteName: string;
  primaryColor: string;
  secondaryColor?: string;
  siteDescription: string;
  categoryTitle: string;
  categorySubtitle: string;
  appTitle: string;
  appSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress?: string;
  socialInstagram?: string;
  socialWhatsapp?: string;
  socialFacebook?: string;
  socialYoutube?: string;
  logoUrl?: string;
  footerSlogan?: string;
  footerText?: string;
  mapCoordinates?: string;
  logoFont?: string;
  logoSize?: number;
  logoWeight?: string;
  borderRadius?: number;
  announcementActive?: boolean;
  announcementSpeed?: number;
  layoutWidth?: string;
  heroAlignment?: string;
  pricingRules?: string;
  faqData?: any;
  shippingThreshold?: number;
  shippingFee?: number;
  shippingCarriers?: string;
  themeTemplates?: string;
  contentAnywhereRules?: string;
  savedSectionTemplates?: string;
  popupConfig?: string;
  // Fırsat Ürünleri Bölümü
  dealSectionActive?: boolean;
  dealProductIds?: string;
  [key: string]: any; // Dil bazlı alanlar için (örn: heroTitle_en)
}

interface CMSContextType {
  cmsData: CMSData;
  pages: Page[];
  updateCMSData: (newData: Partial<CMSData>) => void;
  toggleMaintenance: () => void;
  fetchPages: () => Promise<void>;
  getT: (field: string) => any;
}

const defaultCMSData: CMSData = {
  heroTitle: "Arıcılığın Gücünü Hissedin.",
  heroSubtitle: "Fabrikadan direkt, ATAK profesyonel körük ve ekipmanlarıyla kovanlarınızı ustaca yönetin.",
  buttonText: "Ürünleri Keşfet",
  announcement: "Tüm Türkiye'ye Aynı Gün Kargo ve Fabrika Fiyatları!",
  announcement2: "🔥 %100 Yerli İmalat & 304 Paslanmaz Çelik Garantisi",
  maintenanceMode: false,
  topBarText1: "Türkiye'nin Her Yerine Güvenli Sevkiyat",
  topBarText2: "Yerli Üretim Paslanmaz Çelik",
  logoUrl: "/uploads/1779016776947-365377533-Logo.jpg",
  siteName: "Atak Arıcılık",
  primaryColor: "#b45309",
  footerSlogan: "FABRİKADAN DİREKT",
  siteDescription: "Türkiye'nin 1 Numaralı Profesyonel Arıcılık Ekipmanı Üreticisi. Aradığınız tüm ürünleri buradan inceleyebilir ve güvenle sipariş verebilirsiniz.",
  categoryTitle: "Ürün gruplarını hızlıca keşfedin.",
  categorySubtitle: "Aradığınız yüksek kaliteli ekipmanlar, tek tık uzağınızda.",
  appTitle: "iOS ve Android ile hızlı sipariş takibi.",
  appSubtitle: "Akıllı liste özelliği ile sürekli aldığınız ürünleri kaydedin, tek tıkla sipariş verin. Teslimatınızı adım adım izleyin.",
  contactPhone: "0544 149 48 51",
  contactEmail: "info@atakaricilik.com",
  socialInstagram: "",
  socialWhatsapp: "05441494851",
  socialFacebook: "",
  socialYoutube: "",
  faqData: [
    {
      category: "Sipariş ve Kargo",
      iconName: "Truck",
      questions: [
        { q: "Siparişim ne zaman kargoya verilir?", a: "Hafta içi saat 15:00'e kadar verilen siparişler aynı gün kargoya teslim edilmektedir." },
        { q: "Kargomu nasıl takip edebilirim?", a: "Sitemizin alt kısmında bulunan 'Kargom Nerede?' sayfasından veya Hesabım > Siparişlerim menüsünden takip edebilirsiniz." }
      ]
    },
    {
      category: "İade ve Değişim",
      iconName: "RefreshCw",
      questions: [
        { q: "İade şartlarınız nelerdir?", a: "Kullanılmamış arıcılık ekipmanlarında 14 gün koşulsuz iade hakkınız bulunmaktadır." }
      ]
    }
  ],
  pricingRules: "[]",
  shippingThreshold: 5000,
  shippingFee: 150,
  shippingCarriers: `[
    {
      "id": "yurtici",
      "name": "Yurtiçi Kargo",
      "logo": "truck",
      "isActive": true,
      "freeThreshold": 3000,
      "fallbackFee": 120,
      "tiers": [
        {"minDesi": 0, "maxDesi": 5, "price": 80},
        {"minDesi": 5.01, "maxDesi": 15, "price": 120},
        {"minDesi": 15.01, "maxDesi": 30, "price": 180},
        {"minDesi": 30.01, "maxDesi": 100, "price": 350}
      ]
    },
    {
      "id": "mng",
      "name": "MNG Kargo",
      "logo": "truck",
      "isActive": true,
      "freeThreshold": 2500,
      "fallbackFee": 110,
      "tiers": [
        {"minDesi": 0, "maxDesi": 5, "price": 75},
        {"minDesi": 5.01, "maxDesi": 15, "price": 110},
        {"minDesi": 15.01, "maxDesi": 30, "price": 160},
        {"minDesi": 30.01, "maxDesi": 100, "price": 300}
      ]
    },
    {
      "id": "aras",
      "name": "Aras Kargo",
      "logo": "truck",
      "isActive": true,
      "freeThreshold": 3500,
      "fallbackFee": 130,
      "tiers": [
        {"minDesi": 0, "maxDesi": 5, "price": 85},
        {"minDesi": 5.01, "maxDesi": 15, "price": 125},
        {"minDesi": 15.01, "maxDesi": 30, "price": 190},
        {"minDesi": 30.01, "maxDesi": 100, "price": 380}
      ]
    }
  ]`,
  themeTemplates: `[
    {"id":"tmpl-1","name":"Global Header Deluxe","type":"header","isActive":true,"targetPage":"Tüm Sayfalar","lastUpdated":"2 saat önce"},
    {"id":"tmpl-2","name":"Global Footer Carbon","type":"footer","isActive":true,"targetPage":"Tüm Sayfalar","lastUpdated":"Dün"},
    {"id":"tmpl-3","name":"Atak Detay Ürün Sayfası","type":"product_page","isActive":true,"targetPage":"Katalog Detay","lastUpdated":"3 gün önce"},
    {"id":"tmpl-4","name":"Modern Ürün Listeleme Grid","type":"product_loop","isActive":false,"targetPage":"Kategori Sayfaları","lastUpdated":"1 hafta önce"}
  ]`,
  contentAnywhereRules: `[
    {"id":"rule-1","name":"Üst Sepet Duyuru Hattı","hook":"displayHeaderBefore","templateId":"tmpl-5","targetGroup":"B2B","isActive":true},
    {"id":"rule-2","name":"Satın Alma Buton Altı Lojistik Detay","hook":"displayProductButtons","templateId":"tmpl-6","targetGroup":"All","isActive":true},
    {"id":"rule-3","name":"Sepet Yan Panel Kargo Muafiyet Kartı","hook":"displayCartSidebar","templateId":"tmpl-7","targetGroup":"B2C","isActive":false}
  ]`,
  savedSectionTemplates: `[
    {"id":"tmpl-5","name":"Hızlı Toptan Destek Bandı","blocksCount":3,"category":"Marketing","lastUpdated":"2 saat önce"},
    {"id":"tmpl-6","name":"304 Paslanmaz Çelik & Yerli Üretim Rozeti","blocksCount":2,"category":"Layout","lastUpdated":"5 gün önce"},
    {"id":"tmpl-7","name":"Kargo Barem Tamamlama Widgetı","blocksCount":4,"category":"B2B Specific","lastUpdated":"2 hafta önce"}
  ]`,
  popupConfig: `{"isActive":false,"title":"Bahar Kampanyası","description":"Tüm arıcılık ekipmanlarında geçerli %20 indirim fırsatını kaçırmayın!","imageUrl":"https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80","buttonText":"Fırsatları İncele","buttonLink":"/products"}`,
  mapCoordinates: ""
};

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export interface CMSProviderProps {
  children: React.ReactNode;
  initialCMSData?: CMSData | null;
  initialPages?: Page[] | null;
}

function parseCMSData(data: any): any {
  if (!data) return data;
  const copy = { ...data };
  if (copy.companyName && copy.companyName.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(copy.companyName);
      copy.companyNameRaw = copy.companyName;
      copy.companyName = parsed.name || "";
      copy.companyVkn = parsed.vkn || "";
      copy.companyTaxOffice = parsed.taxOffice || "";
      copy.companyMersis = parsed.mersis || "";
    } catch (e) {
      copy.companyVkn = "";
      copy.companyTaxOffice = "";
      copy.companyMersis = "";
    }
  } else {
    copy.companyVkn = "";
    copy.companyTaxOffice = "";
    copy.companyMersis = "";
  }
  return copy;
}

export function CMSProvider({ children, initialCMSData, initialPages }: CMSProviderProps) {
  const [cmsData, setCmsData] = useState<CMSData>(() => {
    const raw = initialCMSData || defaultCMSData;
    return parseCMSData(raw);
  });
  const [pages, setPages] = useState<Page[]>(initialPages || []);
  const locale = 'tr'; // hardcoded for admin panel

  const fetchCMSData = async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data && typeof data === 'object' && !data.error) {
        setCmsData(parseCMSData(data));
      }
    } catch (err) { console.error(err); }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch(`/api/cms/pages?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setPages(data);
    } catch (err) { console.error(err); }
  };

  // Sync state when SSR-provided props change (client-side navigation keeps layout mounted,
  // so useState won't reinitialize — we must sync manually via useEffect)
  useEffect(() => {
    if (initialCMSData) {
      setCmsData(parseCMSData(initialCMSData));
    }
  }, [initialCMSData]);

  useEffect(() => {
    if (initialPages && initialPages.length > 0) {
      setPages(initialPages);
    }
  }, [initialPages]);

  // Always fetch fresh data from API on mount to catch any admin updates
  useEffect(() => {
    fetchCMSData();
    fetchPages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCMSData = async (newData: Partial<CMSData>) => {
    const updated = { ...cmsData, ...newData };
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    await fetchCMSData();
  };


  const toggleMaintenance = async () => {
    await updateCMSData({ maintenanceMode: !cmsData.maintenanceMode });
  };

  // Dile göre otomatik içerik getiren yardımcı fonksiyon
  const getT = (field: string) => {
    const localizedKey = `${field}_${locale}`;
    return cmsData[localizedKey] || cmsData[field];
  };

  return (
    <CMSContext.Provider value={{ cmsData, pages, updateCMSData, toggleMaintenance, fetchPages, getT }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return context;
}
