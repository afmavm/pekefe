import { prisma } from "@/lib/prisma";

export interface CorporateKnowledge {
  brandIdentity: string;
  bellowsDetail: string;
  businessRules: string;
}

export const ATAC_CORPORATE_KB: CorporateKnowledge = {
  brandIdentity: `Atak Arıcılık, 2021 yılında Erzurum Palandöken OSB'de kurulan, premium ve patentli arıcı körüğü ile profesyonel arıcılık ekipmanları üreten Türk sanayi kuruluşudur.
Fabrika adresi: Erzurum Organize Sanayi Bölgesi, Palandöken/Erzurum.
İletişim: WhatsApp ve destek bilet sistemi üzerinden 09:00–18:00 saatleri arasında (Hafta içi) ulaşılabilir.
Kuruluş felsefesi: "Fabrikadan Direkt" — Aracısız, en uygun fabrika fiyatı ile kaliteli arıcılık ekipmanı.`,

  bellowsDetail: `[ÜRÜN DETAYI — PATENTLİ ARICI KÖRÜĞÜ]
• Malzeme: 304 Kalite Paslanmaz Çelik (Inoks) gövde. Paslanma, erime ve yüksek ısıda deformasyon yapmaz.
• Teknolojik Avantaj: "Özel Çift Hava Kanallı Tasarım" — körük bırakılsa dahi hava sirkülasyonu kesilmez, körük kesinlikle kendi kendine sönmez. Bu tasarım Türk patent enstitüsü tarafından tescillidir.
• Modeller:
  - Büyük Boy Körük: Profesyonel arıcılar için uzun süreli yoğun duman. Uzun saplı, kapasiteli.
  - Standart Boy Körük: Hobi arıcıları için ergonomik ve hafif. İlk kez arıcılığa başlayanlar için ideal.
  - Galvaniz Körük: Giriş seviyesi, korozyon dirençli galvaniz kaplama. Bütçe dostu seçenek.
• Yakıt Önerisi: Doğal talaş, kurutulmuş bitki yaprakları, mukavva karton veya kimyasal içermeyen doğal arıcı pelletleri.
• Bakım: Kullanım sonrası içindeki külü tamamen boşaltın. Metal gövdeyi hafif nemli bezle silin.

[ÜRÜN DETAYI — TAM KORUMA ARICI ELBİSESİ]
• 3 katmanlı, nefes alabilir kumaş teknolojisi.
• Arı sokmalarına karşı %100 güvenlik garantisi.
• Tam yüz maskesi ve fermuar sistemi dahil.
• Yıkama talimatı: 30°C'de hassas program, çamaşır makinesinde yıkanabilir.

[ÜRÜN DETAYI — KOVAN BAKIM SETİ]
• 8 parçalı 304 paslanmaz çelik profesyonel alet seti.
• Kovan açma aleti, fırça, kovan kancası, kraliçe kafesi vb. dahil.
• Özel sert taşıma çantası ile birlikte gelir.`,

  businessRules: `[TİCARİ KURALLAR VE LOJİSTİK]
• Kargo Politikası: Hafta içi saat 15:00'e kadar gelen siparişler aynı gün kargoya verilir. Teslimat 1-3 iş günüdür.
• Kargo Firmaları: Yurtiçi Kargo, Aras Kargo, MNG Kargo ile anlaşmalıyız.
• Ücretsiz Kargo: 500 TL ve üzeri siparişlerde ücretsiz kargo uygulanır.
• İade Politikası: 14 gün içinde, ürün kullanılmamış ve orijinal ambalajında ise koşulsuz iade. Kargo ücreti müşteriye aittir.
• Ödeme Yöntemleri: Kredi kartı (taksit imkânı), havale/EFT, kapıda ödeme (seçili bölgeler).
• Banka Havalesi İndirimi: Havale/EFT ile ödemede %5 ek indirim uygulanır.

[B2B BAYİLİK ŞARTLARI]
• Başvuru: Vergi levhası + ticaret sicil belgesi ile B2B Portal'dan online başvuru.
• Onay Süreci: Belgeler incelendikten sonra 1-3 iş günü içinde yanıt verilir.
• Minimum Sipariş: Toptan siparişlerde minimum 10 adet/paket.
• Ödeme Vadesi: Onaylı bayilere 30 gün vade imkânı tanınabilir.
• Özel Fiyatlar: Bayi grubu ve sipariş büyüklüğüne göre özel fiyat formülü uygulanır.

[GARANTİ VE SERVİS]
• Körükler: 2 yıl imalat hatası garantisi.
• Elbiseler: 1 yıl dikişleme ve kumaş kalitesi garantisi.
• Yedek Parça: Körük derisi, yay, kancalar — fabrikadan temin edilir.
• Tamir Servisi: Garantisiz arızalar için ücretli tamir hizmeti sunulmaktadır.`
};

/**
 * Smart context-aware AI assistant reply router based on user roles and queries
 */
export async function queryAiAssistant(message: string, role: string, userEmail?: string): Promise<string> {
  const lowerMsg = message.toLowerCase();

  // Scenario A: Technical Product Queries (Bellows not self-extinguishing)
  if (
    lowerMsg.includes("sönmüyor") || 
    lowerMsg.includes("sönmez") || 
    lowerMsg.includes("sönme") || 
    lowerMsg.includes("hava kanallı") ||
    lowerMsg.includes("körük neden sönmüyor")
  ) {
    return "Atak Arıcılık tescilli çift hava kanallı tasarımımız sayesinde hava sirkülasyonu sürekli devam eder, körük içiniz rahat bir şekilde kovan başında sönmeden çalışır.";
  }

  // Scenario B: B2B/Dealer Queries
  if (
    lowerMsg.includes("toptan") || 
    lowerMsg.includes("iskonto") || 
    lowerMsg.includes("indirim") || 
    lowerMsg.includes("bayi fiyatı") ||
    lowerMsg.includes("bayilik")
  ) {
    if (role === "USER" || role === "GUEST") {
      return "Şu anda perakende hesabıyla giriş yapmış durumdasınız. Toptan alımlara özel iskontolar ve B2B fiyatları için lütfen vergi levhanız ile B2B Portal başvuru formunu doldurun.";
    }

    if (role === "DEALER" || role === "ADMIN") {
      if (!userEmail) {
        return "Onaylı B2B bayimiz olarak giriş yaptınız. Toptan siparişlerinizde size özel tanımlanmış bayi iskontoları ve fiyat formülleriniz sepet adımında otomatik olarak uygulanacaktır.";
      }
      try {
        const account = await prisma.currentAccount.findFirst({
          where: { email: userEmail }
        });
        if (account) {
          const formula = account.priceFormula || "Standart Bayi Fiyat Listesi";
          const discount = account.discountRate || 15;
          return `Onaylı B2B bayimiz olarak giriş yaptınız. Hesabınıza tanımlı fiyat formülü: "${formula}", genel bayi iskonto oranınız: %${discount} olarak aktif durumdadır. Toptan siparişlerinizde sepet adımında bu formül otomatik olarak hesaplanacaktır.`;
        }
      } catch (e) {
        // Fallback
      }
      return "Onaylı B2B bayimiz olarak giriş yaptınız. Toptan siparişlerinizde size özel tanımlanmış bayi iskontoları ve fiyat formülleriniz sepet adımında otomatik olarak uygulanacaktır.";
    }
  }

  // Scenario C: Shipping & Order Tracking Queries
  if (
    lowerMsg.includes("kargo") || 
    lowerMsg.includes("nerede") || 
    lowerMsg.includes("takip") || 
    lowerMsg.includes("sipariş ne zaman") ||
    lowerMsg.includes("ne zaman gelir")
  ) {
    if (userEmail) {
      try {
        const account = await prisma.currentAccount.findFirst({
          where: { email: userEmail }
        });
        if (account) {
          const lastOrder = await prisma.order.findFirst({
            where: { currentAccountId: account.id, isDeleted: false },
            orderBy: { date: "desc" }
          });
          if (lastOrder) {
            let cargoCompany = "";
            let trackingNo = "";
            if (lastOrder.summary && lastOrder.summary.startsWith("[")) {
              const carrierMatch = lastOrder.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);
              if (carrierMatch) {
                cargoCompany = carrierMatch[1].trim();
                if (carrierMatch[2]) {
                  trackingNo = carrierMatch[2].trim();
                }
              }
            }

            const orderYear = new Date(lastOrder.date).getFullYear();
            const orderSuffix = lastOrder.id.slice(-6).toUpperCase();
            const orderNumber = `ORD-${orderYear}-${orderSuffix}`;

            if (trackingNo) {
              return `En son siparişiniz (${orderNumber}) ${cargoCompany} (${trackingNo}) ile gönderilmiştir. Kargonuz yoldadır, 1-3 iş günü içerisinde tarafınıza teslim edilecektir.`;
            } else {
              return `En son siparişiniz (${orderNumber}) hazırlanmaktadır. Hafta içi saat 15:00'e kadar gelen tüm siparişlerinizi aynı gün kargoya teslim ediyoruz.`;
            }
          }
        }
      } catch (err) {
        // Fallback
      }
    }
    return "Siparişleriniz hafta içi saat 15:00'e kadar geldiğinde aynı iş günü kargoya verilir. Teslimat süresi anlaşmalı kargo firmalarımızla 1-3 iş günüdür.";
  }

  // Default smart knowledge-based replies using the corporate KB
  if (
    lowerMsg.includes("kimdir") || 
    lowerMsg.includes("hakkında") || 
    lowerMsg.includes("nedir") || 
    lowerMsg.includes("nerede kuruldu") ||
    lowerMsg.includes("tarih")
  ) {
    return `${ATAC_CORPORATE_KB.brandIdentity} İmalatımız 304 kalite paslanmaz çelik saclar kullanılarak Erzurum OSB fabrikamızda gerçekleştirilmektedir.`;
  }

  if (
    lowerMsg.includes("garanti") || 
    lowerMsg.includes("servis") || 
    lowerMsg.includes("yedek parça") || 
    lowerMsg.includes("deri") ||
    lowerMsg.includes("tamir")
  ) {
    return "Atak Arıcılık olarak ürettiğimiz tüm körükler ve sac ekipmanlar imalat hatalarına karşı 2 yıl garantilidir. Körük derisi, körük körüğü yay değişimi gibi tüm yedek parça ve teknik servis hizmetleri Erzurum fabrikamızca kesintisiz sağlanır.";
  }

  if (
    lowerMsg.includes("boy") || 
    lowerMsg.includes("model") || 
    lowerMsg.includes("ölçü") || 
    lowerMsg.includes("standart") ||
    lowerMsg.includes("büyük")
  ) {
    return "Atak körüklerimizi iki ana modelde üretiyoruz: Profesyonel arıcılarımız için daha uzun duman sirkülasyonu sağlayan 'Büyük Boy Körük' ve hobi arıcılarımız için daha hafif ve pratik kullanım sunan 'Standart Boy Körük'. Her iki modelimiz de 304 sınıf paslanmaz çelikten üretilmiştir.";
  }

  if (
    lowerMsg.includes("yakıt") || 
    lowerMsg.includes("ne yakılır") || 
    lowerMsg.includes("talaş") || 
    lowerMsg.includes("pellet")
  ) {
    return "Körüklerimizde yüksek verim ve sağlıklı arı dumanı elde edebilmek için doğal talaş, kurutulmuş bitki yaprakları, temiz mukavva karton veya kimyasal katkı içermeyen preslenmiş doğal arıcı pelletleri yakılmasını tavsiye ediyoruz.";
  }

  // Strict hallucination block fallback
  return "Bu konuda size yardımcı olabilmek için destek ekibimize bağlanmanızı veya bir bilet (ticket) oluşturmanızı tavsiye ederim. Ben Atak Destek olarak patentli körükler, toptan bayilik şartları, ödeme yöntemleri ve kargo teslimatları hakkında sorularınızı yanıtlayabilirim.";
}
