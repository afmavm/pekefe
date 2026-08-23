const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../public/data/products_db.json');
const content = fs.readFileSync(dbPath, 'utf8');
const products = JSON.parse(content);

console.log("=== PRODUCTS IN DB ===");
console.log(products);

const targetIdVal = "pkf-1787481354097";
const targetSkuVal = "pkf-714690";
const targetSlugVal = "deneme";

function generateSlug(text) {
  if (!text) return "";
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const isMatch = (p) => {
  const pId = String(p.id || "").trim().toLowerCase();
  const pSku = String(p.sku || "").trim().toLowerCase();
  const pSlug = String(p.slug || generateSlug(p.name || "")).trim().toLowerCase();
  const pNameClean = String(p.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  
  console.log(`Checking product pId="${pId}", pSku="${pSku}", pSlug="${pSlug}" against targetIdVal="${targetIdVal}", targetSkuVal="${targetSkuVal}"`);

  if (targetIdVal && pId === targetIdVal) return true;
  if (targetSkuVal && pSku === targetSkuVal) return true;
  if (targetSlugVal && (pSlug === targetSlugVal || pSlug.includes(targetSlugVal) || targetSlugVal.includes(pSlug))) return true;
  if (targetSlugVal && pNameClean.includes(targetSlugVal.replace(/-/g, ""))) return true;
  return false;
};

const matchedProduct = products.find(isMatch);
console.log("=== MATCHED PRODUCT ===");
console.log(matchedProduct);
