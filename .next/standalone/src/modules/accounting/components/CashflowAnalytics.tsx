"use client";

import React, { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon,
  Layers,
  Percent
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Expense, BudgetItem } from "../types";

interface CashflowAnalyticsProps {
  expenses: Expense[];
  budgetItems: BudgetItem[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    monthlyIncome: { month: number; total: number }[];
    monthlyExpense: { month: number; total: number }[];
    expenseByCategory: { category: string; total: number }[];
  };
  year: number;
}

const EXPENSE_CATEGORIES = ["Tedarik", "Lojistik", "Personel", "Ofis & Kira", "Yazılım & IT", "Pazarlama", "Diğer"];
const COLORS = ["#f97316", "#0F172A", "#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function CashflowAnalytics({ expenses, budgetItems, summary, year }: CashflowAnalyticsProps) {
  
  // Format monthly comparison data for chart
  const chartData = useMemo(() => {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return months.map((name, idx) => {
      const monthNum = idx + 1;
      const inc = summary.monthlyIncome.find(m => m.month === monthNum)?.total ?? 0;
      const exp = summary.monthlyExpense.find(m => m.month === monthNum)?.total ?? 0;
      return {
        name,
        Gelir: inc,
        Gider: exp,
        Kar: inc - exp
      };
    });
  }, [summary]);

  const totalBudgetPlanned = useMemo(() => {
    return budgetItems.reduce((acc, item) => acc + item.planned, 0);
  }, [budgetItems]);

  const totalBudgetActual = useMemo(() => {
    return expenses
      .filter((e) => e.status === "ODENDI")
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  return (
    <div className="space-y-6">
      
      {/* Visual KPI Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white  border border-slate-200/50  p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900  tracking-tight">
              ₺{summary.totalIncome.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-slate-505 font-bold uppercase tracking-wide">
              Toplam B2B Gelir
            </p>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white  border border-slate-200/50  p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-700 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900  tracking-tight">
              ₺{summary.totalExpense.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-slate-505 font-bold uppercase tracking-wide">
              Toplam Gider
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white  border border-slate-200/50  p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            summary.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-2xl font-black tracking-tight ${summary.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              ₺{summary.netProfit.toLocaleString("tr-TR")}
            </p>
            <p className="text-xs text-slate-505 font-bold uppercase tracking-wide">
              Net Dönem Kârı
            </p>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white  border border-slate-200/50  p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900  tracking-tight">
              %{summary.totalIncome > 0 ? ((summary.netProfit / summary.totalIncome) * 100).toFixed(1) : "0.0"}
            </p>
            <p className="text-xs text-slate-505 font-bold uppercase tracking-wide">
              Kâr Oranı (Margin)
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cashflow Bar Chart */}
        <div className="lg:col-span-8 bg-white  border border-slate-200/50  p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-900  uppercase tracking-widest flex items-center gap-2">
              <BarChartIcon className="w-4 h-4 text-[#f97316]" /> Gelir &amp; Gider Karşılaştırması ({year})
            </h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#71717A' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#71717A' }} tickFormatter={(val) => `₺${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', background: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                  labelStyle={{ fontWeight: 900, color: '#18181B' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, paddingTop: '15px' }} />
                <Bar dataKey="Gelir" name="B2B Satış Gelirleri" fill="#0F172A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gider" name="Operasyonel Giderler" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="lg:col-span-4 bg-white  border border-slate-200/50  p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900  uppercase tracking-widest flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-amber-500" /> Gider Kırılımları
            </h3>
            
            {summary.expenseByCategory.length > 0 ? (
              <div className="h-[200px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="category"
                      stroke="none"
                    >
                      {summary.expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                      itemStyle={{ fontWeight: 800 }}
                      formatter={(val) => `₺${val}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                <PieChartIcon className="w-8 h-8 opacity-25 mb-2" />
                Mevcut gider kaydı bulunmamaktadır.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-4 border-t border-slate-100 ">
            {summary.expenseByCategory.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-500 ">{item.category}</span>
                </div>
                <span className="text-slate-800  font-extrabold">₺{item.total.toLocaleString("tr-TR")}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Budget Plan Progress */}
      <div className="bg-white  border border-slate-200/50  p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900  uppercase tracking-wide flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" /> Bütçe &amp; Limit Kontrol Paneli
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPENSE_CATEGORIES.map((category) => {
            const planned = budgetItems
              .filter(item => item.category === category)
              .reduce((s, i) => s + i.planned, 0);

            const actual = expenses
              .filter(e => e.category === category && e.status === "ODENDI")
              .reduce((s, e) => s + e.amount, 0);

            const percentage = planned > 0 ? (actual / planned) * 100 : 0;
            const isExceeded = percentage > 100;
            const isWarning = percentage > 85;

            return (
              <div key={category} className="border border-slate-150/60  p-4 rounded-2xl bg-slate-50/20  space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-850  uppercase">{category}</span>
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                    isExceeded 
                      ? "bg-red-50 text-red-600 border border-red-100" 
                      : isWarning 
                      ? "bg-orange-50 text-amber-600 border border-orange-100" 
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  }`}>
                    {isExceeded ? "Limit Aşıldı" : isWarning ? "Limit Yakın" : "Güvenli"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Planlanan: ₺{planned.toLocaleString("tr-TR")}</span>
                  <span>Harcanan: ₺{actual.toLocaleString("tr-TR")}</span>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100  rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-350 ${
                        isExceeded ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500 tracking-wider">
                    <span>DOLULUK ORANI</span>
                    <span>%{percentage.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
