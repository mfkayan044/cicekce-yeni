import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

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
            mimeType = matches[1];
            fileBuffer = Buffer.from(matches[2], "base64");
            fileExt = mimeType.split("/")[1] || "jpg";
          }
        } else {
          fileBuffer = Buffer.from(rawStr, "base64");
        }
      }
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (file) {
        mimeType = file.type || "image/jpeg";
        originalName = file.name || "photo.jpg";
        fileExt = originalName.split(".").pop() || "jpg";
        
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: "Dosya boyutu çok büyük. Maksimum 10 MB yüklenebilir." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "Görsel dosyası veya verisi bulunamadı." }, { status: 400 });
    }

    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

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

    // 2. LOCAL & SERVERLESS FALLBACK
    ensureUploadsDir();
    const localFilePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(localFilePath, fileBuffer);
    const localUrl = `/uploads/${uniqueFileName}`;

    return NextResponse.json({
      url: localUrl,
      name: uniqueFileName,
      storage: "local-persistent",
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Görsel yüklenirken hata oluştu: " + (error?.message || "") },
      { status: 500 }
    );
  }
}
