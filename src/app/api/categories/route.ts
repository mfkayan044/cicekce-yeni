import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isRequestAuthorized } from "@/lib/auth";

let cachedCategories: any[] | null = null;
let cachedCategoriesTime = 0;
const CACHE_TTL_MS = 60 * 1000;

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedCategories && now - cachedCategoriesTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedCategories, { headers: cacheHeaders });
    }

    const data = await sql`SELECT * FROM categories ORDER BY display_order ASC`;

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      order: c.display_order || c.order || 0
    }));

    cachedCategories = formatted;
    cachedCategoriesTime = Date.now();
    return NextResponse.json(formatted, { headers: cacheHeaders });
  } catch (error) {
    return NextResponse.json([], { headers: cacheHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await isRequestAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 401 });
    }

    const body = await request.json();
    const newCategory = {
      id: body.id || String(Date.now()),
      name: body.name,
      slug: body.slug || (body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "kategori"),
      image: body.image,
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
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authorized = await isRequestAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (updateFields.name) {
      await sql`UPDATE categories SET name = ${updateFields.name} WHERE id = ${String(id)}`;
    }
    if (updateFields.slug) {
      await sql`UPDATE categories SET slug = ${updateFields.slug} WHERE id = ${String(id)}`;
    }
    if (updateFields.image) {
      await sql`UPDATE categories SET image = ${updateFields.image} WHERE id = ${String(id)}`;
    }
    if (updateFields.order !== undefined || updateFields.display_order !== undefined) {
      const ord = updateFields.order !== undefined ? updateFields.order : updateFields.display_order;
      await sql`UPDATE categories SET display_order = ${ord} WHERE id = ${String(id)}`;
    }

    cachedCategories = null;
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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
    if (id) {
      await sql`DELETE FROM categories WHERE id = ${String(id)}`;
    }

    cachedCategories = null;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
