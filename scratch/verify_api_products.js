const { neon } = require("@neondatabase/serverless");
const DATABASE_URL = "postgresql://neondb_owner:npg_zhlvHLFGVA76@ep-plain-mode-b2fq4008-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function verify() {
  const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  console.log(`Total live products in Neon DB: ${rows.length}`);
  rows.forEach(r => {
    console.log(`ID: ${r.id} | Code: ${r.code} | Title: ${r.title} | Price: ${r.price} | Image: ${r.image}`);
  });
}

verify();
