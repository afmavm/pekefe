"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";

const DEFAULT_CLIENT_POSTS = [
  {
    id: "blog-hmf",
    title: "HMF Nedir? Pekmez Üretiminde Sıcaklık, Süre ve Güneşin Önemi",
    slug: "hmf-nedir-pekmez-uretiminde-sicakligin-onemi",
    category: "Geleneksel Üretim & Bilim",
    image: "/uploads/hmf-bilimsel-laboratuvar-analizi.jpg",
    metaDesc: "Dut pekmezi üretiminde HMF (5-Hidroksimetilfurfural) nedir? Yüksek ateşte yakmadan, yayla güneşinde doğal ve kontrollü yoğunlaştırmanın bilimsel incelikleri.",
    content: "HMF (5-Hidroksimetilfurfural), şeker içeren gıdaların yüksek sıcaklığa maruz kalması sırasında oluşabilen bir bileşiktir. Pekmez üretiminde dut şırasının çok yüksek sıcaklıklarda kaynatılması HMF oluşumunu artırabilir. PEKEFE olarak dut şırasını ateşte yakmak yerine İspir yaylasının doğal güneş sıcaklığından yararlanarak kontrollü biçimde yoğunlaştırıyoruz.",
    readTime: "4 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-gun-pekmezi",
    title: "İspir Dut Gün Pekmezi Nedir? Klasik Pekmezden Farkı ve Güneşle Yoğunlaştırma Sanatı",
    slug: "ispir-dut-gun-pekmezi-nedir-klasik-pekmezden-farki",
    category: "Geleneksel Üretim & Bilim",
    image: "/uploads/ispir-bakir-kazan-ahsap-cendere.webp",
    metaDesc: "İspir Dut Gün Pekmezi nedir? Güneşin doğal sıcaklığıyla sabırla yoğunlaştırılan geleneksel gün pekmezinin klasik kaynatma pekmezden farkları ve 7 aşamalı üretim süreci.",
    content: "Dut Gün Pekmezi, olgunlaşmış beyaz dutların suyu çıkarıldıktan sonra güneş altında bekletilerek suyunun doğal olarak buharlaştırılması ve sabırla yoğunlaştırılmasıyla elde edilir. Buradaki 'gün' kelimesi güneş anlamında kullanılır.",
    readTime: "5 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-trt-tkdk-hikaye",
    title: "TRT Haber ve TKDK Belgeseli: İlhan Efe ve Pekefe’nin Doğuş Hikayesi",
    slug: "trt-haber-tkdk-ilhan-efe-pekefe-dogus-hikayesi",
    category: "Marka & Miras",
    image: "/uploads/trthaber_ilhan_efe_roportaj.jpg",
    metaDesc: "21 Eylül 2017 TRT Haber 'Memleketten Haber Var' belgeseli ve TKDK bülteninde yayınlanan İlhan Efe'nin bir emekli öğretmenden modern tesise uzanan başarı öyküsü.",
    content: "Erzurum İspir'de emekli öğretmen İlhan Efe'ye ait pekmez üretim tesisi, TRT Haber ekranlarında 'Memleketten Haber Var' programına konuk oldu. 2013'te TKDK desteğiyle kurulan Avrupa Birliği onaylı tesisimizde şırayı yakmadan üretim yapıyoruz.",
    readTime: "6 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-saglik-faydalari",
    title: "Dut Pekmezinin Kanıtlanmış 9 Şifa Faydası ve Besin Değerleri",
    slug: "dut-pekmezinin-kanitlanmis-9-sifa-faydasi",
    category: "Sağlık & Beslenme",
    image: "/uploads/ispir_hikayemiz_ilhan_efe_beyaz_dut.jpg",
    metaDesc: "2 yemek kaşığı (20g) dut pekmezinde 2mg demir, 80mg kalsiyum! Kansızlıktan mide ülserine, astımdan çocuk gelişimine dut pekmezinin kanıtlanmış 9 şifası.",
    content: "Hakiki dut pekmezi mineral bakımından son derece yüksek değerde olup kadim tıptan günümüze şifa kaynağıdır. Yalnızca 2 yemek kaşığı (20 gram) pekmez; 2 mg demir ve 80 mg kalsiyum içerir.",
    readTime: "4 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-hasavan-hasat",
    title: "Hasavandan Sofraya: Asırlık İspir Beyaz Dut Hasadı ve Sıfır Atık Döngüsü",
    slug: "hasavandan-sofraya-ispir-beyaz-dut-hasadi",
    category: "Geleneksel Üretim & Bilim",
    image: "/uploads/ispir_hikayemiz_baba_ogul_beyaz_dut.jpg",
    metaDesc: "Dört kişi tarafından tutulan geleneksel hasavan bezinden kazanlara, oradan da posaların hayvan yemine dönüştüğü sıfır atıklı İspir dut hasadı kültürü.",
    content: "Dört kişinin köşelerinden tuttuğu 'hasavan' dokuma bezi üzerine dutların silkelenmesiyle toprağa değmeden toplanan beyaz dutlar ve posaların hayvan yemine dönüştüğü sıfır atık modeli.",
    readTime: "4 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-dut-sirkesi",
    title: "Doğal Fermantasyon İspir Dut Sirkesi ve Sağlığa Benzersiz Faydaları",
    slug: "dogal-fermantasyon-ispir-dut-sirkesi-faydalari",
    category: "Geleneksel Üretim & Bilim",
    image: "/uploads/ispir-dut-sirkesi-fermantasyon.jpg",
    metaDesc: "İlhan Efe'nin İspir tesisinde başlattığı doğal fermantasyon dut sirkesi üretimi, sirke anası ile olgunlaşan probiyotik şifa kaynağının incelikleri.",
    content: "Doğal sirke anası ile meşe fıçılarda aylarca fermente edilen canlı probiyotik dut sirkesi, sindirimi rahatlatır ve bağışıklığı güçlendirir.",
    readTime: "3 dk okuma",
    createdAt: new Date().toISOString(),
  }
];

function formatBlogDate(dateStr) {
  if (!dateStr) return "6 Ağustos 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "6 Ağustos 2026";
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "6 Ağustos 2026";
  }
}

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [articles, setArticles] = useState(DEFAULT_CLIENT_POSTS);
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
          if (Array.isArray(data) && data.length > 0) {
            setArticles(data);
          }
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
                <span className="bg-secondary text-white px-3 py-1 rounded-full text-label-sm font-label-sm mb-4 inline-block uppercase tracking-widest font-bold">
                  {heroArticle.category || "Öne Çıkan"}
                </span>
                <h1 className="font-display text-[24px] md:text-4xl font-bold mb-4 md:mb-6 leading-tight text-white">
                  {heroArticle.title}
                </h1>
                <p className="font-body-lg text-body-md md:text-body-lg mb-6 md:mb-8 opacity-90 line-clamp-2">
                  {heroArticle.metaDesc || heroArticle.title}
                </p>
                <Link
                  className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-bold hover:translate-y-[-2px] transition-all shadow-lg active:scale-95 cursor-pointer"
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
            {/* Category Navigation (Clean Quiet Luxury Pills, No Scrollbar) */}
            <nav 
              aria-label="Blog Kategorileri"
              className="flex items-center gap-2.5 mb-10 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
                    selectedCategory === cat.id
                      ? "bg-[#360e17] text-white shadow-md ring-2 ring-[#360e17]/20"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 hover:text-[#b45309] border border-slate-200/60 dark:border-slate-700"
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
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary text-white">
                          {art.category || "Genel"}
                        </span>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-3 text-slate-400 text-xs">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>{" "}
                            {formatBlogDate(art?.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-bold text-xl text-on-surface mb-3 group-hover:text-primary transition-colors leading-snug">
                          <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                        </h3>
                        <p className="text-on-surface-variant text-sm mb-6 line-clamp-3 leading-relaxed">
                          {art.metaDesc || art.title}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 md:px-8 pb-6 pt-0">
                      <Link
                        className="inline-flex items-center gap-2 text-primary font-bold hover:translate-x-1 transition-transform group/link text-sm"
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
            <div className="bg-primary p-8 rounded-xl text-white relative overflow-hidden shadow-sm">
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
                    className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition-colors active:scale-95 cursor-pointer text-sm disabled:opacity-50"
                    type="submit"
                  >
                    {submitting ? "Kayıt Olunuyor..." : "Kayıt Ol"}
                  </button>
                </form>
              </div>
            </div>

            {/* Most Popular / Son Eklenenler */}
            <div>
              <h4 className="font-bold text-on-surface text-lg mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">menu_book</span>
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
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">
                        {art.category || "Genel"}
                      </span>
                      <h5 className="text-sm font-bold text-on-surface leading-tight group-hover:text-primary transition-colors line-clamp-2">
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


