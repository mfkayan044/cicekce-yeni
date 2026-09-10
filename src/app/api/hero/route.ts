import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultHeroData = {
  sliders: [
    {
      id: 2,
      link: "/kategori/dogum-gunu",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788948885624-1218a0a4.jpg",
      price: "",
      title: "",
      discountBadge: "%10 İndirim"
    },
    {
      id: 3,
      link: "/kategori/buketler",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788948865460-ca821060.jpg",
      price: "",
      title: "",
      discountBadge: "%10 İndirim"
    },
    {
      id: 4,
      link: "/kategori/saksi-cicekleri",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788948897534-83a66d77.jpg",
      price: "",
      title: "",
      discountBadge: "%10 İndirim"
    },
    {
      id: 4,
      link: "/kategori/buketler",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788948837837-757aa67c.jpg",
      price: "",
      title: "",
      discountBadge: "%10 İndirim"
    }
  ],
  promoCards: [
    {
      link: "kategori/yil-donumu",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788961280164-b8c428fd.jpg",
      title: "Yıl Dönümü Çiçekleri"
    },
    {
      link: "kategori/gecmis-olsun",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788961303917-9a7487c1.jpg",
      title: "Geçmiş Olsun Çiçekleri"
    },
    {
      link: "kategori/mevsim-cicekleri",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788961308818-0bb1fb08.jpg",
      title: "Mevsim Çiçekleri"
    },
    {
      link: "kategori/saksi-cicekleri",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788961314681-7fbcdcc0.jpg",
      title: "Saksı Çiçekleri"
    }
  ],
  horizontalBanners: [
    {
      link: "kategori/acilis-cicekleri",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788964240598-b667d32d.jpg",
      title: "AÇILIŞ ÖZEL"
    },
    {
      link: "kategori/sevgiliye-ozel",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788964234212-090e22c6.jpg",
      title: "SEVGİLİYE ÖZEL"
    },
    {
      link: "kategori/ozur-cicekleri",
      image: "https://cksauvgjodsduhxtnqwm.supabase.co/storage/v1/object/public/cicekce-uploads/1788964246531-93789c90.jpg",
      title: "ÖZÜR ÇİÇEKLERİ ÖZEL"
    }
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
