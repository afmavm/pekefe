const { PrismaClient } = require('../src/generated-client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- UPDATING ALL DB PRODUCT IMAGES ---');

  // Cevizli Rulo Pestil
  await prisma.product.updateMany({
    where: { OR: [{ id: 'cevizli-pestil' }, { name: { contains: 'Cevizli Rulo Pestil' } }] },
    data: {
      image: '/ispir-vakum-cevizli-pestil-beyaz.png',
      images: JSON.stringify(['/ispir-vakum-cevizli-pestil-beyaz.png', '/uploads/ispir-el-sarimi-pestil-cesitleri.webp'])
    }
  });

  // İspir Dut Kömesi (Cevizli)
  await prisma.product.updateMany({
    where: { OR: [{ id: 'ispir-kome' }, { name: { contains: 'İspir Dut Kömesi' } }] },
    data: {
      image: '/ispir-kome-gercek-hasat.jpg',
      images: JSON.stringify(['/ispir-kome-gercek-hasat.jpg', '/uploads/ispir-muska-kome-saray-tatlilari.webp'])
    }
  });

  // İspir Tek Çekim Dut Kömesi
  await prisma.product.updateMany({
    where: { OR: [{ id: 'ispir-tek-cekim-kome' }, { name: { contains: 'Tek Çekim' } }] },
    data: {
      image: '/ispir-kome-beyaz.png',
      images: JSON.stringify(['/ispir-kome-beyaz.png', '/ispir-kome-gercek-hasat.jpg'])
    }
  });

  console.log('--- DB PRODUCTS UPDATED SUCCESSFULLY ---');
  const updated = await prisma.product.findMany();
  for (const p of updated) {
    if (p.name.includes('Pestil') || p.name.includes('Köme') || p.name.includes('Pekmez') || p.name.includes('Tatlı')) {
      console.log(p.id, '|', p.name, '| image:', p.image);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
