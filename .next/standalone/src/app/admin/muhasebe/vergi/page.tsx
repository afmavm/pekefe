"use client";
import { useState, useEffect } from "react";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

const TAX_TYPES = ["KDV", "MUHTASAR", "KURUMLAR_VERGISI", "GELIR_VERGISI", "SGK", "DIGER"];
const TAX_STATUSES = ["BEKLIYOR", "ODENDI", "GECIKTI", "IPTAL"];

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

const emptyForm = {
  period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  type: "KDV",
  amount: "",
  taxBase: "",
  taxRate: "18",
  status: "BEKLIYOR",
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  paidDate: "",
  notes: "",
};

export default function VergiPage() {
  const [taxes, setTaxes] = useState<TaxDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTax, setEditTax] = useState<TaxDeclaration | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    fetch("/api/accounting/tax")
      .then((r) => r.json())
      .then(setTaxes)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditTax(null); setShowForm(true); };
  const openEdit = (tax: TaxDeclaration) => {
    setForm({
      period: tax.period,
      type: tax.type,
      amount: String(tax.amount),
      taxBase: String(tax.taxBase || ""),
      taxRate: String(tax.taxRate || "18"),
      status: tax.status,
      dueDate: tax.dueDate.split("T")[0],
      paidDate: tax.paidDate ? tax.paidDate.split("T")[0] : "",
      notes: tax.notes || "",
    });
    setEditTax(tax);
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      amount: parseTurkishCurrency(form.amount) || 0,
      taxBase: form.taxBase ? parseTurkishCurrency(form.taxBase) : null,
      taxRate: form.taxRate ? parseFloat(form.taxRate) : null,
      paidDate: form.paidDate || null,
    };
    if (editTax) {
      await fetch(`/api/accounting/tax/${editTax.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/accounting/tax", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/accounting/tax/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  };

  const markPaid = async (tax: TaxDeclaration) => {
    await fetch(`/api/accounting/tax/${tax.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ODENDI", paidDate: new Date().toISOString().split("T")[0] }) });
    load();
  };

  const statusIcon = (s: string) => {
    if (s === "ODENDI") return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
    if (s === "GECIKTI") return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
    return <Clock className="w-3.5 h-3.5 text-amber-600" />;
  };
  const statusColor = (s: string) => s === "ODENDI" ? "bg-green-100 text-green-700" : s === "GECIKTI" ? "bg-red-100 text-red-700" : s === "BEKLIYOR" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500";

  const totalUnpaid = taxes.filter((t) => t.status === "BEKLIYOR" || t.status === "GECIKTI").reduce((s, t) => s + t.amount, 0);
  const overdue = taxes.filter((t) => t.status === "BEKLIYOR" && new Date(t.dueDate) < new Date());

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <AlertCircle className="w-6 h-6 text-orange-500 shrink-0" /> Vergi Beyanları &amp; SGK
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Bekleyen: {formatCurrency(totalUnpaid)} • Vadesi Geçen: {overdue.length} beyanname
          </p>
        </div>
        <div>
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Beyan Ekle
          </button>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Vadesi geçen {overdue.length} vergi beyanı var!</p>
            <p className="text-xs text-red-600 mt-0.5">{overdue.map((t) => `${t.type} - ${t.period}`).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Dönem", "Vergi Türü", "Matrah", "Oran", "Tutar", "Son Ödeme", "Ödeme Tarihi", "Durum", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400"><RefreshCw className="inline w-4 h-4 animate-spin mr-2" />Yükleniyor...</td></tr>
            ) : taxes.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Vergi beyanı bulunamadı.</td></tr>
            ) : taxes.map((tax) => (
              <tr key={tax.id} className={`hover:bg-gray-50 ${tax.status === "GECIKTI" || (tax.status === "BEKLIYOR" && new Date(tax.dueDate) < new Date()) ? "bg-red-50/30" : ""}`}>
                <td className="px-4 py-3 font-medium">{tax.period}</td>
                <td className="px-4 py-3"><span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">{tax.type}</span></td>
                <td className="px-4 py-3 text-gray-500">{tax.taxBase ? formatCurrency(tax.taxBase) : "-"}</td>
                <td className="px-4 py-3 text-gray-500">{tax.taxRate ? `%${tax.taxRate}` : "-"}</td>
                <td className="px-4 py-3 font-medium text-red-600">{formatCurrency(tax.amount)}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(tax.dueDate).toLocaleDateString("tr-TR")}</td>
                <td className="px-4 py-3 text-gray-500">{tax.paidDate ? new Date(tax.paidDate).toLocaleDateString("tr-TR") : "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor(tax.status)}`}>
                    {statusIcon(tax.status)} {tax.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {tax.status === "BEKLIYOR" && (
                      <button onClick={() => markPaid(tax)} className="p-1.5 hover:bg-green-50 rounded text-green-600 text-xs" title="Ödendi olarak işaretle">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => openEdit(tax)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(tax.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTax ? "Beyanı Düzenle" : "Yeni Vergi Beyanı"}>
        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-200">
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Dönem (YYYY-AA)</label>
            <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="2025-01" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Vergi Türü</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {TAX_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Matrah (₺)</label>
            <Input type="currency" value={form.taxBase} onChange={(e) => setForm({ ...form, taxBase: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Oran (%)</label>
            <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="18" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Vergi Tutarı (₺) *</label>
            <Input type="currency" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Son Ödeme Tarihi</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Durum</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {TAX_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {form.status === "ODENDI" && (
            <div className="col-span-2 space-y-1">
              <label className="text-slate-500 dark:text-slate-400 block mb-1">Ödeme Tarihi</label>
              <input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" />
            </div>
          )}
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
        title="Beyanı Sil"
        message="Bu vergi beyanını silmek istediğinizden emin misiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

