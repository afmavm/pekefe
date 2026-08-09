import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const masterProducts = [
  {
    "id": "cmro43lnb000duel05pk5prg1",
    "sku": "RAW-SAC-01",
    "name": "304 Paslanmaz Çelik Sac (Plaka)",
    "category": "Hammadde",
    "stock": 500,
    "criticalLimit": 100,
    "price": 0,
    "oldPrice": null,
    "cost": 350,
    "image": "https://placehold.co/100?text=Sac",
    "images": [],
    "desc": "304 Paslanmaz Çelik Sac (Plaka)",
    "isRawMaterial": true,
    "attributes": {
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnd000euel02y5vw5s6",
    "sku": "RAW-DERI-01",
    "name": "Körük Derisi ve Körük Körüğü",
    "category": "Hammadde",
    "stock": 250,
    "criticalLimit": 50,
    "price": 0,
    "oldPrice": null,
    "cost": 150,
    "image": "https://placehold.co/100?text=Deri",
    "images": [],
    "desc": "Körük Derisi ve Körük Körüğü",
    "isRawMaterial": true,
    "attributes": {
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnf000fuel0fmmu8vdk",
    "sku": "RAW-IP-01",
    "name": "Doğal Deri Bağlama İpi",
    "category": "Hammadde",
    "stock": 1000,
    "criticalLimit": 100,
    "price": 0,
    "oldPrice": null,
    "cost": 20,
    "image": "https://placehold.co/100?text=Ip",
    "images": [],
    "desc": "Doğal Deri Bağlama İpi",
    "isRawMaterial": true,
    "attributes": {
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnh000guel0un0ugh0s",
    "sku": "HAM-SAC-GALV",
    "name": "Galvaniz Sac (Rulo)",
    "category": "Hammadde",
    "stock": 4995,
    "criticalLimit": 500,
    "price": 35,
    "oldPrice": null,
    "cost": 15,
    "image": "https://images.unsplash.com/photo-1518552796036-6e3e5b128522?auto=format&fit=crop&q=80&w=400",
    "images": [],
    "desc": "Galvaniz Sac (Rulo)",
    "isRawMaterial": true,
    "attributes": {
      "unit": "kg",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnj000huel0ug5c9exn",
    "sku": "HAM-DERI-SUNI",
    "name": "Suni Deri (Rulo)",
    "category": "Hammadde",
    "stock": 1999,
    "criticalLimit": 200,
    "price": 65,
    "oldPrice": null,
    "cost": 30,
    "image": "https://images.unsplash.com/photo-1620600574044-67d739814eb3?auto=format&fit=crop&q=80&w=400",
    "images": [],
    "desc": "Suni Deri (Rulo)",
    "isRawMaterial": true,
    "attributes": {
      "unit": "m2",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnk000iuel00skov2dc",
    "sku": "HAM-SUNTA",
    "name": "Ahşap Sunta Tutamaç",
    "category": "Hammadde",
    "stock": 9980,
    "criticalLimit": 500,
    "price": 5,
    "oldPrice": null,
    "cost": 2,
    "image": "https://images.unsplash.com/photo-1550985552-87fc03afb871?auto=format&fit=crop&q=80&w=400",
    "images": [],
    "desc": "Ahşap Sunta Tutamaç",
    "isRawMaterial": true,
    "attributes": {
      "unit": "adet",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnm000juel09u8b4n60",
    "sku": "HAM-YAY",
    "name": "Körük Yayı",
    "category": "Hammadde",
    "stock": 14990,
    "criticalLimit": 1000,
    "price": 2,
    "oldPrice": null,
    "cost": 0.8,
    "image": "https://images.unsplash.com/photo-1563223771-5fe403a4fd12?auto=format&fit=crop&q=80&w=400",
    "images": [],
    "desc": "Körük Yayı",
    "isRawMaterial": true,
    "attributes": {
      "unit": "adet",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lno000kuel0vgbyp952",
    "sku": "HAM-MENTESE",
    "name": "Metal Menteşe",
    "category": "Hammadde",
    "stock": 19980,
    "criticalLimit": 1000,
    "price": 2,
    "oldPrice": null,
    "cost": 0.75,
    "image": "https://images.unsplash.com/photo-1589139591321-7dd21ffb858e?auto=format&fit=crop&q=80&w=400",
    "images": [],
    "desc": "Metal Menteşe",
    "isRawMaterial": true,
    "attributes": {
      "unit": "adet",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnq000luel0daoerjsj",
    "sku": "PEKEFE-KORUK-01",
    "name": "Pekefe İspir Dut Pekmezi İkram Seti",
    "category": "Arıcılık",
    "stock": 150,
    "criticalLimit": 20,
    "price": 850,
    "oldPrice": null,
    "cost": 300,
    "image": "/uploads/beekeeping_bellows_premium.png",
    "images": [],
    "desc": "Asırlık Erzurum kalitesi, patentli çift hava kanalı sayesinde hiç sönmeyen 304 paslanmaz arı körüğü.",
    "isRawMaterial": false,
    "attributes": {
      "Malzeme": "304 Paslanmaz Çelik",
      "Hava Kanalı": "Patentli Çift Kanal",
      "unit": "adet",
      "barcode": "8680000000015",
      "quickOverview1_title": "304 Paslanmaz Çelik",
      "quickOverview1_desc": "Yüksek ısı mukavemeti ve uzun ömürlü paslanmaz gövde yapısı.",
      "quickOverview1": "<strong>304 Paslanmaz Çelik:</strong> Yüksek ısı mukavemeti ve uzun ömürlü paslanmaz gövde yapısı.",
      "quickOverview2_title": "Deri Isı Kalkanı Körük",
      "quickOverview2_desc": "Elinizi ısıdan koruyan yüksek kaliteli ahşap ve hakiki deri körük.",
      "quickOverview2": "<strong>Deri Isı Kalkanı Körük:</strong> Elinizi ısıdan koruyan yüksek kaliteli ahşap ve hakiki deri körük.",
      "quickOverview3_title": "Yoğun Duman Izgarası",
      "quickOverview3_desc": "Optimize edilmiş duman odasıyla arıları strese sokmayan soğuk duman çıkışı.",
      "quickOverview3": "<strong>Yoğun Duman Izgarası:</strong> Optimize edilmiş duman odasıyla arıları strese sokmayan soğuk duman çıkışı.",
      "specsMaterial": "304 Kalite Paslanmaz Çelik",
      "specsWeight": "950 Gram (Ekipmansız boş ağırlık)",
      "specsDimensions": "28 cm Yükseklik x 10 cm Silindir Çapı",
      "specsBellows": "Hakiki Sığır Derisi & Isıl İşlem Görmüş Ahşap Plaka",
      "longDescExtra": "PEKEFE profesyonel körük serisi, arıcılarımızın konforlu ve güvenli bir arılık yönetimi yapabilmesi için tasarlanmıştır. Gövdede yer alan çelik tel ızgara, körükten çıkan havanın duman odasına kesintisiz iletilmesini sağlarken yanmayı hızlandırır. Koruyucu tel örgü kalkanı, çalışma esnasında gövde ısısının doğrudan elinizle temas etmesini engelleyerek iş kazalarının önüne geçer. Ergonomik tasarımı, uzun süreli kullanımlarda bile bilek yorgunluğuna yol açmaz.",
      "usageGuide": "Körüğün tabanındaki havalandırma sacının altına kuru ot, talaş veya hafif nemlendirilmiş duman kartonunu yerleştirin.\nKutuyu hafifçe ateşleyin ve dumanın kor halinde alev almasını sağlayın.\nİlk kor oluştuktan sonra duman odasının geri kalanını talaş, çam iğnesi veya kuru otla doldurun.\nKörüğü arkasındaki ahşap tabladan ritmik bir şekilde pompalayarak dumanın yoğunlaşmasını sağlayın.\nDuman çıkışı stabil bir hale geldikten sonra kapağı kilitleyin. İşlem bitiminde körüğü asma halkasından dikey bir şekilde muhafaza edin.",
      "warrantyInfo": "Tüm metal parçalar, korozyon ve paslanmaya karşı 2 Yıl Üretici Garantisi altındadır.\nKörük derisinin aşınması veya ahşap parçanın su teması sebebiyle deforme olması garanti kapsamı dışındadır, ancak teknik servisimizden yedek körük temin edilebilir.\nKullanım kılavuzundaki yönergelere uygun olmayan aşırı yakıt doldurma kaynaklı metal eğrilmeleri garanti kapsamında değerlendirilmez.",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lns000muel0j7zdfcne",
    "sku": "PEKEFE-ELBISE-01",
    "name": "Tam Koruma Arıcı Elbisesi",
    "category": "Arıcılık",
    "stock": 80,
    "criticalLimit": 10,
    "price": 1200,
    "oldPrice": null,
    "cost": 500,
    "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800",
    "images": [],
    "desc": "3 katmanlı, nefes alabilir, arı sokmalarına karşı %100 güvenli profesyonel elbise.",
    "isRawMaterial": false,
    "attributes": {
      "Beden": "L/XL",
      "Katman Sayısı": "3 Katmanlı",
      "unit": "adet",
      "barcode": "8680000000022",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnu000nuel0cyvbyqc7",
    "sku": "PEKEFE-SET-01",
    "name": "Kovan Bakım Seti",
    "category": "Arıcılık",
    "stock": 120,
    "criticalLimit": 15,
    "price": 650,
    "oldPrice": null,
    "cost": 250,
    "image": "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
    "images": [],
    "desc": "8 parça paslanmaz çelik aletler ve özel taşıma çantası içeren profesyonel kovan bakım seti.",
    "isRawMaterial": false,
    "attributes": {
      "Parça Sayısı": "8 Parça",
      "Çanta": "Dahil",
      "unit": "adet",
      "barcode": "8680000000039",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cmro43lnv000ouel0v46dqbsa",
    "sku": "KORUK-GALV-01",
    "name": "Profesyonel Galvaniz Arıcı Körüğü",
    "category": "Arıcılık Ekipmanları",
    "stock": 10,
    "criticalLimit": 5,
    "price": 350,
    "oldPrice": 455,
    "cost": 85,
    "image": "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
    "images": [],
    "desc": "Korozyona dayanıklı galvaniz kaplama, dayanıklı deri körük and optimum hava üfleme kapasitesi sunan profesyonel arıcı körüğü.",
    "isRawMaterial": false,
    "attributes": {
      "unit": "adet",
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cms7y76vq0005uetc6rj8y5z6",
    "sku": "PKF-650978",
    "name": "PEKEFE İspir Dut Pekmezi",
    "category": "Pekmez ÇeşitLeri",
    "stock": 995,
    "criticalLimit": 5,
    "price": 500,
    "oldPrice": 850,
    "cost": 300,
    "image": "/uploads/1785870425901-o5xqxfpv2.webp",
    "images": [
      "/uploads/1785870425901-o5xqxfpv2.webp",
      "/uploads/1785870432153-vbtv3ryai.webp",
      "/uploads/1785870437692-leo3oj37x.webp",
      "/uploads/1785870451965-mpwiqeunl.webp",
      "/uploads/1785870907408-rssxnerh4.mp4",
      "/uploads/1785870457414-o4i2qgpee.webp"
    ],
    "desc": "PEKEFE Geleneksel İspir Dut Pekmezi İspir'in Asırlık Dut Ağaçlarından Gelen Saf Lezzet PEKEFE Geleneksel İspir Dut Pekmezi , Erzurum'un İspir ilçesinin yüksek oksijenli mikroklima vadilerinde yetişen asırlık beyaz dut ağaçlarının bereketli meyvelerinden üretilir. Dutlar, geleneksel hasat kültürünün en önemli uygulamalarından biri olan şafak vakti çarşaflar üzerine silkelenerek özenle toplanır. Böylece yere temas etmeyen, en doğal ve olgun meyveler seçilerek üretime alınır. PEKEFE için bu süreç yalnızca bir hasat değil; doğaya, emeğe ve İspir'in köklü üretim geleneğine duyulan saygının ilk adımıdır. Geleneksel Bakır Kazanlarda Ustalıkla Hazırlanır Toplanan dutlardan elde edilen saf dut şırası, nesiller boyunca sürdürülen geleneksel yöntemlere bağlı kalınarak bakır kazanlarda (herle) ve meşe odunu ateşinde ağır ağır pişirilir. Yavaş ve kontrollü pişirme süreci, dutun doğal aromasının, kendine özgü renginin ve yoğun kıvamının korunmasına yardımcı olur. Bu geleneksel yöntem sayesinde ortaya çıkan pekmez; ipeksi dokusu, zengin aroması ve dengeli lezzetiyle İspir'in gerçek pekmez kültürünü yansıtır. Doğallığını Koruyan Üretim Anlayışı PEKEFE Geleneksel İspir Dut Pekmezi'nin üretiminde doğallık temel prensiptir. Ürünümüz; İlave şeker içermez. Glikoz şurubu içermez. Kimyasal koruyucu içermez. Yapay renklendirici içermez. Yapay tatlandırıcı içermez. Sadece dutun kendi doğal lezzeti ve geleneksel üretim ustalığıyla hazırlanır. Kaliteyi Koruyan Kontrollü Üretim Üretim sürecinde pekmez, HMF (Hidroksimetilfurfural) oluşumunun kontrol altında tutulmasına özen gösterilerek uygun sıcaklıklarda dinlendirilir. Böylece ürünün doğal karakteri korunurken kalite standartlarının sürdürülebilirliği de desteklenir. PEKEFE'nin üretim anlayışı; geleneksel yöntemleri modern kalite ve hijyen uygulamalarıyla birleştirerek her kavanozda aynı güveni sunmayı hedefler. Dutun Doğal Aromasını Hissettiren Eşsiz Tat İspir'in iklimi ve verimli topraklarının kazandırdığı karakter sayesinde PEKEFE Geleneksel İspir Dut Pekmezi; Yoğun kıvamı, İpeksi dokusu, Dutun kendi doğal karamelize aroması, Kendine özgü zengin lezzeti ile kahvaltı sofralarından geleneksel tariflere kadar her kullanımda farkını hissettirir. Sofralarınıza Gelen Doğal Miras PEKEFE Geleneksel İspir Dut Pekmezi; Kahvaltılarda tahin ile birlikte, Yoğurt ve sütle, Yulaf ve granola tariflerinde, Tatlı yapımında, Geleneksel lezzetleri modern tariflerle buluşturmak isteyenler için doğal ve eşsiz bir seçimdir. Neden PEKEFE? Çünkü PEKEFE, yalnızca pekmez üretmez. İspir'in bereketli vadilerini, asırlık dut ağaçlarını, geleneksel bakır kazanlarını ve ustaların yıllara dayanan emeğini her kavanoza özenle taşır. Her ürünümüzde; ✓ İspir'in üretim kültürüne bağlılık, ✓ Doğal hammaddelere duyulan saygı, ✓ Geleneksel yöntemlerin korunması, ✓ Modern hijyen ve kalite standartları, ✓ Katkısız ve güvenilir üretim anlayışı aynı titizlikle yaşatılır. PEKEFE – İspir'in Doğallığını Sofralarınıza Taşıyoruz Şafak vakti toplanan beyaz dutlardan, meşe odunu ateşinde ağır ağır pişirilen geleneksel bakır kazanlara uzanan bu yolculuk; her kaşıkta İspir'in doğasını, emeğini ve köklü lezzet mirasını hissettirir. PEKEFE Geleneksel İspir Dut Pekmezi , yalnızca bir pekmez değil; Anadolu'nun kadim üretim kültürünün, doğallığın ve ustalığın sofralarınıza ulaşan en değerli temsilcisidir. PEKEFE İspir'in Doğallığı, Gelenekten Gelen Lezzet.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "İspir’in 2000 metre rakımlı yaylalarındaki asırlık beyaz dut ağaçlarından toplanan, bakır kazanlarda odun ateşinde ağır ağır kaynatılmış %100 saf ve katkısız geleneksel dut pekmezi.",
      "details": "PEKEFE Geleneksel İspir Dut Pekmezi, Erzurum İspir’in yüksek oksijenli mikroklimal vadilerinde yetişen asırlık beyaz dut ağaçlarından şafak vakti çarşaflar serilerek el emeğiyle toplanan saf meyvelerden üretilir.\n\nHiçbir kimyasal koruyucu, tatlandırıcı, renklendirici veya glikoz şurubu içermeyen doğal dut şırası, geleneksel bakır kazanlarda (herle) meşe odunu ateşinde kıvam alıncaya kadar ağır ağır pişirilir.\n\nHMF değerlerinin yükselmemesi için ideal sıcaklıklarda dinlendirilen pekmezimiz, kimyasal koruyucu ve ilave şeker barındırmaz. İpeksi dokusu ve meyvenin kendi doğal karamelize aromasıyla mineral deposu bir geleneksel lezzet şölenidir.",
      "harvestStory": "PEKEFE Geleneksel İspir Dut Pekmezi, Erzurum İspir’in yüksek oksijenli mikroklimal vadilerinde yetişen asırlık beyaz dut ağaçlarından şafak vakti çarşaflar serilerek el emeğiyle toplanan saf meyvelerden üretilir.\n\nHiçbir kimyasal koruyucu, tatlandırıcı, renklendirici veya glikoz şurubu içermeyen doğal dut şırası, geleneksel bakır kazanlarda (herle) meşe odunu ateşinde kıvam alıncaya kadar ağır ağır pişirilir.\n\nHMF değerlerinin yükselmemesi için ideal sıcaklıklarda dinlendirilen pekmezimiz, kimyasal koruyucu ve ilave şeker barındırmaz. İpeksi dokusu ve meyvenin kendi doğal karamelize aromasıyla mineral deposu bir geleneksel lezzet şölenidir.",
      "ingredients": "%100 Saf İspir Beyaz Dut Şırası",
      "ritual": "Oda sıcaklığında (18°C - 22°C), taş değirmen tahini ile %40’a %60 oranında karıştırılarak servis edilmesi önerilir. Karıştırırken ahşap veya seramik kaşık tercih edilmelidir.",
      "altitude": "2200 Metre",
      "harvestSeason": "Temmuz - Ağustos",
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "293 kcal",
        "carb": "70.2 g",
        "protein": "0.8 g",
        "calcium": "400 mg",
        "iron": "10.2 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "Pişirme Yöntemi",
          "value": "Odun Ateşinde Bakır Kazanlar"
        },
        {
          "key": "Şeker İlavesi",
          "value": "0.0% (Sadece Doğal Meyve Şekeri)"
        },
        {
          "key": "HMF Seviyesi",
          "value": "< 10 mg/kg (Analiz Raporlu)"
        }
      ],
      "barcode": "8697430273549",
      "unit": "Kg",
      "manufacturerCode": "PKF-PEK-5106",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": true,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 800,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 800,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "recipeDetails": "",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": "",
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "1 Kg",
        "500 Gr"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı"
      ]
    }
  },
  {
    "id": "cms7yzh3a000iuetcltcu35aj",
    "sku": "PKF-TEST-800",
    "name": "Test Urun",
    "category": "Dut Pekmezi",
    "stock": 0,
    "criticalLimit": 5,
    "price": 850,
    "oldPrice": 1200,
    "cost": 450,
    "image": "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    "images": [],
    "desc": "Test Urun",
    "isRawMaterial": false,
    "attributes": {
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cms7z0es8000juetcz6mfnuc4",
    "sku": "PKF-TEST-FRESH-100",
    "name": "Test Urun Fresh",
    "category": "Dut Pekmezi",
    "stock": 100,
    "criticalLimit": 5,
    "price": 850,
    "oldPrice": 1200,
    "cost": 450,
    "image": "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    "images": [],
    "desc": "Test Urun Fresh",
    "isRawMaterial": false,
    "attributes": {
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cml7y76vq0005uetc6rj8y5z7",
    "sku": "PKF-499290",
    "name": "PEKEFE İspir Karadut Pekmezi",
    "category": "Pekmez ÇeşitLeri",
    "stock": 1000,
    "criticalLimit": 10,
    "price": 600,
    "oldPrice": 1050,
    "cost": 560,
    "image": "/uploads/1785877091526-7ah5uox7t.webp",
    "images": [
      "/uploads/1785877091526-7ah5uox7t.webp",
      "/uploads/1785877098808-oq559xwyn.webp",
      "/uploads/1785877117745-hoyp6xxz0.webp",
      "/uploads/1785877124124-g4c9n8ek9.webp",
      "/uploads/1785877186234-29wv3y09f.webp",
      "/uploads/ispir-karadut-kaynatma-bakir-kazan.webp",
      "/uploads/1785877153252-4pczqre3d.mp4",
      "/uploads/1785877157277-6g7dpx2vc.webp"
    ],
    "desc": "PEKEFE Geleneksel İspir Karadut Pekmezi İspir'in Bereketli Karadutlarından Gelen Yoğun Lezzet PEKEFE Geleneksel İspir Karadut Pekmezi , Erzurum'un İspir ilçesinin temiz havası, yüksek rakımı ve verimli vadilerinde yetişen seçkin karadut meyvelerinden üretilir. Hasat döneminde olgunlaşan karadutlar, günün serinliği korunurken şafak vakti büyük bir özenle toplanır. Meyveler tazeliğini kaybetmeden işlenerek doğal karakterini koruyan saf karadut şırasına dönüştürülür. Her kavanoz, İspir'in bereketli doğasını, üreticilerimizin emeğini ve PEKEFE'nin kalite anlayışını sofralarınıza taşır. Besin Değerlerini Korumaya Odaklanan Üretim Toplanan karadutlar hassas şekilde preslenerek elde edilen şıra, düşük sıcaklıkta çalışan vakumlu kazanlarda kontrollü olarak yoğunlaştırılır. Bu özel üretim yöntemi sayesinde yüksek sıcaklığın oluşturabileceği kalite kayıpları en aza indirilirken, karadutun doğal aroması, rengi ve karakteristik yapısı korunmaya özen gösterilir. Sonuç olarak yoğun kıvamlı, ipeksi dokulu ve karadutun kendine özgü lezzetini yansıtan geleneksel bir pekmez elde edilir. Karadutun Kendine Özgü Doğal Aroması Karadut, tatlı ve hafif ekşi lezzetin dengeli birleşimiyle öne çıkan özel bir meyvedir. PEKEFE Geleneksel İspir Karadut Pekmezi, bu karakteristik aromayı koruyacak şekilde üretilir. Yoğun meyve tadı, doğal rengi ve zengin aroması sayesinde kahvaltılardan özel tariflere kadar birçok kullanım alanında farkını hissettirir. Katkısız ve Güvenilir Üretim PEKEFE'nin doğallık anlayışı gereği ürünümüzde; İlave şeker bulunmaz. Glikoz şurubu kullanılmaz. Kimyasal koruyucu içermez. Yapay renklendirici içermez. Yapay aroma içermez. Karadutun doğal lezzeti ve geleneksel üretim anlayışı, ürünümüzün en önemli değeridir. Karadutun Doğal Zenginliği Karadut, doğal yapısında bulunan polifenoller ile dikkat çeken değerli bir meyvedir. Kontrollü üretim süreci sayesinde bu doğal bileşenlerin korunmasına özen gösterilir. PEKEFE Geleneksel İspir Karadut Pekmezi, doğal meyve içeriğiyle dengeli beslenmeyi tercih edenler için geleneksel ve katkısız bir alternatif sunar. Sofralarınıza Doğal Bir Lezzet Katın PEKEFE Geleneksel İspir Karadut Pekmezi; Kahvaltılarda, Tahin ile birlikte, Yoğurt ve sütle, Yulaf, granola ve müsli tariflerinde, Smoothie ve doğal içeceklerde, Tatlı ve hamur işi tariflerinde keyifle tüketilebilir. Yoğun aroması sayesinde az miktarda kullanıldığında bile tariflerinize zengin bir lezzet kazandırır. Neden PEKEFE? Çünkü PEKEFE, yalnızca ürün üretmez. İspir'in doğal zenginliklerini, üreticilerimizin emeğini ve geleneksel lezzet kültürünü geleceğe taşır. Her kavanozda; ✓ Özenle seçilmiş İspir karadutları, ✓ Kontrollü düşük sıcaklık üretimi, ✓ Katkısız içerik anlayışı, ✓ Modern hijyen standartları, ✓ Geleneksel üretim kültürüne duyulan saygı aynı titizlikle buluşur. PEKEFE – Doğadan Gelen Gerçek Karadut Lezzeti Şafak vakti özenle toplanan karadutlardan, besin değerlerini korumaya odaklanan kontrollü üretim süreciyle hazırlanan PEKEFE Geleneksel İspir Karadut Pekmezi , her kaşıkta İspir'in doğasını ve karadutun eşsiz aromasını hissettirir. Doğallığı, kaliteyi ve geleneksel üretim kültürünü bir araya getiren bu özel lezzet; kahvaltı sofralarından gurme tariflere kadar her anınıza değer katar. PEKEFE İspir'in Doğallığı, Gelenekten Gelen Lezzet.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "Düşük sıcaklıkta besin değerleri korunarak yoğunlaştırılmış, antioksidan zengini ve hafif ekşimsi aromasıyla öne çıkan premium yabani karadut özü.",
      "details": "Yabani karadut meyvelerinin şafak vakti hassasiyetle toplanıp preslenmesiyle elde edilen şıra, düşük sıcaklıktaki vakumlu kazanlarımızda besin değerlerini yitirmeden yoğunlaştırılır.\n\nKaradutun doğal ekşi-tatlı aroması ve yüksek polifenol yapısı korunur. Koruyucu, renklendirici ve ilave şeker barındırmayan bu özel mahsul, bağışıklık desteği ve doğal enerji deposudur.",
      "harvestStory": "Karadut meyvelerinin şafak vakti hassasiyetle toplanıp preslenmesiyle elde edilen şıra, düşük sıcaklıktaki vakumlu kazanlarımızda besin değerlerini yitirmeden yoğunlaştırılır.\n\nKaradutun doğal ekşi-tatlı aroması ve yüksek polifenol yapısı korunur. Koruyucu, renklendirici ve ilave şeker barındırmayan bu özel mahsul, bağışıklık desteği ve doğal enerji deposudur.",
      "ingredients": "%100 Yabani İspir Karadut Şırası",
      "ritual": "Sabahları aç karnına bir yemek kaşığı doğrudan tüketilmesi veya ılık kaynak suyuna eklenerek doğal bir şerbet şeklinde yavaşça yudumlanması önerilir.",
      "altitude": "1800 Metre",
      "harvestSeason": "Ağustos",
      "hmfLevel": "< 8 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "285 kcal",
        "carb": "68.5 g",
        "protein": "1.2 g",
        "calcium": "380 mg",
        "iron": "12.4 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "Yoğunlaştırma Yöntemi",
          "value": "Düşük Sıcaklıkta Vakumlu Yoğunlaştırma"
        },
        {
          "key": "Katkı Maddesi",
          "value": "Sıfır (%100 Doğal)"
        },
        {
          "key": "Ambalaj",
          "value": "Premium Cam Şişe"
        }
      ],
      "barcode": "8692518542921",
      "unit": "Kg",
      "manufacturerCode": "PKF-PEK-4054",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": false,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 1000,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 1000,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "recipeDetails": "",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": "",
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "1 Kg",
        "500 Gr"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı"
      ]
    }
  },
  {
    "id": "cms7y76vq0005uetc6rj8y5z8",
    "sku": "PKF-368593",
    "name": "PEKEFE Sade Dut Pestili",
    "category": "Pestil Köme Çeşitleri",
    "stock": 1000,
    "criticalLimit": 10,
    "price": 350,
    "oldPrice": 500,
    "cost": 320,
    "image": "/uploads/1785879506228-y5wufiq7k.webp",
    "images": [
      "/uploads/1785879506228-y5wufiq7k.webp",
      "/uploads/ispir-keten-bezde-pestil-serimi.webp",
      "/ispir-pestil-kurutma-gercek.png"
    ],
    "desc": "PEKEFE Geleneksel İspir Sade Dut Pestili İspir'in Güneşiyle Olgunlaşan Geleneksel Lezzet PEKEFE Geleneksel İspir Sade Dut Pestili , Erzurum'un İspir ilçesinin yüksek oksijenli mikroklima vadilerinde yetişen asırlık beyaz dut ağaçlarının özenle seçilen meyvelerinden üretilir. Hasat döneminde olgunlaşan dutlar, geleneksel yöntemlerle el emeğiyle toplanarak üretime alınır. Her pestil yaprağı, İspir'in bereketli topraklarını, temiz havasını ve yüzyıllardır yaşatılan üretim kültürünü sofralarınıza taşıyan doğal bir lezzet mirasıdır. Geleneksel Üretimle Hazırlanan Gerçek İspir Pestili Toplanan beyaz dutlardan elde edilen doğal dut şırası, hiçbir yapay katkıya ihtiyaç duyulmadan geleneksel yöntemlerle hazırlanır. Şıra, bakır kazanlarda (herle) meşe odunu ateşinde kontrollü şekilde pişirilir. Kıvamını almasının ardından, geleneksel tarifin gerektirdiği ölçüde tam buğday unu ile bağlanır ve ustalıkla saf keten bezler üzerine ince katmanlar hâlinde serilir. Bu yöntem, İspir'de nesiller boyunca aktarılan pestil üretim geleneğinin en önemli aşamalarından biridir. Güneş ve Dağ Rüzgârının Doğal Dokunuşu PEKEFE Geleneksel İspir Sade Dut Pestili'nin en önemli özelliklerinden biri, doğal kurutma sürecidir. Keten bezler üzerine serilen pestiller, İspir'in bol güneş ışığı ve nemsiz dağ rüzgârları eşliğinde doğal olarak kurutulur. Uygun kıvama ulaştığında özenle bezlerinden ayrılır ve geleneksel dokusunu koruyacak şekilde hazırlanır. Bu doğal süreç, pestilin ince yapısını, yumuşak dokusunu ve kendine özgü aromasını oluşturan en önemli unsurlardan biridir. Katkısız ve Doğal İçerik PEKEFE'nin üretim anlayışının temelinde doğallık yer alır. Ürünümüzde; Glikoz şurubu kullanılmaz. Kimyasal koruyucu bulunmaz. Yapay renklendirici içermez. Yapay aroma içermez. Geleneksel tarif doğrultusunda hazırlanır. Saf dutun doğal lezzeti ve geleneksel üretim ustalığı, ürünümüzün en değerli özelliğidir. İncecik Dokusu, Yoğun Dut Aroması PEKEFE Geleneksel İspir Sade Dut Pestili; İncecik ve esnek yapısı, İpeksi dokusu, Dutun doğal karamelize aroması, Dengeli ve hafif tatlı lezzeti ile geleneksel pestil severlerin vazgeçilmez tercihidir. Her lokmada beyaz dutun doğal aroması ve İspir'in eşsiz üretim kültürü hissedilir. Günün Her Saatinde Doğal Bir Atıştırmalık PEKEFE Geleneksel İspir Sade Dut Pestili; Kahvaltılarda, Çay ve kahve yanında, Ara öğünlerde, Spor öncesi veya sonrası pratik bir atıştırmalık olarak, Çocukların beslenme çantasında, Misafir ikramlarında keyifle tüketilebilir. Dilerseniz ceviz, fındık veya badem ile birlikte tüketerek geleneksel lezzeti farklı tatlarla zenginleştirebilirsiniz. Neden PEKEFE? Çünkü PEKEFE yalnızca pestil üretmez. İspir'in doğasını, asırlık dut ağaçlarını, geleneksel bakır kazanlarını ve ustalarımızın emeğini geleceğe taşıyan bir kültürü yaşatır. Her ürünümüzde; ✓ İspir'in seçkin beyaz dutları, ✓ Geleneksel bakır kazan üretimi, ✓ Meşe odunu ateşinde pişirme yöntemi, ✓ Keten bezlerde doğal kurutma, ✓ Katkısız içerik anlayışı, ✓ Modern hijyen ve kalite standartları aynı özenle buluşur. PEKEFE – İspir'in Doğallığını Her Lokmada Hissedin Asırlık beyaz dut ağaçlarından başlayan, geleneksel bakır kazanlarda devam eden ve İspir'in güneşiyle tamamlanan bu yolculuk; her lokmada doğallığı, emeği ve ustalığı hissettirir. PEKEFE Geleneksel İspir Sade Dut Pestili , yalnızca geleneksel bir atıştırmalık değil; Anadolu'nun köklü üretim kültürünü ve İspir'in eşsiz doğasını sofralarınıza taşıyan özel bir lezzettir. PEKEFE İspir'in Doğallığı, Gelenekten Gelen Lezzet.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "İspir’in yüksek rakımlı vadilerinde yetişen beyaz dut şırası ve tam buğday ununun bakır kazanlarda pişirilip keten sergilerde güneşte kurutulmasıyla hazırlanan ipeksi sade pestil.",
      "details": "PEKEFE Sade Dut Pestili, Erzurum İspir’in yüksek oksijenli mikroklimal vadilerinde yetişen asırlık dut ağaçlarından el emeğiyle toplanan saf beyaz dutlardan üretilir.\n\nHiçbir kimyasal koruyucu veya glikoz şurubu içermeyen doğal dut şırası, geleneksel bakır kazanlarda meşe odunu ateşinde pişirilir. Az miktarda tam buğday unu ile bağlanan ipeksi şıra, saf keten bezler üzerine dökülür.\n\nİspir'in nemsiz dağ rüzgarları ve bol güneş ışığı altında doğal olarak kurutulan pestiller, kıvamını bulunca sergilerden özenle sıyrılır. İncecik dokusu ve karamelize aromasıyla rafine bir lezzettir.",
      "harvestStory": "PEKEFE Sade Dut Pestili, Erzurum İspir’in yüksek oksijenli mikroklimal vadilerinde yetişen asırlık dut ağaçlarından el emeğiyle toplanan saf beyaz dutlardan üretilir.\n\nHiçbir kimyasal koruyucu veya glikoz şurubu içermeyen doğal dut şırası, geleneksel bakır kazanlarda meşe odunu ateşinde pişirilir. Az miktarda tam buğday unu ile bağlanan ipeksi şıra, saf keten bezler üzerine dökülür.\n\nİspir'in nemsiz dağ rüzgarları ve bol güneş ışığı altında doğal olarak kurutulan pestiller, kıvamını bulunca sergilerden özenle sıyrılır. İncecik dokusu ve karamelize aromasıyla rafine bir lezzettir.",
      "ingredients": "%100 Saf İspir Beyaz Dut Şırası, Tam Buğday Unu",
      "ritual": "Oda sıcaklığında (18°C - 22°C), yanında taze demlenmiş Türk kahvesi veya bergamat aromalı çay ile servis edilmesi önerilir. İsteğe göre içerisine keçi peyniri sarılabilir.",
      "altitude": "2000 Metre",
      "harvestSeason": "Temmuz - Ağustos",
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "380 kcal",
        "carb": "82.0 g",
        "protein": "3.5 g",
        "calcium": "120 mg",
        "iron": "4.0 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "Kurutma Yöntemi",
          "value": "Keten Bezlerde Güneşte Doğal Kurutma"
        },
        {
          "key": "Kalınlık",
          "value": "< 1.5 mm (İpeksi Dokulu)"
        },
        {
          "key": "Şeker / Glikoz",
          "value": "0.0% (Sadece Doğal Meyve Şekeri)"
        }
      ],
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "1 Kg",
        "500 Gr"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı"
      ],
      "barcode": "8699566620483",
      "unit": "Kg",
      "manufacturerCode": "PKF-PES-4309",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": false,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 450,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 450,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "recipeDetails": "",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": ""
    }
  },
  {
    "id": "cms7y76vq0005uetc6rj8y5z9",
    "sku": "PRD-PS-002",
    "name": "Cevizli Rulo Pestil",
    "category": "Pestil Köme Çeşitleri",
    "stock": 99,
    "criticalLimit": 10,
    "price": 220,
    "oldPrice": 250,
    "cost": 110,
    "image": "/ispir-vakum-cevizli-pestil-beyaz.png",
    "images": "[\"/ispir-vakum-cevizli-pestil-beyaz.png\",\"/uploads/ispir-el-sarimi-pestil-cesitleri.webp\"]",
    "desc": "İspir yöresinin yerli cevizleriyle harmanlanan, ipeksi kıvamda serilen geleneksel dut pestilinin rulo haline getirilmiş en asil şekli.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "İspir yöresinin yerli cevizleriyle harmanlanan, ipeksi kıvamda serilen geleneksel dut pestilinin rulo haline getirilmiş en asil şekli.",
      "details": "Güneşte kurutulmuş ipeksi sade dut pestilinin içerisine yerli İspir cevizlerinin özenle dövülerek serpilmesi ve rulo şeklinde sarılmasıyla elde edilir.\n\nCevizin doğal sağlıklı yağ ve protein yapısı, dutun karamelize enerjisiyle birleşerek dengeli ve besleyici bir gurme atıştırmalık oluşturur.",
      "harvestStory": "Güneşte kurutulmuş ipeksi sade dut pestilinin içerisine yerli İspir cevizlerinin özenle dövülerek serpilmesi ve rulo şeklinde sarılmasıyla elde edilir.\n\nCevizin doğal sağlıklı yağ ve protein yapısı, dutun karamelize enerjisiyle birleşerek dengeli ve besleyici bir gurme atıştırmalık oluşturur.",
      "ingredients": "İspir Beyaz Dut Şırası, Tam Buğday Unu, Yerli İspir Cevizi (%35)",
      "ritual": "İnce dilimler halinde kesilerek, yanında olgunlaştırılmış sert keçi peyniri ve taze demlenmiş çay ile servis edilmesi tavsiye olunur.",
      "altitude": "1900 Metre",
      "harvestSeason": "Temmuz - Eylül",
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "410 kcal",
        "carb": "72.4 g",
        "protein": "5.8 g",
        "calcium": "140 mg",
        "iron": "4.8 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "Ceviz Oranı",
          "value": "%35 (Yerli İspir Cevizi)"
        },
        {
          "key": "Katkı Maddesi",
          "value": "Sıfır (%100 Doğal)"
        }
      ],
      "sizes": [
        "500 Gr",
        "1 Kg"
      ],
      "colors": [
        "Sade"
      ]
    }
  },
  {
    "id": "cms7y76vq0005uetc6rj8y6a0",
    "sku": "PKF-636433",
    "name": "PEKEFE İspir Dut Kömesi (Cevizli)",
    "category": "Pestil Köme Çeşitleri",
    "stock": 99,
    "criticalLimit": 10,
    "price": 450,
    "oldPrice": 650,
    "cost": 420,
    "image": "/ispir-kome-gercek-hasat.jpg",
    "images": [
      "/ispir-kome-gercek-hasat.jpg",
      "/uploads/ispir-muska-kome-saray-tatlilari.webp"
    ],
    "desc": "İpe dizilen taze İspir cevizlerinin, bakır kazanlarda kaynayan dut herlesine defalarca batırılarak güneşte kurutulmasıyla elde edilen coğrafi işaretli lezzet.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "İpe dizilen taze İspir cevizlerinin, bakır kazanlarda kaynayan dut herlesine defalarca batırılarak güneşte kurutulmasıyla elde edilen coğrafi işaretli lezzet.",
      "details": "Pamuk iplerine dizilen kelebek İspir cevizleri, meşe odunu ateşinde kaynayan yoğun dut herlesine (şıra ve un karışımı) birkaç kat halinde daldırılır.\n\nİspir dağ rüzgarında askılarda kurutulan kömelerimiz, dışı yumuşacık ve esnek, içi bol cevizli asırlık bir gelenek sunar.",
      "harvestStory": "Pamuk iplerine dizilen kelebek İspir cevizleri, meşe odunu ateşinde kaynayan yoğun dut herlesine (şıra ve un karışımı) birkaç kat halinde daldırılır.\n\nİspir dağ rüzgarında askılarda kurutulan kömelerimiz, dışı yumuşacık ve esnek, içi bol cevizli asırlık bir gelenek sunar.",
      "ingredients": "İspir Beyaz Dut Şırası, Tam Buğday Unu, Yerli İspir Cevizi (%40)",
      "ritual": "Oda sıcaklığında dilimlenerek ikram edilir. Çay ve Türk kahvesinin yanında besleyici geleneksel ikramlıktır.",
      "altitude": "2000 Metre",
      "harvestSeason": "Ağustos - Eylül",
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "430 kcal",
        "carb": "68.0 g",
        "protein": "6.5 g",
        "calcium": "150 mg",
        "iron": "5.2 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "Ceviz Oranı",
          "value": "%40 (Yerli Kelebek Ceviz)"
        },
        {
          "key": "Ambalaj",
          "value": "Pamuk Torba / Vakum Kutu"
        }
      ],
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "500 Gr",
        "1 Kg",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "Paket"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı",
        "Kadayıflı",
        "Hindistan Cevizli"
      ],
      "barcode": "8691463708460",
      "unit": "Kg",
      "manufacturerCode": "PKF-PES-2543",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": true,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 600,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 600,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "recipeDetails": "",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": ""
    }
  },
  {
    "id": "cms7y76vq0005uetc6rj8y6a1",
    "sku": "PKF-156882",
    "name": "PEKEFE İspir Tek Çekim Dut Kömesi (Cevizli)",
    "category": "Pestil Köme Çeşitleri",
    "stock": 92,
    "criticalLimit": 10,
    "price": 470,
    "oldPrice": 700,
    "cost": 440,
    "image": "/ispir-kome-beyaz.png",
    "images": [
      "/ispir-kome-beyaz.png"
    ],
    "desc": "İpe dizili cevizlere tek kat daldırma yapılarak ceviz yoğunluğu en üst seviyede tutulmuş, az herle kaplı butik seri köme.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "İpe dizili cevizlere tek kat daldırma yapılarak ceviz yoğunluğu en üst seviyede tutulmuş, az herle kaplı butik seri köme.",
      "details": "Ceviz lezzetini öne çıkarmak için ipe dizilen kelebek cevizler dut herlesine tek daldırma ile kaplanır. Ceviz oranı maksimumda tutulan hafif ve gevreğimsi gurme serimizdir.",
      "harvestStory": "Ceviz lezzetini öne çıkarmak için ipe dizilen kelebek cevizler dut herlesine tek daldırma ile kaplanır. Ceviz oranı maksimumda tutulan hafif ve gevreğimsi gurme serimizdir.",
      "ingredients": "Yerli İspir Cevizi (%55), İspir Beyaz Dut Şırası, Tam Buğday Unu",
      "ritual": "Tek lokmalık dilimler halinde servis edilir.",
      "altitude": "2000 Metre",
      "harvestSeason": "Ağustos - Eylül",
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "460 kcal",
        "carb": "58.0 g",
        "protein": "8.2 g",
        "calcium": "160 mg",
        "iron": "5.8 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "Ceviz Oranı",
          "value": "%55 (Ekstra Yoğun Ceviz)"
        }
      ],
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "500 Gr",
        "1 Kg",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "Paket"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı",
        "Kadayıflı",
        "Hindistan Cevizli"
      ],
      "barcode": "8693235740067",
      "unit": "Kg",
      "manufacturerCode": "PKF-PES-2443",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": true,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 650,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 650,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "recipeDetails": "",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": ""
    }
  },
  {
    "id": "cms7y76vq0005uetc6rj8y6a2",
    "sku": "PKF-421384",
    "name": "PEKEFE Dut Pestil Muska Tatlısı 450 Gr",
    "category": "Pestil Köme Çeşitleri",
    "stock": 100,
    "criticalLimit": 10,
    "price": 320,
    "oldPrice": 400,
    "cost": 240,
    "image": "/uploads/1785882201177-v93f9bbpg.webp",
    "images": [
      "/uploads/1785882201177-v93f9bbpg.webp",
      "/uploads/1785882215093-a1sp3fqs7.webp",
      "/uploads/1785882222824-8hgs8s5cu.webp",
      "/uploads/1785882247696-7r3y138q4.webp",
      "/uploads/1785882259010-8i3jvumz1.webp",
      "/uploads/ispir-muska-kome-saray-tatlilari.webp"
    ],
    "desc": "İncecik kesilen sade dut pestilinin içerisine yerli fındık, bal ve pekmez karışımı muska şeklinde sarılarak elde edilen saray lezzeti.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "İncecik kesilen sade dut pestilinin içerisine yerli Fındık, bal karışımı muska şeklinde sarılarak elde edilen saray lezzeti.",
      "details": "Keten sergilerde kurutulmuş ipeksi şerit pestillerin içerisine dövülmüş İspir cevizi ve saf bal dolgusu konarak muska biçiminde tek tek el emeğiyle katlanır.",
      "harvestStory": "Keten sergilerde kurutulmuş ipeksi şerit pestillerin içerisine dövülmüş yerli fındık ve saf bal dolgusu konarak muska biçiminde tek tek el emeğiyle katlanır.",
      "ingredients": "İspir Beyaz Dut Pestili, Fındık İçi, Saf Bal",
      "ritual": "Kahve yanında zarif bir saray ikramlığı olarak sunulabilir.",
      "altitude": "2000 Metre",
      "harvestSeason": "Temmuz - Ağustos",
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "400 kcal",
        "carb": "76.0 g",
        "protein": "4.8 g",
        "calcium": "130 mg",
        "iron": "4.2 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "Dolgu",
          "value": "İspir Cevizi & Saf Bal"
        }
      ],
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "500 Gr",
        "1 Kg",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "Paket"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı"
      ],
      "barcode": "8695108182976",
      "unit": "Paket",
      "manufacturerCode": "PKF-PES-9684",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": false,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 350,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 350,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "recipeDetails": "",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": ""
    }
  },
  {
    "id": "cms7y76vq0005uetc6rj8y6a3",
    "sku": "PKF-962338",
    "name": "PEKEFE Dut Pestil Sarma Tatlısı 450 Gr",
    "category": "Pestil Köme Çeşitleri",
    "stock": 92,
    "criticalLimit": 10,
    "price": 270,
    "oldPrice": 400,
    "cost": 240,
    "image": "/uploads/1785881067849-c7goa2ycq.webp",
    "images": [
      "/uploads/1785881067849-c7goa2ycq.webp",
      "/uploads/1785881082446-gdhsawepb.webp",
      "/uploads/1785881093364-6rxpc3i3z.webp",
      "/uploads/1785881102424-dz7ufrtf5.webp",
      "/uploads/1785881110653-vs0nehrn3.webp",
      "/uploads/ispir-el-sarimi-pestil-cesitleri.webp"
    ],
    "desc": "Dut pestilinin içerisine bol miktarda dövülmüş fındık sarılarak hazırlanan lokum kıvamında gurme lezzet dilimleri.",
    "isRawMaterial": false,
    "attributes": {
      "shortDesc": "Dut pestilinin içerisine bol miktarda dövülmüş fındık sarılarak hazırlanan lokum kıvamında gurme lezzet dilimleri.",
      "details": "Geleneksel dut pestili yapraklarına bol dövülmüş ceviz içi sarılarak ince rulo dilimler elde edilir. Şekersiz doğal meyve tatlısıdır.",
      "harvestStory": "Geleneksel dut pestili yapraklarına bol dövülmüş fındık içi balla harmanlanıp sarılarak ince rulo dilimler elde edilir. Şekersiz doğal meyve tatlısıdır.",
      "ingredients": "İspir Beyaz Dut Pestili, Yerli Fındık İçi (%40)",
      "ritual": "Çay ve kahve saatlerinde sağlıklı tatlı alternatifi olarak tüketilir.",
      "altitude": "2000 Metre",
      "harvestSeason": "Temmuz - Ağustos",
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "nutrients": {
        "energy": "415 kcal",
        "carb": "74.0 g",
        "protein": "5.2 g",
        "calcium": "135 mg",
        "iron": "4.5 mg"
      },
      "specifications": [
        {
          "key": "Menşei",
          "value": "Erzurum / İspir"
        },
        {
          "key": "İçerik",
          "value": "İspir Cevizi Sarma"
        }
      ],
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "500 Gr",
        "1 Kg",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "Paket"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı",
        "Kadayıflı",
        "Hindistan Cevizli"
      ],
      "barcode": "8699423577203",
      "unit": "Paket",
      "manufacturerCode": "PKF-PES-9722",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": true,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 350,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 350,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "recipeDetails": "",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": ""
    }
  },
  {
    "id": "cmsf6wr3w0000uegwn0zge19p",
    "sku": "PKF-803898",
    "name": "PEKEFE Cevizli Dut Pestili",
    "category": "Pestil Köme Çeşitleri",
    "stock": 500,
    "criticalLimit": 10,
    "price": 380,
    "oldPrice": 550,
    "cost": 350,
    "image": "/uploads/1785884108715-kh0virvsq.webp",
    "images": [
      "/uploads/1785884108715-kh0virvsq.webp"
    ],
    "desc": "PEKEFE Geleneksel İspir Cevizli Dut Pestili İspir'in Geleneksel Lezzeti, Anadolu'nun En Değerli Ceviziyle Buluşuyor PEKEFE Geleneksel İspir Cevizli Dut Pestili , Erzurum'un İspir ilçesinin yüksek oksijenli mikroklima vadilerinde yetişen asırlık beyaz dut ağaçlarından elde edilen doğal dut şırasının, özenle seçilmiş kaliteli ceviz içiyle buluştuğu geleneksel bir lezzettir. Hasat döneminde el emeğiyle toplanan beyaz dutlar, yüzyıllardır sürdürülen İspir üretim kültürüne uygun yöntemlerle işlenir. Dutun doğal aroması ile cevizin zengin lezzeti, her lokmada Anadolu'nun köklü mutfak mirasını hissettirir. Geleneksel Üretim, Gerçek İspir Lezzeti Toplanan beyaz dutlardan elde edilen doğal dut şırası, bakır kazanlarda (herle) meşe odunu ateşinde kontrollü olarak pişirilir. Geleneksel tarif doğrultusunda az miktarda tam buğday unu ile kıvam kazandırılan şıra, saf keten bezler üzerine ince katmanlar hâlinde serilir. Doğal kuruma sürecinin ardından pestiller özenle hazırlanır ve içerisine seçkin ceviz içleri yerleştirilerek geleneksel yöntemlerle sarılır. Böylece hem yumuşak dokusu hem de cevizin kendine özgü aromasıyla zenginleşen eşsiz bir lezzet ortaya çıkar. İspir'in Güneşi ve Dağ Rüzgârlarıyla Doğal Kurutma PEKEFE Geleneksel İspir Cevizli Dut Pestili, İspir'in bol güneş ışığı ve nemsiz dağ rüzgârları sayesinde doğal olarak kurutulur. Bu geleneksel kurutma yöntemi, pestilin ince ve esnek yapısını korurken dutun doğal karamelize aromasının ve cevizin zengin lezzetinin uyum içinde gelişmesini sağlar. Her lokmada İspir'in doğasını ve geleneksel üretim ustalığını hissedersiniz. Katkısız ve Doğal İçerik PEKEFE'nin doğallık anlayışı üretimin her aşamasında korunur. Ürünümüzde; Glikoz şurubu kullanılmaz. Kimyasal koruyucu bulunmaz. Yapay renklendirici içermez. Yapay aroma içermez. Geleneksel tarif doğrultusunda hazırlanır. Doğal dut şırası ve özenle seçilmiş kaliteli ceviz, ürünümüzün temel bileşenlerini oluşturur. Dutun Zarafeti, Cevizin Zengin Aroması PEKEFE Geleneksel İspir Cevizli Dut Pestili; İncecik ve yumuşak dokusu, Dutun doğal karamelize aroması, Seçkin ceviz içinin yoğun lezzeti, Dengeli ve doyurucu yapısı ile geleneksel pestil kültürünü modern sofralara taşır. Tatlı ve cevizin doğal uyumu, her lokmada unutulmaz bir lezzet deneyimi sunar. Günün Her Anında Keyifle Tüketebilirsiniz PEKEFE Geleneksel İspir Cevizli Dut Pestili; Kahvaltılarda, Çay ve kahve yanında, Ara öğünlerde, Misafir ikramlarında, Günlük atıştırmalık olarak, Geleneksel lezzetleri sevenler için özel sunumlarda keyifle tüketilebilir. Doğal içeriği ve doyurucu yapısıyla günün her anına eşlik eden özel bir lezzettir. Neden PEKEFE? Çünkü PEKEFE yalnızca pestil üretmez. İspir'in asırlık dut ağaçlarını, geleneksel bakır kazanlarını, ustalarımızın emeğini ve Anadolu'nun en kıymetli lezzetlerinden biri olan cevizi aynı üründe buluşturur. Her ürünümüzde; ✓ İspir'in seçkin beyaz dutları, ✓ Özenle seçilmiş kaliteli ceviz içi, ✓ Geleneksel bakır kazan üretimi, ✓ Meşe odunu ateşinde pişirme yöntemi, ✓ Keten bezlerde doğal kurutma, ✓ Katkısız içerik anlayışı, ✓ Modern hijyen ve kalite standartları aynı titizlikle bir araya gelir. PEKEFE – Gelenekten Gelen Lezzetin En Zarif Hâli Asırlık beyaz dut ağaçlarından başlayan üretim yolculuğu, bakır kazanlarda ustalıkla hazırlanan doğal dut şırası, İspir'in güneşiyle kurutulan ince pestiller ve özenle seçilmiş ceviz içiyle tamamlanır. PEKEFE Geleneksel İspir Cevizli Dut Pestili , yalnızca geleneksel bir tatlı değil; İspir'in doğasını, ustalığını ve Anadolu'nun köklü lezzet mirasını sofralarınıza taşıyan seçkin bir lezzettir. PEKEFE İspir'in Doğallığı, Gelenekten Gelen Lezzet.",
    "isRawMaterial": false,
    "attributes": {
      "sizes": [
        "400g Cam Kavanoz",
        "800g Cam Kavanoz",
        "1 kg Vakum",
        "5 kg Teneke",
        "500 Gr",
        "1 Kg",
        "850g Cam Kavanoz",
        "450g Cam Kavanoz",
        "Paket"
      ],
      "colors": [
        "Sade",
        "Cevizli",
        "Fındıklı",
        "Antep Fıstıklı",
        "Kadayıflı",
        "Hindistan Cevizli"
      ],
      "barcode": "8686030765898",
      "unit": "Adet",
      "manufacturerCode": "PKF-CDP-01",
      "stockType": "Ticari Mal",
      "warehouse": "Merkez Depo",
      "origin": "İspir / Erzurum",
      "ingredients": "Doğal Dut Şırası, Erzurum Cevizi, Doğal Nişasta",
      "storageConditions": "Serin ve kuru yerde, doğrudan güneş ışığından uzakta muhafaza ediniz.",
      "pairing": "Pekefe Çamı Balı ve Erzurum Kıtlama Çayı eşliğinde sunulması tavsiye edilir.",
      "purchaseCurrency": "TRY",
      "purchaseVat": "1",
      "purchaseVatIncluded": false,
      "saleCurrency": "TRY",
      "saleVat": "1",
      "saleVatIncluded": true,
      "retailPrice": 500,
      "retailCurrency": "TRY",
      "retailVat": "1",
      "retailVatIncluded": true,
      "webPrice": 500,
      "webCurrency": "TRY",
      "webVat": "1",
      "webVatIncluded": true,
      "marketCurrency": "TRY",
      "marketVat": "1",
      "marketVatIncluded": true,
      "b2bActive": true,
      "b2bPreOrderable": false,
      "marketplaces": [
        {
          "id": "1",
          "name": "Trendyol API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "ty-api-90234892",
          "apiSecret": "••••••••",
          "logoColor": "bg-orange-500"
        },
        {
          "id": "2",
          "name": "Hepsiburada API",
          "syncEnabled": true,
          "apiConnected": true,
          "apiKey": "hb-api-11029384",
          "apiSecret": "••••••••",
          "logoColor": "bg-red-600"
        },
        {
          "id": "3",
          "name": "Amazon Turkey API",
          "syncEnabled": false,
          "apiConnected": false,
          "logoColor": "bg-slate-500"
        }
      ],
      "shortDesc": "",
      "recipeDetails": "",
      "altitude": "2200 Metre",
      "harvestSeason": "Temmuz - Ağustos",
      "harvestStory": "",
      "ritual": "",
      "nutrients": {
        "energy": "293 kcal",
        "carb": "70.2 g",
        "protein": "0.8 g",
        "calcium": "400 mg",
        "iron": "10.2 mg"
      },
      "hmfLevel": "< 10 mg/kg (Analiz Raporlu)",
      "unitCoefficients": [],
      "branchPrices": {},
      "specsMaterial": "",
      "specsWeight": "",
      "specsDimensions": "",
      "specsBellows": "",
      "usageGuide": "",
      "warrantyInfo": "",
      "warrantyBadgeLabel": "",
      "warrantyYears": "",
      "warrantyBadgeDesc": "",
      "quickOverview1_title": "",
      "quickOverview1_desc": "",
      "quickOverview2_title": "",
      "quickOverview2_desc": "",
      "quickOverview3_title": "",
      "quickOverview3_desc": "",
      "quickOverview1": "",
      "quickOverview2": "",
      "quickOverview3": "",
      "longDescExtra": "",
      "badgeText1": "",
      "badgeText2": "",
      "warehousePrices": {},
      "brand": "",
      "model": ""
    }
  }
];

export async function GET() {
  try {
    console.log("[API SEED] Seeding exact 23 local products from dev.db...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Branches
    const defaultBranch = await prisma.branch.upsert({
      where: { code: 'BR-MRKZ' },
      update: { name: 'İspir Merkez Tesis', address: 'İspir, Erzurum', phone: '0544 149 4851' },
      create: {
        id: 'default-branch',
        name: 'İspir Merkez Tesis',
        code: 'BR-MRKZ',
        address: 'İspir, Erzurum',
        phone: '0544 149 4851'
      }
    });

    const subeBranch = await prisma.branch.upsert({
      where: { code: 'BR-IST' },
      update: { name: 'İstanbul Dağıtım Şubesi', address: 'Ataşehir, İstanbul', phone: '0216 111 22 33' },
      create: {
        id: 'sube-branch',
        name: 'İstanbul Dağıtım Şubesi',
        code: 'BR-IST',
        address: 'Ataşehir, İstanbul',
        phone: '0216 111 22 33'
      }
    });

    // 2. Warehouses
    await prisma.warehouse.upsert({
      where: { code: 'WH-MRKZ' },
      update: { name: 'İspir Üretim & Merkez Depo', type: 'Merkez', address: 'Erzurum OSB, 3. Cadde', branchId: defaultBranch.id },
      create: {
        id: '1',
        name: 'İspir Üretim & Merkez Depo',
        code: 'WH-MRKZ',
        type: 'Merkez',
        address: 'Erzurum OSB, 3. Cadde',
        branchId: defaultBranch.id
      }
    });

    // 3. User Accounts
    const admin = await prisma.user.upsert({
      where: { email: "admin@nexab2b.com" },
      update: { password: hashedPassword, role: "SUPER_ADMIN", isApproved: true },
      create: {
        email: "admin@nexab2b.com",
        name: "Pekefe Super Admin",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        isApproved: true,
      },
    });

    await prisma.user.upsert({
      where: { email: "manager@nexab2b.com" },
      update: { password: hashedPassword, role: "ADMIN", isApproved: true },
      create: {
        email: "manager@nexab2b.com",
        name: "Pekefe Yonetici",
        password: hashedPassword,
        role: "ADMIN",
        isApproved: true,
      },
    });

    // 4. Products
    let totalSeeded = 0;
    for (const p of masterProducts) {
      const prod = await prisma.product.upsert({
        where: { sku: p.sku },
        update: {
          name: p.name,
          category: p.category,
          stock: p.stock,
          criticalLimit: p.criticalLimit,
          price: p.price,
          oldPrice: p.oldPrice,
          cost: p.cost,
          image: p.image,
          images: p.images,
          desc: p.desc,
          isRawMaterial: p.isRawMaterial,
          attributes: p.attributes
        },
        create: {
          sku: p.sku,
          name: p.name,
          category: p.category,
          stock: p.stock,
          criticalLimit: p.criticalLimit,
          price: p.price,
          oldPrice: p.oldPrice,
          cost: p.cost,
          image: p.image,
          images: p.images,
          desc: p.desc,
          isRawMaterial: p.isRawMaterial,
          attributes: p.attributes
        }
      });

      await prisma.stockLocation.upsert({
        where: { id: `loc-merkez-${prod.id}` },
        update: { stock: Math.round(p.stock * 0.8), minStock: p.criticalLimit },
        create: {
          id: `loc-merkez-${prod.id}`,
          productId: prod.id,
          warehouseId: '1',
          stock: Math.round(p.stock * 0.8),
          reserved: Math.round(p.stock * 0.1),
          minStock: p.criticalLimit,
          criticalLimit: Math.round(p.criticalLimit * 1.5),
          rack: 'A-1'
        }
      }).catch(() => {});

      totalSeeded++;
    }

    return NextResponse.json({
      success: true,
      message: `Yerel dev.db veritabanındaki ${totalSeeded} adet ürünün tamamı canlı MySQL veritabanına aktarıldı!`,
      adminEmail: admin.email,
      defaultPassword: "password123",
    });
  } catch (error: any) {
    console.error("[API SEED ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Seed işlemi sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
