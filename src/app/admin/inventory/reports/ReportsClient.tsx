"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileBarChart,
  Calendar,
  Warehouse as WarehouseIcon,
  Download,
  Printer,
  Search,
  Loader2,
  Table,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  FileDown,
  Layers,
} from "lucide-react";
import { getInventoryReportData } from "@/modules/inventory/server/inventoryActions";
import * as XLSX from "xlsx";
import { exportToPDF } from "@/lib/pdf-export";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  branch: {
    name: string;
  };
}

interface ReportsClientProps {
  warehouses: Warehouse[];
  initialReportType: string;
  initialWarehouseId: string;
  initialDateFrom: string;
  initialDateTo: string;
  reportData: any;
}

export default function ReportsClient({
  warehouses,
  initialReportType,
  initialWarehouseId,
  initialDateFrom,
  initialDateTo,
  reportData,
}: ReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [reportType, setReportType] = useState(initialReportType);
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  // Selection & Dropdown States
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

  const handleRunReport = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("type", reportType);
      if (warehouseId) params.set("warehouseId", warehouseId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      // Reset selected rows when running a new report parameters
      setSelectedRows(new Set());
      router.push(`?${params.toString()}`);
    });
  };

  // Helper function to fetch all IDs for the currently loaded report
  const getReportItemIds = (): string[] => {
    if (!reportData) return [];
    if (reportType === "stock_status") {
      return (reportData.locations || []).map((loc: any) => loc.id);
    } else if (reportType === "movements") {
      return (reportData.transactions || []).map((tx: any) => tx.id);
    } else if (reportType === "transfers") {
      return (reportData.transfers || []).map((tr: any) => tr.id);
    } else if (reportType === "critical") {
      const outOfStock = reportData.outOfStock || [];
      const critical = reportData.critical || [];
      return [...outOfStock, ...critical].map((p: any) => p.id);
    } else if (reportType === "cycle_count") {
      return (reportData.cycleCounts || []).map((cc: any) => cc.id);
    }
    return [];
  };

  const handlePrint = (mode: "selected" | "all") => {
    if (!reportData) {
      toast.error("Rapor verisi bulunamadı.");
      return;
    }

    try {
      let title = "";
      let subtitle = "";
      let filename = `envanter_raporu_${reportType}`;
      let headers: string[] = ["#"];
      let rows: any[][] = [];

      const filters = [
        { label: "Depo", value: warehouseId ? warehouses.find(w => w.id === warehouseId)?.name || "" : "Tüm Depolar" },
        { label: "Başlangıç Tarihi", value: dateFrom },
        { label: "Bitiş Tarihi", value: dateTo },
      ];

      if (reportType === "stock_status") {
        title = mode === "selected" ? "Stok Durum Raporu (Seçilenler)" : "Stok Durum Raporu";
        subtitle = "Anlık depo ve şube bazlı stok maliyet ve miktar raporu.";
        filename = mode === "selected" ? "stok_durum_raporu_secilenler" : "stok_durum_raporu";
        headers = ["#", "Ürün Adı", "SKU", "Kategori", "Şube", "Depo", "Fiziksel Stok", "Rezerve", "Birim Maliyet", "Toplam Değer"];
        
        let locations = reportData.locations || [];
        if (mode === "selected") {
          locations = locations.filter((loc: any) => selectedRows.has(loc.id));
        }
        if (locations.length === 0) {
          toast.error("Raporlanacak veri bulunamadı. Lütfen önce tablodan seçim yapın.");
          return;
        }

        rows = locations.map((loc: any, idx: number) => [
          String(idx + 1),
          loc.product?.name || "",
          loc.product?.sku || "",
          loc.product?.category || "",
          loc.warehouse?.branch?.name || "",
          loc.warehouse?.name || "",
          (loc.stock ?? 0).toLocaleString("tr-TR"),
          (loc.reserved ?? 0).toLocaleString("tr-TR"),
          new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(loc.product?.cost ?? 0),
          new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format((loc.product?.cost ?? 0) * (loc.stock ?? 0)),
        ]);

      } else if (reportType === "movements") {
        title = mode === "selected" ? "Stok Hareketleri Raporu (Seçilenler)" : "Stok Hareketleri Raporu";
        subtitle = "Tüm depolar arası ve dışı stok hareketleri audit izi.";
        filename = mode === "selected" ? "stok_hareketleri_raporu_secilenler" : "stok_hareketleri_raporu";
        headers = ["#", "Tarih", "Ürün Adı", "SKU", "İşlem Türü", "Miktar", "Depo", "Açıklama", "Kullanıcı"];
        
        let transactions = reportData.transactions || [];
        if (mode === "selected") {
          transactions = transactions.filter((tx: any) => selectedRows.has(tx.id));
        }
        if (transactions.length === 0) {
          toast.error("Raporlanacak veri bulunamadı. Lütfen önce tablodan seçim yapın.");
          return;
        }

        rows = transactions.map((tx: any, idx: number) => [
          String(idx + 1),
          tx.date ? new Date(tx.date).toLocaleString("tr-TR") : "",
          tx.product?.name || "",
          tx.product?.sku || "",
          tx.type || "",
          (tx.quantity ?? 0).toLocaleString("tr-TR"),
          tx.warehouse?.name || "—",
          tx.description || "—",
          tx.userEmail || "Sistem",
        ]);

      } else if (reportType === "transfers") {
        title = mode === "selected" ? "Depolar Arası Transferler Raporu (Seçilenler)" : "Depolar Arası Transferler Raporu";
        subtitle = "Sevk edilen ve onay bekleyen şubeler arası ürün transferleri.";
        filename = mode === "selected" ? "depolar_arasi_transfer_raporu_secilenler" : "depolar_arasi_transfer_raporu";
        headers = ["#", "Transfer No", "Ürün Adı", "SKU", "Çıkış Deposu", "Giriş Deposu", "Miktar", "Durum", "Tarih"];
        
        let transfers = reportData.transfers || [];
        if (mode === "selected") {
          transfers = transfers.filter((tr: any) => selectedRows.has(tr.id));
        }
        if (transfers.length === 0) {
          toast.error("Raporlanacak veri bulunamadı. Lütfen önce tablodan seçim yapın.");
          return;
        }

        rows = transfers.map((tr: any, idx: number) => [
          String(idx + 1),
          tr.transferNo || "",
          tr.product?.name || "",
          tr.product?.sku || "",
          tr.fromWarehouse?.name || "",
          tr.toWarehouse?.name || "",
          (tr.quantity ?? 0).toLocaleString("tr-TR"),
          tr.status || "",
          tr.createdAt ? new Date(tr.createdAt).toLocaleString("tr-TR") : "",
        ]);

      } else if (reportType === "critical") {
        title = mode === "selected" ? "Kritik Stok Raporu (Seçilenler)" : "Kritik Stok Raporu";
        subtitle = "Mevcut stoku belirlenen kritik seviyelerin altına düşmüş ürünler.";
        filename = mode === "selected" ? "kritik_stok_raporu_secilenler" : "kritik_stok_raporu";
        headers = ["#", "Ürün Adı", "SKU", "Kategori", "Mevcut Stok", "Kritik Limit", "Durum"];
        
        let outOfStock = reportData.outOfStock || [];
        let critical = reportData.critical || [];
        if (mode === "selected") {
          outOfStock = outOfStock.filter((p: any) => selectedRows.has(p.id));
          critical = critical.filter((p: any) => selectedRows.has(p.id));
        }
        if (outOfStock.length === 0 && critical.length === 0) {
          toast.error("Raporlanacak veri bulunamadı. Lütfen önce tablodan seçim yapın.");
          return;
        }
        
        const row1 = outOfStock.map((p: any, idx: number) => [
          String(idx + 1),
          p.name || "",
          p.sku || "",
          p.category || "",
          "0",
          String(p.criticalLimit ?? 0),
          "Stok Yok",
        ]);
        
        const row2 = critical.map((p: any, idx: number) => [
          String(idx + 1 + outOfStock.length),
          p.name || "",
          p.sku || "",
          p.category || "",
          String(p.stock ?? 0),
          String(p.criticalLimit ?? 0),
          "Eşik Altında",
        ]);
        
        rows = [...row1, ...row2];

      } else if (reportType === "cycle_count") {
        title = mode === "selected" ? "Sayım Raporu (Seçilenler)" : "Sayım Raporu";
        subtitle = "Periyodik envanter sayımları durum ve detay listesi.";
        filename = mode === "selected" ? "sayim_raporlari_ozeti_secilenler" : "sayim_raporlari_ozeti";
        headers = ["#", "Sayım Kodu", "Depo", "Tür", "Durum", "Sorumlu", "Açılış Tarihi"];
        
        let cycleCounts = reportData.cycleCounts || [];
        if (mode === "selected") {
          cycleCounts = cycleCounts.filter((cc: any) => selectedRows.has(cc.id));
        }
        if (cycleCounts.length === 0) {
          toast.error("Raporlanacak veri bulunamadı. Lütfen önce tablodan seçim yapın.");
          return;
        }

        rows = cycleCounts.map((cc: any, idx: number) => [
          String(idx + 1),
          cc.code || "",
          cc.warehouse?.name || "",
          cc.type || "",
          cc.status || "",
          cc.createdBy || "—",
          cc.createdAt ? new Date(cc.createdAt).toLocaleString("tr-TR") : "",
        ]);
      }

      exportToPDF({
        title,
        subtitle,
        filename,
        headers,
        rows,
        filters,
      });

      toast.success("PDF Raporu başarıyla indirildi.");
    } catch (err) {
      console.error(err);
      toast.error("PDF raporu oluşturulurken bir hata meydana geldi.");
    }
  };

  // Export to Excel using xlsx package
  const handleExportExcel = (mode: "selected" | "all") => {
    if (!reportData) {
      toast.error("Aktarılacak veri bulunamadı.");
      return;
    }

    try {
      let exportRows: any[] = [];
      let filename = `envanter_raporu_${reportType}`;

      if (reportType === "stock_status") {
        let locations = reportData.locations || [];
        if (mode === "selected") {
          locations = locations.filter((loc: any) => selectedRows.has(loc.id));
        }
        if (locations.length === 0) {
          toast.error("Aktarılacak veri bulunamadı. Lütfen önce satır seçtiğinizden emin olun.");
          return;
        }

        exportRows = locations.map((loc: any) => ({
          "Ürün Adı": loc.product.name,
          "SKU": loc.product.sku,
          "Kategori": loc.product.category,
          "Şube": loc.warehouse.branch.name,
          "Depo": loc.warehouse.name,
          "Depo Kodu": loc.warehouse.code,
          "Fiziksel Stok": loc.stock,
          "Rezerve Stok": loc.reserved,
          "Kullanılabilir Stok": loc.stock - loc.reserved,
          "Birim Maliyet (TL)": loc.product.cost,
          "Toplam Maliyet Değeri (TL)": loc.product.cost * loc.stock,
          "Raf Konumu": loc.rack || "",
        }));
        filename = mode === "selected" ? "stok_durum_raporu_secilenler" : "stok_durum_raporu";

      } else if (reportType === "movements") {
        let transactions = reportData.transactions || [];
        if (mode === "selected") {
          transactions = transactions.filter((tx: any) => selectedRows.has(tx.id));
        }
        if (transactions.length === 0) {
          toast.error("Aktarılacak veri bulunamadı. Lütfen önce satır seçtiğinizden emin olun.");
          return;
        }

        exportRows = transactions.map((tx: any) => ({
          "Tarih": new Date(tx.date).toLocaleString("tr-TR"),
          "Ürün Adı": tx.product.name,
          "SKU": tx.product.sku,
          "İşlem Türü": tx.type,
          "Miktar": tx.quantity,
          "Depo": tx.warehouse?.name || "",
          "Kaynak Modül": tx.moduleSource || "",
          "Açıklama": tx.description || "",
          "Kullanıcı": tx.userEmail || "Sistem",
        }));
        filename = mode === "selected" ? "stok_hareketleri_raporu_secilenler" : "stok_hareketleri_raporu";

      } else if (reportType === "transfers") {
        let transfers = reportData.transfers || [];
        if (mode === "selected") {
          transfers = transfers.filter((tr: any) => selectedRows.has(tr.id));
        }
        if (transfers.length === 0) {
          toast.error("Aktarılacak veri bulunamadı. Lütfen önce satır seçtiğinizden emin olun.");
          return;
        }

        exportRows = transfers.map((tr: any) => ({
          "Transfer No": tr.transferNo,
          "Ürün Adı": tr.product.name,
          "SKU": tr.product.sku,
          "Çıkış Deposu": tr.fromWarehouse.name,
          "Giriş Deposu": tr.toWarehouse.name,
          "Miktar": tr.quantity,
          "Durum": tr.status,
          "İsteyen": tr.requester || "",
          "Oluşturulma": new Date(tr.createdAt).toLocaleString("tr-TR"),
          "Açıklama": tr.notes || "",
        }));
        filename = mode === "selected" ? "depolar_arasi_transfer_raporu_secilenler" : "depolar_arasi_transfer_raporu";

      } else if (reportType === "critical") {
        let critical = reportData.critical || [];
        let outOfStock = reportData.outOfStock || [];
        if (mode === "selected") {
          critical = critical.filter((p: any) => selectedRows.has(p.id));
          outOfStock = outOfStock.filter((p: any) => selectedRows.has(p.id));
        }
        if (critical.length === 0 && outOfStock.length === 0) {
          toast.error("Aktarılacak veri bulunamadı. Lütfen önce satır seçtiğinizden emin olun.");
          return;
        }

        exportRows = [...critical, ...outOfStock].map((p: any) => ({
          "Ürün Adı": p.name,
          "SKU": p.sku,
          "Kategori": p.category,
          "Fiziksel Stok": p.stock,
          "Kritik Limit": p.criticalLimit,
          "Maliyet (TL)": p.cost,
          "Durum": p.stock <= 0 ? "Stok Yok" : "Kritik Limit Altında",
        }));
        filename = mode === "selected" ? "kritik_stok_raporu_secilenler" : "kritik_stok_raporu";

      } else if (reportType === "cycle_count") {
        let cycleCounts = reportData.cycleCounts || [];
        if (mode === "selected") {
          cycleCounts = cycleCounts.filter((cc: any) => selectedRows.has(cc.id));
        }
        if (cycleCounts.length === 0) {
          toast.error("Aktarılacak veri bulunamadı. Lütfen önce satır seçtiğinizden emin olun.");
          return;
        }

        exportRows = cycleCounts.map((cc: any) => ({
          "Sayım Kodu": cc.code,
          "Depo": cc.warehouse.name,
          "Tür": cc.type,
          "Durum": cc.status,
          "Sorumlu": cc.createdBy || "",
          "Açılış Tarihi": new Date(cc.createdAt).toLocaleString("tr-TR"),
          "Kilitli": cc.isLocked ? "Evet" : "Hayır",
          "Tamamlanma": cc.completedAt ? new Date(cc.completedAt).toLocaleString("tr-TR") : "",
        }));
        filename = mode === "selected" ? "sayim_raporlari_ozeti_secilenler" : "sayim_raporlari_ozeti";
      }

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rapor");
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel dosyası başarıyla indirildi.");
    } catch (e) {
      console.error(e);
      toast.error("Excel aktarımı sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Filter Form ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Report Type */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Rapor Türü
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
            >
              <option value="stock_status">Stok Durum Raporu</option>
              <option value="movements">Stok Hareket Raporu</option>
              <option value="transfers">Depolar Arası Transferler</option>
              <option value="critical">Kritik Stok Raporu</option>
              <option value="cycle_count">Sayım İşlemleri Raporu</option>
            </select>
          </div>

          {/* Warehouse */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Depo
            </label>
            <div className="relative">
              <WarehouseIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
              >
                <option value="">Tüm Depolar</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Başlangıç Tarihi
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
              Bitiş Tarihi
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex gap-2">
            <button
              onClick={handleRunReport}
              disabled={isPending}
              className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition cursor-pointer disabled:opacity-55"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileBarChart className="w-4 h-4" />
              )}
              Çalıştır
            </button>
          </div>
        </div>
      </div>

      {/* ── Report Container ── */}
      {reportData && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex items-center justify-between no-print bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-750 flex items-center gap-2">
              <Table className="w-4 h-4 text-orange-500" />
              Rapor Çıktısı
              {selectedRows.size > 0 && (
                <span className="text-orange-600 text-xs font-semibold ml-2 animate-in fade-in">
                  · {selectedRows.size} satır seçildi
                </span>
              )}
            </h3>

            <div className="flex items-center gap-2">
              {/* Excel Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsExcelDropdownOpen(!isExcelDropdownOpen);
                    setIsPdfDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 transition cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-600" /> Excel İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isExcelDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-40 animate-in fade-in slide-in-from-top-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleExportExcel("selected");
                        setIsExcelDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                      Seçilenleri Excel'e Aktar {selectedRows.size > 0 && `(${selectedRows.size})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportExcel("all");
                        setIsExcelDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Tümünü Excel'e Aktar
                    </button>
                  </div>
                )}
              </div>

              {/* PDF Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsPdfDropdownOpen(!isPdfDropdownOpen);
                    setIsExcelDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 transition cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-600" /> PDF İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isPdfDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-40 animate-in fade-in slide-in-from-top-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handlePrint("selected");
                        setIsPdfDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                      Seçilenleri PDF'e Aktar {selectedRows.size > 0 && `(${selectedRows.size})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handlePrint("all");
                        setIsPdfDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Tümünü PDF'e Aktar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Print Layout Header */}
          <div className="only-print bg-slate-900 text-white p-6 rounded-2xl mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Atak Arıcılık ERP Raporlama Servisi</h1>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                  {reportType === "stock_status"
                    ? "Stok Durum Raporu"
                    : reportType === "movements"
                    ? "Stok Hareketleri Raporu"
                    : reportType === "transfers"
                    ? "Depolar Arası Transferler Raporu"
                    : reportType === "critical"
                    ? "Kritik Stok Raporu"
                    : "Sayım Raporu"}
                </p>
              </div>
              <div className="text-right text-xs text-slate-350">
                <p>Tarih: {new Date().toLocaleDateString("tr-TR")}</p>
                <p>Saat: {new Date().toLocaleTimeString("tr-TR")}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Table based on reportType */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {reportType === "stock_status" && reportData.locations && (
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {/* Checkbox Header */}
                    <th className="px-4 py-3 text-left w-12 no-print">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-orange-650 focus:ring-orange-500/30 cursor-pointer"
                        checked={getReportItemIds().length > 0 && getReportItemIds().every(id => selectedRows.has(id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newSelected = new Set(selectedRows);
                          const ids = getReportItemIds();
                          if (checked) {
                            ids.forEach(id => newSelected.add(id));
                          } else {
                            ids.forEach(id => newSelected.delete(id));
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Ürün Adı</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Depo</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Fiziksel Stok</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Rezerve</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Birim Maliyet</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Toplam Değer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.locations.map((loc: any, idx: number) => (
                    <tr key={loc.id} className={`hover:bg-slate-50/50 ${selectedRows.has(loc.id) ? "bg-orange-50/30 hover:bg-orange-50/40" : ""}`}>
                      {/* Checkbox Cell */}
                      <td className="px-4 py-3 text-left w-12 no-print">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/30 cursor-pointer"
                          checked={selectedRows.has(loc.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newSelected = new Set(selectedRows);
                            if (checked) {
                              newSelected.add(loc.id);
                            } else {
                              newSelected.delete(loc.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{loc.product.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{loc.product.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{loc.product.category}</td>
                      <td className="px-4 py-3 text-slate-600">{loc.warehouse.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{loc.stock.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{loc.reserved.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(loc.product.cost)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(loc.product.cost * loc.stock)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "movements" && reportData.transactions && (
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {/* Checkbox Header */}
                    <th className="px-4 py-3 text-left w-12 no-print">
                      <input
                        type="checkbox"
                        className="rounded border-slate-350 text-orange-655 focus:ring-orange-500/30 cursor-pointer"
                        checked={getReportItemIds().length > 0 && getReportItemIds().every(id => selectedRows.has(id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newSelected = new Set(selectedRows);
                          const ids = getReportItemIds();
                          if (checked) {
                            ids.forEach(id => newSelected.add(id));
                          } else {
                            ids.forEach(id => newSelected.delete(id));
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Tarih</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Ürün Adı</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">İşlem Türü</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Miktar</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Depo</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.transactions.map((tx: any, idx: number) => (
                    <tr key={tx.id} className={`hover:bg-slate-50/50 ${selectedRows.has(tx.id) ? "bg-orange-50/30 hover:bg-orange-50/40" : ""}`}>
                      {/* Checkbox Cell */}
                      <td className="px-4 py-3 text-left w-12 no-print">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/30 cursor-pointer"
                          checked={selectedRows.has(tx.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newSelected = new Set(selectedRows);
                            if (checked) {
                              newSelected.add(tx.id);
                            } else {
                              newSelected.delete(tx.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(tx.date).toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{tx.product.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{tx.product.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{tx.type}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{tx.quantity.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3 text-slate-600">{tx.warehouse?.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{tx.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "transfers" && reportData.transfers && (
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {/* Checkbox Header */}
                    <th className="px-4 py-3 text-left w-12 no-print">
                      <input
                        type="checkbox"
                        className="rounded border-slate-350 text-orange-655 focus:ring-orange-500/30 cursor-pointer"
                        checked={getReportItemIds().length > 0 && getReportItemIds().every(id => selectedRows.has(id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newSelected = new Set(selectedRows);
                          const ids = getReportItemIds();
                          if (checked) {
                            ids.forEach(id => newSelected.add(id));
                          } else {
                            ids.forEach(id => newSelected.delete(id));
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Transfer No</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Ürün Adı</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Çıkış Depo</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Giriş Depo</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Miktar</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Durum</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.transfers.map((tr: any, idx: number) => (
                    <tr key={tr.id} className={`hover:bg-slate-50/50 ${selectedRows.has(tr.id) ? "bg-orange-50/30 hover:bg-orange-50/40" : ""}`}>
                      {/* Checkbox Cell */}
                      <td className="px-4 py-3 text-left w-12 no-print">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/30 cursor-pointer"
                          checked={selectedRows.has(tr.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newSelected = new Set(selectedRows);
                            if (checked) {
                              newSelected.add(tr.id);
                            } else {
                              newSelected.delete(tr.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{tr.transferNo}</td>
                      <td className="px-4 py-3 text-slate-800">{tr.product.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{tr.product.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{tr.fromWarehouse.name}</td>
                      <td className="px-4 py-3 text-slate-600">{tr.toWarehouse.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{tr.quantity.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-150 text-slate-700">
                          {tr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(tr.createdAt).toLocaleString("tr-TR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "critical" && (
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {/* Checkbox Header */}
                    <th className="px-4 py-3 text-left w-12 no-print">
                      <input
                        type="checkbox"
                        className="rounded border-slate-350 text-orange-655 focus:ring-orange-500/30 cursor-pointer"
                        checked={getReportItemIds().length > 0 && getReportItemIds().every(id => selectedRows.has(id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newSelected = new Set(selectedRows);
                          const ids = getReportItemIds();
                          if (checked) {
                            ids.forEach(id => newSelected.add(id));
                          } else {
                            ids.forEach(id => newSelected.delete(id));
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Ürün Adı</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Mevcut Stok</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase">Kritik Limit</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Out of Stock */}
                  {(reportData.outOfStock || []).map((p: any, idx: number) => (
                    <tr key={p.id} className={`bg-red-50/20 hover:bg-red-50/40 ${selectedRows.has(p.id) ? "bg-orange-50/30 hover:bg-orange-50/40" : ""}`}>
                      {/* Checkbox Cell */}
                      <td className="px-4 py-3 text-left w-12 no-print">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/30 cursor-pointer"
                          checked={selectedRows.has(p.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newSelected = new Set(selectedRows);
                            if (checked) {
                              newSelected.add(p.id);
                            } else {
                              newSelected.delete(p.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{p.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">0</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-500">{p.criticalLimit}</td>
                      <td className="px-4 py-3 text-red-700 font-bold uppercase tracking-wider text-[10px]">Stok Yok</td>
                    </tr>
                  ))}
                  {/* Under Limit */}
                  {(reportData.critical || []).map((p: any, idx: number) => (
                    <tr key={p.id} className={`bg-amber-50/20 hover:bg-amber-50/40 ${selectedRows.has(p.id) ? "bg-orange-50/30 hover:bg-orange-50/40" : ""}`}>
                      {/* Checkbox Cell */}
                      <td className="px-4 py-3 text-left w-12 no-print">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/30 cursor-pointer"
                          checked={selectedRows.has(p.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newSelected = new Set(selectedRows);
                            if (checked) {
                              newSelected.add(p.id);
                            } else {
                              newSelected.delete(p.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1 + (reportData.outOfStock || []).length}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{p.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">{p.stock}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-500">{p.criticalLimit}</td>
                      <td className="px-4 py-3 text-amber-655 font-bold uppercase tracking-wider text-[10px]">Eşik Altında</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "cycle_count" && reportData.cycleCounts && (
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {/* Checkbox Header */}
                    <th className="px-4 py-3 text-left w-12 no-print">
                      <input
                        type="checkbox"
                        className="rounded border-slate-350 text-orange-655 focus:ring-orange-500/30 cursor-pointer"
                        checked={getReportItemIds().length > 0 && getReportItemIds().every(id => selectedRows.has(id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newSelected = new Set(selectedRows);
                          const ids = getReportItemIds();
                          if (checked) {
                            ids.forEach(id => newSelected.add(id));
                          } else {
                            ids.forEach(id => newSelected.delete(id));
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Sayım Kodu</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Depo</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Tür</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Durum</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Sorumlu</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.cycleCounts.map((cc: any, idx: number) => (
                    <tr key={cc.id} className={`hover:bg-slate-50/50 ${selectedRows.has(cc.id) ? "bg-orange-50/30 hover:bg-orange-50/40" : ""}`}>
                      {/* Checkbox Cell */}
                      <td className="px-4 py-3 text-left w-12 no-print">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/30 cursor-pointer"
                          checked={selectedRows.has(cc.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newSelected = new Set(selectedRows);
                            if (checked) {
                              newSelected.add(cc.id);
                            } else {
                              newSelected.delete(cc.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{cc.code}</td>
                      <td className="px-4 py-3 text-slate-800">{cc.warehouse.name}</td>
                      <td className="px-4 py-3 text-slate-600">{cc.type}</td>
                      <td className="px-4 py-3">{cc.status}</td>
                      <td className="px-4 py-3 text-slate-600">{cc.createdBy || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(cc.createdAt).toLocaleString("tr-TR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

