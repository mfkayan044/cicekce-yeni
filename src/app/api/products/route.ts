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

let cachedProducts: any[] | null = null;
let cachedProductsTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
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
            slug: sbP.slug || String(sbP.id),
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
            description: sbP.description
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

    const catSlug = body.categorySlug || body.category_slug || "cicekler";
    const selCategorySlugs = body.selectedCategorySlugs && Array.isArray(body.selectedCategorySlugs) && body.selectedCategorySlugs.length > 0
      ? body.selectedCategorySlugs
      : [catSlug];

    const newProduct = {
      id: body.id || String(Date.now()),
      slug: body.slug || (body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "urun"),
      title: body.title || "Yeni Ürün",
      category: body.category || "Genel",
      categorySlug: catSlug,
      selectedCategorySlugs: selCategorySlugs,
      designType: body.designType || null,
      recipient: body.recipient || null,
      purpose: body.purpose || null,
      color: body.color || null,
      price: String(body.price || "0 ₺"),
      oldPrice: body.oldPrice || body.old_price || null,
      discount: body.discount || null,
      image: body.image || null,
      code: body.code || "DM" + Math.floor(10 + Math.random() * 89),
      stock: body.stock !== false,
      featured: body.featured === true,
      description: body.description || null
    };

    const existingIdx = productsList.findIndex((p: any) => String(p.id) === String(newProduct.id));
    if (existingIdx >= 0) {
      productsList[existingIdx] = { ...productsList[existingIdx], ...body, ...newProduct };
    } else {
      productsList.unshift(newProduct);
    }

    dbObj.products = productsList;
    writeDbAndTs(dbObj);
    cachedProducts = null;

    try {
      await sql`
        INSERT INTO products (
          id, slug, title, category, category_slug, selected_category_slugs,
          design_type, recipient, purpose, color,
          price, old_price, discount, image, code, stock, featured, description
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
          ${newProduct.description}
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
