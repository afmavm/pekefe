const { PrismaClient } = require("../src/generated-client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("[PEKEFE COMPREHENSIVE SEED] Syncing all products, warehouses, stock levels, current accounts, banks & CMS data...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Branches
  const defaultBranch = await prisma.branch.upsert({
    where: { code: 'BR-MRKZ' },
    update: { name: 'İspir Merkez Tesis', address: 'İspir, Erzurum', phone: '0544 149 4851' },
    create: {
      id: 'default-branch',
      name: 'İspir Merkez Tesis',
      code: 'BR-MRKZ',
      address: 'İspir, Erzurum',
      phone: '0544 149 4851'
    }
  });

  const subeBranch = await prisma.branch.upsert({
    where: { code: 'BR-IST' },
    update: { name: 'İstanbul Dağıtım Şubesi', address: 'Ataşehir, İstanbul', phone: '0216 111 22 33' },
    create: {
      id: 'sube-branch',
      name: 'İstanbul Dağıtım Şubesi',
      code: 'BR-IST',
      address: 'Ataşehir, İstanbul',
      phone: '0216 111 22 33'
    }
  });

  // 2. Warehouses
  const merkezDepo = await prisma.warehouse.upsert({
    where: { code: 'WH-MRKZ' },
    update: { name: 'İspir Üretim & Merkez Depo', type: 'Merkez', address: 'Erzurum OSB, 3. Cadde', branchId: defaultBranch.id },
    create: {
      id: '1',
      name: 'İspir Üretim & Merkez Depo',
      code: 'WH-MRKZ',
      type: 'Merkez',
      address: 'Erzurum OSB, 3. Cadde',
      branchId: defaultBranch.id
    }
  });

  const subeDepo = await prisma.warehouse.upsert({
    where: { code: 'WH-SUBE' },
    update: { name: 'İstanbul Sevkiyat Şube Depo', type: 'Şube', address: 'İstanbul Anadolu Yakası', branchId: subeBranch.id },
    create: {
      id: '2',
      name: 'İstanbul Sevkiyat Şube Depo',
      code: 'WH-SUBE',
      type: 'Şube',
      address: 'İstanbul Anadolu Yakası',
      branchId: subeBranch.id
    }
  });

  const uretimBandi = await prisma.warehouse.upsert({
    where: { code: 'WH-URT' },
    update: { name: 'Üretim Bandı & Hammadde Deposu', type: 'Üretim', address: 'Yakutiye Fabrika Alanı', branchId: defaultBranch.id },
    create: {
      id: '3',
      name: 'Üretim Bandı & Hammadde Deposu',
      code: 'WH-URT',
      type: 'Üretim',
      address: 'Yakutiye Fabrika Alanı',
      branchId: defaultBranch.id
    }
  });

  // 3. User Accounts
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nexab2b.com' },
    update: { password: hashedPassword, role: 'SUPER_ADMIN', isApproved: true },
    create: {
      email: 'admin@nexab2b.com',
      name: 'Pekefe Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isApproved: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'manager@nexab2b.com' },
    update: { password: hashedPassword, role: 'ADMIN', isApproved: true },
    create: {
      email: 'manager@nexab2b.com',
      name: 'Pekefe Genel Yönetici',
      password: hashedPassword,
      role: 'ADMIN',
      isApproved: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'branch_manager@pekefe.com' },
    update: { password: hashedPassword, role: 'BRANCH_MANAGER', isApproved: true, branchId: subeBranch.id },
    create: {
      email: 'branch_manager@pekefe.com',
      name: 'Ahmet Şube Yöneticisi',
      password: hashedPassword,
      role: 'BRANCH_MANAGER',
      isApproved: true,
      branchId: subeBranch.id
    }
  });

  await prisma.user.upsert({
    where: { email: 'warehouse_supervisor@pekefe.com' },
    update: { password: hashedPassword, role: 'WAREHOUSE_SUPERVISOR', isApproved: true, branchId: subeBranch.id, warehouseId: subeDepo.id },
    create: {
      email: 'warehouse_supervisor@pekefe.com',
      name: 'Mehmet Depo Sorumlusu',
      password: hashedPassword,
      role: 'WAREHOUSE_SUPERVISOR',
      isApproved: true,
      branchId: subeBranch.id,
      warehouseId: subeDepo.id
    }
  });

  await prisma.user.upsert({
    where: { email: 'sales_staff@pekefe.com' },
    update: { password: hashedPassword, role: 'SALES_STAFF', isApproved: true, branchId: subeBranch.id },
    create: {
      email: 'sales_staff@pekefe.com',
      name: 'Veli Satış Personeli',
      password: hashedPassword,
      role: 'SALES_STAFF',
      isApproved: true,
      branchId: subeBranch.id
    }
  });

  await prisma.user.upsert({
    where: { email: 'ahmet@zeta.com' },
    update: { password: hashedPassword, role: 'DEALER', isApproved: true },
    create: {
      email: 'ahmet@zeta.com',
      name: 'Ahmet Yılmaz (Bayi)',
      password: hashedPassword,
      role: 'DEALER',
      isApproved: true
    }
  });

  // 4. Categories
  const categories = [
    { name: 'Geleneksel Lezzetler', attributes: [{ name: "Yöre", type: "text", isRequired: true }, { name: "Gramaj", type: "text", isRequired: true }], variants: ["Gramaj"] },
    { name: 'Yöresel Ürünler', attributes: [{ name: "Rakım", type: "text", isRequired: false }, { name: "unit", type: "text", isRequired: false }], variants: [] },
    { name: 'geleneksel lezzetler', attributes: [{ name: "Malzeme", type: "text", isRequired: true }], variants: ["Boyut"] },
    { name: 'yöresel ürünler', attributes: [{ name: "Malzeme", type: "text", isRequired: true }], variants: [] },
    { name: 'Hammadde', attributes: [{ name: "unit", type: "text", isRequired: false }], variants: [] },
    { name: 'Tekstil', attributes: [{ name: "Marka", type: "text", isRequired: true }], variants: ["Renk", "Beden"] }
  ];

  for (const cat of categories) {
    await prisma.categoryDetail.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat
    }).catch(() => {});
  }

  // 5. Complete Comprehensive Product List (Authentic Delicacies + Production/Hardware items)
  const fullProductsToSeed = [
    // Authentic İspir Delicacies
    {
      sku: 'PEKEFE-PEKMEZ-01',
      name: 'Geleneksel İspir Dut Pekmezi (700g Cam Kavanoz)',
      category: 'Geleneksel Lezzetler',
      stock: 350,
      criticalLimit: 30,
      price: 320,
      cost: 140,
      image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
      desc: "İspir yaylalarında 2200m rakımda yetişen saf beyaz dutların bakır kazanlarda odun ateşinde ağır ağır pişirilmiş geleneksel lezzeti.",
      attributes: { "Yöre": "Erzurum / İspir", "Gramaj": "700 Gram", "Rakım": "2200 Metre", unit: "kavanoz", barcode: "8680000001012" },
      images: []
    },
    {
      sku: 'PEKEFE-FASULYE-01',
      name: 'Coğrafi İşaretli Hakiki İspir Kuru Fasulyesi (1000g)',
      category: 'Geleneksel Lezzetler',
      stock: 500,
      criticalLimit: 50,
      price: 240,
      cost: 110,
      image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&q=80&w=800",
      desc: "İspir'in kendine has toprak ve iklim yapısında yetişen, erken pişen ve kabuk atmayan tescilli coğrafi işaretli İspir kuru fasulyesi.",
      attributes: { "Yöre": "İspir Yaylaları", "Gramaj": "1000 Gram", unit: "paket", barcode: "8680000001029" },
      images: []
    },
    {
      sku: 'PEKEFE-BAL-01',
      name: 'Kaçkar Ham Çiçek Balı (2200m Rakım - 850g)',
      category: 'Yöresel Ürünler',
      stock: 200,
      criticalLimit: 25,
      price: 650,
      cost: 280,
      image: "/ispir-kackar-yaylalari-manzara.webp",
      desc: "Pastörize edilmemiş, 45 derece üzerinde ısıtılmamış, polen ve canlı enzim zengini %100 saf Kaçkar yayla ham çiçek balı.",
      attributes: { "Rakım": "2200+ Metre", "Gramaj": "850 Gram", unit: "kavanoz", barcode: "8680000001036" },
      images: []
    },
    {
      sku: 'PEKEFE-KOME-01',
      name: 'Cevizli İspir Kömesi (1000g İplik Köme)',
      category: 'Geleneksel Lezzetler',
      stock: 180,
      criticalLimit: 20,
      price: 380,
      cost: 160,
      image: "/ispir-pestil-kurutma-gercek.png",
      desc: "Süt, nişasta ve süzme dut şırasının bakır kazanlarda pişirilmesi ve yerli İspir cevizlerinin dizilmesiyle güneşte kurutulan geleneksel köme.",
      attributes: { "Yöre": "İspir", "Gramaj": "1000 Gram", unit: "paket", barcode: "8680000001043" },
      images: []
    },
    {
      sku: 'PEKEFE-PESTIL-01',
      name: 'Geleneksel Yaprak Dut Pestili (500g)',
      category: 'Geleneksel Lezzetler',
      stock: 220,
      criticalLimit: 25,
      price: 220,
      cost: 90,
      image: "/ispir-pestil-kurutma-gercek.png",
      desc: "Geleneksel keten bezlerde dağ havasında kurutulmuş, hiçbir katkı ve ilave şeker içermeyen incecik yaprak dut pestili.",
      attributes: { "Gramaj": "500 Gram", unit: "paket", barcode: "8680000001050" },
      images: []
    },
    {
      sku: 'PEKEFE-PEYNIR-01',
      name: 'Erzurum Göğermiş Civil Peyniri (1000g)',
      category: 'Yöresel Ürünler',
      stock: 140,
      criticalLimit: 15,
      price: 290,
      cost: 130,
      image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&q=80&w=800",
      desc: "Doğal penisilin deposu, geleneksel yöntemlerle olgunlaştırılmış hakiki Erzurum küflü göğermiş civil peyniri.",
      attributes: { "Yöre": "Erzurum", "Gramaj": "1000 Gram", unit: "paket", barcode: "8680000001067" },
      images: []
    },
    {
      sku: 'PEKEFE-CEVIZ-01',
      name: 'İspir Yerli İnce Kabuk Cevizi (1000g)',
      category: 'Yöresel Ürünler',
      stock: 300,
      criticalLimit: 30,
      price: 310,
      cost: 140,
      image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=800",
      desc: "İspir vadisinde yetişen, elde kolayca kırılan, yüksek yağ oranına ve lezzete sahip yerli ince kabuk ceviz.",
      attributes: { "Gramaj": "1000 Gram", unit: "kg", barcode: "8680000001074" },
      images: []
    },
    // Production & Raw Materials
    {
      sku: 'RAW-SAC-01',
      name: '304 Paslanmaz Çelik Sac (Plaka)',
      category: 'Hammadde',
      stock: 500,
      criticalLimit: 100,
      cost: 350,
      price: 0,
      image: "https://placehold.co/100?text=Sac",
      isRawMaterial: true,
      images: [],
      attributes: {}
    },
    {
      sku: 'RAW-DERI-01',
      name: 'Körük Derisi ve Körük Körüğü',
      category: 'Hammadde',
      stock: 250,
      criticalLimit: 50,
      cost: 150,
      price: 0,
      image: "https://placehold.co/100?text=Deri",
      isRawMaterial: true,
      images: [],
      attributes: {}
    },
    {
      sku: 'HAM-SAC-GALV',
      name: 'Galvaniz Sac (Rulo)',
      category: 'Hammadde',
      stock: 4995,
      criticalLimit: 500,
      cost: 15,
      price: 35,
      image: "https://images.unsplash.com/photo-1518552796036-6e3e5b128522?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'kg' }
    },
    {
      sku: 'HAM-DERI-SUNI',
      name: 'Suni Deri (Rulo)',
      category: 'Hammadde',
      stock: 1999,
      criticalLimit: 200,
      cost: 30,
      price: 65,
      image: "https://images.unsplash.com/photo-1620600574044-67d739814eb3?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'm2' }
    },
    {
      sku: 'HAM-SUNTA',
      name: 'Ahşap Sunta Tutamaç',
      category: 'Hammadde',
      stock: 9980,
      criticalLimit: 500,
      cost: 2,
      price: 5,
      image: "https://images.unsplash.com/photo-1550985552-87fc03afb871?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'adet' }
    },
    {
      sku: 'HAM-YAY',
      name: 'Körük Yayı',
      category: 'Hammadde',
      stock: 14990,
      criticalLimit: 1000,
      cost: 0.8,
      price: 2,
      image: "https://images.unsplash.com/photo-1563223771-5fe403a4fd12?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'adet' }
    },
    {
      sku: 'HAM-MENTESE',
      name: 'Metal Menteşe',
      category: 'Hammadde',
      stock: 19980,
      criticalLimit: 1000,
      cost: 0.75,
      price: 1.5,
      image: "https://images.unsplash.com/photo-1589139591321-7dd21ffb858e?auto=format&fit=crop&q=80&w=400",
      isRawMaterial: true,
      images: [],
      attributes: { unit: 'adet' }
    },
    {
      sku: 'PEKEFE-KORUK-01',
      name: 'Pekefe Pro Paslanmaz Arı Körüğü',
      category: 'geleneksel lezzetler',
      stock: 150,
      criticalLimit: 20,
      price: 850,
      cost: 300,
      image: "/uploads/beekeeping_bellows_premium.png",
      desc: "Asırlık Erzurum kalitesi, patentli çift hava kanalı sayesinde hiç sönmeyen 304 paslanmaz arı körüğü.",
      attributes: { "Malzeme": "304 Paslanmaz Çelik", "Hava Kanalı": "Patentli Çift Kanal", unit: "adet", barcode: "8680000000015" },
      images: []
    },
    {
      sku: 'PEKEFE-ELBISE-01',
      name: 'Tam Koruma Arıcı Elbisesi',
      category: 'geleneksel lezzetler',
      stock: 80,
      criticalLimit: 10,
      price: 1200,
      cost: 500,
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800",
      desc: "3 katmanlı, nefes alabilir, arı sokmalarına karşı %100 güvenli profesyonel elbise.",
      attributes: { "Beden": "L/XL", "Katman Sayısı": "3 Katmanlı", unit: "adet", barcode: "8680000000022" },
      images: []
    },
    {
      sku: 'PEKEFE-SET-01',
      name: 'Kovan Bakım Seti',
      category: 'geleneksel lezzetler',
      stock: 120,
      criticalLimit: 15,
      price: 650,
      cost: 250,
      image: "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
      desc: "8 parça paslanmaz çelik aletler ve özel taşıma çantası içeren profesyonel kovan bakım seti.",
      attributes: { "Parça Sayısı": "8 Parça", "Çanta": "Dahil", unit: "adet", barcode: "8680000000039" },
      images: []
    },
    {
      sku: 'KORUK-GALV-01',
      name: 'Profesyonel Galvaniz Arıcı Körüğü',
      category: 'yöresel ürünler',
      stock: 10,
      criticalLimit: 5,
      price: 350,
      oldPrice: 455,
      isCampaignActive: true,
      cost: 85,
      image: "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
      desc: "Korozyona dayanıklı galvaniz kaplama, dayanıklı deri körük ve optimum hava üfleme kapasitesi.",
      attributes: { unit: 'adet' },
      images: []
    }
  ];

  let totalProducts = 0;
  for (const p of fullProductsToSeed) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });

    // Populate stock location for Merkez Depo (1)
    await prisma.stockLocation.upsert({
      where: { id: `loc-merkez-${prod.id}` },
      update: { stock: Math.round(p.stock * 0.8), minStock: p.criticalLimit },
      create: {
        id: `loc-merkez-${prod.id}`,
        productId: prod.id,
        warehouseId: '1',
        stock: Math.round(p.stock * 0.8),
        reserved: Math.round(p.stock * 0.1),
        minStock: p.criticalLimit,
        criticalLimit: Math.round(p.criticalLimit * 1.5),
        rack: 'A-1'
      }
    }).catch(() => {});

    // Populate stock location for Şube Depo (2)
    await prisma.stockLocation.upsert({
      where: { id: `loc-sube-${prod.id}` },
      update: { stock: Math.round(p.stock * 0.2), minStock: Math.round(p.criticalLimit * 0.5) },
      create: {
        id: `loc-sube-${prod.id}`,
        productId: prod.id,
        warehouseId: '2',
        stock: Math.round(p.stock * 0.2),
        reserved: 0,
        minStock: Math.round(p.criticalLimit * 0.5),
        criticalLimit: Math.round(p.criticalLimit * 0.8),
        rack: 'B-2'
      }
    }).catch(() => {});

    totalProducts++;
  }

  // 6. Current Accounts (Cariler & Bayiler)
  await prisma.currentAccount.upsert({
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
  }).catch(() => {});

  await prisma.currentAccount.upsert({
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
  }).catch(() => {});

  // 7. Banks
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
  }).catch(() => {});

  // 8. CMS Settings
  const cmsDataFields = {
    heroTitle: "2200m Rakımdan Sofranıza Doğallık.",
    heroSubtitle: "İspir yaylalarının leziz dut pekmezi, coğrafi işaretli kuru fasulyesi ve saf Kaçkar ham balı PEKEFE güvencesiyle.",
    buttonText: "Lezzetleri Keşfet",
    announcement: "Tüm Türkiye'ye Aynı Gün Kargo ve Üreticiden Hızlı Teslimat!",
    siteName: "PEKEFE Geleneksel & Doğal Lezzetler",
    primaryColor: "#b45309",
    siteDescription: "İspir Erzurum Geleneksel ve Doğal Yöresel Ürünler",
    footerSlogan: "ÜRETİCİDEN DİREKT SOFRANIZA",
    contactPhone: "0(544) 149 4851",
    contactEmail: "info@pekefe.com",
    contactAddress: "İspir Tesisleri, Erzurum",
    companyName: "PEKEFE Geleneksel & Doğal Lezzetler San. ve Tic. Ltd. Şti.",
    bankName: "Ziraat Bankası",
    bankIban: "TR12 0001 0023 4567 8901 2345 67",
    socialWhatsapp: "05441494851"
  };

  await prisma.cMSData.upsert({
    where: { id: 'singleton' },
    update: cmsDataFields,
    create: {
      id: 'singleton',
      ...cmsDataFields
    }
  }).catch(() => {});

  console.log(`[PEKEFE COMPREHENSIVE SEED] Success! Synced ${totalProducts} total products, warehouses, stock levels, current accounts, banks & CMS data.`);
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[PEKEFE COMPREHENSIVE SEED ERROR]:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
