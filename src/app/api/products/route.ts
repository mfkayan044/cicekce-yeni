import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isRequestAuthorized } from "@/lib/auth";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

function parsePriceNumber(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function formatPriceTL(num: number): string {
  return `${Math.round(num).toLocaleString("tr-TR")} ₺`;
}

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(dbObj: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(dbObj, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(dbObj, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

function slugifyTurkish(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

let cachedProducts: any[] | null = null;
let cachedProductsTime = 0;
const CACHE_TTL_MS = 10 * 1000; // 10s short cache

const cacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedProducts && now - cachedProductsTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedProducts, { headers: cacheHeaders });
    }

    const db = readDb();
    let productsList = (db.products || []).filter(
      (p: any) => p.category !== "SETTINGS" && !String(p.id).startsWith("__SETTING_")
    );

    // Fetch from Neon Postgres
    try {
      const data = await sql`SELECT * FROM products ORDER BY created_at DESC`;
      if (Array.isArray(data)) {
        const merged = data.map((sbP: any) => {
          const fallbackSlug = sbP.category_slug || "cicekler";
          let parsedSlugs = [fallbackSlug];
          if (Array.isArray(sbP.selected_category_slugs)) {
            parsedSlugs = sbP.selected_category_slugs;
          } else if (typeof sbP.selected_category_slugs === "string") {
            try { parsedSlugs = JSON.parse(sbP.selected_category_slugs); } catch (e) {}
          }
          return {
            id: String(sbP.id),
            slug: sbP.slug || slugifyTurkish(sbP.title) || String(sbP.id),
            title: sbP.title,
            category: sbP.category || "Genel",
            categorySlug: fallbackSlug,
            selectedCategorySlugs: parsedSlugs,
            designType: sbP.design_type || undefined,
            recipient: sbP.recipient || undefined,
            purpose: sbP.purpose || undefined,
            color: sbP.color || undefined,
            price: sbP.price,
            oldPrice: sbP.old_price,
            discount: sbP.discount,
            image: sbP.image,
            code: sbP.code || `DM${sbP.id}`,
            stock: sbP.stock !== false,
            featured: sbP.featured === true,
            description: sbP.description,
            seoTitle: sbP.seo_title || sbP.seoTitle || undefined,
            seoDesc: sbP.seo_desc || sbP.seoDesc || undefined,
            seoKeywords: sbP.seo_keywords || sbP.seoKeywords || undefined,
          };
        });
        cachedProducts = merged;
        cachedProductsTime = Date.now();
        return NextResponse.json(merged, { headers: cacheHeaders });
      }
    } catch (neonErr) {}

    cachedProducts = productsList;
    cachedProductsTime = Date.now();
    return NextResponse.json(productsList, { headers: cacheHeaders });
  } catch (error) {
    const db = readDb();
    return NextResponse.json(db.products || [], { headers: cacheHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. BULK PRICE UPDATE ENGINE
    if (body.action === "bulk_price") {
      const { category, changeType, value } = body;
      const numValue = parseFloat(value) || 0;

      const dbObj = readDb();
      let productsList = dbObj.products || [];

      let updatedCount = 0;
      const updatedProducts = productsList.map((p: any) => {
        const catName = p.category || "";
        const matchesCat = (!category || category === "Tüm Ürünler" || category === "Tüm Katalog")
          || catName.toLowerCase().includes(category.toLowerCase());

        if (matchesCat) {
          const currentPriceNum = parsePriceNumber(p.price);
          let newPriceNum = currentPriceNum;

          let newPriceStr = "";
          let oldPriceStr: string | undefined = undefined;
          let discountStr: string | undefined = undefined;

          if (changeType === "percent") {
            newPriceNum = Math.round(currentPriceNum * (1 + numValue / 100));
            newPriceStr = formatPriceTL(newPriceNum);
          } else if (changeType === "percent_discount") {
            newPriceNum = Math.round(currentPriceNum * (1 - numValue / 100));
            newPriceStr = formatPriceTL(newPriceNum);
            oldPriceStr = formatPriceTL(currentPriceNum);
            discountStr = `-%${numValue}`;
          } else if (changeType === "fixed") {
            newPriceNum = Math.round(currentPriceNum + numValue);
            newPriceStr = formatPriceTL(newPriceNum);
          }

          updatedCount++;
          return {
            ...p,
            price: newPriceStr,
            old_price: oldPriceStr,
            oldPrice: oldPriceStr,
            discount: discountStr
          };
        }
        return p;
      });

      dbObj.products = updatedProducts;
      writeDbAndTs(dbObj);
      cachedProducts = null;

      // Upsert to Neon Postgres
      try {
        for (const p of updatedProducts) {
          await sql`
            UPDATE products
            SET price = ${p.price}, old_price = ${p.oldPrice || null}, discount = ${p.discount || null}
            WHERE id = ${String(p.id)};
          `;
        }
      } catch (neonErr) {}

      return NextResponse.json({
        success: true,
        count: updatedCount,
        message: `${updatedCount} üründe fiyat güncellemesi başarıyla uygulandı.`
      });
    }

    // 2. SINGLE PRODUCT ADD / UPDATE
    const dbObj = readDb();
    let productsList = dbObj.products || [];

    // Find existing product in Neon or memory to preserve existing fields
    let existing: any = productsList.find((p: any) => String(p.id) === String(body.id));
    if (body.id) {
      try {
        const dbProduct = await sql`SELECT * FROM products WHERE id = ${String(body.id)}`;
        if (dbProduct && dbProduct[0]) {
          existing = {
            ...existing,
            ...dbProduct[0],
            categorySlug: dbProduct[0].category_slug || dbProduct[0].categorySlug,
            selectedCategorySlugs: dbProduct[0].selected_category_slugs || dbProduct[0].selectedCategorySlugs,
            designType: dbProduct[0].design_type || dbProduct[0].designType,
            oldPrice: dbProduct[0].old_price || dbProduct[0].oldPrice,
          };
        }
      } catch (e) {}
    }

    const title = body.title !== undefined ? body.title : (existing?.title || "Çiçek Buketi");
    const catSlug = body.categorySlug || body.category_slug || existing?.categorySlug || existing?.category_slug || "cicekler";
    let selCategorySlugs = body.selectedCategorySlugs;
    if (!selCategorySlugs || !Array.isArray(selCategorySlugs) || selCategorySlugs.length === 0) {
      selCategorySlugs = existing?.selectedCategorySlugs || [catSlug];
    }

    const newProduct = {
      id: body.id || String(Date.now()),
      slug: body.slug !== undefined ? body.slug : (existing?.slug || slugifyTurkish(title) || String(body.id)),
      title,
      category: body.category !== undefined ? body.category : (existing?.category || "Genel"),
      categorySlug: catSlug,
      selectedCategorySlugs: selCategorySlugs,
      designType: body.designType !== undefined ? body.designType : (existing?.designType || existing?.design_type || null),
      recipient: body.recipient !== undefined ? body.recipient : (existing?.recipient || null),
      purpose: body.purpose !== undefined ? body.purpose : (existing?.purpose || null),
      color: body.color !== undefined ? body.color : (existing?.color || null),
      price: body.price !== undefined ? String(body.price) : String(existing?.price || "0 ₺"),
      oldPrice: body.oldPrice !== undefined ? body.oldPrice : (body.old_price !== undefined ? body.old_price : (existing?.oldPrice || existing?.old_price || null)),
      discount: body.discount !== undefined ? body.discount : (existing?.discount || null),
      image: body.image !== undefined ? body.image : (existing?.image || null),
      code: body.code !== undefined ? body.code : (existing?.code || `DM${body.id || Date.now()}`),
      stock: body.stock !== undefined ? body.stock !== false : (existing?.stock !== false),
      featured: body.featured !== undefined ? body.featured === true : (existing?.featured === true),
      description: body.description !== undefined ? body.description : (existing?.description || null),
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : (body.seo_title !== undefined ? body.seo_title : (existing?.seoTitle || existing?.seo_title || null)),
      seoDesc: body.seoDesc !== undefined ? body.seoDesc : (body.seo_desc !== undefined ? body.seo_desc : (existing?.seoDesc || existing?.seo_desc || null)),
      seoKeywords: body.seoKeywords !== undefined ? body.seoKeywords : (body.seo_keywords !== undefined ? body.seo_keywords : (existing?.seoKeywords || existing?.seo_keywords || null)),
    };

    const existingIdx = productsList.findIndex((p: any) => String(p.id) === String(newProduct.id));
    if (existingIdx >= 0) {
      productsList[existingIdx] = { ...productsList[existingIdx], ...newProduct };
    } else {
      productsList.unshift(newProduct);
    }

    dbObj.products = productsList;
    writeDbAndTs(dbObj);
    cachedProducts = null;

    try {
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_desc TEXT;`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords TEXT;`;

      await sql`
        INSERT INTO products (
          id, slug, title, category, category_slug, selected_category_slugs,
          design_type, recipient, purpose, color,
          price, old_price, discount, image, code, stock, featured, description,
          seo_title, seo_desc, seo_keywords
        )
        VALUES (
          ${String(newProduct.id)},
          ${newProduct.slug},
          ${newProduct.title},
          ${newProduct.category},
          ${newProduct.categorySlug},
          ${JSON.stringify(newProduct.selectedCategorySlugs)},
          ${newProduct.designType},
          ${newProduct.recipient},
          ${newProduct.purpose},
          ${newProduct.color},
          ${newProduct.price},
          ${newProduct.oldPrice},
          ${newProduct.discount},
          ${newProduct.image},
          ${newProduct.code},
          ${newProduct.stock},
          ${newProduct.featured},
          ${newProduct.description},
          ${newProduct.seoTitle},
          ${newProduct.seoDesc},
          ${newProduct.seoKeywords}
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
          description = EXCLUDED.description,
          seo_title = EXCLUDED.seo_title,
          seo_desc = EXCLUDED.seo_desc,
          seo_keywords = EXCLUDED.seo_keywords;
      `;
    } catch (neonErr) {
      console.error("Neon product upsert error:", neonErr);
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ success: true, message: "Processed" }, { status: 200 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const dbObj = readDb();
    dbObj.products = (dbObj.products || []).filter((p: any) => String(p.id) !== String(id));
    writeDbAndTs(dbObj);
    cachedProducts = null;
    cachedProductsTime = 0;

    try {
      await sql`DELETE FROM products WHERE id = ${String(id)}`;
    } catch (neonErr) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
