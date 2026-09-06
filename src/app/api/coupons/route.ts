import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function getLocalCoupons(): any[] {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      if (Array.isArray(db.coupons)) return db.coupons;
    }
  } catch (e) {}
  return [];
}

function saveLocalCoupons(coupons: any[]) {
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.coupons = coupons;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    // Swallow EROFS errors on Vercel
  }
}

async function getCouponsList(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "coupons")
      .single();
    if (!error && data && Array.isArray(data.value)) {
      return data.value;
    }
  } catch (e) {}
  return getLocalCoupons();
}

async function saveCouponsList(coupons: any[]) {
  saveLocalCoupons(coupons);
  try {
    await supabase.from("site_settings").upsert(
      { id: "coupons", value: coupons, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  } catch (e) {}
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const code = searchParams.get("code");
    const coupons = await getCouponsList();

    if (id) {
      const found = coupons.find((c: any) => String(c.id) === String(id));
      if (!found) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      return NextResponse.json(found);
    }

    if (code) {
      const found = coupons.find((c: any) => String(c.code).toUpperCase() === String(code).toUpperCase());
      if (!found) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      return NextResponse.json(found);
    }

    return NextResponse.json(coupons);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const coupons = await getCouponsList();

    const newCoupon = {
      id: body.id || String(Date.now()),
      code: body.code ? String(body.code).toUpperCase().trim() : "KUPON10",
      discount: body.discount || "100 ₺",
      minCart: body.minCart || "500 ₺",
      usage: body.usage || "0 / 100",
      active: body.active !== undefined ? body.active : true,
    };

    coupons.unshift(newCoupon);
    await saveCouponsList(coupons);

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save coupon" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    let coupons = await getCouponsList();
    const index = coupons.findIndex((c: any) => String(c.id) === String(body.id));

    if (index !== -1) {
      coupons[index] = { ...coupons[index], ...body };
    } else {
      coupons.unshift(body);
    }

    await saveCouponsList(coupons);
    return NextResponse.json({ success: true, coupon: coupons[index !== -1 ? index : 0] });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
    }

    let coupons = await getCouponsList();
    coupons = coupons.filter((c: any) => String(c.id) !== String(id));
    await saveCouponsList(coupons);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
