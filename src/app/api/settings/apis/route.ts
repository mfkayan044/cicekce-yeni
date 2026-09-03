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

function writeDbAndTs(apiData: any) {
  try {
    const db = readDb();
    db.apiSettings = apiData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "api_settings")
      .single();

    const apiSettings = (data && data.value) ? data.value : (readDb().apiSettings || {});
    return NextResponse.json(apiSettings);
  } catch (e) {
    const db = readDb();
    return NextResponse.json(db.apiSettings || {});
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    const existing = db.apiSettings || {};
    const updated = { ...existing, ...body };

    await supabase
      .from("site_settings")
      .upsert({ id: "api_settings", value: updated, updated_at: new Date().toISOString() });

    writeDbAndTs(updated);

    return NextResponse.json({ success: true, apiSettings: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save API settings" }, { status: 500 });
  }
}
