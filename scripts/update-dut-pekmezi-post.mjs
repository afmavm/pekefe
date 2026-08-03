import { PrismaClient } from '../src/generated-client/index.js';

const prisma = new PrismaClient();

async function main() {
  const slug = 'dut-pekmezi-kadim-bir-lezzetin-modern-sofraya-yolculugu';
  const updated = await prisma.blogPost.update({
    where: { slug },
    data: {
      title: "İspir'in Saklı Altını: Dut Pekmezinin Zanaat Yolculuğu",
      metaDesc: "Gümüşhane Öğretmen Lisesi mezunu emekli öğretmen İlhan Efe'nin İspir'deki zanaatkarlık mirası, TRT Haber belgeseline konu olan vakumlu düşük ısı üretim yöntemi ve dürüst pekmez felsefesi.",
      content: `<h2>İlhan Efe'nin Mirası ve Bir Öğretmenin Doğal Lezzet Hayali</h2>
<p>1952 yılında Erzurum'un İspir ilçesinde doğan <strong>İlhan Efe</strong>, Gümüşhane Öğretmen Lisesi'nden mezun olduktan sonra Van ve İspir'in Değirmenli Köyü'nde uzun yıllar köy öğretmenliği yaptı. İspir Halk Eğitim Müdürlüğü görevinden emekli olduktan sonra, çocukluğundan beri tutkusu olan İspir'in asırlık organik dutlarını ve kadim zanaat geleneklerini yaşatma hayalini gerçeğe dönüştürdü.</p>

<h2>TRT Haber Belgeseli: "İspir'in Saklı Altını"</h2>
<p>Pekefe'nin yarım asırlık geleneksel zanaatı ve yenilikçi üretim anlayışı, ulusal TV ekranlarına da yansıdı. TRT Haber Özel belgeselinde <em>"İspir'in Saklı Altını"</em> başlığıyla yayınlanan belgesel haberde; emekli öğretmen İlhan Efe'nin geleneksel yöntemleri koruyarak modern tesislerde sürdürdüğü dürüst üretim felsefesi tüm Türkiye'ye aktarıldı.</p>

<p>Haberde de vurgulandığı üzere, o dönem İspir vadilerinde üretilen geleneksel pekmezlerin odun ateşinde yüksek ısıda aşırı kaynatılması sonucu besin değerlerini yitirdiğini ve zararlı HMF oranlarının yükseldiğini fark eden İlhan Efe, dutun yapısındaki değerli mineralleri ve vitaminleri koruyan özel bir doğal yoğunlaştırma felsefesi benimsedi.</p>

<h2>Kazan Ateşinden Vakumlu Teknolojik Pişirmeye</h2>
<p>Babadan kalma odun ateşi zanaatı, oğlu <strong>Okan Efe</strong>'nin katılımı ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK) hibe desteğiyle kurulan modern tesiste yeni bir seviyeye ulaştı. Pekefe tesislerinde üretilen dut pekmezleri:</p>

<ul>
<li><strong>Düşük Sıcaklıkta Pişirme:</strong> Geleneksel açık kazanların aksine, 60°C'yi aşmayan vakumlu pişirme teknolojisi sayesinde dutun doğal aroması, rengi ve besin değerleri karamelize olmadan korunur.</li>
<li><strong>Düşük HMF Seviyesi (&lt; 10 mg/kg):</strong> Aşırı ısı uygulanmadığı için kanserojen risk oluşturan HMF birikimi engellenir, akredite laboratuvar testleriyle belgelenir.</li>
<li><strong>Sıfır İlave Şeker ve Katkı Maddesi:</strong> İspirin bereketli topraklarının güneşle olgunlaşan organik beyaz dutlarının kendi meyve şekeri dışında hiçbir koruyucu, glikoz veya katkı maddesi kullanılmaz.</li>
</ul>

<h2>Topraktan Sofraya Dürüst ve Asil Bir Dokunuş</h2>
<p>Trabzon Arıcılar Birliği Başkanı <strong>Avni Haliloğlu</strong>'nun bu doğal pekmezin tadına bakıp takdir etmesiyle başlayan yerel yolculuk, bugün Türkiye'nin dört bir yanındaki gurme sofralara ulaşıyor.</p>

<p>Şafak vakti keten çarşaflarla toplanan asırlık İspir dutları, hijyenik şeffaf vakumlu ambalajlarda nem, ışık ve dış etkenlerden korunarak sofranıza sunuluyor. Pekefe olarak her kavanozda İlhan Efe'nin alın terini, dürüst üretim ilkesini ve Anadolu'nun bin yıllık lezzet mirasını yaşatmaya devam ediyoruz.</p>`
    }
  });

  console.log("Blog yazisi basariyla guncellendi:", updated.title);
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
