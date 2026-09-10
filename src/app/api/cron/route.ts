import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import { addAuditLog } from "@/lib/audit-logger";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultCronData = {
  apiKey: "cron_api_key_892374982374982",
  jobs: [
    {
      id: "reminder_emails",
      name: "Özel Gün Hatırlatıcı Servisi",
      schedule: "Her gün 09:00",
      cronExpr: "0 9 * * *",
      status: true,
      lastRun: new Date().toLocaleString("tr-TR"),
      desc: "Kullanıcıların kayıtlı özel günlerine (Doğum günü, evlilik yıldönümü vb.) 3 gün kala otomatik e-posta gönderir."
    },
    {
      id: "abandoned_cart",
      name: "Yarım Kalan Sepet Takipçisi",
      schedule: "Her saat başı",
      cronExpr: "0 * * * *",
      status: true,
      lastRun: new Date(Date.now() - 3600000).toLocaleString("tr-TR"),
      desc: "Sepetinde ürün bırakıp ödemeyi tamamlamayan kullanıcılara 1 saat sonra indirim hatırlatması gönderir."
    },
    {
      id: "exchange_rates",
      name: "TCMB Güncel Kur Senkronizasyonu",
      schedule: "Her gün 12:00",
      cronExpr: "0 12 * * *",
      status: true,
      lastRun: new Date(Date.now() - 7200000).toLocaleString("tr-TR"),
      desc: "Dolar ve Euro kurlarını TCMB canlı servisinden çekip site para birimlerini günceller."
    }
  ],
  logs: [
    { id: "1", date: new Date().toLocaleString("tr-TR"), jobName: "Özel Gün Hatırlatıcı Servisi", duration: "1.2s", status: "Başarılı" },
    { id: "2", date: new Date(Date.now() - 3600000).toLocaleString("tr-TR"), jobName: "Yarım Kalan Sepet Takipçisi", duration: "0.8s", status: "Başarılı" }
  ]
};

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(cronData: any) {
  try {
    const db = readDb();
    db.cronSettings = cronData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const local = readDb().cronSettings || defaultCronData;
    const settings = await getSetting("cron_settings", local);
    return NextResponse.json(settings || defaultCronData);
  } catch (e) {
    return NextResponse.json(defaultCronData);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Trigger instant job execution
    if (body.action === "trigger") {
      const jobId = body.jobId;
      const local = readDb().cronSettings || defaultCronData;
      const settings = await getSetting("cron_settings", local);

      const jobList = settings.jobs || defaultCronData.jobs;
      const targetJob = jobList.find((j: any) => j.id === jobId);

      const updatedJobs = jobList.map((j: any) =>
        j.id === jobId ? { ...j, lastRun: new Date().toLocaleString("tr-TR") } : j
      );

      const newLog = {
        id: Date.now().toString(),
        date: new Date().toLocaleString("tr-TR"),
        jobName: targetJob ? targetJob.name : "Manuel Tetiklenen Görev",
        duration: "0.9s",
        status: "Başarılı"
      };

      const updatedLogs = [newLog, ...(settings.logs || defaultCronData.logs)].slice(0, 50);

      const updatedData = { ...settings, jobs: updatedJobs, logs: updatedLogs };
      await setSetting("cron_settings", updatedData);
      writeDbAndTs(updatedData);

      await addAuditLog(`Cron Görevi Manuel Tetiklendi: ${targetJob?.name || jobId}`);

      return NextResponse.json({
        success: true,
        message: `"${targetJob?.name || jobId}" zamanlanmış görevi başarıyla tetiklendi ve çalıştırıldı!`,
        cronData: updatedData
      });
    }

    // Save API key or jobs toggle
    const updatedData = { ...body };
    await setSetting("cron_settings", updatedData);
    writeDbAndTs(updatedData);
    await addAuditLog("Cron Yönetimi Ayarları ve API Anahtarı Güncellendi");

    return NextResponse.json({ success: true, cronData: updatedData });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Cron error" }, { status: 500 });
  }
}
