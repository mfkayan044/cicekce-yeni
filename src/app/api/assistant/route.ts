import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface AssistantRequest {
  message: string;
  history?: Array<{ sender: "user" | "bot"; text: string }>;
}

export async function POST(request: Request) {
  try {
    const { message, history = [] }: AssistantRequest = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
    }

    // 1. Fetch available products from Supabase
    let products: any[] = [];
    try {
      const { data } = await supabase
        .from("products")
        .select("id, slug, title, price, category, image, description")
        .limit(20);
      if (data && data.length > 0) products = data;
    } catch (e) {}

    // 2. Fetch card notes from Supabase
    let cardNotes: any[] = [];
    try {
      const { data } = await supabase.from("card_notes").select("category, text");
      if (data && data.length > 0) cardNotes = data;
    } catch (e) {}

    const lower = message.toLowerCase();
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 3. If Gemini API Key is configured, use Gemini 1.5/2.0 API
    if (geminiKey) {
      try {
        const productListStr = products
          .map((p) => `- ID: ${p.id}, Başlık: "${p.title}", Fiyat: "${p.price}", Kategori: "${p.category}"`)
          .join("\n");

        const prompt = `Sen Türkiye'nin en seçkin online çiçekçisi "Çiçekçe"nin sıcak, nazik ve uzman Çiçek Danışmanısın.
Müşterinin duygusunu, göndermek istediği kişiyi (anne, sevgili, eş, arkadaş, hasta, tebrik vb.) veya bütçesini anla.

Mağazamızdaki Ürünler:
${productListStr}

Müşterinin Son Mesajı: "${message}"

Lütfen SADECE aşağıdaki JSON formatında geçerli bir JSON yanıtı ver (başka açıklama yazma):
{
  "botResponse": "Müşteriye hitaben samimi ve nazik çiçek önerisi cümlesi (en fazla 2-3 cümle)",
  "recommendedProductId": "Önerilen ürünün ID'si",
  "cardNoteAdvice": "Bu çiçeğin yanına çok yakışacak, duygusal veya neşeli 1-2 cümlelik özel kart notu"
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );

        if (geminiRes.ok) {
          const resData = await geminiRes.json();
          const generatedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            const parsed = JSON.parse(generatedText);
            const matchedProduct = products.find((p) => String(p.id) === String(parsed.recommendedProductId)) || products[0];

            return NextResponse.json({
              reply: parsed.botResponse,
              recommendedProduct: matchedProduct,
              cardNoteAdvice: parsed.cardNoteAdvice,
              source: "gemini_ai"
            });
          }
        }
      } catch (geminiError) {
        console.error("Gemini Assistant Error:", geminiError);
      }
    }

    // 4. Intelligent Context-Aware Fallback Engine (NLP Emotion & Occasion Matching)
    let matchedProduct: any = null;
    let botResponse = "";
    let noteAdvice = "";

    // Sentiment / Occasion Detection
    if (lower.includes("anne") || lower.includes("annem") || lower.includes("valide")) {
      matchedProduct = products.find((p) => /orkide|papatya|lisianthus|gerbera/i.test(p.title)) || products[0];
      botResponse = `Canım annenize sevginizi ve minnetinizi gösterecek, zarafetiyle büyüleyen "${matchedProduct?.title || "Özel Çiçek Buketi"}" harika bir seçim olacaktır! 🌸`;
      noteAdvice = "💡 Kart Notu Tavsiyesi: 'Canım anneme, hayatıma kattığın tüm güzellikler ve sevgin için sonsuz teşekkürler. Seni çok seviyorum! ❤️'";
    } else if (lower.includes("sevgili") || lower.includes("aşk") || lower.includes("eş") || lower.includes("karım") || lower.includes("kocama") || lower.includes("romantik") || lower.includes("özür")) {
      matchedProduct = products.find((p) => /gül|kırmızı|kalp|101/i.test(p.title)) || products[0];
      botResponse = `Sevdiğinize olan aşkınızı anlatacak en romantik ve tutkulu tasarımımız "${matchedProduct?.title || "Kırmızı Gül Buketi"}"! ❤️`;
      noteAdvice = "💡 Kart Notu Tavsiyesi: 'Hayatıma anlam katan en güzel detay sensin. İyi ki varsın sevgilim! 🌹'";
    } else if (lower.includes("doğum") || lower.includes("yaş") || lower.includes("kutlu")) {
      matchedProduct = products.find((p) => /karışık|renkli|gerbera|35/i.test(p.title)) || products[0];
      botResponse = `Yeni yaşında neşe ve renk katacak en taze doğum günü aranjmanımız "${matchedProduct?.title || "Renkli Bahar Buketi"}"! 🎂`;
      noteAdvice = "💡 Kart Notu Tavsiyesi: 'Yeni yaşında tüm hayallerin gerçek, mutluluğun daim olsun. Doğum günün kutlu olsun! 🎉'";
    } else if (lower.includes("hasta") || lower.includes("geçmiş") || lower.includes("şifa") || lower.includes("moral")) {
      matchedProduct = products.find((p) => /papatya|orkide|beyaz/i.test(p.title)) || products[0];
      botResponse = `Acil şifalar ve moral verecek en narin, taze aranjmanımız "${matchedProduct?.title || "Huzur Buketi"}". 🌸`;
      noteAdvice = "💡 Kart Notu Tavsiyesi: 'Bir an önce sağlığına kavuşman dileğiyle, geçmiş olsun dualarımız seninle! 💐'";
    } else if (lower.includes("ucuz") || lower.includes("uygun") || lower.includes("bütçe") || lower.includes("fiyat")) {
      const sorted = [...products].sort((a, b) => {
        const pA = parseFloat(String(a.price).replace(/[^0-9.]/g, "")) || 0;
        const pB = parseFloat(String(b.price).replace(/[^0-9.]/g, "")) || 0;
        return pA - pB;
      });
      matchedProduct = sorted[0] || products[0];
      botResponse = `Bütçenize en uygun ve son derece şık tasarımımız "${matchedProduct?.title}" (${matchedProduct?.price}). 💰`;
      noteAdvice = "💡 Kart Notu Tavsiyesi: 'Yüzündeki tebessümün hiç eksik olmaması dileğiyle...'";
    } else {
      matchedProduct = products[Math.floor(Math.random() * (products.length || 1))] || null;
      botResponse = matchedProduct
        ? `Sizin için özel seçtiğimiz, tazeliği ve estetiğiyle çok beğenilen "${matchedProduct.title}" harika bir tercih olacaktır. ✨`
        : "Size en uygun çiçek önerisi için sevdiklerinizle olan özel gününüzü veya aradığınız çiçek türünü belirtebilirsiniz.";
      noteAdvice = "💡 Kart Notu Tavsiyesi: 'Bu özel günde kalbim ve sevgim hep seninle.'";
    }

    return NextResponse.json({
      reply: botResponse,
      recommendedProduct: matchedProduct,
      cardNoteAdvice: noteAdvice,
      source: "intelligent_engine"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Asistan yanıt üretirken bir hata oluştu: " + error?.message },
      { status: 500 }
    );
  }
}
