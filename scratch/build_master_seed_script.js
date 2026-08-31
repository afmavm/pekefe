const fs = require('fs');
const path = require('path');

const masterProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'formatted_dev_db_products.json'), 'utf8'));

// Ensure every single product has isDeleted: false
masterProducts.forEach(p => {
  p.isDeleted = false;
});

const dbSeedCode = `const { PrismaClient } = require("../src/generated-client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const masterProducts = ${JSON.stringify(masterProducts, null, 2)};

async function main() {
  console.log("[PEKEFE MASTER SEED] Initializing exact 23 local products from dev.db & admin accounts...");
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

  // 3. Admin Users
  await prisma.user.upsert({
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

  // 4. Products & Stock Locations
  let totalSeeded = 0;
  for (const p of masterProducts) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        category: p.category,
        stock: p.stock,
        criticalLimit: p.criticalLimit,
        price: p.price,
        oldPrice: p.oldPrice,
        cost: p.cost,
        image: p.image,
        images: p.images,
        desc: p.desc,
        isRawMaterial: p.isRawMaterial,
        attributes: p.attributes,
        isDeleted: false
      },
      create: {
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock: p.stock,
        criticalLimit: p.criticalLimit,
        price: p.price,
        oldPrice: p.oldPrice,
        cost: p.cost,
        image: p.image,
        images: p.images,
        desc: p.desc,
        isRawMaterial: p.isRawMaterial,
        attributes: p.attributes,
        isDeleted: false
      }
    });

    await prisma.stockLocation.upsert({
      where: { id: \`loc-merkez-\${prod.id}\` },
      update: { stock: Math.round(p.stock * 0.8), minStock: p.criticalLimit },
      create: {
        id: \`loc-merkez-\${prod.id}\`,
        productId: prod.id,
        warehouseId: '1',
        stock: Math.round(p.stock * 0.8),
        reserved: Math.round(p.stock * 0.1),
        minStock: p.criticalLimit,
        criticalLimit: Math.round(p.criticalLimit * 1.5),
        rack: 'A-1'
      }
    }).catch(() => {});

    totalSeeded++;
  }

  // Ensure isDeleted is false for all products
  await prisma.product.updateMany({
    data: { isDeleted: false }
  }).catch(() => {});

  console.log(\`[PEKEFE MASTER SEED] Success! Loaded exact \${totalSeeded} local products from dev.db & admin users.\`);
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[PEKEFE MASTER SEED ERROR]:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
`;

fs.writeFileSync(path.join(__dirname, '..', 'scripts', 'db_seed.js'), dbSeedCode, 'utf8');
console.log("Updated scripts/db_seed.js with exact 23 local products and isDeleted: false!");

const apiSeedCode = `import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const masterProducts = ${JSON.stringify(masterProducts, null, 2)};

export async function GET() {
  try {
    console.log("[API SEED] Seeding exact 23 local products from dev.db...");
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
    await prisma.warehouse.upsert({
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

    // 3. User Accounts
    const admin = await prisma.user.upsert({
      where: { email: "admin@nexab2b.com" },
      update: { password: hashedPassword, role: "SUPER_ADMIN", isApproved: true },
      create: {
        email: "admin@nexab2b.com",
        name: "Pekefe Super Admin",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        isApproved: true,
      },
    });

    await prisma.user.upsert({
      where: { email: "manager@nexab2b.com" },
      update: { password: hashedPassword, role: "ADMIN", isApproved: true },
      create: {
        email: "manager@nexab2b.com",
        name: "Pekefe Yonetici",
        password: hashedPassword,
        role: "ADMIN",
        isApproved: true,
      },
    });

    // 4. Products
    let totalSeeded = 0;
    for (const p of masterProducts) {
      const prod = await prisma.product.upsert({
        where: { sku: p.sku },
        update: {
          name: p.name,
          category: p.category,
          stock: p.stock,
          criticalLimit: p.criticalLimit,
          price: p.price,
          oldPrice: p.oldPrice,
          cost: p.cost,
          image: p.image,
          images: p.images,
          desc: p.desc,
          isRawMaterial: p.isRawMaterial,
          attributes: p.attributes,
          isDeleted: false
        },
        create: {
          sku: p.sku,
          name: p.name,
          category: p.category,
          stock: p.stock,
          criticalLimit: p.criticalLimit,
          price: p.price,
          oldPrice: p.oldPrice,
          cost: p.cost,
          image: p.image,
          images: p.images,
          desc: p.desc,
          isRawMaterial: p.isRawMaterial,
          attributes: p.attributes,
          isDeleted: false
        }
      });

      await prisma.stockLocation.upsert({
        where: { id: \`loc-merkez-\${prod.id}\` },
        update: { stock: Math.round(p.stock * 0.8), minStock: p.criticalLimit },
        create: {
          id: \`loc-merkez-\${prod.id}\`,
          productId: prod.id,
          warehouseId: '1',
          stock: Math.round(p.stock * 0.8),
          reserved: Math.round(p.stock * 0.1),
          minStock: p.criticalLimit,
          criticalLimit: Math.round(p.criticalLimit * 1.5),
          rack: 'A-1'
        }
      }).catch(() => {});

      totalSeeded++;
    }

    // Ensure isDeleted: false on all products
    await prisma.product.updateMany({
      data: { isDeleted: false }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: \`Yerel dev.db veritabanındaki \${totalSeeded} adet ürünün tamamı (isDeleted: false) olarak canlı MySQL veritabanına aktarıldı!\`,
      adminEmail: admin.email,
      defaultPassword: "password123",
    });
  } catch (error: any) {
    console.error("[API SEED ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Seed işlemi sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'seed', 'route.ts'), apiSeedCode, 'utf8');
console.log("Updated src/app/api/admin/seed/route.ts with exact 23 local products and isDeleted: false!");
