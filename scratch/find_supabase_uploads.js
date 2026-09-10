const { execSync } = require('child_process');

try {
  const logStr = execSync(`git log -p`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8');
  const matches = logStr.match(/https:\/\/cksauvgjodsduhxtnqwm\.supabase\.co\/storage\/v1\/object\/public\/cicekce-uploads\/[^\s"']+/g) || [];
  const urls = [...new Set(matches)];
  console.log(`Found ${urls.length} unique Supabase upload URLs in git history:`);
  urls.forEach(u => console.log(u));
} catch (e) {
  console.error("Error:", e.message);
}
