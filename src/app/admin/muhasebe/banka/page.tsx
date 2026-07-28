"use client";
import { useState, useEffect } from "react";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import {
  Landmark, Plus, Edit2, Trash2, ArrowRightLeft, RefreshCw,
  CreditCard, TrendingUp, TrendingDown, Wallet,
} from "lucide-react";

const BANK_TYPES = ["VADESIZ", "VADELI", "KREDI", "DIGER"];
const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

const TYPE_LABELS: Record<string, string> = {
  VADESIZ: "Vadesiz",
  VADELI: "Vadeli",
  KREDI: "Kredi",
  DIGER: "Diğer",
};
const TYPE_COLORS: Record<string, string> = {
  VADESIZ: "bg-blue-50 text-blue-700",
  VADELI:  "bg-emerald-50 text-emerald-700",
  KREDI:   "bg-red-50 text-red-700",
  DIGER:   "bg-slate-100 text-slate-600",
};

interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  iban: string;
  currency: string;
  balance: number;
  branch?: string;
  type: string;
}

const emptyForm = {
  name: "",
  accountNumber: "",
  iban: "",
  currency: "TRY",
  balance: "",
  branch: "",
  type: "VADESIZ",
};

export default function BankaPage() {
  const [banks, setBanks]             = useState<Bank[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editBank, setEditBank]       = useState<Bank | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [transfer, setTransfer]       = useState({ fromBankId: "", toBankId: "", amount: "", description: "" });

  /* ─── Veri Yükle ─── */
  const load = () => {
    setLoading(true);
    fetch("/api/accounting/banks", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        // API { success: true, data: [...] } formatında dönebilir
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setBanks(list);
      })
      .catch(() => { setBanks([]); toast.error("Banka hesapları yüklenemedi."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* ─── Modal Aç ─── */
  const openAdd = () => { setForm(emptyForm); setEditBank(null); setShowForm(true); };
  const openEdit = (bank: Bank) => {
    setForm({
      name: bank.name,
      accountNumber: bank.accountNumber,
      iban: bank.iban,
      currency: bank.currency,
      balance: String(bank.balance),
      branch: bank.branch || "",
      type: bank.type,
    });
    setEditBank(bank);
    setShowForm(true);
  };

  /* ─── Kaydet ─── */
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Banka adı zorunludur."); return; }
    setSaving(true);
    const tid = toast.loading(editBank ? "Güncelleniyor..." : "Kaydediliyor...");
    try {
      const payload = { ...form, balance: parseTurkishCurrency(form.balance) || 0 };
      const url     = editBank ? `/api/accounting/banks/${editBank.id}` : "/api/accounting/banks";
      const method  = editBank ? "PATCH" : "POST";
      const res     = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.dismiss(tid);
      toast.success(editBank ? "Hesap güncellendi." : "Hesap eklendi.");
      setShowForm(false);
      load();
    } catch {
      toast.dismiss(tid);
      toast.error("İşlem başarısız.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Sil ─── */
  const handleDelete = async () => {
    if (!deleteId) return;
    const tid = toast.loading("Siliniyor...");
    try {
      await fetch(`/api/accounting/banks/${deleteId}`, { method: "DELETE" });
      toast.dismiss(tid);
      toast.success("Hesap silindi.");
    } catch {
      toast.dismiss(tid);
      toast.error("Silme başarısız.");
    }
    setDeleteId(null);
    load();
  };

  /* ─── Havale ─── */
  const handleTransfer = async () => {
    if (!transfer.fromBankId || !transfer.toBankId || !transfer.amount) return;
    const tid = toast.loading("Havale yapılıyor...");
    try {
      const res = await fetch("/api/accounting/banks/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...transfer, amount: parseTurkishCurrency(transfer.amount) }),
      });
      if (!res.ok) throw new Error();
      toast.dismiss(tid);
      toast.success("Havale başarıyla tamamlandı.");
      setShowTransfer(false);
      setTransfer({ fromBankId: "", toBankId: "", amount: "", description: "" });
      load();
    } catch {
      toast.dismiss(tid);
      toast.error("Havale başarısız.");
    }
  };

  /* ─── Özet Hesaplar ─── */
  const tryBanks = banks.filter(b => b.currency === "TRY");
  const totalTRY = tryBanks.reduce((s, b) => s + b.balance, 0);
  const posCount = banks.filter(b => b.balance > 0).length;
  const negCount = banks.filter(b => b.balance < 0).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-orange-500 shrink-0" /> Banka Hesapları
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Banka, kasa ve döviz hesapları yönetimi. Hesaplar arası havale ve virman.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-orange-500" /> Virman / Havale
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Hesap Ekle
          </button>
        </div>
      </div>

      {/* ── ÖZET KARTLAR ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam TRY</span>
          </div>
          <p className={`text-xl font-black ${totalTRY >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {formatCurrency(totalTRY)}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{tryBanks.length} TRY hesap</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Hesap</span>
          </div>
          <p className="text-xl font-black text-slate-800">{banks.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">aktif hesap</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pozitif</span>
          </div>
          <p className="text-xl font-black text-emerald-600">{posCount}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">bakiyeli hesap</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Negatif</span>
          </div>
          <p className="text-xl font-black text-red-500">{negCount}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">eksi bakiyeli</p>
        </div>
      </div>

      {/* ── BANKA KARTLARI ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 gap-3">
              <Landmark className="w-10 h-10 text-slate-200" />
              <p className="font-semibold text-sm">Henüz banka hesabı eklenmemiş.</p>
              <button
                onClick={openAdd}
                className="mt-1 inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" /> İlk Hesabı Ekle
              </button>
            </div>
          )}
          {banks.map((bank) => (
            <div key={bank.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Landmark className="w-4.5 h-4.5 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-sm text-slate-800">{bank.name}</h2>
                      {bank.branch && (
                        <p className="text-[11px] text-slate-400 font-medium">{bank.branch} Şubesi</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(bank)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition" title="Düzenle">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(bank.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-400 transition" title="Sil">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${TYPE_COLORS[bank.type] || "bg-slate-100 text-slate-600"}`}>
                    {TYPE_LABELS[bank.type] || bank.type}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-700">
                    {bank.currency}
                  </span>
                </div>

                {bank.iban && (
                  <p className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg truncate mb-1">
                    {bank.iban}
                  </p>
                )}
                {bank.accountNumber && (
                  <p className="text-[11px] text-slate-400 mb-1">Hesap No: {bank.accountNumber}</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Güncel Bakiye</span>
                <span className={`font-black text-xl ${bank.balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatCurrency(bank.balance, bank.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── HESAP EKLE / DÜZENLE MODAL ── */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editBank ? "Hesabı Düzenle" : "Yeni Banka Hesabı"}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-bold text-slate-500 block mb-1">Banka Adı *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition"
              placeholder="Örn: Garanti BBVA"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Hesap Türü</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
            >
              {BANK_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Para Birimi</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
            >
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-bold text-slate-500 block mb-1">IBAN</label>
            <input
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-orange-400 transition"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Hesap No</label>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Şube</label>
            <input
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition"
              placeholder="Şube adı"
            />
          </div>
          {!editBank && (
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 block mb-1">Başlangıç Bakiyesi</label>
              <Input
                type="currency"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition"
                placeholder="0,00"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer disabled:opacity-60"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="px-5 border border-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            İptal
          </button>
        </div>
      </Modal>

      {/* ── HAVALE MODAL ── */}
      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title="Hesaplar Arası Havale / Virman">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Gönderen Hesap</label>
            <select
              value={transfer.fromBankId}
              onChange={(e) => setTransfer({ ...transfer, fromBankId: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Seçin...</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {formatCurrency(b.balance, b.currency)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Alıcı Hesap</label>
            <select
              value={transfer.toBankId}
              onChange={(e) => setTransfer({ ...transfer, toBankId: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Seçin...</option>
              {banks.filter((b) => b.id !== transfer.fromBankId).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Tutar</label>
            <Input
              type="currency"
              value={transfer.amount}
              onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Açıklama</label>
            <input
              value={transfer.description}
              onChange={(e) => setTransfer({ ...transfer, description: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition"
              placeholder="Transfer açıklaması (opsiyonel)"
            />
          </div>
        </div>
        <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={handleTransfer}
            disabled={!transfer.fromBankId || !transfer.toBankId || !transfer.amount}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            Havale Yap
          </button>
          <button
            onClick={() => setShowTransfer(false)}
            className="px-5 border border-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            İptal
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hesabı Sil"
        message="Bu banka hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

