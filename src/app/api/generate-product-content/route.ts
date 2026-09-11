import { NextResponse } from "next/server";
import { generateSeoDetails } from "@/lib/store";

export const dynamic = "force-dynamic";

interface ProductContentRequest {
  title: string;
  category?: string;
  designTypes?: string[];
  recipients?: string[];
  purposes?: string[];
  colors?: string[];
  price?: string;
}

export async function POST(request: Request) {
  try {
    const body: ProductContentRequest = await request.json();
    const { title, category = "Çiçekler", designTypes = [], recipients = [], purposes = [], colors = [], price = "" } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Lütfen önce bir ürün adı giriniz." }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      const prompt = `Sen Türkiye'nin en seçkin lüks online çiçekçisi "Çiçekçe" için çalışan profesyonel E-Ticaret İçerik Uzmanı ve SEO Direktörüsün.

Aşağıdaki çiçek ürün bilgilerine göre bu ürüne özel, %100 özgün, duygusal, ikna edici ve arama motorlarında üst sıralara çıkaracak Türkçe Ürün Açıklaması ve SEO Meta Etiketleri oluştur:

Ürün Adı: "${title}"
Kategori: "${category}"
Tasarım Şekli: "${designTypes.join(", ") || "Özel Tasarım Aranjman"}"
Kime Uygun: "${recipients.join(", ") || "Sevdiklerinize"}"
Gönderim Amacı: "${purposes.join(", ") || "Tebrik & Kutlama"}"
Çiçek Renkleri: "${colors.join(", ") || "Canlı Renkler"}"
Fiyat: "${price}"

AÇIKLAMA YAZIM KURALLARI:
1. Ürün açıklaması 3 paragraftan oluşmalıdır.
2. 1. Paragraf: Çiçeğin görkemini, taze canlı dokusunu ve duygusal mesajını vurgulayan etkileyici giriş.
3. 2. Paragraf: Çiçeğin tasarım detayları, aranjmanda kullanılan taze çiçekler, sunum/ambalaj kalitesi ve teslimat güvencesi.
4. 3. Paragraf: Çiçeğin daha uzun süre canlı kalması için kısa bakım tavsiyesi ve kurşun maddeler (%100 Taze Canlı Çiçek Garantisi, Özel Tasarım Kart Notu, Hızlı Kurye İle Aynı Gün Teslimat).

Lütfen yanıtı SADECE aşağıdaki JSON formatında döndür (başka açıklama veya markdown ekleme):
{
  "description": "Ürüne özel detaylı 3 paragraflık ürün açıklaması metni",
  "seoTitle": "Google arama sonuçlarında yüksek tıklama alacak ilgi çekici SEO başlığı (En fazla 60 karakter)",
  "seoDesc": "Google arama sonuçlarında müşteri çekecek zengin meta açıklaması metni (En fazla 155 karakter)",
  "seoKeywords": "ürünle birebir alakalı virgülle ayrılmış 6-8 adet arama anahtar kelimesi"
}`;

      const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest"];
      let generatedText = "";

      for (const modelName of modelsToTry) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
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
            generatedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (generatedText) break;
          }
        } catch (e) {}
      }

      if (generatedText) {
        try {
          const parsed = JSON.parse(generatedText);
          return NextResponse.json({
            success: true,
            description: parsed.description || "",
            seoTitle: parsed.seoTitle || "",
            seoDesc: parsed.seoDesc || "",
            seoKeywords: parsed.seoKeywords || "",
            source: "gemini_ai"
          });
        } catch (e) {}
      }
    }

    // Fallback to internal generator if Gemini API key is unavailable or fails
    const fallbackSeo = generateSeoDetails({
      title,
      category,
      designTypes,
      recipients,
      purposes,
      colors,
      price
    });

    return NextResponse.json({
      success: true,
      description: fallbackSeo.description,
      seoTitle: fallbackSeo.seoTitle,
      seoDesc: fallbackSeo.seoDesc,
      seoKeywords: fallbackSeo.seoKeywords,
      source: "fallback_generator"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Ürün içeriği oluşturulurken bir hata meydana geldi: " + (error?.message || "Hata") },
      { status: 500 }
    );
  }
}
