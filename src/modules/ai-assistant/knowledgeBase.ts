import { prisma } from "@/lib/prisma";

export interface CorporateKnowledge {
  brandIdentity: string;
  productDetail: string;
  businessRules: string;
}

export const PEKEFE_CORPORATE_KB: CorporateKnowledge = {
  brandIdentity: `PEKEFE Geleneksel & Doğal Lezzetler, Erzurum İspir'in 2000m+ rakımlı yüksek vadilerindeki asırlık beyaz dut ağaçlarından ve zengin yayla florasından beslenen, emekli öğretmen İlhan Efe tarafından TKDK desteğiyle kurulan Avrupa Birliği ve Bakanlık onaylı modern tesisinde üretim yapan Türk gıda markasıdır.
İletişim: WhatsApp ve canlı destek hattımız üzerinden hafta içi 09:00–18:00 saatleri arasında kesintisiz hizmet verilmektedir.
Kuruluş Felsefesi: "Dut şırasını ateşte yakmadan, güneş ışığında ve doğal sıcaklıkta sabırla yoğunlaştırarak" geleneksel Dut Gün Pekmezi üretimi ve sıfır atık döngüsü ile posaların hayvan yemine dönüştürülmesi.`,

  productDetail: `[ÜRÜN DETAYI — GELENEKSEL İSPİR DUT GÜN PEKMEZİ]
• İçerik: %100 Saf İspir Beyaz Dut Şırası. 0% İlave Şeker, 0.0% Glikoz / Glikoz Şurubu, 0% Koruyucu ve Katkı Maddesi.
• Üretim Yöntemi: Dört kişilik hasavan (dokuma bez) ile toprağa değmeden toplanan beyaz dutların şırası, ateşte yakılmadan İspir güneşinin doğal sıcaklığında sabırla dinlendirilerek yoğunlaştırılır (Gün Pekmezi).
• Besin Değeri: 2 yemek kaşığı (20g) pekmezde 2mg organik demir ve 80mg kalsiyum bulunur. Kansızlık, anemi, mide/ülser ve çocuk gelişimine şifadır.
• Kalite Standardı: HMF (5-Hidroksimetilfurfural) seviyesi < 10 mg/kg (Güneşle yoğunlaştığı için yanık şeker HMF'si oluşmaz).

[ÜRÜN DETAYI — DOĞAL FERMANTASYON İSPİR DUT SİRKESİ]
• İçerik: İspir beyaz dutları ve doğal sirke anası ile meşe fıçılarda aylarca fermente edilen canlı, filtresiz probiyotik sirke.
• Özellik: Canlı enzimler, yumuşak meyvemsi içim.

[ÜRÜN DETAYI — İSPİR HAM ÇİÇEK BALI]
• İçerik: 2200m+ Kaçkar yayla çiçeklerinin nektarından elde edilmiş %100 saf süzme ham bal. Isıl işlem görmemiş, pastörize edilmemiş.

[ÜRÜN DETAYI — İSPİR CEVİZLİ KÖME & YAPRAK PESTİL]
• Malzeme: Yerli İspir cevizi (%40), saf dut şırası herlesi, süt ve doğal buğday nişastası.
• Kurutma: Keten bezler üzerinde İspir'in nemsiz dağ güneşi altında doğal yöntemlerle kurutulur.

[TÜKETİM VE SAKLAMA TAVSİYESİ]
• Muhafaza: Oda sıcaklığında (18°C – 22°C), serin ve doğrudan güneş ışığı almayan yerde saklayınız.
• Kaşık Önerisi: Bal ve pekmezlerin lezzetini ve besin değerini korumak için ahşap veya seramik kaşık ile tüketilmesi önerilir.`,

  businessRules: `[TİCARİ KURALLAR VE LOJİSTİK]
• Kargo Politikası: Hafta içi saat 15:00'e kadar verilen siparişler aynı gün kargoya teslim edilir. Teslimat süresi 1-3 iş günüdür.
• Anlaşmalı Kargolar: Yurtiçi Kargo, MNG Kargo, Aras Kargo.
• Ücretsiz Kargo: 500 TL ve üzeri siparişlerde kargo ücretsizdir.
• İade Politikası: 14 gün içinde, ambalajı açılmamış ve koruma bandı bozulmamış ürünlerde koşulsuz iade hakkı.
• Ödeme Yöntemleri: Kredi kartı (taksit seçeneği), Havale/EFT ve kapıda ödeme.

[B2B VE TOPTAN BAYİLİK]
• Başvuru: Şarküteri, yöresel gıda mağazası ve kurumsal hediyelik alımları için B2B Portal başvuru formu.
• İskonto: Onaylı bayilere özel kademeli indirim oranları ve özel toptan fiyat listesi.`
};

/**
 * Smart context-aware AI assistant reply router for PEKEFE İspir Yöresel Ürünler
 */
export async function queryAiAssistant(message: string, role: string, userEmail?: string): Promise<string> {
  const lowerMsg = message.toLowerCase();

  // 1. Pekmez & Şeker Katkısı Soruları
  if (
    lowerMsg.includes("şeker") ||
    lowerMsg.includes("katkı") ||
    lowerMsg.includes("glikoz") ||
    lowerMsg.includes("doğal mı") ||
    lowerMsg.includes("saf mı")
  ) {
    return "PEKEFE İspir Dut Pekmezimiz %100 saf ve doğal dut şırasından üretilmektedir. Ürünlerimizde 0.0% ilave şeker, glikoz şurubu veya hiçbir koruyucu katkı maddesi bulunmaz. HMF seviyesi < 10 mg/kg olup bağımsız laboratuvar analiz raporludur.";
  }

  // 2. Saklama Koşulları Soruları
  if (
    lowerMsg.includes("sakla") ||
    lowerMsg.includes("bozulur mu") ||
    lowerMsg.includes("dolap") ||
    lowerMsg.includes("buzdolabı")
  ) {
    return "Ürünlerimizi oda sıcaklığında (18°C - 22°C), serin ve direkt güneş ışığı görmeyen bir yerde saklamanız yeterlidir. Buzdolabına koymanıza gerek yoktur. Tüketirken ahşap veya seramik kaşık tercih edilmesi önerilir.";
  }

  // 3. Kargo & Teslimat Soruları
  if (
    lowerMsg.includes("kargo") ||
    lowerMsg.includes("nerede") ||
    lowerMsg.includes("takip") ||
    lowerMsg.includes("ne zaman gelir") ||
    lowerMsg.includes("teslimat")
  ) {
    if (userEmail) {
      try {
        const account = await prisma.currentAccount.findFirst({ where: { email: userEmail } });
        if (account) {
          const lastOrder = await prisma.order.findFirst({
            where: { currentAccountId: account.id, isDeleted: false },
            orderBy: { date: "desc" }
          });
          if (lastOrder) {
            const orderNo = `ORD-${new Date(lastOrder.date).getFullYear()}-${lastOrder.id.slice(-6).toUpperCase()}`;
            return `Son siparişiniz (${orderNo}) hazırlanmakta/kargodadır. Hafta içi 15:00 öncesi verdiğiniz siparişler aynı gün kargoya teslim edilmektedir.`;
          }
        }
      } catch {}
    }
    return "Hafta içi saat 15:00'e kadar verilen tüm siparişleriniz aynı gün kargoya verilir. Anlaşmalı kargolarımızla 1-3 iş günü içerisinde adresinize teslim edilmektedir. 500 TL üzeri kargo ücretsizdir.";
  }

  // 4. Bayilik / Toptan Alım Soruları
  if (
    lowerMsg.includes("toptan") ||
    lowerMsg.includes("bayi") ||
    lowerMsg.includes("iskonto") ||
    lowerMsg.includes("bayilik")
  ) {
    return "PEKEFE yöresel gıda ürünlerimiz için şarküteri, gurme market ve kurumsal hediyelik toptan alımlarda özel B2B bayi iskontoları sunmaktayız. B2B portalımız üzerinden başvuru yapabilir veya müşteri hizmetlerimizle iletişime geçebilirsiniz.";
  }

  // Default fallback answer
  return `${PEKEFE_CORPORATE_KB.brandIdentity} İspir ham dut pekmezi, ham bal, cevizli köme ve pestil çeşitlerimiz hakkında detaylı bilgi almak veya sipariş vermek için ürünlerimizi inceleyebilirsiniz.`;
}
