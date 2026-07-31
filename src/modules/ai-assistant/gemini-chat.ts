/**
 * Pekefe Destek — Gemini AI Destekli Müşteri Destek Servisi
 * 
 * Kurumsal bilgi tabanı + Gemini Pro ile doğal dil destek asistanı.
 * Soru tipine göre önce veritabanından gerçek zamanlı veri çekebilir,
 * ardından Gemini'ye bağlam sağlayarak kişiselleştirilmiş cevap üretir.
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { ATAC_CORPORATE_KB } from "./knowledgeBase";

// ─── Gemini Client ────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─── Sistem Promptu (Pekefe Destek kimliği ve bilgi tabanı) ────────────────────
function buildSystemPrompt(contextData?: string): string {
  return `Sen "Pekefe Destek" adlı, PEKEFE Geleneksel & Doğal Lezzetler firmasına özel profesyonel bir müşteri destek asistanısın. 
Türkçe konuşuyorsun, kibar, samimi ve bilgilendirici bir dil kullanıyorsun.

═══ MARKA KİMLİĞİ ═══
${ATAC_CORPORATE_KB.brandIdentity}

═══ ÜRÜN DETAYLARI ═══
${ATAC_CORPORATE_KB.bellowsDetail}

═══ TİCARİ KURALLAR ═══
${ATAC_CORPORATE_KB.businessRules}

═══ EK ÜRÜN BİLGİLERİ ═══
• Tam Koruma Arıcı Elbisesi: 3 katmanlı nefes alabilir kumaş, arı sokmalarına %100 dayanıklı.
• Kovan Bakım Seti: 8 parçalı paslanmaz çelik aletler + özel taşıma çantası.
• Galvaniz Arıcı Körüğü: Korozyon dirençli galvaniz kaplama, giriş seviyesi model.

═══ SIKÇA SORULAN SORULAR ═══
S: Körük ne zaman kargoya verilir?
C: Hafta içi saat 15:00'e kadar verilen siparişler aynı gün kargoya teslim edilir.

S: Körük garantisi ne kadar?
C: Tüm körüklerimiz imalat hatalarına karşı 2 yıl garantilidir. Yedek parça fabrikamızdan temin edilir.

S: B2B bayilik nasıl başvurulur?
C: Vergi levhası ile birlikte B2B Portal'dan başvuru formunu doldurmanız yeterlidir. Yönetim onayından sonra özel bayi fiyatlarına erişebilirsiniz.

S: Ürünler nereden üretiliyor?
C: Tüm ürünlerimiz Erzurum Palandöken'deki fabrikamızda yerli üretimle imal edilmektedir.

═══ GERÇEK ZAMANLI VERİ ═══
${contextData ? contextData : "Oturum açmamış ziyaretçi — kişisel sipariş/hesap bilgisi mevcut değil."}

═══ DAVRANIŞ KURALLARI ═══
1. Sadece PEKEFE Geleneksel & Doğal Lezzetler ürünleri ve hizmetleri hakkında bilgi ver.
2. Rakip marka veya ürünler hakkında yorum yapma.
3. Kişisel hesap bilgisi için kullanıcıdan giriş yapmasını iste.
4. Bilmediğin veya emin olmadığın konularda "Bu konuyu WhatsApp destek hattımıza yönlendiriyorum" de.
5. Cevaplarını kısa, net ve kullanışlı tut. Gereksiz tekrar yapma.
6. Fiyat bilgisi verme — bunun için ürün sayfasını veya bayi portalını yönlendir.
7. Her zaman "Pekefe Destek" kimliğinde kal, başka bir asistan gibi davranma.`;
}

// ─── Gerçek Zamanlı DB Bağlamı ───────────────────────────────────────────────
async function buildUserContext(userEmail?: string): Promise<string> {
  if (!userEmail) return "";

  try {
    const account = await prisma.currentAccount.findFirst({
      where: { email: userEmail },
    });

    if (!account) return "";

    const lastOrder = await prisma.order.findFirst({
      where: { currentAccountId: account.id, isDeleted: false },
      orderBy: { date: "desc" },
    });

    let context = `Kullanıcı: ${account.name} (${userEmail})`;
    context += `\nHesap Türü: ${account.cariTipi === "CORPORATE" ? "Kurumsal B2B" : "Bireysel"}`;

    if (account.dealerGroup && account.dealerGroup !== "Standart") {
      context += `\nBayi Grubu: ${account.dealerGroup}`;
    }
    if (account.discountRate) {
      context += `\nBayi İndirim Oranı: %${account.discountRate}`;
    }

    if (lastOrder) {
      const orderNo = `ORD-${new Date(lastOrder.date).getFullYear()}-${lastOrder.id.slice(-6).toUpperCase()}`;
      context += `\nSon Sipariş: ${orderNo} — Durum: ${lastOrder.status} — Tutar: ₺${Number(lastOrder.total).toLocaleString("tr-TR")}`;

      // Kargo takip numarasını parse et
      if (lastOrder.summary && lastOrder.summary.startsWith("[")) {
        const match = lastOrder.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);
        if (match) {
          context += `\nKargo: ${match[1].trim()}${match[2] ? ` | Takip: ${match[2].trim()}` : ""}`;
        }
      }
    } else {
      context += `\nSon Sipariş: Henüz sipariş bulunmuyor`;
    }

    return context;
  } catch {
    return "";
  }
}

// ─── Ana AI Chat Fonksiyonu ───────────────────────────────────────────────────
export async function queryGeminiSupport(
  message: string,
  role: string,
  userEmail?: string
): Promise<string> {
  // API key yoksa fallback
  if (!process.env.GEMINI_API_KEY) {
    return "Servis şu anda geçici olarak kullanılamıyor. Lütfen WhatsApp destek hattımızdan bize ulaşın.";
  }

  try {
    // Kullanıcıya özel DB bağlamını oluştur
    const userContext = await buildUserContext(userEmail);

    // Gemini modeli ve güvenlik ayarları
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: buildSystemPrompt(userContext),
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.4,        // Tutarlı ve güvenilir cevaplar için
        topP: 0.85,
        topK: 40,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await model.generateContent(message);
    const text = result.response.text();

    return text?.trim() || fallbackResponse();
  } catch (err: any) {
    console.error("[Pekefe Destek - Gemini Error]:", err?.message || err);

    // Gemini hatası durumunda kural tabanlı sisteme düş
    const { queryAiAssistant } = await import("./knowledgeBase");
    return queryAiAssistant(message, role, userEmail);
  }
}

function fallbackResponse(): string {
  return "Şu anda cevap üretemiyorum. Lütfen WhatsApp destek hattımızdan veya bilet sistemi üzerinden bize ulaşın.";
}
