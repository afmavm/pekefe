"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  Download,
  Search,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Package,
  Calendar,
  Building2,
  Printer,
  User,
  Fingerprint,
  Sparkles,
  ShieldAlert,
  Sliders,
  FileCode
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DespatchAdvice {
  id: string;
  despatchNo: string;
  ettnNo: string;
  status: string;
  issueDate: string;
  actualDespatchDate: string;
  licensePlate?: string;
  driverName?: string;
  driverIdentityNo?: string;
  carrierId?: string;
  customerAccount?: { name: string; taxId?: string };
  invoice?: { id: string } | null;
  lines?: { quantity: number; product?: { name: string; sku: string } }[];
}

interface CurrentAccount {
  id: string;
  name: string;
  type: string;
  taxId?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    Draft:     { cls: "bg-slate-100 text-slate-705 border-slate-300/80",   icon: Clock, label: "Taslak" },
    Sent:      { cls: "bg-blue-50 text-blue-700 border-blue-200",      icon: Truck, label: "Gönderildi" },
    Approved:  { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Onaylandı" },
    Cancelled: { cls: "bg-rose-50 text-rose-700 border-rose-200",         icon: X, label: "İptal" }
  };
  
  let key = status;
  if (status) {
    const sUpper = status.toUpperCase();
    if (sUpper === "SEVK_EDILDI" || sUpper === "SENT") key = "Sent";
    else if (sUpper === "DRAFT" || sUpper === "TASLAK") key = "Draft";
    else if (sUpper === "APPROVED" || sUpper === "ONAYLANDI") key = "Approved";
    else if (sUpper === "CANCELLED" || sUpper === "IPTAL") key = "Cancelled";
  }

  const config = map[key] ?? map["Draft"];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${config.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DespatchAdminPage() {
  const [despatches, setDespatches] = useState<DespatchAdvice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [xmlLoading, setXmlLoading] = useState<string | null>(null);
  const [approveLoading, setApproveLoading] = useState<string | null>(null);

  // Create form state
  const [customers, setCustomers] = useState<CurrentAccount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [actualDate, setActualDate] = useState(new Date().toISOString().split("T")[0]);
  const [driverName, setDriverName] = useState("");
  const [driverIdentityNo, setDriverIdentityNo] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  
  const [lines, setLines] = useState([{ productId: "", quantity: 1 }]);
  const [productSearches, setProductSearches] = useState<string[]>([""]);
  const [showProductDropdowns, setShowProductDropdowns] = useState<boolean[]>([false]);
  
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchDespatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/despatch/list");
      if (res.ok) {
        const data = await res.json();
        setDespatches(data.despatches || []);
      }
    } catch (e) {
      console.error("Despatch listesi alınamadı:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFormData = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/accounting/current-accounts?type=MUSTERI&limit=100"),
        fetch("/api/products?limit=200")
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomers(Array.isArray(cData) ? cData : (cData.accounts || cData.data || []));
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(Array.isArray(pData) ? pData : (pData.products || pData.data || []));
      }
    } catch (e) {
      console.error("Form verileri alınamadı:", e);
    }
  }, []);

  useEffect(() => {
    fetchDespatches();
    fetchFormData();
  }, [fetchDespatches, fetchFormData]);

  const addLine = () => {
    setLines([...lines, { productId: "", quantity: 1 }]);
    setProductSearches([...productSearches, ""]);
    setShowProductDropdowns([...showProductDropdowns, false]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
    setProductSearches(productSearches.filter((_, i) => i !== idx));
    setShowProductDropdowns(showProductDropdowns.filter((_, i) => i !== idx));
  };

  const handleCreateDespatch = async () => {
    setCreateError("");
    if (!selectedCustomer) { setCreateError("Lütfen bir Müşteri Cari seçin."); return; }
    if (lines.some(l => !l.productId || l.quantity <= 0)) {
      setCreateError("Lütfen tüm satırlar için geçerli bir ürün ve miktar girin."); return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/despatch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerAccountId: selectedCustomer,
          invoiceId: invoiceId || null,
          issueDate: new Date(issueDate).toISOString(),
          actualDespatchDate: new Date(actualDate).toISOString(),
          driverName: driverName || null,
          driverIdentityNo: driverIdentityNo || null,
          carrierId: carrierId || null,
          licensePlate: licensePlate || null,
          lines: lines.map(l => ({ productId: l.productId, quantity: Number(l.quantity) }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");
      
      setShowCreateModal(false);
      setSelectedCustomer(""); setCustomerSearch(""); setInvoiceId(""); setDriverName(""); setDriverIdentityNo(""); setCarrierId(""); setLicensePlate("");
      setLines([{ productId: "", quantity: 1 }]);
      setProductSearches([""]);
      setShowProductDropdowns([false]);
      fetchDespatches();
    } catch (e: any) {
      setCreateError(e.message || "İrsaliye oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  };

  const downloadXml = async (despatchId: string, despatchNo: string) => {
    setXmlLoading(despatchId);
    try {
      const res = await fetch(`/api/despatch/${despatchId}/xml`);
      if (!res.ok) throw new Error("XML oluşturulamadı");
      const xml = await res.text();
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${despatchNo}_GIB_UBL.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("XML indirme hatası: " + e.message);
    } finally {
      setXmlLoading(null);
    }
  };

  const handleApproveDespatch = async (despatchId: string) => {
    if (!confirm("Bu e-İrsaliyeyi onaylamak istediğinize emin misiniz?")) return;
    setApproveLoading(despatchId);
    try {
      const res = await fetch(`/api/despatch/${despatchId}/approve`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");
      
      fetchDespatches();
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setApproveLoading(null);
    }
  };

  const filtered = despatches.filter(d =>
    d.despatchNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.customerAccount?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ettnNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const total = despatches.length;
  const drafts = despatches.filter(d => {
    const s = d.status?.toUpperCase();
    return s === "DRAFT" || s === "TASLAK";
  }).length;
  const sent = despatches.filter(d => {
    const s = d.status?.toUpperCase();
    return s === "SENT" || s === "SEVK_EDILDI";
  }).length;
  const approved = despatches.filter(d => {
    const s = d.status?.toUpperCase();
    return s === "APPROVED" || s === "ONAYLANDI";
  }).length;

  // Smart Filtering logic: if the query matches the currently selected name, show all options
  const isCustomerSelectedName = customers.some(c => c.id === selectedCustomer && c.name === customerSearch);
  const filteredCustomers = isCustomerSelectedName
    ? customers
    : customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.taxId?.toLowerCase().includes(customerSearch.toLowerCase())
      );

  const isProductSelectedName = (idx: number) => {
    const selectedId = lines[idx]?.productId;
    const selectedProd = products.find(p => p.id === selectedId);
    return selectedProd && `${selectedProd.name} (${selectedProd.sku}) — Stok: ${selectedProd.stock}` === productSearches[idx];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-violet-650 bg-violet-50 border border-violet-200/60 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> GİB e-İrsaliye Entegrasyonu
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <Truck className="w-7 h-7 text-violet-650" />
            e-İrsaliye (Despatch Advice) Yönetimi
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            GİB UBL-TR standartlarında elektronik sevk irsaliyelerini sorgulayın, düzenleyin, yazdırın ve XML dosyalarını indirin.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={fetchDespatches}
            className="p-2.5 text-slate-500 hover:text-slate-800 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-750 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md shadow-violet-100 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            Yeni e-İrsaliye
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam İrsaliye", value: total, color: "text-slate-900", border: "border-slate-200", bg: "bg-white" },
          { label: "Taslak Belgeler", value: drafts, color: "text-slate-700", border: "border-slate-200", bg: "bg-white" },
          { label: "Gönderilenler", value: sent, color: "text-blue-700", border: "border-blue-105", bg: "bg-blue-50/40" },
          { label: "GİB Onaylı", value: approved, color: "text-emerald-700", border: "border-emerald-105", bg: "bg-emerald-50/40" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-350 transition duration-205`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-3xl font-extrabold ${stat.color} tracking-tight`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/40">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">İrsaliye Listesi</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="İrsaliye no, müşteri veya ETTN ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <RefreshCw className="w-7 h-7 text-violet-650 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">İrsaliyeler yükleniyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
            <Truck className="w-12 h-12 text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Kayıtlı e-İrsaliye Bulunmuyor</p>
              <p className="text-xs text-slate-550 mt-1">Giden e-İrsaliye oluşturmak için yeni e-İrsaliye butonunu kullanın.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-violet-655 hover:text-violet-855 text-xs font-bold flex items-center gap-1 bg-violet-50 border border-violet-200/60 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> İlk İrsaliyeyi Oluştur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">İrsaliye No / ETTN</th>
                  <th className="px-5 py-3.5">Müşteri</th>
                  <th className="px-5 py-3.5">Tarih Detayı</th>
                  <th className="px-5 py-3.5">Taşıma Detayları</th>
                  <th className="px-5 py-3.5">Fatura Ref.</th>
                  <th className="px-5 py-3.5">Durum</th>
                  <th className="px-5 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-900 tracking-wide">{d.despatchNo}</span>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono truncate max-w-[130px]" title={d.ettnNo}>
                          ETTN: {d.ettnNo.substring(0, 18)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-slate-800 block">
                        {d.customerAccount?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold space-y-0.5">
                        <p className="text-slate-550">Düzenleme: <span className="text-slate-900">{new Date(d.issueDate).toLocaleDateString("tr-TR")}</span></p>
                        <p className="text-slate-500 text-[10px]">Fiili Sevk: <span className="text-slate-800">{new Date(d.actualDespatchDate).toLocaleDateString("tr-TR")}</span></p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[11px] space-y-0.5 font-semibold text-slate-650">
                        {d.driverName ? (
                          <p className="text-slate-800">👤 {d.driverName} {d.driverIdentityNo ? `(${d.driverIdentityNo})` : ""}</p>
                        ) : null}
                        {d.licensePlate ? (
                          <p className="text-slate-700">🚗 Plaka: <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-900">{d.licensePlate}</span></p>
                        ) : null}
                        {d.carrierId ? (
                          <p className="text-slate-500">Taşıyıcı ID: {d.carrierId}</p>
                        ) : null}
                        {!d.driverName && !d.licensePlate && !d.carrierId && (
                          <span className="text-slate-400 italic">— Bilgi Yok —</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {d.invoice?.id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Bağlı Fatura
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Bağımsız
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {(d.status === "Draft" || d.status === "draft" || d.status === "TASLAK") && (
                          <button
                            onClick={() => handleApproveDespatch(d.id)}
                            disabled={approveLoading === d.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl transition duration-155 disabled:opacity-40 active:scale-95 cursor-pointer"
                          >
                            {approveLoading === d.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Onayla
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`/api/despatch/${d.id}/pdf`, "_blank")}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:bg-orange-105 bg-orange-50 border border-orange-200 px-3.5 py-2 rounded-xl transition duration-155 active:scale-95 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Yazdır
                        </button>
                        <button
                          onClick={() => downloadXml(d.id, d.despatchNo)}
                          disabled={xmlLoading === d.id}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-755 hover:bg-violet-100 bg-violet-50 border border-violet-200/80 px-3.5 py-2 rounded-xl transition duration-155 disabled:opacity-40 active:scale-95 cursor-pointer"
                        >
                          {xmlLoading === d.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          GİB XML
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create Modal (Searchable Light Combobox Template) ─────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-250 shadow-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5.5 h-5.5 text-violet-650" />
                  Yeni e-İrsaliye Oluştur
                </h2>
                <p className="text-xs text-slate-550 mt-1 font-semibold">GİB UBL-TR Despatch Advice formatında irsaliye kaydı</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(""); }}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5 relative z-10 text-slate-850">
              
              {/* Error Box */}
              {createError && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-rose-750">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  {createError}
                </div>
              )}

              {/* Grid 1: Customer (Searchable) & Invoice ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Searchable Customer Combobox */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 inline-block mr-1 text-violet-650" />
                    Müşteri Cari *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Müşteri cari ara ve seç..."
                      value={customerSearch}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onClick={() => setShowCustomerDropdown(true)}
                      onBlur={() => {
                        // slight timeout to allow item selection click event to fire
                        setTimeout(() => {
                          setShowCustomerDropdown(false);
                        }, 200);
                      }}
                      onChange={e => {
                        setCustomerSearch(e.target.value);
                        setSelectedCustomer(""); // Reset selected id when user types
                      }}
                      className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-slate-900 rounded-xl outline-none transition-all pl-3.5 pr-8 py-3 text-xs font-bold placeholder-slate-400"
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearch("");
                          setSelectedCustomer("");
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {selectedCustomer ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                    )}
                  </div>

                  {showCustomerDropdown && (
                    <div className="absolute left-0 right-0 z-[100] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-3.5 text-xs text-slate-500 italic">Cari hesap bulunamadı</div>
                      ) : (
                        filteredCustomers.map(c => (
                          <div
                            key={c.id}
                            onMouseDown={() => {
                              // Use onMouseDown so it executes before onBlur fires
                              setSelectedCustomer(c.id);
                              setCustomerSearch(c.name);
                              setShowCustomerDropdown(false);
                            }}
                            className="p-3 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-900 cursor-pointer font-bold border-b border-slate-105 last:border-0"
                          >
                            {c.name} {c.taxId ? `(VKN: ${c.taxId})` : ""}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 inline-block mr-1 text-violet-655" />
                    Fatura ID (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Varsa bağlı fatura ID..."
                    value={invoiceId}
                    onChange={e => setInvoiceId(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-3 text-xs font-bold placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Grid 2: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 inline-block mr-1 text-violet-650" />
                    İrsaliye Tarihi *
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-3 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5 inline-block mr-1 text-violet-650" />
                    Fiili Sevk Tarihi *
                  </label>
                  <input
                    type="date"
                    value={actualDate}
                    onChange={e => setActualDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-3 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Grid 3: Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 inline-block mr-1 text-violet-650" />
                    Şoför Adı Soyadı
                  </label>
                  <input
                    type="text"
                    placeholder="Şoför adı soyadı..."
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-3 text-xs font-bold placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <Fingerprint className="w-3.5 h-3.5 inline-block mr-1 text-violet-650" />
                    Şoför T.C. Kimlik No
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="11 haneli T.C. kimlik no..."
                    value={driverIdentityNo}
                    onChange={e => setDriverIdentityNo(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-3 text-xs font-bold placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Grid 4: Plate & Carrier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5 inline-block mr-1 text-violet-650" />
                    Araç Plakası
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 34ABC123..."
                    value={licensePlate}
                    onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-3 text-xs font-bold uppercase placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    <FileCode className="w-3.5 h-3.5 inline-block mr-1 text-violet-650" />
                    Taşıyıcı Kargo ID / Kodu
                  </label>
                  <input
                    type="text"
                    placeholder="Varsa kargo referans kodu..."
                    value={carrierId}
                    onChange={e => setCarrierId(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-3 text-xs font-bold placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Lines Section */}
              <div className="border-t border-slate-150 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Package className="w-4 h-4 text-violet-650" />
                    İrsaliye Kalemleri *
                  </label>
                  <button
                    onClick={addLine}
                    className="text-xs text-violet-755 hover:text-violet-855 font-bold flex items-center gap-1 cursor-pointer bg-violet-50 border border-violet-200/50 px-3.5 py-1.5 rounded-xl transition duration-150"
                  >
                    <Plus className="w-3.5 h-3.5" /> Satır Ekle
                  </button>
                </div>
                <div className="space-y-3 pr-1 pb-48">
                  {lines.map((line, idx) => {
                    const lineQuery = productSearches[idx] || "";
                    const filteredProducts = products.filter(p =>
                      p.name.toLowerCase().includes(lineQuery.toLowerCase()) ||
                      p.sku.toLowerCase().includes(lineQuery.toLowerCase())
                    );
                    
                    return (
                      <div key={idx} className="flex items-center gap-2.5 animate-in slide-in-from-top-1 duration-150">
                        
                        {/* Searchable Product Combobox */}
                        <div className="relative flex-1">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Ürün ara ve seç..."
                              value={productSearches[idx] || ""}
                              onFocus={() => {
                                const updated = showProductDropdowns.map((_, i) => i === idx);
                                setShowProductDropdowns(updated);
                              }}
                              onClick={() => {
                                const updated = showProductDropdowns.map((_, i) => i === idx);
                                setShowProductDropdowns(updated);
                              }}
                              onBlur={() => {
                                // slight timeout to allow option select click event to fire
                                setTimeout(() => {
                                  setShowProductDropdowns(prev => prev.map(() => false));
                                }, 200);
                              }}
                              onChange={e => {
                                const updatedSearches = [...productSearches];
                                updatedSearches[idx] = e.target.value;
                                setProductSearches(updatedSearches);
                                
                                const updatedLines = [...lines];
                                updatedLines[idx].productId = ""; // Clear selection if typing
                                setLines(updatedLines);
                              }}
                              className="w-full bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-slate-900 rounded-xl outline-none transition-all pl-3.5 pr-8 py-2.5 text-xs font-bold placeholder-slate-400"
                            />
                            {productSearches[idx] && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedSearches = [...productSearches];
                                  updatedSearches[idx] = "";
                                  setProductSearches(updatedSearches);

                                  const updatedLines = [...lines];
                                  updatedLines[idx].productId = "";
                                  setLines(updatedLines);
                                }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-655 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            {line.productId ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-450 absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                            )}
                          </div>

                          {showProductDropdowns[idx] && (
                            <div className="absolute left-0 right-0 z-[100] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {filteredProducts.length === 0 ? (
                                <div className="p-3 text-xs text-slate-500 italic">Ürün bulunamadı</div>
                              ) : (
                                filteredProducts.map(p => (
                                  <div
                                    key={p.id}
                                    onMouseDown={() => {
                                      // Use onMouseDown so it executes before onBlur fires
                                      const updatedLines = [...lines];
                                      updatedLines[idx].productId = p.id;
                                      setLines(updatedLines);

                                      const updatedSearches = [...productSearches];
                                      updatedSearches[idx] = `${p.name} (${p.sku}) — Stok: ${p.stock}`;
                                      setProductSearches(updatedSearches);

                                      const updatedDropdowns = [...showProductDropdowns];
                                      updatedDropdowns[idx] = false;
                                      setShowProductDropdowns(updatedDropdowns);
                                    }}
                                    className="p-2.5 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-900 cursor-pointer font-bold border-b border-slate-105 last:border-0"
                                  >
                                    {p.name} ({p.sku}) <span className="text-[10px] text-slate-500 ml-1">Stok: {p.stock}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => {
                            const updated = [...lines];
                            updated[idx].quantity = Number(e.target.value);
                            setLines(updated);
                          }}
                          className="w-24 bg-white border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 text-slate-900 rounded-xl outline-none transition-all px-3.5 py-2.5 text-xs font-bold text-center"
                          placeholder="Adet"
                        />
                        
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="p-2.5 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition duration-150 cursor-pointer animate-in fade-in"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-3xl">
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(""); }}
                className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-655 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition duration-150 cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={handleCreateDespatch}
                disabled={creating}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-755 hover:to-indigo-750 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-violet-100 active:scale-95"
              >
                {creating ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                ) : (
                  <><Truck className="w-4 h-4" /> e-İrsaliye Oluştur</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

