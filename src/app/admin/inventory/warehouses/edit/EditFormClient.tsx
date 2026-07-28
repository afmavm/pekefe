"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Warehouse,
  ArrowLeft,
  Save,
  Building2,
  Phone,
  MapPin,
  Code,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { updateBranchAction, updateWarehouseAction } from "@/modules/inventory/server/inventoryActions";

type BranchOption = {
  id: string;
  name: string;
  code: string;
};

interface EditFormClientProps {
  type: "branch" | "warehouse";
  record: any;
  branches: BranchOption[];
}

export default function EditFormClient({ type, record, branches }: EditFormClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form states initialized with existing record values
  const [name, setName] = useState(record?.name || "");
  const [codeVal, setCodeVal] = useState(record?.code || "");
  const [address, setAddress] = useState(record?.address || "");
  const [phone, setPhone] = useState(record?.phone || "");
  const [warehouseType, setWarehouseType] = useState(record?.type || "BRANCH");
  const [branchId, setBranchId] = useState(record?.branchId || branches[0]?.id || "");
  const [isActive, setIsActive] = useState(record?.isActive ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("İsim alanı zorunludur.");
      return;
    }
    if (!codeVal.trim()) {
      toast.error("Kod alanı zorunludur.");
      return;
    }

    setLoading(true);

    try {
      if (type === "branch") {
        const res = await updateBranchAction(record.id, {
          name: name.trim(),
          code: codeVal.trim().toUpperCase(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          isActive,
        });

        if (res.success) {
          toast.success("Şube başarıyla güncellendi.");
          router.push("/admin/inventory/warehouses");
          router.refresh();
        } else {
          toast.error(res.error || "Şube güncellenirken bir hata oluştu.");
        }
      } else {
        if (!branchId) {
          toast.error("Deponun bağlı olduğu bir şube seçilmelidir.");
          setLoading(false);
          return;
        }

        const res = await updateWarehouseAction(record.id, {
          name: name.trim(),
          code: codeVal.trim().toUpperCase(),
          type: warehouseType,
          address: address.trim() || null,
          branchId,
          isActive,
        });

        if (res.success) {
          toast.success("Depo başarıyla güncellendi.");
          router.push("/admin/inventory/warehouses");
          router.refresh();
        } else {
          toast.error(res.error || "Depo güncellenirken bir hata oluştu.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/inventory/warehouses")}
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Hiyerarşiye Geri Dön
      </button>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          {type === "branch" ? (
            <Store className="h-6 w-6" />
          ) : (
            <Warehouse className="h-6 w-6" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {type === "branch" ? "Şubeyi Düzenle" : "Depoyu Düzenle"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {type === "branch" ? `"${record?.name}" şubesinin bilgilerini güncelleyin.` : `"${record?.name}" deposunun bilgilerini güncelleyin.`}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Name input */}
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
            {type === "branch" ? "Şube Adı" : "Depo Adı"} *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "branch" ? "Şube Adı" : "Depo Adı"}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 focus:bg-white focus:border-orange-400 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* Code input */}
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
            {type === "branch" ? "Şube Kodu" : "Depo Kodu"} *
          </label>
          <div className="relative">
            <Code className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={codeVal}
              onChange={(e) => setCodeVal(e.target.value)}
              placeholder={type === "branch" ? "Şube Kodu" : "Depo Kodu"}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 focus:bg-white focus:border-orange-400 outline-none transition-all"
              required
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Kodlar benzersiz olmalı ve sistem içinde referans amacıyla kullanılacaktır.
          </p>
        </div>

        {/* Warehouse specific fields */}
        {type === "warehouse" && (
          <>
            {/* Warehouse Type selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
                Depo Tipi *
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={warehouseType}
                  onChange={(e) => setWarehouseType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 focus:bg-white focus:border-orange-400 outline-none transition-all"
                >
                  <option value="MAIN">Ana Depo (MAIN)</option>
                  <option value="BRANCH">Şube Deposu (BRANCH)</option>
                  <option value="TRANSIT">Transit Depo (TRANSIT)</option>
                  <option value="VIRTUAL">Sanal Depo (VIRTUAL)</option>
                  <option value="CONSIGNMENT">Konsinye Depo (CONSIGNMENT)</option>
                </select>
              </div>
            </div>

            {/* Branch Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
                Bağlı Olduğu Şube *
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 focus:bg-white focus:border-orange-400 outline-none transition-all"
                  required
                >
                  <option value="" disabled>Şube seçiniz...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Phone input (Branch specific) */}
        {type === "branch" && (
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
              Telefon Numarası
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon Numarası"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 focus:bg-white focus:border-orange-400 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Address textarea */}
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
            Adres
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Tam adres bilgisi..."
              rows={3}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-800 focus:bg-white focus:border-orange-400 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Active Toggle Switch */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-5">
          <div>
            <span className="text-sm font-semibold text-slate-800 block">
              Aktiflik Durumu
            </span>
            <span className="text-xs text-slate-400">
              Devre dışı bırakıldığında bu {type === "branch" ? "şube" : "depo"} üzerinden stok işlemleri yapılamaz.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              isActive ? "bg-orange-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            disabled={loading}
            onClick={() => router.push("/admin/inventory/warehouses")}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

