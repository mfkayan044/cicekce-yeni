import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultMenus = [
  { id: "1", title: "Gül Buketleri", url: "/kategori/guller", order: 1, active: true },
  { id: "1788356766009", title: "Geçmiş Olsun", url: "/kategori/gecmis-olsun", order: 2, active: true },
  { id: "1789052178938", title: "Saksı/Orkide", url: "/kategori/saksi-cicekleri", order: 3, active: true }
];

function getLocalMenus() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      if (db.headerMenus && Array.isArray(db.headerMenus)) return db.headerMenus;
      if (db.header_menu && Array.isArray(db.header_menu)) return db.header_menu;
    }
  } catch (e) {}
  return defaultMenus;
}

function saveLocalMenus(data: any) {
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.headerMenus = data;
    db.header_menu = data;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");

    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  const menus = await getSetting("header_menu", getLocalMenus());
  return NextResponse.json(menus, { headers: noCacheHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    saveLocalMenus(body);
    await setSetting("header_menu", body);
    return NextResponse.json(body, { status: 201, headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save header menus" }, { status: 500, headers: noCacheHeaders });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalMenus(body);
    await setSetting("header_menu", body);
    return NextResponse.json(body, { headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update header menus" }, { status: 500, headers: noCacheHeaders });
  }
}
