import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultTemplates = [
  { id: "1", name: "Sipariş Onayı (Kredi Kartı / Havale)", subject: "🌸 Siparişiniz Alındı - #SIP-56298", active: true, category: "Sipariş", type: "order_received", engine: "Resend API" },
  { id: "2", name: "Canlı Görsel Onayı İsteği", subject: "📸 Çiçeğiniz Hazırlandı! Görsel Onayı Bekliyor - #SIP-56298", active: true, category: "Fotoğraf Onayı", type: "photo_approval", engine: "Resend API" },
  { id: "3", name: "Kurye Yola Çıktı / Durum Güncellemesi", subject: "🛵 Çiçeğiniz Kuryede! Sipariş #SIP-56298 Yolda", active: true, category: "Kurye", type: "courier", engine: "Resend API" },
  { id: "4", name: "Sipariş Teslim Edildi & ÇiçekPuan İsteği", subject: "✅ Çiçeğiniz Teslim Edildi! 50 ÇiçekPuan Kazanın - #SIP-56298", active: true, category: "Teslimat", type: "delivered", engine: "Resend API" },
  { id: "5", name: "Yarım Kalan Sepet Hatırlatması", subject: "🛒 Sepetinizde Harika Çiçekler Bekliyor! %10 İndirim Fırsatı", active: true, category: "Pazarlama", type: "abandoned_cart", engine: "Brevo API" },
  { id: "6", name: "Yeni Üyelik Hoş Geldin Mesajı", subject: "🌸 Çiçekçe Ailesine Hoş Geldiniz! 100 ₺ İndiriminiz Tanımlandı", active: true, category: "Üyelik", type: "welcome", engine: "Resend API" },
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

    const templates = (data && Array.isArray(data.value) && data.value.length > 0) ? data.value : defaultTemplates;
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
      templates = templates.map((t) => (String(t.id) === String(body.id) ? { ...t, ...body } : t));
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
