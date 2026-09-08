import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  try {
    let rawList: any[] = [];
    try {
      rawList = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
    } catch (neonErr) {
      const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      rawList = data || [];
    }

    const formatted = (rawList || []).map((r: any) => ({
      id: r.id,
      product: r.product || r.product_title,
      productId: r.product_id || r.productId || null,
      author: r.author,
      rating: Number(r.rating || 5),
      text: r.text || r.comment || "",
      status: r.status || "Onaylandı",
      isGoogle: r.is_google === true,
      source: r.source || "Web",
      verifiedPurchase: r.verified_purchase !== false,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString("tr-TR") : (r.date || "Yeni")
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const reviewId = String(body.id || Date.now());
    const author = body.author || "Değerli Müşterimiz";
    const rating = Number(body.rating || 5);
    const comment = body.text || body.comment || "";
    const productTitle = body.product || body.productTitle || "Çiçek Buketi";
    const status = body.status || "Onaylandı";
    const image = body.image || null;
    const formattedDate = new Date().toLocaleDateString("tr-TR");

    try {
      await sql`
        INSERT INTO reviews (id, author, rating, comment, product_title, date, status, image)
        VALUES (${reviewId}, ${author}, ${rating}, ${comment}, ${productTitle}, ${formattedDate}, ${status}, ${image})
        ON CONFLICT (id) DO UPDATE SET
          author = EXCLUDED.author,
          rating = EXCLUDED.rating,
          comment = EXCLUDED.comment,
          status = EXCLUDED.status;
      `;
    } catch (neonErr) {}

    try {
      await supabase.from("reviews").upsert({
        id: reviewId,
        author,
        rating,
        text: comment,
        product: productTitle,
        status
      }, { onConflict: "id" });
    } catch (sbErr) {}

    return NextResponse.json({ success: true, id: reviewId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      try {
        await sql`DELETE FROM reviews WHERE id = ${String(id)}`;
      } catch (neonErr) {}
      try {
        await supabase.from("reviews").delete().eq("id", id);
      } catch (sbErr) {}
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: true });
  }
}
