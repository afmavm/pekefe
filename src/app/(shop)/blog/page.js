"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const articles = [
    {
      id: 1,
      category: "recipe",
      categoryName: "Geleneksel Tarif",
      badgeColor: "bg-secondary-container text-on-secondary-container",
      title: "Pekmezli Kurabiye Püf Noktaları",
      desc: "Gerçek bir İspir dut pekmezli kurabiye nasıl pişirilir? İpeksi kıvamı yakalamak için uymanız gereken 5 altın kuralı bir araya getirdik.",
      img: "/ispir-dut-hasadi.png",
      meta: "45 Dakika • Orta Seviye",
    },
    {
      id: 2,
      category: "story",
      categoryName: "Hikayemiz",
      badgeColor: "bg-secondary-fixed text-on-secondary-fixed",
      title: "Hasat Vakti: Bağdan Sofraya Yolculuk",
      desc: "Pekefe ailesi olarak her yıl aynı heyecanla başladığımız bağ bozumu hikayemizi ve geleneksel yöntemlerle pekmez üretimimizi dinleyin.",
      img: "/geleneksel-kazan.png",
      meta: "12 Mart 2026 • 1.2k Okunma",
    },
    {
      id: 3,
      category: "health",
      categoryName: "Sağlıklı Yaşam",
      badgeColor: "bg-surface-container-high text-on-surface",
      title: "Doğal Enerji Deposu: Pekmez ve Ceviz",
      desc: "Modern yaşamın yorgunluğuna karşı doğanın sunduğu en güçlü karışımlardan birinin bilinmeyen faydalarını anlatıyoruz.",
      img: "/premium-pekefe-kavanoz.png",
      meta: "5 Dakika Okuma",
    },
    {
      id: 4,
      category: "recipe",
      categoryName: "Geleneksel Tarif",
      badgeColor: "bg-secondary-container text-on-secondary-container",
      title: "Geleneksel Cevizli Pestil Yapımı",
      desc: "Pekefe'nin özel reçetesiyle hazırlanan, her sofranın vazgeçilmezi olacak pratik ve lezzetli pestil tarifimiz burada.",
      img: "/el-emegi.png",
      meta: "20 Dakika • Kolay",
    },
  ];

  const categories = [
    { id: "all", name: "Tüm Yazılar" },
    { id: "recipe", name: "Geleneksel Tarifler" },
    { id: "story", name: "Pekefe Hikayeleri" },
    { id: "health", name: "Sağlıklı Yaşam" },
  ];

  const filteredArticles =
    selectedCategory === "all"
      ? articles
      : articles.filter((art) => art.category === selectedCategory);

  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
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

      setToast({
        isOpen: true,
        message: "Bültene başarıyla kaydoldunuz! En yeni tarifler e-postanıza gönderilecektir.",
        type: "success",
      });
      setNewsletterEmail("");
    } catch (err) {
      console.error("Newsletter error:", err);
      setToast({
        isOpen: true,
        message: "Bağlantı hatası oluştu. Lütfen tekrar deneyin.",
        type: "error",
      });
    }
  };

  return (
    <>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-12 mb-section-gap">
        {/* Hero Section */}
        <section className="mb-section-gap">
          <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-sm group min-h-[350px]">
            <div
              className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-[2000ms]"
              style={{
                backgroundImage: "url('/ispir-dut-hasadi.png')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-2xl text-white">
              <span className="bg-secondary text-white px-3 py-1 rounded-full text-label-sm font-label-sm mb-4 inline-block uppercase tracking-widest">
                Öne Çıkan Tarif
              </span>
              <h1 className="font-display-lg text-[24px] md:text-display-lg mb-4 md:mb-6 leading-tight">
                Geleneksel Pekmezli Kurabiyenin Sırrı
              </h1>
              <p className="font-body-lg text-body-md md:text-body-lg mb-6 md:mb-8 opacity-90 line-clamp-2">
                Anadolu'nun kalbinden gelen doğal üzüm pekmezi ile hazırlanan, ağızda dağılan bu kurabiyelerin
                nesiller boyu saklanan gizli tarifini keşfedin.
              </p>
              <Link
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-label-md hover:translate-y-[-2px] transition-all shadow-lg active:scale-95 cursor-pointer"
                href="/blog/pekmezli-kurabiye"
              >
                Tarifi İncele
                <span className="material-symbols-outlined">arrow_right_alt</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="lg:grid lg:grid-cols-12 lg:gap-gutter">
          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {/* Category Navigation */}
            <nav className="flex items-center gap-8 mb-12 overflow-x-auto pb-4 scrollbar-hide border-b border-outline-variant/30">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`font-label-md pb-2 whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "text-primary border-b-2 border-primary font-bold"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {filteredArticles.map((art) => (
                <article
                  key={art.id}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden premium-shadow group hover:shadow-md transition-all duration-300 border border-outline-variant/10"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={art.title}
                      src={art.img}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <span
                      className={`absolute top-4 left-4 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${art.badgeColor}`}
                    >
                      {art.categoryName}
                    </span>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4 text-on-surface-variant/60 text-label-sm">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span> {art.meta}
                      </span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-primary mb-4 group-hover:text-secondary transition-colors">
                      {art.title}
                    </h3>
                    <p className="font-body-md text-on-surface-variant mb-6 line-clamp-2">{art.desc}</p>
                    <Link
                      className="inline-flex items-center gap-2 text-primary font-bold hover:translate-x-1 transition-transform group/link"
                      href="/blog"
                    >
                      <span className="text-label-md">Devamını Oku</span>
                      <span className="material-symbols-outlined text-[18px]">east</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-12">
            {/* Search */}
            <div className="relative group">
              <input
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 pl-12 focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body-md outline-none"
                placeholder="Tarif veya makale ara..."
                type="text"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                search
              </span>
            </div>

            {/* Newsletter Signup (Sidebar) */}
            <div className="bg-primary p-8 rounded-xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-display-lg text-headline-md mb-4 leading-tight">Tarifleri Kaçırmayın</h4>
                <p className="font-body-md opacity-80 mb-6">
                  Her hafta en taze tarifleri ve hikayeleri e-postanıza gönderelim.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:bg-white/20 outline-none transition-all"
                    placeholder="E-posta adresiniz"
                    type="email"
                    required
                  />
                  <button
                    className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:opacity-95 transition-colors active:scale-95 cursor-pointer"
                    type="submit"
                  >
                    Kayıt Ol
                  </button>
                </form>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  restaurant
                </span>
              </div>
            </div>

            {/* Most Popular */}
            <div>
              <h4 className="font-headline-md text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
                En Popülerler
              </h4>
              <div className="space-y-6">
                <Link className="group flex gap-4 items-center" href="/blog">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant relative">
                    <Image
                      className="object-cover group-hover:scale-110 transition-transform"
                      alt="Dut Pekmezi Faydaları"
                      src="/geleneksel-pekmez.png"
                      fill
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block mb-1">
                      Sağlık
                    </span>
                    <h5 className="font-label-md text-on-surface leading-tight group-hover:text-primary transition-colors">
                      Geleneksel Dut Pekmezinin 10 Faydası
                    </h5>
                  </div>
                </Link>
                <Link className="group flex gap-4 items-center" href="/blog">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant relative">
                    <Image
                      className="object-cover group-hover:scale-110 transition-transform"
                      alt="Pekmezli Kurabiye"
                      src="/ispir-pestil-kurutma-gercek.png"
                      fill
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block mb-1">
                      Tarif
                    </span>
                    <h5 className="font-label-md text-on-surface leading-tight group-hover:text-primary transition-colors">
                      Pekmezli Kurabiye Yapımı
                    </h5>
                  </div>
                </Link>
                <Link className="group flex gap-4 items-center" href="/blog">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant relative">
                    <Image
                      className="object-cover group-hover:scale-110 transition-transform"
                      alt="Kiler Hazırlığı"
                      src="/vakumlu-uretim.png"
                      fill
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block mb-1">
                      Yaşam
                    </span>
                    <h5 className="font-label-md text-on-surface leading-tight group-hover:text-primary transition-colors">
                      Mutfak Düzeni: Kiler Hazırlığı
                    </h5>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-headline-md text-primary mb-6">Popüler Etiketler</h4>
              <div className="flex flex-wrap gap-2">
                {["organik", "geleneksel", "kahvaltı", "ispir", "tarif", "pekmez"].map((tag) => (
                  <Link
                    key={tag}
                    className="bg-surface-container-low text-on-surface-variant text-label-sm px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
                    href="/blog"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Bottom CTA / Refined Newsletter */}
      <section className="bg-surface-container-low py-section-gap">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <h2 className="font-display-lg text-display-lg text-primary mb-6">Hikayemize Ortak Olun</h2>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
            Pekefe dünyasından en özel haberler, yeni ürün lansmanları ve sadece abonelerimize özel geleneksel tarifler
            için bültenimize katılın.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-2">
            <input
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 bg-white border border-outline-variant/30 rounded-lg px-6 py-4 focus:ring-1 focus:ring-primary outline-none transition-all text-slate-800"
              placeholder="E-posta adresiniz"
              type="email"
              required
            />
            <button
              className="bg-primary text-white px-8 py-4 rounded-lg font-bold hover:opacity-95 transition-all active:scale-95 shadow-lg cursor-pointer"
              type="submit"
            >
              Katıl
            </button>
          </form>
        </div>
      </section>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}
