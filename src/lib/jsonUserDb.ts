import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'users_roles_db.json');

export interface RoleDefinition {
  id: string;
  name: string;
  label: string;
  description: string;
  color: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface SubUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleLabel?: string;
  customPermissions?: string[];
  department?: string;
  warehouseId?: string;
  status: "active" | "passive";
  passwordHash?: string;
  customer_type?: "b2c" | "b2b";
  isApproved?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: "role-super-admin",
    name: "SUPER_ADMIN",
    label: "Süper Yönetici",
    description: "Tüm sistem modüllerine, ayarlara ve kullanıcı yönetimine sınırsız tam yetki.",
    color: "bg-red-500 text-white",
    permissions: ["*"],
    isSystem: true
  },
  {
    id: "role-admin",
    name: "ADMIN",
    label: "Sistem Yöneticisi",
    description: "Admin paneli modüllerine, sipariş, stok ve muhasebe operasyonlarına yönetim yetkisi.",
    color: "bg-orange-600 text-white",
    permissions: ["view_dashboard", "use_ai_assistant", "manage_orders", "manage_cargo", "manage_despatch", "manage_stock", "manage_inventory", "manage_warehouses", "manage_production", "manage_accounting", "manage_invoices", "manage_finance", "view_reports", "manage_cms", "manage_blog", "manage_campaigns", "manage_tickets", "manage_users"],
    isSystem: true
  },
  {
    id: "role-stock-manager",
    name: "STOCK_MANAGER",
    label: "Stok & Depo Sorumlusu",
    description: "Ürünler, stok hareketleri, depolar, varyantlar ve envanter yönetimi.",
    color: "bg-amber-500 text-white",
    permissions: ["view_dashboard", "manage_stock", "manage_inventory", "manage_warehouses"],
    isSystem: true
  },
  {
    id: "role-order-manager",
    name: "ORDER_MANAGER",
    label: "Sipariş & Lojistik Sorumlusu",
    description: "B2B/B2C siparişler, kargo takip, paketleme ve teslimat yönetimi.",
    color: "bg-blue-500 text-white",
    permissions: ["view_dashboard", "manage_orders", "manage_cargo", "manage_despatch"],
    isSystem: true
  },
  {
    id: "role-accountant",
    name: "ACCOUNTANT",
    label: "Muhasebe & Finans Uzmanı",
    description: "Faturalar, cari hesaplar, kasa/banka, ödemeler ve finansal raporlar.",
    color: "bg-emerald-600 text-white",
    permissions: ["view_dashboard", "manage_accounting", "manage_invoices", "manage_finance", "view_reports"],
    isSystem: true
  },
  {
    id: "role-production-manager",
    name: "PRODUCTION_MANAGER",
    label: "Üretim & MRP Müdürü",
    description: "Üretim emirleri, reçeteler (BOM), operasyonlar ve hammadde takibi.",
    color: "bg-purple-600 text-white",
    permissions: ["view_dashboard", "manage_production", "manage_stock"],
    isSystem: true
  },
  {
    id: "role-content-editor",
    name: "CONTENT_EDITOR",
    label: "Pazarlama & CMS Editörü",
    description: "Slider, blog, sayfalar, popuplar, bannerlar ve kampanya yönetimi.",
    color: "bg-pink-500 text-white",
    permissions: ["manage_cms", "manage_blog", "manage_campaigns", "manage_media"],
    isSystem: true
  },
  {
    id: "role-support",
    name: "SUPPORT_AGENT",
    label: "Müşteri Temsilcisi",
    description: "Destek talepleri, müşteri geri bildirimleri ve sipariş durum izleme.",
    color: "bg-cyan-600 text-white",
    permissions: ["view_dashboard", "view_orders", "manage_tickets", "manage_feedback"],
    isSystem: true
  },
  {
    id: "role-dealer",
    name: "DEALER",
    label: "B2B Bayi / Kurumsal Müşteri",
    description: "B2B Toptan Bayi Portalı ve cari hesap erişim yetkisi.",
    color: "bg-indigo-600 text-white",
    permissions: [],
    isSystem: true
  },
  {
    id: "role-user",
    name: "USER",
    label: "Bireysel Müşteri (B2C)",
    description: "Mağaza müşterisi, sipariş takibi ve hesap yönetimi yetkisi.",
    color: "bg-slate-600 text-white",
    permissions: [],
    isSystem: true
  }
];

export const ALL_PERMISSIONS = [
  { id: "view_dashboard", label: "Dashboard & Genel Bakış", group: "Genel" },
  { id: "use_ai_assistant", label: "AI Patron Asistanı Kullanımı", group: "Genel" },
  { id: "manage_orders", label: "Siparişleri Yönet (Görüntüle/Durum Güncelle)", group: "Sipariş & Lojistik" },
  { id: "manage_cargo", label: "Kargo & Sevkiyat Yönetimi", group: "Sipariş & Lojistik" },
  { id: "manage_despatch", label: "İrsaliye ve Teslimat İşlemleri", group: "Sipariş & Lojistik" },
  { id: "manage_stock", label: "Stok & Ürün Kartları Yönetimi", group: "Envanter" },
  { id: "manage_inventory", label: "Depolar Arası Transfer & Sayım", group: "Envanter" },
  { id: "manage_warehouses", label: "Depo & Raf Tanımlamaları", group: "Envanter" },
  { id: "manage_production", label: "Üretim Emirleri & BOM Reçeteleri", group: "Üretim" },
  { id: "manage_accounting", label: "Cari Hesaplar & B2B Bayiler", group: "Finans & Muhasebe" },
  { id: "manage_invoices", label: "e-Fatura & e-İrsaliye Kesme", group: "Finans & Muhasebe" },
  { id: "manage_finance", label: "Kasa, Banka & Tedarikçi Ödemeleri", group: "Finans & Muhasebe" },
  { id: "view_reports", label: "Finansal & Ticari Raporlar", group: "Finans & Muhasebe" },
  { id: "manage_cms", label: "CMS, Site Editörü & Sayfa Sihirbazı", group: "CMS & Pazarlama" },
  { id: "manage_blog", label: "Blog & Galeri Yönetimi", group: "CMS & Pazarlama" },
  { id: "manage_campaigns", label: "Kampanyalar & İndirim Kuponları", group: "CMS & Pazarlama" },
  { id: "manage_tickets", label: "Destek Biletleri & Müşteri Talepleri", group: "Müşteri Hizmetleri" },
  { id: "manage_users", label: "Alt Kullanıcılar & Rolleri Yönet", group: "Sistem" },
  { id: "manage_settings", label: "Sistem Ayarları & Entegrasyonlar", group: "Sistem" },
];

interface UserDbData {
  roles: RoleDefinition[];
  users: SubUser[];
}

function ensureDbFile(): UserDbData {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      const initial: UserDbData = {
        roles: DEFAULT_ROLES,
        users: [
          {
            id: "user-super-admin-01",
            name: "Muhammed AKÇELİK",
            email: "afmavm@gmail.com",
            phone: "05441494851",
            role: "SUPER_ADMIN",
            roleLabel: "Süper Yönetici",
            department: "Yönetim",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: "user-stock-01",
            name: "Ahmet Depocu",
            email: "depo@pekefe.com",
            phone: "05321002030",
            role: "STOCK_MANAGER",
            roleLabel: "Stok & Depo Sorumlusu",
            department: "Merkez Depo",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.roles) || parsed.roles.length === 0) {
      parsed.roles = DEFAULT_ROLES;
    } else {
      const existingRoleNames = new Set(parsed.roles.map((r: RoleDefinition) => r.name));
      for (const defRole of DEFAULT_ROLES) {
        if (!existingRoleNames.has(defRole.name)) {
          parsed.roles.push(defRole);
        }
      }
    }
    if (!Array.isArray(parsed.users)) {
      parsed.users = [];
    }
    return parsed;
  } catch (e) {
    console.error("Error reading users_roles_db.json:", e);
    return { roles: DEFAULT_ROLES, users: [] };
  }
}

export function readUsersAndRoles(): UserDbData {
  return ensureDbFile();
}

export function saveUsersAndRoles(data: UserDbData): boolean {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error("Error saving users_roles_db.json:", e);
    return false;
  }
}

export function findLocalUser(params: { id?: string; email?: string }): SubUser | null {
  const data = readUsersAndRoles();
  const cleanEmail = params.email?.trim().toLowerCase();
  const cleanId = params.id?.trim();

  if (cleanEmail) {
    const byEmail = data.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (byEmail) return byEmail;
  }
  if (cleanId) {
    const byId = data.users.find(u => u.id === cleanId);
    if (byId) return byId;
  }
  return null;
}

export function upsertLocalUser(input: {
  id?: string;
  name?: string;
  email: string;
  phone?: string;
  role?: string;
  roleLabel?: string;
  department?: string;
  warehouseId?: string;
  status?: "active" | "passive";
  passwordHash?: string;
  customPermissions?: string[];
  customer_type?: "b2c" | "b2b";
  isApproved?: boolean;
  lastLogin?: string;
}): SubUser {
  const data = readUsersAndRoles();
  const cleanEmail = input.email.trim().toLowerCase();
  const userIndex = data.users.findIndex(
    u => (u.email && u.email.toLowerCase() === cleanEmail) || (input.id && u.id === input.id)
  );

  const targetRole = input.role || (userIndex !== -1 ? data.users[userIndex].role : "USER");
  const roleObj = data.roles.find(r => r.name === targetRole || r.id === targetRole);
  const resolvedRoleLabel = input.roleLabel || (roleObj ? roleObj.label : targetRole);

  if (userIndex !== -1) {
    const existing = data.users[userIndex];
    const updated: SubUser = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      email: cleanEmail,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      role: input.role !== undefined ? input.role : existing.role,
      roleLabel: resolvedRoleLabel || existing.roleLabel,
      department: input.department !== undefined ? input.department : existing.department,
      warehouseId: input.warehouseId !== undefined ? input.warehouseId : existing.warehouseId,
      status: input.status !== undefined ? input.status : existing.status,
      passwordHash: input.passwordHash !== undefined ? input.passwordHash : existing.passwordHash,
      customPermissions: input.customPermissions !== undefined ? input.customPermissions : existing.customPermissions,
      customer_type: input.customer_type !== undefined ? input.customer_type : existing.customer_type,
      isApproved: input.isApproved !== undefined ? input.isApproved : existing.isApproved,
      lastLogin: input.lastLogin !== undefined ? input.lastLogin : existing.lastLogin,
      updatedAt: new Date().toISOString()
    };
    data.users[userIndex] = updated;
    saveUsersAndRoles(data);
    return updated;
  } else {
    const newUser: SubUser = {
      id: input.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: (input.name || cleanEmail.split("@")[0] || "Kullanıcı").trim(),
      email: cleanEmail,
      phone: input.phone || "",
      role: targetRole,
      roleLabel: resolvedRoleLabel,
      customPermissions: input.customPermissions || (roleObj ? roleObj.permissions : []),
      department: input.department || (targetRole === "USER" ? "Bireysel Müşteri" : targetRole === "DEALER" ? "B2B Bayi" : "Genel"),
      warehouseId: input.warehouseId || "",
      status: input.status || "active",
      passwordHash: input.passwordHash,
      customer_type: input.customer_type || (targetRole === "USER" ? "b2c" : "b2b"),
      isApproved: input.isApproved ?? true,
      lastLogin: input.lastLogin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.users.unshift(newUser);
    saveUsersAndRoles(data);
    return newUser;
  }
}
