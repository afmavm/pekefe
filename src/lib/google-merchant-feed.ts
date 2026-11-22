import { prisma, withTimeout } from "@/lib/prisma";
import {
  getAllCategoriesServer,
  getPublishedProductsServer,
} from "@/lib/category-server";
import {
  resolveProductCategories,
  slugifyTr,
  trNormalize,
} from "@/lib/category-utils";

const BASE_URL = "https://www.pekefe.com";

function escapeXml(str: string = ""): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(str: string = ""): string {
  return String(str)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toAbsoluteUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return `${BASE_URL}/pekefe-dut-pekmezi-kavanoz-tr.jpg`;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `${BASE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

function mapGoogleProductCategory(product: any, mainSlug?: string | null): string {
  const nameNorm = trNormalize(`${product?.name || ""} ${product?.category || ""}`);
  if (mainSlug === "pekmez-cesitleri" || nameNorm.includes("pekmez")) {
    // Food, Beverages & Tobacco > Food Items > Condiments & Sauces > Syrups
    return "422";
  }
  if (mainSlug === "hediyelik-lezzetler" || nameNorm.includes("hediye") || nameNorm.includes("kutu")) {
    // Food, Beverages & Tobacco > Food Items > Food Gift Baskets
    return "5749";
  }
  if (nameNorm.includes("sirke")) {
    // Food, Beverages & Tobacco > Food Items > Cooking & Baking Ingredients > Vinegar
    return "422";
  }
  // Pestil, Köme, Kuru Dut -> Dried Fruits & Traditional Snacks
  return "430";
}

function isValidGtin(barcode: unknown): string | null {
  if (!barcode) return null;
  const digits = String(barcode).replace(/\D/g, "");
  if ([8, 12, 13, 14].includes(digits.length)) return digits;
  return null;
}

async function getShippingConfig(): Promise<{ threshold: number; fee: number }> {
  try {
    const rows: any = await withTimeout(
      prisma.$queryRawUnsafe(
        `SELECT shippingThreshold, shippingFee FROM CMSData WHERE id = 'singleton' LIMIT 1`
      ),
      1500,
      null
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return {
        threshold: Number(rows[0].shippingThreshold ?? 5000),
        fee: Number(rows[0].shippingFee ?? 150),
      };
    }
  } catch {}
  return { threshold: 5000, fee: 150 };
}

export interface MerchantFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImages: string[];
  availability: "in_stock" | "out_of_stock";
  price: string;
  salePrice: string | null;
  brand: string;
  condition: "new";
  mpn: string;
  gtin: string | null;
  identifierExists: "yes" | "no";
  googleProductCategory: string;
  productType: string;
  shippingPrice: string;
}

export async function buildGoogleMerchantItems(): Promise<MerchantFeedItem[]> {
  const [products, categories, shipping] = await Promise.all([
    getPublishedProductsServer(),
    getAllCategoriesServer({ activeOnly: true }),
    getShippingConfig(),
  ]);

  const items: MerchantFeedItem[] = [];

  for (const p of products) {
    const activePrice = Number(p.price || 0);
    if (activePrice <= 0) continue;

    const oldPrice = Number(p.oldPrice || p.list_price || 0);
    const hasSale = oldPrice > activePrice;
    const regularPrice = hasSale ? oldPrice : activePrice;
    const salePrice = hasSale ? activePrice : null;

    const resolvedCats = resolveProductCategories(p, categories);
    const productType = resolvedCats.main
      ? resolvedCats.sub
        ? `${resolvedCats.main.name} > ${resolvedCats.sub.name}`
        : resolvedCats.main.name
      : p.category || "Geleneksel Yöresel Ürünler";

    const slug = p.slug || slugifyTr(p.name) || p.id;
    const productUrl = `${BASE_URL}/urun/${slug}`;
    const mainImage = toAbsoluteUrl(p.image);
    const gallery: string[] = Array.isArray(p.images)
      ? p.images
          .filter((img: any) => typeof img === "string" && img.trim().length > 0)
          .map((img: string) => toAbsoluteUrl(img))
          .filter((img: string) => img !== mainImage)
          .slice(0, 10)
      : [];

    const rawDesc = stripHtml(p.desc || p.shortDesc || "");
    const cleanDesc =
      rawDesc.length >= 20
        ? rawDesc.slice(0, 4990)
        : `${p.name} - Erzurum İspir'in doğal ve katkısız geleneksel lezzeti. PEKEFE güvencesiyle taze paketlenerek kapınıza ulaştırılır.`;

    const barcode = p.barcode || p.attributes?.barcode || null;
    const validGtin = isValidGtin(barcode);
    const sku = String(p.sku || p.id).slice(0, 50);
    const stockQty = Number(p.stock ?? p.stock_quantity ?? 0);
    const shippingCost = activePrice >= shipping.threshold ? 0 : shipping.fee;

    items.push({
      id: sku,
      title: String(p.name || "").trim().slice(0, 150),
      description: cleanDesc,
      link: productUrl,
      imageLink: mainImage,
      additionalImages: gallery,
      availability: stockQty > 0 ? "in_stock" : "out_of_stock",
      price: `${regularPrice.toFixed(2)} TRY`,
      salePrice: salePrice ? `${salePrice.toFixed(2)} TRY` : null,
      brand: "PEKEFE",
      condition: "new",
      mpn: sku,
      gtin: validGtin,
      identifierExists: validGtin ? "yes" : "no",
      googleProductCategory: mapGoogleProductCategory(p, resolvedCats.main?.slug),
      productType,
      shippingPrice: `${shippingCost.toFixed(2)} TRY`,
    });
  }

  return items;
}

export async function generateGoogleMerchantXml(): Promise<string> {
  const items = await buildGoogleMerchantItems();

  const itemsXml = items
    .map((it) => {
      const extraImgs = it.additionalImages
        .map((url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
        .join("\n");

      return `    <item>
      <g:id>${escapeXml(it.id)}</g:id>
      <g:title>${escapeXml(it.title)}</g:title>
      <g:description>${escapeXml(it.description)}</g:description>
      <g:link>${escapeXml(it.link)}</g:link>
      <g:image_link>${escapeXml(it.imageLink)}</g:image_link>${extraImgs ? "\n" + extraImgs : ""}
      <g:availability>${it.availability}</g:availability>
      <g:price>${it.price}</g:price>${it.salePrice ? `\n      <g:sale_price>${it.salePrice}</g:sale_price>` : ""}
      <g:brand>${escapeXml(it.brand)}</g:brand>
      <g:condition>${it.condition}</g:condition>
      <g:mpn>${escapeXml(it.mpn)}</g:mpn>${
        it.gtin
          ? `\n      <g:gtin>${escapeXml(it.gtin)}</g:gtin>`
          : `\n      <g:identifier_exists>no</g:identifier_exists>`
      }
      <g:google_product_category>${escapeXml(it.googleProductCategory)}</g:google_product_category>
      <g:product_type>${escapeXml(it.productType)}</g:product_type>
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Standart Kargo</g:service>
        <g:price>${it.shippingPrice}</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>PEKEFE Geleneksel Ürünler — Google Merchant Center Feed</title>
    <link>${BASE_URL}</link>
    <description>Erzurum İspir'in doğal dut pestili, dut ve karadut pekmezi, cevizli köme ve yöresel lezzetleri.</description>
${itemsXml}
  </channel>
</rss>`;
}

export async function generateGoogleMerchantTsv(): Promise<string> {
  const items = await buildGoogleMerchantItems();
  const headers = [
    "id",
    "title",
    "description",
    "link",
    "image_link",
    "availability",
    "price",
    "sale_price",
    "brand",
    "condition",
    "mpn",
    "gtin",
    "identifier_exists",
    "google_product_category",
    "product_type",
    "shipping",
  ];
  const cleanCell = (v: string | null) =>
    String(v ?? "")
      .replace(/[\t\r\n]+/g, " ")
      .trim();

  const rows = items.map((it) =>
    [
      it.id,
      it.title,
      it.description,
      it.link,
      it.imageLink,
      it.availability,
      it.price,
      it.salePrice || "",
      it.brand,
      it.condition,
      it.mpn,
      it.gtin || "",
      it.identifierExists,
      it.googleProductCategory,
      it.productType,
      `TR::Standart Kargo:${it.shippingPrice}`,
    ]
      .map(cleanCell)
      .join("\t")
  );

  return [headers.join("\t"), ...rows].join("\n");
}
