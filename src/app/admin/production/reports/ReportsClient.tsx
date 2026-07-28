"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/pdf-export";
import { 
  FileBarChart, 
  Download, 
  Activity, 
  Warehouse, 
  Trash2, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Play
} from "lucide-react";

interface ReportsClientProps {
  initialData: any;
}

export default function ReportsClient({ initialData }: ReportsClientProps) {
  const [orders, setOrders] = useState<any[]>(initialData.productionOrders || []);
  const [wasteLogs, setWasteLogs] = useState<any[]>(initialData.wasteLogs || []);
  const [workstations, setWorkstations] = useState<any[]>(initialData.workstations || []);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  
  // Active Filtered States (triggered by "Çalıştır" button)
  const [filteredOrders, setFilteredOrders] = useState<any[]>(orders);
  const [filteredWasteLogs, setFilteredWasteLogs] = useState<any[]>(wasteLogs);

  const handleRunReport = () => {
    let newOrders = [...orders];
    let newWaste = [...wasteLogs];

    if (startDate) {
      const start = new Date(startDate);
      newOrders = newOrders.filter(o => new Date(o.date) >= start);
      newWaste = newWaste.filter(w => new Date(w.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      newOrders = newOrders.filter(o => new Date(o.date) <= end);
      newWaste = newWaste.filter(w => new Date(w.date) <= end);
    }
    if (selectedProductId) {
      newOrders = newOrders.filter(o => o.productId === selectedProductId);
      newWaste = newWaste.filter(w => w.productId === selectedProductId);
    }

    setFilteredOrders(newOrders);
    setFilteredWasteLogs(newWaste);
    toast.success("Rapor verileri filtrelendi ve güncellendi.");
  };

  // Stats Calculations
  const completedOrders = filteredOrders.filter(o => o.status === "Tamamlandı");
  const totalCompletedQty = completedOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalWasteQty = filteredWasteLogs.reduce((sum, w) => sum + w.quantity, 0);
  const totalOrdersCount = filteredOrders.length;
  
  // Waste ratio = total waste / (total completed + total waste) * 100
  const totalProductsVolume = totalCompletedQty + totalWasteQty;
  const wasteRatio = totalProductsVolume > 0 ? ((totalWasteQty / totalProductsVolume) * 100).toFixed(1) : "0.0";

  // Production breakdown by product
  const productSummaryMap: Record<string, { name: string; sku: string; qty: number }> = {};
  completedOrders.forEach(o => {
    const key = o.productVariantId ? `${o.productId}-${o.productVariantId}` : o.productId;
    const name = o.variant 
      ? `${o.product?.name} (${Object.values(o.variant.attributes as Record<string, string>).join(", ")})` 
      : o.product?.name;
    const sku = o.variant?.sku || o.product?.sku || "-";
    if (!productSummaryMap[key]) {
      productSummaryMap[key] = { name, sku, qty: 0 };
    }
    productSummaryMap[key].qty += o.quantity;
  });
  const productSummaries = Object.values(productSummaryMap);

  // PDF Exporters
  const exportProductionSummaryPDF = () => {
    const headers = ["#", "Urun Adi (Mamul)", "SKU", "Toplam Uretim (Adet)"];
    const rows = productSummaries.map((p, idx) => [
      String(idx + 1),
      p.name,
      p.sku,
      `${p.qty} Adet`
    ]);

    exportToPDF({
      title: "URETIM OZET RAPORU",
      subtitle: `Tarih araligi: ${startDate || "Tumu"} - ${endDate || "Tumu"}`,
      filename: "uretim_ozet_raporu",
      headers,
      rows,
      filters: [
        { label: "Baslangic", value: startDate },
        { label: "Bitis", value: endDate }
      ]
    });
  };

  const exportWastePDF = () => {
    const headers = ["#", "Malzeme", "Depo", "Fire Miktari", "Neden", "Tarih"];
    const rows = filteredWasteLogs.map((w, idx) => [
      String(idx + 1),
      w.product?.name + (w.variant ? ` (${Object.values(w.variant.attributes as Record<string, string>).join(", ")})` : ""),
      w.warehouse?.name || "-",
      `${w.quantity} Adet`,
      w.reason,
      new Date(w.date).toLocaleDateString("tr-TR")
    ]);

    exportToPDF({
      title: "URETIM FIRE VE ISKARTA RAPORU",
      subtitle: `Toplam Zayiat: ${totalWasteQty} Adet | Fire Orani: %${wasteRatio}`,
      filename: "uretim_fire_raporu",
      headers,
      rows,
      filters: [
        { label: "Baslangic", value: startDate },
        { label: "Bitis", value: endDate }
      ]
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <FileBarChart className="w-8 h-8 text-orange-500" />
            ÜRETİM VE MRP RAPORLARI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            İmalat çıktısı, fire oranları ve makine kapasite analiz raporlarını inceleyin ve PDF olarak dışa aktarın.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Başlangıç Tarihi</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white outline-none text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bitiş Tarihi</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white outline-none text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Ürün / Mamul</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white outline-none text-slate-800"
          >
            <option value="">-- Tüm Ürünler --</option>
            {initialData.finishedGoods.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRunReport}
          className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <Play className="w-3.5 h-3.5" />
          Raporu Çalıştır
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-colors">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalCompletedQty}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toplam İmalat (Adet)</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-colors">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalWasteQty}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toplam Fire (Adet)</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-colors">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">%{wasteRatio}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fire / Iskarta Oranı</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-colors">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalOrdersCount}</h3>
            <p className="text-xs text-slate-500 mt-0.5">İş Emri Hacmi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Summary Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-700">Üretim İstatistik Özetleri</h2>
            <button
              onClick={exportProductionSummaryPDF}
              className="p-1.5 bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-lg border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Raporu
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3 pl-4">Sıra No</th>
                  <th className="p-3">Ürün Adi</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right pr-4">Toplam Çıktı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {productSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      Belirtilen filtrelerde tamamlanmış üretim kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  productSummaries.map((p, index) => (
                    <tr key={p.sku} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 pl-4 font-bold text-xs">{index + 1}</td>
                      <td className="p-3 font-semibold">{p.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-[10px]">{p.sku}</td>
                      <td className="p-3 text-right pr-4 font-bold text-slate-900">{p.qty} Adet</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waste / Defective Log Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-700">Zayiat & Iskarta Detayları</h2>
            <button
              onClick={exportWastePDF}
              className="p-1.5 bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-lg border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Raporu
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3 pl-4">Sıra No</th>
                  <th className="p-3">Malzeme</th>
                  <th className="p-3">Neden</th>
                  <th className="p-3 text-right pr-4">Miktar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {filteredWasteLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      Zayiat veya fire kaydı bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  filteredWasteLogs.map((w, index) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 pl-4 font-bold text-xs">{index + 1}</td>
                      <td className="p-3 font-semibold">
                        {w.product?.name}
                        {w.variant && ` (${Object.values(w.variant.attributes as Record<string, string>).join(", ")})`}
                      </td>
                      <td className="p-3 text-red-700 font-medium">{w.reason}</td>
                      <td className="p-3 text-right pr-4 font-bold text-slate-900">{w.quantity} Adet</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workstations Load Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700">Makine & İş İstasyonu Kapasite Durumları</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3 pl-4">Sıra No</th>
                  <th className="p-3">İstasyon Kodu</th>
                  <th className="p-3">İstasyon Adı</th>
                  <th className="p-3">Kapasite</th>
                  <th className="p-3 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {workstations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Sistemde tanımlı iş istasyonu bulunamadı.
                    </td>
                  </tr>
                ) : (
                  workstations.map((ws, index) => (
                    <tr key={ws.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 pl-4 font-bold text-xs">{index + 1}</td>
                      <td className="p-3 font-bold text-orange-600">{ws.code}</td>
                      <td className="p-3 font-semibold">{ws.name}</td>
                      <td className="p-3 font-semibold text-slate-900">{ws.capacity} {ws.unit}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-[9px]">
                          AKTİF / KULLANILABİLİR
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

