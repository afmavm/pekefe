const { PrismaClient } = require("../src/generated-client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("[PEKEFE DB SEED] Initializing database & default admin accounts...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Super Admin
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

  // 2. Manager
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

  // 3. Dealer (Bayi)
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

  console.log("[PEKEFE DB SEED] Success! Admin user: " + admin.email);
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[PEKEFE DB SEED] Error:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
