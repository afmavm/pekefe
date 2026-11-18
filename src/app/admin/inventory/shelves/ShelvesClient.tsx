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
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-9 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:bg-white focus:border-[#6b1d2f] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/10 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px]">
              <WarehouseIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <select
                value={warehouseFilter}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50/50 pl-9 pr-10 text-xs font-medium text-stone-700 focus:bg-white focus:border-[#6b1d2f] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/10 transition cursor-pointer"
              >
                <option value="">Tüm Depolar</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) - {w.branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200/80 text-sm">
            <thead>
              <tr className="bg-[#faf8f5]">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-200/80">
                  #
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-200/80">
                  Ürün Adı &amp; SKU
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-200/80">
                  Depo &amp; Şube
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-200/80">
                  Mevcut Stok
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-200/80">
                  WMS Raf Adresi
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-stone-500 tracking-wider border-b border-stone-200/80">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, index) => (
                  <tr
                    key={loc.id}
                    className="hover:bg-stone-50/70 transition-colors group"
                  >
                    <td className="px-5 py-4 font-medium text-stone-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {loc.product.image ? (
                          <div className="w-10 h-10 rounded-lg border border-stone-200 overflow-hidden shrink-0 relative">
                            <Image
                              src={loc.product.image}
                              alt={loc.product.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-center text-stone-400 flex-shrink-0">
                            <Store className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-stone-800 text-sm group-hover:text-[#6b1d2f] transition-colors">
                            {loc.product.name}
                          </div>
                          <div className="text-xs font-mono text-stone-400 mt-0.5">
                            {loc.product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-stone-700">
                        {loc.warehouse.name}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {loc.warehouse.branch.name} ({loc.warehouse.code})
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200/60">
                        {loc.stock.toLocaleString("tr-TR")} Adet
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {loc.rack ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f] font-mono text-xs font-bold border border-[#6b1d2f]/20 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-[#6b1d2f] animate-pulse" />
                          {loc.rack}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">Adres Tanımsız</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200/90 hover:border-[#6b1d2f]/30 hover:bg-[#6b1d2f]/5 hover:text-[#6b1d2f] text-stone-600 font-semibold text-xs transition cursor-pointer shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Adres Düzenle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400">
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
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200/80 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-[#faf8f5] border-b border-stone-200/80 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#6b1d2f]/10 rounded-xl flex items-center justify-center border border-[#6b1d2f]/15 text-[#6b1d2f]">
                  <Store className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-stone-900 tracking-tight leading-tight">
                    Raf Adresi Güncelle
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    {editingLoc.warehouse.name} ({editingLoc.warehouse.code})
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 rounded-xl bg-white hover:bg-stone-100 text-stone-400 hover:text-stone-600 border border-stone-200/60 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-stone-50/70 border border-stone-200/80 rounded-xl">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Tanımlı Ürün</span>
                <p className="text-sm font-semibold text-stone-800 mt-0.5">{editingLoc.product.name}</p>
                <p className="text-xs font-mono text-stone-500 mt-0.5">{editingLoc.product.sku}</p>
              </div>

              <div>
                <label className="text-[11px] text-stone-600 font-bold uppercase tracking-wider block mb-1">
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
                  className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 font-mono text-sm uppercase text-stone-800 placeholder:text-stone-400 focus:bg-white focus:border-[#6b1d2f] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/10 transition"
                />
                
                {validationError ? (
                  <p className="text-xs text-red-600 font-medium mt-1.5 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {validationError}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-500 mt-1">
                    Format Kuralları: Blok (Harf) - Raf No (2 Hane) - Göz No (2 Hane)
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#faf8f5] border-t border-stone-200/80 flex items-center gap-2.5 justify-end">
              <button
                onClick={closeEditModal}
                disabled={isPending}
                className="px-4 py-2 border border-stone-200/90 bg-white text-stone-700 rounded-xl hover:bg-stone-100 font-semibold text-xs transition cursor-pointer shadow-2xs disabled:opacity-55"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#6b1d2f] hover:bg-[#541624] text-white rounded-xl font-semibold text-xs transition cursor-pointer border-none shadow-xs disabled:opacity-55"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

