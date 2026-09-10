"use client";

import { useState, useEffect } from "react";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Clock, Play, Save, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function CronPage() {
  const [apiKey, setApiKey] = useState("cron_api_key_892374982374982");
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const fetchCronData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cron");
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) setApiKey(data.apiKey);
        if (Array.isArray(data.jobs)) setJobs(data.jobs);
        if (Array.isArray(data.logs)) setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCronData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, jobs, logs }),
      });
      if (res.ok) {
        setToastMsg("✅ cron-job.org API anahtarı ve zamanlanmış görev ayarları kaydedildi!");
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Kaydetme hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleJob = (id: string) => {
    const updated = jobs.map((j) => (j.id === id ? { ...j, status: !j.status } : j));
    setJobs(updated);
  };

  const handleTriggerNow = async (jobId: string, jobName: string) => {
    setTriggeringId(jobId);
    try {
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger", jobId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cronData) {
          if (Array.isArray(data.cronData.jobs)) setJobs(data.cronData.jobs);
          if (Array.isArray(data.cronData.logs)) setLogs(data.cronData.logs);
        }
        setToastMsg(`⚡ "${jobName}" zamanlanmış görevi başarıyla tetiklendi ve çalıştırıldı!`);
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (e) {
      alert("Tetikleme hatası.");
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="layout-wrapper layout-content-navbar min-h-screen bg-slate-50 flex">
      <AdminSidebar />

      <div className="layout-page flex-1 flex flex-col min-w-0">
        <AdminNavbar />

        <div className="content-wrapper p-6 flex-1 max-w-6xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
                <Clock className="w-6 h-6 text-amber-900" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">Cron Yönetimi & Zamanlanmış Görevler</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Otomatik e-posta, sepet hatırlatma ve kur güncelleme görevlerini zamanlayın ve manuel tetikleyin
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-5 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition flex items-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Kaydediliyor..." : "Ayarları Kaydet"}</span>
            </button>
          </div>

          {toastMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs font-extrabold text-slate-400">Yükleniyor...</div>
          ) : (
            <div className="space-y-6">
              {/* API Key Box */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-900" />
                  <span>cron-job.org / Dış Servis API Anahtarı</span>
                </h2>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">API Key (cronjob_api_key)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
              </div>

              {/* Scheduled Jobs Grid */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-900" />
                  <span>Aktif Zamanlanmış Görevler ({jobs.length})</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {jobs.map((j) => (
                    <div key={j.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono">
                            {j.cronExpr || "* * * * *"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleJob(j.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition ${
                              j.status
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {j.status ? "🟢 Aktif" : "⚪ Pasif"}
                          </button>
                        </div>

                        <h3 className="text-xs font-extrabold text-slate-900">{j.name}</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{j.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 space-y-2">
                        <div className="text-[10px] text-slate-400 font-medium">
                          Son Çalışma: <span className="font-mono font-bold text-slate-700">{j.lastRun || "Henüz çalıştırılmadı"}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTriggerNow(j.id, j.name)}
                          disabled={triggeringId === j.id}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{triggeringId === j.id ? "Çalıştırılıyor..." : "Şimdi Tetikle"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Logs Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Son Tetiklenme ve Çalışma Kayıtları</span>
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Tarih</th>
                        <th className="px-4 py-3">Görev Adı</th>
                        <th className="px-4 py-3">Çalışma Süresi</th>
                        <th className="px-4 py-3 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-mono text-slate-500">{l.date}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{l.jobName}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{l.duration}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
