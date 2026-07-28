"use client";

import React, { useState, useMemo } from "react";
import { Search, MapPin, Box, AlertTriangle, Layers } from "lucide-react";
import { Warehouse, StockLocation } from "../types";

interface WarehouseStockGridProps {
  warehouses: Warehouse[];
  stockLocations: StockLocation[];
}

export default function WarehouseStockGrid({ warehouses, stockLocations }: WarehouseStockGridProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    warehouses[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Get locations for the selected warehouse
  const filteredLocations = useMemo(() => {
    return stockLocations.filter(
      (loc) =>
        loc.warehouseId === selectedWarehouseId &&
        (loc.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [stockLocations, selectedWarehouseId, searchQuery]);

  // Compute stats for current warehouse
  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const totalStock = filteredLocations.reduce((sum, loc) => sum + loc.stock, 0);
  const lowStockItems = filteredLocations.filter(
    (loc) => loc.stock < (loc.product?.criticalLimit || 10)
  ).length;

  return (
    <div className="space-y-6">
      {/* Warehouse Select Tabs */}
      <div className="flex flex-wrap gap-2.5">
        {warehouses.map((wh) => {
          const isActive = selectedWarehouseId === wh.id;
          const whStock = stockLocations
            .filter((l) => l.warehouseId === wh.id)
            .reduce((sum, l) => sum + l.stock, 0);

          return (
            <button
              key={wh.id}
              onClick={() => {
                setSelectedWarehouseId(wh.id);
                setSearchQuery("");
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? "bg-orange-500 text-white border-[#f97316] shadow-md shadow-[#f97316]/10"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{wh.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {whStock.toLocaleString("tr-TR")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Warehouse Summary Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Depo içinde ürün veya SKU ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#f97316] outline-none transition-all shadow-inner"
          />
        </div>

        {/* Small stats */}
        <div className="md:col-span-6 flex justify-end gap-6 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider pr-1">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Kayıtlı Kalem: <strong className="text-slate-800 dark:text-slate-200">{filteredLocations.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Box className="w-4 h-4 text-slate-400" />
            <span>Toplam Stok: <strong className="text-slate-800 dark:text-slate-200">{totalStock.toLocaleString("tr-TR")}</strong></span>
          </div>
          {lowStockItems > 0 && (
            <div className="flex items-center gap-1.5 text-red-500 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>Kritik Limit Altı: <strong>{lowStockItems}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Stock Grid Table */}
      <div className="glass border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500 text-[10px] font-black tracking-widest uppercase border-b border-slate-200/60 dark:border-slate-800/60">
              <tr>
                <th className="px-6 py-5">Ürün Detayı</th>
                <th className="px-6 py-5">Kategori</th>
                <th className="px-6 py-5"><div className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Raf Konumu</div></th>
                <th className="px-6 py-5 text-right">Depo Stoku</th>
                <th className="px-6 py-5 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Depoda kayıtlı ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => {
                  const isLowStock = loc.stock < (loc.product?.criticalLimit || 10);
                  return (
                    <tr key={loc.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase truncate">
                            {loc.product?.name || "Bilinmeyen Ürün"}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            SKU: {loc.product?.sku}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100/80 dark:bg-slate-800/85 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200/40 dark:border-slate-700/40">
                          {loc.product?.category || "Genel"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {loc.rack || "Belirtilmemiş (A-1)"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-black ${isLowStock ? "text-red-500 font-black" : "text-slate-800 dark:text-slate-200"}`}>
                          {loc.stock.toLocaleString("tr-TR")} Adet
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          isLowStock
                            ? "bg-red-50 text-red-700 border-red-150 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                            : "bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900"
                        }`}>
                          {isLowStock ? "Kritik Stok" : "Stok Yeterli"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
