"use client";

import { useState, useEffect } from "react";
import {
  Banknote, Search, RefreshCw, Loader2,
  ArrowDownCircle, ArrowUpCircle, Plus, X,
  Calendar, User, FileText, TrendingUp, TrendingDown, Activity,
  CheckCircle2, Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  currentAccount?: { name: string };
  amount: number;
  type: string;
  method: string;
  status: string;
  date: string;
  description?: string;
}

interface CurrentAccount { id: string; name: string; }

const TYPE_COLORS: Record<string, string> = {
  TAHSILAT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ODEME:    "bg-blue-50 text-blue-700 border-blue-200",
  IADE:     "bg-amber-50 text-amber-700 border-amber-200",
};

const METHOD_LABELS: Record<string, string> = {
  NAKIT:          "Nakit",
  BANKA_TRANSFER: "Banka Transferi",
  KREDI_KARTI:    "Kredi Kartı",
  CEK:            "Çek",
  SENET:          "Senet",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<CurrentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cariSearch, setCariSearch] = useState("");
  const [isCariDropdownOpen, setIsCariDropdownOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newPayment, setNewPayment] = useState({
    currentAccountId: "",
    type: "TAHSILAT",
    method: "NAKIT",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/accounting/payments?${params}`, { cache: "no-store" });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Ödemeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/dealers", { cache: "no-store" });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.dealers ?? [];
      setAccounts(list.map((d: any) => ({ id: d.id, name: d.name })));
    } catch {}
  };

  useEffect(() => { fetchPayments(); }, [typeFilter]);
  useEffect(() => { fetchAccounts(); }, []);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.currentAccount?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesDate =
      (!dateFrom || new Date(p.date) >= new Date(dateFrom)) &&
      (!dateTo   || new Date(p.date) <= new Date(dateTo));
    return matchesSearch && matchesDate;
  });

  const totalIn    = filtered.filter(p => p.type === "TAHSILAT").reduce((s, p) => s + p.amount, 0);
  const totalOut   = filtered.filter(p => p.type === "ODEME").reduce((s, p) => s + p.amount, 0);
  const totalIade  = filtered.filter(p => p.type === "IADE").reduce((s, p) => s + p.amount, 0);
  const netBalance = totalIn - totalOut - totalIade;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.currentAccountId) { toast.error("Cari hesap seçiniz"); return; }
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) { toast.error("Geçerli bir tutar giriniz"); return; }
    setSaving(true);
    try {
      const body = {
        currentAccountId: newPayment.currentAccountId,
        type: newPayment.type === "TAHSILAT" ? "Tahsilat" : newPayment.type === "ODEME" ? "Ödeme" : "İade",
        method: newPayment.method,
        amount: parseFloat(newPayment.amount),
        description: newPayment.description || "",
        date: new Date(newPayment.date).toISOString(),
        status: "TAMAMLANDI",
      };
      const res = await fetch("/api/accounting/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("İşlem başarıyla kaydedildi");
        setIsNewModalOpen(false);
        setNewPayment({
          currentAccountId: "", type: "TAHSILAT", method: "NAKIT",
          amount: "", description: "", date: new Date().toISOString().split("T")[0],
        });
        fetchPayments();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "İşlem kaydedilemedi");
      }
    } catch { toast.error("Bağlantı hatası"); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const rows = [
      ["İşlem No", "Cari Hesap", "Tür", "Yöntem", "Tarih", "Tutar (₺)", "Açıklama"],
      ...filtered.map(p => [
        `#${p.id.slice(-8).toUpperCase()}`,
        p.currentAccount?.name ?? "—",
        p.type === "TAHSILAT" ? "Tahsilat" : p.type === "ODEME" ? "Ödeme" : "İade",
        METHOD_LABELS[p.method] ?? p.method,
        new Date(p.date).toLocaleDateString("tr-TR"),
        p.amount.toFixed(2),
        p.description ?? "—",
      ])
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "odeme-tahsilat.csv"; a.click();
    toast.success("CSV dışa aktarıldı");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Banknote className="w-6 h-6 text-orange-500" /> Ödeme & Tahsilat Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Cari hesap tahsilat ve ödemelerini kaydedin, filtreleyin ve dışa aktarın.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <FileText className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Yeni İşlem Kaydet
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Tahsilat", value: totalIn,    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", icon: ArrowDownCircle, iconCls: "text-emerald-600 bg-emerald-100", sign: "+" },
          { label: "Toplam Ödeme",    value: totalOut,   color: "text-red-700",     bg: "bg-red-50 border-red-100",         icon: ArrowUpCircle,   iconCls: "text-red-600 bg-red-100",       sign: "-" },
          { label: "İade Tutarı",     value: totalIade,  color: "text-amber-700",   bg: "bg-amber-50 border-amber-100",     icon: TrendingDown,    iconCls: "text-amber-600 bg-amber-100",   sign: "" },
          { label: "Net Bakiye",      value: netBalance, color: netBalance >= 0 ? "text-emerald-700" : "text-red-700", bg: "bg-white border-slate-100", icon: Activity, iconCls: "text-slate-500 bg-slate-50", sign: netBalance >= 0 ? "+" : "" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-5 shadow-sm flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconCls}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{s.label}</p>
              <p className={`text-lg font-black mt-0.5 ${s.color}`}>
                {s.sign}₺{Math.abs(s.value).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Cari Hesap, ID veya açıklama ara..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-semibold text-slate-600">
          <option value="ALL">Tüm İşlemler</option>
          <option value="TAHSILAT">Tahsilatlar</option>
          <option value="ODEME">Ödemeler</option>
          <option value="IADE">İadeler</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-600"
          title="Başlangıç tarihi" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-600"
          title="Bitiş tarihi" />
        <button onClick={fetchPayments} className="p-2.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition" title="Yenile">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> Yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Banknote className="w-8 h-8 mx-auto mb-3 opacity-30" />
            Ödeme kaydı bulunamadı
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">İşlem No</th>
                  <th className="px-5 py-3">Cari Hesap</th>
                  <th className="px-5 py-3">Tür</th>
                  <th className="px-5 py-3">Ödeme Yöntemi</th>
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3 text-right">Tutar</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-slate-500">#{p.id.slice(-8).toUpperCase()}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{p.currentAccount?.name ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLORS[p.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {p.type === "TAHSILAT" ? <ArrowDownCircle className="w-3 h-3" /> : p.type === "ODEME" ? <ArrowUpCircle className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {p.type === "TAHSILAT" ? "Tahsilat" : p.type === "ODEME" ? "Ödeme" : "İade"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-medium">{METHOD_LABELS[p.method] ?? p.method}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(p.date).toLocaleDateString("tr-TR")}</td>
                    <td className={`px-5 py-4 text-right font-black ${p.type === "TAHSILAT" ? "text-emerald-700" : "text-red-700"}`}>
                      {p.type === "TAHSILAT" ? "+" : "-"}₺{p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 max-w-[180px] truncate">{p.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
              {/* Summary row */}
              <tfoot className="bg-slate-50 text-xs font-black border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-slate-600">Toplam ({filtered.length} işlem)</td>
                  <td className={`px-5 py-3 text-right ${netBalance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {netBalance >= 0 ? "+" : ""}₺{netBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── NEW PAYMENT MODAL ── */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 text-orange-500 rounded-lg"><Banknote className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Yeni İşlem Kaydı</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Tahsilat, Ödeme veya İade</p>
                </div>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Account */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Cari Hesap *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCariDropdownOpen(!isCariDropdownOpen)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-left outline-none focus:bg-white focus:border-orange-400 transition flex justify-between items-center"
                  >
                    <span className="truncate">
                      {accounts.find(a => a.id === newPayment.currentAccountId)?.name || "— Cari Seçiniz —"}
                    </span>
                    <span className="text-slate-400 text-xs">▼</span>
                  </button>

                  {isCariDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2 space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari ara..."
                          value={cariSearch}
                          onChange={(e) => setCariSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>

                      <div className="space-y-0.5 max-h-40 overflow-y-auto">
                        {accounts
                          .filter(a => a.name.toLowerCase().includes(cariSearch.toLowerCase()))
                          .map(a => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                setNewPayment(p => ({ ...p, currentAccountId: a.id }));
                                setIsCariDropdownOpen(false);
                                setCariSearch("");
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition ${
                                newPayment.currentAccountId === a.id
                                  ? "bg-orange-500 text-white"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              {a.name}
                            </button>
                          ))}
                        {accounts.filter(a => a.name.toLowerCase().includes(cariSearch.toLowerCase())).length === 0 && (
                          <div className="text-center py-4 text-slate-400 text-xs">Cari bulunamadı</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Type + Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">İşlem Türü</label>
                  <div className="flex gap-1.5">
                    {[
                      { val: "TAHSILAT", label: "Tahsilat", cls: "emerald" },
                      { val: "ODEME",    label: "Ödeme",    cls: "blue"    },
                      { val: "IADE",     label: "İade",     cls: "amber"   },
                    ].map(opt => (
                      <button key={opt.val} type="button" onClick={() => setNewPayment(p => ({ ...p, type: opt.val }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${newPayment.type === opt.val ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Ödeme Yöntemi</label>
                  <select value={newPayment.method} onChange={e => setNewPayment(p => ({ ...p, method: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition">
                    {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tutar (₺) *</label>
                  <input type="number" min={0} step="0.01" required
                    placeholder="0.00" value={newPayment.amount}
                    onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition text-right" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Tarih</label>
                  <input type="date" value={newPayment.date} onChange={e => setNewPayment(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Açıklama / Not</label>
                <textarea rows={2} placeholder="Fatura no, referans bilgisi vb."
                  value={newPayment.description} onChange={e => setNewPayment(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition resize-none" />
              </div>

              {/* Preview */}
              {newPayment.amount && parseFloat(newPayment.amount) > 0 && (
                <div className={`rounded-xl p-3 text-sm border ${newPayment.type === "TAHSILAT" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-blue-50 border-blue-100 text-blue-700"}`}>
                  <span className="font-bold">Önizleme: </span>
                  {newPayment.type === "TAHSILAT" ? "+" : "-"}₺{parseFloat(newPayment.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} — {METHOD_LABELS[newPayment.method]}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
                <button type="button" onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition">
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

