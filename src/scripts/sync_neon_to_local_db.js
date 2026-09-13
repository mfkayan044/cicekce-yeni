const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  try {
    const envPath = path.join(__dirname, '..', '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) DATABASE_URL = match[1];
    }
  } catch (e) {}
}
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set.");
const sql = neon(DATABASE_URL);

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const initialDbTsPath = path.join(__dirname, '..', 'lib', 'initial-db.ts');

async function syncNeon() {
  console.log('Fetching live tables from Neon PostgreSQL...');
  let existingDb = {};
  if (fs.existsSync(dbPath)) {
    existingDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  }

  const categoriesData = await sql.query('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
  if (categoriesData && categoriesData.length > 0) {
    existingDb.categories = categoriesData.map((c) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug,
      image: c.image || '',
      order: c.display_order !== undefined ? c.display_order : (c.order || 0)
    }));
    console.log('Synced ' + categoriesData.length + ' categories from Neon!');
  }

  const settingsData = await sql.query('SELECT * FROM settings');
  if (settingsData && settingsData.length > 0) {
    settingsData.forEach((setting) => {
      if (setting.key === 'hero') existingDb.hero = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    });
    console.log('Synced settings from Neon!');
  }

  fs.writeFileSync(dbPath, JSON.stringify(existingDb, null, 2), 'utf-8');

  const tsContent = 'export const initialDbData: any = ' + JSON.stringify(existingDb, null, 2) + ';\n';
  fs.writeFileSync(initialDbTsPath, tsContent, 'utf-8');

  console.log('Successfully synchronized db.json and initial-db.ts with Neon DB!');
}

syncNeon().catch(console.error);
