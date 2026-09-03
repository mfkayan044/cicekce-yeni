import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function getDb() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { redirects: [] };
  }
}

function saveDb(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.redirects || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();
    if (!db.redirects) db.redirects = [];

    const newRecord = {
      id: body.id || String(Date.now()),
      source: body.source || "/eski-sayfa",
      target: body.target || "/yeni-sayfa",
      type: body.type || "301 Kalıcı",
      clicks: body.clicks || 0,
      active: body.active !== undefined ? body.active : true,
    };

    db.redirects.unshift(newRecord);
    saveDb(db);
    return NextResponse.json({ success: true, redirect: newRecord }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save redirect" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const db = getDb();
    if (db.redirects) {
      db.redirects = db.redirects.filter((r: any) => String(r.id) !== String(id));
      saveDb(db);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete redirect" }, { status: 500 });
  }
}
