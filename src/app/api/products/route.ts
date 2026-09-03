import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isRequestAuthorized } from "@/lib/auth";

export async function GET() {
  try {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;

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
    return NextResponse.json({ error: "Failed to fetch products from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await isRequestAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 401 });
    }

    const body = await request.json();
    const newProduct = {
      id: body.id || String(Date.now()),
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: body.title,
      category: body.category || "Genel",
      category_slug: body.categorySlug || body.category_slug,
      price: String(body.price),
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
  } catch (error) {
    return NextResponse.json({ error: "Failed to save product to Supabase" }, { status: 500 });
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
