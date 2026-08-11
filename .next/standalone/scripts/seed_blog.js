const { PrismaClient } = require('../src/generated-client');
const prisma = new PrismaClient();

const defaultBlogPosts = [
  {
    title: "Geleneksel İspir Dut Pekmezi Nasıl Üretilir?",
    slug: "geleneksel-ispir-dut-pekmezi-nasil-uretilir",
    category: "Geleneksel Üretim",
    image: "/ispir-dut-hasadi.png",
    metaDesc: "İspir yaylalarında 2200m rakımda yetişen saf beyaz dutların bakır kazanlarda odun ateşinde ağır ağır pişirilme hikayesi.",
    content: `İspir'in el değmemiş 2200 metre üzerindeki yaylalarında yetişen saf beyaz dutlar, tam olgunlaşma döneminde silkelenerek keten bezlere toplanır.

Toplanan dutlar, hiçbir kimyasal katkı maddesi veya ilave şeker eklenmeksizin preslenir ve doğal şırası elde edilir. Geleneksel bakır kazanlarda, meşe odunu ateşinde saatlerce köpüğü alınarak kaynatılır. 

Bakır kazanların yüksek ve eşit ısı iletimi, pekmezin karamelize olmadan doğal şeker dengesini ve besin değerini korumasını sağlar. Güneşte kıvam alan PEKEFE İspir Dut Pekmezi, cam kavanozlara doldurularak el değmeden mühürlenir.`,
    readTime: "5 dk okuma",
    isActive: true,
  },
  {
    title: "Ham Çiçek Balı ve İşlenmiş Bal Arasındaki 5 Temel Fark",
    slug: "ham-cicek-bali-ve-islenmis-bal-arasindaki-farklar",
    category: "Doğal Beslenme",
    image: "/ispir-kackar-yaylalari-manzara.webp",
    metaDesc: "Pastörize edilmemiş, 45 derece üzerinde ısıtılmamış hakiki ham çiçek balının polen ve canlı enzim zenginliği.",
    content: `Market raflarında gördüğünüz berrak ve akışkan ballar ile doğadan kovan çıkışı elde edilen ham bal arasında hayati besin farkları bulunur.

1. **Pastörizasyon:** Endüstriyel ballar kristalleşmeyi önlemek için yüksek ısıda (65-70°C) ısıtılır. Bu işlem balın içindeki duyarlı enzimleri ve vitaminleri yok eder. PEKEFE ham balı ise asla 45°C üzerine çıkarılmaz.
2. **Polen Filtreleme:** Endüstriyel filtreleme balın kaynağını gösteren çiçek polenlerini süzer. Ham balda polenler doğal haliyle muhafaza edilir.
3. **Kristalleşme (Donma):** Hakiki ham bal soğuk ortamda zamanla kristalleşir. Bu durum balın saflığının en büyük kanıtıdır.
4. **Aroma ve Tat Zenginliği:** 2200m rakımlı Kaçkar yaylalarının binbir çeşit endemik çiçeğinin kokusu sadece ham balda hissedilir.
5. **Antioksidan Değeri:** Isıl işlem görmemiş ham bal yüksek antibakteriyel etkiye sahiptir.`,
    readTime: "4 dk okuma",
    isActive: true,
  },
  {
    title: "Pestil ve Köme Hazırlamanın İncelikleri: İspir Gelenekleri",
    slug: "pestil-ve-kome-hazirlamanin-incelikleri",
    category: "Yöresel Tarifler",
    image: "/ispir-pestil-kurutma-gercek.png",
    metaDesc: "Keten bezlerde güneşte kurutulan doğal dut pestili ve cevizli İspir kömesinin asırlık lezzet sırları.",
    content: `Doğu Anadolu'nun kış aylarındaki en büyük enerji kaynağı olan pestil ve köme, yaz sonu dut hasadıyla başlar.

Süt, nişasta ve süzme dut şırasının bakır kazanlarda herlenmesiyle (pişirilmesiyle) elde edilen kıvamlı tatlı harç, incecik bezlere serilir. Yerli İspir cevizleri ipe dizilerek bu harca birkaç kez batırılır.

Temiz dağ havasında ve doğrudan güneş ışığında kurutulan köme ve pestiller, hiçbir koruyucu madde içermeksizin lezzetini aylarca korur. PEKEFE geleneksel usta elleriyle hazırlanan kömeler, çocuklarınıza ve sevdiklerinize sunabileceğiniz en sağlıklı atıştırmalıktır.`,
    readTime: "6 dk okuma",
    isActive: true,
  },
  {
    title: "Dut Pekmezinin Sağlığa Faydaları ve Günlük Tüketim Önerileri",
    slug: "dut-pekmezinin-sagliga-faydalari",
    category: "Sağlıklı Yaşam",
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    metaDesc: "Demir, kalsiyum ve antioksidan deposu geleneksel dut pekmezinin vücut direncine ve enerji seviyesine etkileri.",
    content: `Geleneksel İspir dut pekmezi, zengin mineral ve vitamin içeriğiyle doğal bir şifa kaynağıdır.

- **Kansızlık ve Demir Eksikliği:** İçerdiği yüksek oranda organik demir sayesinde kan yapımını destekler.
- **Sporcu ve Çocuk Enerjisi:** Doğal glukoz ve fruktoz içeriğiyle gün boyu zindelik sağlar.
- **Mide ve Sindirim Rahatlığı:** Sabahları aç karnına alınan bir tatlı kaşığı dut pekmezi mide asidini dengelemeye yardımcı olur.
- **Kemik Gelişimi:** Kalsiyum ve magnezyum deposudur.

**Kullanım Önerisi:** Her sabah kahvaltıdan önce 1-2 tatlı kaşığı tüketebilir veya ılık suya karıştırarak doğal bir detoks içeceği hazırlayabilirsiniz.`,
    readTime: "3 dk okuma",
    isActive: true,
  },
  {
    title: "İspir Yaylalarının 2200m Rakımlı Flora Zenginliği",
    slug: "ispir-yaylalarinin-2200m-rakimli-flora-zenginligi",
    category: "Doğa & Coğrafya",
    image: "/ispir-yedi-goller-kackar-manzara.webp",
    metaDesc: "Kaçkar dağlarının eteklerindeki endemik çiçek türleri ve PEKEFE lezzetlerinin essiz aromatik kaynağı.",
    content: `Erzurum İspir bölgesi, yüksek rakımı, temiz su kaynakları ve sanayi kirliliğinden uzak bakir doğasıyla Türkiye'nin en değerli arıcılık ve meyvecilik merkezlerinden biridir.

2200 metrenin üzerindeki yaylalarda yetişen binlerce endemik çiçek türü, nektar zenginliği açısından eşsizdir. Kimyasal tarım ilaçlarının ulaşamadığı bu yüksek coğrafya, PEKEFE bal ve pekmezlerinin %100 katkısız ve saf olmasının arkasındaki ana sırdır.`,
    readTime: "5 dk okuma",
    isActive: true,
  }
];

async function seedBlogPosts() {
  console.log("Seeding blog posts into database...");
  for (const post of defaultBlogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }
  console.log("Successfully seeded 5 traditional blog posts.");
}

if (require.main === module) {
  seedBlogPosts()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
}

module.exports = { seedBlogPosts, defaultBlogPosts };
