const { PrismaClient } = require("../src/generated-client");
const prisma = new PrismaClient();

function stripHtml(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fixHtmlProducts() {
  console.log("=== HAM HTML ETİKETLERİNİ TEMİZLEME VE EDİTÖRYAL DÜZELTME ===");

  const products = await prisma.product.findMany();

  for (const p of products) {
    if (p.desc && p.desc.includes("<")) {
      const cleanDesc = stripHtml(p.desc);
      await prisma.product.update({
        where: { id: p.id },
        data: { desc: cleanDesc }
      });
      console.log(`[DÜZELTİLDİ] ${p.name} (SKU: ${p.sku}) -> HTML etiketleri temizlendi.`);
    }
  }

  console.log("Tüm ham HTML etiketleri veritabanından temizlendi.");
}

fixHtmlProducts()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
