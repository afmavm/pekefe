"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AntigravityEngine } from "@/components/AntigravityEngine";
import { 
  Building2, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft, 
  Zap, 
  HelpCircle, 
  Save, 
  X,
  CreditCard,
  Percent,
  CheckCircle,
  FileCheck
} from "lucide-react";
import Link from "next/link";

// Form validation schema with Zod
const invoiceFormSchema = z.object({
  cariName: z.string().min(2, "Cari hesap seçimi zorunludur"),
  invoiceNo: z.string().min(3, "Belge no geçerli olmalıdır"),
  amount: z.number().min(1, "Tutar 0'dan büyük olmalıdır"),
  kdv: z.string(),
  paymentMethod: z.string(),
  description: z.string().optional(),
  antigravity_cost_centers: z.any().optional(),
  antigravity_fifo: z.any().optional(),
  exchange_gain_loss: z.any().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function AntigravityPage() {
  const [activeTab, setActiveTab] = useState<"alis" | "finans">("alis");
  const [lastSubmitted, setLastSubmitted] = useState<any>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Initialize React Hook Form
  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      cariName: "Omega Gıda Ltd. Şti.",
      invoiceNo: `FAT${Date.now().toString().slice(-6)}`,
      amount: 120000,
      kdv: "20",
      paymentMethod: "Banka Havalesi",
      description: "",
    }
  });

  const { handleSubmit, setValue, watch, register, formState: { errors } } = methods;

  const currentAmount = watch("amount");

  const onSubmit = (data: InvoiceFormValues) => {
    setLastSubmitted(data);
    setShowSummaryModal(true);
    toast.success("🚀 İşlem Antigravity akıllı dağıtım kaydıyla başarıyla muhasebeleştirildi!");
  };

  // Simulate loading predefined values (like filling mock defaults for demo)
  const loadMockDefaults = () => {
    setValue("amount", 150000);
    setValue("cariName", "Zeta Madencilik A.Ş.");
    setValue("invoiceNo", `FAT${Date.now().toString().slice(-6)}`);
    toast.info("Demolar için örnek cari ve fatura verileri yüklendi.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 transition-all duration-300 text-slate-700">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-orange-500 animate-pulse shrink-0" /> Antigravity Akıllı Dağıtım Modülü
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Akıllı ön muhasebe gider ve maliyet dağıtım konsolu.
          </p>
        </div>
        <div>
          <button 
            onClick={loadMockDefaults}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            Mock Veri Yükle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Alış / Finans Modül Formu (7 Columns) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Module Switcher Tabs */}
          <div className="bg-white/60  backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50  shadow-sm flex gap-1">
            <button
               onClick={() => setActiveTab("alis")}
               className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "alis"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/15"
                  : "text-slate-450 hover:bg-slate-100 "
              }`}
            >
              Alış Belgesi Girişi
            </button>
            <button
               onClick={() => setActiveTab("finans")}
               className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "finans"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/15"
                  : "text-slate-450 hover:bg-slate-100 "
              }`}
            >
              Finansal İşlem & Ödeme Girişi
            </button>
          </div>

          {/* Form Card */}
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit as any)} className="backdrop-blur-md bg-white/70  border border-slate-200/50  shadow-lg rounded-3xl p-6 space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 ">
                <h3 className="font-extrabold text-sm text-slate-800  flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  {activeTab === "alis" ? "Alış Faturası Detayları" : "Ödeme / Kasa Detayları"}
                </h3>
                 <span className="text-xs font-bold text-slate-400">Modül ID: SAAS-ERP-FIN</span>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700  block">Cari Hesap Unvanı</label>
                  <input 
                    type="text" 
                    {...register("cariName")} 
                    className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                  />
                  {errors.cariName && <span className="text-xs font-bold text-red-500">{errors.cariName.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700  block">Belge / Fiş No</label>
                  <input 
                    type="text" 
                    {...register("invoiceNo")} 
                    className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                  />
                  {errors.invoiceNo && <span className="text-xs font-bold text-red-500">{errors.invoiceNo.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700  block">Toplam Tutar (TRY)</label>
                  <input 
                    type="number" 
                    value={currentAmount}
                    onChange={(e) => setValue("amount", Number(e.target.value))} 
                    className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                  />
                  {errors.amount && <span className="text-xs font-bold text-red-500">{errors.amount.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700  block">Ödeme Yöntemi</label>
                  <select 
                    {...register("paymentMethod")}
                    className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                  >
                    <option value="Banka Havalesi">Banka Havalesi</option>
                    <option value="Nakit">Nakit Ödeme</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Çek/Senet">Çek veya Senet</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="font-extrabold text-slate-700  block">Açıklama / Muhasebe Notu</label>
                  <textarea 
                    {...register("description")}
                    rows={2}
                    placeholder="Antigravity Akıllı Dağıtım çalıştırıldığında bu açıklama otomatik optimize edilecektir."
                    className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>

              </div>

              {/* Form submit footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 ">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl font-bold text-xs transition shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Muhasebeleştir & Kaydet
                </button>
              </div>

            </form>
          </FormProvider>

        </div>

        {/* Right Panel: Antigravity Engine Component (5 Columns) */}
        <div className="xl:col-span-5">
          <AntigravityEngine 
            formSetValue={setValue as any}
            formValues={watch()}
            defaultAmount={currentAmount}
            currency="TRY"
            onDistributionComplete={(data) => {
              console.log("Antigravity distribution completed:", data);
            }}
          />
        </div>

      </div>

      {/* Summary Dialog / Modal */}
      {showSummaryModal && lastSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white  border border-slate-200  rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-5 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 ">
              <div className="flex items-center gap-2 text-indigo-600 ">
                <FileCheck className="w-5 h-5" />
                <span className="font-extrabold tracking-tight text-sm">Muhasebe Fiş Detayı</span>
              </div>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100  transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50  p-4 border border-slate-100  rounded-2xl">
              <div>
                <span className="text-slate-400 font-bold block">Cari Hesap:</span>
                 <span className="font-bold text-slate-800 ">{lastSubmitted.cariName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-bold block">Belge No:</span>
                   <span className="font-bold text-slate-700 ">{lastSubmitted.invoiceNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Toplam Tutar:</span>
                   <span className="font-bold text-indigo-600 ">{lastSubmitted.amount.toLocaleString()} TRY</span>
                </div>
              </div>

              {lastSubmitted.exchange_gain_loss > 0 && (
                <div className="pt-2 border-t border-slate-250 ">
                  <span className="text-slate-450 font-bold block">Kur Farkı Optimizasyonu:</span>
                   <span className="font-bold text-emerald-600 ">{lastSubmitted.exchange_gain_loss.toLocaleString()} TRY Kazanç</span>
                </div>
              )}

              {lastSubmitted.antigravity_cost_centers && (
                <div className="pt-2 border-t border-slate-250  space-y-1.5">
                  <span className="text-slate-450 font-bold block">Masraf Dağılım Detayları:</span>
                  <div className="space-y-1">
                    {lastSubmitted.antigravity_cost_centers.map((cc: any) => (
                      <div key={cc.id} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600 ">{cc.name}</span>
                        <span className="font-extrabold text-slate-800 ">%{cc.percentage} ({(lastSubmitted.amount * cc.percentage / 100).toLocaleString()} TRY)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSummaryModal(false)}
                 className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

