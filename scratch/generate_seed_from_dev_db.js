const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_dev_db_products.json'), 'utf8'));

console.log(`Loaded ${products.length} products to format for MySQL seed.`);

const formattedProducts = products.map(p => {
  let attributesObj = {};
  if (typeof p.attributes === 'string') {
    try {
      attributesObj = JSON.parse(p.attributes);
    } catch (e) {
      attributesObj = {};
    }
  } else if (typeof p.attributes === 'object' && p.attributes !== null) {
    attributesObj = p.attributes;
  }

  let imagesArr = [];
  if (typeof p.images === 'string') {
    try {
      imagesArr = JSON.parse(p.images);
    } catch (e) {
      imagesArr = [];
    }
  } else if (Array.isArray(p.images)) {
    imagesArr = p.images;
  }

  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category || "Yöresel Ürünler",
    stock: p.stock || 0,
    criticalLimit: p.criticalLimit || 10,
    price: Number(p.price) || 0,
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    cost: Number(p.cost) || 0,
    image: p.image || "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    images: imagesArr,
    desc: p.desc || p.name,
    isRawMaterial: Boolean(p.isRawMaterial),
    attributes: attributesObj
  };
});

fs.writeFileSync(
  path.join(__dirname, 'formatted_dev_db_products.json'),
  JSON.stringify(formattedProducts, null, 2),
  'utf8'
);

console.log("Saved formatted_dev_db_products.json successfully!");
