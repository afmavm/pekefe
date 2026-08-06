import { PrismaClient } from '../src/generated-client';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = [
  { id: 'perm_view_dashboard', name: 'view_dashboard' },
  { id: 'perm_approve_invoice', name: 'approve_invoice' },
  { id: 'perm_create_despatch', name: 'create_despatch' },
  { id: 'perm_edit_stock', name: 'edit_stock' },
  { id: 'perm_use_ai_assistant', name: 'use_ai_assistant' },
  { id: 'perm_manage_users', name: 'manage_users' }
];

const DEFAULT_ROLES = [
  { id: 'role_admin', name: 'Admin', permissions: ['perm_view_dashboard', 'perm_approve_invoice', 'perm_create_despatch', 'perm_edit_stock', 'perm_use_ai_assistant', 'perm_manage_users'] },
  { id: 'role_finance_manager', name: 'Finance_Manager', permissions: ['perm_view_dashboard', 'perm_approve_invoice', 'perm_use_ai_assistant'] },
  { id: 'role_warehouse_staff', name: 'Warehouse_Staff', permissions: ['perm_create_despatch', 'perm_edit_stock'] },
  { id: 'role_sales_rep', name: 'Sales_Rep', permissions: ['perm_view_dashboard', 'perm_create_despatch'] }
];

async function main() {
  console.log('Seeding RBAC (Role-Based Access Control) data...');

  // 1. Seed Permissions
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        id: perm.id,
        name: perm.name
      }
    });
  }
  console.log('Permissions seeded.');

  // 2. Seed Roles and RolePermissions
  for (const roleData of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        id: roleData.id,
        name: roleData.name
      }
    });

    // Seed RolePermissions junction
    for (const permId of roleData.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permId
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permId
        }
      });
    }
  }
  console.log('Roles and RolePermissions seeded.');

  // 3. Map Existing Users to Roles
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} existing users. Mapping roles...`);

  for (const user of users) {
    let targetRoleId = 'role_sales_rep'; // default fallback

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      targetRoleId = 'role_admin';
    } else if (user.email?.toLowerCase().includes('depo') || user.email?.toLowerCase().includes('warehouse')) {
      targetRoleId = 'role_warehouse_staff';
    } else if (user.email?.toLowerCase().includes('muhasebe') || user.email?.toLowerCase().includes('finance')) {
      targetRoleId = 'role_finance_manager';
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: targetRoleId
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: targetRoleId
      }
    });
    console.log(`Mapped user ${user.email} (${user.role}) to role ID: ${targetRoleId}`);
  }

  console.log('RBAC Seeding completed successfully!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error seeding RBAC:', err);
  process.exit(1);
});
