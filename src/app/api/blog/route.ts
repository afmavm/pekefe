import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'public', 'data', 'blog_posts_fallback.json');

const defaultBlogPosts = [
  {
    id: "blog-1",
    title: "Geleneksel İspir Dut Pekmezi Nasıl Üretilir? Sırları ve Şifası",
    slug: "geleneksel-ispir-dut-pekmezi-nasil-uretilir",
    category: "Üretim",
    image: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=800&q=80",
    metaDesc: "İspir'in 2200m rakımlı el değmemiş yaylalarında yetişen saf beyaz dutların bakır kazanlarda ve meşe odun ateşinde karamelize edilmeden pişirilme hikayesi. Hemen tadın!",
    content: `<h2>Doğanın En Saf Tatlısı: 2200 Metrede İspir Beyaz Dut Hasadı</h2>
<p>Doğu Anadolu’nun incisi Erzurum İspir coğrafyası, yüksek oksijen oranı, sanayi kirliliğinden uzak bakır doğası ve mikro-klima iklimiyle dünyanın en kaliteli beyaz dutlarının yetiştiği nadide bir vadidir. Her yıl Temmuz ve Ağustos aylarında 2200 metre üzerindeki rakımda olgunlaşan dutlarımız, dalları zedelenmeden özel keten bezlere silkelenerek toplanır.</p>

<h3>Neden PEKEFE İspir Dut Pekmezi Farklıdır?</h3>
<p>Endüstriyel üretimlerde kullanılan yüksek basınçlı çelik tanklar ve şeker takviyelerinin aksine, <strong>PEKEFE geleneksel yöntemlere sadık kalır:</strong></p>
<ul>
  <li><strong>Sıfır İlave Şeker ve Glukoz:</strong> Pekmezimiz %100 öz meyve şekerinden oluşur. Hiçbir renklendirici veya koruyucu içermez.</li>
  <li><strong>Geleneksel Bakır Kazanlar:</strong> Meşe odunu ateşinde, bakır kazanların eşit ısı iletimi sayesinde pekmezimiz karamelize olmadan, HMF değeri yükselmeden ve besin değerlerini kaybetmeden saatlerce pişirilir.</li>
  <li><strong>Doğal Gün Güneşi Kıvamı:</strong> Kaynatılan şıra, güneşte dinlendirilerek ideal kıvama ulaşır ve el değmeden steril cam kavanozlara doldurulur.</li>
</ul>

<div style="background-color: #fffbeb; border: 2px dashed #f59e0b; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #78350f; margin-top: 0;">🔥 Rekolteye Özel Şifa Kaynağı!</h3>
  <p style="color: #92400e; font-size: 14px;">Geleneksel yöntemlerle sınırlı sayıda üretilen %100 katkısız <strong>İspir Dut Pekmezini</strong> hemen keşfedin. Sepette geçerli <strong>PEKEFE15</strong> koduyla %15 indirim avantajını kaçırmayın!</p>
  <a href="/products/ispir-dut-pekmezi" style="display: inline-block; background-color: #b45309; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🛒 İspir Dut Pekmezini Sipariş Ver →</a>
</div>

<h3>Dut Pekmezinin Sağlığınıza Katkıları</h3>
<p>Yüksek oranda organik demir, kalsiyum, magnezyum ve potasyum içeren İspir Dut Pekmezi; sabahları aç karnına tüketildiğinde kan yapımını destekler, vücut direncini artırır ve gün boyu doğal bir zindelik sağlar.</p>`,
    isFeatured: true,
    isActive: true,
    createdAt: "2026-08-15T01:00:00.000Z",
    updatedAt: "2026-08-15T01:00:00.000Z",
  },
  {
    id: "blog-2",
    title: "Ham Çiçek Balı ve İşlenmiş Bal Arasındaki 5 Hayati Fark",
    slug: "ham-cicek-bali-ve-islenmis-bal-arasindaki-farklar",
    category: "Sağlık",
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=800&q=80",
    metaDesc: "Pastörize edilmemiş, 45°C üzerinde ısıtılmamış hakiki ham çiçek balının polen zenginliği ve laboratuvar analiz gerçekleri. Hakiki bal satın alın!",
    content: `<h2>Ham Bal Nedir? Market Ballarından Nasıl Ayrılır?</h2>
<p>Market raflarında berrak, sıvı ve berrak görünümüyle aylarca duran ballar ile arının kovandan çıkardığı <strong>Ham Çiçek Balı (Raw Honey)</strong> arasında çok büyük biyolojik ve besleyici farklar vardır. Ham bal; kovandan süzüldüğü haliyle, hiçbir yüksek ısıl işleme tabi tutulmadan ve mikron düzeyde polen filtrelemesi yapılmadan kavanozlanan şifadır.</p>

<h3>İşte Hakiki Ham Balı Ayrıştıran 5 Temel Faktör:</h3>
<ol>
  <li><strong>Yüksek Isıl İşlem (Pastörizasyon) Görmez:</strong> Endüstriyel ballar kristalleşmeyi geciktirmek için 65-70°C sıcaklığa maruz bırakılır. Bu işlem balın içindeki duyarlı enzimleri ve canlı vitaminleri yok eder. PEKEFE ham balı asla 45°C üzerine çıkarılmaz.</li>
  <li><strong>Polen Zenginliği Korunur:</strong> Balın kimliğini, kaynağını ve şifasını taşıyan çiçek polenleri ham balda tamamen korunur.</li>
  <li><strong>Doğal Kristalleşme (Donma):</strong> Hakiki ham bal soğuk ortamda zamanla kremsi bir kıvam alarak kristalleşir. Bu durum balın saf ve hilesiz olduğunun en somut kanıtıdır.</li>
  <li><strong>Kaçkar Florası Aroması:</strong> 2200m rakımlı İspir Kaçkar yaylalarının binbir çeşit endemik çiçeğinin keskin aroması sadece ham balda hissedilir.</li>
  <li><strong>Yüksek Prolin ve Diastaz Değeri:</strong> Laboratuvar analizleriyle tescillenen yüksek prolin miktarı, balın antibakteriyel gücünü ortaya koyar.</li>
</ol>

<div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #166534; margin-top: 0;">🍯 %100 Analizli & Tescilli Ham Çiçek Balı</h3>
  <p style="color: #15803d; font-size: 14px;">Kaçkar Dağlarının yüksek rakımlı yaylalarından sağım yapılan hakiki ham çiçek balı gurme sofranıza geliyor. 5000 TL ve üzeri siparişlerde Kargo Bedava!</p>
  <a href="/products/ham-cicek-bali" style="display: inline-block; background-color: #15803d; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🍯 Hakiki Ham Balı Sepete Ekle →</a>
</div>`,
    isFeatured: true,
    isActive: true,
    createdAt: "2026-08-15T00:50:00.000Z",
    updatedAt: "2026-08-15T00:50:00.000Z",
  },
  {
    id: "blog-3",
    title: "Erzurum İspir Pestil ve Köme Hazırlamanın Asırlık Sırları",
    slug: "pestil-ve-kome-hazirlamanin-incelikleri",
    category: "Tarifler",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    metaDesc: "Keten bezlerde dağ güneşiyle kurutulan cevizli İspir kömesi ve doğal dut pestilinin asırlık üretim gelenekleri. Taze köme siparişi verin!",
    content: `<h2>Geleneksel Lezzet Mirası: İspir Cevizli Köme ve Dut Pestili</h2>
<p>Doğu Anadolu’nun çetin kış şartlarında enerji kaynağı olarak yüzyıllardır hazırlanan pestil ve köme, yaz sonu İspir beyaz dutlarının bereketiyle başlar. Tamamen doğal malzemelerle hazırlanan bu atıştırmalıklar, çocuklarınıza gönül rahatlığıyla yedirebileceğiniz en sağlıklı lezzet deposudur.</p>

<h3>Köme ve Pestil Nasıl Yapılır?</h3>
<ul>
  <li><strong>Herle Hazırlığı:</strong> Taze süzülen dut şırası, süt ve doğal nişasta ile bakır kazanlarda koyulaşıncaya kadar ağır ağır pişirilir.</li>
  <li><strong>Yerli İspir Cevizleri:</strong> Bölgenin yağ oranı yüksek, lezzetli cevizleri ipe dizilir ve sıcak herle harcına birkaç kez batırılarak kalın bir katman kaplanır.</li>
  <li><strong>Dağ Güneşinde Kurutma:</strong> İnce pamuklu bezlere serilen pestiller ve ipe asılan kömeler, İspir’in nemsiz dağ rüzgarında ve doğrudan güneş ışığında kurutulur.</li>
</ul>

<div style="background-color: #fff7ed; border: 2px solid #ffedd5; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #9a3412; margin-top: 0;">🎁 Taze Üretim Cevizli Köme & Pestil Çeşitleri</h3>
  <p style="color: #c2410c; font-size: 14px;">Geleneksel usta handsinden çıkan taze cevizli köme ve yaprak dut pestili çeşitlerimizi özel vakumlu korumalı ambalajıyla hemen sipariş edin.</p>
  <a href="/kategoriler" style="display: inline-block; background-color: #c2410c; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">📦 Yöresel Köme ve Pestilleri İncele →</a>
</div>`,
    isFeatured: false,
    isActive: true,
    createdAt: "2026-08-15T00:40:00.000Z",
    updatedAt: "2026-08-15T00:40:00.000Z",
  },
  {
    id: "blog-4",
    title: "Dut Pekmezinin Kanıtlanmış 7 Sağlık Faydası ve Günlük Şifa Kürü",
    slug: "dut-pekmezinin-sagliga-faydalari",
    category: "Sağlık",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80",
    metaDesc: "Organik demir ve kalsiyum deposu geleneksel dut pekmezinin kan yapımına, bağışıklık sistemine ve enerji seviyesine etkileri.",
    content: `<h2>Şifa Deposu: Neden Her Gün 1 Kaşık İspir Dut Pekmezi Tüketmelisiniz?</h2>
<p>Geleneksel yöntemlerle pişirilen saf İspir Dut Pekmezi, içerdiği yoğun mineraller ve doğal şeker bileşenleri sayesinde vücudun günlük mikro besin ihtiyacını karşılayan en güçlü doğal takviyelerden biridir.</p>

<h3>İşte Dut Pekmezinin 7 Temel Faydası:</h3>
<ol>
  <li><strong>Kan Yapımını Destekler:</strong> Yüksek organik demir oranı sayesinde kansızlık (anemi) şikayeti olanlarda hemoglobin seviyesini yükseltir.</li>
  <li><strong>Doğal Enerji Deposu:</strong> Doğal fruktoz ve glukoz içeriğiyle sporcularda ve çocuklarda anında fiziksel zindelik sağlar.</li>
  <li><strong>Mide ve Sindirim Dostudur:</strong> Sabahları aç karnına 1 tatlı kaşığı tüketildiğinde mide asidini dengeler ve sindirimi rahatlatır.</li>
  <li><strong>Kemik ve Diş Sağlığı:</strong> Kalsiyum ve magnezyum zenginliğiyle çocukların büyüme dönemini destekler.</li>
  <li><strong>Bağışıklığı Güçlendirir:</strong> Kış aylarında boğazı yumuşatır, öksürük ve soğuk algınlığına karşı direnç sağlar.</li>
  <li><strong>Ağız İçi Yaraları Dindirir:</strong> Antiseptik özelliğiyle pamukçuk ve aft tedavisinde destekleyicidir.</li>
  <li><strong>Karaciğer Detoksu:</strong> Vücuttaki toksinlerin atılmasına yardımcı olur.</li>
</ol>

<div style="background-color: #fffbeb; border: 2px dashed #f59e0b; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #78350f; margin-top: 0;">☀️ Günlük Şifa Kürünüzü Hazırlayın</h3>
  <p style="color: #92400e; font-size: 14px;">Katkısız, koruyucusuz ve şekersiz %100 Erzurum İspir Dut Pekmezi ile ailenizin sağlığını güvenceye alın.</p>
  <a href="/products/ispir-dut-pekmezi" style="display: inline-block; background-color: #b45309; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🛒 İspir Dut Pekmezi Satın Al →</a>
</div>`,
    isFeatured: false,
    isActive: true,
    createdAt: "2026-08-15T00:30:00.000Z",
    updatedAt: "2026-08-15T00:30:00.000Z",
  },
  {
    id: "blog-5",
    title: "2200m Rakımlı Kaçkar Yaylalarının Endemik Çiçek Florası ve Ham Bal Mucizesi",
    slug: "ispir-yaylalarinin-2200m-rakimli-flora-zenginligi",
    category: "Genel",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
    metaDesc: "Kaçkar dağlarının el değmemiş 2200m+ yaylalarındaki endemik flora çeşitliliği ve PEKEFE ballarının eşsiz aromatik kaynağı.",
    content: `<h2>Kaçkar Dağlarının Zirvesinden Gelen Doğal Lezzet Mucizesi</h2>
<p>Erzurum İspir bölgesi, Kaçkar dağlarının güney yamaçlarında yer alan yüksek rakımı, temiz su kaynakları ve sanayi kirliliğinden tamamen arındırılmış bakır doğasıyla Türkiye’nin en kıymetli arıcılık merkezidir.</p>

<h3>2200 Metre Rakımın Bize Kazandırdıkları</h3>
<p>Yüksek rakımda yetişen binlerce endemik dağ çiçeği, nektar konsantrasyonu açısından kıyaslanamaz bir zenginliğe sahiptir. Kimyasal tarım ilaçlarının veya fabrika dumanlarının ulaşamadığı bu yüksek coğrafyada arılarımız, doğanın en saf özlerini toplayarak PEKEFE Ham Çiçek Balını üretir.</p>

<div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #166534; margin-top: 0;">🏔️ Yayladan Kapınıza Katkısız Lezzet</h3>
  <p style="color: #15803d; font-size: 14px;">Coğrafi tescilli İspir coğrafyasının saf lezzetlerini keşfedin. Güvenli ödeme ve orijinal ürün garantisiyle siparişinizi hemen oluşturun.</p>
  <a href="/products" style="display: inline-block; background-color: #15803d; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🛍️ Tüm Doğal Ürünleri İnceleyin →</a>
</div>`,
    isFeatured: false,
    isActive: true,
    createdAt: "2026-08-15T00:20:00.000Z",
    updatedAt: "2026-08-15T00:20:00.000Z",
  },
  {
    id: "blog-6",
    title: "İspir Kuru Fasulyesi Neden Dünyanın En Lezzetli Fasulyesidir? Püf Noktaları & Güveç Tarifi",
    slug: "ispir-kuru-fasulyesi-neden-dunyanin-en-lezzetli-fasulyesidir",
    category: "Tarifler",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    metaDesc: "Coğrafi işaretli İspir Kuru Fasulyesinin çabuk pişme, kabuk atmama sırları ve toprak güveçte lokum kıvamında pişirme tarifi. Hemen sipariş edin!",
    content: `<h2>Coğrafi Tescilli Lezzet: Gerçek İspir Kuru Fasulyesi</h2>
<p>Türkiye'nin gurme mutfağında taht kuran <strong>İspir Kuru Fasulyesi</strong>, Çoruh Vadisi’nin mikro-klima ikliminde, 1200 ile 1800 metre arasındaki özel topraklarda yetiştirilir. Tanelerinin ufak ve tombul oluşu, pişerken asla kabuk atmaması ve erken yumuşaması en büyük özelliğidir.</p>

<h3>İspir Fasulyesini Özel Kılan 4 Nedeni:</h3>
<ul>
  <li><strong>İnce Kabuklu ve Erken Pişen Yapı:</strong> Islatılma süresi kısa olup tencerede kabuk ayrılması yaşanmaz.</li>
  <li><strong>Doğal Tatlımsı Aroma:</strong> Toprağın zengin mineral dengesi sayesinde piştiğinde kendi doğal sosunu oluşturur.</li>
  <li><strong>Mideye Dokunmaz:</strong> Gaz yapma oranı diğer fasulye türlerine göre son derece düşüktür.</li>
</ul>

<h3>Ustasından Toprak Güveçte İspir Fasulyesi Tarifi:</h3>
<p>Bir gece önceden ılık suda bekletilen İspir fasulyeleri, PEKEFE Geleneksel Yayla Tereyağı ve kuşbaşı dana etiyle güveçte kısık ateşte ağır ağır pişirilir. Salçasını ve baharatlarını son aşamada ekleyerek lokum kıvamını yakalayabilirsiniz.</p>

<div style="background-color: #fefce8; border: 2px dashed #ca8a04; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #854d0e; margin-top: 0;">🥘 Taze Hasat Coğrafi İşaretli İspir Fasulyesi</h3>
  <p style="color: #a16207; font-size: 14px;">Çoruh Vadisinden yeni mahsül hakiki İspir Kuru Fasulyesini hemen deneyin. Mutfağınızda lokum kıvamında lezzet garantisi!</p>
  <a href="/products" style="display: inline-block; background-color: #ca8a04; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🛒 Hakiki İspir Fasulyesini Satın Al →</a>
</div>`,
    isFeatured: true,
    isActive: true,
    createdAt: "2026-08-15T00:15:00.000Z",
    updatedAt: "2026-08-15T00:15:00.000Z",
  },
  {
    id: "blog-7",
    title: "Hakiki İspir Karakovan Balı Nedir? Mumu Doğal Yenebilir Mi?",
    slug: "ispir-karakovan-bali-nedir-mumu-yenir-mi",
    category: "Sağlık",
    image: "https://images.unsplash.com/photo-1471943311424-646960669fbc?w=800&q=80",
    metaDesc: "Ihlamur kütüklerinde insan eli değmeden arının kendi ördüğü saf organik karakovan balı şifası ve doğal petek mumunun hazmı. Sipariş verin!",
    content: `<h2>Karanlık Kovanların Saf Mucizesi: Karakovan Balı</h2>
<p>Karakovan balı; temel petek çıtası konulmaksızın, tamamen arının kendi vücut salgısıyla ördüğü <strong>%100 doğal petekli baldır.</strong> Eski geleneksel yöntemlerle içi oyulmuş ıhlamur veya meşe kütüklerinde, zifiri karanlıkta üretildiği için 'Karakovan' adını almıştır.</p>

<h3>Karakovan Balının Petek Mumu Yenebilir mi?</h3>
<p>Evet! Endüstriyel ballardaki suni mumların aksine, PEKEFE İspir Karakovan Balının mumu tamamen arının kendi ördüğü organik bal mumudur. Ağızda erir, mideyi yormaz ve boğaz antiseptiği olarak üst solunum yollarına büyük fayda sağlar.</p>

<div style="background-color: #fffbeb; border: 2px solid #fde68a; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #92400e; margin-top: 0;">🍯 Sınırlı Rekolte İspir Karakovan Balı</h3>
  <p style="color: #b45309; font-size: 14px;">Hiçbir müdahale olmadan arıların binbir çiçek nektarıyla doldurduğu hakiki karakovan balını özel ahşap kutusunda sipariş edin.</p>
  <a href="/products" style="display: inline-block; background-color: #b45309; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🐝 Karakovan Balını İncele & Al →</a>
</div>`,
    isFeatured: false,
    isActive: true,
    createdAt: "2026-08-15T00:10:00.000Z",
    updatedAt: "2026-08-15T00:10:00.000Z",
  },
  {
    id: "blog-8",
    title: "Çam Kozalağı Şurubunun Akciğer ve Solunum Yollarına Şaşırtıcı Faydaları",
    slug: "cam-kozalagi-surubunun-akciger-ve-solunum-yollarina-faydalari",
    category: "Sağlık",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
    metaDesc: "İlkbaharda toplanan genç yeşil çam kozalaklarının öksürük, bronşit ve akciğer detoksuna mucizevi etkileri. Kozalak kozalağı şurubu sipariş edin!",
    content: `<h2>Doğal Akciğer Detoksu: Yeşil Çam Kozalağı Şurubu</h2>
<p>Mayıs ve Haziran aylarında İspir dağlarındaki yüksek oksijenli çam ormanlarından toplanan taze yeşil çam kozalakları, solunum yolu rahatsızlıkları ve akciğer temizliği için yüzyıllardır kullanılan en kıymetli şifa reçetelerinden biridir.</p>

<h3>Çam Kozalağı Şurubunun Öne Çıkan Faydaları:</h3>
<ul>
  <li><strong>İnatçı Öksürüğü Dindirir:</strong> Boğazdaki tahrişi ve balgamı kısa sürede söker.</li>
  <li><strong>Astım ve Bronşit Rahatlaması:</strong> Nefes darlığı çekenlerde solunum yollarını rahatlatır.</li>
  <li><strong>Sigara Kullananlar İçin Detoks:</strong> Akciğerde biriken katran ve toksinlerin atılmasına destek verir.</li>
</ul>

<div style="background-color: #ecfdf5; border: 2px solid #a7f3d0; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #065f46; margin-top: 0;">🌲 Saf & Katkısız Çam Kozalağı Şurubu</h3>
  <p style="color: #047857; font-size: 14px;">Meşe odun ateşinde koruyucusuz pişirilen şifalı çam kozalağı şurubumuzu hemen sipariş vererek ailenizin nefesini tazeleyin.</p>
  <a href="/products" style="display: inline-block; background-color: #047857; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🌲 Çam Kozalağı Şurubu Satın Al →</a>
</div>`,
    isFeatured: false,
    isActive: true,
    createdAt: "2026-08-15T00:08:00.000Z",
    updatedAt: "2026-08-15T00:08:00.000Z",
  },
  {
    id: "blog-9",
    title: "Erzurum Göğermiş Peyniri (Yeşil Peynir) ve Doğal Köy Tereyağı Rehberi",
    slug: "erzurum-gogermis-peyniri-ve-dogal-koy-tereyagi-rehberi",
    category: "Geleneksel Üretim",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=80",
    metaDesc: "Doğal penisilin deposu küflü Erzurum göğermiş peyniri ve yayla sütünden yapılan sarı köy tereyağının lezzet özellikleri. Şimdi sipariş edin!",
    content: `<h2>Doğal Penisilin Deposu: Erzurum Göğermiş Peyniri</h2>
<p>Erzurum ve İspir coğrafyasına özgü <strong>Göğermiş (Yeşil Küflü) Peynir</strong>, çeçil peynirinin özel deri ve mahzenlerde doğal olarak küflendirilmesiyle elde edilen dünyaca ünlü bir gurme lezzettir. İçerdiği zararsız doğal küf mantarları sayesinde vücut için adeta bir antioksidan ve antibiyotik deposudur.</p>

<h3>PEKEFE Yayla Tereyağı İle Kahvaltı Şöleni</h3>
<p>2200 metre rakımlı yaylalarda serbest otlayan ineklerin taze sütünden yayıklanarak elde edilen sarı köy tereyağımız, katkısız kokusu ve eşsiz lezzetiyle kahvaltılarınıza ve yemeklerinize unutulmaz bir lezzet katacaktır.</p>

<div style="background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #1e293b; margin-top: 0;">🧀 Yöresel Erzurum Peynir & Tereyağı Çeşitleri</h3>
  <p style="color: #475569; font-size: 14px;">Soğuk zincir korumalı özel ambalajlarıyla Erzurum Göğermiş Peyniri ve Geleneksel Yayla Tereyağını hemen sepetinize ekleyin.</p>
  <a href="/products" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🧀 Yöresel Şarküteri Ürünlerini İncele →</a>
</div>`,
    isFeatured: false,
    isActive: true,
    createdAt: "2026-08-15T00:05:00.000Z",
    updatedAt: "2026-08-15T00:05:00.000Z",
  },
  {
    id: "blog-10",
    title: "PEKEFE İle Doğrudan Üreticiden Sofranıza Güvenli Şeffaf Kargo Süreci",
    slug: "pekefe-ile-dogrudan-ureticiden-sofraniza-guvenli-kargo",
    category: "Haberler",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80",
    metaDesc: "Erzurum İspir'deki üretim tesislerimizden kırılma korumalı strafor ambalaj ve soğuk zincir kargo ile kapınıza gelen lezzet garantisi.",
    content: `<h2>Aracı Yok, Bekleme Yok: Doğrudan İspir Üreticisinden Kapınıza!</h2>
<p>PEKEFE olarak tüm bal, pekmez, pestil, köme ve yöresel lezzetlerimizi Erzurum İspir’deki merkez depomuzdan ve imalathanemizden doğrudan siz değerli lezzet tutkunlarına ulaştırıyoruz.</p>

<h3>Sipariş ve Kargo Güvencelerimiz:</h3>
<ul>
  <li><strong>Kırılmaya Karşı %100 Garanti:</strong> Cam kavanozlarımız yüksek yoğunluklu darbe emici strafor korumalarla paketlenir.</li>
  <li><strong>Soğuk Zincir Ambalaj:</strong> Peynir ve tereyağı gibi hassas şarküteri ürünleri buz aküleriyle sevk edilir.</li>
  <li><strong>Aynı Gün Kargo:</strong> Saat 14:00'e kadar verilen tüm siparişler aynı gün kargoya teslim edilir.</li>
</ul>

<div style="background-color: #fdf2f8; border: 2px solid #fbcfe8; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
  <h3 style="color: #9d174d; margin-top: 0;">🎉 İlk Siparişinize Özel %15 İndirim!</h3>
  <p style="color: #be185d; font-size: 14px;">Doğal ve yöresel lezzetleri hemen keşfedin. Ödeme adımında <strong>PEKEFE15</strong> kupon kodunu kullanarak %15 açılış indirimini kullanın!</p>
  <a href="/products" style="display: inline-block; background-color: #be185d; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 10px;">🛍️ Alışverişe Başla & İndirimi Kullan →</a>
</div>`,
    isFeatured: false,
    isActive: true,
    createdAt: "2026-08-15T00:01:00.000Z",
    updatedAt: "2026-08-15T00:01:00.000Z",
  }
];

export function readLocalBlogPostsFallback(): any[] {
  try {
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading local blog fallback file:', err);
  }
  return defaultBlogPosts;
}

export function writeLocalBlogPostsFallback(data: any[]) {
  try {
    const dir = path.dirname(LOCAL_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local blog fallback file:', err);
  }
}

// GET /api/blog — Aktif blog yazılarını listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get('admin') === 'true';
    
    let dbPosts: any[] = [];
    try {
      dbPosts = await prisma.blogPost.findMany({
        where: adminMode ? {} : { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError) {
      console.warn("Database connection issue for blog GET, returning disk fallback:", dbError);
    }

    const fallbackPosts = readLocalBlogPostsFallback();

    if (!dbPosts || dbPosts.length === 0) {
      writeLocalBlogPostsFallback(defaultBlogPosts);
      return NextResponse.json(adminMode ? defaultBlogPosts : defaultBlogPosts.filter(p => p.isActive));
    }

    // Merge DB and disk fallback
    const mergedMap = new Map();
    fallbackPosts.forEach(p => mergedMap.set(p.id, p));
    dbPosts.forEach(p => mergedMap.set(p.id, { ...mergedMap.get(p.id), ...p }));

    let result = Array.from(mergedMap.values());
    if (!adminMode) {
      result = result.filter(p => p.isActive);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Blog GET error:', error);
    const fallback = readLocalBlogPostsFallback();
    return NextResponse.json(fallback);
  }
}

// POST /api/blog — Yeni blog yazısı oluştur (admin only)
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Başlık ve içerik zorunludur.' }, { status: 400 });
    }

    let slug = body.slug || body.title
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const newPost = {
      id: `blog-${Date.now()}`,
      title: body.title,
      slug,
      content: body.content,
      category: body.category || 'Genel',
      image: body.image || "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=800&q=80",
      metaDesc: body.metaDesc || null,
      isFeatured: body.isFeatured ?? false,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to disk first
    const diskPosts = readLocalBlogPostsFallback();
    const updatedDisk = [newPost, ...diskPosts];
    writeLocalBlogPostsFallback(updatedDisk);

    // Try DB insert safely
    try {
      await prisma.blogPost.create({
        data: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
          content: newPost.content,
          category: newPost.category,
          image: newPost.image,
          metaDesc: newPost.metaDesc,
          isActive: newPost.isActive,
        }
      });
    } catch (dbErr) {
      console.warn("DB create blog failed, but disk fallback succeeded:", dbErr);
    }

    return NextResponse.json(newPost);
  } catch (error: any) {
    console.error('Blog POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
