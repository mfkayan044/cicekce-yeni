const { execSync } = require('child_process');

try {
  const jsonStr = execSync('git show 35461ab:src/data/db.json', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
  const db = JSON.parse(jsonStr);
  console.log("Git commit 35461ab products count:", db.products ? db.products.length : 0);
  if (db.products && db.products.length > 0) {
    console.log("Sample 10 products:");
    console.log(db.products.slice(0, 10).map(p => ({ id: p.id, title: p.title, price: p.price, image: p.image })));
  }
} catch (e) {
  console.error("Error:", e.message);
}
