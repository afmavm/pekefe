const path = require('path');

function testDeduct() {
  const { deductLocalProductStock, readLocalProducts } = require(path.join(__dirname, '../src/lib/jsonProductDb'));
  console.log('BEFORE DEDUCTION:', readLocalProducts());

  const testItem = {
    id: "PKF-1787481354097_PKF-1787481354097",
    name: "Test Ürünü Pestil",
    quantity: 1
  };

  const success = deductLocalProductStock(testItem, 1);
  console.log('Deduction Success:', success);
  console.log('AFTER DEDUCTION:', readLocalProducts());
}

testDeduct();
