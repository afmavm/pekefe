import { prisma } from '../src/lib/prisma';

async function testCats() {
  const cats = await prisma.categoryDetail.findMany();
  console.log('CategoryDetail count:', cats.length);
  cats.forEach(c => {
    console.log(`- ID: ${c.id} | Name: ${c.name} | ParentId: ${c.parentId}`);
  });

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { category: true }
  });
  const uniqueProdCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  console.log('Unique categories in non-deleted products:', uniqueProdCats);
}

testCats().catch(console.error);
