import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (error) throw error;

    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      product: r.product,
      author: r.author,
      rating: Number(r.rating || 5),
      text: r.text,
      status: r.status,
      isGoogle: r.is_google === true,
      source: r.source || "Web"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reviews from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newReview = {
      id: body.id || String(Date.now()),
      product: body.product || "Çiçek Buketi",
      author: body.author,
      rating: Number(body.rating || 5),
      text: body.text,
      status: body.status || "Onaylandı",
      is_google: body.isGoogle === true || body.is_google === true,
      source: body.source || (body.isGoogle ? "Google Maps" : "Web Site")
    };

    const { data, error } = await supabase.from("reviews").upsert(newReview, { onConflict: "id" }).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save review to Supabase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete review from Supabase" }, { status: 500 });
  }
}
