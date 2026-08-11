"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/navigation";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  ClipboardList, ArrowLeft, CheckCircle, XCircle, 
  AlertTriangle, MessageSquare, Calendar, Building,
  User, Layers, DollarSign, Package, Send, ArrowRight,
  UserCheck, ShieldCheck, ChevronRight, CornerDownRight,
  Clock, FileText, BadgeAlert, HelpCircle
} from "lucide-react";

interface RequisitionApproval {
  id: string;
  approver: { name: string; email: string };
  action: string;
  comment?: string;
  approvalDate: string;
}

interface Requisition {
  id: string;
  requisitionNo: string;
  requestDate: string;
  branchId: string;
  branch: { name: string; code: string };
  departmentId: string;
  requesterId: string;
  requester: { name: string; email: string };
  projectId?: string;
  costCenterId?: string;
  priority: string;
  status: string;
  approvalStatus: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    product: { name: string; sku: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    warehouse: { name: string };
  }>;
  approvals: RequisitionApproval[];
}

interface CurrentAccount {
  id: string;
  name: string;
  cariKod: string;
}

export function RequisitionDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session } = useSession();

  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Suppliers for siparişe dönüştür
  const [suppliers, setSuppliers] = useState<CurrentAccount[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  // Approval Inputs
  const [approverRole, setApproverRole] = useState<"BOLUM_SORUMLUSU" | "SATINALMA_MUDURU" | "GENEL_MUDUR" | "YONETIM_KURULU">("BOLUM_SORUMLUSU");
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Conversion Result
  const [conversionResult, setConversionResult] = useState<{ documentNo: string; message: string } | null>(null);

  // Fetch requisition details
  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/purchase-requisitions/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRequisition(data);
    } catch (error: any) {
      toast.error(error.message || "Talep bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
    
    // Fetch potential suppliers for conversion
    fetch("/api/dealers")
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setSuppliers(d);
          if (d.length > 0) setSelectedSupplierId(d[0].id);
        }
      });
  }, [id]);

  // Handle Approval Action
  const handleApprovalAction = async (action: "Onayla" | "Reddet" | "Revizyona Gönder" | "Yorum Ekle") => {
    if (!requisition) return;
    
    // If not just comment, require comment on rejection/revision
    if ((action === "Reddet" || action === "Revizyona Gönder") && !comment.trim()) {
      toast.error("Reddetme veya revizyon işlemleri için açıklama girmek zorunludur.");
      return;
    }

    setActionLoading(true);
    const toastId = toast.loading("İşlem kaydediliyor...");
    try {
      // Find current user id
      let currentUserId = requisition.requesterId; // fallback
      if (session?.user?.email) {
        // Query user info
        const userRes = await fetch("/api/users");
        const users = await userRes.json();
        const matched = users.find((u: any) => u.email === session.user?.email);
        if (matched) currentUserId = matched.id;
      }

      const res = await fetch(`/api/purchase-requisitions/${id}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approverId: currentUserId,
          approverRole,
          action,
          comment: comment || null
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Onay / işlem kaydı başarıyla eklendi.", { id: toastId });
      setComment("");
      fetchDetails();
    } catch (error: any) {
      toast.error(error.message || "İşlem kaydedilirken hata oluştu.", { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // Convert to Offer / Order
  const handleConvert = async (targetType: "offer" | "order") => {
    if (!requisition) return;

    setActionLoading(true);
    const toastId = toast.loading(targetType === "order" ? "Sipariş oluşturuluyor..." : "Teklif oluşturuluyor...");
    try {
      const res = await fetch(`/api/purchase-requisitions/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          supplierId: targetType === "order" ? selectedSupplierId : undefined
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(data.message, { id: toastId });
      setConversionResult({
        documentNo: data.documentNo,
        message: data.message
      });
      fetchDetails();
    } catch (error: any) {
      toast.error(error.message || "Dönüştürme işlemi başarısız oldu.", { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Clock className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-2 font-black text-xs text-slate-400">Talep detayları yükleniyor...</span>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Talep Bulunamadı</h2>
        <p className="text-xs text-slate-400">İstediğiniz satın alma talebi mevcut değil veya silinmiş olabilir.</p>
        <button 
          onClick={() => router.push("/muhasebe/purchase-requisitions")}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition"
        >
          Listeye Geri Dön
        </button>
      </div>
    );
  }

  // Workflows limits helper
  const getApprovalRequiredLevel = (amount: number) => {
    if (amount <= 25000) return "Bölüm Sorumlusu";
    if (amount <= 100000) return "Satın Alma Müdürü";
    if (amount <= 500000) return "Genel Müdür";
    return "Yönetim Kurulu";
  };

  // Timeline steps state
  const steps = [
    { label: "Taslak", desc: "Talep Hazırlanıyor", key: "Taslak" },
    { label: "Onay Bekliyor", desc: "Süreçte", key: "Onay Bekliyor" },
    { label: "Onaylandı", desc: "Siparişe Hazır", key: "Onaylandı" },
    { label: "Aktarıldı", desc: "Teklif / Sipariş", key: ["Teklife Aktarıldı", "Siparişe Aktarıldı"] }
  ];

  const getStepIndex = (status: string) => {
    if (status === "Taslak" || status === "Revizyon") return 0;
    if (status === "Onay Bekliyor") return 1;
    if (status === "Onaylandı") return 2;
    if (status === "Teklife Aktarıldı" || status === "Siparişe Aktarıldı" || status === "Tamamlandı") return 3;
    return -1; // rejected / cancelled
  };

  const currentStepIdx = getStepIndex(requisition.status);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/muhasebe/purchase-requisitions")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-850"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-800 dark:text-white">
                Talep Detayı: {requisition.requisitionNo}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                requisition.status === "Taslak" ? "bg-slate-100 text-slate-700" :
                requisition.status === "Onay Bekliyor" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                requisition.status === "Onaylandı" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                requisition.status === "Reddedildi" ? "bg-red-100 text-red-800 border border-red-200" :
                "bg-indigo-100 text-indigo-800"
              }`}>
                {requisition.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Talep edilen kalemleri inceleyin ve onay sürecini yönetin.</p>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/muhasebe/purchase-requisitions"
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition shadow-sm"
        >
          Tüm Taleplere Dön
        </Link>
      </div>

      {/* Dynamic Timeline Steps */}
      {requisition.status !== "Reddedildi" && requisition.status !== "İptal" && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
            {steps.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isActive = currentStepIdx === idx;
              
              return (
                <div key={idx} className="flex-1 w-full flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all border ${
                      isCompleted 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                        : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-800"
                    } ${isActive ? "scale-110 ring-4 ring-indigo-500/10" : ""}`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <span className={`text-[11px] font-black block ${isCompleted ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-bold mt-0.5">{step.desc}</span>
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block flex-1 h-[2px] mx-4 bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full bg-indigo-500 transition-all ${isCompleted && currentStepIdx > idx ? "w-full" : "w-0"}`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Requisition Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details and Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Building className="w-4 h-4 text-indigo-500" /> Talep Künye Bilgileri
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Talep Eden</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{requisition.requester?.name}</span>
                <span className="text-[9px] text-slate-400 block truncate">{requisition.requester?.email}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Departman / Şube</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{requisition.departmentId}</span>
                <span className="text-[9px] text-slate-400 block">{requisition.branch?.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Talep Tarihi</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                  {new Date(requisition.requestDate).toLocaleDateString("tr-TR")}
                </span>
                <span className="text-[9px] text-slate-400 block">Beklenen: {new Date(requisition.expectedDeliveryDate).toLocaleDateString("tr-TR")}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">Finansal Hedef</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                  {requisition.costCenterId ? `Masraf M: ${requisition.costCenterId}` : "Masraf Merkezi Belirtilmemiş"}
                </span>
                <span className="text-[9px] text-slate-400 block">Proje: {requisition.projectId || "Yok"}</span>
              </div>
            </div>

            {requisition.notes && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1 mt-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Açıklama & Gerekçe</span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-350 font-bold">{requisition.notes}</p>
              </div>
            )}
          </div>

          {/* Requested Items Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" /> Talep Edilen Kalemler
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Ürün (SKU)</th>
                    <th className="px-4 py-3 text-center">Talep Miktarı</th>
                    <th className="px-4 py-3 text-right">Tahmini Birim Fiyat</th>
                    <th className="px-4 py-3 text-center">Depo</th>
                    <th className="px-4 py-3 text-right">Satır Toplamı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requisition.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">{item.product?.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{item.product?.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-extrabold text-slate-700 dark:text-slate-300">
                        {item.quantity} Adet
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.unitPrice, "TRY")}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {item.warehouse?.name}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-850 dark:text-slate-100">
                        {formatCurrency(item.totalPrice, "TRY")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <div className="flex justify-between font-black text-slate-800 dark:text-slate-200 text-sm">
                  <span>Genel Toplam:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(requisition.totalAmount, "TRY")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Workflow approval panel & Conversion flow */}
        <div className="space-y-6">
          {/* Approval Info panel */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Onay Limit Kademesi
            </h3>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-850 rounded-xl">
              <div className="flex justify-between font-extrabold text-slate-500">
                <span>ONAY EŞİĞİ</span>
                <span>GEREKLİ ONACILAR</span>
              </div>
              <div className="flex justify-between text-slate-800 dark:text-slate-250 font-black">
                <span>{formatCurrency(requisition.totalAmount, "TRY")}</span>
                <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{getApprovalRequiredLevel(requisition.totalAmount)}</span>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal font-bold">
              Kural Motoruna Göre:
              <br />• 0 - 25.000 TL → Bölüm Sorumlusu
              <br />• 25.000 - 100.000 TL → Satın Alma Müdürü
              <br />• 100.000 - 500.000 TL → Genel Müdür
              <br />• 500.000 TL üzeri → Yönetim Kurulu
            </p>
          </div>

          {/* Real-time Approval Action Form */}
          {requisition.status === "Onay Bekliyor" && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <UserCheck className="w-4 h-4 text-indigo-500 animate-pulse" /> Onay İşlemi Gerçekleştir
              </h3>

              <div className="space-y-3">
                {/* Mock Approver Role selection for Testing workflow limits */}
                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] text-slate-400 uppercase block">Onaylayıcı Rolü (Demo/Test Seçimi)</label>
                  <select
                    value={approverRole}
                    onChange={e => setApproverRole(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs"
                  >
                    <option value="BOLUM_SORUMLUSU">Bölüm Sorumlusu</option>
                    <option value="SATINALMA_MUDURU">Satın Alma Müdürü</option>
                    <option value="GENEL_MUDUR">Genel Müdür</option>
                    <option value="YONETIM_KURULU">Yönetim Kurulu Üyesi</option>
                  </select>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1">
                  <label className="font-extrabold text-[10px] text-slate-400 uppercase block">Açıklama / Yorum</label>
                  <textarea
                    rows={2} placeholder="Yorum ekleyin..."
                    value={comment} onChange={e => setComment(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs resize-none"
                  />
                </div>

                {/* Actions Button Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleApprovalAction("Onayla")}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Onayla
                  </button>
                  <button
                    onClick={() => handleApprovalAction("Reddet")}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reddet
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApprovalAction("Revizyona Gönder")}
                    disabled={actionLoading}
                    className="px-3 py-2 border border-amber-300 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl font-black transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Revizyon
                  </button>
                  <button
                    onClick={() => handleApprovalAction("Yorum Ekle")}
                    disabled={actionLoading}
                    className="px-3 py-2 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Yorum Ekle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conversion Flow (If Approved) */}
          {requisition.status === "Onaylandı" && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" /> Süreci Sonlandır / Aktar
              </h3>

              {!conversionResult ? (
                <div className="space-y-3">
                  {/* Select supplier */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-[10px] text-slate-400 uppercase block">Tedarikçi Seçimi (Sipariş İçin)</label>
                    <select
                      value={selectedSupplierId}
                      onChange={e => setSelectedSupplierId(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs"
                    >
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name} ({sup.cariKod})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleConvert("order")}
                      disabled={actionLoading}
                      className="w-full px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      Siparişe Dönüştür (Aktar) <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleConvert("offer")}
                      disabled={actionLoading}
                      className="w-full px-3 py-2.5 border border-purple-300 hover:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-xl font-black transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      Teklife Dönüştür (Aktar) <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2 text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-center gap-1 font-black text-xs">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Dönüştürme Tamamlandı
                  </div>
                  <p className="text-[10px] font-semibold leading-relaxed">
                    Talep başarıyla kapatılmıştır. Oluşturulan evrak numarası:
                    <strong className="block text-slate-800 dark:text-white mt-1 text-xs font-mono">{conversionResult.documentNo}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs / Approval History */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm text-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <FileText className="w-4 h-4 text-indigo-500" /> Talep Onay Tarihçesi ve Audit Log
        </h3>

        {requisition.approvals.length === 0 ? (
          <p className="text-slate-400 font-bold py-2">Henüz herhangi bir onay hareketi bulunmamaktadır.</p>
        ) : (
          <div className="space-y-4">
            {requisition.approvals.map((app, idx) => (
              <div key={app.id} className="flex gap-3 items-start">
                <div className={`p-1.5 rounded-full shrink-0 ${
                  app.action === "Onaylandı" || app.action === "Onay Bekliyor" ? "bg-emerald-500/10 text-emerald-600" :
                  app.action === "Reddet" || app.action === "Reddedildi" ? "bg-red-500/10 text-red-650" :
                  app.action === "Revizyona Gönder" || app.action === "Revizyon" ? "bg-amber-500/10 text-amber-600" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {app.action === "Onaylandı" ? <CheckCircle className="w-4 h-4" /> :
                   app.action === "Reddet" || app.action === "Reddedildi" ? <XCircle className="w-4 h-4" /> :
                   app.action === "Revizyona Gönder" || app.action === "Revizyon" ? <AlertTriangle className="w-4 h-4" /> :
                   <MessageSquare className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{app.approver?.name || "Kullanıcı"}</span>
                    <span className="text-[10px] text-slate-400">({app.approver?.email})</span>
                    <span className="text-[9px] text-slate-400 font-bold">•</span>
                    <span className="text-[9px] text-slate-400 font-bold">{new Date(app.approvalDate).toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                    Eylem: <strong className="uppercase">{app.action}</strong>
                  </div>
                  {app.comment && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-600 dark:text-slate-350 leading-relaxed font-bold mt-1 max-w-2xl flex gap-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{app.comment}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
