import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import { initialDbData } from "@/lib/initial-db";
import fs from "fs";
import path from "path";

const localDbPath = path.join(process.cwd(), "src", "data", "db.json");

const defaultFilterOptions = initialDbData.filterOptions || {
  designTypes: [
    "Buket",
    "Kutuda",
    "Aranjman",
    "Vazoda",
    "Tasarım",
    "Ayaklı Sepet",
    "Saksı"
  ],
  recipients: [
    "Sevgiliye",
    "Anneye",
    "Eşe",
    "Arkadaşa",
    "İş Arkadaşına",
    "Kendine",
    "Öğretmene"
  ],
  purposes: [
    "Doğum Günü",
    "Yıl Dönümü",
    "Geçmiş Olsun",
    "Kutlama",
    "Özür",
    "Tebrik",
    "Sevgililer Günü",
    "Yeni Bebek",
    "Düğün Nişan",
    "Açılış"
  ],
  colors: [
    { name: "Kırmızı", dot: "🔴" },
    { name: "Beyaz", dot: "⚪" },
    { name: "Pembe", dot: "🌸" },
    { name: "Sarı", dot: "🟡" },
    { name: "Turuncu", dot: "🟠" },
    { name: "Mor", dot: "🟣" },
    { name: "Mavi", dot: "🔵" },
    { name: "Karışık", dot: "🎨" }
  ]
};

function getLocalFilterOptions() {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
      if (data.filterOptions) return data.filterOptions;
    }
  } catch (e) {}
  return defaultFilterOptions;
}

function saveLocalFilterOptions(filters: any) {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
      data.filterOptions = filters;
      fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {}
}

export async function GET() {
  try {
    const filters = await getSetting("filter_options", getLocalFilterOptions());
    return NextResponse.json(filters || defaultFilterOptions);
  } catch (error) {
    return NextResponse.json(defaultFilterOptions);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    saveLocalFilterOptions(body);
    await setSetting("filter_options", body);
    return NextResponse.json(body);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update filters" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
