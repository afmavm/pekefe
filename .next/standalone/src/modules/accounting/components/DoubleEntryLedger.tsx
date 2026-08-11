"use client";

import React, { useState, useMemo } from "react";
import { 
  ClipboardList, 
  Search, 
  Plus, 
  X, 
  Save, 
  AlertTriangle,
  ArrowRightLeft,
  User,
  Calendar,
  Layers
} from "lucide-react";
import { JournalEntry, AccountingAccount } from "../types";
import { createJournalEntryAction } from "../server/accountingActions";
import { toast } from "sonner";

interface DoubleEntryLedgerProps {
  journalEntries: JournalEntry[];
  accounts: AccountingAccount[];
  onRefresh: () => void;
}

export default function DoubleEntryLedger({ journalEntries, accounts, onRefresh }: DoubleEntryLedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Journal Entry Form State
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryType, setEntryType] = useState("GENERAL");
  const [lines, setLines] = useState<Array<{
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description: string;
  }>>([
    { debitAccountId: "", creditAccountId: "", amount: 0, description: "" }
  ]);

  const totalAmountSum = useMemo(() => {
    return lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  }, [lines]);

  // Filters
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      const matchSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (entry.createdBy && entry.createdBy.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [journalEntries, searchTerm]);

  // Form handlers
  const handleAddLine = () => {
    setLines([...lines, { debitAccountId: "", creditAccountId: "", amount: 0, description: "" }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      [field]: field === "amount" ? (parseFloat(value) || 0) : value
    };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Açıklama boş bırakılamaz.");
      return;
    }

    // Check basic validators
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.debitAccountId || !line.creditAccountId) {
        toast.error(`${i + 1}. satırda borçlu ve alacaklı hesapları seçmelisiniz.`);
        return;
      }
      if (line.debitAccountId === line.creditAccountId) {
        toast.error(`${i + 1}. satırda borç ve alacak hesabı aynı olamaz.`);
        return;
      }
      if (line.amount <= 0) {
        toast.error(`${i + 1}. satırda transfer tutarı sıfırdan büyük olmalıdır.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await createJournalEntryAction({
        description,
        date: new Date(entryDate),
        type: entryType,
        lines
      });

      if (res.success) {
        toast.success("Yevmiye fişi başarıyla kaydedildi.");
        setIsModalOpen(false);
        setDescription("");
        setLines([{ debitAccountId: "", creditAccountId: "", amount: 0, description: "" }]);
        onRefresh();
      } else {
        toast.error(res.error || "Yevmiye fişi oluşturulamadı.");
      }
    } catch (err) {
      toast.error("Bir bağlantı hatası oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Flattened lines list for tabular rendering
  const flattenedLines = useMemo(() => {
    const list: Array<{
      id: string;
      date: Date;
      number: string;
      description: string;
      createdBy: string;
      debitCode: string;
      debitName: string;
      creditCode: string;
      creditName: string;
      amount: number;
      lineDesc: string;
    }> = [];

    filteredEntries.forEach((entry) => {
      entry.lines?.forEach((line) => {
        list.push({
          id: line.id,
          date: entry.date,
          number: entry.number,
          description: entry.description,
          createdBy: entry.createdBy || "Admin",
          debitCode: line.debitAccount?.code || "—",
          debitName: line.debitAccount?.name || "Bilinmeyen Hesap",
          creditCode: line.creditAccount?.code || "—",
          creditName: line.creditAccount?.name || "Bilinmeyen Hesap",
          amount: line.amount,
          lineDesc: line.description || entry.description
        });
      });
    });

    return list;
  }, [filteredEntries]);

  return (
    <div className="space-y-6">
      
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white  p-4 rounded-2xl border border-slate-200/50  shadow-sm items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Açıklama, fiş no veya oluşturan kişiyle yevmiye ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-semibold focus:bg-white focus:border-[#f97316] outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" /> Yeni Fiş Girişi
        </button>
      </div>

      {/* Main Ledger Grid Table */}
      <div className="glass border border-slate-200/60  rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50  text-slate-500  text-xs font-bold tracking-wider uppercase border-b border-slate-200/60 ">
              <tr>
                <th className="px-6 py-5">Tarih</th>
                <th className="px-6 py-5">Fiş No</th>
                <th className="px-6 py-5">Borçlu Hesap (Debit)</th>
                <th className="px-6 py-5">Alacaklı Hesap (Credit)</th>
                <th className="px-6 py-5">Satır Açıklaması</th>
                <th className="px-6 py-5 text-right">Tutar</th>
                <th className="px-6 py-5 text-center">Oluşturan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  bg-white/20  backdrop-blur-sm text-xs font-semibold text-slate-700 ">
              {flattenedLines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400 font-bold uppercase tracking-wider">
                    Kayıtlı yevmiye fiş satırı bulunamadı.
                  </td>
                </tr>
              ) : (
                flattenedLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/40  transition-colors">
                    <td className="px-6 py-4 text-slate-505 font-bold">
                      {new Date(line.date).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-850 ">
                        {line.number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded font-mono">
                          {line.debitCode}
                        </span>
                        <span className="truncate max-w-[150px]" title={line.debitName}>
                          {line.debitName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-orange-50 text-[#f97316] border border-orange-100 text-xs font-bold rounded font-mono">
                          {line.creditCode}
                        </span>
                        <span className="truncate max-w-[150px]" title={line.creditName}>
                          {line.creditName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-505 max-w-[200px] truncate" title={line.lineDesc}>
                      {line.lineDesc}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 ">
                      ₺{line.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-slate-100  text-slate-700  rounded-full font-semibold uppercase">
                        <User className="w-2.5 h-2.5" />
                        {line.createdBy}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE JOURNAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white  relative z-10 w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100  animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100  flex justify-between items-center bg-slate-50/50 ">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-850  uppercase tracking-wider">Yeni Yevmiye Fiş Girişi</h2>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Çift Taraflı Ön Muhasebe Defter Kaydı</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center bg-slate-150  text-slate-500  hover:text-red-500 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* General Entry Info */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-0.5">Fiş Açıklaması *</label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: B2B Cari Tahsilat veya Personel Maaş Ödemesi"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl outline-none text-xs font-bold focus:bg-white focus:border-[#f97316]"
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-0.5">Kayıt Tarihi</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl outline-none text-xs font-bold focus:bg-white focus:border-[#f97316]"
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-0.5">İşlem Türü</label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50  border border-slate-200  rounded-xl font-bold text-xs outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="GENERAL">Mahsup Fişi (Genel)</option>
                    <option value="PAYMENT">Tediye Fişi (Ödeme)</option>
                    <option value="INVOICE">Fatura Tahakkuk</option>
                  </select>
                </div>
              </div>

              {/* Ledger Lines Builder */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100  pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hesap Satırları (Debits &amp; Credits)</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 cursor-pointer"
                  >
                    + Satır Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl border border-slate-150/60  bg-slate-50/20 ">
                      
                      {/* Debit Account Select */}
                      <div className="flex-1 space-y-1.5 w-full">
                        <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider ml-0.5">Borçlu Hesap (Debit)</label>
                        <select
                          value={line.debitAccountId}
                          onChange={(e) => handleLineChange(idx, "debitAccountId", e.target.value)}
                          className="w-full px-3 py-2 bg-white  border border-slate-200  rounded-lg text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="">-- Hesap Seçin --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name} ({acc.type === 'ASSET' ? 'Aktif' : acc.type === 'LIABILITY' ? 'Pasif' : acc.type === 'EQUITY' ? 'Özkaynak' : acc.type === 'REVENUE' ? 'Gelir' : 'Gider'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Connection Icon / Swap Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...lines];
                          const temp = updated[idx].debitAccountId;
                          updated[idx].debitAccountId = updated[idx].creditAccountId;
                          updated[idx].creditAccountId = temp;
                          setLines(updated);
                        }}
                        className="hidden md:flex p-2 items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200 bg-white mb-1.5"
                        title="Borçlu ve Alacaklı Hesapları Değiştir (Swap)"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      {/* Credit Account Select */}
                      <div className="flex-1 space-y-1.5 w-full">
                        <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider ml-0.5">Alacaklı Hesap (Credit)</label>
                        <select
                          value={line.creditAccountId}
                          onChange={(e) => handleLineChange(idx, "creditAccountId", e.target.value)}
                          className="w-full px-3 py-2 bg-white  border border-slate-200  rounded-lg text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="">-- Hesap Seçin --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name} ({acc.type === 'ASSET' ? 'Aktif' : acc.type === 'LIABILITY' ? 'Pasif' : acc.type === 'EQUITY' ? 'Özkaynak' : acc.type === 'REVENUE' ? 'Gelir' : 'Gider'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div className="space-y-1.5 w-full md:w-36">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-0.5">Satır Tutarı (₺)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={line.amount || ""}
                          onChange={(e) => handleLineChange(idx, "amount", e.target.value)}
                          className="w-full px-3 py-2 bg-white  border border-slate-200  rounded-lg text-xs font-bold outline-none text-right"
                        />
                      </div>

                      {/* Line description */}
                      <div className="flex-1 space-y-1.5 w-full">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-0.5">Satır Açıklaması</label>
                        <input
                          type="text"
                          placeholder="Boş bırakılırsa fiş açıklaması geçerli olur"
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                          className="w-full px-3 py-2 bg-white  border border-slate-200  rounded-lg text-xs font-semibold outline-none"
                        />
                      </div>

                      {/* Action delete button */}
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-2 text-slate-400 hover:text-red-500 border border-slate-200  hover:border-red-200 hover:bg-red-50 rounded-lg transition cursor-pointer mb-1.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-slate-150/50  pt-4 flex justify-between items-center bg-slate-50/30 p-2 rounded-2xl">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                    Borç ve Alacak kayıtları otomatik dengelenmiştir.
                  </div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pl-5">
                    Toplam Fiş Tutarı: <span className="text-[#f97316]">₺{totalAmountSum.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Fişi Kaydet
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
