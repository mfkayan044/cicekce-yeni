import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

let memoryClicks: any[] = [];

function getLocalClicks(): any[] {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(data);
      if (Array.isArray(db.whatsappClicks)) return db.whatsappClicks;
    }
  } catch (e) {}
  return memoryClicks;
}

function saveLocalClicks(clicks: any[]) {
  memoryClicks = clicks;
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.whatsappClicks = clicks;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {}
}

async function getClicksFromDb(): Promise<any[]> {
  const data = await getSetting("whatsapp_clicks", getLocalClicks());
  if (Array.isArray(data)) {
    memoryClicks = data;
    return data;
  }
  return memoryClicks;
}

async function saveClicksToDb(clicks: any[]) {
  saveLocalClicks(clicks);
  await setSetting("whatsapp_clicks", clicks);
}

export async function GET() {
  const clicks = await getClicksFromDb();
  return NextResponse.json(clicks || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let currentClicks = await getClicksFromDb();

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newClick = {
      id: Date.now(),
      date: formattedDate,
      type: body.type || "Ürün Sayfası",
      product: body.product || "Çiçek Buketi",
      button: body.button || "WhatsApp İle Sipariş Ver",
      page: body.page || "/",
      ip: body.ip || "127.0.0.1",
      device: body.device || "Masaüstü (Chrome)",
      lang: "TR"
    };

    const updatedClicks = [newClick, ...currentClicks].slice(0, 500);
    await saveClicksToDb(updatedClicks);

    return NextResponse.json({ success: true, click: newClick }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    let currentClicks = await getClicksFromDb();

    let updatedClicks: any[] = [];
    if (id === "all") {
      updatedClicks = [];
    } else if (id) {
      updatedClicks = currentClicks.filter((c: any) => String(c.id) !== id);
    } else {
      updatedClicks = currentClicks;
    }

    await saveClicksToDb(updatedClicks);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: true });
  }
}
