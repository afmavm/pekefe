import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const dataFilePath = path.join(process.cwd(), "src", "data", "hero_slides.json");

const DEFAULT_INITIAL_SLIDES = [
  {
    id: "slide-user-1",
    tag: "Kuşaktan Kuşağa İspir Dut Bahçeleri Hasadı",
    title: "Bereketli Topraklarda,",
    highlightTitle: "Baba Ve Oğulun Mirası.",
    subtitle: "İspir’in güneşle dolup taşan kadim dut bahçelerinde, usta ellerin özenli seçimiyle dalından sepetlere toplanan %100 saf ve doğal mahsullerin lezzet dolu ilk adım bereketi.",
    image: "/uploads/ispir-dut-bahcesi-hasat.webp",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Hasat Hikayemizi İncele", href: "/hikayemiz" },
    secondaryCta: { text: "Tüm Koleksiyon", href: "/kategoriler" }
  },
  {
    id: "slide-user-2",
    tag: "2000m Rakımda Saf Beyaz Dut Seçimi",
    title: "Dalından Dalına Özenle,",
    highlightTitle: "Saf Dutun En Doğal Hali.",
    subtitle: "İspir yaylalarının nemsiz temiz dağ havasında olgunlaşan bal kıvamındaki saf beyaz dutlar, ezilmeden ve zedelenmeden el örgüsü sepetlere tek tek toplanır.",
    image: "/uploads/ispir-saf-beyaz-dut-toplama.webp",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Sade Dut Pestili İncele", href: "/urun/pekefe-sade-dut-pestili" },
    secondaryCta: { text: "Doğal Üretim Süreci", href: "/tesisimiz" }
  },
  {
    id: "slide-user-3",
    tag: "Geleneksel Meşe Odunu Ateşi & Bakır Kazanlar",
    title: "Odun Ateşi ve Cendere Usulü,",
    highlightTitle: "Asırlık Lezzet Ritüeli.",
    subtitle: "Ahşap pres cenderelerde sıkılan saf şıra, taş ocaklarda yanan meşe odunu ateşinde kaynayan dev bakır kazanlarda ağır ağır pişerek eşsiz aromasına kavuşur.",
    image: "/uploads/ispir-bakir-kazan-ahsap-cendere.webp",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Geleneksel Pekmezler", href: "/kategoriler" },
    secondaryCta: { text: "Üretim Tesisimiz", href: "/tesisimiz" }
  },
  {
    id: "slide-user-4",
    tag: "Katkısız %100 Karadut & Ekşi Sirke Şırası",
    title: "Ağır Ağır Demlenen,",
    highlightTitle: "Yoğun Gövdeli Şifa.",
    subtitle: "İspir dağlarının taze karadutları ve bakır bakraçlarda demlenen aromatik şıralar, hiçbir katkı maddesi olmadan geleneksel kıvamına kavuşur.",
    image: "/uploads/ispir-karadut-kaynatma-bakir-kazan.webp",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Karadut Koleksiyonu", href: "/kategoriler" },
    secondaryCta: { text: "Rekolte Kulübü", href: "/rekolte-kulubu" }
  },
  {
    id: "slide-user-5",
    tag: "Güneşte Keten Bezlerde Doğal Olgunlaşma",
    title: "Keten Sergilerde İpeksi Doku,",
    highlightTitle: "Güneşle Olgunlaşan Pestil.",
    subtitle: "Sıcak herlenin keten bezlere milimetrik incelikte serilmesi ve İspir’in nemsiz dağ rüzgârlarında kurumaya bırakılmasıyla elde edilen coğrafi tescilli saray lezzeti.",
    image: "/uploads/ispir-keten-bezde-pestil-serimi.webp",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Sade Dut Pestili İncele", href: "/urun/pekefe-sade-dut-pestili" },
    secondaryCta: { text: "Geleneksel Üretim", href: "/tesisimiz" }
  },
  {
    id: "slide-user-6",
    tag: "6 Adımda Asırlık Zanaatkarlık Rehberi",
    title: "Duttan Sergiye Usta Dokunuşlar,",
    highlightTitle: "Adım Adım Lezzet Yolculuğu.",
    subtitle: "Hasat ➔ Cendere Pres ➔ Bakır Kazan ➔ Keten Döküm ➔ Ahşap Serim ➔ Ceviz Serpimi: Geleneksel İspir usulü katkısız saray pestili üretim serüveni.",
    image: "/uploads/ispir-pestil-uretim-yolculugu-6-adim.webp",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Üretim Tesisimiz", href: "/tesisimiz" },
    secondaryCta: { text: "Hasat Hikayemiz", href: "/hikayemiz" }
  },
  {
    id: "slide-user-7",
    tag: "Yüksek Standartlı Steril Tesis & Kalite Kontrol",
    title: "Zanaatkar Ruh,",
    highlightTitle: "Steril Standartlar.",
    subtitle: "Asırlık geleneksel tarifler; paslanmaz krom tanklar, hassas sıcaklık sensörleri ve el değmeden steril cam kavanozlama sistemiyle güvenle sofralarınıza ulaşır.",
    image: "/uploads/ispir-modern-hijyenik-tesis-dolum.webp",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Üretim Tesisimiz", href: "/tesisimiz" },
    secondaryCta: { text: "Sertifikalarımız", href: "/sertifikalar" }
  }
];

export async function GET() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf-8");
      const slides = JSON.parse(content);
      if (Array.isArray(slides) && slides.length > 0) {
        return NextResponse.json(slides);
      }
    }
  } catch (error) {
    console.error("GET hero-slides error:", error);
  }

  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(DEFAULT_INITIAL_SLIDES, null, 2), "utf-8");
  } catch (e) {}

  return NextResponse.json(DEFAULT_INITIAL_SLIDES);
}

export async function POST(request: NextRequest) {
  try {
    const slides = await request.json();
    if (Array.isArray(slides)) {
      const dir = path.dirname(dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dataFilePath, JSON.stringify(slides, null, 2), "utf-8");
      return NextResponse.json({ success: true, slides });
    }
    return NextResponse.json({ error: "Geçersiz slayt verisi" }, { status: 400 });
  } catch (error: any) {
    console.error("POST hero-slides error:", error);
    return NextResponse.json({ error: "Slaytlar kaydedilemedi" }, { status: 500 });
  }
}
