import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

const FALLBACK_POSTS = [
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

  return {
    title: `${post.title} | Pekefe Blog`,
    description: post.metaDesc || post.title,
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

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
      {/* Geri Dön Navigasyonu */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">west</span>
          Tüm Blog Yazılarına Dön
        </Link>
      </div>

      {/* Başlık Bölümü */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            {post.category || "Genel"}
          </span>
          <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {formattedDate}
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-on-surface leading-tight mb-4">
          {post.title}
        </h1>
        {post.metaDesc && (
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            {post.metaDesc}
          </p>
        )}
      </header>

      {/* Kapak Görseli */}
      {post.image && (
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-12 shadow-sm bg-slate-100">
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
      <article className="prose prose-lg max-w-none text-slate-700 leading-relaxed mb-16 space-y-6">
        {post.content.split("\n\n").map((paragraph, idx) => (
          <p key={idx} className="text-base md:text-lg leading-relaxed">
            {paragraph}
          </p>
        ))}
      </article>

      {/* Önerilen Yazılar */}
      {otherPosts.length > 0 && (
        <section className="border-t border-slate-200 pt-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-on-surface">
            İlginizi Çekebilecek Diğer Yazılar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherPosts.map((op) => (
              <Link
                key={op.id || op.slug}
                href={`/blog/${op.slug}`}
                className="group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-3 bg-slate-100">
                    <Image
                      src={op.image || "/ispir-dut-hasadi.png"}
                      alt={op.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {op.title}
                  </h3>
                </div>
                <span className="text-xs text-primary font-bold inline-flex items-center gap-1 mt-2">
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
