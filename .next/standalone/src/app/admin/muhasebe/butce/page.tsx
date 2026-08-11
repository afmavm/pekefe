"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

const CATEGORIES = ["MAAS", "KIRA", "ELEKTRIK", "SU", "INTERNET", "REKLAM", "NAKLIYE", "SATIN_ALMA", "GELIR", "DIGER"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

interface BudgetItem {
  id: string;
  year: number;
  month: number;
  category: string;
  planned: number;
  actual: number;
  notes?: string;
}

const emptyForm = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  category: "DIGER",
  planned: "",
  actual: "0",
  notes: "",
};

export default function ButcePage() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(0); // 0 = all months

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ year: String(filterYear) });
    if (filterMonth > 0) params.set("month", String(filterMonth));
    fetch("/api/accounting/budget?" + params.toString())
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [filterYear, filterMonth]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...emptyForm, year: filterYear, month: filterMonth || new Date().getMonth() + 1 }); setEditItem(null); setShowForm(true); };
  const openEdit = (item: BudgetItem) => {
    setForm({ year: item.year, month: item.month, category: item.category, planned: String(item.planned), actual: String(item.actual), notes: item.notes || "" });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { ...form, year: Number(form.year), month: Number(form.month), planned: parseTurkishCurrency(form.planned) || 0, actual: parseTurkishCurrency(form.actual) || 0 };
    if (editItem) {
      await fetch(`/api/accounting/budget/${editItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/accounting/budget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/accounting/budget/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  };

  const totalPlanned = items.reduce((s, i) => s + i.planned, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const totalDiff = totalPlanned - totalActual;

  // Group by month
  const byMonth = items.reduce<Record<number, BudgetItem[]>>((acc, item) => {
    if (!acc[item.month]) acc[item.month] = [];
    acc[item.month].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-orange-500 shrink-0" /> Bütçe Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Planlanan vs Gerçekleşen Karşılaştırma
          </p>
        </div>
        <div>
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Bütçe Kalemi Ekle
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Planlanan</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Gerçekleşen</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalActual)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Fark</p>
          <div className="flex items-center gap-1">
            {totalDiff >= 0 ? <TrendingDown className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-red-500" />}
            <p className={`text-xl font-bold ${totalDiff >= 0 ? "text-green-600" : "text-red-600"}`}>{totalDiff >= 0 ? "+" : ""}{formatCurrency(totalDiff)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value={0}>Tüm Aylar</option>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Yükleniyor...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">
          Bu dönem için bütçe kalemi bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byMonth).sort(([a], [b]) => Number(a) - Number(b)).map(([month, monthItems]) => (
            <div key={month} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-700 text-sm">{MONTHS[Number(month) - 1]} {filterYear}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Kategori</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Planlanan</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Gerçekleşen</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Fark</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">%</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthItems.map((item) => {
                    const diff = item.planned - item.actual;
                    const pct = item.planned > 0 ? Math.round((item.actual / item.planned) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{item.category}</td>
                        <td className="px-4 py-2.5 text-right text-blue-600">{formatCurrency(item.planned)}</td>
                        <td className="px-4 py-2.5 text-right text-red-600">{formatCurrency(item.actual)}</td>
                        <td className={`px-4 py-2.5 text-right font-medium ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${pct > 100 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-medium ${pct > 100 ? "text-red-600" : "text-gray-600"}`}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteId(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Bütçe Kalemini Düzenle" : "Yeni Bütçe Kalemi"}>
        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-200">
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Yıl</label>
            <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Ay</label>
            <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Kategori</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Planlanan Tutar *</label>
            <Input type="currency" value={form.planned} onChange={(e) => setForm({ ...form, planned: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Gerçekleşen Tutar</label>
            <Input type="currency" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="0,00" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Notlar</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="Opsiyonel açıklama" />
          </div>
        </div>
        <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={handleSave} className="flex-1 bg-orange-500 text-white font-bold text-xs py-3 rounded-xl hover:bg-orange-600 transition cursor-pointer">Kaydet</button>
          <button onClick={() => setShowForm(false)} className="px-5 border border-slate-200 text-slate-650 dark:border-slate-700 dark:text-slate-350 font-bold text-xs py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">İptal</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Bütçe Kalemini Sil"
        message="Bu bütçe kalemini silmek istediğinizden emin misiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

