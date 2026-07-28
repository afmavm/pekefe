import { NextRequest, NextResponse } from "next/server";

/**
 * MERNİS (Merkezi Nüfus İdaresi Sistemi) TCKN Doğrulama API
 *
 * Gerçek MERNİS entegrasyonu için:
 * 1. NVİ (Nüfus ve Vatandaşlık İşleri) web servisleri kullanılır
 * 2. KPS (Kimlik Paylaşım Sistemi) API: https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx
 * 3. Kurumsal kullanım için NVİ'den yetki belgesi alınması gerekmektedir.
 *
 * Bu route Luhn-benzeri TCKN algoritması ile doğrulama yapar.
 */

// Türk Cumhuriyeti Kimlik No algoritması ile doğrulama
function validateTCKN(tckn: string): { valid: boolean; reason?: string } {
  if (!/^\d{11}$/.test(tckn)) {
    return { valid: false, reason: "TCKN 11 haneli ve yalnızca rakamlardan oluşmalıdır." };
  }

  // İlk hane 0 olamaz
  if (tckn[0] === "0") {
    return { valid: false, reason: "TCKN'nin ilk hanesi 0 olamaz." };
  }

  const digits = tckn.split("").map(Number);

  // 10. hane algoritması: (1-7-9-3-5-7-9-3-5-7 katsayıları ile çarpım toplamı) % 10
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const d10 = (oddSum * 7 - evenSum) % 10;
  if (d10 < 0 || d10 !== digits[9]) {
    return { valid: false, reason: "TCKN algoritma doğrulaması başarısız. Lütfen numarayı kontrol edin." };
  }

  // 11. hane algoritması: (d1+d2+...+d10) % 10
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sumFirst10 % 10 !== digits[10]) {
    return { valid: false, reason: "TCKN 11. hane doğrulaması başarısız." };
  }

  return { valid: true };
}

// NVİ KPS Servisi simülasyonu
async function queryKPSService(tckn: string, ad?: string, soyad?: string, dogumYili?: number) {
  const KPS_URL = process.env.KPS_SERVICE_URL;
  const KPS_TOKEN = process.env.KPS_SERVICE_TOKEN;

  if (!KPS_URL || !KPS_TOKEN) {
    return null; // Simülasyon moduna geç
  }

  try {
    // SOAP/REST isteği gönder (kuruma göre değişir)
    const response = await fetch(`${KPS_URL}/dogrula`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KPS_TOKEN}`,
      },
      body: JSON.stringify({ tckn, ad, soyad, dogumYili }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tckn, ad, soyad, dogumYili } = body;

    if (!tckn || typeof tckn !== "string") {
      return NextResponse.json(
        { error: "TCKN parametresi gereklidir.", valid: false },
        { status: 400 }
      );
    }

    const cleanTCKN = tckn.trim().replace(/\s/g, "");

    if (cleanTCKN.length !== 11) {
      return NextResponse.json(
        {
          error: `TCKN 11 haneli olmalıdır. Girilen: ${cleanTCKN.length} hane.`,
          valid: false,
        },
        { status: 422 }
      );
    }

    // Algoritma ile ön doğrulama
    const algoResult = validateTCKN(cleanTCKN);
    if (!algoResult.valid) {
      return NextResponse.json(
        {
          error: algoResult.reason || "Geçersiz TCKN",
          valid: false,
          source: "ALGORITHM",
        },
        { status: 422 }
      );
    }

    // Gerçek KPS servisi var mı?
    const kpsResult = await queryKPSService(cleanTCKN, ad, soyad, dogumYili);
    if (kpsResult) {
      return NextResponse.json({
        valid: kpsResult.valid,
        source: "KPS_NVI",
        tckn: cleanTCKN,
        ad: kpsResult.ad || null,
        soyad: kpsResult.soyad || null,
        dogumYili: kpsResult.dogumYili || null,
        mesaj: kpsResult.valid
          ? "T.C. Kimlik Numarası MERNİS sisteminde doğrulandı."
          : "T.C. Kimlik Numarası MERNİS sisteminde doğrulanamadı.",
        sorguTarihi: new Date().toISOString(),
      });
    }

    // Simülasyon modu: algoritma geçerli ise onaylandı say
    return NextResponse.json({
      valid: true,
      source: "ALGORITHM",
      tckn: cleanTCKN,
      mesaj:
        "T.C. Kimlik Numarası algoritma doğrulamasından başarıyla geçti. MERNİS entegrasyonu için KPS_SERVICE_URL ortam değişkenini tanımlayın.",
      disclaimer:
        "Bu doğrulama yalnızca TCKN algoritması ile yapılmıştır. Gerçek kişi eşleştirmesi için KPS servisi gereklidir.",
      sorguTarihi: new Date().toISOString(),
    });
  } catch (error) {
    console.error("TCKN doğrulama hatası:", error);
    return NextResponse.json(
      { error: "TCKN doğrulaması sırasında bir hata oluştu.", valid: false },
      { status: 500 }
    );
  }
}
