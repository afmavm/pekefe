const { PrismaClient } = require('../src/generated-client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({});
  console.log('PRODUCTS_COUNT:', products.length);
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    isRawMaterial: p.isRawMaterial
  })), null, 2));
}

main()
  .catch(err => console.error('DB_ERROR:', err.message))
  .finally(() => prisma.$disconnect());
