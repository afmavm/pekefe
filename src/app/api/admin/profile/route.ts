import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { readUsersAndRoles, saveUsersAndRoles } from '@/lib/jsonUserDb';
import { prisma, withTimeout } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Oturum açılmamış." }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const data = readUsersAndRoles();
    const user = data.users.find(u => u.email.toLowerCase() === email);

    if (user) {
      const { passwordHash, ...safeUser } = user;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // Fallback from session
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id || "current-user",
        name: session.user.name || "Yönetici",
        email: session.user.email,
        role: session.user.role || "SUPER_ADMIN",
        roleLabel: session.user.role === "SUPER_ADMIN" ? "Süper Yönetici" : session.user.role,
        department: "Yönetim",
        status: "active",
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Oturum açılmamış." }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, department, currentPassword, newPassword } = body;
    const email = session.user.email.toLowerCase();

    const data = readUsersAndRoles();
    const userIndex = data.users.findIndex(u => u.email.toLowerCase() === email);

    if (userIndex !== -1) {
      const user = data.users[userIndex];

      if (newPassword && newPassword.trim()) {
        if (user.passwordHash && currentPassword) {
          const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
          if (!isMatch) {
            return NextResponse.json({ success: false, error: "Mevcut şifreniz hatalı." }, { status: 400 });
          }
        }
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword.trim(), salt);
      }

      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone;
      if (department !== undefined) user.department = department;
      user.updatedAt = new Date().toISOString();

      data.users[userIndex] = user;
      saveUsersAndRoles(data);

      // Sync Prisma
      try {
        await withTimeout(
          prisma.user.update({
            where: { email: email },
            data: {
              name: user.name,
              ...(user.passwordHash ? { password: user.passwordHash } : {})
            }
          }),
          2500,
          null
        );
      } catch (dbErr) {
        console.warn("[PROFILE UPDATE DB SYNC WARNING]:", dbErr);
      }

      return NextResponse.json({ success: true, message: "Profiliniz başarıyla güncellendi." });
    }

    return NextResponse.json({ success: true, message: "Profil bilgileri kaydedildi." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Güncellenemedi." }, { status: 500 });
  }
}
