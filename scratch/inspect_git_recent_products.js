const { execSync } = require('child_process');

const commits = [
  'cefb71d', 'ebb3128', '35cd77d', 'c41cbf8', '6c3d8f1', 'f722402', '852c68f', '35461ab', '19ecad1', 'fb85927'
];

commits.forEach(hash => {
  try {
    const raw = execSync(`git show ${hash}:src/data/db.json`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    const parsed = JSON.parse(raw);
    console.log(`=== Commit ${hash} ===`);
    if (parsed.products) {
      console.log(`Count: ${parsed.products.length}`);
      parsed.products.forEach(p => {
        console.log(`  ID: ${p.id} | Code: ${p.code} | Title: ${p.title} | Image: ${p.image}`);
      });
    }
  } catch (e) {
    console.log(`Commit ${hash}: failed to parse db.json`);
  }
});
