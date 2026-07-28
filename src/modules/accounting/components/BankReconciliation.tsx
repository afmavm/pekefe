"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Building2, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  TrendingUp, 
  Plus, 
  DollarSign, 
  FileText,
  AlertCircle
} from "lucide-react";
import { Bank, Invoice } from "../types";
import { processBankTransferAction, reconcileInvoiceAction } from "../server/accountingActions";
import { toast } from "sonner";

interface BankReconciliationProps {
  banks: Bank[];
  invoices: Invoice[];
  onRefresh: () => void;
}

export default function BankReconciliation({ banks, invoices, onRefresh }: BankReconciliationProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Transfer Form State
  const [fromBankId, setFromBankId] = useState("");
  const [toBankId, setToBankId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");

  // Reconciliation Dialog state
  const [reconcilingInvoice, setReconcilingInvoice] = useState<Invoice | null>(null);
  const [targetBankId, setTargetBankId] = useState("");

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromBankId || !toBankId || !transferAmount) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    if (fromBankId === toBankId) {
      toast.error("Kaynak ve hedef banka hesabı aynı olamaz.");
      return;
    }
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Geçerli bir transfer tutarı giriniz.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await processBankTransferAction({
        fromBankId,
        toBankId,
        amount: amt,
        description: transferDesc || "Hesaplar Arası Virman"
      });

      if (res.success) {
        toast.success(res.message || "Banka transferi başarıyla tamamlandı.");
        setIsTransferModalOpen(false);
        setFromBankId("");
        setToBankId("");
        setTransferAmount("");
        setTransferDesc("");
        onRefresh();
      } else {
        toast.error(res.error || "Banka transferi gerçekleştirilemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingInvoice || !targetBankId) {
      toast.error("Tahsilatın aktarılacağı banka hesabını seçmelisiniz.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await reconcileInvoiceAction(reconcilingInvoice.id, targetBankId);
      if (res.success) {
        toast.success(res.message || "Fatura tahsilatı mutabakatı tamamlandı.");
        setReconcilingInvoice(null);
        setTargetBankId("");
        onRefresh();
      } else {
        toast.error(res.error || "Mutabakat tamamlanamadı.");
      }
    } catch (err) {
      toast.error("Mutabakat sırasında hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Liquidity Accounts Cards */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-900  uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#f97316]" /> Aktif Likidite &amp; Banka Hesapları
          </h4>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <ArrowRightLeft className="w-3 h-3" /> Virman / Hesaplar Arası Transfer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <div key={bank.id} className="bg-white  border border-slate-200/50  p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-extrabold text-slate-950  uppercase text-sm">{bank.name}</h5>
                  <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">{bank.branch || "Merkez Şube"} · {bank.type || "Vadesiz Ticari"}</p>
                </div>
                {bank.logo ? (
                  <Image src={bank.logo} alt={bank.name} width={80} height={24} className="h-6 w-auto max-w-[80px] object-contain rounded opacity-90" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs">🏦</div>
                )}
              </div>

              <div>
                <p className="text-2xl font-black text-[#f97316] tracking-tight">
                  ₺{bank.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  IBAN: {bank.iban}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Reconciliation Queue */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900  uppercase tracking-wide flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-amber-500" /> Açık Faturalar &amp; Mutabakat Kuyruğu
        </h4>

        <div className="glass border border-slate-200/60  rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50  text-slate-500  text-xs font-bold tracking-wider uppercase border-b border-slate-200/60 ">
                <tr>
                  <th className="px-6 py-5">Fatura Tarihi</th>
                  <th className="px-6 py-5">Cari Hesap / Bayi</th>
                  <th className="px-6 py-5">Vade Tarihi</th>
                  <th className="px-6 py-5">KDV / Matrah</th>
                  <th className="px-6 py-5 text-right">Fatura Toplamı</th>
                  <th className="px-6 py-5">Durum</th>
                  <th className="px-6 py-5 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  bg-white/20  backdrop-blur-sm text-xs font-semibold text-slate-700 ">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-slate-405 font-bold uppercase tracking-wider">
                      Mutabakat veya tahsilat bekleyen açık fatura kaydı bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isOverdue = new Date(inv.dueDate) < new Date();
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/40  transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-bold">
                          {new Date(inv.date).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-slate-850  uppercase">{inv.currentAccount?.name || "Bilinmeyen Cari"}</p>
                          <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">ID: {inv.currentAccountId}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(inv.dueDate).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          ₺{inv.taxAmount.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 ">
                          ₺{inv.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          {isOverdue ? (
                            <span className="px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-150 text-[11px] font-semibold rounded-full uppercase animate-pulse">Vadesi Geçmiş</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-orange-50 text-amber-600 border border-amber-150 text-[11px] font-semibold rounded-full uppercase">Beklemede</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setReconcilingInvoice(inv);
                              setTargetBankId(banks[0]?.id || "");
                            }}
                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-800 cursor-pointer shadow-sm"
                          >
                            Tahsil Et / Reconcile
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

      {/* BANK TRANSFER MODAL (VİRMAN) */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white  relative z-10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100  animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-150  bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#f97316]" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">Banka Virman / Transfer İşlemi</h3>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-slate-100  text-slate-500 rounded-full hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Kaynak Hesap *</label>
                <select
                  value={fromBankId}
                  onChange={(e) => setFromBankId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="">-- Kaynak Seçin --</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Bakiye: ₺{b.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Hedef Hesap *</label>
                <select
                  value={toBankId}
                  onChange={(e) => setToBankId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="">-- Hedef Seçin --</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Bakiye: ₺{b.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Transfer Tutarı (₺) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Açıklama</label>
                <input
                  type="text"
                  placeholder="Örn: Kasa virman transferi"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  Transferi Başlat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE RECONCILIATION MODAL */}
      {reconcilingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white  relative z-10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100  animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-150  bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 ">Fatura Tahsilat Mutabakatı</h3>
              </div>
              <button 
                onClick={() => setReconcilingInvoice(null)}
                className="w-7 h-7 flex items-center justify-center bg-slate-100  text-slate-500 rounded-full hover:text-red-500 cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleReconcileSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50/60  border border-slate-150 p-4 rounded-xl space-y-2 text-xs text-slate-500">
                <p><span className="font-bold">Firma Adı:</span> {reconcilingInvoice.currentAccount?.name || "Bilinmeyen"}</p>
                <p><span className="font-bold">Fatura Tutarı:</span> ₺{reconcilingInvoice.totalAmount.toLocaleString()}</p>
                <p><span className="font-bold">Fatura Tarihi:</span> {new Date(reconcilingInvoice.date).toLocaleDateString("tr-TR")}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Tahsilat Banka Hesabı *</label>
                <select
                  value={targetBankId}
                  onChange={(e) => setTargetBankId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="">-- Banka Seçin --</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Bakiye: ₺{b.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setReconcilingInvoice(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  Mutabakatı Tamamla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
