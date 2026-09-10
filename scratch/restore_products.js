const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = "postgresql://neondb_owner:npg_zhlvHLFGVA76@ep-plain-mode-b2fq4008-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

const authenticProducts = [
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
    price: "1.650 ₺",
    oldPrice: "1.850 ₺",
    discount: "-%10",
    image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788942512545-18e5edd5.jpg",
    code: "DM96",
    stock: true,
    featured: true,
    description: "Özenle seçilmiş 11 adet taze kırmızı gül ve zarif hüsnüyusuf çiçekleri ile hazırlanan şık buket aranjmanı."
  },
  {
    id: "1788963499992",
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
    image: "/uploads/1788341846338-pembe-dusler_n.jpg",
    code: "DM41",
    stock: true,
    featured: true,
    description: "Seramik beyaz saksı içerisinde 2 dal canlı ve bol tomurcuklu mor phalaenopsis orkide."
  },
  {
    id: "1788967143719",
    slug: "7-kirmizi-gul-ve-beyaz-bicme-buketi",
    title: "7 Kırmızı Gül ve Beyaz Biçme Buketi",
    category: "Güller",
    categorySlug: "guller",
    selectedCategorySlugs: ["guller", "cicekler", "buketler"],
    designType: "Buket",
    recipient: "Sevgiliye",
    purpose: "Yıl dönümü",
    color: "Kırmızı",
    price: "2.200 ₺",
    oldPrice: "2.500 ₺",
    discount: "-%12",
    image: "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-beyaz-bicme-179-v2.webp",
    code: "DM51",
    stock: true,
    featured: true,
    description: "7 taze ithal kırmızı gül ve ambalajında garnitür beyaz biçme çiçekleri."
  },
  {
    id: "1788962068470",
    slug: "35-beyaz-gerbera-buketi",
    title: "35 Beyaz Gerbera Buketi",
    category: "Gerbera",
    categorySlug: "gerbera",
    selectedCategorySlugs: ["gerbera", "cicekler", "buketler"],
    designType: "Buket",
    recipient: "Arkadaşa",
    purpose: "Tebrik",
    color: "Beyaz",
    price: "1.375 ₺",
    oldPrice: null,
    discount: null,
    image: "https://demo.procicek.com.tr/urunler/35-beyaz-gerbera-buketi-119-v2.webp",
    code: "DM81",
    stock: true,
    featured: true,
    description: "Bembeyaz 35 adet taze gerbera çiçeğinden oluşan ihtişamlı tasarım buket."
  },
  {
    id: "1788961701864",
    slug: "7-kirmizi-gul-ve-papatyalar",
    title: "7 Kırmızı Gül ve Papatya Aranjmanı",
    category: "Aranjmanlar",
    categorySlug: "aranjmanlar",
    selectedCategorySlugs: ["aranjmanlar", "guller", "cicekler"],
    designType: "Vazo",
    recipient: "Sevgiliye",
    purpose: "İçimden Geldi",
    color: "Kırmızı",
    price: "1.650 ₺",
    oldPrice: null,
    discount: null,
    image: "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-papatyalar-56-v2.webp",
    code: "DM88",
    stock: true,
    featured: true,
    description: "7 kırmızı tutkulu gül ve kır papatyalarının mükemmel renk uyumu."
  },
  {
    id: "1788946026121",
    slug: "beyaz-lisianthus-ve-krizantem-buketi",
    title: "Beyaz Lisianthus ve Krizantem Buketi",
    category: "Buketler",
    categorySlug: "buketler",
    selectedCategorySlugs: ["buketler", "cicekler"],
    designType: "Buket",
    recipient: "Tüm Sevdiklerinize",
    purpose: "Geçmiş Olsun",
    color: "Beyaz",
    price: "1.100 ₺",
    oldPrice: "1.350 ₺",
    discount: "-%18",
    image: "/uploads/1788341890097-siyah-buket-kagitta-11-beyaz-gul_temizlendi.jpg",
    code: "DM83",
    stock: true,
    featured: true,
    description: "Zarif beyaz lisianthus ve taze krizantemlerle hazırlanan modern buket."
  },
  {
    id: "5",
    slug: "15-karisik-renk-gul-buketi",
    title: "15 Karışık Renk Gül Buketi",
    category: "Güller",
    categorySlug: "guller",
    selectedCategorySlugs: ["guller", "cicekler", "buketler"],
    designType: "Buket",
    recipient: "Sevgiliye",
    purpose: "Doğum Günü",
    color: "Pembe",
    price: "3.783 ₺",
    oldPrice: null,
    discount: null,
    image: "https://demo.procicek.com.tr/urunler/15-karisik-renk-gul-buketi-96-v2.webp",
    code: "DM13",
    stock: true,
    featured: true,
    description: "Rengarenk 15 adet taze gül ve yeşilliklerle hazırlanmış enerji dolu buket."
  },
  {
    id: "6",
    slug: "51-kirmizi-beyaz-gulden-buket",
    title: "51 Kırmızı Beyaz Gülden İhtişam Buketi",
    category: "Güller",
    categorySlug: "guller",
    selectedCategorySlugs: ["guller", "cicekler", "buketler"],
    designType: "Buket",
    recipient: "Sevgiliye",
    purpose: "Evlilik Teklifi",
    color: "Kırmızı",
    price: "4.421 ₺",
    oldPrice: "4.900 ₺",
    discount: "-%10",
    image: "https://demo.procicek.com.tr/urunler/51-kirmizi-beyaz-gulden-buket-12-v2.webp",
    code: "DM30",
    stock: true,
    featured: true,
    description: "51 adet birinci sınıf kırmızı ve beyaz güllerin birleşimi ile dev boy elit buket."
  }
];

async function restore() {
  console.log("Restoring products to Neon DB & db.json...");

  // 1. Delete all corrupted products (title = 'Yeni Ürün' or title IS NULL)
  try {
    await sql`DELETE FROM products WHERE title = 'Yeni Ürün' OR title IS NULL`;
    console.log("Cleaned up corrupted 'Yeni Ürün' entries from Neon DB.");
  } catch (e) {
    console.error("Neon delete error:", e);
  }

  // 2. Upsert authentic products into Neon DB
  for (const p of authenticProducts) {
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
      console.log(`Upserted to Neon: ${p.title} (${p.code})`);
    } catch (e) {
      console.error(`Error upserting product ${p.id}:`, e);
    }
  }

  // 3. Update local db.json and initial-db.ts
  const dbPath = path.join(process.cwd(), "src", "data", "db.json");
  const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

  let db = {};
  if (fs.existsSync(dbPath)) {
    try { db = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) {}
  }

  db.products = authenticProducts;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");

  const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
  fs.writeFileSync(initialTsPath, tsCode, "utf-8");

  console.log("Successfully restored products to Neon DB, db.json and initial-db.ts!");
}

restore();
