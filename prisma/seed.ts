import { PrismaClient } from '../src/generated-client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // Clear old data to prevent delicatessen leftovers
  console.log('Cleaning up old products and relations...')
  await prisma.productionOrder.deleteMany({})
  await prisma.wasteLog.deleteMany({})
  await prisma.productUnit.deleteMany({})
  await prisma.recipeItem.deleteMany({})
  await prisma.stockCycleCountItem.deleteMany({})
  await prisma.stockCycleCount.deleteMany({})
  await prisma.routeStep.deleteMany({})
  await prisma.workstation.deleteMany({})
  await prisma.productionPlan.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.stockLocation.deleteMany({})
  await prisma.stockTransaction.deleteMany({})
  await prisma.stockTransfer.deleteMany({})
  await prisma.invoiceItem.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.coupon.deleteMany({})
  await prisma.campaign.deleteMany({})
  await prisma.feedback.deleteMany({})
  await prisma.blogPost.deleteMany({})
  await prisma.authLog.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.categoryDetail.deleteMany({})
  await prisma.subAccount.deleteMany({})
  await prisma.transaction.deleteMany({})
  await prisma.currentAccount.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.warehouse.deleteMany({})
  await prisma.branch.deleteMany({})

  const hashedPassword = await bcrypt.hash('password123', 10)

  // 0. Branches
  const defaultBranch = await prisma.branch.create({
    data: {
      id: 'default-branch',
      name: 'Merkez Şube',
      code: 'BR-MRKZ',
      address: 'Manisa OSB',
      phone: '0236 111 22 33'
    }
  });

  const subeBranch = await prisma.branch.create({
    data: {
      id: 'sube-branch',
      name: 'İstanbul Şubesi',
      code: 'BR-IST',
      address: 'Ataşehir, İstanbul',
      phone: '0216 111 22 33'
    }
  });

  // 0.1 Warehouses
  const merkezDepo = await prisma.warehouse.create({
    data: {
      id: '1',
      name: 'Merkez Depo',
      code: 'WH-MRKZ',
      type: 'Merkez',
      address: 'Erzurum OSB, 3. Cadde',
      branchId: defaultBranch.id
    }
  });

  const subeDepo = await prisma.warehouse.create({
    data: {
      id: '2',
      name: 'Şube Depo',
      code: 'WH-SUBE',
      type: 'Şube',
      address: 'İstanbul Anadolu Yakası',
      branchId: subeBranch.id
    }
  });

  const uretimBandi = await prisma.warehouse.create({
    data: {
      id: '3',
      name: 'Üretim Bandı',
      code: 'WH-URT',
      type: 'Üretim',
      address: 'Yakutiye Fabrika Alanı',
      branchId: defaultBranch.id
    }
  });

  // 0.2 Users
  await prisma.user.create({
    data: {
      email: 'admin@nexab2b.com',
      name: 'Nexa Admin (Super)',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isApproved: true
    }
  })

  await prisma.user.create({
    data: {
      email: 'manager@nexab2b.com',
      name: 'Nexa Yönetici',
      password: hashedPassword,
      role: 'ADMIN',
      isApproved: true
    }
  })

  await prisma.user.create({
    data: {
      email: 'branch_manager@pekefe.com',
      name: 'Ahmet Şube Yöneticisi',
      password: hashedPassword,
      role: 'BRANCH_MANAGER',
      isApproved: true,
      branchId: subeBranch.id
    }
  })

  await prisma.user.create({
    data: {
      email: 'warehouse_supervisor@pekefe.com',
      name: 'Mehmet Depo Sorumlusu',
      password: hashedPassword,
      role: 'WAREHOUSE_SUPERVISOR',
      isApproved: true,
      branchId: subeBranch.id,
      warehouseId: subeDepo.id
    }
  })

  await prisma.user.create({
    data: {
      email: 'sales_staff@pekefe.com',
      name: 'Veli Satış Personeli',
      password: hashedPassword,
      role: 'SALES_STAFF',
      isApproved: true,
      branchId: subeBranch.id
    }
  })

  await prisma.user.create({
    data: {
      email: 'ahmet@zeta.com',
      name: 'Ahmet Yılmaz',
      password: hashedPassword,
      role: 'DEALER',
      isApproved: true
    }
  })

  // 1. Categories
  await prisma.categoryDetail.create({
    data: {
      name: 'geleneksel lezzetler',
      attributes: [
        { name: "Malzeme", type: "text", isRequired: true },
        { name: "Hava Kanalı", type: "text", isRequired: false }
      ],
      variants: ["Boyut"]
    }
  })

  await prisma.categoryDetail.create({
    data: {
      name: 'yöresel ürünler',
      attributes: [
        { name: "Malzeme", type: "text", isRequired: true },
        { name: "Hava Kanalı", type: "text", isRequired: false },
        { name: "unit", type: "text", isRequired: false }
      ],
      variants: []
    }
  })

  await prisma.categoryDetail.create({
    data: {
      name: 'Hammadde',
      attributes: [
        { name: "unit", type: "text", isRequired: false }
      ],
      variants: []
    }
  })

  await prisma.categoryDetail.create({
    data: {
      name: 'Tekstil',
      attributes: [
        { name: "Marka", type: "text", isRequired: true },
        { name: "Kumaş Türü", type: "text", isRequired: false }
      ],
      variants: ["Renk", "Beden"]
    }
  })

  // 2. Products (Hammaddeler & Mamuller)
  await prisma.product.create({
    data: {
      name: '304 Paslanmaz Çelik Sac (Plaka)',
      sku: 'RAW-SAC-01',
      category: 'Hammadde',
      stock: 500,
      criticalLimit: 100,
      cost: 350,
      price: 0,
      image: "https://placehold.co/100?text=Sac",
      isRawMaterial: true,
      images: [],
      attributes: {}
    }
  })

  await prisma.product.create({
    data: {
      name: 'Körük Derisi ve Körük Körüğü',
      sku: 'RAW-DERI-01',
      category: 'Hammadde',
      stock: 250,
      criticalLimit: 50,
      cost: 150,
      price: 0,
      image: "https://placehold.co/100?text=Deri",
      isRawMaterial: true,
      images: [],
      attributes: {}
    }
  })

  await prisma.product.create({
    data: {
      name: 'Doğal Deri Bağlama İpi',
      sku: 'RAW-IP-01',
      category: 'Hammadde',
      stock: 1000,
      criticalLimit: 100,
      cost: 20,
      price: 0,
      image: "https://placehold.co/100?text=Ip",
      isRawMaterial: true,
      images: [],
      attributes: {}
    }
  })

  await prisma.product.create({
    data: {
      name: 'Galvaniz Sac (Rulo)',
      sku: 'HAM-SAC-GALV',
      category: 'Hammadde',
      stock: 4995,
      criticalLimit: 500,
      cost: 15,
      price: 35,
      image: "https://images.unsplash.com/photo-1518552796036-6e3e5b128522?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'kg' }
    }
  })

  await prisma.product.create({
    data: {
      name: 'Suni Deri (Rulo)',
      sku: 'HAM-DERI-SUNI',
      category: 'Hammadde',
      stock: 1999,
      criticalLimit: 200,
      cost: 30,
      price: 65,
      image: "https://images.unsplash.com/photo-1620600574044-67d739814eb3?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'm2' }
    }
  })

  await prisma.product.create({
    data: {
      name: 'Ahşap Sunta Tutamaç',
      sku: 'HAM-SUNTA',
      category: 'Hammadde',
      stock: 9980,
      criticalLimit: 500,
      cost: 2,
      price: 5,
      image: "https://images.unsplash.com/photo-1550985552-87fc03afb871?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'adet' }
    }
  })

  await prisma.product.create({
    data: {
      name: 'Körük Yayı',
      sku: 'HAM-YAY',
      category: 'Hammadde',
      stock: 14990,
      criticalLimit: 1000,
      cost: 0.8,
      price: 2,
      image: "https://images.unsplash.com/photo-1563223771-5fe403a4fd12?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'adet' }
    }
  })

  await prisma.product.create({
    data: {
      name: 'Metal Menteşe',
      sku: 'HAM-MENTESE',
      category: 'Hammadde',
      stock: 19980,
      criticalLimit: 1000,
      cost: 0.75,
      price: 1.5,
      image: "https://images.unsplash.com/photo-1589139591321-7dd21ffb858e?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'adet' }
    }
  })

  const koruk = await prisma.product.create({
    data: {
      name: 'Pekefe Pro Paslanmaz Arı Körüğü',
      sku: 'PEKEFE-KORUK-01',
      category: 'geleneksel lezzetler',
      stock: 150,
      criticalLimit: 20,
      price: 850,
      cost: 300,
      image: "/uploads/beekeeping_bellows_premium.png",
      desc: "Asırlık Erzurum kalitesi, patentli çift hava kanalı sayesinde hiç sönmeyen 304 paslanmaz arı körüğü.",
      attributes: {
        "Malzeme": "304 Paslanmaz Çelik",
        "Hava Kanalı": "Patentli Çift Kanal",
        unit: "adet",
        barcode: "8680000000015",
        quickOverview1_title: "304 Paslanmaz Çelik",
        quickOverview1_desc: "Yüksek ısı mukavemeti ve uzun ömürlü paslanmaz gövde yapısı.",
        quickOverview1: "<strong>304 Paslanmaz Çelik:</strong> Yüksek ısı mukavemeti ve uzun ömürlü paslanmaz gövde yapısı.",
        quickOverview2_title: "Deri Isı Kalkanı Körük",
        quickOverview2_desc: "Elinizi ısıdan koruyan yüksek kaliteli ahşap ve hakiki deri körük.",
        quickOverview2: "<strong>Deri Isı Kalkanı Körük:</strong> Elinizi ısıdan koruyan yüksek kaliteli ahşap ve hakiki deri körük.",
        quickOverview3_title: "Yoğun Duman Izgarası",
        quickOverview3_desc: "Optimize edilmiş duman odasıyla arıları strese sokmayan soğuk duman çıkışı.",
        quickOverview3: "<strong>Yoğun Duman Izgarası:</strong> Optimize edilmiş duman odasıyla arıları strese sokmayan soğuk duman çıkışı.",
        specsMaterial: "304 Kalite Paslanmaz Çelik",
        specsWeight: "950 Gram (Ekipmansız boş ağırlık)",
        specsDimensions: "28 cm Yükseklik x 10 cm Silindir Çapı",
        specsBellows: "Hakiki Sığır Derisi & Isıl İşlem Görmüş Ahşap Plaka",
        longDescExtra: "PEKEFE profesyonel körük serisi, arıcılarımızın konforlu ve güvenli bir arılık yönetimi yapabilmesi için tasarlanmıştır. Gövdede yer alan çelik tel ızgara, körükten çıkan havanın duman odasına kesintisiz iletilmesini sağlarken yanmayı hızlandırır. Koruyucu tel örgü kalkanı, çalışma esnasında gövde ısısının doğrudan elinizle temas etmesini engelleyerek iş kazalarının önüne geçer. Ergonomik tasarımı, uzun süreli kullanımlarda bile bilek yorgunluğuna yol açmaz.",
        usageGuide: "Körüğün tabanındaki havalandırma sacının altına kuru ot, talaş veya hafif nemlendirilmiş duman kartonunu yerleştirin.\nKutuyu hafifçe ateşleyin ve dumanın kor halinde alev almasını sağlayın.\nİlk kor oluştuktan sonra duman odasının geri kalanını talaş, çam iğnesi veya kuru otla doldurun.\nKörüğü arkasındaki ahşap tabladan ritmik bir şekilde pompalayarak dumanın yoğunlaşmasını sağlayın.\nDuman çıkışı stabil bir hale geldikten sonra kapağı kilitleyin. İşlem bitiminde körüğü asma halkasından dikey bir şekilde muhafaza edin.",
        warrantyInfo: "Tüm metal parçalar, korozyon ve paslanmaya karşı 2 Yıl Üretici Garantisi altındadır.\nKörük derisinin aşınması veya ahşap parçanın su teması sebebiyle deforme olması garanti kapsamı dışındadır, ancak teknik servisimizden yedek körük temin edilebilir.\nKullanım kılavuzundaki yönergelere uygun olmayan aşırı yakıt doldurma kaynaklı metal eğrilmeleri garanti kapsamında değerlendirilmez."
      },
      images: []
    }
  })

  const elbise = await prisma.product.create({
    data: {
      name: 'Tam Koruma Arıcı Elbisesi',
      sku: 'PEKEFE-ELBISE-01',
      category: 'geleneksel lezzetler',
      stock: 80,
      criticalLimit: 10,
      price: 1200,
      cost: 500,
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800",
      desc: "3 katmanlı, nefes alabilir, arı sokmalarına karşı %100 güvenli profesyonel elbise.",
      attributes: { "Beden": "L/XL", "Katman Sayısı": "3 Katmanlı", unit: "adet", barcode: "8680000000022" },
      images: []
    }
  })

  const set = await prisma.product.create({
    data: {
      name: 'Kovan Bakım Seti',
      sku: 'PEKEFE-SET-01',
      category: 'geleneksel lezzetler',
      stock: 120,
      criticalLimit: 15,
      price: 650,
      cost: 250,
      image: "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
      desc: "8 parça paslanmaz çelik aletler ve özel taşıma çantası içeren profesyonel kovan bakım seti.",
      attributes: { "Parça Sayısı": "8 Parça", "Çanta": "Dahil", unit: "adet", barcode: "8680000000039" },
      images: []
    }
  })

  const galvanizKoruk = await prisma.product.create({
    data: {
      name: 'Profesyonel Galvaniz Arıcı Körüğü',
      sku: 'KORUK-GALV-01',
      category: 'yöresel ürünler',
      stock: 10,
      criticalLimit: 5,
      price: 350,
      oldPrice: 455,
      isCampaignActive: true,
      cost: 85,
      image: "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
      desc: "Korozyona dayanıklı galvaniz kaplama, dayanıklı deri körük and optimum hava üfleme kapasitesi sunan profesyonel arıcı körüğü.",
      attributes: { unit: 'adet' },
      images: []
    }
  })

  // 3. Current Accounts (Dealers)
  const zeta = await prisma.currentAccount.upsert({
    where: { email: 'muhasebe@zetamadencilik.com' },
    update: {},
    create: {
      name: 'Zeta Madencilik A.Ş.',
      type: 'Müşteri',
      taxId: '1234567890',
      taxOffice: 'Boğaziçi',
      phone: '0212 555 11 22',
      email: 'muhasebe@zetamadencilik.com',
      balance: 125000,
      dealerGroup: 'Platin',
      priceGroup: 'Özel İskonto',
      riskLimit: 500000,
      subAccounts: {
        create: [
          { name: 'Ahmet Yılmaz', email: 'ahmet@zeta.com', role: 'Satın Alma', balance: 5000 }
        ]
      }
    }
  })

  const omega = await prisma.currentAccount.upsert({
    where: { email: 'info@omegagida.com' },
    update: {},
    create: {
      name: 'Omega Gıda Ltd. Şti.',
      type: 'Müşteri',
      taxId: '9876543210',
      taxOffice: 'Marmara',
      phone: '0216 444 33 22',
      email: 'info@omegagida.com',
      balance: -45000,
      dealerGroup: 'Gold',
      priceGroup: 'Liste'
    }
  })

  // 4. Banks
  await prisma.bank.upsert({
    where: { id: 'BNK-01' },
    update: {},
    create: {
      id: 'BNK-01',
      name: 'Garanti BBVA',
      accountNumber: '1234-5678',
      iban: 'TR00 1111 2222 3333 4444 5555 66',
      balance: 450000,
      currency: 'TRY',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Garanti_BBVA_logo.svg/1024px-Garanti_BBVA_logo.svg.png'
    }
  })

  // 5. CMS
  const cmsDataFields = {
    heroTitle: "Arıcılığın Gücünü Hissedin.",
    heroSubtitle: "Fabrikadan direkt, PEKEFE profesyonel körük ve ekipmanlarıyla kovanlarınızı ustaca yönetin.",
    buttonText: "Ürünleri Keşfet",
    announcement: "Tüm Türkiye'ye Aynı Gün Kargo ve Fabrika Fiyatları!",
    siteName: "PEKEFE Geleneksel & Doğal Lezzetler",
    primaryColor: "#b45309", // Amber-700 - geleneksel lezzetler altın rengi
    siteDescription: "Türkiye'nin 1 Numaralı Profesyonel geleneksel lezzetler Ekipmanı Üreticisi",
    footerSlogan: "FABRİKADAN DİREKT",
    contactPhone: "0(544) 149 4851",
    contactEmail: "info@pekefe.com",
    contactAddress: "Organize Sanayi Bölgesi, Manisa",
    companyName: "PEKEFE Geleneksel & Doğal Lezzetler San. ve Tic. Ltd. Şti.",
    bankName: "Ziraat Bankası",
    bankIban: "TR12 0001 0023 4567 8901 2345 67",
    socialWhatsapp: "05441494851",
    topBarText1: "Türkiye'nin Her Yerine Güvenli Sevkiyat",
    topBarText2: "%100 Yerli & Kendi İmalatımız",
    pricingRules: "[]",
    shippingCarriers: "[]",
    themeTemplates: "[]",
    contentAnywhereRules: "[]",
    savedSectionTemplates: "[]",
    popupConfig: "{}",
    faqData: JSON.stringify([
      {
        category: "Sipariş ve Kargo",
        iconName: "Truck",
        questions: [
          { q: "Siparişim ne zaman kargoya verilir?", a: "Hafta içi saat 15:00'e kadar verilen siparişler aynı gün kargoya teslim edilmektedir." },
          { q: "Kargomu nasıl takip edebilirim?", a: "Sitemizin alt kısmında bulunan 'Kargom Nerede?' sayfasından veya Hesabım > Siparişlerim menüsünden takip edebilirsiniz." },
          { q: "Kargo ücreti ne kadar?", a: "B2B siparişlerinizde 5000 TL ve üzeri siparişlerde kargo ücretsizdir. Diğer siparişler için standart kargo ücreti 150 TL'dir." }
        ]
      },
      {
        category: "Ürün ve Üretim",
        iconName: "ShieldCheck",
        questions: [
          { q: "Arı körükleriniz hangi malzemeden imal edilmektedir?", a: "Tüm Pekefe Pro körüklerimiz paslanma ve kararmaya karşı son derece dayanıklı 304 sınıf paslanmaz çelikten kendi imalat tesislerimizde yerli olarak üretilmektedir." },
          { q: "Ürünlerin garanti kapsamı nedir?", a: "PEKEFE Geleneksel & Doğal Lezzetler olarak ürettiğimiz tüm paslanmaz körükler ve arıcı elbiseleri imalat ve tasarım hatalarına karşı 2 yıl üretici garantisi altındadır." }
        ]
      },
      {
        category: "B2B ve Ödeme",
        iconName: "CreditCard",
        questions: [
          { q: "B2B / Toptan alım yapabilir miyim?", a: "Evet. Şirket evraklarınızla B2B portalımızdan anında başvuru yapabilir, toptan fiyatlara ve vadeli açık hesap ödemelerine erişebilirsiniz." },
          { q: "Ödeme yöntemleriniz nelerdir?", a: "B2B portalımız üzerinden kredi kartı (taksit imkanı ile) veya havale/EFT yoluyla güvenle ödeme yapabilirsiniz." }
        ]
      }
    ])
  };

  await prisma.cMSData.upsert({
    where: { id: 'singleton' },
    update: cmsDataFields,
    create: {
      id: 'singleton',
      ...cmsDataFields
    }
  })

  // 12. CMS Pages
  await prisma.cMSPage.upsert({
    where: { slug: '/' },
    update: {
      name: 'Ana Sayfa',
      status: 'Yayında',
      sections: JSON.stringify([
        { id: "s1", type: "hero", title: "Büyük Karşılama (Hero)", content: { heroTitle: "Arıcılığın Gücünü Hissedin.", heroSubtitle: "Fabrikadan direkt, PEKEFE profesyonel körük ve ekipmanlarıyla kovanlarınızı ustaca yönetin.", buttonText: "Ürünleri Keşfet" } },
        { id: "s2", type: "features", title: "Özellikler (Grid)", content: { items: 3 } }
      ])
    },
    create: {
      name: 'Ana Sayfa',
      slug: '/',
      status: 'Yayında',
      sections: JSON.stringify([
        { id: "s1", type: "hero", title: "Büyük Karşılama (Hero)", content: { heroTitle: "Arıcılığın Gücünü Hissedin.", heroSubtitle: "Fabrikadan direkt, PEKEFE profesyonel körük ve ekipmanlarıyla kovanlarınızı ustaca yönetin.", buttonText: "Ürünleri Keşfet" } },
        { id: "s2", type: "features", title: "Özellikler (Grid)", content: { items: 3 } }
      ])
    }
  });

  const hakkimizdaSections = JSON.stringify([
    {
      id: "hero",
      type: "hero",
      title: "Hero Bölümü",
      content: {
        badge: "%100 Yerli İmalat Güvencesi",
        title: "Kovanlarınız İçin Teknoloji & Güven",
        subtitle: "2021 yılından beri geleneksel geleneksel lezzetler deneyimini modern üretim teknolojileriyle birleştiriyor, arıcılarımızın emeğine yüksek kaliteli ekipmanlarımızla değer katıyoruz."
      }
    },
    {
      id: "story",
      type: "story",
      title: "Hikayemiz",
      content: {
        badge: "Hikayemiz",
        title: "Arıcılığın Geleceğine Güvenli Dokunuş: Biz Kimiz?",
        paragraphs: [
          "2021 yılında, doğal gıda sektörünün en temel ve hayati ihtiyaçlarından biri olan arıcı körüğü üretimiyle yolculuğumuza başladık. Kuruluşumuzdan bu yana, geleneksel geleneksel lezzetler kültürünü modern üretim teknolojileriyle harmanlayarak, hem arıcılarımızın işini kolaylaştırmayı hem de arı kolonilerinin sağlığını korumayı kendimize misyon edindik.",
          "Kısa sürede üretim kapasitemizi ve ürün çeşitliliğimizi artırarak, sektörde kalitenin ve güvenin adresi konumuna geldik. Bugün, yüksek malzeme kalitesine sahip, dayanıklı ve ergonomik arıcı körüklerimizin yanı sıra, doğal gıda sektörünün tüm ihtiyaçlarına yanıt veren geniş bir ürün yelpazesini PEKEFE Geleneksel & Doğal Lezzetler markamız altında tek bir çatıda buluşturuyoruz."
        ],
        bullets: [
          "Kendi Tesisimizde Kalın Sac İmalatı",
          "Patentli Çift Kanallı Sönmez Sistem",
          "Arı Sağlığına Dost Isı Yalıtımı",
          "Türkiye'nin 81 İline Anında Sevkiyat"
        ],
        foundingYear: "2021",
        foundingText: "2021'den bu yana Erzurum fabrikamızda 304 paslanmaz çelik saclarla üretilen yerli ve orijinal PEKEFE ekipmanları."
      }
    },
    {
      id: "mission-vision",
      type: "mission-vision",
      title: "Misyon & Vizyon",
      content: {
        missionTitle: "Misyonumuz",
        missionText: "Arıcılarımızın emeklerine değer katacak, en zorlu saha şartlarında bile yüksek performans gösterecek birinci sınıf yöresel ürünlernı üretmek ve güvenilir tedarik ağımızla Türkiye'nin dört bir yanına ulaştırmaktır.",
        visionTitle: "Vizyonumuz",
        visionText: "Yenilikçi AR-GE yatırımlarımızla, Türkiye'de arıcı körüğü ve yöresel ürünler denildiğinde akla gelen ilk yerli üretici olmak ve kalitemizi küresel pazara taşıyarak uluslararası standartlarda öncü bir marka haline gelmektir."
      }
    },
    {
      id: "stats",
      type: "stats",
      title: "Rakamlarla Biz",
      content: {
        title: "Rakamlarla PEKEFE Geleneksel & Doğal Lezzetler",
        items: [
          { value: "2021", label: "Kuruluş Yılı" },
          { value: "3.500+", label: "Memnun Arıcı Müşteri" },
          { value: "%100", label: "Yerli İmalat & Tasarım" }
        ]
      }
    }
  ]);

  await prisma.cMSPage.upsert({
    where: { slug: '/hakkimizda' },
    update: {
      name: 'Hakkımızda',
      status: 'Yayında',
      sections: hakkimizdaSections
    },
    create: {
      name: 'Hakkımızda',
      slug: '/hakkimizda',
      status: 'Yayında',
      sections: hakkimizdaSections
    }
  });

  await prisma.cMSPage.upsert({
    where: { slug: '/about' },
    update: {
      name: 'Hakkımızda (Eski)',
      status: 'Taslak',
      sections: JSON.stringify([])
    },
    create: {
      name: 'Hakkımızda (Eski)',
      slug: '/about',
      status: 'Taslak',
      sections: JSON.stringify([])
    }
  });

  // Populate default stock locations for all products
  console.log('Populating stock locations...');
  const allProducts = await prisma.product.findMany({});
  for (const prod of allProducts) {
    // 80% to Merkez Depo (1)
    const stock1 = Math.round(prod.stock * 0.8);
    const reserved1 = Math.round(prod.stock * 0.1);
    await prisma.stockLocation.create({
      data: {
        productId: prod.id,
        warehouseId: '1',
        stock: stock1,
        reserved: reserved1,
        minStock: prod.criticalLimit,
        criticalLimit: Math.round(prod.criticalLimit * 1.5),
        rack: 'A-1'
      }
    });

    // 20% to Şube Depo (2)
    const stock2 = Math.round(prod.stock * 0.2);
    await prisma.stockLocation.create({
      data: {
        productId: prod.id,
        warehouseId: '2',
        stock: stock2,
        reserved: 0,
        minStock: Math.round(prod.criticalLimit * 0.5),
        criticalLimit: Math.round(prod.criticalLimit * 0.8),
        rack: 'B-2'
      }
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
