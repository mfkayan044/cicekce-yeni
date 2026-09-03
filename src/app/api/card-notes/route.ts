import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase.from("card_notes").select("*").order("created_at", { ascending: false });
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch card notes from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newNote = {
      id: body.id || String(Date.now()),
      category: body.category || "Genel",
      tr: body.tr,
      en: body.en || body.tr,
      status: body.status || "Aktif"
    };

    const { data, error } = await supabase.from("card_notes").upsert(newNote, { onConflict: "id" }).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save card note to Supabase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { error } = await supabase.from("card_notes").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete card note from Supabase" }, { status: 500 });
  }
}
