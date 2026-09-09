const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = "postgresql://neondb_owner:npg_zhlvHLFGVA76@ep-plain-mode-b2fq4008-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function main() {
  console.log("🚀 Initializing Neon PostgreSQL Database Tables...");

  // 1. Create Tables
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      image TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT NOT NULL,
      category TEXT,
      category_slug TEXT,
      selected_category_slugs JSONB,
      design_type TEXT,
      recipient TEXT,
      purpose TEXT,
      color TEXT,
      price TEXT NOT NULL,
      old_price TEXT,
      discount TEXT,
      image TEXT,
      code TEXT,
      stock BOOLEAN DEFAULT TRUE,
      featured BOOLEAN DEFAULT FALSE,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS selected_category_slugs JSONB;`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS design_type TEXT;`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS recipient TEXT;`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS purpose TEXT;`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;`;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      recipient_name TEXT,
      recipient_phone TEXT,
      city TEXT,
      district TEXT,
      address TEXT,
      delivery_date TEXT,
      delivery_slot TEXT,
      card_note TEXT,
      total_amount NUMERIC,
      status TEXT DEFAULT 'Beklemede',
      payment_method TEXT,
      payment_status TEXT,
      items JSONB,
      courier_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      rating INT DEFAULT 5,
      comment TEXT NOT NULL,
      product_title TEXT,
      date TEXT,
      status TEXT DEFAULT 'Onaylandı',
      image TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS card_notes (
      id TEXT PRIMARY KEY,
      category TEXT,
      text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS extras (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC DEFAULT 0,
      image TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS delivery_slots (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'Aktif',
      display_order INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log("✅ Tables Created Successfully!");

  // 2. Load Local db.json
  const dbPath = path.join(process.cwd(), "src", "data", "db.json");
  if (!fs.existsSync(dbPath)) {
    console.log("⚠️ db.json not found, skipping data seed.");
    return;
  }

  const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

  // 3. Seed Categories
  if (Array.isArray(db.categories) && db.categories.length > 0) {
    console.log(`📦 Seeding ${db.categories.length} Categories...`);
    for (const c of db.categories) {
      await sql`
        INSERT INTO categories (id, name, slug, image, display_order)
        VALUES (${String(c.id)}, ${c.name}, ${c.slug || "kategori"}, ${c.image || null}, ${c.order || c.display_order || 0})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          image = EXCLUDED.image,
          display_order = EXCLUDED.display_order;
      `;
    }
  }

  // 4. Seed Products
  if (Array.isArray(db.products) && db.products.length > 0) {
    console.log(`🌸 Seeding ${db.products.length} Products...`);
    for (const p of db.products) {
      const selectedSlugs = JSON.stringify(p.selectedCategorySlugs || [p.categorySlug || p.category_slug || "cicekler"]);
      await sql`
        INSERT INTO products (
          id, slug, title, category, category_slug, selected_category_slugs,
          design_type, recipient, purpose, color,
          price, old_price, discount, image, code, stock, featured, description
        )
        VALUES (
          ${String(p.id)},
          ${p.slug || String(p.id)},
          ${p.title || "Çiçek"},
          ${p.category || "Genel"},
          ${p.categorySlug || p.category_slug || "cicekler"},
          ${selectedSlugs},
          ${p.designType || null},
          ${p.recipient || null},
          ${p.purpose || null},
          ${p.color || null},
          ${String(p.price || "0 ₺")},
          ${p.oldPrice || p.old_price || null},
          ${p.discount || null},
          ${p.image || null},
          ${p.code || `DM${p.id}`},
          ${p.stock !== false},
          ${p.featured === true},
          ${p.description || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          category_slug = EXCLUDED.category_slug,
          selected_category_slugs = EXCLUDED.selected_category_slugs,
          design_type = EXCLUDED.design_type,
          recipient = EXCLUDED.recipient,
          purpose = EXCLUDED.purpose,
          color = EXCLUDED.color,
          price = EXCLUDED.price,
          old_price = EXCLUDED.old_price,
          discount = EXCLUDED.discount,
          image = EXCLUDED.image,
          code = EXCLUDED.code,
          stock = EXCLUDED.stock,
          featured = EXCLUDED.featured,
          description = EXCLUDED.description;
      `;
    }
  }

  // 5. Seed Orders
  if (Array.isArray(db.orders) && db.orders.length > 0) {
    console.log(`📦 Seeding ${db.orders.length} Orders...`);
    for (const o of db.orders) {
      await sql`
        INSERT INTO orders (id, order_no, customer_name, customer_phone, customer_email, recipient_name, recipient_phone, city, district, address, delivery_date, delivery_slot, card_note, total_amount, status, payment_method, payment_status, items, courier_name)
        VALUES (
          ${String(o.id)},
          ${o.orderNo || o.order_no || String(o.id)},
          ${o.customerName || o.customer_name || null},
          ${o.customerPhone || o.customer_phone || null},
          ${o.customerEmail || o.customer_email || null},
          ${o.recipientName || o.recipient_name || null},
          ${o.recipientPhone || o.recipient_phone || null},
          ${o.city || null},
          ${o.district || null},
          ${o.address || null},
          ${o.deliveryDate || o.delivery_date || null},
          ${o.deliverySlot || o.delivery_slot || null},
          ${o.cardNote || o.card_note || null},
          ${typeof o.totalAmount === "number" ? o.totalAmount : (parseFloat(o.totalAmount) || 0)},
          ${o.status || "Beklemede"},
          ${o.paymentMethod || o.payment_method || null},
          ${o.paymentStatus || o.payment_status || null},
          ${JSON.stringify(o.items || [])},
          ${o.courierName || o.courier_name || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          total_amount = EXCLUDED.total_amount;
      `;
    }
  }

  // 6. Seed Site Settings (FAQS, Menus, Hero, etc.)
  console.log("⚙️ Seeding Site Settings...");
  if (db.faqs) {
    await sql`
      INSERT INTO site_settings (id, value) VALUES ('faqs', ${JSON.stringify(db.faqs)})
      ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;
    `;
  }
  if (db.headerMenu) {
    await sql`
      INSERT INTO site_settings (id, value) VALUES ('header_menu', ${JSON.stringify(db.headerMenu)})
      ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;
    `;
  }
  if (db.hero) {
    await sql`
      INSERT INTO site_settings (id, value) VALUES ('hero', ${JSON.stringify(db.hero)})
      ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;
    `;
  }

  console.log("🎉 ALL DATA MIGRATED TO NEON POSTGRESQL SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("❌ Neon Migration Failed:", err);
  process.exit(1);
});
