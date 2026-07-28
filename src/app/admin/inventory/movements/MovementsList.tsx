"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Home,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCcw,
  Search,
  Filter,
  PackageSearch,
  Clock,
  Warehouse,
  User,
  Tag,
  Hash,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ShieldCheck,
  ChevronDown,
  FileDown,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { exportToPDF } from "@/lib/pdf-export";

// ─── Badge Helpers ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  IN: {
    label: "Giriş",
    color:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
    icon: <ArrowDownCircle className="w-3 h-3" />,
  },
  TRANSFER_IN: {
    label: "Transfer Giriş",
    color:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
    icon: <ArrowDownCircle className="w-3 h-3" />,
  },
  CYCLE_SURPLUS: {
    label: "Sayım Fazlası",
    color:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
    icon: <ArrowDownCircle className="w-3 h-3" />,
  },
  OUT: {
    label: "Çıkış",
    color:
      "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-100",
    icon: <ArrowUpCircle className="w-3 h-3" />,
  },
  TRANSFER_OUT: {
    label: "Transfer Çıkış",
    color:
      "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-100",
    icon: <ArrowUpCircle className="w-3 h-3" />,
  },
  CYCLE_DEFICIT: {
    label: "Sayım Eksiği",
    color:
      "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-100",
    icon: <ArrowUpCircle className="w-3 h-3" />,
  },
  SALE: {
    label: "Satış",
    color:
      "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-100",
    icon: <ArrowUpCircle className="w-3 h-3" />,
  },
  RETURN: {
    label: "İade",
    color:
      "bg-cyan-50 text-cyan-700 border border-cyan-200 ring-1 ring-cyan-100",
    icon: <RefreshCcw className="w-3 h-3" />,
  },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  MANUAL: {
    label: "Manuel",
    color: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  MARKETPLACE: {
    label: "Marketplace",
    color: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  TRANSFER: {
    label: "Transfer",
    color: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  CYCLE_COUNT: {
    label: "Sayım",
    color: "bg-blue-50 text-blue-700 border border-blue-200",
  },
};

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? {
    label: type,
    color: "bg-slate-100 text-slate-600 border border-slate-200",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return <span className="text-slate-400 text-xs">—</span>;
  const cfg = SOURCE_CONFIG[source] ?? {
    label: source,
    color: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function QuantityCell({ type, quantity }: { type: string; quantity: number }) {
  const isIn = ["IN", "TRANSFER_IN", "CYCLE_SURPLUS", "RETURN"].includes(type);
  return (
    <span
      className={`font-mono font-bold text-sm ${
        isIn ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isIn ? "+" : "-"}
      {Math.abs(quantity).toLocaleString("tr-TR")}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MovementsListProps {
  transactions: any[];
  total: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  warehouses: any[];
  searchParams: any;
}

export default function MovementsList({
  transactions,
  total,
  pageSize,
  currentPage,
  totalPages,
  warehouses,
  searchParams,
}: MovementsListProps) {
  const router = useRouter();
  const nextSearchParams = useSearchParams();

  // Selection states
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Dropdown states
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

  // Loading states for full exports
  const [isExportingAllExcel, setIsExportingAllExcel] = useState(false);
  const [isExportingAllPdf, setIsExportingAllPdf] = useState(false);

  const startIndex = (currentPage - 1) * pageSize;

  // Build pagination URL helper
  const buildHref = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
    }
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    return `?${params.toString()}`;
  };

  // Handle filter submission
  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    formData.forEach((value, key) => {
      if (value) params.set(key, String(value));
    });
    // Reset selection and page when filter changes
    setSelectedRows(new Set());
    router.push(`?${params.toString()}`);
  };

  // Helper function to map database fields to export format
  const formatExportRow = (tx: any, idx: number) => {
    const { date, time } = formatDate(tx.date);
    const dateStr = `${date} ${time}`;

    let typeLabel = tx.type;
    if (tx.type === "IN") typeLabel = "Giriş";
    else if (tx.type === "TRANSFER_IN") typeLabel = "Transfer Giriş";
    else if (tx.type === "CYCLE_SURPLUS") typeLabel = "Sayım Fazlası";
    else if (tx.type === "OUT") typeLabel = "Çıkış";
    else if (tx.type === "TRANSFER_OUT") typeLabel = "Transfer Çıkış";
    else if (tx.type === "CYCLE_DEFICIT") typeLabel = "Sayım Eksiği";
    else if (tx.type === "SALE") typeLabel = "Satış";
    else if (tx.type === "RETURN") typeLabel = "İade";

    let sourceLabel = tx.moduleSource || "";
    if (tx.moduleSource === "MANUAL") sourceLabel = "Manuel";
    else if (tx.moduleSource === "MARKETPLACE") sourceLabel = "Marketplace";
    else if (tx.moduleSource === "TRANSFER") sourceLabel = "Transfer";
    else if (tx.moduleSource === "CYCLE_COUNT") sourceLabel = "Sayım";

    return {
      "#": idx + 1,
      "Tarih/Saat": dateStr,
      "Ürün Adı": tx.product?.name || "",
      "SKU": tx.product?.sku || "",
      "İşlem Türü": typeLabel,
      "Miktar": tx.quantity || 0,
      "Depo": tx.warehouse?.name || "",
      "Depo Kodu": tx.warehouse?.code || "",
      "Kaynak Modül": sourceLabel,
      "Açıklama": tx.description || "",
      "Kullanıcı": tx.userEmail || "Sistem",
    };
  };

  // Export Excel Handler
  const handleExportExcel = async (mode: "selected" | "all") => {
    if (mode === "selected") {
      const targetTxs = transactions.filter((tx) => selectedRows.has(tx.id));
      if (targetTxs.length === 0) {
        toast.error("Aktarılacak stok hareketi bulunamadı. Lütfen önce hareket seçtiğinizden emin olun.");
        return;
      }

      try {
        const exportRows = targetTxs.map((tx, idx) => {
          const rowData = formatExportRow(tx, idx);
          // Delete row count index indicator for excel rows, keep standard columns
          const { "#": _, ...cleanRow } = rowData;
          return cleanRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportRows);
        const max_widths = Object.keys(exportRows[0] || {}).map((key) => {
          let max_len = key.length;
          exportRows.forEach((row: any) => {
            const val = row[key];
            const len = val ? String(val).length : 0;
            if (len > max_len) max_len = len;
          });
          return { wch: max_len + 3 };
        });
        ws["!cols"] = max_widths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Stok Hareketleri");
        XLSX.writeFile(wb, `stok_hareketleri_secilenler_${new Date().toISOString().split("T")[0]}.xlsx`);
        toast.success("Seçilen stok hareketleri Excel dosyası olarak indirildi.");
      } catch (error) {
        console.error("Excel export error:", error);
        toast.error("Excel aktarımı sırasında bir hata oluştu.");
      }
    } else {
      if (isExportingAllExcel) return;
      setIsExportingAllExcel(true);
      const toastId = toast.loading("Excel raporu hazırlanıyor, lütfen bekleyin...");

      try {
        const queryStr = nextSearchParams ? nextSearchParams.toString() : "";
        const response = await fetch(`/api/inventory/movements/export?${queryStr}`);

        if (!response.ok) {
          throw new Error("Veri çekilemedi.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stok_hareketleri_tumu_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Tüm stok hareketleri Excel dosyası olarak indirildi.", { id: toastId });
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Excel aktarımı sırasında bir hata oluştu.", { id: toastId });
      } finally {
        setIsExportingAllExcel(false);
      }
    }
  };

  // Export PDF Handler
  const handleExportPdf = async (mode: "selected" | "all") => {
    const headers = [
      "#",
      "Tarih/Saat",
      "Urun Adi",
      "SKU",
      "Islem Turu",
      "Miktar",
      "Depo",
      "Kaynak Modul",
      "Aciklama",
      "Kullanici",
    ];

    if (mode === "selected") {
      const targetTxs = transactions.filter((tx) => selectedRows.has(tx.id));
      if (targetTxs.length === 0) {
        toast.error("Aktarılacak stok hareketi bulunamadı. Lütfen önce hareket seçtiğinizden emin olun.");
        return;
      }

      try {
        const rows = targetTxs.map((tx, idx) => {
          const rowData = formatExportRow(tx, idx);
          return [
            String(idx + 1),
            rowData["Tarih/Saat"],
            rowData["Ürün Adı"],
            rowData["SKU"],
            rowData["İşlem Türü"],
            String(rowData["Miktar"]),
            rowData["Depo"] ? `${rowData["Depo"]} (${rowData["Depo Kodu"]})` : "—",
            rowData["Kaynak Modül"],
            rowData["Açıklama"],
            rowData["Kullanıcı"],
          ];
        });

        exportToPDF({
          title: "Stok Hareketleri Audit Log Raporu (Secilenler)",
          subtitle: `Toplam Secilen: ${targetTxs.length} kayit`,
          filename: "stok_hareketleri_secilenler",
          headers,
          rows,
        });

        toast.success("Seçilen stok hareketleri PDF dosyası olarak indirildi.");
      } catch (error) {
        console.error("PDF export error:", error);
        toast.error("PDF aktarımı sırasında bir hata oluştu.");
      }
    } else {
      if (isExportingAllPdf) return;
      setIsExportingAllPdf(true);
      const toastId = toast.loading("PDF raporu hazırlanıyor, lütfen bekleyin...");

      try {
        const queryStr = nextSearchParams ? nextSearchParams.toString() : "";
        const response = await fetch(`/api/inventory/movements/export?format=json&${queryStr}`);

        if (!response.ok) {
          throw new Error("Veri çekilemedi.");
        }

        const resData = await response.json();
        const txs = resData.transactions || [];

        if (txs.length === 0) {
          toast.error("Aktarılacak veri bulunamadı.", { id: toastId });
          return;
        }

        const rows = txs.map((tx: any, idx: number) => {
          const rowData = formatExportRow(tx, idx);
          return [
            String(idx + 1),
            rowData["Tarih/Saat"],
            rowData["Ürün Adı"],
            rowData["SKU"],
            rowData["İşlem Türü"],
            String(rowData["Miktar"]),
            rowData["Depo"] ? `${rowData["Depo"]} (${rowData["Depo Kodu"]})` : "—",
            rowData["Kaynak Modül"],
            rowData["Açıklama"],
            rowData["Kullanıcı"],
          ];
        });

        exportToPDF({
          title: "Stok Hareketleri Audit Log Raporu",
          subtitle: "Atak Aricilik ERP Envanter Takip Sistemi",
          filename: "stok_hareketleri_tumu",
          headers,
          rows,
        });

        toast.success("Tüm stok hareketleri PDF dosyası olarak indirildi.", { id: toastId });
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "PDF aktarımı sırasında bir hata oluştu.", { id: toastId });
      } finally {
        setIsExportingAllPdf(false);
      }
    }
  };

  const typeOptions = [
    { value: "IN", label: "Giriş" },
    { value: "OUT", label: "Çıkış" },
    { value: "TRANSFER_IN", label: "Transfer Giriş" },
    { value: "TRANSFER_OUT", label: "Transfer Çıkış" },
    { value: "RETURN", label: "İade" },
    { value: "SALE", label: "Satış" },
    { value: "CYCLE_SURPLUS", label: "Sayım Fazlası" },
    { value: "CYCLE_DEFICIT", label: "Sayım Eksiği" },
  ];

  const sourceOptions = [
    { value: "MANUAL", label: "Manuel" },
    { value: "MARKETPLACE", label: "Marketplace" },
    { value: "TRANSFER", label: "Transfer" },
    { value: "CYCLE_COUNT", label: "Sayım" },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Stok Hareketleri &amp; Audit Log
              </h1>
              <p className="text-sm text-slate-500">
                Değiştirilemez kurumsal denetim izi
              </p>
            </div>
          </div>
        </div>

        {/* Dropdown Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Excel Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsExcelDropdownOpen(!isExcelDropdownOpen);
                setIsPdfDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-sm"
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
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

          {/* PDF Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsPdfDropdownOpen(!isPdfDropdownOpen);
                setIsExcelDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" /> PDF İndir <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {isPdfDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-40 animate-in fade-in slide-in-from-top-1.5">
                <button
                  type="button"
                  onClick={() => {
                    handleExportPdf("selected");
                    setIsPdfDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  Seçilenleri PDF'e Aktar {selectedRows.size > 0 && `(${selectedRows.size})`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportPdf("all");
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

      {/* ── Immutability Notice ── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 no-print">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-amber-800">
            Değiştirilemez Kayıtlar:{" "}
          </span>
          <span className="text-amber-700">
            Bu kayıtlar değiştirilemez ve silinemez. Tüm stok hareketleri
            kurumsal denetim amacıyla kalıcı olarak saklanmaktadır.
          </span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <form onSubmit={handleFilterSubmit} className="bg-white border border-slate-200 rounded-xl p-4 no-print">
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Search className="w-3 h-3 inline mr-1" />
              Ürün / SKU Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                name="search"
                defaultValue={searchParams.search ?? ""}
                placeholder="Ürün adı veya SKU..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 bg-slate-50 placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* Warehouse */}
          <div className="min-w-[170px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Warehouse className="w-3 h-3 inline mr-1" />
              Depo
            </label>
            <div className="relative">
              <select
                name="warehouseId"
                defaultValue={searchParams.warehouseId ?? ""}
                className="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 bg-slate-50 text-slate-800 appearance-none cursor-pointer"
              >
                <option value="">Tüm Depolar</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Type */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Tag className="w-3 h-3 inline mr-1" />
              Hareket Türü
            </label>
            <div className="relative">
              <select
                name="type"
                defaultValue={searchParams.type ?? ""}
                className="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 bg-slate-50 text-slate-800 appearance-none cursor-pointer"
              >
                <option value="">Tüm Türler</option>
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Module Source */}
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Filter className="w-3 h-3 inline mr-1" />
              Kaynak
            </label>
            <div className="relative">
              <select
                name="moduleSource"
                defaultValue={searchParams.moduleSource ?? ""}
                className="w-full pl-3 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 bg-slate-50 text-slate-800 appearance-none cursor-pointer"
              >
                <option value="">Tüm Kaynaklar</option>
                {sourceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Date From */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              <Clock className="w-3 h-3 inline mr-1" />
              Başlangıç
            </label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={searchParams.dateFrom ?? ""}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 bg-slate-50 text-slate-800"
            />
          </div>

          {/* Date To */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Bitiş
            </label>
            <input
              type="date"
              name="dateTo"
              defaultValue={searchParams.dateTo ?? ""}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 bg-slate-50 text-slate-800"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Filtrele
            </button>
            <Link
              href="?"
              onClick={() => setSelectedRows(new Set())}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              Temizle
            </Link>
          </div>
        </div>
      </form>

      {/* Print Layout Header */}
      <div className="only-print bg-slate-900 text-white p-6 rounded-2xl mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Atak Arıcılık ERP Raporlama Servisi</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Stok Hareketleri Audit Log Raporu</p>
          </div>
          <div className="text-right text-xs text-slate-350">
            <p>Tarih: {new Date().toLocaleDateString("tr-TR")}</p>
            <p>Saat: {new Date().toLocaleTimeString("tr-TR")}</p>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Table Header Stats */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <PackageSearch className="w-4 h-4 text-slate-400" />
            <span>
              Toplam{" "}
              <span className="font-semibold text-slate-800">
                {total.toLocaleString("tr-TR")}
              </span>{" "}
              kayıt
            </span>
            {total > 0 && (
              <span className="text-slate-400 text-xs">
                · Sayfa {currentPage}/{totalPages}
              </span>
            )}
            {selectedRows.size > 0 && (
              <span className="text-orange-600 text-xs font-semibold ml-2">
                · {selectedRows.size} satır seçildi
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
            Değiştirilemez kayıtlar
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {/* Select All Checkbox Column */}
                <th className="text-left px-4 py-3 w-12 no-print">
                  <input
                    type="checkbox"
                    className="rounded border-slate-350 text-orange-600 focus:ring-orange-500/30 cursor-pointer"
                    checked={transactions.length > 0 && transactions.every((tx) => selectedRows.has(tx.id))}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newSelected = new Set(selectedRows);
                      if (checked) {
                        transactions.forEach((tx) => newSelected.add(tx.id));
                      } else {
                        transactions.forEach((tx) => newSelected.delete(tx.id));
                      }
                      setSelectedRows(newSelected);
                    }}
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Tarih / Saat
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <PackageSearch className="w-3 h-3" />
                    Ürün
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    SKU
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Tür
                  </div>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Miktar
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Warehouse className="w-3 h-3" />
                    Depo
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Kaynak
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Kullanıcı
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <PackageSearch className="w-10 h-10 text-slate-200" />
                      <p className="font-medium text-slate-500">
                        Kayıt bulunamadı
                      </p>
                      <p className="text-xs text-slate-400">
                        Filtreleri değiştirerek tekrar deneyin
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any, idx: number) => {
                  const { date, time } = formatDate(tx.date);
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      } ${selectedRows.has(tx.id) ? "bg-orange-50/30 hover:bg-orange-50/40" : ""}`}
                    >
                      {/* Row Checkbox */}
                      <td className="px-4 py-3 whitespace-nowrap text-left no-print">
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

                      {/* Sequence Number */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-semibold">
                        {startIndex + idx + 1}
                      </td>

                      {/* Date/Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">
                            {date}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {time}
                          </span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <span
                          className="text-slate-800 font-medium text-xs truncate block"
                          title={tx.product.name}
                        >
                          {tx.product.name}
                        </span>
                        {tx.description && (
                          <span
                            className="text-slate-400 text-xs truncate block"
                            title={tx.description}
                          >
                            {tx.description}
                          </span>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {tx.product.sku}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <TypeBadge type={tx.type} />
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <QuantityCell
                          type={tx.type}
                          quantity={tx.quantity}
                        />
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {tx.warehouse ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-700">
                              {tx.warehouse.name}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {tx.warehouse.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Module Source */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SourceBadge source={tx.moduleSource} />
                      </td>

                      {/* User Email */}
                      <td className="px-4 py-3 max-w-[180px]">
                        {tx.userEmail ? (
                          <span
                            className="text-xs text-slate-500 truncate block"
                            title={tx.userEmail}
                          >
                            {tx.userEmail}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Sistem
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between no-print">
            <p className="text-xs text-slate-500">
              {((currentPage - 1) * pageSize + 1).toLocaleString("tr-TR")} –{" "}
              {Math.min(currentPage * pageSize, total).toLocaleString(
                "tr-TR"
              )}{" "}
              arası gösteriliyor,{" "}
              <span className="font-semibold">
                {total.toLocaleString("tr-TR")}
              </span>{" "}
              kayıttan
            </p>
            <div className="flex items-center gap-1">
              {/* Prev */}
              {currentPage > 1 ? (
                <Link
                  href={buildHref({
                    page: String(currentPage - 1),
                  })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Önceki
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white border border-slate-100 rounded-lg cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Önceki
                </span>
              )}

              {/* Page numbers */}
              <div className="flex items-center gap-0.5 mx-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <Link
                      key={page}
                      href={buildHref({ page: String(page) })}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                        page === currentPage
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </Link>
                  );
                })}
              </div>

              {/* Next */}
              {currentPage < totalPages ? (
                <Link
                  href={buildHref({
                    page: String(currentPage + 1),
                  })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Sonraki
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white border border-slate-100 rounded-lg cursor-not-allowed">
                  Sonraki
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

