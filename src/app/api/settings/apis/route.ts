import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSetting, setSetting } from "@/lib/settings-helper";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

function extractGaId(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const match = trimmed.match(/(G|GT|UA)-[A-Za-z0-9]+/i);
  return match ? match[0].toUpperCase() : trimmed;
}

function extractPixelId(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const match = trimmed.match(/\d{10,20}/);
  return match ? match[0] : trimmed;
}

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
    if (process.env.NODE_ENV === "development") {
      const db = readDb();
      db.apiSettings = apiData;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
      const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
      fs.writeFileSync(initialTsPath, tsCode, "utf-8");
    }
  } catch (e) {}
}

export async function GET() {
  let settings: any = {};

  // 1. Try fetching from Supabase
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "api_settings")
      .maybeSingle();

    if (data && data.value && typeof data.value === "object" && Object.keys(data.value).length > 0) {
      settings = data.value;
    }
  } catch (e) {}

  // 2. Fallback to Neon SQL via settings-helper
  if (!settings || Object.keys(settings).length === 0) {
    try {
      const neonData = await getSetting("api_settings");
      if (neonData && typeof neonData === "object" && Object.keys(neonData).length > 0) {
        settings = neonData;
      }
    } catch (e) {}
  }

  // 3. Fallback to db.json
  if (!settings || Object.keys(settings).length === 0) {
    settings = readDb().apiSettings || {};
  }

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Automatically sanitize / extract GA ID and Pixel ID
    if (body.googleAnalyticsId) {
      body.googleAnalyticsId = extractGaId(body.googleAnalyticsId);
    }
    if (body.metaPixelId) {
      body.metaPixelId = extractPixelId(body.metaPixelId);
    }

    const db = readDb();
    const existingFromDb = db.apiSettings || {};
    
    let existingFromSb = {};
    try {
      const { data } = await supabase.from("site_settings").select("value").eq("id", "api_settings").maybeSingle();
      if (data && data.value) existingFromSb = data.value;
    } catch (e) {}

    let existingFromNeon = {};
    try {
      existingFromNeon = await getSetting("api_settings");
    } catch (e) {}

    const updated = { ...existingFromDb, ...existingFromSb, ...existingFromNeon, ...body };

    // Save to Supabase
    try {
      await supabase
        .from("site_settings")
        .upsert({ id: "api_settings", value: updated, updated_at: new Date().toISOString() });
    } catch (sbErr) {}

    // Save to Neon SQL
    try {
      await setSetting("api_settings", updated);
    } catch (neonErr) {}

    // Safe dev write
    writeDbAndTs(updated);

    // Revalidate paths so server layout re-renders
    try {
      revalidatePath("/", "layout");
    } catch (e) {}

    return NextResponse.json({ success: true, apiSettings: updated });
  } catch (error: any) {
    console.error("POST /api/settings/apis error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save API settings" }, { status: 500 });
  }
}
