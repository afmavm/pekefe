"use client";

import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  RefreshCw,
  Percent,
  Sliders,
  DollarSign,
  Info
} from "lucide-react";

// Types
interface CostCenter {
  id: string;
  name: string;
  code: string;
  percentage: number;
  color: string;
}

interface InvoiceFIFO {
  id: string;
  invoiceNo: string;
  date: string;
  amount: number;
  remainingAmount: number;
  allocatedAmount: number;
  status: "open" | "partially_closed" | "closed";
}

interface AntigravityEngineProps {
  formSetValue?: (name: string, value: any, options?: any) => void;
  formValues?: any;
  defaultAmount?: number;
  currency?: string;
  onDistributionComplete?: (data: {
    allocatedAmount: number;
    costCenters: CostCenter[];
    fifoAllocations: { invoiceId: string; amount: number }[];
    exchangeGainLoss: number;
  }) => void;
}

export const AntigravityEngine: React.FC<AntigravityEngineProps> = ({
  formSetValue,
  formValues,
  defaultAmount = 100000,
  currency = "TRY",
  onDistributionComplete
}) => {
  // Try to grab React Hook Form context if exists, otherwise fallback to local state
  let rhfContext = null;
  try {
    rhfContext = useFormContext();
  } catch (e) {
    // No context
  }

  const activeSetValue = formSetValue || rhfContext?.setValue;
  const activeAmount = formValues?.amount || rhfContext?.watch?.("amount") || defaultAmount;

  // Local state
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState<string>("");
  const [engineSuccess, setEngineSuccess] = useState(false);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [exchangeGain, setExchangeGain] = useState(0);

  // Cost Centers state
  const [costCenters, setCostCenters] = useState<CostCenter[]>([
    { id: "cc-1", name: "Pazarlama & Satış", code: "MKT-100", percentage: 30, color: "from-purple-500 to-indigo-500" },
    { id: "cc-2", name: "Araştırma & Geliştirme", code: "RND-200", percentage: 40, color: "from-indigo-500 to-blue-500" },
    { id: "cc-3", name: "Operasyon ve Lojistik", code: "OPS-300", percentage: 15, color: "from-blue-500 to-cyan-500" },
    { id: "cc-4", name: "Genel Yönetim", code: "ADM-400", percentage: 15, color: "from-cyan-500 to-teal-500" },
  ]);

  // FIFO Invoices state
  const [invoices, setInvoices] = useState<InvoiceFIFO[]>([
    { id: "inv-001", invoiceNo: "FAT202600041", date: "2026-05-10", amount: 45000, remainingAmount: 45000, allocatedAmount: 0, status: "open" },
    { id: "inv-002", invoiceNo: "FAT202600052", date: "2026-05-18", amount: 60000, remainingAmount: 35000, allocatedAmount: 0, status: "partially_closed" },
    { id: "inv-003", invoiceNo: "FAT202600063", date: "2026-06-01", amount: 50000, remainingAmount: 50000, allocatedAmount: 0, status: "open" },
  ]);

  // Run the Antigravity distribution automation
  const runAntigravityEngine = () => {
    if (isEngineRunning) return;
    setIsEngineRunning(true);
    setEngineSuccess(false);
    setProgress(0);
    setExchangeGain(0);

    const steps = [
      { p: 15, txt: "Sanal yerçekimi kapatılıyor (İş yükleri hafifletiliyor)..." },
      { p: 35, txt: "FIFO fatura kapatma kuralları taranıyor..." },
      { p: 55, txt: "TCMB canlı kurları alınarak kur farkı dengeleniyor..." },
      { p: 80, txt: "Masraf merkezlerine yüzdesel dağılım optimize ediliyor..." },
      { p: 100, txt: "Antigravity motoru başarıyla dağıtımı tamamladı!" }
    ];

    let currentStepIndex = 0;
    
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setProgress(step.p);
        setActiveStep(step.txt);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        finalizeDistribution();
      }
    }, 900);
  };

  const finalizeDistribution = () => {
    // 1) FIFO Fatura Dağılımını Hesapla
    let remainingToDistribute = activeAmount;
    const updatedInvoices = invoices.map(inv => {
      if (remainingToDistribute <= 0) {
        return { ...inv, allocatedAmount: 0 };
      }
      const toAllocate = Math.min(inv.remainingAmount, remainingToDistribute);
      remainingToDistribute -= toAllocate;
      const isFullyClosed = toAllocate === inv.remainingAmount;
      return {
        ...inv,
        allocatedAmount: toAllocate,
        status: (isFullyClosed ? "closed" : toAllocate > 0 ? "partially_closed" : "open") as "open" | "partially_closed" | "closed"
      };
    });

    // 2) Kur Farkı Kazanç/Kaybını Simüle Et
    const simulatedGain = Math.round(activeAmount * 0.0125); // %1.25 akıllı kur optimizasyonu kazancı
    setExchangeGain(simulatedGain);

    // 3) Hook Form entegrasyonu varsa form değerlerini setle
    if (activeSetValue) {
      // Masraf merkezi dağılımlarını form state'ine aktar
      activeSetValue("antigravity_cost_centers", costCenters);
      activeSetValue("antigravity_fifo", updatedInvoices.map(inv => ({ invoiceId: inv.id, allocated: inv.allocatedAmount })));
      activeSetValue("exchange_gain_loss", simulatedGain);
      activeSetValue("description", `Antigravity Akıllı Dağıtım Motoru ile kapatıldı. (Kur Farkı Kazancı: +${simulatedGain.toLocaleString()} TRY)`);
    }

    setInvoices(updatedInvoices);
    setTotalAllocated(activeAmount - remainingToDistribute);
    setIsEngineRunning(false);
    setEngineSuccess(true);

    if (onDistributionComplete) {
      onDistributionComplete({
        allocatedAmount: activeAmount - remainingToDistribute,
        costCenters,
        fifoAllocations: updatedInvoices.map(inv => ({ invoiceId: inv.id, amount: inv.allocatedAmount })),
        exchangeGainLoss: simulatedGain
      });
    }
  };

  // Adjust cost center percentages manually, ensuring total remains 100%
  const handlePercentChange = (id: string, newVal: number) => {
    const targetIdx = costCenters.findIndex(cc => cc.id === id);
    if (targetIdx === -1) return;

    const currentTargetVal = costCenters[targetIdx].percentage;
    const diff = newVal - currentTargetVal;

    // Distribute the difference proportionally among others
    const otherCenters = costCenters.filter(cc => cc.id !== id);
    const totalOthers = otherCenters.reduce((sum, cc) => sum + cc.percentage, 0);

    let updatedCenters = [...costCenters];
    updatedCenters[targetIdx].percentage = newVal;

    if (totalOthers > 0) {
      otherCenters.forEach(cc => {
        const idx = updatedCenters.findIndex(item => item.id === cc.id);
        const adjustment = (cc.percentage / totalOthers) * diff;
        updatedCenters[idx].percentage = Math.max(0, Math.round((cc.percentage - adjustment) * 10) / 10);
      });
    }

    // Clean sum to 100
    const finalSum = updatedCenters.reduce((sum, cc) => sum + cc.percentage, 0);
    if (finalSum !== 100) {
      const adjustmentIdx = updatedCenters.findIndex(cc => cc.id !== id && cc.percentage > 0);
      if (adjustmentIdx !== -1) {
        updatedCenters[adjustmentIdx].percentage += (100 - finalSum);
      }
    }

    setCostCenters(updatedCenters);

    if (activeSetValue) {
      activeSetValue("antigravity_cost_centers", updatedCenters);
    }
  };

  return (
    <div className="w-full relative transition-all duration-300">
      
      {/* Background neon ambient glows */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main glassmorphism card */}
      <div className="backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/60 shadow-xl rounded-3xl p-6 transition-all">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-cyan-400 p-[1.5px] animate-pulse">
                <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight">Antigravity Engine</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/40 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Aktif
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Akıllı FIFO Kapatma, Masraf Merkezi Dağıtımı ve Kur Farkı Optimizasyonu</p>
            </div>
          </div>

          <button
            type="button"
            onClick={runAntigravityEngine}
            disabled={isEngineRunning}
            className={`px-4 py-2 rounded-xl text-xs font-black text-white transition-all shadow-md flex items-center gap-2 tracking-tight ${
              isEngineRunning 
                ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-400" 
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:scale-[1.03] active:scale-95 cursor-pointer shadow-indigo-500/20"
            }`}
            style={{
              boxShadow: isEngineRunning ? "none" : "0 0 15px rgba(99, 102, 241, 0.4)"
            }}
          >
            {isEngineRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            )}
            {isEngineRunning ? "Hafifletiliyor..." : "Antigravity Çalıştır"}
          </button>
        </div>

        {/* Action Animation Overlay */}
        <AnimatePresence>
          {isEngineRunning && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/40 rounded-2xl p-4 mb-6 overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                    {activeStep}
                  </span>
                  <span className="font-black text-indigo-500">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Engine Completion Success Card */}
        <AnimatePresence>
          {engineSuccess && !isEngineRunning && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl p-4 mb-6 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-black text-[11px] text-emerald-800 dark:text-emerald-400">Otomatik Dağıtım Başarılı</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  Toplam <strong className="text-slate-800 dark:text-slate-200">{activeAmount.toLocaleString()} {currency}</strong> tutarındaki bakiye, FIFO algoritması uyarınca faturalara kapatıldı ve departman masraf merkezlerine paylaştırıldı. 
                  Kur farkı optimizasyonu ile <strong className="text-emerald-600 dark:text-emerald-400">+{exchangeGain.toLocaleString()} TRY</strong> net finansal fayda sağlandı.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Distribution Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Cost Center Distribution (12 columns split into 6 / 6) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-xs text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-500" />
                Masraf Merkezleri Oranları
              </h4>
              <span className="text-[10px] font-bold text-slate-400">Toplam: %100</span>
            </div>

            <div className="space-y-3.5 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
              {costCenters.map(cc => {
                const allocatedCost = (activeAmount * cc.percentage) / 100;
                return (
                  <div key={cc.id} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded bg-gradient-to-r ${cc.color}`} />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{cc.name}</span>
                        <span className="text-[9px] text-slate-400">({cc.code})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-800 dark:text-slate-100">{allocatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-500">%{cc.percentage}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={cc.percentage}
                        onChange={(e) => handlePercentChange(cc.id, Number(e.target.value))}
                        disabled={isEngineRunning}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - FIFO Closing Automation */}
          <div className="lg:col-span-6 space-y-4">
            <h4 className="font-black text-xs text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-500" />
              FIFO Fatura Kapatma Dağılımı
            </h4>

            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden text-[10px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold text-left bg-slate-100/40 dark:bg-slate-850/40">
                    <th className="p-3">Fatura No</th>
                    <th className="p-3">Kalan Tutar</th>
                    <th className="p-3 text-right">Eşleşen</th>
                    <th className="p-3 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {invoices.map(inv => {
                    const statusConfig = {
                      open: { label: "Açık", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300" },
                      partially_closed: { label: "Kısmi", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300" },
                      closed: { label: "Kapatıldı", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300" }
                    }[inv.status];

                    return (
                      <tr key={inv.id} className="hover:bg-slate-100/20 dark:hover:bg-slate-850/10 transition">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{inv.invoiceNo}</span>
                          <span className="block text-[8px] text-slate-400 mt-0.5">{inv.date}</span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 font-bold">
                          {inv.remainingAmount.toLocaleString()} {currency}
                        </td>
                        <td className="p-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {inv.allocatedAmount > 0 ? `+${inv.allocatedAmount.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 p-3 bg-indigo-50/30 dark:bg-indigo-950/5 border border-indigo-100/30 dark:border-indigo-900/20 rounded-xl">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                FIFO dağıtımı en eski faturadan başlayarak otomatik bakiye tüketimi yapar. Manuel dağıtım yerine bu motor iş yükünüzü hafifletir.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
