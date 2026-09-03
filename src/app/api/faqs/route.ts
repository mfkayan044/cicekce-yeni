import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultFaqs = [{'id': '1', 'q': 'Aynı gün adrese çiçek teslimatı yapıyor musunuz?', 'a': "Evet. Saat 18:00'e kadar verilen siparişlerde aynı gün özel kuryelerimiz ile adrese teslimat yapıyoruz. Sipariş sırasında istediğiniz teslimat tarih ve saat aralığını kendiniz seçebilirsiniz."}, {'id': '2', 'q': 'Çiçeklerin tazeliği ve görsel birebir aynı garanti mi?', 'a': 'Kesinlikle. Tüm çiçeklerimiz siparişiniz sonrası taze olarak hazırlanır ve %100 memnuniyet garantisiyle gönderilir. Kuryeye verilmeden önce canlı fotoğraf onayı gönderiyoruz.'}, {'id': '3', 'q': 'Hangi ödeme yöntemlerini kullanabilirim?', 'a': 'Kredi kartı, banka kartı ve Banka Havalesi / EFT yöntemleri ile güvenle ödeme yapabilirsiniz. Dilerseniz WhatsApp üzerinden de hızlı sipariş oluşturabilirsiniz.'}, {'id': '4', 'q': 'Sipariş durumumu nasıl takip edebilirim?', 'a': "Siparişinizi verdikten sonra ana sayfadaki 'Sipariş Takip' butonuna tıklayarak sipariş numaranız ve telefon numaranız ile anlık kurye durumunu öğrenebilirsiniz."}];

function getLocalFaqs() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      if (db.faqs && Array.isArray(db.faqs)) return db.faqs;
    }
  } catch (e) {}
  return defaultFaqs;
}

function saveLocalFaqs(data: any) {
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.faqs = data;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", "faqs").single();
    if (!error && data && data.value) {
      return NextResponse.json(data.value);
    }
  } catch (error) {}

  const localData = getLocalFaqs();
  return NextResponse.json(localData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    saveLocalFaqs(body);
    try {
      await supabase.from("site_settings").upsert({ id: "faqs", value: body }, { onConflict: "id" });
    } catch (e) {}
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save FAQs" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalFaqs(body);
    try {
      await supabase.from("site_settings").upsert({ id: "faqs", value: body }, { onConflict: "id" });
    } catch (e) {}
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update FAQs" }, { status: 500 });
  }
}
