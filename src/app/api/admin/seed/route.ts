import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    console.log("[API SEED] Seeding admin users...");
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

    return NextResponse.json({
      success: true,
      message: "Admin ve test kullanıcıları veritabanına başarıyla yüklendi!",
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
