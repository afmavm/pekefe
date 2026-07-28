import { NextRequest, NextResponse } from "next/server";

/**
 * GİB (Gelir İdaresi Başkanlığı) e-Fatura / e-Arşiv Mükellef Sorgulama API
 *
 * Gerçek GİB entegrasyonu için:
 * 1. GİB Web Servisleri: https://earsiv.gib.gov.tr/earsiv-services/
 * 2. İnteraktif Vergi Dairesi API'si için firma bazlı token gerekmektedir.
 * 3. Bu route, GİB'in kamuya açık e-arşiv sorgulama servisini kullanmaktadır.
 *
 * Not: GİB resmi API'sine erişim için mali mühür / elektronik imza gerekmektedir.
 * Şu an için gerçekçi simülasyon ve Luhn algoritması ile VKN doğrulaması yapılmaktadır.
 */

// Luhn algoritması ile VKN (Vergi Kimlik Numarası) doğrulama
function validateVKN(vkn: string): boolean {
  if (!/^\d{10}$/.test(vkn)) return false;

  const digits = vkn.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const step1 = (digits[i] + (9 - i)) % 10;
    const step2 = (step1 * Math.pow(2, 9 - i)) % 9;
    sum += step2 === 0 && step1 !== 0 ? 9 : step2;
  }

  const checkDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return checkDigit === digits[9];
}

// T.C. Kimlik Numarası doğrulama algoritması
function validateTCKN(tckn: string): boolean {
  if (!/^[1-9]\d{10}$/.test(tckn)) return false;
  const digits = tckn.split("").map(Number);
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = (sumOdd * 7 - sumEven) % 10;
  if (digit10 !== digits[9]) return false;
  const sumFirst10 = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  if (sumFirst10 % 10 !== digits[10]) return false;
  return true;
}

// Gerçek GİB API'sine çağrı (varsa)
async function queryGIBApi(vkn: string) {
  // GİB'in kamuya açık e-arşiv sorgu endpoint'i
  // Not: Gerçek production kullanımı için GİB ile anlaşma ve mali mühür gereklidir.
  const GIB_BASE_URL = process.env.GIB_API_URL || "https://earsiv.gib.gov.tr";
  const GIB_API_KEY = process.env.GIB_API_KEY || "";

  if (!GIB_API_KEY) {
    // API anahtarı yoksa simülasyon modunda çalış
    return null;
  }

  try {
    const response = await fetch(`${GIB_BASE_URL}/earsiv-services/dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GIB_API_KEY}`,
        "referrer-policy": "no-referrer",
      },
      body: JSON.stringify({
        callid: `QUERY_${Date.now()}`,
        ostype: "WEB",
        language: "TR",
        cmd: "EARSIV_PORTAL_MUKELLEF_BILGILERI",
        pageName: "RG_YFATURAOLUSTUR",
        token: GIB_API_KEY,
        jp: JSON.stringify({ vkn }),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch {
    return null;
  }
}

// Simülasyon modu: VKN/TCKN'ye göre deterministik sonuç üret
function simulateGIBResponse(vkn: string) {
  if (vkn === "33748460218") {
    return {
      success: true,
      efatura: true,
      earsiv: false,
      firmaAdi: "Atak Arıcılık",
      vkn,
      sorguTarihi: new Date().toISOString(),
      kayitTarihi: "2021-01-15",
      durum: "E_FATURA_MUKELLEF",
      mesaj: "Mükellef e-Fatura sistemine kayıtlıdır. Kesilecek faturalar e-Fatura formatında düzenlenmelidir.",
      ad: "HAMİT",
      soyad: "YAZICI",
      vergiDairesi: "KAZIMKARABEKİR VERGİ DAİRESİ",
      email: "info@atakaricilik.com",
      tel: "905304215970",
      adres: "KURTULUŞ MAH. 1. TOPTANCILAR SİTESİ SK. SEZERLER IS MERKEZİ S BLOK NO: 10 K YAKUTİYE/ ERZURUM",
      sehir: "Erzurum",
      ilce: "Yakutiye",
      website: "www.atakaricilik.com",
      mersisNo: "3374846021800019",
      sicilNo: "12345/Erzurum",
      bolge: "Doğu Anadolu",
      fax: "",
      kepAddress: "atakaricilik@hs01.kep.tr",
      binaAdi: "Sezerler İş Merkezi S Blok",
      binaNo: "10",
      sokak: "1. Toptancılar Sitesi Sokak",
      postaKodu: "25000",
    };
  }

  const is11Digits = vkn.length === 11;
  const isValid = is11Digits ? validateTCKN(vkn) : validateVKN(vkn);

  if (!isValid) {
    return {
      success: false,
      error: is11Digits
        ? "Geçersiz T.C. Kimlik Numarası formatı. Lütfen 11 haneli geçerli bir TCKN giriniz."
        : "Geçersiz VKN formatı. Lütfen 10 haneli geçerli bir Vergi Kimlik Numarası giriniz.",
      efatura: false,
      earsiv: false,
    };
  }

  // Deterministik simülasyon: Son rakamına göre durum belirle
  const lastDigit = parseInt(vkn[vkn.length - 1]);
  const isEFatura = lastDigit >= 5; // %50 ihtimalle e-Fatura
  const isEArsiv = !isEFatura && lastDigit >= 2; // e-Fatura değilse e-Arşiv olabilir

  let firmaAdi = "";
  let ad = "";
  let soyad = "";
  let vergiDairesi = "KAZIMKARABEKİR VERGİ DAİRESİ";
  let email = "";
  let tel = "";
  let adres = "";
  let sehir = "İstanbul";
  let ilce = "Kadıköy";
  let website = "";
  let mersisNo = vkn + "00019";
  let sicilNo = "54321/İstanbul";
  let bolge = "Marmara";
  let fax = "0212 123 45 68";
  let kepAddress = vkn + "@hs01.kep.tr";
  let binaAdi = "Atak İş Hanı";
  let binaNo = "20/A";
  let sokak = "İstiklal Sokak";
  let postaKodu = "34000";

  if (is11Digits) {
    // Şahıs Firması (TCKN)
    if (lastDigit === 0 || lastDigit === 1) {
      ad = "Mehmet";
      soyad = "Kaya";
      firmaAdi = "MEHMET KAYA TİCARET";
      email = "mehmet@kayaticaret.com";
      tel = "0532 987 65 43";
      adres = "Atatürk Caddesi No: 45, Daire: 12";
      sehir = "Ankara";
      ilce = "Çankaya";
      vergiDairesi = "ÇANKAYA VERGİ DAİRESİ";
      bolge = "İç Anadolu";
      sicilNo = "12345/Ankara";
      binaAdi = "Kaya Apartmanı";
      binaNo = "45";
      sokak = "Atatürk Caddesi";
      postaKodu = "06100";
    } else if (lastDigit === 2 || lastDigit === 3) {
      ad = "Ayşe";
      soyad = "Demir";
      firmaAdi = "AYŞE DEMİR GIDA";
      email = "ayse@demirgida.com";
      tel = "0542 111 22 33";
      adres = "Cumhuriyet Mahallesi, Gül Sokak No: 8";
      sehir = "İzmir";
      ilce = "Bornova";
      vergiDairesi = "BORNOVA VERGİ DAİRESİ";
      bolge = "Ege";
      sicilNo = "67890/İzmir";
      binaAdi = "Gül Konutları";
      binaNo = "8";
      sokak = "Gül Sokak";
      postaKodu = "35040";
    } else if (lastDigit === 4 || lastDigit === 5) {
      ad = "Mustafa";
      soyad = "Öztürk";
      firmaAdi = "MUSTAFA ÖZTÜRK İNŞAAT";
      email = "mustafa@ozturkinsaat.com";
      tel = "0505 222 33 44";
      adres = "Hürriyet Caddesi No: 12, Kat: 3";
      sehir = "Bursa";
      ilce = "Nilüfer";
      vergiDairesi = "NİLÜFER VERGİ DAİRESİ";
      bolge = "Marmara";
      sicilNo = "24680/Bursa";
      binaAdi = "Öztürk Plaza";
      binaNo = "12";
      sokak = "Hürriyet Caddesi";
      postaKodu = "16130";
    } else {
      // 6, 7, 8, 9
      ad = "Ahmet";
      soyad = "Yılmaz";
      firmaAdi = "AHMET YILMAZ ŞAHIS FİRMASI";
      email = "ahmet@yilmazfirma.com";
      tel = "0555 123 45 67";
      adres = "Merkez Mahallesi, İstiklal Caddesi No: 20/A, Daire: 2";
      sehir = "İstanbul";
      ilce = "Kadıköy";
      vergiDairesi = "KADIKÖY VERGİ DAİRESİ";
      bolge = "Marmara";
      sicilNo = "13579/İstanbul";
      binaAdi = "Yılmaz Han";
      binaNo = "20/A";
      sokak = "İstiklal Caddesi";
      postaKodu = "34710";
    }
  } else {
    // Kurumsal Firma (10 haneli VKN)
    if (lastDigit === 0 || lastDigit === 1) {
      firmaAdi = "TEKNO BİLİŞİM HİZMETLERİ A.Ş.";
      email = "info@teknobilisim.com.tr";
      tel = "0212 555 44 33";
      adres = "Maslak Mahallesi, Dereboyu Caddesi No: 10";
      sehir = "İstanbul";
      ilce = "Sarıyer";
      vergiDairesi = "MASLAK VERGİ DAİRESİ";
      website = "www.teknobilisim.com.tr";
      bolge = "Marmara";
      sicilNo = "98765/İstanbul";
      binaAdi = "Maslak Plaza";
      binaNo = "10";
      sokak = "Dereboyu Caddesi";
      postaKodu = "34485";
    } else if (lastDigit === 2 || lastDigit === 3) {
      firmaAdi = "LİMAN LOJİSTİK LİMİTED ŞİRKETİ";
      email = "contact@limanlojistik.com";
      tel = "0232 444 55 66";
      adres = "Liman Caddesi No: 100";
      sehir = "İzmir";
      ilce = "Konak";
      vergiDairesi = "KORDON VERGİ DAİRESİ";
      website = "www.limanlojistik.com";
      bolge = "Ege";
      sicilNo = "54321/İzmir";
      binaAdi = "Liman İş Merkezi";
      binaNo = "100";
      sokak = "Liman Caddesi";
      postaKodu = "35230";
    } else {
      firmaAdi = "ATAK ARICILIK GIDA SANAYİ VE TİCARET LİMİTED ŞİRKETİ";
      email = "info@atak-aricilik.com";
      tel = "0212 123 45 67";
      adres = "Merkez Mahallesi, İstiklal Caddesi No: 20/A, Kat: 1";
      sehir = "İstanbul";
      ilce = "Kadıköy";
      vergiDairesi = "KAZIMKARABEKİR VERGİ DAİRESİ";
      website = "www.atak-aricilik.com";
      bolge = "Marmara";
      sicilNo = "54321/İstanbul";
      binaAdi = "Atak İş Hanı";
      binaNo = "20/A";
      sokak = "İstiklal Sokak";
      postaKodu = "34000";
    }
  }

  return {
    success: true,
    efatura: isEFatura,
    earsiv: isEArsiv,
    firmaAdi,
    vkn,
    sorguTarihi: new Date().toISOString(),
    kayitTarihi: isEFatura
      ? "2021-01-15"
      : isEArsiv
        ? "2023-06-01"
        : null,
    durum: isEFatura
      ? "E_FATURA_MUKELLEF"
      : isEArsiv
        ? "E_ARSIV_MUKELLEF"
        : "NORMAL_MUKELLEF",
    mesaj: isEFatura
      ? "Mükellef e-Fatura sistemine kayıtlıdır. Kesilecek faturalar e-Fatura formatında düzenlenmelidir."
      : isEArsiv
        ? "Mükellef e-Arşiv sistemine kayıtlıdır. Faturalar e-Arşiv portalı üzerinden kesilebilir."
        : "Mükellef e-Fatura veya e-Arşiv sistemine kayıtlı değildir. Kağıt fatura kesilebilir.",
    ad,
    soyad,
    vergiDairesi,
    email,
    tel,
    adres,
    sehir,
    ilce,
    website,
    mersisNo,
    sicilNo,
    bolge,
    fax,
    kepAddress,
    binaAdi,
    binaNo,
    sokak,
    postaKodu,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vkn } = body;

    if (!vkn || typeof vkn !== "string") {
      return NextResponse.json(
        { error: "VKN parametresi gereklidir." },
        { status: 400 }
      );
    }

    const cleanVKN = vkn.trim().replace(/\s/g, "");

    if (cleanVKN.length !== 10 && cleanVKN.length !== 11) {
      return NextResponse.json(
        {
          error: `Vergi No / T.C. Kimlik No 10 veya 11 haneli olmalıdır. Girilen: ${cleanVKN.length} hane`,
          success: false,
        },
        { status: 422 }
      );
    }

    if (!/^\d+$/.test(cleanVKN)) {
      return NextResponse.json(
        { error: "VKN yalnızca rakamlardan oluşmalıdır.", success: false },
        { status: 422 }
      );
    }

    // Önce gerçek GİB API'sini dene
    const gibResult = await queryGIBApi(cleanVKN);

    if (gibResult) {
      // Gerçek API sonucu döndür
      return NextResponse.json({
        success: true,
        source: "GIB_API",
        efatura: gibResult.efatura || false,
        earsiv: gibResult.earsiv || false,
        firmaAdi: gibResult.firmaAdi || null,
        vkn: cleanVKN,
        sorguTarihi: new Date().toISOString(),
        durum: gibResult.durum || "BILINMIYOR",
        mesaj: gibResult.mesaj || "GİB sorgusu tamamlandı.",
      });
    }

    // Simülasyon modu (GİB API yoksa)
    const result = simulateGIBResponse(cleanVKN);

    return NextResponse.json({
      ...result,
      source: "SIMULATION",
      disclaimer:
        "GİB API anahtarı tanımlı değil. Simülasyon modunda çalışılıyor. Gerçek entegrasyon için GIB_API_KEY ortam değişkenini tanımlayın.",
    });
  } catch (error) {
    console.error("GİB sorgu hatası:", error);
    return NextResponse.json(
      { error: "GİB sorgusu sırasında bir hata oluştu.", success: false },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vkn = searchParams.get("vkn");

  if (!vkn) {
    return NextResponse.json({ error: "VKN parametresi gereklidir." }, { status: 400 });
  }

  return POST(
    new NextRequest(req.url, {
      method: "POST",
      body: JSON.stringify({ vkn }),
      headers: { "Content-Type": "application/json" },
    })
  );
}
