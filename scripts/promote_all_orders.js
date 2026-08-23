const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, '../public/data/orders_db.json');

function promoteOrders() {
  if (!fs.existsSync(ordersPath)) {
    console.log('No orders DB file found.');
    return;
  }
  const content = fs.readFileSync(ordersPath, 'utf8');
  const orders = JSON.parse(content);

  let updatedCount = 0;
  const updatedOrders = orders.map(o => {
    if (o.status === 'Ödeme Bekliyor') {
      updatedCount++;
      return { ...o, status: 'Hazırlanıyor' };
    }
    return o;
  });

  fs.writeFileSync(ordersPath, JSON.stringify(updatedOrders, null, 2), 'utf8');
  console.log(`✅ SUCCESS! Promoted ${updatedCount} orders from 'Ödeme Bekliyor' to 'Hazırlanıyor'.`);
}

promoteOrders();
