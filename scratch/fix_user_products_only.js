const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = "postgresql://neondb_owner:npg_zhlvHLFGVA76@ep-plain-mode-b2fq4008-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

const userProducts = [
  {
    id: "1788942548790",
    slug: "11-kirmizi-gul-ve-husnuyusuf-buketi",
    title: "11 Kırmızı Gül ve Hüsnüyusuf Buketi",
    category: "Güller",
    categorySlug: "guller",
    selectedCategorySlugs: ["guller", "cicekler", "sevgililer-icin", "buketler"],
    designType: "Buket",
    recipient: "Sevgiliye",
    purpose: "Sevgililer Günü",
    color: "Kırmızı",
    price: "1.500 ₺",
    oldPrice: null,
    discount: "%10",
    image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788942512545-18e5edd5.jpg",
    code: "DM68",
    stock: true,
    featured: true,
    description: "11 Kırmızı Gül ve Hüsnüyusuf Buketi"
  },
  {
    id: "1788939933418",
    slug: "beyaz-saksida-cift-dal-mor-orkide",
    title: "Beyaz Saksıda Çift Dal Mor Orkide",
    category: "Orkide",
    categorySlug: "orkide",
    selectedCategorySlugs: ["orkide", "cicekler", "anneye-cicek", "saksi-cicekleri"],
    designType: "Saksı",
    recipient: "Anneye",
    purpose: "Doğum Günü",
    color: "Mor",
    price: "1.650 ₺",
    oldPrice: null,
    discount: null,
    image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788939894830-110c9e23.jpg",
    code: "DM36",
    stock: true,
    featured: true,
    description: "Beyaz Saksıda Çift Dal Mor Orkide"
  }
];

async function cleanupAndSetUserProducts() {
  console.log("Cleaning all deleted demo products from Neon DB...");

  // Delete all existing products in Neon DB
  try {
    await sql`TRUNCATE TABLE products;`;
    console.log("Truncated products table in Neon DB.");
  } catch (e) {
    try {
      await sql`DELETE FROM products;`;
      console.log("Deleted all products from Neon DB.");
    } catch (e2) {
      console.error("Neon clear error:", e2);
    }
  }

  // Insert only user's authentic products
  for (const p of userProducts) {
    try {
      await sql`
        INSERT INTO products (
          id, slug, title, category, category_slug, selected_category_slugs,
          design_type, recipient, purpose, color, price, old_price, discount,
          image, code, stock, featured, description
        )
        VALUES (
          ${p.id}, ${p.slug}, ${p.title}, ${p.category}, ${p.categorySlug},
          ${JSON.stringify(p.selectedCategorySlugs)}, ${p.designType}, ${p.recipient},
          ${p.purpose}, ${p.color}, ${p.price}, ${p.oldPrice}, ${p.discount},
          ${p.image}, ${p.code}, ${p.stock}, ${p.featured}, ${p.description}
        );
      `;
      console.log(`Inserted user product: ${p.title} (${p.code})`);
    } catch (e) {
      console.error(`Error inserting product ${p.id}:`, e);
    }
  }

  // Update local db.json and initial-db.ts
  const dbPath = path.join(process.cwd(), "src", "data", "db.json");
  const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

  let db = {};
  if (fs.existsSync(dbPath)) {
    try { db = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) {}
  }

  db.products = userProducts;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");

  const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
  fs.writeFileSync(initialTsPath, tsCode, "utf-8");

  console.log("Successfully set ONLY user's authentic products!");
}

cleanupAndSetUserProducts();
