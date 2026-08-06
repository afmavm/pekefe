const fs = require('fs');

const errorFiles = [
  "src/app/api/accounting/current-accounts/mapping/route.ts",
  "src/app/api/applications/route.ts",
  "src/app/api/checkout/route.ts",
  "src/app/api/dealers/register/route.ts",
  "src/app/api/finance/route.ts",
  "src/app/api/integrations/efatura/route.ts",
  "src/app/api/orders/[id]/route.ts",
  "src/app/api/production/route.ts",
  "src/app/api/products/[id]/movements/route.ts",
  "src/app/api/products/[id]/recipe/route.ts",
  "src/app/api/purchase-requisitions/[id]/approvals/route.ts",
  "src/app/api/purchase-requisitions/[id]/convert/route.ts",
  "src/app/api/purchase-requisitions/[id]/route.ts",
  "src/app/api/purchase-requisitions/route.ts",
  "src/app/api/stock-transfers/[id]/approve/route.ts",
  "src/app/api/webhooks/ecommerce/order-created/route.ts"
];

for (const f of errorFiles) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    // Remove misplaced `, { maxWait: 10000, timeout: 30000 }` that were attached to inner statements or array transactions
    c = c.replace(/,\s*\{\s*maxWait:\s*10000,\s*timeout:\s*30000\s*\}/g, (match, offset, str) => {
      // Check if this instance is attached to `prisma.$transaction(async (`
      const prefix = str.slice(Math.max(0, offset - 300), offset);
      if (prefix.includes('prisma.$transaction(async')) {
        return match; // Keep it on interactive transactions!
      }
      return ''; // Remove if misplaced inside inner query or array transaction
    });
    fs.writeFileSync(f, c, 'utf8');
    console.log('CLEANED:', f);
  }
}
