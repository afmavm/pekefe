const path = require('path');

async function testCariFetch() {
  const { readLocalOrders } = require(path.join(__dirname, '../src/lib/jsonOrderDb'));
  const orders = readLocalOrders();
  console.log('FOUND ORDERS:', orders.length);

  const extractedAccountsMap = new Map();
  orders.forEach((o, index) => {
    const clientName = o.client || o.customerName || "Müşteri";
    const email = o.email || `musteri_${index + 1}@pekefe.com`;
    const key = email.toLowerCase().trim() || clientName.toLowerCase().trim();

    if (!extractedAccountsMap.has(key)) {
      extractedAccountsMap.set(key, {
        id: o.currentAccountId || `CARI-${index + 1001}`,
        cariKod: `PKF-CARI-${String(index + 1001).padStart(4, '0')}`,
        name: clientName,
        email: email,
        phone: o.phone,
        address: o.address
      });
    }
  });

  console.log('EXTRACTED CARI CARDS:', Array.from(extractedAccountsMap.values()));
}

testCariFetch();
