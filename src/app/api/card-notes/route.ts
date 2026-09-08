import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let data: any[] = [];
    if (category) {
      data = await sql`SELECT * FROM card_notes WHERE category = ${category} ORDER BY created_at DESC`;
    } else {
      data = await sql`SELECT * FROM card_notes ORDER BY created_at DESC`;
    }

    const formatted = (data || []).map((n: any) => ({
      id: String(n.id),
      category: n.category || "Genel",
      tr: n.text || n.tr || "",
      en: n.en || n.text || n.tr || "",
      status: n.status || "Aktif"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const noteId = String(body.id || Date.now());
    const category = body.category || "Genel";
    const text = body.tr || body.text || "";

    await sql`
      INSERT INTO card_notes (id, category, text)
      VALUES (${noteId}, ${category}, ${text})
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        text = EXCLUDED.text;
    `;

    return NextResponse.json({ id: noteId, category, tr: text, en: text, status: "Aktif" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save card note" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      await sql`DELETE FROM card_notes WHERE id = ${String(id)}`;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete card note" }, { status: 500 });
  }
}
