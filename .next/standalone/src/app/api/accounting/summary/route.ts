import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") ?? new Date().getFullYear().toString());

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Get all sales/income invoices for the year (monthly)
    const invoices = await prisma.invoice.findMany({
      where: { 
        date: { gte: startOfYear, lte: endOfYear }, 
        type: { in: ["SATIS", "e-Fatura", "e-Arşiv"] } 
      },
      select: { date: true, totalAmount: true, status: true },
    });

    // Get all expenses for the year (monthly)
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startOfYear, lte: endOfYear } },
      select: { date: true, amount: true, category: true, status: true },
    });

    const paidStatuses = ["PAID", "Paid", "ODENDI"];

    // Monthly income aggregation (paid invoices)
    const monthlyIncome: { month: number; total: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const total = invoices
        .filter((inv) => paidStatuses.includes(inv.status) && new Date(inv.date).getMonth() + 1 === m)
        .reduce((s, inv) => s + inv.totalAmount.toNumber(), 0);
      monthlyIncome.push({ month: m, total });
    }

    // Monthly expense aggregation
    const monthlyExpense: { month: number; total: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const total = expenses
        .filter((exp) => paidStatuses.includes(exp.status) && new Date(exp.date).getMonth() + 1 === m)
        .reduce((s, exp) => s + exp.amount.toNumber(), 0);
      monthlyExpense.push({ month: m, total });
    }

    // Expense by category
    const catMap: Record<string, number> = {};
    expenses.filter((e) => paidStatuses.includes(e.status)).forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount.toNumber();
    });
    const expenseByCategory = Object.entries(catMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    const totalIncome = monthlyIncome.reduce((s, m) => s + m.total, 0);
    const totalExpense = monthlyExpense.reduce((s, m) => s + m.total, 0);

    // Pending/overdue counts
    const pendingInvoices = await prisma.invoice.count({ 
      where: { 
        status: { in: ["PENDING", "BEKLIYOR", "BEKLEMEDE", "Draft", "TASLAK", "Sent", "Gönderildi", "Overdue", "UNPAID", "ODENMEDI"] },
        type: { not: "e-İrsaliye" }
      } 
    });
    const overdueTax = await prisma.taxDeclaration.count({
      where: { status: "BEKLIYOR", dueDate: { lt: new Date() } },
    });
    const pendingTax = await prisma.taxDeclaration.count({ where: { status: "BEKLIYOR" } });

    return NextResponse.json({
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpense,
      expenseByCategory,
      pendingInvoices,
      pendingTax,
      overdueTax,
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
