import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`SELECT * FROM extras ORDER BY display_order ASC`;

    const formatted = (data || []).map((e: any) => ({
      id: String(e.id),
      order: e.display_order || e.order || 0,
      active: e.active !== false,
      image: e.image,
      price: e.price,
      names: { tr: e.name || "Ek Hediye" },
      name: e.name || "Ek Hediye"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const extraId = String(body.id || Date.now());
    const name = body.name || body.names?.tr || "Ek Hediye";
    const price = typeof body.price === "number" ? body.price : (parseFloat(body.price) || 0);
    const image = body.image || "";
    const displayOrder = body.order || body.display_order || 0;

    await sql`
      INSERT INTO extras (id, name, price, image, display_order)
      VALUES (${extraId}, ${name}, ${price}, ${image}, ${displayOrder})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        image = EXCLUDED.image,
        display_order = EXCLUDED.display_order;
    `;

    return NextResponse.json({ id: extraId, name, price, image, order: displayOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save extra" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      await sql`DELETE FROM extras WHERE id = ${String(id)}`;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete extra" }, { status: 500 });
  }
}
