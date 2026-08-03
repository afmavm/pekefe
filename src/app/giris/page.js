"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { signIn } from "next-auth/react";

function GirisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const showNotification = (message, type = "info") => {
    setToast({ isOpen: true, message, type });
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
              if (role === "admin" || role === "ADMIN" || role === "SUPER_ADMIN") {
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
    } catch {
      setLoading(false);
      showNotification("Giriş yapılırken bir hata oluştu.", "error");
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-white">
      {/* Sol Panel: Görsel */}
      <section className="hidden md:flex md:w-[52%] relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#3b0a18]/80 via-[#3b0a18]/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent to-[#1a0009]/30 pointer-events-none" />
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
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold tracking-widest uppercase">
              Doğal · Geleneksel · İspir
            </span>
          </div>
        </div>
        {/* Alt içerik */}
        <div className="absolute bottom-12 left-10 right-10 z-30">
          <p className="text-amber-300/80 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            2200m Rakımdan Sofranıza
          </p>
          <h2 className="text-white font-bold leading-[1.1] mb-4"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)" }}>
            Gelenekten<br />Geleceğe
          </h2>
          <p className="text-white/75 leading-relaxed max-w-sm"
            style={{ fontSize: "clamp(0.85rem, 1.2vw, 1rem)" }}>
            Anadolu'nun bereketli yaylalarından süzülen en saf lezzetler,
            modern sofranızla buluşuyor.
          </p>
          <div className="flex items-center gap-4 mt-6">
            {[
              { icon: "eco", label: "%100 Doğal" },
              { icon: "verified", label: "Coğrafi İşaret" },
              { icon: "local_shipping", label: "Hızlı Teslimat" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-white/70">
                <span className="material-symbols-outlined text-amber-400" style={{ fontSize: "15px" }}>{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sağ Panel: Form */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-12 lg:px-16 bg-white min-h-screen">
        <div className="w-full max-w-[420px] flex flex-col justify-center flex-grow py-10">

          {/* Logo + Marka */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex flex-col items-center gap-3 group mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6b1d2f]/10 to-[#6b1d2f]/5 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow overflow-hidden border border-[#6b1d2f]/10">
                  <Image
                    src="/logo.png"
                    alt="Pekefe Logo"
                    width={68}
                    height={68}
                    className="object-contain"
                    quality={100}
                    priority
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: "11px" }}>verified</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-[#6b1d2f] tracking-tight">Pekefe</span>
            </Link>
            <h1 className="font-bold text-[#1a0a10] mb-2 leading-tight"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}>
              Hoş Geldiniz 👋
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Hesabınıza giriş yaparak özel tekliflerden yararlanın
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                E-posta Adresi
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">mail</span>
                <input
                  type="email"
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all duration-200 text-sm outline-none placeholder:text-gray-400"
                  placeholder=""
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all duration-200 text-sm outline-none placeholder:text-gray-400"
                  placeholder=""
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6b1d2f] transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Hatırla & Unut */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#6b1d2f] focus:ring-[#6b1d2f]" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Beni Hatırla</span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showNotification("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.", "success");
                }}
                className="text-sm text-[#6b1d2f] hover:underline underline-offset-4 font-semibold"
              >
                Şifremi Unuttum
              </a>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[#6b1d2f]/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer text-sm ${
                success
                  ? "bg-green-600 shadow-green-500/20"
                  : "bg-gradient-to-r from-[#6b1d2f] to-[#8b2d3f] hover:from-[#7a2035] hover:to-[#9b3349] shadow-[#6b1d2f]/20"
              }`}
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Giriş Yapılıyor...</span></>
              ) : success ? (
                <><span className="material-symbols-outlined text-[18px]">check_circle</span><span>Başarılı! Yönlendiriliyorsunuz...</span></>
              ) : (
                <><span>Giriş Yap</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
              )}
            </button>
          </form>

          {/* Kayıt linki */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Henüz bir hesabınız yok mu?{" "}
            <Link className="text-[#6b1d2f] font-bold hover:underline underline-offset-4" href="/kayit">
              Ücretsiz Kayıt Ol
            </Link>
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-auto w-full max-w-[420px] border-t border-gray-100 py-5 flex justify-between items-center text-xs text-gray-400">
          <span>© 2026 Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</span>
          <div className="flex gap-4">
            <Link className="hover:text-[#6b1d2f] transition-colors" href="/sss">Destek</Link>
            <Link className="hover:text-[#6b1d2f] transition-colors" href="/gizlilik">Gizlilik</Link>
            <Link className="hover:text-[#6b1d2f] transition-colors" href="/hikayemiz">Hakkımızda</Link>
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

export default function Giris() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-sm">Yükleniyor...</div>}>
      <GirisForm />
    </Suspense>
  );
}
