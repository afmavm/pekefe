import { NextRequest, NextResponse } from 'next/server';
import { CargoService } from '@/modules/orders/server/cargo-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNo: string }> }
) {
  try {
    const resolvedParams = await params;
    const trackingNo = resolvedParams.trackingNo;
    
    // Parse carrier name from search parameters if available
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get('carrier') || 'Aras Kargo';

    if (!trackingNo) {
      return NextResponse.json({ error: 'Takip numarası belirtilmedi.' }, { status: 400 });
    }

    const trackingStatus = CargoService.getTrackingStatus(trackingNo, carrier);
    return NextResponse.json(trackingStatus);
  } catch (error) {
    console.error('Error tracking shipment:', error);
    return NextResponse.json({ error: 'Kargo bilgisi sorgulanamadı.' }, { status: 500 });
  }
}
