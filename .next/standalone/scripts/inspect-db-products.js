const { PrismaClient } = require('../src/generated-client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
      desc: true,
      attributes: true,
    }
  });

  console.log(`TOTAL PRODUCTS IN DB: ${products.length}\n`);
  products.forEach((p) => {
    let attrs = {};
    try { attrs = typeof p.attributes === 'string' ? JSON.parse(p.attributes) : p.attributes; } catch (e) {}
    console.log(`[${p.id}] SKU: ${p.sku} | Name: ${p.name}`);
    console.log(`  Category: ${p.category}`);
    console.log(`  Desc snippet: ${(p.desc || '').slice(0, 100)}...`);
    console.log(`  ShortDesc attr: ${attrs?.shortDesc || 'NONE'}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
