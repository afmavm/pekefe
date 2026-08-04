const { PrismaClient } = require("../src/generated-client");
const prisma = new PrismaClient();

async function main() {
  const name = "PEKEFE Cevizli Dut Pestili";
  const sku = "PKF-" + Math.floor(100000 + Math.random() * 900000);
  const category = "Pestil Köme Çeşitleri";
  const desc = "İspirin bereketli topraklarında geleneksel kazanlarda kaynatılan özgün dut şırası ve bol Erzurum cevizi ile harmanlanmış, katksız ve doğal PEKEFE Cevizli Dut Pestili.";
  
  // Check if product already exists by name or SKU
  const existing = await prisma.product.findFirst({
    where: { name: name }
  });

  if (existing) {
    console.log("Ürün zaten mevcut:", existing.id, existing.name, existing.sku);
    return;
  }

  const product = await prisma.product.create({
    data: {
      name: name,
      sku: sku,
      category: category,
      stock: 500,
      stock_quantity: 500,
      criticalLimit: 10,
      price: 450,
      oldPrice: 500,
      list_price: 500,
      sale_price: 450,
      b2b_base_price: 450,
      desc: desc,
      seoTitle: "PEKEFE Cevizli Dut Pestili - Doğal ve Katkısız Geleneksel Lezzet",
      seoDesc: "İspirin bereketli topraklarından gelen doğal dut şırası ve bol cevizli içeriğiyle PEKEFE Cevizli Dut Pestili.",
      seoKeywords: "cevizli dut pestili, inspir pestil, pekefe pestil, doğal pestil",
      image: "/uploads/1785877091526-7ah5uox7t.webp",
      images: [
        "/uploads/1785877091526-7ah5uox7t.webp",
        "/uploads/1785877098808-oq559xwyn.webp"
      ],
      attributes: {
        sizes: ["500 Gr", "1 Kg"],
        colors: ["Cevizli"],
        barcode: "868" + Math.floor(1000000000 + Math.random() * 9000000000),
        unit: "Adet",
        manufacturerCode: "PKF-CDP-01",
        stockType: "Ticari Mal",
        warehouse: "Merkez Depo"
      },
      isRawMaterial: false,
      variants: {
        create: [
          {
            sku: `${sku}-500G-CVZ`,
            stock: 250,
            price: 450,
            attributes: {
              size: "500 Gr",
              color: "Cevizli",
              barcode: "868" + Math.floor(1000000000 + Math.random() * 9000000000),
              name: "500 Gr - Cevizli"
            }
          },
          {
            sku: `${sku}-1KG-CVZ`,
            stock: 250,
            price: 850,
            attributes: {
              size: "1 Kg",
              color: "Cevizli",
              barcode: "868" + Math.floor(1000000000 + Math.random() * 9000000000),
              name: "1 Kg - Cevizli"
            }
          }
        ]
      }
    }
  });

  console.log("Ürün başarıyla oluşturuldu! ID:", product.id, "SKU:", product.sku);
}

main()
  .catch(e => console.error("Hata:", e))
  .finally(() => prisma.$disconnect());
