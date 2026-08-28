/**
 * Pekefe Destek — Gemini AI Destekli Müşteri Destek Servisi
 * 
 * Kurumsal bilgi tabanı + Gemini Pro ile doğal dil destek asistanı.
 * PEKEFE Geleneksel & Doğal Lezzetler ürünlerine özel bağlam sağlar.
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { PEKEFE_CORPORATE_KB } from "./knowledgeBase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function buildSystemPrompt(contextData?: string): string {
  return `Sen "Pekefe Destek" adlı, PEKEFE Geleneksel & Doğal Lezzetler (İspir Ham Dut Pekmezi, Kaçkar Ham Balı, İspir Cevizli Köme ve Pestil) firmasına özel profesyonel bir müşteri destek asistanısın. 
Türkçe konuşuyorsun, son derece kibar, samimi ve gıda uzmanı bir dil kullanıyorsun.

═══ MARKA KİMLİĞİ ═══
${PEKEFE_CORPORATE_KB.brandIdentity}

═══ ÜRÜN DETAYLARI & BESİN DEĞERLERİ ═══
${PEKEFE_CORPORATE_KB.productDetail}

═══ TİCARİ KURALLAR VE LOJİSTİK ═══
${PEKEFE_CORPORATE_KB.businessRules}

═══ SIKÇA SORULAN SORULAR ═══
S: Pekmezinizde şeker veya glikoz var mı?
C: Kesinlikle hayır! PEKEFE İspir Dut Pekmezimiz %100 saf ve doğal dut şırasından üretilir. İçerisinde 0.0% ilave şeker, glikoz şurubu veya hiçbir koruyucu madde bulunmaz.

S: Ürünler ne zaman kargoya verilir?
C: Hafta içi saat 15:00'e kadar verilen tüm siparişleriniz aynı gün kargoya teslim edilir. Teslimat süremiz 1-3 iş günüdür.

S: Pekmez ve bal nasıl saklanmalı?
C: Oda sıcaklığında (18°C - 22°C), serin ve direkt güneş ışığı almayan bir yerde saklanmalıdır. Tüketirken ahşap veya seramik kaşık tercih edilmesi tavsiye edilir.

S: Ürünlerin analiz raporu var mı?
C: Evet! Tüm ürünlerimiz Coğrafi İşaretli ve bağımsız gıda laboratuvarı analiz raporludur. HMF seviyesi 10 mg/kg altındadır.

═══ GERÇEK ZAMANLI KULLANICI VERİSİ ═══
${contextData ? contextData : "Oturum açmamış ziyaretçi — kişisel sipariş/hesap bilgisi mevcut değil."}

═══ KESİN DAVRANIŞ KURALLARI ═══
1. SADECE PEKEFE İspir Yöresel Ürünleri (Dut Pekmezi, Ham Bal, Cevizli Köme, Pestil) hakkında bilgi ver.
2. ASLA arıcılık ekipmanı, körük, arıcı elbisesi veya sanayi aletlerinden bahsetme!
3. Rakip markalar hakkında yorum yapma.
4. Bilmediğin veya emin olmadığın özel sipariş detaylarında "Bu konuyu WhatsApp destek hattımıza yönlendiriyorum" de.
5. Cevaplarını kısa, net, kibar ve iştah açıcı geleneksel bir dille sun.`;
}

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

    if (lastOrder) {
      const orderNo = `ORD-${new Date(lastOrder.date).getFullYear()}-${lastOrder.id.slice(-6).toUpperCase()}`;
      context += `\nSon Sipariş: ${orderNo} — Durum: ${lastOrder.status} — Tutar: ₺${Number(lastOrder.total).toLocaleString("tr-TR")}`;
    }
    return context;
  } catch {
    return "";
  }
}

export async function queryGeminiSupport(
  message: string,
  role: string,
  userEmail?: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    const { queryAiAssistant } = await import("./knowledgeBase");
    return queryAiAssistant(message, role, userEmail);
  }

  try {
    const userContext = await buildUserContext(userEmail);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: buildSystemPrompt(userContext),
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.3,
        topP: 0.85,
        topK: 40,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await model.generateContent(message);
    const text = result.response.text();

    return text?.trim() || fallbackResponse();
  } catch (err: any) {
    console.error("[Pekefe Destek - Gemini Error]:", err?.message || err);
    const { queryAiAssistant } = await import("./knowledgeBase");
    return queryAiAssistant(message, role, userEmail);
  }
}

function fallbackResponse(): string {
  return "Şu anda sistemlerimizde kısa süreli bir yoğunluk var. Pekefe ürünlerimiz, siparişleriniz veya kargonuz hakkında sorularınız için WhatsApp destek hattımız üzerinden anında bilgi alabilirsiniz.";
}
