"use client";

import { useState, useEffect } from "react";
import { 
  BarChart as BarChartIcon, TrendingUp, DollarSign, PieChart as PieChartIcon, 
  Activity, ArrowUpRight, ArrowDownRight, AlertCircle, Layers, Plus, Search,
  Filter, Calendar, ClipboardList, Loader2, RefreshCw, CheckCircle2, Clock, 
  TrendingDown, FileText, ChevronDown, Check, X, Trash2
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { toast } from "sonner";

// Categories & Options
const EXPENSE_CATEGORIES = ["Tedarik", "Lojistik", "Personel", "Ofis & Kira", "Yazılım & IT", "Pazarlama", "Diğer"];
const TAX_TYPES = ["KDV-1", "KDV-2", "MUHTASAR", "GECICI_VERGI", "KURUMLAR_VERGISI"];
const PAYMENT_METHODS = ["NAKIT", "BANKA_TRANSFER", "KREDI_KARTI", "CEK", "SENET"];

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  monthlyIncome: { month: number; total: number }[];
  monthlyExpense: { month: number; total: number }[];
  expenseByCategory: { category: string; total: number }[];
  pendingInvoices: number;
  pendingTax: number;
  overdueTax: number;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  taxAmount: number;
  description: string;
  supplier?: string;
  receiptNo?: string;
  paymentMethod: string;
  status: string;
}

interface TaxDeclaration {
  id: string;
  period: string;
  type: string;
  amount: number;
  taxBase?: number;
  taxRate?: number;
  status: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

interface BudgetItem {
  id: string;
  year: number;
  month: number;
  category: string;
  planned: number;
  actual: number;
  notes?: string;
}

export default function AdvancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "expenses" | "taxes" | "budget">("summary");
  const [timeframe, setTimeframe] = useState("1Y");
  const [loading, setLoading] = useState(true);

  // Core Data states
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taxes, setTaxes] = useState<TaxDeclaration[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  // Filter/Search states
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("ALL");
  const [budgetYear, setBudgetYear] = useState(new Date().getFullYear());

  // Modal control states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "expense" | "tax" | "budget"; label: string } | null>(null);

  // New item form states
  const [newExpense, setNewExpense] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    vatRate: "20", // Default to 20%
    taxAmount: "",
    description: "",
    supplier: "",
    receiptNo: "",
    paymentMethod: PAYMENT_METHODS[0],
    date: new Date().toISOString().split("T")[0],
  });

  const [newTax, setNewTax] = useState({
    period: `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    type: TAX_TYPES[0],
    amount: "",
    taxBase: "",
    taxRate: "20", // Default to 20%
    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split("T")[0],
    notes: "",
  });

  const [newBudget, setNewBudget] = useState({
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1),
    category: EXPENSE_CATEGORIES[0],
    planned: "",
    notes: "",
  });

  // Fetch functions
  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/accounting/summary?year=${budgetYear}`);
      const data = await res.json();
      if (!data.error) setSummary(data);
    } catch (err) {
      console.error("Summary load error", err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/accounting/expenses");
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data);
    } catch {
      toast.error("Giderler yüklenemedi");
    }
  };

  const fetchTaxes = async () => {
    try {
      const res = await fetch("/api/accounting/tax");
      const data = await res.json();
      if (Array.isArray(data)) setTaxes(data);
    } catch {
      toast.error("Vergi beyannameleri yüklenemedi");
    }
  };

  const fetchBudget = async () => {
    try {
      const res = await fetch(`/api/accounting/budget?year=${budgetYear}`);
      const data = await res.json();
      if (Array.isArray(data)) setBudgetItems(data);
    } catch {
      toast.error("Bütçe verileri yüklenemedi");
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchExpenses(), fetchTaxes(), fetchBudget()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [budgetYear]);

  // Form input calculation helpers
  const handleExpenseAmountChange = (val: string) => {
    const rate = newExpense.vatRate;
    let tax = newExpense.taxAmount;
    if (rate !== "custom") {
      const amt = parseFloat(val);
      const r = parseFloat(rate);
      if (!isNaN(amt) && !isNaN(r) && r > 0) {
        tax = (amt * r / (100 + r)).toFixed(2);
      } else {
        tax = "0.00";
      }
    }
    setNewExpense(prev => ({ ...prev, amount: val, taxAmount: tax }));
  };

  const handleExpenseVatRateChange = (val: string) => {
    let tax = newExpense.taxAmount;
    if (val !== "custom") {
      const amt = parseFloat(newExpense.amount);
      const r = parseFloat(val);
      if (!isNaN(amt) && !isNaN(r) && r > 0) {
        tax = (amt * r / (100 + r)).toFixed(2);
      } else {
        tax = "0.00";
      }
    }
    setNewExpense(prev => ({ ...prev, vatRate: val, taxAmount: tax }));
  };

  const handleTaxBaseChange = (val: string) => {
    const rate = newTax.taxRate;
    let amt = newTax.amount;
    const b = parseFloat(val);
    const r = parseFloat(rate);
    if (!isNaN(b) && !isNaN(r)) {
      amt = (b * r / 100).toFixed(2);
    }
    setNewTax(prev => ({ ...prev, taxBase: val, amount: amt }));
  };

  const handleTaxRateChange = (val: string) => {
    const base = newTax.taxBase;
    let amt = newTax.amount;
    const b = parseFloat(base);
    const r = parseFloat(val);
    if (!isNaN(b) && !isNaN(r)) {
      amt = (b * r / 100).toFixed(2);
    }
    setNewTax(prev => ({ ...prev, taxRate: val, amount: amt }));
  };

  // Deletion execution helper
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    try {
      const res = await fetch(`/api/accounting/${type === "expense" ? "expenses" : type === "tax" ? "tax" : "budget"}?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Kayıt başarıyla silindi");
        setDeleteTarget(null);
        loadAll();
      } else {
        toast.error("Kayıt silinirken hata oluştu");
      }
    } catch {
      toast.error("Bağlantı hatası");
    }
  };

  // Handle forms
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newExpense.amount);
    const taxVal = parseFloat(newExpense.taxAmount || "0");

    if (!newExpense.amount || !newExpense.description) {
      toast.error("Tutar ve açıklama zorunludur");
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Gider tutarı sıfırdan büyük olmalıdır");
      return;
    }
    if (isNaN(taxVal) || taxVal < 0) {
      toast.error("KDV tutarı negatif olamaz");
      return;
    }
    if (taxVal > amountVal) {
      toast.error("KDV tutarı toplam tutardan büyük olamaz");
      return;
    }

    try {
      const res = await fetch("/api/accounting/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newExpense.category,
          amount: amountVal,
          taxAmount: taxVal,
          description: newExpense.description,
          supplier: newExpense.supplier || null,
          receiptNo: newExpense.receiptNo || null,
          paymentMethod: newExpense.paymentMethod,
          date: new Date(newExpense.date).toISOString(),
          status: "ODENDI"
        }),
      });
      if (res.ok) {
        toast.success("Gider kaydı başarıyla eklendi");
        setIsExpenseModalOpen(false);
        setNewExpense({
          category: EXPENSE_CATEGORIES[0],
          amount: "",
          vatRate: "20",
          taxAmount: "",
          description: "",
          supplier: "",
          receiptNo: "",
          paymentMethod: PAYMENT_METHODS[0],
          date: new Date().toISOString().split("T")[0],
        });
        loadAll();
      } else {
        toast.error("Gider eklenirken hata oluştu");
      }
    } catch {
      toast.error("Bir bağlantı hatası oluştu");
    }
  };

  const handleAddTax = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newTax.amount);
    const taxBaseVal = parseFloat(newTax.taxBase || "0");
    const taxRateVal = parseFloat(newTax.taxRate || "0");

    if (!newTax.amount || !newTax.period) {
      toast.error("Dönem ve tutar alanları zorunludur");
      return;
    }

    const periodRegex = /^\d{4}\/\d{2}$/;
    if (!periodRegex.test(newTax.period)) {
      toast.error("Dönem formatı YYYY/AA olmalıdır (Örn: 2026/05)");
      return;
    }

    const parts = newTax.period.split("/");
    const m = parseInt(parts[1]);
    if (m < 1 || m > 12) {
      toast.error("Dönem ayı 01-12 arasında olmalıdır");
      return;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Vergi tutarı sıfırdan büyük olmalıdır");
      return;
    }
    if (newTax.taxBase && (isNaN(taxBaseVal) || taxBaseVal < 0)) {
      toast.error("Matrah negatif olamaz");
      return;
    }

    try {
      const res = await fetch("/api/accounting/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: newTax.period,
          type: newTax.type,
          amount: amountVal,
          taxBase: newTax.taxBase ? taxBaseVal : null,
          taxRate: newTax.taxRate ? taxRateVal : null,
          dueDate: new Date(newTax.dueDate).toISOString(),
          status: "BEKLIYOR",
          notes: newTax.notes || null,
        }),
      });
      if (res.ok) {
        toast.success("Beyanname başarıyla eklendi");
        setIsTaxModalOpen(false);
        setNewTax({
          period: `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}`,
          type: TAX_TYPES[0],
          amount: "",
          taxBase: "",
          taxRate: "20",
          dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split("T")[0],
          notes: "",
        });
        loadAll();
      } else {
        toast.error("Beyanname eklenirken hata oluştu");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  const handlePayTax = async (id: string) => {
    try {
      const res = await fetch("/api/accounting/tax", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "ODENDI",
          paidDate: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        toast.success("Beyanname ödendi olarak işaretlendi");
        loadAll();
      } else {
        toast.error("Ödeme kaydedilemedi");
      }
    } catch {
      toast.error("İşlem gerçekleştirilemedi");
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const plannedVal = parseFloat(newBudget.planned);

    if (!newBudget.planned) {
      toast.error("Planlanan tutar girilmelidir");
      return;
    }
    if (isNaN(plannedVal) || plannedVal <= 0) {
      toast.error("Planlanan tutar sıfırdan büyük olmalıdır");
      return;
    }

    try {
      const res = await fetch("/api/accounting/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(newBudget.year),
          month: parseInt(newBudget.month),
          category: newBudget.category,
          planned: plannedVal,
          notes: newBudget.notes || null,
        }),
      });
      if (res.ok) {
        toast.success("Bütçe planı başarıyla kaydedildi");
        setIsBudgetModalOpen(false);
        setNewBudget({
          year: String(new Date().getFullYear()),
          month: String(new Date().getMonth() + 1),
          category: EXPENSE_CATEGORIES[0],
          planned: "",
          notes: "",
        });
        loadAll();
      } else {
        toast.error("Bütçe planı kaydedilirken hata oluştu");
      }
    } catch {
      toast.error("Bağlantı hatası");
    }
  };

  // Monthly comparison chart generator
  const getMonthlyChartData = () => {
    if (!summary) return [];
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return months.map((name, idx) => {
      const monthNum = idx + 1;
      const inc = summary.monthlyIncome.find(m => m.month === monthNum)?.total ?? 0;
      const exp = summary.monthlyExpense.find(m => m.month === monthNum)?.total ?? 0;
      return {
        name,
        B2B: inc,
        Maliyet: exp,
        NetKar: inc - exp
      };
    });
  };

  // Dynamic filter for expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(expenseSearch.toLowerCase()) || 
                          (e.supplier && e.supplier.toLowerCase().includes(expenseSearch.toLowerCase())) ||
                          (e.receiptNo && e.receiptNo.toLowerCase().includes(expenseSearch.toLowerCase()));
    const matchesCat = expenseCategoryFilter === "ALL" || e.category === expenseCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
            <BarChartIcon className="w-6 h-6 text-orange-500" /> Cari Hareketleri &amp; Finans Genel
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs font-medium">
            Gerçek zamanlı ciro dağılımları, gider defteri, vergi beyannameleri ve bütçe planlama.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={budgetYear}
            onChange={(e) => setBudgetYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-bold text-gray-700"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y} Mali Yılı</option>
            ))}
          </select>

          <button
            onClick={loadAll}
            className="p-2 text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            title="Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 py-2 rounded-2xl border shadow-sm gap-2">
        {[
          { id: "summary", label: "Analiz & Grafikler", icon: TrendingUp },
          { id: "expenses", label: "Gider Defteri", icon: TrendingDown },
          { id: "taxes", label: "Vergiler & Beyanlar", icon: FileText },
          { id: "budget", label: "Bütçe Planı", icon: Layers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-orange-500/10 text-orange-500"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-gray-100 shadow-sm gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-bold text-gray-400">Veriler yükleniyor...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: SUMMARY & ANALYTICS */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Toplam Ciro", value: `₺${summary?.totalIncome.toLocaleString("tr-TR") || "0"}`, desc: "Ödenmiş faturalar", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { title: "Toplam Gider", value: `₺${summary?.totalExpense.toLocaleString("tr-TR") || "0"}`, desc: "Ödenmiş operasyonel giderler", icon: TrendingDown, color: "text-blue-600", bg: "bg-blue-50" },
                  { title: "Net Kar", value: `₺${summary?.netProfit.toLocaleString("tr-TR") || "0"}`, desc: "Vergi öncesi net kâr", icon: Activity, color: summary && summary.netProfit >= 0 ? "text-emerald-600" : "text-red-600", bg: summary && summary.netProfit >= 0 ? "bg-emerald-50" : "bg-orange-50" },
                  { title: "Bekleyen Vergiler", value: `${summary?.pendingTax || "0"} Beyan`, desc: "KDV ve geçici vergiler", icon: AlertCircle, color: "text-amber-600", bg: "bg-orange-50" }
                ].map((metric, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2.5 rounded-xl ${metric.bg}`}>
                        <metric.icon className={`w-5 h-5 ${metric.color}`} />
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.title}</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{metric.value}</h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">{metric.desc}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Income vs Expense Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                    <TrendingUp className="w-4 h-4 text-orange-500" /> Gelir vs Gider Dağılımı ({budgetYear})
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getMonthlyChartData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#71717A' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#71717A' }} tickFormatter={(val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', notation: 'compact', maximumFractionDigits: 1 }).format(val)} />
                        <Tooltip 
                          cursor={{ fill: '#F4F4F5' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                          labelStyle={{ fontWeight: 900, color: '#18181B' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 800, paddingTop: '15px' }} />
                        <Bar dataKey="B2B" name="Cari Gelir" fill="#0F172A" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Maliyet" name="Maliyet & Gider" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Expense Pie Chart */}
                <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <PieChartIcon className="w-4 h-4 text-amber-500" /> Kategori Bazlı Gider Dağılımı
                  </h3>
                  
                  {summary && summary.expenseByCategory.length > 0 ? (
                    <>
                      <div className="flex-1 min-h-[180px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={summary.expenseByCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="total"
                              nameKey="category"
                              stroke="none"
                            >
                              {summary.expenseByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#f97316", "#0F172A", "#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"][index % 7]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                              itemStyle={{ fontWeight: 800 }}
                              formatter={(val) => `₺${val}`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-2 space-y-2 max-h-[140px] overflow-y-auto">
                        {summary.expenseByCategory.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#f97316", "#0F172A", "#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"][idx % 7] }} />
                              <span className="font-semibold text-slate-600">{item.category}</span>
                            </div>
                            <span className="font-black text-slate-950">₺{item.total.toLocaleString("tr-TR")}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center py-10">
                      <PieChartIcon className="w-8 h-8 opacity-25 mb-2" />
                      Mevcut ödenmiş gider verisi bulunmamaktadır.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPENSES */}
          {activeTab === "expenses" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Açıklama, tedarikçi veya fiş no ara..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20"
                  />
                </div>
                
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none bg-white font-bold text-gray-700"
                >
                  <option value="ALL">Tüm Kategoriler</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Gider Ekle
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                {filteredExpenses.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 text-xs">
                    <TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-25" />
                    Kriterlere uygun gider kaydı bulunamadı.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3">Tarih</th>
                          <th className="px-6 py-3">Kategori</th>
                          <th className="px-6 py-3">Tedarikçi & Belge</th>
                          <th className="px-6 py-3">Açıklama</th>
                          <th className="px-6 py-3">Ödeme Şekli</th>
                          <th className="px-6 py-3 text-right">KDV</th>
                          <th className="px-6 py-3 text-right">Toplam Tutar</th>
                          <th className="px-6 py-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs">
                        {filteredExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {new Date(exp.date).toLocaleDateString("tr-TR")}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">{exp.supplier || "—"}</div>
                              {exp.receiptNo && (
                                <div className="text-[10px] text-slate-400 mt-0.5">Fiş/Fatura: {exp.receiptNo}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={exp.description}>
                              {exp.description}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-500">
                              {exp.paymentMethod}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500 font-medium">
                              ₺{exp.taxAmount.toLocaleString("tr-TR")}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-red-700">
                              ₺{exp.amount.toLocaleString("tr-TR")}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setDeleteTarget({
                                  id: exp.id,
                                  type: "expense",
                                  label: `${new Date(exp.date).toLocaleDateString("tr-TR")} tarihli, ₺${exp.amount.toLocaleString("tr-TR")} tutarındaki ${exp.category} gideri`
                                })}
                                className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg inline-flex items-center justify-center transition-all"
                                title="Gider Kaydını Sil"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TAXES */}
          {activeTab === "taxes" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Vergi Beyannameleri & Harçlar</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mükellefiyet kapsamındaki dönemsel vergilerinizi takip edin</p>
                </div>
                <button
                  onClick={() => setIsTaxModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Beyanname Ekle
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                {taxes.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 text-xs">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-25" />
                    Beyanname kaydı bulunmamaktadır.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3">Dönem</th>
                          <th className="px-6 py-3">Vergi Türü</th>
                          <th className="px-6 py-3">Matrah</th>
                          <th className="px-6 py-3">Vergi Oranı</th>
                          <th className="px-6 py-3 text-right">Vergi Tutarı</th>
                          <th className="px-6 py-3">Son Ödeme</th>
                          <th className="px-6 py-3">Durum</th>
                          <th className="px-6 py-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs">
                        {taxes.map((tax) => {
                          const isOverdue = tax.status === "BEKLIYOR" && new Date(tax.dueDate) < new Date();
                          return (
                            <tr key={tax.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-6 py-4 font-bold text-slate-900">{tax.period}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-amber-800 border border-amber-200">
                                  {tax.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                {tax.taxBase ? `₺${tax.taxBase.toLocaleString("tr-TR")}` : "—"}
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium">
                                {tax.taxRate ? `%${tax.taxRate}` : "—"}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-slate-900">
                                ₺{tax.amount.toLocaleString("tr-TR")}
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium">
                                {new Date(tax.dueDate).toLocaleDateString("tr-TR")}
                              </td>
                              <td className="px-6 py-4">
                                {tax.status === "ODENDI" ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Ödendi
                                  </span>
                                ) : isOverdue ? (
                                  <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">
                                    <Clock className="w-3 h-3" /> Gecikmiş
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" /> Bekliyor
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                {tax.status === "BEKLIYOR" ? (
                                  <button
                                    onClick={() => handlePayTax(tax.id)}
                                    className="px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all"
                                  >
                                    Ödeme Yap
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {tax.paidDate ? new Date(tax.paidDate).toLocaleDateString("tr-TR") : "—"}
                                  </span>
                                )}
                                <button
                                  onClick={() => setDeleteTarget({
                                    id: tax.id,
                                    type: "tax",
                                    label: `${tax.period} dönemi, ₺${tax.amount.toLocaleString("tr-TR")} tutarındaki ${tax.type} beyannamesi`
                                  })}
                                  className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg inline-flex items-center justify-center transition-all"
                                  title="Beyannameyi Sil"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BUDGET */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Kategori Bütçe Planlaması</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Operasyonel maliyet hedefleri ve harcama sınırlarını belirleyin</p>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Bütçe Planı Ekle
                </button>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EXPENSE_CATEGORIES.map(category => {
                  const items = budgetItems.filter(item => item.category === category);
                  const totalPlanned = items.reduce((s, i) => s + i.planned, 0);
                  
                  // Calculate actual paid expenses in this category (from database)
                  const totalActual = expenses
                    .filter(e => e.category === category && e.status === "ODENDI")
                    .reduce((s, e) => s + e.amount, 0);

                  const ratio = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
                  const isWarning = ratio > 90;
                  const isExceeded = ratio > 100;

                  return (
                    <div key={category} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="inline-flex px-3 py-1 bg-slate-100 rounded-xl text-xs font-black text-slate-800">{category}</span>
                        {isExceeded ? (
                          <span className="text-[10px] font-black text-red-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Bütçe Aşımı</span>
                        ) : isWarning ? (
                          <span className="text-[10px] font-black text-amber-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Limit Yakın</span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Güvenli</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Planlanan</p>
                          <p className="text-base font-black text-slate-900">₺{totalPlanned.toLocaleString("tr-TR")}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Harcanan (Canlı)</p>
                          <p className="text-base font-black text-slate-900">₺{totalActual.toLocaleString("tr-TR")}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExceeded ? "bg-amber-600" : isWarning ? "bg-orange-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(ratio, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>Doluluk Oranı</span>
                          <span>%{ratio.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Budget Targets Table */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Aylık Bütçe Hedefleri Detay Listesi ({budgetYear})</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Dönemsel bütçe kalemlerini ve gerçekleşme oranlarını tek tek yönetin</p>
                </div>
                {budgetItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-25" />
                    Bu yıl için tanımlanmış bütçe hedefi bulunmamaktadır.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3">Dönem (Ay)</th>
                          <th className="px-6 py-3">Kategori</th>
                          <th className="px-6 py-3 text-right">Planlanan</th>
                          <th className="px-6 py-3 text-right">Gerçekleşen</th>
                          <th className="px-6 py-3 text-center">Doluluk Oranı</th>
                          <th className="px-6 py-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs font-semibold text-slate-700">
                        {budgetItems.map((item) => {
                          const matchingExpensesTotal = expenses
                            .filter(e => e.category === item.category && e.status === "ODENDI" && new Date(e.date).getMonth() + 1 === item.month && new Date(e.date).getFullYear() === item.year)
                            .reduce((s, e) => s + e.amount, 0);

                          const ratio = item.planned > 0 ? (matchingExpensesTotal / item.planned) * 100 : 0;
                          
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-6 py-4 text-slate-900 font-bold">{item.month}. Ay ({item.year})</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-slate-900 font-bold">₺{item.planned.toLocaleString("tr-TR")}</td>
                              <td className="px-6 py-4 text-right text-slate-600">₺{matchingExpensesTotal.toLocaleString("tr-TR")}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        ratio > 100 ? "bg-amber-600" : ratio > 90 ? "bg-orange-500" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${Math.min(ratio, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-bold">%{ratio.toFixed(0)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => setDeleteTarget({
                                    id: item.id,
                                    type: "budget",
                                    label: `${item.year}/${item.month} dönemi, ${item.category} kategorisine ait ₺${item.planned.toLocaleString("tr-TR")} bütçe hedefi`
                                  })}
                                  className="p-1.5 text-slate-400 hover:text-red-655 hover:bg-red-50 rounded-lg inline-flex items-center justify-center transition-all"
                                  title="Bütçe Hedefini Sil"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODALS ── */}

      {/* 1. EXPENSE ADD MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h2 className="text-md font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-500" /> Yeni Gider Kaydı
              </h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kategori</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-semibold text-slate-700"
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tarih</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Toplam Tutar (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => handleExpenseAmountChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">KDV Oranı</label>
                  <select
                    value={newExpense.vatRate}
                    onChange={(e) => handleExpenseVatRateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-semibold text-slate-700"
                  >
                    <option value="20">%20 (Genel KDV)</option>
                    <option value="10">%10 (İndirimli KDV)</option>
                    <option value="1">%1 (Gıda/Tohum vb.)</option>
                    <option value="0">%0 (KDV Muaf)</option>
                    <option value="custom">Özel Tutar Gir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">KDV Tutarı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newExpense.taxAmount}
                    onChange={(e) => setNewExpense({ ...newExpense, taxAmount: e.target.value })}
                    disabled={newExpense.vatRate !== "custom"}
                    className={`w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700 ${
                      newExpense.vatRate !== "custom" ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-100" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tedarikçi / Kurum</label>
                  <input
                    type="text"
                    placeholder="Tedarikçi adı"
                    value={newExpense.supplier}
                    onChange={(e) => setNewExpense({ ...newExpense, supplier: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Belge / Fiş No</label>
                  <input
                    type="text"
                    placeholder="Belge numarası"
                    value={newExpense.receiptNo}
                    onChange={(e) => setNewExpense({ ...newExpense, receiptNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ödeme Yöntemi</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-semibold text-slate-700"
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Açıklama</label>
                <textarea
                  placeholder="Gider detayları..."
                  rows={2}
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2 text-xs font-black uppercase text-slate-500 border border-gray-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-black uppercase text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition font-semibold"
                >
                  Gideri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. TAX ADD MODAL */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl space-y-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h2 className="text-md font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" /> Yeni Vergi Beyanı Ekle
              </h2>
              <button onClick={() => setIsTaxModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTax} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dönem (YYYY/AA)</label>
                  <input
                    type="text"
                    placeholder="Örn: 2026/05"
                    value={newTax.period}
                    onChange={(e) => setNewTax({ ...newTax, period: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vergi Türü</label>
                  <select
                    value={newTax.type}
                    onChange={(e) => setNewTax({ ...newTax, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-semibold text-slate-700"
                  >
                    {TAX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Matrah (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newTax.taxBase}
                    onChange={(e) => handleTaxBaseChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vergi Oranı (%)</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={newTax.taxRate}
                    onChange={(e) => handleTaxRateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Toplam Vergi Tutarı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newTax.amount}
                    onChange={(e) => setNewTax({ ...newTax, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Son Ödeme Tarihi</label>
                  <input
                    type="date"
                    value={newTax.dueDate}
                    onChange={(e) => setNewTax({ ...newTax, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Açıklama / Notlar</label>
                <textarea
                  placeholder="Ek açıklama..."
                  rows={2}
                  value={newTax.notes}
                  onChange={(e) => setNewTax({ ...newTax, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaxModalOpen(false)}
                  className="flex-1 py-2 text-xs font-black uppercase text-slate-500 border border-gray-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-black uppercase text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition font-semibold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. BUDGET ADD MODAL */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl space-y-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h2 className="text-md font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" /> Yeni Bütçe Hedefi Belirle
              </h2>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mali Yıl</label>
                  <select
                    value={newBudget.year}
                    onChange={(e) => setNewBudget({ ...newBudget, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-semibold text-slate-700"
                  >
                    {[2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Aylar</label>
                  <select
                    value={newBudget.month}
                    onChange={(e) => setNewBudget({ ...newBudget, month: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-semibold text-slate-700"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>{i + 1}. Ay</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Harcama Kategorisi</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 bg-white font-semibold text-slate-700"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Planlanan Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newBudget.planned}
                  onChange={(e) => setNewBudget({ ...newBudget, planned: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Notlar / Açıklama</label>
                <textarea
                  placeholder="Planlanan harcama notu..."
                  rows={2}
                  value={newBudget.notes}
                  onChange={(e) => setNewBudget({ ...newBudget, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 font-semibold text-slate-700 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 py-2 text-xs font-black uppercase text-slate-500 border border-gray-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-black uppercase text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition font-semibold"
                >
                  Planı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl space-y-6 border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Silme İşlemini Onayla</h3>
              <p className="text-xs text-slate-500 font-medium">
                Seçilen kaydı silmek istediğinize emin misiniz?<br />
                <strong className="text-slate-700 block mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-bold">
                  {deleteTarget.label}
                </strong>
                <span className="text-red-600 block mt-2 text-[10px] font-black uppercase">Bu işlem geri alınamaz!</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-xs font-black uppercase text-slate-500 border border-gray-200 rounded-xl hover:bg-slate-50 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-black uppercase text-white bg-red-650 hover:bg-red-600 rounded-xl transition"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

