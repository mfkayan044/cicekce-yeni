import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "whatsapp_clicks")
      .maybeSingle();

    if (!error && data && Array.isArray(data.value)) {
      return NextResponse.json(data.value);
    }
  } catch (e) {}

  return NextResponse.json(getLocalClicks());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let currentClicks: any[] = [];
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "whatsapp_clicks")
        .maybeSingle();
      if (data && Array.isArray(data.value)) {
        currentClicks = data.value;
      } else {
        currentClicks = getLocalClicks();
      }
    } catch (e) {
      currentClicks = getLocalClicks();
    }

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

    saveLocalClicks(updatedClicks);

    try {
      await supabase
        .from("site_settings")
        .upsert({ id: "whatsapp_clicks", value: updatedClicks }, { onConflict: "id" });
    } catch (e) {}

    return NextResponse.json({ success: true, click: newClick }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/whatsapp-clicks error:", e);
    return NextResponse.json({ error: "Failed to save click" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    let currentClicks: any[] = [];
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "whatsapp_clicks")
        .maybeSingle();
      if (data && Array.isArray(data.value)) {
        currentClicks = data.value;
      } else {
        currentClicks = getLocalClicks();
      }
    } catch (e) {
      currentClicks = getLocalClicks();
    }

    let updatedClicks: any[] = [];
    if (id === "all") {
      updatedClicks = [];
    } else if (id) {
      updatedClicks = currentClicks.filter((c: any) => String(c.id) !== id);
    } else {
      updatedClicks = currentClicks;
    }

    saveLocalClicks(updatedClicks);

    try {
      await supabase
        .from("site_settings")
        .upsert({ id: "whatsapp_clicks", value: updatedClicks }, { onConflict: "id" });
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
