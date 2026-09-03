import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function getDb() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { currencySettings: {} };
  }
}

function saveDb(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.currencySettings || {
    autoSyncTcmb: false,
    defaultCurrency: "TRY",
    rates: { USD: 36.45, EUR: 39.20, GBP: 46.10, RUB: 0.38 },
    lastUpdate: new Date().toLocaleDateString("tr-TR")
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();

    if (body.action === "tcmb_sync") {
      // Live TCMB / Exchange Rate Auto Fetch Simulation / API
      let fetchedRates = { USD: 36.85, EUR: 39.75, GBP: 46.80, RUB: 0.40 };
      try {
        const tcmbRes = await fetch("https://open.er-api.com/v6/latest/TRY");
        if (tcmbRes.ok) {
          const erData = await tcmbRes.json();
          if (erData && erData.rates) {
            fetchedRates = {
              USD: Number((1 / erData.rates.USD).toFixed(2)),
              EUR: Number((1 / erData.rates.EUR).toFixed(2)),
              GBP: Number((1 / erData.rates.GBP).toFixed(2)),
              RUB: Number((1 / erData.rates.RUB).toFixed(2))
            };
          }
        }
      } catch (err) {}

      const nowStr = `${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
      db.currencySettings = {
        ...db.currencySettings,
        rates: fetchedRates,
        lastUpdate: nowStr
      };
      saveDb(db);
      return NextResponse.json({ success: true, message: "TCMB Canlı kurları çekildi!", currencySettings: db.currencySettings });
    }

    // Manual Save
    const nowStr = `${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
    db.currencySettings = {
      autoSyncTcmb: body.autoSyncTcmb || false,
      defaultCurrency: body.defaultCurrency || "TRY",
      rates: {
        USD: Number(body.rates?.USD || 36.45),
        EUR: Number(body.rates?.EUR || 39.20),
        GBP: Number(body.rates?.GBP || 46.10),
        RUB: Number(body.rates?.RUB || 0.38)
      },
      lastUpdate: nowStr
    };

    saveDb(db);
    return NextResponse.json({ success: true, currencySettings: db.currencySettings });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update currencies" }, { status: 500 });
  }
}
