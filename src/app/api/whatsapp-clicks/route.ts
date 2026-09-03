import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function getDb() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { whatsappClicks: [] };
  }
}

function saveDb(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.whatsappClicks || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();
    if (!db.whatsappClicks) db.whatsappClicks = [];

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newClick = {
      id: Date.now(),
      date: formattedDate,
      type: body.type || "Ürün Sayfası",
      product: body.product || "Çiçek Buketi",
      button: body.button || "WhatsApp İle Sipariş Ver",
      page: body.page || "/",
      ip: body.ip || "127.0.0.1",
      device: body.device || "Masaüstü (Chrome)",
      lang: "TR"
    };

    db.whatsappClicks.unshift(newClick);
    saveDb(db);
    return NextResponse.json({ success: true, click: newClick }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save click" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const db = getDb();
    
    if (id === "all") {
      db.whatsappClicks = [];
    } else if (id && db.whatsappClicks) {
      db.whatsappClicks = db.whatsappClicks.filter((c: any) => String(c.id) !== id);
    }
    saveDb(db);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
