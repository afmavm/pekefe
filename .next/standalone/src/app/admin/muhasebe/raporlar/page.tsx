"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, FileText, Download, RefreshCw } from "lucide-react";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  monthlyIncome: { month: number; total: number }[];
  monthlyExpense: { month: number; total: number }[];
  expenseByCategory: { category: string; total: number }[];
  pendingInvoices: number;
  pendingTax: number;
  overdueTax: number;
}

export default function RaporlarPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/accounting/summary?year=${year}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center py-32 text-gray-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Raporlar yükleniyor...
    </div>
  );

  const maxMonthly = data ? Math.max(...data.monthlyIncome.map((m) => m.total), ...data.monthlyExpense.map((m) => m.total), 1) : 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-orange-500 shrink-0" /> Finansal Raporlar &amp; Analiz
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {year} yılı genel maliyet ve kârlılık özeti
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer">
            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-xs text-gray-500 font-medium">Toplam Gelir</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <p className="text-xs text-gray-500 font-medium">Toplam Gider</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpense)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-gray-500 font-medium">Net Kâr/Zarar</p>
              </div>
              <p className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {data.netProfit >= 0 ? "+" : ""}{formatCurrency(data.netProfit)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-gray-500 font-medium">Bekleyen</p>
              </div>
              <p className="text-lg font-bold text-amber-600">{data.pendingInvoices} Fatura</p>
              <p className="text-xs text-red-500 mt-0.5">{data.overdueTax} Vadesi Geçen Vergi</p>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="font-medium text-gray-800 mb-4">Aylık Gelir / Gider Karşılaştırması</h2>
            <div className="flex items-end gap-2 h-40">
              {MONTHS.map((month, i) => {
                const monthNum = i + 1;
                const income = data.monthlyIncome.find((m) => m.month === monthNum)?.total || 0;
                const expense = data.monthlyExpense.find((m) => m.month === monthNum)?.total || 0;
                const incomeH = Math.round((income / maxMonthly) * 100);
                const expenseH = Math.round((expense / maxMonthly) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex items-end gap-0.5 h-32">
                      <div className="flex-1 bg-green-400 rounded-t transition-all hover:bg-green-500" style={{ height: `${incomeH}%` }} title={`Gelir: ${formatCurrency(income)}`} />
                      <div className="flex-1 bg-red-400 rounded-t transition-all hover:bg-red-500" style={{ height: `${expenseH}%` }} title={`Gider: ${formatCurrency(expense)}`} />
                    </div>
                    <span className="text-xs text-gray-400">{month.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-400" /><span className="text-xs text-gray-500">Gelir</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400" /><span className="text-xs text-gray-500">Gider</span></div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense by Category */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-medium text-gray-800 mb-4">Kategori Bazlı Gider</h2>
              {data.expenseByCategory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Gider verisi bulunamadı.</p>
              ) : (
                <div className="space-y-3">
                  {data.expenseByCategory.map((cat) => {
                    const pct = data.totalExpense > 0 ? Math.round((cat.total / data.totalExpense) * 100) : 0;
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">{cat.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{pct}%</span>
                            <span className="text-sm font-medium text-red-600">{formatCurrency(cat.total)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-medium text-gray-800 mb-4">Aylık Özet Tablosu</h2>
              <div className="overflow-y-auto max-h-56">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Ay</th>
                      <th className="text-right py-1.5 text-xs text-gray-500 font-medium">Gelir</th>
                      <th className="text-right py-1.5 text-xs text-gray-500 font-medium">Gider</th>
                      <th className="text-right py-1.5 text-xs text-gray-500 font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MONTHS.map((month, i) => {
                      const m = i + 1;
                      const income = data.monthlyIncome.find((x) => x.month === m)?.total || 0;
                      const expense = data.monthlyExpense.find((x) => x.month === m)?.total || 0;
                      const net = income - expense;
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-1.5 text-gray-700">{month}</td>
                          <td className="py-1.5 text-right text-green-600">{formatCurrency(income)}</td>
                          <td className="py-1.5 text-right text-red-600">{formatCurrency(expense)}</td>
                          <td className={`py-1.5 text-right font-medium ${net >= 0 ? "text-blue-600" : "text-red-600"}`}>{net >= 0 ? "+" : ""}{formatCurrency(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

