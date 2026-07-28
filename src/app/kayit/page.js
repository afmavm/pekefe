"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Kayit() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (password !== confirmPassword) {
      setErrorMsg("Şifreler birbiriyle eşleşmiyor. Lütfen kontrol ediniz.");
      return;
    }
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/giris");
      }, 1000);
    }, 1500);
  };

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row bg-surface">
      {/* Visual Storytelling Column (Split-Screen) */}
      <div className="hidden md:flex md:w-1/2 relative bg-surface-container-low overflow-hidden min-h-screen">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage: "url('/ispir-manzara-hero.png')",
            }}
          ></div>
          {/* Subtle Tonal Overlay */}
          <div className="absolute inset-0 bg-primary/5"></div>
        </div>
        <div className="relative z-10 p-margin-desktop flex flex-col justify-between w-full h-full">
          <Link href="/" className="inline-flex items-center gap-base font-headline-md text-headline-md font-bold text-primary">
            Pekefe
          </Link>
          <div className="max-w-md">
            <h2 className="font-display-lg text-[44px] text-primary mb-gutter leading-tight">
              Gelenekle Geleceğin Buluştuğu Yer
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Pekefe ailesine katılarak yerel mirasın en saf haliyle buluşun. Her detayında özen, her köşesinde hikaye olan bir dünyaya adım atın.
            </p>
          </div>
          <div className="flex gap-gutter items-center">
            <div className="w-12 h-[1px] bg-secondary"></div>
            <span className="font-label-md text-label-md text-secondary tracking-widest uppercase">
              Est. 1924
            </span>
          </div>
        </div>
      </div>

      {/* Registration Form Column */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface min-h-screen">
        <div className="w-full max-w-md">
          {/* Branding for Mobile */}
          <div className="md:hidden mb-8">
            <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
              Pekefe
            </Link>
          </div>
          <div className="mb-gutter">
            <h1 className="font-headline-lg text-primary mb-base">Yeni Hesap Oluştur</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Kişiselleştirilmiş bir alışveriş deneyimi için bilgilerinizi girin.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase ml-1">
                Ad Soyad
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  type="text"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-4 pl-12 pr-4 font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Mehmet Yılmaz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase ml-1">
                E-posta
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  type="email"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-4 pl-12 pr-4 font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="ornek@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase ml-1">
                Telefon Numarası
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  phone_iphone
                </span>
                <input
                  type="tel"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-4 pl-12 pr-4 font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase ml-1">
                Şifre
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  type="password"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-4 pl-12 pr-4 font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Password Confirmation */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase ml-1">
                Şifre Tekrar
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  verified_user
                </span>
                <input
                  type="password"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-4 pl-12 pr-4 font-body-md text-on-surface transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span className="font-body-md text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Kullanım Koşullarını ve Gizlilik Politikasını okudum, onaylıyorum.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <span className="font-body-md text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Kampanyalardan haberdar olmak istiyorum.
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2" role="alert">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full text-white font-label-md py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-[0.98] mt-4 flex items-center justify-center gap-3 cursor-pointer ${
                success ? "bg-green-700" : "bg-primary hover:bg-primary/95"
              }`}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : success ? (
                "Hesap Oluşturuldu!"
              ) : (
                "Kayıt Ol"
              )}
            </button>
          </form>

          {/* Redirect to Login */}
          <div className="mt-8 text-center">
            <p className="font-body-md text-on-surface-variant">
              Zaten bir hesabınız var mı?
              <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1 transition-all" href="/giris">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
