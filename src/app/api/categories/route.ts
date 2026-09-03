import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isRequestAuthorized } from "@/lib/auth";

export async function GET() {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
    if (error) throw error;

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      order: c.display_order || c.order || 0
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories from Supabase" }, { status: 500 });
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

    const { data, error } = await supabase.from("categories").upsert(newCategory, { onConflict: "id" }).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save category to Supabase" }, { status: 500 });
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

    const updatePayload: any = {};
    if (updateFields.name !== undefined) updatePayload.name = updateFields.name;
    if (updateFields.slug !== undefined) updatePayload.slug = updateFields.slug;
    if (updateFields.image !== undefined) updatePayload.image = updateFields.image;
    if (updateFields.order !== undefined || updateFields.display_order !== undefined) {
      updatePayload.display_order = updateFields.order !== undefined ? updateFields.order : updateFields.display_order;
    }

    const { data, error } = await supabase.from("categories").update(updatePayload).eq("id", id).select().single();
    if (error) {
      const { data: upsertData, error: upsertErr } = await supabase
        .from("categories")
        .upsert({ id, ...updatePayload }, { onConflict: "id" })
        .select()
        .single();
      if (upsertErr) throw upsertErr;
      return NextResponse.json(upsertData);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category in Supabase" }, { status: 500 });
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
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category from Supabase" }, { status: 500 });
  }
}
