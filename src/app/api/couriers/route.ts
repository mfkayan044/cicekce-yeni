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

function writeDbAndTs(couriersData: any) {
  try {
    const db = readDb();
    db.couriers = couriersData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const { data: dbData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "couriers")
      .single();

    const couriersData = (dbData && dbData.value) ? dbData.value : (readDb().couriers || { trackingEnabled: true, list: [] });

    if (id) {
      const item = (couriersData.list || []).find((c: any) => c.id === id);
      return NextResponse.json(item || null);
    }

    return NextResponse.json(couriersData);
  } catch (e) {
    const db = readDb();
    return NextResponse.json(db.couriers || { trackingEnabled: true, list: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    const couriersData = db.couriers || { trackingEnabled: true, list: [] };

    // Toggle tracking or add courier
    if (typeof body.trackingEnabled === "boolean") {
      couriersData.trackingEnabled = body.trackingEnabled;
    }

    if (body.name) {
      const newCourier = {
        id: "k_" + Date.now(),
        name: body.name,
        phone: body.phone || "",
        plate: body.plate || "",
        region: body.region || "Genel Kurye",
        active: body.active !== false
      };
      if (!Array.isArray(couriersData.list)) couriersData.list = [];
      couriersData.list.unshift(newCourier);
    }

    await supabase
      .from("site_settings")
      .upsert({ id: "couriers", value: couriersData, updated_at: new Date().toISOString() });

    writeDbAndTs(couriersData);

    return NextResponse.json({ success: true, couriersData });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update couriers" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    const couriersData = db.couriers || { trackingEnabled: true, list: [] };

    if (Array.isArray(couriersData.list)) {
      couriersData.list = couriersData.list.map((c: any) => {
        if (c.id === body.id) {
          return { ...c, ...body };
        }
        return c;
      });
    }

    await supabase
      .from("site_settings")
      .upsert({ id: "couriers", value: couriersData, updated_at: new Date().toISOString() });

    writeDbAndTs(couriersData);

    return NextResponse.json({ success: true, couriersData });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update courier" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const db = readDb();
    const couriersData = db.couriers || { trackingEnabled: true, list: [] };

    if (Array.isArray(couriersData.list)) {
      couriersData.list = couriersData.list.filter((c: any) => c.id !== id);
    }

    await supabase
      .from("site_settings")
      .upsert({ id: "couriers", value: couriersData, updated_at: new Date().toISOString() });

    writeDbAndTs(couriersData);

    return NextResponse.json({ success: true, couriersData });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete courier" }, { status: 500 });
  }
}
