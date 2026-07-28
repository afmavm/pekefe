import { NextRequest, NextResponse } from 'next/server';
import { UBLInvoiceProcessor } from '@/lib/ubl-invoice-processor';
import { requireAdmin } from '@/lib/auth-helpers';
import path from 'path';

export async function POST(request: NextRequest) {
  // Yönetici yetki kontrolü
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Yüklenecek XML dosyası bulunamadı.' },
        { status: 400 }
      );
    }

    // Dosya uzantı kontrolü
    const fileExt = path.extname(file.name).toLowerCase();
    if (fileExt !== '.xml') {
      return NextResponse.json(
        { error: 'Geçersiz dosya türü. Sadece e-Fatura XML dosyaları (.xml) yüklenebilir.' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (Maksimum 10 MB e-fatura için oldukça yeterli)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'Fatura XML dosyası boyutu 10MB limitini aşamaz.' },
        { status: 400 }
      );
    }

    // Dosya içeriğini metin olarak oku
    const bytes = await file.arrayBuffer();
    const xmlContent = new TextDecoder('utf-8').decode(bytes);

    if (!xmlContent || xmlContent.trim() === '') {
      return NextResponse.json(
        { error: 'Dosya içeriği boş.' },
        { status: 400 }
      );
    }

    // XML Faturayı Ayrıştır ve Çekirdek ERP Fonksiyonu Üzerinden İşle
    const result = await UBLInvoiceProcessor.processEInvoice(xmlContent);

    if (result.success) {
      return NextResponse.json({
        success: true,
        invoiceId: result.invoiceId,
        status: result.status,
        message: 'e-Fatura başarıyla doğrulandı, cari ve stok entegrasyonu tamamlanarak resmi alış faturası kaydedildi.'
      }, { status: 201 });
    } else {
      // Eşleşmeyen cari veya stok kartı durumlarında HTTP 400 dönüyoruz
      const isResolutionNeeded = result.status === 'Supplier NotFound' || result.status === 'Product NotFound';
      return NextResponse.json({
        success: false,
        status: result.status,
        error: result.error,
        message: isResolutionNeeded 
          ? 'e-Fatura işlenemedi. Otomatik cari/stok eşleştirme eşiği aşıldı. Lütfen eksik tanımlamaları yapıp tekrar deneyin.'
          : 'e-Fatura işlenirken sistemsel bir hata oluştu.'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('e-Fatura XML içe aktarma api hatası:', error);
    return NextResponse.json(
      { error: 'e-Fatura işlenirken beklenmeyen bir sunucu hatası oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
