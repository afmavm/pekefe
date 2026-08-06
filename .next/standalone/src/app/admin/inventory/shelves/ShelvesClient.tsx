"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Store,
  Search,
  Warehouse as WarehouseIcon,
  Plus,
  Edit2,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { updateShelfLocationAction } from "@/modules/inventory/server/inventoryActions";

interface ShelfLocation {
  id: string;
  productId: string;
  warehouseId: string;
  stock: number;
  rack: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    image: string | null;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
    branch: {
      name: string;
    };
  };
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  branch: {
    name: string;
  };
}

interface ShelvesClientProps {
  locations: ShelfLocation[];
  warehouses: Warehouse[];
  selectedWarehouseId: string;
}

export default function ShelvesClient({
  locations,
  warehouses,
  selectedWarehouseId,
}: ShelvesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState(selectedWarehouseId);
  
  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<ShelfLocation | null>(null);
  const [newRack, setNewRack] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleWarehouseChange = (id: string) => {
    setWarehouseFilter(id);
    const params = new URLSearchParams();
    if (id) params.set("warehouseId", id);
    router.push(`?${params.toString()}`);
  };

  const openEditModal = (loc: ShelfLocation) => {
    setEditingLoc(loc);
    setNewRack(loc.rack || "");
    setValidationError("");
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingLoc(null);
    setNewRack("");
    setValidationError("");
  };

  const handleSave = () => {
    // Validate format: A-01-03
    const formatRegex = /^[A-Z]{1,2}-\d{2}-\d{2}$/;
    if (!formatRegex.test(newRack)) {
      setValidationError("Raf formatı geçersiz. Format: [Blok]-[Raf]-[Göz] (Örn: A-01-03 veya AA-02-12)");
      return;
    }

    if (!editingLoc) return;

    startTransition(async () => {
      const res = await updateShelfLocationAction({
        productId: editingLoc.product.id,
        warehouseId: editingLoc.warehouseId,
        rack: newRack,
      });

      if (res.success) {
        toast.success("Raf adresi başarıyla güncellendi.");
        closeEditModal();
        router.refresh();
      } else {
        toast.error(res.error || "Güncelleme sırasında bir hata oluştu.");
      }
    });
  };

  const filteredLocations = locations.filter((loc) => {
    const term = search.toLowerCase();
    return (
      loc.product.name.toLowerCase().includes(term) ||
      loc.product.sku.toLowerCase().includes(term) ||
      (loc.rack && loc.rack.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search & Warehouse Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ürün adı, SKU veya raf kodu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px]">
              <WarehouseIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={warehouseFilter}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
              >
                <option value="">Tüm Depolar</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) - {w.branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  #
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Ürün Adı &amp; SKU
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Depo &amp; Şube
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Mevcut Stok
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  WMS Raf Adresi
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, index) => (
                  <tr
                    key={loc.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-5 py-4 font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {loc.product.image ? (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 relative">
                            <Image
                              src={loc.product.image}
                              alt={loc.product.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                            <Store className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800 text-sm group-hover:text-orange-600 transition-colors">
                            {loc.product.name}
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5">
                            {loc.product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-700">
                        {loc.warehouse.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {loc.warehouse.branch.name} ({loc.warehouse.code})
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                        {loc.stock.toLocaleString("tr-TR")} Adet
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {loc.rack ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-700 font-mono text-xs font-black border border-orange-100 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          {loc.rack}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-350 italic">Adres Tanımsız</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 text-slate-500 font-semibold text-xs transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Adres Düzenle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Kayıt bulunamadı. Arama kriterlerini değiştirin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Shelf Address Modal */}
      {isEditOpen && editingLoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-400" />
                  Raf Adresi Güncelle
                </h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">
                  {editingLoc.warehouse.name}
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ürün</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{editingLoc.product.name}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{editingLoc.product.sku}</p>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  WMS Raf Adresi (Format: A-01-03)
                </label>
                <input
                  type="text"
                  placeholder="Örn: A-01-03"
                  value={newRack}
                  onChange={(e) => {
                    setNewRack(e.target.value.toUpperCase());
                    setValidationError("");
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm uppercase text-slate-800 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
                />
                
                {validationError ? (
                  <p className="text-xs text-red-500 font-medium mt-1 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {validationError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Format Kuralları: Blok (Harf) - Raf No (2 Hane) - Göz No (2 Hane)
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 justify-end">
              <button
                onClick={closeEditModal}
                disabled={isPending}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 font-semibold text-xs transition cursor-pointer disabled:opacity-55"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-55"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

