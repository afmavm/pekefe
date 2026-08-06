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

const RequisitionSchema = z.object({
  branchId: z.string(),
  departmentId: z.string(),
  requesterId: z.string(),
  projectId: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Kritik"]),
  status: z.string().optional().default("Taslak"),
  expectedDeliveryDate: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(RequisitionItemSchema).min(1, "En az bir ürün kalemi eklemelisiniz"),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const branchId = searchParams.get('branchId');
    const departmentId = searchParams.get('departmentId');
    const requesterId = searchParams.get('requesterId');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const approvalStatus = searchParams.get('approvalStatus');

    const where: any = {};

    if (from || to) {
      where.requestDate = {};
      if (from) where.requestDate.gte = new Date(from);
      if (to) where.requestDate.lte = new Date(to);
    }
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;
    if (requesterId) where.requesterId = requesterId;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    const requisitions = await prisma.purchaseRequisition.findMany({
      where,
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
      },
      orderBy: { requisitionNo: 'desc' }
    });

    return NextResponse.json(requisitions);
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    return NextResponse.json({ error: 'Talepler yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const result = RequisitionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // 1. Otomatik Talep No üret
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const countToday = await prisma.purchaseRequisition.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const dateStr = now.getFullYear().toString() + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
    const requisitionNo = `TALEP-${dateStr}-${(countToday + 1).toString().padStart(3, '0')}`;

    // 2. Toplam tutarı hesapla
    const totalAmount = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    // 3. Veritabanı işlemleri (Transaction)
    const requisition = await prisma.$transaction(async (tx) => {
      const req = await tx.purchaseRequisition.create({
        data: {
          requisitionNo,
          requestDate: now,
          branchId: data.branchId,
          departmentId: data.departmentId,
          requesterId: data.requesterId,
          projectId: data.projectId,
          costCenterId: data.costCenterId,
          priority: data.priority,
          status: data.status,
          approvalStatus: data.status === "Onay Bekliyor" ? "Bekliyor" : "Taslak",
          expectedDeliveryDate: new Date(data.expectedDeliveryDate),
          totalAmount,
          notes: data.notes,
        }
      });

      // Kalemleri ekle
      for (const item of data.items) {
        await tx.purchaseRequisitionItem.create({
          data: {
            requisitionId: req.id,
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            description: item.description,
          }
        });
      }

      // Taslak dışındaysa ilk onay adımı/tarihçe kaydını oluştur
      if (data.status === "Onay Bekliyor") {
        await tx.purchaseRequisitionApproval.create({
          data: {
            requisitionId: req.id,
            approverId: data.requesterId,
            action: "Onay Bekliyor",
            comment: "Talep oluşturuldu ve onaya sunuldu.",
            approvalDate: now
          }
        });
      }

      return req;
    });

    return NextResponse.json(requisition);
  } catch (error) {
    console.error('Error creating purchase requisition:', error);
    return NextResponse.json({ error: 'Talep oluşturulurken sistemsel hata oluştu.' }, { status: 500 });
  }
}
