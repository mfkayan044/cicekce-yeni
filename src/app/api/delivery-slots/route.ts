import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`SELECT * FROM delivery_slots ORDER BY display_order ASC`;

    const formatted = (data || []).map((s: any) => ({
      id: String(s.id),
      slot: s.title || s.slot || "09:00 - 12:00",
      range: s.title || s.range || "09:00 - 12:00",
      extraFee: 0,
      sameDayCutoff: "20:00",
      active: s.status !== "Pasif"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slotId = String(body.id || Date.now());
    const title = body.slot || body.range || body.title || "09:00 - 12:00";
    const status = body.active !== false ? "Aktif" : "Pasif";

    await sql`
      INSERT INTO delivery_slots (id, title, status)
      VALUES (${slotId}, ${title}, ${status})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        status = EXCLUDED.status;
    `;

    return NextResponse.json({ id: slotId, slot: title, range: title, active: status === "Aktif" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save delivery slot" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      await sql`DELETE FROM delivery_slots WHERE id = ${String(id)}`;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete delivery slot" }, { status: 500 });
  }
}
