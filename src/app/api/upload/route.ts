import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit

const uploadsDir = path.join(process.cwd(), "public", "uploads");

function ensureUploadsDir() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {}
}

export async function POST(req: Request) {
  try {
    let fileBuffer: Buffer | null = null;
    let mimeType = "image/jpeg";
    let originalName = "photo.jpg";
    let fileExt = "jpg";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const jsonBody = await req.json();
      if (jsonBody.base64 || jsonBody.image) {
        const rawStr = jsonBody.base64 || jsonBody.image;
        if (rawStr.startsWith("data:")) {
          const matches = rawStr.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1].toLowerCase();
            fileBuffer = Buffer.from(matches[2], "base64");
            fileExt = mimeType.split("/")[1] || "jpg";
            if (fileExt === "jpeg") fileExt = "jpg";
          }
        } else {
          fileBuffer = Buffer.from(rawStr, "base64");
        }
      }
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (file) {
        mimeType = (file.type || "image/jpeg").toLowerCase();
        originalName = file.name || "photo.jpg";
        fileExt = (originalName.split(".").pop() || "jpg").toLowerCase();
        
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "Güvenlik Uyarısı: Dosya boyutu çok büyük. Maksimum 5 MB yüklenebilir." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType) || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: "Güvenlik Uyarısı: Sadece JPG, PNG veya WEBP formatında görsel dosyaları yüklenebilir." },
        { status: 400 }
      );
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "Görsel dosyası veya verisi bulunamadı." }, { status: 400 });
    }

    const uniqueFileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

    // 1. SUPABASE STORAGE BUCKET UPLOAD ('cicekce-uploads')
    try {
      const { data, error } = await supabase.storage
        .from("cicekce-uploads")
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from("cicekce-uploads")
          .getPublicUrl(uniqueFileName);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({
            url: publicUrlData.publicUrl,
            name: uniqueFileName,
            storage: "supabase-cloud",
          });
        }
      }
    } catch (supErr) {
      console.warn("Supabase Storage bucket notice:", supErr);
    }

    // 2. SERVERLESS DATA URL FALLBACK (Guarantees image renders 100% reliably everywhere on Vercel)
    const base64DataUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

    return NextResponse.json({
      url: base64DataUrl,
      name: uniqueFileName,
      storage: "base64-data-url",
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Görsel yüklenirken hata oluştu: " + (error?.message || "") },
      { status: 500 }
    );
  }
}
