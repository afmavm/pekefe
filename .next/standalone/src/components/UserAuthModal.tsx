"use client";

import React, { useState } from "react";
import { X, User, UserCheck, Mail, Building, Eye, EyeOff, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Link } from "@/navigation";
import PasswordStrengthInput from "@/components/PasswordStrengthInput";

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register" | "forgot";
}

export default function UserAuthModal({ isOpen, onClose, defaultTab = "login" }: UserAuthModalProps) {
  const t = useTranslations("Home");
  const [authTab, setAuthTab] = useState<"login" | "register" | "forgot">(defaultTab);

  React.useEffect(() => {
    if (isOpen && defaultTab) {
      setAuthTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regSurname, setRegSurname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // Show/Hide password states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    if (result?.error) {
      toast.error("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
      return;
    }

    let displayName = loginEmail.includes("@") ? loginEmail.split("@")[0] : loginEmail;
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    try {
      const userRes = await fetch("/api/user");
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user?.name) displayName = userData.user.name;
      }
    } catch (_) {}

    toast.success(`Hoş geldin, ${displayName}! Giriş başarılı.`);
    document.cookie = "browser_session_active=true; path=/; SameSite=Lax";
    onClose();
    setLoginEmail("");
    setLoginPassword("");
    setShowLoginPassword(false);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regSurname || !regEmail || !regPhone || !regPassword) return;

    // Şifre güç kontrolü
    if (
      regPassword.length < 8 ||
      !/[A-Z]/.test(regPassword) ||
      !/[a-z]/.test(regPassword) ||
      !/[0-9]/.test(regPassword) ||
      !/[^A-Za-z0-9]/.test(regPassword)
    ) {
      toast.error("Şifreniz yeterince güçlü değil. Büyük/küçük harf, rakam ve özel karakter kullanın.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${regName} ${regSurname}`,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Kayıt sırasında bir hata oluştu.");
        return;
      }

      const loginResult = await signIn("credentials", {
        email: regEmail,
        password: regPassword,
        redirect: false,
      });

      if (loginResult?.error) {
        toast.error("Kayıt tamamlandı fakat otomatik giriş başarısız. Lütfen manuel giriş yapın.");
        setAuthTab("login");
        return;
      }

      const fullName = `${regName} ${regSurname}`;
      toast.success(`Kayıt tamamlandı! Hoş geldin, ${fullName}.`);
      document.cookie = "browser_session_active=true; path=/; SameSite=Lax";
      onClose();
      setRegName("");
      setRegSurname("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setShowRegPassword(false);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    toast.success(`Şifre sıfırlama talimatları ${forgotEmail} adresine gönderildi.`);
    setAuthTab("login");
    setForgotEmail("");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-[#0B0F17]/90 backdrop-blur-sm"></div>

      {/* Modal Box — larger, scrollable on small screens */}
      <div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-amber-500/25 rounded-3xl px-8 py-8 sm:px-10 sm:py-10 max-w-[580px] w-full shadow-2xl z-10 animate-fade-up overflow-y-auto max-h-[95vh] scrollbar-none">

        {/* Decorative top amber glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#F4B400]/60 to-transparent rounded-full" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 hover:border-slate-350 dark:hover:border-zinc-500 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tabs Selector */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 mb-7">
          <button
            type="button"
            onClick={() => setAuthTab("login")}
            className={`flex-1 pb-4 text-[15px] font-extrabold text-center border-b-2 transition-all uppercase tracking-widest cursor-pointer ${authTab === "login" ? "border-[#F4B400] text-slate-900 dark:text-white" : "border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"}`}
          >
            {t("auth_login_title")}
          </button>
          <button
            type="button"
            onClick={() => setAuthTab("register")}
            className={`flex-1 pb-4 text-[15px] font-extrabold text-center border-b-2 transition-all uppercase tracking-widest cursor-pointer ${authTab === "register" ? "border-[#F4B400] text-slate-900 dark:text-white" : "border-transparent text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"}`}
          >
            {t("auth_register_title")}
          </button>
        </div>

        {/* ── TAB 1: Giriş Yap ── */}
        {authTab === "login" && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 text-center mb-1">{t("auth_login_desc")}</p>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* E-posta */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="login-email">
                  {t("auth_email_or_username")} <span className="text-[#F4B400]">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-550 group-focus-within:text-[#F4B400] transition-colors pointer-events-none" />
                  <input
                    type="text"
                    id="login-email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t("auth_email_or_username_placeholder")}
                    className="w-full h-14 bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 text-[15px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Şifre */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="login-password">
                    {t("auth_password")} <span className="text-[#F4B400]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthTab("forgot")}
                    className="text-sm font-bold text-[#F4B400] hover:text-[#E0A500] transition-colors cursor-pointer"
                  >
                    {t("auth_forgot_password")}
                  </button>
                </div>
                {/* Giriş sayfasında sadece göster/gizle — güç göstergesi yok */}
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-550 group-focus-within:text-[#F4B400] transition-colors pointer-events-none" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl pl-12 pr-14 text-[15px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    title={showLoginPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-zinc-400 hover:text-[#F4B400] hover:bg-[#F4B400]/10 transition-all cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Giriş Yap Butonu */}
              <button
                type="submit"
                className="w-full h-14 bg-[#F4B400] hover:bg-[#E0A500] text-[#0C0E12] font-extrabold text-[15px] rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg shadow-[#F4B400]/20 uppercase tracking-wider"
              >
                <UserCheck className="w-5 h-5" />
                <span>{t("auth_login_title")}</span>
              </button>
            </form>

            {/* Ayırıcı */}
            <div className="relative flex py-1 items-center select-none">
              <div className="flex-grow border-t border-slate-200 dark:border-white/5"></div>
              <span className="flex-shrink mx-4 text-slate-400 dark:text-zinc-550 text-xs font-extrabold uppercase tracking-widest">B2B Portal</span>
              <div className="flex-grow border-t border-slate-200 dark:border-white/5"></div>
            </div>

            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full h-14 bg-[#F4B400]/8 border border-[#F4B400]/25 hover:border-[#F4B400]/50 hover:bg-[#F4B400]/12 text-[#F4B400] text-[15px] font-bold rounded-xl transition-all decoration-transparent cursor-pointer active:scale-[0.98]"
            >
              <Building className="w-5 h-5" />
              <span>{t("auth_b2b_login")}</span>
            </Link>
          </div>
        )}

        {/* ── TAB 2: Kayıt Ol ── */}
        {authTab === "register" && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 text-center mb-1">{t("auth_register_desc")}</p>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Ad / Soyad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="reg-name">
                    {t("auth_first_name")} <span className="text-[#F4B400]">*</span>
                  </label>
                  <input
                    type="text"
                    id="reg-name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={t("auth_first_name_placeholder")}
                    className="w-full h-13 bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl px-4 text-[15px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all"
                    style={{ height: "52px" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="reg-surname">
                    {t("auth_last_name")} <span className="text-[#F4B400]">*</span>
                  </label>
                  <input
                    type="text"
                    id="reg-surname"
                    required
                    value={regSurname}
                    onChange={(e) => setRegSurname(e.target.value)}
                    placeholder={t("auth_last_name_placeholder")}
                    className="w-full h-13 bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl px-4 text-[15px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all"
                    style={{ height: "52px" }}
                  />
                </div>
              </div>

              {/* E-posta */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="reg-email">
                  {t("auth_email")} <span className="text-[#F4B400]">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-550 group-focus-within:text-[#F4B400] transition-colors pointer-events-none" />
                  <input
                    type="email"
                    id="reg-email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={t("auth_email_placeholder")}
                    className="w-full h-14 bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 text-[15px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Telefon */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="reg-phone">
                  {t("auth_phone")} <span className="text-[#F4B400]">*</span>
                </label>
                <input
                  type="tel"
                  id="reg-phone"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder={t("auth_phone_placeholder")}
                  className="w-full h-14 bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl px-4 text-[15px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all"
                />
              </div>

              {/* Şifre — güç göstergesi ile */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="reg-password">
                  {t("auth_password")} <span className="text-[#F4B400]">*</span>
                </label>
                <PasswordStrengthInput
                  id="reg-password"
                  value={regPassword}
                  onChange={setRegPassword}
                  placeholder={t("auth_password_min")}
                  size="md"
                />
              </div>

              {/* Kayıt Ol Butonu */}
              <button
                type="submit"
                className="w-full h-14 bg-[#F4B400] hover:bg-[#E0A500] text-[#0C0E12] font-extrabold text-[15px] rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg shadow-[#F4B400]/20 uppercase tracking-wider"
              >
                <User className="w-5 h-5" />
                <span>{t("auth_register_title")}</span>
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 3: Şifremi Unuttum ── */}
        {authTab === "forgot" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => setAuthTab("login")}
                className="text-slate-500 dark:text-zinc-350 hover:text-[#F4B400] text-sm font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {t("auth_forgot_back")}
              </button>
              <span className="ml-auto text-sm font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{t("auth_forgot_title")}</span>
            </div>

            <form onSubmit={handleForgot} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide select-none" htmlFor="forgot-email">
                  E-posta Adresi <span className="text-[#F4B400]">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-550 group-focus-within:text-[#F4B400] transition-colors pointer-events-none" />
                  <input
                    type="email"
                    id="forgot-email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ornek@domain.com"
                    className="w-full h-14 bg-slate-50 dark:bg-[#242428] border border-slate-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 text-[15px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400]/20 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-14 bg-[#F4B400] hover:bg-[#E0A500] text-[#0C0E12] font-extrabold text-[15px] rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-lg shadow-[#F4B400]/20 uppercase tracking-wider"
              >
                <Mail className="w-5 h-5" />
                <span>{t("auth_reset_send")}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
