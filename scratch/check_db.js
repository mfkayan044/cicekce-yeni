const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log("Local db.json product count:", db.products ? db.products.length : 0);
if (db.products && db.products.length > 0) {
  console.log("First 3 products in db.json:");
  console.log(db.products.slice(0, 3).map(p => ({ id: p.id, title: p.title, price: p.price, image: p.image })));
}
