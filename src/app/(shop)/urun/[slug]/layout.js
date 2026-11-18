import { readLocalProducts } from "@/lib/jsonProductDb";

function generateSlug(text) {
  if (!text) return "";
  const trMap = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
    ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return text
    .toString()
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => trMap[match])
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams?.slug || "");
  const products = readLocalProducts();

  const product = products.find(
    (p) =>
      generateSlug(p.name || "") === slug ||
      String(p.id).toLowerCase() === slug.toLowerCase() ||
      String(p.sku).toLowerCase() === slug.toLowerCase()
  );

  if (!product) {
    return {
      title: "Geleneksel İspir Yöresel Ürünleri",
      description:
        "PEKEFE geleneksel İspir dut pekmezi, yaprak dut pestili, cevizli İspir kömesi ve doğal dut sirkesi koleksiyonu.",
      alternates: {
        canonical: `https://www.pekefe.com/urun/${slug}`,
      },
    };
  }

  const cleanSlug = generateSlug(product.name || "") || slug;
  const title = product.seoTitle || `${product.name} — Doğal İspir Yöresel Lezzeti`;
  const description =
    product.seoDesc ||
    product.shortDesc ||
    product.desc ||
    `${product.name}; İspir yaylalarından geleneksel yöntemlerle, katkı maddesi ve ilave şeker kullanılmadan üretilmiştir.`;
  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `https://www.pekefe.com${product.image}`
    : "https://www.pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg";

  return {
    title,
    description,
    keywords: product.seoKeywords
      ? product.seoKeywords.split(",").map((k) => k.trim())
      : [product.name, product.category, "İspir Yöresel Ürünler", "PEKEFE"],
    alternates: {
      canonical: `https://www.pekefe.com/urun/${cleanSlug}`,
    },
    openGraph: {
      title: `${title} | PEKEFE`,
      description,
      url: `https://www.pekefe.com/urun/${cleanSlug}`,
      siteName: "PEKEFE İspir Yöresel Ürünler",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PEKEFE`,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductDetailLayout({ children }) {
  return children;
}
