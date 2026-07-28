"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  CreditCard,
  Tag,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Info
} from "lucide-react";
import Link from "next/link";

const INCOME_CATEGORIES = ["SATIS", "HIZMET", "KIRA_GELIRI", "FAIZ", "DIGER"];
const EXPENSE_CATEGORIES = ["KIRA", "MAAS", "ELEKTRIK", "SU", "INTERNET", "REKLAM", "NAKLIYE", "DIGER"];
const PAYMENT_METHODS = ["NAKIT", "KART", "HAVALE", "CEK"];

interface Transaction {
  id: string;
  type: "GELIR" | "GIDER";
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  status: string;
  reference?: string;
}

const emptyForm = {
  type: "GELIR" as "GELIR" | "GIDER",
  date: new Date().toISOString().split("T")[0],
  category: "SATIS",
  description: "",
  amount: "",
  paymentMethod: "NAKIT",
  status: "TAMAMLANDI",
  reference: "",
};

export default function GelirGiderPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "GELIR" | "GIDER">("ALL");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/accounting/income-expense")
      .then((r) => r.json())
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = (type: "GELIR" | "GIDER") => {
    setForm({ ...emptyForm, type, category: type === "GELIR" ? "SATIS" : "DIGER" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (t: Transaction) => {
    let cleanDesc = t.description;
    let refVal = t.reference || "";

    // Extract Ref from description if there's no native reference but description has [Ref: ...]
    if (!refVal && t.description) {
      const match = t.description.match(/\[Ref:\s*(.*?)\]/);
      if (match) {
        refVal = match[1];
        cleanDesc = t.description.replace(/\[Ref:\s*(.*?)\]/, "").trim();
      }
    }

    setForm({
      type: t.type,
      date: t.date.split("T")[0],
      category: t.category,
      description: cleanDesc,
      amount: String(t.amount),
      paymentMethod: t.paymentMethod,
      status: t.status,
      reference: refVal,
    });
    setEditItem(t);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: parseTurkishCurrency(form.amount) || 0 };
      const response = await fetch(
        editItem ? `/api/accounting/income-expense/${editItem.id}` : "/api/accounting/income-expense",
        { 
          method: editItem ? "PATCH" : "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify(payload) 
        }
      );
      if (!response.ok) throw new Error("İşlem kaydedilemedi.");
      toast.success(editItem ? "Hareket başarıyla güncellendi." : "Hareket başarıyla kaydedildi.");
      setShowForm(false);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`/api/accounting/income-expense/${deleteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Kayıt silinemedi.");
      toast.success("Nakit hareketi başarıyla silindi.");
      setDeleteId(null);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Silme işlemi başarısız oldu.");
    }
  };

  const filtered = transactions.filter((t) => {
    const matchTab = activeTab === "ALL" || t.type === activeTab;
    const matchSearch = !search || 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) || 
      (t.category && t.category.toLowerCase().includes(search.toLowerCase())) ||
      (t.reference && t.reference.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  // Calculate totals checking number casting explicitly to avoid string concatenation bugs
  const totalIncome = transactions
    .filter((t) => t.type === "GELIR" && t.status === "TAMAMLANDI")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "GIDER" && t.status === "TAMAMLANDI")
    .reduce((s, t) => s + Number(t.amount), 0);

  const net = totalIncome - totalExpense;
  const categories = form.type === "GELIR" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-orange-500 shrink-0" /> Gelir &amp; Gider Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Kasa ve banka nakit akışı hareketlerinizi tek panelden yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openAdd("GIDER")} 
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <TrendingDown className="w-4 h-4 text-rose-500" /> Gider Ekle
          </button>
          <button 
            onClick={() => openAdd("GELIR")} 
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-white" /> Gelir Ekle
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100/80 text-emerald-700 rounded-xl">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Toplam Gelir</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">ALINDI</span>
          </div>
          <p className="text-2xl font-black text-emerald-700 tracking-tight">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-red-50/30 border border-rose-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-100/80 text-rose-700 rounded-xl">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <span className="text-xs text-rose-800 font-bold uppercase tracking-wider">Toplam Gider</span>
            </div>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold uppercase">ÖDENDİ</span>
          </div>
          <p className="text-2xl font-black text-rose-700 tracking-tight">{formatCurrency(totalExpense)}</p>
        </div>

        <div className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition bg-gradient-to-br ${
          net >= 0 
            ? "from-indigo-50 to-blue-50/30 border-indigo-200 text-indigo-900" 
            : "from-amber-50 to-yellow-50/30 border-amber-250 text-amber-900"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${net >= 0 ? "bg-indigo-100/80 text-indigo-700" : "bg-amber-100/80 text-amber-700"}`}>
                <DollarSign className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${net >= 0 ? "text-indigo-800" : "text-indigo-800"}`}>Net Bakiye</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              net >= 0 ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
            }`}>MİZAN</span>
          </div>
          <p className={`text-2xl font-black tracking-tight ${net >= 0 ? "text-indigo-700" : "text-amber-700"}`}>
            {net >= 0 ? "+" : ""}{formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Filters & Actions Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm w-full sm:w-auto">
          {(["ALL", "GELIR", "GIDER"] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === tab 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "ALL" ? "Tümü" : tab === "GELIR" ? "Gelirler" : "Giderler"}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Açıklama, kategori veya referans..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-bold outline-none focus:border-slate-550 shadow-sm"
          />
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-550/5 border-b border-slate-200/60 text-slate-800 text-xs font-bold tracking-wider uppercase">
              <tr>
                <th className="px-6 py-5">Tarih</th>
                <th className="px-6 py-5">Tür</th>
                <th className="px-6 py-5">Kategori</th>
                <th className="px-6 py-5">Açıklama</th>
                <th className="px-6 py-5">Ödeme</th>
                <th className="px-6 py-5">Referans</th>
                <th className="px-6 py-5 text-right">Tutar</th>
                <th className="px-6 py-5">Durum</th>
                <th className="px-6 py-5 text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center text-slate-400">
                    <RefreshCw className="inline w-5 h-5 animate-spin mr-2 text-[#f97316]" />
                    Finansal Hareketler Yükleniyor...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-wider">
                    Herhangi bir nakit hareketi kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-bold">
                      {new Date(t.date).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        t.type === "GELIR" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {t.type === "GELIR" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {t.type === "GELIR" ? "GELİR" : "GİDER"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 border border-slate-200/50 rounded-lg text-[11px] font-bold">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 max-w-64 truncate font-bold" title={t.description}>
                      {t.description}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold">
                      {t.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {t.reference || "—"}
                    </td>
                    <td className={`px-6 py-4 text-right font-black ${
                      t.type === "GELIR" ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {t.type === "GELIR" ? "+" : "-"}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                        t.status === "TAMAMLANDI" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-amber-50 text-amber-700 border-amber-150"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button 
                          onClick={() => openEdit(t)} 
                          className="p-2 border border-slate-150 hover:bg-slate-50 text-slate-500 rounded-xl transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(t.id)} 
                          className="p-2 border border-red-150 hover:bg-red-50 text-red-500 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Finansal Hareketi Düzenle" : form.type === "GELIR" ? "Yeni Gelir Hareketi" : "Yeni Gider Hareketi"}>
        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-200">
          
          <div className="space-y-1">
            <label className="text-slate-500 dark:text-slate-400 block mb-1">İşlem Türü</label>
            <select 
              value={form.type} 
              onChange={(e) => setForm({ 
                ...form, 
                type: e.target.value as "GELIR" | "GIDER", 
                category: e.target.value === "GELIR" ? "SATIS" : "DIGER" 
              })} 
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500"
            >
              <option value="GELIR">Gelir (Kasa Girişi)</option>
              <option value="GIDER">Gider (Kasa Çıkışı)</option>
            </select>
          </div>
 
           <div className="space-y-1">
             <label className="text-slate-500 dark:text-slate-400 block mb-1">Tarih</label>
             <input 
               type="date" 
               value={form.date} 
               onChange={(e) => setForm({ ...form, date: e.target.value })} 
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" 
             />
           </div>
 
           <div className="space-y-1">
             <label className="text-slate-500 dark:text-slate-400 block mb-1">Kategori</label>
             <select 
               value={form.category} 
               onChange={(e) => setForm({ ...form, category: e.target.value })} 
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500"
             >
               {categories.map((c) => <option key={c}>{c}</option>)}
             </select>
           </div>
 
           <div className="space-y-1">
             <label className="text-slate-500 dark:text-slate-400 block mb-1">Tutar (₺) *</label>
             <Input 
               type="currency" 
               value={form.amount} 
               onChange={(e) => setForm({ ...form, amount: e.target.value })} 
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" 
               placeholder="0,00" 
             />
           </div>
 
           <div className="space-y-1">
             <label className="text-slate-500 dark:text-slate-400 block mb-1">Ödeme Yöntemi</label>
             <select 
               value={form.paymentMethod} 
               onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} 
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none cursor-pointer focus:border-orange-500 dark:focus:border-orange-500"
             >
               {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
             </select>
           </div>
 
           <div className="space-y-1">
             <label className="text-slate-500 dark:text-slate-400 block mb-1">Referans No / Fiş No</label>
             <input 
               value={form.reference} 
               onChange={(e) => setForm({ ...form, reference: e.target.value })} 
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" 
               placeholder="Evrak, Dekont veya Fiş No" 
             />
           </div>
 
           <div className="col-span-2 space-y-1">
             <label className="text-slate-500 dark:text-slate-400 block mb-1">Açıklama *</label>
             <input 
               value={form.description} 
               onChange={(e) => setForm({ ...form, description: e.target.value })} 
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500" 
               placeholder="İşleme dair açıklama giriniz..." 
             />
           </div>
         </div>
 
         <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
           <button 
             onClick={handleSave} 
             disabled={!form.amount || !form.description || saving} 
             className="flex-1 bg-orange-500 text-white font-bold text-xs py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:bg-orange-500/50 transition flex items-center justify-center cursor-pointer"
           >
             {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />}
             {editItem ? "Değişiklikleri Kaydet" : "Hareketi Kaydet"}
           </button>
           <button 
             onClick={() => setShowForm(false)} 
             className="px-5 border border-slate-200 text-slate-650 dark:border-slate-700 dark:text-slate-350 font-bold text-xs py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
           >
             İptal
           </button>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Nakit Hareketi Sil"
        message="Bu gelir/gider hareket kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

