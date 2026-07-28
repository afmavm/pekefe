"use client";

import React, { useState, useMemo } from "react";
import { Edit2, Save, X, Layers, MapPin, Box, Search, Check, AlertCircle, Loader2 } from "lucide-react";
import { Warehouse, StockLocation } from "../types";
import { toast } from "sonner";

interface ShelfTrackerProps {
  warehouses: Warehouse[];
  stockLocations: StockLocation[];
  onUpdateShelf: (productId: string, warehouseId: string, rack: string) => Promise<boolean>;
  isReadOnly?: boolean;
}

export default function ShelfTracker({
  warehouses,
  stockLocations,
  onUpdateShelf,
  isReadOnly = false
}: ShelfTrackerProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    warehouses[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null); // stockLocation.id
  const [editRackValue, setEditRackValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Filter stock locations for selected warehouse
  const filteredLocations = useMemo(() => {
    return stockLocations.filter(
      (loc) =>
        loc.warehouseId === selectedWarehouseId &&
        (loc.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [stockLocations, selectedWarehouseId, searchQuery]);

  // Group locations by Rack Rows (e.g. A, B, C etc.)
  const groupedRacks = useMemo(() => {
    const groups: Record<string, StockLocation[]> = {};
    filteredLocations.forEach((loc) => {
      // Extract prefix like 'A' from 'A-1' or default to 'TANIMSIZ'
      const rackCode = loc.rack || "A-1";
      const rowPrefix = rackCode.split("-")[0]?.toUpperCase().trim() || "DİĞER";
      
      if (!groups[rowPrefix]) {
        groups[rowPrefix] = [];
      }
      groups[rowPrefix].push(loc);
    });

    // Sort groups alphabetically
    return Object.keys(groups)
      .sort()
      .reduce((obj, key) => {
        obj[key] = groups[key] || [];
        return obj;
      }, {} as Record<string, StockLocation[]>);
  }, [filteredLocations]);

  const handleStartEdit = (loc: StockLocation) => {
    setEditingId(loc.id);
    setEditRackValue(loc.rack || "A-1");
  };

  const handleSave = async (loc: StockLocation) => {
    if (!editRackValue.trim()) {
      toast.error("Raf kodu boş olamaz.");
      return;
    }

    setSavingId(loc.id);
    try {
      const success = await onUpdateShelf(loc.productId, loc.warehouseId, editRackValue);
      if (success) {
        toast.success("Raf konumu başarıyla güncellendi.");
        setEditingId(null);
      }
    } catch (err) {
      toast.error("Kaydetme sırasında hata oluştu.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warehouse Pick Bar */}
      <div className="flex flex-wrap gap-2.5">
        {warehouses.map((wh) => (
          <button
            key={wh.id}
            onClick={() => {
              setSelectedWarehouseId(wh.id);
              setSearchQuery("");
              setEditingId(null);
            }}
            className={`px-5 py-3 rounded-2xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 border cursor-pointer ${
              selectedWarehouseId === wh.id
                ? "bg-orange-500 text-white border-[#f97316] shadow-md shadow-[#f97316]/10"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{wh.name}</span>
          </button>
        ))}
      </div>

      {/* Visual Search Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Raf yerleşimi içinde ürün veya SKU ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#f97316] outline-none transition-all shadow-inner"
        />
      </div>

      {/* Visual Racks Sections */}
      {Object.keys(groupedRacks).length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider glass border border-slate-200/50 rounded-2xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-400" />
          Kayıtlı raf yerleşimi bulunamadı.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRacks).map(([rowKey, locations]) => (
            <div
              key={rowKey}
              className="glass border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-5 space-y-4"
            >
              {/* Row Header */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#f97316] flex items-center justify-center font-black text-sm">
                  {rowKey}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    {rowKey} Bölümü / Koridoru
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Bu bölümde toplam {locations.length} adet kayıtlı raf yeri mevcut
                  </p>
                </div>
              </div>

              {/* Racks Grid inside current row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {locations.map((loc) => {
                  const isEditing = editingId === loc.id;
                  const isSaving = savingId === loc.id;

                  return (
                    <div
                      key={loc.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                        isEditing
                          ? "border-[#f97316] bg-orange-500/5 dark:bg-orange-500/10 shadow-sm"
                          : "border-slate-150/80 bg-white/40 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div>
                        {/* Shelf Tag */}
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-1 bg-orange-50 dark:bg-amber-950/20 text-[#f97316] rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-100 dark:border-amber-900/50 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {isEditing ? "DÜZENLENİYOR" : (loc.rack || "A-1")}
                          </span>
                          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">
                            {loc.stock.toLocaleString("tr-TR")} Adet
                          </span>
                        </div>

                        {/* Product Title */}
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase truncate mt-3">
                          {loc.product?.name || "Bilinmeyen Ürün"}
                        </h5>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          SKU: {loc.product?.sku}
                        </p>
                      </div>

                      {/* Edit controls */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-850/50 flex items-center justify-between">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={editRackValue}
                              onChange={(e) => setEditRackValue(e.target.value)}
                              className="px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold focus:border-[#f97316] outline-none flex-1"
                            />
                            <button
                              onClick={() => handleSave(loc)}
                              disabled={isSaving}
                              className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-[#92400e] transition-colors cursor-pointer"
                              title="Kaydet"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={isSaving}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                              title="İptal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-[10px] text-slate-400 font-semibold">Raf Konumu</span>
                            {!isReadOnly && (
                              <button
                                onClick={() => handleStartEdit(loc)}
                                className="text-[#f97316] hover:text-[#92400e] transition-colors p-1 hover:bg-orange-50 dark:hover:bg-amber-950/20 rounded-md inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" /> Konumu Değiştir
                              </button>
                            )}
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
