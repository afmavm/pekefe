const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new DatabaseSync(dbPath);

const product_id = 'cms7y76vq0005uetc6rj8y5z6';
const row = db.prepare('SELECT attributes FROM Product WHERE id = ?').get(product_id);

let attrs = {};
if (row && row.attributes) {
  try { attrs = JSON.parse(row.attributes); } catch(e) {}
}

const short_desc = 'İspir’in 2000 metre rakımlı el değmemiş vadilerinden toplanan birinci sınıf beyaz dutların, asırlık usullerle odun ateşinde bakır kazanlarda kaynatılması ve keten sergilerde doğanın kucağında kurutulmasıyla hazırlanan %100 doğal, ilave şekersiz ve ipeksi Sade Dut Pestili.';

const details_text = 'PEKEFE Sade Dut Pestili, Erzurum İspir’in yüksek oksijenli mikroklimal vadilerinde yetişen asırlık dut ağaçlarından şafak vakti çarşaflar serilerek el emeğiyle toplanan saf beyaz dutlardan üretilir.\n\nHiçbir kimyasal koruyucu, tatlandırıcı, renklendirici veya glikoz şurubu içermeyen doğal dut şırası, geleneksel bakır kazanlarda (herle) meşe odunu ateşinde kıvam alıncaya kadar ağır ağır pişirilir. Az miktarda tam buğday unu ile bağlanan ipeksi şıra, usta ellerce saf keten bezler üzerine milimetrik hassasiyetle dökülür.\n\nİspir\'in nemsiz dağ rüzgârları ve bol güneş ışığı altında doğal olarak kurutulan pestiller, kıvamını bulunca sergilerden su buharı yardımıyla özenle sıyrılır. İncecik, ipeksi dokusu ve meyvenin kendi doğal karamelize aromasıyla PEKEFE Sade Dut Pestili; yüksek enerjili, mineral deposu ve rafine bir geleneksel lezzet şölenidir.';

Object.assign(attrs, {
  shortDesc: short_desc,
  details: details_text,
  harvestStory: details_text,
  ingredients: '%100 Saf İspir Beyaz Dut Şırası, Tam Buğday Unu',
  ritual: 'Oda sıcaklığında (18°C - 22°C), yanında taze demlenmiş Türk kahvesi veya bergamat aromalı çay ile servis edilmesi önerilir. İsteğe göre içerisine keçi peyniri veya manda kaymağı sarılarak nefis bir zıt lezzet dengesi oluşturulabilir.',
  altitude: '2000 Metre',
  harvestSeason: 'Temmuz - Ağustos',
  hmfLevel: '< 10 mg/kg (Analiz Raporlu)',
  nutrients: {
    energy: '380 kcal',
    carb: '82.0 g',
    protein: '3.5 g',
    calcium: '120 mg',
    iron: '4.0 mg'
  },
  specifications: [
    { key: 'Menşei', value: 'Erzurum / İspir' },
    { key: 'Kurutma Yöntemi', value: 'Keten Bezlerde Güneşte Doğal Kurutma' },
    { key: 'Kalınlık', value: '< 1.5 mm (İpeksi Dokulu)' },
    { key: 'Şeker / Glikoz', value: '0.0% (Sadece Doğal Meyve Şekeri)' },
    { key: 'HMF Seviyesi', value: '< 10 mg/kg (Analiz Raporlu)' }
  ]
});

const seo_title = 'PEKEFE Sade Dut Pestili | Geleneksel Katkısız İspir Dut Pestili';
const seo_desc = 'İspir’in 2000 m yüksek rakımlı vadilerinde yetişen katkısız beyaz dutlardan, geleneksel odun ateşinde ve keten bezlerde güneşte kurutularak hazırlanan saf Sade Dut Pestili. İlave şekersiz, glikozsuz ve %100 doğal geleneksel lezzet.';
const seo_keywords = 'Sade Dut Pestili, İspir Dut Pestili, Katkısız Pestil, Şekersiz Pestil, Geleneksel Erzurum Pestili, Güneşte Kurutulmuş Pestil, Doğal Atıştırmalık, PEKEFE';

const stmt = db.prepare(`
  UPDATE Product
  SET desc = ?,
      seoTitle = ?,
      seoDesc = ?,
      seoKeywords = ?,
      attributes = ?
  WHERE id = ?
`);

const res = stmt.run(short_desc, seo_title, seo_desc, seo_keywords, JSON.stringify(attrs), product_id);
console.log('SUCCESS! Product updated. Changes:', res.changes);
db.close();
