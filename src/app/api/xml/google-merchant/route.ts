import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    let products: any[] = [];
    try {
      products = await sql`SELECT * FROM products WHERE stock = true`;
    } catch (e) {
      const { data } = await supabase.from("products").select("*").eq("stock", true);
      if (data) products = data;
    }

    const host = "https://cicekce-yeni-two.vercel.app";

    const xmlItems = products
      .map((p) => {
        const id = p.id;
        const title = (p.title || "Çiçek Buketi").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const description = (p.description || `${p.title} taze çiçek aranjmanı aynı gün hızlı kurye teslimatıyla sipariş edin.`).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const link = `${host}/urun/${p.slug || id}`;
        const imageLink = p.image || `${host}/icon.png`;
        const rawPrice = String(p.price || "0").replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
        const priceNum = parseFloat(rawPrice) || 0;
        const priceFormatted = `${priceNum.toFixed(2)} TRY`;

        return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${priceFormatted}</g:price>
      <g:brand>Çiçekçe</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>Arts &amp; Entertainment &gt; Party &amp; Celebration &gt; Gift Giving &gt; Flowers</g:google_product_category>
    </item>`;
      })
      .join("");

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Çiçekçe Taze Çiçek &amp; Hediyelik Portalı</title>
    <link>${host}</link>
    <description>Aynı Gün Teslimat Canlı Çiçek &amp; Özel Hediyelikler</description>${xmlItems}
  </channel>
</rss>`;

    return new Response(xmlContent, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate Google Merchant XML feed" }, { status: 500 });
  }
}
