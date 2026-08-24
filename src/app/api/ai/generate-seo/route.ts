import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName = "", category = "", description = "", targetField = "all" } = body;

    const cleanName = productName.trim() || "Doğal Yöresel Ürün";
    const cleanCategory = category.trim() || "Gıda & Doğal Lezzetler";
    const cleanDesc = description.trim() || `${cleanName}, geleneksel yöntemlerle hazırlanan lezzetli ve %100 doğal bir üründür.`;

    const apiKey = process.env.GEMINI_API_KEY;

    // ── 1. Google Gemini AI Entegrasyonu (Aktif API Anahtarı Varsa) ──
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey.trim());
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        });

        const prompt = `Sen "PEKEFE Doğal & Geleneksel Gastronomi" markasının kıdemli E-Ticaret SEO ve İçerik Uzmanısın.
Aşağıdaki ürün bilgilerini derinlemesine inceleyerek profesyonel, araştırmacı, iştah açıcı ve Google'da en üst sıralara çıkacak içerikler üret.

ÜRÜN BİLGİLERİ:
- Ürün Adı: ${cleanName}
- Kategori: ${cleanCategory}
- Mevcut Açıklama / Not: ${cleanDesc}

Aşağıdaki JSON şemasına BİREBİR uygun bir JSON yanıtı ver:
{
  "seoTitle": "50-60 karakter arası, ürün adı ve Pekefe içeren dikkat çekici Google SEO başlığı",
  "seoDesc": "140-160 karakter arası, yüksek tıklama oranına (CTR) sahip, katkısız doğallık vurgulu meta açıklama",
  "seoKeywords": "6 ila 8 adet virgülle ayrılmış semantik arama anahtar kelimeleri",
  "badgeText1": "Kısa ve çarpıcı ürün rozeti (örn: %100 Katkısız & Doğal, Coğrafi İşaretli vb.)",
  "badgeText2": "İkinci rozet (örn: Geleneksel Odun Ateşi, 2000 Rakım Yayla Hasadı vb.)",
  "recipeDetails": "Ürünün geleneksel imalat tekniği, bakır kazan/odun ateşi, hammadde saflığı ve katkısız olduğunu anlatan 2-3 cümlelik zanaatkarlık reçetesi",
  "longDescExtra": "Ürünün Doğu Anadolu / İspir yayla coğrafyası, besleyici değeri ve mutfak mirasını özetleyen 2-3 cümlelik elit tanıtım paragrafı",
  "usageGuide": "Saklama koşulları, tüketim ve servis ritüelini anlatan temiz HTML formatında bir <div> bloğu (<p><strong>Saklama Koşulları:</strong> ...</p><p><strong>Tüketim Önerisi:</strong> ...</p><p><strong>Tazelik Uyarısı:</strong> ...</p>)"
}`;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        const parsed = JSON.parse(textResponse);

        if (parsed.seoTitle && parsed.seoDesc) {
          return NextResponse.json({
            success: true,
            source: "gemini-ai",
            data: {
              seoTitle: parsed.seoTitle,
              seoDesc: parsed.seoDesc,
              seoKeywords: parsed.seoKeywords || `${cleanName}, doğal yöresel, katkısız, pekefe lezzeti`,
              badgeText1: parsed.badgeText1 || "%100 Katkısız & Doğal",
              badgeText2: parsed.badgeText2 || "Geleneksel Üretim",
              recipeDetails: parsed.recipeDetails,
              longDescExtra: parsed.longDescExtra,
              usageGuide: parsed.usageGuide,
            }
          });
        }
      } catch (geminiError) {
        console.warn("Gemini AI çağrısı sırasında uyarı oluştu, yerel semantik kural motoruna geçiliyor:", geminiError);
      }
    }

    // ── 2. Dahili Semantik Fallback Kural Motoru (Sıfır Gecikme) ──
    const keywordsSet = new Set<string>();
    cleanName.toLowerCase().split(/\s+/).forEach(w => {
      const cleanWord = w.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, "");
      if (cleanWord.length > 2 && !["ve", "ile", "için", "olan", "bir", "gibi"].includes(cleanWord)) {
        keywordsSet.add(cleanWord);
      }
    });

    if (cleanCategory.toLowerCase().includes("pekmez") || cleanName.toLowerCase().includes("pekmez")) {
      ["doğal pekmez", "geleneksel pekmez", "katkısız pekmez", "dut pekmezi", "erzurum pekmezi", "kahvaltılık pekmez", "enerji kaynağı"].forEach(k => keywordsSet.add(k));
    } else if (cleanCategory.toLowerCase().includes("bal") || cleanName.toLowerCase().includes("bal")) {
      ["hakiki bal", "süzme çiçek balı", "yayla balı", "organik bal", "doğal arı balı", "şifa kaynağı"].forEach(k => keywordsSet.add(k));
    } else if (cleanCategory.toLowerCase().includes("peynir") || cleanName.toLowerCase().includes("peynir")) {
      ["yöresel peynir", "erzurum peyniri", "göğermiş peynir", "tam yağlı peynir", "doğal kahvaltılık peynir"].forEach(k => keywordsSet.add(k));
    } else {
      ["doğal lezzetler", "geleneksel imalat", "katkısız yöresel", "organik ürün", "pekefe lezzeti"].forEach(k => keywordsSet.add(k));
    }

    const keywordsArray = Array.from(keywordsSet);
    const seoKeywordsStr = keywordsArray.slice(0, 8).join(", ");

    const seoTitle = `${cleanName} | Doğal & Geleneksel Yöresel Lezzet - Pekefe`;
    const seoDesc = `${cleanName} en uygun fiyat ve katkısız doğallık garantisiyle Pekefe'de! ${cleanCategory} kategorisinde tazelik ve yüksek kalite adresinize teslim.`;
    const badgeText1 = cleanName.toLowerCase().includes("doğal") || cleanDesc.toLowerCase().includes("doğal") ? "%100 Katkısız & Doğal" : "Geleneksel Üretim";
    const badgeText2 = cleanCategory ? `${cleanCategory} Özel` : "Taze Hasat";
    const recipeDetails = `${cleanName} imalatında hijyenik koşullarda seçilen hammadde oranı %100'dür. Geleneksel bakır kazanlarda odun ateşinde ağır ağır kaynatılarak veya geleneksel presleme yöntemleriyle katkısız biçimde imal edilmiştir. Hiçbir koruyucu, glikoz şurubu veya renklendirici içermez.`;
    const longDescExtra = `${cleanName}, Doğu Anadolu'nun el değmemiş yüksek yaylalarından elde edilen en kaliteli içeriklerle hazırlanmıştır. Pekefe güvencesiyle doğrudan üreticiden sofranıza ulaşan bu lezzet, hem çocuklarınız hem de aileniz için besleyici, güvenilir ve %100 doğal bir besin kaynağıdır.`;
    const usageGuide = `<div class="space-y-2 text-sm text-slate-700">
  <p><strong>Saklama Koşulları:</strong> Güneş ışığından uzak, serin ve kuru bir ortamda (+4°C ile +18°C arasında) muhafaza ediniz.</p>
  <p><strong>Tüketim Önerisi:</strong> Kahvaltılarda tek başına, ılık süt ile karıştırılarak veya yöresel tereyağı eşliğinde tüketilmesi tavsiye edilir.</p>
  <p><strong>Tazelik Uyarısı:</strong> Ambalajı açıldıktan sonra tazeliğini koruması için kapağını sıkıca kapatınız.</p>
</div>`;

    return NextResponse.json({
      success: true,
      source: "semantic-rules",
      data: {
        seoTitle,
        seoDesc,
        seoKeywords: seoKeywordsStr,
        badgeText1,
        badgeText2,
        recipeDetails,
        longDescExtra,
        usageGuide,
      }
    });

  } catch (error: any) {
    console.error("AI SEO Generation error:", error);
    return NextResponse.json({ success: false, error: "AI İçerik Oluşturulamadı." }, { status: 500 });
  }
}
