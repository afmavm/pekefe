"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  createProductionPlanAction, 
  deleteProductionPlanAction, 
  updateProductionPlanStatusAction 
} from "@/modules/production/server/productionActions";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  FileText, 
  Play, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";

interface PlansClientProps {
  initialData: any;
}

export default function PlansClient({ initialData }: PlansClientProps) {
  const [plans, setPlans] = useState<any[]>(initialData.productionPlans || []);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const res = await createProductionPlanAction({ name, startDate, endDate });
      if (res.success && res.data) {
        toast.success("Üretim planı başarıyla oluşturuldu.");
        setPlans([res.data, ...plans]);
        setName("");
        setStartDate("");
        setEndDate("");
      } else {
        toast.error(res.error || "Plan oluşturulurken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await updateProductionPlanStatusAction(id, newStatus);
      if (res.success && res.data) {
        toast.success(`Plan durumu '${newStatus}' olarak güncellendi.`);
        setPlans(plans.map(p => p.id === id ? { ...p, status: newStatus } : p));
      } else {
        toast.error(res.error || "Durum güncellenirken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası oluştu.");
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Bu planı silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await deleteProductionPlanAction(id);
      if (res.success) {
        toast.success("Plan silindi.");
        setPlans(plans.filter(p => p.id !== id));
      } else {
        toast.error(res.error || "Plan silinirken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası oluştu.");
    }
  };

  // Stats
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === "ONAYLANDI").length;
  const completedPlans = plans.filter(p => p.status === "TAMAMLANDI").length;
  const draftPlans = plans.filter(p => p.status === "TASLAK").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-8 h-8 text-orange-500" />
            ÜRETİM PLANLARI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            İmalat süreçlerinizi takvim üzerinde planlayın, hedefleri ve durumları takip edin.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors hover:border-orange-200">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalPlans}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Toplam Plan</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors hover:border-orange-200">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{activePlans}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Aktif / Onaylı</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors hover:border-orange-200">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{completedPlans}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tamamlanan</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 group transition-colors hover:border-orange-200">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{draftPlans}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Taslak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Plan Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            Yeni Üretim Planı Oluştur
          </h2>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Plan Adı / Başlık</label>
              <input
                type="text"
                placeholder="Örn: 2026 Haziran Petek Balı Planı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Başlangıç Tarihi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition-all text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Plan Oluşturuluyor..." : "Planı Kaydet"}
            </button>
          </form>
        </div>

        {/* Plans Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700">Üretim Plan Listesi</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Sıra No</th>
                  <th className="p-4">Plan Adı</th>
                  <th className="p-4">Tarih Aralığı</th>
                  <th className="p-4">İş Emri Sayısı</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      Tanımlı üretim planı bulunmamaktadır. Sol taraftan yeni bir plan ekleyebilirsiniz.
                    </td>
                  </tr>
                ) : (
                  plans.map((plan, index) => {
                    const startStr = new Date(plan.startDate).toLocaleDateString("tr-TR");
                    const endStr = new Date(plan.endDate).toLocaleDateString("tr-TR");
                    
                    let statusBadge = null;
                    if (plan.status === "TASLAK") {
                      statusBadge = <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">TASLAK</span>;
                    } else if (plan.status === "ONAYLANDI") {
                      statusBadge = <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">ONAYLI</span>;
                    } else if (plan.status === "TAMAMLANDI") {
                      statusBadge = <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">TAMAMLANDI</span>;
                    } else {
                      statusBadge = <span className="px-2 py-1 rounded bg-slate-50 text-slate-600 text-[10px] font-bold border border-slate-100">{plan.status}</span>;
                    }

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors text-slate-700">
                        <td className="p-4 font-bold text-xs">{index + 1}</td>
                        <td className="p-4 font-semibold text-sm">{plan.name}</td>
                        <td className="p-4 text-xs text-slate-500">{startStr} - {endStr}</td>
                        <td className="p-4 text-xs text-center font-bold text-slate-800">{plan.orders?.length || 0}</td>
                        <td className="p-4">{statusBadge}</td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {plan.status === "TASLAK" && (
                            <button
                              onClick={() => handleUpdateStatus(plan.id, "ONAYLANDI")}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-100 transition"
                              title="Planı Onayla"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {plan.status === "ONAYLANDI" && (
                            <button
                              onClick={() => handleUpdateStatus(plan.id, "TAMAMLANDI")}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-100 transition"
                              title="Planı Tamamla"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition"
                            title="Planı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

