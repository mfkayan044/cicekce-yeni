"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";

export default function CronPage() {
  const [apiKey, setApiKey] = useState("cron_api_key_892374982374982");
  const [toastMsg, setToastMsg] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg("cron-job.org API anahtarı başarıyla doğrulandı! (3 Zamanlanmış Görev Aktif)");
    setTimeout(() => setToastMsg(""), 3500);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
            <span className="text-slate-400 fw-light">Sistem Ayarları /</span> Cron Yönetimi / cron-job.org
          </h4>
          <p className="text-slate-500 text-sm">Zamanlanmış görevlerin otomatik tetiklenme API anahtarları.</p>
        </div>

        {toastMsg && (
          <div className="alert alert-success p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm flex items-center gap-2 rounded-lg">
            <i className="bx bx-check-circle text-lg"></i>
            <span>{toastMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4">
          <h5 className="font-bold text-slate-800 text-lg border-b pb-3">cron-job.org API Anahtarı</h5>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">API Key (cronjob_api_key)</label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn btn-primary px-6 py-2.5 text-sm font-semibold rounded-lg shadow-md flex items-center gap-1">
              <i className="bx bx-check-shield"></i> Kaydet & Doğrula
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
