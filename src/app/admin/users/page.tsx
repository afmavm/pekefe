"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, UserPlus, Shield, ShieldCheck, Key, Edit, Trash2, 
  Search, Check, X, Lock, Unlock, Mail, Phone, Building2, 
  CheckCircle2, AlertCircle, RefreshCw, Layers, Sparkles, Filter
} from "lucide-react";
import { toast } from "sonner";
import { RoleDefinition, SubUser } from "@/lib/jsonUserDb";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [users, setUsers] = useState<SubUser[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<Array<{ id: string; label: string; group: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SubUser | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // User Form
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STOCK_MANAGER",
    department: "",
    warehouseId: "",
    password: "",
    status: "active" as "active" | "passive",
    customPermissions: [] as string[]
  });

  // Role Form
  const [roleForm, setRoleForm] = useState({
    name: "",
    label: "",
    description: "",
    color: "bg-indigo-600 text-white",
    permissions: [] as string[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setRoles(data.roles || []);
        setPermissions(data.permissions || []);
      } else {
        toast.error(data.error || "Kullanıcı verileri yüklenemedi.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewUserModal = () => {
    setEditingUser(null);
    const defaultRoleObj = roles.find(r => r.name === "STOCK_MANAGER") || roles[0];
    setUserForm({
      name: "",
      email: "",
      phone: "",
      role: defaultRoleObj ? defaultRoleObj.name : "STOCK_MANAGER",
      department: "Operasyon",
      warehouseId: "",
      password: "",
      status: "active",
      customPermissions: defaultRoleObj ? [...defaultRoleObj.permissions] : []
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: SubUser) => {
    setEditingUser(user);
    const userRoleObj = roles.find(r => r.name === user.role);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      department: user.department || "",
      warehouseId: user.warehouseId || "",
      password: "", // leave blank unless changing
      status: user.status,
      customPermissions: user.customPermissions ? [...user.customPermissions] : (userRoleObj ? [...userRoleObj.permissions] : [])
    });
    setIsUserModalOpen(true);
  };

  const handleRoleChangeInForm = (newRoleName: string) => {
    const selectedRole = roles.find(r => r.name === newRoleName);
    setUserForm(prev => ({
      ...prev,
      role: newRoleName,
      customPermissions: selectedRole ? [...selectedRole.permissions] : prev.customPermissions
    }));
  };

  const togglePermissionInUserForm = (permId: string) => {
    setUserForm(prev => {
      const exists = prev.customPermissions.includes(permId);
      const next = exists 
        ? prev.customPermissions.filter(p => p !== permId)
        : [...prev.customPermissions, permId];
      return { ...prev, customPermissions: next };
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error("Lütfen Ad Soyad ve E-posta alanlarını doldurun.");
      return;
    }
    if (!editingUser && !userForm.password.trim()) {
      toast.error("Yeni kullanıcı için lütfen bir başlangıç şifresi belirleyin.");
      return;
    }

    try {
      const url = "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";
      const payload = {
        ...userForm,
        id: editingUser ? editingUser.id : undefined
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingUser ? "Kullanıcı başarıyla güncellendi." : "Yeni alt kullanıcı oluşturuldu.");
        setIsUserModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "İşlem başarısız.");
      }
    } catch (e: any) {
      toast.error(e.message || "Kaydetme hatası.");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`'${name}' adlı kullanıcıyı silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Kullanıcı başarıyla silindi.");
        fetchData();
      } else {
        toast.error(data.error || "Silinemedi.");
      }
    } catch (e: any) {
      toast.error(e.message || "Silme hatası.");
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim() || !roleForm.label.trim()) {
      toast.error("Lütfen Rol Kodunu ve Başlığını giriniz.");
      return;
    }

    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Yeni rol başarıyla oluşturuldu.");
        setIsRoleModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Rol oluşturulamadı.");
      }
    } catch (e: any) {
      toast.error(e.message || "Kaydetme hatası.");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const permissionGroups = useMemo(() => {
    const map = new Map<string, Array<{ id: string; label: string }>>();
    permissions.forEach(p => {
      const grp = p.group || "Diğer";
      if (!map.has(grp)) map.set(grp, []);
      map.get(grp)!.push({ id: p.id, label: p.label });
    });
    return Array.from(map.entries());
  }, [permissions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Kullanıcılar & Rol Yönetimi (RBAC)</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Yönetici alt kullanıcılar tanımlayın, departman atayın ve modül bazlı erişim yetkilerini kontrol edin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer border-none flex items-center justify-center"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsRoleModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-sm"
          >
            <Shield className="w-4 h-4 text-orange-500" />
            <span>Yeni Rol Tanımla</span>
          </button>

          <button
            type="button"
            onClick={openNewUserModal}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-md shadow-orange-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Alt Kullanıcı Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Personel</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif Kullanıcı</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{users.filter(u => u.status === "active").length}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanımlı Rol Sayısı</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{roles.length}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Süper Yöneticiler</p>
            <p className="text-2xl font-black text-orange-600 mt-1">{users.filter(u => u.role === "SUPER_ADMIN").length}</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs (Kullanıcılar vs Roller) */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-2 ${
            activeTab === "users"
              ? "bg-white text-slate-900 shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 bg-transparent"
          }`}
        >
          <Users className="w-4 h-4 text-orange-500" />
          <span>Alt Kullanıcılar ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-2 ${
            activeTab === "roles"
              ? "bg-white text-slate-900 shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 bg-transparent"
          }`}
        >
          <Shield className="w-4 h-4 text-purple-600" />
          <span>Roller & Yetki Matrisi ({roles.length})</span>
        </button>
      </div>

      {/* 4. TAB CONTENT: USERS LIST */}
      {activeTab === "users" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Personel adı, e-posta veya departman ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Roller</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="p-4">Kullanıcı Bilgisi</th>
                  <th className="p-4">Departman & İletişim</th>
                  <th className="p-4">Rol & Sorumluluk</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                      Arama kriterlerine uygun alt kullanıcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const roleObj = roles.find(r => r.name === user.role);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs">{user.name}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" /> {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-slate-700">{user.department || "Genel"}</p>
                          {user.phone && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {user.phone}
                            </p>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                            user.role === "SUPER_ADMIN" ? "bg-red-100 text-red-700 border border-red-200" :
                            user.role === "STOCK_MANAGER" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            user.role === "ORDER_MANAGER" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                            user.role === "ACCOUNTANT" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            <Shield className="w-3 h-3" />
                            {roleObj ? roleObj.label : user.roleLabel || user.role}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            user.status === "active" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {user.status === "active" ? "Aktif" : "Pasif"}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditUserModal(user)}
                              className="p-2 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg transition cursor-pointer border-none"
                              title="Kullanıcıyı Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer border-none"
                              title="Kullanıcıyı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: ROLES & PERMISSIONS MATRIX */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{r.label}</h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">{r.name}</span>
                    </div>
                  </div>
                  {r.isSystem && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-extrabold rounded-md uppercase">
                      Sistem Rolü
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  {r.description}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Erişim İzinleri:</p>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.includes("*") ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md">
                        ★ Tüm Modüllere Tam Erişim
                      </span>
                    ) : (
                      r.permissions.map(p => {
                        const permObj = permissions.find(x => x.id === p);
                        return (
                          <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                            ✓ {permObj ? permObj.label : p}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>{users.filter(u => u.role === r.name).length} Kullanıcı</span>
                <span className="text-[11px] text-orange-600 font-bold">Aktif Rol</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. MODAL: USER ADD/EDIT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingUser ? "Alt Kullanıcıyı Düzenle" : "Yeni Alt Kullanıcı Tanımla"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Personel bilgilerini ve modül erişim yetkilerini belirleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">E-Posta (Giriş Adresi) *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="Örn: ahmet@pekefe.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Telefon</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="0532 000 00 00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {editingUser ? "Yeni Şifre (Boş bırakılırsa değişmez)" : "Giriş Şifresi *"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Departman / Görev</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={e => setUserForm({ ...userForm, department: e.target.value })}
                    placeholder="Örn: Merkez Depo, Muhasebe..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Kullanıcı Rolü *</label>
                  <select
                    value={userForm.role}
                    onChange={e => handleRoleChangeInForm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-orange-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.label} ({r.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions Customizer Checkbox Matrix */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Modül Erişim İzinleri</h4>
                    <p className="text-[11px] text-slate-400">Role bağlı varsayılan izinleri özelleştirebilirsiniz</p>
                  </div>
                  <span className="text-xs font-bold text-orange-600">
                    {userForm.customPermissions.includes("*") ? "Tam Yetkili" : `${userForm.customPermissions.length} Modül İzni Seçili`}
                  </span>
                </div>

                <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                  {permissionGroups.map(([grp, perms]) => (
                    <div key={grp} className="space-y-2">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{grp}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map(p => {
                          const isChecked = userForm.customPermissions.includes("*") || userForm.customPermissions.includes(p.id);
                          return (
                            <label 
                              key={p.id} 
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition select-none ${
                                isChecked ? "bg-orange-50 border-orange-200 text-orange-950" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermissionInUserForm(p.id)}
                                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                              />
                              <span className="truncate">{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border-none"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition cursor-pointer border-none shadow-md shadow-orange-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? "Değişiklikleri Kaydet" : "Kullanıcıyı Oluştur"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: NEW ROLE DEFINITION MODAL */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-purple-600/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Yeni Özel Rol Tanımla</h3>
                  <p className="text-xs text-slate-500 font-medium">Şirket içi özel departman veya görev rolü oluşturun</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Rol Kodu (Sistem Adı) *</label>
                <input
                  type="text"
                  required
                  value={roleForm.name}
                  onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Örn: FIELD_SALES_REP"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-500 outline-none uppercase font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Görünen Başlık *</label>
                <input
                  type="text"
                  required
                  value={roleForm.label}
                  onChange={e => setRoleForm({ ...roleForm, label: e.target.value })}
                  placeholder="Örn: Saha Satış Temsilcisi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Açıklama</label>
                <textarea
                  rows={2}
                  value={roleForm.description}
                  onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Bu role sahip kullanıcıların şirket içindeki görev tanımı..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border-none"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer border-none shadow-md shadow-purple-600/20"
                >
                  Rolü Kaydet
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
