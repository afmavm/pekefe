"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { signIn } from "next-auth/react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Leaf, 
  Award,
  Loader2
} from "lucide-react";

function GirisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  // Parola Sıfırlama / Güncelleme Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCurrentPassword, setResetCurrentPassword] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const showNotification = (message, type = "info") => {
    setToast({ isOpen: true, message, type });
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showNotification("Lütfen e-posta adresinizi giriniz.", "error");
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      showNotification("Yeni şifre en az 6 karakter olmalıdır.", "error");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      showNotification("Yeni şifreleriniz birbiriyle eşleşmiyor.", "error");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          currentPassword: resetCurrentPassword || undefined,
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || "Parolanız güncellendi ve veritabanına kaydedildi.", "success");
        setEmail(resetEmail.trim());
        setPassword(resetNewPassword);
        setIsResetModalOpen(false);
        setResetCurrentPassword("");
        setResetNewPassword("");
        setResetConfirmPassword("");
      } else {
        showNotification(data.error || "Parola güncellenemedi.", "error");
      }
    } catch {
      showNotification("Sunucu bağlantı hatası oluştu.", "error");
    } finally {
      setResetLoading(false);
    }
  };

  // URL'den hata parametresini yakala
  useEffect(() => {
    const error = searchParams?.get("error");
    if (error) {
      showNotification("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.", "error");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification("Lütfen e-posta ve şifrenizi giriniz.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        showNotification(
          res.error === "CredentialsSignin" ? "E-posta veya şifre hatalı." : res.error,
          "error"
        );
      } else {
        setSuccess(true);
        showNotification("Giriş başarılı! Yönlendiriliyorsunuz...", "success");
        setTimeout(async () => {
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get("callbackUrl");
          if (callbackUrl && !callbackUrl.includes("/giris")) {
            router.push(callbackUrl);
          } else {
            try {
              const { getSession } = await import("next-auth/react");
              const session = await getSession();
              const role = session?.user?.role;
              const adminRoles = [
                "admin", "ADMIN", "SUPER_ADMIN", "ORDER_MANAGER", "STOCK_MANAGER",
                "ACCOUNTANT", "PRODUCTION_MANAGER", "CONTENT_EDITOR", "SUPPORT_AGENT",
                "BRANCH_MANAGER", "WAREHOUSE_SUPERVISOR", "SALES_STAFF"
              ];
              if (adminRoles.includes(role)) {
                router.push("/admin");
              } else if (role === "DEALER") {
                router.push("/b2b");
              } else {
                router.push("/hesap");
              }
            } catch {
              router.push("/hesap");
            }
          }
        }, 1000);
      }
    } catch {
      setLoading(false);
      showNotification("Giriş yapılırken bir hata oluştu.", "error");
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#fbf9f6] dark:bg-[#0e0f11]">
      {/* Sol Panel: Görsel */}
      <section className="hidden md:flex md:w-[50%] lg:w-[52%] relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#2a0812]/90 via-[#4a1220]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent to-[#1a0009]/40 pointer-events-none" />
        <Image
          src="/ispir-dut-hasadi.png"
          alt="Pekefe – İspir Dut Hasadı"
          className="object-cover object-center"
          fill
          sizes="52vw"
          priority
          quality={100}
        />
        
        {/* Üst rozet */}
        <div className="absolute top-8 left-8 z-30">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-white text-xs font-bold tracking-widest uppercase">
              Doğal · Geleneksel · İspir
            </span>
          </div>
        </div>

        {/* Alt içerik */}
        <div className="absolute bottom-12 left-10 right-10 z-30">
          <div className="inline-block bg-amber-400/20 backdrop-blur-md border border-amber-400/30 rounded-full px-3 py-1 text-amber-300 text-[11px] font-extrabold tracking-widest uppercase mb-3">
            2200m Rakımdan Sofranıza
          </div>
          <h2 className="text-white font-serif font-black leading-tight mb-4 text-3xl lg:text-4xl">
            Gelenekten<br />Geleceğe Miras
          </h2>
          <p className="text-white/85 text-sm lg:text-base leading-relaxed max-w-md">
            Anadolu'nun bereketli Kaçkar yaylalarından süzülen en saf coğrafi işaretli lezzetler, sofranızla buluşuyor.
          </p>
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/15">
            <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
              <Leaf className="w-4 h-4 text-amber-400" />
              <span>%100 Doğal</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Coğrafi İşaret</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Korumalı Kargo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sağ Panel: Form */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-12 lg:px-16 bg-white dark:bg-slate-900 min-h-screen">
        <div className="w-full max-w-[420px] flex flex-col justify-center flex-grow py-12">

          {/* Logo + Marka */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-3 group mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-[#6b1d2f] text-white flex items-center justify-center shadow-xl shadow-[#6b1d2f]/20 group-hover:scale-105 transition-all overflow-hidden p-2">
                  <Image
                    src="/logo.png"
                    alt="Pekefe Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950 font-bold" />
                </div>
              </div>
              <span className="text-2xl font-serif font-black text-[#6b1d2f] dark:text-rose-400 tracking-tight">Pekefe</span>
            </Link>
            <h1 className="font-serif font-bold text-slate-900 dark:text-white text-2xl lg:text-3xl mb-2">
              Hoş Geldiniz 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">
              Hesabınıza giriş yaparak siparişlerinizi ve avantajlarınızı yönetin
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all placeholder:text-slate-400"
                  placeholder="adiniz@eposta.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                Giriş Şifresi
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6b1d2f] transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hatırla & Unut */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#6b1d2f] focus:ring-[#6b1d2f]" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900">Beni Hatırla</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email || "");
                  setIsResetModalOpen(true);
                }}
                className="text-xs text-[#6b1d2f] dark:text-rose-400 hover:underline font-bold cursor-pointer bg-transparent border-none"
              >
                Şifremi Unuttum / Parola Güncelle
              </button>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer mt-2 ${
                success
                  ? "bg-emerald-600 shadow-emerald-500/20"
                  : "bg-[#6b1d2f] hover:bg-[#831843] shadow-[#6b1d2f]/20 hover:scale-[1.01]"
              }`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Giriş Yapılıyor...</span></>
              ) : success ? (
                <><CheckCircle2 className="w-4 h-4" /><span>Giriş Başarılı! Yönlendiriliyorsunuz...</span></>
              ) : (
                <><span>Giriş Yap</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Kayıt linki & B2B Başvuru */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-500">
              Henüz bir hesabınız yok mu?{" "}
              <Link className="text-[#6b1d2f] dark:text-rose-400 font-bold hover:underline" href="/kayit">
                Ücretsiz Kayıt Ol
              </Link>
            </p>
            <p className="text-xs text-slate-500">
              Kurumsal işletme misiniz?{" "}
              <Link className="text-amber-600 dark:text-amber-400 font-bold hover:underline" href="/b2b">
                B2B Bayilik Başvurusu Yap
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto w-full max-w-[420px] border-t border-slate-100 dark:border-slate-800 py-4 flex justify-between items-center text-[11px] text-slate-400">
          <span>© 2026 Pekefe</span>
          <div className="flex gap-3">
            <Link className="hover:text-[#6b1d2f] transition-colors" href="/sss">Destek</Link>
            <Link className="hover:text-[#6b1d2f] transition-colors" href="/gizlilik">Gizlilik</Link>
            <Link className="hover:text-[#6b1d2f] transition-colors" href="/hikayemiz">Hakkımızda</Link>
          </div>
        </footer>
      </section>

      {/* Parola Sıfırlama / Güncelleme Modalı */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Parola Güncelleme</h3>
                  <p className="text-xs text-slate-500">Hesap parolanızı yenileyin ve veritabanına kaydedin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer border-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Kayıtlı E-posta Adresiniz *</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="adiniz@eposta.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#6b1d2f] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Mevcut Şifre (Biliyorsanız)</label>
                <input
                  type={showResetPassword ? "text" : "password"}
                  value={resetCurrentPassword}
                  onChange={(e) => setResetCurrentPassword(e.target.value)}
                  placeholder="Opsiyonel doğrulama"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#6b1d2f] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Yeni Şifre * (En az 6 karakter)</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#6b1d2f] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6b1d2f] cursor-pointer bg-transparent border-none"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Yeni Şifre Tekrar *</label>
                <input
                  type={showResetPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:border-[#6b1d2f] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#6b1d2f] hover:bg-[#831843] text-white text-xs font-bold cursor-pointer border-none shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{resetLoading ? "Kaydediliyor..." : "Yeni Parolayı Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </main>
  );
}

export default function Giris() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbf9f6] flex items-center justify-center text-slate-500 text-sm">Yükleniyor...</div>}>
      <GirisForm />
    </Suspense>
  );
}
