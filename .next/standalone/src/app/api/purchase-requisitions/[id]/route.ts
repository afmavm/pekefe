import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const RequisitionItemSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().positive("Miktar pozitif olmalıdır"),
  unitPrice: z.number().nonnegative("Birim fiyat sıfırdan küçük olamaz"),
  description: z.string().optional().nullable(),
});

const RequisitionUpdateSchema = z.object({
  branchId: z.string(),
  departmentId: z.string(),
  projectId: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Kritik"]),
  status: z.string().optional(),
  expectedDeliveryDate: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(RequisitionItemSchema).min(1, "En az bir ürün kalemi eklemelisiniz"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  try {
    const requisition = await prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        branch: true,
        requester: true,
        items: {
          include: {
            product: true,
            warehouse: true,
          }
        },
        approvals: {
          include: {
            approver: true
          },
          orderBy: { approvalDate: 'desc' }
        }
      }
    });

    if (!requisition) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json(requisition);
  } catch (error) {
    console.error('Error fetching requisition:', error);
    return NextResponse.json({ error: 'Talep detayı yüklenirken hata oluştu.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  try {
    const body = await request.json();
    const result = RequisitionUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // 1. Talebin varlığını ve durumunu kontrol et
    const existing = await prisma.purchaseRequisition.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
    }

    if (["Teklife Aktarıldı", "Siparişe Aktarıldı", "Tamamlandı"].includes(existing.status)) {
      return NextResponse.json({ error: 'Teklife veya siparişe aktarılmış talepler güncellenemez.' }, { status: 400 });
    }

    // 2. Toplam tutarı hesapla
    const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    const updated = await prisma.$transaction(async (tx) => {
      // Kalemleri temizle
      await tx.purchaseRequisitionItem.deleteMany({
        where: { requisitionId: id }
      });

      // Yeni kalemleri ekle
      for (const item of data.items) {
        await tx.purchaseRequisitionItem.create({
          data: {
            requisitionId: id,
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            description: item.description,
          }
        });
      }

      // Talebi güncelle
      const newStatus = data.status || existing.status;
      const approvalStatus = newStatus === "Onay Bekliyor" ? "Bekliyor" : 
                            newStatus === "Taslak" ? "Taslak" : existing.approvalStatus;

      const req = await tx.purchaseRequisition.update({
        where: { id },
        data: {
          branchId: data.branchId,
          departmentId: data.departmentId,
          projectId: data.projectId,
          costCenterId: data.costCenterId,
          priority: data.priority,
          status: newStatus,
          approvalStatus,
          expectedDeliveryDate: new Date(data.expectedDeliveryDate),
          totalAmount,
          notes: data.notes,
        }
      });

      // Eğer durum "Onay Bekliyor" olarak güncellendiyse onay kaydı at
      if (newStatus === "Onay Bekliyor" && existing.status !== "Onay Bekliyor") {
        await tx.purchaseRequisitionApproval.create({
          data: {
            requisitionId: id,
            approverId: existing.requesterId,
            action: "Onay Bekliyor",
            comment: "Talep güncellendi ve onaya sunuldu.",
            approvalDate: new Date()
          }
        });
      }

      return req;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating requisition:', error);
    return NextResponse.json({ error: 'Talep güncellenirken sistemsel hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;

  try {
    const existing = await prisma.purchaseRequisition.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
    }

    if (["Teklife Aktarıldı", "Siparişe Aktarıldı", "Tamamlandı", "Onaylandı"].includes(existing.status)) {
      return NextResponse.json({ error: 'Onaylanmış veya teklif/sipariş aşamasına geçmiş talepler silinemez.' }, { status: 400 });
    }

    await prisma.purchaseRequisition.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Talep başarıyla silindi." });
  } catch (error) {
    console.error('Error deleting requisition:', error);
    return NextResponse.json({ error: 'Talep silinirken hata oluştu.' }, { status: 500 });
  }
}
