import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

let inMemoryAbandonedCarts: any[] = [];

async function getAbandonedCartsFromDb(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "abandoned_carts")
      .single();

    if (!error && data && Array.isArray(data.value)) {
      inMemoryAbandonedCarts = data.value;
      return data.value;
    }
  } catch (e) {}
  return inMemoryAbandonedCarts;
}

async function saveAbandonedCartsToDb(carts: any[]): Promise<boolean> {
  try {
    inMemoryAbandonedCarts = carts;
    await supabase
      .from("site_settings")
      .upsert({
        id: "abandoned_carts",
        value: carts,
        updated_at: new Date().toISOString()
      });
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  const carts = await getAbandonedCartsFromDb();
  return NextResponse.json(carts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const carts = await getAbandonedCartsFromDb();

    const cartNo = body.cartNo || `TSL-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const phone = body.phone || body.recipientPhone || "Belirtilmedi";
    const customer = body.customerName || body.recipientName || "Ziyaretçi";

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const existingIndex = carts.findIndex(
      (c: any) => c.cartNo === cartNo
    );

    const updatedRecord = {
      id: body.id || (existingIndex >= 0 ? carts[existingIndex].id : String(Date.now())),
      cartNo,
      customer,
      phone,
      email: body.email || "Belirtilmedi",
      address: body.address || "Adres Belirtilmedi",
      product: body.product || "Çiçek Aranjmanı",
      step: body.step || "Adım 1: Alıcı & Teslimat",
      total: body.total || "0 ₺",
      date: formattedDate,
      items: body.items || [],
      recipientName: body.recipientName || "",
      recipientPhone: body.recipientPhone || "",
      addons: body.addons || [],
    };

    if (existingIndex >= 0) {
      carts[existingIndex] = { ...carts[existingIndex], ...updatedRecord };
    } else {
      carts.unshift(updatedRecord);
    }

    // Keep max 100 recent abandoned carts
    const trimmedCarts = carts.slice(0, 100);
    await saveAbandonedCartsToDb(trimmedCarts);

    return NextResponse.json({ success: true, cart: updatedRecord }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to save abandoned cart: " + e?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const cartNo = searchParams.get("cartNo");

    let carts = await getAbandonedCartsFromDb();

    if (id || cartNo) {
      carts = carts.filter((c: any) => c.id !== id && c.cartNo !== cartNo);
    }

    await saveAbandonedCartsToDb(carts);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete abandoned cart" }, { status: 500 });
  }
}
