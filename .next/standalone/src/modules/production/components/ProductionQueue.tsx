"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Clock, Play, XCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { ProductionOrder, Product } from "../types";
import { toast } from "sonner";

interface ProductionQueueProps {
  orders: ProductionOrder[];
  products: Product[];
  onProcessOrder: (orderId: string) => Promise<boolean>;
  onCancelOrder: (orderId: string) => Promise<boolean>;
}

export default function ProductionQueue({
  orders,
  products,
  onProcessOrder,
  onCancelOrder
}: ProductionQueueProps) {
  const [filter, setFilter] = useState<"HEPSI" | "BEKLIYOR" | "TAMAMLANDI" | "IPTAL">("HEPSI");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Map products for fast lookup
  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filter === "HEPSI") return true;
      if (filter === "BEKLIYOR") return o.status === "Bekliyor";
      if (filter === "TAMAMLANDI") return o.status === "Tamamlandı";
      if (filter === "IPTAL") return o.status === "İptal";
      return true;
    });
  }, [orders, filter]);

  // --- Virtualization Logic ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      setContainerHeight(container.clientHeight || 400);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const rowHeight = 84; // increased height to accommodate progress lines
  const { startIndex, endIndex, translateY } = useMemo(() => {
    const totalItems = filteredOrders.length;
    if (totalItems === 0) {
      return { startIndex: 0, endIndex: 0, translateY: 0 };
    }

    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
    const end = Math.min(totalItems, Math.ceil((scrollTop + containerHeight) / rowHeight) + 2);
    
    return {
      startIndex: start,
      endIndex: end,
      translateY: start * rowHeight
    };
  }, [scrollTop, containerHeight, filteredOrders.length]);

  const totalHeight = filteredOrders.length * rowHeight;

  // Actions
  const handleProcess = async (id: string) => {
    setProcessingId(id);
    try {
      const success = await onProcessOrder(id);
      if (success) {
        toast.success("Üretim emri başarıyla tamamlandı ve stoklar güncellendi.");
      }
    } catch (err) {
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Bu üretim emrini iptal etmek istediğinize emin misiniz?")) return;
    setCancelingId(id);
    try {
      const success = await onCancelOrder(id);
      if (success) {
        toast.success("Üretim emri iptal edildi.");
      }
    } catch (err) {
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="glass rounded-3xl shadow-sm overflow-hidden flex flex-col h-[560px] border border-slate-200/60 dark:border-slate-800/60">
      
      {/* Header and Filters */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-55/40 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f97316]" /> Üretim Sırası & Geçmiş
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            İmalat emirleri takip ve işleme havuzu
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-black uppercase">
          {(["HEPSI", "BEKLIYOR", "TAMAMLANDI", "IPTAL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                setScrollTop(0);
                if (containerRef.current) containerRef.current.scrollTop = 0;
              }}
              className={`px-3.5 py-2 rounded-md uppercase tracking-wider transition-all font-black cursor-pointer ${
                filter === tab
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab === "HEPSI" ? "Tümü" : tab === "BEKLIYOR" ? "Bekleyen" : tab === "TAMAMLANDI" ? "Tamamlandı" : "İptal"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Body Container (Scrollable) */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-0 relative select-none"
        style={{ height: `${containerHeight}px` }}
      >
        {filteredOrders.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm">
            <AlertCircle className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-wider">İlgili üretim emri bulunamadı.</p>
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, width: "100%", position: "relative" }}>
            <div
              style={{
                transform: `translateY(${translateY}px)`,
                position: "absolute",
                left: 0,
                right: 0,
                top: 0
              }}
              className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/10 dark:bg-slate-900/10"
            >
              {filteredOrders.slice(startIndex, endIndex).map((order) => {
                const product = productMap.get(order.productId);
                const isPending = order.status === "Bekliyor";
                const isCompleted = order.status === "Tamamlandı";
                const isCanceled = order.status === "İptal";

                return (
                  <div
                    key={order.id}
                    className="flex flex-col justify-center px-6 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm"
                    style={{ height: `${rowHeight}px` }}
                  >
                    <div className="flex items-center justify-between">
                      {/* Item Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900"
                            : isCanceled
                              ? "bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                              : "bg-orange-50 text-[#f97316] border-orange-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 animate-pulse"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isCanceled ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate uppercase tracking-tight">
                            {product?.name || "Bilinmeyen Ürün"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                            <span>Miktar: <strong className="text-slate-800 dark:text-slate-200">{order.quantity} Adet</strong></span>
                            <span>•</span>
                            <span>{new Date(order.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Actions */}
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCancel(order.id)}
                              disabled={cancelingId === order.id || processingId === order.id}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-700 hover:border-red-250 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              {cancelingId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "İPTAL"
                              )}
                            </button>
                            <button
                              onClick={() => handleProcess(order.id)}
                              disabled={processingId === order.id || cancelingId === order.id}
                              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-[#92400e] text-white hover:shadow-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-[#f97316]/10"
                            >
                              {processingId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Play className="w-3 h-3 fill-current" />
                                  TAMAMLA
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900"
                              : "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                          }`}>
                            {order.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Indicator Bar Below Row Details */}
                    <div className="mt-2.5 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        isCompleted
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500 w-full"
                          : isCanceled
                            ? "bg-gradient-to-r from-red-400 to-red-500 w-full"
                            : "bg-gradient-to-r from-amber-400 to-amber-500 w-1/2 animate-pulse"
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
