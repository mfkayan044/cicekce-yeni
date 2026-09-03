import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const TWENTY_MINUTES_MS = 20 * 60 * 1000;

function getDb() {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return { assistantChats: [] };
  }
}

function saveDb(db: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save db.json:", e);
  }
}

// Cleans chats older than 20 minutes automatically
function cleanupExpiredChats(db: any): boolean {
  if (!Array.isArray(db.assistantChats)) {
    db.assistantChats = [];
    return false;
  }
  const now = Date.now();
  const initialLength = db.assistantChats.length;
  
  db.assistantChats = db.assistantChats.filter((chat: any) => {
    const chatTime = chat.createdAtMs || (chat.id && !isNaN(Number(chat.id)) ? Number(chat.id) : null);
    if (!chatTime) return true; // Keep if no valid timestamp
    return now - chatTime < TWENTY_MINUTES_MS;
  });

  return db.assistantChats.length !== initialLength;
}

export async function GET() {
  const db = getDb();
  const hasChanges = cleanupExpiredChats(db);
  if (hasChanges) {
    saveDb(db);
  }
  return NextResponse.json(db.assistantChats || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getDb();
    if (!db.assistantChats) db.assistantChats = [];

    cleanupExpiredChats(db);

    const now = new Date();
    const nowMs = now.getTime();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const recordId = body.id || String(nowMs);
    const existingIndex = db.assistantChats.findIndex((c: any) => c.id === recordId);

    const newRecord = {
      id: recordId,
      createdAtMs: body.createdAtMs || nowMs,
      visitor: body.visitor || `Ziyaretçi (#${recordId.slice(-4)})`,
      msgCount: body.messages ? body.messages.length : 1,
      lastMsg: body.lastMsg || "Asistan sohbeti başlatıldı.",
      status: body.status || "Tamamlandı",
      orderNo: body.orderNo || undefined,
      date: formattedDate,
      messages: body.messages || []
    };

    if (existingIndex >= 0) {
      db.assistantChats[existingIndex] = { ...db.assistantChats[existingIndex], ...newRecord };
    } else {
      db.assistantChats.unshift(newRecord);
    }

    saveDb(db);
    return NextResponse.json({ success: true, chat: newRecord }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true";

    const db = getDb();
    if (!db.assistantChats) db.assistantChats = [];

    if (clearAll) {
      db.assistantChats = [];
      saveDb(db);
      return NextResponse.json({ success: true, message: "Tüm asistan konuşmaları silindi." });
    }

    if (id) {
      db.assistantChats = db.assistantChats.filter((c: any) => String(c.id) !== String(id));
      saveDb(db);
      return NextResponse.json({ success: true, message: "Konuşma silindi." });
    }

    return NextResponse.json({ error: "Geçersiz silme parametresi." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Silme işlemi başarısız." }, { status: 500 });
  }
}
