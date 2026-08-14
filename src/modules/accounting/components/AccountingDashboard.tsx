"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  BarChart, 
  TrendingUp, 
  Layers, 
  Building2, 
  RefreshCw, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { 
  AccountingAccount, 
  Bank, 
  JournalEntry, 
  Expense, 
  TaxDeclaration, 
  Invoice, 
  BudgetItem 
} from "../types";
import { getAccountingData } from "../server/accountingActions";
import CashflowAnalytics from "./CashflowAnalytics";
import DoubleEntryLedger from "./DoubleEntryLedger";
import BankReconciliation from "./BankReconciliation";
import { toast } from "sonner";

interface AccountingDashboardProps {
  initialData?: {
    accounts: AccountingAccount[];
    banks: Bank[];
    journalEntries: JournalEntry[];
    expenses: Expense[];
    taxDeclarations: TaxDeclaration[];
    invoices: Invoice[];
    budgetItems: BudgetItem[];
  };
}

export default function AccountingDashboard({ initialData }: AccountingDashboardProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "ledger" | "reconciliation">("summary");
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  // Domain state loaded from inicialData or action
  const [accounts, setAccounts] = useState<AccountingAccount[]>(initialData?.accounts || []);
  const [banks, setBanks] = useState<Bank[]>(initialData?.banks || []);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialData?.journalEntries || []);
  const [expenses, setExpenses] = useState<Expense[]>(initialData?.expenses || []);
  const [taxDeclarations, setTaxDeclarations] = useState<TaxDeclaration[]>(initialData?.taxDeclarations || []);
  const [invoices, setInvoices] = useState<Invoice[]>(initialData?.invoices || []);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initialData?.budgetItems || []);

  // Summary state calculated/loaded dynamically
  const [summary, setSummary] = useState<{
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    monthlyIncome: { month: number; total: number }[];
    monthlyExpense: { month: number; total: number }[];
    expenseByCategory: { category: string; total: number }[];
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/accounting/summary?year=${year}`).catch(() => null);
      if (!res || !res.ok) {
        setSummary({
          totalIncome: 0,
          totalExpense: 0,
          netProfit: 0,
          monthlyIncome: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
          monthlyExpense: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
          expenseByCategory: [],
        });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data && !data.error) {
        setSummary(data);
      } else {
        setSummary({
          totalIncome: 0,
          totalExpense: 0,
          netProfit: 0,
          monthlyIncome: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
          monthlyExpense: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
          expenseByCategory: [],
        });
      }
    } catch (err) {
      console.error("Failed to load summary stats:", err);
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        monthlyIncome: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
        monthlyExpense: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
        expenseByCategory: [],
      });
    }
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getAccountingData();
      if (res.success && res.data) {
        setAccounts(res.data.accounts);
        setBanks(res.data.banks);
        setJournalEntries(res.data.journalEntries);
        setExpenses(res.data.expenses);
        setTaxDeclarations(res.data.taxDeclarations);
        setInvoices(res.data.invoices);
        setBudgetItems(res.data.budgetItems);
        await fetchSummary();
        if (isRefresh) toast.success("Finansal veriler başarıyla yenilendi.");
      } else {
        toast.error(res.error || "Finansal veriler yüklenemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (initialData) {
      fetchSummary().finally(() => setLoading(false));
    } else {
      loadData();
    }
  }, [initialData, year]);

  if (loading || !summary) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200  rounded-lg" />
            <div className="h-4 w-96 bg-slate-200  rounded-lg" />
          </div>
          <div className="h-10 w-10 bg-slate-200  rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100  rounded-2xl border border-slate-200 " />
          ))}
        </div>
        <div className="h-96 bg-slate-100  rounded-3xl border border-slate-200 " />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 bg-honeycomb bg-repeat min-h-screen">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40  backdrop-blur-md p-6 rounded-2xl border border-slate-200/60  shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gradient uppercase tracking-tight flex items-center gap-2.5">
            <BarChart className="w-8 h-8 text-[#f97316]" /> Muhasebe Defteri &amp; Finans
          </h1>
          <p className="text-xs text-slate-500  mt-1.5 font-semibold tracking-widest uppercase">
            Çift taraflı yevmiye kayıtları, likidite bankaları, bütçe yönetimi ve vergi bildirimleri
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200  bg-white  font-bold text-xs text-slate-700  outline-none cursor-pointer hover:shadow-sm"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y} Mali Yılı</option>
            ))}
          </select>
          
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-3 rounded-xl bg-white  border border-slate-200  text-slate-600  hover:bg-slate-50 hover:shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200  gap-6">
          <button
            onClick={() => setActiveTab("summary")}
            className={`pb-4 text-sm font-bold tracking-wide uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "summary"
                ? "border-[#f97316] text-slate-850 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Analizler &amp; Grafik
          </button>
          
          <button
            onClick={() => setActiveTab("ledger")}
            className={`pb-4 text-sm font-bold tracking-wide uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ledger"
                ? "border-[#f97316] text-slate-850 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            Yevmiye Defteri (Ledger)
          </button>
          
          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`pb-4 text-sm font-bold tracking-wide uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "reconciliation"
                ? "border-[#f97316] text-slate-850 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Banka &amp; Mutabakat
          </button>
        </div>

        {/* Tab Panels */}
        <div className="transition-all duration-200">
          
          {activeTab === "summary" && (
            <CashflowAnalytics 
              expenses={expenses}
              budgetItems={budgetItems}
              summary={summary} 
              year={year}
            />
          )}

          {activeTab === "ledger" && (
            <DoubleEntryLedger 
              journalEntries={journalEntries}
              accounts={accounts}
              onRefresh={() => loadData(true)}
            />
          )}

          {activeTab === "reconciliation" && (
            <BankReconciliation 
              banks={banks}
              invoices={invoices}
              onRefresh={() => loadData(true)}
            />
          )}

        </div>
      </div>

    </div>
  );
}
