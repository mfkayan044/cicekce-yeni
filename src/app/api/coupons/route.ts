import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function getDb() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { coupons: [] };
  }
}

function saveDb(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.coupons || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();
    if (!db.coupons) db.coupons = [];

    const newCoupon = {
      id: body.id || String(Date.now()),
      code: body.code ? body.code.toUpperCase().trim() : "KUPON10",
      discount: body.discount || "100 ₺",
      minCart: body.minCart || "500 ₺",
      usage: body.usage || "0 / 100",
      active: body.active !== undefined ? body.active : true,
    };

    db.coupons.unshift(newCoupon);
    saveDb(db);
    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save coupon" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const db = getDb();
    if (db.coupons) {
      db.coupons = db.coupons.filter((c: any) => String(c.id) !== String(id));
      saveDb(db);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
