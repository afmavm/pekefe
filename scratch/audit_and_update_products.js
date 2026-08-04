const { PrismaClient } = require("../src/generated-client");
const prisma = new PrismaClient();

const trMap = {
  'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
  'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
};
const normalize = (str) => (str || "").replace(/[çÇğĞıİöÖşŞüÜ]/g, match => trMap[match] || match);

async function auditAndUpdateProducts() {
  console.log("=== PROJE ANAYASASI (AGENTS.md) UYUM DENETİMİ VE GÜNCELLEME ===");
  
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  console.log(`Veritabanında toplam ${products.length} adet ürün inceleniyor...\n`);

  let updatedCount = 0;

  for (const p of products) {
    let needsUpdate = false;
    let newDesc = p.desc || "";
    let newSeoTitle = p.seoTitle || "";
    let newSeoDesc = p.seoDesc || "";
    let newPrice = Math.round(Number(p.price || 0));
    let newOldPrice = p.oldPrice ? Math.round(Number(p.oldPrice)) : null;

    // 1. Check prohibited phrasing
    if (newDesc.includes("İspir Aktaş Vadisi") || newDesc.includes("Aktaş Vadisi") || newDesc.includes("Atak")) {
      newDesc = newDesc
        .replace(/İspir Aktaş Vadisi/g, "İspirin bereketli toprakları")
        .replace(/Aktaş Vadisi/g, "İspirin bereketli toprakları")
        .replace(/\bAtak\b/g, "Geleneksel");
      needsUpdate = true;
    }

    if (newSeoDesc.includes("İspir Aktaş Vadisi") || newSeoDesc.includes("Aktaş Vadisi")) {
      newSeoDesc = newSeoDesc
        .replace(/İspir Aktaş Vadisi/g, "İspirin bereketli toprakları")
        .replace(/Aktaş Vadisi/g, "İspirin bereketli toprakları");
      needsUpdate = true;
    }

    // 2. Ensure clean pricing (Zero .99 endings)
    if (Number(p.price) !== newPrice) {
      needsUpdate = true;
    }
    if (p.oldPrice && Number(p.oldPrice) !== newOldPrice) {
      needsUpdate = true;
    }

    // 3. Ensure attributes JSON has clean sizes and colors
    let attrs = typeof p.attributes === 'string' ? JSON.parse(p.attributes) : (p.attributes || {});
    let attrChanged = false;

    if (!attrs.sizes || !Array.isArray(attrs.sizes) || attrs.sizes.length === 0) {
      attrs.sizes = ["500 Gr", "1 Kg"];
      attrChanged = true;
    }
    if (!attrs.colors || !Array.isArray(attrs.colors) || attrs.colors.length === 0) {
      attrs.colors = ["Sade"];
      attrChanged = true;
    }
    if (attrChanged) {
      needsUpdate = true;
    }

    // Update product if needed
    if (needsUpdate) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          desc: newDesc,
          seoDesc: newSeoDesc,
          price: newPrice,
          sale_price: newPrice,
          b2b_base_price: newPrice,
          oldPrice: newOldPrice,
          list_price: newOldPrice,
          attributes: attrs
        }
      });
      console.log(`[GÜNCELLENDİ] ${p.name} (SKU: ${p.sku}) -> Fiyat: ₺${newPrice}`);
      updatedCount++;
    } else {
      console.log(`[UYGUN] ${p.name} (SKU: ${p.sku}) -> Anayasaya tam uygun.`);
    }

    // Audit variants
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        let vNeedsUpdate = false;
        let vPrice = Math.round(Number(v.price || 0));
        let vSku = v.sku;

        if (Number(v.price) !== vPrice) {
          vNeedsUpdate = true;
        }

        if (vNeedsUpdate) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              price: vPrice
            }
          });
          console.log(`  └─ [VARYANT GÜNCELLENDİ] ${v.sku} -> Fiyat: ₺${vPrice}`);
        }
      }
    }
  }

  console.log(`\nDenetim Tamamlandı: Toplam ${updatedCount} adet ürün Proje Anayasasına tam uygun şekilde güncellendi.`);
}

auditAndUpdateProducts()
  .catch(e => console.error("Hata:", e))
  .finally(() => prisma.$disconnect());
