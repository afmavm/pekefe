"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  createProductionOrderAction, 
  approveProductionOrderAction, 
  processProductionOrderAction, 
  cancelProductionOrderAction 
} from "@/modules/production/server/productionActions";
import { 
  ClipboardCheck, 
  Plus, 
  Play, 
  CheckSquare, 
  XSquare, 
  HelpCircle, 
  Warehouse, 
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";

interface OrdersClientProps {
  initialData: any;
}

export default function OrdersClient({ initialData }: OrdersClientProps) {
  const [orders, setOrders] = useState<any[]>(initialData.productionOrders || []);
  const [loading, setLoading] = useState(false);

  // Form states
  const [productId, setProductId] = useState("");
  const [productVariantId, setProductVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [warehouseId, setWarehouseId] = useState("");
  const [productionPlanId, setProductionPlanId] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = initialData.finishedGoods.find((p: any) => p.id === productId);
  const selectedProductVariants = selectedProduct?.variants || [];

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) {
      toast.error("Lütfen geçerli bir ürün ve miktar seçin.");
      return;
    }

    setLoading(true);
    try {
      const res = await createProductionOrderAction({
        productId,
        productVariantId: productVariantId || null,
        quantity,
        warehouseId: warehouseId || null,
        productionPlanId: productionPlanId || null,
        notes: notes || null
      });

      if (res.success && res.data) {
        toast.success("Üretim emri başarıyla oluşturuldu.");
        
        // Refresh local orders list
        const newOrder = {
          ...res.data,
          product: selectedProduct,
          variant: selectedProductVariants.find((v: any) => v.id === productVariantId) || null,
          warehouse: initialData.warehouses.find((w: any) => w.id === (warehouseId || res.data.warehouseId)) || null,
          plan: initialData.productionPlans.find((p: any) => p.id === productionPlanId) || null
        };
        setOrders([newOrder, ...orders]);
        
        // Reset form
        setProductId("");
        setProductVariantId("");
        setQuantity(1);
        setWarehouseId("");
        setProductionPlanId("");
        setNotes("");
      } else {
        toast.error(res.error || "Üretim emri oluşturulurken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (id: string) => {
    toast.promise(
      approveProductionOrderAction(id),
      {
        loading: "İçerikler kontrol ediliyor ve stok rezerve ediliyor...",
        success: (res: any) => {
          if (res.success && res.data) {
            setOrders(orders.map(o => o.id === id ? { ...o, status: "Onaylandı", approvedBy: res.data.approvedBy } : o));
            return "Üretim emri onaylandı, hammaddeler rezerve edildi.";
          } else {
            throw new Error(res.error || "Onaylama başarısız oldu.");
          }
        },
        error: (err: any) => err.message || "İşlem sırasında hata oluştu."
      }
    );
  };

  const handleCompleteOrder = async (id: string) => {
    toast.promise(
      processProductionOrderAction(id),
      {
        loading: "Hammadde stokları düşülüyor, mamul stoka ekleniyor...",
        success: (res: any) => {
          if (res.success) {
            setOrders(orders.map(o => o.id === id ? { ...o, status: "Tamamlandı", completedBy: res.data.completedBy, endDate: res.data.endDate } : o));
            return "Üretim başarıyla tamamlandı, stok hareketleri güncellendi.";
          } else {
            throw new Error(res.error || "Tamamlama başarısız oldu.");
          }
        },
        error: (err: any) => err.message || "İşlem sırasında hata oluştu."
      }
    );
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm("Bu iş emrini iptal etmek istediğinizden emin misiniz? Rezerve edilen stoklar (varsa) serbest bırakılacaktır.")) return;

    setLoading(true);
    try {
      const res = await cancelProductionOrderAction(id);
      if (res.success) {
        toast.success("Üretim emri iptal edildi, rezervasyonlar kaldırıldı.");
        setOrders(orders.map(o => o.id === id ? { ...o, status: "İptal" } : o));
      } else {
        toast.error(res.error || "İptal edilemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const total = orders.length;
  const pending = orders.filter(o => o.status === "Bekliyor").length;
  const approved = orders.filter(o => o.status === "Onaylandı").length;
  const completed = orders.filter(o => o.status === "Tamamlandı").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <ClipboardCheck className="w-8 h-8 text-orange-500" />
            ÜRETİM EMİRLERİ (WORK ORDERS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Üretim iş emirlerini yönetin, hammaddeleri bloke edin ve fiili üretimi tamamlayın.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group hover:border-orange-250 transition-colors">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{total}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toplam İş Emri</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group hover:border-orange-250 transition-colors">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{pending}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Bekleyen</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group hover:border-orange-250 transition-colors">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{approved}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Onaylı / Üretimde</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group hover:border-orange-250 transition-colors">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{completed}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tamamlanan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            Yeni İş Emri Başlat
          </h2>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Üretilecek Mamul</label>
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setProductVariantId("");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Mamul Seçin --</option>
                {initialData.finishedGoods.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                ))}
              </select>
            </div>

            {selectedProductVariants.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Varyant (Özellik)</label>
                <select
                  value={productVariantId}
                  onChange={(e) => setProductVariantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                >
                  <option value="">-- Varyant Seçin --</option>
                  {selectedProductVariants.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {Object.entries(v.attributes as Record<string, string>)
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(", ")} (SKU: {v.sku})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Üretim Deposu</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Depo Seçin --</option>
                {initialData.warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name} {w.isLocked ? "(SAYIM KİLİTLİ)" : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Üretim Planı (İsteğe Bağlı)</label>
              <select
                value={productionPlanId}
                onChange={(e) => setProductionPlanId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Plan İlişkilendirmeyin --</option>
                {initialData.productionPlans.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Üretilecek Miktar</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Özel Notlar</label>
              <textarea
                placeholder="Üretim detayları..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800 h-16"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              İş Emri Oluştur
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-700">İş Emri Akış Listesi</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Sıra No</th>
                  <th className="p-4">Mamul / Ürün</th>
                  <th className="p-4">Depo</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4 text-center">Miktar</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Tarih</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                      İş emri kaydı bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => {
                    const dateStr = new Date(order.date).toLocaleDateString("tr-TR");
                    
                    let statusBadge = null;
                    if (order.status === "Bekliyor") {
                      statusBadge = <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100 uppercase tracking-wide">Bekliyor</span>;
                    } else if (order.status === "Onaylandı") {
                      statusBadge = <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-wide">Onaylandı</span>;
                    } else if (order.status === "Tamamlandı") {
                      statusBadge = <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">Tamamlandı</span>;
                    } else if (order.status === "İptal") {
                      statusBadge = <span className="px-2 py-1 rounded bg-red-50 text-red-700 text-[10px] font-bold border border-red-100 uppercase tracking-wide">İptal</span>;
                    } else {
                      statusBadge = <span className="px-2 py-1 rounded bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-100">{order.status}</span>;
                    }

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-xs">{index + 1}</td>
                        <td className="p-4">
                          <div className="font-semibold text-sm text-slate-800">{order.product?.name}</div>
                          {order.variant && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Varyant: {Object.values(order.variant.attributes as Record<string, string>).join(", ")}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">SKU: {order.variant?.sku || order.product?.sku}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-xs">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold">{order.warehouse?.name || "Bilinmeyen Depo"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-500">
                          {order.plan?.name || "-"}
                        </td>
                        <td className="p-4 text-center font-bold text-sm text-slate-900">
                          {order.quantity} Adet
                        </td>
                        <td className="p-4">{statusBadge}</td>
                        <td className="p-4 text-xs text-slate-500">{dateStr}</td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {order.status === "Bekliyor" && (
                            <>
                              <button
                                onClick={() => handleApproveOrder(order.id)}
                                className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition"
                                title="Onayla & Hammaddeleri Rezerve Et"
                              >
                                Onayla
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition"
                                title="İptal Et"
                              >
                                <XSquare className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {order.status === "Onaylandı" && (
                            <>
                              <button
                                onClick={() => handleCompleteOrder(order.id)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition"
                                title="Stokları Düş ve Üretimi Tamamla"
                              >
                                Üret
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition"
                                title="İptal Et & Rezerve Çöz"
                              >
                                <XSquare className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {order.status === "Tamamlandı" && (
                            <div className="text-[10px] text-slate-400 font-semibold italic">
                              {order.completedBy ? `${order.completedBy} tamamladı` : "Tamamlandı"}
                            </div>
                          )}
                          {order.status === "İptal" && (
                            <div className="text-[10px] text-red-400 font-semibold italic">İptal Edildi</div>
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
    </div>
  );
}

