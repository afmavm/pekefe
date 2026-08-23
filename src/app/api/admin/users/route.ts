import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { readUsersAndRoles, saveUsersAndRoles, DEFAULT_ROLES, ALL_PERMISSIONS, SubUser } from '@/lib/jsonUserDb';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const data = readUsersAndRoles();
      return NextResponse.json({
        success: true,
        users: data.users,
        roles: data.roles || DEFAULT_ROLES,
        permissions: ALL_PERMISSIONS
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);

export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    try {
      const body = await req.json();
      const { name, email, phone, role, customPermissions, department, warehouseId, password, status = "active" } = body;

      if (!name || !email) {
        return NextResponse.json({ success: false, error: "Ad Soyad ve E-posta zorunludur." }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const data = readUsersAndRoles();

      const existingUser = data.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        return NextResponse.json({ success: false, error: "Bu e-posta adresine sahip bir kullanıcı zaten mevcut." }, { status: 400 });
      }

      const roleObj = data.roles.find(r => r.name === role || r.id === role);
      const roleLabel = roleObj ? roleObj.label : role;

      const newUser: SubUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        email: cleanEmail,
        phone: phone || "",
        role: role || "STOCK_MANAGER",
        roleLabel: roleLabel,
        customPermissions: Array.isArray(customPermissions) ? customPermissions : (roleObj ? roleObj.permissions : []),
        department: department || "",
        warehouseId: warehouseId || "",
        status: status === "passive" ? "passive" : "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Also hash password and sync to Prisma DB if possible
      if (password) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);
          newUser.passwordHash = hash;

          await withTimeout(
            prisma.user.upsert({
              where: { email: cleanEmail },
              update: {
                name: newUser.name,
                role: newUser.role,
                password_hash: hash
              },
              create: {
                name: newUser.name,
                email: cleanEmail,
                role: newUser.role,
                password_hash: hash
              }
            }),
            2500,
            null
          );
        } catch (dbErr) {
          console.warn("[USER SYNC WARNING] DB user sync skipped:", dbErr);
        }
      }

      data.users.unshift(newUser);
      saveUsersAndRoles(data);

      return NextResponse.json({ success: true, user: newUser, message: "Kullanıcı başarıyla oluşturuldu." });
    } catch (error: any) {
      console.error("Error creating sub-user:", error);
      return NextResponse.json({ success: false, error: error.message || "Kullanıcı oluşturulamadı." }, { status: 500 });
    }
  }
);

export const PUT = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    try {
      const body = await req.json();
      const { id, name, email, phone, role, customPermissions, department, warehouseId, password, status } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Kullanıcı ID zorunludur." }, { status: 400 });
      }

      const data = readUsersAndRoles();
      const userIndex = data.users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        return NextResponse.json({ success: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
      }

      const roleObj = data.roles.find(r => r.name === role || r.id === role);
      const roleLabel = roleObj ? roleObj.label : role;

      const existing = data.users[userIndex];
      const updatedUser: SubUser = {
        ...existing,
        name: name !== undefined ? name.trim() : existing.name,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        role: role !== undefined ? role : existing.role,
        roleLabel: roleLabel || existing.roleLabel,
        customPermissions: Array.isArray(customPermissions) ? customPermissions : existing.customPermissions,
        department: department !== undefined ? department : existing.department,
        warehouseId: warehouseId !== undefined ? warehouseId : existing.warehouseId,
        status: status !== undefined ? status : existing.status,
        updatedAt: new Date().toISOString()
      };

      if (password && password.trim()) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);
          updatedUser.passwordHash = hash;

          await withTimeout(
            prisma.user.update({
              where: { email: updatedUser.email },
              data: { password_hash: hash, role: updatedUser.role, name: updatedUser.name }
            }),
            2500,
            null
          );
        } catch (dbErr) {
          console.warn("[USER PASSWORD UPDATE WARNING]:", dbErr);
        }
      }

      data.users[userIndex] = updatedUser;
      saveUsersAndRoles(data);

      return NextResponse.json({ success: true, user: updatedUser, message: "Kullanıcı başarıyla güncellendi." });
    } catch (error: any) {
      console.error("Error updating sub-user:", error);
      return NextResponse.json({ success: false, error: error.message || "Kullanıcı güncellenemedi." }, { status: 500 });
    }
  }
);

export const DELETE = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ success: false, error: "Kullanıcı ID zorunludur." }, { status: 400 });
      }

      const data = readUsersAndRoles();
      const userToDelete = data.users.find(u => u.id === id);

      if (!userToDelete) {
        return NextResponse.json({ success: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
      }

      if (userToDelete.role === "SUPER_ADMIN" && data.users.filter(u => u.role === "SUPER_ADMIN").length <= 1) {
        return NextResponse.json({ success: false, error: "Sistemde en az 1 Süper Yönetici kalmalıdır." }, { status: 400 });
      }

      data.users = data.users.filter(u => u.id !== id);
      saveUsersAndRoles(data);

      return NextResponse.json({ success: true, message: "Kullanıcı başarıyla silindi." });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message || "Kullanıcı silinemedi." }, { status: 500 });
    }
  }
);
