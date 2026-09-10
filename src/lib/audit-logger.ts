import { getSetting, setSetting } from "@/lib/settings-helper";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

export interface AuditLog {
  id: string;
  date: string;
  user: string;
  action: string;
  ip: string;
  status: "Başarılı" | "Hata" | "Bilgi";
}

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(logsData: any[]) {
  try {
    const db = readDb();
    db.auditLogs = logsData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

const defaultLogs: AuditLog[] = [
  { id: "1", date: new Date().toLocaleString("tr-TR"), user: "Sistem Yöneticisi", action: "Yönetici Paneline Giriş Yapıldı", ip: "127.0.0.1", status: "Başarılı" },
  { id: "2", date: new Date(Date.now() - 3600000).toLocaleString("tr-TR"), user: "Sistem Yöneticisi", action: "Ürün Fiyatları Güncellendi", ip: "127.0.0.1", status: "Başarılı" },
  { id: "3", date: new Date(Date.now() - 7200000).toLocaleString("tr-TR"), user: "Sistem Yöneticisi", action: "Çiçek Bakım Rehberi İçeriği Düzenlendi", ip: "127.0.0.1", status: "Başarılı" },
];

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const local = readDb().auditLogs || defaultLogs;
    const logs = await getSetting("audit_logs", local);
    return Array.isArray(logs) ? logs : defaultLogs;
  } catch (e) {
    return defaultLogs;
  }
}

export async function addAuditLog(action: string, user: string = "Sistem Yöneticisi", ip: string = "127.0.0.1", status: "Başarılı" | "Hata" | "Bilgi" = "Başarılı") {
  try {
    const existing = await getAuditLogs();
    const newLog: AuditLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("tr-TR"),
      user,
      action,
      ip,
      status
    };
    const updated = [newLog, ...existing].slice(0, 100); // Keep last 100 logs
    await setSetting("audit_logs", updated);
    writeDbAndTs(updated);
    return newLog;
  } catch (e) {
    console.error("Audit Log Add Error:", e);
  }
}
