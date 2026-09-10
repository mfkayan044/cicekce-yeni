const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = "postgresql://neondb_owner:npg_zhlvHLFGVA76@ep-plain-mode-b2fq4008-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function main() {
  try {
    const products = await sql`SELECT * FROM products ORDER BY id DESC`;
    console.log(`Neon Database total products: ${products.length}`);
    products.forEach(p => {
      console.log(`ID: ${p.id} | Code: ${p.code} | Title: ${p.title} | Price: ${p.price} | Image: ${p.image} | Category: ${p.category}`);
    });
  } catch (e) {
    console.error("Neon Query Error:", e);
  }
}

main();
