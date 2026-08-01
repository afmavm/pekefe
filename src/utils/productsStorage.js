"use client";

/**
 * Generates a SEO-friendly URL slug from a Turkish product name.
 * Example: "Sade Dut Pestili" → "sade-dut-pestili"
 */
export function generateSlug(name = "") {
  const trMap = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
    ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return name
    .split("")
    .map((ch) => trMap[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const DEFAULT_PRODUCTS = [
  {
    id: "dut-pekmezi",
    name: "Geleneksel İspir Dut Pekmezi",
    category: "pekmez",
    categoryDisplay: "Geleneksel Pekmezler",
    desc: "İspir'in 2000 rakımlı yaylalarındaki yabani mulberlerden toplanıp odun ateşinde ve bakır kazanlarda kaynatılan, katkısız saf dut pekmezi.",
    meta: "800g · Cam Kavanoz",
    price: 280,
    image: "/pekefe-dut-pekmezi-kavanoz.jpg",
    images: [
      "/pekefe-dut-pekmezi-kavanoz.jpg",
      "/premium-pekefe-kavanoz.png",
      "/ispir-pestil-kurutma-gercek.png"
    ],
    sku: "PRD-PK-001",
    stock: 142,
    status: "Stokta",
    altitude: "2200 Metre",
    harvestSeason: "Temmuz - Ağustos",
    description: "İspir'in 2000 rakımlı yaylalarındaki yabani beyaz dut ağaçlarından toplanıp odun ateşinde ve kalın bakır kazanlarda kaynatılan, hiçbir katkı maddesi içermeyen %100 saf ve yoğun gövdeli geleneksel dut pekmezi.",
    details: "Asırlık yabani dut ağaçlarından şafak vakti çarşaflar gerilerek toplanan dutlar, soğuk kaynak sularıyla yıkanıp sıkılır. Elde edilen saf şıra, meşe odunu ateşinde el yapımı bakır kazanlarda (herle) yavaşça karıştırılarak kaynatılır. HMF değerlerinin yükselmemesi için ideal sıcaklıklarda dinlendirilen pekmezimiz, kimyasal koruyucu ve ilave şeker barındırmaz.",
    ingredients: "100% Saf İspir Beyaz Dut Şırası",
    ritual: "Oda sıcaklığında (18°C - 22°C), taş değirmen tahini ile %40'a %60 oranında karıştırılarak servis edilmesi önerilir. Karıştırırken metal kaşık yerine ahşap veya seramik kaşık tercih edilmelidir.",
    nutrients: { energy: "293 kcal", carb: "70.2 g", protein: "0.8 g", calcium: "400 mg", iron: "10.2 mg" },
    variants: [
      { id: "v-dut-400", size: "400g Cam Kavanoz", price: 160, stock: 40, sku: "PRD-PK-001-400" },
      { id: "v-dut-800", size: "800g Cam Kavanoz", price: 280, stock: 142, sku: "PRD-PK-001-800" },
      { id: "v-dut-1kg", size: "1 Kg Vakum Ambalaj", price: 340, stock: 30, sku: "PRD-PK-001-1KG" }
    ],
    specifications: [
      { key: "Menşei", value: "Erzurum / İspir" },
      { key: "Pişirme Yöntemi", value: "Odun Ateşinde Bakır Kazanlar" },
      { key: "Şeker İlavesi", value: "0.0% (Sadece Doğal Meyve Şekeri)" },
      { key: "HMF Seviyesi", value: "< 10 mg/kg (Analiz Raporlu)" }
    ]
  },
  {
    id: "karadut-pekmezi",
    name: "Yabani Karadut Pekmezi",
    category: "pekmez",
    categoryDisplay: "Geleneksel Pekmezler",
    desc: "Geleneksel vakumlu kaynatma tekniği ile yüksek HMF değerleri üretilmeden, vitamin ve mineralleri korunarak üretilen premium karadut özü.",
    meta: "450g · Şişe Şeklinde Cam",
    price: 320,
    image: "/premium-pekefe-kavanoz.png",
    images: [
      "/premium-pekefe-kavanoz.png",
      "/pekefe-dut-pekmezi-kavanoz.jpg",
      "/ispir-dut-hasadi.png"
    ],
    sku: "PRD-PK-042",
    stock: 8,
    status: "Kritik",
    altitude: "1800 Metre",
    harvestSeason: "Ağustos",
    description: "Geleneksel vakumlu kaynatma tekniği kullanılarak, yüksek sıcaklıklara çıkılmadan meyvenin vitamin ve minerallerini koruyan, yoğun kıvamlı ve hafif ekşimsi butik karadut özü.",
    details: "Yabani karadut meyvelerinin preslenmesiyle elde edilen şıra, düşük sıcaklıktaki vakumlu kazanlarımızda besin değerlerini yitirmeden yoğunlaştırılır. Karadutun doğal ekşi-tatlı aroması ve yüksek polifenol yapısı korunur. Ağız yaraları, bağışıklık desteği ve doğal enerji deposu olarak bilinir.",
    ingredients: "100% Yabani Karadut Şırası",
    ritual: "Sabahları aç karnına bir yemek kaşığı doğrudan tüketilmesi veya ılık kaynak suyuna eklenerek doğal bir meyve şerbeti şeklinde yavaşça yudumlanması önerilir.",
    nutrients: { energy: "285 kcal", carb: "68.5 g", protein: "1.2 g", calcium: "380 mg", iron: "12.4 mg" },
    specifications: [
      { key: "Menşei", value: "Erzurum / İspir" },
      { key: "Koyulaştırma Yöntemi", value: "Düşük Sıcaklıkta Vakumlu Yoğunlaştırma" },
      { key: "Katkı Maddesi", value: "Yoktur (Sıfır Koruyucu)" },
      { key: "Ambalaj", value: "Premium Cam Şişe" }
    ]
  },
  {
    id: "sade-pestil",
    name: "Sade Dut Pestili",
    category: "pestil",
    categoryDisplay: "Pestil & Köme",
    desc: "Dut şırası ve tam buğday ununun bakır kazanlarda pişirilip keten sergiler üzerinde İspir güneşi altında kurutulmasıyla üretilen incecik sade pestil.",
    meta: "500g · Kraft Kutu",
    price: 180,
    image: "/ispir-pestil-kurutma-gercek.png",
    images: [
      "/ispir-pestil-kurutma-gercek.png",
      "/ispir-vakum-sade-pestil-beyaz.png",
      "/premium-pekefe-kavanoz.png"
    ],
    sku: "PRD-PS-001",
    stock: 64,
    status: "Stokta",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz",
    description: "Saf dut şırası ve tam buğday ununun bakır kazanlarda pişirilip keten sergiler üzerine incecik dökülmesi ve İspir güneşi altında doğal olarak kurutulmasıyla üretilen ipeksi sade pestil.",
    details: "Kazanlarda kaynayan dut şırası, az miktarda tam buğday unu ile bulamaç (herle) kıvamına getirilir. Keten bezlere milimetrik kalınlıkta serilerek İspir'in kuru dağ rüzgarlarında güneş altında kurumaya bırakılır. Kuruyan pestiller bezlerden su yardımıyla sıyrılıp, katlanarak özel kraft kutularına yerleştirilir.",
    ingredients: "İspir Beyaz Dut Şırası, Tam Buğday Unu, Eser Miktar Bal",
    ritual: "Yanında taze demlenmiş soğuk çiçek çayı veya Türk kahvesiyle oda sıcaklığında tüketilmesi; arzu edilirse manda kaymağı sarılarak servis edilmesi önerilir.",
    nutrients: { energy: "380 kcal", carb: "82.0 g", protein: "3.5 g", calcium: "120 mg", iron: "4.0 mg" },
    specifications: [
      { key: "Kurutma Şekli", value: "Keten Bezlerde Güneşte Doğal Kurutma" },
      { key: "Kalınlık", value: "< 1.5mm (İpeksi Tekstür)" },
      { key: "Şeker İlavesi", value: "Yok (Glikozsuz)" },
      { key: "Ambalaj", value: "Nem Bariyerli Kraft Kutu" }
    ]
  },
  {
    id: "cevizli-pestil",
    name: "Cevizli Rulo Pestil",
    category: "pestil",
    categoryDisplay: "Pestil & Köme",
    desc: "İspir yöresinin yerli cevizleriyle harmanlanan, ipeksi kıvamda serilen geleneksel dut pestilinin rulo haline getirilmiş en asil şekli.",
    meta: "500g · Premium Hediye Kutusu",
    price: 220,
    image: "/ispir-vakum-cevizli-pestil-beyaz.png",
    images: [
      "/ispir-vakum-cevizli-pestil-beyaz.png",
      "/ispir-pestil-kurutma-gercek.png",
      "/premium-pekefe-kavanoz.png"
    ],
    sku: "PRD-PS-002",
    stock: 48,
    status: "Stokta",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz - Eylül",
    description: "İspir havzasının yerli cevizleriyle harmanlanan, ipeksi kıvamda serilen geleneksel dut pestilinin rulo haline getirilmiş en asil ve besleyici şekli.",
    details: "Güneşte kurutulmuş sade dut pestilinin içerisine yerli İspir cevizlerinin dövülerek serpilmesi ve rulo şeklinde sarılmasıyla elde edilir. Cevizin doğal yağ ve protein dengesi, dutun karamelize enerjisiyle birleşerek mükemmel bir atıştırmalık sunar.",
    ingredients: "Dut Pestili (Dut şırası, un), Yerli İspir Cevizi",
    ritual: "İnce halkalar şeklinde dilimlenerek, yanında olgunlaştırılmış sert keçi peyniri ile şarküteri tahtalarında servis edilmesi asil bir zıtlık oluşturur.",
    nutrients: { energy: "410 kcal", carb: "72.4 g", protein: "5.8 g", calcium: "140 mg", iron: "4.8 mg" },
    specifications: [
      { key: "Ceviz Oranı", value: "%35 (Yerli İspir Cevizi)" },
      { key: "Koruyucu", value: "Sıfır (Katkısız)" },
      { key: "Kurutma", value: "Doğal Rüzgar Altında Güneşte" },
      { key: "Hediye Kutusu", value: "Premium Ahşap Kaplamalı Kutu" }
    ]
  },
  {
    id: "ispir-kome",
    name: "İspir Dut Kömesi (Cevizli)",
    category: "kome",
    categoryDisplay: "Pestil & Köme",
    desc: "İpe dizilen taze İspir cevizlerinin, kaynayan dut herlesine (şıra karışımı) defalarca batırılarak güneşte kurutulmasıyla elde edilen efsanevi lezzet.",
    meta: "1kg · Pamuk Torba",
    price: 380,
    image: "/ispir-kome-gercek-hasat.jpg",
    images: [
      "/ispir-kome-gercek-hasat.jpg",
      "/vakumlu-uretim.png",
      "/geleneksel-kazan.png"
    ],
    sku: "PRD-KM-110",
    stock: 45,
    status: "Stokta",
    altitude: "2100 Metre",
    harvestSeason: "Eylül",
    description: "İpe dizilen taze İspir cevizlerinin, kaynayan dut şırası herlesine defalarca daldırılıp İspir'in kuru havasında asılarak kurutulmasıyla elde edilen efsanevi coğrafi tescilli köme.",
    details: "Ayıklanan taze yerli cevizler pamuk ipliklere dizilir. Odun ateşinde hazırlanan sıcak dut herlesine (şıra, bal, un karışımı) batırılarak üzeri kaplanır. Havada asılarak kurutulan kömeler, kıvamını bulduktan sonra toplanarak paketlenir. Çiğnenebilir, yumuşak ve zengin lif yapılıdır.",
    ingredients: "İspir Cevizi, Dut Şırası, Süzme Bal, Tam Buğday Unu, Süt",
    ritual: "Serin bir ortamda saklanmalı, servis etmeden hemen önce ince şeritler halinde verev (asimetrik) dilimlenerek ikram edilmelidir.",
    nutrients: { energy: "420 kcal", carb: "68.0 g", protein: "6.2 g", calcium: "150 mg", iron: "5.2 mg" },
    specifications: [
      { key: "Tescil Tipi", value: "Coğrafi İşaretli Mahsul" },
      { key: "Ceviz Cinsi", value: "İnce Kabuklu İspir Cevizi" },
      { key: "Kaplama Sayısı", value: "Üç Kat Daldırma (Maksimum Dolgunluk)" },
      { key: "Koruyucu Kimyasal", value: "0.0% (Bulunmadı)" }
    ]
  },
  {
    id: "ispir-tek-cekim-kome",
    name: "İspir Tek Çekim Dut Kömesi",
    category: "kome",
    categoryDisplay: "Pestil & Köme",
    desc: "Dullerine sadece tek daldırma yapılarak ceviz yoğunluğu en üst seviyede tutulmuş, hafif tatlı butik seri.",
    meta: "500g · Butik Paket",
    price: 240,
    image: "/ispir-kome-beyaz.png",
    images: [
      "/ispir-kome-beyaz.png",
      "/ispir-dut-hasadi.png",
      "/geleneksel-kazan.png"
    ],
    sku: "PRD-KM-111",
    stock: 22,
    status: "Stokta",
    altitude: "2100 Metre",
    harvestSeason: "Eylül",
    description: "Ceviz yoğunluğunu hissetmek isteyenler için tasarlanmış, dut herlesine sadece tek bir kez daldırılarak kaplama tabakası ince tutulmuş premium cevizli sucuk serisi.",
    details: "Yerli İspir cevizleri ipe dizildikten sonra kaynayan şıra kazanına sadece bir kez batırılır. Bu sayede üzerindeki tatlı dış tabaka ince kalır ve cevizlerin kıtırlığı ile aroması en üst perdeden hissedilir. Ağır tatlı sevmeyen gurmelerin bir numaralı tercihidir.",
    ingredients: "Yerli İspir Cevizi (%50), Dut Şırası, Bal, Un",
    ritual: "Sıcak espresso veya sert bir Türk kahvesiyle mükemmel uyum sağlar. Kahvenin acılığı, ince tatlı herle kaplamasını mükemmel dengeler.",
    nutrients: { energy: "445 kcal", carb: "60.4 g", protein: "7.8 g", calcium: "165 mg", iron: "5.5 mg" },
    specifications: [
      { key: "Ceviz Oranı", value: "%50 (Yoğun Kıtırlık)" },
      { key: "Herle Kaplama Kalınlığı", value: "< 1.0mm (Tek Daldırma)" },
      { key: "Glikoz/Sakkaroz", value: "0.0% (Eklenmemiş)" },
      { key: "Hasat Yılı", value: "Güncel Sezon Hasadı" }
    ]
  },
  {
    id: "muska-tatlisi",
    name: "Dut Pestil Muska Tatlısı",
    category: "tatli",
    categoryDisplay: "Geleneksel Tatlılar",
    desc: "İncecik kesilen sade dut pestilinin içerisine yerli ceviz, bal ve pekmez karışımı muska şeklinde sarılarak elde edilen enfes saray tatlısı.",
    meta: "350g · Özel Sunum Kabı",
    price: 200,
    image: "/ispir-vakum-sade-pestil-beyaz.png",
    images: [
      "/ispir-vakum-sade-pestil-beyaz.png",
      "/ispir-pestil-kurutma-gercek.png",
      "/geleneksel-pekmez.png"
    ],
    sku: "PRD-TT-201",
    stock: 31,
    status: "Stokta",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz",
    description: "İncecik kesilen sade dut pestilinin içerisine yerli ceviz, bal ve pekmez karışımı yerleştirilerek muska şeklinde katlanan en asil saray tatlısı.",
    details: "Keten sergilerden sıyrılan taze sade pestiller şeritler halinde kesilir. İçerisine dövülmüş ceviz içi, saf İspir balı ve koyu dut pekmezi karışımı dolgu olarak yerleştirilir. Usta kadınların el emeğiyle muska şeklinde katlanarak hazırlanan bu lezzet lokmaları, ağızda eriyen bir dokuya sahiptir.",
    ingredients: "Dut Pestili, Yerli Ceviz, Saf Çiçek Balı, Yoğun Dut Pekmezi",
    ritual: "Oda sıcaklığında, üzerine hafifçe toz antep fıstığı serpiştirilerek ve taze demlenmiş bergamatlı siyah çay ile servis edilmesi önerilir.",
    nutrients: { energy: "395 kcal", carb: "78.0 g", protein: "4.5 g", calcium: "130 mg", iron: "4.2 mg" },
    specifications: [
      { key: "Katlama Biçimi", value: "Geleneksel Muska (Üçgen)" },
      { key: "İç Dolgu", value: "Ceviz, Bal, Pekmez Karışımı" },
      { key: "Koruyucu ve Katkı", value: "Kesinlikle İçermez" },
      { key: "Kutu Tipi", value: "Premium Cam Sunum Kabı" }
    ]
  },
  {
    id: "sarma-tatlisi",
    name: "Dut Pestil Sarma Tatlısı",
    category: "tatli",
    categoryDisplay: "Geleneksel Tatlılar",
    desc: "Dut pestilinin içerisine bol miktarda dövülmüş ceviz ve antep fıstığı kreması sarılarak hazırlanan gurme lezzet dilimleri.",
    meta: "400g · Premium Sunum Kutusu",
    price: 210,
    image: "/ispir-vakum-cevizli-pestil-beyaz.png",
    images: [
      "/ispir-vakum-cevizli-pestil-beyaz.png",
      "/ispir-pestil-kurutma-gercek.png",
      "/premium-pekefe-kavanoz.png"
    ],
    sku: "PRD-TT-202",
    stock: 19,
    status: "Stokta",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz - Ağustos",
    description: "İncecik serilmiş sade dut pestilinin içerisine bol miktarda dövülmüş İspir cevizi ve antep fıstığı kreması sarılarak hazırlanan gurme lezzet rulosu.",
    details: "Taze sade dut pestilinin üzerine homojen olarak yerli ceviz içi ve katkısız Antep fıstığı ezmesi sürülür. Rulo halinde sıkıca sarıldıktan sonra lokmalık dilimler şeklinde kesilir. Hem fıstık hem ceviz aromalarını pestilin karamelize dokusuyla buluşturur.",
    ingredients: "Dut Pestili, İspir Cevizi, Katkısız Antep Fıstığı Ezmesi",
    ritual: "Yemek sonrasında hafif bir tatlı olarak, yanında bir top sade dondurma veya soğuk kaymak ile servis edilmesi tavsiye edilir.",
    nutrients: { energy: "415 kcal", carb: "74.0 g", protein: "5.1 g", calcium: "135 mg", iron: "4.5 mg" },
    specifications: [
      { key: "Dış Tabaka", value: "Keten Güneşte Kurutulmuş Dut Pestili" },
      { key: "İç Dolgu", value: "Ceviz & Fıstık Ezmesi Harmanı" },
      { key: "Katkı Oranı", value: "0% Yapay Aroma / Renklendirici" },
      { key: "Ambalaj", value: "Premium Karton Sunum Kutusu" }
    ]
  }
];

const STORAGE_KEY = "pekefe_products_state";

export function formatDbProductToStorefront(p) {
  let attrs = {};
  try {
    attrs = typeof p.attributes === 'string' ? JSON.parse(p.attributes) : (p.attributes || {});
  } catch (e) {
    attrs = {};
  }

  let parsedImages = [];
  if (Array.isArray(p.images)) {
    parsedImages = p.images;
  } else if (typeof p.images === 'string') {
    try { parsedImages = JSON.parse(p.images); } catch (e) { parsedImages = []; }
  }

  const mainImage = p.image || (parsedImages.length > 0 ? parsedImages[0] : "/pekefe-dut-pekmezi-kavanoz.jpg");
  if (!parsedImages.includes(mainImage) && mainImage) {
    parsedImages = [mainImage, ...parsedImages];
  }

  const catLower = p.category ? String(p.category).toLowerCase().trim() : "all";
  const stockVal = p.stock_quantity ?? p.stock ?? 0;

  // --- Price Logic ---
  const variants = p.variants || attrs.variants || [];
  const basePrice = Number(p.sale_price ?? p.price ?? 0);
  const listPrice = (p.list_price || p.oldPrice) ? Number(p.list_price || p.oldPrice) : null;
  const b2bPrice = p.b2b_price ? Number(p.b2b_price) : null;

  // If variants exist, derive price from first variant; compute min/max range
  let defaultPrice = basePrice;
  let priceMin = null;
  let priceMax = null;
  if (Array.isArray(variants) && variants.length > 0) {
    const variantPrices = variants.map(v => Number(v.price)).filter(n => n > 0);
    if (variantPrices.length > 0) {
      priceMin = Math.min(...variantPrices);
      priceMax = Math.max(...variantPrices);
      defaultPrice = variantPrices[0]; // default = first variant price
    }
  }

  return {
    id: String(p.id),
    slug: p.slug || generateSlug(p.name),
    dbId: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode || attrs.barcode || null,
    variants,
    attributes: attrs,
    category: catLower,
    categoryDisplay: p.category || "Genel",
    subCategory: p.subCategory || "",
    desc: p.desc || attrs.desc || "Asırlık İspir kalitesiyle hazırlanan katkısız ve saf mahsul.",
    shortDesc: attrs.shortDesc || p.desc || "",
    meta: attrs.meta || `${p.category || 'Doğal Mahsul'} · İspir`,
    price: defaultPrice,
    priceMin,
    priceMax,
    oldPrice: listPrice,
    b2b_price: b2bPrice,
    list_price: listPrice,
    retail_list_price: listPrice,
    is_b2b_user: false, // determined client-side by session
    image: mainImage,
    images: parsedImages.length > 0 ? parsedImages : [mainImage],
    stock: stockVal,
    status: stockVal > 20 ? "Stokta" : stockVal > 0 ? "Kritik" : "Stok Dışı",
    tag: attrs.tag || (p.isCampaignActive ? "Kampanya" : "Geleneksel Reçete"),
    altitude: attrs.altitude || "2000 Metre",
    harvestSeason: attrs.harvestSeason || "Temmuz - Ağustos",
    description: p.desc || attrs.description || p.name,
    harvestStory: attrs.harvestStory || attrs.details || p.desc || "",
    details: attrs.harvestStory || attrs.details || p.desc || "Bakır kazanlarda odun ateşinde pişirilmiş saf İspir mahsulü.",
    ingredients: attrs.ingredients || "%100 Doğal ve Katkısız",
    ritual: attrs.ritual || "Oda sıcaklığında servis edilmesi tavsiye olunur.",
    nutrients: attrs.nutrients || { energy: "300 kcal", carb: "70 g", protein: "1 g", calcium: "350 mg", iron: "8 mg" },
    specifications: (attrs.specifications && attrs.specifications.length > 0) ? attrs.specifications : [
      { key: "Menşei", value: "Erzurum / İspir" },
      { key: "Katkı Maddesi", value: "Sıfır (%100 Doğal)" }
    ],
    seoTitle: p.seoTitle || null,
    seoDesc: p.seoDesc || null,
    seoKeywords: p.seoKeywords || null,
  };
}

export function getProducts() {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    const parsed = JSON.parse(data);
    // Sanitize stale "X Adet Stokta" meta values from localStorage
    const sanitized = parsed.map(p => {
      if (p.meta && /^\d+ adet stokta$/i.test(String(p.meta).trim())) {
        return {
          ...p,
          meta: `${p.category || 'Doğal Mahsul'} · İspir`
        };
      }
      return p;
    });
    return sanitized;
  } catch (err) {
    return DEFAULT_PRODUCTS;
  }
}

export async function fetchLiveProducts() {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  try {
    const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return getProducts();
    const dbProducts = await res.json();
    if (!Array.isArray(dbProducts)) return getProducts();

    const formatted = dbProducts.map(formatDbProductToStorefront);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
    window.dispatchEvent(new Event("pekefe_products_changed"));
    return formatted;
  } catch (err) {
    console.error("fetchLiveProducts error:", err);
    return getProducts();
  }
}

export function saveProducts(newProducts) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
    window.dispatchEvent(new Event("pekefe_products_changed"));
  } catch (err) {
    console.error("Error saving products to localStorage", err);
  }
}

export function getProductById(id) {
  const products = getProducts();
  const found = products.find(p => String(p.id) === String(id) || String(p.sku) === String(id) || String(p.slug) === String(id));
  return found || null;
}

/**
 * Look up a product by its SEO-friendly slug.
 * Falls back to ID lookup so old links continue to work during transition.
 */
export function getProductBySlug(slug) {
  const products = getProducts();
  // 1. Exact slug match
  let found = products.find(p => p.slug && String(p.slug) === String(slug));
  // 2. Fallback: treat slug as DB id or sku
  if (!found) found = products.find(p => String(p.id) === String(slug) || String(p.sku) === String(slug));
  // 3. Last resort: generate slug on the fly from name and compare
  if (!found) found = products.find(p => generateSlug(p.name) === String(slug));
  return found || null;
}
