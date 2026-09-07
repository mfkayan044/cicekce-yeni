import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productTitle = searchParams.get("product");

    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    } else if (productTitle) {
      query = query.ilike("product", `%${productTitle}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      product: r.product,
      productId: r.product_id || r.productId,
      author: r.author,
      rating: Number(r.rating || 5),
      text: r.text,
      status: r.status || "Onaylandı",
      isGoogle: r.is_google === true,
      source: r.source || "Web",
      verifiedPurchase: r.verified_purchase !== false,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString("tr-TR") : "Yeni"
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reviews from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify purchase against orders table
    let verifiedPurchase = false;
    if (body.orderId) {
      const { data: order } = await supabase.from("orders").select("*").eq("id", body.orderId.trim()).single();
      if (order) {
        const orderPhone = (order.customer_phone || order.customerPhone || "").replace(/[^0-9]/g, "");
        const inputPhone = (body.phone || "").replace(/[^0-9]/g, "");
        const isMatchPhone = !inputPhone || (orderPhone && orderPhone.endsWith(inputPhone.slice(-7)));

        if (isMatchPhone) {
          verifiedPurchase = true;
        }
      }
    }

    const newReview = {
      id: body.id || String(Date.now()),
      product: body.product || "Çiçek Buketi",
      product_id: body.productId || body.product_id || null,
      author: body.author || "Değerli Müşterimiz",
      rating: Number(body.rating || 5),
      text: body.text,
      status: body.status || "Onaylandı",
      is_google: body.isGoogle === true || body.is_google === true,
      source: body.source || (verifiedPurchase ? "Doğrulanmış Müşteri" : "Web Site"),
      verified_purchase: verifiedPurchase || body.verifiedPurchase === true
    };

    const { data, error } = await supabase.from("reviews").upsert(newReview, { onConflict: "id" }).select().single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save review to Supabase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete review from Supabase" }, { status: 500 });
  }
}
