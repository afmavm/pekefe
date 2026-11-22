export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  shortDesc?: string | null;
  seoDesc?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  attributes?: any[];
  variants?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const RESERVED_CATEGORY_SLUGS = new Set([
  "admin",
  "api",
  "giris",
  "kayit",
  "login",
  "403",
  "akademi",
  "b2b",
  "blog",
  "galeri",
  "gizlilik",
  "hesap",
  "hikayemiz",
  "iletisim",
  "kampanyalar",
  "kategoriler",
  "mensei-dogrulama",
  "rekolte-kulubu",
  "sepet",
  "sozlesme",
  "sss",
  "tadim-odasi",
  "tesisimiz",
  "teslimat",
  "urun",
  "muhasebe",
  "sitemap.xml",
  "robots.txt",
]);

const TR_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function trNormalize(str: string = ""): string {
  if (!str || typeof str !== "string") return "";
  return str
    .split("")
    .map((ch) => TR_CHAR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .trim();
}

export function slugifyTr(input: string = ""): string {
  if (!input || typeof input !== "string") return "";
  return input
    .split("")
    .map((ch) => TR_CHAR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * PEKEFE Resmi Kategori Mimarisi (5 Ana Kategori + 12 Alt Kategori)
 * Her kategorinin özgün kısa tanıtımı, özgün uzun SEO açıklaması, Meta Title/Description
 * ve gerçek görsel yolu tanımlanmıştır.
 */
export const PEKEFE_DEFAULT_CATEGORIES: CategoryRecord[] = [
  // =========================================================================
  // 1. PESTİL ÇEŞİTLERİ
  // =========================================================================
  {
    id: "PKF-KAT-001",
    name: "Pestil Çeşitleri",
    slug: "pestil-cesitleri",
    parentId: null,
    shortDesc:
      "Erzurum İspir'in yüksek rakımlı bahçelerinden toplanan doğal dutlarla, geleneksel serme ve kurutma yöntemleriyle hazırlanan sade, cevizli ve yöresel dut pestili çeşitleri.",
    seoDesc:
      "İspir dut pestili, Anadolu'nun asırlık kış hazırlığı geleneğinin en seçkin lezzetlerinden biridir. PEKEFE Geleneksel Ürünler olarak, İspir'in güneş gören vadilerinde yetişen olgun dutları mevsiminde topluyor; ilave rafine şeker ve koruyucu kullanmadan geleneksel yöntemlerle işleyip ince tabakalar halinde kurutuyoruz.\n\nSade dut pestili doğal dut aromasını saf haliyle sunarken, cevizli dut pestili yerli İspir ceviziyle zenginleştirilmiş doyurucu bir enerji kaynağıdır. Muska ve sarma dut pestili tatlılarımız ise çay saatlerine ve misafir ikramlarına yöresel bir dokunuş katar. Vakumlu ambalaj teknolojimiz sayesinde ürünlerimiz tazeliğini ve yumuşak dokusunu uzun süre koruyarak kapınıza ulaşır.",
    metaTitle: "İspir Dut Pestili Çeşitleri ve Fiyatları | PEKEFE",
    metaDescription:
      "İspir'in geleneksel üretim kültürüyle hazırlanan sade ve cevizli dut pestili çeşitlerini keşfedin. PEKEFE kalitesiyle geleneksel lezzetler sofranızda.",
    image: "/ispir-pestil-kurutma-gercek.png",
    sortOrder: 1,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-101",
    name: "Sade Dut Pestili",
    slug: "sade-dut-pestili",
    parentId: "PKF-KAT-001",
    shortDesc:
      "Katkısız, saf İspir dutundan ince tabakalar halinde kurutularak hazırlanan geleneksel sade dut pestili.",
    seoDesc:
      "Sade dut pestili, dutun kendi doğal tatlılığını ve aromasını en yalın haliyle deneyimlemek isteyenler için İspir'de geleneksel usullerle hazırlanır. İnce ve esnek dokusuyla hem sade olarak tüketilebilir hem de ceviz veya fındıkla sararak doğal bir ara öğün oluşturabilirsiniz.",
    metaTitle: "Sade Dut Pestili | Doğal İspir Dut Pestili | PEKEFE",
    metaDescription:
      "Katkısız İspir dutlarından geleneksel yöntemlerle hazırlanan doğal sade dut pestili çeşitlerini inceleyin ve güvenle sipariş verin.",
    image: "/ispir-vakum-sade-pestil.jpg",
    sortOrder: 1,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-102",
    name: "Cevizli Dut Pestili",
    slug: "cevizli-dut-pestili",
    parentId: "PKF-KAT-001",
    shortDesc:
      "Doğal İspir dut pestilinin yerli ceviz içi ile buluştuğu, besleyici ve doyurucu geleneksel lezzet.",
    seoDesc:
      "Cevizli dut pestili, İspir'in aromatik dut şırası ve özenle seçilmiş yerli cevizlerin ustalıkla bir araya getirilmesiyle üretilir. Yüksek doğal enerji değeri sayesinde çocukların beslenme çantalarından spor sonrası atıştırmalıklara kadar günün her saatinde güvenle tercih edilir.",
    metaTitle: "Cevizli Dut Pestili | İspir Cevizli Pestil | PEKEFE",
    metaDescription:
      "Bol cevizli ve katkısız İspir dut pestili çeşitlerini keşfedin. Taze hasat ve vakumlu ambalajla PEKEFE güvencesiyle kapınızda.",
    image: "/ispir-vakum-cevizli-pestil.jpg",
    sortOrder: 2,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-103",
    name: "Geleneksel Dut Pestili",
    slug: "geleneksel-dut-pestili",
    parentId: "PKF-KAT-001",
    shortDesc:
      "Muska ve sarma formunda el emeğiyle hazırlanan, özel ikramlara yakışan geleneksel İspir dut pestili tatlıları.",
    seoDesc:
      "Geleneksel dut pestili çeşitlerimiz; ceviz ve fındık dolgulu muska tatlısı ile sarma pestil tatlısını içerir. Her bir parça ustalarımızın elinden geçerek hazırlanır; şerbetli ağır tatlılara doğal, hafif ve yöresel bir alternatif sunar.",
    metaTitle: "Geleneksel Dut Pestili, Muska ve Sarma Tatlısı | PEKEFE",
    metaDescription:
      "El yapımı muska ve sarma dut pestili tatlılarını keşfedin. İspir'in geleneksel lezzetleri PEKEFE kalitesiyle sofranızda.",
    image: "/sarma-pestil-tatlisi.jpg",
    sortOrder: 3,
    isActive: true,
    attributes: [],
    variants: [],
  },

  // =========================================================================
  // 2. PEKMEZ ÇEŞİTLERİ
  // =========================================================================
  {
    id: "PKF-KAT-002",
    name: "Pekmez Çeşitleri",
    slug: "pekmez-cesitleri",
    parentId: null,
    shortDesc:
      "İspir'in seçkin dut ve karadutlarından şeker ilavesiz, vakumlu düşük ısı ve geleneksel yöntemlerle hazırlanan doğal pekmez çeşitleri.",
    seoDesc:
      "PEKEFE pekmez çeşitleri, Erzurum İspir'in berrak dağ havasında olgunlaşan dut ve karadutlarından mevsiminde üretilir. Üretim sürecinde hiçbir koruyucu, glikoz şurubu veya ilave şeker kullanılmaz.\n\nDut pekmezi kahvaltı sofralarının vazgeçilmez doğal enerji kaynağı iken, karadut pekmezi yoğun rengi ve karakteristik mayhoş aromasıyla öne çıkar. Güneşin doğal sıcaklığıyla kıvam alan dut gün pekmezi ise geleneksel Anadolu mutfağının nadir lezzetlerindendir. Cam kavanozlarda hijyenik koşullarda paketlenen pekmezlerimiz, besin değerini koruyarak mutfağınıza gelir.",
    metaTitle: "Doğal Dut ve Karadut Pekmezi Çeşitleri | PEKEFE",
    metaDescription:
      "İspir'in seçkin dutlarından geleneksel yöntemlerle hazırlanan dut, karadut ve dut gün pekmezi çeşitlerini keşfedin.",
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    sortOrder: 2,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-201",
    name: "Dut Pekmezi",
    slug: "dut-pekmezi",
    parentId: "PKF-KAT-002",
    shortDesc:
      "İspir'in beyaz dutlarından şeker ilavesiz ve katkısız olarak hazırlanan, yoğun kıvamlı doğal dut pekmezi.",
    seoDesc:
      "İspir dut pekmezi, sadece olgun beyaz dutların özsuyundan elde edilir. Tahinle birlikte kahvaltılarda, yoğurtla ara öğünlerde veya tatlı tariflerinde doğal tatlandırıcı olarak güvenle kullanılabilir.",
    metaTitle: "Doğal İspir Dut Pekmezi | Şeker İlavesiz | PEKEFE",
    metaDescription:
      "Erzurum İspir'in doğal beyaz dutlarından katkısız hazırlanan hakiki dut pekmezi çeşitlerini PEKEFE güvencesiyle sipariş verin.",
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    sortOrder: 1,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-202",
    name: "Karadut Pekmezi",
    slug: "karadut-pekmezi",
    parentId: "PKF-KAT-002",
    shortDesc:
      "Seçkin karadutların özünden elde edilen, yoğun aromalı, katkısız ve doğal karadut pekmezi.",
    seoDesc:
      "Karadut pekmezi, zengin antioksidan içeriği ve dengeli tatlı-mayhoş lezzetiyle bilinir. PEKEFE karadut pekmezi, meyvenin doğal rengini ve aromasını koruyacak kontrollü sıcaklıkta hazırlanır.",
    metaTitle: "Doğal Karadut Pekmezi | Katkısız İspir Karadutu | PEKEFE",
    metaDescription:
      "Yoğun aromalı, şeker ilavesiz doğal karadut pekmezi çeşitlerini inceleyin. PEKEFE kalitesiyle cam kavanozda kapınızda.",
    image: "/geleneksel-pekmez.jpg",
    sortOrder: 2,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-203",
    name: "Dut Gün Pekmezi",
    slug: "dut-gun-pekmezi",
    parentId: "PKF-KAT-002",
    shortDesc:
      "Güneş ışığında doğal olarak kıvamlandırılan, sınırlı üretim geleneksel İspir dut gün pekmezi.",
    seoDesc:
      "Dut gün pekmezi, yüksek ısı görmeden güneşin doğal sıcaklığında yavaşça yoğunlaştırılan geleneksel bir İspir lezzetidir. Açık kehribar rengi ve hafif, ferah içimiyle özel bir yere sahiptir.",
    metaTitle: "Doğal Dut Gün Pekmezi | Güneşte Kıvamlanan | PEKEFE",
    metaDescription:
      "Güneşin doğal ısısıyla geleneksel yöntemlerle hazırlanan sınırlı hasat İspir dut gün pekmezini keşfedin.",
    image: "/premium-pekefe-kavanoz-tr.png",
    sortOrder: 3,
    isActive: true,
    attributes: [],
    variants: [],
  },

  // =========================================================================
  // 3. KÖME ÇEŞİTLERİ
  // =========================================================================
  {
    id: "PKF-KAT-003",
    name: "Köme Çeşitleri",
    slug: "kome-cesitleri",
    parentId: null,
    shortDesc:
      "İpe dizilmiş bütün yerli cevizlerin dut şırasına defalarca batırılıp kurutulmasıyla hazırlanan geleneksel İspir köme çeşitleri.",
    seoDesc:
      "Köme (cevizli sucuk), Erzurum İspir yöresinin en sevilen geleneksel tatlılarından biridir. PEKEFE köme çeşitleri, özenle seçilmiş bütün yerli cevizlerin pamuk iplere dizilerek doğal dut şırasına batırılması ve serin yayla havasında kurutulmasıyla üretilir.\n\nÇift batırım cevizli dut kömesi dolgun şıra tabakasıyla yumuşak bir lezzet sunarken, tek çekim cevizli dut kömesi bol ceviz oranını sevenler için ince şıra kaplamasıyla hazırlanır. İlave şeker ve nişasta dolgusu olmadan, sadece doğal malzemelerle üretilen İspir kömelerini güvenle sofranıza taşıyabilirsiniz.",
    metaTitle: "Geleneksel İspir Köme Çeşitleri | PEKEFE",
    metaDescription:
      "Anadolu'nun geleneksel lezzetlerinden İspir köme çeşitlerini PEKEFE kalitesiyle keşfedin.",
    image: "/ispir-kome-gercek-hasat.jpg",
    sortOrder: 3,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-301",
    name: "Cevizli Köme",
    slug: "cevizli-kome",
    parentId: "PKF-KAT-003",
    shortDesc:
      "Bütün yerli cevizlerin doğal dut şırasıyla kaplanmasıyla hazırlanan, yumuşak ve bol cevizli İspir kömesi.",
    seoDesc:
      "Cevizli köme çeşitlerimizde taze mahsul yerli cevizler ve katkısız İspir dut şırası kullanılır. Hem tek çekim hem geleneksel dolgun şıralı seçenekleriyle kahve ve çay yanı ikramlar için idealdir.",
    metaTitle: "Cevizli Köme | Doğal İspir Cevizli Dut Kömesi | PEKEFE",
    metaDescription:
      "Bol cevizli ve dut şıralı geleneksel İspir cevizli köme çeşitlerini keşfedin. Taze üretim ve hızlı kargo ile PEKEFE'de.",
    image: "/ispir-kome-sira-dizim.jpg",
    sortOrder: 1,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-302",
    name: "Geleneksel Köme",
    slug: "geleneksel-kome",
    parentId: "PKF-KAT-003",
    shortDesc:
      "Asırlık İspir tarifine sadık kalınarak mevsiminde el emeğiyle hazırlanan geleneksel köme çeşitleri.",
    seoDesc:
      "Geleneksel İspir kömesi, yörenin köklü üretim bilgisini günümüze taşır. Katkısız içeriği ve doğal dut aromasıyla dört mevsim tazeliğini koruyan yöresel bir lezzet sunar.",
    metaTitle: "Geleneksel Köme | Yöresel İspir Dut Kömesi | PEKEFE",
    metaDescription:
      "Geleneksel yöntemlerle hazırlanan katkısız İspir dut kömesi çeşitlerini PEKEFE güvencesiyle inceleyin.",
    image: "/ispir-kome-gercek-hasat.jpg",
    sortOrder: 2,
    isActive: true,
    attributes: [],
    variants: [],
  },

  // =========================================================================
  // 4. DOĞAL YÖRESEL ÜRÜNLER
  // =========================================================================
  {
    id: "PKF-KAT-004",
    name: "Doğal Yöresel Ürünler",
    slug: "yoresel-urunler",
    parentId: null,
    shortDesc:
      "Erzurum İspir'in temiz doğasından özenle seçilmiş kuru dut ve mevsimlik geleneksel yöresel lezzetler.",
    seoDesc:
      "Erzurum İspir, yüksek rakımı ve zengin bitki örtüsüyle Anadolu'nun en kıymetli doğal ürün havzalarından biridir. PEKEFE Doğal Yöresel Ürünler kategorisinde, bölgenin mevsiminde hasat edilen kuru dutları ve geleneksel sofraların seçkin yöresel ürünlerini bir araya getiriyoruz.\n\nHer ürünümüz menşei belli, temiz içerikli ve geleneksel üretim disiplininden ödün vermeden hazırlanır. Mevsimlik hasat takvimine göre yeni yöresel lezzetlerimiz bu koleksiyonda yerini alır.",
    metaTitle: "İspir Yöresel Ürünleri | Geleneksel Doğal Lezzetler",
    metaDescription:
      "Erzurum İspir'in doğal zenginliklerini ve geleneksel yöresel ürünlerini PEKEFE güvencesiyle keşfedin.",
    image: "/ispir-dut-hasadi.png",
    sortOrder: 4,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-401",
    name: "Kuru Dut",
    slug: "kuru-dut",
    parentId: "PKF-KAT-004",
    shortDesc:
      "İspir güneşinde doğal olarak kurutulmuş, katkısız ve doğal tatlılığa sahip yöresel kuru dut.",
    seoDesc:
      "İspir kuru dutu, yüksek rakımda yetişen beyaz dutların mevsiminde toplanıp doğal ortamda kurutulmasıyla elde edilir. Çay yanında atıştırmalık olarak veya kahvaltılık kaselerde doğal enerji kaynağı olarak tüketilir.",
    metaTitle: "Doğal İspir Kuru Dut | Güneşte Kurutulmuş | PEKEFE",
    metaDescription:
      "Erzurum İspir'in doğal ortamda kurutulmuş, katkısız ve taze mahsul kuru dut çeşitlerini PEKEFE güvencesiyle keşfedin.",
    image: "/ispir-meyve-kurutma.jpg",
    sortOrder: 1,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-402",
    name: "Diğer İspir Lezzetleri",
    slug: "diger-ispir-lezzetleri",
    parentId: "PKF-KAT-004",
    shortDesc:
      "İspir ve Erzurum yöresinin mevsimlik hasat edilen seçkin doğal gıda ürünleri.",
    seoDesc:
      "Diğer İspir Lezzetleri koleksiyonumuzda, bölgenin hasat dönemlerine göre seçilen sınırlı üretim doğal ve geleneksel Anadolu ürünlerine yer veriyoruz.",
    metaTitle: "Diğer İspir Lezzetleri | Yöresel Doğal Ürünler | PEKEFE",
    metaDescription:
      "Erzurum İspir'in mevsimlik doğal ve yöresel lezzetlerini PEKEFE kalitesiyle keşfedin.",
    image: "/ispir-dut-hasadi.png",
    sortOrder: 2,
    isActive: true,
    attributes: [],
    variants: [],
  },

  // =========================================================================
  // 5. HEDİYELİK LEZZETLER
  // =========================================================================
  {
    id: "PKF-KAT-005",
    name: "Hediyelik Lezzetler",
    slug: "hediyelik-lezzetler",
    parentId: null,
    shortDesc:
      "Sevdiklerinize ve kurumsal iş ortaklarınıza İspir'in en seçkin doğal lezzetlerini sunabileceğiniz özenli hediye setleri ve yöresel lezzet kutuları.",
    seoDesc:
      "PEKEFE Hediyelik Lezzetler koleksiyonu, Anadolu'nun köklü ikram kültürünü zarif ve özenli sunumlarla buluşturur. Bayramlarda, özel günlerde, aile ziyaretlerinde veya kurumsal hediyeleşmelerde İspir'in doğal pestil, pekmez ve köme çeşitlerinden oluşan seçkin kutularla anlamlı bir armağan sunabilirsiniz.\n\nTüm hediye kutularımız, ürünlerin tazeliğini ve sunum bütünlüğünü koruyan özenli ambalajlarla hazırlanır ve Türkiye'nin dört bir yanına güvenle ulaştırılır.",
    metaTitle: "Yöresel Lezzet ve Hediye Setleri | PEKEFE",
    metaDescription:
      "İspir'in geleneksel lezzetlerini sevdiklerinize özel hediye setleri ve yöresel lezzet kutularıyla ulaştırın.",
    image: "/ispir-pestil-kome-kompozisyon.png",
    sortOrder: 5,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-501",
    name: "PEKEFE Hediye Setleri",
    slug: "pekefe-hediye-setleri",
    parentId: "PKF-KAT-005",
    shortDesc:
      "Pestil, köme ve doğal pekmez çeşitlerinin özenle bir araya getirildiği özel PEKEFE hediye setleri.",
    seoDesc:
      "PEKEFE Hediye Setleri, İspir'in en sevilen geleneksel ürünlerini tek bir zarif pakette sunar. Sevdiklerinize doğal ve sağlıklı bir lezzet deneyimi armağan etmek için özenle hazırlanır.",
    metaTitle: "PEKEFE Hediye Setleri | Doğal Yöresel Hediye Paketleri",
    metaDescription:
      "İspir dut pestili, köme ve doğal pekmezlerden oluşan şık PEKEFE hediye setlerini keşfedin.",
    image: "/ispir-paketleme-boutique.png",
    sortOrder: 1,
    isActive: true,
    attributes: [],
    variants: [],
  },
  {
    id: "PKF-KAT-502",
    name: "Yöresel Lezzet Kutuları",
    slug: "yoresel-lezzet-kutulari",
    parentId: "PKF-KAT-005",
    shortDesc:
      "Özel günler ve kurumsal ikramlar için hazırlanan seçkin Erzurum İspir yöresel lezzet kutuları.",
    seoDesc:
      "Yöresel Lezzet Kutuları, geleneksel tatları keşfetmek veya kurumsal iş ortaklarınıza yöresel bir armağan sunmak için özel olarak derlenir.",
    metaTitle: "Yöresel Lezzet Kutuları | İspir Tadım ve İkram Kutuları | PEKEFE",
    metaDescription:
      "Özel günler ve kurumsal hediyeler için hazırlanan yöresel İspir lezzet kutularını inceleyin.",
    image: "/ispir-pestil-kome-kompozisyon.png",
    sortOrder: 2,
    isActive: true,
    attributes: [],
    variants: [],
  },
];

/**
 * Bir kategoriyi normalize eder: eksik slug / sortOrder / isActive alanlarını güvenle doldurur.
 */
export function normalizeCategoryRecord(raw: any, index = 0): CategoryRecord {
  const name = String(raw?.name || "Kategori").trim();
  const slug = raw?.slug ? slugifyTr(String(raw.slug)) : slugifyTr(name);
  return {
    id: String(raw?.id || `PKF-KAT-${String(index + 1).padStart(3, "0")}`),
    name,
    slug: slug || `kategori-${index + 1}`,
    parentId: raw?.parentId ? String(raw.parentId) : null,
    shortDesc: raw?.shortDesc ?? null,
    seoDesc: raw?.seoDesc ?? null,
    metaTitle: raw?.metaTitle ?? null,
    metaDescription: raw?.metaDescription ?? null,
    image: raw?.image ?? null,
    sortOrder: typeof raw?.sortOrder === "number" ? raw.sortOrder : index + 1,
    isActive: raw?.isActive !== false,
    attributes: Array.isArray(raw?.attributes) ? raw.attributes : [],
    variants: Array.isArray(raw?.variants) ? raw.variants : [],
    createdAt: raw?.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw?.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

/**
 * Mevcut bir ürünün belirli bir kategori veya alt kategoriye ait olup olmadığını kontrol eder.
 * Desteklenen eşleştirme kaynakları:
 * 1. Product.attributes.categoryIds (çoklu kategori ataması — ID veya slug)
 * 2. Product.category / Product.subCategory (birebir veya normalize isim / slug)
 * 3. Legacy kategori adları (örn. "Geleneksel Pekmezler", "Pestil - Köme") için akıllı ürün adı eşleştirmesi
 */
export function productMatchesCategory(
  product: any,
  targetCategory: CategoryRecord,
  allCategories: CategoryRecord[]
): boolean {
  if (!product || !targetCategory) return false;

  const targetId = String(targetCategory.id).trim().toLowerCase();
  const targetNameNorm = trNormalize(targetCategory.name);
  const targetSlug = targetCategory.slug;

  // Eğer hedef bir ana kategori ise, alt kategorilerini de kapsar
  const childCategories = allCategories.filter(
    (c) => c.parentId && String(c.parentId).trim().toLowerCase() === targetId
  );

  // 1. Çoklu kategori bağlantısı (attributes.categoryIds)
  let attrs: any = product.attributes;
  if (typeof attrs === "string") {
    try {
      attrs = JSON.parse(attrs);
    } catch {
      attrs = {};
    }
  }
  const linkedIds: string[] = Array.isArray(attrs?.categoryIds)
    ? attrs.categoryIds.map((x: any) => String(x).trim().toLowerCase())
    : [];

  if (linkedIds.length > 0) {
    if (linkedIds.includes(targetId) || linkedIds.includes(targetSlug)) {
      return true;
    }
    for (const child of childCategories) {
      if (
        linkedIds.includes(String(child.id).trim().toLowerCase()) ||
        linkedIds.includes(child.slug)
      ) {
        return true;
      }
    }
  }

  // 2. Doğrudan category / subCategory alanları
  const prodCatNorm = trNormalize(product.category || "");
  const prodSubNorm = trNormalize(product.subCategory || "");
  const prodCatSlug = slugifyTr(product.category || "");
  const prodSubSlug = slugifyTr(product.subCategory || "");

  if (
    prodCatNorm === targetNameNorm ||
    prodSubNorm === targetNameNorm ||
    prodCatSlug === targetSlug ||
    prodSubSlug === targetSlug
  ) {
    return true;
  }

  for (const child of childCategories) {
    const childNorm = trNormalize(child.name);
    if (
      prodSubNorm === childNorm ||
      prodCatNorm === childNorm ||
      prodSubSlug === child.slug ||
      prodCatSlug === child.slug
    ) {
      return true;
    }
  }

  // 3. Eski (legacy) kategori isimleri henüz DB'de güncellenmediyse güvenli ürün adı eşleştirmesi
  const prodNameNorm = trNormalize(product.name || "");
  if (targetSlug === "pekmez-cesitleri") {
    return prodNameNorm.includes("pekmez");
  }
  if (targetSlug === "dut-pekmezi") {
    return (
      prodNameNorm.includes("dut pekmez") &&
      !prodNameNorm.includes("karadut") &&
      !prodNameNorm.includes("gun pekmez")
    );
  }
  if (targetSlug === "karadut-pekmezi") {
    return prodNameNorm.includes("karadut") && prodNameNorm.includes("pekmez");
  }
  if (targetSlug === "dut-gun-pekmezi") {
    return prodNameNorm.includes("gun pekmez");
  }
  if (targetSlug === "pestil-cesitleri") {
    return (
      prodNameNorm.includes("pestil") ||
      prodNameNorm.includes("muska") ||
      prodNameNorm.includes("sarma")
    );
  }
  if (targetSlug === "sade-dut-pestili") {
    return prodNameNorm.includes("sade") && prodNameNorm.includes("pestil");
  }
  if (targetSlug === "cevizli-dut-pestili") {
    return (
      prodNameNorm.includes("cevizli") &&
      prodNameNorm.includes("pestil") &&
      !prodNameNorm.includes("muska") &&
      !prodNameNorm.includes("sarma")
    );
  }
  if (targetSlug === "geleneksel-dut-pestili") {
    return (
      prodNameNorm.includes("muska") ||
      prodNameNorm.includes("sarma") ||
      (prodNameNorm.includes("geleneksel") &&
        prodNameNorm.includes("pestil") &&
        !prodNameNorm.includes("sade") &&
        !prodNameNorm.includes("cevizli"))
    );
  }
  if (targetSlug === "kome-cesitleri") {
    return prodNameNorm.includes("kome");
  }
  if (targetSlug === "cevizli-kome") {
    return prodNameNorm.includes("kome") && prodNameNorm.includes("ceviz");
  }
  if (targetSlug === "geleneksel-kome") {
    return prodNameNorm.includes("kome") && !prodNameNorm.includes("ceviz");
  }
  if (targetSlug === "kuru-dut") {
    return prodNameNorm.includes("kuru dut");
  }
  if (targetSlug === "yoresel-urunler") {
    return prodNameNorm.includes("kuru dut");
  }
  if (targetSlug === "hediyelik-lezzetler") {
    return prodNameNorm.includes("hediye") || prodNameNorm.includes("lezzet kutu");
  }

  return false;
}

/**
 * Bir ürünün hangi ana kategori ve alt kategoriye ait olduğunu belirler (breadcrumb & ürün sayfası için).
 */
export function resolveProductCategories(
  product: any,
  allCategories: CategoryRecord[]
): { main: CategoryRecord | null; sub: CategoryRecord | null } {
  const active = allCategories.filter((c) => c.isActive !== false);
  const mains = active.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const subs = active.filter((c) => !!c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  // Önce alt kategori eşleşmesi ara
  for (const sub of subs) {
    if (productMatchesCategory(product, sub, active)) {
      const main = mains.find((m) => m.id === sub.parentId) || null;
      return { main, sub };
    }
  }
  // Bulunamazsa ana kategori eşleşmesi ara
  for (const main of mains) {
    if (productMatchesCategory(product, main, active)) {
      return { main, sub: null };
    }
  }
  return { main: null, sub: null };
}
