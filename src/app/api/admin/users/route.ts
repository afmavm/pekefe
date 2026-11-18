import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { readUsersAndRoles, saveUsersAndRoles, DEFAULT_ROLES, ALL_PERMISSIONS, SubUser } from '@/lib/jsonUserDb';
import { readLocalAccounts, updateLocalAccount } from '@/lib/jsonCurrentAccountsDb';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const data = readUsersAndRoles();
      const roles = data.roles || DEFAULT_ROLES;
      let changed = false;

      // Sync any Prisma users into local store if reachable
      try {
        const dbUsers = await withTimeout(
          prisma.user.findMany({
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              password: true,
              isApproved: true,
              customer_type: true,
              warehouseId: true,
            }
          }),
          1500,
          []
        );

        for (const dbu of dbUsers) {
          if (!dbu.email) continue;
          const cleanEmail = dbu.email.trim().toLowerCase();
          const existingIdx = data.users.findIndex(u => u.email && u.email.toLowerCase() === cleanEmail);
          if (existingIdx === -1) {
            const roleObj = roles.find(r => r.name === dbu.role);
            data.users.push({
              id: dbu.id,
              name: dbu.name || cleanEmail.split("@")[0],
              email: cleanEmail,
              phone: "",
              role: dbu.role || "USER",
              roleLabel: roleObj ? roleObj.label : (dbu.role || "Müşteri"),
              customPermissions: roleObj ? roleObj.permissions : [],
              department: dbu.role === "USER" ? "Bireysel Müşteri" : dbu.role === "DEALER" ? "B2B Bayi" : "Genel",
              warehouseId: dbu.warehouseId || "",
              status: dbu.isApproved === false ? "passive" : "active",
              passwordHash: dbu.password || undefined,
              customer_type: (dbu.customer_type || "b2c") as any,
              isApproved: dbu.isApproved ?? true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            changed = true;
          } else if (dbu.password && !data.users[existingIdx].passwordHash) {
            data.users[existingIdx].passwordHash = dbu.password;
            changed = true;
          }
        }
      } catch {}

      if (changed) {
        saveUsersAndRoles(data);
      }

      const enrichedUsers = data.users.map(u => ({
        ...u,
        hasPassword: Boolean(u.passwordHash)
      }));

      return NextResponse.json({
        success: true,
        users: enrichedUsers,
        roles,
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

      if (password && password.trim().length < 6) {
        return NextResponse.json({ success: false, error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
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
        customer_type: role === "USER" ? "b2c" : "b2b",
        isApproved: status !== "passive",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Hash password and sync to Prisma DB
      if (password && password.trim()) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password.trim(), salt);
        newUser.passwordHash = hash;

        try {
          await withTimeout(
            prisma.user.upsert({
              where: { email: cleanEmail },
              update: {
                name: newUser.name,
                role: newUser.role,
                password: hash,
                isApproved: newUser.status === "active"
              },
              create: {
                name: newUser.name,
                email: cleanEmail,
                role: newUser.role,
                password: hash,
                isApproved: newUser.status === "active",
                customer_type: newUser.customer_type || "b2b"
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

      return NextResponse.json({
        success: true,
        user: { ...newUser, hasPassword: Boolean(newUser.passwordHash) },
        message: "Kullanıcı ve parolası başarıyla veritabanına kaydedildi."
      });
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

      if (!id && !email) {
        return NextResponse.json({ success: false, error: "Kullanıcı ID veya E-posta zorunludur." }, { status: 400 });
      }

      const data = readUsersAndRoles();
      const cleanEmail = email ? email.trim().toLowerCase() : "";
      const userIndex = data.users.findIndex(
        u => (id && u.id === id) || (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
      );

      if (userIndex === -1) {
        return NextResponse.json({ success: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
      }

      if (password && password.trim() && password.trim().length < 6) {
        return NextResponse.json({ success: false, error: "Yeni şifre en az 6 karakter olmalıdır." }, { status: 400 });
      }

      const existing = data.users[userIndex];
      const targetRole = role !== undefined ? role : existing.role;
      const roleObj = data.roles.find(r => r.name === targetRole || r.id === targetRole);
      const roleLabel = roleObj ? roleObj.label : (existing.roleLabel || targetRole);

      const updatedUser: SubUser = {
        ...existing,
        name: name !== undefined ? name.trim() : existing.name,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        role: targetRole,
        roleLabel: roleLabel,
        customPermissions: Array.isArray(customPermissions) ? customPermissions : existing.customPermissions,
        department: department !== undefined ? department : existing.department,
        warehouseId: warehouseId !== undefined ? warehouseId : existing.warehouseId,
        status: status !== undefined ? status : existing.status,
        isApproved: (status !== undefined ? status : existing.status) === "active",
        updatedAt: new Date().toISOString()
      };

      if (password && password.trim()) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password.trim(), salt);
        updatedUser.passwordHash = hash;
      }

      data.users[userIndex] = updatedUser;
      saveUsersAndRoles(data);

      // Sync with Prisma DB using upsert so it works even if user wasn't in Prisma before
      try {
        await withTimeout(
          prisma.user.upsert({
            where: { email: updatedUser.email },
            update: {
              name: updatedUser.name,
              role: updatedUser.role,
              isApproved: updatedUser.status === "active",
              ...(updatedUser.passwordHash ? { password: updatedUser.passwordHash } : {})
            },
            create: {
              name: updatedUser.name,
              email: updatedUser.email,
              role: updatedUser.role,
              password: updatedUser.passwordHash || "",
              isApproved: updatedUser.status === "active",
              customer_type: updatedUser.role === "USER" ? "b2c" : "b2b"
            }
          }),
          2500,
          null
        );
      } catch (dbErr) {
        console.warn("[USER PASSWORD UPDATE WARNING]:", dbErr);
      }

      // Sync with local CurrentAccount if matching email exists
      try {
        const localAccounts = readLocalAccounts();
        const matchedAcc = localAccounts.find(
          a => (a.email && a.email.toLowerCase() === updatedUser.email) ||
               ((a.entegrasyonHaritalama as any)?.b2bEmail || "").toLowerCase() === updatedUser.email
        );
        if (matchedAcc) {
          const ent = (matchedAcc.entegrasyonHaritalama as any) || {};
          updateLocalAccount(matchedAcc.id, {
            name: updatedUser.name || matchedAcc.name,
            phone: updatedUser.phone || matchedAcc.phone,
            entegrasyonHaritalama: {
              ...ent,
              b2bAdSoyad: updatedUser.name || ent.b2bAdSoyad,
              b2bEmail: updatedUser.email,
              b2bIsActive: String(updatedUser.status === "active"),
              ...(password && password.trim() ? { b2bPassword: password.trim() } : {})
            }
          });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        user: { ...updatedUser, hasPassword: Boolean(updatedUser.passwordHash) },
        message: password && password.trim()
          ? `"${updatedUser.name}" kullanıcısının parolası ve bilgileri güncellenerek veritabanına kaydedildi.`
          : "Kullanıcı bilgileri başarıyla güncellendi."
      });
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
