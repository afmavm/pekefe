const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const row = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
  console.log('--- DB ROW ---');
  console.log('TYPE of shippingCarriers:', typeof row?.shippingCarriers);
  console.log('VALUE of shippingCarriers:', JSON.stringify(row?.shippingCarriers, null, 2));

  // Test updating
  const testCarriers = [
    { id: 'yurtici', name: 'Yurtiçi Kargo (Özel Güncellendi)', logoUrl: '/logos/yurtici.svg', pricingType: 'flat', isActive: true, fallbackFee: 199 }
  ];

  await prisma.cMSData.upsert({
    where: { id: 'singleton' },
    update: { shippingCarriers: JSON.stringify(testCarriers) },
    create: { id: 'singleton', heroTitle: 'test', heroSubtitle: 'test', buttonText: 'test', announcement: 'test', pricingRules: [], shippingCarriers: JSON.stringify(testCarriers), themeTemplates: [], contentAnywhereRules: [], savedSectionTemplates: [], popupConfig: {}, faqData: [] }
  });

  const updatedRow = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
  console.log('--- AFTER DIRECT DB UPDATE ---');
  console.log('VALUE:', JSON.stringify(updatedRow?.shippingCarriers, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
