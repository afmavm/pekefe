import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const data = await req.json();
    const [model, actualId] = resolvedParams.id.split("_") as [string, string];

    if (model === "income") {
      let finalDesc = data.description;
      if (data.reference !== undefined) {
        const cleanDesc = data.description ? data.description.replace(/\[Ref:\s*(.*?)\]/, "").trim() : "";
        finalDesc = data.reference ? `${cleanDesc} [Ref: ${data.reference}]` : cleanDesc;
      }

      const updated = await prisma.income.update({
        where: { id: actualId },
        data: {
          date: data.date ? new Date(data.date) : undefined,
          category: data.category,
          description: finalDesc,
          amount: data.amount !== undefined ? Number(data.amount) : undefined,
          paymentMethod: data.paymentMethod,
          status: data.status === "TAMAMLANDI" ? "ALINDI" : data.status,
        },
      });
      return NextResponse.json({ 
        ...updated, 
        type: "GELIR" as const, 
        id: `income_${updated.id}`,
        amount: Number(updated.amount),
        reference: data.reference || null,
        description: data.description ? data.description.replace(/\[Ref:\s*(.*?)\]/, "").trim() : ""
      });
    } else if (model === "expense") {
      const updated = await prisma.expense.update({
        where: { id: actualId },
        data: {
          date: data.date ? new Date(data.date) : undefined,
          category: data.category,
          description: data.description,
          amount: data.amount !== undefined ? Number(data.amount) : undefined,
          paymentMethod: data.paymentMethod,
          status: data.status === "TAMAMLANDI" ? "ODENDI" : data.status,
          receiptNo: data.reference !== undefined ? data.reference : undefined,
        },
      });
      return NextResponse.json({ 
        ...updated, 
        type: "GIDER" as const, 
        id: `expense_${updated.id}`,
        amount: Number(updated.amount),
        reference: updated.receiptNo
      });
    }

    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  } catch (error) {
    console.error("income-expense PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const resolvedParams = await params;
    const [model, actualId] = resolvedParams.id.split("_") as [string, string];

    if (model === "income") {
      await prisma.income.delete({ where: { id: actualId } });
    } else if (model === "expense") {
      await prisma.expense.delete({ where: { id: actualId } });
    } else {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("income-expense DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
