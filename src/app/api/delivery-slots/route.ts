import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.from("delivery_slots").select("*").order("created_at", { ascending: true });
    if (error) throw error;

    const formatted = (data || []).map((s: any) => ({
      id: s.id,
      slot: s.slot,
      range: s.range,
      extraFee: Number(s.extra_fee || 0),
      sameDayCutoff: s.same_day_cutoff || s.cutoff,
      active: s.active !== false
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch delivery slots from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSlot = {
      id: body.id || String(Date.now()),
      slot: body.slot || body.range,
      range: body.range || body.slot,
      extra_fee: Number(body.extraFee || 0),
      same_day_cutoff: body.sameDayCutoff || body.cutoff || "20:00",
      active: body.active !== false
    };

    const { data, error } = await supabase.from("delivery_slots").upsert(newSlot, { onConflict: "id" }).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save delivery slot to Supabase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { error } = await supabase.from("delivery_slots").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete delivery slot from Supabase" }, { status: 500 });
  }
}
