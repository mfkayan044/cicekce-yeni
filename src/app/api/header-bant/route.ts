import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultBantData = {'enabled': true, 'text': '🌸 Aynı Gün Adrese Teslimat! 1.500 ₺ Üzeri Ücretsiz Kargo | 💬 WhatsApp ile Hızlı Sipariş', 'promoEnabled': true, 'amount': '100', 'code': 'HOSGELDIN100', 'bgColor': '#2b2623', 'textColor': '#ffffff'};

function getLocalBant() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      if (db.headerBant) return db.headerBant;
    }
  } catch (e) {}
  return defaultBantData;
}

function saveLocalBant(data: any) {
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.headerBant = data;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET() {
  const bantData = await getSetting("header_bant", getLocalBant());
  return NextResponse.json(bantData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    saveLocalBant(body);
    await setSetting("header_bant", body);
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save header bant settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalBant(body);
    await setSetting("header_bant", body);
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update header bant settings" }, { status: 500 });
  }
}
