import { NextResponse } from "next/server";
import { getSetting as getSettingsHelper, setSetting as setSettingsHelper } from "@/lib/settings-helper";
import { isRequestAuthorized } from "@/lib/auth";
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

export async function GET(request: Request) {
  try {
    const isAuth = await isRequestAuthorized(request);
    const local = readDb().generalSettings || {};
    const settings = await getSettingsHelper("general_settings", local);
    
    if (!isAuth && settings) {
      const { password, ...safeSettings } = settings;
      return NextResponse.json(safeSettings);
    }
    return NextResponse.json(settings);
  } catch (e) {
    const db = readDb();
    const local = db.generalSettings || {};
    const { password, ...safeLocal } = local;
    return NextResponse.json(safeLocal);
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await isRequestAuthorized(request);
    if (!isAuth) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Genel ayarları değiştirmek için yönetici girişi gereklidir." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const local = readDb().generalSettings || {};
    const existing = await getSettingsHelper("general_settings", local);
    const updated = { ...existing, ...body };

    await setSettingsHelper("general_settings", updated);
    writeDbAndTs(updated);

    return NextResponse.json({ success: true, generalSettings: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save General settings" }, { status: 500 });
  }
}
