"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Truck, Search, RefreshCw, Loader2, Package,
  Clock, CheckCircle2, XCircle, AlertCircle,
  Plus, Trash2, Edit, Save, X, ToggleLeft, ToggleRight, ShieldCheck, DollarSign,
  MoreHorizontal, Printer, Download, SlidersHorizontal, UserCheck, ChevronDown, ChevronRight, Upload
} from "lucide-react";
import { toast } from "sonner";

interface CargoOrder {
  id: string;
  orderNumber: string;
  client: string;
  date: string;
  status: string;
  cargoCompany?: string;
  trackingNo?: string;
  amount: number;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  taxOffice?: string;
  method?: string;
  summary?: string;
}

interface Carrier {
  id: string;
  name: string;
  logoUrl?: string;
  pricingType?: "flat" | "tiered" | "receiver_pay";
  isActive: boolean;
  addShippingCosts: boolean;
  isFreeShipping: boolean;
  freeThreshold: number;
  taxRate: number;
  billingMethod: "weight" | "price";
  fallbackFee: number;
  outOfRangeBehavior: "highest" | "disable";
  tiers: { minDesi: number; maxDesi: number; price: number }[];
  integrationType?: "none" | "yurtici" | "aras" | "mng";
  customerCode?: string;
  apiUsername?: string;
  apiPassword?: string;
  isTestMode?: boolean;
}

const STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  Yeni:         { label: "Yeni",         cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: Clock },
  Hazırlanıyor: { label: "Hazırlanıyor", cls: "bg-blue-50 text-blue-700 border-blue-200",     icon: Package },
  Kargolandı:   { label: "Kargolandı",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Truck },
  Tamamlandı:   { label: "Tamamlandı",   cls: "bg-teal-50 text-teal-850 border-teal-200",       icon: CheckCircle2 },
  İptal:        { label: "İptal",        cls: "bg-rose-50 text-rose-700 border-rose-200",       icon: XCircle }
};

const CARGO_COMPANIES_AUTOCOMPLETE = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo", "Sürat Kargo"];

export default function CargoPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "carriers">("orders");

  // Tab 1: Orders States
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editOrderData, setEditOrderData] = useState({ cargoCompany: "", trackingNo: "" });
  const [savingOrderCargo, setSavingOrderCargo] = useState(false);

  // Bulk Selection & Filter Visibility
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkCargoDropdown, setShowBulkCargoDropdown] = useState(false);

  // Advanced Filters States
  const [carrierFilter, setCarrierFilter] = useState("Hepsi");
  const [clientTypeFilter, setClientTypeFilter] = useState("Hepsi");
  const [dateFilter, setDateFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("Tümü");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Tab 2: Carriers States
  const [settings, setSettings] = useState<any>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [savingCarriers, setSavingCarriers] = useState(false);
  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
  const [editingCarrierId, setEditingCarrierId] = useState<string | null>(null);

  // Carrier Form State
  const [carrierForm, setCarrierForm] = useState<Omit<Carrier, "id">>({
    name: "",
    logoUrl: "",
    pricingType: "tiered",
    isActive: true,
    addShippingCosts: true,
    isFreeShipping: false,
    freeThreshold: 5000,
    taxRate: 20,
    billingMethod: "weight",
    fallbackFee: 150,
    outOfRangeBehavior: "highest",
    tiers: [],
    integrationType: "none",
    customerCode: "",
    apiUsername: "",
    apiPassword: "",
    isTestMode: true
  });

  // Logo File Upload State & Handler
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setCarrierForm((prev) => ({ ...prev, logoUrl: data.url }));
        toast.success("Logo görseli başarıyla yüklendi.");
      } else {
        toast.error(data.error || "Görsel yüklenirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      toast.error("Dosya yüklenemedi.");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Tracking Modal States
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // Live Stats calculations
  const pendingOrders = orders.filter(o => ["Yeni", "Hazırlanıyor"].includes(o.status)).length;
  const shippedOrders = orders.filter(o => o.status === "Kargolandı").length;
  
  const todayShippedOrders = useMemo(() => {
    return orders.filter(o => o.status === "Kargolandı");
  }, [orders]);

  const todayCiro = useMemo(() => {
    return todayShippedOrders.reduce((sum, o) => sum + o.amount, 0);
  }, [todayShippedOrders]);

  const cargoAnomalies = useMemo(() => {
    return orders.filter(o => o.status === "Kargolandı" && !o.trackingNo).length;
  }, [orders]);

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(item => item !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  // Bulk Update Carrier
  const handleBulkUpdateCarrier = async (carrierName: string) => {
    const selectedIds = Array.from(selectedOrders);
    if (selectedIds.length === 0) return;

    setLoadingOrders(true);
    try {
      const promises = selectedIds.map(async id => {
        const res = await fetch(`/api/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cargoCompany: carrierName })
        });
        if (!res.ok) {
          throw new Error(`Order ${id} update failed`);
        }
        return res.json();
      });
      await Promise.all(promises);
      toast.success("Kargo firması toplu olarak güncellendi");
      setSelectedOrders([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Toplu kargo ataması sırasında hata oluştu");
    } finally {
      setLoadingOrders(false);
      setShowBulkCargoDropdown(false);
    }
  };

  // Bulk A6 Monochrome printable shipping tag drawer
  const handleBulkPrintKargoLabels = (selectedIds: string[]) => {
    const selectedList = orders.filter(o => selectedIds.includes(o.id));
    if (selectedList.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Yazıcı penceresi engellendi. Pop-up izni veriniz.");
      return;
    }

    const companyName = settings?.companyName || "Pekefe Geleneksel SAN. VE TİC. LTD. ŞTİ.";

    const labelsHtml = selectedList.map(o => {
      let trackingNumber = o.trackingNo || "";
      if (!trackingNumber) {
        trackingNumber = o.orderNumber || o.id.slice(-8).toUpperCase();
      }
      
      let tierBadge = "MÜŞTERİ";
      if (o.type === "B2B") {
        tierBadge = "B2B BAYİ";
      }

      // Deterministic SVG Barcode Pattern generation to avoid print dithering into solid black block
      let x = 10;
      const svgRects: string[] = [];
      const numString = trackingNumber.replace(/[^0-9]/g, "");
      const seed = numString ? (parseInt(numString.slice(-4)) || 1234) : 1234;
      
      for (let i = 0; i < 55; i++) {
        const w = ((i + seed) % 3 === 0) ? 3 : (((i + seed) % 5 === 0) ? 1 : 2);
        const gap = ((i + seed) % 2 === 0) ? 2 : 1;
        svgRects.push(`<rect x="${x}" y="5" width="${w}" height="50" fill="#000" />`);
        x += w + gap;
      }
      const svgWidth = x + 10;
      const barcodeSvg = `
        <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#fff" />
          ${svgRects.join("")}
        </svg>
      `;

      // Simulated QR Code mozaic patterns (Monochrome)
      const qrBlocks = Array.from({ length: 6 }).map((_, r) => {
        const cols = Array.from({ length: 6 }).map((_, c) => {
          const isBlack = (r + c) % 2 === 0 || (r === 0 && c === 0) || (r === 5 && c === 5) || (r === 0 && c === 5) || (r === 5 && c === 0);
          return `<div style="width: 4px; height: 4px; background: ${isBlack ? '#000' : '#fff'};"></div>`;
        }).join("");
        return `<div style="display: flex;">${cols}</div>`;
      }).join("");

      return `
        <div style="width: 100mm; height: 150mm; padding: 5mm; box-sizing: border-box; background: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border: 2px solid #000; color: #000; position: relative;">
          
          <!-- 1. ÜST BÖLÜM (LOGO & TIER BADGE) -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 3mm; height: 16mm; box-sizing: border-box;">
            <div>
              <h1 style="margin: 0; font-size: 16px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.1;">${companyName.toUpperCase()}</h1>
              <span style="font-size: 8px; font-weight: 850; color: #000;">YERLİ İMALAT SANAYİ</span>
            </div>
            <div style="background: #000; color: #fff; padding: 1mm 2.5mm; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; border-radius: 0px; text-transform: uppercase; shrink-0;">
              ${tierBadge}
            </div>
          </div>

          <!-- 2. SİPARİŞ BİLGİLERİ KUTUSU -->
          <div style="border: 1.5px solid #000; padding: 2.5mm; margin-top: 3mm; box-sizing: border-box;">
            <table style="width: 100%; font-size: 9px; border-collapse: collapse; font-weight: bold; color: #000;">
              <tr>
                <td style="width: 30%; padding-bottom: 1mm;">Sipariş No:</td>
                <td style="font-size: 11px; font-weight: 900; padding-bottom: 1mm;">#${o.orderNumber || o.id.slice(-8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 1mm;">Tarih / Saat:</td>
                <td style="padding-bottom: 1mm;">${o.date} - 16:55</td>
              </tr>
              <tr>
                <td style="padding-bottom: 1mm;">Ödeme Türü:</td>
                <td style="padding-bottom: 1mm;">${o.method || 'Banka Havalesi'}</td>
              </tr>
              <tr>
                <td>Lojistik:</td>
                <td>${o.cargoCompany || 'MNG Kargo'} | Paket: 1/1</td>
              </tr>
            </table>
          </div>

          <!-- 3. ALICI / TESLİMAT ADRESİ (EN BÜYÜK ALAN) -->
          <div style="margin-top: 3mm; flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-start; color: #000;">
            <p style="font-size: 8px; font-weight: 900; margin: 0 0 1.5mm 0; border-bottom: 1px solid #000; padding-bottom: 0.5mm; letter-spacing: 0.5px;">ALICI / TESLİMAT ADRESİ</p>
            <h3 style="margin: 0 0 1.5mm 0; font-size: 13px; font-weight: 900; text-transform: uppercase;">${o.client}</h3>
            <p style="margin: 0; font-size: 10px; line-height: 1.35; font-weight: 700; word-break: break-word;">${o.address || "Cari sistem kayıtlı teslimat adresi."}</p>
            <p style="margin: 2.5mm 0 0 0; font-size: 12px; font-weight: 900;">TEL: ${o.phone || "Belirtilmedi"}</p>
          </div>

          <!-- 4. B2B & SEKTÖREL BİLGİLER VE ÖNCELİK ROZETLERİ -->
          <div style="border-top: 1.5px dashed #000; padding-top: 2.5mm; margin-top: 2mm; display: flex; justify-content: space-between; align-items: flex-end; box-sizing: border-box; color: #000;">
            <div style="font-size: 8px; font-weight: 800; line-height: 1.4;">
              ${o.type === "B2B" ? `
                <div>Cari Kodu: CR00045</div>
                <div>Vade Koşulu: 30 Gün Vade</div>
                <div>Lojistik: 1 Koli | 4.8 Desi | 14.8 kg</div>
              ` : `
                <div>Sipariş Tipi: Standart Perakende</div>
                <div>Lojistik: 1 Koli | 2.4 Desi | 3.5 kg</div>
              `}
              <div style="margin-top: 1mm; font-weight: 900;">Üretim: Hazır Stok (Standart Ürün)</div>
            </div>
            
            <div style="display: flex; gap: 1mm;">
              <span style="border: 1.5px solid #000; padding: 0.5mm 1.5mm; font-size: 8px; font-weight: 900;">ACİL</span>
              ${o.type === "B2B" ? `
                <span style="border: 1.5px solid #000; padding: 0.5mm 1.5mm; font-size: 8px; font-weight: 900; background: #000; color: #fff;">TOPTAN</span>
              ` : `
                <span style="border: 1.5px solid #000; padding: 0.5mm 1.5mm; font-size: 8px; font-weight: 900;">B2C</span>
              `}
            </div>
          </div>

          <!-- 5. BARKOD VE QR KOD ALANI -->
          <div style="border-top: 2px solid #000; padding-top: 3mm; margin-top: 3mm; display: flex; justify-content: space-between; align-items: center; height: 26mm; box-sizing: border-box; color: #000;">
            <!-- Barkod sol -->
            <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
              <div style="display: flex; height: 15mm; align-items: stretch; width: 92%;">
                ${barcodeSvg}
              </div>
              <p style="margin: 1mm 0 0 0; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-align: left;">*${trackingNumber}*</p>
            </div>

            <!-- Gelişmiş QR Kod sağ -->
            <div style="width: 14mm; height: 14mm; border: 2px solid #000; padding: 1mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: center; shrink-0;">
              <div style="display: flex; flex-direction: column; gap: 0px;">
                ${qrBlocks}
              </div>
            </div>
          </div>

          <!-- 6. OPERASYON BİLGİLERİ (FOOTER) -->
          <div style="border-top: 1px solid #cbd5e1; padding-top: 1mm; margin-top: 1.5mm; font-size: 6.5px; font-weight: 700; display: flex; justify-content: space-between; color: #64748b;">
            <span>Oluşturan: Sistem Admin</span>
            <span>Yazdırma: ${new Date().toLocaleString("tr-TR")}</span>
          </div>

        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Toplu Kargo Etiketleri</title>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              body { background: #fff; padding: 0; }
              div { border: none !important; margin: 0 !important; }
            }
          </style>
        </head>
        <body onload="window.print()">
          ${labelsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Toplu etiket çıktıları hazırlandı.");
  };

  // CSV Report Generator (BOM safe Turkish chars)
  const handleExportCSV = () => {
    const selectedList = orders.filter(o => selectedOrders.includes(o.id));
    if (selectedList.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Siparis ID,Musteri,Tarih,Durum,Kargo Firmasi,Takip No,Tutar\n";

    selectedList.forEach(o => {
      const row = [
        o.orderNumber || o.id,
        o.client.replace(/,/g, " "),
        o.date || "",
        o.status,
        o.cargoCompany || "",
        o.trackingNo || "",
        o.amount
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kargo_takip_raporu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel/CSV raporu başarıyla indirildi.");
  };

  // API Cargo Tracker Handler
  const handleTrackCargo = async (trackingNo: string, carrier: string) => {
    setLoadingTracking(true);
    setIsTrackingModalOpen(true);
    try {
      const res = await fetch(`/api/cargo/track/${trackingNo}?carrier=${encodeURIComponent(carrier)}`);
      const data = await res.json();
      if (res.ok) {
        setTrackingData(data);
      } else {
        toast.error(data.error || "Takip bilgileri alınamadı");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoadingTracking(false);
    }
  };

  // Fetch orders from database API
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("t", String(Date.now()));
      const res = await fetch(`/api/orders?${params}`, { cache: "no-store", headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" } });
      const data = await res.json();
      const cargoRelevant = (Array.isArray(data) ? data : data?.orders ?? []).filter(
        (o: CargoOrder) => !["İptal"].includes(o.status)
      );
      setOrders(cargoRelevant);
    } catch {
      toast.error("Kargo bilgileri yüklenemedi");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch carriers from CMS Data
  const parseCarriers = (raw: any): Carrier[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const p = JSON.parse(raw);
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const fetchCarriers = async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setSettings(data);
          const parsed = parseCarriers(data.shippingCarriers);
          setCarriers(parsed);
        } else {
          setCarriers([]);
        }
      } else {
        setCarriers([]);
      }
    } catch (err) {
      console.error("Error fetching carriers settings:", err);
      setCarriers([]);
    } finally {
      setLoadingCarriers(false);
    }
  };

  // Load initial settings
  useEffect(() => {
    fetchCarriers();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else {
      fetchCarriers();
    }
  }, [activeTab]);

  // Save single cargo assignments
  const handleSaveCargo = async (orderId: string) => {
    setSavingOrderCargo(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargoCompany: editOrderData.cargoCompany,
          trackingNo: editOrderData.trackingNo,
          status: "Kargolandı",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Kargo bilgisi başarıyla kaydedildi");
      setEditingOrderId(null);
      fetchOrders();
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSavingOrderCargo(false);
    }
  };

  // Save Carriers list configuration
  const handleSaveCarriersList = async (updatedCarriers: Carrier[]) => {
    setSavingCarriers(true);
    try {
      const currentSettings = settings || {};
      const updatedSettings = {
        ...currentSettings,
        id: "singleton",
        siteName: currentSettings.siteName || "PEKEFE Geleneksel & Doğal Lezzetler",
        shippingCarriers: JSON.stringify(updatedCarriers)
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Kargo firmaları başarıyla kaydedildi!");
        setCarriers(updatedCarriers);
        setSettings(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Kargo ayarları kaydedilirken hata oluştu.");
      }
    } catch (err) {
      console.error("Save carriers list error:", err);
      toast.error("Kargo ayarları kaydedilirken hata oluştu.");
    } finally {
      setSavingCarriers(false);
    }
  };

  // Auto-generate standard example carriers
  const handleInitializeExampleCarriers = () => {
    const examples: Carrier[] = [
      {
        id: "yurtici",
        name: "Yurtiçi Kargo",
        logoUrl: "/logos/yurtici.svg",
        isActive: true,
        addShippingCosts: true,
        isFreeShipping: false,
        freeThreshold: 5000,
        taxRate: 20,
        billingMethod: "weight",
        fallbackFee: 150,
        outOfRangeBehavior: "highest",
        tiers: [
          { minDesi: 0, maxDesi: 5, price: 90 },
          { minDesi: 5.01, maxDesi: 15, price: 130 },
          { minDesi: 15.01, maxDesi: 30, price: 180 },
          { minDesi: 30.01, maxDesi: 60, price: 280 }
        ]
      },
      {
        id: "aras",
        name: "Aras Kargo",
        logoUrl: "/logos/aras.svg",
        isActive: true,
        addShippingCosts: true,
        isFreeShipping: false,
        freeThreshold: 5000,
        taxRate: 20,
        billingMethod: "weight",
        fallbackFee: 140,
        outOfRangeBehavior: "highest",
        tiers: [
          { minDesi: 0, maxDesi: 5, price: 85 },
          { minDesi: 5.01, maxDesi: 15, price: 120 },
          { minDesi: 15.01, maxDesi: 30, price: 170 },
          { minDesi: 30.01, maxDesi: 60, price: 260 }
        ]
      },
      {
        id: "mng",
        name: "MNG Kargo",
        logoUrl: "/logos/mng.svg",
        isActive: true,
        addShippingCosts: true,
        isFreeShipping: false,
        freeThreshold: 4000,
        taxRate: 20,
        billingMethod: "weight",
        fallbackFee: 130,
        outOfRangeBehavior: "highest",
        tiers: [
          { minDesi: 0, maxDesi: 5, price: 80 },
          { minDesi: 5.01, maxDesi: 15, price: 115 },
          { minDesi: 15.01, maxDesi: 30, price: 160 },
          { minDesi: 30.01, maxDesi: 60, price: 240 }
        ]
      }
    ];
    handleSaveCarriersList(examples);
  };

  const openNewCarrierModal = () => {
    setCarrierForm({
      name: "",
      logoUrl: "",
      pricingType: "tiered",
      isActive: true,
      addShippingCosts: true,
      isFreeShipping: false,
      freeThreshold: 5000,
      taxRate: 20,
      billingMethod: "weight",
      fallbackFee: 150,
      outOfRangeBehavior: "highest",
      tiers: [],
      integrationType: "none",
      customerCode: "",
      apiUsername: "",
      apiPassword: "",
      isTestMode: true
    });
    setEditingCarrierId(null);
    setIsCarrierModalOpen(true);
  };

  const openEditCarrierModal = (carrier: Carrier) => {
    setCarrierForm({
      name: carrier.name,
      logoUrl: carrier.logoUrl || "",
      pricingType: carrier.pricingType || (carrier.tiers && carrier.tiers.length > 0 ? "tiered" : "flat"),
      isActive: carrier.isActive,
      addShippingCosts: carrier.addShippingCosts ?? true,
      isFreeShipping: carrier.isFreeShipping ?? false,
      freeThreshold: carrier.freeThreshold ?? 5000,
      taxRate: carrier.taxRate ?? 20,
      billingMethod: carrier.billingMethod ?? "weight",
      fallbackFee: carrier.fallbackFee ?? 150,
      outOfRangeBehavior: carrier.outOfRangeBehavior ?? "highest",
      tiers: carrier.tiers ? [...carrier.tiers] : [],
      integrationType: carrier.integrationType ?? "none",
      customerCode: carrier.customerCode ?? "",
      apiUsername: carrier.apiUsername ?? "",
      apiPassword: carrier.apiPassword ?? "",
      isTestMode: carrier.isTestMode ?? true
    });
    setEditingCarrierId(carrier.id);
    setIsCarrierModalOpen(true);
  };

  const handleCarrierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierForm.name) {
      toast.error("Lütfen firma adını giriniz.");
      return;
    }

    let updatedList = [...carriers];
    if (editingCarrierId) {
      updatedList = updatedList.map(c =>
        c.id === editingCarrierId ? { ...carrierForm, id: editingCarrierId } : c
      );
    } else {
      const newId = "carrier_" + Date.now();
      updatedList.push({ ...carrierForm, id: newId });
    }

    setIsCarrierModalOpen(false);
    handleSaveCarriersList(updatedList);
  };

  const handleDeleteCarrier = (id: string) => {
    if (!confirm("Bu kargo firmasını silmek istediğinize emin misiniz?")) return;
    const updatedList = carriers.filter(c => c.id !== id);
    handleSaveCarriersList(updatedList);
  };

  const handleToggleCarrierActive = (carrier: Carrier) => {
    const updatedList = carriers.map(c =>
      c.id === carrier.id ? { ...c, isActive: !c.isActive } : c
    );
    handleSaveCarriersList(updatedList);
  };

  const handleAddTierRow = () => {
    setCarrierForm(prev => ({
      ...prev,
      tiers: [...prev.tiers, { minDesi: 0, maxDesi: 10, price: 50 }]
    }));
  };

  const handleUpdateTierField = (index: number, field: "minDesi" | "maxDesi" | "price", val: number) => {
    setCarrierForm(prev => {
      const list = [...prev.tiers];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, tiers: list };
    });
  };

  const handleRemoveTierRow = (index: number) => {
    setCarrierForm(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, idx) => idx !== index)
    }));
  };

  // Filters logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // 1. Search Query
      const query = search.toLowerCase();
      const matchesSearch =
        o.client?.toLowerCase().includes(query) ||
        o.id.toLowerCase().includes(query) ||
        (o.orderNumber ?? "").toLowerCase().includes(query) ||
        (o.trackingNo ?? "").toLowerCase().includes(query);
      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

      // 3. Carrier Filter
      if (carrierFilter !== "Hepsi" && o.cargoCompany !== carrierFilter) return false;

      // 4. Client Type Filter
      if (clientTypeFilter !== "Hepsi" && o.type !== clientTypeFilter) return false;

      // 5. Date Filter
      if (dateFilter) {
        const orderDateStr = o.date ? o.date.split(" ")[0] : ""; // e.g. "29.05.2026"
        const [d, m, y] = orderDateStr.split(".");
        const orderDate = new Date(`${y}-${m}-${d}`);
        const filterDate = new Date(dateFilter);
        if (orderDate.toDateString() !== filterDate.toDateString()) return false;
      }

      // 6. Amount Filter
      if (amountFilter !== "Tümü") {
        const amt = o.amount;
        if (amountFilter === "₺0 - ₺1.000" && amt > 1000) return false;
        if (amountFilter === "₺1.000 - ₺5.000" && (amt < 1000 || amt > 5000)) return false;
        if (amountFilter === "₺5.000+" && amt < 5000) return false;
      }

      return true;
    });
  }, [orders, search, statusFilter, carrierFilter, clientTypeFilter, dateFilter, amountFilter]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, currentPage]);

  const startRecord = filteredOrders.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endRecord = Math.min(currentPage * rowsPerPage, filteredOrders.length);

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 font-sans text-slate-900 antialiased">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-200 shrink-0 gap-2 mb-6 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 max-w-7xl mx-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={`py-3 px-6 text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "orders"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
              : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-4 h-4" /> Sipariş Kargo Takibi
        </button>
        <button
          onClick={() => setActiveTab("carriers")}
          className={`py-3 px-6 text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "carriers"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
              : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
          }`}
        >
          <Truck className="w-4 h-4" /> Kargo Firmaları & Ayarları
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* TAB 1: SHIPPING OPERATIONS CENTER */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kargo Takip Entegrasyonu</h1>
                <p className="text-sm text-slate-500">Sipariş kargo süreçlerini, etiketleri ve gönderi entegrasyonlarını tek panelden yönetin.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchOrders}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 text-slate-500" /> Senkronize Et
                </button>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Bekleyen Siparişler</span>
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-600"><Clock className="h-5 w-5" /></div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{pendingOrders}</span>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Kargo Bekliyor</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Bugün Kargolanan</span>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><Truck className="h-5 w-5" /></div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{shippedOrders}</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Toplam Paket</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Bugünkü Kargo Cirosu</span>
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><CheckCircle2 className="h-5 w-5" /></div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">₺{todayCiro.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{todayShippedOrders.length} Paket</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Kargo Sorunları</span>
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-600"><AlertCircle className="h-5 w-5" /></div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`text-3xl font-bold tracking-tight ${cargoAnomalies > 0 ? "text-rose-600" : ""}`}>{cargoAnomalies}</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Takip No Eksik</span>
                </div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Müşteri adı, sipariş ID veya takip numarası ara..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition cursor-pointer ${showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <SlidersHorizontal className="h-4 w-4" /> Filtreler
                  </button>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none hover:bg-slate-50 cursor-pointer"
                  >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="Yeni">Yeni</option>
                    <option value="Hazırlanıyor">Hazırlanıyor</option>
                    <option value="Kargolandı">Kargolandı</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                  </select>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 md:grid-cols-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kargo Firması</label>
                    <select 
                      value={carrierFilter}
                      onChange={(e) => setCarrierFilter(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none cursor-pointer"
                    >
                      <option value="Hepsi">Hepsi</option>
                      {carriers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      {CARGO_COMPANIES_AUTOCOMPLETE.filter(n => !carriers.some(c => c.name === n)).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri Tipi</label>
                    <select 
                      value={clientTypeFilter}
                      onChange={(e) => setClientTypeFilter(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none cursor-pointer"
                    >
                      <option value="Hepsi">Hepsi</option>
                      <option value="Bayi">Bayi</option>
                      <option value="Perakende">Perakende</option>
                      <option value="VIP">VIP</option>
                      <option value="Gold Bayi">Gold Bayi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</label>
                    <input 
                      type="date" 
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none cursor-pointer" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sipariş Tutarı</label>
                    <select 
                      value={amountFilter}
                      onChange={(e) => setAmountFilter(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none cursor-pointer"
                    >
                      <option value="Tümü">Tümü</option>
                      <option value="₺0 - ₺1.000">₺0 - ₺1.000</option>
                      <option value="₺1.000 - ₺5.000">₺1.000 - ₺5.000</option>
                      <option value="₺5.000+">₺5.000+</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Floating Actions Bar */}
            {selectedOrders.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-200 mb-4 flex flex-col md:flex-row gap-3 items-center justify-between rounded-xl border border-blue-200 bg-blue-50/90 p-3 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-3 pl-2">
                  <span className="text-sm font-semibold text-blue-800">{selectedOrders.length} Sipariş Seçildi</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={() => handleBulkPrintKargoLabels(selectedOrders)}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" /> Toplu Barkod Yazdır
                  </button>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowBulkCargoDropdown(!showBulkCargoDropdown)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm border transition cursor-pointer ${
                        showBulkCargoDropdown 
                          ? "bg-slate-100 text-slate-900 border-slate-300" 
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 text-slate-500" /> Kargo Ata (Toplu)
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                    {showBulkCargoDropdown && (
                      <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 min-w-[170px] animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div className="flex justify-between items-center px-2 py-1 select-none border-b border-slate-100 mb-1.5 pb-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">FİRMA SEÇİNİZ</span>
                          <button 
                            type="button" 
                            onClick={() => setShowBulkCargoDropdown(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                          {(carriers.length > 0 ? carriers : CARGO_COMPANIES_AUTOCOMPLETE.map(n => ({ name: n }))).map(c => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => handleBulkUpdateCarrier(c.name)}
                              className="w-full text-left text-xs font-semibold hover:bg-slate-50 p-2 rounded-lg text-slate-700 hover:text-orange-500 transition-colors"
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" /> Excel Dışa Aktar
                  </button>
                  <button 
                    onClick={() => setSelectedOrders([])}
                    className="flex items-center justify-center p-1 bg-white hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Orders Table Wrapper */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> Yükleniyor...
                </div>
              ) : paginatedOrders.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm">
                  <Truck className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  Kargo kaydı bulunmuyor
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-4 w-4">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                            onChange={handleSelectAll}
                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          />
                        </th>
                        <th className="p-4 font-semibold">Sipariş</th>
                        <th className="p-4 font-semibold">Müşteri</th>
                        <th className="p-4 font-semibold">Tarih</th>
                        <th className="p-4 font-semibold">Durum</th>
                        <th className="p-4 font-semibold">Kargo Firması</th>
                        <th className="p-4 font-semibold">Takip No</th>
                        <th className="p-4 font-semibold text-right">Tutar</th>
                        <th className="p-4 font-semibold text-center">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedOrders.map((order) => {
                        const st = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-gray-100 text-gray-600 border-gray-200", icon: AlertCircle };
                        const StIcon = st.icon;
                        const isEditing = editingOrderId === order.id;
                        return (
                          <tr key={order.id} className="group hover:bg-slate-50/80 transition-colors">
                            <td className="p-4">
                              <input 
                                type="checkbox" 
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                checked={selectedOrders.includes(order.id)}
                                onChange={() => handleSelectOrder(order.id)}
                              />
                            </td>
                            <td className="p-4 font-mono text-xs font-semibold text-slate-700">
                              #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-900">{order.client}</span>
                                <span className="w-max rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                  {order.type || "Cari Hesap"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-500 text-xs">
                              {(() => {
                                if (!order.date) return "—";
                                // Already formatted as DD.MM.YYYY – display as-is
                                if (typeof order.date === "string" && /^\d{2}\.\d{2}\.\d{4}/.test(order.date)) {
                                  return order.date;
                                }
                                try {
                                  const d = new Date(order.date);
                                  if (isNaN(d.getTime())) return String(order.date);
                                  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
                                } catch {
                                  return String(order.date);
                                }
                              })()}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                                <StIcon className="w-3.5 h-3.5" /> {st.label}
                              </span>
                            </td>
                            <td className="p-4 text-slate-700 font-medium">
                              {isEditing ? (
                                <select
                                  value={editOrderData.cargoCompany}
                                  onChange={(e) => setEditOrderData(d => ({ ...d, cargoCompany: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none cursor-pointer"
                                >
                                  <option value="">Seçiniz</option>
                                  {(carriers.length > 0 ? carriers : CARGO_COMPANIES_AUTOCOMPLETE.map(n => ({ name: n }))).map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-semibold text-xs">{order.cargoCompany ?? <span className="text-slate-300">—</span>}</span>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <div className="flex flex-col gap-1.5 items-start">
                                  <input
                                    type="text"
                                    placeholder="Takip no"
                                    value={editOrderData.trackingNo}
                                    onChange={(e) => setEditOrderData(d => ({ ...d, trackingNo: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono outline-none"
                                  />
                                  {editOrderData.cargoCompany && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const promise = new Promise(async (resolve, reject) => {
                                          try {
                                            const res = await fetch("/api/cargo/generate", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ orderId: order.id, carrierName: editOrderData.cargoCompany })
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                              setEditOrderData(d => ({ ...d, trackingNo: data.trackingNumber }));
                                              resolve(data.trackingNumber);
                                            } else {
                                              reject(data.error || "Barkod alınamadı");
                                            }
                                          } catch {
                                            reject("İletişim hatası");
                                          }
                                        });
                                        toast.promise(promise, {
                                          loading: 'API ile kargo kodu alınıyor...',
                                          success: (code) => `Takip numarası başarıyla alındı: ${code}`,
                                          error: (err) => `Hata: ${err}`,
                                        });
                                      }}
                                      className="text-[9px] px-2 py-0.5 bg-amber-50 text-orange-500 border border-amber-200 rounded hover:bg-amber-100 transition font-bold cursor-pointer"
                                    >
                                      API'den Barkod Al
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="font-mono text-xs font-semibold text-slate-800">{order.trackingNo ?? <span className="text-slate-300">—</span>}</span>
                                  {order.trackingNo && (
                                    <button 
                                      onClick={() => handleTrackCargo(order.trackingNo!, order.cargoCompany || "")}
                                      className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 hover:bg-amber-100 transition cursor-pointer"
                                    >
                                      API Sorgula
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-900">
                              ₺{(order.amount ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleSaveCargo(order.id)}
                                      disabled={savingOrderCargo}
                                      className="flex items-center justify-center p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 cursor-pointer shadow-sm"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingOrderId(null)}
                                      className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer border border-slate-200"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {order.status === 'Kargolandı' ? (
                                      <button 
                                        onClick={() => handleBulkPrintKargoLabels([order.id])}
                                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
                                      >
                                        <Printer className="h-3.5 w-3.5 text-slate-400" /> Etiket
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => {
                                          setEditingOrderId(order.id);
                                          setEditOrderData({ cargoCompany: order.cargoCompany ?? "", trackingNo: order.trackingNo ?? "" });
                                        }}
                                        className="flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition cursor-pointer"
                                      >
                                        Kargo Ata
                                      </button>
                                    )}
                                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination controls */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-white p-4 text-sm text-slate-500">
                <span>Toplam <b>{filteredOrders.length}</b> kayıttan <b>{startRecord}-{endRecord}</b> arası gösteriliyor</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || totalPages === 0}
                    className={`rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium shadow-sm transition ${
                      currentPage === 1 
                        ? "bg-slate-50 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    Önceki
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium shadow-sm transition ${
                      currentPage === totalPages 
                        ? "bg-slate-50 text-slate-400 cursor-not-allowed" 
                        : "bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SHIPPING CARRIERS MANAGEMENT */}
        {activeTab === "carriers" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" /> Kargo Firmaları & Ayarları
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Sipariş kargo fiyatlandırma kurallarını ve firmalarını yönetin</p>
              </div>
              <button
                onClick={openNewCarrierModal}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Yeni Firma Ekle
              </button>
            </div>

            {loadingCarriers ? (
              <div className="flex items-center justify-center py-20 gap-2 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> Yükleniyor...
              </div>
            ) : carriers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                <h3 className="font-extrabold text-lg text-gray-800 mb-2">Kayıtlı Kargo Firması Bulunmuyor</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Müşterilerinizin ödeme sayfasında kargo seçimi yapabilmesi için kargo firmaları eklemelisiniz.
                </p>
                <button
                  onClick={handleInitializeExampleCarriers}
                  disabled={savingCarriers}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition cursor-pointer"
                >
                  {savingCarriers ? "Yükleniyor..." : "Varsayılan Firmaları Yükle (Örnek)"}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Firma Adı</th>
                        <th className="px-5 py-3">Hesaplama Tipi</th>
                        <th className="px-5 py-3">Sabit Ücret</th>
                        <th className="px-5 py-3">Ücretsiz Limiti</th>
                        <th className="px-5 py-3">Vergi/KDV</th>
                        <th className="px-5 py-3">Kademeler</th>
                        <th className="px-5 py-3">Durum</th>
                        <th className="px-5 py-3 text-right">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {carriers.map((carrier) => (
                        <tr key={carrier.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-5 py-4 font-bold text-gray-800">
                            <div className="flex items-center gap-3">
                              {carrier.logoUrl ? (
                                <img src={carrier.logoUrl} alt={carrier.name} className="h-9 w-16 object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-sm shrink-0" />
                              ) : (
                                <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-xs shrink-0">
                                  {carrier.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span>{carrier.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${carrier.billingMethod === "price" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                              {carrier.billingMethod === "price" ? "Sepet Tutarı" : "Desi / Ağırlık"}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-gray-700">{carrier.fallbackFee} ₺</td>
                          <td className="px-5 py-4 font-bold text-emerald-600">
                            {carrier.isFreeShipping ? "Her Zaman Ücretsiz" : `${carrier.freeThreshold} ₺`}
                          </td>
                          <td className="px-5 py-4 text-gray-500 font-semibold">%{carrier.taxRate}</td>
                          <td className="px-5 py-4 text-gray-500 font-semibold">{carrier.tiers?.length || 0} Kademe</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleToggleCarrierActive(carrier)}
                              disabled={savingCarriers}
                              className="focus:outline-none cursor-pointer"
                            >
                              {carrier.isActive ? (
                                <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                                  <ToggleRight className="w-7 h-7" /> Aktif
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-400 font-bold text-xs">
                                  <ToggleLeft className="w-7 h-7" /> Pasif
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditCarrierModal(carrier)}
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:border-orange-500 hover:text-orange-500 transition shadow-sm cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCarrier(carrier.id)}
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:border-red-500 hover:text-red-600 transition shadow-sm cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CARRIER ADD/EDIT MODAL */}
      {isCarrierModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCarrierModalOpen(false)}></div>
          
          <div className="bg-white relative z-10 rounded-[2rem] w-full max-w-3xl shadow-2xl border border-gray-200 transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-[2rem] shrink-0">
              <h2 className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" /> {editingCarrierId ? "Kargo Firmasını Güncelle" : "Yeni Kargo Firması Ekle"}
              </h2>
              <button onClick={() => setIsCarrierModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-200 text-gray-650 flex items-center justify-center hover:bg-red-100 hover:text-red-700 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCarrierSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-gray-900 bg-white">
              {/* Logo Selection Section */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center text-orange-600 text-[10px]">🖼</span>
                  Firma Logosu &amp; Görseli
                </label>

                {/* URL input + Upload button + Preview */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Özel Logo URL&apos;si veya Dosyadan Yükle</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="/uploads/logo.png veya https://..."
                      value={carrierForm.logoUrl || ""}
                      onChange={(e) => setCarrierForm({ ...carrierForm, logoUrl: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-orange-400 focus:bg-white transition"
                    />
                    <label className="shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                       <div className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-sm ${
                        uploadingLogo
                          ? "bg-orange-300 cursor-not-allowed text-white"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}>
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadingLogo ? "Yükleniyor..." : "Cihazdan Yükle"}</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Live Preview */}
                {carrierForm.logoUrl ? (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="w-24 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center p-2 shadow-sm shrink-0">
                      <img src={carrierForm.logoUrl} alt="Logo Önizleme" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Canlı Önizleme</p>
                      <p className="text-xs text-slate-700 font-mono truncate mt-0.5">{carrierForm.logoUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCarrierForm({ ...carrierForm, logoUrl: "" })}
                      className="w-7 h-7 rounded-full bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center text-sm font-bold transition shrink-0 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3">
                    <div className="w-24 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-slate-300">
                      <span className="text-2xl">🖼</span>
                    </div>
                    <p className="text-xs text-slate-400">Logo URL&apos;si girin ya da cihazınızdan görsel yükleyin</p>
                  </div>
                )}
              </div>

              {/* Fiyatlandırma Türü Seçim Kartları */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Fiyatlandırma Türü Seçimi *
                  </label>
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    {carrierForm.pricingType === "flat"
                      ? "📌 Sabit Ücret Aktif"
                      : carrierForm.pricingType === "tiered"
                      ? "📊 Desi Kademeli Fiyat Aktif"
                      : "📦 Alıcı Ödemeli Aktif"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCarrierForm({ ...carrierForm, pricingType: "flat" })}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                      carrierForm.pricingType === "flat"
                        ? "border-orange-500 bg-white shadow-sm ring-2 ring-orange-500/10"
                        : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      carrierForm.pricingType === "flat" ? "border-orange-500 bg-orange-500" : "border-slate-300"
                    }`}>
                      {carrierForm.pricingType === "flat" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">📌 Sabit Kargo Ücreti</span>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5 leading-snug">
                        Sepet desisinden bağımsız tek sabit fiyat uygulanır.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarrierForm({ ...carrierForm, pricingType: "tiered" })}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                      carrierForm.pricingType === "tiered"
                        ? "border-orange-500 bg-white shadow-sm ring-2 ring-orange-500/10"
                        : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      carrierForm.pricingType === "tiered" ? "border-orange-500 bg-orange-500" : "border-slate-300"
                    }`}>
                      {carrierForm.pricingType === "tiered" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">📊 Desi / Kg Kademeli</span>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5 leading-snug">
                        Siparişin desi ağırlığına göre kademeli ücret hesaplanır.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCarrierForm({ ...carrierForm, pricingType: "receiver_pay", fallbackFee: 0 })}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                      carrierForm.pricingType === "receiver_pay"
                        ? "border-orange-500 bg-white shadow-sm ring-2 ring-orange-500/10"
                        : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      carrierForm.pricingType === "receiver_pay" ? "border-orange-500 bg-orange-500" : "border-slate-300"
                    }`}>
                      {carrierForm.pricingType === "receiver_pay" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">📦 Ücret Alıcı Ödemeli</span>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5 leading-snug">
                        Kargo ücreti siparişe 0 TL olarak yansır, kurye kapıda alıcıdan tahsil eder.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Kargo Firma Adı *</label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: Yurtiçi Kargo, MNG Kargo"
                    value={carrierForm.name}
                    onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Kademe Ölçüt Yöntemi</label>
                  <select
                    value={carrierForm.billingMethod}
                    onChange={(e) => setCarrierForm({ ...carrierForm, billingMethod: e.target.value as "weight" | "price" })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    <option value="weight">Desi / Ağırlık Bazlı</option>
                    <option value="price">Sepet Tutarı Bazlı</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={carrierForm.pricingType !== "flat" ? "opacity-50" : ""}>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    Sabit Kargo Ücreti (₺)
                    {carrierForm.pricingType === "tiered" && <span className="text-[10px] text-amber-600 ml-1 font-semibold">(Pasif)</span>}
                    {carrierForm.pricingType === "receiver_pay" && <span className="text-[10px] text-emerald-600 ml-1 font-semibold">(Alıcı Ödemeli - 0 ₺)</span>}
                  </label>
                  <input
                    required={carrierForm.pricingType === "flat"}
                    disabled={carrierForm.pricingType !== "flat"}
                    type="number"
                    min={0}
                    placeholder={carrierForm.pricingType === "receiver_pay" ? "0 ₺ (Alıcı Ödemeli)" : carrierForm.pricingType === "tiered" ? "Kademeli Fiyat Aktif" : "150"}
                    value={carrierForm.pricingType === "receiver_pay" ? 0 : carrierForm.fallbackFee}
                    onChange={(e) => setCarrierForm({ ...carrierForm, fallbackFee: Number(e.target.value) })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm font-semibold transition-colors ${
                      carrierForm.pricingType !== "flat"
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white border-slate-300 text-gray-900 focus:outline-none focus:border-orange-500"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Kargo Ücretsiz Limiti (₺)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={carrierForm.freeThreshold}
                    onChange={(e) => setCarrierForm({ ...carrierForm, freeThreshold: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">KDV Oranı (%)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    max={100}
                    value={carrierForm.taxRate}
                    onChange={(e) => setCarrierForm({ ...carrierForm, taxRate: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="flex items-center gap-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carrierForm.isActive}
                    onChange={(e) => setCarrierForm({ ...carrierForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-800">Firma Aktif</span>
                    <p className="text-[11px] text-gray-400 font-medium">Ödeme adımlarında kargo seçeneği olarak gösterilir.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3.5 cursor-pointer border-t border-slate-200 pt-3">
                  <input
                    type="checkbox"
                    checked={carrierForm.isFreeShipping}
                    onChange={(e) => setCarrierForm({ ...carrierForm, isFreeShipping: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-800">Her Zaman Ücretsiz Kargo</span>
                    <p className="text-[11px] text-gray-400 font-medium">Bu firma seçildiğinde kargo ücreti her sipariş için 0 ₺ olur.</p>
                  </div>
                </label>
              </div>

              {/* API settings */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" /> API Entegrasyon Ayarları
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Entegrasyon Tipi</label>
                    <select
                      value={carrierForm.integrationType}
                      onChange={(e) => setCarrierForm({ ...carrierForm, integrationType: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                    >
                      <option value="none">Entegrasyon Yok (Manuel Giriş)</option>
                      <option value="yurtici">Yurtiçi Kargo API</option>
                      <option value="aras">Aras Kargo API</option>
                      <option value="mng">MNG Kargo API</option>
                    </select>
                  </div>

                  {carrierForm.integrationType !== "none" && (
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                        <input
                          type="checkbox"
                          checked={carrierForm.isTestMode}
                          onChange={(e) => setCarrierForm({ ...carrierForm, isTestMode: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-sm font-bold text-gray-700">Test Modu (Sandbox)</span>
                      </label>
                    </div>
                  )}
                </div>

                {carrierForm.integrationType !== "none" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Müşteri / Abone Kodu</label>
                      <input
                        type="text"
                        placeholder="Abone / Müşteri Kodu"
                        value={carrierForm.customerCode}
                        onChange={(e) => setCarrierForm({ ...carrierForm, customerCode: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">API Kullanıcı Adı</label>
                      <input
                        type="text"
                        placeholder="Kullanıcı Adı"
                        value={carrierForm.apiUsername}
                        onChange={(e) => setCarrierForm({ ...carrierForm, apiUsername: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">API Şifresi</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={carrierForm.apiPassword}
                        onChange={(e) => setCarrierForm({ ...carrierForm, apiPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Limit Dışı Kademe Davranışı</label>
                <select
                  value={carrierForm.outOfRangeBehavior}
                  onChange={(e) => setCarrierForm({ ...carrierForm, outOfRangeBehavior: e.target.value as "highest" | "disable" })}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  <option value="highest">En Yüksek Kademe Ücretini Uygula</option>
                  <option value="disable">Bu Kargo Firmasını Devre Dışı Bırak</option>
                </select>
              </div>

              <div className={`space-y-3 pt-2 ${carrierForm.pricingType === "flat" ? "opacity-40 pointer-events-none" : ""}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fiyat & Hacim Kademeleri (Desi/Kg)</h3>
                    {carrierForm.pricingType === "flat" && (
                      <span className="text-[10px] text-amber-600 font-semibold block">⚠️ Sabit kargo yöntemi seçildiği için kademeler devredışıdır.</span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={carrierForm.pricingType === "flat"}
                    onClick={handleAddTierRow}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-lg text-xs font-bold shadow-sm transition ${
                      carrierForm.pricingType === "flat"
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-500" /> Kademe Ekle
                  </button>
                </div>

                {carrierForm.tiers.length === 0 ? (
                  <div className="border border-slate-200 border-dashed rounded-2xl p-6 text-center text-gray-400 text-xs font-medium bg-white">
                    Tanımlı kademe bulunmuyor. Kademesiz durumlarda yukarıdaki "Sabit Kargo Ücreti" uygulanır.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {carrierForm.tiers.map((tier, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <span className="block text-[9px] text-gray-400 font-semibold mb-1">MİN {carrierForm.billingMethod === "price" ? "TUTAR (₺)" : "DESİ"}</span>
                            <input
                              type="number"
                              step="any"
                              min={0}
                              value={tier.minDesi}
                              onChange={(e) => handleUpdateTierField(idx, "minDesi", Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-gray-900"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] text-gray-400 font-semibold mb-1">MAX {carrierForm.billingMethod === "price" ? "TUTAR (₺)" : "DESİ"}</span>
                            <input
                              type="number"
                              step="any"
                              min={0}
                              value={tier.maxDesi}
                              onChange={(e) => handleUpdateTierField(idx, "maxDesi", Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-gray-900"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] text-gray-400 font-semibold mb-1">ÜCRET (₺)</span>
                            <input
                              type="number"
                              min={0}
                              value={tier.price}
                              onChange={(e) => handleUpdateTierField(idx, "price", Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-gray-900"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTierRow(idx)}
                          className="w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-lg flex items-center justify-center shadow-sm shrink-0 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  type="submit"
                  className="w-full md:w-auto px-8 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider transition shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Kargo Firmasını Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CARGO TRACKING STATUS MODAL */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsTrackingModalOpen(false)}></div>
          
          <div className="bg-white relative z-10 rounded-[2rem] w-full max-w-lg shadow-2xl border border-gray-200 transform animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-[2rem]">
              <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" /> Kargo API Canlı Takip
              </h2>
              <button onClick={() => setIsTrackingModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-red-100 hover:text-red-700 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingTracking ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  <span className="text-xs font-semibold">Kargo firmasından canlı durum sorgulanıyor...</span>
                </div>
              ) : trackingData ? (
                <div className="space-y-6 bg-white">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{trackingData.carrier}</p>
                      <p className="text-sm font-mono font-bold text-gray-800 mt-0.5">{trackingData.trackingNumber}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-black rounded-full uppercase border ${
                      trackingData.currentStatus === "Teslim Edildi" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {trackingData.currentStatus}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Gönderi Hareketleri</h3>
                    <div className="relative pl-6 border-l border-slate-200 space-y-5">
                      {trackingData.checkpoints?.map((cp: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-4 border-white flex items-center justify-center ${
                            idx === 0 
                              ? "bg-amber-500 ring-4 ring-amber-500/20" 
                              : "bg-slate-300"
                          }`}></div>
                          
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-baseline gap-4">
                              <span className={`text-xs font-black ${idx === 0 ? "text-gray-900" : "text-gray-600"}`}>
                                {cp.status}
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold tracking-tight whitespace-nowrap">
                                {cp.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                              {cp.description}
                            </p>
                            <span className="inline-block text-[9px] text-slate-400 font-bold uppercase mt-1">
                              📍 {cp.location}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Takip bilgisi yüklenemedi.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[2rem] flex justify-end">
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .text-\\[\\#b45309\\] {
          color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .bg-\\[\\#b45309\\] {
          background-color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .border-\\[\\#b45309\\] {
          border-color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .focus\\:border-\\[\\#b45309\\]:focus {
          border-color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .focus\\:ring-\\[\\#b45309\\]\\/20:focus {
          box-shadow: 0 0 0 4px ${settings?.primaryColor || "#b45309"}33 !important;
        }
        .hover\\:text-\\[\\#b45309\\]:hover {
          color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .hover\\:border-\\[\\#b45309\\]:hover {
          border-color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .hover\\:bg-\\[\\#b45309\\]:hover {
          background-color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .text-amber-500 {
          color: ${settings?.primaryColor || "#b45309"} !important;
        }
        .border-amber-500 {
          border-color: ${settings?.primaryColor || "#b45309"} !important;
        }
      `}} />
    </div>
  );
}

