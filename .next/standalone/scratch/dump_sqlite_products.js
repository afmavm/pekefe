const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backups', 'backup-auto-2026-08-01-00-00-24.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
  if (err) {
    console.error('Error fetching tables:', err);
    return;
  }
  console.log('TABLES_IN_SQLITE:', tables.map(t => t.name));

  db.all("SELECT * FROM Product;", [], (err, products) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      return;
    }
    console.log(`FOUND ${products.length} PRODUCTS IN SQLITE BACKUP:`);
    console.log(JSON.stringify(products, null, 2));
  });
});
