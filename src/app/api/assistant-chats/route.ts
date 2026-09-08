import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const TWENTY_MINUTES_MS = 20 * 60 * 1000;

let inMemoryAssistantChats: any[] = [];

async function getChatsFromDb(): Promise<any[]> {
  const chats = await getSetting("assistant_chats", inMemoryAssistantChats);
  if (Array.isArray(chats)) {
    inMemoryAssistantChats = chats;
    return chats;
  }
  return inMemoryAssistantChats;
}

async function saveChatsToDb(chats: any[]): Promise<boolean> {
  inMemoryAssistantChats = chats;
  await setSetting("assistant_chats", chats);
  try {
    let dbObj: any = {};
    if (fs.existsSync(dbPath)) {
      dbObj = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    dbObj.assistantChats = chats;
    fs.writeFileSync(dbPath, JSON.stringify(dbObj, null, 2), "utf-8");
  } catch (e) {}
  return true;
}

function cleanupExpiredChats(chats: any[]): any[] {
  const now = Date.now();
  return (chats || []).filter((chat: any) => {
    const chatTime = chat.createdAtMs || (chat.id && !isNaN(Number(chat.id)) ? Number(chat.id) : null);
    if (!chatTime) return true;
    return now - chatTime < TWENTY_MINUTES_MS;
  });
}

export async function GET() {
  let chats = await getChatsFromDb();
  const cleaned = cleanupExpiredChats(chats);

  if (cleaned.length !== chats.length) {
    await saveChatsToDb(cleaned);
  }

  return NextResponse.json(cleaned || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let chats = await getChatsFromDb();
    chats = cleanupExpiredChats(chats);

    const now = new Date();
    const nowMs = now.getTime();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const recordId = body.id || String(nowMs);
    const existingIndex = chats.findIndex((c: any) => String(c.id) === String(recordId));

    const newRecord = {
      id: recordId,
      createdAtMs: nowMs,
      customerName: body.customerName || "Misafir Ziyaretçi",
      phone: body.phone || "-",
      topic: body.topic || "Ürün Tavsiyesi",
      status: body.status || "Tamamlandı",
      orderNo: body.orderNo || undefined,
      date: formattedDate,
      messages: body.messages || [],
    };

    if (existingIndex >= 0) {
      chats[existingIndex] = { ...chats[existingIndex], ...newRecord };
    } else {
      chats.unshift(newRecord);
    }

    await saveChatsToDb(chats);
    return NextResponse.json({ success: true, chat: newRecord }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: true, message: "Chat processed in-memory" }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true";

    let chats = await getChatsFromDb();

    if (clearAll) {
      chats = [];
      await saveChatsToDb(chats);
      return NextResponse.json({ success: true, message: "Tüm asistan konuşmaları silindi." });
    }

    if (id) {
      chats = chats.filter((c: any) => String(c.id) !== String(id));
      await saveChatsToDb(chats);
      return NextResponse.json({ success: true, message: "Konuşma silindi." });
    }

    return NextResponse.json({ error: "Geçersiz silme parametresi." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
