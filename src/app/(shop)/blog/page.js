"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/blog");
        if (res.ok) {
          const data = await res.json();
          setArticles(data);
        }
      } catch (err) {
        console.error("Blog get hatası:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const categoryNames = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));
  const categories = [
    { id: "all", name: "Tüm Yazılar" },
    ...categoryNames.map((c) => ({ id: c, name: c })),
  ];

  const filteredArticles =
    selectedCategory === "all"
      ? articles
      : articles.filter((art) => art.category === selectedCategory);

  const heroArticle = articles.length > 0 ? articles[0] : null;

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setSubmitting(true);
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
        message: data.message || "Bültene başarıyla kaydoldunuz! En yeni hikayeler e-postanıza gönderilecektir.",
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-12 mb-section-gap">
        {/* Hero Section - Öne Çıkan Yazı */}
        {heroArticle && (
          <section className="mb-section-gap">
            <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-sm group min-h-[350px]">
              <div
                className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-[2000ms]"
                style={{
                  backgroundImage: `url('${heroArticle.image || "/ispir-dut-hasadi.png"}')`,
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#7f1d1d]/90 via-[#7f1d1d]/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-2xl text-white">
                <span className="bg-[#d97706] text-white px-3 py-1 rounded-full text-label-sm font-label-sm mb-4 inline-block uppercase tracking-widest font-bold">
                  {heroArticle.category || "Öne Çıkan"}
                </span>
                <h1 className="font-display text-[24px] md:text-4xl font-bold mb-4 md:mb-6 leading-tight text-white">
                  {heroArticle.title}
                </h1>
                <p className="font-body-lg text-body-md md:text-body-lg mb-6 md:mb-8 opacity-90 line-clamp-2">
                  {heroArticle.metaDesc || heroArticle.title}
                </p>
                <Link
                  className="inline-flex items-center gap-2 bg-white text-[#7f1d1d] px-8 py-4 rounded-lg font-bold hover:translate-y-[-2px] transition-all shadow-lg active:scale-95 cursor-pointer"
                  href={`/blog/${heroArticle.slug}`}
                >
                  Yazıyı İncele
                  <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>
          </section>
        )}

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
                      ? "text-[#7f1d1d] border-b-2 border-[#7f1d1d] font-bold"
                      : "text-slate-600 hover:text-[#7f1d1d]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>

            {/* Article Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-slate-100 h-80 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Bu kategoride henüz yazı bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredArticles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/80 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                        <Image
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={art.title}
                          src={art.image || "/ispir-dut-hasadi.png"}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#7f1d1d] text-white">
                          {art.category || "Genel"}
                        </span>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-3 text-slate-400 text-xs">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>{" "}
                            {new Date(art.createdAt).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-[#7f1d1d] transition-colors leading-snug">
                          <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                        </h3>
                        <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                          {art.metaDesc || art.title}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 md:px-8 pb-6 pt-0">
                      <Link
                        className="inline-flex items-center gap-2 text-[#7f1d1d] font-bold hover:translate-x-1 transition-transform group/link text-sm"
                        href={`/blog/${art.slug}`}
                      >
                        <span>Devamını Oku</span>
                        <span className="material-symbols-outlined text-[18px]">east</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-12">
            {/* Newsletter Signup (Sidebar) */}
            <div className="bg-[#7f1d1d] p-8 rounded-xl text-white relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <h4 className="font-display text-2xl font-bold mb-3 leading-tight text-white">
                  Hikayeleri Kaçırmayın
                </h4>
                <p className="text-sm opacity-90 mb-6 leading-relaxed">
                  İspir'in geleneksel lezzetlerini, özel üretim hikayelerini ve yöresel tarifleri ilk siz öğrenin.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                  <input
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/60 focus:bg-white/20 outline-none transition-all text-sm"
                    placeholder="E-posta adresiniz"
                    type="email"
                    required
                  />
                  <button
                    disabled={submitting}
                    className="w-full bg-[#d97706] text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition-colors active:scale-95 cursor-pointer text-sm disabled:opacity-50"
                    type="submit"
                  >
                    {submitting ? "Kayıt Olunuyor..." : "Kayıt Ol"}
                  </button>
                </form>
              </div>
            </div>

            {/* Most Popular / Son Eklenenler */}
            <div>
              <h4 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d97706]">auto_awesome</span>
                Öne Çıkan Yazılar
              </h4>
              <div className="space-y-6">
                {articles.slice(0, 3).map((art) => (
                  <Link key={art.id} className="group flex gap-4 items-center" href={`/blog/${art.slug}`}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 relative">
                      <Image
                        className="object-cover group-hover:scale-110 transition-transform"
                        alt={art.title}
                        src={art.image || "/ispir-dut-hasadi.png"}
                        fill
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#7f1d1d] tracking-wider block mb-1">
                        {art.category || "Genel"}
                      </span>
                      <h5 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#7f1d1d] transition-colors line-clamp-2">
                        {art.title}
                      </h5>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}
