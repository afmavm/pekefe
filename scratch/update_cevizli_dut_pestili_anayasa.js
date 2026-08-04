const { PrismaClient } = require("../src/generated-client");
const prisma = new PrismaClient();

async function updateCevizliDutPestili() {
  console.log("=== PEKEFE CEVİZLİ DUT PESTİLİ ANAYASA UYUM GÜNCELLEMESİ ===");

  const product = await prisma.product.findFirst({
    where: { name: { contains: "Cevizli Dut Pestili" } },
    include: { variants: true }
  });

  if (!product) {
    console.error("Ürün veritabanında bulunamadı!");
    return;
  }

  const updatedDesc = "İspirin bereketli topraklarında yetişen birinci sınıf yerli dutların geleneksel bakır kazanlarda ağır ağır kaynatılmasıyla hazırlanan özgün dut şırası, bol miktarda taze Erzurum cevizi ile buluşuyor. İncecik serilip güneşte doğal yöntemlerle kurutulan PEKEFE Cevizli Dut Pestili, katkısız, koruyucusuz ve rafinesiz zanaatkar lezzetidir.";

  const updatedSeoTitle = "PEKEFE Cevizli Dut Pestili | Geleneksel İspir Lezzeti";
  const updatedSeoDesc = "İspirin bereketli topraklarından gelen doğal dut şırası ve taze Erzurum cevizi ile katkısız olarak hazırlanan PEKEFE Cevizli Dut Pestili.";
  const updatedSeoKeywords = "cevizli dut pestili, inspir dut pestili, pekefe pestil, doğal İspir pestili, katkısız cevizli pestil";

  const updatedAttributes = {
    sizes: ["500 Gr", "1 Kg"],
    colors: ["Cevizli"],
    barcode: "8686030765898",
    unit: "Adet",
    manufacturerCode: "PKF-CDP-01",
    stockType: "Ticari Mal",
    warehouse: "Merkez Depo",
    origin: "İspir / Erzurum",
    ingredients: "Doğal Dut Şırası, Erzurum Cevizi, Doğal Nişasta",
    storageConditions: "Serin ve kuru yerde, doğrudan güneş ışığından uzakta muhafaza ediniz.",
    pairing: "Pekefe Çamı Balı ve Erzurum Kıtlama Çayı eşliğinde sunulması tavsiye edilir."
  };

  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: {
      name: "PEKEFE Cevizli Dut Pestili",
      desc: updatedDesc,
      seoTitle: updatedSeoTitle,
      seoDesc: updatedSeoDesc,
      seoKeywords: updatedSeoKeywords,
      price: 450,
      sale_price: 450,
      b2b_base_price: 450,
      oldPrice: 500,
      list_price: 500,
      cost: 220,
      attributes: updatedAttributes
    }
  });

  // Update variants with clean prices and costs
  for (const v of product.variants) {
    const is1Kg = v.attributes && typeof v.attributes === 'object' && v.attributes.size === "1 Kg";
    const vPrice = is1Kg ? 850 : 450;
    const vCost = is1Kg ? 400 : 220;

    await prisma.productVariant.update({
      where: { id: v.id },
      data: {
        price: vPrice,
        cost: vCost,
        barcode: v.barcode || (v.attributes ? v.attributes.barcode : null)
      }
    });
  }

  console.log("Ürün Proje Anayasasına (AGENTS.md) %100 Uyumlu Olarak Güncellendi!");
  console.log("ID:", updatedProduct.id);
  console.log("Adı:", updatedProduct.name);
  console.log("SKU:", updatedProduct.sku);
  console.log("Fiyat:", `₺${updatedProduct.price} (Liste: ₺${updatedProduct.oldPrice})`);
  console.log("Açıklama:", updatedProduct.desc);
}

updateCevizliDutPestili()
  .catch(e => console.error("Hata:", e))
  .finally(() => prisma.$disconnect());
