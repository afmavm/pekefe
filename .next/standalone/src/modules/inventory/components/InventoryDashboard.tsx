"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, 
  MapPin, 
  Box, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  ArrowRightLeft, 
  Layers, 
  Check, 
  X, 
  Calendar, 
  User, 
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Warehouse, Product, StockLocation, StockTransfer } from "../types";
import WarehouseStockGrid from "./WarehouseStockGrid";
import ShelfTracker from "./ShelfTracker";
import StockTransferWizard from "./StockTransferWizard";
import { 
  getInventoryData,
  approveStockTransferAction,
  rejectStockTransferAction,
  createStockTransferAction,
  updateShelfLocationAction
} from "../server/inventoryActions";
import { toast } from "sonner";

interface InventoryDashboardProps {
  initialData?: {
    warehouses: Warehouse[];
    products: Product[];
    stockLocations: StockLocation[];
    stockTransfers: StockTransfer[];
  };
}

export default function InventoryDashboard({ initialData }: InventoryDashboardProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role;
  const userBranchId = user?.branchId;
  const userWarehouseId = user?.warehouseId;

  const isReadOnly = userRole === "SALES_STAFF";
  const isBranchLocked = userRole === "BRANCH_MANAGER" || userRole === "SALES_STAFF";
  const isWarehouseLocked = userRole === "WAREHOUSE_SUPERVISOR";

  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"depo" | "raf" | "transfer">("depo");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Domain State
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialData?.warehouses || []);
  const [products, setProducts] = useState<Product[]>(initialData?.products || []);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>(initialData?.stockLocations || []);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(initialData?.stockTransfers || []);

  // Action Loading States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Scoped datasets based on role
  const scopedWarehouses = useMemo(() => {
    if (!userRole || userRole === "SUPER_ADMIN" || userRole === "ADMIN") return warehouses;
    if (isBranchLocked) return warehouses.filter(w => w.branchId === userBranchId);
    if (isWarehouseLocked) return warehouses.filter(w => w.id === userWarehouseId);
    return warehouses;
  }, [warehouses, userRole, isBranchLocked, userBranchId, isWarehouseLocked, userWarehouseId]);

  const scopedStockLocations = useMemo(() => {
    if (!userRole || userRole === "SUPER_ADMIN" || userRole === "ADMIN") return stockLocations;
    if (isBranchLocked) return stockLocations.filter(loc => {
      const wh = warehouses.find(w => w.id === loc.warehouseId);
      return wh?.branchId === userBranchId;
    });
    if (isWarehouseLocked) return stockLocations.filter(loc => loc.warehouseId === userWarehouseId);
    return stockLocations;
  }, [stockLocations, warehouses, userRole, isBranchLocked, userBranchId, isWarehouseLocked, userWarehouseId]);

  const scopedStockTransfers = useMemo(() => {
    if (!userRole || userRole === "SUPER_ADMIN" || userRole === "ADMIN") return stockTransfers;
    if (isBranchLocked) return stockTransfers.filter(t => {
      const fromWh = warehouses.find(w => w.id === t.fromWarehouseId);
      const toWh = warehouses.find(w => w.id === t.toWarehouseId);
      return fromWh?.branchId === userBranchId || toWh?.branchId === userBranchId;
    });
    if (isWarehouseLocked) return stockTransfers.filter(t => t.fromWarehouseId === userWarehouseId || t.toWarehouseId === userWarehouseId);
    return stockTransfers;
  }, [stockTransfers, warehouses, userRole, isBranchLocked, userBranchId, isWarehouseLocked, userWarehouseId]);

  // Load / Refresh Data
  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getInventoryData();
      if (res.success && res.data) {
        setWarehouses(res.data.warehouses);
        setProducts(res.data.products);
        setStockLocations(res.data.stockLocations);
        setStockTransfers(res.data.stockTransfers);
        if (isRefresh) toast.success("Veriler başarıyla yenilendi.");
      } else {
        toast.error(res.error || "Envanter verileri yüklenemedi.");
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

  // Statistics Computations
  const totalWarehouses = scopedWarehouses.length;
  
  const totalStockAmount = useMemo(() => {
    return scopedStockLocations.reduce((sum, loc) => sum + loc.stock, 0);
  }, [scopedStockLocations]);

  const activeTransfersCount = useMemo(() => {
    return scopedStockTransfers.filter((t) => t.status === "Bekliyor").length;
  }, [scopedStockTransfers]);

  const criticalStockCount = useMemo(() => {
    return scopedStockLocations.filter(
      (loc) => loc.stock < (loc.product?.criticalLimit || 10)
    ).length;
  }, [scopedStockLocations]);

  // Server Actions Wrappers
  const handleUpdateShelf = async (productId: string, warehouseId: string, rack: string): Promise<boolean> => {
    try {
      const res = await updateShelfLocationAction({ productId, warehouseId, rack });
      if (res.success) {
        await loadData(true);
        return true;
      } else {
        toast.error(res.error || "Raf konumu güncellenemedi.");
        return false;
      }
    } catch (err) {
      toast.error("Bir hata oluştu.");
      return false;
    }
  };

  const handleCreateTransfer = async (
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    notes?: string | null
  ): Promise<boolean> => {
    try {
      const res = await createStockTransferAction({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        notes
      });
      if (res.success) {
        await loadData(true);
        return true;
      } else {
        toast.error(res.error || "Transfer talebi oluşturulamadı.");
        return false;
      }
    } catch (err) {
      toast.error("Bir hata oluştu.");
      return false;
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    setActionLoadingId(transferId);
    try {
      const res = await approveStockTransferAction(transferId);
      if (res.success) {
        toast.success("Stok transferi onaylandı ve stoklar güncellendi.");
        await loadData(true);
      } else {
        toast.error(res.error || "Transfer onaylanamadı.");
      }
    } catch (err) {
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    setActionLoadingId(transferId);
    try {
      const res = await rejectStockTransferAction(transferId);
      if (res.success) {
        toast.success("Transfer talebi reddedildi.");
        await loadData(true);
      } else {
        toast.error(res.error || "Talep reddedilemedi.");
      }
    } catch (err) {
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper to map warehouse ids to names for transfer records list
  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || "Bilinmeyen Depo";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-1">
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
        <div className="h-96 bg-slate-100 rounded-2xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-orange-500" /> Envanter & Depo Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Çoklu Depo Stok Takibi, Akıllı Raf Dağılımları ve Lojistik Kontrolü
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {!isReadOnly && (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Yeni Transfer
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {totalWarehouses}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Aktif Depo / Şube
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center flex-shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {totalStockAmount.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Toplam Stok Miktarı
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {activeTransfersCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Bekleyen Transferler
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 hover:border-orange-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            criticalStockCount > 0
              ? "bg-red-50 text-red-600 animate-pulse"
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-2xl font-black ${criticalStockCount > 0 ? "text-red-500" : "text-slate-900"}`}>
              {criticalStockCount}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Kritik Stok Kalemi
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("depo")}
            className={`pb-4 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "depo"
                ? "border-orange-500 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Layers className="w-4 h-4" />
            Depo Dağılımı
          </button>
          <button
            onClick={() => setActiveTab("raf")}
            className={`pb-4 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "raf"
                ? "border-orange-500 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Raf Konumları
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`pb-4 text-xs font-semibold tracking-wide uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "transfer"
                ? "border-orange-500 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Stok Transferleri
            {activeTransfersCount > 0 && (
              <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0">
                {activeTransfersCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Panels */}
        <div className="transition-all duration-200">
          {activeTab === "depo" && (
            <WarehouseStockGrid warehouses={scopedWarehouses} stockLocations={scopedStockLocations} />
          )}

          {activeTab === "raf" && (
            <ShelfTracker 
              warehouses={scopedWarehouses} 
              stockLocations={scopedStockLocations} 
              onUpdateShelf={handleUpdateShelf}
              isReadOnly={isReadOnly}
            />
          )}

          {activeTab === "transfer" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Depo Lojistik & Transfer Talepleri
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Depolar arası stok hareketleri ve onay sırası
                  </p>
                </div>
              </div>

              {/* Transfers Table / Cards */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-5">Ürün Detayı</th>
                        <th className="px-6 py-5">Rota (Nereden ➔ Nereye)</th>
                        <th className="px-6 py-5 text-right">Gönderilen Miktar</th>
                        <th className="px-6 py-5">Oluşturan / Tarih</th>
                        <th className="px-6 py-5">Notlar</th>
                        <th className="px-6 py-5">Durum</th>
                        <th className="px-6 py-5 text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {scopedStockTransfers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400 text-xs">
                            Kayıtlı stok transfer talebi bulunmamaktadır.
                          </td>
                        </tr>
                      ) : (
                        scopedStockTransfers.map((transfer) => {
                          const isLoading = actionLoadingId === transfer.id;
                          const formattedDate = new Date(transfer.createdAt).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          });

                          return (
                            <tr key={transfer.id} className="hover:bg-slate-50 transition">
                              <td className="px-6 py-4">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-700 truncate">
                                    {transfer.product?.name || "Bilinmeyen Ürün"}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    SKU: {transfer.product?.sku}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                  <span>{getWarehouseName(transfer.fromWarehouseId)}</span>
                                  <ChevronRight className="w-3.5 h-3.5 text-orange-500" />
                                  <span className="text-orange-500 font-semibold">{getWarehouseName(transfer.toWarehouseId)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-semibold text-slate-700">
                                  {transfer.quantity.toLocaleString("tr-TR")} Adet
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <span>{transfer.requester || "Yönetici"}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Calendar className="w-3 h-3 text-slate-300" />
                                    <span>{formattedDate}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {transfer.notes ? (
                                  <div className="flex items-start gap-1 max-w-[200px] truncate text-[11px] text-slate-500 italic" title={transfer.notes}>
                                    <MessageSquare className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
                                    <span>{transfer.notes}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Not yok</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wide border ${
                                  transfer.status === "Onaylandı"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : transfer.status === "Reddedildi"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                                }`}>
                                  {transfer.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {transfer.status === "Bekliyor" ? (
                                  !isReadOnly ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleApproveTransfer(transfer.id)}
                                        disabled={isLoading}
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-100 transition cursor-pointer inline-flex items-center justify-center"
                                        title="Onayla"
                                      >
                                        {isLoading ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleRejectTransfer(transfer.id)}
                                        disabled={isLoading}
                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition cursor-pointer inline-flex items-center justify-center"
                                        title="Reddet"
                                      >
                                        {isLoading ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <X className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Onay Bekliyor</span>
                                  )
                                ) : (
                                  <span className="text-[10px] text-slate-500">Tamamlandı</span>
                                )}
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
          )}
        </div>
      </div>

      {/* Stock Transfer Wizard Modal */}
      <StockTransferWizard
        products={products}
        warehouses={scopedWarehouses}
        stockLocations={scopedStockLocations}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmitTransfer={handleCreateTransfer}
      />
    </div>
  );
}
