"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Plus, Edit2, Trash2, Search, RefreshCw, Filter, TrendingDown } from "lucide-react";

const CATEGORIES = ["KIRA", "MAAS", "ELEKTRIK", "SU", "INTERNET", "REKLAM", "NAKLIYE", "DIGER"];
const PAYMENT_METHODS = ["NAKIT", "KART", "HAVALE", "CEK"];
const STATUSES = ["ODENDI", "BEKLIYOR", "IPTAL"];

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

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  category: "DIGER",
  amount: "",
  taxAmount: "0",
  description: "",
  supplier: "",
  receiptNo: "",
  paymentMethod: "NAKIT",
  status: "ODENDI",
};

export default function GiderlerPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat !== "ALL") params.set("category", filterCat);
    fetch("/api/accounting/expenses?" + params.toString())
      .then((r) => r.json())
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [filterCat]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm); setEditExpense(null); setShowForm(true); };
  const openEdit = (exp: Expense) => {
    setForm({
      date: exp.date.split("T")[0],
      category: exp.category,
      amount: String(exp.amount),
      taxAmount: String(exp.taxAmount),
      description: exp.description,
      supplier: exp.supplier || "",
      receiptNo: exp.receiptNo || "",
      paymentMethod: exp.paymentMethod,
      status: exp.status,
    });
    setEditExpense(exp);
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { ...form, amount: parseTurkishCurrency(form.amount) || 0, taxAmount: parseTurkishCurrency(form.taxAmount) || 0 };
    if (editExpense) {
      await fetch(`/api/accounting/expenses/${editExpense.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/accounting/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/accounting/expenses/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  };

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.supplier || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPaid = expenses.filter((e) => e.status === "ODENDI").reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter((e) => e.status === "BEKLIYOR").reduce((s, e) => s + e.amount, 0);

  const statusColor = (s: string) => s === "ODENDI" ? "bg-green-100 text-green-700" : s === "BEKLIYOR" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-orange-500 shrink-0" /> Gider Analizleri &amp; Kalemleri
          </h1>
          <div className="flex gap-4 mt-0.5">
            <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Ödenen: {formatCurrency(totalPaid)}</p>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Bekleyen: {formatCurrency(totalPending)}</p>
          </div>
        </div>
        <div>
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Gider Ekle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Açıklama veya tedarikçi ara..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="ALL">Tüm Kategoriler</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="ALL">Tüm Durumlar</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Tarih", "Kategori", "Açıklama", "Tedarikçi", "Fiş No", "Ödeme", "Tutar", "KDV", "Durum", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400"><RefreshCw className="inline w-4 h-4 animate-spin mr-2" />Yükleniyor...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Gider bulunamadı.</td></tr>
            ) : filtered.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(exp.date).toLocaleDateString("tr-TR")}</td>
                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{exp.category}</span></td>
                <td className="px-4 py-3 text-gray-800 max-w-32 truncate">{exp.description}</td>
                <td className="px-4 py-3 text-gray-500">{exp.supplier || "-"}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{exp.receiptNo || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{exp.paymentMethod}</td>
                <td className="px-4 py-3 font-medium text-red-600">{formatCurrency(exp.amount)}</td>
                <td className="px-4 py-3 text-gray-500">{formatCurrency(exp.taxAmount)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(exp.status)}`}>{exp.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(exp)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(exp.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editExpense ? "Gideri Düzenle" : "Yeni Gider"}>
        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-200">
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Tarih</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Kategori</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Tutar (₺) *</label>
            <Input type="currency" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">KDV (₺)</label>
            <Input type="currency" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Ödeme Yöntemi</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Durum</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Tedarikçi</label>
            <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="Tedarikçi adı" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Fiş / Fatura No</label>
            <input value={form.receiptNo} onChange={(e) => setForm({ ...form, receiptNo: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="F-001" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Açıklama *</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="Gider açıklaması" />
          </div>
        </div>
        <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={handleSave} className="flex-1 bg-orange-500 text-white font-bold text-xs py-3 rounded-xl hover:bg-orange-600 transition cursor-pointer">Kaydet</button>
          <button onClick={() => setShowForm(false)} className="px-5 border border-slate-200 text-slate-650 dark:border-slate-700 dark:text-slate-350 font-bold text-xs py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">İptal</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Gideri Sil"
        message="Bu gider kaydını silmek istediğinizden emin misiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

