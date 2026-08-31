const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log('dev.db exists:', fs.existsSync(dbPath), 'size:', fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0);

// Simple SQLite buffer string parser to inspect table content if native driver is not present
const buf = fs.readFileSync(dbPath);
const content = buf.toString('utf8');

// Find Product table matches or string patterns in dev.db
const matches = content.match(/[\x20-\x7E]{4,}/g) || [];
console.log('Total string tokens found:', matches.length);

const productsFound = [];
matches.forEach((str, i) => {
  if (str.includes('PEKEFE') || str.includes('ATAK') || str.includes('SKU') || str.includes('category') || str.includes('stock')) {
    console.log(`[TOKEN ${i}]:`, str);
  }
});
