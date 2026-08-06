"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Users, 
  Award, 
  DollarSign, 
  AlertTriangle,
  Layers,
  Settings,
  FileText,
  Save,
  X,
  Share2,
  Sparkles,
  Loader2,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Clock,
  Calculator
} from "lucide-react";
import { CurrentAccount, SubAccount, Transaction, Product } from "../types";
import DealerTierCenter from "./DealerTierCenter";
import PriceFormulaEditor from "./PriceFormulaEditor";
import RegistrationQueue from "./RegistrationQueue";
import { 
  getDealersData, 
  updateDealerAction, 
  createDealerAction, 
  approveDealerAction, 
  rejectDealerAction, 
  addSubAccountAction 
} from "../server/dealerActions";
import { toast } from "sonner";

interface DealersDashboardProps {
  initialData?: {
    dealers: CurrentAccount[];
    pendingApplications: any[];
    products: Product[];
  };
}

export default function DealersDashboard({ initialData }: DealersDashboardProps) {
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"bayiler" | "talepler" | "laboratuvar">("bayiler");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("Tümü");

  // Domain State
  const [dealers, setDealers] = useState<CurrentAccount[]>(initialData?.dealers || []);
  const [pendingApplications, setPendingApplications] = useState<any[]>(initialData?.pendingApplications || []);
  const [products, setProducts] = useState<Product[]>(initialData?.products || []);

  // Modals & Panels State
  const [selectedDealer, setSelectedDealer] = useState<CurrentAccount | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"tier" | "settings" | "subaccounts" | "statement">("tier");

  // New Entity Form States
  const [submitting, setSubmitting] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", email: "", phone: "", role: "Satın Alma", balance: 0 });
  const [newDealer, setNewDealer] = useState({
    name: "",
    email: "",
    phone: "",
    taxId: "",
    taxOffice: "",
    balance: 0,
    dealerGroup: "Standart",
    priceGroup: "Liste",
    riskLimit: 0,
    creditLimit: 0,
    discountRate: 0,
    loyaltyPoints: 0,
    vadeGun: 0,
    priceFormula: "",
    parentDealerId: "",
    b2bMinQty: 1,
    b2bPaymentTerms: "Peşin (Kredi Kartı / Havale)",
    b2bCode: "",
    cariTipi: "CORPORATE",
    ad: "",
    soyad: "",
    tckn: "",
    dogumTarihi: "",
    mersisNo: "",
    yetkiliKisi: "",
    webSitesi: "",
    cariKod: ""
  });

  const [sandboxFormula, setSandboxFormula] = useState("");

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getDealersData();
      if (res.success && res.data) {
        setDealers(res.data.dealers);
        setPendingApplications(res.data.pendingApplications);
        setProducts(res.data.products);
        if (isRefresh) toast.success("Veriler başarıyla yenilendi.");
      } else {
        toast.error(res.error || "Bayi verileri yüklenemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [initialData]);

  // Statistics
  const totalDealersCount = dealers.length;
  const totalRiskLimit = useMemo(() => dealers.reduce((sum, d) => sum + (d.riskLimit || 0), 0), [dealers]);
  const totalBalanceDue = useMemo(() => dealers.filter((d) => d.balance > 0).reduce((sum, d) => sum + d.balance, 0), [dealers]);
  const pendingRequestsCount = pendingApplications.length;
  const totalPointsAccrued = useMemo(() => dealers.reduce((sum, d) => sum + (d.loyaltyPoints || 0), 0), [dealers]);

  // Filters
  const filteredDealers = useMemo(() => {
    return dealers.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGroup = groupFilter === "Tümü" || d.dealerGroup === groupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [dealers, searchTerm, groupFilter]);

  // Actions
  const handleUpdateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer) return;

    setSubmitting(true);
    try {
      const res = await updateDealerAction(selectedDealer);
      if (res.success) {
        toast.success("Bayi cari ayarları başarıyla kaydedildi.");
        setIsEditModalOpen(false);
        await loadData(true);
      } else {
        toast.error(res.error || "Güncelleme sırasında hata oluştu.");
      }
    } catch (err) {
      toast.error("Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = { ...newDealer };
    if (newDealer.cariTipi === "INDIVIDUAL") {
      payload.name = `${newDealer.ad} ${newDealer.soyad}`.trim();
      payload.taxId = newDealer.tckn;
      payload.taxOffice = "Bireysel";
    }

    try {
      const res = await createDealerAction(payload);
      if (res.success) {
        toast.success(`"${payload.name}" cari hesabı oluşturuldu.`);
        setIsAddModalOpen(false);
        setNewDealer({
          name: "",
          email: "",
          phone: "",
          taxId: "",
          taxOffice: "",
          balance: 0,
          dealerGroup: "Standart",
          priceGroup: "Liste",
          riskLimit: 0,
          creditLimit: 0,
          discountRate: 0,
          loyaltyPoints: 0,
          vadeGun: 0,
          priceFormula: "",
          parentDealerId: "",
          b2bMinQty: 1,
          b2bPaymentTerms: "Peşin (Kredi Kartı / Havale)",
          b2bCode: "",
          cariTipi: "CORPORATE",
          ad: "",
          soyad: "",
          tckn: "",
          dogumTarihi: "",
          mersisNo: "",
          yetkiliKisi: "",
          webSitesi: "",
          cariKod: ""
        });
        await loadData(true);
      } else {
        toast.error(res.error || "Cari hesap oluşturulamadı.");
      }
    } catch (err) {
      toast.error("Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer) return;

    setSubmitting(true);
    try {
      const res = await addSubAccountAction(selectedDealer.id, newSub);
      if (res.success) {
        toast.success("Alt hesap başarıyla oluşturuldu.");
        setNewSub({ name: "", email: "", phone: "", role: "Satın Alma", balance: 0 });
        await loadData(true);
        // Refresh local details view
        const refreshedDealer = dealers.find((d) => d.id === selectedDealer.id);
        if (refreshedDealer) {
          const updatedSubAccounts = refreshedDealer.subAccounts ? [...refreshedDealer.subAccounts, res.data] : [res.data];
          setSelectedDealer({ ...refreshedDealer, subAccounts: updatedSubAccounts });
        }
      } else {
        toast.error(res.error || "Alt hesap oluşturulamadı.");
      }
    } catch (err) {
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveApplication = async (id: string): Promise<boolean> => {
    try {
      const res = await approveDealerAction(id);
      if (res.success) {
        await loadData(true);
        return true;
      } else {
        toast.error(res.error || "Başvuru onaylanamadı.");
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  const handleRejectApplication = async (id: string): Promise<boolean> => {
    try {
      const res = await rejectDealerAction(id);
      if (res.success) {
        await loadData(true);
        return true;
      } else {
        toast.error(res.error || "İşlem başarısız.");
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  const handleShareStatement = () => {
    if (!selectedDealer) return;
    const text = `${selectedDealer.name} - Hesap Ekstresi\nBakiye: ${selectedDealer.balance.toLocaleString()} ₺`;
    navigator.clipboard.writeText(text);
    toast.success("Hesap bakiye bilgileri panoya kopyalandı!");
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-10 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-orange-500" /> Cari Hesaplar &amp; B2B/B2C CRM
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Risk Yönetimi, Özel Fiyatlandırma Formülleri ve Üyelik Süreçleri
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Cari Kart
          </button>
        </div>
      </div>

      {/* Corporate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalDealersCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
              Aktif Cari Kartlar
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 tracking-tight truncate max-w-[120px]" title={`${totalRiskLimit.toLocaleString()} ₺`}>
              {totalRiskLimit.toLocaleString()} ₺
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
              Toplam Risk Limiti
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-orange-500 tracking-tight truncate max-w-[120px]">
              {totalBalanceDue.toLocaleString()} ₺
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
              Bakiye Alacak (Borç)
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 tracking-tight truncate max-w-[120px]">
              {totalPointsAccrued.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
              Sadakat Puan Havuzu
            </p>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            pendingRequestsCount > 0
              ? "bg-red-50 text-red-600"
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-2xl font-bold tracking-tight ${pendingRequestsCount > 0 ? "text-red-500" : "text-slate-900"}`}>
              {pendingRequestsCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">
              Onay Bekleyenler
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("bayiler")}
            className={`pb-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "bayiler"
                ? "border-orange-500 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Cari Hesap Listesi
          </button>
          <button
            onClick={() => setActiveTab("talepler")}
            className={`pb-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "talepler"
                ? "border-orange-500 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Clock className="w-4 h-4" />
            Başvuru Kuyruğu
            {pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("laboratuvar")}
            className={`pb-4 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "laboratuvar"
                ? "border-orange-500 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Calculator className="w-4 h-4" />
            Formül Laboratuvarı
          </button>
        </div>

        {/* Tab Panels */}
        <div className="transition-all duration-200">
          
          {/* TAB 1: BAYİ PORTFÖYÜ */}
          {activeTab === "bayiler" && (
            <div className="space-y-6">
              
              {/* Search & Filtering Group select buttons */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Search */}
                <div className="lg:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari ünvanı, ID veya e-posta ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-400 outline-none transition-all"
                  />
                </div>

                {/* Filter buttons */}
                <div className="lg:col-span-7 flex flex-wrap gap-1.5 justify-end">
                  {["Tümü", "Platin", "Gold", "Silver", "Standart"].map((grp) => (
                    <button
                      key={grp}
                      onClick={() => setGroupFilter(grp)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-semibold tracking-wide transition-all border cursor-pointer ${
                        groupFilter === grp
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bayiler Directory Grid Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-5">Cari Detay</th>
                        <th className="px-6 py-5">Grup Seviyesi</th>
                        <th className="px-6 py-5">Alt Üyeler</th>
                        <th className="px-6 py-5">Risk Limit / Vade</th>
                        <th className="px-6 py-5 text-right">Loyalty Puan</th>
                        <th className="px-6 py-5 text-right">ERP Hesap Bakiye</th>
                        <th className="px-6 py-5 text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredDealers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400 text-xs font-semibold">
                            Filtreye uygun kayıtlı cari bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredDealers.map((dealer) => {
                          const balanceAmount = dealer.balance || 0;
                          const riskLimitAmount = dealer.riskLimit || 0;
                          const riskRatio = riskLimitAmount > 0 ? Math.min((balanceAmount / riskLimitAmount) * 100, 100) : 0;
                          const subAccountsCount = dealer.subAccounts?.length || 0;

                          return (
                            <tr key={dealer.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${
                                    dealer.dealerGroup === "Platin"
                                      ? "bg-purple-50 text-purple-700 border-purple-100"
                                      : dealer.dealerGroup === "Gold"
                                      ? "bg-orange-50 text-orange-600 border-orange-100"
                                      : "bg-slate-50 text-slate-700 border-slate-200"
                                  }`}>
                                    {dealer.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-semibold text-slate-800 truncate">
                                        {dealer.name}
                                      </p>
                                      {!dealer.isApproved && (
                                        <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-amber-200 text-[7px] font-bold rounded">
                                          ONAY BEKLİYOR
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                      ID: {dealer.id} · E-Posta: {dealer.email || "Yok"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-semibold border ${
                                  dealer.dealerGroup === "Platin"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : dealer.dealerGroup === "Gold"
                                    ? "bg-orange-50 text-orange-600 border-amber-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                  {dealer.dealerGroup} / {dealer.priceGroup}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{subAccountsCount} Alıcı Üye</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="w-32">
                                    <div className="flex justify-between items-center text-[9px] font-semibold uppercase mb-0.5">
                                      <span className="text-slate-400">Risk Oranı</span>
                                      <span className={riskRatio > 80 ? "text-red-500" : "text-slate-500"}>{Math.round(riskRatio)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${riskRatio > 80 ? "bg-red-500" : "bg-orange-500"}`} style={{ width: `${riskRatio}%` }} />
                                    </div>
                                  </div>
                                  <p className="text-[8px] text-slate-400 font-medium">
                                    Vade: {dealer.vadeGun || "0"} Gün · Limit: {riskLimitAmount.toLocaleString()} ₺
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-semibold text-amber-600">
                                  {dealer.loyaltyPoints.toLocaleString("tr-TR")} Puan
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="min-w-0">
                                  <p className={`text-xs font-semibold ${balanceAmount >= 0 ? "text-orange-500" : "text-emerald-600"}`}>
                                    {Math.abs(balanceAmount).toLocaleString("tr-TR")} ₺
                                  </p>
                                  <p className="text-[8px] text-slate-400 font-medium mt-0.5">
                                    {balanceAmount >= 0 ? "BORÇ" : "ALACAK"}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedDealer(dealer);
                                    setModalTab("tier");
                                    setSandboxFormula(dealer.priceFormula || "");
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-orange-500 transition-all cursor-pointer inline-flex items-center justify-center"
                                  title="Ticari Kart Detay"
                                >
                                  <Edit className="w-4 h-4" />
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
          )}

          {/* TAB 2: BAŞVURU KUYRUĞU */}
          {activeTab === "talepler" && (
            <RegistrationQueue 
              applications={pendingApplications} 
              onApprove={handleApproveApplication} 
              onReject={handleRejectApplication} 
            />
          )}

          {/* TAB 3: FORMÜL LABORATUVARI */}
          {activeTab === "laboratuvar" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Global Formül Test Sandbox Ortamı</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Maliyet artı oranları test edin ve ürün kataloğundaki etkisini görün.</p>
              </div>
              <PriceFormulaEditor 
                initialFormula={sandboxFormula} 
                products={products} 
                onChangeFormula={setSandboxFormula} 
              />
            </div>
          )}

        </div>
      </div>

      {/* EDIT MODAL / SIDE OVERLAY - BAYİ DETAY KARTI */}
      {isEditModalOpen && selectedDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white relative z-10 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                  {selectedDealer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{selectedDealer.name}</h2>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">ERP Cari ID: {selectedDealer.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:text-red-500 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Inner Workspace */}
            <div className="flex-1 flex overflow-hidden">
              {/* Inner Tab Sidebar */}
              <div className="w-56 bg-slate-50 border-r border-slate-100 p-4 space-y-1.5 shrink-0 overflow-y-auto">
                {[
                  { id: "tier", name: "Tier & Sadakat", icon: Award },
                  { id: "settings", name: "Ticari Parametreler", icon: Settings },
                  { id: "subaccounts", name: "Alıcı Alt Üyeler", icon: Users },
                  { id: "statement", name: "Hesap Ekstresi", icon: FileText }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = modalTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setModalTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                        isActive 
                          ? "bg-white text-orange-500 shadow-sm border border-slate-200" 
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Inner Tab Content */}
              <div className="flex-1 overflow-y-auto p-8">
                
                {/* 1. TIER VE LOYALTY PANEL */}
                {modalTab === "tier" && (
                  <DealerTierCenter dealer={selectedDealer} allDealers={dealers} />
                )}

                {/* 2. PARAMETERS FORM */}
                {modalTab === "settings" && (
                  <form onSubmit={handleUpdateDealer} className="space-y-6 max-w-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Cari Grubu (Grup Seviyesi)</label>
                        <select 
                          value={selectedDealer.dealerGroup} 
                          onChange={(e) => setSelectedDealer({...selectedDealer, dealerGroup: e.target.value})} 
                          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:border-orange-400 outline-none cursor-pointer"
                        >
                          <option value="Platin">Platin</option>
                          <option value="Gold">Gold</option>
                          <option value="Silver">Silver</option>
                          <option value="Standart">Standart</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Fiyat Grubu (PriceGroup)</label>
                        <select 
                          value={selectedDealer.priceGroup} 
                          onChange={(e) => setSelectedDealer({...selectedDealer, priceGroup: e.target.value})} 
                          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:border-orange-400 outline-none cursor-pointer"
                        >
                          <option value="Liste">Liste Satış</option>
                          <option value="MaliyetArtı10">Maliyet + %10</option>
                          <option value="MaliyetArtı15">Maliyet + %15</option>
                          <option value="MaliyetArtı20">Maliyet + %20</option>
                          <option value="Özel İskonto">Özel İskonto</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Cariye Özel Fiyat Hesaplama Formülü</label>
                      <input 
                        type="text" 
                        placeholder="Örn: cost * 1.12 veya price * 0.90" 
                        value={selectedDealer.priceFormula || ""} 
                        onChange={(e) => setSelectedDealer({...selectedDealer, priceFormula: e.target.value})} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-xs focus:bg-white focus:border-orange-400" 
                      />
                      <p className="text-[9px] text-slate-400 font-semibold">
                        * Değer girilirse fiyat grubunu ezerek bu cebirsel bağıntıyı aktif kılar. Boş ise ezilmez.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Risk Limiti (₺)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={selectedDealer.riskLimit || 0} 
                          onChange={(e) => setSelectedDealer({...selectedDealer, riskLimit: Math.max(0, parseFloat(e.target.value) || 0)})} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Kredi Vadesi (Gün)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={selectedDealer.vadeGun || 0} 
                          onChange={(e) => setSelectedDealer({...selectedDealer, vadeGun: Math.max(0, parseInt(e.target.value) || 0)})} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-amber-600 uppercase tracking-wider ml-0.5">Sadakat Puanı</label>
                        <input 
                          type="number" 
                          min="0"
                          value={selectedDealer.loyaltyPoints || 0} 
                          onChange={(e) => setSelectedDealer({...selectedDealer, loyaltyPoints: Math.max(0, parseFloat(e.target.value) || 0)})} 
                          className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl outline-none font-bold text-xs text-orange-600 focus:border-orange-400" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-wider ml-0.5">Özel İskonto Oranı (%)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          placeholder="İskonto yoksa boş bırakın" 
                          value={selectedDealer.discountRate || ""} 
                          onChange={(e) => setSelectedDealer({...selectedDealer, discountRate: e.target.value ? Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) : null})} 
                          className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl outline-none font-bold text-xs text-emerald-700 focus:border-orange-400" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Bağlantılı Üst Cari (Hiyerarşi)</label>
                      <select
                        value={selectedDealer.parentDealerId || ""}
                        onChange={(e) => setSelectedDealer({...selectedDealer, parentDealerId: e.target.value || null})}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:border-orange-400 outline-none cursor-pointer"
                      >
                        <option value="">-- Bağımsız Cari (Yok) --</option>
                        {dealers
                          .filter((d) => d.id !== selectedDealer.id)
                          .map((d) => (
                            <option key={d.id} value={d.id}>{d.name.toUpperCase()}</option>
                          ))
                        }
                      </select>
                    </div>
 
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider block">B2B Portal Ayarları</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Minimum Sipariş Miktarı</label>
                          <input 
                            type="number" 
                            min="0"
                            value={selectedDealer.b2bMinQty || 0} 
                            onChange={(e) => setSelectedDealer({...selectedDealer, b2bMinQty: Math.max(0, parseFloat(e.target.value) || 0)})} 
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-orange-400" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Ödeme Koşulu</label>
                          <select 
                            value={selectedDealer.b2bPaymentTerms || "Peşin (Kredi Kartı / Havale)"} 
                            onChange={(e) => setSelectedDealer({...selectedDealer, b2bPaymentTerms: e.target.value})} 
                            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:border-orange-400 outline-none cursor-pointer"
                          >
                            <option value="Peşin (Kredi Kartı / Havale)">Peşin (Kredi Kartı / Havale)</option>
                            <option value="30 Gün Vadeli">30 Gün Vadeli</option>
                            <option value="60 Gün Vadeli">60 Gün Vadeli</option>
                            <option value="90 Gün Vadeli">90 Gün Vadeli</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Cari Entegrasyon Kodu</label>
                        <input 
                          type="text" 
                          placeholder="Örn: B2B-ENT-001" 
                          value={selectedDealer.b2bCode || ""} 
                          onChange={(e) => setSelectedDealer({...selectedDealer, b2bCode: e.target.value})} 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-xs focus:border-orange-400" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Bilgileri Kaydet
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* 3. ALICI ALT ÜYELER TAB */}
                {modalTab === "subaccounts" && (
                  <div className="space-y-6">
                    {/* Add form */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                      <h4 className="text-[10px] text-slate-800 font-semibold uppercase tracking-wide flex items-center gap-1.5 mb-3.5">
                        <UserPlus className="w-4 h-4 text-orange-500" /> Yeni Alıcı Ekle
                      </h4>
                      <form onSubmit={handleAddSubAccount} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide block">Ad Soyad</span>
                          <input 
                            required 
                            type="text" 
                            placeholder="Alıcı Adı" 
                            value={newSub.name} 
                            onChange={(e) => setNewSub({...newSub, name: e.target.value})} 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" 
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide block">E-Posta</span>
                          <input 
                            required 
                            type="email" 
                            placeholder="posta@firma.com" 
                            value={newSub.email} 
                            onChange={(e) => setNewSub({...newSub, email: e.target.value})} 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" 
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide block">Telefon (Opsiyonel)</span>
                          <input 
                            type="text" 
                            placeholder="Telefon" 
                            value={newSub.phone} 
                            onChange={(e) => setNewSub({...newSub, phone: e.target.value})} 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400" 
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          Ekle
                        </button>
                      </form>
                    </div>

                    {/* Sub accounts list */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide block">Aktif Alt Temsilciler</span>
                      {(selectedDealer.subAccounts?.length || 0) === 0 ? (
                        <p className="text-center text-slate-400 italic text-xs py-8 bg-slate-50 rounded-xl">Kayıtlı alt temsilci bulunmamaktadır.</p>
                      ) : (
                        selectedDealer.subAccounts?.map((sub) => (
                          <div key={sub.id} className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div>
                              <p className="font-semibold text-xs text-slate-800">{sub.name}</p>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">Role: {sub.role} · E-Mail: {sub.email}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] text-slate-400 font-medium block">Bakiye</span>
                              <span className="font-semibold text-xs text-slate-800">{sub.balance.toLocaleString()} ₺</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. STATEMENT HESAP EKSTRESİ TAB */}
                {modalTab === "statement" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">Hesap Detayı Ekstre Defteri</h3>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">ERP entegrasyonu işlem kayıtları</p>
                      </div>
                      <button
                        onClick={handleShareStatement}
                        className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-orange-500 rounded-xl text-[9px] font-semibold flex items-center gap-1.5 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Bilgileri Kopyala
                      </button>
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Tarih</th>
                            <th className="px-4 py-3">İşlem Türü</th>
                            <th className="px-4 py-3">Açıklama</th>
                            <th className="px-4 py-3 text-right">Tutar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600">
                          {!selectedDealer.transactions || selectedDealer.transactions.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic">
                                İşlem kaydı bulunmuyor.
                              </td>
                            </tr>
                          ) : (
                            selectedDealer.transactions.map((t) => {
                              const date = new Date(t.date).toLocaleDateString("tr-TR");
                              return (
                                <tr key={t.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3">{date}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                      t.type.includes("Fatura")
                                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    }`}>
                                      {t.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 italic">{t.description || "Açıklama belirtilmedi"}</td>
                                  <td className={`px-4 py-3 text-right font-black ${
                                    t.type.includes("Fatura") || t.type === "Ödeme"
                                      ? "text-red-500"
                                      : "text-emerald-600"
                                  }`}>
                                    {t.amount.toLocaleString()} ₺
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* NEW DEALER CREATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Yeni Cari Hesap Kartı Ekle</h2>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">Kurumsal B2B Kayıt Formu</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:text-red-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateDealer} className="flex-1 overflow-y-auto p-8 space-y-6">
              
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-4">
                  <button
                    type="button"
                    onClick={() => setNewDealer({ ...newDealer, cariTipi: "CORPORATE" })}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      newDealer.cariTipi === "CORPORATE" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Kurumsal (B2B)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDealer({ ...newDealer, cariTipi: "INDIVIDUAL" })}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      newDealer.cariTipi === "INDIVIDUAL" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Bireysel (B2C)
                  </button>
                </div>

                <span className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide block border-b border-slate-100 pb-1">
                  {newDealer.cariTipi === "CORPORATE" ? "Kurumsal Cari Kart Bilgileri" : "Bireysel Cari Kart Bilgileri"}
                </span>

                {newDealer.cariTipi === "CORPORATE" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Firma Adı (Cari Ünvan) *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Örn: Zeta Dağıtım ve Ticaret A.Ş." 
                        value={newDealer.name} 
                        onChange={(e) => setNewDealer({...newDealer, name: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">E-Posta (B2B Giriş) *</label>
                      <input 
                        required 
                        type="email" 
                        placeholder="muhasebe@firma.com" 
                        value={newDealer.email} 
                        onChange={(e) => setNewDealer({...newDealer, email: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Telefon (İletişim) *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="05551234567" 
                        value={newDealer.phone} 
                        onChange={(e) => setNewDealer({...newDealer, phone: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Vergi Dairesi *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Boğaziçi VD" 
                        value={newDealer.taxOffice || ""} 
                        onChange={(e) => setNewDealer({...newDealer, taxOffice: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Vergi No *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="10 haneli vergi numarası" 
                        value={newDealer.taxId || ""} 
                        onChange={(e) => setNewDealer({...newDealer, taxId: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">MERSİS No</label>
                      <input 
                        type="text" 
                        placeholder="16 haneli MERSİS no" 
                        value={newDealer.mersisNo || ""} 
                        onChange={(e) => setNewDealer({...newDealer, mersisNo: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Yetkili Kişi</label>
                      <input 
                        type="text" 
                        placeholder="Ad Soyad" 
                        value={newDealer.yetkiliKisi || ""} 
                        onChange={(e) => setNewDealer({...newDealer, yetkiliKisi: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Web Sitesi</label>
                      <input 
                        type="text" 
                        placeholder="https://www.firma.com" 
                        value={newDealer.webSitesi || ""} 
                        onChange={(e) => setNewDealer({...newDealer, webSitesi: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Ad *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Örn: Ahmet" 
                        value={newDealer.ad || ""} 
                        onChange={(e) => setNewDealer({...newDealer, ad: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Soyad *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Örn: Yılmaz" 
                        value={newDealer.soyad || ""} 
                        onChange={(e) => setNewDealer({...newDealer, soyad: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">E-Posta *</label>
                      <input 
                        required 
                        type="email" 
                        placeholder="ahmet@bireysel.com" 
                        value={newDealer.email || ""} 
                        onChange={(e) => setNewDealer({...newDealer, email: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Telefon *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="05551234567" 
                        value={newDealer.phone || ""} 
                        onChange={(e) => setNewDealer({...newDealer, phone: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">TC Kimlik No</label>
                      <input 
                        type="text" 
                        placeholder="11 haneli TCKN" 
                        value={newDealer.tckn || ""} 
                        onChange={(e) => setNewDealer({...newDealer, tckn: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Doğum Tarihi</label>
                      <input 
                        type="date" 
                        value={newDealer.dogumTarihi || ""} 
                        onChange={(e) => setNewDealer({...newDealer, dogumTarihi: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide block border-b border-slate-100 pb-1">Ticari Ayarlar &amp; Risk Sınırları</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Cari Grubu (Grup Seviyesi)</label>
                    <select 
                      value={newDealer.dealerGroup} 
                      onChange={(e) => setNewDealer({...newDealer, dealerGroup: e.target.value})} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:border-orange-400 outline-none cursor-pointer"
                    >
                      <option value="Platin">Platin</option>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Standart">Standart</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Fiyat Grubu</label>
                    <select 
                      value={newDealer.priceGroup} 
                      onChange={(e) => setNewDealer({...newDealer, priceGroup: e.target.value})} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:border-orange-400 outline-none cursor-pointer"
                    >
                      <option value="Liste">Liste Fiyatı</option>
                      <option value="MaliyetArtı10">Maliyet + %10</option>
                      <option value="MaliyetArtı15">Maliyet + %15</option>
                      <option value="MaliyetArtı20">Maliyet + %20</option>
                      <option value="Özel İskonto">Özel İskonto</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Başlangıç Risk Limiti (₺)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newDealer.riskLimit} 
                      onChange={(e) => setNewDealer({...newDealer, riskLimit: Math.max(0, parseFloat(e.target.value) || 0)})} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Başlangıç Vade (Gün)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newDealer.vadeGun} 
                      onChange={(e) => setNewDealer({...newDealer, vadeGun: Math.max(0, parseInt(e.target.value) || 0)})} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide block border-b border-slate-100 pb-1">B2B Portal Ayarları</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Minimum Sipariş Miktarı</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newDealer.b2bMinQty} 
                      onChange={(e) => setNewDealer({...newDealer, b2bMinQty: Math.max(0, parseFloat(e.target.value) || 0)})} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Ödeme Koşulu</label>
                    <select 
                      value={newDealer.b2bPaymentTerms} 
                      onChange={(e) => setNewDealer({...newDealer, b2bPaymentTerms: e.target.value})} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:bg-white focus:border-orange-400 outline-none cursor-pointer"
                    >
                      <option value="Peşin (Kredi Kartı / Havale)">Peşin (Kredi Kartı / Havale)</option>
                      <option value="30 Gün Vadeli">30 Gün Vadeli</option>
                      <option value="60 Gün Vadeli">60 Gün Vadeli</option>
                      <option value="90 Gün Vadeli">90 Gün Vadeli</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider ml-0.5">Cari Entegrasyon Kodu</label>
                    <input 
                      type="text" 
                      placeholder="Örn: B2B-ENT-001" 
                      value={newDealer.b2bCode} 
                      onChange={(e) => setNewDealer({...newDealer, b2bCode: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs focus:bg-white focus:border-orange-400" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Cari Kartı Oluştur
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
