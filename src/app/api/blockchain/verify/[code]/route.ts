import { NextResponse } from 'next/server';

const MOCK_PROVENANCE_RECORD = {
  verificationCode: "PKF-NFT-2026-9842",
  nftTokenId: "#9842",
  blockHash: "0x8f3a92b4c1e7d5f0a2938475610b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
  blockNumber: 19842015,
  timestamp: "2026-07-15 08:30:00 UTC",
  productName: "2026 İspir Yaylası Sınırlı Rekolte Dut Pekmezi",
  batchNumber: "LOT-2026-ISP-04",
  rekolteYear: 2026,
  totalJarsInBatch: 500,
  jarNumber: 142,
  labAnalysis: {
    c4SugarTest: "%0.00 (Tamamen Doğal Sükrozsuz)",
    propolisRating: "98.4 / 100",
    diastaseValue: "24.2 (Yüksek Canlılık)",
    moistureRate: "%16.2 (İdeal Kıvam)",
    pollenCount: "450+ Endemik Tür"
  },
  gps: {
    latitude: 40.4852,
    longitude: 40.9984,
    locationName: "İspir Yaylası, Erzurum",
    altitudeMeters: 2200,
    producerName: "İlhan Efe & Zanaatkar Arıcı Ailesi"
  },
  certifier: "TÜBİTAK MAM & Akredite Gıda Analiz Laboratuvarı",
  blockchainNetwork: "Polygon (POS) Immutable Ledger"
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const code = resolvedParams.code.toUpperCase();

    // Dynamically calculate jar number from numeric pattern
    const matchDigits = code.match(/\d+/g);
    const numericSeed = matchDigits ? parseInt(matchDigits.join("").slice(-3)) || 142 : 142;
    const jarNum = (numericSeed % 500) || 1;

    const record = {
      ...MOCK_PROVENANCE_RECORD,
      verificationCode: code,
      nftTokenId: `#${numericSeed}`,
      jarNumber: jarNum,
    };

    return NextResponse.json({
      success: true,
      record
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Menşei kaydı bulunamadı."
    }, { status: 404 });
  }
}
