import { NextResponse } from 'next/server';
import { TrendyolService, HepsiburadaService, N11Service, XmlSupplierService } from '@/modules/marketplace/server/trendyol';
import { requireAdmin } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id, name } = await request.json();

    if (name === "Trendyol") {
      const result = await TrendyolService.syncOrders(id);
      return NextResponse.json(result);
    }

    if (name === "Hepsiburada") {
      const result = await HepsiburadaService.syncOrders(id);
      return NextResponse.json(result);
    }

    if (name === "N11") {
      const result = await N11Service.syncOrders(id);
      return NextResponse.json(result);
    }

    if (name === "XML Tedarikçi") {
      const result = await XmlSupplierService.syncOrders(id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true, message: `${name} senkronizasyonu tamamlandı (Simülasyon).` });
  } catch (error: any) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: error.message || 'Senkronizasyon başarısız.' }, { status: 500 });
  }
}
