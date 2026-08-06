import { PrismaClient } from '../src/generated-client/index.js';

const prisma = new PrismaClient();

const posts = [
  {
    title: "İspir'in Topraklarından Sofranıza: Organik Tarımın Hikayesi",
    slug: "ispir-topraklarindan-sofraniza-organik-tarim-hikayesi",
    category: "Hikaye & Köken",
    metaDesc: "Erzurum'un İspir ilçesinde nesilden nesile aktarılan geleneksel ve organik tarım yöntemlerini, toprağın bereketini ve Pekefe'nin bu kadim geleneğe bağlılığını keşfedin.",
    isActive: true,
    content: [
      "<h2>Bir Tohumun Yolculuğu</h2>",
      "<p>Erzurum'un 1.200 metre rakımındaki İspir ilçesi, Türkiye'nin en temiz ve el değmemiş tarım coğrafyalarından birini barındırır.",
      "Kuzey'den Karadeniz'in nemli rüzgarları, güneyden Doğu Anadolu'nun serin havası ile şekillenen bu mikro-iklim;",
      "meyve, sebze ve tahılın olağanüstü bir derinlikte olgunlaşmasına zemin hazırlar.</p>",
      "<p>Pekefe'nin temelleri, bu topraklara duyulan köklü bağlılıkla atıldı. Endüstriyel tarımın verimliliği ön planda tuttuğu bir dönemde,",
      "biz tam tersine yavaşlamayı, toprağı dinlemeyi ve atalarımızdan öğrendiklerimizi olduğu gibi uygulamayı tercih ettik.</p>",
      "<h2>Organik Tarımın Felsefesi</h2>",
      "<p>Organik tarım yalnızca kimyasal kullanmamak değildir. Toprağı bir kaynak olarak değil, bir ortak olarak görmektir.",
      "İspir'deki bahçelerimizde hiçbir zaman sentetik gübre veya böcek ilacı kullanmadık. Bunun yerine:</p>",
      "<ul>",
      "<li>Geleneksel kompost teknikleriyle toprağın doğal mikro-organizma dengesini koruduk</li>",
      "<li>Ata tohumlarını kullanarak bölgenin genetik mirasını yaşattık</li>",
      "<li>Hasat zamanlamasını meyvenin kendi olgunluk döngüsüne bıraktık</li>",
      "<li>Sulama için İspir'in kristal berraklığındaki dağ sularını tercih ettik</li>",
      "</ul>",
      "<h2>Sabır, En Değerli Malzeme</h2>",
      "<p>Modern gıda üretiminde sabır lüks kabul edilir. Biz ise sabrı temel malzememiz olarak benimsedik.",
      "Bir dutun ağacında olgunlaşması için yüzlerce yıllık bir ekolojik dengeye ihtiyaç vardır.",
      "Bu dengeyi bozmadan, onunla birlikte çalışarak üretmek; lezzetin zamanın eseri olduğunu görmek — işte Pekefe'nin varoluş sebebi budur.</p>",
      "<p>Sofranıza ulaşan her kavanoz, yalnızca bir ürün değil; bir toprağın, bir mevsimin ve bir ailenin emekle büyüttüğü bir anıdır.</p>"
    ].join("\n")
  },
  {
    title: "Dut Pekmezi: Kadim Bir Lezzetin Modern Sofraya Yolculuğu",
    slug: "dut-pekmezi-kadim-bir-lezzetin-modern-sofraya-yolculugu",
    category: "Ürün Hikayeleri",
    metaDesc: "İspir dutlarından geleneksel bakır kazanlarda pişirilen dut pekmezinin yapım süreci, besin değerleri ve sofranızda nasıl kullanabileceğinize dair her şey.",
    isActive: true,
    content: [
      "<h2>Dut Ağacının Zamanı</h2>",
      "<p>Haziran sonu ile Temmuz başı — İspir'in dut bahçelerinde en yoğun dönem.",
      "Sabahın ilk ışıklarıyla birlikte tül gibi sislerin arasında dallardan toplanan dutlar, o gün içinde işlenmek üzere yola çıkar.",
      "Hiçbir dut bir gün fazla beklemez; çünkü olgunluğun zirvesi kısa ve narindir.</p>",
      "<h2>Bakır Kazanın Sırrı</h2>",
      "<p>Dut pekmezimizin yapımında endüstriyel hiçbir ekipman kullanmıyoruz.",
      "Sebebi basit: bakır kazan, sürekli ve eşit ısı dağılımı sağlar.",
      "Ateşin üzerinde saatlerce, aralıksız karıştırılan dutlar; hiçbir katkı maddesi olmadan kendi şekerini ve asidini harmanlar.",
      "Ortaya çıkan koyu, parlak, derin mahun rengi bir pekmez — işte doğanın sunduğu en saf tatlardan biri.</p>",
      "<p>Pişirme süresi minimum 6 saattir. Bu süre boyunca ateşin yoğunluğu, karıştırmanın ritmi ve dutun olgunluk derecesi sürekli gözlemlenir.",
      "Bunu bir bilim olduğu kadar bir sezgi işi olarak tanımlarız.</p>",
      "<h2>Besin Değeri ve Kullanım Önerileri</h2>",
      "<p>Dut pekmezi, demir ve B vitamini açısından son derece zengin bir kaynaktır.",
      "Özellikle kış aylarında bağışıklık sistemini destekleyen geleneksel bir besin olarak yüzyıllardır Anadolu sofralarında yer almaktadır.</p>",
      "<p><strong>Sabah kahvaltısında:</strong> Tahin ile 1:1 oranında karıştırarak protein ve enerji deposu bir başlangıç oluşturabilirsiniz.</p>",
      "<p><strong>Tatlılarda:</strong> Şeker yerine kullanabilir, sütlaç veya muhallebiye ekleyebilirsiniz.</p>",
      "<p><strong>Et yemeklerinde:</strong> Az miktarda pekmez, ızgara kuzuya veya tavuğa kompleks bir derinlik katar.</p>"
    ].join("\n")
  },
  {
    title: "Geleneksel Reçel Yapımı: Bir Ritüel Olarak Hasat",
    slug: "geleneksel-recel-yapimi-bir-ritual-olarak-hasat",
    category: "Zanaatkarlık",
    metaDesc: "Pekefe reçellerinin yapım sürecini, İspir'in meyve çeşitlerini ve nesilden nesile aktarılan geleneksel kaynatma tekniklerini anlatan kapsamlı bir rehber.",
    isActive: true,
    content: [
      "<h2>Reçel Bir Ürün Değil, Bir Bellek Saklama Yöntemidir</h2>",
      "<p>Reçel yapmak, insanlığın en eski meyve saklama yöntemlerinden biridir.",
      "Şekerin koruyucu gücüyle meyvenin kısa ömrünü yıllara taşımak — bu basit ama derin bir bilgelik içerir.",
      "İspir'de yüzyıllardır uygulanan geleneksel reçel yapımı, bunu bir mutfak işinden çok bir ritüele dönüştürür.</p>",
      "<h2>Mevsimin Seçimi</h2>",
      "<p>Her meyvenin bir altın penceresi vardır — ne fazla olgun, ne az olgun.",
      "Bu pencere bazen yalnızca birkaç gündür. Pekefe ekibi, hasat dönemlerini uzun yılların gözlem birikimiyle takip eder:</p>",
      "<ul>",
      "<li><strong>Vişne:</strong> Haziran ortası, sert ve ekşi olgunlukta</li>",
      "<li><strong>Böğürtlen:</strong> Temmuz sonu, dağ eteklerinden elle toplama</li>",
      "<li><strong>Kayısı:</strong> Temmuz başı, sarı altın tonunda</li>",
      "<li><strong>İncir:</strong> Ağustos, tam olgunlukta siyah incir</li>",
      "<li><strong>Dağ çileği:</strong> Haziran, küçük ve yoğun aromalı</li>",
      "</ul>",
      "<h2>Kaynatmanın Sanatı</h2>",
      "<p>Reçel yapımında en kritik adım kaynatma sürecidir.",
      "Düşük ısıda, uzun süre pişirme; meyvenin şeklini korurken içindeki aromaları yoğunlaştırır.",
      "Yüksek ısı ise meyveyi dağıtır, rengi karartır ve doğal aromayı bozar.</p>",
      "<p>Biz geleneksel yöntemde olduğu gibi meyveyi önce şekerle birkaç saat bekleterek kendi suyunu salmasını sağlarız.",
      "Sonrasında orta ateşte, aralıklı karıştırarak pişirme başlar.",
      "Köpük almak, kıvam testi yapmak ve vakti doğru okumak — bunlar tarife yazılamaz, yılların verdiği bir his meselesidir.</p>",
      "<h2>Neden Şeker Miktarı Önemlidir?</h2>",
      "<p>Endüstriyel reçellerde uzun raf ömrü için aşırı şeker kullanılır.",
      "Bizim reçellerimizde şeker oranı meyvenin doğal şekerini destekleyecek kadar kullanılır — ne fazlası ne eksiği.",
      "Bu; hem daha gerçek bir meyve tadı anlamına gelir, hem de sağlık açısından daha dengeli bir ürün.</p>"
    ].join("\n")
  },
  {
    title: "Kış Sofrası İçin 5 Geleneksel Pekefe Tarifi",
    slug: "kis-sofrasi-icin-5-geleneksel-pekefe-tarifi",
    category: "Tarifler",
    metaDesc: "Soğuk kış günlerinde sofranızı zenginleştirecek, Pekefe'nin yöresel ürünlerini kullanan 5 geleneksel Erzurum ve İspir tarifini keşfedin.",
    isActive: true,
    content: [
      "<h2>Kış Sofrasının Sıcaklığı</h2>",
      "<p>Doğu Anadolu'nun uzun kış aylarında sofralar her zamankinden daha zengin, daha sıcak ve daha anlamlı olur.",
      "İspir'in geleneksel mutfağı bu mevsimde kendini tam olarak gösterir:",
      "derinlikli pekmezler, ekşimsi reçeller, kavrum tereyağı ve tarhana çorbasının buharı...</p>",
      "<h2>1. Tahin-Pekmez ile Güçlü Bir Sabah Başlangıcı</h2>",
      "<p>En basit, en besleyici ve en geleneksel kombinasyon.",
      "Dut pekmezini tahinle karıştırın, üzerine ceviz dökün.",
      "Bu üçlü, protein, demir ve sağlıklı yağ kombinasyonuyla kış sabahlarının en güçlü başlangıcını sağlar.</p>",
      "<p><em>Öneri oran: 2 yemek kaşığı tahin + 1 yemek kaşığı dut pekmezi</em></p>",
      "<h2>2. Vişne Reçelli Lor Tatlısı</h2>",
      "<p>Taze lor peynirini geniş bir kaba koyun.",
      "Üzerine vişne reçelini gezdirin, bir avuç ceviz ekleyin. Soğuk servis edin.",
      "Bu tatlı Doğu Anadolu'nun yüzyıllık geleneğini modern bir sunumla masaya getirir.</p>",
      "<h2>3. Pekmezli Sütlaç</h2>",
      "<p>Klasik sütlacı hazırlayın, fırına vermeden önce üzerine bir kaşık dut veya üzüm pekmezi gezdirin.",
      "Fırında karamelize olan pekmez, sütlaca derin ve smoky bir not katar. Tarçınla birlikte servis edin.</p>",
      "<h2>4. Kayısı Reçelli Yulaflı Porridge</h2>",
      "<p>Sıcak sütle hazırladığınız yulafın üzerine kayısı reçeli, bir tutam tarçın ve bir çay kaşığı chia tohumu ekleyin.",
      "Bu kombinasyon hem geleneksel hem de modern beslenmenin buluştuğu bir sofra deneyimi sunar.</p>",
      "<h2>5. Tarhana Çorbasına Pekmez Dokunuşu</h2>",
      "<p>Geleneksel tarhana çorbanızı hazırladıktan sonra, servis kasesine dökmeden önce yarım çay kaşığı dut pekmezi karıştırın.",
      "Bu beklenmedik dokunuş, çorbanın ekşimsi notuna tatlı bir denge katar ve aroma profilini belirgin biçimde zenginleştirir.</p>"
    ].join("\n")
  },
  {
    title: "İspir'in Coğrafi Zenginliği: Neden Buradan Üretiyoruz",
    slug: "ispir-cografi-zenginligi-neden-buradan-uretiyoruz",
    category: "Köken & Coğrafya",
    metaDesc: "Erzurum'un İspir ilçesinin eşsiz coğrafi ve iklim koşullarının Pekefe ürünlerinin kalitesine nasıl katkıda bulunduğunu ve neden bu toprakları seçtiğimizi anlatan bir makale.",
    isActive: true,
    content: [
      "<h2>Konum Bir Tesadüf Değil</h2>",
      "<p>İspir, Erzurum iline bağlı küçük bir ilçedir.",
      "Çoruh Nehri vadisinde, dağ eteklerinde kurulu bu yerleşim; hem Karadeniz hem de Doğu Anadolu ikliminin etkisi altında kalır.",
      "Bu iki iklimin buluşma noktası olması, İspir'e Türkiye'de başka hiçbir yerde bulunmayan eşsiz bir mikroklima kazandırır.</p>",
      "<h2>Rakım ve Sıcaklık Farkının Rolü</h2>",
      "<p>İspir'in deniz seviyesinden 1.100-1.400 metre yükseklikte konumlanması, gece-gündüz sıcaklık farkının büyük olduğu anlamına gelir.",
      "Bu fark — bazı günlerde 15-20 derece — meyvelerdeki şeker ve asit dengesinin olağanüstü şekillenmesini sağlar.",
      "Soğuk geceler şekeri konsantre ederken, ılımlı gündüzler olgunlaşmayı yavaşlatır ve aromaların derinleşmesine fırsat tanır.</p>",
      "<p>Dünyaca ünlü şarap üzüm bölgelerinde de benzer bir prensip geçerlidir:",
      "büyük sıcaklık farkı, meyvenin karmaşık bir aromatik profil geliştirmesini sağlar.</p>",
      "<h2>Çoruh Suyu</h2>",
      "<p>İspir'in en değerli doğal kaynağı Çoruh Nehri'nin beslendiği dağ sularıdır.",
      "Pekefe bahçelerinde sulama için kullanılan bu su, mineral bakımından zengin ve herhangi bir endüstriyel kirlilikten uzaktır.",
      "Suyun kalitesi, doğrudan bitkinin kök gelişimini ve besin alımını etkiler.</p>",
      "<h2>Topluluk ve Bilgi Mirası</h2>",
      "<p>Coğrafya tek başına yeterli değildir.",
      "İspir'in gerçek zenginliği, nesiller boyunca bu topraklarla birlikte yaşayan insanların bilgi birikimidir.",
      "Hangi meyve ne zaman toplanır, hangi toprak ne kadar su ister, hangi hava koşulunda kavuşmak gerekir — bunlar bir kitapta yazmaz.</p>",
      "<p>Pekefe olarak burada üretmeyi seçmemizin temel sebebi; bu bilgiye, bu toprağa ve bu topluluğa olan inancımızdır.</p>"
    ].join("\n")
  },
  {
    title: "Sofra Kültürü: Yemek Bir İhtiyaçtan Fazlasıdır",
    slug: "sofra-kulturu-yemek-bir-ihtiyactan-fazlasidir",
    category: "Kültür & Yaşam",
    metaDesc: "Anadolu sofra kültürünün derinliği, yemek etrafında kurulan topluluklar ve Pekefe'nin bu geleneği modern yaşama nasıl taşıdığı üzerine bir deneme.",
    isActive: true,
    content: [
      "<h2>Sofra Bir Ritüeldir</h2>",
      "<p>Anadolu kültüründe yemek yalnızca bir beslenme eylemi değildir.",
      "Sofra; bir araya gelmenin, konuşmanın, hatıralamaların, anlaşmazlıkların ve barışmanın mekânıdır.",
      "Büyük bir örtünün üzerine dizilen yemekler arasında insanlar sadece doymaz — birbirini tanır, anlayış geliştirir, bağ kurar.</p>",
      "<h2>Zamanın Yavaşladığı Yer</h2>",
      "<p>Modern yaşam her şeyi hızlandırıyor.",
      "Sabah kahvaltısı pratik olmalı, öğle yemeği hızlı tüketilmeli, akşam yemeği mümkünse hazır.",
      "Bu tempo içinde sofranın ritüel niteliği yok olup gidiyor.</p>",
      "<p>Biz inanıyoruz ki yüksek kaliteli bir gıda, yavaşlamaya davet eden bir gıdadır.",
      "Kavanozun kapağını açtığınızda duyduğunuz o aroma, ağzınızda hissettiğiniz o derin tat — bunlar sizi o anda oraya hapseder.",
      "Bu anın farkında olmak; işte bu, lüksün özüdür.</p>",
      "<h2>Hediye Edilebilir Bir Deneyim</h2>",
      "<p>Pekefe ürünleri çoğu zaman bir hediye olarak yolculuğa çıkar.",
      "Bir yakına götürülen kavanoz, yalnızca bir ürün değil;",
      "seninle bu anı paylaşmak istiyorum mesajının taşıyıcısıdır.",
      "Ambalajımızı, sunumumuzu ve ürün kalitemizi bu hediyeleşme kültürüne uygun tasarladık.</p>",
      "<h2>Sizi Davet Ediyoruz</h2>",
      "<p>Bir sonraki sofranızda, bir şeyleri yavaşlatmayı deneyin.",
      "Kahvaltı masasına bir kavanoz dut pekmezi koyun. Tahin ile karıştırın.",
      "Pencereden gün ışığını izleyin. Çayınızı demleyin.",
      "Ve o masada oturan, o anı sizinle paylaşan insanlara bakın.</p>",
      "<p>İspir'den sofranıza gelen her ürün, bu yavaş anın bir parçası olmak için yola çıktı.</p>"
    ].join("\n")
  }
];

async function main() {
  console.log("Blog yazilari olusturuluyor...");
  let created = 0;
  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log("Zaten var, guncelleniyor:", post.title);
      await prisma.blogPost.update({ where: { slug: post.slug }, data: post });
    } else {
      await prisma.blogPost.create({ data: post });
      created++;
      console.log("Olusturuldu:", post.title);
    }
  }
  console.log("\nToplam " + created + " yeni yazi olusturuldu.");
  const total = await prisma.blogPost.count();
  console.log("Veritabanindaki toplam yazi:", total);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
