import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultHeroData = {
  sliders: [
    {
      id: 1,
      title: "35 Kırmızı Gül Buketi",
      price: "5.500 ₺",
      discountBadge: "%10 İndirim",
      image: "https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp",
      link: "/urun/35-kirmizi-gul-buketi-13981"
    },
    {
      id: 2,
      title: "Beyaz Papatya & Gül Vazo Aranjmanı",
      price: "2.850 ₺",
      discountBadge: "Çok Satan",
      image: "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-beyaz-bicme-179-v2.webp",
      link: "/urun/7-kirmizi-gul-ve-beyaz-bicme-179"
    },
    {
      id: 3,
      title: "Lüks Lilyum & Papatya Demeti",
      price: "3.200 ₺",
      discountBadge: "Aynı Gün Teslimat",
      image: "https://demo.procicek.com.tr/urunler/35-beyaz-gerbera-buketi-119-v2.webp",
      link: "/urun/35-beyaz-gerbera-buketi-119"
    }
  ],
  promoCards: [
    { title: "Yıl Dönümü Çiçekleri", image: "https://demo.procicek.com.tr/resimler/promo-20260824112940-CJLvi.webp?v=1787560180", link: "/kategori/yil-donumu" },
    { title: "Geçmiş Olsun Çiçekleri", image: "https://demo.procicek.com.tr/resimler/promo-20260824113311-8oT1K.webp?v=1787560391", link: "/kategori/gecmis-olsun" },
    { title: "Mevsim Çiçekleri", image: "https://demo.procicek.com.tr/resimler/promo-20260824113531-Q7o8C.webp?v=1787560531", link: "/kategori/mevsim-cicekleri" },
    { title: "Saksı Çiçekleri", image: "https://demo.procicek.com.tr/resimler/promo-20260824113750-hZD2C.webp?v=1787560670", link: "/kategori/saksi-cicekleri" }
  ],
  horizontalBanners: [
    { title: "AÇILIŞ ÇİÇEKLERİ", image: "https://demo.procicek.com.tr/resimler/banner-acilis.webp?v=1787402483", link: "/kategori/acilis-cicekleri" },
    { title: "EV HEDİYESİ ÇİÇEKLERİ", image: "https://demo.procicek.com.tr/resimler/banner-ev-hediyesi.webp?v=1787402483", link: "/kategori/ev-hediyesi" },
    { title: "ÖZÜR ÇİÇEKLERİ", image: "https://demo.procicek.com.tr/resimler/banner-ozur.webp?v=1787402484", link: "/kategori/ozur-cicekleri" }
  ]
};

function getLocalHero() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      if (db.hero && db.hero.sliders) return db.hero;
    }
  } catch (e) {}
  return defaultHeroData;
}

function saveLocalHero(data: any) {
  try {
    let db: any = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
    db.hero = data;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", "hero").single();
    if (!error && data && data.value) {
      return NextResponse.json(data.value);
    }
  } catch (error) {}

  const localData = getLocalHero();
  return NextResponse.json(localData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    saveLocalHero(body);

    try {
      await supabase.from("site_settings").upsert({ id: "hero", value: body }, { onConflict: "id" });
    } catch (e) {}

    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save hero settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalHero(body);

    try {
      await supabase.from("site_settings").upsert({ id: "hero", value: body }, { onConflict: "id" });
    } catch (e) {}

    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update hero settings" }, { status: 500 });
  }
}
