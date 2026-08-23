const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../src/generated-client'));
const prisma = new PrismaClient();

async function resetCarriersInDb() {
  try {
    await prisma.$executeRawUnsafe(`UPDATE CMSData SET shippingCarriers = '[]' WHERE id = 'singleton'`);
    console.log('CMSData shippingCarriers successfully reset in DB!');
  } catch (err) {
    console.log('DB reset notice (may not apply if DB offline):', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetCarriersInDb();
