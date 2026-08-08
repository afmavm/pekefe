const { PrismaClient } = require("../src/generated-client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("[PEKEFE İSPİR SEED] Initializing authentic Pekefe İspir products & admin accounts...");
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
    update: { name: 'İspir Üretim Deposu', type: 'Merkez', address: 'İspir Tesisleri' },
    create: {
      id: '1',
      name: 'İspir Üretim Deposu',
      code: 'WH-MRKZ',
      type: 'Merkez',
      address: 'İspir Tesisleri',
      branchId: defaultBranch.id
    }
  });

  const subeDepo = await prisma.warehouse.upsert({
    where: { code: 'WH-SUBE' },
    update: { name: 'İstanbul Sevkiyat Deposu', type: 'Şube', address: 'İstanbul Anadolu Yakası' },
    create: {
      id: '2',
      name: 'İstanbul Sevkiyat Deposu',
      code: 'WH-SUBE',
      type: 'Şube',
      address: 'İstanbul Anadolu Yakası',
      branchId: subeBranch.id
    }
  });

  // 3. Admin & User Accounts
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
  await prisma.categoryDetail.upsert({
    where: { name: 'Geleneksel Lezzetler' },
    update: {},
    create: {
      name: 'Geleneksel Lezzetler',
      attributes: [
        { name: "Yöre", type: "text", isRequired: true },
        { name: "Gramaj", type: "text", isRequired: true }
      ],
      variants: ["Gramaj"]
    }
  }).catch(() => {});

  await prisma.categoryDetail.upsert({
    where: { name: 'Yöresel Ürünler' },
    update: {},
    create: {
      name: 'Yöresel Ürünler',
      attributes: [
        { name: "Rakım", type: "text", isRequired: false },
        { name: "Organik Sertifika", type: "text", isRequired: false }
      ],
      variants: []
    }
  }).catch(() => {});

  // 5. Authentic PEKEFE İspir Product Catalog
  const authenticProducts = [
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
      attributes: {
        "Yöre": "Erzurum / İspir",
        "Gramaj": "700 Gram",
        "Rakım": "2200 Metre",
        unit: "kavanoz",
        barcode: "8680000001012"
      },
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
      attributes: {
        "Yöre": "İspir Yaylaları",
        "Gramaj": "1000 Gram",
        unit: "paket",
        barcode: "8680000001029"
      },
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
      attributes: {
        "Rakım": "2200+ Metre",
        "Gramaj": "850 Gram",
        unit: "kavanoz",
        barcode: "8680000001036"
      },
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
      attributes: {
        "Yöre": "İspir",
        "Gramaj": "1000 Gram",
        unit: "paket",
        barcode: "8680000001043"
      },
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
      attributes: {
        "Gramaj": "500 Gram",
        unit: "paket",
        barcode: "8680000001050"
      },
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
      attributes: {
        "Yöre": "Erzurum",
        "Gramaj": "1000 Gram",
        unit: "paket",
        barcode: "8680000001067"
      },
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
      attributes: {
        "Gramaj": "1000 Gram",
        unit: "kg",
        barcode: "8680000001074"
      },
      images: []
    }
  ];

  let count = 0;
  for (const p of authenticProducts) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });

    await prisma.stockLocation.upsert({
      where: { id: `loc-merkez-${prod.id}` },
      update: { stock: Math.round(p.stock * 0.8), minStock: p.criticalLimit },
      create: {
        id: `loc-merkez-${prod.id}`,
        productId: prod.id,
        warehouseId: '1',
        stock: Math.round(p.stock * 0.8),
        reserved: 0,
        minStock: p.criticalLimit,
        criticalLimit: Math.round(p.criticalLimit * 1.5),
        rack: 'A-1'
      }
    }).catch(() => {});

    count++;
  }

  console.log(`[PEKEFE İSPİR SEED] Success! Loaded ${count} authentic Pekefe İspir products & admin users.`);
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[PEKEFE İSPİR SEED] Error:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
