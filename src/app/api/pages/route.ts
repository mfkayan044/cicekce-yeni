import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(pagesData: any) {
  try {
    const db = readDb();
    db.pages = pagesData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {
    console.error("writeDbAndTs Error:", e);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    // 1. Fetch from Supabase site_settings 'pages'
    const { data: dbData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "pages")
      .single();

    const pages = (dbData && dbData.value) ? dbData.value : (readDb().pages || {});

    if (slug) {
      // Clean slug by removing leading slash
      const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;
      return NextResponse.json(pages[cleanSlug] || { title: "", content: "" });
    }

    return NextResponse.json(pages);
  } catch (error) {
    const db = readDb();
    return NextResponse.json(db.pages || {});
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { slug, title, content } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;

    // Fetch existing pages
    const db = readDb();
    const existingPages = db.pages || {};
    existingPages[cleanSlug] = { title, content, updated_at: new Date().toISOString() };

    // 1. Save to Supabase
    await supabase
      .from("site_settings")
      .upsert({ id: "pages", value: existingPages, updated_at: new Date().toISOString() });

    // 2. Update local db.json and initial-db.ts
    writeDbAndTs(existingPages);

    return NextResponse.json({ success: true, page: existingPages[cleanSlug] });
  } catch (error) {
    console.error("PUT /api/pages Error:", error);
    return NextResponse.json({ error: "Failed to update page content" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;

    const db = readDb();
    const existingPages = db.pages || {};
    delete existingPages[cleanSlug];

    // 1. Save to Supabase
    await supabase
      .from("site_settings")
      .upsert({ id: "pages", value: existingPages, updated_at: new Date().toISOString() });

    // 2. Update local db.json and initial-db.ts
    writeDbAndTs(existingPages);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pages Error:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
