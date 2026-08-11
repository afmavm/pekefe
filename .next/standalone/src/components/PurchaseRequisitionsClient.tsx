"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/navigation";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { 
  Search, Plus, Filter, Eye, Trash2, Calendar, 
  Layers, ChevronDown, RefreshCw, BarChart3, AlertCircle, 
  CheckCircle, XCircle, ArrowLeftRight, FileText, Check, Settings,
  AlertTriangle, ClipboardCheck, ClipboardList, Info
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  updatedAt: string;
  items: Array<{
    id: string;
    product: { name: string; sku: string; price: number; cost: number };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    warehouse: { name: string };
  }>;
}

export function PurchaseRequisitionsClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedApproval, setSelectedApproval] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Metadata Lists for Filter Dropdowns
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Selection and Comparison States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Requisitions
      const queryParams = new URLSearchParams();
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);
      if (selectedBranch) queryParams.append("branchId", selectedBranch);
      if (selectedDept) queryParams.append("departmentId", selectedDept);
      if (selectedPriority) queryParams.append("priority", selectedPriority);
      if (selectedStatus) queryParams.append("status", selectedStatus);
      if (selectedApproval) queryParams.append("approvalStatus", selectedApproval);

      const res = await fetch(`/api/purchase-requisitions?${queryParams.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRequisitions(data);

      // Extract unique departments for filtering
      const depts = new Set<string>();
      data.forEach((r: Requisition) => {
        if (r.departmentId) depts.add(r.departmentId);
      });
      setDepartments(Array.from(depts));
    } catch (error: any) {
      toast.error(error.message || "Talepler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Fetch Branches
    fetch("/api/branches")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBranches(d); });
  }, [selectedBranch, selectedDept, selectedPriority, selectedStatus, selectedApproval, fromDate, toDate]);

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/purchase-requisitions/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Talep başarıyla silindi.");
      setRequisitions(prev => prev.filter(r => r.id !== deleteId));
      setSelectedIds(prev => prev.filter(id => id !== deleteId));
    } catch (error: any) {
      toast.error(error.message || "Talep silinemedi.");
    } finally {
      setDeleteId(null);
    }
  };

  // Checkbox Selection Helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRequisitions.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filtered List based on Search Term
  const filteredRequisitions = requisitions.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.requisitionNo.toLowerCase().includes(term) ||
      (r.requester?.name || "").toLowerCase().includes(term) ||
      (r.notes || "").toLowerCase().includes(term)
    );
  });

  // Requisition Stats Calculation
  const totalCount = requisitions.length;
  const pendingCount = requisitions.filter(r => r.status === "Onay Bekliyor").length;
  const approvedCount = requisitions.filter(r => r.status === "Onaylandı").length;
  const totalBudget = requisitions.reduce((sum, r) => sum + r.totalAmount, 0);

  // Colors based on Priority
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "Düşük": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "Normal": return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40";
      case "Yüksek": return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40";
      case "Kritik": return "bg-red-50 text-red-700 border border-red-200 animate-pulse dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  // Colors based on Status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Taslak": return "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "Onay Bekliyor": return "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40";
      case "Onaylandı": return "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40";
      case "Reddedildi": return "bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40";
      case "Teklife Aktarıldı": return "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40";
      case "Siparişe Aktarıldı": return "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40";
      case "Tamamlandı": return "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/40";
      case "İptal": return "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  // Comparison items map construction
  const getComparisonData = () => {
    const selectedRequisitions = requisitions.filter(r => selectedIds.includes(r.id));
    const productsMap: Record<string, { name: string; sku: string; basePrice: number; details: Record<string, { quantity: number; unitPrice: number; totalPrice: number; warehouse: string }> }> = {};

    selectedRequisitions.forEach(req => {
      req.items.forEach(item => {
        const pId = item.product.sku;
        if (!productsMap[pId]) {
          productsMap[pId] = {
            name: item.product.name,
            sku: item.product.sku,
            basePrice: item.product.price,
            details: {}
          };
        }
        productsMap[pId].details[req.requisitionNo] = {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          warehouse: item.warehouse.name
        };
      });
    });

    return {
      requisitionNos: selectedRequisitions.map(r => r.requisitionNo),
      products: Object.values(productsMap)
    };
  };

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-6 dark:text-slate-100">
      {/* Upper Glassmorphism Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Satın Alma Talepleri</h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
            İşletme içi satın alma ihtiyaç taleplerini ve onay süreçlerini yönetin.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 1 && (
            <button
              onClick={() => setComparisonMode(prev => !prev)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-sm ${
                comparisonMode 
                  ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700" 
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-200 dark:border-slate-800"
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              {comparisonMode ? "Listeye Geri Dön" : `Talepleri Karşılaştır (${selectedIds.length})`}
            </button>
          )}

          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedBranch("");
              setSelectedDept("");
              setSelectedPriority("");
              setSelectedStatus("");
              setSelectedApproval("");
              setFromDate("");
              setToDate("");
              fetchData();
              toast.success("Filtreler temizlendi.");
            }}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 dark:border-slate-800 shadow-sm"
            title="Tazele / Temizle"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/muhasebe/purchase-requisitions/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md flex items-center gap-1 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Yeni Talep Oluştur
          </Link>
        </div>
      </div>

      {/* KPI Info Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Toplam Talep</span>
          <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalCount} Adet</span>
          <span className="text-[9px] text-slate-400 font-semibold block">Tüm şubeler dahil</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider">Onay Bekleyen</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">{pendingCount} Talep</span>
          <span className="text-[9px] text-slate-400 font-semibold block">Süreçteki talepler</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] text-emerald-500 font-bold block uppercase tracking-wider">Onaylanan</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{approvedCount} Talep</span>
          <span className="text-[9px] text-slate-400 font-semibold block">Siparişe hazır</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] text-indigo-500 font-bold block uppercase tracking-wider">Talep Hacmi</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalBudget, "TRY")}</span>
          <span className="text-[9px] text-slate-400 font-semibold block">Toplam tahmini bedel</span>
        </div>
      </div>

      {!comparisonMode ? (
        <>
          {/* Advanced Filter Panel */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                Detaylı Arama Filtreleri
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Talep No veya Talep Eden Ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-850 dark:text-slate-100 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all shadow-inner"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 transition-all shadow-inner"
              >
                <option value="">Tüm Şubeler</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 transition-all shadow-inner"
              >
                <option value="">Tüm Departmanlar</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={e => setSelectedPriority(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 transition-all shadow-inner"
              >
                <option value="">Tüm Öncelikler</option>
                <option value="Düşük">Düşük</option>
                <option value="Normal">Normal</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Kritik">Kritik</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 transition-all shadow-inner"
              >
                <option value="">Tüm Durumlar</option>
                <option value="Taslak">Taslak</option>
                <option value="Onay Bekliyor">Onay Bekliyor</option>
                <option value="Onaylandı">Onaylandı</option>
                <option value="Reddedildi">Reddedildi</option>
                <option value="Teklife Aktarıldı">Teklife Aktarıldı</option>
                <option value="Siparişe Aktarıldı">Siparişe Aktarıldı</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal">İptal</option>
              </select>

              {/* Approval Status Filter */}
              <select
                value={selectedApproval}
                onChange={e => setSelectedApproval(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 transition-all shadow-inner"
              >
                <option value="">Tüm Onay Durumları</option>
                <option value="Taslak">Taslak</option>
                <option value="Bekliyor">Onay Bekliyor</option>
                <option value="Onaylandı">Onaylandı</option>
                <option value="Reddedildi">Reddedildi</option>
                <option value="Revizyon">Revizyon İstendi</option>
              </select>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 col-span-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3.5 top-3 w-3 h-3 text-slate-400" />
                  <input 
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 transition-all shadow-inner"
                  />
                </div>
                <span className="text-slate-400 text-xs font-bold">-</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3.5 top-3 w-3 h-3 text-slate-400" />
                  <input 
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DataTable */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/75 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={filteredRequisitions.length > 0 && selectedIds.length === filteredRequisitions.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Talep No</th>
                    <th className="p-4">Talep Tarihi</th>
                    <th className="p-4">Talep Eden</th>
                    <th className="p-4">Departman</th>
                    <th className="p-4">Şube</th>
                    <th className="p-4">Öncelik</th>
                    <th className="p-4 text-right">Tahmini Tutar</th>
                    <th className="p-4 text-center">Durum</th>
                    <th className="p-4 text-center">Onay Durumu</th>
                    <th className="p-4 text-right">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <Settings className="w-5 h-5 animate-spin text-indigo-500" />
                          Talepler yükleniyor...
                        </div>
                      </td>
                    </tr>
                  ) : filteredRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                        Arama kriterlerine uygun talep bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredRequisitions.map(r => (
                      <tr 
                        key={r.id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all ${
                          selectedIds.includes(r.id) ? "bg-indigo-50/10 dark:bg-indigo-950/5" : ""
                        }`}
                      >
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => handleSelectOne(r.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <Link 
                            href={`/muhasebe/purchase-requisitions/${r.id}`}
                            className="font-black text-indigo-600 hover:text-indigo-700 hover:underline text-xs"
                          >
                            {r.requisitionNo}
                          </Link>
                        </td>
                        <td className="p-4 font-bold text-slate-600 dark:text-slate-400">
                          {new Date(r.requestDate).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100">{r.requester?.name || "Bilinmeyen Kullanıcı"}</div>
                          <div className="text-[10px] text-slate-400">{r.requester?.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {r.departmentId}
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {r.branch?.name}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getPriorityBadgeClass(r.priority)}`}>
                            {r.priority}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-slate-800 dark:text-slate-100">
                          {formatCurrency(r.totalAmount, "TRY")}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusBadgeClass(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            r.approvalStatus === "Onaylandı" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400" :
                            r.approvalStatus === "Reddedildi" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400" :
                            r.approvalStatus === "Revizyon" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400" :
                            "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400"
                          }`}>
                            {r.approvalStatus === "Onaylandı" ? <CheckCircle className="w-2.5 h-2.5" /> : 
                             r.approvalStatus === "Reddedildi" ? <XCircle className="w-2.5 h-2.5" /> : 
                             r.approvalStatus === "Revizyon" ? <AlertTriangle className="w-2.5 h-2.5" /> : 
                             <Info className="w-2.5 h-2.5" />}
                            {r.approvalStatus === "Bekliyor" ? "ONAY BEKLİYOR" : r.approvalStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link 
                              href={`/muhasebe/purchase-requisitions/${r.id}`}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition"
                              title="Detay Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {["Taslak", "Reddedildi", "Revizyon"].includes(r.status) && (
                              <button
                                onClick={() => setDeleteId(r.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-650 rounded-lg transition"
                                title="Talebi Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Requisition Comparison Dashboard */
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-purple-500 animate-pulse" />
                Seçilen Satın Alma Taleplerinin Karşılaştırılması
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Seçtiğiniz taleplerdeki ürünlerin birim fiyat ve miktarlarını yan yana görebilirsiniz.</p>
            </div>
            
            <button
              onClick={() => setComparisonMode(false)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black transition"
            >
              Listeye Dön
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Ürün (SKU)</th>
                  <th className="p-3 text-right">Mevcut Liste Fiyatı</th>
                  {comparisonData.requisitionNos.map(no => (
                    <th key={no} className="p-3 text-center border-l border-slate-100 dark:border-slate-850" colSpan={2}>
                      <span className="font-black text-indigo-600 block">{no}</span>
                      <span className="text-[9px] text-slate-400 lowercase font-medium">miktar / tahmini fiyat</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparisonData.products.map(prod => (
                  <tr key={prod.sku} className="hover:bg-slate-50/20">
                    <td className="p-3">
                      <div className="font-extrabold text-slate-850 dark:text-slate-100">{prod.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{prod.sku}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-400">
                      {formatCurrency(prod.basePrice, "TRY")}
                    </td>
                    {comparisonData.requisitionNos.map(no => {
                      const itemDetail = prod.details[no];
                      const isBestPrice = itemDetail && itemDetail.unitPrice > 0 && itemDetail.unitPrice < prod.basePrice;
                      return (
                        <React.Fragment key={no}>
                          <td className="p-3 text-center border-l border-slate-100 dark:border-slate-850 font-extrabold text-slate-700 dark:text-slate-300">
                            {itemDetail ? `${itemDetail.quantity} Adet` : "-"}
                          </td>
                          <td className={`p-3 text-right font-black ${
                            isBestPrice ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "text-slate-800 dark:text-slate-100"
                          }`}>
                            {itemDetail ? (
                              <div>
                                <div>{formatCurrency(itemDetail.unitPrice, "TRY")}</div>
                                <div className="text-[8px] text-slate-400 font-semibold">{formatCurrency(itemDetail.totalPrice, "TRY")}</div>
                              </div>
                            ) : "-"}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl flex items-start gap-2.5 border border-slate-200/50 dark:border-slate-850">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
              <strong className="text-slate-700 dark:text-slate-300 block mb-1">💡 Karşılaştırma Notu:</strong>
              Yeşil arka planlı fiyatlar, ilgili ürünün mevcut sistem katalog fiyatına göre daha avantajlı olan tahmini birim fiyat tekliflerini temsil eder. Bu talepleri onayladıktan sonra toplu olarak Teklife dönüştürebilir ve tedarikçilerden nihai fiyat tekliflerini talep edebilirsiniz.
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Talebi Sil"
        message="Bu satın alma talebini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
import React from "react";
