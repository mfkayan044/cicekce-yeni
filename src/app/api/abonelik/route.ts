import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import { addAuditLog } from "@/lib/audit-logger";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultSubscriptionData = {
  badge: "🌿 Çiçekçe Taze Çiçek Aboneliği",
  title: "Evinize & Ofisinize Her Hafta Taze Çiçek Dokunuşu",
  subtitle: "Her hafta veya her ay kapınıza gelen taze, mevsimlik özel tasarım çiçeklerle yaşam alanlarınızı renklendirin.",
  packages: [
    {
      id: "p1",
      name: "Haftalık Ofis Çiçeği",
      price: "1.250 ₺",
      period: "Haftalık",
      desc: "Her Pazartesi sabahı ofis resepsiyonunuz ve masanız için taze aranjman.",
      badge: "POPÜLER",
      features: [
        "Her Pazartesi Taze Teslimat",
        "Vazo & Seramik Saksı Dahil",
        "Ücretsiz Kurye Teslimatı",
        "İstediğin Zaman İptal Et"
      ]
    },
    {
      id: "p2",
      name: "Aylık Ev Dokunuşu",
      price: "2.450 ₺",
      period: "Aylık (2 Kez)",
      desc: "Ayda 2 kez eviniz için özel hazırlanmış mevsim çiçekleri ve buketler.",
      badge: "AVANTAJLI",
      features: [
        "15 Günde Bir Taze Çiçek",
        "Özel Çiçek Besini Hediyeli",
        "Kişiye Özel Tasarım Seçeneği",
        "Ücretsiz Kurye Teslimatı"
      ]
    },
    {
      id: "p3",
      name: "VIP Kurumsal Abonelik",
      price: "4.900 ₺",
      period: "Aylık (4 Kez)",
      desc: "Restoran, otel, lobi ve şirket yönetimi için dev boy elit aranjmanlar.",
      badge: "PREMIUM",
      features: [
        "Haftalık Dev Boy Tasarım",
        "Özel Florist Danışmanlığı",
        "Değişimli Vazo/Saksı Desteği",
        "7/24 Öncelikli Müşteri Desteği"
      ]
    }
  ]
};

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(subData: any) {
  try {
    const db = readDb();
    db.subscriptionSettings = subData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const local = readDb().subscriptionSettings || defaultSubscriptionData;
    const settings = await getSetting("subscription_data", local);
    return NextResponse.json(settings || defaultSubscriptionData);
  } catch (e) {
    return NextResponse.json(defaultSubscriptionData);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await setSetting("subscription_data", body);
    writeDbAndTs(body);
    await addAuditLog("Çiçek Aboneliği Sayfası ve Paketleri Güncellendi");
    return NextResponse.json({ success: true, data: body });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save subscription settings" }, { status: 500 });
  }
}
