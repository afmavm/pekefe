'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const queries = [
  "ALTER TABLE CMSData ADD COLUMN paymentMethodsConfig LONGTEXT NULL",
  "ALTER TABLE CMSData ADD COLUMN paytrConfig LONGTEXT NULL",
  "ALTER TABLE CMSData ADD COLUMN installmentsConfig LONGTEXT NULL",
  "ALTER TABLE CMSData ADD COLUMN cashOnDeliveryFee DOUBLE NOT NULL DEFAULT 25",
  "ALTER TABLE CMSData ADD COLUMN cashOnDeliveryEnabled TINYINT(1) NOT NULL DEFAULT 0",
  "ALTER TABLE CMSData ADD COLUMN minOrderAmountForOpenAccount DOUBLE NOT NULL DEFAULT 500",
  "ALTER TABLE CMSData ADD COLUMN openAccountDaysLimit INT NOT NULL DEFAULT 30",
  "ALTER TABLE CMSData ADD COLUMN preventZeroStockSale TINYINT(1) NOT NULL DEFAULT 1",
  "ALTER TABLE CMSData ADD COLUMN defaultCriticalStockLimit INT NOT NULL DEFAULT 5"
];

async function run() {
  console.log('CMSData migration starting...');
  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      const col = q.match(/ADD COLUMN (\w+)/)[1];
      console.log('✓ Added column:', col);
    } catch (e) {
      const col = q.match(/ADD COLUMN (\w+)/)[1];
      console.log('⚠ Column already exists (skipped):', col);
    }
  }

  // Seed default paytr config if empty
  try {
    const row = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
    if (row && (!row.paymentMethodsConfig || row.paymentMethodsConfig === '[]')) {
      await prisma.$executeRawUnsafe(
        `UPDATE CMSData SET 
          paymentMethodsConfig = '[{"id":"creditCard","enabled":true},{"id":"bankTransfer","enabled":true},{"id":"openAccount","enabled":true},{"id":"cashOnDelivery","enabled":false}]',
          paytrConfig = '{"merchantId":"735518","merchantKey":"wQkmEkdf5NDCEnWg","merchantSalt":"AuK7HXRb7NrbyZzw","testMode":false}',
          installmentsConfig = '[{"months":1,"label":"Tek Cekim","enabled":true,"extraFeePercent":0},{"months":2,"label":"2 Taksit","enabled":true,"extraFeePercent":0},{"months":3,"label":"3 Taksit","enabled":true,"extraFeePercent":0},{"months":6,"label":"6 Taksit","enabled":true,"extraFeePercent":1.5},{"months":9,"label":"9 Taksit","enabled":false,"extraFeePercent":3},{"months":12,"label":"12 Taksit","enabled":false,"extraFeePercent":5}]'
        WHERE id = 'singleton'`
      );
      console.log('✓ Seeded default payment config');
    }
  } catch (e) {
    console.log('⚠ Seed skipped:', e.message);
  }

  await prisma.$disconnect();
  console.log('Migration complete!');
}

run().catch(e => { console.error(e); process.exit(1); });
