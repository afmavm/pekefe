"use client";
import { useState, useEffect } from "react";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, RefreshCw, BookOpen } from "lucide-react";
import { toast } from "sonner";

const JOURNAL_TYPES = ["MANUEL", "SATIS_FATURASI", "ALIS_FATURASI", "ODEME", "TAHSILAT", "KASA", "DIGER"];

interface JournalLine {
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  description: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

interface JournalEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  type: string;
  status: string;
  lines: {
    id: string;
    amount: number;
    description?: string;
    debitAccount: { code: string; name: string };
    creditAccount: { code: string; name: string };
  }[];
}

const emptyLine: JournalLine = { debitAccountId: "", creditAccountId: "", amount: "", description: "" };

export default function YevmiyePage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "MANUEL",
    lines: [{ ...emptyLine }],
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/accounting/journal").then((r) => r.json()),
      fetch("/api/accounting/accounts").then((r) => r.json()),
    ]).then(([entriesData, accountsData]) => {
      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    }).catch((err) => {
      console.error(err);
      toast.error("Yevmiye defteri verileri yüklenemedi.");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });
  const removeLine = (i: number) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  const updateLine = (i: number, field: keyof JournalLine, value: string) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [field]: value };
    setForm({ ...form, lines });
  };

  const totalDebit = form.lines.reduce((s, l) => s + (parseTurkishCurrency(l.amount) || 0), 0);
  const isBalanced = form.lines.every((l) => l.debitAccountId && l.creditAccountId && parseTurkishCurrency(l.amount) > 0);

  const handleSave = async () => {
    const toastId = toast.loading("Fiş kaydediliyor...");
    try {
      const payload = {
        ...form,
        lines: form.lines.map((l) => ({ ...l, amount: parseTurkishCurrency(l.amount) || 0 })),
      };
      const res = await fetch("/api/accounting/journal", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fiş kaydedilemedi.");

      toast.success("Yevmiye fişi taslak olarak kaydedildi.", { id: toastId });
      setShowForm(false);
      setForm({ date: new Date().toISOString().split("T")[0], description: "", type: "MANUEL", lines: [{ ...emptyLine }] });
      load();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu.", { id: toastId });
    }
  };

  const handlePost = async (id: string) => {
    const toastId = toast.loading("Fiş resmi olarak işleniyor...");
    try {
      const res = await fetch(`/api/accounting/journal/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ status: "POSTED" }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fiş onaylanamadı.");

      toast.success("Yevmiye fişi onaylandı (Posted).", { id: toastId });
      load();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu.", { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Fiş siliniyor...");
    try {
      const res = await fetch(`/api/accounting/journal/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fiş silinemedi.");

      toast.success("Yevmiye fişi silindi.", { id: toastId });
      setDeleteId(null);
      load();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu.", { id: toastId });
    }
  };

  const statusColor = (s: string) => s === "POSTED" ? "bg-green-100 text-green-700" : s === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-orange-500 shrink-0" /> Yevmiye Fişleri &amp; Defteri
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Resmi muhasebe yevmiye kayıtları ve borç/alacak fişleri.
          </p>
        </div>
        <div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Fiş Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Fiş No", "Tarih", "Tür", "Açıklama", "Toplam Tutar", "Durum", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400"><RefreshCw className="inline w-4 h-4 animate-spin mr-2" />Yükleniyor...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Yevmiye fişi bulunamadı.</td></tr>
            ) : entries.map((entry) => (
              <>
                <tr key={entry.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{entry.number}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(entry.date).toLocaleDateString("tr-TR")}</td>
                  <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{entry.type}</span></td>
                  <td className="px-4 py-3 text-gray-800">{entry.description}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(entry.lines.reduce((s, l) => s + Number(l.amount), 0))}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(entry.status)}`}>{entry.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {entry.status === "DRAFT" && (
                        <button onClick={() => handlePost(entry.id)} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Onayla (Post)">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setDeleteId(entry.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expanded === entry.id ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />}
                    </div>
                  </td>
                </tr>
                {expanded === entry.id && (
                  <tr key={`${entry.id}-detail`}>
                    <td colSpan={7} className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-200">
                            <th className="text-left py-1.5 font-medium">Borç Hesabı</th>
                            <th className="text-left py-1.5 font-medium">Alacak Hesabı</th>
                            <th className="text-right py-1.5 font-medium">Tutar</th>
                            <th className="text-left py-1.5 pl-4 font-medium">Açıklama</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines.map((line) => (
                            <tr key={line.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-1.5 text-gray-700">{line.debitAccount.code} — {line.debitAccount.name}</td>
                              <td className="py-1.5 text-gray-700">{line.creditAccount.code} — {line.creditAccount.name}</td>
                              <td className="py-1.5 text-right font-medium text-gray-800">{formatCurrency(Number(line.amount))}</td>
                              <td className="py-1.5 pl-4 text-gray-500">{line.description ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Journal Entry Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Yevmiye Fişi" size="lg">
        <div className="grid grid-cols-3 gap-4 mb-4 text-xs font-bold text-slate-700 dark:text-slate-200">
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Tarih</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" />
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Fiş Türü</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500">
              {JOURNAL_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">Açıklama</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" placeholder="Fiş açıklaması" />
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
          <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Fiş Satırları</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Toplam: {formatCurrency(totalDebit)}</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {form.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 p-2 items-center">
                <div className="col-span-4">
                  <select value={line.debitAccountId} onChange={(e) => updateLine(i, "debitAccountId", e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-500">
                    <option value="">Borç Hesabı...</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <select value={line.creditAccountId} onChange={(e) => updateLine(i, "creditAccountId", e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-500">
                    <option value="">Alacak Hesabı...</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <Input type="currency" value={line.amount} onChange={(e) => updateLine(i, "amount", e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-500" placeholder="0,00" />
                </div>
                <div className="col-span-1">
                  <input value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-500" placeholder="Not" />
                </div>
                <div className="col-span-1 flex justify-center">
                  {form.lines.length > 1 && (
                    <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 p-2">
            <button onClick={addLine} className="text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1 font-bold">
              <Plus className="w-3.5 h-3.5" /> Satır Ekle
            </button>
          </div>
        </div>

        <div className="flex gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={handleSave} disabled={!isBalanced || !form.description} className="flex-1 bg-orange-500 text-white font-bold text-xs py-3 rounded-xl hover:bg-orange-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Taslak Kaydet</button>
          <button onClick={() => setShowForm(false)} className="px-5 border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">İptal</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Fişi Sil"
        message="Bu yevmiye fişini silmek istediğinizden emin misiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

