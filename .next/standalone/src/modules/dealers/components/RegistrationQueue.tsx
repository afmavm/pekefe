"use client";

import React, { useState } from "react";
import { 
  Clock, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  AlertCircle, 
  Check, 
  X, 
  Calendar,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface PendingApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  taxNumber: string;
  taxOffice: string;
  createdAt: Date;
  status: string;
}

interface RegistrationQueueProps {
  applications: PendingApplication[];
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
}

export default function RegistrationQueue({
  applications,
  onApprove,
  onReject
}: RegistrationQueueProps) {
  const [actionId, setActionId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const success = await onApprove(id);
      if (success) {
        toast.success("Cari başvurusu onaylandı ve cari hesap kartı oluşturuldu.");
      }
    } catch (err) {
      toast.error("Onaylama sırasında bir hata oluştu.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Bu cari başvuruyu reddetmek ve tüm kayıtlarını silmek istediğinize emin misiniz?")) {
      return;
    }
    setActionId(id);
    try {
      const success = await onReject(id);
      if (success) {
        toast.success("Cari başvurusu reddedildi ve silindi.");
      }
    } catch (err) {
      toast.error("Reddetme işlemi sırasında hata oluştu.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
          Yeni Üyelik &amp; Kayıt Talepleri
        </h3>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
          B2B Portaldan yapılan onay bekleyen kurumsal cari hesap başvuruları
        </p>
      </div>

      {/* Grid List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Firma Detayı</th>
                <th className="px-6 py-5">Vergi Dairesi / No</th>
                <th className="px-6 py-5">İletişim Yetkilisi</th>
                <th className="px-6 py-5">Tarih</th>
                <th className="px-6 py-5">Durum</th>
                <th className="px-6 py-5 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Onay bekleyen kayıt başvurusu bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const isLoading = actionId === app.id;
                  const formattedDate = new Date(app.createdAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  });

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs border border-orange-100">
                            {app.companyName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 uppercase truncate">
                              {app.companyName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{app.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        <div className="space-y-0.5">
                          <p className="uppercase">{app.taxOffice} V.D.</p>
                          <p className="text-[9px] text-slate-400 font-semibold">No: {app.taxNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-slate-700 font-semibold">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{app.contactName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{app.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3 animate-pulse" />
                          BEKLEMEDE
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={isLoading}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-100 transition cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                            title="Onayla"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={isLoading}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                            title="Reddet"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
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
  );
}
