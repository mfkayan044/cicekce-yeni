import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultTemplates = [
  { id: "1", name: "Sipariş Onayı (Kredi Kartı)", subject: "Siparişiniz Alındı - #{SIPARIS_NO}", active: true, category: "Sipariş" },
  { id: "2", name: "Sipariş Onayı (Havale / EFT)", subject: "Ödeme Bekleniyor - #{SIPARIS_NO}", active: true, category: "Ödeme" },
  { id: "3", name: "Sipariş Durumu Güncellendi", subject: "Siparişinizin Durumu: {DURUM}", active: true, category: "Teslimat" },
  { id: "4", name: "Yarım Kalan Sepet Hatırlatması", subject: "Sepetinizde Harika Çiçekler Bekliyor!", active: true, category: "Pazarlama" },
  { id: "5", name: "Yeni Üyelik Hoşgeldin Mesajı", subject: "Çiçekçe Ailesine Hoş Geldiniz", active: true, category: "Üyelik" },
];

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(templates: any[]) {
  try {
    const db = readDb();
    db.emailTemplates = templates;
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
      .eq("id", "email_templates")
      .single();

    const templates = (data && Array.isArray(data.value)) ? data.value : (readDb().emailTemplates || defaultTemplates);
    return NextResponse.json(templates);
  } catch (e) {
    const db = readDb();
    return NextResponse.json(db.emailTemplates || defaultTemplates);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    let templates: any[] = db.emailTemplates || defaultTemplates;

    if (body.id) {
      templates = templates.map((t) => (t.id === body.id ? { ...t, ...body } : t));
    } else {
      templates.push({ id: "et_" + Date.now(), ...body });
    }

    await supabase
      .from("site_settings")
      .upsert({ id: "email_templates", value: templates, updated_at: new Date().toISOString() });

    writeDbAndTs(templates);

    return NextResponse.json({ success: true, templates });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save email template" }, { status: 500 });
  }
}
