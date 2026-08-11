import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "GELIR" | "GIDER" | null (all)

    const [incomes, expenses] = await Promise.all([
      type !== "GIDER" ? prisma.income.findMany({ orderBy: { date: "desc" } }) : Promise.resolve([]),
      type !== "GELIR" ? prisma.expense.findMany({ orderBy: { date: "desc" } }) : Promise.resolve([]),
    ]);

    const transactions = [
      ...incomes.map((i) => {
        const refMatch = i.description.match(/\[Ref:\s*(.*?)\]/);
        const cleanDesc = refMatch ? i.description.replace(/\[Ref:\s*(.*?)\]/, "").trim() : i.description;
        const refVal = refMatch ? refMatch[1] : null;
        return {
          id: `income_${i.id}`,
          _id: i.id,
          _model: "income",
          type: "GELIR" as const,
          date: i.date,
          category: i.category,
          description: cleanDesc,
          amount: Number(i.amount),
          paymentMethod: i.paymentMethod,
          status: i.status === "ALINDI" ? "TAMAMLANDI" : i.status,
          reference: refVal,
        };
      }),
      ...expenses.map((e) => ({
        id: `expense_${e.id}`,
        _id: e.id,
        _model: "expense",
        type: "GIDER" as const,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        paymentMethod: e.paymentMethod,
        status: e.status === "ODENDI" ? "TAMAMLANDI" : e.status,
        reference: e.receiptNo,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("income-expense GET error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const data = await req.json();
    const { type, date, category, description, amount, paymentMethod, status, reference } = data;

    if (type === "GELIR") {
      const finalDesc = reference ? `${description} [Ref: ${reference}]` : description;
      const income = await prisma.income.create({
        data: {
          date: new Date(date),
          category,
          description: finalDesc,
          amount: Number(amount),
          paymentMethod,
          status: status === "TAMAMLANDI" ? "ALINDI" : status,
        },
      });
      return NextResponse.json({ 
        ...income, 
        id: `income_${income.id}`, 
        type: "GELIR" as const,
        amount: Number(income.amount),
        reference: reference || null,
        description
      });
    } else {
      const expense = await prisma.expense.create({
        data: {
          date: new Date(date),
          category,
          description,
          amount: Number(amount),
          paymentMethod,
          status: status === "TAMAMLANDI" ? "ODENDI" : status,
          receiptNo: reference || null,
          taxAmount: 0,
        },
      });
      return NextResponse.json({ 
        ...expense, 
        id: `expense_${expense.id}`, 
        type: "GIDER" as const,
        amount: Number(expense.amount),
        reference: expense.receiptNo
      });
    }
  } catch (error) {
    console.error("income-expense POST error:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
