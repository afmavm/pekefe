"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Modal } from "@/components/ui/Modal";

export default function Kayit() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State for Legal Documents (prevents page navigation)
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null

  // ── Form Alanlarının Boş Gelmesini Sağla (Clean Empty State) ──
  useEffect(() => {
    try {
      sessionStorage.removeItem("pekefe_register_draft");
    } catch (e) {}
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  }, []);

  // Form alanları değiştikçe taslağı güncelle
  const updateDraft = (key, val) => {
    try {
      const current = JSON.parse(sessionStorage.getItem("pekefe_register_draft") || "{}");
      const updated = { ...current, [key]: val };
      sessionStorage.setItem("pekefe_register_draft", JSON.stringify(updated));
    } catch {}
  };

  // Şifre gücü hesaplama
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Zayıf", "Orta", "İyi", "Güçlü"][passwordStrength];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"][passwordStrength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (password !== confirmPassword) {
      setErrorMsg("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, newsletter }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Kayıt sırasında bir hata oluştu.");
        return;
      }

      // Kayıt başarılı -> taslağı temizle
      sessionStorage.removeItem("pekefe_register_draft");
      setSuccess(true);

      setTimeout(async () => {
        await signIn("credentials", { email, password, callbackUrl: "/hesap" });
      }, 1200);
    } catch {
      setLoading(false);
      setErrorMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">

      {/* Sol Panel: Görsel */}
      <section className="hidden md:flex md:w-[48%] relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#1a0a10]/75 via-[#1a0a10]/15 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#1a0a10]/25 to-transparent pointer-events-none" />
        <Image
          src="/ispir-manzara-hero.png"
          alt="İspir Yaylası – Pekefe"
          className="object-cover object-center hover:scale-105 transition-transform duration-[8s]"
          fill
          sizes="48vw"
          priority
          quality={100}
        />
        {/* Üst logo */}
        <div className="absolute top-8 left-8 z-30">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Pekefe" width={32} height={32} quality={100} className="object-contain" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight drop-shadow">Pekefe</span>
          </Link>
        </div>
        {/* Alt içerik */}
        <div className="absolute bottom-10 left-10 right-10 z-30">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-amber-400" />
            <span className="text-amber-300/90 text-xs font-bold tracking-[0.2em] uppercase">Pekefe Ailesi</span>
          </div>
          <h2 className="text-white font-bold leading-[1.1] mb-3 drop-shadow-lg"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}>
            Gelenekle<br />Geleceğin<br />Buluştuğu Yer
          </h2>
          <p className="text-white/70 leading-relaxed max-w-xs"
            style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)" }}>
            Pekefe ailesine katıl, yerel mirasın en saf haliyle buluş.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { value: "100+", label: "Yıllık Gelenek" },
              { value: "2200m", label: "Yayla Rakımı" },
              { value: "%100", label: "Doğal İçerik" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 text-center">
                <div className="text-white font-bold text-base">{value}</div>
                <div className="text-white/60 text-[10px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sağ Panel: Form */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-10 lg:px-14 bg-white min-h-screen py-10">
        <div className="w-full max-w-[400px]">

          {/* Mobil Logo */}
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl border border-[#6b1d2f]/10 flex items-center justify-center">
              <Image src="/logo.png" alt="Pekefe" width={32} height={32} quality={100} className="object-contain" />
            </div>
            <span className="font-bold text-lg text-[#6b1d2f]">Pekefe</span>
          </div>

          {/* Başlık */}
          <div className="mb-7">
            <h1 className="font-bold text-[#1a0a10] mb-1.5 leading-tight"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}>
              Hesap Oluştur ✨
            </h1>
            <p className="text-gray-500 text-sm">
              Kişiselleştirilmiş alışveriş deneyimi için katılın
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate autoComplete="off">

            {/* Ad Soyad */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Ad Soyad</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">person</span>
                <input
                  type="text" required
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none placeholder:text-gray-400"
                  placeholder=""
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">E-posta</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">mail</span>
                <input
                  type="email" required
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none placeholder:text-gray-400"
                  placeholder=""
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Telefon */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Telefon</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">phone_iphone</span>
                <input
                  type="tel" required
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none placeholder:text-gray-400"
                  placeholder=""
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Şifre</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">lock</span>
                <input
                  type={showPassword ? "text" : "password"} required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none placeholder:text-gray-400"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6b1d2f] transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
              {/* Şifre gücü */}
              {password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold ${["", "text-red-500", "text-yellow-600", "text-blue-600", "text-green-600"][passwordStrength]}`}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Şifre Tekrar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Şifre Tekrar</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">
                  {confirmPassword && confirmPassword === password ? "verified_user" : "lock"}
                </span>
                <input
                  type={showConfirm ? "text" : "password"} required
                  autoComplete="new-password"
                  placeholder=""
                  className={`w-full pl-10 pr-11 py-3.5 rounded-xl border bg-gray-50 focus:bg-white focus:ring-2 transition-all text-sm outline-none placeholder:text-gray-400 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : confirmPassword && confirmPassword === password
                      ? "border-green-300 focus:border-green-400 focus:ring-green-100"
                      : "border-gray-200 focus:border-[#6b1d2f] focus:ring-[#6b1d2f]/10"
                  }`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6b1d2f] transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Onay kutuları */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox" required
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#6b1d2f] focus:ring-[#6b1d2f]"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors leading-relaxed">
                  <button
                    type="button"
                    onClick={() => setActiveModal("terms")}
                    className="text-[#6b1d2f] font-semibold hover:underline cursor-pointer"
                  >
                    Kullanım Koşulları
                  </button>
                  {" "}ve{" "}
                  <button
                    type="button"
                    onClick={() => setActiveModal("privacy")}
                    className="text-[#6b1d2f] font-semibold hover:underline cursor-pointer"
                  >
                    Gizlilik Politikası
                  </button>
                  'nı okudum, onaylıyorum.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#6b1d2f] focus:ring-[#6b1d2f]"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                  Kampanya ve yeni ürün duyurularından haberdar olmak istiyorum.
                </span>
              </label>
            </div>

            {/* Hata */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2" role="alert">
                <span className="material-symbols-outlined text-[16px] flex-shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Kayıt Butonu */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer text-sm mt-2 ${
                success
                  ? "bg-green-600 shadow-green-500/20"
                  : "bg-gradient-to-r from-[#6b1d2f] to-[#8b2d3f] hover:from-[#7a2035] hover:to-[#9b3349] shadow-[#6b1d2f]/20"
              }`}
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Kayıt Oluşturuluyor...</span></>
              ) : success ? (
                <><span className="material-symbols-outlined text-[18px]">check_circle</span><span>Hesap Oluşturuldu!</span></>
              ) : (
                <><span>Ücretsiz Kayıt Ol</span><span className="material-symbols-outlined text-[18px]">person_add</span></>
              )}
            </button>
          </form>

          {/* Giriş linki */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Zaten bir hesabınız var mı?{" "}
            <Link className="text-[#6b1d2f] font-bold hover:underline underline-offset-4" href="/giris">
              Giriş Yap
            </Link>
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-auto w-full max-w-[400px] border-t border-gray-100 py-5 flex justify-between items-center text-xs text-gray-400">
          <span>© 2026 Pekefe Geleneksel Lezzetler. Tüm hakları saklıdır.</span>
          <div className="flex gap-4">
            <Link className="hover:text-[#6b1d2f] transition-colors" href="/sss">Destek</Link>
            <button type="button" onClick={() => setActiveModal("privacy")} className="hover:text-[#6b1d2f] transition-colors cursor-pointer">Gizlilik</button>
          </div>
        </footer>
      </section>

      {/* ── MODAL: Kullanım Koşulları & Mesafeli Satış Sözleşmesi ── */}
      <Modal
        isOpen={activeModal === "terms"}
        onClose={() => setActiveModal(null)}
        title={
          <div className="flex items-center gap-2 text-[#6b1d2f]">
            <span className="material-symbols-outlined text-2xl">description</span>
            <span className="font-bold text-lg">Kullanım Koşulları ve Sözleşme</span>
          </div>
        }
        size="lg"
      >
        <div className="space-y-6 text-gray-600 text-sm leading-relaxed p-1">
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5">info</span>
            <p className="text-xs text-amber-900 leading-normal">
              Pekefe E-Ticaret platformunu kullanarak aşağıdaki şartları ve Mesafeli Satış Sözleşmesi şartlarını kabul etmiş sayılırsınız.
            </p>
          </div>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">1. Taraflar ve Hizmet Kapsamı</h3>
            <p>
              İşbu sözleşme, Pekefe Geleneksel Gıda Ürünleri Ltd. Şti. ("Satıcı") ile Pekefe platformu üzerinden üye olan veya alışveriş yapan kullanıcı ("Müşteri") arasında akdedilmiştir. Satıcı, Anadolu'nun geleneksel lezzetlerini gıda hijyeni standartlarına uygun olarak sunmayı taahhüt eder.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">2. Üyelik ve Hesap Güvenliği</h3>
            <p>
              Müşteri, üye olurken verdiği bilgilerin doğru ve güncel olduğunu beyan eder. Şifrenin güvenliğinden Müşteri kendisi sorumludur. Hesabınız üzerinden yapılan tüm işlemler sizin sorumluluğunuzdadır.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">3. Sipariş ve Teslimat Koşulları</h3>
            <p>
              Verilen siparişler kargo firmaları aracılığıyla koruyucu ambalajlarla gönderilir. Teslimat sırasında paket hasarlı ise kargo görevlisine tutanak tutturulmalıdır. Gıda güvenliği gereğince ambalajı açılmış ürünlerde iade prosedürleri yönetmeliğe tabi tutulur.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">4. Fikri Mülkiyet Hakları</h3>
            <p>
              Pekefe markasına ait logo, görseller, metinler ve tüm yazılımsal içerikler telif hakları ile korunmaktadır. İzin alınmaksızın çoğaltılamaz ve kullanılamaz.
            </p>
          </section>

          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/sozlesme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-[#6b1d2f] flex items-center gap-1 font-medium underline"
            >
              <span>Ayrı sekmede tam metni oku</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setActiveModal(null);
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#6b1d2f] text-white font-bold text-xs rounded-xl hover:bg-[#8b2d3f] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#6b1d2f]/15"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Okudum ve Onaylıyorum</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Gizlilik Politikası & KVKK Aydınlatma Metni ── */}
      <Modal
        isOpen={activeModal === "privacy"}
        onClose={() => setActiveModal(null)}
        title={
          <div className="flex items-center gap-2 text-[#6b1d2f]">
            <span className="material-symbols-outlined text-2xl">shield</span>
            <span className="font-bold text-lg">Gizlilik Politikası ve KVKK</span>
          </div>
        }
        size="lg"
      >
        <div className="space-y-6 text-gray-600 text-sm leading-relaxed p-1">
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 text-xl flex-shrink-0 mt-0.5">verified_user</span>
            <p className="text-xs text-blue-900 leading-normal">
              Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca güvence altındadır.
            </p>
          </div>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">1. Veri Sorumlusu</h3>
            <p>
              6698 sayılı KVKK uyarınca kişisel verileriniz; Pekefe Geleneksel Gıda Ürünleri Ltd. Şti. tarafından veri sorumlusu sıfatıyla işlenmektedir.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">2. İşlenen Veriler ve İşleme Amaçları</h3>
            <p>
              Ad, soyad, e-posta adresi, telefon numarası ve teslimat adresi bilgileriniz; siparişlerin hazırlanması, faturalandırılması, kargo takibi ve müşteri desteği hizmetlerinin yürütülmesi amacıyla işlenmektedir.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">3. Veri Güvenliği ve Paylaşım</h3>
            <p>
              Kişisel verileriniz hiçbir koşulda üçüncü şahıslara ticari amaçlarla satılmaz. Veriler yalnızca sipariş teslimatı için anlaşmalı kargo firmaları ve yasal zorunluluklar çerçevesinde yetkili kamu kurumları ile paylaşılır.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-[#6b1d2f] text-base mb-2">4. Haklarınız (KVKK Madde 11)</h3>
            <p>
              Dilediğiniz zaman verilerinizin işlenip işlenmediğini öğrenme, silinmesini veya düzeltilmesini talep etme hakkına sahipsiniz. Başvurularınızı info@pekefe.com adresine iletebilirsiniz.
            </p>
          </section>

          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/gizlilik"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-[#6b1d2f] flex items-center gap-1 font-medium underline"
            >
              <span>Ayrı sekmede tam metni oku</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setActiveModal(null);
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#6b1d2f] text-white font-bold text-xs rounded-xl hover:bg-[#8b2d3f] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#6b1d2f]/15"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Anladım ve Onaylıyorum</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </main>
  );
}
