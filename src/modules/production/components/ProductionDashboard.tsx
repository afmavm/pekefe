"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Hammer, Plus, Loader2, Sparkles, TrendingUp, AlertCircle, RefreshCw, Box, Search } from "lucide-react";
import { Product, ProductionOrder } from "../types";
import BOMDependencyTree from "./BOMDependencyTree";
import ProductionQueue from "./ProductionQueue";
import {
  getProductionData,
  createProductionOrderAction,
  processProductionOrderAction,
  cancelProductionOrderAction
} from "../server/productionActions";
import { toast } from "sonner";

interface ProductionDashboardProps {
  initialData?: {
    finishedGoods: Product[];
    rawMaterials: Product[];
    productionOrders: ProductionOrder[];
  };
}

export default function ProductionDashboard({ initialData }: ProductionDashboardProps) {
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [finishedGoods, setFinishedGoods] = useState<Product[]>(initialData?.finishedGoods || []);
  const [rawMaterials, setRawMaterials] = useState<Product[]>(initialData?.rawMaterials || []);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(initialData?.productionOrders || []);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter finished goods by search term
  const filteredFinishedGoods = useMemo(() => {
    return finishedGoods.filter(
      (fg) =>
        fg.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        fg.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [finishedGoods, productSearch]);

  // BOM selected product
  const selectedProduct = finishedGoods.find((p) => p.id === selectedProductId) || null;

  // Load / Refresh Data
  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getProductionData();
      if (res.success && res.data) {
        setFinishedGoods(res.data.finishedGoods);
        setRawMaterials(res.data.rawMaterials);
        setProductionOrders(res.data.productionOrders);
      } else {
        toast.error(res.error || "Üretim verileri yüklenemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [initialData]);

  // Statistics
  const activeOrdersCount = productionOrders.filter((o) => o.status === "Bekliyor").length;
  const completedOrdersCount = productionOrders.filter((o) => o.status === "Tamamlandı").length;
  const totalQuantityProduced = productionOrders
    .filter((o) => o.status === "Tamamlandı")
    .reduce((sum, o) => sum + o.quantity, 0);
  const lowStockMaterialsCount = rawMaterials.filter(
    (m) => m.stock < (m.criticalLimit || 100)
  ).length;

  // Actions
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) {
      toast.error("Lütfen geçerli bir ürün seçin.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createProductionOrderAction({ productId: selectedProductId, quantity });
      if (res.success) {
        toast.success("Üretim emri başarıyla oluşturuldu.");
        setSelectedProductId("");
        setQuantity(1);
        await loadData(true);
      } else {
        toast.error(res.error || "Üretim emri oluşturulamadı.");
      }
    } catch (err) {
      toast.error("Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessOrder = async (orderId: string): Promise<boolean> => {
    try {
      const res = await processProductionOrderAction(orderId);
      if (res.success) {
        await loadData(true);
        return true;
      } else {
        toast.error(res.error || "Üretim emri tamamlanamadı.");
        return false;
      }
    } catch (err) {
      toast.error("Hata oluştu.");
      return false;
    }
  };

  const handleCancelOrder = async (orderId: string): Promise<boolean> => {
    try {
      const res = await cancelProductionOrderAction(orderId);
      if (res.success) {
        await loadData(true);
        return true;
      } else {
        toast.error(res.error || "Üretim emri iptal edilemedi.");
        return false;
      }
    } catch (err) {
      toast.error("Hata oluştu.");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-10 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 h-96 bg-slate-100 rounded-2xl border border-slate-200" />
          <div className="xl:col-span-2 space-y-6">
            <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200" />
            <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Hammer className="w-6 h-6 text-orange-500" /> Üretim & Fabrika MRP
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Malzeme Gereksinim Planlaması ve Üretim Kontrol Arayüzü
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
          title="Verileri Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {activeOrdersCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Aktif Emirler
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {completedOrdersCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tamamlanan Emirler
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center flex-shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {totalQuantityProduced.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Toplam İmalat (Adet)
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-colors">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            lowStockMaterialsCount > 0
              ? "bg-red-50 text-red-500"
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-2xl font-black ${lowStockMaterialsCount > 0 ? "text-red-500" : "text-slate-900"}`}>
              {lowStockMaterialsCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Kritik Hammadde
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-500" /> 1. Mamul Seçimi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Üretmek istediğiniz mamulü aşağıdaki listeden tıklayarak seçin
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Mamul adı veya SKU ile ara..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-400 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {filteredFinishedGoods.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  Ürün bulunamadı.
                </div>
              ) : (
                filteredFinishedGoods.map((fg) => {
                  const isSelected = selectedProductId === fg.id;
                  return (
                    <div
                      key={fg.id}
                      onClick={() => setSelectedProductId(fg.id)}
                      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? "border-orange-400 bg-orange-50 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {fg.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">SKU: {fg.sku}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block">Mevcut</span>
                        <span className="text-xs font-semibold text-slate-700">{fg.stock} Adet</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. Quantity selection (Visible only when product selected) */}
            {selectedProductId && (
              <form onSubmit={handleCreateOrder} className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-500" /> 2. Miktar & Emir
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-500 font-medium ml-0.5">
                    Üretilecek Miktar (Adet)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-2.5 rounded-l-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-orange-500 font-semibold text-sm select-none shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 w-full px-3 py-2.5 border-y border-slate-200 bg-slate-50 text-sm text-center text-slate-800 focus:bg-white outline-none transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3.5 py-2.5 rounded-r-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-orange-500 font-semibold text-sm select-none shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Submit Trigger */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> ÜRETİM EMRİNİ KAYDET
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* BOM Dependency Tree (Sub-pane) */}
          <BOMDependencyTree product={selectedProduct} quantity={quantity} />
        </div>

        {/* Right Hand: Production Queue */}
        <div className="xl:col-span-2">
          <ProductionQueue
            orders={productionOrders}
            products={[...finishedGoods, ...rawMaterials]}
            onProcessOrder={handleProcessOrder}
            onCancelOrder={handleCancelOrder}
          />
        </div>
      </div>
    </div>
  );
}
