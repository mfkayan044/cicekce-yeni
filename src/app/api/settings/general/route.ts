import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(genData: any) {
  try {
    const db = readDb();
    db.generalSettings = genData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

async function saveSetting(settingKey: string, value: any) {
  const normalizedValue = {
    ...value,
    mobileCols: value.mobileCols || value.grid_cols_mobile || "2",
    desktopCols: value.desktopCols || value.grid_cols_desktop || "4",
    grid_cols_mobile: value.mobileCols || value.grid_cols_mobile || "2",
    grid_cols_desktop: value.desktopCols || value.grid_cols_desktop || "4",
  };

  try {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: settingKey, value: normalizedValue, updated_at: new Date().toISOString() });
    if (!error) return normalizedValue;
  } catch (e) {}

  try {
    const { error: fbErr } = await supabase.from("products").upsert({
      id: `__SETTING_${settingKey.toUpperCase()}__`,
      title: `SETTING_${settingKey.toUpperCase()}`,
      slug: `__setting_${settingKey.toLowerCase()}__`,
      category: "SETTINGS",
      category_slug: "settings",
      image: "",
      code: "SETTING",
      description: JSON.stringify(normalizedValue),
      price: "0 ₺",
      stock: false
    });
    if (!fbErr) return normalizedValue;
  } catch (e) {}

  return normalizedValue;
}

async function getSetting(settingKey: string) {
  try {
    const { data: d1 } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", settingKey)
      .single();
    if (d1 && d1.value && Object.keys(d1.value).length > 0) {
      return {
        ...d1.value,
        mobileCols: d1.value.mobileCols || d1.value.grid_cols_mobile || "2",
        desktopCols: d1.value.desktopCols || d1.value.grid_cols_desktop || "4",
        grid_cols_mobile: d1.value.mobileCols || d1.value.grid_cols_mobile || "2",
        grid_cols_desktop: d1.value.desktopCols || d1.value.grid_cols_desktop || "4",
      };
    }
  } catch (e) {}

  try {
    const { data: d2 } = await supabase
      .from("products")
      .select("description")
      .eq("id", `__SETTING_${settingKey.toUpperCase()}__`)
      .single();
    if (d2 && d2.description) {
      const parsed = JSON.parse(d2.description);
      return {
        ...parsed,
        mobileCols: parsed.mobileCols || parsed.grid_cols_mobile || "2",
        desktopCols: parsed.desktopCols || parsed.grid_cols_desktop || "4",
        grid_cols_mobile: parsed.mobileCols || parsed.grid_cols_mobile || "2",
        grid_cols_desktop: parsed.desktopCols || parsed.grid_cols_desktop || "4",
      };
    }
  } catch (e) {}

  const db = readDb();
  const local = db.generalSettings || {};
  return {
    ...local,
    mobileCols: local.mobileCols || local.grid_cols_mobile || "2",
    desktopCols: local.desktopCols || local.grid_cols_desktop || "4",
    grid_cols_mobile: local.mobileCols || local.grid_cols_mobile || "2",
    grid_cols_desktop: local.desktopCols || local.grid_cols_desktop || "4",
  };
}

export async function GET() {
  try {
    const settings = await getSetting("general_settings");
    return NextResponse.json(settings);
  } catch (e) {
    const db = readDb();
    return NextResponse.json(db.generalSettings || {});
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await getSetting("general_settings");
    const updated = { ...existing, ...body };

    const saved = await saveSetting("general_settings", updated);
    writeDbAndTs(saved);

    return NextResponse.json({ success: true, generalSettings: saved });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save General settings" }, { status: 500 });
  }
}
