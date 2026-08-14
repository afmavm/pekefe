import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { DespatchService } from '@/modules/despatch/server/despatch-service';

export async function GET(request: NextRequest) {
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

    // Tabloların var olduğundan emin ol
    await DespatchService.ensureDespatchTables().catch(() => null);

    // Despatch advices'i Prisma modeli üzerinden sorgula
    const despatches = await prisma.despatchAdvice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customerAccount: {
          select: { id: true, name: true, taxId: true, type: true }
        },
        invoice: {
          select: { id: true, status: true, totalAmount: true }
        },
        lines: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      count: despatches.length,
      despatches: despatches.map(d => ({
        id: d.id,
        despatchNo: d.despatchNo,
        ettnNo: d.ettnNo,
        status: d.status,
        issueDate: d.issueDate,
        actualDespatchDate: d.actualDespatchDate,
        licensePlate: d.licensePlate,
        driverName: d.driverName,
        carrierId: d.carrierId,
        createdAt: d.createdAt,
        customerAccount: d.customerAccount ? {
          id: d.customerAccount.id,
          name: d.customerAccount.name,
          taxId: d.customerAccount.taxId
        } : null,
        invoice: d.invoice ? { id: d.invoice.id } : null,
        lines: d.lines.map(l => ({
          quantity: l.quantity,
          product: l.product ? { name: l.product.name, sku: l.product.sku } : null
        }))
      }))
    });

  } catch (error: any) {
    console.error('[API_DESPATCH_LIST_ERROR]:', error);
    return NextResponse.json({
      success: true,
      count: 0,
      despatches: []
    });
  }
}
