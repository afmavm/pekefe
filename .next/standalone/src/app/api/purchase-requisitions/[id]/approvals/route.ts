import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const ApprovalActionSchema = z.object({
  approverId: z.string(),
  approverRole: z.enum(["BOLUM_SORUMLUSU", "SATINALMA_MUDURU", "GENEL_MUDUR", "YONETIM_KURULU"]),
  action: z.enum(["Onayla", "Reddet", "Revizyona Gönder", "Yorum Ekle"]),
  comment: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  try {
    const body = await request.json();
    const result = ApprovalActionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { approverId, approverRole, action, comment } = result.data;

    // 1. Talebi sorgula
    const requisition = await prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        approvals: true
      }
    });

    if (!requisition) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
    }

    const totalAmount = requisition.totalAmount.toNumber();
    let nextStatus = requisition.status;
    let nextApprovalStatus = requisition.approvalStatus;
    let commentText = comment || "";

    // 2. Kural Motoru / Limit Kontrolleri
    if (action === "Onayla") {
      if (totalAmount <= 25000) {
        // Bölüm sorumlusu yeterli
        nextStatus = "Onaylandı";
        nextApprovalStatus = "Onaylandı";
        commentText = commentText || "Bölüm sorumlusu tarafından onaylandı.";
      } else if (totalAmount <= 100000) {
        // Satın Alma Müdürü onayı gerekli
        if (approverRole === "SATINALMA_MUDURU" || approverRole === "GENEL_MUDUR" || approverRole === "YONETIM_KURULU") {
          nextStatus = "Onaylandı";
          nextApprovalStatus = "Onaylandı";
          commentText = commentText || "Satın alma müdürü tarafından onaylandı.";
        } else {
          nextStatus = "Onay Bekliyor";
          nextApprovalStatus = "Bekliyor";
          commentText = (commentText ? commentText + " - " : "") + "Bölüm sorumlusu onayladı. Satın Alma Müdürü onayı bekleniyor.";
        }
      } else if (totalAmount <= 500000) {
        // Genel Müdür onayı gerekli
        if (approverRole === "GENEL_MUDUR" || approverRole === "YONETIM_KURULU") {
          nextStatus = "Onaylandı";
          nextApprovalStatus = "Onaylandı";
          commentText = commentText || "Genel müdür tarafından onaylandı.";
        } else {
          const roleName = approverRole === "BOLUM_SORUMLUSU" ? "Bölüm Sorumlusu" : "Satın Alma Müdürü";
          nextStatus = "Onay Bekliyor";
          nextApprovalStatus = "Bekliyor";
          commentText = (commentText ? commentText + " - " : "") + `${roleName} onayladı. Genel Müdür onayı bekleniyor.`;
        }
      } else {
        // 500.000 TL üzeri: Yönetim Kurulu onayı gerekli
        if (approverRole === "YONETIM_KURULU") {
          nextStatus = "Onaylandı";
          nextApprovalStatus = "Onaylandı";
          commentText = commentText || "Yönetim kurulu tarafından onaylandı.";
        } else {
          const roleName = approverRole === "BOLUM_SORUMLUSU" ? "Bölüm Sorumlusu" : 
                           approverRole === "SATINALMA_MUDURU" ? "Satın Alma Müdürü" : "Genel Müdür";
          nextStatus = "Onay Bekliyor";
          nextApprovalStatus = "Bekliyor";
          commentText = (commentText ? commentText + " - " : "") + `${roleName} onayladı. Yönetim Kurulu onayı bekleniyor.`;
        }
      }
    } else if (action === "Reddet") {
      nextStatus = "Reddedildi";
      nextApprovalStatus = "Reddedildi";
      commentText = commentText || "Talep reddedildi.";
    } else if (action === "Revizyona Gönder") {
      nextStatus = "Revizyon"; // Talep sahibine geri döner
      nextApprovalStatus = "Revizyon";
      commentText = commentText || "Talep revizyona gönderildi.";
    } else if (action === "Yorum Ekle") {
      // Sadece yorum ekleniyor, durum değişmiyor
      commentText = commentText || "Yorum eklendi.";
    }

    // 3. Değişiklikleri kaydet (Transaction)
    const updated = await prisma.$transaction(async (tx) => {
      // Onay geçmişini yaz
      const newApproval = await tx.purchaseRequisitionApproval.create({
        data: {
          requisitionId: id,
          approverId,
          action: action === "Yorum Ekle" ? "Yorum Ekle" : action,
          comment: `[${approverRole}] ${commentText}`,
          approvalDate: new Date()
        }
      });

      // Talebin genel durumunu güncelle
      const req = await tx.purchaseRequisition.update({
        where: { id },
        data: {
          status: nextStatus,
          approvalStatus: nextApprovalStatus
        }
      });

      return { req, newApproval };
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error recording approval action:', error);
    return NextResponse.json({ error: 'Onay işlemi kaydedilirken hata oluştu.' }, { status: 500 });
  }
}
