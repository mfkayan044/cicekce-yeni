import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("extras").select("*").order("display_order", { ascending: true });
    if (error) throw error;

    const formatted = (data || []).map((e: any) => ({
      id: e.id,
      order: e.display_order || e.order || 0,
      active: e.active !== false,
      image: e.image,
      price: e.price,
      names: e.names || { tr: e.name || "Ek Hediye" },
      name: e.names?.tr || e.name || "Ek Hediye"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch extras from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newExtra = {
      id: body.id || String(Date.now()),
      display_order: body.order || body.display_order || 0,
      active: body.active !== false,
      image: body.image,
      price: String(body.price),
      names: body.names || { tr: body.name || "Ek Hediye" }
    };

    const { data, error } = await supabase.from("extras").upsert(newExtra, { onConflict: "id" }).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save extra gift to Supabase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { error } = await supabase.from("extras").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete extra from Supabase" }, { status: 500 });
  }
}
