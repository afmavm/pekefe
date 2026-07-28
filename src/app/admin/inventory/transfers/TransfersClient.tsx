"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight, Plus, Search, Filter, ChevronDown, Package,
  Clock, CheckCircle, XCircle, Truck, FileText, Loader2, X
} from "lucide-react";
import {
  createStockTransferAction,
  dispatchTransferAction,
  receiveTransferAction,
  rejectTransferAction,
} from "@/modules/inventory/server/inventoryActions";

interface Transfer {
  id: string;
  transferNo: string;
  status: string;
  quantity: number;
  notes?: string | null;
  createdAt: string;
  dispatchedAt?: string | null;
  receivedAt?: string | null;
  requester?: string | null;
  approvedBy?: string | null;
  product: { name: string; sku: string; image?: string | null };
  fromWarehouse: { name: string; code: string; branch?: { name: string } };
  toWarehouse: { name: string; code: string; branch?: { name: string } };
}

interface Warehouse { id: string; name: string; code: string; branchId: string }
interface Product { id: string; name: string; sku: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  "Taslak": { label: "Taslak", color: "bg-slate-100 text-slate-600", icon: FileText },
  "Yolda": { label: "Yolda (In-Transit)", color: "bg-amber-100 text-amber-700", icon: Truck },
  "Tamamlandı": { label: "Tamamlandı", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  "Reddedildi": { label: "Reddedildi", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function TransfersClient({
  transfers,
  warehouses,
  products,
  total,
  page,
  pageSize,
}: {
  transfers: Transfer[];
  warehouses: Warehouse[];
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createForm, setCreateForm] = useState({
    productId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: 1,
    notes: "",
  });

  const visibleTransfers = filterStatus === "all"
    ? transfers
    : transfers.filter(t => t.status === filterStatus);

  const handleCreate = () => {
    startTransition(async () => {
      const res = await createStockTransferAction({
        productId: createForm.productId,
        fromWarehouseId: createForm.fromWarehouseId,
        toWarehouseId: createForm.toWarehouseId,
        quantity: createForm.quantity,
        notes: createForm.notes || null,
      });
      if (res.success) {
        toast.success("Transfer talebi oluşturuldu!");
        setShowCreateModal(false);
        setCreateForm({ productId: "", fromWarehouseId: "", toWarehouseId: "", quantity: 1, notes: "" });
        window.location.reload();
      } else {
        toast.error(res.error || "Hata oluştu.");
      }
    });
  };

  const handleDispatch = (id: string) => {
    startTransition(async () => {
      const res = await dispatchTransferAction(id);
      if (res.success) { toast.success("Transfer yola çıkarıldı! (In-Transit)"); window.location.reload(); }
      else toast.error(res.error || "Hata oluştu.");
    });
  };

  const handleReceive = (id: string) => {
    startTransition(async () => {
      const res = await receiveTransferAction(id);
      if (res.success) { toast.success("Transfer teslim alındı! Stok güncellendi."); window.location.reload(); }
      else toast.error(res.error || "Hata oluştu.");
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const res = await rejectTransferAction(id, rejectReason);
      if (res.success) { toast.success("Transfer reddedildi."); setShowRejectModal(null); window.location.reload(); }
      else toast.error(res.error || "Hata oluştu.");
    });
  };

  const statusCounts = transfers.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Status Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-1.5 flex gap-1 flex-wrap">
        {[
          { key: "all", label: "Tümü", count: transfers.length },
          ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
            key, label: cfg.label, count: statusCounts[key] || 0
          }))
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === key
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              filterStatus === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            }`}>{count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Yeni Transfer
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {visibleTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ArrowLeftRight className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">Bu filtrede transfer bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Transfer No</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ürün</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kaynak → Hedef</th>
                  <th className="text-right px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Miktar</th>
                  <th className="text-center px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Statü</th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tarih</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleTransfers.map(t => {
                  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG["Taslak"];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {t.transferNo}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">{t.product.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t.product.sku}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="text-[11px]">{t.fromWarehouse.name}</span>
                          <ArrowLeftRight className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="text-[11px]">{t.toWarehouse.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-800 text-sm">{t.quantity}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-[10px]">
                        {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {t.status === "Taslak" && (
                            <>
                              <button
                                onClick={() => handleDispatch(t.id)}
                                disabled={isPending}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                              >
                                <Truck className="w-3 h-3" /> Yola Çıkar
                              </button>
                              <button
                                onClick={() => setShowRejectModal(t.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition"
                              >
                                Reddet
                              </button>
                            </>
                          )}
                          {t.status === "Yolda" && (
                            <>
                              <button
                                onClick={() => handleReceive(t.id)}
                                disabled={isPending}
                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" /> Teslim Al
                              </button>
                              <button
                                onClick={() => setShowRejectModal(t.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition"
                              >
                                İptal Et
                              </button>
                            </>
                          )}
                          {["Tamamlandı", "Reddedildi"].includes(t.status) && (
                            <span className="text-[10px] text-slate-300 italic">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900">Yeni Transfer Talebi</h2>
                <p className="text-xs text-slate-400 mt-0.5">Taslak olarak oluşturulur, sonra yola çıkarılır</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ürün *</label>
                <select
                  value={createForm.productId}
                  onChange={e => setCreateForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 bg-slate-50"
                >
                  <option value="">Ürün seçin...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Kaynak Depo *</label>
                  <select
                    value={createForm.fromWarehouseId}
                    onChange={e => setCreateForm(prev => ({ ...prev, fromWarehouseId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 bg-slate-50"
                  >
                    <option value="">Seçin...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Hedef Depo *</label>
                  <select
                    value={createForm.toWarehouseId}
                    onChange={e => setCreateForm(prev => ({ ...prev, toWarehouseId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 bg-slate-50"
                  >
                    <option value="">Seçin...</option>
                    {warehouses.filter(w => w.id !== createForm.fromWarehouseId).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Miktar *</label>
                <input
                  type="number"
                  min={1}
                  value={createForm.quantity}
                  onChange={e => setCreateForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Notlar</label>
                <textarea
                  value={createForm.notes}
                  onChange={e => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 bg-slate-50 resize-none"
                  placeholder="Opsiyonel açıklama..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">İptal</button>
              <button
                onClick={handleCreate}
                disabled={isPending || !createForm.productId || !createForm.fromWarehouseId || !createForm.toWarehouseId}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Taslak Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 z-10 p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">Transferi Reddet / İptal Et</h2>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Red Gerekçesi</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-slate-50 resize-none"
                placeholder="Opsiyonel..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRejectModal(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">İptal</button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

