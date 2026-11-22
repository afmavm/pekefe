/**
 * PEKEFE Isolated Live DB Category Architecture & Product Mapping Script
 * Güvenlik: Sadece PEKEFE veritabanında (DATABASE_URL içinde "pekefe") çalışır.
 * 1. CategoryDetail tablosuna eksik SEO/hiyerarşi sütunlarını güvenle (veri kaybı olmadan) ekler.
 * 2. 5 Ana Kategori + 12 Alt Kategoriyi upsert eder.
 * 3. Mevcut aktif ürünleri (fiyat, stok, açıklama, görsel DEĞİŞTİRMEDEN) doğru kategori & alt kategorilere bağlar.
 */

const fs = require("fs");
const path = require("path");

// .env yükle (varsa)
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

const rawDbUrl = process.env.DATABASE_URL || "";
if (!rawDbUrl.toLowerCase().includes("pekefe")) {
  console.error("HATA: DATABASE_URL 'pekefe' içermiyor! Başka bir projeye dokunmamak için işlem iptal edildi.");
  process.exit(1);
}

// connection_limit=1 ekle (cPanel paylaşımlı MySQL güvenliği)
const sep = rawDbUrl.includes("?") ? "&" : "?";
const safeDbUrl = rawDbUrl.includes("connection_limit=")
  ? rawDbUrl
  : `${rawDbUrl}${sep}connection_limit=1&pool_timeout=20`;

process.env.DATABASE_URL = safeDbUrl;

const { PrismaClient } = require("../src/generated-client");
const prisma = new PrismaClient();

const CATEGORIES = [
  {
    id: "PKF-KAT-001",
    name: "Pestil Çeşitleri",
    slug: "pestil-cesitleri",
    parentId: null,
    shortDesc:
      "Erzurum İspir'in yüksek rakımlı bahçelerinden toplanan doğal dutlarla, geleneksel serme ve kurutma yöntemleriyle hazırlanan sade, cevizli ve yöresel dut pestili çeşitleri.",
    seoDesc:
      "İspir dut pestili, Anadolu'nun asırlık kış hazırlığı geleneğinin en seçkin lezzetlerinden biridir. PEKEFE Geleneksel Ürünler olarak, İspir'in güneş gören vadilerinde yetişen olgun dutları mevsiminde topluyor; ilave rafine şeker ve koruyucu kullanmadan geleneksel yöntemlerle işleyip ince tabakalar halinde kurutuyoruz.\n\nSade dut pestili doğal dut aromasını saf haliyle sunarken, cevizli dut pestili yerli İspir ceviziyle zenginleştirilmiş doyurucu bir enerji kaynağıdır. Muska ve sarma dut pestili tatlılarımız ise çay saatlerine ve misafir ikramlarına yöresel bir dokunuş katar.",
    metaTitle: "İspir Dut Pestili Çeşitleri ve Fiyatları | PEKEFE",
    metaDescription:
      "İspir'in geleneksel üretim kültürüyle hazırlanan sade ve cevizli dut pestili çeşitlerini keşfedin. PEKEFE kalitesiyle geleneksel lezzetler sofranızda.",
    image: "/ispir-pestil-kurutma-gercek.png",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "PKF-KAT-101",
    name: "Sade Dut Pestili",
    slug: "sade-dut-pestili",
    parentId: "PKF-KAT-001",
    shortDesc: "Katkısız, saf İspir dutundan ince tabakalar halinde kurutularak hazırlanan geleneksel sade dut pestili.",
    seoDesc: "Sade dut pestili, dutun kendi doğal tatlılığını ve aromasını en yalın haliyle deneyimlemek isteyenler için İspir'de geleneksel usullerle hazırlanır.",
    metaTitle: "Sade Dut Pestili | Doğal İspir Dut Pestili | PEKEFE",
    metaDescription: "Katkısız İspir dutlarından geleneksel yöntemlerle hazırlanan doğal sade dut pestili çeşitlerini inceleyin ve güvenle sipariş verin.",
    image: "/ispir-vakum-sade-pestil.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "PKF-KAT-102",
    name: "Cevizli Dut Pestili",
    slug: "cevizli-dut-pestili",
    parentId: "PKF-KAT-001",
    shortDesc: "Doğal İspir dut pestilinin yerli ceviz içi ile buluştuğu, besleyici ve doyurucu geleneksel lezzet.",
    seoDesc: "Cevizli dut pestili, İspir'in aromatik dut şırası ve özenle seçilmiş yerli cevizlerin ustalıkla bir araya getirilmesiyle üretilir.",
    metaTitle: "Cevizli Dut Pestili | İspir Cevizli Pestil | PEKEFE",
    metaDescription: "Bol cevizli ve katkısız İspir dut pestili çeşitlerini keşfedin. Taze hasat ve vakumlu ambalajla PEKEFE güvencesiyle kapınızda.",
    image: "/ispir-vakum-cevizli-pestil.jpg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "PKF-KAT-103",
    name: "Geleneksel Dut Pestili",
    slug: "geleneksel-dut-pestili",
    parentId: "PKF-KAT-001",
    shortDesc: "Muska ve sarma formunda el emeğiyle hazırlanan, özel ikramlara yakışan geleneksel İspir dut pestili tatlıları.",
    seoDesc: "Geleneksel dut pestili çeşitlerimiz; ceviz ve fındık dolgulu muska tatlısı ile sarma pestil tatlısını içerir.",
    metaTitle: "Geleneksel Dut Pestili, Muska ve Sarma Tatlısı | PEKEFE",
    metaDescription: "El yapımı muska ve sarma dut pestili tatlılarını keşfedin. İspir'in geleneksel lezzetleri PEKEFE kalitesiyle sofranızda.",
    image: "/sarma-pestil-tatlisi.jpg",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "PKF-KAT-002",
    name: "Pekmez Çeşitleri",
    slug: "pekmez-cesitleri",
    parentId: null,
    shortDesc: "İspir'in seçkin dut ve karadutlarından şeker ilavesiz, vakumlu düşük ısı ve geleneksel yöntemlerle hazırlanan doğal pekmez çeşitleri.",
    seoDesc: "PEKEFE pekmez çeşitleri, Erzurum İspir'in berrak dağ havasında olgunlaşan dut ve karadutlarından mevsiminde üretilir. Üretim sürecinde hiçbir koruyucu, glikoz şurubu veya ilave şeker kullanılmaz.\n\nDut pekmezi kahvaltı sofralarının vazgeçilmez doğal enerji kaynağı iken, karadut pekmezi yoğun rengi ve karakteristik mayhoş aromasıyla öne çıkar. Dut gün pekmezi ise güneşin doğal sıcaklığıyla kıvam alan nadir bir yöresel lezzettir.",
    metaTitle: "Doğal Dut ve Karadut Pekmezi Çeşitleri | PEKEFE",
    metaDescription: "İspir'in seçkin dutlarından geleneksel yöntemlerle hazırlanan dut, karadut ve dut gün pekmezi çeşitlerini keşfedin.",
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "PKF-KAT-201",
    name: "Dut Pekmezi",
    slug: "dut-pekmezi",
    parentId: "PKF-KAT-002",
    shortDesc: "İspir'in beyaz dutlarından şeker ilavesiz ve katkısız olarak hazırlanan, yoğun kıvamlı doğal dut pekmezi.",
    seoDesc: "İspir dut pekmezi, sadece olgun beyaz dutların özsuyundan elde edilir. Kahvaltılarda ve doğal tatlı tariflerinde güvenle kullanılır.",
    metaTitle: "Doğal İspir Dut Pekmezi | Şeker İlavesiz | PEKEFE",
    metaDescription: "Erzurum İspir'in doğal beyaz dutlarından katkısız hazırlanan hakiki dut pekmezi çeşitlerini PEKEFE güvencesiyle sipariş verin.",
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "PKF-KAT-202",
    name: "Karadut Pekmezi",
    slug: "karadut-pekmezi",
    parentId: "PKF-KAT-002",
    shortDesc: "Seçkin karadutların özünden elde edilen, yoğun aromalı, katkısız ve doğal karadut pekmezi.",
    seoDesc: "Karadut pekmezi, zengin antioksidan içeriği ve dengeli tatlı-mayhoş lezzetiyle öne çıkar.",
    metaTitle: "Doğal Karadut Pekmezi | Katkısız İspir Karadutu | PEKEFE",
    metaDescription: "Yoğun aromalı, şeker ilavesiz doğal karadut pekmezi çeşitlerini inceleyin. PEKEFE kalitesiyle cam kavanozda kapınızda.",
    image: "/geleneksel-pekmez.jpg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "PKF-KAT-203",
    name: "Dut Gün Pekmezi",
    slug: "dut-gun-pekmezi",
    parentId: "PKF-KAT-002",
    shortDesc: "Güneş ışığında doğal olarak kıvamlandırılan, sınırlı üretim geleneksel İspir dut gün pekmezi.",
    seoDesc: "Dut gün pekmezi, yüksek ısı görmeden güneşin doğal sıcaklığında yavaşça yoğunlaştırılan geleneksel bir İspir lezzetidir.",
    metaTitle: "Doğal Dut Gün Pekmezi | Güneşte Kıvamlanan | PEKEFE",
    metaDescription: "Güneşin doğal ısısıyla geleneksel yöntemlerle hazırlanan sınırlı hasat İspir dut gün pekmezini keşfedin.",
    image: "/premium-pekefe-kavanoz-tr.png",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "PKF-KAT-003",
    name: "Köme Çeşitleri",
    slug: "kome-cesitleri",
    parentId: null,
    shortDesc: "İpe dizilmiş bütün yerli cevizlerin dut şırasına defalarca batırılıp kurutulmasıyla hazırlanan geleneksel İspir köme çeşitleri.",
    seoDesc: "Köme (cevizli sucuk), Erzurum İspir yöresinin en sevilen geleneksel tatlılarından biridir. PEKEFE köme çeşitleri, özenle seçilmiş bütün yerli cevizlerin doğal dut şırasına batırılıp serin yayla havasında kurutulmasıyla üretilir.",
    metaTitle: "Geleneksel İspir Köme Çeşitleri | PEKEFE",
    metaDescription: "Anadolu'nun geleneksel lezzetlerinden İspir köme çeşitlerini PEKEFE kalitesiyle keşfedin.",
    image: "/ispir-kome-gercek-hasat.jpg",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "PKF-KAT-301",
    name: "Cevizli Köme",
    slug: "cevizli-kome",
    parentId: "PKF-KAT-003",
    shortDesc: "Bütün yerli cevizlerin doğal dut şırasıyla kaplanmasıyla hazırlanan, yumuşak ve bol cevizli İspir kömesi.",
    seoDesc: "Cevizli köme çeşitlerimizde taze mahsul yerli cevizler ve katkısız İspir dut şırası kullanılır.",
    metaTitle: "Cevizli Köme | Doğal İspir Cevizli Dut Kömesi | PEKEFE",
    metaDescription: "Bol cevizli ve dut şıralı geleneksel İspir cevizli köme çeşitlerini keşfedin. Taze üretim ve hızlı kargo ile PEKEFE'de.",
    image: "/ispir-kome-sira-dizim.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "PKF-KAT-302",
    name: "Geleneksel Köme",
    slug: "geleneksel-kome",
    parentId: "PKF-KAT-003",
    shortDesc: "Asırlık İspir tarifine sadık kalınarak mevsiminde el emeğiyle hazırlanan geleneksel köme çeşitleri.",
    seoDesc: "Geleneksel İspir kömesi, yörenin köklü üretim bilgisini katkısız ve doğal haliyle günümüze taşır.",
    metaTitle: "Geleneksel Köme | Yöresel İspir Dut Kömesi | PEKEFE",
    metaDescription: "Geleneksel yöntemlerle hazırlanan katkısız İspir dut kömesi çeşitlerini PEKEFE güvencesiyle inceleyin.",
    image: "/ispir-kome-gercek-hasat.jpg",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "PKF-KAT-004",
    name: "Doğal Yöresel Ürünler",
    slug: "yoresel-urunler",
    parentId: null,
    shortDesc: "Erzurum İspir'in temiz doğasından özenle seçilmiş kuru dut ve mevsimlik geleneksel yöresel lezzetler.",
    seoDesc: "Erzurum İspir, yüksek rakımı ve zengin bitki örtüsüyle Anadolu'nun en kıymetli doğal ürün havzalarından biridir. PEKEFE Doğal Yöresel Ürünler kategorisinde bölgenin mevsimlik lezzetlerini bir araya getiriyoruz.",
    metaTitle: "İspir Yöresel Ürünleri | Geleneksel Doğal Lezzetler",
    metaDescription: "Erzurum İspir'in doğal zenginliklerini ve geleneksel yöresel ürünlerini PEKEFE güvencesiyle keşfedin.",
    image: "/ispir-dut-hasadi.png",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "PKF-KAT-401",
    name: "Kuru Dut",
    slug: "kuru-dut",
    parentId: "PKF-KAT-004",
    shortDesc: "İspir güneşinde doğal olarak kurutulmuş, katkısız ve doğal tatlılığa sahip yöresel kuru dut.",
    seoDesc: "İspir kuru dutu, yüksek rakımda yetişen beyaz dutların mevsiminde toplanıp doğal ortamda kurutulmasıyla elde edilir.",
    metaTitle: "Doğal İspir Kuru Dut | Güneşte Kurutulmuş | PEKEFE",
    metaDescription: "Erzurum İspir'in doğal ortamda kurutulmuş, katkısız ve taze mahsul kuru dut çeşitlerini PEKEFE güvencesiyle keşfedin.",
    image: "/ispir-meyve-kurutma.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "PKF-KAT-402",
    name: "Diğer İspir Lezzetleri",
    slug: "diger-ispir-lezzetleri",
    parentId: "PKF-KAT-004",
    shortDesc: "İspir ve Erzurum yöresinin mevsimlik hasat edilen seçkin doğal gıda ürünleri.",
    seoDesc: "Diğer İspir Lezzetleri koleksiyonumuzda bölgenin hasat dönemlerine göre seçilen sınırlı üretim doğal Anadolu ürünlerine yer veriyoruz.",
    metaTitle: "Diğer İspir Lezzetleri | Yöresel Doğal Ürünler | PEKEFE",
    metaDescription: "Erzurum İspir'in mevsimlik doğal ve yöresel lezzetlerini PEKEFE kalitesiyle keşfedin.",
    image: "/ispir-dut-hasadi.png",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "PKF-KAT-005",
    name: "Hediyelik Lezzetler",
    slug: "hediyelik-lezzetler",
    parentId: null,
    shortDesc: "Sevdiklerinize ve kurumsal iş ortaklarınıza İspir'in en seçkin doğal lezzetlerini sunabileceğiniz özenli hediye setleri ve yöresel lezzet kutuları.",
    seoDesc: "PEKEFE Hediyelik Lezzetler koleksiyonu, Anadolu'nun köklü ikram kültürünü zarif ve özenli sunumlarla buluşturur.",
    metaTitle: "Yöresel Lezzet ve Hediye Setleri | PEKEFE",
    metaDescription: "İspir'in geleneksel lezzetlerini sevdiklerinize özel hediye setleri ve yöresel lezzet kutularıyla ulaştırın.",
    image: "/ispir-pestil-kome-kompozisyon.png",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "PKF-KAT-501",
    name: "PEKEFE Hediye Setleri",
    slug: "pekefe-hediye-setleri",
    parentId: "PKF-KAT-005",
    shortDesc: "Pestil, köme ve doğal pekmez çeşitlerinin özenle bir araya getirildiği özel PEKEFE hediye setleri.",
    seoDesc: "PEKEFE Hediye Setleri, İspir'in en sevilen geleneksel ürünlerini tek bir zarif pakette sunar.",
    metaTitle: "PEKEFE Hediye Setleri | Doğal Yöresel Hediye Paketleri",
    metaDescription: "İspir dut pestili, köme ve doğal pekmezlerden oluşan şık PEKEFE hediye setlerini keşfedin.",
    image: "/ispir-paketleme-boutique.png",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "PKF-KAT-502",
    name: "Yöresel Lezzet Kutuları",
    slug: "yoresel-lezzet-kutulari",
    parentId: "PKF-KAT-005",
    shortDesc: "Özel günler ve kurumsal ikramlar için hazırlanan seçkin Erzurum İspir yöresel lezzet kutuları.",
    seoDesc: "Yöresel Lezzet Kutuları, geleneksel tatları keşfetmek veya kurumsal iş ortaklarınıza yöresel bir armağan sunmak için özel olarak derlenir.",
    metaTitle: "Yöresel Lezzet Kutuları | İspir Tadım ve İkram Kutuları | PEKEFE",
    metaDescription: "Özel günler ve kurumsal hediyeler için hazırlanan yöresel İspir lezzet kutularını inceleyin.",
    image: "/ispir-pestil-kome-kompozisyon.png",
    sortOrder: 2,
    isActive: true,
  },
];

function trNorm(s = "") {
  const m = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
  return String(s).split("").map((c) => m[c] || c).join("").toLowerCase().trim();
}

function classifyProduct(name) {
  const n = trNorm(name);
  if (n.includes("karadut") && n.includes("pekmez")) {
    return { category: "Pekmez Çeşitleri", subCategory: "Karadut Pekmezi", ids: ["PKF-KAT-002", "PKF-KAT-202"] };
  }
  if (n.includes("gun pekmez")) {
    return { category: "Pekmez Çeşitleri", subCategory: "Dut Gün Pekmezi", ids: ["PKF-KAT-002", "PKF-KAT-203"] };
  }
  if (n.includes("pekmez")) {
    return { category: "Pekmez Çeşitleri", subCategory: "Dut Pekmezi", ids: ["PKF-KAT-002", "PKF-KAT-201"] };
  }
  if (n.includes("kome") && n.includes("ceviz")) {
    return { category: "Köme Çeşitleri", subCategory: "Cevizli Köme", ids: ["PKF-KAT-003", "PKF-KAT-301"] };
  }
  if (n.includes("kome")) {
    return { category: "Köme Çeşitleri", subCategory: "Geleneksel Köme", ids: ["PKF-KAT-003", "PKF-KAT-302"] };
  }
  if (n.includes("muska") || n.includes("sarma")) {
    return { category: "Pestil Çeşitleri", subCategory: "Geleneksel Dut Pestili", ids: ["PKF-KAT-001", "PKF-KAT-103"] };
  }
  if (n.includes("sade") && n.includes("pestil")) {
    return { category: "Pestil Çeşitleri", subCategory: "Sade Dut Pestili", ids: ["PKF-KAT-001", "PKF-KAT-101"] };
  }
  if (n.includes("cevizli") && n.includes("pestil")) {
    return { category: "Pestil Çeşitleri", subCategory: "Cevizli Dut Pestili", ids: ["PKF-KAT-001", "PKF-KAT-102"] };
  }
  if (n.includes("pestil")) {
    return { category: "Pestil Çeşitleri", subCategory: "Geleneksel Dut Pestili", ids: ["PKF-KAT-001", "PKF-KAT-103"] };
  }
  if (n.includes("kuru dut")) {
    return { category: "Doğal Yöresel Ürünler", subCategory: "Kuru Dut", ids: ["PKF-KAT-004", "PKF-KAT-401"] };
  }
  if (n.includes("hediye") || n.includes("set")) {
    return { category: "Hediyelik Lezzetler", subCategory: "PEKEFE Hediye Setleri", ids: ["PKF-KAT-005", "PKF-KAT-501"] };
  }
  return null;
}

async function main() {
  console.log("=== PEKEFE Kategori Mimarisi & Ürün Eşleştirme Başlatıldı ===");

  // 1. Eksik sütunları güvenle ekle
  const cols = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CategoryDetail'
  `);
  const existing = new Set(cols.map((c) => String(c.COLUMN_NAME || c.column_name).toLowerCase()));
  const alters = [];
  if (!existing.has("slug")) alters.push("ADD COLUMN `slug` VARCHAR(191) NULL");
  if (!existing.has("shortdesc")) alters.push("ADD COLUMN `shortDesc` TEXT NULL");
  if (!existing.has("seodesc")) alters.push("ADD COLUMN `seoDesc` LONGTEXT NULL");
  if (!existing.has("metatitle")) alters.push("ADD COLUMN `metaTitle` VARCHAR(255) NULL");
  if (!existing.has("metadescription")) alters.push("ADD COLUMN `metaDescription` TEXT NULL");
  if (!existing.has("image")) alters.push("ADD COLUMN `image` VARCHAR(512) NULL");
  if (!existing.has("sortorder")) alters.push("ADD COLUMN `sortOrder` INT NOT NULL DEFAULT 0");
  if (!existing.has("isactive")) alters.push("ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT 1");
  if (!existing.has("createdat")) alters.push("ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)");
  if (!existing.has("updatedat")) alters.push("ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)");

  if (alters.length > 0) {
    console.log("CategoryDetail tablosuna yeni sütunlar ekleniyor:", alters.length);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`CategoryDetail\` ${alters.join(", ")}`);
  } else {
    console.log("CategoryDetail sütunları zaten güncel.");
  }

  // 2. 5 Ana + 12 Alt Kategoriyi upsert et
  for (const cat of CATEGORIES) {
    await prisma.categoryDetail.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        shortDesc: cat.shortDesc,
        seoDesc: cat.seoDesc,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        image: cat.image,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        shortDesc: cat.shortDesc,
        seoDesc: cat.seoDesc,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        image: cat.image,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        attributes: [],
        variants: [],
      },
    });
  }
  console.log(`Toplam ${CATEGORIES.length} kategori (5 Ana + 12 Alt) başarıyla senkronize edildi.`);

  // 3. Mevcut aktif ürünleri (fiyat/stok/açıklama/görsel DOKUNMADAN) doğru kategorilere bağla
  const products = await prisma.product.findMany({
    where: { isDeleted: false, isRawMaterial: false },
    select: { id: true, sku: true, name: true, category: true, subCategory: true, attributes: true },
  });

  let mappedCount = 0;
  for (const p of products) {
    const match = classifyProduct(p.name);
    if (!match) {
      console.log(`  [ATLANDI] ${p.sku} - ${p.name} (mevcut: ${p.category})`);
      continue;
    }
    let attrs = p.attributes;
    if (typeof attrs === "string") {
      try { attrs = JSON.parse(attrs); } catch { attrs = {}; }
    }
    if (!attrs || typeof attrs !== "object") attrs = {};

    await prisma.product.update({
      where: { id: p.id },
      data: {
        category: match.category,
        subCategory: match.subCategory,
        attributes: { ...attrs, categoryIds: match.ids },
      },
    });
    mappedCount++;
    console.log(`  [EŞLENDİ] ${p.sku} - ${p.name} -> ${match.category} / ${match.subCategory}`);
  }

  console.log(`=== Tamamlandı: ${mappedCount} ürün doğru kategorilere bağlandı. ===`);
}

main()
  .catch((e) => {
    console.error("HATA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
