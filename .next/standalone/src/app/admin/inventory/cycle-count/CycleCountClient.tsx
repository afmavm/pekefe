"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  Warehouse as WarehouseIcon,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  Info,
  Lock,
  Unlock,
} from "lucide-react";
import {
  createCycleCountAction,
  startCycleCountAction,
  updateCycleCountItemAction,
  completeCycleCountAction,
  cancelCycleCountAction,
} from "@/modules/inventory/server/inventoryActions";

interface CycleCountListRecord {
  id: string;
  code: string;
  warehouseId: string;
  type: string;
  status: string;
  isLocked: boolean;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  warehouse: {
    name: string;
    code: string;
    branch: {
      name: string;
    };
  };
  _count: {
    items: number;
  };
}

interface CycleCountDetail {
  id: string;
  code: string;
  warehouseId: string;
  type: string;
  status: string;
  isLocked: boolean;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  warehouse: {
    name: string;
    code: string;
    branch: {
      name: string;
    };
  };
  items: Array<{
    id: string;
    systemStock: number;
    countedStock: number | null;
    difference: number | null;
    rack: string | null;
    notes?: string | null;
    product: {
      id: string;
      name: string;
      sku: string;
      image: string | null;
      category: string;
    };
  }>;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  branch: {
    name: string;
  };
}

interface CycleCountClientProps {
  cycleCounts: CycleCountListRecord[];
  warehouses: Warehouse[];
  activeCount: CycleCountDetail | null;
}

export default function CycleCountClient({
  cycleCounts,
  warehouses,
  activeCount,
}: CycleCountClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dashboard state
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create form state
  const [warehouseId, setWarehouseId] = useState("");
  const [type, setType] = useState("GENEL");
  const [notes, setNotes] = useState("");

  // Counting page states (for update item inputs)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCounted, setEditingCounted] = useState<string>("");

  const handleCreate = () => {
    if (!warehouseId) {
      toast.error("Lütfen depo seçin.");
      return;
    }

    startTransition(async () => {
      const res = await createCycleCountAction({
        warehouseId,
        type,
        notes: notes || null,
      });

      if (res.success && res.data) {
        toast.success("Sayım kartı oluşturuldu.");
        setIsCreateOpen(false);
        setWarehouseId("");
        setType("GENEL");
        setNotes("");
        router.push(`?id=${res.data.id}`);
      } else {
        toast.error(res.error || "Sayım kartı oluşturulamadı.");
      }
    });
  };

  const handleStart = (id: string) => {
    startTransition(async () => {
      const res = await startCycleCountAction(id);
      if (res.success) {
        toast.success("Sayım başlatıldı ve ilgili depo kilitlendi.");
        router.refresh();
      } else {
        toast.error(res.error || "Sayım başlatılamadı.");
      }
    });
  };

  const handleUpdateItem = (itemId: string, currentVal: number | null) => {
    setEditingItemId(itemId);
    setEditingCounted(currentVal !== null ? String(currentVal) : "");
  };

  const handleSaveItem = (itemId: string) => {
    const qty = parseFloat(editingCounted);
    if (isNaN(qty) || qty < 0) {
      toast.error("Lütfen geçerli bir miktar girin.");
      return;
    }

    startTransition(async () => {
      const res = await updateCycleCountItemAction(itemId, qty);
      if (res.success) {
        toast.success("Sayılan miktar kaydedildi.");
        setEditingItemId(null);
        setEditingCounted("");
        router.refresh();
      } else {
        toast.error(res.error || "Kaydedilemedi.");
      }
    });
  };

  const handleComplete = (id: string) => {
    if (!confirm("Sayımı tamamlamak istediğinize emin misiniz? Farklar stoklara işlenecek ve depo kilidi açılacaktır.")) {
      return;
    }

    startTransition(async () => {
      const res = await completeCycleCountAction(id);
      if (res.success) {
        toast.success("Sayım tamamlandı. Stok hareketleri kaydedildi.");
        router.push("?");
      } else {
        toast.error(res.error || "Tamamlanırken hata oluştu.");
      }
    });
  };

  const handleCancel = (id: string) => {
    if (!confirm("Sayımı iptal etmek istediğinize emin misiniz? Sayım iptal edilecek ve depo kilidi açılacaktır.")) {
      return;
    }

    startTransition(async () => {
      const res = await cancelCycleCountAction(id);
      if (res.success) {
        toast.success("Sayım iptal edildi.");
        router.push("?");
      } else {
        toast.error(res.error || "İptal edilemedi.");
      }
    });
  };

  // Rendering counting detail view
  if (activeCount) {
    const isDraft = activeCount.status === "TASLAK";
    const isActive = activeCount.status === "DEVAM_EDIYOR";
    const isCompleted = activeCount.status === "TAMAMLANDI";
    const isCanceled = activeCount.status === "IPTAL";

    return (
      <div className="space-y-6">
        {/* Header & Back Action */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("?")}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">{activeCount.code}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isDraft
                        ? "bg-slate-100 text-slate-700"
                        : isActive
                        ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                        : isCompleted
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {activeCount.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Depo: {activeCount.warehouse.name} ({activeCount.warehouse.code})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isDraft && (
                <button
                  onClick={() => handleStart(activeCount.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-55"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Sayımı Başlat (Depoyu Kilitle)
                </button>
              )}

              {isActive && (
                <>
                  <button
                    onClick={() => handleCancel(activeCount.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 bg-white rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-55"
                  >
                    İptal Et (Kilidi Kaldır)
                  </button>
                  <button
                    onClick={() => handleComplete(activeCount.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-55"
                  >
                    Sayımı Tamamla (Stokları Güncelle)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Başlangıç</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {activeCount.startedAt ? new Date(activeCount.startedAt).toLocaleString("tr-TR") : "Başlamadı"}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Sorumlu</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {activeCount.createdBy || "Belirtilmemiş"}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Sayım Türü</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {activeCount.type} Sayım
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeCount.isLocked ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"}`}>
              {activeCount.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Depo Durumu</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {activeCount.isLocked ? "Kilitli (İşlem Yapılamaz)" : "Açık / Serbest"}
              </p>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Sayım Kalemleri</h3>
            <span className="text-xs text-slate-500 font-semibold">{activeCount.items.length} ürün listeleniyor</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">#</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Ürün Adı &amp; SKU</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Raf</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Sistem Stok</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Sayılan Stok</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Fark</th>
                  {isActive && <th className="px-5 py-3 text-right text-xs font-bold text-slate-400 tracking-wider border-b border-slate-100">İşlem</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeCount.items.map((item, index) => {
                  const hasDiff = item.difference !== null && item.difference !== 0;
                  const isEditing = editingItemId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.product.image ? (
                            <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden shrink-0 relative">
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                              <ClipboardCheck className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">{item.product.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {item.rack ? (
                          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.rack}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-600">
                        {item.systemStock.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              value={editingCounted}
                              onChange={(e) => setEditingCounted(e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-orange-300 rounded focus:border-orange-500 outline-none text-right font-bold"
                            />
                            <button
                              onClick={() => handleSaveItem(item.id)}
                              disabled={isPending}
                              className="p-1 bg-green-500 hover:bg-green-600 text-white rounded cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : item.countedStock !== null ? (
                          <span className="text-slate-800">{item.countedStock.toLocaleString("tr-TR")}</span>
                        ) : (
                          <span className="text-slate-350 italic">Sayılamadı</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {item.difference !== null ? (
                          <span
                            className={`font-bold text-xs ${
                              item.difference > 0
                                ? "text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
                                : item.difference < 0
                                ? "text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                                : "text-slate-400"
                            }`}
                          >
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      {isActive && (
                        <td className="px-5 py-3.5 text-right">
                          {!isEditing && (
                            <button
                              onClick={() => handleUpdateItem(item.id, item.countedStock)}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 text-slate-500 rounded transition cursor-pointer"
                            >
                              Sayılan Gir
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard/List view
  const filteredCounts = cycleCounts.filter((cc) => {
    const term = search.toLowerCase();
    return (
      cc.code.toLowerCase().includes(term) ||
      cc.warehouse.name.toLowerCase().includes(term) ||
      (cc.createdBy && cc.createdBy.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* List Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Sayım kodu, depo veya sorumlu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-805 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yeni Sayım Kartı Aç
          </button>
        </div>
      </div>

      {/* Main Cycle Counts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  #
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Sayım Kodu &amp; Tarih
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Depo &amp; Şube
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Ürün Sayısı
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Tür
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Durum
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCounts.length > 0 ? (
                filteredCounts.map((cc, index) => {
                  const dateStr = new Date(cc.createdAt).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <tr
                      key={cc.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => router.push(`?id=${cc.id}`)}
                    >
                      <td className="px-5 py-4 font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 text-sm group-hover:text-orange-600 transition-colors">
                          {cc.code}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">{cc.warehouse.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {cc.warehouse.branch.name} ({cc.warehouse.code})
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-semibold text-slate-800">{cc._count.items}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {cc.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            cc.status === "TASLAK"
                              ? "bg-slate-100 text-slate-700"
                              : cc.status === "DEVAM_EDIYOR"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : cc.status === "TAMAMLANDI"
                              ? "bg-green-50 text-green-700 border border-green-150"
                              : "bg-red-50 text-red-700 border border-red-150"
                          }`}
                        >
                          {cc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1 text-slate-400 group-hover:text-orange-600 transition-colors">
                          <span className="text-xs font-semibold hidden sm:inline">Detay &amp; Sayım Sayfası</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Henüz oluşturulmuş bir sayım işlemi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-orange-400" />
                  Yeni Sayım Başlat
                </h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">
                  ERP Stok Doğrulama
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Sayım Yapılacak Depo
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                >
                  <option value="">Depo Seçin...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code}) - {w.branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Sayım Türü
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["GENEL", "KISMI", "BARKODLU"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        type === t
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Özel Notlar
                </label>
                <textarea
                  placeholder="Sayım ile ilgili notlar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsCreateOpen(false)}
                disabled={isPending}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 font-semibold text-xs transition cursor-pointer disabled:opacity-55"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-55"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Sayım Kartı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

