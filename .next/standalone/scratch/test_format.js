import { prisma } from '../src/lib/prisma';
import { formatDbProductToStorefront } from '../src/utils/productsStorage.js';

async function testFormat() {
  const dbProducts = await prisma.product.findMany({
    where: { isDeleted: false }
  });

  console.log(`Fetched ${dbProducts.length} DB products.`);
  const formatted = dbProducts.map(p => {
    try {
      return formatDbProductToStorefront(p);
    } catch (e) {
      console.error(`Error formatting product ${p.id} (${p.name}):`, e);
      return null;
    }
  });

  console.log(`Formatted ${formatted.filter(Boolean).length} products successfully.`);
}

testFormat().catch(console.error);
