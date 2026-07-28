import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { trackingNo, status, cargoCompany } = payload;

    if (!trackingNo || !status || !cargoCompany) {
      return NextResponse.json({
        error: 'Eksik parametreler. trackingNo, status ve cargoCompany zorunludur.'
      }, { status: 400 });
    }

    console.log(`[CARGO_STATUS_WEBHOOK] Received status update for ${cargoCompany} tracking ${trackingNo}: ${status}`);

    // Query orders that contain trackingNo in their summary
    const orders = await prisma.order.findMany({
      where: {
        summary: {
          contains: trackingNo
        }
      }
    });

    if (orders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Belirtilen takip numarasına ait sipariş bulunamadı.'
      }, { status: 404 });
    }

    // Determine target order status based on cargo status:
    // - "Teslim Edildi" -> "Tamamlandı"
    // - "Yolda" or "Dağıtıma Çıktı" -> "Kargolandı"
    // - "İade Döndü" or "İade" -> "İade Talebi"
    let targetOrderStatus = '';
    const normalizedStatus = status.trim();

    if (normalizedStatus === 'Teslim Edildi') {
      targetOrderStatus = 'Tamamlandı';
    } else if (normalizedStatus === 'Yolda' || normalizedStatus === 'Dağıtıma Çıktı') {
      targetOrderStatus = 'Kargolandı';
    } else if (normalizedStatus === 'İade Döndü' || normalizedStatus === 'İade') {
      targetOrderStatus = 'İade Talebi';
    }

    const updatedOrders = [];

    for (const order of orders) {
      const summary = order.summary || '';
      let newSummary = summary;

      // Extract existing carrier and tracking details from brackets
      const match = summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);
      if (match) {
        const currentCarrier = match[1].trim();
        const currentTracking = match[2] ? match[2].trim() : '';

        // If either carrier or tracking no differs, replace the brackets
        if (currentCarrier !== cargoCompany || currentTracking !== trackingNo) {
          newSummary = summary.replace(/^\[[^\]]+\]/, `[${cargoCompany} | ${trackingNo}]`);
        }
      } else {
        // Prepend bracket details if not present
        newSummary = `[${cargoCompany} | ${trackingNo}] ${summary}`;
      }

      // Prepare updates
      const updateData: any = {
        summary: newSummary
      };

      if (targetOrderStatus) {
        updateData.status = targetOrderStatus;
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: updateData
      });

      updatedOrders.push({
        id: updated.id,
        status: updated.status,
        summary: updated.summary
      });
    }

    return NextResponse.json({
      success: true,
      message: `${updatedOrders.length} sipariş başarıyla güncellendi.`,
      updatedOrders
    });

  } catch (error: any) {
    console.error('[CARGO_STATUS_WEBHOOK_ERROR]:', error);
    return NextResponse.json({
      error: 'Webhook işlenirken iç sunucu hatası oluştu.',
      details: error.message
    }, { status: 500 });
  }
}
