"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";

export default function Kampanyalar() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({
          isOpen: true,
          message: data.error || "Abonelik oluşturulurken bir hata oluştu.",
          type: "error",
        });
        return;
      }

      setSubscribed(true);
      setToast({
        isOpen: true,
        message: data.message || "Ayrıcalık bültenimize kaydoldunuz. Teşekkür ederiz.",
        type: "success",
      });
      setEmail("");
    } catch (err) {
      console.error("Newsletter error:", err);
      setToast({
        isOpen: true,
        message: "Bağlantı hatası oluştu. Lütfen tekrar deneyin.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const giftBundles = [
    {
      id: 1,
      title: "İspir Vadisi Zanaat Sandığı",
      category: "Özel Hediye Koleksiyonu",
      desc: "İspirin bereketli topraklarından sınırlı sayıda derlenen organik beyaz dut pekmezi, özel cevizli pestil ve el yapımı tahta kaşık ikram seti.",
      image: "/uploads/ispir_hikayemiz_ilhan_efe_beyaz_dut.jpg",
      badge: "Sınırlı Hasat",
      href: "/kategoriler",
    },
    {
      id: 2,
      title: "Geleneksel Sofra İkilisi: Tahin & Pekmez",
      category: "İkramlık Seçki",
      desc: "Bakır kazanlarda 60°C'de yoğunlaştırılan saf İspir dut pekmezi ile taş değirmen yerli susam tahininin muazzam dengesi.",
      image: "/geleneksel-kazan.png",
      badge: "Özel Seçki",
      href: "/kategoriler",
    },
    {
      id: 3,
      title: "Dağ Karadutu Özü & İncir Reçeli İkramı",
      category: "Şifalı İksirler",
      desc: "Toplanması büyük sabır gerektiren yabani Karadeniz karadut özü ve taze incir reçelinden oluşan bağışıklık koruyucu özel paket.",
      image: "/uploads/ispir_hikayemiz_ilhan_efe_karadut.jpg",
      badge: "Özel Hasat",
      href: "/kategoriler",
    },
  ];

  return (
    <div className="w-full bg-[#FAF9F6] text-slate-800 antialiased min-h-screen">
      {/* 1. HERO SECTION: Quiet Luxury Editorial Banner */}
      <section className="relative h-[60vh] min-h-[480px] max-h-[650px] flex items-center justify-center overflow-hidden">
        <Image
          src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
          alt="İspir Vadisi Manzarası"
          fill
          priority
          sizes="100vw"
          className="object-cover filter brightness-[0.5] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#4A0E17]/85 via-[#4A0E17]/40 to-transparent z-10"></div>

        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto space-y-6">
          <span className="inline-block text-amber-200 text-xs font-semibold tracking-[0.3em] uppercase px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            KÜLTÜR & HASAT AYRICALIKLARI
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-bold leading-tight">
            Özel Seçkiler ve Hasat Ayrıcalıkları
          </h1>
          <p className="font-light text-amber-100/90 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            İspir'in bereketli topraklarından sınırlı sayıda hazırlanan geleneksel ikramlık paketlerimizi ve sezonluk mahsul önceliklerini keşfedin.
          </p>
          <div className="w-16 h-[1px] bg-amber-400 mx-auto pt-2"></div>
        </div>
      </section>

      {/* 2. HASAT SEÇKİLERİ & HEDİYE KOLEKSİYONLARI */}
      <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-[#7f1d1d] font-bold text-xs uppercase tracking-[0.25em] block">
            ÖZEL GURME SEÇKİLERİ
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900">
            Zanaatkar Ustalığıyla Hazırlanan İkramlıklar
          </h2>
          <div className="w-12 h-[1px] bg-[#d97706] mx-auto"></div>
          <p className="text-slate-600 text-base leading-relaxed">
            Pekefe ürünleri sadece bir besin değil; sevdiklerinize armağan edebileceğiniz zamansız bir sofra deneyimidir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {giftBundles.map((bundle) => (
            <article
              key={bundle.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={bundle.image}
                    alt={bundle.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-4 left-4 bg-[#7f1d1d] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                    {bundle.badge}
                  </span>
                </div>

                <div className="p-6 md:p-8 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#d97706] block">
                    {bundle.category}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-slate-900 group-hover:text-[#7f1d1d] transition-colors leading-snug">
                    {bundle.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-light">
                    {bundle.desc}
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 pt-0">
                <Link
                  href={bundle.href}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#7f1d1d] font-bold hover:translate-x-1 transition-transform"
                >
                  <span>Koleksiyonu İncele</span>
                  <span className="material-symbols-outlined text-sm">east</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. PEKEFE DOSTU & SADAQAT / ÖNCELİKLİ MAHSUL KULÜBÜ */}
      <section className="py-20 bg-[#F5F2EC] border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[#7f1d1d] font-bold text-xs uppercase tracking-[0.25em] block">
                PEKEFE CEMAATİ & KULÜBÜ
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
                Erken Hasat Daveti & Dostluk Ayrıcalığı
              </h2>
              <p className="text-slate-700 text-base md:text-lg leading-relaxed font-light">
                Doğanın döngüsü sınırlıdır. İspirin bereketli topraklarından toplanan ilk mahsullerimiz her yıl sınırlı miktarda hazırlanır. Pekefe dostu olarak kaydolan misafirlerimiz, yeni sezon mahsullerine ilk erişim hakkına sahip olurlar.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200/60">
                  <div className="w-10 h-10 rounded-lg bg-[#7f1d1d]/10 text-[#7f1d1d] flex items-center justify-center shrink-0 font-bold">
                    <span className="material-symbols-outlined">nature_people</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Erken Hasat Önceliği</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Temmuz ve Ağustos aylarında toplanan ilk sıkım pekmez ve taze pestil mahsullerinden öncelikli haberdar olma hakkı.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200/60">
                  <div className="w-10 h-10 rounded-lg bg-[#d97706]/10 text-[#d97706] flex items-center justify-center shrink-0 font-bold">
                    <span className="material-symbols-outlined">card_giftcard</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Özel Kutulu İkram Paketleri</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Özel günlerde sevdiklerinize gönderebileceğiniz isimli ve ahşap kutulu gastronomi sunum ayrıcalığı.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/kayit"
                  className="inline-flex items-center gap-3 bg-[#7f1d1d] text-white px-8 py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-[#631717] transition-all shadow-md active:scale-95"
                >
                  <span>Pekefe Dostu Olun</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <Image
                  src="/uploads/ispir_hikayemiz_baba_ogul_beyaz_dut.jpg"
                  alt="İlhan Efe ve Okan Efe"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white space-y-1">
                  <span className="text-amber-200 text-xs font-mono tracking-widest uppercase font-bold block">İspirin bereketli toprakları</span>
                  <p className="text-sm font-display italic">"Topraktan sofraya uzanan dürüst üretim ve sadakat mirası."</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. KURUMSAL & RESTORAN GASTRONOMİ TEDARİĞİ */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-[#7f1d1d] text-white rounded-3xl p-8 md:p-16 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="text-amber-200 font-bold text-xs uppercase tracking-[0.25em] block">
              B2B & KURUMSAL TEDARİK
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight text-white">
              Gurme Restoran ve Oteller İçin Özel Hacimli Üretim
            </h2>
            <p className="text-amber-100/90 text-base md:text-lg font-light leading-relaxed">
              Özel mutfaklar, butik oteller ve kurumsal hediye çözümleri için İspir vadisinin en saf ürünlerini istenilen ambalaj ve hacimde hazırlıyoruz. Toplu ikramlık talepleriniz için ekibimizle iletişime geçebilirsiniz.
            </p>
            <div className="pt-2">
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-3 bg-white text-[#7f1d1d] px-8 py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-amber-100 transition-all shadow-md active:scale-95"
              >
                <span>Kurumsal İletişime Geçin</span>
                <span className="material-symbols-outlined text-sm">mail</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. E-POSTA AYRICALIK BÜLTENİ */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <span className="text-[#7f1d1d] font-bold text-xs uppercase tracking-[0.25em] block">
            BÜLTEN ABONELİĞİ
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900">
            Hasat Dönemlerini İlk Siz Öğrenin
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed font-light">
            Erzurum İspir'in yeni sezon üretim takvimi, özel ikramlık seçkileri ve editoryal tarif bültenimiz için e-posta adresinizi bırakabilirsiniz.
          </p>

          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="flex-1 bg-[#FAF9F6] border border-slate-300 rounded-xl px-5 py-4 text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-[#7f1d1d] outline-none text-sm"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#7f1d1d] text-white px-8 py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-[#631717] transition-all disabled:opacity-50 active:scale-95"
              >
                {submitting ? "Kaydediliyor..." : "Kayıt Ol"}
              </button>
            </form>
          ) : (
            <div className="p-6 bg-[#fdfbf7] border border-[#f3eee3] rounded-2xl max-w-md mx-auto text-emerald-800 font-medium text-sm">
              ✓ Ayrıcalık bültenimize kaydoldunuz. Yeni sezon gelişmelerini e-postanıza ileteceğiz.
            </div>
          )}
        </div>
      </section>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}
