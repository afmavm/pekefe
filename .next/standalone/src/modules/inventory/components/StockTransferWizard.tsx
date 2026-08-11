"use client";

import React, { useState, useMemo } from "react";
import { X, Search, MapPin, ArrowRight, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Product, Warehouse, StockLocation } from "../types";
import { toast } from "sonner";

interface StockTransferWizardProps {
  products: Product[];
  warehouses: Warehouse[];
  stockLocations: StockLocation[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitTransfer: (
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    notes?: string | null
  ) => Promise<boolean>;
}

export default function StockTransferWizard({
  products,
  warehouses,
  stockLocations,
  isOpen,
  onClose,
  onSubmitTransfer
}: StockTransferWizardProps) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter products by search
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Available warehouses for source (only warehouses where product has stock)
  const sourceWarehouses = useMemo(() => {
    if (!selectedProductId) return [];
    return warehouses.map((wh) => {
      const loc = stockLocations.find(
        (l) => l.productId === selectedProductId && l.warehouseId === wh.id
      );
      const stock = loc ? loc.stock : 0;
      return { ...wh, stock };
    });
  }, [selectedProductId, warehouses, stockLocations]);

  // Destination warehouses (excluding the selected source)
  const destinationWarehouses = useMemo(() => {
    return warehouses.filter((wh) => wh.id !== fromWarehouseId);
  }, [fromWarehouseId, warehouses]);

  // Current stock at selected source
  const selectedSourceStock = useMemo(() => {
    if (!selectedProductId || !fromWarehouseId) return 0;
    const loc = stockLocations.find(
      (l) => l.productId === selectedProductId && l.warehouseId === fromWarehouseId
    );
    return loc ? loc.stock : 0;
  }, [selectedProductId, fromWarehouseId, stockLocations]);

  // Reset form
  const handleReset = () => {
    setStep(1);
    setSearchQuery("");
    setSelectedProductId("");
    setFromWarehouseId("");
    setToWarehouseId("");
    setQuantity(1);
    setNotes("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedProductId) {
      toast.error("Lütfen transfer edilecek ürünü seçin.");
      return;
    }
    if (step === 2) {
      if (!fromWarehouseId) {
        toast.error("Lütfen kaynak depoyu seçin.");
        return;
      }
      if (!toWarehouseId) {
        toast.error("Lütfen hedef depoyu seçin.");
        return;
      }
      if (fromWarehouseId === toWarehouseId) {
        toast.error("Kaynak ve hedef depo aynı olamaz.");
        return;
      }
      if (selectedSourceStock <= 0) {
        toast.error("Kaynak depoda yeterli stok bulunmuyor.");
        return;
      }
      // Set initial quantity to 1
      setQuantity(1);
    }
    setStep((s) => s + 1);
  };

  const handlePrevStep = () => {
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast.error("Miktar sıfırdan büyük olmalıdır.");
      return;
    }
    if (quantity > selectedSourceStock) {
      toast.error(`Yetersiz stok: Kaynak depoda en fazla ${selectedSourceStock} adet mevcut.`);
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmitTransfer(
        selectedProductId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        notes
      );
      if (success) {
        toast.success("Stok transfer talebi oluşturuldu.");
        handleClose();
      }
    } catch (err) {
      toast.error("Talebi gönderirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const fromWhName = warehouses.find((w) => w.id === fromWarehouseId)?.name || "Kaynak Depo";
  const toWhName = warehouses.find((w) => w.id === toWarehouseId)?.name || "Hedef Depo";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-[550px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50/40 dark:bg-slate-900/40">
          <div>
            <h3 className="text-sm font-black text-gradient uppercase tracking-widest">
              Depolar Arası Transfer Sihirbazı
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Adım {step} / 4: {step === 1 ? "Ürün Seç" : step === 2 ? "Depo Seç" : step === 3 ? "Miktar Belirle" : "Onay"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Indicators */}
        <div className="flex px-8 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-850 justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span className={step >= 1 ? "text-[#f97316]" : ""}>1. ÜRÜN</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span className={step >= 2 ? "text-[#f97316]" : ""}>2. DEPO</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span className={step >= 3 ? "text-[#f97316]" : ""}>3. MİKTAR</span>
          <ArrowRight className="w-3 h-3 text-slate-300" />
          <span className={step >= 4 ? "text-[#f97316]" : ""}>4. ONAY</span>
        </div>

        <div className="p-6">
          
          {/* STEP 1: Select Product */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ürün adı veya SKU ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#f97316] outline-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? "border-[#f97316] bg-orange-500/5 dark:bg-orange-500/10"
                          : "border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-150 uppercase truncate">
                          {p.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">SKU: {p.sku}</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Select Warehouses */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-semibold mb-2">
                Seçilen Ürün: <strong className="text-slate-800 dark:text-white uppercase">{selectedProduct?.name}</strong>
              </p>

              {/* Source Warehouse */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-0.5">
                  Kaynak Depo (Stok Çıkışı) *
                </label>
                <select
                  required
                  value={fromWarehouseId}
                  onChange={(e) => {
                    setFromWarehouseId(e.target.value);
                    if (e.target.value === toWarehouseId) setToWarehouseId("");
                  }}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:border-[#f97316] outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Kaynak Depo Seçin --</option>
                  {sourceWarehouses.map((wh) => (
                    <option key={wh.id} value={wh.id} disabled={wh.stock <= 0}>
                      {wh.name} (Stok: {wh.stock} Adet) {wh.stock <= 0 ? "[STOK YOK]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Warehouse */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-0.5">
                  Hedef Depo (Stok Girişi) *
                </label>
                <select
                  required
                  disabled={!fromWarehouseId}
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:border-[#f97316] outline-none transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Hedef Depo Seçin --</option>
                  {destinationWarehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Quantity & Notes */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150/80 dark:border-slate-800/80 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transfer Detayları</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ürün: <span className="uppercase">{selectedProduct?.name}</span>
                </p>
                <p className="text-xs font-bold text-slate-850 dark:text-slate-200">
                  Rota: <span>{fromWhName}</span> <span className="text-[#f97316]">➔</span> <span>{toWhName}</span>
                </p>
                <p className="text-xs font-bold text-slate-500">
                  Mevcut Stok (Kaynak): <strong className="text-[#f97316]">{selectedSourceStock} Adet</strong>
                </p>
              </div>

              {/* Quantity Selector with +/- buttons */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-0.5">
                  Gönderilecek Miktar (Adet) *
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-3 rounded-l-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 hover:bg-slate-100 hover:text-[#f97316] font-black text-sm select-none shrink-0 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedSourceStock}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(selectedSourceStock, parseInt(e.target.value) || 1)))}
                    className="flex-1 w-full px-3 py-3 border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-xs text-center text-slate-850 dark:text-white focus:bg-white focus:border-[#f97316] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(selectedSourceStock, q + 1))}
                    className="px-3.5 py-3 rounded-r-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 hover:bg-slate-100 hover:text-[#f97316] font-black text-sm select-none shrink-0 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-0.5">
                  Transfer Notu (İsteğe Bağlı)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Transfer nedeni, sipariş numarası veya teslimat detayları..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:bg-white focus:border-[#f97316] outline-none transition-all resize-none h-20"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Confirm review */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500/10 text-[#f97316] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-150 uppercase tracking-wider">Transfer Talebi Özeti</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Lütfen aşağıdaki transfer bilgilerini onaylayın</p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150/80 dark:border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs pb-3">
                  <span className="text-slate-500 font-semibold">Ürün</span>
                  <span className="font-black text-slate-850 dark:text-white uppercase truncate max-w-[280px]">{selectedProduct?.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 pb-3">
                  <span className="text-slate-500 font-semibold">Kaynak Depo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{fromWhName}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 pb-3">
                  <span className="text-slate-500 font-semibold">Hedef Depo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{toWhName}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 pb-3">
                  <span className="text-slate-500 font-semibold">Transfer Miktarı</span>
                  <span className="font-black text-sm text-[#f97316]">{quantity} Adet</span>
                </div>
                {notes && (
                  <div className="text-xs pt-3 flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold">Transfer Notu</span>
                    <span className="font-semibold text-slate-600 bg-white dark:bg-slate-900 border border-slate-150 p-2.5 rounded-lg italic">{notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Geri
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex justify-center items-center gap-1.5 cursor-pointer shadow-md"
              >
                Devam Et
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#f97316] to-[#d97706] hover:from-[#92400e] hover:to-[#f97316] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex justify-center items-center gap-1.5 shadow-md shadow-[#f97316]/10 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> TRANSFERİ BAŞLAT
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
