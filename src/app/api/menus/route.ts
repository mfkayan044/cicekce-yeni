import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultMenus = [{'id': '1', 'title': 'Gül Buketleri', 'url': '/kategori/buketler', 'order': 1, 'active': true}, {'id': '2', 'title': 'Saksı Çiçekleri', 'url': '/kategori/saksi-cicekleri', 'order': 2, 'active': true}, {'id': '3', 'title': 'Mevsim Çiçekleri', 'url': '/kategori/mevsim-cicekleri', 'order': 3, 'active': true}, {'id': '4', 'title': 'Geçmiş Olsun', 'url': '/kategori/gecmis-olsun', 'order': 4, 'active': true}, {'id': '5', 'title': 'Yıl Dönümü Çiçekleri', 'url': '/kategori/yil-donumu', 'order': 5, 'active': true}, {'id': '6', 'title': 'Açılış & Tören', 'url': '/kategori/acilis-cicekleri', 'order': 6, 'active': true}];

function getLocalMenus() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      if (db.headerMenus && Array.isArray(db.headerMenus)) return db.headerMenus;
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
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", "header_menu").single();
    if (!error && data && data.value) {
      return NextResponse.json(data.value);
    }
  } catch (error) {}

  const localData = getLocalMenus();
  return NextResponse.json(localData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    saveLocalMenus(body);
    try {
      await supabase.from("site_settings").upsert({ id: "header_menu", value: body }, { onConflict: "id" });
    } catch (e) {}
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save header menus" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalMenus(body);
    try {
      await supabase.from("site_settings").upsert({ id: "header_menu", value: body }, { onConflict: "id" });
    } catch (e) {}
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update header menus" }, { status: 500 });
  }
}
