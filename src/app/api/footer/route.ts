import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(footerData: any) {
  try {
    const db = readDb();
    db.footer = footerData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {
    console.error("writeDbAndTs Error:", e);
  }
}

export async function GET() {
  try {
    // 1. Query live Supabase site_settings for 'footer'
    const { data: dbData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "footer")
      .single();

    if (dbData && dbData.value) {
      return NextResponse.json(dbData.value);
    }

    // 2. Fallback to db.json
    const db = readDb();
    return NextResponse.json(db.footer || {});
  } catch (error) {
    const db = readDb();
    return NextResponse.json(db.footer || {});
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 1. Save to Supabase site_settings
    await supabase
      .from("site_settings")
      .upsert({ id: "footer", value: body, updated_at: new Date().toISOString() });

    // 2. Update local db.json and initial-db.ts for instant pre-hydration
    writeDbAndTs(body);

    return NextResponse.json(body);
  } catch (error) {
    console.error("PUT /api/footer Error:", error);
    return NextResponse.json({ error: "Failed to update footer data" }, { status: 500 });
  }
}
