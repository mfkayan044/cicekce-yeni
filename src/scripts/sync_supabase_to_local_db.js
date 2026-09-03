const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://cksauvgjodsduhxtnqwm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2F1dmdqb2RzZHVoeHRucXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzE0OTUsImV4cCI6MjEwMzg0NzQ5NX0.4a5gB69LbXyG9zVE9AxKGp_BGDL9cTn3QSs4zj6Oirc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const dbPath = path.join(__dirname, "..", "data", "db.json");
const initialDbTsPath = path.join(__dirname, "..", "lib", "initial-db.ts");

async function syncAll() {
  console.log("Fetching live tables from Supabase PostgreSQL...");

  let existingDb = {};
  if (fs.existsSync(dbPath)) {
    existingDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  }

  // 1. Fetch Categories sorted by display_order
  const { data: categoriesData } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
  if (categoriesData && categoriesData.length > 0) {
    existingDb.categories = categoriesData.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      order: c.display_order || c.order || 0
    }));
    console.log(`Synced ${categoriesData.length} categories from Supabase!`);
  }

  // 2. Fetch Products
  const { data: productsData } = await supabase.from("products").select("*");
  if (productsData && productsData.length > 0) {
    existingDb.products = productsData.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      categorySlug: p.category_slug || p.categorySlug,
      price: p.price,
      oldPrice: p.old_price || p.oldPrice,
      discount: p.discount,
      image: p.image,
      code: p.code,
      stock: p.stock !== false,
      featured: p.featured !== false,
      description: p.description
    }));
    console.log(`Synced ${productsData.length} products from Supabase!`);
  }

  // 3. Fetch site settings (hero, headerBant, homeSeo, faqs, headerMenus)
  const { data: siteSettings } = await supabase.from("site_settings").select("*");
  if (siteSettings && siteSettings.length > 0) {
    siteSettings.forEach((setting) => {
      if (setting.id === "hero") existingDb.hero = setting.value;
      if (setting.id === "header_bant") existingDb.headerBant = setting.value;
      if (setting.id === "header_menu") existingDb.headerMenus = setting.value;
      if (setting.id === "home_seo") existingDb.homeSeo = setting.value;
      if (setting.id === "faqs") existingDb.faqs = setting.value;
    });
    console.log("Synced site_settings from Supabase!");
  }

  // Write updated db.json
  fs.writeFileSync(dbPath, JSON.stringify(existingDb, null, 2), "utf-8");

  // Write updated initial-db.ts for instant SSR hydration
  const tsContent = `export const initialDbData: any = ${JSON.stringify(existingDb, null, 2)};\n`;
  fs.writeFileSync(initialDbTsPath, tsContent, "utf-8");

  console.log("Successfully synchronized db.json and initial-db.ts with live Supabase!");
}

syncAll();
