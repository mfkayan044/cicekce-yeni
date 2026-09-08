import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultSeoData = {'h1Title': 'Çiçekçe ile Aynı Gün Taze Çiçek Siparişi', 'h1Subtitle': 'Sizler için özenle seçtiğimiz taze çiçekler, buketler ve aranjmanlar; hepsi aynı gün adrese teslimata hazır.', 'metaTitle': 'Çiçekçe | Aynı Gün Taze Çiçek Siparişi & Çiçek Gönder', 'metaDescription': "Türkiye'nin ve Antalya'nın en taze çiçek sipariş platformu Çiçekçe ile sevdiklerinize aynı gün teslimatlı kırmızı güller, lilyumlar ve aranjmanlar gönderin.", 'keywords': 'çiçek siparişi, taze çiçek gönder, antalya çiçekçi, gül buketi, aynı gün çiçek teslimatı', 'seoArticle': 'Çiçekçe, en özel anlarınızı taze ve canlı çiçeklerle taçlandırmak için 7/24 hizmet veren online çiçek sipariş platformudur. Kırmızı gül buketlerinden beyaz papatya aranjmanlarına, şık saksı çiçeklerinden açılış çelenklerine kadar geniş ürün yelpazemizle aynı gün adrese hızlı kurye teslimatı sağlıyoruz.'};

function getLocalSeo() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      if (db.homeSeo) return db.homeSeo;
    }
  } catch (e) {}
  return defaultSeoData;
}

function saveLocalSeo(data: any) {
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.homeSeo = data;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET() {
  const seoData = await getSetting("home_seo", getLocalSeo());
  return NextResponse.json(seoData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    saveLocalSeo(body);
    await setSetting("home_seo", body);
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save SEO settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalSeo(body);
    await setSetting("home_seo", body);
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update SEO settings" }, { status: 500 });
  }
}
