"use client";

import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { exportToPDF } from "@/lib/pdf-export";

interface MovementsExportProps {
  transactions?: any[];
}

export default function MovementsExport({ transactions }: MovementsExportProps) {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const handlePrint = async () => {
    if (isPdfExporting) return;
    setIsPdfExporting(true);
    const toastId = toast.loading("PDF raporu hazırlanıyor, lütfen bekleyin...");

    try {
      const queryStr = searchParams ? searchParams.toString() : "";
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

      const headers = ["#", "Tarih/Saat", "Ürün Adı", "SKU", "İşlem Türü", "Miktar", "Depo", "Kaynak Modül", "Açıklama", "Kullanıcı"];
      const rows = txs.map((tx: any, idx: number) => {
        const d = new Date(tx.date);
        const dateStr = `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR")}`;
        
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

        return [
          String(idx + 1),
          dateStr,
          tx.product?.name || "",
          tx.product?.sku || "",
          typeLabel,
          String(tx.quantity || 0),
          tx.warehouse ? `${tx.warehouse.name} (${tx.warehouse.code})` : "—",
          sourceLabel,
          tx.description || "",
          tx.userEmail || "Sistem",
        ];
      });

      exportToPDF({
        title: "Stok Hareketleri Audit Log Raporu",
        subtitle: "Pekefe ERP Envanter Takip Sistemi",
        filename: "stok_hareketleri_raporu",
        headers,
        rows,
      });

      toast.success("PDF Raporu başarıyla indirildi.", { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "PDF aktarımı sırasında bir hata oluştu.", { id: toastId });
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading("Excel raporu hazırlanıyor, lütfen bekleyin...");

    try {
      const queryStr = searchParams ? searchParams.toString() : "";
      const response = await fetch(`/api/inventory/movements/export?${queryStr}`);
      
      if (!response.ok) {
        let errMsg = "Excel dosyası oluşturulurken bir hata oluştu.";
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stok_hareketleri_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel dosyası başarıyla indirildi.", { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Excel aktarımı sırasında bir hata oluştu.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrint}
        disabled={isPdfExporting}
        className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:bg-slate-50 disabled:cursor-not-allowed font-semibold text-sm rounded-lg transition-colors cursor-pointer"
        title="PDF Raporu İndir"
      >
        <Printer className="w-4 h-4 text-slate-500" />
        {isPdfExporting ? "Hazırlanıyor..." : "Yazdır / PDF Raporu"}
      </button>
      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white border border-emerald-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        title="Excel tablosu indir"
      >
        <Download className="w-4 h-4" />
        {isExporting ? "Aktarılıyor..." : "Excel'e Aktar"}
      </button>
    </div>
  );
}

