import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function getDb() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { adVisits: [] };
  }
}

function saveDb(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.adVisits || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();
    if (!db.adVisits) db.adVisits = [];

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newVisit = {
      id: body.id || String(Date.now()),
      date: formattedDate,
      campaign: body.campaign || "Google Ads / cicek_siparis",
      city: body.city || "Antalya",
      device: body.device || "Mobil (Chrome)",
      page: body.page || "/",
      duration: body.duration || "1 dk 20 sn",
      order: body.order || "Sipariş Vermedi"
    };

    db.adVisits.unshift(newVisit);
    saveDb(db);
    return NextResponse.json({ success: true, visit: newVisit }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save visit" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();
    if (db.adVisits && db.adVisits.length > 0) {
      // Update most recent visit to order status
      db.adVisits[0].order = `Sipariş Verdi (#${body.orderNo || 'SIP-2026'})`;
      saveDb(db);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update visit" }, { status: 500 });
  }
}
