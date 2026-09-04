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
    // Read directly from db.json to guarantee 100% SSR & Client hydration parity
    const db = readDb();
    let productsList = db.products || [];

    // Try syncing Supabase if available
    try {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (data && data.length > 0) {
        // If Supabase data matches our IDs, use Supabase prices if updated
        const dbMap = new Map(productsList.map((p: any) => [String(p.id), p]));
        const merged = data.map((sbP: any) => {
          const localP: any = dbMap.get(String(sbP.id)) || {};
          return {
            id: String(sbP.id),
            slug: sbP.slug || localP.slug || String(sbP.id),
            title: sbP.title || localP.title,
            category: sbP.category || localP.category || "Genel",
            categorySlug: sbP.category_slug || localP.categorySlug || "cicekler",
            price: localP.price || sbP.price,
            oldPrice: localP.oldPrice || sbP.old_price,
            discount: localP.discount || sbP.discount,
            image: sbP.image || localP.image,
            code: sbP.code || localP.code || `DM${sbP.id}`,
            stock: sbP.stock !== false && localP.stock !== false,
            featured: sbP.featured === true || localP.featured === true,
            description: sbP.description || localP.description
          };
        });
        if (merged.length > 0) return NextResponse.json(merged);
      }
    } catch (sbErr) {}

    return NextResponse.json(productsList);
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
            // Zam (Price Increase) -> Clear oldPrice & discount!
            newPriceNum = Math.round(currentPriceNum * (1 + numValue / 100));
            newPriceStr = formatPriceTL(newPriceNum);
            oldPriceStr = undefined;
            discountStr = undefined;
          } else if (changeType === "percent_discount") {
            // İndirim (Discount) -> Set oldPrice to higher original price!
            newPriceNum = Math.round(currentPriceNum * (1 - numValue / 100));
            newPriceStr = formatPriceTL(newPriceNum);
            oldPriceStr = formatPriceTL(currentPriceNum);
            discountStr = `-%${numValue}`;
          } else if (changeType === "fixed") {
            // Sabit Artış (Fixed Increase)
            newPriceNum = Math.round(currentPriceNum + numValue);
            newPriceStr = formatPriceTL(newPriceNum);
            oldPriceStr = undefined;
            discountStr = undefined;
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

      // Synchronously write to db.json and initial-db.ts (Prevents client hydration reversion!)
      dbObj.products = updatedProducts;
      writeDbAndTs(dbObj);

      // Also upsert to Supabase
      try {
        const supabaseUpsertPayload = updatedProducts.map((p: any) => ({
          id: String(p.id),
          title: p.title || "Çiçek",
          price: p.price,
          old_price: p.oldPrice || null,
          category: p.category || "Genel"
        }));
        await supabase.from("products").upsert(supabaseUpsertPayload, { onConflict: "id" });
      } catch (sbErr) {}

      return NextResponse.json({
        success: true,
        count: updatedCount,
        message: `${updatedCount} üründe fiyat güncellemesi başarıyla uygulandı.`
      });
    }

    // 2. SINGLE PRODUCT ADD / UPDATE
    const dbObj = readDb();
    let productsList = dbObj.products || [];

    const newProduct = {
      id: body.id || String(Date.now()),
      slug: body.slug || (body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "urun"),
      title: body.title || "Yeni Ürün",
      category: body.category || "Genel",
      categorySlug: body.categorySlug || body.category_slug || "cicekler",
      price: String(body.price || "0 ₺"),
      oldPrice: body.oldPrice || body.old_price,
      discount: body.discount,
      image: body.image,
      code: body.code || "DM" + Math.floor(10 + Math.random() * 89),
      stock: body.stock !== false,
      featured: body.featured === true,
      description: body.description
    };

    const existingIdx = productsList.findIndex((p: any) => String(p.id) === String(newProduct.id));
    if (existingIdx >= 0) {
      productsList[existingIdx] = { ...productsList[existingIdx], ...newProduct };
    } else {
      productsList.unshift(newProduct);
    }

    dbObj.products = productsList;
    writeDbAndTs(dbObj);

    try {
      await supabase.from("products").upsert({
        id: String(newProduct.id),
        title: newProduct.title,
        price: newProduct.price,
        category: newProduct.category
      }, { onConflict: "id" });
    } catch (sbErr) {}

    return NextResponse.json(newProduct, { status: 201 });
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
    const dbObj = readDb();
    dbObj.products = (dbObj.products || []).filter((p: any) => String(p.id) !== String(id));
    writeDbAndTs(dbObj);

    try {
      await supabase.from("products").delete().eq("id", id);
    } catch (sbErr) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
