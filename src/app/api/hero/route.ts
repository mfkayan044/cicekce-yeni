import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultHeroData = {
  sliders: [
    {
      id: 1,
      title: "30 Dakikada Hızlı Teslimat",
      price: "",
      discountBadge: "Hızlı Teslimat",
      image: "/images/slider/banner1_hizli_teslimat.jpg",
      link: "/kategori/guller"
    },
    {
      id: 2,
      title: "Sevgiliye Özel Premium Gül Buketleri",
      price: "",
      discountBadge: "Özel Tasarım",
      image: "/images/slider/banner2_ask_buketleri.jpg",
      link: "/kategori/sevgililer-icin"
    },
    {
      id: 3,
      title: "Doğum Gününe Özel Unutulmaz Sürprizler",
      price: "",
      discountBadge: "Doğum Günü",
      image: "/images/slider/banner3_dogum_gunu.jpg",
      link: "/kategori/dogum-gunu"
    },
    {
      id: 4,
      title: "Evinize Doğal Zarafet Orkideler",
      price: "",
      discountBadge: "Saksı Çiçeği",
      image: "/images/slider/banner4_orkide.jpg",
      link: "/kategori/saksi-cicekleri"
    }
  ],
  promoCards: [
    { title: "Geçmiş Olsun Çiçekleri", image: "/images/promo/gecmis_olsun.jpg", link: "/kategori/gecmis-olsun" },
    { title: "Yıl Dönümü Çiçekleri", image: "/images/promo/yil_donumu.jpg", link: "/kategori/yil-donumu" },
    { title: "Mevsim Çiçekleri", image: "/images/promo/mevsim_cicekleri.jpg", link: "/kategori/mevsim-cicekleri" },
    { title: "Saksı Çiçekleri", image: "/images/promo/saksi_cicekleri.jpg", link: "/kategori/saksi-cicekleri" }
  ],
  horizontalBanners: [
    { title: "AÇILIŞ & KUTLAMA ÇİÇEKLERİ", image: "/images/banners/acilis.jpg", link: "/kategori/acilis-cicekleri" },
    { title: "EV HEDİYESİ ÇİÇEKLERİ", image: "/images/banners/ev_hediyesi.jpg", link: "/kategori/ev-hediyesi" },
    { title: "ÖZÜR & BARIŞMA ÇİÇEKLERİ", image: "/images/banners/ozur.jpg", link: "/kategori/ozur-cicekleri" }
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

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  const heroData = await getSetting("hero", getLocalHero());
  return NextResponse.json(heroData, { headers: noCacheHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    saveLocalHero(body);
    await setSetting("hero", body);
    return NextResponse.json(body, { status: 201, headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save hero settings" }, { status: 500, headers: noCacheHeaders });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalHero(body);
    await setSetting("hero", body);
    return NextResponse.json(body, { headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update hero settings" }, { status: 500, headers: noCacheHeaders });
  }
}
