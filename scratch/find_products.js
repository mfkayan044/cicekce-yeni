const { execSync } = require('child_process');

const commits = [
  'cefb71d', 'ebb3128', '35cd77d', 'c41cbf8', '852c68f',
  '35461ab', '19ecad1', 'fb85927', '399bb88', '03dac56',
  '5b84163', '63703a0', '746c3ab', '847ec56', 'c89d7fb'
];

for (const hash of commits) {
  try {
    const raw = execSync(`git show ${hash}:src/data/db.json`, { maxBuffer: 20 * 1024 * 1024 }).toString('utf8');
    const parsed = JSON.parse(raw);
    const count = parsed.products ? parsed.products.length : 0;
    console.log(`Commit ${hash}: db.json products = ${count}`);
    if (count > 1) {
      console.log(`FOUND ${count} products in commit ${hash}!`);
      console.log(parsed.products.slice(0, 3).map(p => ({ id: p.id, title: p.title })));
    }
  } catch (e) {
    // try initial-db.ts
    try {
      const rawTs = execSync(`git show ${hash}:src/lib/initial-db.ts`, { maxBuffer: 20 * 1024 * 1024 }).toString('utf8');
      const match = rawTs.match(/"products"\s*:\s*(\[[^]+?\]\s*,?\s*"\w+":)/);
      if (match) {
        console.log(`Commit ${hash} (initial-db.ts): found products match`);
      }
    } catch (e2) {}
  }
}
