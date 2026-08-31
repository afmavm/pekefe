const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('./sqlite-client');

const prisma = new PrismaClient();

async function inspectAll() {
  console.log("=== INSPECTING ALL DATA FROM dev.db ===");
  const products = await prisma.product.findMany({});
  
  // Read extracted products json
  const extractedProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_dev_db_products.json'), 'utf8'));

  console.log(`Successfully parsed ${extractedProducts.length} local products from dev.db.`);
}

inspectAll()
  .catch(err => console.error("INSPECT ERROR:", err))
  .finally(() => prisma.$disconnect());
