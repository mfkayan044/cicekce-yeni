const fs = require('fs');
const path = require('path');

const oldDb = JSON.parse(fs.readFileSync('scratch/old_db.json', 'utf8'));

console.log("old_db.json products count:", oldDb.products ? oldDb.products.length : 0);
if (oldDb.products && oldDb.products.length > 0) {
  console.log("Sample products in old_db.json:");
  console.log(oldDb.products.slice(0, 10).map(p => ({ id: p.id, title: p.title, price: p.price, image: p.image })));
}
