import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const FALLBACK_POSTS = [
  {
    id: "blog-hmf",
    title: "HMF Nedir? Pekmez Üretiminde Sıcaklık, Süre ve Güneşin Önemi",
    slug: "hmf-nedir-pekmez-uretiminde-sicakligin-onemi",
    category: "Geleneksel Üretim & Bilim",
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    metaDesc: "Dut pekmezi üretiminde HMF (5-Hidroksimetilfurfural) nedir? Yüksek ateşte yakmadan, yayla güneşinde doğal ve kontrollü yoğunlaştırmanın bilimsel incelikleri.",
    content: `HMF (5-Hidroksimetilfurfural), şeker içeren gıdaların yüksek sıcaklığa maruz kalması sırasında oluşabilen doğal bir bileşiktir. Özellikle dut pekmezi, bal, reçel ve benzeri meyve şekeri bakımından zengin ürünlerde sıcaklık ve ısıl işlem süresi, HMF oluşumunu etkileyen önemli faktörler arasında yer alır.

Pekmez üretiminde dut şırasının çok yüksek sıcaklıklarda ve uzun süre kaynatılması, HMF oluşumunun artmasına neden olabilir. Bu nedenle geleneksel pekmez üretiminde sıcaklığın kontrol edilmesi ve şıranın gereğinden fazla ısıya maruz bırakılmaması büyük önem taşır.

PEKEFE'nin geleneksel üretim anlayışında dut şırasını yüksek ateşte uzun süre kaynatmak yerine, güneş ışığının ve doğal sıcaklığın etkisinden yararlanarak kontrollü biçimde yoğunlaştırmak esastır. Bu yaklaşım, İlhan Efe'nin İspir vadisinde yıllardır sürdürdüğü geleneksel üretim anlayışının ve zanaatkarlığının önemli bir parçasıdır.

HMF oluşumu yalnızca sıcaklığa bağlı değildir. Süre, pH dengesi, meyve şekeri konsantrasyonu ve ortam koşulları da HMF miktarını etkileyebilir. Bu nedenle PEKEFE'nin yaklaşımı: “HMF yoktur” demek değil; yüksek sıcaklıkta gereksiz ve uzun süreli kaynatmadan kaçınan geleneksel üretim yöntemini benimsemektir.`,
    readTime: "4 dk okuma",
    createdAt: "2026-08-30T10:00:00.000Z",
    isHmfArticle: true
  },
  {
    id: "blog-1",
    title: "Geleneksel İspir Dut Pekmezi Nasıl Üretilir?",
    slug: "geleneksel-ispir-dut-pekmezi-nasil-uretilir",
    category: "Geleneksel Üretim",
    image: "/ispir-dut-hasadi.png",
    metaDesc: "İspir yaylalarında 2200m rakımda yetişen saf beyaz dutların bakır kazanlarda odun ateşinde ağır ağır pişirilme hikayesi.",
    content: `İspir'in el değmemiş 2200 metre üzerindeki yaylalarında yetişen saf beyaz dutlar, tam olgunlaşma döneminde silkelenerek keten bezlere toplanır.\n\nToplanan dutlar, hiçbir kimyasal katkı maddesi veya ilave şeker eklenmeksizin preslenir ve doğal şırası elde edilir. Geleneksel bakır kazanlarda, meşe odunu ateşinde saatlerce köpüğü alınarak kaynatılır.\n\nBakır kazanların yüksek ve eşit ısı iletimi, pekmezin karamelize olmadan doğal şeker dengesini ve besin değerini korumasını sağlar. Güneşte kıvam alan PEKEFE İspir Dut Pekmezi, cam kavanozlara doldurularak el değmeden mühürlenir.`,
    readTime: "5 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-2",
    title: "Ham Çiçek Balı ve İşlenmiş Bal Arasındaki 5 Temel Fark",
    slug: "ham-cicek-bali-ve-islenmis-bal-arasindaki-farklar",
    category: "Doğal Beslenme",
    image: "/ispir-kackar-yaylalari-manzara.webp",
    metaDesc: "Pastörize edilmemiş, 45 derece üzerinde ısıtılmamış hakiki ham çiçek balının polen ve canlı enzim zenginliği.",
    content: `Market raflarında gördüğünüz berrak ve akışkan ballar ile doğadan kovan çıkışı elde edilen ham bal arasında hayati besin farkları bulunur.\n\n1. Pastörizasyon: Endüstriyel ballar kristalleşmeyi önlemek için yüksek ısıda (65-70°C) ısıtılır. Bu işlem balın içindeki duyarlı enzimleri ve vitaminleri yok eder. PEKEFE ham balı ise asla 45°C üzerine çıkarılmaz.\n2. Polen Filtreleme: Endüstriyel filtreleme balın kaynağını gösteren çiçek polenlerini süzer. Ham balda polenler doğal haliyle muhafaza edilir.\n3. Kristalleşme (Donma): Hakiki ham bal soğuk ortamda zamanla kristalleşir. Bu durum balın saflığının en büyük kanıtıdır.\n4. Aroma ve Tat Zenginliği: 2200m rakımlı Kaçkar yaylalarının binbir çeşit endemik çiçeğinin kokusu sadece ham balda hissedilir.\n5. Antioksidan Değeri: Isıl işlem görmemiş ham bal yüksek antibakteriyel etkiye sahiptir.`,
    readTime: "4 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-3",
    title: "Pestil ve Köme Hazırlamanın İncelikleri: İspir Gelenekleri",
    slug: "pestil-ve-kome-hazirlamanin-incelikleri",
    category: "Yöresel Tarifler",
    image: "/ispir-pestil-kurutma-gercek.png",
    metaDesc: "Keten bezlerde güneşte kurutulan doğal dut pestili ve cevizli İspir kömesinin asırlık lezzet sırları.",
    content: `Doğu Anadolu'nun kış aylarındaki en büyük enerji kaynağı olan pestil ve köme, yaz sonu dut hasadıyla başlar.\n\nSüt, nişasta ve süzme dut şırasının bakır kazanlarda herlenmesiyle (pişirilmesiyle) elde edilen kıvamlı tatlı harç, incecik bezlere serilir. Yerli İspir cevizleri ipe dizilerek bu harca birkaç kez batırılır.\n\nTemiz dağ havasında ve doğrudan güneş ışığında kurutulan köme ve pestiller, hiçbir koruyucu madde içermeksizin lezzetini aylarca korur. PEKEFE geleneksel usta elleriyle hazırlanan kömeler, çocuklarınıza ve sevdiklerinize sunabileceğiniz en sağlıklı atıştırmalıktır.`,
    readTime: "6 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-4",
    title: "Dut Pekmezinin Sağlığa Faydaları ve Günlük Tüketim Önerileri",
    slug: "dut-pekmezinin-sagliga-faydalari",
    category: "Sağlıklı Yaşam",
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    metaDesc: "Demir, kalsiyum ve antioksidan deposu geleneksel dut pekmezinin vücut direncine ve enerji seviyesine etkileri.",
    content: `Geleneksel İspir dut pekmezi, zengin mineral ve vitamin içeriğiyle doğal bir şifa kaynağıdır.\n\n- Kansızlık ve Demir Eksikliği: İçerdiği yüksek oranda organik demir sayesinde kan yapımını destekler.\n- Sporcu ve Çocuk Enerjisi: Doğal glukoz ve fruktoz içeriğiyle gün boyu zindelik sağlar.\n- Mide ve Sindirim Rahatlığı: Sabahları aç karnına alınan bir tatlı kaşığı dut pekmezi mide asidini dengelemeye yardımcı olur.\n- Kemik Gelişimi: Kalsiyum ve magnezyum deposudur.\n\nKullanım Önerisi: Her sabah kahvaltıdan önce 1-2 tatlı kaşığı tüketebilir veya ılık suya karıştırarak doğal bir detoks içeceği hazırlayabilirsiniz.`,
    readTime: "3 dk okuma",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blog-5",
    title: "İspir Yaylalarının 2200m Rakımlı Flora Zenginliği",
    slug: "ispir-yaylalarinin-2200m-rakimli-flora-zenginligi",
    category: "Doğa & Coğrafya",
    image: "/ispir-yedi-goller-kackar-manzara.webp",
    metaDesc: "Kaçkar dağlarının eteklerindeki endemik çiçek türleri ve PEKEFE lezzetlerinin essiz aromatik kaynağı.",
    content: `Erzurum İspir bölgesi, yüksek rakımı, temiz su kaynakları ve sanayi kirliliğinden uzak bakir doğasıyla Türkiye'nin en değerli arıcılık ve meyvecilik merkezlerinden biridir.\n\n2200 metrenin üzerindeki yaylalarda yetişen binlerce endemik çiçek türü, nektar zenginliği açısından eşsizdir. Kimyasal tarım ilaçlarının ulaşamadığı bu yüksek coğrafya, PEKEFE bal ve pekmezlerinin %100 katkısız ve saf olmasının arkasındaki ana sırdır.`,
    readTime: "5 dk okuma",
    createdAt: new Date().toISOString(),
  }
];

function safeFormatDate(dateStr) {
  if (!dateStr) return "30 Ağustos 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "30 Ağustos 2026";
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "30 Ağustos 2026";
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({ where: { slug } });
  } catch {}

  if (!post) {
    post = FALLBACK_POSTS.find((p) => p.slug === slug || p.id === slug);
  }

  if (!post) {
    return { title: "Yazı Bulunamadı | Pekefe" };
  }

  const title = `${post.title} | PEKEFE Geleneksel Bilgi`;
  const description = post.metaDesc || post.title;
  const canonicalUrl = `https://pekefe.com/blog/${post.slug}`;
  const imageUrl = post.image || "/pekefe-dut-pekmezi-kavanoz-tr.jpg";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PEKEFE İspir Yöresel Ürünler",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "tr_TR",
      type: "article",
      publishedTime: post.createdAt,
      authors: ["İlhan Efe", "PEKEFE"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    keywords: [
      "hmf",
      "5-hidroksimetilfurfural",
      "dut pekmezi",
      "dut şırası",
      "pekmez üretimi",
      "ispir dut gün pekmezi",
      "geleneksel üretim",
      "pekefe",
      "ilhan efe"
    ],
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  let post = null;
  let otherPosts = [];

  try {
    post = await prisma.blogPost.findFirst({
      where: {
        OR: [{ slug: slug }, { id: slug }],
        isActive: true,
      },
    });

    if (post) {
      otherPosts = await prisma.blogPost.findMany({
        where: {
          id: { not: post.id },
          isActive: true,
        },
        take: 3,
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (dbError) {
    console.warn("DB lookup error in blog post page:", dbError);
  }

  if (!post) {
    post = FALLBACK_POSTS.find((p) => p.slug === slug || p.id === slug);
    if (!post) {
      post = FALLBACK_POSTS[0];
    }
    otherPosts = FALLBACK_POSTS.filter((p) => p.id !== post.id).slice(0, 3);
  }

  const formattedDate = safeFormatDate(post.createdAt);
  const isHmf = post.slug === "hmf-nedir-pekmez-uretiminde-sicakligin-onemi" || post.id === "blog-hmf";

  // Article JSON-LD Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDesc,
    image: post.image ? `https://pekefe.com${post.image}` : "https://pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    author: {
      "@type": "Person",
      name: "İlhan Efe",
      jobTitle: "Geleneksel İspir Üreticisi",
    },
    publisher: {
      "@type": "Organization",
      name: "PEKEFE İspir Yöresel Ürünler",
      logo: {
        "@type": "ImageObject",
        url: "https://pekefe.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://pekefe.com/blog/${post.slug}`,
    },
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <JsonLd data={articleSchema} />

      {/* Geri Dön Navigasyonu */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#b45309] hover:underline"
        >
          <span className="material-symbols-outlined text-lg">west</span>
          Tüm Blog Yazılarına Dön
        </Link>
      </div>

      {/* Başlık Bölümü */}
      <header className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-[#b45309] dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200/60 dark:border-amber-800">
            {post.category || "Genel"}
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {formattedDate} · {post.readTime || "4 dk okuma"}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#360e17] dark:text-amber-100 leading-tight">
          {post.title}
        </h1>
        {post.metaDesc && (
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {post.metaDesc}
          </p>
        )}
      </header>

      {/* Kapak Görseli */}
      {post.image && (
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden mb-12 shadow-md bg-slate-100 border border-slate-200/80 dark:border-slate-800">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Makale İçeriği */}
      <article className="prose prose-lg max-w-none text-slate-700 dark:text-slate-200 leading-relaxed mb-16 space-y-6 font-sans">
        {post.content.split("\n\n").map((paragraph, idx) => (
          <p key={idx} className="text-base md:text-[17.5px] leading-relaxed text-slate-700 dark:text-slate-200">
            {paragraph}
          </p>
        ))}

        {/* HMF Yazısına Özel 4 Aşamalı Görsel Kart & Alıntı Alanı */}
        {isHmf && (
          <div className="not-prose my-10 p-8 sm:p-10 rounded-3xl bg-[#FAF8F5] dark:bg-slate-900 border border-amber-900/10 dark:border-amber-500/20 shadow-sm space-y-8">
            
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b45309] dark:text-amber-300 block">
                ÖZET BİLİMSEL VE GELENEKSEL BAKIŞ
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#360e17] dark:text-amber-100">
                4 Temel Maddede HMF ve PEKEFE Yaklaşımı
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-[#b45309] font-bold text-sm">
                  <span className="material-symbols-outlined text-base">biotech</span> 01 — HMF
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Şeker içeren gıdalarda yüksek sıcaklık etkisiyle oluşabilen bir bileşiktir.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-[#b45309] font-bold text-sm">
                  <span className="material-symbols-outlined text-base">device_thermostat</span> 02 — Sıcaklık
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Yüksek sıcaklık ve uzun süreli ısıl işlem HMF oluşumunu artırabilir.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-[#b45309] font-bold text-sm">
                  <span className="material-symbols-outlined text-base">wb_sunny</span> 03 — PEKEFE Yöntemi
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dut şırasını yüksek ateşte uzun süre kaynatmak yerine güneşin doğal sıcaklığından yararlanılır.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-[#b45309] font-bold text-sm">
                  <span className="material-symbols-outlined text-base">eco</span> 04 — Amaç
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dutun doğal aromasını ve geleneksel üretim karakterini korumaya odaklanılır.
                </p>
              </div>
            </div>

            {/* İlhan Efe Quote Callout */}
            <blockquote className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-slate-800 dark:to-slate-800/60 border-l-4 border-[#b45309] dark:border-amber-400 space-y-3">
              <p className="font-serif italic text-slate-800 dark:text-amber-50 text-base sm:text-lg leading-relaxed">
                “Şırayı yakmadan, güneşin doğal sıcaklığından yararlanarak, uzun sürede yoğunlaştırmak.”
              </p>
              <div className="text-xs font-bold text-[#360e17] dark:text-amber-200">
                — İlhan Efe · Geleneksel İspir Üretim Kültürü
              </div>
            </blockquote>

            {/* İlgili Ürün Yönlendirme Kartı */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                  <Image
                    src="/pekefe-dut-pekmezi-kavanoz-tr.jpg"
                    alt="PEKEFE Geleneksel İspir Dut Gün Pekmezi"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">PEKEFE Geleneksel İspir Dut Gün Pekmezi</h4>
                  <p className="text-xs text-slate-500">2200m rakımlı yayla güneşinde kontrollü yoğunlaştırılmış lezzet.</p>
                </div>
              </div>
              <Link
                href="/urun/ispir-dut-gun-pekmezi"
                className="inline-flex items-center gap-1.5 bg-[#b45309] hover:bg-amber-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shrink-0 shadow-xs"
              >
                Ürünü İncele <span className="material-symbols-outlined text-sm">east</span>
              </Link>
            </div>

          </div>
        )}
      </article>

      {/* Önerilen Yazılar */}
      {otherPosts.length > 0 && (
        <section className="border-t border-slate-200/80 dark:border-slate-800 pt-12">
          <h2 className="font-serif text-2xl font-bold mb-6 text-[#360e17] dark:text-amber-100">
            İlginizi Çekebilecek Diğer Yazılar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherPosts.map((op) => (
              <Link
                key={op.id || op.slug}
                href={`/blog/${op.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-slate-100">
                    <Image
                      src={op.image || "/ispir-dut-hasadi.png"}
                      alt={op.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-amber-50 group-hover:text-[#b45309] transition-colors line-clamp-2 mb-2">
                    {op.title}
                  </h3>
                </div>
                <span className="text-xs text-[#b45309] font-bold inline-flex items-center gap-1 mt-2">
                  Oku <span className="material-symbols-outlined text-[14px]">east</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
