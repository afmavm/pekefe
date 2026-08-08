import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    console.log("[API SEED] Seeding full products & admin users...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Branches
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

    // 2. Warehouses
    await prisma.warehouse.upsert({
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

    await prisma.warehouse.upsert({
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

    // 3. Super Admin
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

    await prisma.user.upsert({
      where: { email: "ahmet@zeta.com" },
      update: { password: hashedPassword, role: "DEALER", isApproved: true },
      create: {
        email: "ahmet@zeta.com",
        name: "Ahmet Yilmaz (Bayi)",
        password: hashedPassword,
        role: "DEALER",
        isApproved: true,
      },
    });

    // 4. Products & Stock
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

    let seededCount = 0;
    for (const p of productsToSeed) {
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

      seededCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${seededCount} adet ürün, depolar, stok bakiyeleri ve admin kullanıcıları başarıyla veritabanına yüklendi!`,
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
