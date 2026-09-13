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

    const recordId = body.id || body.cartNo || String(Date.now());
    const searchId = String(body.id || body.cartNo || "");
    const searchPhone = String(body.phone || body.customerPhone || "").replace(/\D/g, "");

    // Require at least a valid phone or name to avoid bloating DB with empty ghost sessions
    const hasContact = (searchPhone && searchPhone.length >= 7) || (body.customerName && body.customerName !== "Misafir Müşteri" && body.customerName !== "Misafir Ziyaretçi");
    if (!hasContact) {
      return NextResponse.json({ success: true, message: "Skipped empty guest cart" });
    }

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Find existing cart by ID, cartNo OR by customer phone to deduplicate steps
    const existingIndex = carts.findIndex((c: any) => {
      if (searchId && (String(c.id) === searchId || String(c.cartNo) === searchId)) return true;
      if (searchPhone && searchPhone.length >= 7) {
        const cPhone = String(c.customerPhone || c.phone || "").replace(/\D/g, "");
        if (cPhone.length >= 7 && (cPhone.endsWith(searchPhone) || searchPhone.endsWith(cPhone))) return true;
      }
      return false;
    });

    const updatedRecord = {
      id: existingIndex >= 0 ? carts[existingIndex].id : recordId,
      cartNo: existingIndex >= 0 ? (carts[existingIndex].cartNo || recordId) : recordId,
      customerName: body.customerName || (existingIndex >= 0 ? carts[existingIndex].customerName : "Misafir Ziyaretçi"),
      customerPhone: body.phone || body.customerPhone || (existingIndex >= 0 ? (carts[existingIndex].customerPhone || carts[existingIndex].phone) : "-"),
      customerEmail: body.customerEmail || (existingIndex >= 0 ? carts[existingIndex].customerEmail : "-"),
      lastStep: body.step || body.lastStep || (existingIndex >= 0 ? carts[existingIndex].lastStep : "Ödeme Adımı"),
      cartTotal: body.total || body.cartTotal || (existingIndex >= 0 ? carts[existingIndex].cartTotal : "0 ₺"),
      itemsCount: (body.items && body.items.length) || (existingIndex >= 0 ? carts[existingIndex].itemsCount : 1),
      date: formattedDate,
      items: body.items || (existingIndex >= 0 ? carts[existingIndex].items : []),
      addons: body.addons || (existingIndex >= 0 ? carts[existingIndex].addons : []),
      recipientName: body.recipientName || (existingIndex >= 0 ? carts[existingIndex].recipientName : undefined),
      address: body.address || (existingIndex >= 0 ? carts[existingIndex].address : undefined),
    };

    if (existingIndex >= 0) {
      carts[existingIndex] = { ...carts[existingIndex], ...updatedRecord };
    } else {
      carts.unshift(updatedRecord);
    }

    // Keep max 200 abandoned carts to prevent DB bloat and token exhaustion
    if (carts.length > 200) {
      carts = carts.slice(0, 200);
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
    const cartNo = searchParams.get("cartNo");
    const phone = searchParams.get("phone");
    const clearAll = searchParams.get("all") === "true";

    let body: any = null;
    try {
      body = await req.json();
    } catch (e) {}

    let carts = await getAbandonedCartsFromDb();

    if (clearAll) {
      carts = [];
    } else if (body && Array.isArray(body.ids)) {
      const idsToDelete = body.ids.map((i: any) => String(i));
      carts = carts.filter((c: any) => !idsToDelete.includes(String(c.id)));
    } else if (id || cartNo || phone) {
      const targetId = String(id || cartNo || "");
      const cleanPhone = String(phone || "").replace(/\D/g, "");

      carts = carts.filter((c: any) => {
        if (targetId && (String(c.id) === targetId || String(c.cartNo) === targetId)) return false;
        if (cleanPhone && cleanPhone.length >= 7) {
          const cPhone = String(c.customerPhone || c.phone || "").replace(/\D/g, "");
          if (cPhone.length >= 7 && (cPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cPhone))) return false;
        }
        return true;
      });
    }

    await saveAbandonedCartsToDb(carts);
    return NextResponse.json({ success: true, remaining: carts.length });
  } catch (e) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
