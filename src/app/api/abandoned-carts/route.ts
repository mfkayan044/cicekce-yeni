import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

let memoryAbandonedCarts: any[] = [];

function getLocalCarts(): any[] {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(data);
      if (Array.isArray(db.abandonedCarts)) return db.abandonedCarts;
    }
  } catch (e) {}
  return memoryAbandonedCarts;
}

function saveLocalCarts(carts: any[]) {
  memoryAbandonedCarts = carts;
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.abandonedCarts = carts;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {}
}

async function getAbandonedCartsFromDb(): Promise<any[]> {
  const carts = await getSetting("abandoned_carts", getLocalCarts());
  if (Array.isArray(carts)) {
    memoryAbandonedCarts = carts;
    return carts;
  }
  return memoryAbandonedCarts;
}

async function saveAbandonedCartsToDb(carts: any[]) {
  saveLocalCarts(carts);
  await setSetting("abandoned_carts", carts);
}

export async function GET() {
  const carts = await getAbandonedCartsFromDb();
  return NextResponse.json(carts || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let carts = await getAbandonedCartsFromDb();

    const recordId = body.id || String(Date.now());
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const existingIndex = carts.findIndex((c: any) => String(c.id) === String(recordId));

    const updatedRecord = {
      id: recordId,
      customerName: body.customerName || (existingIndex >= 0 ? carts[existingIndex].customerName : "Misafir Ziyaretçi"),
      customerPhone: body.customerPhone || (existingIndex >= 0 ? carts[existingIndex].customerPhone : "-"),
      customerEmail: body.customerEmail || (existingIndex >= 0 ? carts[existingIndex].customerEmail : "-"),
      lastStep: body.lastStep || (existingIndex >= 0 ? carts[existingIndex].lastStep : "Ödeme Adımı"),
      cartTotal: body.cartTotal || (existingIndex >= 0 ? carts[existingIndex].cartTotal : "0 ₺"),
      itemsCount: body.itemsCount || (existingIndex >= 0 ? carts[existingIndex].itemsCount : 1),
      date: formattedDate,
      items: body.items || (existingIndex >= 0 ? carts[existingIndex].items : []),
      recipientName: body.recipientName || (existingIndex >= 0 ? carts[existingIndex].recipientName : undefined),
      address: body.address || (existingIndex >= 0 ? carts[existingIndex].address : undefined),
    };

    if (existingIndex >= 0) {
      carts[existingIndex] = { ...carts[existingIndex], ...updatedRecord };
    } else {
      carts.unshift(updatedRecord);
    }

    await saveAbandonedCartsToDb(carts);
    return NextResponse.json({ success: true, cart: updatedRecord }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true";

    let carts = await getAbandonedCartsFromDb();

    if (clearAll) {
      carts = [];
    } else if (id) {
      carts = carts.filter((c: any) => String(c.id) !== String(id));
    }

    await saveAbandonedCartsToDb(carts);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
