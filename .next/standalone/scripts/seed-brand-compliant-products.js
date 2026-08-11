const { PrismaClient } = require('../src/generated-client');
const prisma = new PrismaClient();

function generateSlug(name = '') {
  const trMap = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };
  return name
    .split('')
    .map((ch) => trMap[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const BRAND_PRODUCTS = [
  {
    id: 'dut-pekmezi',
    dbId: 'cms7y76vq0005uetc6rj8y5z6', // Existing DB record if matches
    sku: 'PRD-PK-001',
    name: 'Geleneksel İspir Dut Pekmezi',
    category: 'Geleneksel Pekmezler',
    subCategory: 'Pekmez',
    price: 280,
    oldPrice: 320,
    shortDesc: 'İspir’in 2000 metre rakımlı yaylalarındaki asırlık beyaz dut ağaçlarından toplanan, bakır kazanlarda odun ateşinde ağır ağır kaynatılmış %100 saf ve katkısız geleneksel dut pekmezi.',
    harvestStory: `PEKEFE Geleneksel İspir Dut Pekmezi, Erzurum İspir’in yüksek oksijenli mikroklimal vadilerinde yetişen asırlık beyaz dut ağaçlarından şafak vakti çarşaflar serilerek el emeğiyle toplanan saf meyvelerden üretilir.

Hiçbir kimyasal koruyucu, tatlandırıcı, renklendirici veya glikoz şurubu içermeyen doğal dut şırası, geleneksel bakır kazanlarda (herle) meşe odunu ateşinde kıvam alıncaya kadar ağır ağır pişirilir.

HMF değerlerinin yükselmemesi için ideal sıcaklıklarda dinlendirilen pekmezimiz, kimyasal koruyucu ve ilave şeker barındırmaz. İpeksi dokusu ve meyvenin kendi doğal karamelize aromasıyla mineral deposu bir geleneksel lezzet şölenidir.`,
    ingredients: '%100 Saf İspir Beyaz Dut Şırası',
    ritual: 'Oda sıcaklığında (18°C - 22°C), taş değirmen tahini ile %40’a %60 oranında karıştırılarak servis edilmesi önerilir. Karıştırırken ahşap veya seramik kaşık tercih edilmelidir.',
    altitude: '2200 Metre',
    harvestSeason: 'Temmuz - Ağustos',
    hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '293 kcal', carb: '70.2 g', protein: '0.8 g', calcium: '400 mg', iron: '10.2 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'Pişirme Yöntemi', value: 'Odun Ateşinde Bakır Kazanlar' },
      { key: 'Şeker İlavesi', value: '0.0% (Sadece Doğal Meyve Şekeri)' },
      { key: 'HMF Seviyesi', value: '< 10 mg/kg (Analiz Raporlu)' }
    ],
    seoTitle: 'Geleneksel İspir Dut Pekmezi | PEKEFE Katkısız Pekmez',
    seoDesc: 'İspir’in 2000m rakımlı yaylalarındaki asırlık beyaz dutlardan, geleneksel odun ateşinde bakır kazanlarda kaynatılarak hazırlanan saf katkısız dut pekmezi.',
    seoKeywords: 'İspir Dut Pekmezi, Katkısız Pekmez, Odun Ateşinde Pekmez, Doğal Pekmez, PEKEFE'
  },
  {
    id: 'karadut-pekmezi',
    dbId: 'cml7y76vq0005uetc6rj8y5z7',
    sku: 'PRD-PK-042',
    name: 'Yabani Karadut Pekmezi',
    category: 'Geleneksel Pekmezler',
    subCategory: 'Pekmez',
    price: 320,
    oldPrice: 360,
    shortDesc: 'Düşük sıcaklıkta besin değerleri korunarak yoğunlaştırılmış, antioksidan zengini ve hafif ekşimsi aromasıyla öne çıkan premium yabani karadut özü.',
    harvestStory: `Yabani karadut meyvelerinin şafak vakti hassasiyetle toplanıp preslenmesiyle elde edilen şıra, düşük sıcaklıktaki vakumlu kazanlarımızda besin değerlerini yitirmeden yoğunlaştırılır.

Karadutun doğal ekşi-tatlı aroması ve yüksek polifenol yapısı korunur. Koruyucu, renklendirici ve ilave şeker barındırmayan bu özel mahsul, bağışıklık desteği ve doğal enerji deposudur.`,
    ingredients: '%100 Yabani İspir Karadut Şırası',
    ritual: 'Sabahları aç karnına bir yemek kaşığı doğrudan tüketilmesi veya ılık kaynak suyuna eklenerek doğal bir şerbet şeklinde yavaşça yudumlanması önerilir.',
    altitude: '1800 Metre',
    harvestSeason: 'Ağustos',
    hmfLevel: '< 8 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '285 kcal', carb: '68.5 g', protein: '1.2 g', calcium: '380 mg', iron: '12.4 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'Yoğunlaştırma Yöntemi', value: 'Düşük Sıcaklıkta Vakumlu Yoğunlaştırma' },
      { key: 'Katkı Maddesi', value: 'Sıfır (%100 Doğal)' },
      { key: 'Ambalaj', value: 'Premium Cam Şişe' }
    ],
    seoTitle: 'Yabani Karadut Pekmezi | PEKEFE Doğal Karadut Özü',
    seoDesc: 'İspir yüksek vadilerindeki yabani karadutlardan düşük sıcaklıkta besin değerleri korunarak üretilmiş saf karadut pekmezi.',
    seoKeywords: 'Karadut Pekmezi, Yabani Karadut Özü, Katkısız Karadut, PEKEFE'
  },
  {
    id: 'sade-pestil',
    dbId: 'cms7y76vq0005uetc6rj8y5z8',
    sku: 'PRD-PS-001',
    name: 'Sade Dut Pestili',
    category: 'Pestil Köme Çeşitleri',
    subCategory: 'Pestil',
    price: 180,
    oldPrice: 210,
    shortDesc: 'İspir’in yüksek rakımlı vadilerinde yetişen beyaz dut şırası ve tam buğday ununun bakır kazanlarda pişirilip keten sergilerde güneşte kurutulmasıyla hazırlanan ipeksi sade pestil.',
    harvestStory: `PEKEFE Sade Dut Pestili, Erzurum İspir’in yüksek oksijenli mikroklimal vadilerinde yetişen asırlık dut ağaçlarından el emeğiyle toplanan saf beyaz dutlardan üretilir.

Hiçbir kimyasal koruyucu veya glikoz şurubu içermeyen doğal dut şırası, geleneksel bakır kazanlarda meşe odunu ateşinde pişirilir. Az miktarda tam buğday unu ile bağlanan ipeksi şıra, saf keten bezler üzerine dökülür.

İspir'in nemsiz dağ rüzgarları ve bol güneş ışığı altında doğal olarak kurutulan pestiller, kıvamını bulunca sergilerden özenle sıyrılır. İncecik dokusu ve karamelize aromasıyla rafine bir lezzettir.`,
    ingredients: '%100 Saf İspir Beyaz Dut Şırası, Tam Buğday Unu',
    ritual: 'Oda sıcaklığında (18°C - 22°C), yanında taze demlenmiş Türk kahvesi veya bergamat aromalı çay ile servis edilmesi önerilir. İsteğe göre içerisine keçi peyniri sarılabilir.',
    altitude: '2000 Metre',
    harvestSeason: 'Temmuz - Ağustos',
    hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '380 kcal', carb: '82.0 g', protein: '3.5 g', calcium: '120 mg', iron: '4.0 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'Kurutma Yöntemi', value: 'Keten Bezlerde Güneşte Doğal Kurutma' },
      { key: 'Kalınlık', value: '< 1.5 mm (İpeksi Dokulu)' },
      { key: 'Şeker / Glikoz', value: '0.0% (Sadece Doğal Meyve Şekeri)' }
    ],
    seoTitle: 'PEKEFE Sade Dut Pestili | Geleneksel Katkısız İspir Dut Pestili',
    seoDesc: 'İspir’in 2000 m yüksek rakımlı vadilerinde yetişen katkısız beyaz dutlardan, geleneksel odun ateşinde ve keten bezlerde güneşte kurutularak hazırlanan saf Sade Dut Pestili.',
    seoKeywords: 'Sade Dut Pestili, İspir Dut Pestili, Katkısız Pestil, Şekersiz Pestil, PEKEFE'
  },
  {
    id: 'cevizli-pestil',
    dbId: 'cms7y76vq0005uetc6rj8y5z9',
    sku: 'PRD-PS-002',
    name: 'Cevizli Rulo Pestil',
    category: 'Pestil Köme Çeşitleri',
    subCategory: 'Pestil',
    price: 220,
    oldPrice: 250,
    shortDesc: 'İspir yöresinin yerli cevizleriyle harmanlanan, ipeksi kıvamda serilen geleneksel dut pestilinin rulo haline getirilmiş en asil şekli.',
    harvestStory: `Güneşte kurutulmuş ipeksi sade dut pestilinin içerisine yerli İspir cevizlerinin özenle dövülerek serpilmesi ve rulo şeklinde sarılmasıyla elde edilir.

Cevizin doğal sağlıklı yağ ve protein yapısı, dutun karamelize enerjisiyle birleşerek dengeli ve besleyici bir gurme atıştırmalık oluşturur.`,
    ingredients: 'İspir Beyaz Dut Şırası, Tam Buğday Unu, Yerli İspir Cevizi (%35)',
    ritual: 'İnce dilimler halinde kesilerek, yanında olgunlaştırılmış sert keçi peyniri ve taze demlenmiş çay ile servis edilmesi tavsiye olunur.',
    altitude: '1900 Metre',
    harvestSeason: 'Temmuz - Eylül',
    hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '410 kcal', carb: '72.4 g', protein: '5.8 g', calcium: '140 mg', iron: '4.8 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'Ceviz Oranı', value: '%35 (Yerli İspir Cevizi)' },
      { key: 'Katkı Maddesi', value: 'Sıfır (%100 Doğal)' }
    ],
    seoTitle: 'Cevizli Rulo Pestil | PEKEFE İspir Cevizli Dut Pestili',
    seoDesc: 'Yerli İspir cevizleri ve geleneksel ipeksi dut pestilinin buluşmasıyla hazırlanan doğal cevizli rulo pestil.',
    seoKeywords: 'Cevizli Pestil, Rulo Pestil, İspir Cevizli Pestil, PEKEFE'
  },
  {
    id: 'ispir-kome',
    dbId: 'cms7y76vq0005uetc6rj8y6a0',
    sku: 'PRD-KM-001',
    name: 'İspir Dut Kömesi (Cevizli)',
    category: 'Pestil Köme Çeşitleri',
    subCategory: 'Köme',
    price: 380,
    oldPrice: 420,
    shortDesc: 'İpe dizilen taze İspir cevizlerinin, bakır kazanlarda kaynayan dut herlesine defalarca batırılarak güneşte kurutulmasıyla elde edilen coğrafi işaretli lezzet.',
    harvestStory: `Pamuk iplerine dizilen kelebek İspir cevizleri, meşe odunu ateşinde kaynayan yoğun dut herlesine (şıra ve un karışımı) birkaç kat halinde daldırılır.

İspir dağ rüzgarında askılarda kurutulan kömelerimiz, dışı yumuşacık ve esnek, içi bol cevizli asırlık bir gelenek sunar.`,
    ingredients: 'İspir Beyaz Dut Şırası, Tam Buğday Unu, Yerli İspir Cevizi (%40)',
    ritual: 'Oda sıcaklığında dilimlenerek ikram edilir. Çay ve Türk kahvesinin yanında besleyici geleneksel ikramlıktır.',
    altitude: '2000 Metre',
    harvestSeason: 'Ağustos - Eylül',
    hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '430 kcal', carb: '68.0 g', protein: '6.5 g', calcium: '150 mg', iron: '5.2 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'Ceviz Oranı', value: '%40 (Yerli Kelebek Ceviz)' },
      { key: 'Ambalaj', value: 'Pamuk Torba / Vakum Kutu' }
    ],
    seoTitle: 'İspir Dut Kömesi (Cevizli) | PEKEFE Coğrafi İşaretli Köme',
    seoDesc: 'İspir cevizlerinin saf dut herlesine batırılarak güneşte kurutulmasıyla hazırlanan geleneksel cevizli köme.',
    seoKeywords: 'İspir Kömesi, Cevizli Dut Kömesi, Cevizli Sucuk, PEKEFE'
  },
  {
    id: 'ispir-tek-cekim-kome',
    dbId: 'cms7y76vq0005uetc6rj8y6a1',
    sku: 'PRD-KM-002',
    name: 'İspir Tek Çekim Dut Kömesi',
    category: 'Pestil Köme Çeşitleri',
    subCategory: 'Köme',
    price: 240,
    oldPrice: 270,
    shortDesc: 'İpe dizili cevizlere tek kat daldırma yapılarak ceviz yoğunluğu en üst seviyede tutulmuş, az herle kaplı butik seri köme.',
    harvestStory: `Ceviz lezzetini öne çıkarmak için ipe dizilen kelebek cevizler dut herlesine tek daldırma ile kaplanır. Ceviz oranı maksimumda tutulan hafif ve gevreğimsi gurme serimizdir.`,
    ingredients: 'Yerli İspir Cevizi (%55), İspir Beyaz Dut Şırası, Tam Buğday Unu',
    ritual: 'Tek lokmalık dilimler halinde servis edilir.',
    altitude: '2000 Metre',
    harvestSeason: 'Ağustos - Eylül',
    hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '460 kcal', carb: '58.0 g', protein: '8.2 g', calcium: '160 mg', iron: '5.8 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'Ceviz Oranı', value: '%55 (Ekstra Yoğun Ceviz)' }
    ],
    seoTitle: 'İspir Tek Çekim Dut Kömesi | PEKEFE Butik Köme',
    seoDesc: 'Ceviz oranı yüksek, tek daldırma yöntemiyle üretilmiş özel seri İspir tek çekim cevizli köme.',
    seoKeywords: 'Tek Çekim Köme, Bol Cevizli Köme, PEKEFE'
  },
  {
    id: 'muska-tatlisi',
    dbId: 'cms7y76vq0005uetc6rj8y6a2',
    sku: 'PRD-TT-001',
    name: 'Dut Pestil Muska Tatlısı',
    category: 'Pestil Köme Çeşitleri',
    subCategory: 'Gurme Tatlılar',
    price: 200,
    oldPrice: 230,
    shortDesc: 'İncecik kesilen sade dut pestilinin içerisine yerli ceviz, bal ve pekmez karışımı muska şeklinde sarılarak elde edilen saray lezzeti.',
    harvestStory: `Keten sergilerde kurutulmuş ipeksi şerit pestillerin içerisine dövülmüş İspir cevizi ve saf bal dolgusu konarak muska biçiminde tek tek el emeğiyle katlanır.`,
    ingredients: 'İspir Beyaz Dut Şırası, Tam Buğday Unu, Yerli İspir Cevizi, Saf Bal',
    ritual: 'Kahve yanında zarif bir saray ikramlığı olarak sunulabilir.',
    altitude: '2000 Metre',
    harvestSeason: 'Temmuz - Ağustos',
    hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '400 kcal', carb: '76.0 g', protein: '4.8 g', calcium: '130 mg', iron: '4.2 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'Dolgu', value: 'İspir Cevizi & Saf Bal' }
    ],
    seoTitle: 'Dut Pestil Muska Tatlısı | PEKEFE Gurme Muska Tatlısı',
    seoDesc: 'İpeksi İspir dut pestilinin içerisinde bal ve ceviz dolgulu geleneksel muska tatlısı.',
    seoKeywords: 'Muska Tatlısı, Pestil Muska, Cevizli Muska, PEKEFE'
  },
  {
    id: 'sarma-tatlisi',
    dbId: 'cms7y76vq0005uetc6rj8y6a3',
    sku: 'PRD-TT-002',
    name: 'Dut Pestil Sarma Tatlısı',
    category: 'Pestil Köme Çeşitleri',
    subCategory: 'Gurme Tatlılar',
    price: 210,
    oldPrice: 240,
    shortDesc: 'Dut pestilinin içerisine bol miktarda dövülmüş İspir cevizi sarılarak hazırlanan lokum kıvamında gurme lezzet dilimleri.',
    harvestStory: `Geleneksel dut pestili yapraklarına bol dövülmüş ceviz içi sarılarak ince rulo dilimler elde edilir. Şekersiz doğal meyve tatlısıdır.`,
    ingredients: 'İspir Beyaz Dut Şırası, Tam Buğday Unu, Yerli İspir Cevizi (%40)',
    ritual: 'Çay ve kahve saatlerinde sağlıklı tatlı alternatifi olarak tüketilir.',
    altitude: '2000 Metre',
    harvestSeason: 'Temmuz - Ağustos',
    hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
    nutrients: { energy: '415 kcal', carb: '74.0 g', protein: '5.2 g', calcium: '135 mg', iron: '4.5 mg' },
    specifications: [
      { key: 'Menşei', value: 'Erzurum / İspir' },
      { key: 'İçerik', value: 'İspir Cevizi Sarma' }
    ],
    seoTitle: 'Dut Pestil Sarma Tatlısı | PEKEFE Pestil Sarma',
    seoDesc: 'Doğal İspir dut pestili içerisine bol ceviz sarılarak hazırlanan lokum kıvamında gurme pestil sarma.',
    seoKeywords: 'Pestil Sarma, Cevizli Pestil Sarma, PEKEFE'
  }
];

async function main() {
  console.log('Seeding Brand-Compliant Products to Prisma DB...\n');

  for (const item of BRAND_PRODUCTS) {
    const slug = generateSlug(item.name);
    const attributesObj = {
      shortDesc: item.shortDesc,
      details: item.harvestStory,
      harvestStory: item.harvestStory,
      ingredients: item.ingredients,
      ritual: item.ritual,
      altitude: item.altitude,
      harvestSeason: item.harvestSeason,
      hmfLevel: item.hmfLevel,
      nutrients: item.nutrients,
      specifications: item.specifications,
    };

    // Try finding by SKU or ID
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: item.sku },
          { id: item.dbId },
          { name: item.name }
        ]
      }
    });

    if (existing) {
      console.log(`Updating existing product [${existing.id}] ${item.name}...`);
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          desc: item.shortDesc, // clean text
          category: item.category,
          subCategory: item.subCategory,
          price: item.price,
          oldPrice: item.oldPrice,
          list_price: item.oldPrice,
          sale_price: item.price,
          seoTitle: item.seoTitle,
          seoDesc: item.seoDesc,
          seoKeywords: item.seoKeywords,
          attributes: JSON.stringify(attributesObj)
        }
      });
    } else {
      console.log(`Creating new product ${item.name} (${item.sku})...`);
      await prisma.product.create({
        data: {
          id: item.dbId,
          sku: item.sku,
          name: item.name,
          desc: item.shortDesc,
          category: item.category,
          subCategory: item.subCategory,
          price: item.price,
          oldPrice: item.oldPrice,
          list_price: item.oldPrice,
          sale_price: item.price,
          cost: Math.round(item.price * 0.5),
          stock: 100,
          stock_quantity: 100,
          criticalLimit: 10,
          image: item.id === 'dut-pekmezi' ? '/pekefe-dut-pekmezi-kavanoz-tr.jpg' : (item.id === 'karadut-pekmezi' ? '/premium-pekefe-kavanoz-tr.png' : '/ispir-pestil-kurutma-gercek.png'),
          images: JSON.stringify([
            '/ispir-pestil-kurutma-gercek.png',
            '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
            '/premium-pekefe-kavanoz-tr.png'
          ]),
          seoTitle: item.seoTitle,
          seoDesc: item.seoDesc,
          seoKeywords: item.seoKeywords,
          attributes: JSON.stringify(attributesObj)
        }
      });
    }
  }

  console.log('\nSUCCESS! All database products have been aligned with PEKEFE Brand Book v1.0.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
