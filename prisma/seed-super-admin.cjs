// @ts-nocheck
/* eslint-disable */
const path = require("path");
const { PrismaClient } = require(path.join(process.cwd(), "src/generated-client"));
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const FEATURE_MODULES = [
  { key: "b2b",        name: "B2B Bayi Portalı",      description: "B2B sipariş, bayi yönetimi ve fiyatlandırma modülü" },
  { key: "b2c",        name: "B2C E-Ticaret",          description: "Müşteri taraflı e-ticaret ve sipariş akışı" },
  { key: "inventory",  name: "Envanter & Depo (WMS)",  description: "Depo yönetimi, stok takibi ve transfer işlemleri" },
  { key: "production", name: "Üretim / MRP",           description: "Üretim planlaması, reçete ve iş emirleri" },
  { key: "accounting", name: "Muhasebe / ERP",         description: "Fatura, ödeme, muhasebe ve FIFO kapatma modülü" },
];

async function main() {
  console.log("🚀 Super Admin & Feature Modules Seed başlıyor...\n");

  // 1. Feature modülleri
  console.log("📦 Feature modülleri oluşturuluyor...");
  for (const fm of FEATURE_MODULES) {
    await prisma.featureModule.upsert({
      where: { key: fm.key },
      update: { name: fm.name, description: fm.description },
      create: { key: fm.key, name: fm.name, description: fm.description, isActive: true },
    });
    console.log("  ✅ " + fm.key + " — " + fm.name);
  }

  // 2. SUPER_ADMIN kullanıcısı
  console.log("\n👤 SUPER_ADMIN kullanıcısı oluşturuluyor...");
  const hashedPassword = await bcrypt.hash("SuperAdmin2024!", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@sistem.local" },
    update: { role: "SUPER_ADMIN", isApproved: true, password: hashedPassword },
    create: {
      email: "superadmin@sistem.local",
      name: "Süper Yönetici",
      role: "SUPER_ADMIN",
      isApproved: true,
      password: hashedPassword,
    },
  });
  console.log("  ✅ Super Admin: " + superAdmin.email + " | ID: " + superAdmin.id);

  // 3. Mevcut kullanıcıları listele
  console.log("\n👥 Mevcut kullanıcılar:");
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isApproved: true },
    orderBy: { role: "asc" },
  });
  for (const u of users) {
    const marker = u.role === "SUPER_ADMIN" ? "🔴" : u.role === "ADMIN" ? "🟡" : "🟢";
    console.log("  " + marker + " " + String(u.role || "").padEnd(15) + " | " + String(u.email || "").padEnd(40) + " | " + (u.name || "") + " | approved:" + u.isApproved);
  }

  // 4. Şirketler için tüm modülleri etkinleştir
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  const features  = await prisma.featureModule.findMany({ select: { id: true, key: true } });

  if (companies.length > 0) {
    console.log("\n🏢 " + companies.length + " şirket için feature izinleri ayarlanıyor...");
    for (const company of companies) {
      for (const feature of features) {
        await prisma.companyPermission.upsert({
          where: { companyId_featureModuleId: { companyId: company.id, featureModuleId: feature.id } },
          update: { isEnabled: true },
          create: { companyId: company.id, featureModuleId: feature.id, isEnabled: true },
        });
      }
      console.log("  ✅ " + company.name + " — tüm modüller aktif");
    }
  } else {
    console.log("\n⚠️  Kayıtlı şirket bulunamadı.");
  }

  console.log("\n✨ Seed tamamlandı!");
  console.log("─────────────────────────────────────────────");
  console.log("  Giriş E-posta : superadmin@sistem.local");
  console.log("  Şifre         : SuperAdmin2024!");
  console.log("─────────────────────────────────────────────");
}

main()
  .catch(e => { console.error("❌ Seed hatası:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
