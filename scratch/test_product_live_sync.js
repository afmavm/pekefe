import { prisma } from '../src/lib/prisma';

async function testProducts() {
  const count = await prisma.product.count({ where: { isDeleted: false } });
  console.log('Total non-deleted products in DB:', count);

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    take: 5
  });

  products.forEach(p => {
    console.log(`- DB Product ID: ${p.id} | SKU: ${p.sku} | Name: ${p.name} | Price: ${p.price} TL | Stock: ${p.stock}`);
  });
}

testProducts().catch(console.error);
