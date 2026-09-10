const { execSync } = require('child_process');

const ids = [
  '1788967143719',
  '1788963499992',
  '1788962068470',
  '1788961701864',
  '1788946026121',
  '1788942548790'
];

ids.forEach(id => {
  try {
    const res = execSync(`git log -S "${id}" --oneline`, { maxBuffer: 10 * 1024 * 1024 }).toString();
    console.log(`Commits referencing ID ${id}:\n${res}`);
  } catch (e) {
    console.error(`Error searching ID ${id}`);
  }
});
