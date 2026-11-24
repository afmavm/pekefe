import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { readLocalBlogPostsFallback, writeLocalBlogPostsFallback } from '@/app/api/blog/route';
import { syncPostToBlogger } from '@/lib/blogger-sync';

export const dynamic = 'force-dynamic';

const HIGH_INTENT_SEO_POSTS = [
  {
    id: 'blog-seo-gun-pekmezi-rehberi',
    title: 'Hakiki İspir Dut Pekmezi Nasıl Anlaşılır? Gün Pekmezi ile Kaynatma Pekmez Arasındaki 6 Fark',
    slug: 'hakiki-ispir-dut-pekmezi-nasil-anlasilir-gun-pekmezi-farki',
    category: 'Üretim',
    image: '/pekefe-dut-pekmezi-kavanoz-tr.jpg',
    metaDesc:
      'Hakiki İspir dut pekmezi nasıl anlaşılır? Güneşte yoğunlaştırılan gün pekmezi ile yüksek ateşte kaynatılan pekmez arasındaki renk, tat, kıvam ve HMF farkları.',
    isFeatured: true,
    isActive: true,
    content: `<h2>Hakiki İspir Dut Pekmezi Neden Farklıdır?</h2>
<p>Erzurum'un İspir vadisi, yüksek rakımı, bol güneşli yaz günleri ve nemsiz dağ rüzgârlarıyla Anadolu'nun en aromatik beyaz dutlarının yetiştiği özel bir mikroklimaya sahiptir. Ancak her dut pekmezi aynı değildir. Üretimde kullanılan <strong>ısı ve yoğunlaştırma yöntemi</strong>, pekmezin besin değerini, rengini ve içim yumuşaklığını doğrudan belirler.</p>

<h3>Gün Pekmezi ile Kaynatma Pekmez Arasındaki 6 Temel Fark</h3>
<ol>
  <li><strong>Güneşin Doğal Sıcaklığı vs. Yüksek Ateş:</strong> Geleneksel İspir gün pekmezinde dut şırası yüksek ateşte uzun süre kaynatılmaz; sığ tepsilerde İspir güneşinin doğal sıcaklığıyla sabırla yoğunlaştırılır.</li>
  <li><strong>Yanık Tat Bırakmaz:</strong> Yüksek ısıda kaynatılan pekmezlerde karamelizasyon aşırıya kaçtığı için boğazda yanma ve acımsı bir tat oluşabilir. Gün pekmezi ise yumuşak, ferah ve meyvemsi bir içime sahiptir.</li>
  <li><strong>Doğal Kehribar Rengi:</strong> Aşırı ısıya maruz kalmayan dut şırası kömürleşmez; ışığa tutulduğunda berrak, koyu kehribar tonunu korur.</li>
  <li><strong>Düşük HMF Yaklaşımı:</strong> Şeker içeren gıdalar yüksek sıcaklıkta uzun süre bekletildiğinde HMF (5-Hidroksimetilfurfural) artışı görülebilir. Kontrollü ve güneşte yoğunlaştırma yöntemi bu riski en aza indirmeyi hedefler.</li>
  <li><strong>Sıfır İlave Şeker ve Glikoz Şurubu:</strong> Hakiki dut pekmezi yalnızca olgun beyaz dutların kendi öz şırasından oluşur; kıvam artırıcı veya rafine şeker içermez.</li>
  <li><strong>Doğal Kristalleşme (Şekerlenme):</strong> Katkısız dut pekmezi serin ortamda uzun süre beklediğinde doğal meyve şekerinden dolayı hafifçe koyulaşabilir; bu bozulma değil saflık işaretidir.</li>
</ol>

<h3>Evde Hakiki Dut Pekmezi Nasıl Test Edilir?</h3>
<ul>
  <li><strong>Kaşık Akışkanlığı:</strong> Soğuk kaşıktan kopmadan, ip gibi ama ağır akmalıdır. Su gibi hızlı akıyorsa yeterince yoğunlaştırılmamıştır; sakız gibi uzuyorsa glikoz şurubu şüphesi taşır.</li>
  <li><strong>Boğaz Hissi:</strong> Yutulduğunda boğazı yakmayan, doğal dut aroması bırakan pekmez doğru ısıda işlenmiş demektir.</li>
  <li><strong>Etiket Okuma:</strong> İçindekiler listesinde sadece <em>"%100 Dut Şırası"</em> yazmalıdır.</li>
</ul>

<div style="background-color:#fdf8f6;border:1px solid #e7d5cc;padding:20px;border-radius:16px;margin:24px 0;text-align:center;">
  <h3 style="color:#6b1d2f;margin-top:0;">İspir Yaylalarından Sofranıza %100 Doğal Pekmez</h3>
  <p style="font-size:14px;color:#475569;">Katkısız, ilave şekersiz geleneksel üretim <strong>PEKEFE İspir Dut Pekmezi</strong> ve <strong>Karadut Pekmezi</strong> çeşitlerimizi hemen inceleyin.</p>
  <a href="/urun/pekefe-ispir-dut-pekmezi" style="display:inline-block;background-color:#6b1d2f;color:#ffffff;padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none;margin:6px;">İspir Dut Pekmezini İncele →</a>
  <a href="/urun/pekefe-ispir-karadut-pekmezi" style="display:inline-block;background-color:#b45309;color:#ffffff;padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none;margin:6px;">Karadut Pekmezini İncele →</a>
</div>`,
  },
  {
    id: 'blog-seo-cevizli-kome-rehberi',
    title: 'Cevizli Dut Kömesi (Cevizli Sucuk) Nedir? Tek Çekim Köme ile Klasik Köme Farkı',
    slug: 'cevizli-dut-komesi-nedir-tek-cekim-kome-farki-ve-kalori',
    category: 'Tarifler',
    image: '/images/mega-menu/kome-production.jpg',
    metaDesc:
      'Erzurum İspir cevizli dut kömesi (cevizli sucuk) nasıl yapılır? Tek çekim köme ile klasik cevizli köme arasındaki fark, besin değerleri ve taze saklama ipuçları.',
    isFeatured: true,
    isActive: true,
    content: `<h2>İspir Cevizli Dut Kömesi Nedir?</h2>
<p>Türkiye'nin pek çok yöresinde <em>cevizli sucuk</em> olarak bilinen, Erzurum ve İspir kültüründe ise <strong>köme</strong> adıyla anılan bu asırlık lezzet; yerli ceviz kelebeklerinin pamuk ipliğe dizilip doğal dut şırası, süt ve tam buğday unundan hazırlanan sıcak <em>herle</em> kazanına batırılarak güneşte kurutulmasıyla elde edilir.</p>

<h3>Tek Çekim Köme ile Klasik Cevizli Köme Arasındaki Fark Nedir?</h3>
<p>Köme yapımında ipe dizili cevizlerin herle kazanına kaç kez batırıldığı, ürünün dokusunu ve ceviz oranını doğrudan belirler:</p>
<ul>
  <li><strong>Tek Çekim Cevizli Köme:</strong> Ceviz dizileri dut şıralı herleye yalnızca <strong>bir kez ince bir katman</strong> halinde batırılır. Bu sayede her lokmada yoğun ceviz tadı ön plandadır; daha hafif, az tatlı ve yüksek protein/sağlıklı yağ oranlı bir atıştırmalıktır.</li>
  <li><strong>Klasik İspir Cevizli Dut Kömesi:</strong> Cevizler herleye birkaç katman halinde batırılıp aralarında dinlendirilerek dolgun ve yumuşak bir dut kaplaması oluşturulur. Tatlı isteğini doğal yoldan karşılayan doyurucu bir enerji kaynağıdır.</li>
</ul>

<h3>Köme Ne Zaman ve Nasıl Tüketilir?</h3>
<ul>
  <li>Kahvaltı sonrasında veya öğleden sonra kahve/çay yanında rafine şekerli tatlılara en sağlıklı alternatiftir.</li>
  <li>Sporcular, öğrenciler ve yoğun tempoda çalışanlar için doğal karbonhidrat + omega-3 (ceviz) kombinasyonu sunar.</li>
  <li>Dilimleyerek servis ederken oda sıcaklığında 5 dakika bekletmek dut aromasının açılmasını sağlar.</li>
</ul>

<h3>Köme Nasıl Saklanmalıdır?</h3>
<p>Doğal köme koruyucu içermediği için hava almayan kilitli ambalajda veya cam kavanozda, güneş görmeyen serin bir ortamda (tercihen buzdolabında) saklanmalıdır. Böylece hem cevizin tazeliği hem de dut kaplamasının yumuşak dokusu aylarca korunur.</p>

<div style="background-color:#fffbeb;border:1px solid #fde68a;padding:20px;border-radius:16px;margin:24px 0;text-align:center;">
  <h3 style="color:#78350f;margin-top:0;">İspir'den Taze Üretim Cevizli Dut Kömeleri</h3>
  <p style="font-size:14px;color:#92400e;">Bol cevizli <strong>Tek Çekim Köme</strong> ve geleneksel <strong>İspir Cevizli Dut Kömesi</strong> çeşitlerimizi keşfedin.</p>
  <a href="/urun/pekefe-ispir-dut-komesi-cevizli" style="display:inline-block;background-color:#6b1d2f;color:#ffffff;padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none;margin:6px;">Cevizli Dut Kömesi →</a>
  <a href="/urun/pekefe-ispir-tek-cekim-dut-komesi-cevizli" style="display:inline-block;background-color:#b45309;color:#ffffff;padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none;margin:6px;">Tek Çekim Köme →</a>
</div>`,
  },
  {
    id: 'blog-seo-dut-pestili-rehberi',
    title: 'Dut Pestili Nasıl Yenir ve Saklanır? Sade, Cevizli, Sarma ve Muska Pestil Rehberi',
    slug: 'dut-pestili-nasil-yenir-ve-saklanir-cesitleri-rehberi',
    category: 'Sağlık',
    image: '/images/mega-menu/pestil-production.jpg',
    metaDesc:
      'İspir dut pestili çeşitleri nelerdir? Sade yaprak pestil, cevizli pestil, pestil sarma ve muska tatlısı arasındaki farklar, tüketim önerileri ve saklama koşulları.',
    isFeatured: false,
    isActive: true,
    content: `<h2>Geleneksel İspir Dut Pestili Nasıl Hazırlanır?</h2>
<p>Erzurum İspir'de yaz aylarında toplanan beyaz dutların doğal şırası, bakır kazanlarda kontrollü ısıda pişirilerek <em>herle</em> kıvamına getirilir ve saf keten bezlerin üzerine ince katmanlar halinde serilir. İspir'in temiz dağ güneşi ve rüzgârında doğal olarak kuruyan pestiller, katkısız ve esnek dokusuyla Anadolu mutfağının en sağlıklı enerji kaynaklarından biridir.</p>

<h3>Hangi Dut Pestili Size Göre? 4 Popüler Çeşit</h3>
<ul>
  <li><strong>Sade Yaprak Dut Pestili:</strong> İnce, esnek ve hafif yapısıyla günün her saatinde sade olarak veya içine ceviz/fındık sararak tüketebileceğiniz klasik lezzettir.</li>
  <li><strong>Cevizli Dut Pestili:</strong> İnce dut pestilinin yerli İspir ceviziyle buluştuğu, doyurucu ve yüksek besin değerli geleneksel seçenektir.</li>
  <li><strong>Dut Pestil Sarma Tatlısı:</strong> Özenle sarılmış rulo formu sayesinde misafir ikramlarında ve Türk kahvesi yanında şık bir sunum sağlar.</li>
  <li><strong>Dut Pestil Muska Tatlısı:</strong> Üçgen (muska) formunda katlanan, içi dolgun ceviz/fındık harçlı geleneksel bayram ve hediyelik lezzetidir.</li>
</ul>

<h3>Dut Pestili Kurumadan Nasıl Saklanır?</h3>
<ol>
  <li>Ambalajı açtıktan sonra hava ile temasını kesmek için kilitli poşette veya kapaklı cam kapta muhafaza edin.</li>
  <li>Sıcak ve nemli ortamlardan uzak, serin bir dolapta veya buzdolabının sebzelik bölümünde saklayın.</li>
  <li>Doğal yapısı gereği serin ortamda hafifçe sertleşirse, tüketmeden 10 dakika önce oda sıcaklığına çıkarmanız eski yumuşaklığına dönmesi için yeterlidir.</li>
</ol>

<div style="background-color:#fdf8f6;border:1px solid #e7d5cc;padding:20px;border-radius:16px;margin:24px 0;text-align:center;">
  <h3 style="color:#6b1d2f;margin-top:0;">Tüm PEKEFE Dut Pestili Çeşitlerini Keşfedin</h3>
  <p style="font-size:14px;color:#475569;">Glikoz şurubu ve koruyucu içermeyen, keten bezde güneşle kurutulan taze pestil çeşitlerimiz:</p>
  <a href="/urun/pekefe-sade-dut-pestili" style="display:inline-block;background-color:#6b1d2f;color:#ffffff;padding:9px 16px;border-radius:10px;font-weight:700;text-decoration:none;margin:4px;">Sade Pestil</a>
  <a href="/urun/pekefe-cevizli-dut-pestili" style="display:inline-block;background-color:#6b1d2f;color:#ffffff;padding:9px 16px;border-radius:10px;font-weight:700;text-decoration:none;margin:4px;">Cevizli Pestil</a>
  <a href="/urun/pekefe-dut-pestil-sarma-tatlisi-450-gr" style="display:inline-block;background-color:#b45309;color:#ffffff;padding:9px 16px;border-radius:10px;font-weight:700;text-decoration:none;margin:4px;">Pestil Sarma</a>
  <a href="/urun/pekefe-dut-pestil-muska-tatlisi-450-gr" style="display:inline-block;background-color:#b45309;color:#ffffff;padding:9px 16px;border-radius:10px;font-weight:700;text-decoration:none;margin:4px;">Pestil Muska</a>
</div>`,
  },
];

/**
 * POST /api/admin/seed-seo-blogs
 * Yuksek arama hacimli 3 PEKEFE SEO rehber yazisini veritabanina ekler
 * ve Google Blogger bagliysa otomatik olarak Blogger'da da yayinlar.
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const diskPosts = readLocalBlogPostsFallback();
    const updatedDisk = [...diskPosts];
    const results: Array<{ slug: string; title: string; status: string; bloggerSynced: boolean }> = [];

    for (const post of HIGH_INTENT_SEO_POSTS) {
      const nowIso = new Date().toISOString();
      let savedPost: any = { ...post, createdAt: nowIso, updatedAt: nowIso };
      let status = 'created';

      try {
        const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
        if (existing) {
          savedPost = await prisma.blogPost.update({
            where: { id: existing.id },
            data: {
              title: post.title,
              content: post.content,
              category: post.category,
              image: post.image,
              metaDesc: post.metaDesc,
              isActive: true,
            },
          });
          status = 'updated';
        } else {
          savedPost = await prisma.blogPost.create({
            data: {
              id: post.id,
              title: post.title,
              slug: post.slug,
              content: post.content,
              category: post.category,
              image: post.image,
              metaDesc: post.metaDesc,
              isActive: true,
            },
          });
        }
      } catch (dbErr) {
        console.warn('[SEED SEO BLOGS] DB fallback:', dbErr);
      }

      const idx = updatedDisk.findIndex((p: any) => p.slug === post.slug || p.id === savedPost.id);
      if (idx >= 0) {
        updatedDisk[idx] = { ...updatedDisk[idx], ...savedPost, isFeatured: post.isFeatured };
      } else {
        updatedDisk.unshift({ ...savedPost, isFeatured: post.isFeatured });
      }

      let bloggerSynced = false;
      try {
        const syncRes = await syncPostToBlogger({
          id: savedPost.id,
          title: savedPost.title,
          slug: savedPost.slug,
          content: savedPost.content,
          category: savedPost.category,
          image: savedPost.image,
          metaDesc: savedPost.metaDesc,
          isActive: true,
        });
        bloggerSynced = Boolean(syncRes?.synced);
      } catch {}

      results.push({ slug: savedPost.slug, title: savedPost.title, status, bloggerSynced });
    }

    writeLocalBlogPostsFallback(updatedDisk);

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'SEO blog yazilari eklenemedi.' },
      { status: 500 }
    );
  }
}
