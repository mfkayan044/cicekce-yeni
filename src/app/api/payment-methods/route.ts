import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultPaymentSettings = {
  card: { active: true, name: "Kredi / Banka Kartı", provider: "Sanal POS (iyzico / PayTR / Mock)" },
  iban: { active: true, name: "Havale / EFT (IBAN)" },
  cash: { active: true, name: "Kapıda Ödeme", fee: 20 },
  whatsapp: { active: true, name: "WhatsApp ile Öde" },
  banks: [
    { id: "1", bank: "Garanti BBVA", owner: "Çiçekçe Çiçekçilik Ltd. Şti.", iban: "TR92 0006 2000 0000 1234 5678 90", active: true },
    { id: "2", bank: "Ziraat Bankası", owner: "Çiçekçe Çiçekçilik Ltd. Şti.", iban: "TR11 0001 0000 0000 9876 5432 10", active: true }
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

function writeDbAndTs(dbObj: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(dbObj, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(dbObj, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET() {
  const dbObj = readDb();
  const settings = dbObj.paymentSettings || defaultPaymentSettings;
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dbObj = readDb();
    
    const currentSettings = dbObj.paymentSettings || defaultPaymentSettings;
    const updatedSettings = {
      ...currentSettings,
      ...body
    };

    dbObj.paymentSettings = updatedSettings;
    writeDbAndTs(dbObj);

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 });
  }
}
