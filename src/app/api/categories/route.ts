import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

let cachedCategories: any[] | null = null;
let cachedCategoriesTime = 0;
const CACHE_TTL_MS = 10 * 1000; // 10s short cache

const cacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedCategories && now - cachedCategoriesTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedCategories, { headers: cacheHeaders });
    }

    const data = await sql`SELECT * FROM categories ORDER BY display_order ASC, id ASC`;

    const formatted = (data || []).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug,
      image: c.image || "",
      order: c.display_order !== undefined ? c.display_order : (c.order || 0)
    }));

    cachedCategories = formatted;
    cachedCategoriesTime = Date.now();
    return NextResponse.json(formatted, { headers: cacheHeaders });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json([], { headers: cacheHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCategory = {
      id: body.id ? String(body.id) : String(Date.now()),
      name: body.name || "Yeni Kategori",
      slug: body.slug || (body.name ? body.name.toLowerCase().replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g, "-") : "kategori"),
      image: body.image || "",
      display_order: body.order !== undefined ? body.order : (body.display_order || 0)
    };

    await sql`
      INSERT INTO categories (id, name, slug, image, display_order)
      VALUES (${newCategory.id}, ${newCategory.name}, ${newCategory.slug}, ${newCategory.image || null}, ${newCategory.display_order})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        image = EXCLUDED.image,
        display_order = EXCLUDED.display_order;
    `;

    cachedCategories = null;
    cachedCategoriesTime = 0;
    return NextResponse.json(newCategory, { status: 201, headers: cacheHeaders });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500, headers: cacheHeaders });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing category id" }, { status: 400, headers: cacheHeaders });
    }

    if (updateFields.name) {
      const slugVal = updateFields.slug || updateFields.name.toLowerCase().replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g, "-");
      await sql`UPDATE categories SET name = ${updateFields.name}, slug = ${slugVal} WHERE id = ${String(id)}`;
    } else if (updateFields.slug) {
      await sql`UPDATE categories SET slug = ${updateFields.slug} WHERE id = ${String(id)}`;
    }

    if (updateFields.image !== undefined) {
      await sql`UPDATE categories SET image = ${updateFields.image} WHERE id = ${String(id)}`;
    }
    if (updateFields.order !== undefined || updateFields.display_order !== undefined) {
      const ord = updateFields.order !== undefined ? updateFields.order : updateFields.display_order;
      await sql`UPDATE categories SET display_order = ${ord} WHERE id = ${String(id)}`;
    }

    cachedCategories = null;
    cachedCategoriesTime = 0;
    return NextResponse.json({ success: true, id }, { headers: cacheHeaders });
  } catch (error) {
    console.error("PUT /api/categories error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500, headers: cacheHeaders });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      await sql`DELETE FROM categories WHERE id = ${String(id)}`;
    }

    cachedCategories = null;
    cachedCategoriesTime = 0;
    return NextResponse.json({ success: true }, { headers: cacheHeaders });
  } catch (error) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500, headers: cacheHeaders });
  }
}
