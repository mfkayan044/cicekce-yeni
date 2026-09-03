import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultPopup = {
  enabled: true,
  title: "İlk Siparişinize Özel 150 ₺ İndirim! 🎉",
  description: "İlk siparişinize özel 150 ₺ indirim kodu sizleri bekliyor. Hediye10 koduyla siparişinizi hemen oluşturabilirsiniz.",
  couponCode: "Hediye10",
  badgeText: "BİLGİLENDİRME",
  buttonText: "Kodu Kopyala & Alışverişe Başla 🛍️",
  icon: "🎁"
};

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(popupData: any) {
  try {
    const db = readDb();
    db.popupSettings = popupData;
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
      .eq("id", "popup_settings")
      .single();

    const popup = (data && data.value) ? data.value : (readDb().popupSettings || defaultPopup);
    return NextResponse.json(popup);
  } catch (e) {
    const db = readDb();
    return NextResponse.json(db.popupSettings || defaultPopup);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    const existing = db.popupSettings || defaultPopup;
    const updated = { ...existing, ...body };

    await supabase
      .from("site_settings")
      .upsert({ id: "popup_settings", value: updated, updated_at: new Date().toISOString() });

    writeDbAndTs(updated);

    return NextResponse.json({ success: true, popupSettings: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save Popup settings" }, { status: 500 });
  }
}
