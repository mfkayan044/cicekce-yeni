import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Geçersiz dosya formatı. Sadece JPG, PNG, WEBP ve GIF dosyaları yüklenebilir." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu çok büyük. Maksimum 5 MB yüklenebilir." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 1. Attempt upload to Supabase Storage bucket 'cicekce-uploads'
    try {
      const { data, error } = await supabase.storage
        .from("cicekce-uploads")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from("cicekce-uploads")
          .getPublicUrl(fileName);

        return NextResponse.json({
          url: publicUrlData.publicUrl,
          name: file.name,
          storage: "supabase",
        });
      }
    } catch (supabaseErr) {
      // Supabase storage bucket might not exist yet or have RLS policy
    }

    // 2. Safe Fallback: Base64 Data URL (guaranteed to render anywhere across serverless / static without local disk dependency)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    return NextResponse.json({
      url: base64,
      name: file.name,
      storage: "inline",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Görsel yüklenirken bir hata oluştu: " + (error?.message || "") },
      { status: 500 }
    );
  }
}
