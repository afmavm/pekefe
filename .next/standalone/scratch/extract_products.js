const { PrismaClient } = require('./sqlite-client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function extract() {
  console.log("=== EXTRACTING PRODUCTS FROM LOCAL dev.db ===");
  const products = await prisma.product.findMany({});
  console.log(`Found ${products.length} PRODUCTS in local dev.db!`);
  
  const outputPath = path.join(__dirname, 'extracted_dev_db_products.json');
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf8');
  console.log(`Successfully saved ${products.length} products to ${outputPath}!`);

  products.forEach((p, index) => {
    console.log(`[${index + 1}] SKU: ${p.sku} | Name: ${p.name} | Category: ${p.category} | Price: ${p.price} | Stock: ${p.stock}`);
  });
}

extract()
  .catch(err => console.error("EXTRACT ERROR:", err))
  .finally(() => prisma.$disconnect());
