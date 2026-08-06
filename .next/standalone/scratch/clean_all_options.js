const fs = require('fs');

const filesToClean = [
  "src/app/api/accounting/current-accounts/mapping/route.ts",
  "src/app/api/applications/route.ts",
  "src/app/api/checkout/route.ts",
  "src/app/api/dealers/register/route.ts",
  "src/app/api/integrations/efatura/route.ts",
  "src/app/api/orders/[id]/route.ts",
  "src/app/api/products/[id]/movements/route.ts",
  "src/app/api/products/[id]/recipe/route.ts",
  "src/app/api/purchase-requisitions/[id]/route.ts",
  "src/app/api/stock-transfers/[id]/approve/route.ts"
];

for (const filePath of filesToClean) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/,\s*\{\s*maxWait:\s*10000,\s*timeout:\s*30000\s*\}/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('COMPLETELY CLEANED:', filePath);
  }
}
