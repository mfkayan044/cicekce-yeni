const { execSync } = require('child_process');

const jsonStr = execSync('git show 746c3ab:src/data/db.json', { maxBuffer: 20 * 1024 * 1024 }).toString('utf8');
const db = JSON.parse(jsonStr);

console.log("Products from commit 746c3ab:");
db.products.forEach(p => {
  console.log(`ID: ${p.id} | Code: ${p.code} | Title: ${p.title} | Price: ${p.price} | Image: ${p.image}`);
});
