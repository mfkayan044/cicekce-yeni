import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("KRİTİK HATA: DATABASE_URL ortam değişkeni tanımlanmamış. Lütfen .env.local dosyasını kontrol edin.");
}

export const sql = neon(DATABASE_URL);
