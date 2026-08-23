"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Shield, Key, Mail, Phone, Building2, CheckCircle2, 
  Save, Eye, EyeOff, Lock, Clock, Sparkles, RefreshCw, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success && data.user) {
        setProfile(data.user);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setDepartment(data.user.department || "");
      } else {
        toast.error("Profil bilgileri yüklenemedi.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Yeni şifreleriniz birbiriyle uyuşmuyor!");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          department,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Profiliniz başarıyla güncellendi.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchProfile();
      } else {
        toast.error(data.error || "Güncelleme başarısız.");
      }
    } catch (e: any) {
      toast.error(e.message || "Güncelleme hatası.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profil Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md shadow-orange-500/20">
            {name ? name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Sistem Profilim & Güvenlik</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Yönetici hesap bilgilerinizi, departmanınızı ve oturum şifrenizi buradan yönetin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            {profile?.roleLabel || profile?.role || "Yönetici"}
          </span>
        </div>
      </div>

      {/* 2. Form Body */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        
        {/* Personal & Account Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-extrabold text-slate-900">Kişisel Bilgiler & İletişim</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Ad Soyad *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">E-Posta Adresi (Giriş E-Postası)</label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 outline-none cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400">E-posta adresi sistem güvenliği nedeniyle salt okunurdur.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0544 149 48 51"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Departman / Görev</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="Örn: Yönetim, Merkez Depo..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security & Password Change */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Key className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Güvenlik & Şifre Değiştir</h2>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakabilirsiniz.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Mevcut Şifre</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition cursor-pointer border-none bg-transparent"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Yeni Şifre</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition cursor-pointer border-none bg-transparent"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Yeni Şifre Tekrar</label>
              <input
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Permissions & Roles Overview Box */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-extrabold">Erişim Rolü & Yetki Durumu</h3>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Hesabınız <strong className="text-white">{profile?.roleLabel || profile?.role || "Süper Yönetici"}</strong> rolü ile yetkilendirilmiştir.
            Şirket yönetim modüllerine, stok, sipariş ve finans operasyonlarına tam erişim hakkınız bulunmaktadır.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-none shadow-md shadow-orange-500/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
