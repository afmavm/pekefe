import { NextRequest, NextResponse } from "next/server";

// TCMB (Türkiye Cumhuriyet Merkez Bankası) günlük kur XML beslemi
const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

// Frankfurter (yedek kaynak – CORS sorunu olmaz)
const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD,EUR,GBP&to=TRY";

interface RateResult {
  USD: number;
  EUR: number;
  GBP: number;
  source: "TCMB" | "FRANKFURTER" | "FALLBACK";
  date: string;
}

async function fetchFromTCMB(): Promise<RateResult> {
  const res = await fetch(TCMB_URL, {
    next: { revalidate: 3600 }, // 1 saat önbellek
    headers: { "Accept": "application/xml" },
  });

  if (!res.ok) throw new Error("TCMB yanıt vermedi");

  const xml = await res.text();

  const extract = (code: string): number => {
    // ForexSelling değerini kullan (satış kuru)
    const regex = new RegExp(
      `<Currency[^>]*CurrencyCode="${code}"[^>]*>.*?<ForexSelling>([\\d.]+)<\\/ForexSelling>`,
      "s"
    );
    const match = xml.match(regex);
    return match ? parseFloat(match[1]) : 0;
  };

  // Tarih için Tarih attribute'u
  const dateMatch = xml.match(/Tarih="([^"]+)"/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString("tr-TR");

  const USD = extract("USD");
  const EUR = extract("EUR");
  const GBP = extract("GBP");

  if (!USD || !EUR) throw new Error("Kur değerleri ayrıştırılamadı");

  return { USD, EUR, GBP, source: "TCMB", date };
}

async function fetchFromFrankfurter(): Promise<RateResult> {
  const [usdRes, eurRes, gbpRes] = await Promise.all([
    fetch("https://api.frankfurter.app/latest?from=USD&to=TRY", { next: { revalidate: 3600 } }),
    fetch("https://api.frankfurter.app/latest?from=EUR&to=TRY", { next: { revalidate: 3600 } }),
    fetch("https://api.frankfurter.app/latest?from=GBP&to=TRY", { next: { revalidate: 3600 } }),
  ]);

  const [usdData, eurData, gbpData] = await Promise.all([
    usdRes.json(),
    eurRes.json(),
    gbpRes.json(),
  ]);

  return {
    USD: usdData?.rates?.TRY ?? 0,
    EUR: eurData?.rates?.TRY ?? 0,
    GBP: gbpData?.rates?.TRY ?? 0,
    source: "FRANKFURTER",
    date: usdData?.date ?? new Date().toLocaleDateString("tr-TR"),
  };
}

export async function GET(request: NextRequest) {
  const currency = new URL(request.url).searchParams.get("currency") || "USD";

  let result: RateResult;

  // 1. TCMB'den çekmeyi dene
  try {
    result = await fetchFromTCMB();
  } catch {
    // 2. Frankfurter'a düş
    try {
      result = await fetchFromFrankfurter();
    } catch {
      // 3. Son çare – sabit fallback
      result = {
        USD: 38.5,
        EUR: 41.5,
        GBP: 48.5,
        source: "FALLBACK",
        date: new Date().toLocaleDateString("tr-TR"),
      };
    }
  }

  // Belirli bir para birimi istendi ise sadece onu döndür
  const rate = result[currency as keyof Pick<RateResult, "USD" | "EUR" | "GBP">] ?? 1;

  return NextResponse.json({
    currency,
    rate: parseFloat(rate.toFixed(4)),
    rates: { USD: result.USD, EUR: result.EUR, GBP: result.GBP },
    source: result.source,
    date: result.date,
  });
}
