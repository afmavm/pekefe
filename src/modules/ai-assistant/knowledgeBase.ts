import { prisma } from "@/lib/prisma";

export interface CorporateKnowledge {
  brandIdentity: string;
  productDetail: string;
  businessRules: string;
}

export const PEKEFE_CORPORATE_KB: CorporateKnowledge = {
  brandIdentity: `PEKEFE Geleneksel & Doğal Lezzetler, Erzurum İspir'in 2000m+ rakımlı yüksek yaylalarındaki beyaz dut ağaçlarından ve zengin yayla florasından beslenen, katkısız ve geleneksel lezzetler sunan coğrafi işaretli Türk gıda markasıdır.
İletişim: WhatsApp ve canlı destek hattımız üzerinden hafta içi 09:00–18:00 saatleri arasında kesintisiz hizmet verilmektedir.
Kuruluş Felsefesi: "Yayla Hasadından Sofranıza" — Asırlık tarifler, meşe odunu ateşi, bakır kazanlar ve keten bezlerde doğal güneş kurutması ile %100 saf lezzetler.`,

  productDetail: `[ÜRÜN DETAYI — İSPİR HAM DUT PEKMEZİ]
• İçerik: %100 Saf İspir Beyaz Dut Şırası. 0% İlave Şeker, 0.0% Glikoz / Glikoz Şurubu, 0% Koruyucu ve Katkı Maddesi.
• Üretim Yöntemi: İspir yaylalarında toplanan beyaz dutlar bakır kazanlarda kısık meşe odun ateşinde kaynatılır.
• Kalite Standardı: HMF (Hidroksimetilfurfural) seviyesi < 10 mg/kg (Bağımsız laboratuvar analiz raporlu ve Coğrafi İşaret Tescilli).

[ÜRÜN DETAYI — İSPİR HAM ÇİÇEK BALI]
• İçerik: 2200m+ Kaçkar yayla çiçeklerinin nektarından elde edilmiş %100 saf süzme ham bal.
• Özellik: Isıl işlem görmemiş, filtrelenmemiş besleyici doğal arı balı.

[ÜRÜN DETAYI — İSPİR CEVİZLİ KÖME & PESTİL]
• Malzeme: Yerli İspir cevizi (%35-50 oranında), dut şırası, süzme bal ve tam buğday unu.
• Kurutma: Keten bezler üzerinde İspir güneşinde doğal yöntemlerle kurutulur. Koruyucu içermez.

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
 * Smart context-aware AI assistant reply router for PEKEFE Gastronomi
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
