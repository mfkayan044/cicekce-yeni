const { execSync } = require('child_process');

const codes = ['DM51', 'DM41', 'DM81', 'DM88', 'DM83', 'DM96', 'DM68', 'DM90', 'DM36'];

codes.forEach(code => {
  try {
    const res = execSync(`git log -S "${code}" --oneline`, { maxBuffer: 10 * 1024 * 1024 }).toString();
    if (res.trim()) {
      console.log(`Code ${code} found in commits:\n${res}`);
    }
  } catch (e) {}
});
