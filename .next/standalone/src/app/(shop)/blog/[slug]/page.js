import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post) {
    return {
      title: "Yazı Bulunamadı | Pekefe",
    };
  }

  return {
    title: `${post.title} | Pekefe Blog`,
    description: post.metaDesc || post.title,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: {
      OR: [{ slug: slug }, { id: slug }],
      isActive: true,
    },
  });

  if (!post) {
    notFound();
  }

  // Diğer yazıları öneri olarak getir (şu anki hariç)
  const otherPosts = await prisma.blogPost.findMany({
    where: {
      id: { not: post.id },
      isActive: true,
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const formattedDate = new Date(post.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
      {/* Geri Dön Navigasyonu */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#64748b] hover:text-[#7f1d1d] font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Blog'a Dön
        </Link>
      </div>

      {/* Makale Üst Bilgileri (Header) */}
      <header className="mb-12 text-center max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-[#7f1d1d] font-bold">
          <span className="bg-[#fef2f2] border border-[#fecaca] px-3.5 py-1 rounded-full">
            {post.category || "Hikaye & Köken"}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">{formattedDate}</span>
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-bold text-[#1e293b] leading-tight pt-2">
          {post.title}
        </h1>

        {post.metaDesc && (
          <p className="text-lg md:text-xl text-slate-600 font-light leading-relaxed pt-2">
            {post.metaDesc}
          </p>
        )}
      </header>

      {/* Makale Kapak Görseli */}
      {post.image ? (
        <div className="relative w-full aspect-[21/10] rounded-2xl overflow-hidden mb-12 shadow-sm border border-slate-100">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1000px"
          />
        </div>
      ) : (
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#7f1d1d]/20 to-transparent mb-12" />
      )}

      {/* Editoryal İçerik Alanı */}
      <article className="prose prose-lg md:prose-xl max-w-none text-slate-800 leading-relaxed font-sans border-b border-slate-200 pb-16 space-y-6 [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:text-[#7f1d1d] [&_h2]:pt-6 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-slate-100 [&_p]:text-slate-700 [&_p]:leading-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-slate-700 [&_strong]:text-slate-900 [&_strong]:font-semibold [&_em]:italic [&_em]:text-slate-600">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      {/* Yazar & Marka İmzası */}
      <section className="my-12 p-6 md:p-8 bg-[#fdfbf7] border border-[#f3eee3] rounded-2xl flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[#7f1d1d] text-[#d97706] font-display text-2xl font-bold flex items-center justify-center shrink-0 shadow-inner">
          P
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-base mb-1">PEKEFE Editoryal Kurul</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            İspir'in köklü geleneklerini, lezzet zanaatını ve doğal yaşam bilincini nesillerden sofralara aktarıyoruz.
          </p>
        </div>
      </section>

      {/* İlgili Diğer Blog Yazıları */}
      {otherPosts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-slate-200">
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-8 text-center md:text-left">
            Diğer Blog Yazılarımız
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherPosts.map((other) => (
              <Link
                key={other.id}
                href={`/blog/${other.slug}`}
                className="group bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7f1d1d] block mb-2">
                    {other.category}
                  </span>
                  <h4 className="font-bold text-slate-900 group-hover:text-[#7f1d1d] transition-colors line-clamp-2 leading-snug mb-3">
                    {other.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {other.metaDesc || other.title}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#7f1d1d] font-bold">
                  <span>Oku</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    east
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
