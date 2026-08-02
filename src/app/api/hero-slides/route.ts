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
    id: "slide-1",
    tag: "Erzurum İspir'in Geleneksel El Emeği Mirası",
    title: "Zamanın Yavaş Akışında,",
    highlightTitle: "Doğanın Saf İmzası.",
    subtitle: "2000 metre rakımlı İspir yaylalarından şafak vakti toplanan saf beyaz dutlar; meşe odun ateşinde ve bakır kazanlarda kaynatılarak asırlık lezzetine kavuşur.",
    image: "/ispir-manzara-hero.png",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Seçkin Mahsulleri Keşfet", href: "/kategoriler" },
    secondaryCta: { text: "Hikayemizi İncele", href: "/hikayemiz" }
  },
  {
    id: "slide-2",
    tag: "Odun Ateşi & Geleneksel Bakır Kazanlar",
    title: "Kuşaktan Kuşağa Aktarılan",
    highlightTitle: "Asırlık Usuller.",
    subtitle: "Hiçbir katkı maddesi, ilave şeker veya koruyucu kimyasal içermeyen %100 saf ve yoğun gövdeli geleneksel Pekefe lezzet şöleni.",
    image: "/geleneksel-kazan.png",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Geleneksel Pekmezler", href: "/kategoriler" },
    secondaryCta: { text: "Üretim Tesisimiz", href: "/tesisimiz" }
  },
  {
    id: "slide-3",
    tag: "Güneşte Keten Bezlerde Doğal Kurutma",
    title: "İpeksi Dokusuyla Güneşte",
    highlightTitle: "Olgunlaşan Pestil.",
    subtitle: "Keten sergilere milimetrik hassasiyetle dökülen dut herlesi, İspir'in nemsiz dağ rüzgârları ve bol güneşi altında eşsiz aromasına kavuşur.",
    image: "/ispir-pestil-kurutma-gercek.png",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Sade Dut Pestili İncele", href: "/urun/pekefe-sade-dut-pestili" },
    secondaryCta: { text: "Tüm Pestil Çeşitleri", href: "/kategoriler" }
  },
  {
    id: "slide-4",
    tag: "Yerli İspir Cevizi ile Harmanlanmış",
    title: "Asil Tatların Zarafet Dolu",
    highlightTitle: "Zengin Uyumu.",
    subtitle: "İpe dizilmiş yerli cevizlerin kaynayan saf şıra herlesine daldırılmasıyla üretilen coğrafi tescilli saray lezzeti İspir Cevizli Dut Kömesi.",
    image: "/ispir-kome-gercek-hasat.jpg",
    active: true,
    objectPositionX: 50,
    objectPositionY: 50,
    imageScale: 1.0,
    primaryCta: { text: "Köme & Tatlı Koleksiyonu", href: "/kategoriler" },
    secondaryCta: { text: "Rekolte Kulübü", href: "/rekolte-kulubu" }
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
