"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  ClipboardPaste,
  Sparkles,
  HelpCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { saveProducts, getProducts } from "@/utils/productsStorage";

interface BulkProductRow {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  list_price?: number;
  stock: number;
  unit: string;
  criticalLimit: number;
  desc?: string;
  barcode?: string;
  image?: string;
  active: boolean;
  isExisting?: boolean;
  isValid?: boolean;
  error?: string;
}

interface BulkProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingSkus?: Set<string>;
}

export default function BulkProductImportModal({
  isOpen,
  onClose,
  onSuccess,
  existingSkus = new Set()
}: BulkProductImportModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste" | "preview">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);

  // Rows state
  const [rows, setRows] = useState<BulkProductRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Generate & Download Sample Excel Template
  const handleDownloadTemplate = (format: "xlsx" | "csv" = "xlsx") => {
    try {
      const headers = [
        "Ürün Adı",
        "Stok Kodu (SKU)",
        "Kategori",
        "Satış Fiyatı (TL)",
        "Maliyet (TL)",
        "Liste / Eski Fiyat (TL)",
        "Mevcut Stok",
        "Birim",
        "Kritik Stok Limiti",
        "Açıklama",
        "Barkod",
        "Durum (Yayında/Taslak)"
      ];

      const sampleRows = [
        [
          "PEKEFE Geleneksel İspir Dut Gün Pekmezi 400g",
          "PKF-DUT-400G",
          "Dut Pekmezi",
          450,
          200,
          520,
          150,
          "Kavanoz",
          10,
          "İspir güneşinde doğal yoğunlaştırılmış geleneksel gün pekmezi.",
          "869000100101",
          "Yayında"
        ],
        [
          "PEKEFE İspir Cevizli Köme (Cevizli Sucuk) 500g",
          "PKF-KOME-500G",
          "Pestil - Köme",
          380,
          160,
          440,
          120,
          "Paket",
          15,
          "Yerli İspir cevizi ve dut şırası ile hazırlanan geleneksel köme.",
          "869000100102",
          "Yayında"
        ],
        [
          "PEKEFE Hakiki İspir Kuru Fasulyesi (Coğrafi İşaretli) 1kg",
          "PKF-FASULYE-1KG",
          "Bakliyat",
          320,
          140,
          360,
          200,
          "Kg",
          20,
          "Erzurum İspir tescilli coğrafi işaretli doğal şeker fasulye.",
          "869000100103",
          "Yayında"
        ]
      ];

      const wsData = [headers, ...sampleRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-fit column widths
      ws["!cols"] = [
        { wch: 45 }, // Ürün Adı
        { wch: 18 }, // SKU
        { wch: 18 }, // Kategori
        { wch: 16 }, // Satış Fiyatı
        { wch: 14 }, // Maliyet
        { wch: 20 }, // Liste Fiyatı
        { wch: 14 }, // Stok
        { wch: 10 }, // Birim
        { wch: 18 }, // Kritik Limit
        { wch: 40 }, // Açıklama
        { wch: 16 }, // Barkod
        { wch: 18 }  // Durum
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ürünler");

      if (format === "xlsx") {
        XLSX.writeFile(wb, "Pekefe_Toplu_Urun_Sablonu.xlsx");
        toast.success("Örnek Excel şablonu (.xlsx) başarıyla indirildi.");
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Pekefe_Toplu_Urun_Sablonu.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Örnek CSV şablonu (.csv, UTF-8) başarıyla indirildi.");
      }
    } catch (err: any) {
      console.error("Şablon indirme hatası:", err);
      toast.error("Şablon oluşturulurken bir hata meydana geldi.");
    }
  };

  // 2. Parse Raw Data to Standardized Rows
  const parseRowsFromRawData = (rawList: any[]): BulkProductRow[] => {
    return rawList.map((item, idx) => {
      // Find matching keys with case-insensitive check
      const findVal = (keys: string[]) => {
        for (const k of keys) {
          if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== "") {
            return item[k];
          }
          const lowerK = k.toLowerCase();
          for (const objKey of Object.keys(item)) {
            if (objKey.toLowerCase().trim() === lowerK) {
              return item[objKey];
            }
          }
        }
        return undefined;
      };

      const name = String(findVal(["Ürün Adı", "ÜrünAdı", "name", "title", "urun_adi"]) || "").trim();
      const rawSku = String(findVal(["Stok Kodu (SKU)", "Stok Kodu", "SKU", "sku", "kod"]) || "").trim();
      const sku = rawSku || `PKF-${Math.floor(100000 + Math.random() * 900000)}`;

      const category = String(findVal(["Kategori", "category", "kategori"]) || "Dut Pekmezi").trim();
      const price = Number(findVal(["Satış Fiyatı (TL)", "Satış Fiyatı", "Fiyat", "price", "sale_price"]) || 0);
      const cost = Number(findVal(["Maliyet (TL)", "Maliyet", "cost", "alis_fiyati"]) || Math.round(price * 0.45));
      const list_price = Number(findVal(["Liste / Eski Fiyat (TL)", "Liste Fiyatı", "oldPrice", "list_price"]) || price);
      const stock = Math.max(0, Number(findVal(["Mevcut Stok", "Stok", "stock", "quantity"]) || 0));
      const unit = String(findVal(["Birim", "unit", "birim"]) || "Adet").trim();
      const criticalLimit = Number(findVal(["Kritik Stok Limiti", "Kritik Limit", "criticalLimit"]) || 5);
      const desc = String(findVal(["Açıklama", "desc", "description", "shortDesc"]) || "").trim();
      const barcode = String(findVal(["Barkod", "barcode", "barkod"]) || "").trim();
      const statusRaw = String(findVal(["Durum (Yayında/Taslak)", "Durum", "status", "yayinda"]) || "Yayında").toLowerCase();
      const active = statusRaw.includes("yay") || statusRaw.includes("aktif") || statusRaw === "1" || statusRaw === "true";

      const isExisting = rawSku ? existingSkus.has(rawSku.toLowerCase()) : false;
      let error = "";
      if (!name) error = "Ürün adı boş olamaz.";
      else if (isNaN(price) || price <= 0) error = "Geçerli bir satış fiyatı giriniz.";

      return {
        name,
        sku,
        category,
        price,
        cost,
        list_price,
        stock,
        unit,
        criticalLimit,
        desc,
        barcode,
        active,
        isExisting,
        isValid: !error,
        error
      };
    });
  };

  // 3. Handle File Upload (Excel or CSV with UTF-8 Turkish character support)
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    const isCsv = file.name.toLowerCase().endsWith(".csv");

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = isCsv
          ? XLSX.read(data, { type: "string" })
          : XLSX.read(new Uint8Array(data as ArrayBuffer), { type: "array", codepage: 65001 });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        if (!json || json.length === 0) {
          toast.error("Yüklenen dosya boş veya okunamadı.");
          return;
        }

        const parsed = parseRowsFromRawData(json);
        setRows(parsed);
        setActiveTab("preview");
        toast.success(`${parsed.length} adet ürün dosyadan başarıyla ayrıştırıldı.`);
      } catch (err: any) {
        console.error("Dosya okuma hatası:", err);
        toast.error("Dosya okunurken hata oluştu. Lütfen geçerli bir Excel veya CSV dosyası yükleyin.");
      }
    };

    if (isCsv) {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // 4. Handle Clipboard Paste (Copy from Excel and Ctrl+V directly)
  const handlePasteFromClipboard = (pastedText: string) => {
    if (!pastedText.trim()) return;

    const lines = pastedText.trim().split(/\r\n|\n|\r/);
    const newItems: any[] = [];

    lines.forEach((line) => {
      const parts = line.split("\t");
      if (parts.length >= 2) {
        // Assume order: Name, SKU, Category, Price, Cost, Stock, Unit
        newItems.push({
          "Ürün Adı": parts[0]?.trim(),
          "Stok Kodu (SKU)": parts[1]?.trim(),
          "Kategori": parts[2]?.trim() || "Dut Pekmezi",
          "Satış Fiyatı (TL)": parts[3]?.replace(",", ".") || 0,
          "Maliyet (TL)": parts[4]?.replace(",", ".") || 0,
          "Mevcut Stok": parts[5] || 0,
          "Birim": parts[6]?.trim() || "Adet"
        });
      }
    });

    if (newItems.length > 0) {
      const parsed = parseRowsFromRawData(newItems);
      setRows(parsed);
      setActiveTab("preview");
      toast.success(`${parsed.length} ürün panodan başarıyla aktarıldı!`);
    } else {
      toast.error("Panodaki veri tablolanamadı. Lütfen Excel'den hücreleri kopyaladığınızdan emin olun.");
    }
  };

  // 5. Submit to Bulk API
  const handleSaveBulkProducts = async () => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Kaydedilecek geçerli ürün bulunamadı. Lütfen hatalı alanları düzeltin.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: validRows,
          updateExisting
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "İçe aktarma başarısız oldu.");
      }

      // Sync local storage products
      if (result.products && Array.isArray(result.products)) {
        const currentLocal = getProducts() || [];
        const combined = [...result.products, ...currentLocal.filter(cp => !result.products.some((rp: any) => rp.sku === cp.sku || rp.id === cp.id))];
        saveProducts(combined);
      }

      toast.success(`Tebrikler! ${result.message || "Ürünler başarıyla içe aktarıldı."}`, {
        duration: 5000
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Toplu kayıt hatası:", err);
      toast.error(err.message || "İçe aktarılırken bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.filter((r) => !r.isValid).length;
  const existingCount = rows.filter((r) => r.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#b45309] flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Profesyonel Toplu Ürün Ekleme
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  Excel & CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Onlarca ürünü Excel şablonuyla veya doğrudan kopyala-yapıştır ile saniyeler içinde kataloğa ekleyin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("file")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "file"
                  ? "border-[#b45309] text-[#b45309]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              1. Dosya Yükle (Excel/CSV)
            </button>
            <button
              onClick={() => setActiveTab("paste")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "paste"
                  ? "border-[#b45309] text-[#b45309]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              2. Hızlı Yapıştır & Grid
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "preview"
                  ? "border-[#b45309] text-[#b45309]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              3. Önizleme & Onay ({rows.length})
            </button>
          </div>

          {/* Quick template download button */}
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => handleDownloadTemplate("xlsx")}
              className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Örnek sütunlar ve açıklamalar içeren Excel şablonu indirin"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Örnek Excel Şablonu (.xlsx)
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: FILE DROPZONE */}
          {activeTab === "file" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 ${
                  isDragging
                    ? "border-[#b45309] bg-amber-500/5 scale-[0.99]"
                    : "border-slate-200 hover:border-[#b45309]/60 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-[#b45309] flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Excel (.xlsx, .xls) veya CSV dosyanızı buraya sürükleyin
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    veya bilgisayarınızdan seçmek için bu alana tıklayın
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  <span>Desteklenen: .xlsx, .xls, .csv (Maks. 5.000 satır)</span>
                </div>
              </div>

              {/* Guide box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Excel Dosyası Hazırlama İpuçları:</p>
                  <p>• <strong>Ürün Adı</strong> ve <strong>Satış Fiyatı</strong> alanları zorunludur.</p>
                  <p>• <strong>Stok Kodu (SKU)</strong> boş bırakılırsa sistem otomatik benzersiz kod üretir.</p>
                  <p>• Mevcut bir ürünün kodunu girerseniz sistem stoğu ve fiyatı güncelleyebilir.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COPY-PASTE & QUICK SPREADSHEET */}
          {activeTab === "paste" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Excel'den Kopyala & Tabloya Yapıştır
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Excel'de seçtiğiniz hücreleri kopyalayın (Ctrl+C), aşağıdaki butona tıklayarak veya tabloya odaklanıp yapıştırın (Ctrl+V).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      handlePasteFromClipboard(text);
                    } catch (e) {
                      toast.error("Panoya erişilemedi. Lütfen doğrudan Ctrl+V tuşlarıyla yapıştırın.");
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#b45309] text-white hover:bg-[#92400e] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Panodan Yapıştır
                </button>
              </div>

              {/* Textarea for raw tab-delimited paste */}
              <div className="relative">
                <textarea
                  rows={8}
                  placeholder={`Örnek Format (Excel'den direkt kopyalayabilirsiniz):\nPEKEFE Dut Pekmezi 400g\tPKF-DUT-001\tDut Pekmezi\t450\t200\t150\tKavanoz\nPEKEFE Cevizli Köme\tPKF-KOME-001\tPestil - Köme\t380\t160\t100\tPaket`}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (text) {
                      e.preventDefault();
                      handlePasteFromClipboard(text);
                    }
                  }}
                  className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#b45309] transition"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW & VALIDATION TABLE */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              {/* Summary counters & settings */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-800">
                    Toplam: {rows.length} Ürün
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> {validCount} Geçerli
                  </span>
                  {errorCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3" /> {errorCount} Hatalı
                    </span>
                  )}
                  {existingCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      <RefreshCw className="w-3 h-3" /> {existingCount} Güncellenecek
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="rounded border-slate-300 text-[#b45309] focus:ring-0 cursor-pointer"
                    />
                    <span>Mevcut SKU'lu Ürünleri Güncelle</span>
                  </label>
                  <button
                    onClick={() => setRows([])}
                    className="text-xs font-semibold text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    Tümünü Temizle
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              {rows.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Henüz içe aktarılacak ürün verisi bulunmuyor. Dosya yükleyin veya yapıştırın.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-3 w-10 text-center">Durum</th>
                          <th className="px-4 py-3 min-w-[200px]">Ürün Adı *</th>
                          <th className="px-3 py-3 w-28">SKU</th>
                          <th className="px-3 py-3 w-32">Kategori</th>
                          <th className="px-3 py-3 w-24 text-right">Fiyat (TL) *</th>
                          <th className="px-3 py-3 w-20 text-right">Maliyet</th>
                          <th className="px-3 py-3 w-20 text-center">Stok</th>
                          <th className="px-3 py-3 w-16 text-center">Birim</th>
                          <th className="px-3 py-3 w-10 text-center">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((row, index) => (
                          <tr
                            key={index}
                            className={`transition hover:bg-slate-50/70 ${
                              !row.isValid ? "bg-red-50/40" : row.isExisting ? "bg-amber-50/30" : ""
                            }`}
                          >
                            <td className="px-3 py-2.5 text-center">
                              {!row.isValid ? (
                                <span title={row.error} className="inline-flex p-1 bg-red-100 text-red-600 rounded-lg">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </span>
                              ) : row.isExisting ? (
                                <span title="Mevcut ürün güncellenecek" className="inline-flex p-1 bg-amber-100 text-amber-700 rounded-lg">
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span title="Yeni ürün" className="inline-flex p-1 bg-emerald-100 text-emerald-600 rounded-lg">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], name: val, isValid: !!val && copy[index].price > 0 };
                                    return copy;
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#b45309]"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={row.sku}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], sku: val };
                                    return copy;
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#b45309]"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={row.category}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], category: val };
                                    return copy;
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#b45309]"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="number"
                                min={0}
                                value={row.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], price: val, isValid: !!copy[index].name && val > 0 };
                                    return copy;
                                  });
                                }}
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right focus:outline-none focus:border-[#b45309]"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <input
                                type="number"
                                min={0}
                                value={row.cost}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], cost: val };
                                    return copy;
                                  });
                                }}
                                className="w-18 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:border-[#b45309]"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                value={row.stock}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], stock: val };
                                    return copy;
                                  });
                                }}
                                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-semibold focus:outline-none focus:border-[#b45309]"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-slate-500 font-semibold">{row.unit}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setRows((prev) => prev.filter((_, i) => i !== index));
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                title="Satırı Kaldır"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadTemplate("csv")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              CSV Şablonu İndir
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Vazgeç
            </button>

            {activeTab !== "preview" ? (
              <button
                type="button"
                onClick={() => {
                  if (rows.length > 0) setActiveTab("preview");
                  else toast.info("Lütfen önce dosya yükleyin veya veri yapıştırın.");
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                Önizlemeye Geç <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveBulkProducts}
                disabled={isProcessing || validCount === 0}
                className="px-6 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] disabled:bg-slate-300 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow shadow-[#b45309]/20"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    İçe Aktarılıyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {validCount} Ürünü Kataloğa Ekle
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
