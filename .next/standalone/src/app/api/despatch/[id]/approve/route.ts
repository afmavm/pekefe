import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("create_despatch", request);
  if (!auth.ok) return auth.response;

  try {
    const { id: despatchId } = await params;

    const despatch = await prisma.despatchAdvice.findUnique({
      where: { id: despatchId }
    });

    if (!despatch) {
      return NextResponse.json({ error: "İrsaliye bulunamadı." }, { status: 404 });
    }

    if (despatch.status !== "Draft") {
      return NextResponse.json(
        { error: "Sadece taslak durumundaki irsaliyeler onaylanabilir." },
        { status: 400 }
      );
    }

    // Update status to Approved
    const updated = await prisma.despatchAdvice.update({
      where: { id: despatchId },
      data: { status: "Approved" }
    });

    return NextResponse.json({
      success: true,
      message: "e-İrsaliye başarıyla onaylandı.",
      despatch: updated
    });
  } catch (error: any) {
    console.error("[API_DESPATCH_APPROVE_ERROR]:", error);
    return NextResponse.json(
      { error: "İrsaliye onaylanırken beklenmeyen bir hata oluştu.", details: error.message },
      { status: 500 }
    );
  }
}
