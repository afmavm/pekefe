import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized && process.env.NODE_ENV === "production") {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return auth.response;
      }
    }

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
    }).catch(() => []);

    // Get all expenses for the year (monthly)
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startOfYear, lte: endOfYear } },
      select: { date: true, amount: true, category: true, status: true },
    }).catch(() => []);

    const paidStatuses = ["PAID", "Paid", "ODENDI"];

    // Monthly income aggregation (paid invoices)
    const monthlyIncome: { month: number; total: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const total = invoices
        .filter((inv) => paidStatuses.includes(inv.status) && new Date(inv.date).getMonth() + 1 === m)
        .reduce((s, inv) => s + (inv.totalAmount ? (typeof (inv.totalAmount as any).toNumber === 'function' ? (inv.totalAmount as any).toNumber() : Number(inv.totalAmount)) : 0), 0);
      monthlyIncome.push({ month: m, total });
    }

    // Monthly expense aggregation
    const monthlyExpense: { month: number; total: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const total = expenses
        .filter((exp) => paidStatuses.includes(exp.status) && new Date(exp.date).getMonth() + 1 === m)
        .reduce((s, exp) => s + (exp.amount ? (typeof (exp.amount as any).toNumber === 'function' ? (exp.amount as any).toNumber() : Number(exp.amount)) : 0), 0);
      monthlyExpense.push({ month: m, total });
    }

    // Expense by category
    const catMap: Record<string, number> = {};
    expenses.filter((e) => paidStatuses.includes(e.status)).forEach((e) => {
      const val = e.amount ? (typeof (e.amount as any).toNumber === 'function' ? (e.amount as any).toNumber() : Number(e.amount)) : 0;
      catMap[e.category] = (catMap[e.category] || 0) + val;
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
    }).catch(() => 0);

    const overdueTax = await prisma.taxDeclaration.count({
      where: { status: "BEKLIYOR", dueDate: { lt: new Date() } },
    }).catch(() => 0);

    const pendingTax = await prisma.taxDeclaration.count({ where: { status: "BEKLIYOR" } }).catch(() => 0);

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
    return NextResponse.json({
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      monthlyIncome: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
      monthlyExpense: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 })),
      expenseByCategory: [],
      pendingInvoices: 0,
      pendingTax: 0,
      overdueTax: 0,
    });
  }
}
