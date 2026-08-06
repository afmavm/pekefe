import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';
import { generateNextOrderId } from '@/lib/b2b-helpers';

const ConvertSchema = z.object({
  targetType: z.enum(["offer", "order"]),
  supplierId: z.string().optional(),
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
    const result = ConvertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { targetType, supplierId } = result.data;

    // 1. Talebi sorgula
    const requisition = await prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!requisition) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
    }

    if (requisition.status !== "Onaylandı") {
      return NextResponse.json({ error: 'Sadece "Onaylandı" durumundaki talepler aktarılabilir.' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let documentId = "";
      let documentNo = "";

      if (targetType === "order") {
        // Siparişe dönüştürme:
        // Eğer tedarikçi seçilmemişse, veritabanından rastgele veya ilk satıcı cariyi bul
        let currentAccountId = supplierId;
        if (!currentAccountId) {
          const firstSupplier = await tx.currentAccount.findFirst({
            where: { isDeleted: false }
          });
          if (!firstSupplier) {
            throw new Error('Sistemde sipariş oluşturulabilecek aktif bir cari hesap bulunamadı.');
          }
          currentAccountId = firstSupplier.id;
        }

        // Sipariş kaydı oluştur
        const customOrderId = await generateNextOrderId(tx);
        const order = await tx.order.create({
          data: {
            id: customOrderId,
            currentAccountId: currentAccountId!,
            total: requisition.totalAmount,
            status: "Bekliyor", // Sipariş başlangıç durumu
            summary: `${requisition.requisitionNo} nolu Satın Alma Talebinden oluşturulmuştur.`,
            type: "SATIN_ALMA",
            date: new Date(),
          }
        });

        documentId = order.id;
        documentNo = `SIP-${order.id.slice(-6).toUpperCase()}`;

        // Talebin durumunu güncelle
        await tx.purchaseRequisition.update({
          where: { id },
          data: {
            status: "Siparişe Aktarıldı"
          }
        });

        // Tarihçe ekle
        await tx.purchaseRequisitionApproval.create({
          data: {
            requisitionId: id,
            approverId: requisition.requesterId,
            action: "Yorum Ekle",
            comment: `Talep, ${documentNo} numaralı Siparişe aktarıldı.`,
            approvalDate: new Date()
          }
        });

      } else {
        // Teklife dönüştürme (Simüle):
        documentNo = `TEK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Talebin durumunu güncelle
        await tx.purchaseRequisition.update({
          where: { id },
          data: {
            status: "Teklife Aktarıldı"
          }
        });

        // Tarihçe ekle
        await tx.purchaseRequisitionApproval.create({
          data: {
            requisitionId: id,
            approverId: requisition.requesterId,
            action: "Yorum Ekle",
            comment: `Talep, ${documentNo} numaralı Teklife aktarıldı.`,
            approvalDate: new Date()
          }
        });
      }

      return { documentId, documentNo };
    });

    return NextResponse.json({
      success: true,
      message: targetType === "order" ? "Talep başarıyla Siparişe aktarıldı." : "Talep başarıyla Teklife aktarıldı.",
      documentId: updated.documentId,
      documentNo: updated.documentNo,
    });

  } catch (error: any) {
    console.error('Error converting requisition:', error);
    return NextResponse.json({ error: error.message || 'Dönüştürme işlemi sırasında hata oluştu.' }, { status: 500 });
  }
}
