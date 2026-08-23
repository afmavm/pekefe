import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { readUsersAndRoles, saveUsersAndRoles, DEFAULT_ROLES, ALL_PERMISSIONS, RoleDefinition } from '@/lib/jsonUserDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    try {
      const data = readUsersAndRoles();
      return NextResponse.json({
        success: true,
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
      const { name, label, description, permissions, color } = body;

      if (!name || !label) {
        return NextResponse.json({ success: false, error: "Rol adı ve başlığı zorunludur." }, { status: 400 });
      }

      const data = readUsersAndRoles();
      const normalizedName = name.trim().toUpperCase().replace(/\s+/g, '_');

      const existing = data.roles.find(r => r.name === normalizedName);
      if (existing) {
        return NextResponse.json({ success: false, error: "Bu adda bir rol zaten tanımlı." }, { status: 400 });
      }

      const newRole: RoleDefinition = {
        id: `role-${Date.now()}`,
        name: normalizedName,
        label: label.trim(),
        description: description || "",
        color: color || "bg-indigo-600 text-white",
        permissions: Array.isArray(permissions) ? permissions : [],
        isSystem: false
      };

      data.roles.push(newRole);
      saveUsersAndRoles(data);

      return NextResponse.json({ success: true, role: newRole, message: "Yeni rol başarıyla oluşturuldu." });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message || "Rol oluşturulamadı." }, { status: 500 });
    }
  }
);
