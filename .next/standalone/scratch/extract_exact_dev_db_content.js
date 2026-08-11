const { PrismaClient } = require('./sqlite-client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function extract() {
  console.log("=== EXTRACTING DATA FROM LOCAL dev.db ===");
  
  const products = await prisma.product.findMany({});
  console.log(`Found ${products.length} products in local dev.db.`);
  
  const currentAccounts = await prisma.currentAccount.findMany({});
  console.log(`Found ${currentAccounts.length} current accounts (cariler) in local dev.db.`);

  const categories = await prisma.categoryDetail.findMany({});
  console.log(`Found ${categories.length} category details in local dev.db.`);

  const dumpData = {
    products,
    currentAccounts,
    categories
  };

  const outputPath = path.join(__dirname, 'extracted_dev_db_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(dumpData, null, 2), 'utf8');
  console.log(`Successfully saved extracted data to ${outputPath}!`);
}

extract()
  .catch(err => console.error("EXTRACT ERROR:", err))
  .finally(() => prisma.$disconnect());
