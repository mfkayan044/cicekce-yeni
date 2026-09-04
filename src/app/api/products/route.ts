import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

export async function GET() {
  try {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      const db = readDb();
      return NextResponse.json(db.products || []);
    }

    const formatted = (data || []).map((p: any) => ({
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
      featured: p.featured === true,
      description: p.description
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    const db = readDb();
    return NextResponse.json(db.products || []);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. BULK PRICE UPDATE ENGINE (ZAM & İNDİRİM MOTORU)
    if (body.action === "bulk_price") {
      const { category, changeType, value } = body;
      const numValue = parseFloat(value) || 0;

      // Fetch products from Supabase
      const { data: dbProducts } = await supabase.from("products").select("*");
      const dbObj = readDb();
      let productsList = (dbProducts && dbProducts.length > 0) ? dbProducts : (dbObj.products || []);

      let updatedCount = 0;
      const updatedProducts = productsList.map((p: any) => {
        const catName = p.category || "";
        const matchesCat = (!category || category === "Tüm Ürünler" || category === "Tüm Katalog")
          || catName.toLowerCase().includes(category.toLowerCase());

        if (matchesCat) {
          const currentPriceNum = parsePriceNumber(p.price);
          let newPriceNum = currentPriceNum;

          if (changeType === "percent") {
            newPriceNum = currentPriceNum * (1 + numValue / 100);
          } else if (changeType === "percent_discount") {
            newPriceNum = currentPriceNum * (1 - numValue / 100);
          } else if (changeType === "fixed") {
            newPriceNum = currentPriceNum + numValue;
          }

          newPriceNum = Math.max(0, Math.round(newPriceNum));
          const newPriceStr = formatPriceTL(newPriceNum);
          const oldPriceStr = formatPriceTL(currentPriceNum);

          updatedCount++;
          return {
            ...p,
            price: newPriceStr,
            old_price: oldPriceStr,
            oldPrice: oldPriceStr
          };
        }
        return p;
      });

      // Update in Supabase
      try {
        const supabaseUpsertPayload = updatedProducts.map((p: any) => ({
          id: p.id,
          title: p.title || "Çiçek",
          price: p.price,
          old_price: p.old_price || p.oldPrice,
          category: p.category || "Genel"
        }));
        await supabase.from("products").upsert(supabaseUpsertPayload, { onConflict: "id" });
      } catch (sbErr) {}

      // Sync to db.json and initial-db.ts
      dbObj.products = updatedProducts.map((p: any) => ({
        id: p.id,
        slug: p.slug || String(p.id),
        title: p.title,
        price: p.price,
        oldPrice: p.old_price || p.oldPrice,
        category: p.category,
        image: p.image,
        code: p.code || "DM10",
        stock: p.stock !== false,
        featured: p.featured === true
      }));
      writeDbAndTs(dbObj);

      return NextResponse.json({
        success: true,
        count: updatedCount,
        message: `${updatedCount} üründe fiyat güncellemesi başarıyla uygulandı.`
      });
    }

    // 2. SINGLE PRODUCT ADD / UPDATE
    const newProduct = {
      id: body.id || String(Date.now()),
      slug: body.slug || (body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "urun"),
      title: body.title || "Yeni Ürün",
      category: body.category || "Genel",
      category_slug: body.categorySlug || body.category_slug,
      price: String(body.price || "0 ₺"),
      old_price: body.oldPrice || body.old_price,
      discount: body.discount,
      image: body.image,
      code: body.code || "DM" + Math.floor(10 + Math.random() * 89),
      stock: body.stock !== false,
      featured: body.featured === true,
      description: body.description
    };

    const { data, error } = await supabase.from("products").upsert(newProduct, { onConflict: "id" }).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process product request" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await isRequestAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product from Supabase" }, { status: 500 });
  }
}
