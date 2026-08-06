"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { createWasteLogAction } from "@/modules/production/server/productionActions";
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Warehouse, 
  Info,
  Calendar
} from "lucide-react";

interface WasteClientProps {
  initialData: any;
}

export default function WasteClient({ initialData }: WasteClientProps) {
  const [wasteLogs, setWasteLogs] = useState<any[]>(initialData.wasteLogs || []);
  const [loading, setLoading] = useState(false);

  // Form states
  const [productId, setProductId] = useState("");
  const [productVariantId, setProductVariantId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [productionOrderId, setProductionOrderId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("Üretim Defosu");

  // Combine raw materials & finished goods for selection
  const allProducts = [
    ...initialData.finishedGoods.map((p: any) => ({ ...p, isRaw: false })),
    ...initialData.rawMaterials.map((p: any) => ({ ...p, isRaw: true }))
  ];

  const selectedProduct = allProducts.find(p => p.id === productId);
  const selectedProductVariants = selectedProduct?.variants || [];

  const handleCreateWasteLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !warehouseId || quantity <= 0 || !reason) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const res = await createWasteLogAction({
        productId,
        productVariantId: productVariantId || null,
        warehouseId,
        quantity,
        reason,
        productionOrderId: productionOrderId || null
      });

      if (res.success && res.data) {
        toast.success("Fire ve zayiat kaydı başarıyla oluşturuldu.");
        
        // Refresh local waste list
        const newLog = {
          ...res.data,
          product: selectedProduct,
          variant: selectedProductVariants.find((v: any) => v.id === productVariantId) || null,
          warehouse: initialData.warehouses.find((w: any) => w.id === warehouseId),
          productionOrder: initialData.productionOrders.find((o: any) => o.id === productionOrderId) || null
        };
        setWasteLogs([newLog, ...wasteLogs]);

        // Reset
        setProductId("");
        setProductVariantId("");
        setWarehouseId("");
        setProductionOrderId("");
        setQuantity(1);
        setReason("Üretim Defosu");
      } else {
        toast.error(res.error || "Fire kaydı oluşturulurken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalWasteEntries = wasteLogs.length;
  const totalWasteQty = wasteLogs.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            FİRE & HURDA TAKİBİ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            İmalat hataları, bozuk hammaddeler ve zayiatları kaydederek stoklarınızı güncel tutun.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-orange-250 transition-colors">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalWasteEntries}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toplam Kayıt Adedi</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-orange-250 transition-colors">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalWasteQty} Birim</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toplam Fire Miktarı</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            Yeni Fire/Hurda Bildir
          </h2>
          <form onSubmit={handleCreateWasteLog} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Ürün / Malzeme</label>
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setProductVariantId("");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Ürün/Hammadde Seçin --</option>
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.isRaw ? "Hammadde" : "Mamul"}] {p.name} (SKU: {p.sku})
                  </option>
                ))}
              </select>
            </div>

            {selectedProductVariants.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Varyant</label>
                <select
                  value={productVariantId}
                  onChange={(e) => setProductVariantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                >
                  <option value="">-- Varyant Seçin --</option>
                  {selectedProductVariants.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {Object.values(v.attributes as Record<string, string>).join(", ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Zayiat Verilen Depo</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Depo Seçin --</option>
                {initialData.warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name} {w.isLocked ? "(KİLİTLİ)" : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">İlişkili Üretim Emri (İsteğe Bağlı)</label>
              <select
                value={productionOrderId}
                onChange={(e) => setProductionOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Bağımsız Zayiat --</option>
                {initialData.productionOrders.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    Emir No: {o.id.substring(0, 8)}... ({o.product?.name} - {o.quantity} Adet)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Fire Miktarı</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Neden / Açıklama</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="Üretim Defosu">Üretim Defosu</option>
                <option value="Hammadde Defosu">Hammadde Defosu</option>
                <option value="Kırılma ve Çatlama">Kırılma ve Çatlama</option>
                <option value="Eğilme/Montaj Hatası">Eğilme / Montaj Hatası</option>
                <option value="Son Kullanma/Bozulma">Bozulma / Küflenme</option>
                <option value="Diğer Zayiat">Diğer Zayiat</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Fire Kaydet
            </button>
          </form>
        </div>

        {/* List Table */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-700">Fire & Iskarta Kayıt Defteri</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Sıra No</th>
                  <th className="p-4">Ürün / Malzeme</th>
                  <th className="p-4">Depo</th>
                  <th className="p-4">Neden</th>
                  <th className="p-4 text-center">Miktar</th>
                  <th className="p-4">İlişkili Üretim</th>
                  <th className="p-4">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
                {wasteLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Fire ve zayiat kaydı bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  wasteLogs.map((log, index) => {
                    const dateStr = new Date(log.date).toLocaleDateString("tr-TR");
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-xs">{index + 1}</td>
                        <td className="p-4 font-semibold text-sm">
                          {log.product?.name}
                          {log.variant && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({Object.values(log.variant.attributes as Record<string, string>).join(", ")})
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400">SKU: {log.variant?.sku || log.product?.sku}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{log.warehouse?.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-red-600">{log.reason}</td>
                        <td className="p-4 text-center font-bold text-slate-900 text-sm">{log.quantity} Adet</td>
                        <td className="p-4 text-slate-500">
                          {log.productionOrderId ? (
                            <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">
                              Emir: {log.productionOrderId.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Serbest Zayiat</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">{dateStr}</td>
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

