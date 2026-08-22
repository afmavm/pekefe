import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName = "", category = "", description = "", targetField = "all" } = body;

    const cleanName = productName.trim() || "Doğal Yöresel Ürün";
    const cleanCategory = category.trim() || "Gıda & Doğal Lezzetler";
    const cleanDesc = description.trim() || `${cleanName}, geleneksel yöntemlerle hazırlanan lezzetli ve %100 doğal bir üründür.`;

    // 1. Semantik Etiket Çıkarıcı & Kelime Haznesi
    const keywordsSet = new Set<string>();

    // Ürün adı kelimeleri
    cleanName.toLowerCase().split(/\s+/).forEach(w => {
      const cleanWord = w.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, "");
      if (cleanWord.length > 2 && !["ve", "ile", "için", "olan", "bir", "gibi"].includes(cleanWord)) {
        keywordsSet.add(cleanWord);
      }
    });

    // Kategori ve Sektör Semantik Kelimeleri
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

    // 2. SEO Başlığı (Max 60 Char SEO standard)
    const seoTitle = `${cleanName} | Doğal & Geleneksel Yöresel Lezzet - Pekefe`;

    // 3. SEO Açıklaması (140-160 Char CTR Standard)
    const seoDesc = `${cleanName} en uygun fiyat ve katkısız doğallık garantisiyle Pekefe'de! ${cleanCategory} kategorisinde tazelik ve yüksek kalite adresinize teslim.`;

    // 4. Görsel Rozetleri
    const badgeText1 = cleanName.toLowerCase().includes("doğal") || cleanDesc.toLowerCase().includes("doğal") ? "%100 Katkısız & Doğal" : "Geleneksel Üretim";
    const badgeText2 = cleanCategory ? `${cleanCategory} Özel` : "Taze Hasat";

    // 5. İmalat Reçete Açıklaması
    const recipeDetails = `${cleanName} imalatında hijyenik koşullarda seçilen hammadde oranı %100'dür. Geleneksel bakır kazanlarda odun ateşinde ağır ağır kaynatılarak veya geleneksel presleme yöntemleriyle katkısız biçimde imal edilmiştir. Hiçbir koruyucu, glikoz şurubu veya renklendirici içermez.`;

    // 6. Ekstra Tanıtım Paragrafı
    const longDescExtra = `${cleanName}, Doğu Anadolu'nun el değmemiş yüksek yaylalarından elde edilen en kaliteli içeriklerle hazırlanmıştır. Pekefe güvencesiyle doğrudan üreticiden sofranıza ulaşan bu lezzet, hem çocuklarınız hem de aileniz için besleyici, güvenilir ve %100 doğal bir besin kaynağıdır.`;

    // 7. Kullanım & Tüketim Kılavuzu (HTML)
    const usageGuide = `<div class="space-y-2 text-sm text-slate-700">
  <p><strong>Saklama Koşulları:</strong> Güneş ışığından uzak, serin ve kuru bir ortamda (+4°C ile +18°C arasında) muhafaza ediniz.</p>
  <p><strong>Tüketim Önerisi:</strong> Kahvaltılarda tek başına, ılık süt ile karıştırılarak veya yöresel tereyağı eşliğinde tüketilmesi tavsiye edilir.</p>
  <p><strong>Tazelik Uyarısı:</strong> Ambalajı açıldıktan sonra tazeliğini koruması için kapağını sıkıca kapatınız.</p>
</div>`;

    return NextResponse.json({
      success: true,
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
