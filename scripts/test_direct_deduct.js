const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../public/data/products_db.json');

function testJsonDeduct() {
  const content = fs.readFileSync(dbPath, 'utf8');
  const products = JSON.parse(content);
  console.log('BEFORE:', products);

  const itemInfo = {
    id: "PKF-1787481354097_PKF-1787481354097",
    name: "Test Ürünü Pestil",
    quantity: 1
  };

  const targetIdStr = String(itemInfo.id).trim();
  const rawProductId = targetIdStr.split('_')[0].trim();
  const cleanItemName = String(itemInfo.name).toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/[^a-z0-9çğıöşü]/gi, '').trim();

  let idx = products.findIndex(p => {
    const pId = String(p.id || '').trim();
    const pSku = String(p.sku || '').trim();
    return pId === targetIdStr || pSku === targetIdStr || (rawProductId && pId === rawProductId);
  });

  if (idx === -1 && cleanItemName) {
    idx = products.findIndex(p => {
      const pCleanName = String(p.name || '').toLowerCase().replace(/[^a-z0-9çğıöşü]/gi, '').trim();
      return pCleanName === cleanItemName || pCleanName.includes(cleanItemName) || cleanItemName.includes(pCleanName);
    });
  }

  if (idx >= 0) {
    const oldStock = products[idx].stock;
    products[idx].stock = Math.max(0, oldStock - 1);
    products[idx].stock_quantity = products[idx].stock;
    fs.writeFileSync(dbPath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`✅ MATCH SUCCESS! Index: ${idx}, Product: ${products[idx].name}, Old Stock: ${oldStock} -> New Stock: ${products[idx].stock}`);
  } else {
    console.log('❌ NO MATCH FOUND');
  }
}

testJsonDeduct();
