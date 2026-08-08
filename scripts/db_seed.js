const { PrismaClient } = require("../src/generated-client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("[PEKEFE FULL SEED] Initializing products, warehouses, categories & admin accounts...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Clear old sample data safely if needed
  try {
    await prisma.authLog.deleteMany({}).catch(() => {});
  } catch (e) {}

  // 2. Default Branches
  const defaultBranch = await prisma.branch.upsert({
    where: { code: 'BR-MRKZ' },
    update: { name: 'Merkez Şube', address: 'Manisa OSB', phone: '0236 111 22 33' },
    create: {
      id: 'default-branch',
      name: 'Merkez Şube',
      code: 'BR-MRKZ',
      address: 'Manisa OSB',
      phone: '0236 111 22 33'
    }
  });

  const subeBranch = await prisma.branch.upsert({
    where: { code: 'BR-IST' },
    update: { name: 'İstanbul Şubesi', address: 'Ataşehir, İstanbul', phone: '0216 111 22 33' },
    create: {
      id: 'sube-branch',
      name: 'İstanbul Şubesi',
      code: 'BR-IST',
      address: 'Ataşehir, İstanbul',
      phone: '0216 111 22 33'
    }
  });

  // 3. Warehouses
  const merkezDepo = await prisma.warehouse.upsert({
    where: { code: 'WH-MRKZ' },
    update: { name: 'Merkez Depo', type: 'Merkez', address: 'Erzurum OSB, 3. Cadde' },
    create: {
      id: '1',
      name: 'Merkez Depo',
      code: 'WH-MRKZ',
      type: 'Merkez',
      address: 'Erzurum OSB, 3. Cadde',
      branchId: defaultBranch.id
    }
  });

  const subeDepo = await prisma.warehouse.upsert({
    where: { code: 'WH-SUBE' },
    update: { name: 'Şube Depo', type: 'Şube', address: 'İstanbul Anadolu Yakası' },
    create: {
      id: '2',
      name: 'Şube Depo',
      code: 'WH-SUBE',
      type: 'Şube',
      address: 'İstanbul Anadolu Yakası',
      branchId: subeBranch.id
    }
  });

  // 4. Users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nexab2b.com' },
    update: { password: hashedPassword, role: 'SUPER_ADMIN', isApproved: true },
    create: {
      email: 'admin@nexab2b.com',
      name: 'Nexa Admin (Super)',
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
      name: 'Nexa Yönetici',
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
      name: 'Ahmet Yılmaz',
      password: hashedPassword,
      role: 'DEALER',
      isApproved: true
    }
  });

  // 5. Categories
  await prisma.categoryDetail.upsert({
    where: { name: 'geleneksel lezzetler' },
    update: {},
    create: {
      name: 'geleneksel lezzetler',
      attributes: [
        { name: "Malzeme", type: "text", isRequired: true },
        { name: "Hava Kanalı", type: "text", isRequired: false }
      ],
      variants: ["Boyut"]
    }
  }).catch(() => {});

  await prisma.categoryDetail.upsert({
    where: { name: 'yöresel ürünler' },
    update: {},
    create: {
      name: 'yöresel ürünler',
      attributes: [
        { name: "Malzeme", type: "text", isRequired: true },
        { name: "unit", type: "text", isRequired: false }
      ],
      variants: []
    }
  }).catch(() => {});

  // 6. Products
  const productsToSeed = [
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
      attributes: {
        "Malzeme": "304 Paslanmaz Çelik",
        "Hava Kanalı": "Patentli Çift Kanal",
        unit: "adet",
        barcode: "8680000000015"
      },
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
    },
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
    }
  ];

  for (const p of productsToSeed) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });

    // Populate stock locations
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
  }

  // 7. Blog Posts
  const defaultBlogPosts = [
    {
      title: "Geleneksel İspir Dut Pekmezi Nasıl Üretilir?",
      slug: "geleneksel-ispir-dut-pekmezi-nasil-uretilir",
      category: "Geleneksel Üretim",
      image: "/ispir-dut-hasadi.png",
      metaDesc: "İspir yaylalarında 2200m rakımda yetişen saf beyaz dutların bakır kazanlarda odun ateşinde pişirilme hikayesi.",
      content: `İspir'in el değmemiş 2200 metre üzerindeki yaylalarında yetişen saf beyaz dutlar, keten bezlere toplanır. Bakır kazanlarda meşe odunu ateşinde pişirilir.`,
      readTime: "5 dk okuma",
      isActive: true,
    },
    {
      title: "Ham Çiçek Balı ve İşlenmiş Bal Arasındaki 5 Temel Fark",
      slug: "ham-cicek-bali-ve-islenmis-bal-arasindaki-farklar",
      category: "Doğal Beslenme",
      image: "/ispir-kackar-yaylalari-manzara.webp",
      metaDesc: "Pastörize edilmemiş, 45 derece üzerinde ısıtılmamış hakiki ham çiçek balının zenginliği.",
      content: `Market raflarında gördüğünüz ballar ile doğadan kovan çıkışı elde edilen ham bal arasındaki farklar.`,
      readTime: "4 dk okuma",
      isActive: true,
    }
  ];

  for (const post of defaultBlogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post
    }).catch(() => {});
  }

  console.log("[PEKEFE FULL SEED] All products, warehouses, categories & admin accounts initialized successfully!");
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[PEKEFE FULL SEED] Error:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
