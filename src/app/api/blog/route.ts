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

function writeDbAndTs(blogs: any[]) {
  try {
    const db = readDb();
    db.blogs = blogs;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    // 1. Fetch from Supabase site_settings 'blogs'
    const { data: dbData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "blogs")
      .single();

    const blogs: any[] = (dbData && Array.isArray(dbData.value)) ? dbData.value : (readDb().blogs || []);

    if (slug) {
      const found = blogs.find((b: any) => b.slug === slug || b.id === slug);
      return NextResponse.json(found || null);
    }

    if (id) {
      const found = blogs.find((b: any) => b.id === id);
      return NextResponse.json(found || null);
    }

    return NextResponse.json(blogs);
  } catch (e) {
    const db = readDb();
    return NextResponse.json(db.blogs || []);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    const blogs: any[] = db.blogs || [];

    const newBlog = {
      id: "b_" + Date.now(),
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      title: body.title,
      summary: body.summary || "",
      content: body.content || "",
      image: body.image || "https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp",
      category: body.category || "Çiçek Rehberi",
      date: new Date().toLocaleDateString("tr-TR"),
      views: 1,
      active: body.active !== false
    };

    blogs.unshift(newBlog);

    await supabase
      .from("site_settings")
      .upsert({ id: "blogs", value: blogs, updated_at: new Date().toISOString() });

    writeDbAndTs(blogs);

    return NextResponse.json({ success: true, blog: newBlog });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    let blogs: any[] = db.blogs || [];

    blogs = blogs.map((b: any) => {
      if (b.id === body.id || b.slug === body.slug) {
        return { ...b, ...body };
      }
      return b;
    });

    await supabase
      .from("site_settings")
      .upsert({ id: "blogs", value: blogs, updated_at: new Date().toISOString() });

    writeDbAndTs(blogs);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const db = readDb();
    let blogs: any[] = db.blogs || [];

    blogs = blogs.filter((b: any) => b.id !== id);

    await supabase
      .from("site_settings")
      .upsert({ id: "blogs", value: blogs, updated_at: new Date().toISOString() });

    writeDbAndTs(blogs);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
