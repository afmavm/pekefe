"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { signIn } from "next-auth/react";

export default function Giris() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const showNotification = (message, type = "info") => {
    setToast({ isOpen: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      setLoading(false);

      if (res?.error) {
        showNotification(res.error === "CredentialsSignin" ? "E-posta veya şifre hatalı." : res.error, "error");
      } else {
        setSuccess(true);
        showNotification("Giriş başarılı! Yönlendiriliyorsunuz...", "success");
        setTimeout(async () => {
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get("callbackUrl");
          if (callbackUrl && !callbackUrl.includes("/giris")) {
            router.push(callbackUrl);
          } else {
            // Fetch session to check role
            try {
              const { getSession } = await import("next-auth/react");
              const session = await getSession();
              const role = session?.user?.role;
              if (role === "admin" || role === "ADMIN") {
                router.push("/admin/dashboard");
              } else {
                router.push("/hesap");
              }
            } catch {
              router.push("/hesap");
            }
          }
        }, 1200);
      }
    } catch (error) {
      setLoading(false);
      showNotification("Giriş yapılırken bir hata oluştu.", "error");
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest">
      {/* Left Side: Visual Storytelling */}
      <section className="hidden md:flex md:w-1/2 relative min-h-screen">
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-primary/30 to-transparent"></div>
        <div className="absolute inset-0 bg-surface-container-lowest/10 backdrop-blur-[2px] z-20"></div>
        <Image
          src="/ispir-dut-hasadi.png"
          alt="Pekefe Geleneksel Hasat"
          className="object-cover"
          fill
          sizes="50vw"
          priority
        />
        {/* Branding Overlay */}
        <div className="absolute bottom-margin-desktop left-margin-desktop z-30 max-w-md">
          <h2 className="font-display-lg text-[44px] text-white mb-4 drop-shadow-lg leading-tight">
            Gelenekten Geleceğe
          </h2>
          <p className="font-body-lg text-white/90 leading-relaxed drop-shadow-md">
            Anadolu'nun bereketli topraklarından süzülen en saf lezzetler, modern sofranızla buluşuyor. Pekefe ile mükemmelliği keşfedin.
          </p>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="flex-1 flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop bg-surface-container-lowest min-h-screen">
        <div className="w-full max-w-[440px] py-12 flex-grow flex flex-col justify-center">
          {/* Header & Logo */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 hover:opacity-90 transition-opacity">
              <Image src="/logo.png" alt="Pekefe Logo" width={64} height={64} className="object-contain" />
              <span className="font-display-lg text-headline-md text-primary font-bold">Pekefe</span>
            </Link>
            <h1 className="font-headline-lg text-primary mb-2">Hoş Geldiniz</h1>
            <p className="font-body-md text-on-surface-variant">Lütfen hesabınıza giriş yapın</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                E-posta Adresi
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 material-symbols-outlined">
                  mail
                </span>
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-4 rounded-lg border border-outline-variant/30 bg-surface-bright focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 font-body-md outline-none"
                  placeholder="ornek@pekefe.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 material-symbols-outlined">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-4 rounded-lg border border-outline-variant/30 bg-surface-bright focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 font-body-md outline-none"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between py-2">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Beni Hatırla
                </span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showNotification("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.", "success");
                }}
                className="font-label-md text-primary hover:underline decoration-1 underline-offset-4"
              >
                Şifremi Unuttum
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full text-white font-bold py-4 rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 cursor-pointer ${
                success ? "bg-green-700" : "bg-primary hover:bg-primary/95"
              }`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Başarılı!</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20"></div>
            </div>
            <div className="relative flex justify-center text-label-sm uppercase tracking-widest text-on-surface-variant/60">
              <span className="bg-surface-container-lowest px-4">VEYA</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-gutter">
            <button
              onClick={() => showNotification("Google ile hızlı giriş simüle edildi.", "info")}
              className="flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              <span className="font-label-md text-on-surface">Google</span>
            </button>
            <button
              onClick={() => showNotification("Facebook ile hızlı giriş simüle edildi.", "info")}
              className="flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
              <span className="font-label-md text-on-surface">Facebook</span>
            </button>
          </div>

          {/* Footer Link */}
          <p className="mt-12 text-center font-body-md text-on-surface-variant">
            Henüz bir hesabınız yok mu?
            <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" href="/kayit">
              Kayıt Ol
            </Link>
          </p>
        </div>

        {/* Minimal Footer Info */}
        <footer className="mt-auto w-full max-w-[440px] border-t border-outline-variant/10 py-6 flex justify-between items-center text-label-sm text-on-surface-variant/50">
          <span>&copy; 2026 Pekefe Traditional Excellence</span>
          <div className="flex gap-4">
            <Link className="hover:text-primary transition-colors" href="/sss">
              Destek
            </Link>
            <Link className="hover:text-primary transition-colors" href="/hikayemiz">
              Hakkımızda
            </Link>
          </div>
        </footer>
      </section>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </main>
  );
}
