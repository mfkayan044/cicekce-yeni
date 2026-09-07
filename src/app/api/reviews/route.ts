import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productTitle = searchParams.get("product");

    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });

    if (productId) {
      query = query.or(`product_id.eq.${productId},product.ilike.%${productId}%`);
    } else if (productTitle) {
      query = query.ilike("product", `%${productTitle}%`);
    }

    const { data, error } = await query;
    
    // Fallback if product_id column filter causes error
    let rawList = data;
    if (error) {
      console.warn("Filtered reviews query error, falling back to all reviews:", error);
      const fallback = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      rawList = fallback.data || [];
    }

    const formatted = (rawList || []).map((r: any) => ({
      id: r.id,
      product: r.product,
      productId: r.product_id || r.productId || null,
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
  } catch (error: any) {
    console.error("GET /api/reviews Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch reviews from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Safe purchase verification against orders table
    let verifiedPurchase = false;
    const rawOrderId = body.orderId || body.order_id;
    if (rawOrderId) {
      try {
        const orderIdStr = String(rawOrderId).trim();
        const { data: order } = await supabase.from("orders").select("*").eq("id", orderIdStr).maybeSingle();
        if (order) {
          const orderPhone = (order.customer_phone || order.customerPhone || "").replace(/[^0-9]/g, "");
          const inputPhone = (body.phone || "").replace(/[^0-9]/g, "");
          if (!inputPhone || (orderPhone && orderPhone.endsWith(inputPhone.slice(-7)))) {
            verifiedPurchase = true;
          }
        }
      } catch (e) {
        console.warn("Order lookup for review verification failed:", e);
      }
    }

    const isVerified = verifiedPurchase || body.verifiedPurchase === true || body.verified_purchase === true;

    // Full review payload (includes extra columns)
    const fullReviewPayload: any = {
      id: String(body.id || Date.now()),
      product: body.product || "Çiçek Buketi",
      product_id: body.productId || body.product_id || null,
      author: body.author || "Değerli Müşterimiz",
      rating: Number(body.rating || 5),
      text: body.text || "",
      status: body.status || "Onaylandı",
      is_google: body.isGoogle === true || body.is_google === true,
      source: body.source || (isVerified ? "Doğrulanmış Müşteri" : "Web Site"),
      verified_purchase: isVerified
    };

    // 1st Attempt: Upsert full payload
    const { data: upsertData, error: upsertError } = await supabase
      .from("reviews")
      .upsert(fullReviewPayload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (!upsertError) {
      return NextResponse.json(upsertData || fullReviewPayload, { status: 201 });
    }

    console.warn("Full review upsert failed, trying base review schema fallback:", upsertError);

    // 2nd Attempt: Fallback to core columns if custom columns don't exist in Supabase table
    const baseReviewPayload: any = {
      id: String(body.id || Date.now()),
      product: body.product || "Çiçek Buketi",
      author: body.author || "Değerli Müşterimiz",
      rating: Number(body.rating || 5),
      text: body.text || "",
      status: body.status || "Onaylandı",
      is_google: body.isGoogle === true || body.is_google === true,
      source: body.source || (isVerified ? "Doğrulanmış Müşteri" : "Web Site")
    };

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("reviews")
      .upsert(baseReviewPayload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (fallbackError) {
      console.error("Fallback review upsert error:", fallbackError);
      throw fallbackError;
    }

    return NextResponse.json(fallbackData || baseReviewPayload, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reviews Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save review to Supabase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete review from Supabase" }, { status: 500 });
  }
}
